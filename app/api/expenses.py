from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_owned_crop
from app.db.session import get_db
from app.models import Crop, Expense, User
from app.schemas import ExpenseCreate, ExpenseRead, ExpenseUpdate

router = APIRouter()


def get_owned_expense(db: Session, expense_id: int, user_id: int) -> Expense:
    expense = db.scalar(select(Expense).join(Crop).where(Expense.id == expense_id, Crop.owner_id == user_id))
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


@router.get("", response_model=list[ExpenseRead])
def list_expenses(
    crop_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Expense]:
    query = select(Expense).join(Crop).where(Crop.owner_id == current_user.id)
    if crop_id is not None:
        query = query.where(Expense.crop_id == crop_id)
    return list(db.scalars(query.order_by(Expense.expense_date.desc())))


@router.post("", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Expense:
    get_owned_crop(db, payload.crop_id, current_user.id)
    expense = Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.patch("/{expense_id}", response_model=ExpenseRead)
def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Expense:
    expense = get_owned_expense(db, expense_id, current_user.id)
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No changes provided")
    for field, value in changes.items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    expense = get_owned_expense(db, expense_id, current_user.id)
    db.delete(expense)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
