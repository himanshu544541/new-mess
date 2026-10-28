# Centralized Mess System (CMS) 🍱
> **Universal Hostel & PG Dining Platform for Indian Students**

A production-grade, full-stack web application that allows college hostel and PG students to pay **ONE** monthly fee to the platform and eat at **ANY** verified partner mess across the campus or city. 

Every meal is verified by a live dynamic QR scan at the mess counter, ensuring mess owners get paid strictly for meals they actually served.

---

## 📑 Table of Contents
1. [Core Product & Money Model](#-core-product--money-model)
2. [Tech Stack](#-tech-stack)
3. [Database Architecture & Compound Indexing](#-database-architecture--compound-indexing)
4. [Step-by-Step Local Setup](#-step-by-step-local-setup)
5. [Demo User Credentials](#-demo-user-credentials)
6. [Automated Test Suite (All 9 Suites)](#-automated-test-suite)
7. [Viva & Technical Interview Guide](#-viva--technical-interview-guide)
8. [Production Deployment Guide](#-production-deployment-guide)

---

## 💡 Core Product & Money Model

Traditional hostel dining locks students into one single mess hall with fixed repetitive menus at **₹3,500/month (~₹58.33/meal)**. Students often skip meals or double-pay for outside food.

Centralized Mess introduces universal dining flexibility:
- **Student Pays**: **₹3,800 per month** = **60 meals** (2 meals/day × 30 days) = **₹63.33 per meal**.
- **Platform Pays Partner Mess**: **₹60.00 per meal served** directly into their bank account (up to ₹3,600/month if all 60 meals are used).
- **Platform Retains**: **₹3.33 per meal** managed (~₹199.8 per student per month).
- **Old Single-Mess Rate for Comparison**: ₹58.33 per meal (₹3,500/month).
- **Settlement Formula**: $\text{Payout} = \text{Check-ins at that mess} \times ₹60.00$. It is **not** a fixed revenue share.
- **Integer Paise Rule**: All currency is stored as integer paise (e.g., ₹3,800 is stored as `380000`, ₹60 as `6000`, ₹3.33 as `333`) to prevent IEEE 754 floating-point rounding errors. Converted to ₹ strictly for UI formatting.

---

## 🛠 Tech Stack

### Frontend (`client/`)
- **React.js 18** (Vite, JavaScript — fast HMR and clean bundles)
- **Tailwind CSS** (Mobile-first, responsive modern dashboard design)
- **React Router v7** (Role-based route protection and redirection)
- **Axios** (Configured with automated JWT Bearer token interceptors)
- **`qrcode.react`** (High-contrast SVG QR token rendering)
- **`html5-qrcode`** (Camera scanner with cross-browser webcam support)
- **Lucide React** (Clean, consistent iconography)

### Backend (`server/`)
- **Node.js 18+ (20/24 LTS)** + **Express.js**
- **MongoDB + Mongoose** (Local MongoDB or MongoDB Atlas)
- **JWT (JSON Web Tokens)** + **bcryptjs** (Secure authentication and short-lived tokens)
- **Multer** (Local student ID card and residence proof file uploads)
- **Cashfree Payment Gateway** (Sandbox mode order creation and HMAC-SHA256 webhook signature verification)
- **node-cron** (Scheduled background closing-time alert scanner)

---

## 🗄 Database Architecture & Compound Indexing

The platform organizes data across 10 specialized MongoDB collections:

| Collection | Role & Purpose |
| :--- | :--- |
| `users` | Role-based accounts (`student`, `vendor`, `admin`) and approval status (`pending`, `approved`, `rejected`). |
| `studentProfiles` | College, hostel/PG name, phone number, and uploaded proof document path. |
| `messes` | Partner dining hall profile, FSSAI licence, lunch & dinner timings, daily menus, live `isOpen` toggle. |
| `config` | Dynamic platform economics stored in integer paise (`studentMonthlyFeePaise`, `vendorRatePerMealPaise`, `mealsPerMonth`, `cycleDays`, `gatewayFeePercent`). |
| `subscriptions` | Active 30-day dining pass with `totalMeals: 60`, `mealsUsed`, `mealsRemaining`, and cycle expiration date. |
| `payments` | Audit record of Cashfree transactions with unique `orderId`, integer paise amount, and status. |
| `checkins` | Every single meal scan event. Enforces **strict compound index**. |
| `ratings` | Private 1–5 star reviews and student comments. |
| `payouts` | Partner mess settlement records with `isPrepaid` trust flag and bank reference. |
| `notifications` | In-app Zomato-style closing time alerts and meal reminders. |

### 🔒 Crucial Database Compound Index
To prevent students from scanning twice for lunch or dinner on the same day, the database engine enforces:
```javascript
// server/src/models/CheckIn.js
checkInSchema.index({ student: 1, mealSlot: 1, date: 1 }, { unique: true });
```
This compound index makes it physically impossible for race conditions, multiple browser tabs, or duplicate network packets to redeem more than 1 meal per slot on any calendar date.

---

## 🚀 Step-by-Step Local Setup

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher (`v20 LTS` or `v24` recommended). Verify with `node -v`.
- **npm**: `v9.0.0` or higher. Verify with `npm -v`.
- **MongoDB**: Local MongoDB running on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI.

### 2. Clone / Open Directory
```powershell
cd "d:\mess system\centralized-mess-system"
```

### 3. Server Configuration
```powershell
cd server
npm install
```
Verify `server/.env` exists (copied from `server/.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/centralized_mess
JWT_SECRET=super_secret_jwt_key_centralized_mess_2026_dev
CASHFREE_APP_ID=TEST_APP_ID
CASHFREE_SECRET_KEY=TEST_SECRET_KEY
CASHFREE_ENV=SANDBOX
CLIENT_URL=http://localhost:5173
```

### 4. Client Configuration
```powershell
cd ../client
npm install
```
Verify `client/.env` exists:
```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Seed Database
Run the seeder script to populate 1 Admin, 3 Partner Messes, and 10 Students:
```powershell
cd ../server
npm run seed
```

### 6. Start Development Servers
Open two terminal windows:

**Terminal 1 (Backend Server):**
```powershell
cd "d:\mess system\centralized-mess-system\server"
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```powershell
cd "d:\mess system\centralized-mess-system\client"
npm run dev
# Running on http://localhost:5173
```

Open your browser at **`http://localhost:5173`**.

---

## 👥 Demo User Credentials

All seeded test accounts use the password: **`Password123!`** (Admin uses `AdminPassword123!`).

| Role | Email | Password | Account State & Details |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@centralmess.in` | `AdminPassword123!` | System administrator. Full queue & margin report access. |
| **Mess Partner 1** | `vendor1@mess.com` | `Password123!` | Annapurna Rasoi (North Campus). Verified & Open. |
| **Mess Partner 2** | `vendor2@mess.com` | `Password123!` | Shiv Shakti Bhojnalaya (Hostel Zone). Verified & Open. |
| **Mess Partner 3** | `vendor3@mess.com` | `Password123!` | Royal South & North Dining Hall. Verified & Open. |
| **Student 1** | `aryan@college.edu` | `Password123!` | **Subscribed** (58 meals remaining). Ready to dine! |
| **Student 2** | `sneha@college.edu` | `Password123!` | **Subscribed** (52 meals remaining). |
| **Student 3** | `rohit@college.edu` | `Password123!` | **Subscribed** (45 meals remaining). |
| **Student 4** | `ananya@college.edu` | `Password123!` | **Subscribed** (60 / 60 fresh meals). |
| **Student 5** | `karan@college.edu` | `Password123!` | **Approved**, ready to activate subscription. |
| **Student 6** | `mohit@college.edu` | `Password123!` | **Pending** verification in Admin queue. |
| **Student 7** | `sameer@college.edu` | `Password123!` | **Rejected** with document expiration note. |

---

## 🧪 Automated Test Suite

The project includes 9 automated test suites covering all critical business and security logic:

```powershell
cd "d:\mess system\centralized-mess-system\server"
npm test
```

### Verified Test Suites:
1. `tests/health.test.js`: Server startup, MongoDB connection state & `/api/health` response.
2. `tests/phase2_auth.test.js`: Student/vendor signup, Multer upload, role-based route blocking, and admin approval flow.
3. `tests/phase3_mess.test.js`: Mess directory, live Open/Closed dining toggle, and lunch/dinner menu publishing.
4. `tests/phase4_payment.test.js`: Dynamic pricing config, Cashfree sandbox order generation, and subscription activation.
5. `tests/phase5_checkin.test.js`: Dynamic 60s QR token generation, vendor scanning, and meal decrement.
6. `tests/phase6_vendor_analytics.test.js`: Metrics aggregation (today/week/month/unique students) and RFC CSV export.
7. `tests/phase7_admin.test.js`: Dynamic config editing, settlement calculation, prepaid trust payouts, and margin reports.
8. `tests/phase8_ratings_notifications.test.js`: Confidential rating isolation and funny Zomato-style closing alert delivery.
9. `tests/phase9_comprehensive.test.js`: **The 4 Mandatory Suites**:
   - Payout Math & Integer Paise Accuracy
   - Database Compound Index & Duplicate Check-in Prevention
   - Expired QR Token Cryptographic Rejection
   - Cashfree Webhook Replay & Strict Idempotency

---

## 🎓 Viva & Technical Interview Guide

Here are the key technical questions examiners frequently ask about this architecture:

### Q1: How do you stop students from sharing screenshots of their QR pass with friends?
> **Answer**: The QR code does not contain a static user ID. Instead, it contains a signed JSON Web Token (JWT) that carries an expiration timestamp set to strictly **60 seconds**. The frontend displays a live countdown timer and automatically fetches a fresh token every 60 seconds. If a student takes a screenshot and sends it to a friend, the token will be expired by the time they reach the mess counter. The backend cryptographically verifies the token's expiration and rejects expired tokens with a clear red **DENIED** response.

### Q2: How do you prevent a student from having two lunches or two dinners on the same day?
> **Answer**: We enforce duplicate prevention at **two levels**:
> 1. *Code Level*: We query MongoDB for any existing check-in matching the student's ID, the current meal slot (`lunch` or `dinner`), and the current date.
> 2. *Database Level (Crucial)*: We defined a unique compound index in MongoDB:
>    `checkInSchema.index({ student: 1, mealSlot: 1, date: 1 }, { unique: true });`
>    Even if two scan requests arrive simultaneously in parallel threads, MongoDB's storage engine enforces this unique constraint atomically, throws duplicate key error `E11000`, and rejects the second request.

### Q3: Why store money as integer paise instead of floating-point Rupees?
> **Answer**: Computers use standard IEEE 754 binary floating-point representation. This causes well-known precision bugs where calculations like `0.1 + 0.2` yield `0.30000000000000004`. Over thousands of student payments and vendor settlements, rounding errors accumulate into significant financial discrepancies. By storing ₹3,800 as `380000` paise and ₹60.00 as `6000` paise, all arithmetic (additions, subtractions, multiplications) remains exact integer math. We format to Rupees only on the frontend for visual display.

### Q4: How is Cashfree payment webhook handling made idempotent?
> **Answer**: Network retries or payment gateway webhooks often deliver the same payment notification multiple times. Our webhook controller searches for the `Payment` record by `orderId`. If `payment.status` is already `'success'` and a subscription has already been created, the handler immediately returns an HTTP 200 `{ idempotent: true }` confirmation. It never increments the meal count again or creates a second subscription. Furthermore, `orderId` is indexed with `{ unique: true }` on the `Subscription` collection.

### Q5: Why are student ratings kept private from mess vendors?
> **Answer**: If students leave constructive negative feedback about food quality or hygiene, mess owners could identify and penalize or refuse service to those students. Under our model, the mess vendor only sees their aggregated star average (`avgRating`). Only university administrators can view individual reviews and student identities, allowing administration to maintain dining quality objectively.

### Q6: What is the "Prepaid Trust" payout flag?
> **Answer**: When onboarding traditional mess owners to a new digital platform, vendors are often skeptical about whether the platform will actually pay them at the end of the month. The admin panel includes a "Prepaid Trust" flag allowing the platform to disburse the first week of earnings upfront to build partnership trust.

---

## 🌐 Production Deployment Guide

### Option 1: Frontend on Vercel
1. Push the code to a GitHub repository.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Select your repository and set the **Root Directory** to `centralized-mess-system/client`.
4. Build settings:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variable:
   - `VITE_API_URL`: `https://your-backend-api.onrender.com/api`
6. Click **Deploy**.

### Option 2: Backend on Render or Railway
1. Sign in to [Render](https://render.com) and create a **New Web Service**.
2. Connect your repository and set the **Root Directory** to `centralized-mess-system/server`.
3. Build & Run settings:
   - Environment: **Node**
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGO_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/centralized_mess?retryWrites=true&w=majority`
   - `JWT_SECRET`: `<Generate strong 64-char random key>`
   - `CASHFREE_APP_ID`: `<Your Cashfree Production or Sandbox App ID>`
   - `CASHFREE_SECRET_KEY`: `<Your Cashfree Secret Key>`
   - `CASHFREE_ENV`: `SANDBOX` (or `PROD`)
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
5. Click **Deploy Web Service**.

### Option 3: MongoDB Atlas
1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user with read/write privileges.
3. In **Network Access**, allow access from anywhere (`0.0.0.0/0`) or whitelist your Render/Railway IP addresses.
4. Copy the connection string into `MONGO_URI`.

---

## 📜 License
Developed with clean, viva-ready code for university and PG dining innovation. Open source under the MIT License.

#   n e w - m e s s  
 