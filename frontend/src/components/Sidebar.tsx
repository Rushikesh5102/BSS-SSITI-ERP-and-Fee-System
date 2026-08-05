'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface NavItem {
    href: string;
    label: string;
    icon: string;
    roles?: string[];
    module: 'FEES' | 'STORE' | 'COMMON';
}

const navItems: NavItem[] = [
    { href: '/portal', label: 'Portal Hub', icon: '🏛️', roles: ['ADMIN', 'DEVELOPER'], module: 'COMMON' },
    { href: '/system', label: 'Dev Home', icon: '💻', roles: ['DEVELOPER'], module: 'COMMON' },

    // FEES WORKSPACE & FEES DEVELOPER SIMULATIONS
    { href: '/dashboard?simulate=admin', label: 'View as Admin', icon: '🏛️', roles: ['DEVELOPER'], module: 'FEES' },
    { href: '/dashboard?simulate=accountant', label: 'View as Accountant', icon: '🧾', roles: ['DEVELOPER'], module: 'FEES' },
    { href: '/dashboard?simulate=teacher', label: 'View as Teacher', icon: '👨‍🏫', roles: ['DEVELOPER'], module: 'FEES' },
    { href: '/dashboard?simulate=student', label: 'View as Student', icon: '🕶️', roles: ['DEVELOPER'], module: 'FEES' },

    { href: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'ACCOUNTANT', 'TEACHER', 'STUDENT'], module: 'FEES' },
    { href: '/students', label: 'Students', icon: '👨‍🎓', roles: ['ADMIN', 'ACCOUNTANT', 'TEACHER', 'DEVELOPER'], module: 'FEES' },
    { href: '/fee-structures', label: 'Fee Structures', icon: '📋', roles: ['ADMIN', 'DEVELOPER'], module: 'FEES' },
    { href: '/payments', label: 'Record Payment', icon: '💳', roles: ['ADMIN', 'ACCOUNTANT', 'DEVELOPER'], module: 'FEES' },
    { href: '/receipts', label: 'Receipts', icon: '🧾', roles: ['ADMIN', 'ACCOUNTANT', 'TEACHER', 'DEVELOPER'], module: 'FEES' },
    { href: '/reports', label: 'Reports', icon: '📈', roles: ['ADMIN', 'ACCOUNTANT', 'DEVELOPER'], module: 'FEES' },
    { href: '/access', label: 'Access Control', icon: '🔑', roles: ['ADMIN', 'DEVELOPER'], module: 'FEES' },

    // STORE WORKSPACE & STORE DEVELOPER SIMULATIONS
    { href: '/store/items?simulate=admin', label: 'View as Admin', icon: '🏛️', roles: ['DEVELOPER'], module: 'STORE' },
    { href: '/store/items?simulate=store_manager', label: 'View as Store Mgr', icon: '📦', roles: ['DEVELOPER'], module: 'STORE' },
    { href: '/store/items?simulate=teacher', label: 'View as Teacher', icon: '👨‍🏫', roles: ['DEVELOPER'], module: 'STORE' },

    { href: '/store/items', label: 'Workshop Asset Register', icon: '📋', roles: ['ADMIN', 'DEVELOPER', 'STORE_MANAGER', 'TEACHER', 'ACCOUNTANT'], module: 'STORE' },
    { href: '/store', label: 'Tool Issue & Movement', icon: '🛠️', roles: ['ADMIN', 'DEVELOPER', 'STORE_MANAGER', 'TEACHER', 'ACCOUNTANT'], module: 'STORE' },
    { href: '/store/history', label: 'Movement History Log', icon: '🔄', roles: ['ADMIN', 'DEVELOPER', 'STORE_MANAGER', 'TEACHER', 'ACCOUNTANT'], module: 'STORE' },
    { href: '/store/reports', label: 'PDF & Excel Reports', icon: '📄', roles: ['ADMIN', 'DEVELOPER', 'STORE_MANAGER', 'TEACHER', 'ACCOUNTANT'], module: 'STORE' },
];

const roleLabels: Record<string, string> = {
    ADMIN: 'Administrator / Principal',
    ACCOUNTANT: 'Accountant',
    TEACHER: 'Teacher',
    STUDENT: 'Student',
    DEVELOPER: 'Developer / System Architect',
    STORE_MANAGER: 'Store Manager',
};

function SidebarInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const simulateParam = searchParams.get('simulate');
    const { user, logout } = useAuth();
    
    const [isDark, setIsDark] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeWorkspace, setActiveWorkspace] = useState<'FEES' | 'STORE'>('FEES');

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    // Close mobile drawer when route changes
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Close mobile drawer & profile modal on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMobileOpen(false);
                setShowProfileModal(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    const effectiveRole = (user?.role === 'DEVELOPER' && simulateParam) ? simulateParam.toUpperCase() : user?.role;

    useEffect(() => {
        const saved = localStorage.getItem('activeWorkspace');
        if (saved === 'STORE' || saved === 'FEES') {
            setActiveWorkspace(saved as 'FEES' | 'STORE');
        } else if (user?.role === 'STORE_MANAGER' || effectiveRole === 'STORE_MANAGER') {
            setActiveWorkspace('STORE');
        }
    }, [user, effectiveRole]);

    const handleSwitchWorkspace = (ws: 'FEES' | 'STORE') => {
        localStorage.setItem('activeWorkspace', ws);
        setActiveWorkspace(ws);
        if (ws === 'STORE') {
            router.push(simulateParam ? `/store/items?simulate=${simulateParam}` : '/store/items');
        } else {
            router.push(simulateParam ? `/dashboard?simulate=${simulateParam}` : '/dashboard');
        }
    };

    const visibleItems = navItems.filter((item) => {
        let hasRoleAccess = false;
        if (user?.role === 'DEVELOPER' && simulateParam) {
            hasRoleAccess = item.roles?.includes(effectiveRole!) || false;
        } else if (item.roles?.includes('DEVELOPER') && user?.role === 'DEVELOPER') {
            hasRoleAccess = true;
        } else {
            hasRoleAccess = effectiveRole ? item.roles?.includes(effectiveRole) || false : false;
        }

        if (!hasRoleAccess) return false;

        const canAccessBoth = effectiveRole === 'ADMIN' || effectiveRole === 'DEVELOPER';
        if (canAccessBoth) {
            return item.module === 'COMMON' || item.module === activeWorkspace;
        }

        if (effectiveRole === 'STORE_MANAGER') {
            return item.module === 'STORE' || item.module === 'COMMON';
        }
        
        return item.module === 'FEES' || item.module === 'COMMON';
    });

    const initials = (user?.name || '?')
        .replace(/[^a-zA-Z\s]/g, '')
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';

    const [showProfileModal, setShowProfileModal] = useState(false);

    return (
        <>
            {/* Mobile Top Header Bar */}
            <div className="mobile-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, background: '#ffffff', borderRadius: 10, padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
                        <img src="/sai_iti_logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary-dark)' }}>Shri Sai I.T.I</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {user && (
                        <div
                            className="user-badge-avatar"
                            style={{ cursor: 'pointer', width: 34, height: 34, fontSize: 14 }}
                            onClick={() => setShowProfileModal(!showProfileModal)}
                            title="Open Profile Menu"
                        >
                            {initials}
                        </div>
                    )}
                    <button
                        className="hamburger-btn"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle Navigation Menu"
                    >
                        ☰
                    </button>
                </div>
            </div>

            {/* Mobile Backdrop Overlay */}
            {mobileOpen && (
                <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
            )}

            <aside className={`sidebar ${mobileOpen ? 'active' : ''}`}>
                {/* Logo (Home Shortcut) */}
                <Link href={simulateParam ? `/dashboard?simulate=${simulateParam}` : '/dashboard'} style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)} title="🏠 Home / Dashboard Shortcut">
                    <div className="sidebar-logo" style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}>
                        <div style={{ width: 50, height: 50, background: '#ffffff', borderRadius: 14, padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.2)', flexShrink: 0 }}>
                            <img src="/sai_iti_logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div className="sidebar-logo-text">
                            <h2 style={{ letterSpacing: '0.5px', fontSize: 18 }}>Shri Sai I.T.I 🏠</h2>
                            <span style={{ fontSize: 12 }}>{activeWorkspace === 'STORE' ? 'Store Management' : 'Fee Management'}</span>
                        </div>
                    </div>
                </Link>

                {/* Workspace Switcher (Admin and Developer only) */}
                {(effectiveRole === 'ADMIN' || effectiveRole === 'DEVELOPER') && (
                    <div style={{ padding: '0 16px 12px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{
                            display: 'flex',
                            background: 'var(--surface-2)',
                            borderRadius: '10px',
                            padding: '4px',
                            gap: '4px'
                        }}>
                            <button
                                onClick={() => handleSwitchWorkspace('FEES')}
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    background: activeWorkspace === 'FEES' ? 'var(--primary)' : 'transparent',
                                    color: activeWorkspace === 'FEES' ? 'white' : 'var(--text-muted)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                💰 Fees
                            </button>
                            <button
                                onClick={() => handleSwitchWorkspace('STORE')}
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    background: activeWorkspace === 'STORE' ? 'var(--primary)' : 'transparent',
                                    color: activeWorkspace === 'STORE' ? 'white' : 'var(--text-muted)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                📦 Store
                            </button>
                        </div>
                    </div>
                )}

                {/* Developer Simulation Active Indicator */}
                {user?.role === 'DEVELOPER' && simulateParam && (
                    <div style={{
                        margin: '12px 16px 4px', padding: '8px 12px',
                        background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '10px', fontSize: '12px', color: '#38bdf8',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <span>👁️ Viewing as <b>{simulateParam.toUpperCase()}</b></span>
                        <Link href="/system" style={{ background: '#38bdf8', color: '#0f172a', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                            Exit
                        </Link>
                    </div>
                )}

                {/* Navigation */}
                <div className="sidebar-section">
                    <div className="sidebar-section-label">
                        {simulateParam ? `${simulateParam.toUpperCase()} MENU` : 'MENU'}
                    </div>
                    <nav>
                        {visibleItems.map((item) => {
                            // Append simulation param to links if currently simulating a role
                            const targetHref = (simulateParam && !item.href.includes('simulate') && item.href !== '/system') 
                                ? `${item.href}${item.href.includes('?') ? '&' : '?'}simulate=${simulateParam}` 
                                : item.href;

                            let isActive = false;
                            if (item.href.includes('?tab=')) {
                                const tabVal = item.href.split('?tab=')[1];
                                isActive = pathname.startsWith('/store') && searchParams.get('tab') === tabVal;
                            } else if (item.href === '/store') {
                                const currentTab = searchParams.get('tab');
                                isActive = pathname === '/store' && (!currentTab || currentTab !== 'reports');
                            } else if (item.href.includes('?simulate=')) {
                                isActive = searchParams.get('simulate') === item.href.split('?simulate=')[1];
                            } else {
                                isActive = pathname === item.href;
                            }

                            return (
                                <Link
                                    key={item.href}
                                    href={targetHref}
                                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* User Profile Badge (Click to open Profile Modal) */}
                {user && (
                    <div className="sidebar-footer">
                        <div
                            className="user-badge"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                setMobileOpen(false);
                                setShowProfileModal(!showProfileModal);
                            }}
                        >
                            <div className="user-badge-avatar">{initials}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="user-badge-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {user.name}
                                </div>
                                <div className="user-badge-role">{roleLabels[user.role] || user.role}</div>
                            </div>
                            <span style={{ fontSize: 12, opacity: 0.6 }}>⚙️</span>
                        </div>
                    </div>
                )}
            </aside>

            {/* Profile Dropdown / Modal */}
            {showProfileModal && user && (
                <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setShowProfileModal(false)}>
                    <div
                        className="modal"
                        style={{ maxWidth: 360, width: '90vw' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header" style={{ padding: '14px 16px' }}>
                            <div className="modal-title" style={{ fontSize: 16 }}>👤 Account & Settings</div>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowProfileModal(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                                <div className="user-badge-avatar" style={{ width: 44, height: 44, fontSize: 18 }}>{initials}</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 15 }}>{user.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{roleLabels[user.role] || user.role}</div>
                                    <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 2 }}>{user.email}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <button
                                    onClick={() => {
                                        if (typeof window !== 'undefined' && (window as any).installPwaApp) {
                                            (window as any).installPwaApp();
                                        }
                                        setShowProfileModal(false);
                                    }}
                                    className="btn btn-secondary w-full"
                                    style={{ justifyContent: 'space-between', padding: '10px 14px', background: 'linear-gradient(135deg, rgba(2,132,199,0.1) 0%, rgba(3,105,161,0.15) 100%)', borderColor: 'var(--primary)' }}
                                >
                                    <span>📲 Install App on Device</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>PWA</span>
                                </button>

                                <button
                                    onClick={() => { toggleTheme(); setShowProfileModal(false); }}
                                    className="btn btn-secondary w-full"
                                    style={{ justifyContent: 'space-between', padding: '10px 14px' }}
                                >
                                    <span>Theme Appearance</span>
                                    <span>{isDark ? '☀️ Switch to Light' : '🌙 Switch to Dark'}</span>
                                </button>

                                <button
                                    onClick={() => { logout(); setShowProfileModal(false); }}
                                    className="btn btn-primary w-full"
                                    style={{ background: 'var(--danger)', borderColor: 'var(--danger)', justifyContent: 'center', padding: '10px 14px', marginTop: 6 }}
                                >
                                    🚪 Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function Sidebar() {
    return (
        <Suspense fallback={null}>
            <SidebarInner />
        </Suspense>
    );
}
