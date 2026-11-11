# Odoo Integration Summary

## ✅ What's Been Set Up

Your Odoo installation is now configured to use all your existing services:

### Services Integration
- **PostgreSQL**: Existing database container - Odoo creates its own schema (`odoo`)
- **Redis**: Existing cache/message broker - Odoo shares Redis with your other services
- **Celery Worker**: Processes async tasks for Odoo
- **Celery Beat**: Scheduler for periodic Odoo tasks

### Directory Structure
```
E:\docker\
├── odoo/
│   ├── addons/          ← Place custom Odoo modules here
│   ├── sources/         ← Odoo source code volume
│   └── filestore/       ← Odoo attachments (auto-created)
├── backend/             ← Your existing backend
├── frontend/            ← Your existing frontend
├── docker/
│   ├── nginx/
│   │   ├── nginx.conf   ← Main config
│   │   └── odoo.conf    ← NEW: Odoo proxy config (optional)
│   └── postgres/
│       ├── init.sql     ← Existing init
│       └── odoo_init.sql ← NEW: Odoo database init
├── docker-compose.yml   ← UPDATED: Added Odoo service
├── docker-compose.services.yml ← PostgreSQL, Redis, Celery
├── start_odoo.bat       ← NEW: Quick start script
├── ODOO_SETUP.md        ← NEW: Full setup guide
├── CELERY_ODOO_GUIDE.md ← NEW: Celery integration guide
└── .env.example         ← NEW: Environment variables template
```

## 🚀 Quick Start

### 1. Start All Services
```bash
# Option A: Use batch script (Windows)
start_odoo.bat

# Option B: Manual commands
docker-compose -f docker-compose.services.yml up -d
docker-compose up -d
```

### 2. Access Odoo
- **URL**: http://localhost:8069
- **Chat/Longpolling**: http://localhost:8071
- Database setup wizard will appear on first visit

### 3. Create Odoo Database
1. Follow the setup wizard at http://localhost:8069
2. Enter database name (e.g., `odoo`)
3. Set admin user and password
4. Select modules to install

## 📋 Configuration Reference

### Odoo Service (docker-compose.yml)
```yaml
odoo:
  image: odoo:18-latest
  container_name: ctms_odoo
  environment:
    HOST: postgres
    PORT: 5432
    DB_NAME: odoo
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: password
    REDIS_URL: redis://host.docker.internal:6379/0
  ports:
    - "8069:8069"    # Main interface
    - "8071:8071"    # Chat/Longpolling
  depends_on:
    - postgres       # PostgreSQL (5433)
    - redis          # Redis (6379)
  volumes:
    - ./odoo/addons:/mnt/extra-addons
    - ./odoo/sources:/app
    - odoo_data:/var/lib/odoo
```

### Database Connection
- **Host**: `postgres` (inside Docker network)
- **Port**: `5432` (internal), `5433` (external from localhost)
- **User**: `postgres`
- **Password**: `password`
- **Database**: Created by Odoo during setup

### Redis Connection
- **URL**: `redis://redis:6379/0`
- **For Celery Broker**: `redis://redis:6379/1`
- **For Results**: `redis://redis:6379/2`

## 🔌 Port Map
| Service | Port | URL |
|---------|------|-----|
| Odoo Web | 8069 | http://localhost:8069 |
| Odoo Chat | 8071 | http://localhost:8071 |
| Backend | 3000 | http://localhost:3000 |
| Frontend | 5173 | http://localhost:5173 |
| Nginx | 80 | http://localhost |
| pgAdmin | 5050 | http://localhost:5050 |
| PostgreSQL | 5433 | localhost:5433 |
| Redis | 6379 | localhost:6379 |

## 📝 Important Notes

### Custom Addons
1. Place your custom Odoo modules in `E:\docker\odoo\addons/`
2. Module structure:
   ```
   odoo/addons/
   ├── my_module/
   │   ├── __init__.py
   │   ├── __manifest__.py
   │   ├── models/
   │   ├── views/
   │   ├── static/
   │   └── data/
   ```
3. Install via Odoo UI: Apps → Search → Install

### Database
- **Single Database**: Odoo uses its own schema in the shared PostgreSQL
- **No Separate Container**: Saves resources, easier maintenance
- **Backup**: Existing PostgreSQL backups include Odoo data

### Celery Integration
- **Async Tasks**: Ready to use with Celery decorators
- **Scheduled Jobs**: Configure in Celery Beat for periodic tasks
- **Monitoring**: Use Flower for task monitoring (see CELERY_ODOO_GUIDE.md)

## 🛠️ Common Commands

### View Logs
```bash
# Odoo
docker logs ctms_odoo -f

# Celery Worker
docker logs services_celery_worker -f

# Celery Beat
docker logs services_celery_beat -f

# Redis
docker logs services_redis -f
```

### Database Management
```bash
# Access pgAdmin: http://localhost:5050
# Username: admin@example.com
# Password: admin

# Or use psql:
docker exec -it services_postgres psql -U postgres -c "SELECT datname FROM pg_database;"
```

### Restart Services
```bash
# Restart Odoo
docker-compose restart odoo

# Restart all
docker-compose restart

# Stop all
docker-compose down
```

## 📚 Documentation Files Created

1. **ODOO_SETUP.md** - Complete setup and configuration guide
2. **CELERY_ODOO_GUIDE.md** - Celery integration with Odoo
3. **.env.example** - Environment variables template
4. **docker/nginx/odoo.conf** - Nginx proxy configuration (optional)
5. **docker/postgres/odoo_init.sql** - Database initialization script

## ⚠️ Troubleshooting

### Odoo won't start
```bash
# Check logs
docker logs ctms_odoo -f

# Verify PostgreSQL is healthy
docker logs services_postgres

# Verify Redis is running
docker logs services_redis
```

### Can't connect to database
- Ensure `services_postgres` is running and healthy
- Check credentials in environment variables
- Verify database name matches in Odoo setup

### Celery tasks not working
- Ensure `services_celery_worker` is running
- Check `services_redis` is healthy
- Review worker logs: `docker logs services_celery_worker -f`

### Port conflicts
- Odoo (8069, 8071)
- PostgreSQL (5433)
- Redis (6379)
- If in use, update in docker-compose.yml

## 🔒 Security Reminders

1. **Change Default Passwords**
   - PostgreSQL: `password` → secure password
   - pgAdmin: `admin` → secure password
   - Update in `.env` file

2. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Update sensitive values
   - Never commit `.env` to version control

3. **Secret Keys**
   - Generate new SECRET_KEY for backend
   - Use strong passwords for all services

## 📞 Need Help?

- **Odoo Docs**: https://www.odoo.com/documentation/
- **Docker Docs**: https://docs.docker.com/
- **Celery Docs**: https://docs.celeryproject.io/
- **Redis Docs**: https://redis.io/documentation

---

**Setup Date**: 2024
**Odoo Version**: 18.0 (Latest)
**PostgreSQL Version**: 16-Alpine
**Redis Version**: 7-Alpine
**Docker Compose Version**: 3.0+

All services are configured and ready to use!
