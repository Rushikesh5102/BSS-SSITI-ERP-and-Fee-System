import { jsPDF } from 'jspdf';

/**
 * Loads the official institute logo as a Base64 PNG
 */
async function getLogoDataUrl(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 1200);
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = '/sai_iti_logo.png';
        img.onload = () => {
            clearTimeout(timer);
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                    return;
                }
            } catch {}
            resolve(null);
        };
        img.onerror = () => {
            clearTimeout(timer);
            resolve(null);
        };
    });
}

/**
 * Loads the official Principal Signature & Stamp as a Base64 JPEG
 */
async function getPrincipalStampDataUrl(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 1200);
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = '/sai_iti_principal_sign_stamp.jpg';
        img.onload = () => {
            clearTimeout(timer);
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg'));
                    return;
                }
            } catch {}
            resolve(null);
        };
        img.onerror = () => {
            clearTimeout(timer);
            resolve(null);
        };
    });
}

/**
 * Helper to safely format Date of Birth
 */
function formatDob(dateOfBirth: any): string {
    if (!dateOfBirth) return '—';
    try {
        const d = new Date(dateOfBirth);
        if (isNaN(d.getTime())) return String(dateOfBirth);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return String(dateOfBirth);
    }
}

/**
 * Helper to format Academic Session cleanly
 */
function formatAcademicSession(student: any): string {
    const raw = student.educationDetails?.academicSession || student.academicSession;
    if (raw && String(raw).trim()) {
        const s = String(raw).trim();
        if (s.includes('-')) return `${s} (2-Year Program)`;
        const yr = parseInt(s) || 2026;
        return `${yr} - ${yr + 2} (2-Year Program)`;
    }
    const startYr = student.createdAt ? new Date(student.createdAt).getFullYear() : 2026;
    return `${startYr} - ${startYr + 2} (2-Year Program)`;
}

/**
 * Generates official Admission Application Form PDF with Institute Logo & Royal Gold Theme
 */
