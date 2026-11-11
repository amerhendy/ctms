# نظام اختبارات التوظيف الإلكترونية — FastAPI + React

نظام متكامل لإدارة وتنفيذ اختبارات التوظيف الإلكترونية عبر الشبكة الداخلية،
مبني بمعمارية طبقية نظيفة:

- **Backend**: FastAPI (Python) — يعمل على المنفذ **5051**
- **Frontend**: React + Vite + Tailwind CSS — يعمل على المنفذ **5050**
- **قاعدة البيانات**: SQLite، مع معرّفات (IDs) بصيغة UUID في كل الجداول
- **الاعتماد الموحّد على نمط CRUD** عبر مستودع عام (`BaseRepository`) في كل أنحاء الباك اند

---

## 🏛️ هيكل المشروع

```text
project/
├── docker-compose.yml          # تشغيل الباك اند والفرونت اند معاً
│
├── backend/
│   ├── main.py                  # نقطة تشغيل FastAPI
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── api/v1/endpoints/         # نقاط النهاية (auth, job_models, applicants, questions, exam)
│   ├── core/                      # الإعدادات، الأمان، التبعيات المشتركة (Deps)
│   ├── db/                         # اتصال قاعدة البيانات + التهيئة والزرع الأولي
│   ├── helpers/                     # دوال مساعدة (تصحيح نصي، توليد PDF)
│   ├── models/                       # نماذج SQLAlchemy (UUID PK لكل جدول)
│   ├── repositories/                  # طبقة CRUD عامة لكل نموذج
│   ├── schemas/                        # Pydantic Schemas للتحقق من المدخلات/المخرجات
│   ├── services/                        # منطق الأعمال (تصحيح الاختبار، PDF، المصادقة)
│   └── tests/                            # اختبارات Pytest (auth + تدفق اختبار كامل)
│
└── frontend/
    ├── src/
    │   ├── api/                 # عملاء Axios + وحدات استدعاء كل مجموعة endpoints
    │   ├── components/           # عناصر واجهة قابلة لإعادة الاستخدام
    │   ├── constants/              # ثوابت مشتركة (أنواع الأسئلة، حالات المتقدم...)
    │   ├── hooks/                    # هوكس مخصصة (المؤقت، المزامنة، كشف المخالفات)
    │   ├── modals/                     # نوافذ منبثقة (تأكيد التسليم، إضافة سؤال)
    │   ├── pages/                       # صفحات التطبيق (المتقدم + لوحة تحكم الأدمن)
    │   ├── stores/                       # حالة التطبيق عبر Zustand (Auth + Exam)
    │   ├── styles/                        # Tailwind
    │   └── utils/                          # دوال مساعدة عامة
    ├── Dockerfile                # بناء متعدد المراحل + Nginx للتقديم على 5050
    ├── nginx.conf
    └── vite.config.js
```

---

## 🔐 آلية المصادقة (Session + Token)

بيانات الأدمن محفوظة في قاعدة البيانات (جدول `admins`، بكلمة مرور مُجزّأة عبر
PBKDF2-HMAC-SHA256). عند تسجيل الدخول:

1. يتحقق الخادم من اسم المستخدم وكلمة المرور.
2. يُنشئ سجل **جلسة (Session)** في جدول `sessions` بقاعدة البيانات، يحمل رمز
   دخول (Token) عشوائي فريد وتاريخ انتهاء صلاحية.
3. يُعاد هذا الرمز للواجهة الأمامية (JSON) ويُخزَّن أيضاً كـ httpOnly Cookie.
4. الواجهة الأمامية تخزّن الرمز في `localStorage` وترسله تلقائياً في ترويسة
   `Authorization: Bearer <token>` مع كل طلب لاحق عبر Axios Interceptor.
5. كل طلب محمي في الباك اند يتحقق من الرمز مقابل قاعدة البيانات (وليس فقط
   توقيعاً محلياً)، مما يسمح بإبطال الجلسات فوراً عند تسجيل الخروج.

نفس الآلية (جدول `sessions` بحقل `subject_type`) تُستخدم أيضاً لجلسات
المتقدمين أثناء أداء الاختبار.

---

## ⚙️ التشغيل بدون Docker

### 1) الباك اند (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # على ويندوز: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# عدّل ADMIN_DEFAULT_PASSWORD داخل .env قبل أول تشغيل

python main.py
```

سيعمل الباك اند على: `http://localhost:5051`
التوثيق التفاعلي لكل نقاط النهاية: `http://localhost:5051/docs`

### 2) الفرونت اند (React + Vite)

في نافذة طرفية جديدة:

```bash
cd frontend
npm install
npm run dev
```

