import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { config } from '../config';
import { formatCurrencyForPdf, paiseToRupees } from '../utils/currency';

interface ReceiptData {
    receiptNumber: string;
    studentName: string;
    studentId: string;
    className: string;
    parentName?: string;
    parentPhone?: string;
    paymentDate: Date;
    amount: number; // in paise
    paymentMode: string;
    transactionRef?: string;
    feesFor?: string;
    bankName?: string;
    remarks?: string;
}

/**
 * Generate a professional PDF receipt using pdf-lib
 * Returns the PDF as a Buffer (can be saved to disk or streamed)
 */
import fs from 'fs';
import path from 'path';

export const generateReceiptPdf = async (data: ReceiptData): Promise<Buffer> => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Embed fonts
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await doc.embedFont(StandardFonts.Helvetica);

    // Embed College Logo if available
    let logoImage: any = null;
    try {
        const logoPath = path.join(process.cwd(), 'assets', 'sai_iti_logo.png');
        if (fs.existsSync(logoPath)) {
            const logoBytes = fs.readFileSync(logoPath);
            logoImage = await doc.embedPng(logoBytes);
        }
    } catch { /* Fall back to text-only header if logo fails to load */ }

    const primary = rgb(0.07, 0.17, 0.35);    // Premium Navy Blue (#122b59)
    const accent = rgb(0.02, 0.52, 0.78);     // Brand Sky Blue (#0284c7)
    const gray = rgb(0.4, 0.45, 0.5);
    const lightGray = rgb(0.96, 0.97, 0.98);
    const black = rgb(0.06, 0.09, 0.16);      // Cool dark black/slate
    const white = rgb(1, 1, 1);

    // ── Header background ─────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: height - 120, width, height: 120, color: primary });

    let textX = 40;
    if (logoImage) {
        page.drawImage(logoImage, {
            x: 40,
            y: height - 105,
            width: 70,
            height: 70,
        });
        textX = 125;
    }

    // School name
    page.drawText(config.school.name, {
        x: textX, y: height - 55,
        font: boldFont, size: 24, color: white,
    });

    // School details
    page.drawText(config.school.address, {
        x: textX, y: height - 75,
        font: regularFont, size: 9, color: rgb(0.8, 0.8, 0.9),
    });
    page.drawText(`Ph: ${config.school.phone}  |  Email: ${config.school.email}`, {
        x: textX, y: height - 90,
        font: regularFont, size: 9, color: rgb(0.8, 0.8, 0.9),
    });

    // ── Receipt badge ──────────────────────────────────────────────────────────
    page.drawRectangle({ x: width - 200, y: height - 110, width: 160, height: 50, color: accent });
    page.drawText('FEE RECEIPT', { x: width - 185, y: height - 75, font: boldFont, size: 12, color: white });
    page.drawText(data.receiptNumber, { x: width - 185, y: height - 92, font: regularFont, size: 8, color: white });

    // ── Divider line ───────────────────────────────────────────────────────────
    page.drawLine({ start: { x: 40, y: height - 135 }, end: { x: width - 40, y: height - 135 }, thickness: 1, color: primary });

    // ── Student & payment info grid ────────────────────────────────────────────
    const leftX = 40;
    const rightX = 320;
    let y = height - 165;

    const drawField = (label: string, value: string, x: number, yPos: number) => {
        page.drawText(label, { x, y: yPos, font: regularFont, size: 9, color: gray });
        page.drawText(value || '—', { x, y: yPos - 14, font: boldFont, size: 10, color: black });
    };

    drawField('Student Name', data.studentName, leftX, y);
    drawField('Receipt Date', new Date(data.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), rightX, y);

    y -= 45;
    drawField('Student ID', data.studentId, leftX, y);
    drawField('Payment Mode', data.paymentMode, rightX, y);

    y -= 45;
    drawField('Class / Trade', data.className, leftX, y);
    if (data.transactionRef) {
        drawField('Transaction / Ref. No.', data.transactionRef, rightX, y);
    }

    if (data.parentName) {
        y -= 45;
        drawField("Parent's Name", data.parentName, leftX, y);
        if (data.parentPhone) {
            drawField("Parent's Phone", data.parentPhone, rightX, y);
        }
    }

    // ── Fee breakdown box ──────────────────────────────────────────────────────
    y -= 55;
    page.drawRectangle({ x: leftX, y: y - 10, width: width - 80, height: 30, color: primary });
    page.drawText('PAYMENT DETAILS', { x: leftX + 15, y: y + 5, font: boldFont, size: 11, color: white });

    y -= 35;
    page.drawRectangle({ x: leftX, y: y - 15, width: width - 80, height: 30, color: lightGray });
    page.drawText(data.feesFor || 'School Fee', { x: leftX + 15, y: y, font: regularFont, size: 10, color: black });
    page.drawText(formatCurrencyForPdf(data.amount), {
        x: width - 120,
        y: y,
        font: boldFont,
        size: 10,
        color: black,
    });

    // ── Total amount box ───────────────────────────────────────────────────────
    y -= 55;
    page.drawRectangle({ x: leftX, y: y - 15, width: width - 80, height: 40, color: accent });
    page.drawText('TOTAL AMOUNT PAID', { x: leftX + 15, y: y + 8, font: boldFont, size: 11, color: white });
    page.drawText(formatCurrencyForPdf(data.amount), {
        x: width - 160,
        y: y + 8,
        font: boldFont,
        size: 14,
        color: white,
    });

    // Amount in words
    y -= 30;
    const amountInWords = numberToWords(paiseToRupees(data.amount));
    page.drawText(`In Words: ${amountInWords} Rupees Only`, {
        x: leftX, y,
        font: regularFont, size: 9, color: gray,
    });

    // ── Remarks ────────────────────────────────────────────────────────────────
    if (data.remarks) {
        y -= 30;
        page.drawText(`Remarks: ${data.remarks}`, { x: leftX, y, font: regularFont, size: 9, color: gray });
    }

    // ── Signature section ──────────────────────────────────────────────────────
    y -= 80;

    let stampImage: any = null;
    try {
        const stampPath = path.join(process.cwd(), 'assets', 'sai_iti_principal_sign_stamp.jpg');
        if (fs.existsSync(stampPath)) {
            const stampBytes = fs.readFileSync(stampPath);
            stampImage = await doc.embedJpg(stampBytes);
        }
    } catch { }

    page.drawLine({ start: { x: leftX, y }, end: { x: leftX + 150, y }, thickness: 0.5, color: gray });
    page.drawText("Student's Signature", { x: leftX, y: y - 15, font: regularFont, size: 8, color: gray });

    if (stampImage) {
        page.drawImage(stampImage, {
            x: width - 190,
            y: y - 5,
            width: 140,
            height: 45,
        });
    }

    page.drawLine({ start: { x: width - 190, y }, end: { x: width - 40, y }, thickness: 0.5, color: gray });
    page.drawText("Authorized Signature & Seal", { x: width - 190, y: y - 15, font: regularFont, size: 8, color: gray });
    page.drawText(config.school.name, { x: width - 190, y: y - 28, font: boldFont, size: 8, color: primary });

    // ── Footer ─────────────────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: 0, width, height: 40, color: primary });
    page.drawText('This is a computer-generated receipt and does not require a physical signature.', {
        x: 40, y: 22, font: regularFont, size: 8, color: rgb(0.8, 0.8, 0.9),
    });
    page.drawText(`Generated: ${new Date().toLocaleString('en-IN')}`, {
        x: 40, y: 10, font: regularFont, size: 7, color: rgb(0.7, 0.7, 0.8),
    });

    const pdfBytes = await doc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
};

