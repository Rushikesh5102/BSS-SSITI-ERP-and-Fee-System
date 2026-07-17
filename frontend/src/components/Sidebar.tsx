'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface NavItem {
    href: string;
    label: string;
    icon: string;
    roles?: string[];
}

const navItems: NavItem[] = [
    { href: '/system', label: 'Dev Home', icon: '💻', roles: ['DEVELOPER'] },
    { href: '/dashboard?simulate=admin', label: 'View as Admin', icon: '🏛️', roles: ['DEVELOPER'] },
    { href: '/dashboard?simulate=accountant', label: 'View as Accountant', icon: '🧾', roles: ['DEVELOPER'] },
    { href: '/dashboard?simulate=teacher', label: 'View as Teacher', icon: '👨‍🏫', roles: ['DEVELOPER'] },
    { href: '/dashboard?simulate=student', label: 'View as Student', icon: '🕶️', roles: ['DEVELOPER'] },

    { href: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['SUPERADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER', 'STUDENT'] },
    { href: '/students', label: 'Students', icon: '👨‍🎓', roles: ['SUPERADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER', 'DEVELOPER'] },
    { href: '/fee-structures', label: 'Fee Structures', icon: '📋', roles: ['SUPERADMIN', 'ADMIN', 'DEVELOPER'] },
    { href: '/payments', label: 'Record Payment', icon: '💳', roles: ['SUPERADMIN', 'ADMIN', 'ACCOUNTANT', 'DEVELOPER'] },
    { href: '/receipts', label: 'Receipts', icon: '🧾', roles: ['SUPERADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER', 'DEVELOPER'] },
    { href: '/reports', label: 'Reports', icon: '📈', roles: ['SUPERADMIN', 'ADMIN', 'ACCOUNTANT', 'DEVELOPER'] },
    { href: '/settings', label: 'Settings', icon: '⚙️', roles: ['SUPERADMIN', 'ADMIN', 'DEVELOPER'] },
    { href: '/access', label: 'Access Control', icon: '🔑', roles: ['SUPERADMIN', 'ADMIN', 'DEVELOPER'] },
];

const roleLabels: Record<string, string> = {
    SUPERADMIN: 'Super Admin',
    ADMIN: 'Administrator',
    ACCOUNTANT: 'Accountant',
    TEACHER: 'Teacher',
    STUDENT: 'Student',
    DEVELOPER: 'Developer/Architect',
};

import { useSearchParams } from 'next/navigation';

export default function Sidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const simulateParam = searchParams.get('simulate');
    const { user, logout } = useAuth();
    
    const [isDark, setIsDark] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    // Close mobile drawer when route changes
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

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

    const visibleItems = navItems.filter((item) => {
        if (item.roles?.includes('DEVELOPER') && user?.role === 'DEVELOPER') return true;
        return effectiveRole && item.roles?.includes(effectiveRole);
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
                    <img src="/sai_iti_logo.png" alt="Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--primary)' }}>Shri Sai I.T.I</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {user && (
                        <div
                            className="user-badge-avatar"
                            style={{ cursor: 'pointer', width: 32, height: 32, fontSize: 13 }}
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
                {/* Logo */}
                <Link href="/dashboard" style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon" style={{ background: 'transparent', border: 'none', width: '48px', height: '48px', flexShrink: 0, padding: 0 }}>
                            <img src="/sai_iti_logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div className="sidebar-logo-text">
                            <h2 style={{ letterSpacing: '0.5px' }}>Shri Sai I.T.I</h2>
                            <span>Fee Management</span>
                        </div>
                    </div>
                </Link>

                {/* Navigation */}
                <div className="sidebar-section">
                    <div className="sidebar-section-label">Menu</div>
                    <nav>
                        {visibleItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <span style={{ fontSize: 18 }}>{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* User Profile Badge (Click to open Profile Modal) */}
                {user && (
                    <div className="sidebar-footer">
                        <div
                            className="user-badge"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setShowProfileModal(!showProfileModal)}
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
