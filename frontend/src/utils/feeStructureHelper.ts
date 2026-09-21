export interface FeeComponentSummary {
    key: 'tuition' | 'dress' | 'exam' | 'other' | 'supplementary';
    name: string;
    icon: string;
    assigned: number; // in Rupees
    paid: number;     // in Rupees
    balance: number;  // in Rupees
    status: 'PAID' | 'PARTIAL' | 'UNPAID';
}

export interface StudentPaymentStructure {
    components: FeeComponentSummary[];
    totalAssigned: number; // in Rupees
    totalPaid: number;     // in Rupees
    totalBalance: number;  // in Rupees
    overallStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
}

/**
 * Calculates itemized fee breakdown, payments, and balances for a student
 */
export function calculateStudentFeeStructure(student: any): StudentPaymentStructure {
    if (!student) {
        return {
            components: [],
            totalAssigned: 0,
            totalPaid: 0,
            totalBalance: 0,
            overallStatus: 'UNPAID'
        };
    }

    const edu = student.educationDetails || {};
    const primaryStudentFee = (student.studentFees && student.studentFees.length > 0) ? student.studentFees[0] : null;

    // Component Assigned Amounts (default to standard ITI amounts if not customized)
    const dressAssigned = parseFloat(edu.dressMaterialFee) || 2500;
    const examAssigned = parseFloat(edu.examFee) || 1300;
    const otherAssigned = parseFloat(edu.otherFee) || 2000;
    const otherLabel = edu.otherFeeLabel || 'Tools / Workshop Charges';

    // Total Assigned from studentFee or calculated sum
    let totalAssigned = primaryStudentFee?.totalAmount ? primaryStudentFee.totalAmount / 100 : 0;
    let tuitionAssigned = parseFloat(edu.tuitionFee) || 0;

    if (totalAssigned > 0 && !tuitionAssigned) {
        tuitionAssigned = Math.max(0, totalAssigned - (dressAssigned + examAssigned + otherAssigned));
    } else if (tuitionAssigned > 0 && (!totalAssigned || totalAssigned === 0)) {
        totalAssigned = tuitionAssigned + dressAssigned + examAssigned + otherAssigned;
    } else if (!tuitionAssigned && !totalAssigned) {
        tuitionAssigned = 45000;
        totalAssigned = tuitionAssigned + dressAssigned + examAssigned + otherAssigned;
    }

    // Collect all payments
    const payments: any[] = (student.studentFees || []).flatMap((sf: any) => sf.payments || []);

    let dressPaid = 0;
    let examPaid = 0;
    let otherPaid = 0;
    let suppPaid = 0;
    let tuitionPaid = 0;

    payments.forEach(p => {
        if (p.status === 'REFUNDED') return;
        const pAmtRupees = (p.amount || 0) / 100;

        // 1. Check structured feeBreakdown
        if (Array.isArray(p.feeBreakdown) && p.feeBreakdown.length > 0) {
            p.feeBreakdown.forEach((fb: any) => {
                const fbAmt = (fb.amount || 0) / 100;
                const fbName = (fb.name || '').toLowerCase();
                if (fbName.includes('dress') || fbName.includes('uniform') || fbName.includes('material')) {
                    dressPaid += fbAmt;
                } else if (fbName.includes('supp')) {
                    suppPaid += fbAmt;
                } else if (fbName.includes('exam')) {
                    examPaid += fbAmt;
                } else if (fbName.includes('tool') || fbName.includes('other') || fbName.includes('due') || fbName.includes('charge')) {
                    otherPaid += fbAmt;
                } else {
                    tuitionPaid += fbAmt;
                }
            });
        } else {
            // 2. Fallback to parsing remarks
            const rem = (p.remarks || '').toLowerCase();
            if (rem.includes('dress') || rem.includes('uniform') || rem.includes('material')) {
                if (rem.includes('tution') || rem.includes('tuition')) {
                    const dressTarget = Math.max(0, dressAssigned - dressPaid);
                    const dressAmt = Math.min(dressTarget > 0 ? dressTarget : 2500, pAmtRupees);
                    dressPaid += dressAmt;
                    const remTuition = Math.max(0, pAmtRupees - dressAmt);
                    tuitionPaid += remTuition;
                } else {
                    dressPaid += pAmtRupees;
                }
            } else if (rem.includes('supp')) {
                suppPaid += pAmtRupees;
            } else if (rem.includes('exam')) {
                examPaid += pAmtRupees;
            } else if (rem.includes('tool') || rem.includes('other') || rem.includes('due') || rem.includes('charge')) {
                otherPaid += pAmtRupees;
            } else {
                tuitionPaid += pAmtRupees;
            }
        }
    });

    const getStatus = (assigned: number, paid: number): 'PAID' | 'PARTIAL' | 'UNPAID' => {
        if (paid >= assigned && assigned > 0) return 'PAID';
        if (paid > 0) return 'PARTIAL';
        return 'UNPAID';
    };

    const components: FeeComponentSummary[] = [
        {
            key: 'tuition',
            name: 'Tuition Fees',
            icon: '🎓',
            assigned: tuitionAssigned,
            paid: tuitionPaid,
            balance: Math.max(0, tuitionAssigned - tuitionPaid),
            status: getStatus(tuitionAssigned, tuitionPaid)
        },
        {
            key: 'dress',
            name: 'Dress Material & Uniform',
            icon: '🥼',
            assigned: dressAssigned,
            paid: dressPaid,
            balance: Math.max(0, dressAssigned - dressPaid),
            status: getStatus(dressAssigned, dressPaid)
        },
        {
            key: 'exam',
            name: 'Regular Examination Fees',
            icon: '📝',
            assigned: examAssigned,
            paid: examPaid,
            balance: Math.max(0, examAssigned - examPaid),
            status: getStatus(examAssigned, examPaid)
        },
        {
            key: 'other',
            name: otherLabel,
            icon: '🛠️',
            assigned: otherAssigned,
            paid: otherPaid,
            balance: Math.max(0, otherAssigned - otherPaid),
            status: getStatus(otherAssigned, otherPaid)
        }
    ];

    if (suppPaid > 0) {
        components.push({
            key: 'supplementary',
            name: 'Supplementary Exam (Independent)',
            icon: '🛡️',
            assigned: suppPaid,
            paid: suppPaid,
            balance: 0,
            status: 'PAID'
        });
    }

    const totalPaid = tuitionPaid + dressPaid + examPaid + otherPaid + suppPaid;
    const totalBalance = Math.max(0, totalAssigned - (tuitionPaid + dressPaid + examPaid + otherPaid));

    return {
        components,
        totalAssigned,
        totalPaid,
        totalBalance,
        overallStatus: getStatus(totalAssigned, totalPaid)
    };
}

/**
 * Returns a clean readable summary of what a specific payment was allocated to
 */
export function formatPaymentAllocation(payment: any): string {
    if (!payment) return 'Fee Payment';

    if (Array.isArray(payment.feeBreakdown) && payment.feeBreakdown.length > 0) {
        return payment.feeBreakdown
            .map((fb: any) => {
                let icon = '💳';
                const n = (fb.name || '').toLowerCase();
                if (n.includes('dress') || n.includes('uniform') || n.includes('material')) icon = '🥼';
                else if (n.includes('tuition')) icon = '🎓';
                else if (n.includes('exam')) icon = '📝';
                else if (n.includes('supp')) icon = '🛡️';
                else if (n.includes('tool') || n.includes('other')) icon = '🛠️';

                const amt = (fb.amount || 0) / 100;
                return `${icon} ${fb.name}: ₹${amt.toLocaleString('en-IN')}`;
            })
            .join(' | ');
    }

    if (payment.remarks && payment.remarks.trim()) {
        return payment.remarks;
    }

    return 'Course Fee Payment';
}
