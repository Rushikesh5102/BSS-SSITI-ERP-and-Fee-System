import { prisma } from './prisma';

// Pads serial sequence numbers into standard 2-digit format (e.g. 1 -> "01", 12 -> "12")
export const generateReceiptNumber = (count: number): string => {
    return String(count).padStart(2, '0');
};

// Scans existing receipts in the DB and calculates the lowest unused sequential number.
// Using a Set lookup prevents race-condition collisions (Prisma P2002) when older receipts
// get deleted or when receipts were imported with legacy prefixes.
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
        // Fallback to basic record count if the bulk fetch fails for any reason
        const count = await prisma.receipt.count().catch(() => 0);
        return String(count + 1).padStart(2, '0');
    }
};

// Formats standardized student registration IDs: SSITI-{AdmissionYear}-{TradeInitial}{PaddedRoll}
// Example: SSITI-2026-E01 (Electrician, Roll 1, 2026)
export const generateStudentId = (tradeName: string = 'Electrician', rollOrSeq: string | number = 1, yearInput?: number): string => {
    const year = yearInput || new Date().getFullYear();
    const tradeInitial = (tradeName.trim().charAt(0) || 'E').toUpperCase();
    const num = typeof rollOrSeq === 'number' ? rollOrSeq : parseInt(String(rollOrSeq)) || 1;
    const paddedNum = String(num).padStart(2, '0');
    return `SSITI-${year}-${tradeInitial}${paddedNum}`;
};
