'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // 30s Server Cold-Start Waking Up States
    const [isWakingUp, setIsWakingUp] = useState(false);
    const [countdown, setCountdown] = useState(30);
    const [retryAttempt, setRetryAttempt] = useState(1);
    const retryCredentialsRef = useRef<{ email: string; pass: string } | null>(null);

    const performLogin = async (targetEmail: string, targetPass: string) => {
        setError('');
        setLoading(true);
        try {
            await login(targetEmail, targetPass);
            setIsWakingUp(false);
        } catch (err: any) {
            const isNetworkOrColdStart = 
                !err.response || 
                err.code === 'ECONNABORTED' || 
                err.message?.includes('Network Error') ||
                err.message?.includes('timeout') ||
                [502, 503, 504].includes(err.response?.status);

            if (isNetworkOrColdStart) {
                // Cloud instance is spinning up — trigger 30s auto-retry timer
                retryCredentialsRef.current = { email: targetEmail, pass: targetPass };
                setIsWakingUp(true);
                setCountdown(30);
            } else {
                setIsWakingUp(false);
                setError(err.response?.data?.message || err.message || 'Login failed. Please check credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await performLogin(email, password);
    };

    // Live 30s Countdown & Auto-Retry Loop
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isWakingUp && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (isWakingUp && countdown === 0) {
            // Trigger auto-retry
            if (retryCredentialsRef.current) {
                setRetryAttempt((prev) => prev + 1);
                performLogin(retryCredentialsRef.current.email, retryCredentialsRef.current.pass);
            }
        }
        return () => clearInterval(timer);
    }, [isWakingUp, countdown]);

    // Active Health Probing every 5s during countdown
    useEffect(() => {
        if (isWakingUp && countdown > 0 && countdown % 5 === 0) {
            api.get('/health', { timeout: 3500 })
                .then(() => {
                    // Server is alive! Trigger login immediately
                    if (retryCredentialsRef.current) {
                        performLogin(retryCredentialsRef.current.email, retryCredentialsRef.current.pass);
                    }
                })
                .catch(() => {
                    // Still booting up, continue countdown
                });
        }
    }, [isWakingUp, countdown]);

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

    const cancelWakingUp = () => {
        setIsWakingUp(false);
        retryCredentialsRef.current = null;
        setError('Connection attempt cancelled.');
    };

    return (
        <div className="login-page">
            <button 
                onClick={toggleTheme}
                style={{
                    position: 'absolute', top: 20, right: 20, padding: '8px 16px',
                    background: isDark ? '#1e293b' : '#ffffff',
                    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    borderRadius: '100px', cursor: 'pointer', zIndex: 10,
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', fontWeight: 700,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
                }}
            >
                {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
            <div className="login-card">
                <div className="login-logo">
                    <div style={{
                        width: '110px', height: '110px', margin: '0 auto 14px',
                        background: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <img
                            src="/sai_iti_logo.png"
                            alt="Shri Sai I.T.I Logo"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 32px rgba(56, 189, 248, 0.8))'
                            }}
                        />
                    </div>
                    <h1>Shri Sai I.T.I</h1>
                    <p>Fee & Institutional Management System</p>
                </div>

                {/* 30s Server Cold-Start Waking Up Notice */}
                {isWakingUp && (
                    <div
                        style={{
                            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.15), rgba(56, 189, 248, 0.15))',
                            border: '1px solid #38bdf8',
                            borderRadius: '14px',
                            padding: '16px',
                            marginBottom: '20px',
                            textAlign: 'left'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2.5px', borderColor: '#38bdf8' }} />
                            <strong style={{ color: '#0284c7', fontSize: '14px' }}>
                                Cloud Server Starting Up (Attempt #{retryAttempt})
                            </strong>
                        </div>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                            Free cloud instances sleep after inactivity and require ~25-30s to boot up. System will auto-connect in:
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#0284c7' }}>
                                ⏳ Connecting in {countdown}s...
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (retryCredentialsRef.current) {
                                            performLogin(retryCredentialsRef.current.email, retryCredentialsRef.current.pass);
                                        }
                                    }}
                                    style={{
                                        background: '#0284c7', color: '#fff', border: 'none',
                                        padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer'
                                    }}
                                >
                                    ⚡ Retry Now
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelWakingUp}
                                    style={{
                                        background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)',
                                        padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {error && !isWakingUp && (
                        <div
                            style={{
                                background: '#fee2e2',
                                color: '#991b1b',
                                padding: '10px 14px',
                                borderRadius: 10,
                                fontSize: 13,
                                marginBottom: 16,
                                border: '1px solid #fecaca',
                                textAlign: 'left',
                            }}
                        >
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label className="form-label">
                            Email Address <span className="required">*</span>
                        </label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="admin@saiiti.edu.in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label className="form-label">
                            Password <span className="required">*</span>
                        </label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full btn-lg"
                        disabled={loading || isWakingUp}
                        style={{ justifyContent: 'center', marginTop: 16, background: 'var(--primary-dark)', borderColor: 'var(--primary-dark)', padding: '12px' }}
                    >
                        {loading || isWakingUp ? (
                            <>
                                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                Connecting to System...
                            </>
                        ) : (
                            '🔐 Sign In'
                        )}
                    </button>
                </form>

                <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Shri Sai Private ITI • Authorized Personnel Access Only</span>
                </div>
            </div>
        </div>
    );
}
