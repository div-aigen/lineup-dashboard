from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import date
from db import get_cursor
from routes.auth import verify_token

router = APIRouter(prefix="/analytics", tags=["analytics"])


def parse_date_params(start_date: Optional[str], end_date: Optional[str]):
    s, e = None, None
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
    clauses, params = [], []
    if start:
        clauses.append(f"{col} >= %s")
        params.append(start)
    if end:
        clauses.append(f"{col} <= %s")
        params.append(end)
    if clauses:
        return " AND " + " AND ".join(clauses), params
    return "", []


@router.get("/overview")
async def get_overview(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    sd, ed = parse_date_params(start_date, end_date)
    with get_cursor() as cur:
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

        # Downloads from dashboard schema
        cur.execute("SELECT total FROM dashboard.downloads LIMIT 1")
        row = cur.fetchone()
        total_downloads = row["total"] if row else 0

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


@router.get("/users-growth")
async def get_users_growth(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    sd, ed = parse_date_params(start_date, end_date)
    with get_cursor() as cur:
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


@router.get("/sessions-trend")
async def get_sessions_trend(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    sd, ed = parse_date_params(start_date, end_date)
    with get_cursor() as cur:
        dw, dp = date_where("created_at::date", sd, ed)
        cur.execute(f"""
            SELECT DATE_TRUNC('day', created_at)::date as date, COUNT(*) as count
            FROM sessions WHERE 1=1 {dw}
            GROUP BY date ORDER BY date
        """, dp)
        rows = cur.fetchall()
    return [{"date": r["date"].isoformat(), "sessions": r["count"]} for r in rows]


@router.get("/sport-distribution")
async def get_sport_distribution(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    sd, ed = parse_date_params(start_date, end_date)
    with get_cursor() as cur:
        dw, dp = date_where("created_at::date", sd, ed)
        cur.execute(f"""
            SELECT COALESCE(sport_type, 'Unknown') as sport, COUNT(*) as count
            FROM sessions WHERE 1=1 {dw}
            GROUP BY sport_type ORDER BY count DESC
        """, dp)
        rows = cur.fetchall()
    return [{"sport": r["sport"], "count": r["count"]} for r in rows]


@router.get("/venue-popularity")
async def get_venue_popularity(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    sd, ed = parse_date_params(start_date, end_date)
    with get_cursor() as cur:
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


@router.get("/session-status")
async def get_session_status(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    sd, ed = parse_date_params(start_date, end_date)
    with get_cursor() as cur:
        dw, dp = date_where("created_at::date", sd, ed)
        cur.execute(f"""
            SELECT status, COUNT(*) as count
            FROM sessions WHERE 1=1 {dw}
            GROUP BY status
        """, dp)
        rows = cur.fetchall()
    return [{"status": r["status"], "count": r["count"]} for r in rows]


@router.get("/recent-sessions")
async def get_recent_sessions(
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


@router.get("/participants-stats")
async def get_participants_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    email: str = Depends(verify_token),
):
    sd, ed = parse_date_params(start_date, end_date)
    with get_cursor() as cur:
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
