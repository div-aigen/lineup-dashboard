from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from routes import auth, analytics, exports, settings

app = FastAPI(title="Lineup Admin Dashboard API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Register route modules
api_router.include_router(auth.router)
api_router.include_router(analytics.router)
api_router.include_router(exports.router)
api_router.include_router(settings.router)


@api_router.get("/")
async def root():
    return {"message": "Lineup Admin Dashboard API"}


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
