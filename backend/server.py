from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import io
import csv
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta, date
import jwt
import bcrypt
import psycopg2
import psycopg2.extras

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# PostgreSQL connection
PG_DATABASE_URL = os.environ['PG_DATABASE_URL']
JWT_SECRET = os.environ['JWT_SECRET']

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def get_pg_conn():
    return psycopg2.connect(PG_DATABASE_URL)


def parse_date_params(start_date: Optional[str], end_date: Optional[str]):
    """Parse optional date range params, return (start, end) or (None, None)."""
    s = None
    e = None
    if start_date:
        try:
            s = date.fromisoformat(start_date)
        except ValueError:
            pass
    if end_date:
        try:
            e = date.fromisoformat(end_date)
        except ValueError:
            pass
    return s, e


def date_where(col: str, start: Optional[date], end: Optional[date]):
    """Build a WHERE clause fragment + params for date filtering."""
    clauses = []
    params = []
    if start:
        clauses.append(f"{col} >= %s")
        params.append(start)
    if end:
        clauses.append(f"{col} <= %s")
        params.append(end)
    if clauses:
        return " AND " + " AND ".join(clauses), params
    return "", []


# --- Models ---
class LoginRequest(BaseModel):
    email: str
    password: str

class DownloadsUpdate(BaseModel):
    count: int
    platform: Optional[str] = "android"
    note: Optional[str] = ""


# --- Auth helpers ---
def create_token(email: str) -> str:
    payload = {
        "sub": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# --- Seed admin on startup ---
@app.on_event("startup")
async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@lineup-sports.in")
    admin_password = os.environ.get("ADMIN_PASSWORD", "LineupAdmin2026!")
    existing = await db.admins.find_one({"email": admin_email})
    if not existing:
        hashed = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt()).decode()
        await db.admins.insert_one({"email": admin_email, "password_hash": hashed})
        logger.info(f"Admin user seeded: {admin_email}")
    downloads_doc = await db.settings.find_one({"key": "downloads"})
    if not downloads_doc:
        await db.settings.insert_one({
            "key": "downloads",
            "android": 0,
            "ios": 0,
            "total": 0,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "history": []
        })
        logger.info("Downloads tracker initialized")


