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
    module: 'FEES' | 'STORE' | 'LIBRARY' | 'DONATION' | 'COMMON';
}

const navItems: NavItem[] = [
    // DEVELOPER OPERATIONS (TOP SECTION)
    { href: '/portal', label: 'Portal Hub', icon: '🏛️', roles: ['ADMIN', 'DEVELOPER'], module: 'COMMON' },
    { href: '/system', label: 'Dev Home', icon: '💻', roles: ['DEVELOPER'], module: 'COMMON' },
    { href: '/access', label: 'Access Control', icon: '🔑', roles: ['ADMIN', 'DEVELOPER'], module: 'COMMON' },
    { href: '/404', label: '404 Experience', icon: '⚡', roles: ['DEVELOPER'], module: 'COMMON' },

    // FEES WORKSPACE & FEES DEVELOPER SIMULATIONS
    { href: '/dashboard?simulate=admin', label: 'View as Admin', icon: '🏛️', roles: ['DEVELOPER'], module: 'FEES' },
    { href: '/dashboard?simulate=accountant', label: 'View as Accountant', icon: '🧾', roles: ['DEVELOPER'], module: 'FEES' },
    { href: '/dashboard?simulate=student', label: 'View as Student', icon: '🕶️', roles: ['DEVELOPER'], module: 'FEES' },

    { href: '/dashboard', label: 'Fee Dashboard', icon: '📊', roles: ['ADMIN', 'ACCOUNTANT', 'STUDENT', 'DEVELOPER'], module: 'FEES' },
    { href: '/students', label: 'Students', icon: '👨‍🎓', roles: ['ADMIN', 'ACCOUNTANT', 'DEVELOPER'], module: 'FEES' },
    { href: '/fee-structures', label: 'Fee Structures', icon: '📋', roles: ['ADMIN', 'DEVELOPER', 'ACCOUNTANT'], module: 'FEES' },
    { href: '/payments', label: 'Record Payment', icon: '💳', roles: ['ADMIN', 'ACCOUNTANT', 'DEVELOPER'], module: 'FEES' },
    { href: '/receipts', label: 'Receipts', icon: '🧾', roles: ['ADMIN', 'ACCOUNTANT', 'DEVELOPER'], module: 'FEES' },
    { href: '/reports', label: 'Reports', icon: '📈', roles: ['ADMIN', 'ACCOUNTANT', 'DEVELOPER'], module: 'FEES' },

    // STORE WORKSPACE & STORE DEVELOPER SIMULATIONS
    { href: '/store?simulate=admin', label: 'View as Admin', icon: '🏛️', roles: ['DEVELOPER'], module: 'STORE' },
    { href: '/store?simulate=store_manager', label: 'View as Store Mgr', icon: '📦', roles: ['DEVELOPER'], module: 'STORE' },

    { href: '/store', label: 'Store Dashboard', icon: '📊', roles: ['ADMIN', 'DEVELOPER', 'STORE_MANAGER', 'ACCOUNTANT'], module: 'STORE' },
    { href: '/store/items', label: 'Workshop Asset Register', icon: '📋', roles: ['ADMIN', 'DEVELOPER', 'STORE_MANAGER', 'ACCOUNTANT'], module: 'STORE' },
    { href: '/store/issue', label: 'Tool Issue & Movement', icon: '🛠️', roles: ['ADMIN', 'DEVELOPER', 'STORE_MANAGER', 'ACCOUNTANT'], module: 'STORE' },
    { href: '/store/history', label: 'Movement History Log', icon: '🔄', roles: ['ADMIN', 'DEVELOPER', 'STORE_MANAGER', 'ACCOUNTANT'], module: 'STORE' },
    { href: '/store/reports', label: 'PDF & Excel Reports', icon: '📄', roles: ['ADMIN', 'DEVELOPER', 'STORE_MANAGER', 'ACCOUNTANT'], module: 'STORE' },

    // LIBRARY WORKSPACE & LIBRARY DEVELOPER SIMULATIONS
    { href: '/library?simulate=admin', label: 'View as Admin', icon: '🏛️', roles: ['DEVELOPER'], module: 'LIBRARY' },
    { href: '/library?simulate=librarian', label: 'View as Librarian', icon: '📚', roles: ['DEVELOPER'], module: 'LIBRARY' },

    { href: '/library', label: 'Library Dashboard', icon: '📊', roles: ['ADMIN', 'DEVELOPER', 'LIBRARIAN', 'ACCOUNTANT', 'STUDENT'], module: 'LIBRARY' },
    { href: '/library/books', label: 'Book Catalog', icon: '📚', roles: ['ADMIN', 'DEVELOPER', 'LIBRARIAN', 'ACCOUNTANT', 'STUDENT'], module: 'LIBRARY' },
    { href: '/library/issue', label: 'Book Issue & Movement', icon: '🛠️', roles: ['ADMIN', 'DEVELOPER', 'LIBRARIAN', 'ACCOUNTANT'], module: 'LIBRARY' },
    { href: '/library/history', label: 'Movement History', icon: '📜', roles: ['ADMIN', 'DEVELOPER', 'LIBRARIAN', 'ACCOUNTANT'], module: 'LIBRARY' },
    { href: '/library/reports', label: 'PDF & Excel Reports', icon: '📄', roles: ['ADMIN', 'DEVELOPER', 'LIBRARIAN', 'ACCOUNTANT'], module: 'LIBRARY' },

    // DONATION WORKSPACE & DONATION DEVELOPER SIMULATIONS
    { href: '/donation-admin?simulate=admin', label: 'View as Admin', icon: '🏛️', roles: ['DEVELOPER'], module: 'DONATION' },
    { href: '/donation-admin?simulate=accountant', label: 'View as Accountant', icon: '🧾', roles: ['DEVELOPER'], module: 'DONATION' },

    { href: '/donation-admin', label: 'Donation Overview', icon: '🤝', roles: ['ADMIN', 'DEVELOPER', 'ACCOUNTANT', 'STORE_MANAGER', 'LIBRARIAN'], module: 'DONATION' },
    { href: '/donation-admin/transactions', label: 'Donations & 80G Receipts', icon: '🧾', roles: ['ADMIN', 'DEVELOPER', 'ACCOUNTANT', 'STORE_MANAGER', 'LIBRARIAN'], module: 'DONATION' },
    { href: '/donation-admin/campaigns', label: 'Campaigns & Causes', icon: '🎯', roles: ['ADMIN', 'DEVELOPER', 'ACCOUNTANT', 'STORE_MANAGER', 'LIBRARIAN'], module: 'DONATION' },
    { href: '/donation-admin/donors', label: 'Donor Directory', icon: '👥', roles: ['ADMIN', 'DEVELOPER', 'ACCOUNTANT', 'STORE_MANAGER', 'LIBRARIAN'], module: 'DONATION' },
    { href: '/donation-admin/reports', label: 'Audit & Form 10BD Reports', icon: '📈', roles: ['ADMIN', 'DEVELOPER', 'ACCOUNTANT', 'STORE_MANAGER', 'LIBRARIAN'], module: 'DONATION' },
];

