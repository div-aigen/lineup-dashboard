from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
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
    # Seed downloads doc if not exists
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


# --- Analytics endpoints ---
@api_router.get("/analytics/overview")
async def get_overview(email: str = Depends(verify_token)):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("SELECT COUNT(*) as count FROM users")
        total_users = cur.fetchone()["count"]

        cur.execute("SELECT COUNT(*) as count FROM sessions")
        total_sessions = cur.fetchone()["count"]

        cur.execute("SELECT COUNT(*) as count FROM participants")
        total_participants = cur.fetchone()["count"]

        cur.execute("SELECT COUNT(*) as count FROM sessions WHERE status = 'open'")
        active_sessions = cur.fetchone()["count"]

        cur.execute("SELECT COUNT(*) as count FROM venues")
        total_venues = cur.fetchone()["count"]

        cur.execute("SELECT COALESCE(AVG(participant_count), 0) as avg FROM (SELECT session_id, COUNT(*) as participant_count FROM participants WHERE status = 'active' GROUP BY session_id) sub")
        avg_participants = round(float(cur.fetchone()["avg"]), 1)

        cur.execute("SELECT COUNT(*) as count FROM users WHERE email_verified = true")
        verified_users = cur.fetchone()["count"]

        # Downloads from MongoDB
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
async def get_users_growth(email: str = Depends(verify_token)):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("""
            SELECT DATE_TRUNC('day', created_at)::date as date, COUNT(*) as count
            FROM users
            GROUP BY date
            ORDER BY date
        """)
        rows = cur.fetchall()
        # Cumulative
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
async def get_sessions_trend(email: str = Depends(verify_token)):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("""
            SELECT DATE_TRUNC('day', created_at)::date as date, COUNT(*) as count
            FROM sessions
            GROUP BY date
            ORDER BY date
        """)
        rows = cur.fetchall()
        return [{"date": r["date"].isoformat(), "sessions": r["count"]} for r in rows]
    finally:
        cur.close()
        conn.close()


@api_router.get("/analytics/sport-distribution")
async def get_sport_distribution(email: str = Depends(verify_token)):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("""
            SELECT COALESCE(sport_type, 'Unknown') as sport, COUNT(*) as count
            FROM sessions
            GROUP BY sport_type
            ORDER BY count DESC
        """)
        rows = cur.fetchall()
        return [{"sport": r["sport"], "count": r["count"]} for r in rows]
    finally:
        cur.close()
        conn.close()


@api_router.get("/analytics/venue-popularity")
async def get_venue_popularity(email: str = Depends(verify_token)):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("""
            SELECT v.name as venue, COUNT(s.id) as sessions_count
            FROM venues v
            LEFT JOIN sessions s ON s.venue_id = v.id
            GROUP BY v.id, v.name
            ORDER BY sessions_count DESC
        """)
        rows = cur.fetchall()
        return [{"venue": r["venue"], "sessions": r["sessions_count"]} for r in rows]
    finally:
        cur.close()
        conn.close()


@api_router.get("/analytics/session-status")
async def get_session_status(email: str = Depends(verify_token)):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("""
            SELECT status, COUNT(*) as count
            FROM sessions
            GROUP BY status
        """)
        rows = cur.fetchall()
        return [{"status": r["status"], "count": r["count"]} for r in rows]
    finally:
        cur.close()
        conn.close()


@api_router.get("/analytics/recent-sessions")
async def get_recent_sessions(email: str = Depends(verify_token)):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("""
            SELECT s.id, s.title, s.sport_type, s.status, s.scheduled_date,
                   s.scheduled_time, s.scheduled_end_time, s.max_participants,
                   s.total_cost, s.location_address,
                   u.full_name as creator_name,
                   v.name as venue_name,
                   (SELECT COUNT(*) FROM participants p WHERE p.session_id = s.id AND p.status = 'active') as participant_count
            FROM sessions s
            LEFT JOIN users u ON s.creator_id = u.id
            LEFT JOIN venues v ON s.venue_id = v.id
            ORDER BY s.created_at DESC
            LIMIT 20
        """)
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
async def get_participants_stats(email: str = Depends(verify_token)):
    conn = get_pg_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        # Top users by participation
        cur.execute("""
            SELECT u.full_name, COUNT(p.id) as sessions_joined
            FROM participants p
            JOIN users u ON p.user_id = u.id
            WHERE p.status = 'active'
            GROUP BY u.id, u.full_name
            ORDER BY sessions_joined DESC
            LIMIT 10
        """)
        top_users = [{"name": r["full_name"], "sessions": r["sessions_joined"]} for r in cur.fetchall()]

        # Fill rate
        cur.execute("""
            SELECT s.id, s.title, s.max_participants,
                   (SELECT COUNT(*) FROM participants p WHERE p.session_id = s.id AND p.status = 'active') as filled
            FROM sessions s
            ORDER BY s.created_at DESC
        """)
        fill_rates = []
        for r in cur.fetchall():
            max_p = r["max_participants"] or 14
            rate = round((r["filled"] / max_p) * 100, 1)
            fill_rates.append({"title": r["title"], "filled": r["filled"], "max": max_p, "rate": rate})

        return {"top_users": top_users, "fill_rates": fill_rates}
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

    # Recalculate total
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
