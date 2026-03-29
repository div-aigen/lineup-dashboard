from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from db import get_cursor
from routes.auth import verify_token

router = APIRouter(prefix="/settings", tags=["settings"])


class DownloadsUpdate(BaseModel):
    count: int
    platform: Optional[str] = "android"
    note: Optional[str] = ""


@router.get("/downloads")
async def get_downloads(email: str = Depends(verify_token)):
    with get_cursor() as cur:
        cur.execute("SELECT android, ios, total, last_updated FROM dashboard.downloads LIMIT 1")
        doc = cur.fetchone()
        if not doc:
            return {"android": 0, "ios": 0, "total": 0, "history": []}

        cur.execute("SELECT platform, count, note, updated_at, updated_by FROM dashboard.download_history ORDER BY updated_at DESC")
        history = []
        for h in cur.fetchall():
            history.append({
                "platform": h["platform"],
                "count": h["count"],
                "note": h["note"],
                "updated_at": h["updated_at"].isoformat() if h["updated_at"] else None,
                "updated_by": h["updated_by"],
            })

    return {
        "android": doc["android"],
        "ios": doc["ios"],
        "total": doc["total"],
        "last_updated": doc["last_updated"].isoformat() if doc["last_updated"] else None,
        "history": history,
    }


@router.put("/downloads")
async def update_downloads(req: DownloadsUpdate, email: str = Depends(verify_token)):
    platform = req.platform or "android"
    now = datetime.now(timezone.utc)

    with get_cursor() as cur:
        # Update the platform count
        cur.execute(f"UPDATE dashboard.downloads SET {platform} = %s, last_updated = %s", (req.count, now))

        # Recalculate total
        cur.execute("SELECT android, ios FROM dashboard.downloads LIMIT 1")
        row = cur.fetchone()
        total = (row["android"] or 0) + (row["ios"] or 0)
        cur.execute("UPDATE dashboard.downloads SET total = %s", (total,))

        # Insert history entry
        cur.execute(
            "INSERT INTO dashboard.download_history (platform, count, note, updated_at, updated_by) VALUES (%s, %s, %s, %s, %s)",
            (platform, req.count, req.note, now, email),
        )

    return {"android": row["android"], "ios": row["ios"], "total": total, "last_updated": now.isoformat()}