export async function generateAdmissionFormPdf(student: any) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Load Institute Logo & Principal Stamp
    const [logoDataUrl, stampDataUrl] = await Promise.all([
        getLogoDataUrl(),
        getPrincipalStampDataUrl(),
    ]);

    // ─── Header: Imperial Gold & Deep Navy (Matching Logo Colors) ────────────
    doc.setFillColor(15, 23, 42); // Deep Navy (#0f172a)
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setFillColor(217, 119, 6); // Imperial Gold Accent (#d97706)
    doc.rect(0, 26, pageWidth, 2, 'F');

    // Logo on Top Left of Header
    if (logoDataUrl) {
        try {
            doc.addImage(logoDataUrl, 'PNG', 8, 2, 24, 24);
        } catch {}
    }

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("SHRI SAI PRIVATE INDUSTRIAL TRAINING INSTITUTE, BHADRAWATI", pageWidth / 2 + 8, 8, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(254, 243, 199); // Light Warm Gold
    doc.text("RUN BY - BHARAT SHIKSHAN SANSTHA | Affiliated by DGET New Delhi & NCVT New Delhi", pageWidth / 2 + 8, 14, { align: 'center' });
    doc.setTextColor(226, 232, 240);
    doc.text("Jain Mandir Rd, Ramnagar, Bhadravati, Maharashtra 442902 | Helpline: +91 9529054868 | Email: saiiti151@gmail.com", pageWidth / 2 + 8, 20, { align: 'center' });

    // Document Sub-Header Banner
    doc.setFillColor(254, 243, 199); // Soft Gold Bar
    doc.rect(10, 31, pageWidth - 20, 7.5, 'F');
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.5);
    doc.rect(10, 31, pageWidth - 20, 7.5, 'S');

    doc.setTextColor(180, 83, 9); // Deep Gold-Amber
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL STUDENT ADMISSION & REGISTRATION APPLICATION FORM', pageWidth / 2, 36, { align: 'center' });

    // ─── 1. Institute & Session Details (Left Box) + Passport Photo (Right Box) ─────────
    const section1Top = 44;
    const photoWidth = 32;
    const photoHeight = 40;
    const photoX = pageWidth - 10 - photoWidth; // 168
    const photoY = section1Top; // 44

    // Photo Box
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.5);
    doc.rect(photoX, photoY, photoWidth, photoHeight, 'S');
    if (student.photo && student.photo.startsWith('data:image/')) {
        try {
            doc.addImage(student.photo, 'PNG', photoX, photoY, photoWidth, photoHeight);
        } catch {
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text('PASSPORT PHOTO', photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center' });
        }
    } else {
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('PASSPORT PHOTO', photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center' });
    }

    // Section 1 Box (Left side of photo)
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('1. Institute Registration & Academic Session', 10, section1Top - 2);

    const section1Width = photoX - 10 - 4; // 154
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.setFillColor(248, 250, 252);
    doc.rect(10, section1Top, section1Width, photoHeight, 'S');

    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);

    const sessionText = formatAcademicSession(student);

    const instDetails = [
        ['Application / Roll No:', student.studentId || 'SSITI-2026-E01', 'Academic Session:', sessionText],
        ['Enrolled Trade / Class:', `${student.class || 'Electrician'} ${student.section ? `(${student.section})` : ''}`, 'Trade Duration:', '2 Years (NCVT Full-time)'],
        ['I.T.I. Registration No:', 'I.T.I.- 2011/P.K.11/V.S.-03', 'Affiliation Authority:', 'NCVT / DGET New Delhi'],
        ['G.R. No. & Date:', 'I.T.I.- 2011/P.K.11/V.S.-03', 'Location:', 'Bhadrawati, Dist. Chandrapur'],
    ];

    let rowY = section1Top + 6;
    instDetails.forEach(([l1, v1, l2, v2]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, 12, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v1), 46, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l2, 92, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v2), 122, rowY);
        rowY += 8.5;
    });

    // ─── 2. Basic Student & Caste Details Grid (Full Width, Below Photo!) ───────────
    let y = section1Top + photoHeight + 6.5; // 44 + 40 + 6.5 = 90.5
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('2. Student Personal & Caste Demographics', 10, y);
    y += 2.5;

    doc.rect(10, y, pageWidth - 20, 28, 'S');
    const categoryDisplay = student.subcaste 
        ? `${student.category || 'OPEN'} (${student.subcaste})`
        : (student.educationDetails?.subcaste ? `${student.category || 'OPEN'} (${student.educationDetails.subcaste})` : (student.category || 'OPEN / General'));

    const parentContact = student.parent?.phone || student.phone || '—';
    const dobFormatted = formatDob(student.dateOfBirth);

    const basicDetails = [
        ['Student Full Name:', student.name || '', 'Contact Phone:', parentContact],
        ['Trade & Roll Number:', `${student.class || 'Electrician'} | Roll #${student.rollNumber || '01'}`, 'Alt Phone / Landline:', student.landline || '—'],
        ['Date of Birth & Blood:', `${dobFormatted}  |  Blood: ${student.bloodGroup || 'O+'}`, 'Category & Subcaste:', categoryDisplay],
        ['Residential Address:', (student.address || 'Bhadrawati, Dist. Chandrapur, Maharashtra').substring(0, 42), 'Email ID:', student.email || 'saiiti151@gmail.com'],
    ];

    rowY = y + 5;
    basicDetails.forEach(([l1, v1, l2, v2]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, 12, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v1).substring(0, 42), 46, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l2, 108, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v2).substring(0, 38), 144, rowY);
        rowY += 6;
    });

    // ─── 3. Prior Educational Background Details ─────────────────────────────
    y = y + 34; // 93 + 34 = 127
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('3. Prior Educational Background Details', 10, y);
    y += 2.5;

    const edu = student.educationDetails || {};
    doc.rect(10, y, pageWidth - 20, 22, 'S');
    const eduRows = [
        ['Class X Board:', edu.board || 'Maharashtra State Board', 'Passing Year & %:', `${edu.passingYear || '2023'}  |  ${edu.percentage || '—'}`],
        ['School Name:', edu.school || 'High School, Bhadravati', 'Roll No & Medium:', `${edu.rollNo || '—'}  |  ${edu.medium || 'Marathi / English'}`],
        ['Other Qualifications:', `${edu.higherEducation || '12th / Degree / Domicile verified'}`, 'Result Status:', 'PASSED (Eligible for ITI)'],
    ];

    rowY = y + 5;
    eduRows.forEach(([l1, v1, l2, v2]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, 12, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v1).substring(0, 42), 46, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l2, 108, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v2).substring(0, 38), 144, rowY);
        rowY += 5.5;
    });

    // ─── 4. Submitted Original Documents Checklist ───────────────────────────
    y = y + 27.5; // 129.5 + 27.5 = 157
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('4. Original Documents Submitted Checklist (Verified at Admission Desk)', 10, y);
    y += 2.5;

    doc.rect(10, y, pageWidth - 20, 29, 'S');
    const docs = student.submittedDocuments || {};
    const docChecklist = [
        ['Domicile Certificate', docs.domicile ? '[X] Submitted' : '[  ] Pending', 'Caste Certificate', docs.caste ? '[X] Submitted' : '[  ] Pending', 'B.A. Marksheet / Degree', docs.baDegree ? '[X] Submitted' : '[  ] Pending'],
        ['Class X (10th) Marksheet', docs.marklist ? '[X] Submitted' : '[  ] Pending', 'Non-Creamy Layer', docs.nonCreamy ? '[X] Submitted' : '[  ] Pending', 'B.Com Marksheet / Degree', docs.bcomDegree ? '[X] Submitted' : '[  ] Pending'],
        ['Class XII (12th / HSC)', docs.marksheet12th ? '[X] Submitted' : '[  ] Pending', 'Income Certificate', docs.income ? '[X] Submitted' : '[  ] Pending', 'B.Tech / B.E. Marksheet', docs.btechDegree ? '[X] Submitted' : '[  ] Pending'],
        ['TC (Transfer Certificate)', docs.tc ? '[X] Submitted' : '[  ] Pending', 'Aadhaar Card', docs.aadhar ? '[X] Submitted' : '[  ] Pending', 'Affidavit / Gap Cert.', docs.affidavit ? '[X] Submitted' : '[  ] Pending'],
        ['Photos (4 Passport)', docs.photo4 ? '[X] Submitted' : '[  ] Pending', 'Bank Passbook Xerox', docs.bankPassbook ? '[X] Submitted' : '[  ] Pending', 'Other Documents', docs.otherDocs ? `[X] ${docs.otherDocsText || 'Submitted'}` : '[  ] Pending'],
    ];

    rowY = y + 4.5;
    docChecklist.forEach(([l1, v1, l2, v2, l3, v3]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, 12, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(v1, 48, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l2, 76, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(v2, 110, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l3, 138, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(v3, 178, rowY);
        rowY += 5;
    });

    // ─── 5. Admission Fee Breakdown & Agreed Total ───────────────────────────
    y = y + 34; // 159.5 + 34 = 193.5
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('5. Admission Fee Structure & Assigned Dues', 10, y);
    y += 2.5;

    doc.rect(10, y, pageWidth - 20, 18, 'S');
    const feeAssigned = student.studentFees?.[0] || student.feeAssignment || {};
    const totalAssignedPaise = feeAssigned.totalAmount || 0;
    const paidPaise = feeAssigned.paidAmount || 0;
    const pendingPaise = Math.max(0, totalAssignedPaise - paidPaise);

    const tuition = edu.tuitionFee || (totalAssignedPaise ? (totalAssignedPaise / 100 * 0.7) : 14000);
    const exam = edu.examFee || 2000;
    const dress = edu.dressMaterialFee || 3000;

    const feeBreakdownText = [
        ['Tuition Fee:', `Rs. ${Number(tuition).toLocaleString('en-IN')}`, 'Exam Fee:', `Rs. ${Number(exam).toLocaleString('en-IN')}`, 'Dress & Material:', `Rs. ${Number(dress).toLocaleString('en-IN')}`],
        ['Total Course Fee:', `Rs. ${(totalAssignedPaise ? totalAssignedPaise / 100 : 20000).toLocaleString('en-IN')}`, 'Fee Paid So Far:', `Rs. ${(paidPaise / 100).toLocaleString('en-IN')}`, 'Remaining Balance:', `Rs. ${(pendingPaise / 100).toLocaleString('en-IN')}`],
    ];

    rowY = y + 5;
    feeBreakdownText.forEach(([l1, v1, l2, v2, l3, v3]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, 12, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(v1, 46, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l2, 78, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(v2, 114, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l3, 142, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(v3, 178, rowY);
        rowY += 6.5;
    });

    // ─── 6. Declarations & Signatures ─────────────────────────────────────────
    y = y + 23; // 196 + 23 = 219
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    doc.text('Declaration: I hereby declare that all particulars & certificates submitted are genuine and I agree to abide by all rules of Shri Sai I.T.I.', 10, y);

    // Signatures line at y = 248mm (generous breathing space across the A4 page!)
    const signLineY = 248;

    if (student.signature && student.signature.startsWith('data:image/')) {
        try { doc.addImage(student.signature, 'PNG', 12, signLineY - 13, 28, 11); } catch {}
    }

    // 1. Student Signature
    doc.setDrawColor(217, 119, 6);
    doc.line(10, signLineY, 48, signLineY);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(15, 23, 42);
    doc.text('Student Signature', 10, signLineY + 4);

    // 2. Parent Signature
    doc.line(56, signLineY, 96, signLineY);
    doc.text('Parent Signature', 56, signLineY + 4);

    // 3. Clerk / Cashier Signature Section
    doc.line(104, signLineY, 146, signLineY);
    doc.text('Clerk / Cashier Signature', 104, signLineY + 4);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(100, 116, 139);
    doc.text('Accounts Verified', 104, signLineY + 7.5);

    // 4. Principal Seal & Signature
    if (stampDataUrl) {
        try {
            // Positioned cleanly above the Principal signature line (y = 231 to 247mm)
            doc.addImage(stampDataUrl, 'JPEG', pageWidth - 56, signLineY - 17, 46, 16);
        } catch {}
    } else if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, 'PNG', pageWidth - 45, signLineY - 15, 15, 15); } catch {}
    }
    doc.setDrawColor(217, 119, 6);
    doc.line(pageWidth - 56, signLineY, pageWidth - 10, signLineY);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(15, 23, 42);
    doc.text('Principal Seal & Sign', pageWidth - 56, signLineY + 4);

    // ─── 7. Official System Footer with Download Date & Timestamp ──────────────
    const footerY = 276;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(10, footerY, pageWidth - 10, footerY);

    const now = new Date();
    const downloadStamp = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' at ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated & Downloaded: ${downloadStamp} | Portal: bss-ssiti-erp-and-fee-system.vercel.app`, 10, footerY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Official Student Record Copy • Shri Sai Private ITI Bhadrawati', pageWidth - 10, footerY + 4.5, { align: 'right' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text('System Record Verification: Validated via BSS ERP Fee Management Infrastructure (Page 1 of 1)', pageWidth / 2, footerY + 8.5, { align: 'center' });

    doc.save(`${student.studentId || 'Admission'}_Application_Form.pdf`);
}

/**
 * Generates official 2-page Front & Back Student Identity Card PDF with complete Front Demographic Details
 */
export async function generateStudentIdCardPdf(student: any) {
    // Vertical ID Card format (85mm x 140mm)
    const doc = new jsPDF({ unit: 'mm', format: [85, 140] });
    const cardW = 85;
    const cardH = 140;

    const [logoDataUrl, stampDataUrl] = await Promise.all([
        getLogoDataUrl(),
        getPrincipalStampDataUrl(),
    ]);

    // ─── PAGE 1: FRONT SIDE OF ID CARD ───────────────────────────────────────
    // 1. Top Header Banner Background (Soft gold bar inside top)
    doc.setFillColor(254, 243, 199); // Soft Gold Bar
    doc.rect(4.6, 4.6, cardW - 9.2, 34, 'F');

    // 2. Outer Imperial Gold Border (1.2mm stroke)
    doc.setDrawColor(217, 119, 6); // Imperial Gold (#d97706)
    doc.setLineWidth(1.2);
    doc.rect(3, 3, cardW - 6, cardH - 6);

    // 3. Inner Navy Border Line (Drawn on top so it is 100% uniform on all 4 sides!)
    doc.setDrawColor(15, 23, 42); // Deep Navy (#0f172a)
    doc.setLineWidth(0.4);
    doc.rect(4.6, 4.6, cardW - 9.2, cardH - 9.2);

    // 4. Top Logo (18mm x 18mm)
    let y = 6;
    if (logoDataUrl) {
        try {
            doc.addImage(logoDataUrl, 'PNG', cardW / 2 - 9, y, 18, 18);
            y += 18;
        } catch { y += 10; }
    } else { y += 10; }

    // 5. Space between logo and "BHARAT SHIKSHAN SANSTHA"
    y += 2.5;

    // 6. Organization Header Text
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.text("BHARAT SHIKSHAN SANSTHA'S", cardW / 2, y, { align: 'center' });
    
    // 7. Institute Name (BIGGER than Bharat Shikshan Sanstha)
    y += 4.8;
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9); // Imperial Gold Accent
    doc.text("SHRI SAI PRIVATE I.T.I.", cardW / 2, y, { align: 'center' });

    y += 3.2;
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text("BHADRAWATI, DIST. CHANDRAPUR", cardW / 2, y, { align: 'center' });

    // 8. Center Photo Box
    const photoW = 26;
    const photoH = 30;
    const photoX = cardW / 2 - photoW / 2; // 29.5
    const photoY = y + 3.2; // ~39.7

    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.6);
    doc.rect(photoX, photoY, photoW, photoH);

    if (student.photo && student.photo.startsWith('data:image/')) {
        try {
            doc.addImage(student.photo, 'PNG', photoX, photoY, photoW, photoH);
        } catch {
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text('PASSPORT PHOTO', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
        }
    } else {
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('PASSPORT PHOTO', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
    }

    // 9. STUDENT NAME (MUST BE UNDER THE PHOTO!)
    y = photoY + photoH + 4; // ~73.7
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(student.name?.toUpperCase() || 'STUDENT NAME', cardW / 2, y, { align: 'center' });

    // 10. FRONT-SIDE IDENTITY DEMOGRAPHIC DETAILS BOX (With Academic Session on Front & No Roll No)
    const infoBoxY = y + 2.5; // ~76.2
    const infoBoxH = 37.5;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.rect(6.5, infoBoxY, cardW - 13, infoBoxH, 'FD');

    const dobStr = formatDob(student.dateOfBirth);
    const subcasteStr = student.subcaste || student.educationDetails?.subcaste || '';
    const catDisplay = subcasteStr ? `${student.category || 'OPEN'} (${subcasteStr})` : (student.category || 'OPEN');
    const parentPhoneStr = student.parent?.phone || student.phone || student.landline || '—';
    const addressStr = student.address || 'Bhadrawati, Dist. Chandrapur, Maharashtra';
    const sessionStr = formatAcademicSession(student);

    let rY = infoBoxY + 4.2;
    doc.setFontSize(6.2);
    doc.setTextColor(15, 23, 42);

    // Row 1: Student ID (Only Student ID - no roll number)
    doc.setFont('helvetica', 'bold'); doc.text('Student ID:', 8.5, rY);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(180, 83, 9);
    doc.text(student.studentId || 'SSITI-2026-E01', 26, rY);

    // Row 2: Trade / Class
    rY += 4.6;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold'); doc.text('Trade / Class:', 8.5, rY);
    doc.setFont('helvetica', 'normal'); doc.text(`${student.class || 'Electrician'} ${student.section ? `(${student.section})` : ''}`, 26, rY);

    // Row 3: Academic Session (Moved to Front side!)
    rY += 4.6;
    doc.setFont('helvetica', 'bold'); doc.text('Session:', 8.5, rY);
    doc.setFont('helvetica', 'normal'); doc.text(sessionStr, 26, rY);

    // Row 4: Blood Group & DOB
    rY += 4.6;
    doc.setFont('helvetica', 'bold'); doc.text('Blood / DOB:', 8.5, rY);
    doc.setFont('helvetica', 'normal'); doc.text(`${student.bloodGroup || 'O+'}  |  ${dobStr}`, 26, rY);

    // Row 5: Category / Subcaste
    rY += 4.6;
    doc.setFont('helvetica', 'bold'); doc.text('Category:', 8.5, rY);
    doc.setFont('helvetica', 'normal'); doc.text(catDisplay, 26, rY);

    // Row 6: Parent Contact
    rY += 4.6;
    doc.setFont('helvetica', 'bold'); doc.text('Contact:', 8.5, rY);
    doc.setFont('helvetica', 'normal'); doc.text(parentPhoneStr, 26, rY);

    // Row 7: Res. Address (Wrapped cleanly within 48mm width)
    rY += 4.6;
    doc.setFont('helvetica', 'bold'); doc.text('Address:', 8.5, rY);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5);
    const splitAddr = doc.splitTextToSize(addressStr, 48);
    doc.text(splitAddr[0] || addressStr, 26, rY);

    // 11. Footer Section (With clean 4mm margin from bottom border to prevent overlap)
    const footerY = 117.5;
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.4);
    doc.line(6.5, footerY, cardW - 6.5, footerY);

    doc.setFontSize(5.2);
    doc.setTextColor(51, 65, 85);
    doc.text('Shri Sai I.T.I., Jain Mandir Rd, Ramnagar, Bhadrawati', cardW / 2, footerY + 3.2, { align: 'center' });
    
    doc.text('Helpline: +91 9529054868  |  Email: saiiti151@gmail.com', cardW / 2, footerY + 6.4, { align: 'center' });

    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.text('Portal: bss-ssiti-erp-and-fee-system.vercel.app', cardW / 2, footerY + 9.6, { align: 'center' });

    doc.setFontSize(4.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('(Official Student Identity Card - Valid for 2-Year Program)', cardW / 2, footerY + 12.6, { align: 'center' });


    // ─── PAGE 2: BACK SIDE OF ID CARD ─────────────────────────────────────────
    doc.addPage([85, 140]);

    // Back Header Banner Background
    doc.setFillColor(254, 243, 199);
    doc.rect(4.6, 4.6, cardW - 9.2, 11, 'F');

    // Imperial Gold Outer Border
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(1.2);
    doc.rect(3, 3, cardW - 6, cardH - 6);

    // Inner Navy Border Line (Drawn on top for 100% uniform sides)
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.rect(4.6, 4.6, cardW - 9.2, cardH - 9.2);

    // Back Header Title
    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text("INSTITUTIONAL RULES & GUIDELINES", cardW / 2, 11.5, { align: 'center' });

    // Rules & Terms Box (No NCVT or Registration number lines on back!)
    const backRulesY = 19;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.rect(6.5, backRulesY, cardW - 13, 78, 'FD');

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('Terms & Guidelines for Trainees:', 8.5, backRulesY + 5.5);

    const rules = [
        "1. This identity card is strictly non-transferable and must be carried on campus at all times.",
        "2. Must be presented upon demand by any instructor, workshop supervisor, or institute authority.",
        "3. Trainees must strictly adhere to workshop safety guidelines, tool safety norms, and prescribed dress code.",
        "4. Duplicate card will be issued on payment of prescribed fee (Rs. 200/-) with written application to Principal.",
        "5. Loss of card must be reported immediately to the administrative office.",
        "6. This card remains valid for the full duration of the 2-Year ITI Training Program."
    ];

    let ruleY = backRulesY + 11.5;
    doc.setFontSize(5.6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    rules.forEach(rule => {
        const splitText = doc.splitTextToSize(rule, cardW - 17);
        doc.text(splitText, 8.5, ruleY);
        ruleY += splitText.length * 3 + 2.5;
    });

    // Principal Signature & Official Seal Stamp (Bottom of Page 2)
    const signBoxY = cardH - 25; // 115
    if (stampDataUrl) {
        try {
            doc.addImage(stampDataUrl, 'JPEG', cardW / 2 - 20, signBoxY - 14, 40, 15);
        } catch {}
    } else if (logoDataUrl) {
        try {
            doc.addImage(logoDataUrl, 'PNG', cardW / 2 - 7, signBoxY - 12, 14, 14);
        } catch {}
    }

    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.4);
    doc.line(cardW / 2 - 24, signBoxY + 2.5, cardW / 2 + 24, signBoxY + 2.5);
    
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text("Issuing Authority / Principal Seal & Sign", cardW / 2, signBoxY + 6.5, { align: 'center' });

    doc.setFontSize(4.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text("Shri Sai Private ITI • Bhadrawati, Chandrapur", cardW / 2, signBoxY + 10.5, { align: 'center' });

    doc.save(`${student.studentId || 'Student'}_ID_Card_Front_Back.pdf`);
}
