# Odoo Setup Guide

## ✅ Setup Summary
Odoo has been configured to use your existing infrastructure:

- **Database**: Uses PostgreSQL database (same services container on port 5433)
- **Cache & Message Broker**: Uses Redis (port 6379)
- **Celery Worker**: For async tasks
- **Celery Beat**: For scheduled tasks
- **Ports**: 
  - `8069` - Odoo main interface
  - `8071` - Odoo chat/longpolling

## 📁 Directory Structure
```
E:\docker\
├── odoo/
│   ├── addons/          ← Custom addons folder
│   ├── sources/         ← Odoo source code (mounted from container)
│   └── ...
├── docker-compose.yml   (main compose file with Odoo)
├── docker-compose.services.yml (PostgreSQL, Redis, Celery)
└── ...
```

## 🚀 Start Services

### 1. Start Shared Services (PostgreSQL, Redis, Celery)
```bash
docker-compose -f docker-compose.services.yml up -d
```

### 2. Start Everything (including Odoo)
```bash
docker-compose up -d
```

### 3. Create Odoo Database
After containers are running, access Odoo:
- Go to `http://localhost:8069`
- Follow the setup wizard to create database
- Choose your database name (default: `odoo`)

## 🔧 Configuration

### Environment Variables (.env)
```
POSTGRES_DB=corporate_tasks
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
ODOO_DB=odoo
PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=admin
```

### Odoo Connection Details
- **Host**: `postgres` (inside Docker network)
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `password`
- **Database**: Auto-created when you run setup wizard

### Redis Connection
- **URL**: `redis://redis:6379/0`
- **Used for**: Session cache, task queue

### Celery Configuration
- **Broker**: `redis://redis:6379/1`
- **Result Backend**: `redis://redis:6379/2`
- **Worker**: `services_celery_worker` container
- **Beat**: `services_celery_beat` container

## 📊 Management Interfaces

### pgAdmin (PostgreSQL Management)
- **URL**: `http://localhost:5050`
- **Email**: `admin@example.com`
- **Password**: `admin`

### Odoo Admin Interface
- **URL**: `http://localhost:8069`
- **Default User**: `admin`
- **Default Password**: (set during database creation)

## 📝 Important Notes

1. **Database Creation**: The database is created inside the same PostgreSQL container as your other services
2. **Custom Addons**: Place your custom modules in `E:\docker\odoo\addons/`
3. **Source Code**: Mount at `./odoo/sources` if you need to modify Odoo source
4. **Celery Tasks**: Configured and ready to use with Odoo's built-in task system
5. **Networking**: Uses `host.docker.internal` for Windows/Mac to reach services

## 🛠️ Common Commands

### View Logs
```bash
# Odoo logs
docker logs ctms_odoo -f

# Celery Worker logs
docker logs services_celery_worker -f

# Celery Beat logs
docker logs services_celery_beat -f
```

### Stop Services
```bash
docker-compose down
docker-compose -f docker-compose.services.yml down
```

### Restart Odoo
```bash
docker-compose restart odoo
```

### Access Odoo Shell
```bash
docker exec -it ctms_odoo bash
```

## 🔌 Port Mapping
| Service | Internal Port | External Port | URL |
|---------|---------------|---------------|-----|
| Odoo    | 8069          | 8069          | http://localhost:8069 |
| Odoo (chat) | 8071      | 8071          | http://localhost:8071 |
| PostgreSQL | 5432       | 5433          | localhost:5433 |
| Redis   | 6379          | 6379          | localhost:6379 |
| pgAdmin | 80            | 5050          | http://localhost:5050 |
| Backend | 3000          | 3000          | http://localhost:3000 |
| Frontend | 5173         | 5173          | http://localhost:5173 |
| Nginx   | 80            | 80            | http://localhost |

## ⚠️ Troubleshooting

### Odoo won't connect to database
- Check PostgreSQL is running: `docker logs services_postgres`
- Verify credentials in environment variables
- Ensure database name matches in Odoo setup

### Celery tasks not running
- Check Redis is running: `docker logs services_redis`
- View worker logs: `docker logs services_celery_worker -f`
- Check Beat logs: `docker logs services_celery_beat -f`

### Port already in use
- Stop containers: `docker-compose down`
- Or change ports in docker-compose.yml

## 📚 References
- [Odoo Documentation](https://www.odoo.com/documentation/)
- [Odoo Docker Hub](https://hub.docker.com/_/odoo)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Redis Docker](https://hub.docker.com/_/redis)
