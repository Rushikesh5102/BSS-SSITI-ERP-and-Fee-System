# Sai ITI Fee Management System

A production-ready school fee management MVP built for ITI institutions managing 500–2,000 students.

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT with RBAC (4 roles) |
| Payments | Razorpay + Stripe |
| PDF | pdf-lib (receipt generation) |
| Exports | ExcelJS + json2csv |
| Notifications | Twilio (SMS/WhatsApp) + Nodemailer |

## Project Structure
```
Sai ITI Fee Management Software/
├── backend/           # Node.js/Express API
│   ├── prisma/        # Schema + seed
│   └── src/
│       ├── config/    # Environment config
│       ├── controllers/
│       ├── middleware/ # Auth, RBAC, audit, validation
│       ├── routes/
│       ├── services/  # PDF, notifications, exports, payments
│       └── utils/
└── frontend/          # Next.js dashboard
    └── src/
        ├── app/       # Pages: login, dashboard, students, payments, receipts, reports
        ├── components/ # Sidebar, etc.
        ├── context/   # AuthContext
        ├── services/  # Axios API client
        └── styles/    # Global CSS
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

---

### 1 — Database Setup

Create a PostgreSQL database:
```sql
CREATE DATABASE sai_iti_fee_db;
```

---

### 2 — Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy env and fill in your values
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, and credentials

# Generate Prisma client
npm run prisma:generate

# Run migrations (creates all tables)
npm run prisma:migrate

# Seed default users and sample data
npm run prisma:seed

# Start development server (port 4000)
npm run dev
```

---

### 3 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy env
cp .env.local.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL

# Start Next.js dev server (port 3000)
npm run dev
```

Open → http://localhost:3000

---

## Default Login Credentials (after seed)

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@saiiti.edu.in | Admin@123 |
| Admin | admin@saiiti.edu.in | Admin@123 |
| Accountant | accountant@saiiti.edu.in | Accountant@123 |
| Teacher | teacher@saiiti.edu.in | Teacher@123 |

> ⚠️ **Change all passwords immediately in production.**

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/students` | List/create students |
| GET/PUT | `/api/students/:id` | Student detail/update |
| GET/POST | `/api/fee-structures` | Fee structures |
| POST | `/api/fees/assign` | Assign fee to student |
| GET/POST | `/api/payments` | List/record payments |
| POST | `/api/payments/razorpay/order` | Razorpay order |
| POST | `/api/payments/razorpay/verify` | Verify Razorpay payment |
| POST | `/api/payments/stripe/intent` | Stripe PaymentIntent |
| GET | `/api/receipts` | List receipts |
| GET | `/api/receipts/download/:num` | Download PDF receipt |
| GET | `/api/reports/dashboard` | Dashboard stats |
| GET | `/api/reports/monthly` | Monthly report (JSON/Excel/CSV) |
| GET | `/api/reports/daily` | Daily report |
| GET | `/api/reports/pending` | Outstanding fees |
| GET | `/api/health` | Health check |

---

## Roles & Permissions

| Feature | SuperAdmin | Admin | Accountant | Teacher |
|---|:-:|:-:|:-:|:-:|
| Manage branches | ✅ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ✅ | ❌ | ❌ |
| Add/edit students | ✅ | ✅ | ✅ | ❌ |
| Manage fee structures | ✅ | ✅ | ❌ | ❌ |
| Record payments | ✅ | ✅ | ✅ | ❌ |
| View reports | ✅ | ✅ | ✅ | ❌ |
| View student status | ✅ | ✅ | ✅ | ✅ |

---

## Production Deployment

### Backend (Node.js server / PM2)

```bash
cd backend
npm run build
# Create .env with NODE_ENV=production and real credentials
node dist/server.js

# Or with PM2:
pm2 start dist/server.js --name sai-iti-api
```

### Frontend (Vercel)

```bash
cd frontend
# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
# NEXT_PUBLIC_SCHOOL_NAME=Sai ITI

vercel --prod
```

### Environment Checklist (Production)
- [ ] Change all JWT secrets
- [ ] Use real Razorpay/Stripe live keys
- [ ] Configure Twilio for SMS/WhatsApp
- [ ] Configure SMTP for email
- [ ] Use HTTPS for all endpoints
- [ ] Set up database backups
- [ ] Configure CORS with production frontend URL

---

## Notifications Flow

1. **Payment recorded** → System auto-sends:
   - SMS to parent (Twilio)
   - WhatsApp to parent (Twilio)
   - Email to parent (Nodemailer)
   - PDF receipt generated and saved

2. **Fee due reminder** → Manually trigger from admin or scheduled cron:
   - SMS + Email to parent

---

## PDF Receipt

Auto-generated on every payment with:
- School name, address, contact
- Student name, ID, class
- Receipt number (SAI-YEAR-XXXXXXXXXX)
- Payment amount, mode, date
- Amount in words
- Signature section

Receipts saved to: `backend/uploads/receipts/`

---

## Security Features
- JWT Bearer tokens with refresh
- bcrypt password hashing (12 rounds)
- Rate limiting (10 auth / 200 general per 15 min)
- Helmet security headers
- CORS restricted to frontend URL
- Zod input validation on all endpoints
- Audit log for all financial actions
- SQL injection prevention (Prisma ORM)
- Monetary values stored as integers (paise)
