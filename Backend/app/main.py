
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.scoring.pd_model import ScoringEngine

# Import Routers
from app.api.v1 import (
    applications, 
    scoring, 
    decisions, 
    overrides, 
    portfolio, 
    policies, 
    health,
    admin
)

# -----------------------------
# LIFESPAN (Startup/Shutdown)
# -----------------------------
from contextlib import asynccontextmanager
from fastapi import FastAPI
import asyncio

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     print("🚀 SmartLend System Startup...")
#     print("📥 Pre-loading ML Models into Memory...")

#     try:
#         # Run blocking ML load in a worker thread
#         await asyncio.to_thread(ScoringEngine)
#         print("✅ ML Models Loaded & Ready for Inference.")
#     except Exception as e:
#         print(f"❌ CRITICAL ERROR: Failed to load ML Models: {e}")
#         raise e

#     yield

#     print("🛑 SmartLend System Shutdown")
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 SmartLend System Startup...")
    print("📥 Pre-loading ML Models into Memory...")

    try:
        ScoringEngine()  # synchronous, safe
        print("✅ ML Models Loaded & Ready for Inference.")
    except Exception as e:
        print(f"❌ CRITICAL ERROR: Failed to load ML Models: {e}")
        raise e

    yield

    print("🛑 SmartLend System Shutdown")
    
# -----------------------------
# APP INITIALIZATION
# -----------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SmartLend Bank-Grade Credit Engine API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    version="1.0.0",
    lifespan=lifespan  # Attach the logic here
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
api_v1 = settings.API_V1_STR

app.include_router(health.router,       prefix="/health",              tags=["System"])
app.include_router(applications.router, prefix=f"{api_v1}/applications", tags=["Applications"])
app.include_router(scoring.router,      prefix=f"{api_v1}/scoring",      tags=["Scoring"])
app.include_router(decisions.router,    prefix=f"{api_v1}/decisions",    tags=["Decisions"])
app.include_router(overrides.router,    prefix=f"{api_v1}/overrides",    tags=["Overrides"])
app.include_router(portfolio.router,    prefix=f"{api_v1}/portfolio",    tags=["Portfolio Analytics"])
app.include_router(policies.router,     prefix=f"{api_v1}/policies",     tags=["Policy Governance"])
app.include_router(admin.router,        prefix=f"{api_v1}/admin",        tags=["Admin"])

@app.get("/", tags=["System"])
def root():
    return {
        "message": "SmartLend Credit Engine API is running",
        "docs_url": "/docs",
        "version": "1.0.0"
    }