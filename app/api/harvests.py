from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_owned_crop
from app.db.session import get_db
from app.models import Crop, Harvest, User
from app.schemas import HarvestCreate, HarvestRead, HarvestUpdate

router = APIRouter()


def get_owned_harvest(db: Session, harvest_id: int, user_id: int) -> Harvest:
    harvest = db.scalar(select(Harvest).join(Crop).where(Harvest.id == harvest_id, Crop.owner_id == user_id))
    if not harvest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Harvest not found")
    return harvest


@router.get("", response_model=list[HarvestRead])
def list_harvests(
    crop_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Harvest]:
    query = select(Harvest).join(Crop).where(Crop.owner_id == current_user.id)
    if crop_id is not None:
        query = query.where(Harvest.crop_id == crop_id)
    return list(db.scalars(query.order_by(Harvest.harvest_date.desc())))


@router.post("", response_model=HarvestRead, status_code=status.HTTP_201_CREATED)
def create_harvest(
    payload: HarvestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Harvest:
    get_owned_crop(db, payload.crop_id, current_user.id)
    harvest = Harvest(**payload.model_dump())
    db.add(harvest)
    db.commit()
    db.refresh(harvest)
    return harvest


@router.patch("/{harvest_id}", response_model=HarvestRead)
def update_harvest(
    harvest_id: int,
    payload: HarvestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Harvest:
    harvest = get_owned_harvest(db, harvest_id, current_user.id)
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No changes provided")
    for field, value in changes.items():
        setattr(harvest, field, value)
    db.commit()
    db.refresh(harvest)
    return harvest


@router.delete("/{harvest_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_harvest(
    harvest_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    harvest = get_owned_harvest(db, harvest_id, current_user.id)
    db.delete(harvest)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