سيعمل الفرونت اند على: `http://localhost:5050` (مع توجيه تلقائي لطلبات
`/api` نحو الباك اند على المنفذ 5051 عبر إعداد Proxy في `vite.config.js`).

---

## 🐳 التشغيل عبر Docker (الطريقة الموصى بها للإنتاج)

```bash
# من داخل مجلد project/ (يحتوي على docker-compose.yml)

# 1) عدّل كلمة مرور الأدمن في docker-compose.yml (ADMIN_DEFAULT_PASSWORD)

# 2) ابنِ وشغّل الحاويتين معاً
docker compose up -d --build

docker compose logs -f
docker compose down
```

- الباك اند: `http://localhost:5051`
- الفرونت اند: `http://localhost:5050`

قاعدة البيانات (`backend/db/data`) ومجلد الملفات المرفوعة (`backend/uploads`)
محفوظة عبر Docker Volumes، فلا تُفقد البيانات عند إعادة بناء/تشغيل الحاويات.

---

## 👤 حساب الأدمن الافتراضي

| الحقل | القيمة الافتراضية |
|---|---|
| اسم المستخدم | `admin` |
| كلمة المرور | `admin123` (بدون Docker) / `change-this-admin-password` (عبر docker-compose) |

**غيّرها فوراً** عبر متغير البيئة `ADMIN_DEFAULT_PASSWORD` قبل الاستخدام
الفعلي — يُزرع الحساب تلقائياً بهذه القيمة عند أول تشغيل فقط إن لم يوجد
حساب بنفس اسم المستخدم مسبقاً.

---

## 🌐 إعدادات الشبكة الداخلية والجدار الناري

لأن النظام يعمل على الشبكة الداخلية (Intranet):

1. **معرفة عنوان IP للجهاز المضيف:**
   - ويندوز: `ipconfig`
   - لينكس: `ip addr show` أو `hostname -I`

2. **فتح المنفذين 5050 (الواجهة) و5051 (الباك اند) في جدار الحماية:**
   - **ويندوز (PowerShell كمسؤول):**
     ```powershell
     New-NetFirewallRule -DisplayName "Exam System Frontend" -Direction Inbound -LocalPort 5050 -Protocol TCP -Action Allow
     New-NetFirewallRule -DisplayName "Exam System Backend" -Direction Inbound -LocalPort 5051 -Protocol TCP -Action Allow
     ```
   - **لينكس (UFW):**
     ```bash
     sudo ufw allow 5050/tcp
     sudo ufw allow 5051/tcp
     ```

3. **تحديث CORS في الباك اند:** إذا كان المتقدمون سيصلون للواجهة عبر عنوان
   IP للسيرفر (وليس `localhost`)، حدّث متغير `CORS_ORIGINS` في `.env` أو
   `docker-compose.yml` ليتضمن `http://<IP-السيرفر>:5050`.

4. يفتح كل متقدم من جهازه: `http://<IP-السيرفر>:5050/`
   ولوحة تحكم الأدمن على: `http://<IP-السيرفر>:5050/admin`

---

## 🧪 تشغيل الاختبارات (Backend)

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

يغطي ذلك: تسجيل دخول/خروج الأدمن، حماية المسارات، وتدفق اختبار كامل
(إنشاء نموذج وظيفة → أسئلة → متقدم → دخول → إجابة → تسليم → تحميل PDF).

---

## 🧵 آلية التزامن ومنع قفل قاعدة البيانات

- `PRAGMA journal_mode=WAL` و`busy_timeout=30000` مفعّلان في `db/session.py`.
- عند حدوث قفل مؤقت، تعيد `services/sync_service.py` المحاولة تلقائياً حتى
  3 مرات بتأخير تصاعدي بسيط.
- من جهة الواجهة، تُحفظ كل إجابة فوراً محلياً (Zustand + `localStorage`) ثم
  تُزامَن مع الخادم كل 15 ثانية أو عند عودة الاتصال بالشبكة — بحيث لا تُفقد
  أي إجابة حتى عند انقطاع الكهرباء أو الشبكة أثناء الاختبار.

---

## 🔒 ملاحظات أمنية قبل الاستخدام الفعلي

- غيّر `ADMIN_DEFAULT_PASSWORD` فوراً.
- النظام مصمم لشبكة داخلية موثوقة؛ لا يُنصح بتعريضه مباشرة للإنترنت العام
  دون طبقة حماية إضافية (HTTPS عبر Reverse Proxy، مصادقة إضافية على مستوى
  الشبكة).
- رموز الجلسات (Tokens) مخزّنة كنص صريح في قاعدة البيانات لتبسيط الإبطال
  الفوري؛ هذا مقبول لبيئة داخلية مغلقة، لكن يُفضّل تفعيل HTTPS كطبقة نقل
  آمنة قبل أي استخدام على شبكة أوسع.
