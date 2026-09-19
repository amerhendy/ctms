# Docker Commands Documentation - Session Reference

دليل شامل لجميع أوامر Docker المستخدمة في جلسة إصلاح مشكلة Vite File Watcher

---

## 1. Docker Compose Build

### الأمر
```bash
docker compose build frontend
```

### الوصف
بناء صورة Docker لخدمة معينة من ملف `docker-compose.yml`. في هذه الحالة، يتم بناء خدمة `frontend`.

### الخيارات الشائعة
- `--no-cache` - بناء بدون استخدام الـ cache
- `--pull` - سحب أحدث إصدار من الصور الأساسية
- `-q, --quiet` - إخفاء سجل البناء

### الاستخدام
```bash
docker compose build                    # بناء جميع الخدمات
docker compose build frontend           # بناء خدمة واحدة
docker compose build --no-cache         # بناء بدون cache
```

**المصدر:** https://docs.docker.com/reference/cli/docker/compose/build/

---

## 2. Docker Compose Up

### الأمر
```bash
docker compose up frontend -d
```

### الوصف
إنشاء وتشغيل حاويات الخدمات المحددة في `docker-compose.yml`. يمكن تشغيل جميع الخدمات أو خدمة واحدة فقط.

### الخيارات المهمة
- `-d, --detach` - تشغيل الحاويات في الخلفية (لا تظهر السجلات)
- `--pull always` - سحب أحدث صور قبل البدء
- `-f FILE` - تحديد ملف compose مخصص
- `--scale SERVICE=NUM` - تشغيل عدة نسخ من خدمة

### الاستخدام
```bash
docker compose up                       # تشغيل جميع الخدمات مع عرض السجلات
docker compose up -d                   # تشغيل في الخلفية
docker compose up frontend              # تشغيل خدمة واحدة
docker compose up -d --pull always      # سحب أحدث صور وتشغيل
```

**المصدر:** https://docs.docker.com/reference/cli/docker/compose/up/

---

## 3. Docker Compose Logs

### الأمر
```bash
docker compose logs frontend --tail 50
```

### الوصف
عرض سجلات (logs) الحاويات. يساعد في تتبع الأخطاء ومراقبة النشاط.

### الخيارات الشهيرة
- `--tail NUM` - عرض آخر N سطر (افتراضي: الكل)
- `-f, --follow` - متابعة السجلات الحية (مثل `tail -f`)
- `--timestamps` - إضافة الطوابع الزمنية
- `--no-log-prefix` - إخفاء بادئة اسم الخدمة

### الاستخدام
```bash
docker compose logs                     # عرض سجلات جميع الخدمات
docker compose logs frontend            # عرض سجلات خدمة واحدة
docker compose logs -f                  # متابعة السجلات الحية
docker compose logs --tail 100          # عرض آخر 100 سطر
docker compose logs frontend --tail 50  # عرض آخر 50 سطر لخدمة واحدة
```

**المصدر:** https://docs.docker.com/reference/cli/docker/compose/logs/

---

## 4. Docker Compose Down

### الأمر
```bash
docker compose down
```

### الوصف
إيقاف وحذف جميع الحاويات والشبكات المحددة في `docker-compose.yml`.

### الخيارات
- `-v, --volumes` - حذف الـ volumes أيضاً
- `--remove-orphans` - حذف الحاويات اليتيمة

### الاستخدام
```bash
docker compose down                     # إيقاف وحذف الحاويات والشبكات
docker compose down -v                  # حذف الـ volumes أيضاً
docker compose down --remove-orphans    # حذف جميع الحاويات اليتيمة
```

**المصدر:** https://docs.docker.com/reference/cli/docker/compose/down/

---

## 5. Docker Compose Ps

### الأمر
```bash
docker compose ps
```

### الوصف
عرض قائمة بحاويات الخدمات الحالية وحالتها.

### الخيارات
- `-a, --all` - عرض جميع الحاويات (بما فيها المتوقفة)
- `-q, --quiet` - عرض معرفات الحاويات فقط

### الاستخدام
```bash
docker compose ps                       # عرض الحاويات المشغلة
docker compose ps -a                   # عرض جميع الحاويات
```

