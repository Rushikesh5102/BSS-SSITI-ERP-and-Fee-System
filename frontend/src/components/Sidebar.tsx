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
];

const roleLabels: Record<string, string> = {
    SUPERADMIN: 'Super Admin',
    ADMIN: 'Administrator',
    ACCOUNTANT: 'Accountant',
    TEACHER: 'Teacher',
    STUDENT: 'Student',
    DEVELOPER: 'Developer/Architect',
};

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
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

    const visibleItems = navItems.filter(
        (item) => !item.roles || (user && item.roles.includes(user.role))
    );

    const initials = (user?.name || '?')
        .replace(/[^a-zA-Z\s]/g, '')
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';

    return (
        <aside className="sidebar">
            {/* Logo */}
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
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
                        >
                            <span style={{ fontSize: 18 }}>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* User Profile + Logout */}
            {user && (
                <div className="sidebar-footer">
                    <div className="user-badge">
                        <div className="user-badge-avatar">{initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="user-badge-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user.name}
                            </div>
                            <div className="user-badge-role">{roleLabels[user.role] || user.role}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button
                            onClick={toggleTheme}
                            className="btn btn-ghost w-full"
                            style={{ color: 'var(--sidebar-text)', justifyContent: 'center', padding: '8px', fontSize: '13px' }}
                        >
                            {isDark ? '☀️ Light' : '🌙 Dark'}
                        </button>
                        <button
                            onClick={logout}
                            className="btn btn-ghost w-full"
                            style={{ color: 'var(--sidebar-text)', justifyContent: 'center', padding: '8px', fontSize: '13px' }}
                        >
                            🚪 Sign Out
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
}
