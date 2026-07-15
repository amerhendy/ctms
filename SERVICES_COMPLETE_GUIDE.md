# Docker Services Container Setup Guide

## 📋 Overview

This Docker Services Container provides **shared infrastructure** for multiple projects. Instead of embedding PostgreSQL, Redis, Celery, and pgAdmin in every project, you run them once here and connect multiple projects to them.

### Services Included
- **PostgreSQL 16** (Port 5433)
- **pgAdmin 4** (Port 5050) - Database UI
- **Redis 7** (Port 6379) - Cache & Message Broker
- **Celery Worker** - Async Task Executor
- **Celery Beat** - Task Scheduler

---

## 🚀 Quick Start

### Step 1: Start the Services Container

```bash
cd C:\Users\sinaiwater\Desktop\Docker
docker-compose -f docker-compose.services.yml up -d
```

### Step 2: Verify All Services Are Running

```bash
docker-compose -f docker-compose.services.yml ps
```

Expected output (all showing "Up"):
```
NAME                     IMAGE                   STATUS
services_postgres        postgres:16-alpine      Up 23 seconds (healthy)
services_redis           redis:7-alpine          Up 23 seconds (healthy)
services_pgadmin         dpage/pgadmin4:latest   Up 11 seconds
services_celery_worker   python:3.11-slim        Up 11 seconds
services_celery_beat     python:3.11-slim        Up 7 seconds
```

### Step 3: Access Services

| Service | URL | Login | Password |
|---------|-----|-------|----------|
| **pgAdmin** | http://localhost:5050 | admin@example.com | admin |
| **PostgreSQL** | localhost:5433 | postgres | password |
| **Redis CLI** | localhost:6379 | (no auth) | (no auth) |

---

## 🔌 Using Services with Your Project

### Method 1: Remove Embedded Services (Recommended)

Your project's `docker-compose.yml` should **only** contain:
- **backend** service
- **frontend** service  
- **nginx** service (optional)

**Remove from your project:**
- ❌ postgres service
- ❌ redis service
- ❌ celery_worker service
- ❌ celery_beat service

### Method 2: Update Connection Strings

In your project's `docker-compose.yml`, use `host.docker.internal` to reference the host machine:

#### **OLD (Embedded Services):**
```yaml
services:
  backend:
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:password@postgres:5432/corporate_tasks
      REDIS_URL: redis://redis:6379/0
      CELERY_BROKER_URL: redis://redis:6379/1
      CELERY_RESULT_BACKEND: redis://redis:6379/2
```

#### **NEW (Shared Services Container):**
```yaml
services:
  backend:
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:password@host.docker.internal:5433/corporate_tasks
      REDIS_URL: redis://host.docker.internal:6379/0
      CELERY_BROKER_URL: redis://host.docker.internal:6379/1
      CELERY_RESULT_BACKEND: redis://host.docker.internal:6379/2
```

**Important Notes:**
- Use **host.docker.internal** on Windows/Mac
- Use **localhost** on Linux
- Port is **5433** (not 5432) - this avoids conflicts

### Step 4: Launch Your Project

```bash
cd C:\path\to\your-project
docker-compose up -d
```

---

## 📁 Complete Project Example

### Your Project's `docker-compose.yml` (Simplified)

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: your_backend
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:password@host.docker.internal:5433/your_db
      REDIS_URL: redis://host.docker.internal:6379/0
      CELERY_BROKER_URL: redis://host.docker.internal:6379/1
      CELERY_RESULT_BACKEND: redis://host.docker.internal:6379/2
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: your_frontend
    environment:
      VITE_API_URL: http://localhost:3000/api/v1
    ports:
      - "5173:5173"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app:delegated
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: your_nginx
    ports:
      - "80:80"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
```

---

## 🏗️ Multi-Project Setup

### Run Multiple Projects Simultaneously

All projects will share the **same PostgreSQL, Redis, Celery infrastructure**.

#### **Terminal 1: Services Container**
```bash
cd C:\Users\sinaiwater\Desktop\Docker
docker-compose -f docker-compose.services.yml up -d
```

#### **Terminal 2: Project A**
```bash
cd C:\path\to\project-a
docker-compose up -d
```

#### **Terminal 3: Project B**
```bash
cd C:\path\to\project-b
docker-compose up -d
```

### Database Isolation

Each project must use a **different database name**:

**Project A:**
```yaml
environment:
  DATABASE_URL: postgresql+asyncpg://postgres:password@host.docker.internal:5433/project_a