const roleLabels: Record<string, string> = {
    ADMIN: 'Administrator / Principal',
    ACCOUNTANT: 'Accountant',
    STUDENT: 'Student',
    DEVELOPER: 'Developer / System Architect',
    STORE_MANAGER: 'Store Manager',
    LIBRARIAN: 'Chief Librarian',
};

function getWorkspaceFromPath(p: string | null): 'FEES' | 'STORE' | 'LIBRARY' | 'DONATION' {
    if (!p) return 'FEES';
    if (p.startsWith('/donation-admin')) return 'DONATION';
    if (p.startsWith('/library')) return 'LIBRARY';
    if (p.startsWith('/store')) return 'STORE';
    return 'FEES';
}

function SidebarInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const simulateParam = searchParams.get('simulate');
    const { user, logout } = useAuth();
    
    const [isDark, setIsDark] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeWorkspace, setActiveWorkspace] = useState<'FEES' | 'STORE' | 'LIBRARY' | 'DONATION'>(() => getWorkspaceFromPath(pathname));

    useEffect(() => {
        const nextWs = getWorkspaceFromPath(pathname);
        setActiveWorkspace(prev => (prev !== nextWs ? nextWs : prev));
    }, [pathname]);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
        const savedCollapse = localStorage.getItem('sidebar_collapsed');
        if (savedCollapse === 'true') {
            setIsCollapsed(true);
            document.body.classList.add('sidebar-collapsed');
        }
    }, []);

    const toggleCollapse = () => {
        const next = !isCollapsed;
        setIsCollapsed(next);
        localStorage.setItem('sidebar_collapsed', String(next));
        if (next) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }
    };

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

    // Route-based workspace synchronization (Guarded against unnecessary re-renders)
    useEffect(() => {
        let nextWs: 'FEES' | 'STORE' | 'LIBRARY' | 'DONATION' = 'FEES';
        if (pathname.startsWith('/donation-admin')) {
            nextWs = 'DONATION';
        } else if (pathname.startsWith('/library')) {
            nextWs = 'LIBRARY';
        } else if (pathname.startsWith('/store')) {
            nextWs = 'STORE';
        } else if (pathname.startsWith('/dashboard') || pathname.startsWith('/students') || pathname.startsWith('/payments') || pathname.startsWith('/fee-structures') || pathname.startsWith('/reports') || pathname.startsWith('/receipts')) {
            nextWs = 'FEES';
        } else {
            const saved = localStorage.getItem('activeWorkspace');
            if (saved === 'STORE' || saved === 'FEES' || saved === 'LIBRARY' || saved === 'DONATION') {
                nextWs = saved as any;
            }
        }
        setActiveWorkspace(prev => (prev !== nextWs ? nextWs : prev));
        try {
            localStorage.setItem('activeWorkspace', nextWs);
        } catch {}
    }, [pathname]);

    const handleSwitchWorkspace = (ws: 'FEES' | 'STORE' | 'LIBRARY' | 'DONATION') => {
        localStorage.setItem('activeWorkspace', ws);
        setActiveWorkspace(ws);
        if (ws === 'STORE') {
            router.push(simulateParam ? `/store?simulate=${simulateParam}` : '/store');
        } else if (ws === 'LIBRARY') {
            router.push(simulateParam ? `/library?simulate=${simulateParam}` : '/library');
        } else if (ws === 'DONATION') {
            router.push(simulateParam ? `/donation-admin?simulate=${simulateParam}` : '/donation-admin');
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

        const canAccessAll = effectiveRole === 'ADMIN' || effectiveRole === 'DEVELOPER';
        if (canAccessAll) {
            return item.module === 'COMMON' || item.module === activeWorkspace;
        }

        if (effectiveRole === 'STORE_MANAGER') {
            return item.module === 'STORE' || item.module === 'COMMON';
        }

        if (effectiveRole === 'LIBRARIAN') {
            return item.module === 'LIBRARY' || item.module === 'COMMON';
        }
        
        return item.module === activeWorkspace || item.module === 'COMMON';
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
            {/* Mobile Top App Bar Header */}
            <div className="mobile-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/sai_iti_logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-on-primary)' }}>Shri Sai I.T.I</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={toggleTheme} className="btn-icon" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                        {isDark ? '☀️' : '🌙'}
                    </button>
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

            {/* Desktop Collapsed Floating Logo & Hamburger Bar */}
            {isCollapsed && (
                <div className="collapsed-logo-bar">
                    <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/sai_iti_logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.8))' }} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.3px' }}>
                        Shri Sai I.T.I
                    </span>
                    <button
                        onClick={toggleCollapse}
                        style={{
                            background: 'rgba(56, 189, 248, 0.2)',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            color: '#38bdf8',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        title="Open Sidebar Navigation (Shift+E)"
                        aria-label="Open Sidebar Navigation"
                    >
                        ☰
                    </button>
                </div>
            )}

            <aside className={`sidebar ${mobileOpen ? 'active' : ''}`}>
                {/* Logo & Retract Collapse Header */}
                <div className="sidebar-header-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}>
                    <Link href={simulateParam ? `/dashboard?simulate=${simulateParam}` : '/dashboard'} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }} onClick={() => setMobileOpen(false)} title="Home / Dashboard Shortcut">
                        <div className="sidebar-logo" style={{ cursor: 'pointer', transition: 'transform 0.2s ease', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 44, height: 44, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <img src="/sai_iti_logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 24px rgba(56, 189, 248, 0.75))' }} />
                            </div>
                            <div className="sidebar-logo-text" style={{ minWidth: 0 }}>
                                <h2 style={{ letterSpacing: '0.5px', fontSize: 16, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Shri Sai I.T.I</h2>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeWorkspace === 'STORE' ? 'Store Management' : (activeWorkspace === 'LIBRARY' ? 'Library Management' : (activeWorkspace === 'DONATION' ? 'Donation Management' : 'Fee Management'))}</span>
                            </div>
                        </div>
                    </Link>

                    {/* Retractable Sidebar Toggle Button */}
                    <button
                        onClick={toggleCollapse}
                        className="sidebar-toggle-btn"
                        style={{
                            background: 'rgba(255,255,255,0.18)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            color: '#ffffff',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'all 0.2s ease'
                        }}
                        title={isCollapsed ? "Expand Sidebar (Shift+E)" : "Retract / Collapse Sidebar (Shift+C)"}
                    >
                        {isCollapsed ? '▶' : '◀'}
                    </button>
                </div>

                {/* Workspace Switcher — 2x2 Rectangle Grid (Fees & Donation Top, Store & Library Bottom) */}
                {(effectiveRole === 'ADMIN' || effectiveRole === 'DEVELOPER') && (
                    <div style={{ padding: '0 12px 12px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            background: 'var(--surface-2)',
                            borderRadius: '8px',
                            padding: '4px',
                            gap: '4px',
                            border: '1px solid var(--border)'
                        }}>
                            {/* Row 1 Left: Fees */}
                            <button
                                onClick={() => handleSwitchWorkspace('FEES')}
                                className="workspace-btn"
                                style={{
                                    border: activeWorkspace === 'FEES' ? '1px solid var(--primary-dark)' : '1px solid transparent',
                                    borderRadius: '6px',
                                    padding: '8px 4px',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    background: activeWorkspace === 'FEES' ? 'var(--primary)' : 'transparent',
                                    color: activeWorkspace === 'FEES' ? 'white' : 'var(--text-muted)',
                                    transition: 'all 0.15s ease'
                                }}
                                title="Fee Management"
                            >
                                <span>💰</span>
                                <span className="workspace-btn-label">Fees</span>
                            </button>

                            {/* Row 1 Right: Donation */}
                            <button
                                onClick={() => handleSwitchWorkspace('DONATION')}
                                className="workspace-btn"
                                style={{
                                    border: activeWorkspace === 'DONATION' ? '1px solid var(--primary-dark)' : '1px solid transparent',
                                    borderRadius: '6px',
                                    padding: '8px 4px',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    background: activeWorkspace === 'DONATION' ? 'var(--primary)' : 'transparent',
                                    color: activeWorkspace === 'DONATION' ? 'white' : 'var(--text-muted)',
                                    transition: 'all 0.15s ease'
                                }}
                                title="Donation Management"
                            >
                                <span>🤝</span>
                                <span className="workspace-btn-label">Donation</span>
                            </button>

                            {/* Row 2 Left: Store */}
                            <button
                                onClick={() => handleSwitchWorkspace('STORE')}
                                className="workspace-btn"
                                style={{
                                    border: activeWorkspace === 'STORE' ? '1px solid var(--primary-dark)' : '1px solid transparent',
                                    borderRadius: '6px',
                                    padding: '8px 4px',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    background: activeWorkspace === 'STORE' ? 'var(--primary)' : 'transparent',
                                    color: activeWorkspace === 'STORE' ? 'white' : 'var(--text-muted)',
                                    transition: 'all 0.15s ease'
                                }}
                                title="Store Management"
                            >
                                <span>📦</span>
                                <span className="workspace-btn-label">Store</span>
                            </button>

                            {/* Row 2 Right: Library */}
                            <button
                                onClick={() => handleSwitchWorkspace('LIBRARY')}
                                className="workspace-btn"
                                style={{
                                    border: activeWorkspace === 'LIBRARY' ? '1px solid var(--primary-dark)' : '1px solid transparent',
                                    borderRadius: '6px',
                                    padding: '8px 4px',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    background: activeWorkspace === 'LIBRARY' ? 'var(--primary)' : 'transparent',
                                    color: activeWorkspace === 'LIBRARY' ? 'white' : 'var(--text-muted)',
                                    transition: 'all 0.15s ease'
                                }}
                                title="Library Management"
                            >
                                <span>📚</span>
                                <span className="workspace-btn-label">Library</span>
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

                {/* Categorized Navigation */}
                {(() => {
                    const isDev = user?.role === 'DEVELOPER';
                    const isCommonDevOp = (href: string) => href === '/portal' || href === '/system' || href === '/access' || href === '/404';
                    
                    const devOperationsItems = isDev 
                        ? visibleItems.filter(item => isCommonDevOp(item.href))
                        : [];
                    const simulationItems = isDev 
                        ? visibleItems.filter(item => item.href.includes('simulate')) 
                        : [];
                    const systemOperationsItems = visibleItems.filter(item => !item.href.includes('simulate') && !isCommonDevOp(item.href));
                    const adminAccessItems = !isDev ? visibleItems.filter(item => item.href === '/access' || item.href === '/portal') : [];

                    const renderNavItem = (item: any) => {
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
                    };

                    if (isDev) {
                        return (
                            <>
                                {/* 1. DEVELOPER OPERATIONS (AT THE TOP) */}
                                {devOperationsItems.length > 0 && (
                                    <div className="sidebar-section">
                                        <div className="sidebar-section-label" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>⚡</span>
                                            <span>DEVELOPER OPERATIONS</span>
                                        </div>
                                        <nav>
                                            {devOperationsItems.map(renderNavItem)}
                                        </nav>
                                    </div>
                                )}

                                {/* 2. ROLE PERSPECTIVES (IN THE MIDDLE) */}
                                {simulationItems.length > 0 && (
                                    <div className="sidebar-section" style={{ marginTop: '12px', borderTop: '1px solid rgba(56, 189, 248, 0.25)', paddingTop: '10px' }}>
                                        <div className="sidebar-section-label" style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>👁️</span>
                                            <span>ROLE PERSPECTIVES</span>
                                        </div>
                                        <nav>
                                            {simulationItems.map(renderNavItem)}
                                        </nav>
                                    </div>
                                )}

                                {/* 3. SYSTEM OPERATIONS (AT THE BOTTOM) */}
                                {systemOperationsItems.length > 0 && (
                                    <div className="sidebar-section" style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                        <div className="sidebar-section-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>⚙️</span>
                                            <span>
                                                {activeWorkspace === 'FEES' ? 'FEE SYSTEM OPERATIONS' : (activeWorkspace === 'STORE' ? 'STORE ERP OPERATIONS' : (activeWorkspace === 'LIBRARY' ? 'LIBRARY ERP OPERATIONS' : 'DONATION OPERATIONS'))}
                                            </span>
                                        </div>
                                        <nav>
                                            {systemOperationsItems.map(renderNavItem)}
                                        </nav>
                                    </div>
                                )}
                            </>
                        );
                    }

                    // Standard User View (Admin, Accountant, Store Mgr, Librarian, Student)
                    return (
                        <>
                            {/* 1. Core Module Navigation */}
                            <div className="sidebar-section">
                                <div className="sidebar-section-label">
                                    {activeWorkspace === 'FEES' ? '💰 FEE SYSTEM' : (activeWorkspace === 'STORE' ? '📦 STORE ERP' : (activeWorkspace === 'LIBRARY' ? '📚 LIBRARY ERP' : '🤝 DONATION MODULE'))}
                                </div>
                                <nav>
                                    {systemOperationsItems.map(renderNavItem)}
                                </nav>
                            </div>

                            {/* 2. Admin Operations */}
                            {adminAccessItems.length > 0 && (
                                <div className="sidebar-section" style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                    <div className="sidebar-section-label">
                                        🏛️ ADMINISTRATION
                                    </div>
                                    <nav>
                                        {adminAccessItems.map(renderNavItem)}
                                    </nav>
                                </div>
                            )}
                        </>
                    );
                })()}

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