# --- Auth endpoints ---
@api_router.post("/auth/login")
async def login(req: LoginRequest):
    admin = await db.admins.find_one({"email": req.email})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bcrypt.checkpw(req.password.encode(), admin["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(req.email)
    return {"token": token, "email": req.email}


@api_router.get("/auth/verify")
async def verify(email: str = Depends(verify_token)):
    return {"email": email, "valid": True}


# --- Analytics endpoints (all support optional date range) ---
@api_router.get("/analytics/overview")
async def get_overview(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    sd, ed = parse_date_params(start_date, end_date)
    try:
        dw, dp = date_where("created_at::date", sd, ed)

        cur.execute(f"SELECT COUNT(*) as count FROM users WHERE 1=1 {dw}", dp)
        total_users = cur.fetchone()["count"]

        cur.execute(f"SELECT COUNT(*) as count FROM sessions WHERE 1=1 {dw}", dp)
        total_sessions = cur.fetchone()["count"]

        cur.execute(f"SELECT COUNT(*) as count FROM participants WHERE 1=1 {dw}", dp)
        total_participants = cur.fetchone()["count"]

        dw_s, dp_s = date_where("created_at::date", sd, ed)
        cur.execute(f"SELECT COUNT(*) as count FROM sessions WHERE status = 'open' {dw_s}", dp_s)
        active_sessions = cur.fetchone()["count"]

        cur.execute("SELECT COUNT(*) as count FROM venues")
        total_venues = cur.fetchone()["count"]

        cur.execute(f"""
            SELECT COALESCE(AVG(participant_count), 0) as avg FROM (
                SELECT session_id, COUNT(*) as participant_count
                FROM participants WHERE status = 'active' {dw}
                GROUP BY session_id
            ) sub
        """, dp)
        avg_participants = round(float(cur.fetchone()["avg"]), 1)

        cur.execute(f"SELECT COUNT(*) as count FROM users WHERE email_verified = true {dw}", dp)
        verified_users = cur.fetchone()["count"]

        downloads_doc = await db.settings.find_one({"key": "downloads"}, {"_id": 0})
        total_downloads = downloads_doc["total"] if downloads_doc else 0

        return {
            "total_users": total_users,
            "total_sessions": total_sessions,
            "total_participants": total_participants,
            "active_sessions": active_sessions,
            "total_venues": total_venues,
            "avg_participants": avg_participants,
            "verified_users": verified_users,
            "total_downloads": total_downloads,
        }
    finally:
        cur.close()
        conn.close()


@api_router.get("/analytics/users-growth")
async def get_users_growth(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    sd, ed = parse_date_params(start_date, end_date)
    try:
        dw, dp = date_where("created_at::date", sd, ed)
        cur.execute(f"""
            SELECT DATE_TRUNC('day', created_at)::date as date, COUNT(*) as count
            FROM users WHERE 1=1 {dw}
            GROUP BY date ORDER BY date
        """, dp)
        rows = cur.fetchall()
        cumulative = []
        running = 0
        for row in rows:
            running += row["count"]
            cumulative.append({"date": row["date"].isoformat(), "users": running, "new_users": row["count"]})
        return cumulative
    finally:
        cur.close()
        conn.close()


@api_router.get("/analytics/sessions-trend")
async def get_sessions_trend(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    sd, ed = parse_date_params(start_date, end_date)
    try:
        dw, dp = date_where("created_at::date", sd, ed)
        cur.execute(f"""
            SELECT DATE_TRUNC('day', created_at)::date as date, COUNT(*) as count
            FROM sessions WHERE 1=1 {dw}
            GROUP BY date ORDER BY date
        """, dp)
        rows = cur.fetchall()
        return [{"date": r["date"].isoformat(), "sessions": r["count"]} for r in rows]
    finally:
        cur.close()
        conn.close()


@api_router.get("/analytics/sport-distribution")
async def get_sport_distribution(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    sd, ed = parse_date_params(start_date, end_date)
    try:
        dw, dp = date_where("created_at::date", sd, ed)
        cur.execute(f"""
            SELECT COALESCE(sport_type, 'Unknown') as sport, COUNT(*) as count
            FROM sessions WHERE 1=1 {dw}
            GROUP BY sport_type ORDER BY count DESC
        """, dp)
        rows = cur.fetchall()
        return [{"sport": r["sport"], "count": r["count"]} for r in rows]
    finally:
        cur.close()
        conn.close()


@api_router.get("/analytics/venue-popularity")
async def get_venue_popularity(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    sd, ed = parse_date_params(start_date, end_date)
    try:
        dw, dp = date_where("s.created_at::date", sd, ed)
        cur.execute(f"""
            SELECT v.name as venue, COUNT(s.id) as sessions_count
            FROM venues v
            LEFT JOIN sessions s ON s.venue_id = v.id {"AND 1=1 " + dw if dw else ""}
            GROUP BY v.id, v.name
            ORDER BY sessions_count DESC
        """, dp)
        rows = cur.fetchall()
        return [{"venue": r["venue"], "sessions": r["sessions_count"]} for r in rows]
    finally:
        cur.close()
        conn.close()


@api_router.get("/analytics/session-status")
async def get_session_status(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    sd, ed = parse_date_params(start_date, end_date)
    try:
        dw, dp = date_where("created_at::date", sd, ed)
        cur.execute(f"""
            SELECT status, COUNT(*) as count
            FROM sessions WHERE 1=1 {dw}
            GROUP BY status
        """, dp)
        rows = cur.fetchall()
        return [{"status": r["status"], "count": r["count"]} for r in rows]
    finally:
        cur.close()
        conn.close()


@api_router.get("/analytics/recent-sessions")
async def get_recent_sessions(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    sd, ed = parse_date_params(start_date, end_date)
    try:
        dw, dp = date_where("s.created_at::date", sd, ed)
        cur.execute(f"""
            SELECT s.id, s.title, s.sport_type, s.status, s.scheduled_date,
                   s.scheduled_time, s.scheduled_end_time, s.max_participants,
                   s.total_cost, s.location_address,
                   u.full_name as creator_name,
                   v.name as venue_name,
                   (SELECT COUNT(*) FROM participants p WHERE p.session_id = s.id AND p.status = 'active') as participant_count
            FROM sessions s
            LEFT JOIN users u ON s.creator_id = u.id
            LEFT JOIN venues v ON s.venue_id = v.id
            WHERE 1=1 {dw}
            ORDER BY s.created_at DESC
            LIMIT 20
        """, dp)
        rows = cur.fetchall()
        result = []
        for r in rows:
            result.append({
                "id": r["id"],
                "title": r["title"],
                "sport_type": r["sport_type"] or "Unknown",
                "status": r["status"],
                "scheduled_date": r["scheduled_date"].isoformat() if r["scheduled_date"] else None,
                "scheduled_time": r["scheduled_time"].isoformat() if r["scheduled_time"] else None,
                "scheduled_end_time": r["scheduled_end_time"].isoformat() if r["scheduled_end_time"] else None,
                "max_participants": r["max_participants"],
                "total_cost": float(r["total_cost"]) if r["total_cost"] else 0,
                "location_address": r["location_address"],
                "creator_name": r["creator_name"],
                "venue_name": r["venue_name"],
                "participant_count": r["participant_count"],
            })
        return result
    finally:
        cur.close()
        conn.close()


@api_router.get("/analytics/participants-stats")
async def get_participants_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    sd, ed = parse_date_params(start_date, end_date)
    try:
        dw, dp = date_where("p.created_at::date", sd, ed)
        cur.execute(f"""
            SELECT u.full_name, COUNT(p.id) as sessions_joined
            FROM participants p
            JOIN users u ON p.user_id = u.id
            WHERE p.status = 'active' {dw}
            GROUP BY u.id, u.full_name
            ORDER BY sessions_joined DESC LIMIT 10
        """, dp)
        top_users = [{"name": r["full_name"], "sessions": r["sessions_joined"]} for r in cur.fetchall()]

        dw2, dp2 = date_where("s.created_at::date", sd, ed)
        cur.execute(f"""
            SELECT s.id, s.title, s.max_participants,
                   (SELECT COUNT(*) FROM participants p WHERE p.session_id = s.id AND p.status = 'active') as filled
            FROM sessions s WHERE 1=1 {dw2}
            ORDER BY s.created_at DESC
        """, dp2)
        fill_rates = []
        for r in cur.fetchall():
            max_p = r["max_participants"] or 14
            rate = round((r["filled"] / max_p) * 100, 1)
            fill_rates.append({"title": r["title"], "filled": r["filled"], "max": max_p, "rate": rate})

        return {"top_users": top_users, "fill_rates": fill_rates}
    finally:
        cur.close()
        conn.close()


# --- CSV Export endpoints ---
@api_router.get("/export/users-csv")
async def export_users_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    sd, ed = parse_date_params(start_date, end_date)
    try:
        dw, dp = date_where("created_at::date", sd, ed)
        cur.execute(f"""
            SELECT id, full_name, email, phone_number, email_verified,
                   created_at::date as signup_date
            FROM users WHERE 1=1 {dw}
            ORDER BY created_at DESC
        """, dp)
        rows = cur.fetchall()

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["id", "full_name", "email", "phone_number", "email_verified", "signup_date"])
        writer.writeheader()
        for r in rows:
            writer.writerow({
                "id": r["id"],
                "full_name": r["full_name"],
                "email": r["email"],
                "phone_number": r["phone_number"] or "",
                "email_verified": r["email_verified"],
                "signup_date": r["signup_date"].isoformat() if r["signup_date"] else "",
            })

        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=users_export.csv"},
        )
    finally:
        cur.close()
        conn.close()


@api_router.get("/export/sessions-csv")
async def export_sessions_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    sd, ed = parse_date_params(start_date, end_date)
    try:
        dw, dp = date_where("s.created_at::date", sd, ed)
        cur.execute(f"""
            SELECT s.id, s.title, s.sport_type, s.status, s.scheduled_date,
                   s.scheduled_time, s.scheduled_end_time, s.max_participants,
                   s.total_cost, s.location_address,
                   u.full_name as creator_name,
                   v.name as venue_name,
                   (SELECT COUNT(*) FROM participants p WHERE p.session_id = s.id AND p.status = 'active') as participant_count,
                   s.created_at::date as created_date
            FROM sessions s
            LEFT JOIN users u ON s.creator_id = u.id
            LEFT JOIN venues v ON s.venue_id = v.id
            WHERE 1=1 {dw}
            ORDER BY s.created_at DESC
        """, dp)
        rows = cur.fetchall()

        output = io.StringIO()
        fields = ["id", "title", "sport_type", "status", "scheduled_date", "scheduled_time",
                   "scheduled_end_time", "max_participants", "total_cost", "location_address",
                   "creator_name", "venue_name", "participant_count", "created_date"]
        writer = csv.DictWriter(output, fieldnames=fields)
        writer.writeheader()
        for r in rows:
            writer.writerow({
                "id": r["id"],
                "title": r["title"],
                "sport_type": r["sport_type"] or "Unknown",
                "status": r["status"],
                "scheduled_date": r["scheduled_date"].isoformat() if r["scheduled_date"] else "",
                "scheduled_time": str(r["scheduled_time"]) if r["scheduled_time"] else "",
                "scheduled_end_time": str(r["scheduled_end_time"]) if r["scheduled_end_time"] else "",
                "max_participants": r["max_participants"],
                "total_cost": float(r["total_cost"]) if r["total_cost"] else 0,
                "location_address": r["location_address"],
                "creator_name": r["creator_name"] or "",
                "venue_name": r["venue_name"] or "",
                "participant_count": r["participant_count"],
                "created_date": r["created_date"].isoformat() if r["created_date"] else "",
            })

        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=sessions_export.csv"},
        )
    finally:
        cur.close()
        conn.close()


@api_router.get("/export/participants-csv")
async def export_participants_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    sd, ed = parse_date_params(start_date, end_date)
    try:
        dw, dp = date_where("p.created_at::date", sd, ed)
        cur.execute(f"""
            SELECT p.id, u.full_name as user_name, u.email as user_email,
                   s.title as session_title, s.sport_type, s.scheduled_date,
                   p.cost_per_person, p.status, p.created_at::date as joined_date
            FROM participants p
            JOIN users u ON p.user_id = u.id
            JOIN sessions s ON p.session_id = s.id
            WHERE 1=1 {dw}
            ORDER BY p.created_at DESC
        """, dp)
        rows = cur.fetchall()

        output = io.StringIO()
        fields = ["id", "user_name", "user_email", "session_title", "sport_type",
                   "scheduled_date", "cost_per_person", "status", "joined_date"]
        writer = csv.DictWriter(output, fieldnames=fields)
        writer.writeheader()
        for r in rows:
            writer.writerow({
                "id": r["id"],
                "user_name": r["user_name"],
                "user_email": r["user_email"],
                "session_title": r["session_title"],
                "sport_type": r["sport_type"] or "Unknown",
                "scheduled_date": r["scheduled_date"].isoformat() if r["scheduled_date"] else "",
                "cost_per_person": float(r["cost_per_person"]) if r["cost_per_person"] else 0,
                "status": r["status"],
                "joined_date": r["joined_date"].isoformat() if r["joined_date"] else "",
            })

        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=participants_export.csv"},
        )
    finally:
        cur.close()
        conn.close()


# --- Downloads management ---
@api_router.get("/settings/downloads")
async def get_downloads(email: str = Depends(verify_token)):
    doc = await db.settings.find_one({"key": "downloads"}, {"_id": 0})
    if not doc:
        return {"android": 0, "ios": 0, "total": 0, "history": []}
    return doc


@api_router.put("/settings/downloads")
async def update_downloads(req: DownloadsUpdate, email: str = Depends(verify_token)):
    doc = await db.settings.find_one({"key": "downloads"})
    if not doc:
        raise HTTPException(status_code=404, detail="Downloads tracker not found")

    platform = req.platform or "android"
    now = datetime.now(timezone.utc).isoformat()

    update_field = platform
    new_count = req.count

    history_entry = {
        "platform": platform,
        "count": new_count,
        "note": req.note,
        "updated_at": now,
        "updated_by": email,
    }

    await db.settings.update_one(
        {"key": "downloads"},
        {
            "$set": {
                update_field: new_count,
                "last_updated": now,
            },
            "$push": {"history": history_entry},
        }
    )

    updated = await db.settings.find_one({"key": "downloads"})
    total = (updated.get("android", 0) or 0) + (updated.get("ios", 0) or 0)
    await db.settings.update_one({"key": "downloads"}, {"$set": {"total": total}})

    return {"android": updated.get("android", 0), "ios": updated.get("ios", 0), "total": total, "last_updated": now}


@api_router.get("/")
async def root():
    return {"message": "Lineup Admin Dashboard API"}


# Include router and middleware
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