```

**Project B:**
```yaml
environment:
  DATABASE_URL: postgresql+asyncpg://postgres:password@host.docker.internal:5433/project_b
```

### Redis Database Isolation

Use different Redis database numbers per project:

**Project A:**
```yaml
environment:
  REDIS_URL: redis://host.docker.internal:6379/0
  CELERY_BROKER_URL: redis://host.docker.internal:6379/1
  CELERY_RESULT_BACKEND: redis://host.docker.internal:6379/2
```

**Project B:**
```yaml
environment:
  REDIS_URL: redis://host.docker.internal:6379/10
  CELERY_BROKER_URL: redis://host.docker.internal:6379/11
  CELERY_RESULT_BACKEND: redis://host.docker.internal:6379/12
```

---

## 📊 Port Reference

| Service | Port | Used By |
|---------|------|---------|
| PostgreSQL | 5433 | All Projects |
| pgAdmin | 5050 | Browser |
| Redis | 6379 | All Projects |
| Celery Worker | Internal | Services Container |
| Celery Beat | Internal | Services Container |

---

## 🛠️ Troubleshooting

### Check Service Status

```bash
docker-compose -f docker-compose.services.yml ps
```

### View Service Logs

```bash
# PostgreSQL logs
docker-compose -f docker-compose.services.yml logs postgres

# Redis logs
docker-compose -f docker-compose.services.yml logs redis

# Celery Worker logs
docker-compose -f docker-compose.services.yml logs celery_worker

# Celery Beat logs
docker-compose -f docker-compose.services.yml logs celery_beat

# pgAdmin logs
docker-compose -f docker-compose.services.yml logs pgadmin

# Follow logs in real-time
docker-compose -f docker-compose.services.yml logs -f postgres
```

### Test PostgreSQL Connection

```bash
docker-compose -f docker-compose.services.yml exec postgres psql -U postgres -l
```

### Test Redis Connection

```bash
docker-compose -f docker-compose.services.yml exec redis redis-cli ping
```

Expected output: `PONG`

### Port Already in Use?

If port 5433 or 6379 is already allocated:

```bash
# Stop old containers
docker stop $(docker ps -aq)

# Or stop specific old services
docker stop ctms_postgres ctms_redis ctms_backend ctms_frontend
```

### Connection Refused?

Ensure:
1. Services container is running: `docker-compose -f docker-compose.services.yml ps`
2. Using correct host: `host.docker.internal` (Windows/Mac) or `localhost` (Linux)
3. Using correct port: `5433` for PostgreSQL, `6379` for Redis
4. Your project container can reach the host (networking configured correctly)

### pgAdmin Can't Connect to PostgreSQL?

1. Log in to pgAdmin: http://localhost:5050
2. Server is pre-configured as "Local PostgreSQL"
3. If connection fails, right-click server → Properties
4. Update hostname to `host.docker.internal` or `localhost`
5. Ensure database is running: `docker-compose -f docker-compose.services.yml logs postgres`

---

## 🔄 Stopping & Restarting Services

### Stop Services (Keep Data)

```bash
docker-compose -f docker-compose.services.yml down
```

Data persists in Docker volumes.

### Stop Services (Delete All Data)

```bash
docker-compose -f docker-compose.services.yml down -v
```

⚠️ **This deletes all databases and data!**

### Restart Services

```bash
docker-compose -f docker-compose.services.yml restart
```

### Update Services (Pull Latest Images)

```bash
docker-compose -f docker-compose.services.yml pull
docker-compose -f docker-compose.services.yml up -d
```

---

## 💾 Backup & Restore

### Backup PostgreSQL Database

```bash
# Backup to file
docker-compose -f docker-compose.services.yml exec postgres pg_dump -U postgres corporate_tasks > backup.sql

# Backup all databases
docker-compose -f docker-compose.services.yml exec postgres pg_dumpall -U postgres > full_backup.sql
```

### Restore PostgreSQL Database

```bash
# Restore from file
cat backup.sql | docker-compose -f docker-compose.services.yml exec -T postgres psql -U postgres

