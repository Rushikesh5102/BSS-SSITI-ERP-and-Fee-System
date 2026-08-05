'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import WelcomeOverlay from '../../components/WelcomeOverlay';

export default function PortalHubPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [showWelcome, setShowWelcome] = useState(false);

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
                // If other roles try to access portal, redirect them to dashboard
                router.push('/dashboard');
            }
        }
    }, [user, loading, router]);

    const selectWorkspace = (ws: 'FEES' | 'STORE') => {
        localStorage.setItem('activeWorkspace', ws);
        if (ws === 'STORE') {
            router.push('/store');
        } else {
            router.push('/dashboard');
        }
    };

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

    if (loading || !user || (user.role !== 'ADMIN' && user.role !== 'DEVELOPER')) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
                background: 'var(--background)'
            }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: isDark
                ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #020617 100%)'
                : 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f172a 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            padding: '24px 16px',
            fontFamily: "'Inter', sans-serif",
            position: 'relative'
        }}>
            <button
                onClick={toggleTheme}
                style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    borderRadius: 20,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    background: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
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
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 15px rgba(56, 189, 248, 0.2); }
                    50% { box-shadow: 0 0 30px rgba(56, 189, 248, 0.45); }
                    100% { box-shadow: 0 0 15px rgba(56, 189, 248, 0.2); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .portal-card {
                    background: ${isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.16)'};
                    backdrop-filter: blur(16px);
                    border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.28)'};
                    border-radius: 20px;
                    padding: 32px 24px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
                }
                .portal-card:hover {
                    transform: translateY(-8px);
                    background: ${isDark ? 'rgba(51, 65, 85, 0.85)' : 'rgba(255, 255, 255, 0.26)'};
                    border-color: rgba(56, 189, 248, 0.6);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                }
            `}</style>

            <div style={{
                textAlign: 'center',
                maxWidth: '600px',
                marginBottom: '40px',
                animation: 'fadeIn 0.8s ease forwards'
            }}>
                {/* Backgroundless Logo with White Glow */}
                <div style={{
                    width: '125px', height: '125px', margin: '0 auto 16px',
                    background: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'float 6s ease-in-out infinite'
                }}>
                    <img
                        src="/sai_iti_logo.png"
                        alt="Logo"
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
                    textShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}>
                    Shri Sai I.T.I
                </h1>
                <p style={{
                    fontSize: 'clamp(14px, 3.5vw, 17px)',
                    color: '#e0f2fe',
                    fontWeight: 600,
                    margin: 0
                }}>
                    Central Workspace Portal Hub
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                width: '100%',
                maxWidth: '960px',
                animation: 'fadeIn 1s ease 0.1s forwards',
                opacity: 0,
                animationFillMode: 'forwards',
                marginBottom: '40px'
            }}>
                {/* Card 1: Fees */}
                <div className="portal-card" onClick={() => selectWorkspace('FEES')} style={{
                    animation: 'pulseGlow 4s infinite'
                }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '16px',
                        background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', marginBottom: '8px'
                    }}>
                        💰
                    </div>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff' }}>Fee Management</h2>
                        <p style={{ fontSize: '13.5px', color: '#f8fafc', lineHeight: '1.5', margin: 0, opacity: 0.95 }}>
                            Track student fees, record collection payments, print invoices, and view financial reports.
                        </p>
                    </div>
                    <div style={{
                        marginTop: 'auto', fontSize: '13px', fontWeight: 800, color: '#38bdf8',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        Enter Workspace &rarr;
                    </div>
                </div>

                {/* Card 2: Store */}
                <div className="portal-card" onClick={() => selectWorkspace('STORE')} style={{
                    animation: 'pulseGlow 4s infinite 1s'
                }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '16px',
                        background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', marginBottom: '8px'
                    }}>
                        📦
                    </div>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff' }}>Store Management</h2>
                        <p style={{ fontSize: '13.5px', color: '#f8fafc', lineHeight: '1.5', margin: 0, opacity: 0.95 }}>
                            Manage inventory, track stock inward/outward transactions, handle suppliers, and monitor low stock alerts.
                        </p>
                    </div>
                    <div style={{
                        marginTop: 'auto', fontSize: '13px', fontWeight: 800, color: '#c084fc',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        Enter Workspace &rarr;
                    </div>
                </div>

                {/* Card 3: System Diagnostics (Developer access only) */}
                {user.role === 'DEVELOPER' && (
                    <div className="portal-card" onClick={() => router.push('/system')} style={{
                        animation: 'pulseGlow 4s infinite 2s'
                    }}>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '16px',
                            background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '32px', marginBottom: '8px'
                        }}>
                            💻
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff' }}>System Diagnostics</h2>
                            <p style={{ fontSize: '13.5px', color: '#f8fafc', lineHeight: '1.5', margin: 0, opacity: 0.95 }}>
                                Monitor system uptime, check database vitals, configure global settings, and audit security events.
                            </p>
                        </div>
                        <div style={{
                            marginTop: 'auto', fontSize: '13px', fontWeight: 800, color: '#fbbf24',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            Control Center &rarr;
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={logout}
                style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--danger)',
                    padding: '10px 24px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    animation: 'fadeIn 1.2s ease forwards'
                }}
            >
                🚪 Sign Out
            </button>
        </div>
    );
}
