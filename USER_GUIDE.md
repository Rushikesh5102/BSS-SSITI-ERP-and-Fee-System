# 📖 Bharat Shikshan Sanstha — Shri Sai Private ITI
## Complete Enterprise User Guide & Operational Manual (v2.0)

Welcome to the official **Operational Manual & User Guide** for the **BSS Shri Sai ITI Unified ERP & Institutional Management Platform**. This document provides an exhaustive, step-by-step walkthrough of every module, screen, button, workflow, and feature across the entire software ecosystem.

---

## 📑 Table of Contents

1. [System Architecture & Overview](#1-system-architecture--overview)
2. [Access, Authentication & PWA Installation](#2-access-authentication--pwa-installation)
3. [Master Credentials & Access Control Matrix](#3-master-credentials--access-control-matrix)
4. [Mission Control Portal Hub (`/portal`)](#4-mission-control-portal-hub-portal)
5. [Fee Management Workspace (`/dashboard`, `/payments`, `/receipts`, `/fee-structures`, `/reports`, `/students`)](#5-fee-management-workspace)
6. [Workshop Store & Inventory Management (`/store` and sub-routes)](#6-workshop-store--inventory-management)
7. [Library Management System (`/library` and sub-routes)](#7-library-management-system)
8. [BSS Foundation & Philanthropy (`/foundation`, `/donation-admin`)](#8-bss-foundation--philanthropy)
9. [Developer Home & System Diagnostics (`/system`)](#9-developer-home--system-diagnostics)
10. [Offline Mode, Local Persistence & Auto-Sync](#10-offline-mode-local-persistence--auto-sync)
11. [Troubleshooting & Cold-Start FAQ](#11-troubleshooting--cold-start-faq)

---

## 1. System Architecture & Overview

The system is built as a **Multi-Module Enterprise Web Application** powering all institutional operations of **Shri Sai Private Industrial Training Institute (Bhadrawati)**:
* **Frontend**: Next.js 14 App Router with glassmorphic UI, high-contrast Blue-Beige light mode, obsidian dark mode, and PWA capabilities.
* **Backend API**: Node.js, Express, TypeScript, Prisma ORM.
* **Database**: PostgreSQL with Row-Level Security (RLS) and multi-tenant schema isolation.
* **Storage**: Encrypted local caching with optimistic offline queue synchronization.

```
                               ┌────────────────────────┐
                               │   Vercel Web App (/)   │
                               └───────────┬────────────┘
                                           │
             ┌─────────────────────────────┴─────────────────────────────┐
             ▼                                                           ▼
┌─────────────────────────┐                                 ┌─────────────────────────┐
│     Public Portal       │                                 │    Institutional ERP    │
│      (/foundation)      │                                 │      (/portal, /login)  │
└─────────────────────────┘                                 └────────────┬────────────┘
                                                                         │
       ┌──────────────────┬──────────────────┬──────────────────┬────────┴─────────┐
       ▼                  ▼                  ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│     Fees     │   │    Store     │   │   Library    │   │  Donations   │   │  Dev System  │
│ (/dashboard) │   │   (/store)   │   │  (/library)  │   │(/donation-ad)│   │  (/system)   │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

---

## 2. Access, Authentication & PWA Installation

### 🌐 Direct Route Directory
* **Default Launch (`/`)**: Automatically routes authenticated users to their assigned workspace, or sends unauthenticated visitors to `/login`.
* **Public Foundation Showcase (`/foundation`)**: External public website showcasing the campus, 12 facility photographs, 80G tax exemption details, and public donation gateway.
* **Login Screen (`/login`)**: Secure credential entry gate.

### 🔐 Login Screen Features & Buttons
1. **Email & Password Fields**: Standard form inputs for registered institutional accounts.
2. **`🔐 Sign In` Button**: Validates credentials with the backend and stores the JWT session token.
3. **`⏳ Cloud Server Starting Up` 30s Countdown Timer**:
   * If the cloud instance was sleeping (cold-start), the system displays a live 30-second countdown with background health polling every 5 seconds.
   * **`⚡ Retry Now` Button**: Manually forces an instant re-connection attempt.
   * **`Cancel` Button**: Aborts the connection attempt.
4. **`☀️ Light / 🌙 Dark Mode` Switcher**: Located in the top-right corner to toggle between Blue-Beige light theme and obsidian dark theme.
5. **Direct 1-Click Role Logins**: Pre-configured test buttons to launch directly as Administrator, Accountant, Store Manager, Librarian, or Developer.

### 📲 PWA (Progressive Web App) Installation & Offline Mode
* **How to Install**: Click the floating **`📲 Install App`** button at the bottom-right of the screen.
* **Desktop / Mobile App Experience**: Runs in a standalone window with zero browser bars, its own application icon, and instant load times.
* **Session Persistence**: Logging in once inside the PWA keeps you signed in permanently on that device until you explicitly click **`🚪 Sign Out`**.

---

## 3. Master Credentials & Access Control Matrix

| Role | Default Email | Password | Allowed Workspaces | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **💻 DEVELOPER** | `pattiwarrushikesh5102@gmail.com` | `Rushikesh@5102`<br>*(or `DevPass123!`)* | All Workspaces + `/system` | Database telemetry, connection pool monitoring, live error logs, 1-click self-healing. |
| **👑 SUPERADMIN** | `superadmin@saiiti.edu.in` | `Admin@123` | All Workspaces | Enterprise configurations, multi-branch control, master audit logs, user provisioning. |
| **👨‍💼 BRANCH ADMIN** | `admin@saiiti.edu.in` | `Admin@123` | `/portal`, `/dashboard`, `/store`, `/library`, `/donation-admin` | Student admission, fee concessions, full inventory control, library circulation, reports. |
| **🧾 ACCOUNTANT** | `accountant@saiiti.edu.in` | `Accountant@123` | `/dashboard`, `/payments`, `/receipts`, `/reports` | Record fee payments, issue thermal receipts, generate defaulter notices, daily cash summary. |
| **📦 STORE MANAGER** | `storemanager@saiiti.edu.in` | `Store@123` | `/store` and sub-routes | Stock inward/outward, tool issue to students, machine maintenance logs, scrap registers. |
| **📚 LIBRARIAN** | `librarian@saiiti.edu.in` | `Library@123` | `/library` and sub-routes | Book cataloging, barcode circulation, book reservations, overdue fine collection, clearance. |
| **🎓 STUDENT** | `sai-2024-001@student.saiiti.edu.in` | `SAI-2024-001` | Student Self-Service | Check pending dues, online fee payment, view issued books, download past receipts. |

---

## 4. Mission Control Portal Hub (`/portal`)

Available to **Branch Administrators** and **Developers**. Displays a glassmorphic command center with Blue-Beige light styling and obsidian dark styling:

* **Card 1: 💻 Dev Home & Diagnostics** *(Developer Only)*: Direct link to `/system`.
* **Card 2: 💰 Fee Management**: Launches the Core Fee & Financial Operations workspace.
* **Card 3: 📦 Store Management**: Launches the Workshop Tools & Machinery Inventory workspace.
* **Card 4: 📚 Library Management**: Launches the Technical Books & Circulation workspace.
* **Card 5: 🤝 Donation & Foundation Admin**: Launches the Philanthropy & 80G Tax Exemption workspace.
* **`🚪 Sign Out` Button**: Immediately purges active JWT tokens and securely redirects to `/login`.

---

## 5. Fee Management Workspace

### 📊 1. Dashboard Overview (`/dashboard`)
* **KPI Metrics**:
  * **Total Revenue**: Cumulative fees collected across all academic batches.
  * **Pending Dues**: Real-time balance of outstanding student fees.
  * **Today's Collection**: Instant tally of cash/digital payments collected today.
  * **Active Enrolled Students**: Current institutional enrollment count.
* **Quick Action Buttons**:
  * **`➕ New Admission`**: Opens modal to register a new student.
  * **`💳 Record Payment`**: Jump directly to payment entry form.
  * **`📄 View Invoices`**: Open recent receipts archive.
  * **`📊 Export Financial Report`**: Download monthly ledger CSV.
* **Recent Transactions Table**: Shows Student Name, Trade, Amount, Mode, Date, and 1-click **`Print Receipt`** action.

---

### 👨‍🎓 2. Student Directory (`/students`)
* **Search & Filters**: Search by Student Name, Roll Number, or Admission ID. Filter by Trade (*Electrician, Fitter, Welder, COPA, Sewing Technology*) and Year (*1st Year, 2nd Year*).
* **`➕ Add New Student` Button**: Opens admission drawer with fields:
  * Full Name, Father's Name, Mother's Name, Contact Phone, Email, Aadhar Number.
  * Trade / Course selection, Academic Year, Admission Date.
  * Total Agreed Course Fee, Category Concession (General, OBC, SC, ST, EWS).
* **Student Action Menu**:
  * **`👁️ View Ledger`**: Shows full historical payment timeline and pending installments.
  * **`✏️ Edit Details`**: Update student phone, address, or trade.
  * **`📄 Fee Statement PDF`**: Generates a printable student fee statement.
  * **`🗑️ Deactivate Student`**: Archives graduated or transferred students.

---

### 💳 3. Payment Entry Desk (`/payments`)
* **Step 1: Select Student**: Autocomplete search bar by Name, Phone, or Roll Number.
* **Step 2: Fee Allocation**: Select Fee Head (*Tuition Fee, Exam Fee, Uniform & Dress Material, Hostel Fee, Miscellaneous*).
* **Step 3: Payment Details**:
  * **Amount (₹)**: Enter amount being paid.
  * **Payment Mode**: Select from `Cash`, `UPI / QR`, `Bank Transfer (NEFT/RTGS)`, `Cheque`, `Demand Draft`.
  * **Reference / UTR ID**: Input transaction ID or Cheque number.
  * **Remarks**: Optional cashier notes.
* **Step 4: `💾 Submit & Print Receipt`**:
  * Records payment to PostgreSQL database.
  * Triggers immediate printable receipt modal with thermal printer support.

---

### 🧾 4. Receipts & Invoices (`/receipts`)
* **Search Bar**: Lookup receipts by Receipt Number (e.g. `REC-2026-0891`) or Student Name.
* **`🖨️ Print` Button**: Standard A4 format with institutional header, student details, payment breakdown, and cashier signature line.
* **`📱 Thermal Print` Button**: Compact 80mm slip format for thermal POS printers.
* **`⬇️ Download PDF` Button**: Offline PDF generation.
* **`🚫 Void / Cancel Receipt` Button** *(Admin Only)*: Flags a receipt as cancelled with mandatory cancellation audit reason.

---

### ⚙️ 5. Fee Structures (`/fee-structures`)
* **Standard Course Fees**: Configure base annual tuition fees per trade.
* **Installment Rules**: Configure minimum down-payment on admission and due dates for remaining installments.
* **`➕ Add Custom Fee Head`**: Add institute-specific fees (e.g., Workshop Safety Kit Fee, Identity Card Fee).

---

### 📈 6. Financial Reports & Analytics (`/reports`)
* **Date Range Selector**: Filter collections by Today, This Week, This Month, or Custom Date Range.
* **Visual Charts**: Payment mode distribution (Cash vs UPI vs Bank Transfer) and monthly revenue trajectory.
* **Fee Defaulters Table**: Displays students with overdue fees past due dates.
* **`📩 Send Defaulter Reminder`**: Generates SMS/WhatsApp template with pending balance and payment link.
* **`📊 Export Audit CSV`**: Download complete financial ledger for institutional auditors.

---

## 6. Workshop Store & Inventory Management

Access via `/store` or Mission Control Hub.

```
Store Sub-Routes:
├── /store              (Store Overview & Low-Stock Alerts)
├── /store/items        (Master Item & Asset Catalog)
├── /store/issue        (Tool / Consumable Issue Desk)
├── /store/returns      (Item Return Register & Damage Assessment)
├── /store/damaged      (Scrap & Obsolete Asset Register)
├── /store/maintenance  (Machinery Preventative Maintenance Logs)
├── /store/history      (Complete Stock Movement Ledger)
└── /store/reports      (Valuation & Consumption Analytics)
```

### 📦 1. Store Overview & Low-Stock Alerts (`/store`)
* **Inventory Valuation KPI**: Total monetary value of workshop equipment and raw materials.
* **Low Stock Alerts Banner**: Highlights items falling below their safety threshold (e.g. welding electrodes, cutting oil, drill bits).
* **Pending Tool Returns**: Count of tools currently issued to students past their return date.

### 🛠️ 2. Item Catalog (`/store/items`)
* **`➕ Add New Item` Modal**:
  * Item Name, Item Code / Barcode, Category (*Consumables, Hand Tools, Power Tools, Heavy Machinery, Safety Gear*).
  * Unit of Measurement (*Pcs, Sets, Litres, Kg, Metres*).
  * Current Quantity, Minimum Alert Threshold, Unit Purchase Price, Supplier / Vendor Name.
* **Stock Inward Action**: Add newly purchased stock batches with Invoice Number and Date.

### 🔄 3. Tool Issue Desk (`/store/issue`)
* **Select Tool / Equipment**: Choose available item from inventory.
* **Select Borrower**: Link to enrolled Student or Trade Instructor.
* **Expected Return Date**: Set due date for returnable tools.
* **`📤 Confirm Issue` Button**: Deducts available quantity and logs transaction.

### 📥 4. Item Return Register (`/store/returns`)
* **Active Loans Table**: Search active borrowers.
* **Condition Assessment**: Select condition upon return:
  * `✅ Good Condition`: Full quantity restored to available stock.
  * `⚠️ Damaged`: Routes item to Damage Assessment and prompts for repair fine.
  * `❌ Lost`: Flags item as lost and generates student replacement charge.
* **`📥 Accept Return` Button**: Finalizes check-in.

### 🔧 5. Machinery Maintenance (`/store/maintenance`)
* **`➕ Schedule Service`**: Select machine (e.g., Lathe Machine #3, Bench Grinder, Arc Welder).
* **Service Details**: Service Type (*Routine Oiling, Motor Rewinding, Blade Replacement*), Technician Contact, Scheduled Date.
* **Status Flags**: `Scheduled` ➔ `In-Progress` ➔ `Completed`.

---

## 7. Library Management System

Access via `/library` or Mission Control Hub.

```
Library Sub-Routes:
├── /library              (Library Hub & Circulation Summary)
├── /library/books        (Technical Book Catalog & ISBN Management)
├── /library/issue        (Circulation Issue Desk)
├── /library/return       (Return Desk & Overdue Fine Calculator)
├── /library/reservations (Book Hold & Queue System)
├── /library/history      (Borrowing Audit Trail)
└── /library/reports      (Overdue Registers & Clearance Certificates)
```

### 📚 1. Book Catalog (`/library/books`)
* **`➕ Add New Book` Modal**:
  * Title, Author, ISBN Number, Category (*Electrical, Fitter, Electronics, Mathematics, Employability Skills, Fiction*).
  * Publisher, Edition, Shelf / Rack Location Code (e.g. `RACK-B-04`).
  * Total Copies Procured.
* **Live Search**: Instant lookup by ISBN, Book Title, or Author.

### 📖 2. Book Issue Desk (`/library/issue`)
* **Enter Book Accession Number**: Type or scan barcode.
* **Select Student / Staff**: Autocomplete lookup.
* **Loan Duration**: Automatically sets 14-day standard lending period.
* **`📤 Issue Book` Button**: Updates available book copies count.

### 📥 3. Book Return Desk (`/library/return`)
* **Scan / Select Book**: Pulls active borrower record.
* **Automatic Overdue Fine Calculator**: Computes fine at **₹2 / day** for overdue loans.
* **Action Buttons**:
  * **`💰 Collect Fine & Return`**: Records fine payment and restores book to available stock.
  * **`🕊️ Waive Fine & Return`** *(Admin / Librarian)*: Waives fine with an explanation note.

### 🔖 4. Book Reservations (`/library/reservations`)
* Allows students to reserve books that are currently issued out.
* When the book is returned, the system automatically alerts the reserving student.

### 📜 5. Library Reports & Clearance (`/library/reports`)
* **Overdue Borrower Ledger**: List of students holding overdue books with phone numbers.
* **`🖨️ Generate Library Clearance Certificate`**: 1-click verification that a student has zero unreturned books or unpaid library fines for graduation/exam hall-ticket clearance.

---

## 8. BSS Foundation & Philanthropy

### 🌐 1. Public Foundation Portal (`/foundation`)
* **Hero Showcase**: High-resolution slider presenting the educational mission of Bharat Shikshan Sanstha.
* **12 Geotagged Campus Photographs**: Complete visual tour with accurate facility titles and tags:
  1. *Institutional Library & Reading Room*
  2. *Academic Hallway & Notice Center*
  3. *Training & Placement Cell (Room 15)*
  4. *Executive Desk & Placement Office*
  5. *Faculty Chamber & Counseling Room*
  6. *Shri Sai ITI Campus Building (Jain Mandir Road)*
  7. *Accounts & Inquiries Counter*
  8. *Sewing Technology & Craft Workshop*
  9. *Fire Safety Emergency Station*
  10. *24/7 CCTV Surveillance System*
  11. *Central Institute Reception & Office*
  12. *Central Office Entrance & Campus Facade*
* **80G Tax Exemption Notice**: Informs donors of 50% income tax deductions under Section 80G of the Income Tax Act.
* **`💖 Contribute Now` Button**: Opens secure public donation modal supporting UPI, Cards, and NetBanking.

### 🛡️ 2. Donation Admin (`/donation-admin`)
* **Donor Directory**: Complete donor records with PAN numbers for 80G tax receipt compliance.
* **`📄 Generate 80G Certificate`**: Automated PDF certificate generation for donors.
* **Campaign Funding Meters**: Track donation progress toward specific campus labs and student scholarships.

---

## 9. Developer Home & System Diagnostics (`/system`)

Exclusive access for **Developer** (`pattiwarrushikesh5102@gmail.com`).

* **Live Telemetry & Vitals**:
  * Database Status (`ONLINE / CONNECTED`), Connection Pool Utilization, Active Transactions.
  * Server Latency Meter & API Uptime Percentage.
* **Security Audit Trail & Error Logs**:
  * Real-time stream of authorization events, failed logins, and system exceptions.
* **`⚡ 1-Click Database Self-Healing` Button**:
  * Clears stale connection locks, optimizes query plan caches, flushes Redis/in-memory queues, and revalidates schema integrity.
* **Environment Inspector**: Shows active database provider (Supabase / PostgreSQL), Node environment (`production`), and gateway statuses without exposing raw secrets.

---

## 10. Offline Mode, Local Persistence & Auto-Sync

The system includes a resilient **Offline Data Sync Engine**:

```
[Staff Device (No Internet)] ──► [IndexedDB Local Storage Queue]
                                             │
                       (Internet Reconnects) │
                                             ▼
[Cloud Database Sync] ◄─── [PWA Background Sync Manager]
```

1. **Working While Offline**: If internet connectivity drops, staff can continue recording fee payments, issuing store tools, and checking in library books.
2. **Offline Indicator Badge**: A floating badge at the bottom of the screen shows `"⚡ Offline Mode: X items pending sync"`.
3. **Automatic Cloud Sync**: As soon as internet is restored, the system automatically transmits queued offline records to the cloud database in the exact sequence they were created.
4. **Manual Sync Trigger**: Click **`⚡ Sync Now`** on the status badge to force an immediate sync.

---

## 11. Troubleshooting & Cold-Start FAQ

### Q1: Why does the login screen show a 30-second countdown?
**Answer**: When using free cloud instances (such as Render), the backend server sleeps when inactive to conserve resources. When you open the software, it takes ~25 seconds to spin up. The 30-second countdown automatically connects you the instant the server wakes up.

### Q2: How do I install the app on my Windows PC or Android phone?
**Answer**: 
* **Windows (Chrome / Edge)**: Click the **`📲 Install App`** button on screen, or click the install icon in your browser's address bar.
* **Android (Chrome)**: Tap the browser menu `(⋮)` ➔ **"Add to Home screen"**.
* **iPhone (Safari)**: Tap the share button `(⎋)` ➔ **"Add to Home Screen"**.

### Q3: How do I print fee receipts on thermal paper?
**Answer**: On the payment completion screen or receipts table, click the **`📱 Thermal Print`** button. Select your connected 80mm thermal receipt printer in the print dialog.

### Q4: What should I do if a student loses their fee receipt?
**Answer**: Go to **Receipts & Invoices (`/receipts`)**, type the student's name in the search box, and click **`🖨️ Print`** or **`⬇️ Download PDF`** to reprint the original receipt at any time.

---

*© 2026 Bharat Shikshan Sanstha & Shri Sai Private Industrial Training Institute. All rights reserved.*