// Simple number to words converter (Indian numbering)
function numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convert = (n: number): string => {
        if (n === 0) return '';
        if (n < 20) return ones[n] + ' ';
        if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10] + ' ';
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + convert(n % 100);
        if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + convert(n % 1000);
        if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + convert(n % 100000);
        return convert(Math.floor(n / 10000000)) + 'Crore ' + convert(n % 10000000);
    };

    const intPart = Math.floor(num);
    return convert(intPart).trim();
}

/**
 * Generate a multi-page PDF collection/summary report with college logo
 */
export const generateReportPdf = async (
    title: string,
    rows: Array<Record<string, any>>,
    columns: Array<{ header: string; key: string }>
): Promise<Buffer> => {
    const doc = await PDFDocument.create();
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await doc.embedFont(StandardFonts.Helvetica);

    let logoImage: any = null;
    try {
        const logoPath = path.join(process.cwd(), 'assets', 'sai_iti_logo.png');
        if (fs.existsSync(logoPath)) {
            const logoBytes = fs.readFileSync(logoPath);
            logoImage = await doc.embedPng(logoBytes);
        }
    } catch { }

    const primary = rgb(0.12, 0.29, 0.59);
    const black = rgb(0, 0, 0);
    const white = rgb(1, 1, 1);
    const gray = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.95, 0.95, 0.95);

    let page = doc.addPage([595.28, 841.89]);
    let { width, height } = page.getSize();

    const drawHeader = (p: any) => {
        p.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: primary });
        let textX = 35;
        if (logoImage) {
            p.drawImage(logoImage, { x: 35, y: height - 80, width: 55, height: 55 });
            textX = 100;
        }
        p.drawText(config.school.name, { x: textX, y: height - 40, font: boldFont, size: 18, color: white });
        p.drawText(title, { x: textX, y: height - 60, font: regularFont, size: 12, color: rgb(0.9, 0.9, 1) });
        p.drawText(`Generated: ${new Date().toLocaleDateString('en-IN')}`, { x: width - 170, y: height - 60, font: regularFont, size: 9, color: white });
    };

    drawHeader(page);

    let y = height - 120;
    const colWidth = (width - 70) / columns.length;

    // Draw Column Headers
    page.drawRectangle({ x: 35, y: y - 5, width: width - 70, height: 24, color: lightGray });
    columns.forEach((col, idx) => {
        page.drawText(col.header, { x: 40 + idx * colWidth, y: y + 2, font: boldFont, size: 9, color: black });
    });

    y -= 25;

    rows.forEach((row) => {
        if (y < 50) {
            page = doc.addPage([595.28, 841.89]);
            drawHeader(page);
            y = height - 120;

            page.drawRectangle({ x: 35, y: y - 5, width: width - 70, height: 24, color: lightGray });
            columns.forEach((col, idx) => {
                page.drawText(col.header, { x: 40 + idx * colWidth, y: y + 2, font: boldFont, size: 9, color: black });
            });
            y -= 25;
        }

        columns.forEach((col, idx) => {
            const val = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—';
            page.drawText(val.substring(0, 20), { x: 40 + idx * colWidth, y, font: regularFont, size: 8.5, color: black });
        });

        page.drawLine({ start: { x: 35, y: y - 6 }, end: { x: width - 35, y: y - 6 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
        y -= 20;
    });

    const pdfBytes = await doc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
};
