import io
import csv
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from typing import Optional
from db import get_cursor
from routes.auth import verify_token
from routes.analytics import parse_date_params, date_where

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/users-csv")
async def export_users_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    sd, ed = parse_date_params(start_date, end_date)
    with get_cursor() as cur:
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


@router.get("/sessions-csv")
async def export_sessions_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    sd, ed = parse_date_params(start_date, end_date)
    with get_cursor() as cur:
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


@router.get("/participants-csv")
async def export_participants_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    sd, ed = parse_date_params(start_date, end_date)
    with get_cursor() as cur:
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
