# Odoo + Celery Integration Guide
# This file explains how to use Celery with Odoo

## ═══════════════════════════════════════════════════════════════════════════
## Celery Configuration for Odoo
## ═══════════════════════════════════════════════════════════════════════════

### Celery Services Available:
1. **services_celery_worker** - Processes async tasks (port independent)
2. **services_celery_beat** - Scheduled tasks (cron-like scheduler)
3. **services_redis** - Message broker & result backend (port 6379)

### Connection Details:
- **Broker URL**: redis://redis:6379/1
- **Result Backend**: redis://redis:6379/2
- **Cache**: redis://redis:6379/0

## ═══════════════════════════════════════════════════════════════════════════
## Setup Odoo with Celery
## ═══════════════════════════════════════════════════════════════════════════

### 1. Install Celery in Odoo
```bash
docker exec -it ctms_odoo bash
pip install celery redis kombu
```

### 2. Configure Celery in Odoo Addons

Create `E:\docker\odoo\addons\celery_config\__manifest__.py`:

```python
{
    'name': 'Celery Configuration',
    'version': '18.0.1.0.0',
    'category': 'Tools',
    'depends': ['base'],
    'external_dependencies': {
        'python': ['celery', 'redis'],
    },
    'data': [],
    'installable': True,
}
```

### 3. Use Celery in Odoo Models

Example in your custom addon:

```python
from celery import shared_task
from odoo.models import Model, fields

class MyModel(Model):
    _name = 'my.model'
    
    name = fields.Char('Name')
    
    def process_heavy_task(self):
        """Called from Odoo, delegates to Celery"""
        heavy_processing.delay(self.id)

@shared_task
def heavy_processing(record_id):
    """Runs asynchronously in Celery worker"""
    record = env['my.model'].browse(record_id)
    # Do heavy processing
    return True
```

## ═══════════════════════════════════════════════════════════════════════════
## Monitoring Celery Tasks
## ═══════════════════════════════════════════════════════════════════════════

### View Worker Status
```bash
docker exec -it services_celery_worker bash
celery -A odoo inspect active
celery -A odoo inspect stats
```

### Monitor Celery Logs
```bash
# Worker logs
docker logs services_celery_worker -f

# Beat logs (scheduler)
docker logs services_celery_beat -f
```

### Install Flower (Celery Monitoring UI)

Add to docker-compose.services.yml:

```yaml
flower:
    image: mher/flower:latest
    container_name: services_flower
    environment:
      CELERY_BROKER_URL: redis://redis:6379/1
      CELERY_RESULT_BACKEND: redis://redis:6379/2
    ports:
      - "5555:5555"
    depends_on:
      - redis
      - celery_worker
    restart: unless-stopped
```

Then access: http://localhost:5555

## ═══════════════════════════════════════════════════════════════════════════
## Common Celery Tasks in Odoo
## ═══════════════════════════════════════════════════════════════════════════

### 1. Send Emails Asynchronously
```python
# In Odoo mail module
from celery import shared_task

@shared_task
def send_mail_async(mail_id):
    mail = env['mail.mail'].browse(mail_id)
    mail.send()
```

### 2. Generate Reports in Background
```python
@shared_task
def generate_report_async(report_id, data):
    # Heavy report generation
    return True
```

### 3. Scheduled Tasks (Using Celery Beat)
```python
# In Odoo model
from celery.schedules import crontab

# Schedule task every hour
CELERY_BEAT_SCHEDULE = {
    'sync-data': {
        'task': 'my_addon.tasks.sync_data',
        'schedule': crontab(minute=0),  # Every hour
    },
}
```

## ═══════════════════════════════════════════════════════════════════════════
## Troubleshooting
## ═══════════════════════════════════════════════════════════════════════════

### Tasks not running?
1. Check Redis is running: `docker logs services_redis`
2. Check Worker is running: `docker logs services_celery_worker`
3. Verify connection: `redis-cli -p 6379 ping`

### Worker keeps restarting?
- Check for Python import errors in logs
- Ensure requirements.txt includes celery and redis
- Check database connectivity

### Beat scheduler not working?
- Ensure `services_celery_beat` container is running
- Check Beat logs: `docker logs services_celery_beat -f`
- Verify Redis connection on port 6379

## ═══════════════════════════════════════════════════════════════════════════
## Performance Tips
## ═══════════════════════════════════════════════════════════════════════════

1. **Increase Worker Concurrency**
   Edit docker-compose.services.yml:
   ```bash
   celery -A app.worker.celery_app worker --loglevel=info -c 4  # 4 workers
   ```

2. **Use Task Priority**
   ```python
   @shared_task
   def priority_task():
       pass
   
   priority_task.apply_async(priority=10)
   ```

3. **Set Task Timeouts**
   ```python
   @shared_task(time_limit=300)  # 5 minutes max
   def long_task():
       pass
   ```

4. **Monitor Redis Memory**
   ```bash
   redis-cli INFO memory
   ```

## ═══════════════════════════════════════════════════════════════════════════
## References
## ═══════════════════════════════════════════════════════════════════════════

- Celery Documentation: https://docs.celeryproject.io/
- Odoo + Celery: https://www.odoo.com/documentation/
- Redis Documentation: https://redis.io/documentation
- Flower (Monitoring): https://flower.readthedocs.io/
