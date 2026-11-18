# تک نیوز — سایت خبری فناوری (فارسی، RTL)

سایت خبری فناوری با فرانت HTML/CSS/JS خالص، یک لایه پیکربندی npm (Vite) و یک API ساده جاوا (`HttpServer`) بدون وابستگی خارجی.

## روشهای اجرا

### ۱) بدون نصب هیچ ابزاری (سادهترین)
فایل `index.html` را در مرورگر باز کنید:

```
C:\Users\sina\Desktop\tech-news\index.html
```

### ۲) با npm (Vite)
پس از نصب Node.js:

```bash
npm install
npm run dev       # آدرس: http://localhost:5173
npm run build     # خروجی در پوشه dist
npm run preview
```

### ۳) با جاوا (بدون وابستگی، فقط JDK)
پس از نصب JDK (نسخه ۸ یا بالاتر):

```bash
npm run java      # کامپایل + اجرا — آدرس: http://localhost:8080
```

یا بدون npm:

```bash
javac -encoding UTF-8 -d build src/main/java/com/technews/NewsServer.java
java -cp build com.technews.NewsServer
```

> نکته: چون Node.js و JDK در حال حاضر روی سیستم نصب نیستند، دستورات بالا تا زمان نصب آنها کار نمیکنند. روش شماره ۱ همین الان کار میکند.

### ۴) npm + جاوا با هم (Full-Stack)
ابتدا سرور جاوا را اجرا کنید، سپس Vite:

```bash
# ترمینال ۱
npm run java

# ترمینال ۲
npm run dev
```

Vite درخواستهای `/api` را به `http://localhost:8080` پاس میدهد (تنظیم شده در `vite.config.js`). بنابراین صفحه `api-demo.html` هم از طریق `http://localhost:5173/api-demo.html` و هم `http://localhost:8080/api-demo.html` کار میکند.

## API جاوا

| متد | مسیر | توضیح |
|-----|------|-------|
| GET | `/api/news` | لیست تمام اخبار |
| GET | `/api/news?category=موبایل` | فیلتر بر اساس دسته بندی |
| GET | `/api/news/ai-1` | یک خبر با شناسه مشخص |
| GET | `/api/categories` | لیست دسته بندیها |
| POST | `/api/newsletter` | ارسال `{ "email": "..." }` |
| GET | `/*` | فایلهای استاتیک سایت |

همه پاسخها JSON و UTF-8 هستند و هدر CORS دارند.

## ساختار پوشهها

```
tech-news/
├── index.html              # صفحه اصلی
├── api-demo.html           # صفحه تست API
├── package.json            # اسکریپتها و وابستگی Vite
├── vite.config.js          # سرور توسعه + proxy به جاوا
├── data/news.json          # داده اخبار
├── src/main/java/com/technews/NewsServer.java
├── assets/
│   ├── css/style.css
│   ├── js/app.js
│   └── images/*.svg
└── .gitignore
```

برای تغییر اخبار، `index.html` (نمایش) و `data/news.json` (API) را ویرایش کنید.
