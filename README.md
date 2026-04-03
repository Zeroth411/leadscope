# 🚀 LeadScope — Smart Lead Intelligence

LeadScope is a full-stack web app that helps you find **high-quality local business leads** for cold calling.

It identifies businesses without websites, scores them, and gives you a simple CRM to track outreach.

---

## 🎯 What This Solves

Most local businesses:

* Don’t have websites
* Don’t get traffic from Google
* Are easy clients for web services

LeadScope helps you find them fast.

---

## 🔥 Core Features

### 🔍 Lead Search

* Search by area + category
* Built using HERE Places API

### 🧠 Lead Scoring

Automatically ranks leads:

* +50 → No website
* +30 → Has phone
* +20 → Rating ≥ 4
* +10 → Reviews ≥ 50

---

### 🏷 Lead Categories

* 🔥 **HOT LEAD** (80+)
* ✅ **GOOD LEAD** (50–79)
* ❌ **LOW VALUE** (<50)

---

### 🎯 Smart Filtering

* No website only
* Relevant businesses (cafes, salons, gyms, clinics)
* Call status tracking

---

### 📊 Built-in CRM

Track your outreach:

* Not Called
* Called
* Interested
* Not Interested

---

### 📤 CSV Export

Export leads with:

* Name
* Phone
* Address
* Score
* Lead Tier

---

### 🔎 Quick Google Check

One-click verify business quality

---

## 🧱 Tech Stack

**Frontend**

* React (Vite)
* TypeScript

**Backend**

* Vercel Serverless Functions

**Database**

* Supabase

---

## ⚙️ Setup (Local)

### 1. Install dependencies

```bash
npm install
```

---

### 2. Create `.env`

```env
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_public_key
HERE_API_KEY=your_here_api_key
```

---

### 3. Run project

```bash
npx vercel dev
```

---

### 4. Open

```
http://localhost:3000
```

---

## 🧪 API Health Check

```
http://localhost:3000/api/health
```

---

## ⚠️ Limitations

* Data may be incomplete (API limitations)
* Requires manual validation before calling
* Not all businesses have phone numbers

---

## 📞 How to Use (Real Workflow)

1. Search area (e.g. "cafes in Indore")
2. Filter HOT LEADS
3. Export CSV
4. Call businesses

---

## 💬 Cold Call Opening

> "Hi, I found your business online and noticed you don’t have a proper website — are you getting customers from Google or mostly offline?"

---

## 🚀 Goal

This tool is built to:
👉 Help you get clients
👉 Not just build another project

---

## 🧠 Author

Built by a developer solving his own client acquisition problem.

---

## ⭐ If useful

Star it or use it to land your first client.
