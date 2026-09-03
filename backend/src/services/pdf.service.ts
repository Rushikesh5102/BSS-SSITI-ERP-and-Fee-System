import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { config } from '../config';
import { formatCurrencyForPdf, paiseToRupees } from '../utils/currency';
import fs from 'fs';
import path from 'path';

export interface SplitPaymentBreakdownItem {
    mode: string;
    amount: number; // in paise
    transactionRef?: string;
    bankName?: string;
    chequeDate?: string;
}

interface ReceiptData {
    receiptNumber: string;
    studentName: string;
    studentId: string;
    className: string;
    parentName?: string;
    parentPhone?: string;
    paymentDate: Date;
    amount: number; // in paise (amount paid in this receipt)
    totalFee?: number; // total agreed course fee in paise
    totalPaid?: number; // total paid till date in paise
    balanceDue?: number; // remaining balance in paise
    paymentMode: string;
    transactionRef?: string;
    feesFor?: string;
    bankName?: string;
    remarks?: string;
    clerkName?: string;
    isSupplementary?: boolean;
    supplementarySubject?: string;
    feeBreakdown?: Array<{ name: string; amount: number }>;
    splitPaymentBreakdown?: SplitPaymentBreakdownItem[];
}

/**
 * Cleans string to ensure 100% WinAnsi / ASCII compatibility for pdf-lib standard fonts
 */
export function cleanAscii(str: string | undefined | null): string {
    if (!str) return '';
    return String(str)
        .replace(/[\u2014\u2013]/g, '-')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/\u20B9/g, 'Rs. ')
        .replace(/[^\x20-\x7E\t\r\n]/g, '')
        .trim();
}

