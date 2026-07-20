import { jsPDF } from 'jspdf';

const COLLEGE_NAME = "BHARAT SHIKSHAN SANSTHA'S SHRI SAI PRIVATE I.T.I";
const COLLEGE_ADDRESS = "Jain Mandir Rd, Ramnagar, Bhadravati, Maharashtra 442902";
const COLLEGE_CONTACT = "Phone: +91 9890273889 | Email: info@saiiti.edu.in";

/**
 * Generates official 1-page Admission Application Form PDF
 */
export function generateAdmissionFormPdf(student: any) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Primary Header Background
    doc.setFillColor(2, 132, 199); // #0284c7
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(COLLEGE_NAME, pageWidth / 2, 10, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(COLLEGE_ADDRESS, pageWidth / 2, 16, { align: 'center' });
    doc.text(COLLEGE_CONTACT, pageWidth / 2, 22, { align: 'center' });

    // Document Title Banner
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 34, pageWidth - 28, 10, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, 34, pageWidth - 28, 10, 'S');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL ADMISSION APPLICATION FORM', pageWidth / 2, 40.5, { align: 'center' });

    // Photo & Signature Boxes (Top Right)
    const photoX = pageWidth - 46;
    const photoY = 48;
    
    // Render Student Photo if present
    if (student.photo && student.photo.startsWith('data:image/')) {
        try {
            doc.addImage(student.photo, 'PNG', photoX, photoY, 32, 38);
        } catch {
            doc.rect(photoX, photoY, 32, 38, 'S');
            doc.setFontSize(8);
            doc.text('AFFIX PHOTO', photoX + 16, photoY + 20, { align: 'center' });
        }
    } else {
        doc.setDrawColor(148, 163, 184);
        doc.rect(photoX, photoY, 32, 38, 'S');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('PASSPORT PHOTO', photoX + 16, photoY + 20, { align: 'center' });
    }

    // Student Details Grid
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    let y = 52;
    const col1 = 16;
    const col2 = 60;

    const addDetail = (label: string, value: string) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, col1, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value || 'N/A', col2, y);
        y += 8;
    };

    addDetail('Student ID', student.studentId || 'N/A');
    addDetail('Roll Number', student.rollNumber || 'Auto-Assigned');
    addDetail('Full Name', student.name || '');
    addDetail('Course / Trade', `${student.class || 'Electrician'} ${student.section ? `(${student.section})` : ''}`);
    addDetail('Date of Admission', new Date(student.createdAt || Date.now()).toLocaleDateString('en-IN'));
    addDetail('Email Address', student.email || 'N/A');

    // Section 2: Parent / Guardian Info
    y = Math.max(y + 4, 102);
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('PARENT / GUARDIAN INFORMATION', 18, y + 5);
    y += 12;

    addDetail('Parent Name', student.parent?.name || 'N/A');
    addDetail('Contact Number', student.parent?.phone || 'N/A');
    addDetail('Parent Email', student.parent?.email || 'N/A');

    // Section 3: Fee Allocation
    y += 4;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('FEE ASSIGNMENT & ADMISSION STATUS', 18, y + 5);
    y += 12;

    const assignedFee = student.studentFees && student.studentFees.length > 0 ? student.studentFees[0] : null;
    addDetail('Assigned Fee Structure', assignedFee?.feeStructure?.name || 'Standard Trade Fee');
    addDetail('Total Fee Amount', `₹${(assignedFee ? assignedFee.totalAmount / 100 : 25000).toLocaleString('en-IN')}`);
    addDetail('Admission Fee Status', assignedFee?.paidAmount > 0 ? `Paid ₹${(assignedFee.paidAmount / 100).toLocaleString('en-IN')}` : 'Pending Allocation');

    // Declaration & Signatures
    y = 230;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    doc.text('I hereby declare that all information provided in this admission form is true and correct to the best of my knowledge.', 16, y);
    
    y += 30;
    doc.setDrawColor(148, 163, 184);

    // Student Signature Render
    if (student.signature && student.signature.startsWith('data:image/')) {
        try {
            doc.addImage(student.signature, 'PNG', 16, y - 22, 36, 16);
        } catch { }
    }
    doc.line(16, y, 66, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Student Signature', 16, y + 5);

    doc.line(pageWidth / 2 - 25, y, pageWidth / 2 + 25, y);
    doc.text('Parent Signature', pageWidth / 2 - 25, y + 5);

    doc.line(pageWidth - 66, y, pageWidth - 16, y);
    doc.text('Authorized Principal Sign', pageWidth - 66, y + 5);

    doc.save(`${student.studentId}_Admission_Form.pdf`);
}

