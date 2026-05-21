import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Import API routers and scheduler
from src.api import goals, profiles
from src.core.scheduler import scheduler

# Initialize logging for backend monitoring
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages the lifecycle of the FastAPI application.
    Starts the APScheduler on startup and shuts it down securely on exit.
    """
    logger.info("Starting background scheduler...")
    scheduler.start()
    yield
    logger.info("Shutting down background scheduler...")
    scheduler.shutdown()


app = FastAPI(
    title="Kognis API",
    description="Core backend for the Kognis PWA",
    version="0.1.0",
    lifespan=lifespan,  # Inject the lifespan context
)

# 1. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 2. Global Exception Handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unhandled exception at {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc) if app.debug else "An unexpected error occurred.",
            "path": request.url.path,
        },
    )


# 3. Register API Routers
app.include_router(profiles.router, prefix="/api/v1")
app.include_router(goals.router, prefix="/api/v1")


# 4. Health Endpoint
@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": "Kognis API"}