**المصدر:** https://docs.docker.com/reference/cli/docker/compose/ps/

---

## 6. Docker Compose Exec

### الأمر
```bash
docker compose exec frontend npm run dev
```

### الوصف
تنفيذ أمر داخل حاوية مشغلة بالفعل.

### الخيارات
- `-d, --detach` - تنفيذ الأمر في الخلفية
- `-i, --interactive` - إبقاء STDIN مفتوح حتى لو لم يكن متصل
- `-t, --tty` - تخصيص pseudo-TTY
- `-w, --workdir` - تعيين دليل العمل

### الاستخدام
```bash
docker compose exec frontend bash       # فتح bash في الحاوية
docker compose exec frontend npm run build
docker compose exec -it frontend bash   # bash تفاعلي
```

**المصدر:** https://docs.docker.com/reference/cli/docker/compose/exec/

---

## 7. Docker Compose Stop

### الأمر
```bash
docker compose stop
```

### الوصف
إيقاف الحاويات المشغلة بدون حذفها.

### الخيارات
- `-t, --timeout` - عدد الثواني قبل فرض الإيقاف

### الاستخدام
```bash
docker compose stop                     # إيقاف جميع الحاويات
docker compose stop frontend            # إيقاف خدمة واحدة
docker compose stop -t 30               # إيقاف مع انتظار 30 ثانية
```

**المصدر:** https://docs.docker.com/reference/cli/docker/compose/stop/

---

## 8. Docker Compose Start

### الأمر
```bash
docker compose start
```

### الوصف
إعادة تشغيل حاويات متوقفة بالفعل (لا تنشئ حاويات جديدة).

### الاستخدام
```bash
docker compose start                    # إعادة تشغيل جميع الحاويات المتوقفة
docker compose start frontend           # إعادة تشغيل خدمة واحدة
```

**المصدر:** https://docs.docker.com/reference/cli/docker/compose/start/

---

## 9. Docker Compose Restart

### الأمر
```bash
docker compose restart
```

### الوصف
إعادة تشغيل الحاويات (إيقاف ثم بدء).

### الاستخدام
```bash
docker compose restart                  # إعادة تشغيل جميع الحاويات
docker compose restart frontend         # إعادة تشغيل خدمة واحدة
```

**المصدر:** https://docs.docker.com/reference/cli/docker/compose/restart/

---

## 10. Docker Logs (حاوية واحدة)

### الأمر
```bash
docker logs <container_id_or_name>
```

### الوصف
عرض سجلات حاوية Docker محددة (بدون docker-compose).

### الخيارات
- `-f, --follow` - متابعة السجلات الحية
- `--tail NUM` - عرض آخر N سطر
- `-t, --timestamps` - إضافة الطوابع الزمنية

### الاستخدام
```bash
docker logs ctms_frontend               # عرض سجلات الحاوية
docker logs -f ctms_frontend            # متابعة السجلات
docker logs --tail 100 ctms_frontend    # عرض آخر 100 سطر
```

**المصدر:** https://docs.docker.com/reference/cli/docker/container/logs/

---

## 11. Docker Ps (قائمة الحاويات)

### الأمر
```bash
docker ps
```

### الوصف
عرض قائمة الحاويات المشغلة حالياً.

### الخيارات
- `-a, --all` - عرض جميع الحاويات (بما فيها المتوقفة)
- `-q, --quiet` - عرض معرفات الحاويات فقط
- `-n NUM` - عرض آخر N حاوية

### الاستخدام
```bash
docker ps                               # الحاويات المشغلة فقط
docker ps -a                            # جميع الحاويات
docker ps -q                            # معرفات الحاويات المشغلة فقط
docker ps -aq                           # معرفات جميع الحاويات
docker ps -a --filter status=exited     # الحاويات المتوقفة فقط
```

**المصدر:** https://docs.docker.com/reference/cli/docker/container/ls/

---

## 12. Docker Inspect

### الأمر
```bash
docker inspect <container_id>
```

### الوصف
عرض معلومات تفصيلية جداً عن حاوية أو صورة (JSON format).

### الاستخدام
```bash
docker inspect ctms_frontend            # معلومات كاملة عن الحاوية
docker inspect -f '{{json .NetworkSettings}}' ctms_frontend
```

