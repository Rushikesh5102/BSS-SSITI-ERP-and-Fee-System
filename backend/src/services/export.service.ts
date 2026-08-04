import ExcelJS from 'exceljs';
import { Parser } from 'json2csv';
import { paiseToRupees, formatCurrency } from '../utils/currency';

/** Generic report row type */
export type ReportRow = Record<string, string | number | Date | null | undefined>;

/**
 * Generate an Excel (.xlsx) buffer from report data
 */
export const generateExcel = async (
    title: string,
    rows: ReportRow[],
    columns: { header: string; key: string; width?: number }[]
): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sai ITI Fee Management';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(title, {
        pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // Title row
    sheet.mergeCells(1, 1, 1, columns.length);
    const titleRow = sheet.getCell(1, 1);
    titleRow.value = title;
    titleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3A7C' } };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 32;

    // Sub-title with date
    sheet.mergeCells(2, 1, 2, columns.length);
    const dateRow = sheet.getCell(2, 1);
    dateRow.value = `Generated on: ${new Date().toLocaleString('en-IN')}`;
    dateRow.font = { italic: true, size: 10, color: { argb: 'FF666666' } };
    dateRow.alignment = { horizontal: 'center' };

    // Column headers
    sheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key,
        width: col.width || 20,
    }));
    const headerRow = sheet.getRow(3);
    columns.forEach((col, idx) => {
        headerRow.getCell(idx + 1).value = col.header;
    });
    headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2196F3' } };
        cell.border = {
            bottom: { style: 'thin', color: { argb: 'FF1565C0' } },
        };
        cell.alignment = { horizontal: 'center' };
    });

    // Data rows (starting at row 4 due to title + date + header)
    rows.forEach((row, idx) => {
        const dataRow = sheet.addRow(row);
        if (idx % 2 === 0) {
            dataRow.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
            });
        }
        dataRow.eachCell((cell) => {
            cell.border = { bottom: { style: 'hair', color: { argb: 'FFE0E0E0' } } };
        });
    });

    // Auto-fit columns according to size of data
    sheet.columns.forEach((col) => {
        if (!col) return;
        let maxLen = 0;
        if (col.header) {
            maxLen = col.header.toString().length;
        }
        sheet.getColumn(col.key!).eachCell((cell, rowNumber) => {
            if (rowNumber < 3) return; // Skip title and date row to avoid huge column stretch
            const val = cell.value ? cell.value.toString() : '';
            if (val.length > maxLen) {
                maxLen = val.length;
            }
        });
        col.width = Math.max(maxLen + 4, 12);
    });

    // Calculate sum totals of financial columns
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

    // Create Summary Row
    const totalRowData: Record<string, any> = {};
    columns.forEach((col, idx) => {
        if (idx === 0) {
            totalRowData[col.key] = 'TOTAL';
        } else if (sums[col.key] !== undefined) {
            totalRowData[col.key] = sums[col.key];
        } else {
            totalRowData[col.key] = '';
        }
    });

    const totalRow = sheet.addRow(totalRowData);
    totalRow.font = { bold: true };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
};

/**
 * Generate a CSV string from report data
 */
export const generateCSV = (
    rows: ReportRow[],
    fields: { label: string; value: string }[]
): string => {
    const parser = new Parser({ fields });
    return parser.parse(rows as any);
};

/**
 * Transform payment rows for reporting
 */
export const formatPaymentRows = (
    payments: Array<{
        id: string;
        createdAt: Date;
        amount: number;
        mode: string;
        status: string;
        transactionRef: string | null;
        studentFee: {
            student: { name: string; studentId: string; class: string };
        };
        recordedBy: { name: string };
    }>
): ReportRow[] =>
    payments.map((p, idx) => ({
        'Sr.': idx + 1,
        'Receipt/Payment ID': p.id.slice(0, 8).toUpperCase(),
        Date: new Date(p.createdAt).toLocaleDateString('en-IN'),
        'Student Name': p.studentFee.student.name,
        'Student ID': p.studentFee.student.studentId,
        Class: p.studentFee.student.class,
        'Amount (₹)': paiseToRupees(p.amount),
        'Payment Mode': p.mode,
        Status: p.status,
        'Transaction Ref': p.transactionRef || '—',
        'Recorded By': p.recordedBy.name,
    }));