/**
 * Generates official 2-page Front & Back Student Identity Card PDF
 */
export function generateStudentIdCardPdf(student: any) {
    // Vertical ID Card format (85mm x 140mm)
    const doc = new jsPDF({ unit: 'mm', format: [85, 140] });
    const cardW = 85;
    const cardH = 140;

    // ─── PAGE 1: FRONT SIDE OF ID CARD ───────────────────────────────────────
    // Green Outer Border
    doc.setDrawColor(22, 163, 74); // #16a34a Green
    doc.setLineWidth(1.8);
    doc.rect(3, 3, cardW - 6, cardH - 6);

    // Inner Green Border Line
    doc.setLineWidth(0.4);
    doc.rect(4.5, 4.5, cardW - 9, cardH - 9);

    // Top Header - College Name
    let y = 14;
    doc.setTextColor(2, 132, 199); // #0284c7 Primary Blue
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text("BHARAT SHIKSHAN SANSTHA'S", cardW / 2, y, { align: 'center' });
    
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(22, 163, 74); // Green
    doc.text("SHRI SAI PRIVATE I.T.I", cardW / 2, y, { align: 'center' });

    // Student Name
    y += 9;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text(student.name || 'STUDENT NAME', cardW / 2, y, { align: 'center' });

    // Photo Box (Center)
    const photoX = cardW / 2 - 15;
    const photoY = y + 4;
    const photoW = 30;
    const photoH = 36;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
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
    doc.setTextColor(2, 132, 199);
    doc.text(student.studentId || 'SSITI-2026-E01', cardW / 2, y, { align: 'center' });

    y += 6;
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`Trade: ${student.class || 'Electrician'} ${student.section ? `(${student.section})` : ''}`, cardW / 2, y, { align: 'center' });

    y += 5;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Enrollment Year - ${new Date(student.createdAt || Date.now()).getFullYear()}`, cardW / 2, y, { align: 'center' });

    y += 5;
    doc.setFontSize(7);
    doc.text('(Valid till the end of trade programme)', cardW / 2, y, { align: 'center' });

    // Footer Info Box
    y += 6;
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.4);
    doc.line(6, y, cardW - 6, y);

    y += 4;
    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Address - Shri Sai I.T.I, Jain Mandir Rd, Ramnagar, Bhadravati', cardW / 2, y, { align: 'center' });
    
    y += 4;
    doc.text('Contact - College Helpline +91 9890273889', cardW / 2, y, { align: 'center' });

    y += 4;
    doc.setTextColor(2, 132, 199);
    doc.text('Web - bss-ssiti-erp-and-fee-system.vercel.app', cardW / 2, y, { align: 'center' });


    // ─── PAGE 2: BACK SIDE OF ID CARD ─────────────────────────────────────────
    doc.addPage([85, 140]);

    // Green Outer Border
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(1.8);
    doc.rect(3, 3, cardW - 6, cardH - 6);

    // Inner Green Border Line
    doc.setLineWidth(0.4);
    doc.rect(4.5, 4.5, cardW - 9, cardH - 9);

    y = 14;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Emergency Contact: ${student.parent?.phone || '+91 9890273889'}`, 7, y);

    y += 5;
    doc.text(`Blood Group: ${student.gender === 'Female' ? 'B+' : 'O+'}`, 7, y);

    // Rules & Terms
    y += 8;
    doc.setFontSize(7);
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
        y += splitText.length * 4 + 2;
    });

    // Principal Signature Line
    y = cardH - 22;
    if (student.signature && student.signature.startsWith('data:image/')) {
        try {
            doc.addImage(student.signature, 'PNG', cardW / 2 - 15, y - 10, 30, 10);
        } catch {}
    }
    doc.setDrawColor(148, 163, 184);
    doc.line(cardW / 2 - 22, y, cardW / 2 + 22, y);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text("Issuing Authority / Principal Seal", cardW / 2, y + 4, { align: 'center' });

    doc.save(`${student.studentId || 'Student'}_ID_Card_Front_Back.pdf`);
}
