import { jsPDF } from 'jspdf';

/**
 * Loads the official institute logo as a Base64 PNG
 */
async function getLogoDataUrl(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = '/sai_iti_logo.png';
        img.onload = () => {
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
        img.onerror = () => resolve(null);
    });
}

/**
 * Loads the official Principal Signature & Stamp as a Base64 JPEG
 */
async function getPrincipalStampDataUrl(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = '/sai_iti_principal_sign_stamp.jpg';
        img.onload = () => {
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
        img.onerror = () => resolve(null);
    });
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
    doc.rect(10, 30, pageWidth - 20, 7, 'F');
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.4);
    doc.rect(10, 30, pageWidth - 20, 7, 'S');

    doc.setTextColor(180, 83, 9); // Deep Gold-Amber
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL STUDENT ADMISSION & REGISTRATION APPLICATION FORM', pageWidth / 2, 35, { align: 'center' });

    // Photo Box (Top Right)
    const photoX = pageWidth - 40;
    const photoY = 40;
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.5);
    doc.rect(photoX, photoY, 30, 36);
    if (student.photo && student.photo.startsWith('data:image/')) {
        try { doc.addImage(student.photo, 'PNG', photoX, photoY, 30, 36); } catch {}
    } else {
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('PASSPORT PHOTO', photoX + 15, photoY + 18, { align: 'center' });
    }

    // ─── 1. Institute & Session Details ─────────────────────────────────────
    let y = 40;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('1. Institute Registration & Academic Session', 10, y);
    y += 2.5;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.setFillColor(248, 250, 252);
    doc.rect(10, y, pageWidth - 53, 24, 'S');

    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    
    const startYear = student.createdAt ? new Date(student.createdAt).getFullYear() : 2024;
    const sessionText = `${startYear} - ${startYear + 2} (2-Year ITI Program)`;

    const instDetails = [
        ['Application / Roll No:', student.studentId || 'SSITI-2024-001', 'Academic Session:', sessionText],
        ['I.T.I. Registration No:', 'I.T.I.- 2011/P.K.11/V.S.-03', 'Affiliation Authority:', 'NCVT / DGET New Delhi'],
        ['G.R. No. & Date:', 'I.T.I.- 2011/P.K.11/V.S.-03 (25/03/2011)', 'Institute Location:', 'Bhadrawati, Dist. Chandrapur'],
    ];

    let rowY = y + 4.5;
    instDetails.forEach(([l1, v1, l2, v2]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, 12, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(v1, 48, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l2, 102, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(v2, 134, rowY);
        rowY += 6.5;
    });

    // ─── 2. Basic Student & Caste Details Grid ───────────────────────────────
    y = y + 27;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('2. Student Personal & Caste Demographics', 10, y);
    y += 2.5;

    doc.rect(10, y, pageWidth - 20, 30, 'S');
    const categoryDisplay = student.subcaste 
        ? `${student.category || 'OPEN'} (${student.subcaste})`
        : (student.category || 'OPEN / General');

    const basicDetails = [
        ['Student Full Name:', student.name || '', 'Contact Phone:', student.parent?.phone || student.phone || '—'],
        ['Enrolled Trade / Class:', `${student.class || 'Electrician'} ${student.section ? `(${student.section})` : ''}`, 'Alt Phone / Landline:', student.landline || '—'],
        ['Date of Birth & Blood:', `${student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-IN') : '—'}  |  Blood: ${student.bloodGroup || 'O+'}`, 'Category & Subcaste:', categoryDisplay],
        ['Residential Address:', student.address || 'Bhadrawati, Dist. Chandrapur, Maharashtra', 'Email ID:', student.email || 'saiiti151@gmail.com'],
    ];

    rowY = y + 5;
    basicDetails.forEach(([l1, v1, l2, v2]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, 12, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v1).substring(0, 42), 48, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l2, 108, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v2).substring(0, 38), 146, rowY);
        rowY += 6.5;
    });

    // ─── 3. Class X Education Details ───────────────────────────────────────
    y = y + 33;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('3. Prior Educational Background Details', 10, y);
    y += 2.5;

    const edu = student.educationDetails || {};
    doc.rect(10, y, pageWidth - 20, 20, 'S');
    const eduRows = [
        ['Class X Board:', edu.board || 'Maharashtra State Board', 'Passing Year & %:', `${edu.passingYear || '2023'}  |  ${edu.percentage || '—'}`],
        ['School Name:', edu.school || 'High School, Bhadravati', 'Roll No & Medium:', `${edu.rollNo || '—'}  |  ${edu.medium || 'Marathi / English'}`],
        ['Other Qualifications:', `${edu.higherEducation || '12th / Degree / Domicile verified'}`, 'Result Status:', 'PASSED (Eligible for ITI)'],
    ];

    rowY = y + 4.5;
    eduRows.forEach(([l1, v1, l2, v2]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, 12, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v1).substring(0, 42), 46, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l2, 108, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v2).substring(0, 38), 146, rowY);
        rowY += 5.5;
    });

    // ─── 4. Submitted Original Documents Checklist (Updated with Domicile, 12th, BA, BCom, BTech) ─
    y = y + 23;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('4. Original Documents Submitted Checklist (Verified at Admission Desk)', 10, y);
    y += 2.5;

    doc.rect(10, y, pageWidth - 20, 32, 'S');
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
        rowY += 5.5;
    });

    // ─── 5. Admission Fee Breakdown & Agreed Total ───────────────────────────
    y = y + 35;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('5. Admission Fee Structure & Assigned Dues', 10, y);
    y += 2.5;

    doc.rect(10, y, pageWidth - 20, 16, 'S');
    const feeAssigned = student.feeAssignment || {};
    const totalAssignedPaise = feeAssigned.totalAmount || 0;
    const paidPaise = feeAssigned.paidAmount || 0;
    const pendingPaise = feeAssigned.pendingAmount || Math.max(0, totalAssignedPaise - paidPaise);

    const feeBreakdownText = [
        ['Tuition Fee:', `Rs. ${(student.tuitionFee || (totalAssignedPaise ? (totalAssignedPaise / 100 * 0.7) : 15000)).toLocaleString('en-IN')}`, 'Exam Fee:', `Rs. ${(student.examFee || 2000).toLocaleString('en-IN')}`, 'Dress & Material:', `Rs. ${(student.dressMaterialFee || 3000).toLocaleString('en-IN')}`],
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
        rowY += 6;
    });

    // ─── 6. Declarations & 4 Signature Sections ─────────────────────────────
    y = y + 19;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    doc.text('Declaration: I hereby declare that all particulars & certificates submitted are genuine and I agree to abide by all rules of Shri Sai I.T.I.', 10, y);

    y += 16;
    if (student.signature && student.signature.startsWith('data:image/')) {
        try { doc.addImage(student.signature, 'PNG', 12, y - 14, 28, 12); } catch {}
    }
    
    // 1. Student Signature
    doc.setDrawColor(217, 119, 6);
    doc.line(10, y, 48, y);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(15, 23, 42);
    doc.text('Student Signature', 10, y + 3.5);

    // 2. Parent Signature
    doc.line(56, y, 96, y);
    doc.text('Parent Signature', 56, y + 3.5);

    // 3. Clerk / Cashier Signature Section
    doc.line(104, y, 146, y);
    doc.text('Clerk / Cashier Signature', 104, y + 3.5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(100, 116, 139);
    doc.text('Accounts Verified', 104, y + 7);

    // 4. Principal Seal & Signature
    if (stampDataUrl) {
        try { doc.addImage(stampDataUrl, 'JPEG', pageWidth - 55, y - 18, 45, 16); } catch {}
    } else if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, 'PNG', pageWidth - 45, y - 14, 14, 14); } catch {}
    }
    doc.setDrawColor(217, 119, 6);
    doc.line(pageWidth - 56, y, pageWidth - 10, y);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(15, 23, 42);
    doc.text('Principal Seal & Sign', pageWidth - 56, y + 3.5);

    doc.save(`${student.studentId || 'Admission'}_Application_Form.pdf`);
}

