# Smart Agricultural Farm Management System

Full-stack farm management system for crop monitoring, expense tracking, harvest recording, profit analysis, dashboard summaries, and report generation.

The backend is built with Python/FastAPI. The frontend is a Vite/TanStack React app cloned into the `frontend/` folder.

## Features

- Farmer registration and login with JWT authentication
- Crop registration and monitoring
- Farm activity records
- Expense tracking
- Harvest recording
- Profit/loss calculation
- Dashboard summary
- JSON crop report and CSV profit report
- SQLite by default, MySQL-ready through `DATABASE_URL`
- React frontend for dashboard, crops, activities, expenses, harvests, analytics, and settings

## Backend Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

The API will run at:

```text
http://127.0.0.1:8000
```

Interactive API docs:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

Open a second terminal:

```bash
cd frontend
pnpm install
pnpm exec vite dev --host 127.0.0.1 --port 5173
```

The frontend will run at:

```text
http://127.0.0.1:5173
```

The frontend expects the backend API at:

```text
http://127.0.0.1:8000
```

You can change the backend URL from the frontend Settings page if needed.

## Important Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|POST /api/crops`
- `GET|POST /api/activities`
- `GET|POST /api/expenses`
- `GET|POST /api/harvests`
- `GET /api/analytics/dashboard`
- `GET /api/analytics/profit`
- `GET /api/reports/crop/{crop_id}`
- `GET /api/reports/profit.csv`

## MySQL Configuration

Install MySQL, create a database, then update `.env`:

```env
DATABASE_URL=mysql+pymysql://farm_user:farm_password@localhost:3306/farm_management
```

FastAPI will create the tables on startup. For a production deployment, add a migration tool such as Alembic before changing live schemas.

## Example Flow

1. Register a farmer.
2. Log in from the frontend.
3. Register crops.
4. Add activities, expenses, and harvest records.
5. View dashboard totals, analytics, and reports.

## Project Structure

```text
app/                 FastAPI backend application
tests/               Backend API smoke tests
frontend/            React frontend application
requirements.txt     Backend Python dependencies
.env.example         Example backend environment settings
```

## Verification

Backend tests:

```bash
.venv/bin/python -m pytest -q
```

Frontend build:

```bash
cd frontend
pnpm run build
```
