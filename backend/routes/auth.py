import os
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
import bcrypt
from db import get_cursor

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()
JWT_SECRET = os.environ.get("JWT_SECRET", "")


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str


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


@router.post("/login")
async def login(req: LoginRequest):
    with get_cursor() as cur:
        cur.execute("SELECT email, password_hash FROM dashboard.admins WHERE email = %s", (req.email,))
        admin = cur.fetchone()
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bcrypt.checkpw(req.password.encode(), admin["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(req.email)
    return {"token": token, "email": req.email}


@router.post("/signup")
async def signup(req: SignupRequest):
    with get_cursor() as cur:
        cur.execute("SELECT id FROM dashboard.admins WHERE email = %s", (req.email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        hashed = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
        cur.execute(
            "INSERT INTO dashboard.admins (email, password_hash) VALUES (%s, %s) RETURNING id, email",
            (req.email, hashed),
        )
        admin = cur.fetchone()
    token = create_token(req.email)
    return {"token": token, "email": admin["email"]}


@router.get("/me")
async def me(email: str = Depends(verify_token)):
    with get_cursor() as cur:
        cur.execute("SELECT id, email, created_at FROM dashboard.admins WHERE email = %s", (email,))
        admin = cur.fetchone()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return {
        "id": admin["id"],
        "email": admin["email"],
        "created_at": admin["created_at"].isoformat() if admin["created_at"] else None,
    }


@router.get("/verify")
async def verify(email: str = Depends(verify_token)):
    return {"email": email, "valid": True}
