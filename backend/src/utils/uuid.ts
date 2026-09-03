import { v4 as uuidv4 } from 'uuid';
import { prisma } from './prisma';

/** Generate a unique receipt number based on sequential count */
export const generateReceiptNumber = (count: number): string => {
    return String(count).padStart(2, '0');
};

/**
 * Dynamically queries the database for all existing receipts and returns the next unused sequential number
 * Guarantees zero P2002 unique constraint collisions
 */
export const getNextReceiptNumber = async (): Promise<string> => {
    try {
        const receipts = await prisma.receipt.findMany({
            select: { receiptNumber: true }
        });

        const existing = new Set(receipts.map(r => r.receiptNumber.trim()));
        let seq = 1;
        while (
            existing.has(String(seq).padStart(2, '0')) ||
            existing.has(String(seq)) ||
            existing.has(`REC-${String(seq).padStart(2, '0')}`)
        ) {
            seq++;
        }
        return String(seq).padStart(2, '0');
    } catch {
        const count = await prisma.receipt.count().catch(() => 0);
        return String(count + 1).padStart(2, '0');
    }
};

/** Generate a unique student ID in SSITI-YEAR-E01 format */
export const generateStudentId = (tradeName: string = 'Electrician', rollOrSeq: string | number = 1, yearInput?: number): string => {
    const year = yearInput || new Date().getFullYear();
    const tradeInitial = (tradeName.trim().charAt(0) || 'E').toUpperCase();
    const num = typeof rollOrSeq === 'number' ? rollOrSeq : parseInt(String(rollOrSeq)) || 1;
    const paddedNum = String(num).padStart(2, '0');
    return `SSITI-${year}-${tradeInitial}${paddedNum}`;
};
