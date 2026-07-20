'use client';

import { useEffect, useState, Suspense } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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

const WelcomeOverlay = ({ role }: { role: string }) => {
    const roleConfig: Record<string, { title: string, icon: string, bg: string }> = {
        SUPERADMIN: { title: 'College Director', icon: '🏛️', bg: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0284c7 100%)' },
        ADMIN: { title: 'Administrator', icon: '⚡', bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f172a 100%)' },
        ACCOUNTANT: { title: 'Accountant', icon: '🧾', bg: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f172a 100%)' },
        TEACHER: { title: 'Teacher', icon: '👨‍🏫', bg: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #0f172a 100%)' },
        STUDENT: { title: 'Student', icon: '🎓', bg: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #0f172a 100%)' },
        DEVELOPER: { title: 'System Architect', icon: '💻', bg: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #0284c7 100%)' },
    };

    const cfg = roleConfig[role] || { title: role, icon: '👋', bg: 'linear-gradient(135deg, #0284c7, #0f172a)' };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
            background: cfg.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'white', padding: '24px 16px', textAlign: 'center',
            animation: 'fadeOut 0.8s ease 2.2s forwards'
        }}>
            <style>{`
                @keyframes fadeOut { to { opacity: 0; pointer-events: none; visibility: hidden; } }
                @keyframes zoomInGlow { 0% { transform: scale(0.8); opacity: 0; filter: drop-shadow(0 0 0px #38bdf8); } 50% { transform: scale(1.05); filter: drop-shadow(0 0 25px #38bdf8); } 100% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 15px #38bdf8); } }
                @keyframes loadBar { 0% { width: 0%; } 100% { width: 100%; } }
            `}</style>
            <div style={{
                width: '90px', height: '90px', borderRadius: '24px', background: '#ffffff',
                padding: '12px', boxShadow: '0 0 40px rgba(56, 189, 248, 0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'zoomInGlow 1.2s ease forwards', marginBottom: '16px'
            }}>
                <img src="/sai_iti_logo.png" alt="Shri Sai I.T.I Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>

            <div style={{ fontSize: 'clamp(32px, 8vw, 54px)', margin: 0, animation: 'zoomInGlow 1.2s ease forwards' }}>{cfg.icon}</div>
            
            <h1 style={{
                fontSize: 'clamp(24px, 6.5vw, 44px)',
                fontWeight: 900,
                margin: '16px 0 0 0',
                textAlign: 'center',
                maxWidth: '90vw',
                letterSpacing: '0.5px',
                color: '#ffffff',
                textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                animation: 'zoomInGlow 1s ease forwards'
            }}>
                Welcome, {cfg.title}!
            </h1>
            <p style={{
                fontSize: 'clamp(13px, 3.5vw, 17px)',
                color: 'rgba(255,255,255,0.85)',
                marginTop: 8,
                textAlign: 'center',
                maxWidth: '90vw',
            }}>
                Initializing Shri Sai I.T.I Central Access Portal...
            </p>

            <div style={{
                width: '200px', height: '4px', background: 'rgba(255,255,255,0.2)',
                borderRadius: '4px', overflow: 'hidden', marginTop: '24px'
            }}>
                <div style={{
                    height: '100%', background: '#38bdf8',
                    borderRadius: '4px', boxShadow: '0 0 10px #38bdf8',
                    animation: 'loadBar 2s ease-in-out forwards'
                }} />
            </div>
        </div>
    );
};

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
        if (effectiveRole === 'DEVELOPER') {
            router.push('/system');
        }

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

    if (loading || !user || effectiveRole === 'DEVELOPER') {
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
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-title">📈 Monthly Collection Trend</div>
                                    <span className="badge badge-info">Last 6 Months</span>
                                </div>
                                <div className="card-body" style={{ height: 260 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={(v) => `₹${v}k`} />
                                            <Tooltip
                                                formatter={(v) => [`₹${v}k`, 'Collection']}
                                                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 13 }}
                                            />
                                            <Bar dataKey="amount" fill="#1a3a7c" radius={[4, 4, 0, 0]} />
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
                                        ] : []),
                                        ...(effectiveRole === 'SUPERADMIN' || effectiveRole === 'ADMIN' ? [
                                            { label: '📋 Assign Fee Structure', href: '/fee-structures', color: '#7c3aed' },
                                        ] : []),
                                        ...(effectiveRole === 'SUPERADMIN' || effectiveRole === 'ADMIN' || effectiveRole === 'ACCOUNTANT' ? [
                                            { label: '📊 Download Report', href: '/reports', color: '#d97706' },
                                        ] : []),
                                        { label: '💳 Record Payment', href: '/payments', color: 'var(--accent)' },
                                        { label: '🧾 View Receipts', href: '/receipts', color: '#2563eb' },
                                    ].map((action) => (
                                        <Link
                                            key={action.href}
                                            href={action.href}
                                            className="btn btn-secondary"
                                            style={{ justifyContent: 'flex-start', borderLeft: `3px solid ${action.color}`, fontWeight: 500 }}
                                        >
                                            {action.label}
                                        </Link>
                                    ))}
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
