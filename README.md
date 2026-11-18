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

> نکته: Node.js v26.13.1 (npm 11.20.0) و JDK 17 (Temurin) نصب و تنظیم شدهاند. در PowerShell، Execution Policy کاربر به `RemoteSigned` تنظیم شد تا دستور `npm` بدون مشکل اجرا شود.

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

## اتصال JavaScript به API

صفحه اصلی با `assets/js/api.js` از طریق `fetch` اخبار را از `/api/news` میگیرد و با `assets/js/app.js` آنها را رندر میکند. فیلتر، جستجو و دکمه «نمایش اخبار بیشتر» بعد از لود شدن دادهها دوباره متصل میشوند. فرم خبرنامه هم در حالت متصل به سرور، ایمیل را با `POST /api/newsletter` ارسال میکند.

اگر سرور جاوا در دسترس نباشد (مثلاً وقتی فایل `index.html` مستقیم باز شده)، صفحه به حالت استاتیک برمیگردد و نشانگر «حالت محلی» را نشان میدهد — بنابراین سایت همیشه کار میکند.

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
│   ├── js/api.js           # کلاینت fetch به API جاوا
│   ├── js/app.js           # رندر، فیلتر، جستجو و حالت تاریک
│   └── images/*.svg
└── .gitignore
```

برای تغییر اخبار، `index.html` (نمایش) و `data/news.json` (API) را ویرایش کنید.
