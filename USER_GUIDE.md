# 📖 Bharat Shikshan Sanstha — Shri Sai Private ITI
## Complete Enterprise User Guide & Role-Based Operational Manual (v2.0)

Welcome to the comprehensive **Role-by-Role Operational Handbook** for the **BSS Shri Sai ITI Unified ERP & Institutional Management Platform**. This guide is organized into dedicated operational chapters for each staff role: **Fee Accountant**, **Chief Librarian**, **Workshop Store Manager**, **Branch Administrator / Principal**, **Donations Officer**, **Class Teacher / Student**, and **System Developer**.

---

## 📑 Role-Based Table of Contents

- [Quick Start & Master Login Matrix](#-quick-start--master-login-matrix)
- [Chapter 1: Fee Accountant & Cashier Handbook](#-chapter-1-fee-accountant--cashier-handbook)
- [Chapter 2: Workshop Store Manager Handbook](#-chapter-2-workshop-store-manager-handbook)
- [Chapter 3: Chief Librarian Handbook](#-chapter-3-chief-librarian-handbook)
- [Chapter 4: Branch Administrator & Principal Handbook](#-chapter-4-branch-administrator--principal-handbook)
- [Chapter 5: BSS Foundation & Donations Officer Handbook](#-chapter-5-bss-foundation--donations-officer-handbook)
- [Chapter 6: Class Teacher & Student Self-Service Handbook](#-chapter-6-class-teacher--student-self-service-handbook)
- [Chapter 7: Developer & System Health Handbook](#-chapter-7-developer--system-health-handbook)
- [Chapter 8: Offline Operations & PWA Desktop Guide](#-chapter-8-offline-operations--pwa-desktop-guide)

---

## 🔑 Quick Start & Master Login Matrix

| Institutional Role | Default Login Email | Password | Primary Workspace | Default Landing Route |
| :--- | :--- | :--- | :--- | :--- |
| **🧾 Fee Accountant** | `accountant@saiiti.edu.in` | `Accountant@123` | Fee Operations | `/dashboard` |
| **📦 Store Manager** | `storemanager@saiiti.edu.in` | `Store@123` | Workshop Inventory | `/store` |
| **📚 Chief Librarian** | `librarian@saiiti.edu.in` | `Library@123` | Library Circulation | `/library` |
| **👨‍💼 Branch Admin / Principal** | `admin@saiiti.edu.in` | `Admin@123` | Portal Mission Control | `/portal` |
| **🤝 Donation Officer** | `admin@saiiti.edu.in` | `Admin@123` | Foundation Donations | `/donation-admin` |
| **💻 System Developer** | `pattiwarrushikesh5102@gmail.com` | `Rushikesh@5102` *(or `DevPass123!`)* | Full System + Telemetry | `/portal` ➔ `/system` |
| **🎓 Enrolled Student** | `sai-2024-001@student.saiiti.edu.in` | `SAI-2024-001` | Student Self-Service | `/dashboard` |

> 💡 **30-Second Cloud Waking Indicator**: If the backend was sleeping on cloud startup, the login page displays an animated 30s countdown timer and automatically logs you in the moment the server responds.

---

## 🧾 Chapter 1: Fee Accountant & Cashier Handbook

As the **Fee Accountant**, your primary responsibility is student fee collection, issuing legal tax/fee receipts, managing daily cash registers, tracking defaulters, and closing monthly financial ledgers.

```
Fee Accountant Route Directory:
├── /dashboard        (Daily Collection KPIs, Quick Action Buttons & Recent Invoices)
├── /payments         (Student Payment Entry Desk & Instant Thermal Printing)
├── /receipts         (Receipt Search, A4/Thermal Reprinting & Voiding)
├── /students         (Student Directory, Admission Ledger & Fee Balance)
└── /reports          (Daily Cashbook, Defaulter Ledgers & CSV Audit Export)
```

### 1.1 Daily Morning Routine
1. Log in with `accountant@saiiti.edu.in` / `Accountant@123`.
2. Inspect the **Dashboard KPIs**:
   * **Today's Collection**: Starts at ₹0 each morning and tallies all payments received throughout the day.
   * **Pending Dues**: Real-time balance of outstanding student installments across all trades.
   * **Total Revenue**: Cumulative revenue collected in the active academic session.

### 1.2 Step-by-Step Payment Collection Workflow (`/payments`)
When a student or parent arrives at the fee counter to pay fees:
1. Navigate to **Payment Entry (`/payments`)** or click **`💳 Record Payment`** from the dashboard.
2. **Step 1: Locate Student**:
   * Type the student's **Name**, **Enrollment ID** (e.g. `SAI-2024-001`), or **Mobile Number** in the search bar.
   * Select the student from the autocomplete dropdown. The system automatically loads their Trade (*Electrician, Fitter, etc.*), Total Agreed Fee, Paid Amount, and Remaining Due Balance.
3. **Step 2: Allocate Fee Head**:
   * Choose the fee head being paid: `Tuition Fee`, `Exam Fee`, `Uniform & Dress Material`, `Hostel Fee`, or `Miscellaneous Dues`.
4. **Step 3: Enter Payment Details**:
   * **Amount (₹)**: Type the amount received (e.g. `5000`).
   * **Payment Mode**:
     * `💵 Cash`: For physical currency accepted at the counter.
     * `📱 UPI / QR Code`: For PhonePe, Google Pay, Paytm, or BHIM payments (enter UPI Transaction ID / UTR).
     * `🏦 Bank Transfer (NEFT/RTGS)`: Enter bank reference number.
     * `📜 Cheque / Demand Draft`: Enter Cheque/DD number, Bank Name, and Date.
   * **Remarks / Notes**: Optional notes (e.g., *"2nd installment for semester 1"*).
5. **Step 4: Submit & Print Receipt**:
   * Click **`💾 Submit & Print Receipt`**.
   * The payment is instantly written to the cloud PostgreSQL database and an official receipt modal opens.

### 1.3 Receipt Printing & Thermal Slip Generation (`/receipts`)
* **Standard A4 Receipt (`🖨️ Print`)**: Prints a full-size institutional receipt featuring the Shri Sai ITI emblem, registration details, student breakdown, payment mode, cashier signature block, and official seal area.
* **Thermal POS Receipt (`📱 Thermal Print`)**: Formats the receipt for standard 80mm / 2-inch thermal POS slip printers for fast counter dispatch.
* **PDF Download (`⬇️ Download PDF`)**: Saves an offline digital copy to share with parents via WhatsApp or email.
* **Reprinting Lost Receipts**: Go to `/receipts`, search the student's name or Receipt ID, and click **`🖨️ Print`**.

### 1.4 Daily Closing & Defaulter Follow-up (`/reports`)
* **Daily Cash Reconciliation**:
  1. Open **Reports (`/reports`)**.
  2. Select Date: **Today**.
  3. Verify the **Cash Total** against the physical currency notes in the counter cash drawer.
  4. Verify the **UPI / Digital Total** against the institutional bank statement.
* **Defaulter Action**:
  1. Click **Fee Defaulters** tab in `/reports`.
  2. Filter by Trade (e.g. *Electrician 1st Year*).
  3. Click **`📩 Send Defaulter Reminder`** next to a student's name to generate an automated reminder notice with pending dues.
  4. Click **`📊 Export Audit CSV`** to download the complete ledger for the auditor.

---

## 📦 Chapter 2: Workshop Store Manager Handbook

As the **Workshop Store Manager**, you control all institutional equipment, heavy machinery, power tools, consumables, safety gear, stock inward procurement, and tool loans to trade students.

```
Store Manager Route Directory:
├── /store              (Store Overview, Low-Stock Alert Banners & Loan Vitals)
├── /store/items        (Master Equipment Catalog, Barcodes & Procurement)
├── /store/issue        (Tool & Equipment Loan Issue Desk)
├── /store/returns      (Item Check-in Register & Damage Assessment)
├── /store/damaged      (Scrap, Damaged Tools & Write-Off Approval)
├── /store/maintenance  (Machinery Preventative Service Logs)
├── /store/history      (Full Inward / Outward Stock Audit Trail)
└── /store/reports      (Inventory Valuation & Monthly Consumption Analytics)
```

### 2.1 Managing Inventory & Adding New Assets (`/store/items`)
1. Click **`➕ Add New Item`** on `/store/items`.
2. Fill in the item specifications:
   * **Item Name**: e.g., *Digital Multimeter 600V*, *Bench Vice 6 Inch*, *Welding Electrodes 3.15mm*.
   * **Category**: Select `Consumables`, `Hand Tools`, `Power Tools`, `Heavy Machinery`, or `Safety Equipment`.
   * **Unit of Measure**: `Pcs`, `Sets`, `Kg`, `Litres`, `Metres`, `Boxes`.
   * **Initial Stock Quantity**: Physical count in the store room.
   * **Minimum Alert Threshold**: When available stock falls below this number (e.g., 5 pcs), the system automatically triggers a red **Low Stock Alert**.
   * **Unit Price (₹)**: Purchase cost per unit for inventory valuation.
   * **Supplier / Vendor**: Vendor name and contact details.
3. Click **`💾 Save Item`**.

### 2.2 Recording New Procurement / Stock Inward
When new stock arrives from suppliers:
1. In `/store/items`, locate the item and click **`➕ Stock Inward`**.
2. Enter the **Quantity Received**, **Supplier Invoice Number**, **Batch / Delivery Date**, and **Total Invoice Cost**.
3. Click **`Confirm Stock Inward`**. The system increments total stock and logs an entry in `/store/history`.

### 2.3 Issuing Tools to Students / Instructors (`/store/issue`)
1. Open **Tool Issue Desk (`/store/issue`)**.
2. **Select Tool**: Search item by name or scan barcode.
3. **Select Borrower**: Choose the enrolled student or workshop trade instructor.
4. **Quantity**: Enter number of units issued.
5. **Expected Return Date**: Set due date (e.g., end of practical period or end of week).
6. **Condition on Issue**: `Brand New` or `Good Condition`.
7. Click **`📤 Issue Tool`**. The available quantity in store drops automatically.

### 2.4 Returning Tools & Damage Assessment (`/store/returns`)
When a student returns an issued tool:
1. Open **Item Return Register (`/store/returns`)**.
2. Search active loan by Student Name or Tool Code.
3. Inspect physical tool and select condition:
   * `✅ Good Condition`: Tool returned in perfect working order. Stock count is restored.
   * `⚠️ Damaged`: Tool returned broken/burned out. Prompts for **Damage Repair Fine (₹)** and logs entry into the Damaged Items register.
   * `❌ Lost`: Tool not returned. Flags student account with replacement penalty.
4. Click **`📥 Accept Return`**.

### 2.5 Machinery Maintenance Scheduling (`/store/maintenance`)
1. Navigate to `/store/maintenance` to inspect heavy workshop machines (*Lathe #1, Lathe #2, Milling Machine, Bench Grinders*).
2. Click **`➕ Schedule Service`**.
3. Enter Service Details (*Routine Oiling, Blade Sharpening, Motor Rewinding*), Assigned Technician, and Due Date.
4. Update status from `Scheduled` ➔ `In-Progress` ➔ `Completed`.

---

## 📚 Chapter 3: Chief Librarian Handbook

As the **Chief Librarian**, you govern the institutional library, technical syllabus book collections, barcode circulation, overdue fine calculations, reservations, and clearance certificates.

```
Chief Librarian Route Directory:
├── /library              (Circulation Statistics, Active Loans & Overdue Counters)
├── /library/books        (Technical Book Catalog, ISBNs & Shelf Coordinates)
├── /library/issue        (Circulation Issue Desk)
├── /library/return       (Return Desk & Overdue Fine Waiver/Collection)
├── /library/reservations (Book Queue & Hold Management)
├── /library/history      (Borrowing Audit Trail by Student or Book)
└── /library/reports      (Overdue Ledgers & Student Clearance Certificates)
```

### 3.1 Adding Books to Library Catalog (`/library/books`)
1. Open `/library/books` and click **`➕ Add New Book`**.
2. Enter bibliographic details:
   * **Book Title**: e.g., *Basic Electrical Engineering (NCVT/DGET Standard)*.
   * **Author(s)**: Author name.
   * **ISBN / Accession Number**: Unique identifier or barcode number.
   * **Category / Trade**: `Electrical`, `Fitter`, `Electronics`, `Workshop Calculation & Science`, `Employability Skills`, `General Reference`.
   * **Publisher & Edition**: e.g., *NIMI Publications / 4th Edition*.
   * **Shelf / Rack Coordinate**: e.g., `RACK-E-02` (enables instant physical retrieval).
   * **Total Copies Procured**: Total physical copies added to library.
3. Click **`💾 Save Book`**.

### 3.2 Issuing Books to Students / Staff (`/library/issue`)
1. Open **Circulation Issue Desk (`/library/issue`)**.
2. **Accession Number**: Scan barcode or enter book code.
3. **Borrower**: Select student by name or enrollment ID.
4. **Loan Duration**: Automatically sets 14 days standard lending window.
5. Click **`📤 Issue Book`**. Available book count decrements by 1.

### 3.3 Returning Books & Overdue Fine Management (`/library/return`)
1. Open **Book Return Desk (`/library/return`)**.
2. Scan book accession barcode. The system retrieves borrower name and due date.
3. **Automatic Fine Calculation**:
   * If returned within 14 days: **Fine = ₹0.00**.
   * If overdue: The system calculates **₹2.00 per day** past the due date.
4. **Action**:
   * **`💰 Collect Fine & Return`**: Records collected fine in daily library revenue and checks in the book.
   * **`🕊️ Waive Fine & Return`**: Waives fine for justified reasons (*medical leave, exam period*) with a mandatory waiver note.

### 3.4 Student Clearance Certificates for Exams / Graduation (`/library/reports`)
Before semester exams or final graduation:
1. Open **Library Reports (`/library/reports`)**.
2. Search student enrollment ID.
3. Click **`🖨️ Generate Library Clearance Certificate`**.
4. The system validates that the student has **0 unreturned books** and **₹0 unpaid fines**, printing an official stamped clearance slip for exam hall-ticket release.

---

## 👨‍💼 Chapter 4: Branch Administrator & Principal Handbook

As the **Branch Administrator / Principal**, you have institutional executive control across all four modules (Fees, Store, Library, Donations) via the **Mission Control Portal Hub (`/portal`)**.

```
Administrator Command Architecture:
├── /portal             (Central Mission Control Workspace Hub)
├── /dashboard          (Institution-wide Financial KPI Overview)
├── /students           (Student Admissions, Profile Editing & Concessions)
├── /fee-structures     (Base Course Fee & Installment Configuration)
├── /store              (Store Audit & Maintenance Approvals)
├── /library            (Library Policy & Circulation Audits)
└── /donation-admin     (80G Philanthropy & Form 10BD Compliance)
```

### 4.1 Navigating the Mission Control Hub (`/portal`)
1. Log in with `admin@saiiti.edu.in` / `Admin@123`.
2. The **Central Workspace Portal Hub** opens with 4 interactive glassmorphic cards:
   * Click **💰 Fee Management** ➔ Launches financial operations.
   * Click **📦 Store Management** ➔ Launches workshop inventory.
   * Click **📚 Library Management** ➔ Launches technical library.
   * Click **🤝 Donation Admin** ➔ Launches 80G foundation philanthropy.
3. To switch workspaces at any time, click **`Portal Hub`** in the top navigation bar.

### 4.2 New Student Admission & Fee Concession Approval (`/students`)
1. Open **Student Directory (`/students`)** and click **`➕ Add New Student`**.
2. Enter student demographic details and select trade (*Electrician 2-Yr, Fitter 2-Yr, Welder 1-Yr, COPA 1-Yr, Sewing Technology 1-Yr*).
3. **Fee Concession / Scholarship Assignment**:
   * Set Base Course Fee (e.g. `₹25,000`).
   * Apply Category Concession (*SC/ST Welfare Scheme, Merit Discount, Staff Dependent*).
   * Enter Net Agreed Annual Fee (e.g. `₹18,000`).
4. Click **`Submit Admission`**. The student profile and fee ledger are created simultaneously.

### 4.3 Configuring Base Fee Structures (`/fee-structures`)
1. Open **Fee Structures (`/fee-structures`)**.
2. Review annual fees per trade.
3. Click **`➕ Add Fee Head`** to introduce institutional fee heads (*Workshop Maintenance Fee, Practical Exam Fee, Uniform Fee*).
4. Define standard installment schedules (e.g., *50% on Admission, 25% by Term 1, 25% by Term 2*).

---

## 🤝 Chapter 5: BSS Foundation & Donations Officer Handbook

As the **Donations Officer**, you govern charitable gifts received by the **Bharat Shikshan Sanstha**, issue tax-exempt receipts under **Section 80G**, and prepare annual filings for **Form 10BD**.

```
Donation Officer Route Directory:
├── /foundation                  (Public Philanthropy Portal & 12 Campus Photos)
├── /donation-admin              (Donation Dashboard & Campaign Progress)
├── /donation-admin/donors       (Donor Directory & PAN Compliance)
├── /donation-admin/transactions (Transaction Ledger & Payment Status)
└── /donation-admin/reports      (Section 80G Certificates & Form 10BD Export)
```

### 5.1 Public Foundation Portal Maintenance (`/foundation`)
The public portal at `/foundation` is the external face of the institution:
* Features the **12 Geotagged Campus Photographs** showing library, classrooms, trade workshops, fire safety, and CCTV security.
* Features the **Section 80G Tax Exemption Notice** explaining the 50% tax benefit for Indian taxpayers.
* Features the **`💖 Contribute Now`** modal supporting instant digital donations.

### 5.2 Recording Offline / Direct Bank Donations (`/donation-admin`)
When alumni, philanthropists, or corporate CSR partners donate via Cheque or NEFT:
1. Open **Donation Admin (`/donation-admin`)**.
2. Click **`➕ Record Donation`**.
3. Enter Donor Name, PAN Number *(Mandatory for 80G tax benefit)*, Mobile, Email, and Address.
4. Enter Amount (₹), Payment Mode, Bank Reference Number, and Purpose (*Student Scholarship, Workshop Modernization, Library Books*).
5. Click **`💾 Save & Generate 80G Receipt`**.

### 5.3 Issuing Section 80G Tax Certificates (`/donation-admin/reports`)
1. Locate the donor in `/donation-admin/reports`.
2. Click **`📄 Generate 80G Certificate PDF`**.
3. The system compiles an official certificate including BSS Trust Registration Number, 80G Approval Reference, Donor PAN, and Donated Amount.
4. Click **`📊 Export Form 10BD CSV`** at the end of the financial year to upload directly to the Income Tax Department e-filing portal.

---

## 🎓 Chapter 6: Class Teacher & Student Self-Service Handbook

### 6.1 Class Teacher Workflow
* Class instructors can check active student rosters, verify fee clearance status before practical exams, and ensure workshop tool returns before semester sign-offs.

### 6.2 Student Portal Self-Service
Students log in using their enrollment credentials (e.g. `sai-2024-001@student.saiiti.edu.in` / `SAI-2024-001`):
1. **View Fee Statement**: Check total fees paid, upcoming installment due dates, and outstanding balance.
2. **Download Receipts**: Download duplicate PDF fee receipts for parents or scholarship reimbursement.
3. **Library & Tool Loans**: View books currently checked out and their scheduled return due dates.

---

## 💻 Chapter 7: Developer & System Health Handbook

Exclusive access for **System Developer** (`pattiwarrushikesh5102@gmail.com`).

```
Developer Route: /system
```

### 7.1 Real-Time Telemetry & Vitals
* **Database Engine**: PostgreSQL with Supabase pool status (`ONLINE / HEALTHY`).
* **Connection Pool Utilization**: Monitored active pool workers and query latency meter.
* **API Uptime**: Real-time server responsiveness telemetry.

### 7.2 Security Audit Trail & Error Logs
* Stream of live system exceptions, failed login attempts, privilege escalations, and database transaction locks.

### 7.3 ⚡ 1-Click Database Self-Healing
Clicking the **`⚡ 1-Click Database Self-Healing`** button triggers an automated maintenance routine:
1. Terminates idle database connections and resolves deadlock states.
2. Flushes cached query plans and runs `VACUUM ANALYZE` on core tables.
3. Revalidates Prisma schema constraints and resets in-memory offline sync queues.

---

## 📱 Chapter 8: Offline Operations & PWA Desktop Guide

### 8.1 How to Install on Desktop / Android / iOS
* **Windows / Mac**: Open Chrome or Edge ➔ Click **`📲 Install App`** button at bottom right ➔ Click **Install**.
* **Android**: Open Chrome ➔ Tap `(⋮)` ➔ **"Add to Home Screen"**.
* **iPhone**: Open Safari ➔ Tap `(⎋)` ➔ **"Add to Home Screen"**.

### 8.2 Working Without Internet (Offline Resilience)
1. If the internet connection drops during counter operations, the system continues functioning smoothly.
2. Staff can record payments, issue tools, and check in books.
3. Transactions are stored in the secure **IndexedDB Local Storage Queue**.
4. An offline indicator displays at the bottom: **`⚡ Offline Mode (X items pending sync)`**.
5. As soon as connectivity returns, the system **automatically transmits all queued records to the cloud database** without data loss.

---

*© 2026 Bharat Shikshan Sanstha & Shri Sai Private Industrial Training Institute. All rights reserved.*
