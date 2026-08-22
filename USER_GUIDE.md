# 📖 Bharat Shikshan Sanstha — Shri Sai Private ITI
# 🚀 First-Time User Onboarding Guide & Role-Based Operational Manual (v2.0)

Welcome to the official **First-Time User Manual** for the **BSS Shri Sai ITI Unified ERP & Institutional Management Platform**. This guide is structured role-by-role so that every staff member — from the Institute Administrator and Fee Accountant to the Workshop Store Manager, Chief Librarian, Donation Officer, and Student — can immediately master the system on Day 1.

---

## 📑 Role-Based Table of Contents

* [0. Universal Quick Start (For All Users)](#0-universal-quick-start-for-all-users)
  * [Direct URL Access & Theme Toggle](#direct-url-access--theme-toggle)
  * [30-Second Cloud Cold-Start Reconnection](#30-second-cloud-cold-start-reconnection)
  * [Installing the Desktop / Mobile App (PWA)](#installing-the-desktop--mobile-app-pwa)
* [1. 👨‍💼 First-Time Guide for Branch Administrators (Admin)](#1-first-time-guide-for-branch-administrators-admin)
  * [Day 1 Checklist](#day-1-admin-checklist)
  * [Navigating the Portal Mission Control Hub](#navigating-the-portal-mission-control-hub)
  * [Registering a New Student Admission (Step-by-Step)](#registering-a-new-student-admission-step-by-step)
  * [Configuring Fee Structures & Concessions](#configuring-fee-structures--concessions)
  * [Monitoring Campus-Wide Vitals & Reports](#monitoring-campus-wide-vitals--reports)
  * [Voiding / Cancelling Receipts (Security Protocol)](#voiding--cancelling-receipts-security-protocol)
  * [Admin Button & Feature Directory](#admin-button--feature-directory)
* [2. 🧾 First-Time Guide for Fee Accountants](#2-first-time-guide-for-fee-accountants)
  * [Day 1 Checklist](#day-1-accountant-checklist)
  * [Understanding the Dashboard Overview](#understanding-the-dashboard-overview)
  * [Recording a Daily Fee Collection (Step-by-Step)](#recording-a-daily-fee-collection-step-by-step)
  * [Printing Thermal Receipts (80mm) vs Standard A4 Receipts](#printing-thermal-receipts-80mm-vs-standard-a4-receipts)
  * [Reprinting Past / Lost Receipts](#reprinting-past--lost-receipts)
  * [Managing Fee Defaulters & Triggering Reminders](#managing-fee-defaulters--triggering-reminders)
  * [End-of-Day Cash Reconciliation & CSV Export](#end-of-day-cash-reconciliation--csv-export)
  * [Accountant Button & Feature Directory](#accountant-button--feature-directory)
* [3. 📦 First-Time Guide for Workshop Store Managers](#3-first-time-guide-for-workshop-store-managers)
  * [Day 1 Checklist](#day-1-store-manager-checklist)
  * [Adding Tools, Machinery & Consumables to Catalog](#adding-tools-machinery--consumables-to-catalog)
  * [Setting Low Stock Alert Thresholds](#setting-low-stock-alert-thresholds)
  * [Issuing Workshop Equipment to Students/Faculty (Step-by-Step)](#issuing-workshop-equipment-to-studentsfaculty-step-by-step)
  * [Processing Tool Returns & Damage Assessment](#processing-tool-returns--damage-assessment)
  * [Logging Machinery Maintenance Schedules](#logging-machinery-maintenance-schedules)
  * [Scrap & Disposal Register](#scrap--disposal-register)
  * [Store Manager Button & Feature Directory](#store-manager-button--feature-directory)
* [4. 📚 First-Time Guide for Chief Librarians](#4-first-time-guide-for-chief-librarians)
  * [Day 1 Checklist](#day-1-librarian-checklist)
  * [Cataloging New Books (ISBN, Shelf Location & Copies)](#cataloging-new-books-isbn-shelf-location--copies)
  * [Issuing Books to Students / Staff (14-Day Cycle)](#issuing-books-to-students--staff-14-day-cycle)
  * [Processing Book Returns & Overdue Fine Calculation (₹2/day)](#processing-book-returns--overdue-fine-calculation-2day)
  * [Waiving Fines (With Audit Note)](#waiving-fines-with-audit-note)
  * [Managing Book Reservations & Hold Queues](#managing-book-reservations--hold-queues)
  * [Generating Student Library Clearance Certificates](#generating-student-library-clearance-certificates)
  * [Librarian Button & Feature Directory](#librarian-button--feature-directory)
* [5. 🤝 First-Time Guide for BSS Foundation & Donation Officers](#5-first-time-guide-for-bss-foundation--donation-officers)
  * [Day 1 Checklist](#day-1-donation-officer-checklist)
  * [Public Showcase Management (`/foundation`)](#public-showcase-management-foundation)
  * [Recording Donor Contributions with PAN Details](#recording-donor-contributions-with-pan-details)
  * [Generating Section 80G Tax Exemption PDF Certificates](#generating-section-80g-tax-exemption-pdf-certificates)
  * [Tracking Campaign Funding Meters](#tracking-campaign-funding-meters)
  * [Form 10BD Compliance & Audit Export](#form-10bd-compliance--audit-export)
  * [Donation Admin Button & Feature Directory](#donation-admin-button--feature-directory)
* [6. 💻 First-Time Guide for Developers & System Administrators](#6-first-time-guide-for-developers--system-administrators)
  * [Developer Diagnostics Screen (`/system`)](#developer-diagnostics-screen-system)
  * [Database Connection Pool & Latency Telemetry](#database-connection-pool--latency-telemetry)
  * [Security Audit Logs & Live Error Streams](#security-audit-logs--live-error-streams)
  * [Using the "⚡ 1-Click Database Self-Healing" Engine](#using-the--1-click-database-self-healing-engine)
* [7. 🎓 First-Time Guide for Students & Parents](#7-first-time-guide-for-students--parents)
  * [Logging in with Student Roll Number](#logging-in-with-student-roll-number)
  * [Checking Pending Fee Dues & Installment Schedule](#checking-pending-fee-dues--installment-schedule)
  * [Paying Fees Online via UPI / Card](#paying-fees-online-via-upi--card)
  * [Viewing Issued Library Books & Return Dates](#viewing-issued-library-books--return-dates)
* [8. ⚡ Offline Mode & PWA Synchronization Guide (All Staff)](#8--offline-mode--pwa-synchronization-guide-all-staff)

---

## 0. Universal Quick Start (For All Users)

### Direct URL Access & Theme Toggle
* **Access URL**: Open `https://your-domain.vercel.app` (or `http://localhost:3000` locally).
* **Automatic Routing**: 
  * If you are not logged in, the system opens **`/login`**.
  * If you are an **Administrator** or **Developer**, you land on the **`/portal`** Mission Control Hub.
  * If you are an **Accountant**, you land directly on the **`/dashboard`**.
  * If you are a **Store Manager**, you land directly on **`/store`**.
  * If you are a **Librarian**, you land directly on **`/library`**.
* **☀️ Light / 🌙 Dark Mode**: Click the pill button in the top-right corner to toggle between the **Blue-Beige light theme** and the **Obsidian dark theme**.

### 30-Second Cloud Cold-Start Reconnection
Free cloud servers go to sleep during idle periods. When launching the system for the first time:
1. If the server is waking up, you will see a friendly **`⏳ Cloud Server Starting Up`** banner with a **30-second live countdown timer**.
2. **Background Health Polling**: The frontend checks the server every 5 seconds. As soon as the server wakes up (e.g., at 12s), it **instantly logs you in** without waiting for the full 30 seconds.
3. You can click **`⚡ Retry Now`** at any moment to force an immediate reconnection check.

### Installing the Desktop / Mobile App (PWA)
1. In the bottom-right corner of your screen, click the **`📲 Install App`** button.
2. In the browser popup, click **Install**.
3. A desktop icon labeled **"Shri Sai ITI ERP"** will be added to your Windows desktop taskbar or phone home screen.
4. **Benefit**: Launches instantly in a clean standalone window with no URL bar, keeps you logged in, and works even during internet outages.

---

## 1. 👨‍💼 First-Time Guide for Branch Administrators (Admin)

**Default Login**: `admin@saiiti.edu.in` / `Admin@123`

### Day 1 Admin Checklist
- [ ] Log in and explore the **Portal Mission Control Hub (`/portal`)**.
- [ ] Verify standard trade fee structures under **Fee Structures (`/fee-structures`)**.
- [ ] Enroll your first student under **Student Directory (`/students`)**.
- [ ] Review live dashboard metrics under **Dashboard (`/dashboard`)**.
- [ ] Check workshop inventory under **Store (`/store`)** and book catalog under **Library (`/library`)**.

---

### Navigating the Portal Mission Control Hub
As an Administrator, logging in brings you to the **Portal Hub (`/portal`)** showcasing five glassmorphic cards:
1. 💰 **Fee Management**: Opens the student billing, collection, and reporting suite.
2. 📦 **Store Management**: Opens workshop inventory, equipment loans, and machinery logs.
3. 📚 **Library Management**: Opens book cataloging, circulation desk, and clearance.
4. 🤝 **Donation & Foundation Admin**: Opens 80G tax receipting and philanthropy ledger.
5. 🚪 **Sign Out**: Clears session token and returns to login gate.

---

### Registering a New Student Admission (Step-by-Step)
1. From the Portal Hub, click **Fee Management** ➔ Navigate to **Students (`/students`)** in the left sidebar.
2. Click the blue **`➕ Add New Student`** button at the top-right.
3. Complete the multi-tab admission form:
   * **Personal Information**: Full Name, Father's Name, Mother's Name, Gender, Date of Birth, Aadhar Card Number.
   * **Contact Details**: Primary Mobile Number, WhatsApp Number, Email Address, Residential Address.
   * **Academic Allocation**:
     * **Trade / Course**: Select from *Electrician (2 Years)*, *Fitter (2 Years)*, *Welder (1 Year)*, *COPA (1 Year)*, *Sewing Technology (1 Year)*.
     * **Academic Batch**: e.g., `2024-2026`.
     * **Roll Number / Admission ID**: Auto-generated or custom institutional number.
   * **Fee Allocation**:
     * **Agreed Total Course Fee**: Standard fee is auto-filled based on the trade.
     * **Category / Merit Concession**: Select General, OBC, SC, ST, or Special Concession.
4. Click **`💾 Save Admission & Generate Student File`**.
5. The student is now enrolled, and their ledger is created with calculated installment due dates.

---

### Configuring Fee Structures & Concessions
1. In the sidebar, click **Fee Structures (`/fee-structures`)**.
2. **Editing Trade Fees**: Click **`✏️ Edit`** next to any trade (e.g. Electrician) to update annual tuition, exam fees, and workshop development charges.
3. **Adding Custom Fee Heads**: Click **`➕ Add Fee Category`** to introduce new heads like *Workshop Uniform Fee*, *Safety Shoes & Kit*, or *Hostel Boarding*.
4. **Installment Schedules**: Set default payment milestone percentages (e.g. 40% on admission, 30% before Semester 1 exams, 30% before Semester 2 exams).

---

### Monitoring Campus-Wide Vitals & Reports
1. Go to **Reports (`/reports`)**.
2. Set the date range (e.g. Current Month / Current Quarter).
3. Review:
   * **Total Revenue vs Outstanding Balances**.
   * **Payment Mode Split**: Track Cash vs UPI vs Bank transfers for treasury audit.
   * **Trade-Wise Performance**: Compare fee recovery across Electrician, Fitter, and Sewing trades.
4. Click **`📊 Export Audit CSV`** to share the financial ledger with external chartered accountants.

---

### Voiding / Cancelling Receipts (Security Protocol)
If an accountant makes an erroneous entry (e.g., wrong amount entered):
1. Navigate to **Receipts & Invoices (`/receipts`)**.
2. Locate the transaction using the search bar (by receipt number or student name).
3. Click the red **`🚫 Void / Cancel`** button *(Admin privilege only)*.
4. Enter the **Mandatory Cancellation Reason** (e.g., "Cheque bounced" or "Entered incorrect fee head").
5. The receipt is marked `CANCELLED`, reversed from the ledger, and permanently logged in the audit trail.

---

### Admin Button & Feature Directory
| Button / Control | Location | Function / Result |
| :--- | :--- | :--- |
| **`➕ Add New Student`** | `/students` | Opens student registration drawer with trade and fee setup. |
| **`✏️ Edit Details`** | Student Table | Modifies student contact, address, or trade allocation. |
| **`👁️ View Ledger`** | Student Table | Shows chronological history of all charges and payments for that student. |
| **`📄 Fee Statement PDF`** | Student Table | Generates an official printable PDF statement of fees paid and dues. |
| **`➕ Add Fee Category`** | `/fee-structures` | Creates a new institutional fee head. |
| **`🚫 Void Receipt`** | `/receipts` | Reverses an erroneous payment with mandatory audit log reason. |
| **`📊 Export Audit CSV`** | `/reports` | Downloads full database ledger in CSV format for accounting audits. |

---

## 2. 🧾 First-Time Guide for Fee Accountants

**Default Login**: `accountant@saiiti.edu.in` / `Accountant@123`

### Day 1 Accountant Checklist
- [ ] Log in (automatically opens the **Dashboard**).
- [ ] Perform a test payment entry for a student.
- [ ] Test the **Thermal Print (80mm)** and **Standard A4 Print** formats.
- [ ] Review the **Daily Collection Summary** widget.
- [ ] Check the **Fee Defaulters** list.

---

### Understanding the Dashboard Overview
Upon logging in, the accountant sees the live financial cockpit:
* **Total Collected Today**: Running total of all cash and digital fees received since 00:00.
* **Pending Institutional Dues**: Total unpaid balance across all active students.
* **Quick Payment Button**: Prominent action to jump straight into payment recording.
* **Recent Receipts Stream**: Chronological feed of the last 10 issued receipts.

---

### Recording a Daily Fee Collection (Step-by-Step)
1. Click **`💳 Record Payment`** on the dashboard (or navigate to **`/payments`**).
2. **Step 1: Search Student**:
   * Type student's name, phone number, or roll number in the autocomplete box.
   * Select the student. Their current outstanding balance will appear instantly.
3. **Step 2: Allocate Fee Head**:
   * Select the target fee component: *Tuition Fee*, *Exam Fee*, *Uniform & Dress Material*, *Miscellaneous Dues*.
4. **Step 3: Enter Payment Details**:
   * **Amount Paid (₹)**: Type the amount being collected.
   * **Payment Mode**: Select `Cash`, `UPI / QR`, `Bank Transfer (NEFT/RTGS)`, `Cheque`, or `Demand Draft`.
   * **Transaction / Reference ID**: If UPI/Bank/Cheque, enter the UTR or Cheque Number.
   * **Cashier Remarks**: Optional notes (e.g. "Installment 2 of 3").
5. **Step 4: Submit**:
   * Click **`💾 Submit & Generate Receipt`**.
   * The payment is committed to the database, student balance is updated, and the receipt modal opens automatically.

---

### Printing Thermal Receipts (80mm) vs Standard A4 Receipts
After recording a payment, the receipt dialog offers two formats:
* **📱 80mm Thermal Receipt**:
  * Designed for POS thermal receipt printers.
  * Contains Institute Name, Date, Receipt Number, Student Name, Trade, Amount Paid, Remaining Due, and Cashier signature code.
  * Click **`📱 Print Thermal Slip`** ➔ Select 80mm printer.
* **🖨️ Standard A4 Full Receipt**:
  * Designed for standard inkjet/laser printers.
  * Contains official institution header, fee component breakdown, stamp box, and student copy / office copy split.
  * Click **`🖨️ Print Standard A4`**.

---

### Reprinting Past / Lost Receipts
1. Navigate to **Receipts & Invoices (`/receipts`)**.
2. Type the Student Name or Receipt Number in the search bar.
3. Click **`🖨️ Print`** or **`⬇️ Download PDF`**.
4. The exact original receipt is regenerated with its original timestamp and transaction ID.

---

### Managing Fee Defaulters & Triggering Reminders
1. Go to **Reports (`/reports`)** and scroll down to **Fee Defaulters Register**.
2. Filter by Trade (e.g. *Fitter 2nd Year*) to view students with overdue balances past the deadline.
3. Click **`📩 Send WhatsApp Reminder`** next to the student's name.
4. The system opens a pre-formatted message including student name, outstanding amount, and payment options.

---

### End-of-Day Cash Reconciliation & CSV Export
At the close of each working day:
1. Open **Reports (`/reports`)**.
2. Set Date Filter to **"Today"**.
3. Verify the **Cash In Hand** total against your physical cash drawer.
4. Verify the **UPI / QR** total against your ICICI / UPI merchant terminal.
5. Click **`⬇️ Export Daily Closing CSV`** to save the daily settlement sheet.

---

### Accountant Button & Feature Directory
| Button / Control | Location | Function / Result |
| :--- | :--- | :--- |
| **`💳 Record Payment`** | Dashboard / Sidebar | Opens the student payment collection form. |
| **`💾 Submit & Generate Receipt`** | `/payments` | Saves payment to cloud database and opens receipt dialog. |
| **`📱 Print Thermal Slip`** | Receipt Dialog | Formats receipt for 80mm thermal roll printers. |
| **`🖨️ Print Standard A4`** | Receipt Dialog | Formats full-page receipt for laser/inkjet printers. |
| **`⬇️ Download PDF`** | `/receipts` | Saves receipt as a digital PDF file on device. |
| **`📩 Send Defaulter Reminder`** | `/reports` | Triggers pre-filled WhatsApp/SMS payment reminder. |
| **`⬇️ Export Daily Closing CSV`** | `/reports` | Exports today's collection summary for cash reconciliation. |

---

## 3. 📦 First-Time Guide for Workshop Store Managers

**Default Login**: `storemanager@saiiti.edu.in` / `Store@123`

### Day 1 Store Manager Checklist
- [ ] Log in (automatically opens the **Store Management Hub (`/store`)**).
- [ ] Review existing workshop items under **Master Catalog (`/store/items`)**.
- [ ] Add a new tool or consumable item.
- [ ] Perform a test **Tool Issue (`/store/issue`)** to a student.
- [ ] Perform a test **Tool Return (`/store/returns`)** with condition inspection.
- [ ] Schedule a machine maintenance entry under **Maintenance (`/store/maintenance`)**.

---

### Adding Tools, Machinery & Consumables to Catalog
1. Navigate to **Items Catalog (`/store/items`)**.
2. Click **`➕ Add New Item`** at the top right.
3. Fill in item specifications:
   * **Item Name**: e.g., *Digital Vernier Caliper (0-150mm)* or *MIG Welding Wire Spool (0.8mm)*.
   * **Item Code / Barcode**: Unique SKU (e.g. `TOOL-FIT-042`).
   * **Category**: Choose from *Hand Tools*, *Power Tools*, *Heavy Machinery*, *Consumable Materials*, *Safety Equipment*.
   * **Unit of Measure**: *Pieces*, *Sets*, *Kilograms*, *Litres*, *Meters*.
   * **Current Stock Quantity**: Initial inventory count.
   * **Unit Price (₹)**: Purchase cost per unit.
   * **Supplier / Vendor**: Vendor name & contact.
4. Click **`💾 Save Item to Inventory`**.

---

### Setting Low Stock Alert Thresholds
In the item creation or edit modal:
1. Locate the **"Minimum Alert Threshold"** field.
2. Enter the safety limit (e.g., `5` for grinding wheels or `10` for safety goggles).
3. Whenever inventory drops to or below this number, the item automatically appears in the **`⚠️ Low Stock Warnings`** banner on `/store`.

---

### Issuing Workshop Equipment to Students/Faculty (Step-by-Step)
1. Go to **Issue Desk (`/store/issue`)**.
2. **Step 1: Select Item**: Type item name or scan barcode. The system displays currently available stock.
3. **Step 2: Select Borrower**: Search by Student Name, Roll Number, or Instructor Name.
4. **Step 3: Quantity & Return Due Date**:
   * Specify quantity being loaned (e.g. `1` Micrometer).
   * Set the Expected Return Date (e.g. today by 5:00 PM for daily practicals, or a 7-day workshop loan).
5. **Step 4: Issue Remarks**: Note condition (e.g. "Includes plastic case and calibration wrench").
6. **Step 5: Click `📤 Confirm Issue`**: Stock is deducted and active loan record is created.

---

### Processing Tool Returns & Damage Assessment
1. Navigate to **Returns Register (`/store/returns`)**.
2. Search by Student Name or Tool Code in the active loans list.
3. Click **`📥 Process Return`**.
4. Select the physical condition:
   * **`✅ Good Condition`**: Tool returned intact. Stock is automatically incremented.
   * **`⚠️ Damaged`**: Prompts for damage description and optional repair charge.
   * **`❌ Lost / Broken`**: Prompts for replacement fee and logs tool to Scrap Register.
5. Click **`💾 Accept Return`**.

---

### Logging Machinery Maintenance Schedules
1. Go to **Machinery Maintenance (`/store/maintenance`)**.
2. Click **`➕ Schedule Service`**.
3. Select the machine: e.g., *Lathe Machine #2 (Workshop A)*.
4. Fill in:
   * **Service Type**: *Routine Oiling*, *Belt Replacement*, *Motor Rewinding*, *Safety Guard Inspection*.
   * **Service Technician**: Name & phone number.
   * **Scheduled Date**: Target maintenance date.
5. Update status from `Scheduled` ➔ `In-Progress` ➔ `Completed` once work is certified.

---

### Store Manager Button & Feature Directory
| Button / Control | Location | Function / Result |
| :--- | :--- | :--- |
| **`➕ Add New Item`** | `/store/items` | Opens new inventory item creation modal. |
| **`📦 Stock Inward`** | `/store/items` | Records new procurement batch with invoice number. |
| **`📤 Confirm Issue`** | `/store/issue` | Deducts tool from stock and assigns borrower loan. |
| **`📥 Process Return`** | `/store/returns` | Opens return dialog with Good/Damaged/Lost inspection options. |
| **`➕ Schedule Service`** | `/store/maintenance` | Schedules preventative servicing for workshop machines. |
| **`🗑️ Log to Scrap`** | `/store/damaged` | Writes off broken or obsolete items from balance sheet. |
| **`📊 Export Store CSV`** | `/store/reports` | Downloads total inventory valuation and consumption ledger. |

---

## 4. 📚 First-Time Guide for Chief Librarians

**Default Login**: `librarian@saiiti.edu.in` / `Library@123`

### Day 1 Librarian Checklist
- [ ] Log in (automatically opens the **Library Management Hub (`/library`)**).
- [ ] Check the **Books Catalog (`/library/books`)**.
- [ ] Catalog a new textbook with its ISBN and Rack location.
- [ ] Perform a test **Book Issue (`/library/issue`)** to a student.
- [ ] Test the **Book Return & Fine Calculator (`/library/return`)**.
- [ ] Generate a **Student Library Clearance Certificate**.

---

### Cataloging New Books (ISBN, Shelf Location & Copies)
1. Navigate to **Book Catalog (`/library/books`)**.
2. Click the green **`➕ Add New Book`** button.
3. Fill in book metadata:
   * **Book Title**: e.g., *Basic Electrical Engineering (NCVT Trade Theory)*.
   * **Author(s)**: e.g., *B.L. Theraja / A.K. Theraja*.
   * **ISBN / Accession Number**: e.g., `978-81-219-2440-5`.
   * **Category**: *Electrical*, *Fitter*, *Electronics*, *Workshop Calculation & Science*, *Engineering Drawing*, *Employability Skills*, *General Reference*.
   * **Edition & Publisher**: e.g., *12th Edition, S. Chand Publishing*.
   * **Rack / Shelf Location Code**: e.g., `RACK-E-02` (Shelf 2 in Electrical section).
   * **Total Procured Copies**: Number of physical books placed in the library.
4. Click **`💾 Save Book to Catalog`**.

---

### Issuing Books to Students / Staff (14-Day Cycle)
1. Go to **Issue Desk (`/library/issue`)**.
2. **Step 1: Enter Accession Number**: Type or scan the book's accession barcode. Title and available copy count appear.
3. **Step 2: Select Borrower**: Search by Student Name or Roll Number.
4. **Step 3: Loan Period**: The system automatically computes the standard **14-day return due date**.
5. **Step 4: Click `📤 Issue Book`**: Available copies count is decremented by 1, and the loan is recorded under the student's profile.

---

### Processing Book Returns & Overdue Fine Calculation (₹2/day)
1. Navigate to **Return Desk (`/library/return`)**.
2. Scan the book accession number or search the student's name.
3. **Automatic Fine Computation**:
   * If returned on or before due date: **Fine = ₹0.00**.
   * If overdue: The system automatically computes overdue days × **₹2.00 / day** (e.g. 5 days overdue = ₹10.00 fine).
4. Click **`💰 Collect Fine & Return`**: Marks fine as paid and restores book to available stock.

---

### Waiving Fines (With Audit Note)
If the student had an approved medical leave or special exemption:
1. On the return screen, click **`🕊️ Waive Fine & Return`**.
2. Enter the **Waiver Justification** (e.g., "Approved medical leave by Principal").
3. The book is checked in with ₹0 fine collected, and the waiver reason is logged in the library audit trail.

---

### Managing Book Reservations & Hold Queues
1. If all copies of a popular textbook are checked out, go to **Reservations (`/library/reservations`)**.
2. Click **`➕ Add Reservation`** ➔ Select Book and Student.
3. When any student returns that book, the system places a hold on it and flags it for the waiting student.

---

### Generating Student Library Clearance Certificates
Before final exams or graduation:
1. Go to **Reports & Clearance (`/library/reports`)**.
2. Search for the graduating student.
3. The system verifies:
   * `0` unreturned books.
   * `₹0.00` unpaid library fines.
4. Click **`🖨️ Generate Clearance Certificate`**.
5. Prints a signed digital clearance slip for the student's exam hall-ticket or certificate handover.

---

### Librarian Button & Feature Directory
| Button / Control | Location | Function / Result |
| :--- | :--- | :--- |
| **`➕ Add New Book`** | `/library/books` | Adds a new book title, ISBN, and rack location to catalog. |
| **`📤 Issue Book`** | `/library/issue` | Issues book to student/staff for standard 14-day period. |
| **`💰 Collect Fine & Return`** | `/library/return` | Collects computed overdue fine and returns book to stock. |
| **`🕊️ Waive Fine & Return`** | `/library/return` | Checks in book and waives fine with mandatory justification. |
| **`➕ Add Reservation`** | `/library/reservations` | Places a hold queue on currently checked-out books. |
| **`🖨️ Generate Clearance Slip`** | `/library/reports` | Verifies zero dues and prints student library clearance certificate. |
| **`📊 Export Library CSV`** | `/library/reports` | Downloads circulation statistics and overdue borrower registers. |

---

## 5. 🤝 First-Time Guide for BSS Foundation & Donation Officers

**Default Login**: `admin@saiiti.edu.in` or via Mission Control Hub

### Day 1 Donation Officer Checklist
- [ ] Review the **Public Foundation Showcase (`/foundation`)**.
- [ ] Verify the 12 campus photographs and descriptions.
- [ ] Access the **Donation Admin Center (`/donation-admin`)**.
- [ ] Record a test donor contribution with PAN details.
- [ ] Generate an **Official Section 80G Tax Exemption PDF Certificate**.

---

### Public Showcase Management (`/foundation`)
The public portal is accessible to all outside visitors and donors:
* **Campus Tour Gallery**: Displays 12 verified geotagged photographs of the Bhadrawati campus (Library, Workshops, Administration, Safety Stations).
* **Section 80G Tax Exemption Badge**: Clarifies 50% income tax deductions under the Income Tax Act.
* **`💖 Contribute Now` Modal**: Enables instant contributions via UPI QR, Debit/Credit Card, or NetBanking.

---

### Recording Donor Contributions with PAN Details
1. Go to **Donation Admin (`/donation-admin`)** ➔ **Donors & Receipts**.
2. Click **`➕ Record New Donation`**.
3. Fill in donor tax information:
   * **Donor Name**: Individual or Corporate Entity.
   * **PAN Number**: Required for 80G and Form 10BD income tax filing.
   * **Email & Phone Number**: For digital certificate dispatch.
   * **Amount (₹)**: Contribution amount.
   * **Campaign Allocation**: *Student Merit Scholarships*, *Workshop Machinery Fund*, *Library Modernization*, *General Trust Fund*.
   * **Payment Mode & Transaction ID**: Bank NEFT, Cheque, or Online Gateway UTR.
4. Click **`💾 Save & Issue 80G Receipt`**.

---

### Generating Section 80G Tax Exemption PDF Certificates
1. In the donations table, locate the donor's record.
2. Click **`📄 Generate 80G Certificate`**.
3. The system compiles an official PDF document containing:
   * Trust Registration Number & 80G Order Number.
   * Unique Donation Serial Number.
   * Donor PAN, Date, and Amount in words.
   * Authorized Signatory digital signature.
4. Click **`⬇️ Download PDF`** or **`✉️ Email to Donor`**.

---

### Form 10BD Compliance & Audit Export
At the end of the financial year:
1. Open **Donation Reports (`/donation-admin/reports`)**.
2. Click **`📑 Export Form 10BD CSV`**.
3. Exports data perfectly formatted to the Income Tax Department's Form 10BD electronic filing specifications (Donor PAN, Address, Mode, Amount).

---

### Donation Admin Button & Feature Directory
| Button / Control | Location | Function / Result |
| :--- | :--- | :--- |
| **`➕ Record New Donation`** | `/donation-admin` | Opens donor entry form with PAN and campaign fields. |
| **`📄 Generate 80G Certificate`**| Donor Table | Generates official 80G tax exemption receipt PDF. |
| **`📑 Export Form 10BD CSV`** | `/donation-admin/reports` | Exports annual donation ledger formatted for Income Tax filing. |
| **`📊 Campaign Progress`** | `/donation-admin` | Tracks funding meters for student scholarships and workshop upgrades. |

---

## 6. 💻 First-Time Guide for Developers & System Administrators

**Default Login**: `pattiwarrushikesh5102@gmail.com` / `Rushikesh@5102` *(or `DevPass123!`)*

### Developer Diagnostics Screen (`/system`)
Direct access to core infrastructure health, accessible only by Developer accounts:
* **Database Vitals**: Shows active PostgreSQL connection pool utilization, query response time, and storage engine status.
* **Uptime & Latency Telemetry**: Real-time server latency meter (e.g. `24ms`).
* **Environment Configuration**: Safe inspector showing active environment modes (`production`), API endpoints, and Supabase RLS policies.

### Security Audit Logs & Live Error Streams
* Real-time stream tracking failed authentication attempts, permission violations, and system exceptions.
* Searchable by IP address, User Email, or Error Code.

### Using the "⚡ 1-Click Database Self-Healing" Engine
If database connection timeouts or query locks occur:
1. Click the prominent **`⚡ 1-Click Database Self-Healing`** button on `/system`.
2. The autonomous engine executes a 4-step recovery protocol:
   * Step 1: Clears idle/stale connection pool handles.
   * Step 2: Flushes in-memory cache and temporary query plan buffers.
   * Step 3: Re-establishes healthy PostgreSQL connection socket.
   * Step 4: Revalidates table foreign key constraints and schema health.
3. Returns a confirmation report: `"✅ System Diagnostics Healthy — 0 Locks Active"`.

---

## 7. 🎓 First-Time Guide for Students & Parents

**Default Login**: `sai-2024-001@student.saiiti.edu.in` / `SAI-2024-001`

### Student Portal Features:
1. **Fee Status & Balance**: View total course fee, total fees paid, and remaining installment balance with due dates.
2. **`💳 Pay Dues Online`**: Pay upcoming installments securely via UPI or Card from home.
3. **`🧾 Download Fee Receipts`**: Access and print receipts for all past payments for scholarship applications.
4. **`📚 My Issued Books`**: View currently checked-out library books, issue dates, and return deadlines to avoid overdue fines.

---

## 8. ⚡ Offline Mode & PWA Synchronization Guide (All Staff)

The software is engineered with **Zero-Downtime Offline Resilience**:

```
No Internet Connection ──► Staff Records Payment / Issues Tool
                                    │
                                    ▼
                         [IndexedDB Local Queue]
                                    │
       Internet Restored ───────────┴──────────► [Automatic Cloud Sync]
```

### How to Work When Internet Drops:
1. Continue using the software normally — you can record fee payments, issue workshop tools, and check in library books.
2. A floating badge at the bottom-right will display: **`⚡ Offline Mode: X items pending sync`**.
3. **Automatic Synchronization**: The moment Wi-Fi or mobile data reconnects, the system automatically transmits all pending records to the cloud database.
4. You will see a green confirmation: **`✅ Successfully synced X items to Cloud Database!`**.

---

*© 2026 Bharat Shikshan Sanstha & Shri Sai Private Industrial Training Institute. All rights reserved.*