/**
 * Generate a professional PDF receipt using pdf-lib
 * Returns the PDF as a Buffer (can be saved to disk or streamed)
 */
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
    const gold = rgb(0.85, 0.65, 0.13);       // Supplementary Gold (#d97706)
    const gray = rgb(0.35, 0.40, 0.48);
    const lightGray = rgb(0.95, 0.96, 0.98);
    const black = rgb(0.06, 0.09, 0.16);
    const white = rgb(1, 1, 1);
    const warnRed = rgb(0.85, 0.20, 0.20);
    const successGreen = rgb(0.06, 0.60, 0.35);

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

        page.drawText(cleanAscii(config.school.name), { x: textX, y: height - 42, font: boldFont, size: 15, color: white });
        page.drawText(cleanAscii(config.school.address).substring(0, 50), { x: textX, y: height - 58, font: regularFont, size: 8, color: rgb(0.8, 0.8, 0.9) });
        page.drawText(cleanAscii(`Ph: ${config.school.phone} | Email: ${config.school.email}`), { x: textX, y: height - 72, font: regularFont, size: 7.5, color: rgb(0.8, 0.8, 0.9) });
        page.drawText(copyLabel.toUpperCase(), { x: textX, y: height - 86, font: boldFont, size: 8, color: accent });

        const headerBadgeColor = data.isSupplementary ? gold : accent;
        const headerBadgeTitle = data.isSupplementary ? 'SUPPLEMENTARY EXAM RECEIPT' : 'OFFICIAL FEE RECEIPT';
        page.drawRectangle({ x: xOffset + 215, y: height - 130, width: 160, height: 26, color: headerBadgeColor });
        page.drawText(headerBadgeTitle, { x: xOffset + 222, y: height - 116, font: boldFont, size: 7.5, color: white });
        page.drawText(cleanAscii(data.receiptNumber), { x: xOffset + 222, y: height - 126, font: regularFont, size: 7, color: white });

        page.drawLine({ start: { x: leftX, y: height - 142 }, end: { x: xOffset + 375, y: height - 142 }, thickness: 0.75, color: primary });

        let y = height - 162;
        const drawField = (label: string, val: string, fx: number, fy: number) => {
            page.drawText(label, { x: fx, y: fy, font: regularFont, size: 7.5, color: gray });
            const displayVal = cleanAscii(val) || '-';
            let fontSize = 8.5;
            if (displayVal.length > 25) fontSize = 7.2;
            if (displayVal.length > 40) fontSize = 6.2;
            page.drawText(displayVal.substring(0, 65), { x: fx, y: fy - 10, font: boldFont, size: fontSize, color: black });
        };

        drawField('Student Name', data.studentName, leftX, y);
        drawField('Receipt Date', new Date(data.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), rightX, y);

        y -= 26;
        drawField('Student ID', data.studentId, leftX, y);
        const headerMode = (data.splitPaymentBreakdown && data.splitPaymentBreakdown.length > 0)
            ? 'Split (Multi-Mode)'
            : data.paymentMode;
        drawField('Payment Mode', headerMode, rightX, y);

        y -= 26;
        drawField('Class / Trade', data.className, leftX, y);
        if (data.transactionRef) {
            drawField('Transaction / Ref. No.', data.transactionRef, rightX, y);
        } else if (data.bankName) {
            drawField('Bank Name', data.bankName, rightX, y);
        } else if (data.splitPaymentBreakdown && data.splitPaymentBreakdown.length > 0) {
            const allRefs = data.splitPaymentBreakdown.filter(i => i.transactionRef).map(i => `${i.mode}: ${i.transactionRef}`).join('; ');
            drawField('Transaction / Ref. No.', allRefs || 'Multi-Mode Breakdown', rightX, y);
        } else {
            drawField('Transaction / Ref. No.', 'Counter Cash / Direct', rightX, y);
        }

        if (data.isSupplementary) {
            y -= 26;
            drawField('Back Paper / Subject', data.supplementarySubject || 'NCVT / DVET Back Paper Exam', leftX, y);
            drawField('Fees Paid Towards', 'Supplementary / Back Paper Exam Fee', rightX, y);
        } else if (data.parentName) {
            y -= 26;
            drawField("Parent's Name", data.parentName, leftX, y);
            drawField("Fees Paid Towards", data.feesFor || 'Academic Course Fee', rightX, y);
        } else {
            y -= 26;
            drawField("Fees Paid Towards", data.feesFor || 'Academic Course Fee', leftX, y);
        }

        // ─── FEE BREAKDOWN & BALANCE BREAKDOWN TABLE ─────────────────────────────
        y -= 30;
        const tableTitle = data.isSupplementary
            ? 'SUPPLEMENTARY EXAM LEDGER (INDEPENDENT CHARGE)'
            : cleanAscii(`FEE BREAKDOWN & ACCOUNT LEDGER - ${(data.feesFor || 'ACADEMIC FEE').substring(0, 32).toUpperCase()}`);
        page.drawRectangle({ x: leftX, y: y - 6, width: copyWidth - 20, height: 18, color: primary });
        page.drawText(tableTitle, { x: leftX + 10, y: y + 1, font: boldFont, size: 7.5, color: white });

        // Total Course Fee / Supplementary Notice Row
        y -= 18;
        const totalFeePaise = data.totalFee || data.amount;
        const totalPaidPaise = data.totalPaid || data.amount;
        const balanceDuePaise = data.balanceDue !== undefined ? data.balanceDue : Math.max(0, totalFeePaise - totalPaidPaise);

        page.drawRectangle({ x: leftX, y: y - 6, width: copyWidth - 20, height: 16, color: lightGray });
        if (data.isSupplementary) {
            page.drawText('Charge Type: Independent Supplementary Exam Fee (Tuition Balance Unaffected)', { x: leftX + 10, y: y - 2, font: boldFont, size: 7, color: primary });
            page.drawText(formatCurrencyForPdf(data.amount), { x: xOffset + 295, y: y - 2, font: boldFont, size: 8, color: black });
        } else {
            page.drawText(cleanAscii(`Total Agreed Course Fee (${data.feesFor?.substring(0, 28) || 'Trade Fee'}):`), { x: leftX + 10, y: y - 2, font: regularFont, size: 7.5, color: black });
            page.drawText(formatCurrencyForPdf(totalFeePaise), { x: xOffset + 295, y: y - 2, font: boldFont, size: 8, color: black });
        }

        // Amount Paid In This Receipt
        y -= 20;
        page.drawRectangle({ x: leftX, y: y - 6, width: copyWidth - 20, height: 20, color: data.isSupplementary ? gold : accent });
        page.drawText(data.isSupplementary ? 'SUPPLEMENTARY EXAM AMOUNT PAID:' : 'AMOUNT PAID IN THIS RECEIPT:', { x: leftX + 10, y: y + 1, font: boldFont, size: 8, color: white });
        page.drawText(formatCurrencyForPdf(data.amount), { x: xOffset + 290, y: y + 1, font: boldFont, size: 9.5, color: white });

        // Total Paid & Balance Due Summary
        y -= 18;
        page.drawRectangle({ x: leftX, y: y - 6, width: copyWidth - 20, height: 16, color: lightGray });
        if (data.isSupplementary) {
            page.drawText('Status:', { x: leftX + 10, y: y - 2, font: regularFont, size: 7.5, color: black });
            page.drawText('[CLEARED] Supplementary Exam Fee Cleared', { x: leftX + 50, y: y - 2, font: boldFont, size: 7.5, color: successGreen });
            page.drawText('Regular Course Dues:', { x: leftX + 205, y: y - 2, font: regularFont, size: 7.5, color: gray });
            page.drawText('Maintained Separately', { x: xOffset + 285, y: y - 2, font: boldFont, size: 7, color: primary });
        } else {
            page.drawText('Total Fee Paid Till Date:', { x: leftX + 10, y: y - 2, font: regularFont, size: 7.5, color: black });
            page.drawText(formatCurrencyForPdf(totalPaidPaise), { x: leftX + 130, y: y - 2, font: boldFont, size: 7.5, color: successGreen });

            page.drawText('Remaining Balance Due:', { x: leftX + 195, y: y - 2, font: boldFont, size: 7.5, color: black });
            page.drawText(formatCurrencyForPdf(balanceDuePaise), { x: xOffset + 295, y: y - 2, font: boldFont, size: 8, color: balanceDuePaise > 0 ? warnRed : successGreen });
        }

        // Amount in Words
        y -= 15;
        const amountInWords = cleanAscii(numberToWords(paiseToRupees(data.amount)));
        page.drawText(`Amount in Words: ${amountInWords} Rupees Only`, { x: leftX, y, font: regularFont, size: 7, color: gray });

        // Payment Mode Breakdown (Explicitly printed)
        y -= 11;
        let modeBreakdownText = '';
        if (data.splitPaymentBreakdown && data.splitPaymentBreakdown.length > 0) {
            const parts = data.splitPaymentBreakdown.map(item => {
                const label = item.mode === 'UPI' ? 'UPI/Online' : item.mode === 'BANK_TRANSFER' ? 'Bank Transfer' : item.mode === 'CASH' ? 'Cash' : item.mode === 'CHEQUE' ? 'Cheque' : item.mode;
                const ref = item.transactionRef ? ` (${cleanAscii(item.transactionRef)})` : '';
                return `${label} - ${formatCurrencyForPdf(item.amount)}${ref}`;
            });
            modeBreakdownText = `Payment Mode: ${parts.join(' | ')} | Total Paid - ${formatCurrencyForPdf(data.amount)}`;
        } else {
            const singleRef = data.transactionRef ? ` (Ref: ${cleanAscii(data.transactionRef)})` : '';
            const singleBank = data.bankName ? ` [${cleanAscii(data.bankName)}]` : '';
            modeBreakdownText = `Payment Mode: ${cleanAscii(data.paymentMode)}${singleRef}${singleBank} | Total Paid - ${formatCurrencyForPdf(data.amount)}`;
        }
        page.drawText(cleanAscii(modeBreakdownText).substring(0, 95), { x: leftX, y, font: boldFont, size: 6.8, color: primary });

        // Remarks / Notes
        y -= 10;
        const safeRemarks = cleanAscii(data.remarks) || 'Fees received with thanks.';
        page.drawText(`Remarks / Note: ${safeRemarks}`.substring(0, 95), { x: leftX, y, font: regularFont, size: 6.5, color: gray });

        // ─── 3 SIGNATURE SECTIONS (Student, Clerk, Principal) ─────────────────
        y -= 38;
        // 1. Student Signature
        page.drawLine({ start: { x: leftX, y }, end: { x: leftX + 85, y }, thickness: 0.5, color: gray });
        page.drawText("Student Signature", { x: leftX, y: y - 9, font: regularFont, size: 6.5, color: gray });

        // 2. Clerk / Cashier Signature Section
        const clerkX = leftX + 110;
        page.drawLine({ start: { x: clerkX, y }, end: { x: clerkX + 90, y }, thickness: 0.5, color: gray });
        page.drawText("Clerk / Cashier Signature", { x: clerkX, y: y - 9, font: boldFont, size: 6.5, color: black });
        page.drawText(data.clerkName ? `By: ${cleanAscii(data.clerkName)}` : 'Accounts Clerk', { x: clerkX, y: y - 16, font: regularFont, size: 6, color: gray });

        // 3. Authorized Principal Signature & Official Stamp
        const sigX = xOffset + 245;
        page.drawLine({ start: { x: sigX, y }, end: { x: sigX + 110, y }, thickness: 0.5, color: gray });
        page.drawText("Authorized Signatory & Seal", { x: sigX, y: y - 9, font: boldFont, size: 6.5, color: primary });
        page.drawText(cleanAscii(config.school.name), { x: sigX, y: y - 16, font: boldFont, size: 6, color: gray });

        if (stampImage) {
            page.drawImage(stampImage, { x: sigX + 15, y: y + 2, width: 55, height: 35 });
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

    page.drawRectangle({ x: 0, y: 0, width, height: 18, color: primary });
    page.drawText('Shri Sai Private Industrial Training Institute, Bhadrawati | Official ERP Generated Fee Receipt', {
        x: 30, y: 5.5, font: regularFont, size: 6.5, color: rgb(0.8, 0.8, 0.9),
    });
    page.drawText(`Printed: ${new Date().toLocaleString('en-IN')}`, {
        x: width - 180, y: 5.5, font: regularFont, size: 6, color: rgb(0.7, 0.7, 0.8),
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
 * Generate a professional tabular report PDF
 */
export const generateReportPdf = async (
    title: string,
    arg2: any,
    arg3: any,
    arg4?: (string | number)[][],
    arg5?: { label: string; value: string }[]
): Promise<Buffer> => {
    let subtitle = 'Official Generated Report';
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let summaryCards: { label: string; value: string }[] | undefined = arg5;

    if (Array.isArray(arg2) && Array.isArray(arg3) && arg3.length > 0 && typeof arg3[0] === 'object' && 'header' in arg3[0]) {
        // Signature: (title, dataRows, columns)
        const columns = arg3 as { header: string; key: string }[];
        headers = columns.map(c => c.header);
        rows = (arg2 as any[]).map(item => columns.map(col => item[col.key] ?? '—'));
    } else {
        // Signature: (title, subtitle, headers, rows, summaryCards)
        subtitle = typeof arg2 === 'string' ? arg2 : 'Official Generated Report';
        headers = Array.isArray(arg3) ? arg3 : [];
        rows = Array.isArray(arg4) ? arg4 : [];
        summaryCards = arg5;
    }

    const doc = await PDFDocument.create();
    const page = doc.addPage([841.89, 595.28]); // A4 Landscape
    const { width, height } = page.getSize();

    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await doc.embedFont(StandardFonts.Helvetica);

    const primary = rgb(0.07, 0.17, 0.35);
    const accent = rgb(0.02, 0.52, 0.78);
    const lightGray = rgb(0.96, 0.97, 0.98);
    const borderGray = rgb(0.85, 0.88, 0.92);
    const black = rgb(0.06, 0.09, 0.16);
    const white = rgb(1, 1, 1);
    const gray = rgb(0.4, 0.45, 0.5);

    // Header bar
    page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: primary });
    page.drawText(config.school.name, { x: 30, y: height - 32, font: boldFont, size: 16, color: white });
    page.drawText(title, { x: 30, y: height - 52, font: boldFont, size: 12, color: accent });
    page.drawText(subtitle, { x: 30, y: height - 64, font: regularFont, size: 8, color: rgb(0.8, 0.8, 0.9) });

    let currentY = height - 90;

    // Summary cards
    if (summaryCards && summaryCards.length > 0) {
        const cardWidth = Math.min(160, (width - 60 - (summaryCards.length - 1) * 15) / summaryCards.length);
        summaryCards.forEach((card, i) => {
            const cardX = 30 + i * (cardWidth + 15);
            page.drawRectangle({ x: cardX, y: currentY - 45, width: cardWidth, height: 45, color: lightGray, borderColor: borderGray, borderWidth: 1 });
            page.drawText(card.label, { x: cardX + 10, y: currentY - 18, font: regularFont, size: 8, color: gray });
            page.drawText(card.value, { x: cardX + 10, y: currentY - 36, font: boldFont, size: 13, color: primary });
        });
        currentY -= 65;
    }

    // Table
    const colWidth = (width - 60) / Math.max(1, headers.length);
    page.drawRectangle({ x: 30, y: currentY - 24, width: width - 60, height: 24, color: primary });
    headers.forEach((header, i) => {
        page.drawText(header, { x: 35 + i * colWidth, y: currentY - 16, font: boldFont, size: 8.5, color: white });
    });
    currentY -= 24;

    const maxRowsPerPage = 14;
    let renderedRows = 0;

    rows.forEach((row, rowIndex) => {
        if (renderedRows >= maxRowsPerPage) return;
        const rowColor = rowIndex % 2 === 0 ? white : lightGray;
        page.drawRectangle({ x: 30, y: currentY - 20, width: width - 60, height: 20, color: rowColor, borderColor: borderGray, borderWidth: 0.5 });
        row.forEach((cell, colIndex) => {
            const text = cleanAscii(String(cell || '-'));
            page.drawText(text.substring(0, 22), { x: 35 + colIndex * colWidth, y: currentY - 14, font: regularFont, size: 7.5, color: black });
        });
        currentY -= 20;
        renderedRows++;
    });

    // Footer
    page.drawRectangle({ x: 0, y: 0, width, height: 20, color: primary });
    page.drawText(`Generated on: ${new Date().toLocaleString('en-IN')}`, { x: 30, y: 6, font: regularFont, size: 7, color: rgb(0.8, 0.8, 0.9) });
    page.drawText(`${cleanAscii(config.school.name)} - Confidential ERP Report`, { x: width - 260, y: 6, font: regularFont, size: 7, color: rgb(0.8, 0.8, 0.9) });

    const pdfBytes = await doc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
};
