from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional

from sqlalchemy import Date, DateTime, Enum as SqlEnum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class CropStatus(str, Enum):
    planted = "planted"
    growing = "growing"
    flowering = "flowering"
    ready = "ready"
    ready_for_harvest = "ready_for_harvest"
    harvested = "harvested"
    failed = "failed"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    location: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    crops: Mapped[List["Crop"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class Crop(Base):
    __tablename__ = "crops"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    variety: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    field_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    area_size: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    area_unit: Mapped[str] = mapped_column(String(30), default="acre")
    planting_date: Mapped[date] = mapped_column(Date)
    expected_harvest_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[CropStatus] = mapped_column(SqlEnum(CropStatus), default=CropStatus.planted)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    owner: Mapped[User] = relationship(back_populates="crops")
    activities: Mapped[List["Activity"]] = relationship(back_populates="crop", cascade="all, delete-orphan")
    expenses: Mapped[List["Expense"]] = relationship(back_populates="crop", cascade="all, delete-orphan")
    harvests: Mapped[List["Harvest"]] = relationship(back_populates="crop", cascade="all, delete-orphan")


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(150))
    activity_type: Mapped[str] = mapped_column(String(80), index=True)
    activity_date: Mapped[date] = mapped_column(Date)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    crop: Mapped[Crop] = relationship(back_populates="activities")


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id", ondelete="CASCADE"), index=True)
    category: Mapped[str] = mapped_column(String(80), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    expense_date: Mapped[date] = mapped_column(Date)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    crop: Mapped[Crop] = relationship(back_populates="expenses")


class Harvest(Base):
    __tablename__ = "harvests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id", ondelete="CASCADE"), index=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    unit: Mapped[str] = mapped_column(String(40), default="kg")
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    harvest_date: Mapped[date] = mapped_column(Date)
    buyer: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    crop: Mapped[Crop] = relationship(back_populates="harvests")
