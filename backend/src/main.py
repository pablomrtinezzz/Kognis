import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Import the API routers (SOLO perfiles)
from src.api import profiles

# Initialize logging for backend monitoring
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Kognis API",
    description="Core backend for the Kognis PWA",
    version="0.1.0",
)

# 1. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 2. Global Exception Handling Middleware
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


# 3. Register API Routers (SOLO perfiles)
app.include_router(profiles.router, prefix="/api/v1")


# 4. Health Endpoint
@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": "Kognis API"}