/**
 * Generates official 2-page Front & Back Student Identity Card PDF with Logo & Royal Gold Scheme
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
    doc.setLineWidth(1.8);
    doc.rect(3, 3, cardW - 6, cardH - 6);

    // Inner Navy Border Line
    doc.setDrawColor(15, 23, 42); // Deep Navy (#0f172a)
    doc.setLineWidth(0.4);
    doc.rect(4.5, 4.5, cardW - 9, cardH - 9);

    // Top Logo Banner
    let y = 8;
    if (logoDataUrl) {
        try {
            doc.addImage(logoDataUrl, 'PNG', cardW / 2 - 8, y, 16, 16);
            y += 18;
        } catch { y += 6; }
    } else { y += 6; }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text("BHARAT SHIKSHAN SANSTHA'S", cardW / 2, y, { align: 'center' });
    
    y += 4.5;
    doc.setFontSize(9.5);
    doc.setTextColor(180, 83, 9); // Imperial Gold Accent
    doc.text("SHRI SAI PRIVATE I.T.I", cardW / 2, y, { align: 'center' });

    // Student Name
    y += 8;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(student.name?.toUpperCase() || 'STUDENT NAME', cardW / 2, y, { align: 'center' });

    // Photo Box (Center)
    const photoX = cardW / 2 - 15;
    const photoY = y + 4;
    const photoW = 30;
    const photoH = 36;

    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.6);
    doc.rect(photoX, photoY, photoW, photoH);

    if (student.photo && student.photo.startsWith('data:image/')) {
        try {
            doc.addImage(student.photo, 'PNG', photoX, photoY, photoW, photoH);
        } catch {
            doc.setFontSize(8);
            doc.text('PHOTO', photoX + 15, photoY + 18, { align: 'center' });
        }
    } else {
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('PHOTO', photoX + 15, photoY + 18, { align: 'center' });
    }

    // Student ID & Details
    y = photoY + photoH + 7;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text(student.studentId || 'SSITI-2024-001', cardW / 2, y, { align: 'center' });

    y += 5.5;
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`Trade: ${student.class || 'Electrician'} ${student.section ? `(${student.section})` : ''}`, cardW / 2, y, { align: 'center' });

    y += 5;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const startYr = student.createdAt ? new Date(student.createdAt).getFullYear() : 2024;
    doc.text(`Academic Session: ${startYr} - ${startYr + 2} (2-Year Program)`, cardW / 2, y, { align: 'center' });

    y += 4.5;
    doc.setFontSize(6.5);
    doc.text('(Valid till the end of 2-year trade programme)', cardW / 2, y, { align: 'center' });

    // Footer Info Box
    y += 5;
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.4);
    doc.line(6, y, cardW - 6, y);

    y += 3.5;
    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Address - Shri Sai I.T.I, Jain Mandir Rd, Ramnagar, Bhadravati', cardW / 2, y, { align: 'center' });
    
    y += 3.5;
    doc.text('Contact - College Helpline +91 9529054868', cardW / 2, y, { align: 'center' });

    y += 3.5;
    doc.setTextColor(180, 83, 9);
    doc.text('Web - bss-ssiti-erp-and-fee-system.vercel.app', cardW / 2, y, { align: 'center' });


    // ─── PAGE 2: BACK SIDE OF ID CARD ─────────────────────────────────────────
    doc.addPage([85, 140]);

    // Imperial Gold Outer Border
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(1.8);
    doc.rect(3, 3, cardW - 6, cardH - 6);

    // Inner Navy Border Line
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.rect(4.5, 4.5, cardW - 9, cardH - 9);

    y = 14;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Blood Group: ${student.bloodGroup || 'O+'}  |  Category: ${student.category || 'OPEN'}`, 7, y);

    if (student.address) {
        y += 6;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const splitAddr = doc.splitTextToSize(`Res. Address: ${student.address}`, cardW - 14);
        doc.text(splitAddr, 7, y);
        y += splitAddr.length * 3.5;
    }

    // Rules & Terms
    y += 6;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    const rules = [
        "A) This card should be produced on demand at Shri Sai I.T.I/Departments. No student shall be allowed on premises without it.",
        "B) The facility would be available only relating to course or courses for which the student is actually registered.",
        "C) Duplicate Id card will be issued on payment of RS.200/- by the way of demand draft/cash in favor of Shri Sai I.T.I.",
        "D) Loss of Id card is to be reported immediately to concerned authority."
    ];

    rules.forEach(rule => {
        const splitText = doc.splitTextToSize(rule, cardW - 14);
        doc.text(splitText, 7, y);
        y += splitText.length * 3.8 + 2;
    });

    // Principal Signature & Official Seal Stamp
    y = cardH - 22;
    if (stampDataUrl) {
        try {
            doc.addImage(stampDataUrl, 'JPEG', cardW / 2 - 20, y - 18, 40, 15);
        } catch {}
    } else if (logoDataUrl) {
        try {
            doc.addImage(logoDataUrl, 'PNG', cardW / 2 - 7, y - 15, 14, 14);
        } catch {}
    }
    doc.setDrawColor(217, 119, 6);
    doc.line(cardW / 2 - 22, y, cardW / 2 + 22, y);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text("Issuing Authority / Principal Seal", cardW / 2, y + 4, { align: 'center' });

    doc.save(`${student.studentId || 'Student'}_ID_Card_Front_Back.pdf`);
}
