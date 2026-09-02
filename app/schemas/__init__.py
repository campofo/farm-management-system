from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import CropStatus


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    location: Optional[str] = Field(default=None, max_length=120)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    location: Optional[str]
    created_at: datetime


class CropBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    variety: Optional[str] = Field(default=None, max_length=120)
    field_name: Optional[str] = Field(default=None, max_length=120)
    area_size: Optional[Decimal] = Field(default=None, ge=0)
    area_unit: str = Field(default="acre", max_length=30)
    planting_date: date
    expected_harvest_date: Optional[date] = None
    status: CropStatus = CropStatus.planted
    notes: Optional[str] = None


class CropCreate(CropBase):
    pass


class CropUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    variety: Optional[str] = Field(default=None, max_length=120)
    field_name: Optional[str] = Field(default=None, max_length=120)
    area_size: Optional[Decimal] = Field(default=None, ge=0)
    area_unit: Optional[str] = Field(default=None, max_length=30)
    planting_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    status: Optional[CropStatus] = None
    notes: Optional[str] = None


class CropRead(CropBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    created_at: datetime


class ActivityBase(BaseModel):
    crop_id: int
    activity_type: str = Field(min_length=2, max_length=80)
    activity_date: date
    description: Optional[str] = None


class ActivityCreate(ActivityBase):
    title: Optional[str] = Field(default=None, min_length=2, max_length=150)


class ActivityUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=150)
    activity_type: Optional[str] = Field(default=None, min_length=2, max_length=80)
    activity_date: Optional[date] = None
    description: Optional[str] = None


class ActivityRead(ActivityBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    created_at: datetime


class ExpenseBase(BaseModel):
    crop_id: int
    category: str = Field(min_length=2, max_length=80)
    amount: Decimal = Field(gt=0)
    expense_date: date
    description: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    category: Optional[str] = Field(default=None, min_length=2, max_length=80)
    amount: Optional[Decimal] = Field(default=None, gt=0)
    expense_date: Optional[date] = None
    description: Optional[str] = None


class ExpenseRead(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class HarvestBase(BaseModel):
    crop_id: int
    quantity: Decimal = Field(gt=0)
    unit: str = Field(default="kg", max_length=40)
    unit_price: Decimal = Field(default=0, ge=0)
    harvest_date: date
    buyer: Optional[str] = Field(default=None, max_length=120)
    notes: Optional[str] = None


class HarvestCreate(HarvestBase):
    pass


class HarvestUpdate(BaseModel):
    quantity: Optional[Decimal] = Field(default=None, gt=0)
    unit: Optional[str] = Field(default=None, max_length=40)
    unit_price: Optional[Decimal] = Field(default=None, ge=0)
    harvest_date: Optional[date] = None
    buyer: Optional[str] = Field(default=None, max_length=120)
    notes: Optional[str] = None


class HarvestRead(HarvestBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class ProfitSummary(BaseModel):
    crop_id: Optional[int] = None
    total_expenses: Decimal
    total_revenue: Decimal
    profit: Decimal
    harvest_quantity: Decimal


class DashboardSummary(BaseModel):
    total_crops: int
    active_crops: int
    harvested_crops: int
    total_expenses: Decimal
    total_revenue: Decimal
    total_profit: Decimal
    total_harvest_quantity: Decimal
