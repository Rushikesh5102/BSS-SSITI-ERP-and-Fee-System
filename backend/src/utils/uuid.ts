import { v4 as uuidv4 } from 'uuid';

/** Generate a unique receipt number with prefix */
export const generateReceiptNumber = (): string => {
    const uuid = uuidv4().replace(/-/g, '').toUpperCase().slice(0, 12);
    const year = new Date().getFullYear();
    return `SAI-${year}-${uuid}`;
};

/** Generate a unique student ID given branch prefix and sequential number */
export const generateStudentId = (sequenceNumber: number): string => {
    const year = new Date().getFullYear();
    const padded = String(sequenceNumber).padStart(3, '0');
    return `SAI-${year}-${padded}`;
};
