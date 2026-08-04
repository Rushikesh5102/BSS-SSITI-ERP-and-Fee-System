import { v4 as uuidv4 } from 'uuid';

/** Generate a unique receipt number based on sequential count */
export const generateReceiptNumber = (count: number): string => {
    return String(count).padStart(2, '0');
};

/** Generate a unique student ID in SSITI-YEAR-E01 format */
export const generateStudentId = (tradeName: string = 'Electrician', rollOrSeq: string | number = 1, yearInput?: number): string => {
    const year = yearInput || new Date().getFullYear();
    const tradeInitial = (tradeName.trim().charAt(0) || 'E').toUpperCase();
    const num = typeof rollOrSeq === 'number' ? rollOrSeq : parseInt(String(rollOrSeq)) || 1;
    const paddedNum = String(num).padStart(2, '0');
    return `SSITI-${year}-${tradeInitial}${paddedNum}`;
};
