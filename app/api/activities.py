from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_owned_crop
from app.db.session import get_db
from app.models import Activity, Crop, User
from app.schemas import ActivityCreate, ActivityRead, ActivityUpdate

router = APIRouter()


def get_owned_activity(db: Session, activity_id: int, user_id: int) -> Activity:
    activity = db.scalar(
        select(Activity).join(Crop).where(Activity.id == activity_id, Crop.owner_id == user_id)
    )
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    return activity


@router.get("", response_model=list[ActivityRead])
def list_activities(
    crop_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Activity]:
    query = select(Activity).join(Crop).where(Crop.owner_id == current_user.id)
    if crop_id is not None:
        query = query.where(Activity.crop_id == crop_id)
    return list(db.scalars(query.order_by(Activity.activity_date.desc())))


@router.post("", response_model=ActivityRead, status_code=status.HTTP_201_CREATED)
def create_activity(
    payload: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Activity:
    get_owned_crop(db, payload.crop_id, current_user.id)
    data = payload.model_dump()
    data["title"] = data.get("title") or data["activity_type"].replace("_", " ").title()
    activity = Activity(**data)
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.patch("/{activity_id}", response_model=ActivityRead)
def update_activity(
    activity_id: int,
    payload: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Activity:
    activity = get_owned_activity(db, activity_id, current_user.id)
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No changes provided")
    for field, value in changes.items():
        setattr(activity, field, value)
    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    activity = get_owned_activity(db, activity_id, current_user.id)
    db.delete(activity)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
