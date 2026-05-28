import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import modular route handlers
from routers.auth import router as auth_router
from routers.team import router as team_router
from routers.entries import router as entries_router
from routers.reports import router as reports_router
from routers.audits import router as audits_router
from routers.metadata import router as metadata_router

from config import settings

app = FastAPI(
    title="NHRS Highway Tender & Work Progress Management System",
    description="Refactored & Security-Hardened Portal for National Highways Research Station, Chennai",
    version="1.2.0",
)

CORS_ORIGINS = settings.CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route assembly scopes
app.include_router(auth_router)
app.include_router(team_router)
app.include_router(entries_router)
app.include_router(reports_router)
app.include_router(audits_router)
app.include_router(metadata_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "version": "1.1.0",
        "environment": "hardened"
    }