**المصدر:** https://docs.docker.com/reference/cli/docker/inspect/

---

## 13. Docker Stop

### الأمر
```bash
docker stop <container_id>
```

### الوصف
إيقاف حاوية واحدة أو أكثر.

### الاستخدام
```bash
docker stop ctms_frontend               # إيقاف حاوية واحدة
docker stop ctms_frontend ctms_backend  # إيقاف عدة حاويات
docker stop $(docker ps -q)             # إيقاف جميع الحاويات المشغلة
```

**المصدر:** https://docs.docker.com/reference/cli/docker/container/stop/

---

## 14. Docker Rm (حذف الحاويات)

### الأمر
```bash
docker rm <container_id>
```

### الوصف
حذف حاوية متوقفة. (يجب إيقافها أولاً أو استخدام `-f`)

### الخيارات
- `-f, --force` - فرض الحذف حتى لو كانت مشغلة
- `-v, --volumes` - حذف الـ volumes المرتبطة

### الاستخدام
```bash
docker rm ctms_frontend                 # حذف حاوية متوقفة
docker rm -f ctms_frontend              # فرض الحذف
docker rm -v ctms_frontend              # حذف مع الـ volumes
```

**المصدر:** https://docs.docker.com/reference/cli/docker/container/rm/

---

## 15. Docker Images

### الأمر
```bash
docker images
```

### الوصف
عرض قائمة الصور المحفوظة محلياً.

### الخيارات
- `-q, --quiet` - عرض معرفات الصور فقط
- `-a, --all` - عرض جميع الصور بما فيها الوسيطة
- `--filter` - تصفية الصور

### الاستخدام
```bash
docker images                           # جميع الصور
docker images -q                        # معرفات الصور فقط
docker images | grep frontend           # صور تحتوي على "frontend"
```

**المصدر:** https://docs.docker.com/reference/cli/docker/image/ls/

---

## ملخص الأوامر المستخدمة في الجلسة

| الأمر | الغرض |
|-------|-------|
| `docker compose build frontend` | بناء صورة Frontend |
| `docker compose up frontend -d` | تشغيل Frontend في الخلفية |
| `docker compose logs frontend --tail 50` | عرض آخر 50 سطر من السجلات |
| `docker compose ps` | عرض حالة الخدمات |
| `docker ps -a` | عرض جميع الحاويات |
| `docker logs <container>` | عرض سجلات حاوية |
| `docker inspect <container>` | معلومات تفصيلية عن حاوية |
| `docker compose down` | إيقاف وحذف جميع الخدمات |

---

## ملفات تم تعديلها

### 1. `.dockerignore`
استبعاد الملفات غير المهمة من البناء (تسريع البناء):
```
node_modules
.git
.env
dist
.DS_Store
.vscode
```

### 2. `Dockerfile`
إضافة healthcheck:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5173', ...)"
```

### 3. `package.json`
إضافة `"type": "module"` لحل تحذيرات ESM.

### 4. `vite.config.js`
تفعيل polling وتصحيح المنافذ:
```javascript
watch: {
  usePolling: true,
  interval: 1000,
}
```

### 5. `docker-compose.yml`
- إضافة `WATCHPACK_POLLING: true`
- تغيير volume إلى `:delegated`
- إضافة healthcheck

---

## المراجع الرسمية

- Docker Compose Documentation: https://docs.docker.com/compose/
- Docker CLI Reference: https://docs.docker.com/reference/cli/docker/
- Docker Compose Reference: https://docs.docker.com/reference/cli/docker/compose/

---

## نصائح مهمة

1. **استخدم `-d` دائماً** عند التطوير لتشغيل الخدمات في الخلفية
2. **تابع السجلات مباشرة** باستخدام `docker compose logs -f`
3. **استخدم `--pull always`** للتأكد من الحصول على أحدث صورة
4. **حذر من `-v` عند `rm`** - قد يؤدي لفقدان البيانات
5. **استخدم `:delegated`** على Docker Desktop للأداء الأفضل

---

**تاريخ التحديث:** 2026-05-22
**الجلسة:** إصلاح مشكلة Vite File Watcher EIO Error
