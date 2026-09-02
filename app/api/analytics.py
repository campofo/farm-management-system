from __future__ import annotations

from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_owned_crop
from app.db.session import get_db
from app.models import Crop, CropStatus, Expense, Harvest, User
from app.schemas import DashboardSummary, ProfitSummary

router = APIRouter()


def money(value: object) -> Decimal:
    return Decimal(str(value or "0")).quantize(Decimal("0.01"))


def quantity(value: object) -> Decimal:
    return Decimal(str(value or "0")).quantize(Decimal("0.01"))


def calculate_profit(db: Session, user_id: int, crop_id: Optional[int] = None) -> ProfitSummary:
    expense_query = select(func.coalesce(func.sum(Expense.amount), 0)).join(Crop).where(Crop.owner_id == user_id)
    harvest_query = (
        select(
            func.coalesce(func.sum(Harvest.quantity * Harvest.unit_price), 0),
            func.coalesce(func.sum(Harvest.quantity), 0),
        )
        .join(Crop)
        .where(Crop.owner_id == user_id)
    )

    if crop_id is not None:
        get_owned_crop(db, crop_id, user_id)
        expense_query = expense_query.where(Expense.crop_id == crop_id)
        harvest_query = harvest_query.where(Harvest.crop_id == crop_id)

    total_expenses = money(db.scalar(expense_query))
    total_revenue_raw, total_quantity_raw = db.execute(harvest_query).one()
    total_revenue = money(total_revenue_raw)
    total_quantity = quantity(total_quantity_raw)

    return ProfitSummary(
        crop_id=crop_id,
        total_expenses=total_expenses,
        total_revenue=total_revenue,
        profit=money(total_revenue - total_expenses),
        harvest_quantity=total_quantity,
    )


@router.get("/profit", response_model=ProfitSummary)
def profit_summary(
    crop_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProfitSummary:
    return calculate_profit(db, current_user.id, crop_id)


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardSummary:
    total_crops = db.scalar(select(func.count(Crop.id)).where(Crop.owner_id == current_user.id)) or 0
    harvested_crops = (
        db.scalar(
            select(func.count(Crop.id)).where(
                Crop.owner_id == current_user.id,
                Crop.status == CropStatus.harvested,
            )
        )
        or 0
    )
    profit = calculate_profit(db, current_user.id)

    return DashboardSummary(
        total_crops=total_crops,
        active_crops=total_crops - harvested_crops,
        harvested_crops=harvested_crops,
        total_expenses=profit.total_expenses,
        total_revenue=profit.total_revenue,
        total_profit=profit.profit,
        total_harvest_quantity=profit.harvest_quantity,
    )
