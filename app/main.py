from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import activities, analytics, auth, crops, expenses, harvests, reports
from app.core.config import settings
from app.db.session import Base, engine


def create_app() -> FastAPI:
    Base.metadata.create_all(bind=engine)

    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description="Backend API for crop monitoring, expense tracking, harvest recording, and profit analysis.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
    app.include_router(crops.router, prefix="/api/crops", tags=["Crops"])
    app.include_router(activities.router, prefix="/api/activities", tags=["Activities"])
    app.include_router(expenses.router, prefix="/api/expenses", tags=["Expenses"])
    app.include_router(harvests.router, prefix="/api/harvests", tags=["Harvests"])
    app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
    app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

    @app.get("/health")
    def health_check() -> dict[str, str]:
        return {"status": "ok", "service": settings.app_name}

    return app


app = create_app()
