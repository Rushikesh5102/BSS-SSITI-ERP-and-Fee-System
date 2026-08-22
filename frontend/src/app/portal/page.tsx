'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import WelcomeOverlay from '../../components/WelcomeOverlay';
import Footer from '../../components/Footer';

export default function PortalHubPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [showWelcome, setShowWelcome] = useState(false);
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

    useEffect(() => {
        if (user && sessionStorage.getItem('showWelcomeAnimation')) {
            setShowWelcome(true);
            sessionStorage.removeItem('showWelcomeAnimation');
        }
    }, [user]);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'ADMIN' && user.role !== 'DEVELOPER') {
                router.push('/dashboard');
            }
        }
    }, [user, loading, router]);

    const selectWorkspace = (ws: 'FEES' | 'STORE' | 'LIBRARY' | 'DONATION') => {
        localStorage.setItem('activeWorkspace', ws);
        if (ws === 'STORE') {
            router.push('/store');
        } else if (ws === 'LIBRARY') {
            router.push('/library');
        } else if (ws === 'DONATION') {
            router.push('/donation-admin');
        } else {
            router.push('/dashboard');
        }
    };

    if (loading || !user || (user.role !== 'ADMIN' && user.role !== 'DEVELOPER')) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
                background: isDark ? '#0f172a' : '#1e3a8a'
            }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, borderColor: '#38bdf8' }} />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: isDark 
                ? 'radial-gradient(ellipse at top, #0f172a 0%, #090d16 50%, #020617 100%)' 
                : 'radial-gradient(ellipse at top, #1e40af 0%, #1e3a8a 45%, #0f172a 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            padding: '40px 16px',
            fontFamily: "'Inter', sans-serif",
            position: 'relative',
            transition: 'background 0.3s ease'
        }}>
            {/* Theme Toggle */}
            <button 
                onClick={toggleTheme}
                style={{
                    position: 'absolute', top: 20, right: 20, padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#ffffff',
                    borderRadius: '100px', cursor: 'pointer', zIndex: 10,
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 700,
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
                }}
            >
                {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>

            {showWelcome && <WelcomeOverlay role={user.role} />}

            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                    100% { transform: translateY(0px); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulseGlowDark {
                    0% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.12); }
                    50% { box-shadow: 0 12px 40px rgba(56, 189, 248, 0.25), 0 0 0 1px rgba(56, 189, 248, 0.4); }
                    100% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.12); }
                }
                @keyframes pulseGlowBeige {
                    0% { box-shadow: 0 10px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.4); }
                    50% { box-shadow: 0 14px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(233, 220, 201, 0.8); }
                    100% { box-shadow: 0 10px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.4); }
                }
                .portal-card-beige-glass {
                    background: ${isDark ? 'rgba(15, 23, 42, 0.82)' : 'rgba(237, 226, 209, 0.94)'};
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.65)'};
                    border-radius: 20px;
                    padding: 30px 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    text-align: left;
                    box-shadow: ${isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 10px 36px rgba(0, 0, 0, 0.25)'};
                    position: relative;
                    overflow: hidden;
                    animation: ${isDark ? 'pulseGlowDark 4s infinite' : 'pulseGlowBeige 4s infinite'};
                }
                .portal-card-beige-glass:hover {
                    transform: translateY(-6px);
                    background: ${isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(247, 238, 224, 0.98)'};
                    border-color: ${isDark ? 'rgba(56, 189, 248, 0.6)' : 'rgba(216, 195, 165, 0.9)'};
                    box-shadow: ${isDark ? '0 16px 48px rgba(56, 189, 248, 0.3)' : '0 18px 48px rgba(0, 0, 0, 0.35)'};
                }
                .portal-badge {
                    position: absolute;
                    top: 14px;
                    right: 14px;
                    font-size: 10.5px;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    padding: 4px 10px;
                    border-radius: 100px;
                    text-transform: uppercase;
                }
            `}</style>

            <div style={{ textAlign: 'center', marginBottom: '36px', animation: 'fadeIn 0.8s ease forwards' }}>
                <div style={{
                    width: '100px', height: '100px', margin: '0 auto 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'float 4s ease-in-out infinite'
                }}>
                    <img
                        src="/sai_iti_logo.png"
                        alt="Shri Sai I.T.I Logo"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 0 18px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 36px rgba(56, 189, 248, 0.85))'
                        }}
                    />
                </div>
                <h1 style={{
                    fontSize: 'clamp(28px, 6vw, 42px)',
                    fontWeight: 900,
                    letterSpacing: '-0.5px',
                    margin: '0 0 8px 0',
                    color: '#ffffff',
                    textShadow: '0 4px 20px rgba(0,0,0,0.35)'
                }}>
                    Shri Sai I.T.I
                </h1>
                <p style={{
                    fontSize: 'clamp(14px, 3.5vw, 17px)',
                    color: '#e0f2fe',
                    fontWeight: 700,
                    margin: 0,
                    textShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                    Central Workspace Portal Hub
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                width: '100%',
                maxWidth: '1080px',
                animation: 'fadeIn 1s ease 0.1s forwards',
                opacity: 0,
                animationFillMode: 'forwards',
                marginBottom: '40px'
            }}>
                {/* Card 0: System Diagnostics / Dev Home (Developer access only) */}
                {user.role === 'DEVELOPER' && (
                    <div className="portal-card-beige-glass" onClick={() => router.push('/system')}>
                        <div className="portal-badge" style={{ 
                            background: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(217, 119, 6, 0.15)', 
                            color: isDark ? '#fbbf24' : '#b45309', 
                            border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(217, 119, 6, 0.35)'}` 
                        }}>
                            Core Control
                        </div>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '16px',
                            background: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(217, 119, 6, 0.15)',
                            color: isDark ? '#fbbf24' : '#d97706',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '32px', marginBottom: '8px'
                        }}>
                            💻
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
                                Dev Home & Diagnostics
                            </h2>
                            <p style={{ fontSize: '13.5px', color: isDark ? '#f8fafc' : '#334155', lineHeight: '1.5', margin: 0, opacity: 0.95 }}>
                                Monitor system uptime, check database vitals, configure global settings, and audit security events.
                            </p>
                        </div>
                        <div style={{
                            marginTop: 'auto', fontSize: '13px', fontWeight: 800, color: isDark ? '#fbbf24' : '#b45309',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            Control Center &rarr;
                        </div>
                    </div>
                )}

                {/* Card 1: Fees */}
                <div className="portal-card-beige-glass" onClick={() => selectWorkspace('FEES')}>
                    <div className="portal-badge" style={{ 
                        background: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(2, 132, 199, 0.15)', 
                        color: isDark ? '#38bdf8' : '#0369a1', 
                        border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.3)'}` 
                    }}>
                        Primary
                    </div>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '16px',
                        background: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(2, 132, 199, 0.15)',
                        color: isDark ? '#38bdf8' : '#0284c7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', marginBottom: '8px'
                    }}>
                        💰
                    </div>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
                            Fee Management
                        </h2>
                        <p style={{ fontSize: '13.5px', color: isDark ? '#f8fafc' : '#334155', lineHeight: '1.5', margin: 0, opacity: 0.95 }}>
                            Track student fees, record collection payments, print invoices, and view financial reports.
                        </p>
                    </div>
                    <div style={{
                        marginTop: 'auto', fontSize: '13px', fontWeight: 800, color: isDark ? '#38bdf8' : '#0284c7',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        Enter Workspace &rarr;
                    </div>
                </div>

                {/* Card 2: Store */}
                <div className="portal-card-beige-glass" onClick={() => selectWorkspace('STORE')}>
                    <div className="portal-badge" style={{ 
                        background: isDark ? 'rgba(192, 132, 252, 0.2)' : 'rgba(147, 51, 234, 0.15)', 
                        color: isDark ? '#c084fc' : '#7e22ce', 
                        border: `1px solid ${isDark ? 'rgba(192, 132, 252, 0.3)' : 'rgba(147, 51, 234, 0.3)'}` 
                    }}>
                        Inventory
                    </div>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '16px',
                        background: isDark ? 'rgba(192, 132, 252, 0.2)' : 'rgba(147, 51, 234, 0.15)',
                        color: isDark ? '#c084fc' : '#9333ea',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', marginBottom: '8px'
                    }}>
                        📦
                    </div>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
                            Store Management
                        </h2>
                        <p style={{ fontSize: '13.5px', color: isDark ? '#f8fafc' : '#334155', lineHeight: '1.5', margin: 0, opacity: 0.95 }}>
                            Manage inventory, track stock inward/outward transactions, handle suppliers, and monitor low stock alerts.
                        </p>
                    </div>
                    <div style={{
                        marginTop: 'auto', fontSize: '13px', fontWeight: 800, color: isDark ? '#c084fc' : '#7e22ce',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        Enter Workspace &rarr;
                    </div>
                </div>

                {/* Card 3: Library */}
                <div className="portal-card-beige-glass" onClick={() => selectWorkspace('LIBRARY')}>
                    <div className="portal-badge" style={{ 
                        background: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.15)', 
                        color: isDark ? '#34d399' : '#047857', 
                        border: `1px solid ${isDark ? 'rgba(52, 211, 153, 0.3)' : 'rgba(16, 185, 129, 0.3)'}` 
                    }}>
                        Academics
                    </div>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '16px',
                        background: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                        color: isDark ? '#34d399' : '#059669',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', marginBottom: '8px'
                    }}>
                        📚
                    </div>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
                            Library Management
                        </h2>
                        <p style={{ fontSize: '13.5px', color: isDark ? '#f8fafc' : '#334155', lineHeight: '1.5', margin: 0, opacity: 0.95 }}>
                            Manage institute books catalog, student/staff issue & return registers, reservations, and overdue fines.
                        </p>
                    </div>
                    <div style={{
                        marginTop: 'auto', fontSize: '13px', fontWeight: 800, color: isDark ? '#34d399' : '#047857',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        Enter Workspace &rarr;
                    </div>
                </div>

                {/* Card 4: Foundation Donations */}
                <div className="portal-card-beige-glass" onClick={() => selectWorkspace('DONATION')}>
                    <div className="portal-badge" style={{ 
                        background: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(217, 119, 6, 0.15)', 
                        color: isDark ? '#f59e0b' : '#b45309', 
                        border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(217, 119, 6, 0.3)'}` 
                    }}>
                        Philanthropy
                    </div>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '16px',
                        background: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(217, 119, 6, 0.15)',
                        color: isDark ? '#f59e0b' : '#d97706',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', marginBottom: '8px'
                    }}>
                        🤝
                    </div>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: isDark ? '#ffffff' : '#0f172a' }}>
                            Donation & Foundation Admin
                        </h2>
                        <p style={{ fontSize: '13.5px', color: isDark ? '#f8fafc' : '#334155', lineHeight: '1.5', margin: 0, opacity: 0.95 }}>
                            Track 80G tax exemptions, manage BSS Foundation donor contributions, campaigns, and funds transparency.
                        </p>
                    </div>
                    <div style={{
                        marginTop: 'auto', fontSize: '13px', fontWeight: 800, color: isDark ? '#f59e0b' : '#b45309',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        Enter Workspace &rarr;
                    </div>
                </div>
            </div>

            <button
                onClick={logout}
                style={{
                    background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.18)',
                    border: isDark ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    padding: '10px 24px',
                    borderRadius: '12px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    animation: 'fadeIn 1.2s ease forwards',
                    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.2)'
                }}
            >
                🚪 Sign Out
            </button>
            
            <div style={{ marginTop: '30px', width: '100%', maxWidth: '960px' }}>
                <Footer />
            </div>
        </div>
    );
}
