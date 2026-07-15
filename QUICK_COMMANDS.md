# Docker Quick Commands

## Start Everything

### 1️⃣ Start Services Container (PostgreSQL, Redis, pgAdmin, Celery)
```bash
cd C:\Users\sinaiwater\Desktop\Docker
docker-compose -f docker-compose.services.yml up -d
```

### 2️⃣ Start Main Project (Backend, Frontend, Nginx)
```bash
cd C:\Users\sinaiwater\Desktop\Docker
docker-compose up -d
```

### 3️⃣ Start Everything (Services + Project)
```bash
# Terminal 1
cd C:\Users\sinaiwater\Desktop\Docker
docker-compose -f docker-compose.services.yml up -d

# Terminal 2
cd C:\Users\sinaiwater\Desktop\Docker
docker-compose up -d
```

---

## Access Services

| Service | URL | Login |
|---------|-----|-------|
| **Frontend** | http://localhost:5173 | - |
| **Backend API** | http://localhost:3000 | - |
| **Nginx (Reverse Proxy)** | http://localhost:80 | - |
| **pgAdmin** | http://localhost:5050 | admin@example.com / admin |
| **PostgreSQL** | localhost:5433 | postgres / password |
| **Redis** | localhost:6379 | (no auth) |

---

## Check Status

```bash
# Services container
cd C:\Users\sinaiwater\Desktop\Docker
docker-compose -f docker-compose.services.yml ps

# Main project
cd C:\Users\sinaiwater\Desktop\Docker
docker-compose ps
```

---

## View Logs

```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# PostgreSQL logs
docker-compose -f docker-compose.services.yml logs -f postgres

# Redis logs
docker-compose -f docker-compose.services.yml logs -f redis

# All logs
docker-compose logs -f
```

---

## Stop Services

```bash
# Stop main project
docker-compose down

# Stop services container
docker-compose -f docker-compose.services.yml down

# Stop everything
docker-compose down
docker-compose -f docker-compose.services.yml down
```

---

## Rebuild & Restart

```bash
# Rebuild and start
docker-compose up -d --build

# Force rebuild (ignore cache)
docker-compose build --no-cache
docker-compose up -d
```

---

## Database Commands

```bash
# Connect to PostgreSQL
docker exec services_postgres psql -U postgres -d corporate_tasks

# Backup database
docker exec services_postgres pg_dump -U postgres corporate_tasks > backup.sql

# List databases
docker exec services_postgres psql -U postgres -l

# List extensions
docker exec services_postgres psql -U postgres -d corporate_tasks -c "SELECT * FROM pg_extension;"
```

---

## Redis Commands

```bash
# Connect to Redis CLI
docker exec services_redis redis-cli

# Check Redis
docker exec services_redis redis-cli ping

# List keys
docker exec services_redis redis-cli keys "*"
```

---

## Celery Commands

```bash
# View active tasks
docker exec services_celery_worker celery -A app.worker.celery_app inspect active

# View stats
docker exec services_celery_worker celery -A app.worker.celery_app inspect stats

# View registered tasks
docker exec services_celery_worker celery -A app.worker.celery_app inspect registered
```

---

## Clean Up

```bash
# Remove stopped containers
docker container prune -f

# Remove unused images
docker image prune -f

# Remove all volumes (DELETES DATA!)
docker volume prune -f

# Show disk usage
docker system df
```

---

## Troubleshooting

### Backend not connecting to database?
```bash
# Check if services container is running
docker-compose -f docker-compose.services.yml ps

# Check backend logs
docker-compose logs backend

# Test connection manually
docker exec services_postgres psql -U postgres -d corporate_tasks -c "SELECT 1;"
```

### pgAdmin can't connect to PostgreSQL?
1. Go to http://localhost:5050
2. Click on "Servers" → "PostgreSQL Services"
3. If connection fails, check host is `services_postgres` (not localhost)

### Port already in use?
```bash
# Find what's using port 5173
netstat -ano | findstr :5173

# Kill the process (replace PID with actual PID)
taskkill /PID <PID> /F
```

### Need to rebuild?
```bash
docker-compose build --no-cache backend
docker-compose build --no-cache frontend
```

---

## Key Files Location

```
C:\Users\sinaiwater\Desktop\Docker\
├── docker-compose.yml                    # Main project (backend, frontend, nginx)
├── docker-compose.services.yml           # Services (postgres, redis, celery, pgadmin)
├── .env.services                         # Services environment variables
├── docker/
│   ├── postgres/
│   │   └── init.sql                      # PostgreSQL initialization
│   ├── pgadmin/
│   │   └── servers.json                  # pgAdmin server config
│   └── nginx/
│       └── nginx.conf                    # Nginx configuration
├── backend/                              # Backend code
├── frontend/                             # Frontend code
└── SERVICES_COMPLETE_GUIDE.md            # Full documentation
```

---

## Notes

- Use `host.docker.internal` for Windows/Mac to connect from containers to host
- Use `localhost` for Linux
- PostgreSQL is on port **5433** (not 5432) to avoid conflicts
- Each service has health checks configured
- All data persists in Docker volumes - only deleted with `down -v`
