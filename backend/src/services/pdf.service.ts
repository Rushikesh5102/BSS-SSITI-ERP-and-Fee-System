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
    const page = doc.addPage([841.89, 595.28]); // A4 Landscape
    const { width, height } = page.getSize();

    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await doc.embedFont(StandardFonts.Helvetica);

    let logoImage: any = null;
    try {
        const logoPath = path.join(process.cwd(), 'assets', 'sai_iti_logo.png');
        if (fs.existsSync(logoPath)) {
            const logoBytes = fs.readFileSync(logoPath);
            try {
                logoImage = await doc.embedPng(logoBytes);
            } catch {
                logoImage = await doc.embedJpg(logoBytes);
            }
        }
    } catch { }

    let stampImage: any = null;
    try {
        const stampPath = path.join(process.cwd(), 'assets', 'sai_iti_principal_sign_stamp.jpg');
        if (fs.existsSync(stampPath)) {
            const stampBytes = fs.readFileSync(stampPath);
            stampImage = await doc.embedJpg(stampBytes);
        }
    } catch { }

    const primary = rgb(0.07, 0.17, 0.35);    // Premium Navy Blue (#122b59)
    const accent = rgb(0.02, 0.52, 0.78);     // Brand Sky Blue (#0284c7)
    const gray = rgb(0.4, 0.45, 0.5);
    const lightGray = rgb(0.96, 0.97, 0.98);
    const black = rgb(0.06, 0.09, 0.16);
    const white = rgb(1, 1, 1);

    const drawReceiptCopy = (xOffset: number, copyLabel: string) => {
        const leftX = xOffset + 25;
        const rightX = xOffset + 205;
        const copyWidth = 360;

        // Header rectangle
        page.drawRectangle({ x: xOffset + 15, y: height - 100, width: copyWidth, height: 85, color: primary });

        let logoX = xOffset + 25;
        let textX = xOffset + 25;
        if (logoImage) {
            page.drawImage(logoImage, { x: logoX, y: height - 92, width: 70, height: 70 });
            textX = xOffset + 105;
        }

        page.drawText(config.school.name, { x: textX, y: height - 42, font: boldFont, size: 16, color: white });
        page.drawText(config.school.address.substring(0, 50), { x: textX, y: height - 58, font: regularFont, size: 8, color: rgb(0.8, 0.8, 0.9) });
        page.drawText(`Ph: ${config.school.phone} | Email: ${config.school.email}`, { x: textX, y: height - 72, font: regularFont, size: 7.5, color: rgb(0.8, 0.8, 0.9) });
        page.drawText(copyLabel.toUpperCase(), { x: textX, y: height - 86, font: boldFont, size: 8, color: accent });

        page.drawRectangle({ x: xOffset + 235, y: height - 130, width: 140, height: 26, color: accent });
        page.drawText('FEE RECEIPT', { x: xOffset + 245, y: height - 116, font: boldFont, size: 8.5, color: white });
        page.drawText(data.receiptNumber, { x: xOffset + 245, y: height - 126, font: regularFont, size: 7, color: white });

        page.drawLine({ start: { x: leftX, y: height - 142 }, end: { x: xOffset + 375, y: height - 142 }, thickness: 0.75, color: primary });

        let y = height - 165;
        const drawField = (label: string, val: string, fx: number, fy: number) => {
            page.drawText(label, { x: fx, y: fy, font: regularFont, size: 8, color: gray });
            page.drawText(val || '—', { x: fx, y: fy - 11, font: boldFont, size: 9, color: black });
        };

        drawField('Student Name', data.studentName, leftX, y);
        drawField('Receipt Date', new Date(data.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), rightX, y);

        y -= 30;
        drawField('Student ID', data.studentId, leftX, y);
        drawField('Payment Mode', data.paymentMode, rightX, y);

        y -= 30;
        drawField('Class / Trade', data.className, leftX, y);
        if (data.transactionRef) {
            drawField('Transaction / Ref. No.', data.transactionRef, rightX, y);
        }

        if (data.parentName) {
            y -= 30;
            drawField("Parent's Name", data.parentName, leftX, y);
            if (data.parentPhone) {
                drawField("Parent's Phone", data.parentPhone, rightX, y);
            }
        }

        y -= 38;
        page.drawRectangle({ x: leftX, y: y - 8, width: copyWidth - 20, height: 20, color: primary });
        page.drawText('PAYMENT DETAILS', { x: leftX + 10, y: y + 1, font: boldFont, size: 8, color: white });

        y -= 22;
        page.drawRectangle({ x: leftX, y: y - 10, width: copyWidth - 20, height: 20, color: lightGray });
        page.drawText(data.feesFor || 'School Fee', { x: leftX + 10, y: y - 4, font: regularFont, size: 8, color: black });
        page.drawText(formatCurrencyForPdf(data.amount), { x: xOffset + 310, y: y - 4, font: boldFont, size: 8.5, color: black });

        y -= 36;
        page.drawRectangle({ x: leftX, y: y - 10, width: copyWidth - 20, height: 26, color: accent });
        page.drawText('TOTAL AMOUNT PAID', { x: leftX + 10, y: y + 2, font: boldFont, size: 8.5, color: white });
        page.drawText(formatCurrencyForPdf(data.amount), { x: xOffset + 300, y: y + 2, font: boldFont, size: 10, color: white });

        y -= 22;
        const amountInWords = numberToWords(paiseToRupees(data.amount));
        page.drawText(`In Words: ${amountInWords} Rupees Only`, { x: leftX, y, font: regularFont, size: 7.5, color: gray });

        if (data.remarks) {
            y -= 14;
            page.drawText(`Remarks: ${data.remarks}`, { x: leftX, y, font: regularFont, size: 7.5, color: gray });
        }

        y -= 54;
        page.drawLine({ start: { x: leftX, y }, end: { x: leftX + 100, y }, thickness: 0.5, color: gray });
        page.drawText("Student's Signature", { x: leftX, y: y - 10, font: regularFont, size: 7, color: gray });

        const sigX = xOffset + 245;
        page.drawLine({ start: { x: sigX, y }, end: { x: sigX + 110, y }, thickness: 0.5, color: gray });
        page.drawText("Authorized Signature", { x: sigX, y: y - 10, font: regularFont, size: 7, color: gray });
        page.drawText(config.school.name, { x: sigX, y: y - 18, font: boldFont, size: 6.5, color: primary });

        if (stampImage) {
            page.drawImage(stampImage, { x: sigX + 15, y: y + 4, width: 55, height: 35 });
        }
    };

    drawReceiptCopy(0, 'Office Copy (Counterfoil)');
    drawReceiptCopy(425, 'Student Copy');

    const midX = 415;
    for (let currentY = 15; currentY < height - 15; currentY += 10) {
        page.drawLine({
            start: { x: midX, y: currentY },
            end: { x: midX, y: currentY + 5 },
            thickness: 0.75,
            color: gray
        });
    }

    page.drawRectangle({ x: 0, y: 0, width, height: 20, color: primary });
    page.drawText('This is a computer-generated receipt and does not require a physical signature.', {
        x: 30, y: 6, font: regularFont, size: 6.5, color: rgb(0.8, 0.8, 0.9),
    });
    page.drawText(`Generated: ${new Date().toLocaleString('en-IN')}`, {
        x: width - 180, y: 6, font: regularFont, size: 6, color: rgb(0.7, 0.7, 0.8),
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
const sanitizePdfText = (text: string | null | undefined): string => {
    if (!text) return '';
    return String(text)
        .replace(/₹/g, 'Rs.')
        .replace(/[^\x00-\x7F]/g, (char) => {
            if (char === '–' || char === '—') return '-';
            if (char === '’' || char === '‘') return "'";
            if (char === '“' || char === '”') return '"';
            if (char === '…') return '...';
            return '';
        });
};

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
            try {
                logoImage = await doc.embedPng(logoBytes);
            } catch {
                logoImage = await doc.embedJpg(logoBytes);
            }
        }
    } catch { }

    const primary = rgb(0.12, 0.29, 0.59);
    const black = rgb(0, 0, 0);
    const white = rgb(1, 1, 1);
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
        p.drawText(sanitizePdfText(config.school.name), { x: textX, y: height - 40, font: boldFont, size: 18, color: white });
        p.drawText(sanitizePdfText(title), { x: textX, y: height - 60, font: regularFont, size: 12, color: rgb(0.9, 0.9, 1) });
        p.drawText(sanitizePdfText(`Generated: ${new Date().toLocaleDateString('en-IN')}`), { x: width - 170, y: height - 60, font: regularFont, size: 9, color: white });
    };

    drawHeader(page);

    let y = height - 120;
    const colWidth = (width - 70) / columns.length;

    // Draw Column Headers
    page.drawRectangle({ x: 35, y: y - 5, width: width - 70, height: 24, color: lightGray });
    columns.forEach((col, idx) => {
        const headerText = sanitizePdfText(col.header);
        page.drawText(headerText, { x: 40 + idx * colWidth, y: y + 2, font: boldFont, size: 9, color: black });
    });

    y -= 25;

    rows.forEach((row) => {
        if (y < 50) {
            page = doc.addPage([595.28, 841.89]);
            drawHeader(page);
            y = height - 120;

            page.drawRectangle({ x: 35, y: y - 5, width: width - 70, height: 24, color: lightGray });
            columns.forEach((col, idx) => {
                const headerText = sanitizePdfText(col.header);
                page.drawText(headerText, { x: 40 + idx * colWidth, y: y + 2, font: boldFont, size: 9, color: black });
            });
            y -= 25;
        }

        columns.forEach((col, idx) => {
            const rawVal = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—';
            const val = sanitizePdfText(rawVal);
            page.drawText(val.substring(0, 20), { x: 40 + idx * colWidth, y, font: regularFont, size: 8.5, color: black });
        });

        page.drawLine({ start: { x: 35, y: y - 6 }, end: { x: width - 35, y: y - 6 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
        y -= 20;
    });

    // Calculate sum totals of financial columns for PDF
    const sums: Record<string, number> = {};
    columns.forEach(col => {
        if (col.header.includes('(₹)')) {
            sums[col.key] = rows.reduce((sum, r) => {
                const val = r[col.key];
                const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
                return sum + num;
            }, 0);
        }
    });

    const hasTotals = Object.keys(sums).length > 0;
    if (hasTotals) {
        if (y < 50) {
            page = doc.addPage([595.28, 841.89]);
            drawHeader(page);
            y = height - 120;
        }

        // Draw background box for TOTAL row
        page.drawRectangle({ x: 35, y: y - 5, width: width - 70, height: 20, color: rgb(0.9, 0.93, 0.98) });

        columns.forEach((col, idx) => {
            let val = '';
            if (idx === 0) {
                val = 'TOTAL';
            } else if (sums[col.key] !== undefined) {
                val = `Rs. ${sums[col.key].toLocaleString('en-IN')}`;
            }
            if (val) {
                page.drawText(sanitizePdfText(val), { x: 40 + idx * colWidth, y, font: boldFont, size: 8.5, color: black });
            }
        });
        y -= 20;
    }

    const pdfBytes = await doc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
};
