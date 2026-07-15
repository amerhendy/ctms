# Services Container Setup Guide

## Overview
This Docker Compose setup provides a **shared services infrastructure** that multiple projects can use simultaneously:
- **PostgreSQL** (Port 5433)
- **pgAdmin** UI (Port 5050)
- **Redis** cache & message broker (Port 6379)
- **Celery Worker** for async tasks
- **Celery Beat** for scheduled tasks

## Quick Start

### 1. Start the Services Container
```bash
cd C:\Users\sinaiwater\Desktop\Docker
docker-compose -f docker-compose.services.yml up -d
```

### 2. Verify Services Are Running
```bash
docker-compose -f docker-compose.services.yml ps
```

### 3. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| pgAdmin | http://localhost:5050 | admin@example.com / admin |
| PostgreSQL | localhost:5433 | postgres / password |
| Redis | localhost:6379 | (no auth) |

## Using Services Container in Your Project

### Step 1: Update Your Project's docker-compose.yml

Remove the postgres, redis, celery_worker, and celery_beat services from your project's docker-compose.yml. Your project should only define:
- backend (API)
- frontend (Web UI)
- nginx (reverse proxy, optional)

### Step 2: Update Connection Strings

In your project's docker-compose.yml, change the service connections:

**OLD (embedded):**
```yaml
services:
  backend:
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:password@postgres:5432/corporate_tasks
      REDIS_URL: redis://redis:6379/0
```

**NEW (shared services):**
```yaml
services:
  backend:
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:password@host.docker.internal:5433/corporate_tasks
      REDIS_URL: redis://host.docker.internal:6379/0
      CELERY_BROKER_URL: redis://host.docker.internal:6379/1
      CELERY_RESULT_BACKEND: redis://host.docker.internal:6379/2
```

**Note:** Docker on Windows/Mac uses `host.docker.internal` to reference the host machine. On Linux, use `localhost`.

### Step 3: Launch Your Project

```bash
cd your-project-folder
docker-compose up -d
```

## Multi-Project Setup Example

You can run multiple projects simultaneously, all sharing the same PostgreSQL, Redis, and Celery infrastructure:

```bash
# Terminal 1: Start shared services
cd C:\Users\sinaiwater\Desktop\Docker
docker-compose -f docker-compose.services.yml up -d

# Terminal 2: Start Project A
cd C:\path\to\project-a
docker-compose up -d

# Terminal 3: Start Project B
cd C:\path\to\project-b
docker-compose up -d
```

All projects connect to the same PostgreSQL, Redis, and Celery services.

## Important Notes

### Database Isolation
Each project should use a **different database name**:
```yaml
# Project A
POSTGRES_DB=project_a

# Project B
POSTGRES_DB=project_b
```

### Redis Database Isolation
Use different Redis database numbers:
```yaml
# Project A
REDIS_URL=redis://host.docker.internal:6379/0
CELERY_BROKER_URL=redis://host.docker.internal:6379/1

# Project B
REDIS_URL=redis://host.docker.internal:6379/10
CELERY_BROKER_URL=redis://host.docker.internal:6379/11
```

### Port Mappings
- **PostgreSQL:** Port 5433 (instead of 5432) to avoid conflicts
- **pgAdmin:** Port 5050
- **Redis:** Port 6379

## Stopping Services

Stop all services without deleting data:
```bash
docker-compose -f docker-compose.services.yml down
```

Stop and remove volumes (DELETE DATA):
```bash
docker-compose -f docker-compose.services.yml down -v
```

## Troubleshooting

### Check Service Logs
```bash
docker-compose -f docker-compose.services.yml logs postgres
docker-compose -f docker-compose.services.yml logs redis
docker-compose -f docker-compose.services.yml logs celery_worker
```

### Verify PostgreSQL Connection
```bash
docker-compose -f docker-compose.services.yml exec postgres psql -U postgres -l
```

### Check Redis Connection
```bash
docker-compose -f docker-compose.services.yml exec redis redis-cli ping
```

### Clear pgAdmin Cache
```bash
docker volume rm docker_pgadmin_data
```

## Updating Services

To pull latest images:
```bash
docker-compose -f docker-compose.services.yml pull
docker-compose -f docker-compose.services.yml up -d
```

## Backup PostgreSQL

```bash
docker-compose -f docker-compose.services.yml exec postgres pg_dump -U postgres corporate_tasks > backup.sql
```

## Restore PostgreSQL

```bash
cat backup.sql | docker-compose -f docker-compose.services.yml exec -T postgres psql -U postgres
```
