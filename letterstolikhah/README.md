# Letters to Likhah

A full-stack blog/letters application built with Next.js 14 (App Router) and FastAPI with PostgreSQL.

## Tech Stack

- **Frontend**: Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Alembic
- **Analytics**: Custom tracking with IP geolocation
- **Caching**: Next.js ISR, React Query

## Project Structure

```
/frontend          # Next.js application
/backend           # FastAPI application
/docker-compose.yml
```

## Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

## Quick Start with Docker

```bash
# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend alembic upgrade head

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Manual Setup

### 1. PostgreSQL Setup

```bash
# Create database
createdb blog_db

# Or using psql
psql -U postgres
CREATE DATABASE blog_db;
CREATE USER blog_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE blog_db TO blog_user;
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local if needed

# Start development server
npm run dev
```

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/blog_db
SECRET_KEY=your-super-secret-key-change-in-production
ADMIN_PASSWORD=admin123
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Database Migrations

```bash
cd backend

# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one version
alembic downgrade -1

# View migration history
alembic history
```

## API Documentation

Once the backend is running, access the interactive API documentation:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Admin Access

1. Navigate to `/admin`
2. Default password: `admin123` (change in production!)
3. Use the admin panel to create, edit, and manage posts
4. View analytics dashboard for visitor statistics

## Features

- 📝 Rich text editor for creating posts
- 📊 Analytics dashboard with visitor tracking
- 🌍 IP geolocation for visitor locations
- 📱 Responsive design with mobile support
- 🎨 Dark mode theme
- ⚡ Fast page loads with ISR caching
- 🔒 JWT authentication for admin

## License

MIT
