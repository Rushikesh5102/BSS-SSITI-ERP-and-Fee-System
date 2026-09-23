'use client';

import { useEffect, useState, Suspense } from 'react';
import Sidebar from '../../../components/Sidebar';
import { useAuth } from '../../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../../services/api';
import WelcomeOverlay from '../../../components/WelcomeOverlay';

function ReportsPageContent() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [showWelcome, setShowWelcome] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [reportType, setReportType] = useState<'ASSETS' | 'ISSUES' | 'MOVEMENT' | 'MAINTENANCE' | 'DAMAGED'>('ASSETS');

    const [items, setItems] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (user && sessionStorage.getItem('showWelcomeAnimation')) {
            setShowWelcome(true);
            sessionStorage.removeItem('showWelcomeAnimation');
        }
    }, [user]);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    const fetchReportData = async () => {
        setFetching(true);
        try {
            const [itemsRes, txRes, statsRes] = await Promise.all([
                api.get('/store/items'),
                api.get('/store/transactions?limit=500'),
                api.get('/store/dashboard-stats')
            ]);
            setItems(itemsRes.data?.data || []);
            setTransactions(txRes.data?.data || []);
            setStats(statsRes.data?.data || null);
        } catch (err) {
            console.error('Error fetching report data:', err);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (user) fetchReportData();
    }, [user]);

    const handleExportExcel = () => {
        let title = '';
        let colCount = 12;
        let tableHeader = '';
        let tableBody = '';
        let tableFooter = '';

        if (reportType === 'ASSETS') {
            title = 'Workshop Asset Catalog & Stock Balance Report';
            colCount = 12;
            tableHeader = `
                <tr>
                    <th class="th" style="text-align: center; width: 45px;">#</th>
                    <th class="th" style="text-align: left; width: 220px;">Item / Asset Name</th>
                    <th class="th" style="text-align: left; width: 140px;">Category</th>
                    <th class="th" style="text-align: right; width: 90px;">Total Qty</th>
                    <th class="th" style="text-align: right; width: 90px;">Issued</th>
                    <th class="th" style="text-align: right; width: 90px;">Balance</th>
                    <th class="th" style="text-align: center; width: 60px;">Unit</th>
                    <th class="th" style="text-align: right; width: 110px;">Unit Price (₹)</th>
                    <th class="th" style="text-align: right; width: 130px;">Total Value (₹)</th>
                    <th class="th" style="text-align: right; width: 90px;">Reorder Level</th>
                    <th class="th" style="text-align: center; width: 110px;">Status</th>
                    <th class="th" style="text-align: left; width: 160px;">Location / Notes</th>
                </tr>
            `;

            const totalQtySum = items.reduce((a, i) => a + (i.totalQuantity ?? ((i.quantity || 0) + (i.issuedQuantity || 0))), 0);
            const totalIssuedSum = items.reduce((a, i) => a + (i.issuedQuantity || 0), 0);
            const totalBalanceSum = items.reduce((a, i) => a + (i.balanceQuantity ?? (i.quantity || 0)), 0);
            const totalValSum = items.reduce((a, i) => a + ((i.totalQuantity ?? ((i.quantity || 0) + (i.issuedQuantity || 0))) * (i.pricePerUnit || 0)), 0);

            tableBody = items.map((item, idx) => {
                const totalQ = item.totalQuantity ?? ((item.quantity || 0) + (item.issuedQuantity || 0));
                const issuedQ = item.issuedQuantity ?? 0;
                const balanceQ = item.balanceQuantity ?? (item.quantity || 0);
                const unitPrice = item.pricePerUnit || 0;
                const totalVal = totalQ * unitPrice;

                return `
                    <tr>
                        <td class="td" style="text-align: center;">${idx + 1}</td>
                        <td class="td" style="font-weight: bold;">${item.name}</td>
                        <td class="td">${item.category || 'General Tools'}</td>
                        <td class="td" style="text-align: right; font-weight: bold; color: #0284c7;">${totalQ}</td>
                        <td class="td" style="text-align: right; font-weight: bold; color: #d97706;">${issuedQ}</td>
                        <td class="td" style="text-align: right; font-weight: bold; color: #16a34a;">${balanceQ}</td>
                        <td class="td" style="text-align: center;">${item.unit || 'pcs'}</td>
                        <td class="td" style="text-align: right;">₹${unitPrice.toLocaleString('en-IN')}</td>
                        <td class="td" style="text-align: right; font-weight: bold; color: #16a34a;">₹${totalVal.toLocaleString('en-IN')}</td>
                        <td class="td" style="text-align: right;">${item.reorderLevel ?? '-'}</td>
                        <td class="td" style="text-align: center; font-weight: bold;">${item.status || 'AVAILABLE'}</td>
                        <td class="td">${item.location || item.notes || '-'}</td>
                    </tr>
                `;
            }).join('');

            tableFooter = `
                <tr class="total-row">
                    <td colspan="3" class="td" style="text-align: right; font-weight: bold;">TOTAL INVENTORY:</td>
                    <td class="td" style="text-align: right; font-weight: bold; color: #0284c7;">${totalQtySum}</td>
                    <td class="td" style="text-align: right; font-weight: bold; color: #d97706;">${totalIssuedSum}</td>
                    <td class="td" style="text-align: right; font-weight: bold; color: #16a34a;">${totalBalanceSum}</td>
                    <td class="td" style="text-align: center;">units</td>
                    <td class="td"></td>
                    <td class="td" style="text-align: right; font-weight: bold; color: #16a34a; font-size: 11pt;">₹${totalValSum.toLocaleString('en-IN')}</td>
                    <td colspan="3" class="td"></td>
                </tr>
            `;
        } else if (reportType === 'ISSUES') {
            title = 'Tool & Equipment Issue / Return Audit Report';
            colCount = 8;
            const issues = transactions.filter(t => t.type === 'ISSUE');
            tableHeader = `
                <tr>
                    <th class="th" style="text-align: center; width: 45px;">#</th>
                    <th class="th" style="text-align: left; width: 220px;">Tool / Asset Name</th>
                    <th class="th" style="text-align: right; width: 80px;">Qty</th>
                    <th class="th" style="text-align: left; width: 180px;">Issued To</th>
                    <th class="th" style="text-align: center; width: 120px;">Issue Date</th>
                    <th class="th" style="text-align: center; width: 130px;">Expected Return</th>
                    <th class="th" style="text-align: center; width: 110px;">Status</th>
                    <th class="th" style="text-align: left; width: 180px;">Remarks</th>
                </tr>
            `;
            const totalIssuedQty = issues.reduce((a, i) => a + (i.quantity || 0), 0);
            tableBody = issues.map((i, idx) => `
                <tr>
                    <td class="td" style="text-align: center;">${idx + 1}</td>
                    <td class="td" style="font-weight: bold;">${i.item?.name || 'Asset'}</td>
                    <td class="td" style="text-align: right; font-weight: bold; color: #d97706;">${i.quantity}</td>
                    <td class="td">${i.recipientType === 'STUDENT' ? `Student: ${i.student?.name || i.student?.studentId || '-'}` : `Staff: ${i.staffName || '-'}`}</td>
                    <td class="td" style="text-align: center;">${new Date(i.issuedDate || i.createdAt).toLocaleDateString('en-IN')}</td>
                    <td class="td" style="text-align: center;">${i.expectedReturnDate ? new Date(i.expectedReturnDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                    <td class="td" style="text-align: center; font-weight: bold;">${i.status || 'ISSUED'}</td>
                    <td class="td">${i.remarks || '-'}</td>
                </tr>
            `).join('');

            tableFooter = `
                <tr class="total-row">
                    <td colspan="2" class="td" style="text-align: right; font-weight: bold;">TOTAL ISSUED UNITS:</td>
                    <td class="td" style="text-align: right; font-weight: bold; color: #d97706;">${totalIssuedQty}</td>
                    <td colspan="5" class="td"></td>
                </tr>
            `;
        } else if (reportType === 'MOVEMENT') {
            title = 'Store Stock Movement & Transaction History Log';
            colCount = 6;
            tableHeader = `
                <tr>
                    <th class="th" style="text-align: center; width: 140px;">Date & Time</th>
                    <th class="th" style="text-align: center; width: 110px;">Action Type</th>
                    <th class="th" style="text-align: left; width: 220px;">Tool / Asset</th>
                    <th class="th" style="text-align: right; width: 80px;">Qty</th>
                    <th class="th" style="text-align: left; width: 180px;">Person Involved</th>
                    <th class="th" style="text-align: left; width: 200px;">Remarks</th>
                </tr>
            `;
            tableBody = transactions.map((t) => `
                <tr>
                    <td class="td" style="text-align: center;">${new Date(t.createdAt).toLocaleString('en-IN')}</td>
                    <td class="td" style="text-align: center; font-weight: bold;">${t.type}</td>
                    <td class="td" style="font-weight: bold;">${t.item?.name || 'Asset'}</td>
                    <td class="td" style="text-align: right; font-weight: bold;">${t.quantity}</td>
                    <td class="td">${t.recipientType === 'STUDENT' ? (t.student?.name || 'Student') : (t.staffName || '-')}</td>
                    <td class="td">${t.remarks || '-'}</td>
                </tr>
            `).join('');

            tableFooter = `
                <tr class="total-row">
                    <td colspan="3" class="td" style="text-align: right; font-weight: bold;">TOTAL TRANSACTIONS:</td>
                    <td class="td" style="text-align: right; font-weight: bold;">${transactions.length}</td>
                    <td colspan="2" class="td"></td>
                </tr>
            `;
        } else if (reportType === 'MAINTENANCE') {
            title = 'Workshop Equipment Maintenance & Repair Log';
            colCount = 5;
            const maint = items.filter(i => i.status === 'UNDER_MAINTENANCE');
            tableHeader = `
                <tr>
                    <th class="th" style="text-align: center; width: 45px;">#</th>
                    <th class="th" style="text-align: left; width: 220px;">Tool / Equipment</th>
                    <th class="th" style="text-align: right; width: 80px;">Qty</th>
                    <th class="th" style="text-align: center; width: 140px;">Status</th>
                    <th class="th" style="text-align: left; width: 260px;">Maintenance Notes / Reason</th>
                </tr>
            `;
            tableBody = maint.map((item, idx) => `
                <tr>
                    <td class="td" style="text-align: center;">${idx + 1}</td>
                    <td class="td" style="font-weight: bold;">${item.name}</td>
                    <td class="td" style="text-align: right; font-weight: bold;">${item.quantity} ${item.unit || ''}</td>
                    <td class="td" style="text-align: center; font-weight: bold; color: #8b5cf6;">${item.status}</td>
                    <td class="td">${item.notes || '-'}</td>
                </tr>
            `).join('');
        } else if (reportType === 'DAMAGED') {
            title = 'Damaged & Lost Workshop Assets Report';
            colCount = 6;
            const dam = items.filter(i => i.status === 'DAMAGED' || i.status === 'LOST');
            tableHeader = `
                <tr>
                    <th class="th" style="text-align: center; width: 45px;">#</th>
                    <th class="th" style="text-align: left; width: 220px;">Asset Name</th>
                    <th class="th" style="text-align: right; width: 80px;">Qty</th>
                    <th class="th" style="text-align: center; width: 120px;">Status</th>
                    <th class="th" style="text-align: right; width: 120px;">Estimated Unit Price (₹)</th>
                    <th class="th" style="text-align: left; width: 240px;">Incident Notes</th>
                </tr>
            `;
            tableBody = dam.map((d, idx) => `
                <tr>
                    <td class="td" style="text-align: center;">${idx + 1}</td>
                    <td class="td" style="font-weight: bold;">${d.name}</td>
                    <td class="td" style="text-align: right; font-weight: bold;">${d.quantity} ${d.unit || ''}</td>
                    <td class="td" style="text-align: center; font-weight: bold; color: #ef4444;">${d.status}</td>
                    <td class="td" style="text-align: right;">₹${(d.pricePerUnit || 0).toLocaleString('en-IN')}</td>
                    <td class="td">${d.notes || '-'}</td>
                </tr>
            `).join('');
        }

        const excelHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8"/>
                <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${reportType}_Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
                <style>
                    body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; }
                    .header-title { font-size: 15pt; font-weight: bold; color: #0284c7; }
                    .header-sub { font-size: 10pt; color: #475569; font-weight: bold; }
                    .th { background: #0284c7; color: #ffffff; font-weight: bold; padding: 8px 10px; border: 1px solid #0369a1; font-size: 10pt; }
                    .td { padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 9.5pt; color: #0f172a; }
                    .total-row { background: #f0f9ff; font-weight: bold; border-top: 2px solid #0284c7; }
                </style>
            </head>
            <body>
                <table>
                    <tr><td colspan="${colCount}" class="header-title">BHARAT SHIKSHAN SANSTHA'S SHRI SAI PRIVATE ITI</td></tr>
                    <tr><td colspan="${colCount}" class="header-sub">${title} | Generated: ${new Date().toLocaleString('en-IN')}</td></tr>
                    <tr><td colspan="${colCount}"></td></tr>
                    <thead>
                        ${tableHeader}
                    </thead>
                    <tbody>
                        ${tableBody}
                    </tbody>
                    ${tableFooter ? `<tfoot>${tableFooter}</tfoot>` : ''}
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Sai_ITI_Store_${reportType}_Report_${new Date().toISOString().split('T')[0]}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading || !user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        );
    }

    return (
        <div className="layout">
            {showWelcome && <WelcomeOverlay role={user.role} />}
            <Sidebar />

            <div className="main-content">
                {/* Header */}
                <div className="page-header" style={{
                    background: 'var(--surface-card)',
                    borderBottom: '1px solid var(--border)',
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 16
                }}>
                    <div>
                        <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Official Institute Audits & Exports
                        </span>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '4px 0 0', color: 'var(--text-primary)' }}>
                            📄 Store PDF & Excel Reports
                        </h1>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => window.print()} className="btn btn-secondary" style={{ fontSize: 13, gap: 6 }}>
                            🖨️ Print / Save PDF (A4)
                        </button>
                        <button onClick={handleExportExcel} className="btn btn-primary" style={{ fontSize: 13, gap: 6 }}>
                            📊 Export Excel (.xls)
                        </button>
                    </div>
                </div>

                <div className="page-content" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    
                    {/* Report selector pills */}
                    <div className="card no-print" style={{ padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                            { id: 'ASSETS', label: '📋 Asset Catalog & Balance Report' },
                            { id: 'ISSUES', label: '📤 Tool Issues & Returns' },
                            { id: 'MOVEMENT', label: '🔄 Movement History Log' },
                            { id: 'MAINTENANCE', label: '🔧 Maintenance Log' },
                            { id: 'DAMAGED', label: '⚠️ Damaged & Lost Items' },
                        ].map(r => (
                            <button
                                key={r.id}
                                onClick={() => setReportType(r.id as any)}
                                className={`btn ${reportType === r.id ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ fontSize: 12, padding: '7px 14px' }}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>

                    {/* Printable PDF & Screen container */}
                    <div id="printable-report" className="card printable-report" style={{ padding: 28, background: '#ffffff', color: '#0f172a', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                        {/* Header logo & title */}
                        <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 14, marginBottom: 20, textAlign: 'center' }}>
                            <img src="/sai_iti_logo.png" alt="Shri Sai ITI Logo" style={{ height: 60, objectFit: 'contain', margin: '0 auto 8px', display: 'block' }} />
                            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '0.5px' }}>
                                SHRI SAI PRIVATE INDUSTRIAL TRAINING INSTITUTE (ITI)
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#334155', fontWeight: 700 }}>
                                Workshop Asset & Tool Management System • {reportType} REPORT
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                                Generated on: {new Date().toLocaleString('en-IN')}
                            </p>
                        </div>

                        {fetching ? (
                            <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
                                <div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }} />
                                <p style={{ marginTop: 8 }}>Compiling Report Data...</p>
                            </div>
                        ) : (
                            <>
                                {reportType === 'ASSETS' && (
                                    <div style={{ width: '100%', overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                            <thead>
                                                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                                                    <th style={{ padding: '8px 6px', textAlign: 'center', width: 35 }}>#</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Item / Asset Name</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Category</th>
                                                    <th style={{ padding: '8px 6px', textAlign: 'right', color: '#0284c7' }}>Total Qty</th>
                                                    <th style={{ padding: '8px 6px', textAlign: 'right', color: '#d97706' }}>Issued</th>
                                                    <th style={{ padding: '8px 6px', textAlign: 'right', color: '#16a34a' }}>Balance</th>
                                                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>Unit</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'right' }}>Unit Price</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'right' }}>Total Value</th>
                                                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Reorder</th>
                                                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item, idx) => {
                                                    const totalQ = item.totalQuantity ?? ((item.quantity || 0) + (item.issuedQuantity || 0));
                                                    const issuedQ = item.issuedQuantity ?? 0;
                                                    const balanceQ = item.balanceQuantity ?? (item.quantity || 0);
                                                    const unitPrice = item.pricePerUnit || 0;
                                                    const totalVal = totalQ * unitPrice;

                                                    return (
                                                        <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                            <td style={{ padding: '6px 4px', textAlign: 'center' }}>{idx + 1}</td>
                                                            <td style={{ padding: '6px 8px', fontWeight: 700 }}>{item.name}</td>
                                                            <td style={{ padding: '6px 8px', color: '#475569' }}>{item.category || 'Tools'}</td>
                                                            <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>{totalQ}</td>
                                                            <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 700, color: '#d97706' }}>{issuedQ}</td>
                                                            <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>{balanceQ}</td>
                                                            <td style={{ padding: '6px 6px', textAlign: 'center', color: '#64748b' }}>{item.unit || 'pcs'}</td>
                                                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>₹{unitPrice.toLocaleString('en-IN')}</td>
                                                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>₹{totalVal.toLocaleString('en-IN')}</td>
                                                            <td style={{ padding: '6px 6px', textAlign: 'right' }}>{item.reorderLevel ?? '-'}</td>
                                                            <td style={{ padding: '6px 6px', textAlign: 'center', fontWeight: 700, fontSize: 10 }}>{item.status || 'AVAILABLE'}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr style={{ background: '#f8fafc', fontWeight: 800, borderTop: '2px solid #0f172a' }}>
                                                    <td colSpan={3} style={{ padding: '10px 8px', textAlign: 'right' }}>TOTAL INVENTORY:</td>
                                                    <td style={{ padding: '10px 6px', textAlign: 'right', color: '#0284c7' }}>
                                                        {items.reduce((a, i) => a + (i.totalQuantity ?? ((i.quantity || 0) + (i.issuedQuantity || 0))), 0)}
                                                    </td>
                                                    <td style={{ padding: '10px 6px', textAlign: 'right', color: '#d97706' }}>
                                                        {items.reduce((a, i) => a + (i.issuedQuantity || 0), 0)}
                                                    </td>
                                                    <td style={{ padding: '10px 6px', textAlign: 'right', color: '#16a34a' }}>
                                                        {items.reduce((a, i) => a + (i.balanceQuantity ?? (i.quantity || 0)), 0)}
                                                    </td>
                                                    <td style={{ padding: '10px 6px', textAlign: 'center' }}>units</td>
                                                    <td style={{ padding: '10px 8px' }}></td>
                                                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#16a34a', fontSize: 12 }}>
                                                        ₹{items.reduce((a, i) => a + ((i.totalQuantity ?? ((i.quantity || 0) + (i.issuedQuantity || 0))) * (i.pricePerUnit || 0)), 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td colSpan={2}></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}

                                {reportType === 'ISSUES' && (
                                    <div style={{ width: '100%', overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                            <thead>
                                                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                                                    <th style={{ padding: '8px 6px', textAlign: 'center', width: 35 }}>#</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Tool / Asset Name</th>
                                                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Qty</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Issued To</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'center' }}>Issue Date</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'center' }}>Expected Return</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'center' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.filter(t => t.type === 'ISSUE').map((issue, idx) => (
                                                    <tr key={issue.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                        <td style={{ padding: '6px 4px', textAlign: 'center' }}>{idx + 1}</td>
                                                        <td style={{ padding: '6px 8px', fontWeight: 700 }}>{issue.item?.name}</td>
                                                        <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 700, color: '#d97706' }}>{issue.quantity}</td>
                                                        <td style={{ padding: '6px 8px' }}>
                                                            {issue.recipientType === 'STUDENT' ? `Student: ${issue.student?.name || '-'}` : `Staff: ${issue.staffName || '-'}`}
                                                        </td>
                                                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{new Date(issue.issuedDate || issue.createdAt).toLocaleDateString('en-IN')}</td>
                                                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{issue.expectedReturnDate ? new Date(issue.expectedReturnDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                                                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>{issue.status}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {reportType === 'MOVEMENT' && (
                                    <div style={{ width: '100%', overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                            <thead>
                                                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                                                    <th style={{ padding: '8px 8px', textAlign: 'center' }}>Date & Time</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'center' }}>Action</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Tool / Asset</th>
                                                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Qty</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Person</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.map((log) => (
                                                    <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                        <td style={{ padding: '6px 8px', textAlign: 'center', fontSize: 10 }}>{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                                                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>{log.type}</td>
                                                        <td style={{ padding: '6px 8px', fontWeight: 700 }}>{log.item?.name}</td>
                                                        <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 700 }}>{log.quantity}</td>
                                                        <td style={{ padding: '6px 8px' }}>{log.recipientType === 'STUDENT' ? log.student?.name : log.staffName || '-'}</td>
                                                        <td style={{ padding: '6px 8px' }}>{log.remarks || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {reportType === 'MAINTENANCE' && (
                                    <div style={{ width: '100%', overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                            <thead>
                                                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                                                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Tool Name</th>
                                                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Qty</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'center' }}>Status</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.filter(i => i.status === 'UNDER_MAINTENANCE').map((item) => (
                                                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                        <td style={{ padding: '6px 8px', fontWeight: 700 }}>{item.name}</td>
                                                        <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 700 }}>{item.quantity} {item.unit}</td>
                                                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: '#8b5cf6' }}>{item.status}</td>
                                                        <td style={{ padding: '6px 8px' }}>{item.notes || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {reportType === 'DAMAGED' && (
                                    <div style={{ width: '100%', overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                            <thead>
                                                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                                                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Tool Name</th>
                                                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Qty</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'center' }}>Status</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.filter(i => i.status === 'DAMAGED' || i.status === 'LOST').map((item) => (
                                                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                        <td style={{ padding: '6px 8px', fontWeight: 700 }}>{item.name}</td>
                                                        <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 700 }}>{item.quantity} {item.unit}</td>
                                                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: '#ef4444' }}>{item.status}</td>
                                                        <td style={{ padding: '6px 8px' }}>{item.notes || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ReportsPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        }>
            <ReportsPageContent />
        </Suspense>
    );
}
