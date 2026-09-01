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
    doc.rect(10, 29, pageWidth - 20, 6.5, 'F');
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.4);
    doc.rect(10, 29, pageWidth - 20, 6.5, 'S');

    doc.setTextColor(180, 83, 9); // Deep Gold-Amber
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL STUDENT ADMISSION & REGISTRATION APPLICATION FORM', pageWidth / 2, 33.5, { align: 'center' });

    // ─── 1. Institute & Session Details (Left Box) + Passport Photo (Right Box) ─────────
    const section1Top = 38;
    const photoWidth = 30;
    const photoHeight = 36;
    const photoX = pageWidth - 10 - photoWidth; // 170
    const photoY = section1Top; // 38

    // Photo Box
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.5);
    doc.rect(photoX, photoY, photoWidth, photoHeight, 'S');
    if (student.photo && student.photo.startsWith('data:image/')) {
        try {
            doc.addImage(student.photo, 'PNG', photoX, photoY, photoWidth, photoHeight);
        } catch {
            doc.setFontSize(7);
            doc.setTextColor(100, 116, 139);
            doc.text('PASSPORT PHOTO', photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center' });
        }
    } else {
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('PASSPORT PHOTO', photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center' });
    }

    // Section 1 Box (Left side of photo)
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('1. Institute Registration & Academic Session', 10, section1Top - 1.5);

    const section1Width = photoX - 10 - 4; // 156
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
        ['I.T.I. Registration No:', 'I.T.I.- 2011/P.K.11/V.S.-03', 'Affiliation Body:', 'NCVT / DGET New Delhi'],
        ['G.R. No. & Date:', 'I.T.I.- 2011/P.K.11/V.S.-03', 'Location:', 'Bhadrawati, Dist. Chandrapur'],
    ];

    let rowY = section1Top + 5.5;
    instDetails.forEach(([l1, v1, l2, v2]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, 12, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v1), 46, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l2, 92, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v2), 120, rowY);
        rowY += 8;
    });

    // ─── 2. Basic Student & Caste Details Grid (Full Width, Below Photo!) ───────────
    let y = section1Top + photoHeight + 5; // 38 + 36 + 5 = 79
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('2. Student Personal & Caste Demographics', 10, y);
    y += 2.5;

    doc.rect(10, y, pageWidth - 20, 26, 'S');
    const categoryDisplay = student.subcaste 
        ? `${student.category || 'OPEN'} (${student.subcaste})`
        : (student.educationDetails?.subcaste ? `${student.category || 'OPEN'} (${student.educationDetails.subcaste})` : (student.category || 'OPEN / General'));

    const parentContact = student.parent?.phone || student.phone || '—';
    const dobFormatted = formatDob(student.dateOfBirth);

    const basicDetails = [
        ['Student Full Name:', student.name || '', 'Contact Phone:', parentContact],
        ['Trade & Roll Number:', `${student.class || 'Electrician'} | Roll #${student.rollNumber || '01'}`, 'Alt Phone / Landline:', student.landline || '—'],
        ['Date of Birth & Blood:', `${dobFormatted}  |  Blood: ${student.bloodGroup || 'O+'}`, 'Category & Subcaste:', categoryDisplay],
        ['Residential Address:', (student.address || 'Bhadrawati, Dist. Chandrapur, Maharashtra').substring(0, 40), 'Email ID:', student.email || 'saiiti151@gmail.com'],
    ];

    rowY = y + 4.8;
    basicDetails.forEach(([l1, v1, l2, v2]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, 12, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v1).substring(0, 42), 46, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l2, 108, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v2).substring(0, 38), 142, rowY);
        rowY += 5.5;
    });

    // ─── 3. Prior Educational Background Details ─────────────────────────────
    y = y + 29; // 81.5 + 29 = 110.5
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('3. Prior Educational Background Details', 10, y);
    y += 2.5;

    const edu = student.educationDetails || {};
    doc.rect(10, y, pageWidth - 20, 18, 'S');
    const eduRows = [
        ['Class X Board:', edu.board || 'Maharashtra State Board', 'Passing Year & %:', `${edu.passingYear || '2023'}  |  ${edu.percentage || '—'}`],
        ['School Name:', edu.school || 'High School, Bhadravati', 'Roll No & Medium:', `${edu.rollNo || '—'}  |  ${edu.medium || 'Marathi / English'}`],
        ['Other Qualifications:', `${edu.higherEducation || '12th / Degree / Domicile verified'}`, 'Result Status:', 'PASSED (Eligible for ITI)'],
    ];

    rowY = y + 4.2;
    eduRows.forEach(([l1, v1, l2, v2]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, 12, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v1).substring(0, 42), 46, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l2, 108, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v2).substring(0, 38), 142, rowY);
        rowY += 4.8;
    });

    // ─── 4. Submitted Original Documents Checklist ───────────────────────────
    y = y + 21; // 113 + 21 = 134
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('4. Original Documents Submitted Checklist (Verified at Admission Desk)', 10, y);
    y += 2.5;

    doc.rect(10, y, pageWidth - 20, 26, 'S');
    const docs = student.submittedDocuments || {};
    const docChecklist = [
        ['Domicile Certificate', docs.domicile ? '[X] Submitted' : '[  ] Pending', 'Caste Certificate', docs.caste ? '[X] Submitted' : '[  ] Pending', 'B.A. Marksheet / Degree', docs.baDegree ? '[X] Submitted' : '[  ] Pending'],
        ['Class X (10th) Marksheet', docs.marklist ? '[X] Submitted' : '[  ] Pending', 'Non-Creamy Layer', docs.nonCreamy ? '[X] Submitted' : '[  ] Pending', 'B.Com Marksheet / Degree', docs.bcomDegree ? '[X] Submitted' : '[  ] Pending'],
        ['Class XII (12th / HSC)', docs.marksheet12th ? '[X] Submitted' : '[  ] Pending', 'Income Certificate', docs.income ? '[X] Submitted' : '[  ] Pending', 'B.Tech / B.E. Marksheet', docs.btechDegree ? '[X] Submitted' : '[  ] Pending'],
        ['TC (Transfer Certificate)', docs.tc ? '[X] Submitted' : '[  ] Pending', 'Aadhaar Card', docs.aadhar ? '[X] Submitted' : '[  ] Pending', 'Affidavit / Gap Cert.', docs.affidavit ? '[X] Submitted' : '[  ] Pending'],
        ['Photos (4 Passport)', docs.photo4 ? '[X] Submitted' : '[  ] Pending', 'Bank Passbook Xerox', docs.bankPassbook ? '[X] Submitted' : '[  ] Pending', 'Other Documents', docs.otherDocs ? `[X] ${docs.otherDocsText || 'Submitted'}` : '[  ] Pending'],
    ];

    rowY = y + 4.2;
    docChecklist.forEach(([l1, v1, l2, v2, l3, v3]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, 12, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(v1, 48, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l2, 76, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(v2, 110, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l3, 138, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(v3, 178, rowY);
        rowY += 4.6;
    });

    // ─── 5. Admission Fee Breakdown & Agreed Total ───────────────────────────
    y = y + 29; // 136.5 + 29 = 165.5
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('5. Admission Fee Structure & Assigned Dues', 10, y);
    y += 2.5;

    doc.rect(10, y, pageWidth - 20, 15, 'S');
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

    rowY = y + 4.5;
    feeBreakdownText.forEach(([l1, v1, l2, v2, l3, v3]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, 12, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(v1, 46, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l2, 78, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(v2, 114, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l3, 142, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(v3, 178, rowY);
        rowY += 5.5;
    });

    // ─── 6. Declarations & Signatures ─────────────────────────────────────────
    y = y + 20; // 168 + 20 = 188
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    doc.text('Declaration: I hereby declare that all particulars & certificates submitted are genuine and I agree to abide by all rules of Shri Sai I.T.I.', 10, y);

    // Signatures line at y = 212mm (24mm below fee structure box, completely clean!)
    const signLineY = 212;

    if (student.signature && student.signature.startsWith('data:image/')) {
        try { doc.addImage(student.signature, 'PNG', 12, signLineY - 12, 28, 10); } catch {}
    }

    // 1. Student Signature
    doc.setDrawColor(217, 119, 6);
    doc.line(10, signLineY, 48, signLineY);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(15, 23, 42);
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
            // Positioned right above the Principal line (y = 196 to 210), completely below declaration & fee box!
            doc.addImage(stampDataUrl, 'JPEG', pageWidth - 56, signLineY - 15, 46, 14);
        } catch {}
    } else if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, 'PNG', pageWidth - 45, signLineY - 14, 14, 14); } catch {}
    }
    doc.setDrawColor(217, 119, 6);
    doc.line(pageWidth - 56, signLineY, pageWidth - 10, signLineY);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(15, 23, 42);
    doc.text('Principal Seal & Sign', pageWidth - 56, signLineY + 4);

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
    // Imperial Gold Outer Border
    doc.setDrawColor(217, 119, 6); // Imperial Gold (#d97706)
    doc.setLineWidth(1.5);
    doc.rect(3, 3, cardW - 6, cardH - 6);

    // Inner Navy Border Line
    doc.setDrawColor(15, 23, 42); // Deep Navy (#0f172a)
    doc.setLineWidth(0.4);
    doc.rect(4.5, 4.5, cardW - 9, cardH - 9);

    // Top Header Banner Background
    doc.setFillColor(254, 243, 199); // Soft Gold Bar
    doc.rect(4.5, 4.5, cardW - 9, 36, 'F');

    // 1. Top Logo (20mm x 20mm)
    let y = 6;
    if (logoDataUrl) {
        try {
            doc.addImage(logoDataUrl, 'PNG', cardW / 2 - 10, y, 20, 20);
            y += 20;
        } catch { y += 10; }
    } else { y += 10; }

    // 2. Space between logo and "BHARAT SHIKSHAN SANSTHA"
    y += 3.5;

    // 3. Organization Header Text
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text("BHARAT SHIKSHAN SANSTHA'S", cardW / 2, y, { align: 'center' });
    
    // 4. Institute Name (BIGGER than Bharat Shikshan Sanstha)
    y += 4.8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9); // Imperial Gold Accent
    doc.text("SHRI SAI PRIVATE I.T.I.", cardW / 2, y, { align: 'center' });

    y += 3.2;
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text("BHADRAWATI (NCVT / DGET Affiliated)", cardW / 2, y, { align: 'center' });

    // 5. Center Photo Box
    const photoW = 28;
    const photoH = 32;
    const photoX = cardW / 2 - photoW / 2; // 28.5
    const photoY = y + 3.5; // ~51

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

    // 6. STUDENT NAME (MUST BE UNDER THE PHOTO!)
    y = photoY + photoH + 4.5; // ~87.5
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(student.name?.toUpperCase() || 'STUDENT NAME', cardW / 2, y, { align: 'center' });

    // 7. FRONT-SIDE IDENTITY DEMOGRAPHIC DETAILS BOX (Properly aligned with text wrap)
    const infoBoxY = y + 2.5; // ~90
    const infoBoxH = 30;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.rect(6, infoBoxY, cardW - 12, infoBoxH, 'S');

    const dobStr = formatDob(student.dateOfBirth);
    const subcasteStr = student.subcaste || student.educationDetails?.subcaste || '';
    const catDisplay = subcasteStr ? `${student.category || 'OPEN'} (${subcasteStr})` : (student.category || 'OPEN');
    const parentPhoneStr = student.parent?.phone || student.phone || student.landline || '—';
    const addressStr = student.address || 'Bhadrawati, Dist. Chandrapur, Maharashtra';

    let rY = infoBoxY + 4;
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);

    // Row 1: Student ID & Roll No
    doc.setFont('helvetica', 'bold'); doc.text('Student ID:', 8, rY);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(180, 83, 9);
    doc.text(`${student.studentId || 'SSITI-2026-E01'}  |  Roll #${student.rollNumber || '01'}`, 25, rY);

    // Row 2: Trade & Session
    rY += 4.5;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold'); doc.text('Trade / Class:', 8, rY);
    doc.setFont('helvetica', 'normal'); doc.text(`${student.class || 'Electrician'} ${student.section ? `(${student.section})` : ''}`, 25, rY);

    // Row 3: Blood Group & DOB
    rY += 4.5;
    doc.setFont('helvetica', 'bold'); doc.text('Blood / DOB:', 8, rY);
    doc.setFont('helvetica', 'normal'); doc.text(`${student.bloodGroup || 'O+'}  |  ${dobStr}`, 25, rY);

    // Row 4: Category / Subcaste
    rY += 4.5;
    doc.setFont('helvetica', 'bold'); doc.text('Category:', 8, rY);
    doc.setFont('helvetica', 'normal'); doc.text(catDisplay, 25, rY);

    // Row 5: Parent Contact
    rY += 4.5;
    doc.setFont('helvetica', 'bold'); doc.text('Contact:', 8, rY);
    doc.setFont('helvetica', 'normal'); doc.text(parentPhoneStr, 25, rY);

    // Row 6: Res. Address (Wrapped cleanly within 50mm width)
    rY += 4.5;
    doc.setFont('helvetica', 'bold'); doc.text('Address:', 8, rY);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5.8);
    const splitAddr = doc.splitTextToSize(addressStr, 50);
    doc.text(splitAddr[0] || addressStr, 25, rY);

    // 8. Footer Section (Placed at the very bottom of the card)
    const footerY = cardH - 18; // 122
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.4);
    doc.line(6, footerY, cardW - 6, footerY);

    doc.setFontSize(5.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Shri Sai I.T.I., Jain Mandir Rd, Ramnagar, Bhadrawati', cardW / 2, footerY + 3.5, { align: 'center' });
    
    doc.text('Helpline: +91 9529054868  |  Email: saiiti151@gmail.com', cardW / 2, footerY + 7, { align: 'center' });

    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.text('Portal: bss-ssiti-erp-and-fee-system.vercel.app', cardW / 2, footerY + 10.5, { align: 'center' });

    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('(Official Student Identity Card - Valid for 2-Year Program)', cardW / 2, footerY + 13.5, { align: 'center' });


    // ─── PAGE 2: BACK SIDE OF ID CARD ─────────────────────────────────────────
    doc.addPage([85, 140]);

    // Imperial Gold Outer Border
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(1.5);
    doc.rect(3, 3, cardW - 6, cardH - 6);

    // Inner Navy Border Line
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.rect(4.5, 4.5, cardW - 9, cardH - 9);

    // Back Header Banner
    doc.setFillColor(254, 243, 199);
    doc.rect(4.5, 4.5, cardW - 9, 10, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text("INSTITUTIONAL RULES & GUIDELINES", cardW / 2, 11, { align: 'center' });

    // Academic Registration Box
    let backY = 17;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.rect(6, backY, cardW - 12, 18, 'S');

    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold'); doc.text('Academic Session:', 8, backY + 4.5);
    doc.setFont('helvetica', 'normal'); doc.text(formatAcademicSession(student), 30, backY + 4.5);

    doc.setFont('helvetica', 'bold'); doc.text('NCVT Affiliation:', 8, backY + 9);
    doc.setFont('helvetica', 'normal'); doc.text('DGET / NCVT New Delhi Govt. Affiliated', 30, backY + 9);

    doc.setFont('helvetica', 'bold'); doc.text('Registration No:', 8, backY + 13.5);
    doc.setFont('helvetica', 'normal'); doc.text('I.T.I.- 2011/P.K.11/V.S.-03 (25/03/2011)', 30, backY + 13.5);

    // Rules & Terms Box
    backY = backY + 21; // 38
    doc.rect(6, backY, cardW - 12, 54, 'S');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('Terms & Institutional Guidelines:', 8, backY + 4.5);

    const rules = [
        "1. This card must be produced on demand at Shri Sai I.T.I. No student is allowed on campus premises without it.",
        "2. The facility is only available for courses for which the student is actually registered.",
        "3. Duplicate card is issued on payment of Rs. 200/- upon submitting a written request to the Principal office.",
        "4. Loss of card must be reported immediately to the administration desk.",
        "5. Students must strictly adhere to workshop safety norms, tool handling rules, and prescribed dress code."
    ];

    let ruleY = backY + 9.5;
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    rules.forEach(rule => {
        const splitText = doc.splitTextToSize(rule, cardW - 16);
        doc.text(splitText, 8, ruleY);
        ruleY += splitText.length * 3 + 2;
    });

    // Principal Signature & Official Seal Stamp (Bottom of Page 2)
    const signBoxY = cardH - 24; // 116
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
    doc.line(cardW / 2 - 24, signBoxY + 2, cardW / 2 + 24, signBoxY + 2);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text("Issuing Authority / Principal Seal & Sign", cardW / 2, signBoxY + 6, { align: 'center' });

    doc.save(`${student.studentId || 'Student'}_ID_Card_Front_Back.pdf`);
}
