# Voice Billing – Hosting Guide

Host karne ke baad **ek hi URL** se sab kaam chalega: manager counter + waiter phone, kahi se bhi (same WiFi ki zaroorat nahi).

---

## Option 1: Railway (recommended, free tier)

1. **GitHub pe code push karo**
   - Project folder ko Git repo banao (agar nahi hai):
     ```bash
     cd voice-billing
     git init
     git add .
     git commit -m "Voice billing app"
     ```
   - GitHub pe naya repo banao, phir:
     ```bash
     git remote add origin https://github.com/YOUR_USERNAME/voice-billing.git
     git push -u origin main
     ```

2. **Railway pe deploy**
   - [railway.app](https://railway.app) → Sign up (GitHub se login).
   - **New Project** → **Deploy from GitHub repo** → apna `voice-billing` repo select karo.
   - Repo select hone ke baad **Settings** (ya **Variables**) me jao:
     - **Build Command:** `npm run build`
     - **Start Command:** `npm start`
     - **Root Directory:** `voice-billing` (agar repo ke andar ye folder hai to; warna khali chhod do).
   - **Variables** me add karo:
     - `NODE_ENV` = `production`
   - Deploy start ho jayega. Jab ho jaye, **Settings** → **Generate Domain** se URL milega (jaise `https://voice-billing-xxxx.up.railway.app`).

3. **Use kaise karein**
   - **Manager (counter):** browser me `https://YOUR-RAILWAY-URL/#counter` open karo.
   - **Waiter (phone):** `https://YOUR-RAILWAY-URL/#waiter` open karo.
   - Server URL box **khali chhod do** ya same URL hi rehne do – hosted mode me app khud same origin use karega.

**Note:** Railway free tier me SQLite file restart pe reset ho sakti hai. Agar data permanent chahiye to Railway **Volume** add karo (paid) ya baad me Postgres switch karna padega.

---

## Option 2: Render

1. [render.com](https://render.com) → Sign up → **New** → **Web Service**.
2. GitHub repo connect karo (voice-billing).
3. **Build Command:** `npm run build`  
   **Start Command:** `npm start`
4. **Environment:** `NODE_ENV` = `production`
5. **Create Web Service** → URL milega. Phir same tarah:
   - Counter: `https://YOUR-URL/#counter`
   - Waiter: `https://YOUR-URL/#waiter`

Render free tier pe service sleep ho jati hai; pehli request pe 1–2 min lag sakta hai.

---

## Local test (production build)

Hosting se pehle PC pe check karo:

```bash
cd voice-billing
npm run build
set NODE_ENV=production
npm start
```

Browser me `http://localhost:4000` open karo (front-end + API dono isi port pe).  
`http://localhost:4000/#waiter` aur `http://localhost:4000/#counter` dono kaam karenge.

---

## Summary

| Jahan      | URL                          |
|-----------|------------------------------|
| Counter   | `https://YOUR-DOMAIN/#counter` |
| Waiter    | `https://YOUR-DOMAIN/#waiter`   |
| Server URL (hosted) | Khali ya same domain – app auto use karega |
