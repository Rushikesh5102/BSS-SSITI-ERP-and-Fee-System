'use client';

import { useEffect, useState, Suspense } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import WelcomeOverlay from '../../components/WelcomeOverlay';

interface DashboardStats {
    totalStudents: number;
    todayCollection: { amount: number; count: number };
    monthCollection: { amount: number; count: number };
    totalPendingBalance: number;
}

const formatRupees = (paise: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);

const StatCard = ({
    icon, label, value, sub, color,
}: {
    icon: string; label: string; value: string; sub?: string; color: string;
}) => (
    <div className="stat-card">
        <div className="stat-icon" style={{ background: `${color}18` }}>
            <span style={{ fontSize: 24 }}>{icon}</span>
        </div>
        <div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
            {sub && <div className="stat-change up">{sub}</div>}
        </div>
    </div>
);

// WelcomeOverlay is imported from components/WelcomeOverlay

function DashboardContent() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const simulateRole = searchParams.get('simulate');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentPayments, setRecentPayments] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [studentData, setStudentData] = useState<any>(null);
    const [welcomeRole, setWelcomeRole] = useState<string | null>(null);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [inquiryForm, setInquiryForm] = useState({ name: '', class: 'Electrician', email: '', phone: '', parentName: '' });
    const [savingInquiry, setSavingInquiry] = useState(false);

    const handleInquirySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inquiryForm.name || !inquiryForm.class || !inquiryForm.phone) {
            alert('❌ Name, Class/Trade, and Contact Phone are required!');
            return;
        }
        setSavingInquiry(true);
        try {
            await api.post('/inquiries', {
                name: inquiryForm.name,
                class: inquiryForm.class,
                email: inquiryForm.email || undefined,
                phone: inquiryForm.phone,
                parentName: inquiryForm.parentName || undefined
            });
            alert('✅ Inquiry logged successfully in pipeline!');
            setShowInquiryModal(false);
            setInquiryForm({ name: '', class: 'Electrician', email: '', phone: '', parentName: '' });
        } catch (err: any) {
            alert(`❌ Failed to log inquiry: ${err.response?.data?.message || 'Server error'}`);
        } finally {
            setSavingInquiry(false);
        }
    };

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (user && sessionStorage.getItem('showWelcomeAnimation')) {
            setWelcomeRole(user.role);
            sessionStorage.removeItem('showWelcomeAnimation');
            setTimeout(() => setWelcomeRole(null), 2700);
        }
    }, [user]);

    const effectiveRole = simulateRole && user?.role === 'DEVELOPER' ? simulateRole.toUpperCase() : user?.role;

    const [storageStats, setStorageStats] = useState<any>(null);

    useEffect(() => {
        if (!user) return;

        const isStudentView = effectiveRole === 'STUDENT';

        if (isStudentView) {
            let searchQuery = '';
            if (user.role === 'STUDENT') {
                searchQuery = `search=${user.email.split('@')[0].toUpperCase()}`;
            } else {
                searchQuery = `limit=1`; // Dev simulation fetches the very first student available
            }
            api.get(`/students?${searchQuery}`).then(({ data }) => {
                if (data.data && data.data.length > 0) {
                    setStudentData(data.data[0]);
                }
            }).catch(() => { });
        } else {
            api.get('/reports/dashboard').then(({ data }) => {
                setStats(data.data);
                if (data.data.chartData) {
                    setChartData(data.data.chartData);
                }
            }).catch(() => { });
            api.get('/payments?limit=5').then(({ data }) => setRecentPayments(data.data || [])).catch(() => { });
            api.get('/reports/storage-stats').then(({ data }) => setStorageStats(data.data)).catch(() => { });
        }
    }, [user, effectiveRole, router]);

    if (loading || !user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        );
    }

    const WelcomeRender = welcomeRole ? <WelcomeOverlay role={welcomeRole} /> : null;
    const isStudentView = effectiveRole === 'STUDENT';

    if (isStudentView) {
        const totalFee = studentData?.studentFees?.reduce((a: number, f: any) => a + f.totalAmount, 0) || 0;
        const paidFee = studentData?.studentFees?.reduce((a: number, f: any) => a + f.paidAmount, 0) || 0;
        const pending = totalFee - paidFee;

        const loadRazorpayScript = () => {
            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => resolve(true);
                script.onerror = () => resolve(false);
                document.body.appendChild(script);
            });
        };

        // Secure Online Checkout Handler
        const handlePayOnline = async () => {
            if (pending <= 0) return alert('No pending dues to pay!');

            // Acquire the primary fee record id representing this un-paid sequence
            const targetFeeRecord = studentData?.studentFees?.find((sf: any) => sf.totalAmount - sf.paidAmount > 0);
            if (!targetFeeRecord) return alert('Cannot resolve fee structure target.');

            const btn = document.getElementById('bridge-pay-btn');
            if (btn) btn.innerText = "Connecting Secure Gateway...";

            try {
                // Load Razorpay script
                const rzpLoaded = await loadRazorpayScript();
                if (!rzpLoaded) {
                    alert('Razorpay SDK failed to load. Are you offline?');
                    if (btn) btn.innerText = "Pay Online 💳";
                    return;
                }

                // Create order on backend
                const { data: orderRes } = await api.post('/payments/razorpay/order', {
                    studentFeeId: targetFeeRecord.id,
                    amount: pending
                });

                if (!orderRes.success || !orderRes.data) {
                    throw new Error('Failed to create payment order');
                }

                const order = orderRes.data;

                const options = {
                    key: order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY || 'rzp_test_TEUu7W94JCplrN',
                    amount: order.amount,
                    currency: order.currency,
                    name: 'Shri Sai I.T.I',
                    description: `Online Fee Payment - ${studentData.name}`,
                    order_id: order.id,
                    handler: async function (response: any) {
                        if (btn) btn.innerText = "Verifying Payment...";
                        try {
                            const { data: verifyRes } = await api.post('/payments/razorpay/verify', {
                                razorpayOrderId: response.razorpay_order_id || order.id,
                                razorpayPaymentId: response.razorpay_payment_id || 'pay_mock_' + Math.random().toString(36).substring(2, 12),
                                razorpaySignature: response.razorpay_signature || 'mock_signature',
                                studentFeeId: targetFeeRecord.id,
                                amount: order.amount
                            });

                            if (verifyRes.success) {
                                alert(`✅ Payment Successful!\nReceipt Number: ${verifyRes.data.receipt.receiptNumber}`);
                                window.location.reload();
                            } else {
                                alert('❌ Payment verification failed. Please contact support.');
                            }
                        } catch (err: any) {
                            alert(`❌ Verification Error: ${err.response?.data?.message || err.message}`);
                        } finally {
                            if (btn) btn.innerText = "Pay Online 💳";
                        }
                    },
                    prefill: {
                        name: studentData.name,
                        email: studentData.parent?.email || 'student@saiiti.edu.in',
                        contact: studentData.parent?.phone || ''
                    },
                    theme: {
                        color: '#1A3A7C'
                    },
                    modal: {
                        ondismiss: function() {
                            if (btn) btn.innerText = "Pay Online 💳";
                        }
                    }
                };

                if (order.id.startsWith('order_mock_')) {
                    if (btn) btn.innerText = "Opening Sandbox Gateway...";
                    setTimeout(async () => {
                        const confirmPay = window.confirm(`[SANDBOX GATEWAY] Pay ₹${(pending / 100).toLocaleString('en-IN')} via simulated payment gateway?`);
                        if (confirmPay) {
                            await (options.handler as any)({
                                razorpay_order_id: order.id,
                                razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substring(2, 12),
                                razorpay_signature: 'mock_signature'
                            });
                        } else {
                            if (btn) btn.innerText = "Pay Online 💳";
                        }
                    }, 500);
                } else {
                    const rzp = new (window as any).Razorpay(options);
                    rzp.open();
                }

            } catch (err: any) {
                alert(`Connection to the payment gateway failed: ${err.response?.data?.message || err.message}`);
                if (btn) btn.innerText = "Pay Online 💳";
            }
        };

        return (
            <>
                {WelcomeRender}
                <div className="layout">
                    <Sidebar />
                    <div className="main-content">
                        <header className="header">
                            <div>
                                <div className="header-subtitle">{simulateRole ? 'SIMULATOR: STUDENT PORTAL' : 'Student Portal'}</div>
                                <div className="header-title">Welcome, {simulateRole ? studentData?.name || 'Simulation' : user.name} 🎓</div>
                            </div>
                        </header>
                        <div className="page-content">
                            {!studentData ? (
                                <div className="text-center text-muted">Loading your academic profile...</div>
                            ) : (
                                <div className="grid grid-2" style={{ gap: 24 }}>
                                    {/* Profile Card */}
                                    <div className="card">
                                        <div className="card-header"><div className="card-title">📖 My Profile</div></div>
                                        <div className="card-body">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                                                    <span className="text-muted">Student ID</span>
                                                    <b>{studentData.studentId}</b>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                                                    <span className="text-muted">Class / Trade</span>
                                                    <b>{studentData.class} {studentData.section && `(${studentData.section})`}</b>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span className="text-muted">Roll Number</span>
                                                    <b>{studentData.rollNumber || '—'}</b>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fee Summary Card */}
                                    <div className="card">
                                        <div className="card-header"><div className="card-title">💰 Fee Status</div></div>
                                        <div className="card-body text-center">
                                            <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Payable</div>
                                            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>{formatRupees(totalFee)}</div>

                                            <div className="grid grid-2" style={{ gap: 12 }}>
                                                <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8, color: 'var(--accent)' }}>
                                                    <div style={{ fontSize: 12 }}>Paid Amount</div>
                                                    <div style={{ fontSize: 18, fontWeight: 700 }}>{formatRupees(paidFee)}</div>
                                                </div>
                                                <div style={{ background: pending > 0 ? 'var(--surface-2)' : 'var(--surface)', padding: 12, borderRadius: 8, color: pending > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                                    <div style={{ fontSize: 12 }}>Pending Due</div>
                                                    <div style={{ fontSize: 18, fontWeight: 700 }}>{formatRupees(pending)}</div>
                                                </div>
                                            </div>

                                            {pending > 0 && (
                                                <div style={{ marginTop: 24 }}>
                                                    <button
                                                        id="bridge-pay-btn"
                                                        onClick={handlePayOnline}
                                                        className="btn btn-primary w-full"
                                                        style={{
                                                            background: '#1e3a8a',
                                                            border: 'none',
                                                            padding: 16,
                                                            fontSize: 16,
                                                            fontWeight: 700,
                                                            boxShadow: '0 8px 16px rgba(30, 58, 138, 0.2)',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s',
                                                        }}
                                                    >
                                                        Pay Online 💳
                                                    </button>
                                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>Payments securely processed via SSL. Receipts generated instantly.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Paid Receipts Card */}
                                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                                        <div className="card-header"><div className="card-title">🧾 My Paid Receipts</div></div>
                                        <div className="card-body">
                                            {studentData.studentFees?.flatMap((sf: any) => sf.payments || []).filter((p: any) => p.receipt).length === 0 ? (
                                                <div className="text-muted text-center" style={{ padding: 16 }}>No paid receipts generated yet.</div>
                                            ) : (
                                                <div className="table-wrap" style={{ border: 'none' }}>
                                                    <table className="table">
                                                        <thead>
                                                            <tr>
                                                                <th>Receipt No</th>
                                                                <th>Payment Mode</th>
                                                                <th>Amount Paid</th>
                                                                <th>Date</th>
                                                                <th>Official PDF</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {studentData.studentFees.flatMap((sf: any) => sf.payments || []).filter((p: any) => p.receipt).map((p: any) => (
                                                                <tr key={p.id}>
                                                                    <td><span className="badge badge-primary">{p.receipt.receiptNumber}</span></td>
                                                                    <td><span className="badge badge-info">{p.mode}</span></td>
                                                                    <td><b>{formatRupees(p.amount)}</b></td>
                                                                    <td>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                                                                    <td>
                                                                        <a
                                                                            href={`${typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? 'https://bss-ssiti-erp-and-fee-system.onrender.com' : 'http://localhost:4000'}${p.receipt.pdfUrl}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="btn btn-accent btn-sm"
                                                                        >
                                                                            📄 Download PDF
                                                                        </a>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Support Contact Card */}
                                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                                        <div className="card-header"><div className="card-title">📞 Need Help?</div></div>
                                        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>If you have any questions regarding your fee structure, payments, or need a receipt re-issued, please contact the administration office.</p>
                                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                                    <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 8 }}>
                                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Phone</div>
                                                        <b style={{ color: 'var(--text-primary)' }}>+91 9529054868</b>
                                                    </div>
                                                    <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 8 }}>
                                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Email</div>
                                                        <b style={{ color: 'var(--text-primary)' }}>saiiti151@gmail.com</b>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '4rem', opacity: 0.8 }}>🏢</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <footer className="footer">
                            <div>&copy; {new Date().getFullYear()} Shri Sai I.T.I All rights reserved. | <Link href="/terms" style={{ marginLeft: 8 }}>Terms and Conditions</Link></div>
                            <div>Developed by Rushikesh Pattiwar</div>
                        </footer>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {WelcomeRender}
            <div className="layout">
                <Sidebar />
                <div className="main-content">
                    {/* Header */}
                    <header className="header">
                        <div>
                            <div className="header-subtitle">
                                {simulateRole ? `SIMULATING: ${effectiveRole} DASHBOARD` : 'Dashboard'}
                            </div>
                            <div className="header-title">
                                Welcome back, {user.name}
                            </div>
                        </div>
                        <div className="header-actions">
                            <span className={`badge ${effectiveRole === 'SUPERADMIN' ? 'badge-primary' : effectiveRole === 'ADMIN' ? 'badge-info' : 'badge-success'}`}>
                                {effectiveRole}
                            </span>
                        </div>
                    </header>

                    <div className="page-content">
                        {/* Storage Alert (90% Warning Threshold) */}
                        {storageStats && storageStats.totalUsedPercent >= 80 && (
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.18) 100%)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: '12px',
                                padding: '14px 18px',
                                marginBottom: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: 12,
                                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 24 }}>🚨</span>
                                    <div>
                                        <div style={{ fontWeight: 800, color: 'var(--danger)', fontSize: 14 }}>
                                            CRITICAL STORAGE WARNING: System Storage Reached {storageStats.totalUsedPercent}% Capacity!
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2 }}>
                                            PostgreSQL & file storage usage has crossed 90% threshold ({storageStats.dbUsedMb} MB / {storageStats.dbLimitMb} MB limit). Please purge old audit logs immediately.
                                        </div>
                                    </div>
                                </div>
                                <a href="/system" className="btn" style={{ background: 'var(--danger)', color: '#ffffff', fontSize: 12, padding: '6px 14px', border: 'none' }}>
                                    ⚙️ Manage System Storage
                                </a>
                            </div>
                        )}

                        {/* Stat Cards */}
                        <div className="grid grid-4 mb-6">
                            <StatCard
                                icon="👨‍🎓" label="Total Students" color="#1a3a7c"
                                value={stats ? stats.totalStudents.toString() : '—'}
                            />
                            <StatCard
                                icon="💰" label="Today's Collection" color="#00966d"
                                value={stats ? formatRupees(stats.todayCollection.amount) : '—'}
                                sub={stats ? `${stats.todayCollection.count} payments` : undefined}
                            />
                            <StatCard
                                icon="📅" label="Month Collection" color="#2563eb"
                                value={stats ? formatRupees(stats.monthCollection.amount) : '—'}
                                sub={stats ? `${stats.monthCollection.count} payments` : undefined}
                            />
                            <StatCard
                                icon="⏳" label="Total Pending" color="#d97706"
                                value={stats ? formatRupees(stats.totalPendingBalance) : '—'}
                            />
                        </div>

                        {/* Chart + Recent Payments */}
                        <div className="grid-2 mb-6">
                            {/* Collection Chart */}
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div className="card-header">
                                    <div className="card-title">📈 Monthly Collection Trend</div>
                                    <span className="badge badge-info">Last 6 Months</span>
                                </div>
                                <div className="card-body" style={{ flex: 1, minHeight: 330, padding: '16px 12px 12px 12px', display: 'flex', flexDirection: 'column' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 12, right: 16, left: -4, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.95} />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)', fontWeight: 600 }} />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                                                tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                                            />
                                            <Tooltip
                                                formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Collection']}
                                                contentStyle={{
                                                    borderRadius: 10,
                                                    border: '1px solid var(--border)',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                                    fontSize: 13,
                                                    background: 'var(--surface-card)',
                                                    color: 'var(--text-primary)'
                                                }}
                                            />
                                            <Bar dataKey="amount" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-title">⚡ Quick Actions</div>
                                </div>
                                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {[
                                        ...(effectiveRole === 'SUPERADMIN' || effectiveRole === 'ADMIN' || effectiveRole === 'ACCOUNTANT' ? [
                                            { label: '➕ Add Student', href: '/students?action=new', color: 'var(--primary)' },
                                            { label: '📋 Log Student Inquiry', onClick: () => setShowInquiryModal(true), color: '#10b981' },
                                        ] : []),
                                        ...(effectiveRole === 'SUPERADMIN' || effectiveRole === 'ADMIN' ? [
                                            { label: '📋 Assign Fee Structure', href: '/fee-structures', color: '#7c3aed' },
                                        ] : []),
                                        ...(effectiveRole === 'SUPERADMIN' || effectiveRole === 'ADMIN' || effectiveRole === 'ACCOUNTANT' ? [
                                            { label: '📊 Download Report', href: '/reports', color: '#d97706' },
                                        ] : []),
                                        { label: '💳 Record Payment', href: '/payments', color: 'var(--accent)' },
                                        { label: '🧾 View Receipts', href: '/receipts', color: '#2563eb' },
                                    ].map((action: any) => {
                                        if (action.onClick) {
                                            return (
                                                <button
                                                    key={action.label}
                                                    onClick={action.onClick}
                                                    className="btn btn-secondary w-full"
                                                    style={{ justifyContent: 'flex-start', borderLeft: `3px solid ${action.color}`, fontWeight: 500, display: 'flex', alignItems: 'center' }}
                                                >
                                                    {action.label}
                                                </button>
                                            );
                                        }
                                        return (
                                            <Link
                                                key={action.href}
                                                href={action.href}
                                                className="btn btn-secondary"
                                                style={{ justifyContent: 'flex-start', borderLeft: `3px solid ${action.color}`, fontWeight: 500 }}
                                            >
                                                {action.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Recent Payments Table */}
                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">🕐 Recent Payments</div>
                                <a href="/payments" className="btn btn-secondary btn-sm">View All →</a>
                            </div>
                            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Class</th>
                                            <th>Amount</th>
                                            <th>Mode</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentPayments.length === 0 ? (
                                            <tr><td colSpan={6} className="text-center text-muted" style={{ padding: 32 }}>No payments yet</td></tr>
                                        ) : (
                                            recentPayments.map((p: any) => (
                                                <tr key={p.id}>
                                                    <td><b>{p.studentFee?.student?.name}</b><br /><span className="text-sm text-muted">{p.studentFee?.student?.studentId}</span></td>
                                                    <td>{p.studentFee?.student?.class}</td>
                                                    <td><b>{formatRupees(p.amount)}</b></td>
                                                    <td>{p.mode}</td>
                                                    <td>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                                                    <td><span className={`badge ${p.status === 'VERIFIED' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span></td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* System Storage & Quota Visual Card */}
                        {storageStats && (
                            <div className="card mb-6">
                                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="card-title">⚡ Supabase Database & System Storage Quota</div>
                                    <span className="badge badge-info">{storageStats.totalUsedPercent}% Used</span>
                                </div>
                                <div className="card-body">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                                        <span><b>Real Live PostgreSQL Usage:</b> {storageStats.dbUsedMb} MB / {storageStats.dbLimitMb} MB</span>
                                        <span className="text-muted">Supabase Free Tier (500 MB)</span>
                                    </div>
                                    <div style={{ width: '100%', height: 12, background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.max(2, storageStats.totalUsedPercent)}%`,
                                            height: '100%',
                                            background: storageStats.totalUsedPercent > 80 ? 'var(--danger)' : 'var(--primary)',
                                            transition: 'width 0.4s ease',
                                        }} />
                                    </div>
                                    {storageStats.totalUsedPercent > 80 && (
                                        <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>
                                            ⚠️ Warning: System storage has reached {storageStats.totalUsedPercent}%. Contact Developer to purge old audit logs.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Log Student Inquiry Modal */}
                    {showInquiryModal && (
                        <div className="modal-overlay">
                            <div className="modal" style={{ maxWidth: 500 }}>
                                <div className="modal-header">
                                    <div className="modal-title">📋 Log New Student Inquiry</div>
                                    <button className="btn-close" style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => setShowInquiryModal(false)}>✕</button>
                                </div>
                                <form onSubmit={handleInquirySubmit}>
                                    <div className="modal-body">
                                        <div className="form-group mb-3">
                                            <label className="form-label">Student Full Name <span className="required">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. Ramesh Kumar"
                                                value={inquiryForm.name}
                                                onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="form-group mb-3">
                                            <label className="form-label">Class / Trade Interest <span className="required">*</span></label>
                                            <select
                                                className="form-control"
                                                value={inquiryForm.class}
                                                onChange={(e) => setInquiryForm({ ...inquiryForm, class: e.target.value })}
                                                required
                                            >
                                                <option value="Electrician">Electrician</option>
                                                <option value="Fitter">Fitter</option>
                                                <option value="COPA">COPA (Computer Operator)</option>
                                                <option value="Welder">Welder</option>
                                                <option value="Mechanic Motor Vehicle">Mechanic Motor Vehicle</option>
                                                <option value="Other">Other / Miscellaneous</option>
                                            </select>
                                        </div>

                                        <div className="form-group mb-3">
                                            <label className="form-label">Contact Phone Number <span className="required">*</span></label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                placeholder="e.g. 9876543210"
                                                value={inquiryForm.phone}
                                                onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="form-group mb-3">
                                            <label className="form-label">Email Address (Optional)</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                placeholder="e.g. ramesh@gmail.com"
                                                value={inquiryForm.email}
                                                onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                                            />
                                        </div>

                                        <div className="form-group mb-3">
                                            <label className="form-label">Parent / Guardian Name (Optional)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. Suresh Kumar"
                                                value={inquiryForm.parentName}
                                                onChange={(e) => setInquiryForm({ ...inquiryForm, parentName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowInquiryModal(false)} disabled={savingInquiry}>Cancel</button>
                                        <button type="submit" className="btn btn-primary" disabled={savingInquiry}>
                                            {savingInquiry ? 'Logging...' : '💾 Log Inquiry'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <footer className="footer">
                        <div>&copy; {new Date().getFullYear()} Shri Sai I.T.I All rights reserved. | <Link href="/terms" style={{ marginLeft: 8 }}>Terms and Conditions</Link></div>
                        <div>Developed by Rushikesh Pattiwar</div>
                    </footer>
                </div>
            </div>
        </>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="layout-loading"><div className="spinner" /></div>}>
            <DashboardContent />
        </Suspense>
    );
}
