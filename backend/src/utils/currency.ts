/**
 * Currency utilities
 * All monetary values are stored in paise (smallest INR unit)
 * 1 Rupee = 100 Paise
 */

/** Convert rupees to paise for storage */
export const rupeesToPaise = (rupees: number): number => Math.round(rupees * 100);

/** Convert paise to rupees for display */
export const paiseToRupees = (paise: number): number => paise / 100;

/** Format paise to Indian Rupee string: ₹1,23,456.00 */
export const formatCurrency = (paise: number): string => {
    const rupees = paiseToRupees(paise);
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(rupees);
};

/** Format paise to Indian Rupee string with 'Rs.' prefix for PDF engines */
export const formatCurrencyForPdf = (paise: number): string => {
    const rupees = paiseToRupees(paise);
    const formatted = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
    }).format(rupees);
    return `Rs. ${formatted}`;
};

/** Get pending balance in paise */
export const getPendingBalance = (totalAmount: number, paidAmount: number): number =>
    totalAmount - paidAmount;
