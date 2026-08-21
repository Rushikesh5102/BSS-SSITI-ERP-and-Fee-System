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
    const [isDark, setIsDark] = useState(true);

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
                background: '#090514'
            }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, borderColor: '#a855f7' }} />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at top, #240d4a 0%, #13072e 45%, #080314 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            padding: '40px 16px',
            fontFamily: "'Inter', sans-serif",
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Ambient Background Glow Spotlights */}
            <div style={{
                position: 'absolute',
                top: '-100px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '600px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(99, 102, 241, 0.1) 60%, transparent 80%)',
                filter: 'blur(60px)',
                pointerEvents: 'none'
            }} />

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
                .portal-hub-card {
                    background: rgba(22, 12, 46, 0.7);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(168, 85, 247, 0.2);
                    border-radius: 20px;
                    padding: 30px 24px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
                    position: relative;
                    overflow: hidden;
                }
                .portal-hub-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 3px;
                    background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.8), transparent);
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .portal-hub-card:hover {
                    transform: translateY(-8px);
                    background: rgba(35, 18, 74, 0.85);
                    border-color: rgba(192, 132, 252, 0.6);
                    box-shadow: 0 20px 45px rgba(124, 58, 237, 0.25);
                }
                .portal-hub-card:hover::before {
                    opacity: 1;
                }
            `}</style>

            {/* Hub Header */}
            <div style={{
                textAlign: 'center',
                maxWidth: '680px',
                marginBottom: '36px',
                animation: 'fadeIn 0.8s ease forwards',
                zIndex: 1
            }}>
                {/* Logo Frame */}
                <div style={{
                    width: '120px', height: '120px', margin: '0 auto 16px',
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
                            filter: 'drop-shadow(0 0 24px rgba(168, 85, 247, 0.9)) drop-shadow(0 0 45px rgba(99, 102, 241, 0.7))'
                        }}
                    />
                </div>

                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(168, 85, 247, 0.18)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    padding: '4px 14px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#e9d5ff',
                    letterSpacing: '1px',
                    marginBottom: '12px',
                    textTransform: 'uppercase'
                }}>
                    <span>✦</span> CENTRAL MISSION CONTROL & WORKSPACE HUB
                </div>

                <h1 style={{
                    fontSize: 'clamp(28px, 6vw, 40px)',
                    fontWeight: 900,
                    letterSpacing: '-0.5px',
                    margin: '0 0 8px 0',
                    color: '#ffffff',
                    textShadow: '0 4px 20px rgba(168, 85, 247, 0.4)'
                }}>
                    Bharat Shikshan Sanstha
                </h1>
                <p style={{
                    fontSize: 'clamp(14px, 3.5vw, 16px)',
                    color: '#d8b4fe',
                    fontWeight: 600,
                    margin: 0
                }}>
                    Shri Sai I.T.I Integrated ERP Platform
                </p>
            </div>

            {/* Workspace Modules Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                width: '100%',
                maxWidth: '1040px',
                animation: 'fadeIn 1s ease 0.1s forwards',
                marginBottom: '36px',
                zIndex: 1
            }}>
                {/* Card 0: System Diagnostics / Dev Home */}
                {user.role === 'DEVELOPER' && (
                    <div className="portal-hub-card" onClick={() => router.push('/system')}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '16px',
                            background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '28px'
                        }}>
                            💻
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#fef3c7' }}>Dev Control Center</h2>
                            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                                Live database vitals, incident blackbox ledger, self-healing station, and storage recovery.
                            </p>
                        </div>
                        <div style={{
                            marginTop: 'auto', fontSize: '12.5px', fontWeight: 800, color: '#fbbf24',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            Open Terminal &rarr;
                        </div>
                    </div>
                )}

                {/* Card 1: Fees */}
                <div className="portal-hub-card" onClick={() => selectWorkspace('FEES')}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        background: 'rgba(16, 185, 129, 0.18)', color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '28px'
                    }}>
                        💰
                    </div>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#ecfdf5' }}>Fee Management</h2>
                        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                            Student fee ledgers, multi-mode receipt collections, invoice generator, and dues analytics.
                        </p>
                    </div>
                    <div style={{
                        marginTop: 'auto', fontSize: '12.5px', fontWeight: 800, color: '#34d399',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        Enter Fee Hub &rarr;
                    </div>
                </div>

                {/* Card 2: Store & Workshop */}
                <div className="portal-hub-card" onClick={() => selectWorkspace('STORE')}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        background: 'rgba(6, 182, 212, 0.18)', color: '#22d3ee',
                        border: '1px solid rgba(6, 182, 212, 0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '28px'
                    }}>
                        📦
                    </div>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#ecfeff' }}>Store & Workshop</h2>
                        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                            Workshop tools registry, stock inward/outward transactions, supplier logs, and equipment issues.
                        </p>
                    </div>
                    <div style={{
                        marginTop: 'auto', fontSize: '12.5px', fontWeight: 800, color: '#22d3ee',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        Enter Inventory &rarr;
                    </div>
                </div>

                {/* Card 3: Library */}
                <div className="portal-hub-card" onClick={() => selectWorkspace('LIBRARY')}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        background: 'rgba(168, 85, 247, 0.18)', color: '#c084fc',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '28px'
                    }}>
                        📚
                    </div>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#faf5ff' }}>Library Catalog</h2>
                        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                            Accession book registry, student/staff issue and return circulation, and overdue fine engine.
                        </p>
                    </div>
                    <div style={{
                        marginTop: 'auto', fontSize: '12.5px', fontWeight: 800, color: '#c084fc',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        Enter Library &rarr;
                    </div>
                </div>

                {/* Card 4: Donation & 80G Foundation */}
                <div className="portal-hub-card" onClick={() => selectWorkspace('DONATION')}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        background: 'rgba(244, 63, 94, 0.18)', color: '#fb7185',
                        border: '1px solid rgba(244, 63, 94, 0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '28px'
                    }}>
                        🎗️
                    </div>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#fff1f2' }}>Donations & 80G</h2>
                        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                            BSS Foundation donor registry, 80G tax receipts, Form 10BD electronic return, and campaigns.
                        </p>
                    </div>
                    <div style={{
                        marginTop: 'auto', fontSize: '12.5px', fontWeight: 800, color: '#fb7185',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        Enter Foundation &rarr;
                    </div>
                </div>
            </div>

            <button
                onClick={logout}
                style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#f87171',
                    padding: '8px 20px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    marginBottom: 24,
                    zIndex: 1
                }}
            >
                🚪 Sign Out of Session
            </button>

            <Footer />
        </div>
    );
}
