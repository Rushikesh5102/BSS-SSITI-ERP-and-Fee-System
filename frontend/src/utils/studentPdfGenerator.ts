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
 * Generates official Admission Application Form PDF with Institute Logo & Royal Gold Theme
 */
export async function generateAdmissionFormPdf(student: any) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Load Institute Logo
    const logoDataUrl = await getLogoDataUrl();

    // ─── Header: Imperial Gold & Deep Navy (Matching Logo Colors) ────────────
    doc.setFillColor(15, 23, 42); // Deep Navy (#0f172a)
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setFillColor(217, 119, 6); // Imperial Gold Accent (#d97706)
    doc.rect(0, 28, pageWidth, 2, 'F');

    // Logo on Top Left of Header
    if (logoDataUrl) {
        try {
            doc.addImage(logoDataUrl, 'PNG', 10, 3, 24, 24);
        } catch {}
    }

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12.5);
    doc.setFont('helvetica', 'bold');
    doc.text("SHRI SAI PRIVATE INDUSTRIAL TRAINING INSTITUTE, BHADRAWATI", pageWidth / 2 + 8, 9, { align: 'center' });
    
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(254, 243, 199); // Light Warm Gold
    doc.text("RUN BY - BHARAT SHIKSHAN SANSTHA, BHADRAWATI | Affiliated by DGET New Delhi & NCVT New Delhi", pageWidth / 2 + 8, 15, { align: 'center' });
    doc.setTextColor(226, 232, 240);
    doc.text("Jain Mandir Rd, Ramnagar, Bhadravati, Maharashtra 442902 | Helpline: +91 9890273889", pageWidth / 2 + 8, 21, { align: 'center' });

    // Document Sub-Header Banner
    doc.setFillColor(254, 243, 199); // Soft Gold Bar
    doc.rect(10, 33, pageWidth - 20, 8, 'F');
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.4);
    doc.rect(10, 33, pageWidth - 20, 8, 'S');

    doc.setTextColor(180, 83, 9); // Deep Gold-Amber
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Information & Application Form - I.T.I. Details', pageWidth / 2, 38.5, { align: 'center' });

    // Photo Box (Top Right)
    const photoX = pageWidth - 42;
    const photoY = 44;
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.5);
    doc.rect(photoX, photoY, 32, 38);
    if (student.photo && student.photo.startsWith('data:image/')) {
        try { doc.addImage(student.photo, 'PNG', photoX, photoY, 32, 38); } catch {}
    } else {
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('PASSPORT PHOTO', photoX + 16, photoY + 20, { align: 'center' });
    }

    // ─── 1. Institute Details (Confirmed Registration & G.R. Numbers) ────────
    let y = 44;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('Institute Registration Details', 10, y);
    y += 3;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.setFillColor(248, 250, 252);
    doc.rect(10, y, pageWidth - 55, 30, 'S');

    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    
    // Exact confirmed numbers matching user's official document image
    const instDetails = [
        ['1. Application No', student.studentId || 'SSITI-2026-E01'],
        ['2. Name of the I.T.I.', 'SHRI SAI INDUSTRIAL TRAINING CENTER, BHADRAWATI'],
        ['3. I.T.I. Registration No', 'I.T.I.- 2011/P.K.11/V.S.-03  DGET-06/13/2/2013-TC'],
        ['4. Registration Date', '01/07/2013'],
        ['5. G.R. No.', 'I.T.I.- 2011/P.K.11/V.S.-03'],
        ['6. G.R. Date', '25/03/2011'],
    ];

    let rowY = y + 4.5;
    instDetails.forEach(([lbl, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(lbl, 12, rowY);
        doc.setFont('helvetica', 'normal');
        doc.text(val, 50, rowY);
        rowY += 4.5;
    });

    // ─── 2. Basic Details Grid ───────────────────────────────────────────────
    y = y + 33;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('Basic Student Details', 10, y);
    y += 3;

    doc.rect(10, y, pageWidth - 20, 32, 'S');
    const basicDetails = [
        ['7. Name of Student', student.name || '', '11. Mobile No', student.parent?.phone || '—'],
        ['8. Course / Trade', `${student.class || 'Electrician'} ${student.section ? `(${student.section})` : ''}`, '12. Landline / Alt', student.landline || '—'],
        ['9. Date of Birth', student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-IN') : '—', '13. E-mail', student.email || '—'],
        ['10. Category & Blood', `${student.category || 'OPEN'} | ${student.bloodGroup || 'O+'}`, '14. Enrollment No', student.studentId || 'SSITI-2026-E01'],
    ];

    rowY = y + 6;
    basicDetails.forEach(([l1, v1, l2, v2]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, 12, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v1), 45, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l2, 110, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v2), 148, rowY);
        rowY += 7;
    });

    // ─── 3. Class X Education Details ───────────────────────────────────────
    y = y + 36;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('Education Details - Class X', 10, y);
    y += 3;

    const edu = student.educationDetails || {};
    doc.rect(10, y, pageWidth - 20, 26, 'S');
    const eduRows = [
        ['39. Board', edu.board || 'Maharashtra State Board', '43. Aggregate %', edu.percentage || '—'],
        ['40. School', edu.school || 'High School', '44. City / District', edu.city || 'Bhadravati'],
        ['41. Passing Year', edu.passingYear || '2023', '45. Roll No', edu.rollNo || '—'],
        ['42. Medium', edu.medium || 'English', '46. Result Status', edu.result || 'PASSED'],
    ];

    rowY = y + 5.5;
    eduRows.forEach(([l1, v1, l2, v2]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, 12, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v1), 45, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l2, 110, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(String(v2), 148, rowY);
        rowY += 6;
    });

    // ─── 4. Submitted Original Documents Checklist ──────────────────────────
    y = y + 30;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('Submitted Original Documents Checklist', 10, y);
    y += 3;

    doc.rect(10, y, pageWidth - 20, 32, 'S');
    const docs = student.submittedDocuments || {};
    const docChecklist = [
        ['TC (Transfer Certificate)', docs.tc ? '[X] Submitted' : '[  ] Pending', 'Income Certificate', docs.income ? '[X] Submitted' : '[  ] Pending'],
        ['Mark list (Class X)', docs.marklist ? '[X] Submitted' : '[  ] Pending', 'Affidavit', docs.affidavit ? '[X] Submitted' : '[  ] Pending'],
        ['Caste Certificate', docs.caste ? '[X] Submitted' : '[  ] Pending', 'Gap Certificate', docs.gap ? '[X] Submitted' : '[  ] Pending'],
        ['Non-Creamy Layer', docs.nonCreamy ? '[X] Submitted' : '[  ] Pending', 'Aadhaar Card', docs.aadhar ? '[X] Submitted' : '[  ] Pending'],
        ['Photos (4 Passport)', docs.photo4 ? '[X] Submitted' : '[  ] Pending', 'Bank Pass Book Xerox', docs.bankPassbook ? '[X] Submitted' : '[  ] Pending'],
    ];

    rowY = y + 5.5;
    docChecklist.forEach(([l1, v1, l2, v2]) => {
        doc.setFont('helvetica', 'bold'); doc.text(l1, 12, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(v1, 60, rowY);
        doc.setFont('helvetica', 'bold'); doc.text(l2, 110, rowY);
        doc.setFont('helvetica', 'normal'); doc.text(v2, 155, rowY);
        rowY += 5.5;
    });

    // ─── Declarations & Signatures ──────────────────────────────────────────
    y = y + 36;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    doc.text('I hereby declare that all information & original documents submitted are true and correct to the best of my knowledge.', 10, y);

    y += 18;
    if (student.signature && student.signature.startsWith('data:image/')) {
        try { doc.addImage(student.signature, 'PNG', 12, y - 16, 32, 14); } catch {}
    }
    doc.setDrawColor(217, 119, 6);
    doc.line(10, y, 60, y);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(15, 23, 42);
    doc.text('Student Signature', 10, y + 4);

    doc.line(pageWidth / 2 - 25, y, pageWidth / 2 + 25, y);
    doc.text('Parent / Guardian Signature', pageWidth / 2 - 25, y + 4);

    doc.line(pageWidth - 60, y, pageWidth - 10, y);
    doc.text('Principal Seal & Signature', pageWidth - 60, y + 4);

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

    const logoDataUrl = await getLogoDataUrl();

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
    doc.text(student.studentId || 'SSITI-2026-E01', cardW / 2, y, { align: 'center' });

    y += 5.5;
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`Trade: ${student.class || 'Electrician'} ${student.section ? `(${student.section})` : ''}`, cardW / 2, y, { align: 'center' });

    y += 5;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Enrollment Year - ${new Date(student.createdAt || Date.now()).getFullYear()}`, cardW / 2, y, { align: 'center' });

    y += 4.5;
    doc.setFontSize(6.5);
    doc.text('(Valid till the end of trade programme)', cardW / 2, y, { align: 'center' });

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
    doc.text('Contact - College Helpline +91 9890273889', cardW / 2, y, { align: 'center' });

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
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Emergency Contact: ${student.parent?.phone || '+91 9890273889'}`, 7, y);

    y += 5;
    doc.text(`Blood Group: ${student.bloodGroup || 'O+'}`, 7, y);

    // Rules & Terms
    y += 8;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    const rules = [
        "A) This card should be produced on demand at Shri Sai I.T.I/Departments. No student shall be allowed on premises without it.",
        "B) The facility would be available only relating to course or courses for which the student is actually registered.",
        "C) Duplicate Id card will be issued on payment of RS.200/- by the way of demand draft/cash in favor of Shri Sai I.T.I.",
        "D) Loss of Id card is to be reported immediately to concerned authority.",
        "E) Identity card is to be submitted to issuing authority after completion of the said program."
    ];

    rules.forEach(rule => {
        const splitText = doc.splitTextToSize(rule, cardW - 14);
        doc.text(splitText, 7, y);
        y += splitText.length * 3.8 + 2;
    });

    // Principal Signature Line
    y = cardH - 22;
    if (student.signature && student.signature.startsWith('data:image/')) {
        try {
            doc.addImage(student.signature, 'PNG', cardW / 2 - 15, y - 10, 30, 10);
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
