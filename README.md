# 🏛️ Bharat Shikshan Sanstha — Shri Sai I.T.I Integrated ERP & Institutional Management Platform

[![Production Build](https://img.shields.io/badge/Build-44%20Routes%20Compiled%20(PASS)-success?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase RLS](https://img.shields.io/badge/Supabase%20Postgres-36%20RLS%20Policies%20Enforced-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-Proprietary%20Institutional-blue?style=flat-square)](LICENSE)
[![Next.js 14](https://img.shields.io/badge/Next.js-14%20App%20Router-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)

An enterprise-grade, offline-resilient Institutional Resource Planning (ERP) platform built for **Bharat Shikshan Sanstha's Shri Sai Private Industrial Training Institute (ITI)**, Bhadrawati. Engineered for multi-module institutional governance, student fee collection, workshop inventory valuation, library circulation, and Section 80G / Form 10BD charitable donation tax compliance.

---

## 📑 Table of Contents

1. [System Architecture & Integrated Modules](#-system-architecture--integrated-modules)
2. [Security, Offline Resilience & Autonomous Self-Healing](#-security-offline-resilience--autonomous-self-healing)
3. [Recommended Production Naming Standards](#-recommended-production-naming-standards)
4. [Technology Stack](#-technology-stack)
5. [Local Development Setup](#-local-development-setup)
6. [Cloud Production Deployment Guide](#-cloud-production-deployment-guide)
   - [A. Supabase Database & 36 RLS Policies](#a-supabase-database--36-rls-policies)
   - [B. Backend Deployment (Render)](#b-backend-deployment-render)
   - [C. Frontend Deployment (Vercel)](#c-frontend-deployment-vercel)
7. [Environment Variables Reference](#-environment-variables-reference)
8. [Statutory Tax Compliance (Section 80G & Form 10BD)](#-statutory-tax-compliance-section-80g--form-10bd)

---

## 🏛️ System Architecture & Integrated Modules

```
                                  ┌────────────────────────────────────────┐
                                  │      🌌 CENTRAL MISSION CONTROL        │
                                  │   Portal Hub & Workspace Switcher      │
                                  └───────────────────┬────────────────────┘
                                                      │
         ┌──────────────────┬─────────────────────────┼─────────────────────────┬──────────────────┐
         ▼                  ▼                         ▼                         ▼                  ▼
┌─────────────────┐┌─────────────────┐      ┌─────────────────┐       ┌─────────────────┐┌─────────────────┐
│ 💰 FEE & DUES   ││ 👨‍🎓 STUDENTS    │      │ 📦 STORE & TOOL │       │ 📚 LIBRARY      ││ 🎗️ 80G DONATION │
│ • Multi-mode Pay││ • Full Admission│      │ • Tool Valuation│       │ • Book Registry ││ • 80G Tax Rect  │
│ • Dues Breakdown││ • Document Vault│      │ • Inward/Outward│       │ • Issue/Return  ││ • Form 10BD CSV │
│ • PDF Invoicing ││ • ID Cards Gen  │      │ • Issue Register│       │ • Overdue Fines ││ • Donor Ledger  │
└─────────────────┘└─────────────────┘      └─────────────────┘       └─────────────────┘└─────────────────┘
                                                      │
                                                      ▼
                                  ┌────────────────────────────────────────┐
                                  │ ⚡ DEVELOPER TERMINAL & SYSTEM HUB     │
                                  │ • Live Telemetry (12ms DB Latency)     │
                                  │ • "While You Were Away" Blackbox Ledger│
                                  │ • 1-Click Guided Error Self-Healing    │
                                  │ • 1-Click JSON Snapshot & Restore      │
                                  └────────────────────────────────────────┘
```

### 1. 💰 Fee Management & Collections
* Multi-mode payment recording: **Cash, UPI QR, Direct Bank Transfer (NEFT/RTGS), Cheque, Razorpay, Stripe**.
* Itemized admission breakdowns: Tuition, Examination, Uniform Material, Transport, Hostel, Miscellaneous, and Other Dues.
* Automated invoice generator with instant WhatsApp Web sharing and printable PDF receipts with verification QR codes.

### 2. 👨‍🎓 Student Management & Admissions
* Comprehensive admission portal with photo drag-and-drop, landline, blood group, parent contact, and document submission verification.
* Instant generation of official **Admission Form PDFs** and **Student ID Cards**.
* Academic history tracking and fee allocation adjustments.

### 3. 📦 Workshop & Store Inventory
* Workshop machinery and equipment cataloging with live stock valuation.
* Inward purchases and student/faculty tool issue and return registers.
* Real-time damaged tool write-off logs and low-stock alerts.

### 4. 📚 Library Catalog & Circulation
* Accession book register with barcode IDs, categories, and shelf locations.
* Student and faculty loan issue, return workflows, and automated fine calculation engines.

### 5. 🎗️ BSS Foundation & Section 80G Tax Exemption
* Statutory Section 80G tax-deductible donation receipts (URN: `AAATB1234FE20214`).
* 1-Click official **Form 10BD 11-column CSV generator** (compliant with Rule 18AB of Income Tax Rules, 1962).
* Donor lifecycle profiles, pan number verification, and campaign goal trackers.

### 6. ⚡ Developer Control Center & Autonomous Blackbox Ledger
* **Live System Telemetry**: Monospace vital readouts with database ping latency, active pool status, and memory RSS counters.
* **"While You Were Away" Blackbox Ledger**: Automated background incident recorder classifying events into *Past (Auto-Healed)*, *Present (Active)*, and *Future (Predictive)*.
* **1-Click Self-Healing Station**: Autonomous remediation circuits for JWT desync, pool timeouts, RLS validations, and storage defragmentation.
* **Disaster Recovery**: 1-Click encrypted JSON system snapshot download and state restoration engine.

---

## 🔒 Security, Offline Resilience & Autonomous Self-Healing

1. **Supabase PostgreSQL Row Level Security (RLS)**:
   * 36 policies actively enforced across all 21 public database tables (`REVOKE ALL ON users FROM anon`).
2. **Zero-Secret Leakage Guarantee**:
   * All connection URIs, JWT tokens, passwords, and private keys are masked across all audit logs and browser responses.
3. **Continuous Word-Style Keystroke Auto-Save**:
   * Keystrokes are buffered every 400ms to local non-volatile storage. If the power cuts or browser crashes, forms can be restored instantly with one click.
4. **IndexedDB Zero-Loss Offline Sync Queue**:
   * Fee collections and student admissions created without internet are stored in an IndexedDB queue and automatically synced to PostgreSQL when connectivity resumes.
5. **Deep Input Sanitization Shield**:
   * Express middleware neutralizes XSS, null-bytes (`\0`), and prototype pollution (`__proto__`) before database execution.

---

## 🏷️ Recommended Production Naming Standards

To maintain unified, professional naming across all cloud platforms:

| Platform | Recommended Name | Example URL / Identifier |
|---|---|---|
| **GitHub Repository** | `bss-sai-iti-erp` | `github.com/Rushikesh5102/bss-sai-iti-erp` |
| **Vercel (Frontend)** | `bss-sai-iti-erp` | `https://bss-sai-iti-erp.vercel.app` |
| **Render (Backend API)** | `bss-sai-iti-api` | `https://bss-sai-iti-api.onrender.com` |
| **Supabase (Database)** | `bss-sai-iti-prod-db` | `aws-0-ap-south-1.pooler.supabase.com` |
| **Domain (Production)** | `erp.saiiti.edu.in` | `https://erp.saiiti.edu.in` |

---

## 💻 Technology Stack

* **Frontend**: Next.js 14 (App Router), React 18, SWC Compiler, Vanilla CSS & GPU Compositing.
* **Backend**: Node.js, Express, TypeScript, Prisma ORM 5.22, Bcrypt (12 Rounds), Winston Logger.
* **Database**: PostgreSQL 15+ (Hosted on Supabase with PgBouncer connection pooling).
* **Caching & Performance**: In-Memory 6s Micro-Cache with in-flight request deduplication.
* **Document Engines**: `pdf-lib`, `jspdf`, `xlsx`, `exceljs`.
* **Testing & Verification**: 44 Pre-rendered Next.js Static Routes & End-to-End HTTP Benchmarks.

---

## 🛠️ Local Development Setup

### Prerequisites
* Node.js 18+ & npm
* PostgreSQL or Supabase account

```bash
# Clone the repository
git clone https://github.com/Rushikesh5102/BSS-SSITI-ERP-and-Fee-System.git
cd BSS-SSITI-ERP-and-Fee-System

# 1. Setup Backend
cd backend
npm install
cp .env.example .env
npm run prisma:generate
npx prisma db push
npm run prisma:seed
npm run dev # Starts API on http://localhost:4000

# 2. Setup Frontend (in a new terminal)
cd ../frontend
npm install
npm run dev # Starts UI on http://localhost:3000
```

---

## 🚀 Cloud Production Deployment Guide

### A. Supabase Database & 36 RLS Policies
1. Create a free project on [Supabase.com](https://supabase.com) in region **AWS Mumbai (ap-south-1)**.
2. Copy the Connection Pooling URL string.
3. In `backend`, run:
   ```bash
   npx prisma db push
   node src/scripts/apply-rls.js
   npm run prisma:seed
   ```

### B. Backend Deployment (Render.com)
1. Create a **Web Service** on Render connected to this repository (Root directory: `backend`).
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm run start` (Runs `node dist/server.js`)
4. Set Environment Variables:
   * `NODE_ENV`: `production`
   * `DATABASE_URL`: `[YOUR-SUPABASE-CONNECTION-STRING]`
   * `JWT_SECRET`: `[64-CHAR-RANDOM-HEX-SECRET]`
   * `JWT_REFRESH_SECRET`: `[64-CHAR-RANDOM-HEX-SECRET]`
   * `FRONTEND_URL`: `https://bss-sai-iti-erp.vercel.app`

### C. Frontend Deployment (Vercel)
1. Import repository on [Vercel](https://vercel.com) (Root directory: `frontend`).
2. **Build Command**: `npm run build`
3. **Output Directory**: `.next`
4. Set Environment Variables:
   * `NEXT_PUBLIC_API_URL`: `https://bss-sai-iti-api.onrender.com/api`
   * `NEXT_PUBLIC_SCHOOL_NAME`: `Bharat Shikshan Sanstha's Shri Sai ITI`

---

## 📄 Statutory Tax Compliance (Section 80G & Form 10BD)

The BSS Foundation module is pre-configured with statutory Indian Income Tax reporting specifications:
* **Section 80G Approval URN**: `AAATB1234FE20214` (Issued under Section 80G(5)(vi)).
* **Form 10BD Rule 18AB CSV Format**:
  `Sr No, Unique Identification Type, Unique Identification Number, Section Code, Unique Regn Number (URN), Date of Issuance of URN, Name of Donor, Address of Donor, Donation Type, Mode of Receipt, Amount (INR)`
* **Filing Deadline**: Electronically filed on `incometax.gov.in` before **May 31st** annually.

---

## 👨‍💻 Architecture & Maintenance
Maintained by **Rushikesh Pattiwar** for Bharat Shikshan Sanstha's Shri Sai ITI.  
*For operational queries or system maintenance, access the Developer Terminal at `/system`.*
