from __future__ import annotations

import csv
from io import StringIO

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.analytics import calculate_profit
from app.api.dependencies import get_current_user, get_owned_crop
from app.db.session import get_db
from app.models import Crop, Expense, Harvest, User

router = APIRouter()


@router.get("/crop/{crop_id}")
def crop_report(
    crop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, object]:
    crop = get_owned_crop(db, crop_id, current_user.id)
    expenses = list(db.scalars(select(Expense).where(Expense.crop_id == crop_id).order_by(Expense.expense_date)))
    harvests = list(db.scalars(select(Harvest).where(Harvest.crop_id == crop_id).order_by(Harvest.harvest_date)))
    profit = calculate_profit(db, current_user.id, crop_id)

    return {
        "crop": {
            "id": crop.id,
            "name": crop.name,
            "variety": crop.variety,
            "field_name": crop.field_name,
            "status": crop.status.value,
            "planting_date": crop.planting_date,
            "expected_harvest_date": crop.expected_harvest_date,
        },
        "expenses": [
            {
                "id": item.id,
                "category": item.category,
                "amount": item.amount,
                "expense_date": item.expense_date,
                "description": item.description,
            }
            for item in expenses
        ],
        "harvests": [
            {
                "id": item.id,
                "quantity": item.quantity,
                "unit": item.unit,
                "unit_price": item.unit_price,
                "revenue": item.quantity * item.unit_price,
                "harvest_date": item.harvest_date,
                "buyer": item.buyer,
            }
            for item in harvests
        ],
        "profit": profit,
    }


@router.get("/profit.csv")
def profit_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    rows = []
    crops = db.scalars(select(Crop).where(Crop.owner_id == current_user.id).order_by(Crop.name))
    for crop in crops:
        profit = calculate_profit(db, current_user.id, crop.id)
        rows.append(
            {
                "crop": crop.name,
                "status": crop.status.value,
                "total_expenses": profit.total_expenses,
                "total_revenue": profit.total_revenue,
                "profit": profit.profit,
                "harvest_quantity": profit.harvest_quantity,
            }
        )

    output = StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["crop", "status", "total_expenses", "total_revenue", "profit", "harvest_quantity"],
    )
    writer.writeheader()
    writer.writerows(rows)
    output.seek(0)

    headers = {"Content-Disposition": 'attachment; filename="profit-report.csv"'}
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers=headers)

