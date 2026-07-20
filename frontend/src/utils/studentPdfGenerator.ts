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
    addDetail('Total Total Fee Amount', `₹${(assignedFee ? assignedFee.totalAmount / 100 : 25000).toLocaleString('en-IN')}`);
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
 * Generates official printable Student Identity Card PDF
 */
export function generateStudentIdCardPdf(student: any) {
    // CR80 Standard ID Card dimensions: 85.6mm x 54mm
    const doc = new jsPDF({ unit: 'mm', format: [86, 130] });

    // Card Header
    doc.setFillColor(2, 132, 199); // #0284c7
    doc.rect(0, 0, 86, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text("SHRI SAI PRIVATE I.T.I", 43, 8, { align: 'center' });
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text("Ramnagar, Bhadravati • +91 9890273889", 43, 13, { align: 'center' });

    doc.setFillColor(245, 158, 11); // #f59e0b Gold Bar
    doc.rect(0, 18, 86, 6, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text("STUDENT IDENTITY CARD", 43, 22.5, { align: 'center' });

    // Photo Box (Center)
    const photoX = 28;
    const photoY = 28;
    const photoW = 30;
    const photoH = 34;

    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(0.6);
    doc.rect(photoX, photoY, photoW, photoH, 'S');

    if (student.photo && student.photo.startsWith('data:image/')) {
        try {
            doc.addImage(student.photo, 'PNG', photoX, photoY, photoW, photoH);
        } catch {
            doc.setFontSize(7);
            doc.text('PHOTO', photoX + 15, photoY + 17, { align: 'center' });
        }
    } else {
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('PHOTO', photoX + 15, photoY + 17, { align: 'center' });
    }

    // Student Details
    let y = 68;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(student.name?.toUpperCase() || 'STUDENT NAME', 43, y, { align: 'center' });

    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(2, 132, 199);
    doc.text(`ID: ${student.studentId || 'SAI-2026-001'}`, 43, y, { align: 'center' });

    y += 6;
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.text(`Trade: ${student.class || 'Electrician'} ${student.section ? `(${student.section})` : ''}`, 43, y, { align: 'center' });

    if (student.rollNumber) {
        y += 5;
        doc.text(`Roll No: ${student.rollNumber}`, 43, y, { align: 'center' });
    }

    if (student.parent?.phone) {
        y += 5;
        doc.text(`Emergency Phone: ${student.parent.phone}`, 43, y, { align: 'center' });
    }

    // Footer Stamp
    y = 118;
    doc.setDrawColor(203, 213, 225);
    doc.line(10, y, 76, y);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text("ISSUED BY PRINCIPAL • SHRI SAI I.T.I", 43, y + 4, { align: 'center' });

    doc.save(`${student.studentId}_ID_Card.pdf`);
}
