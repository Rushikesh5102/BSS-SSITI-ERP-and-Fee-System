'use client';

import { useEffect, useState } from 'react';

const roleConfig: Record<string, { title: string, icon: string, bg: string }> = {
    SUPERADMIN: { title: 'College Director', icon: '🏛️', bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f172a 100%)' },
    ADMIN: { title: 'Administrator', icon: '⚡', bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f172a 100%)' },
    ACCOUNTANT: { title: 'Accountant', icon: '🧾', bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f172a 100%)' },
    STUDENT: { title: 'Student', icon: '🎓', bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f172a 100%)' },
    DEVELOPER: { title: 'Developer', icon: '💻', bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f172a 100%)' },
    STORE_MANAGER: { title: 'Store Manager', icon: '📦', bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f172a 100%)' },
    LIBRARIAN: { title: 'Chief Librarian', icon: '📚', bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f172a 100%)' },
};

export default function WelcomeOverlay({ role }: { role: string }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
        }, 3000); // Complete animation and fade out duration
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

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
}
