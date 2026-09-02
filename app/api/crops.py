from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_owned_crop
from app.db.session import get_db
from app.models import Crop, User
from app.schemas import CropCreate, CropRead, CropUpdate

router = APIRouter()


@router.get("", response_model=list[CropRead])
def list_crops(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Crop]:
    return list(db.scalars(select(Crop).where(Crop.owner_id == current_user.id).order_by(Crop.planting_date.desc())))


@router.post("", response_model=CropRead, status_code=status.HTTP_201_CREATED)
def create_crop(
    payload: CropCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Crop:
    crop = Crop(owner_id=current_user.id, **payload.model_dump())
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop


@router.get("/{crop_id}", response_model=CropRead)
def get_crop(
    crop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Crop:
    return get_owned_crop(db, crop_id, current_user.id)


@router.patch("/{crop_id}", response_model=CropRead)
def update_crop(
    crop_id: int,
    payload: CropUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Crop:
    crop = get_owned_crop(db, crop_id, current_user.id)
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No changes provided")
    for field, value in changes.items():
        setattr(crop, field, value)
    db.commit()
    db.refresh(crop)
    return crop


@router.delete("/{crop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crop(
    crop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    crop = get_owned_crop(db, crop_id, current_user.id)
    db.delete(crop)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