# Or
docker-compose -f docker-compose.services.yml exec postgres psql -U postgres < backup.sql
```

### Backup Redis Data

Redis automatically saves to disk with `--appendonly yes`. Backup the volume:

```bash
docker run --rm -v docker_redis_data:/data -v C:\Users\sinaiwater\Desktop\Docker\backups:/backup ubuntu tar czf /backup/redis_backup.tar.gz /data
```

---

## 🔐 Security Notes

### Change Default Passwords

Edit `.env.services`:

```env
POSTGRES_PASSWORD=your_secure_password_here
PGADMIN_PASSWORD=your_secure_pgadmin_password
```

Then restart:

```bash
docker-compose -f docker-compose.services.yml down
docker-compose -f docker-compose.services.yml up -d
```

### Limit Network Access

For production, restrict port exposure in `docker-compose.services.yml`:

```yaml
ports:
  - "127.0.0.1:5433:5432"  # Only localhost
```

### Never Commit Secrets

Add to `.gitignore`:

```
.env.services
backups/
```

---

## 📦 Environment Variables

### Default Values (.env.services)

```env
# PostgreSQL
POSTGRES_DB=corporate_tasks
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# pgAdmin
PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=admin

# Connection Strings
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5433/corporate_tasks
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

### Override in Project

Create `.env` in your project:

```env
DATABASE_URL=postgresql+asyncpg://postgres:password@host.docker.internal:5433/my_project_db
REDIS_URL=redis://host.docker.internal:6379/0
```

Docker Compose automatically loads `.env` file.

---

## 📋 File Structure

```
C:\Users\sinaiwater\Desktop\Docker\
├── docker-compose.services.yml    # Main services compose file
├── .env.services                  # Environment variables
├── SERVICES_SETUP.md              # This file
├── docker/
│   ├── postgres/
│   │   └── init.sql               # PostgreSQL initialization
│   └── pgadmin/
│       └── servers.json           # pgAdmin server config
├── backend/                       # (Optional) Backend code
├── frontend/                      # (Optional) Frontend code
└── backups/                       # (Optional) Database backups
```

---

## 🎯 Common Tasks

### Create New Database for Project

```bash
docker-compose -f docker-compose.services.yml exec postgres psql -U postgres -c "CREATE DATABASE new_project_db;"
```

### List All Databases

```bash
docker-compose -f docker-compose.services.yml exec postgres psql -U postgres -l
```

### Delete Database

```bash
docker-compose -f docker-compose.services.yml exec postgres psql -U postgres -c "DROP DATABASE project_db;"
```

### View Redis Keys

```bash
docker-compose -f docker-compose.services.yml exec redis redis-cli keys "*"
```

### Flush Redis Database

```bash
docker-compose -f docker-compose.services.yml exec redis redis-cli FLUSHALL
```

### Monitor Celery Tasks

```bash
docker-compose -f docker-compose.services.yml exec celery_worker celery -A app.worker.celery_app inspect active
```

---

## ❓ FAQ

**Q: Can I run multiple projects simultaneously?**  
A: Yes! Each project connects to the shared services. Just use different database names and Redis DB numbers.

**Q: Do I lose data when I stop services?**  
A: No, data persists in Docker volumes. Only delete with `down -v`.

**Q: What if port 5433 is already in use?**  
A: Stop conflicting containers or change port in `docker-compose.services.yml`: `"5434:5432"`

**Q: Can I use this on Linux?**  
A: Yes, but use `localhost` instead of `host.docker.internal` in connection strings.

**Q: How do I backup my databases?**  
A: Use `pg_dump` command shown in Backup & Restore section above.

**Q: Can I add more services (MongoDB, PostgreSQL 15, etc.)?**  
A: Yes, edit `docker-compose.services.yml` and add new services, then restart.

**Q: Is this suitable for production?**  
A: This setup is for development/staging. For production, use managed databases (RDS, CloudSQL) and separate container orchestration (Kubernetes, Docker Swarm).

---

## 📞 Quick Reference Commands

```bash
# Start services
docker-compose -f docker-compose.services.yml up -d

# Stop services
docker-compose -f docker-compose.services.yml down

# View running services
docker-compose -f docker-compose.services.yml ps

# View logs
docker-compose -f docker-compose.services.yml logs -f postgres

# Access PostgreSQL shell
docker-compose -f docker-compose.services.yml exec postgres psql -U postgres

# Access Redis CLI
docker-compose -f docker-compose.services.yml exec redis redis-cli

# Backup database
docker-compose -f docker-compose.services.yml exec postgres pg_dump -U postgres corporate_tasks > backup.sql

# Stop all containers (system-wide)
docker stop $(docker ps -aq)

# Remove all stopped containers
docker container prune -f

# View disk usage
docker system df
```

---

## 📝 Last Updated
Generated: 2026-07-01

For additional Docker documentation, visit: https://docs.docker.com/
