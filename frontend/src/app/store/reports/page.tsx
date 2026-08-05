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
    const simulateParam = searchParams.get('simulate');

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

    const downloadCSV = (filename: string, rows: string[][]) => {
        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => {
            const val = (cell || '').toString().split('"').join('""');
            return '"' + val + '"';
        }).join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', filename + '_' + new Date().toISOString().split('T')[0] + '.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportExcel = () => {
        if (reportType === 'ASSETS') {
            const headers = ['Name', 'SKU', 'Category', 'Quantity', 'Unit', 'Reorder Level', 'Location', 'Status', 'Notes'];
            const rows = items.map(i => [i.name, i.sku || '', i.category, i.quantity.toString(), i.unit, i.reorderLevel.toString(), i.location || '', i.status, i.notes || '']);
            downloadCSV('Sai_ITI_Asset_Catalog_Report', [headers, ...rows]);
        } else if (reportType === 'ISSUES') {
            const issues = transactions.filter(t => t.type === 'ISSUE');
            const headers = ['Tool Name', 'Quantity', 'Issued To Type', 'Recipient Name', 'Issue Date', 'Expected Return Date', 'Status', 'Remarks'];
            const rows = issues.map(i => [
                i.item?.name || '',
                i.quantity.toString(),
                i.recipientType || '',
                i.recipientType === 'STUDENT' ? i.student?.name : i.staffName || '',
                new Date(i.issuedDate || i.createdAt).toLocaleDateString(),
                i.expectedReturnDate ? new Date(i.expectedReturnDate).toLocaleDateString() : '',
                i.status || '',
                i.remarks || ''
            ]);
            downloadCSV('Sai_ITI_Tool_Issues_Report', [headers, ...rows]);
        } else if (reportType === 'MOVEMENT') {
            const headers = ['Date & Time', 'Action Type', 'Tool / Asset', 'Quantity', 'Person Involved', 'Remarks'];
            const rows = transactions.map(t => [
                new Date(t.createdAt).toLocaleString(),
                t.type,
                t.item?.name || '',
                t.quantity.toString(),
                t.recipientType === 'STUDENT' ? t.student?.name : t.staffName || '',
                t.remarks || ''
            ]);
            downloadCSV('Sai_ITI_Movement_History_Report', [headers, ...rows]);
        } else if (reportType === 'MAINTENANCE') {
            const maint = transactions.filter(t => t.type === 'MAINTENANCE');
            const headers = ['Date', 'Tool Name', 'Action', 'Quantity', 'Remarks'];
            const rows = maint.map(m => [
                new Date(m.createdAt).toLocaleDateString(),
                m.item?.name || '',
                m.status || '',
                m.quantity.toString(),
                m.remarks || ''
            ]);
            downloadCSV('Sai_ITI_Maintenance_Report', [headers, ...rows]);
        } else if (reportType === 'DAMAGED') {
            const dam = items.filter(i => i.status === 'DAMAGED' || i.status === 'LOST');
            const headers = ['Asset Name', 'Category', 'Rack Location', 'Status', 'Notes'];
            const rows = dam.map(d => [d.name, d.category, d.location || '', d.status, d.notes || '']);
            downloadCSV('Sai_ITI_Damaged_Lost_Report', [headers, ...rows]);
        }
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

            <div className="main-content" style={{ paddingBottom: '40px' }}>
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
                            📄 PDF & Excel Reports Center
                        </h1>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => window.print()} className="btn btn-secondary" style={{ fontSize: 13 }}>
                            🖨️ Print / Save PDF
                        </button>
                        <button onClick={handleExportExcel} className="btn btn-primary" style={{ fontSize: 13 }}>
                            📊 Export Excel (CSV)
                        </button>
                    </div>
                </div>

                <div className="page-content" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    
                    {/* Report selector pills */}
                    <div className="card no-print" style={{ padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                            { id: 'ASSETS', label: '📋 Asset Catalog Report' },
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

                    {/* Printable PDF container */}
                    <div id="printable-report" className="card" style={{ padding: 32, background: '#ffffff', color: '#0f172a', borderRadius: 12 }}>
                        {/* Header logo & title */}
                        <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 24, textAlign: 'center' }}>
                            <img src="/sai_iti_logo.png" alt="Shri Sai ITI Logo" style={{ height: 64, objectFit: 'contain', margin: '0 auto 8px', display: 'block' }} />
                            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#0f172a' }}>
                                SHRI SAI PRIVATE INDUSTRIAL TRAINING INSTITUTE (ITI)
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569', fontWeight: 600 }}>
                                Workshop Asset & Tool Management System • {reportType} REPORT
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                                Generated on: {new Date().toLocaleString()}
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
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>#</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Item Name</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Category</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Quantity</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Unit Price (₹)</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Total Asset Value (₹)</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Reorder Level</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Rack Location</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, idx) => {
                                                const unitPrice = item.pricePerUnit || 0;
                                                const totalVal = (item.quantity || 0) * unitPrice;
                                                return (
                                                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                        <td style={{ padding: '8px' }}>{idx + 1}</td>
                                                        <td style={{ padding: '8px', fontWeight: 700 }}>{item.name}</td>
                                                        <td style={{ padding: '8px' }}>{item.category}</td>
                                                        <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700 }}>{item.quantity} {item.unit}</td>
                                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>₹{unitPrice.toLocaleString('en-IN')}</td>
                                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>₹{totalVal.toLocaleString('en-IN')}</td>
                                                        <td style={{ padding: '8px', textAlign: 'center' }}>{item.reorderLevel} {item.unit}</td>
                                                        <td style={{ padding: '8px' }}>{item.location || 'N/A'}</td>
                                                        <td style={{ padding: '8px', fontWeight: 700 }}>{item.status}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr style={{ background: '#f8fafc', fontWeight: 800, borderTop: '2px solid #0f172a' }}>
                                                <td colSpan={3} style={{ padding: '10px 8px', textAlign: 'right' }}>Total Inventory Valuation:</td>
                                                <td style={{ padding: '10px 8px', textAlign: 'center' }}>{items.reduce((a, i) => a + (i.quantity || 0), 0)} pcs</td>
                                                <td style={{ padding: '10px 8px' }}></td>
                                                <td style={{ padding: '10px 8px', textAlign: 'right', color: '#16a34a', fontSize: 13 }}>
                                                    ₹{items.reduce((a, i) => a + ((i.quantity || 0) * (i.pricePerUnit || 0)), 0).toLocaleString('en-IN')}
                                                </td>
                                                <td colSpan={3}></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                )}

                                {reportType === 'ISSUES' && (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>#</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Tool Name</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Qty</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Issued To</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Issue Date</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Expected Return</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.filter(t => t.type === 'ISSUE').map((issue, idx) => (
                                                <tr key={issue.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '8px' }}>{idx + 1}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{issue.item?.name}</td>
                                                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700 }}>{issue.quantity}</td>
                                                    <td style={{ padding: '8px' }}>
                                                        {issue.recipientType === 'STUDENT' ? `Student: ${issue.student?.name}` : `Staff: ${issue.staffName}`}
                                                    </td>
                                                    <td style={{ padding: '8px' }}>{new Date(issue.issuedDate || issue.createdAt).toLocaleDateString()}</td>
                                                    <td style={{ padding: '8px' }}>{issue.expectedReturnDate ? new Date(issue.expectedReturnDate).toLocaleDateString() : 'N/A'}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{issue.status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {reportType === 'MOVEMENT' && (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Date & Time</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Action Type</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Tool Name</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Qty</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Person</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((log) => (
                                                <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '8px', fontSize: 11 }}>{new Date(log.createdAt).toLocaleString()}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{log.type}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{log.item?.name}</td>
                                                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700 }}>{log.quantity}</td>
                                                    <td style={{ padding: '8px' }}>{log.recipientType === 'STUDENT' ? log.student?.name : log.staffName || '-'}</td>
                                                    <td style={{ padding: '8px' }}>{log.remarks || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {reportType === 'MAINTENANCE' && (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Tool Name</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Category</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Rack Location</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Status</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.filter(i => i.status === 'UNDER_MAINTENANCE').map((item) => (
                                                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{item.name}</td>
                                                    <td style={{ padding: '8px' }}>{item.category}</td>
                                                    <td style={{ padding: '8px' }}>{item.location || 'Workshop'}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700, color: '#8b5cf6' }}>{item.status}</td>
                                                    <td style={{ padding: '8px' }}>{item.notes || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {reportType === 'DAMAGED' && (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Tool Name</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Category</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Rack Location</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Status</th>
                                                <th style={{ padding: '10px 8px', textAlign: 'left' }}>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.filter(i => i.status === 'DAMAGED' || i.status === 'LOST').map((item) => (
                                                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '8px', fontWeight: 700 }}>{item.name}</td>
                                                    <td style={{ padding: '8px' }}>{item.category}</td>
                                                    <td style={{ padding: '8px' }}>{item.location || 'N/A'}</td>
                                                    <td style={{ padding: '8px', fontWeight: 700, color: '#ef4444' }}>{item.status}</td>
                                                    <td style={{ padding: '8px' }}>{item.notes || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
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
