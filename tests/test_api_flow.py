from __future__ import annotations

import importlib

from fastapi.testclient import TestClient


def test_farmer_can_record_crop_and_calculate_profit(monkeypatch, tmp_path):
    db_path = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("SECRET_KEY", "test-secret")

    main = importlib.import_module("app.main")
    client = TestClient(main.app)

    register_response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Yenpaabo Alhassan Musah",
            "email": "farmer@example.com",
            "password": "strongpassword",
            "location": "Ghana",
        },
    )
    assert register_response.status_code == 201

    login_response = client.post(
        "/api/auth/login",
        json={"email": "farmer@example.com", "password": "strongpassword"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    crop_response = client.post(
        "/api/crops",
        headers=headers,
        json={
            "name": "Maize",
            "variety": "Obaatanpa",
            "field_name": "North field",
            "area_size": "2.5",
            "planting_date": "2026-06-01",
            "expected_harvest_date": "2026-09-15",
        },
    )
    assert crop_response.status_code == 201
    crop_id = crop_response.json()["id"]

    expense_response = client.post(
        "/api/expenses",
        headers=headers,
        json={
            "crop_id": crop_id,
            "category": "Fertilizer",
            "amount": "250.00",
            "expense_date": "2026-06-15",
            "description": "NPK fertilizer",
        },
    )
    assert expense_response.status_code == 201

    harvest_response = client.post(
        "/api/harvests",
        headers=headers,
        json={
            "crop_id": crop_id,
            "quantity": "100.00",
            "unit": "kg",
            "unit_price": "5.00",
            "harvest_date": "2026-09-20",
            "buyer": "Local market",
        },
    )
    assert harvest_response.status_code == 201

    profit_response = client.get(f"/api/analytics/profit?crop_id={crop_id}", headers=headers)
    assert profit_response.status_code == 200
    assert profit_response.json()["total_expenses"] == "250.00"
    assert profit_response.json()["total_revenue"] == "500.00"
    assert profit_response.json()["profit"] == "250.00"

