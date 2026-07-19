'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = async (demoEmail: string, demoPass: string) => {
        setEmail(demoEmail);
        setPassword(demoPass);
        setError('');
        setLoading(true);
        try {
            await login(demoEmail, demoPass);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
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
                        width: '70px', height: '70px', margin: '0 auto 12px',
                        background: '#ffffff', borderRadius: '16px', padding: '8px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <img src="/sai_iti_logo.png" alt="Shri Sai I.T.I Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <h1>Shri Sai I.T.I</h1>
                    <p>Fee Management System</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
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
                        disabled={loading}
                        style={{ justifyContent: 'center', marginTop: 12, background: 'var(--primary-dark)', borderColor: 'var(--primary-dark)' }}
                    >
                        {loading ? (
                            <>
                                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                Signing In...
                            </>
                        ) : (
                            '🔐 Sign In'
                        )}
                    </button>
                </form>

                {/* Demo Logins */}
                <div
                    style={{
                        marginTop: 24,
                        padding: '16px',
                        background: 'var(--surface-2)',
                        borderRadius: 14,
                        fontSize: 13,
                        color: 'var(--text-muted)',
                        textAlign: 'left'
                    }}
                >
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 12, textAlign: 'center' }}>Test the Demo Instantly:</strong>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button 
                            type="button"
                            onClick={() => quickLogin('admin@saiiti.edu.in', 'Admin@123')}
                            className="btn btn-secondary w-full"
                            disabled={loading}
                            style={{ justifyContent: 'center' }}
                        >
                            👨‍💼 Login as Branch Admin
                        </button>

                        <button 
                            type="button"
                            onClick={() => quickLogin('accountant@saiiti.edu.in', 'Accountant@123')}
                            className="btn btn-secondary w-full"
                            disabled={loading}
                            style={{ justifyContent: 'center' }}
                        >
                            🧾 Login as Accountant
                        </button>
                        
                        <button 
                            type="button"
                            onClick={() => quickLogin('teacher@saiiti.edu.in', 'Teacher@123')}
                            className="btn btn-secondary w-full"
                            disabled={loading}
                            style={{ justifyContent: 'center' }}
                        >
                            👨‍🏫 Login as Teacher
                        </button>

                        <button 
                            type="button"
                            onClick={() => quickLogin('sai-2024-001@student.saiiti.edu.in', 'SAI-2024-001')}
                            className="btn btn-secondary w-full"
                            disabled={loading}
                            style={{ justifyContent: 'center' }}
                        >
                            🎓 Login as Student
                        </button>

                        <button 
                            type="button"
                            onClick={() => quickLogin('pattiwarrushikesh5102@gmail.com', 'Rushikesh@5102')}
                            className="btn btn-primary w-full"
                            disabled={loading}
                            style={{ justifyContent: 'center', marginTop: 4, background: '#0f172a', borderColor: '#0f172a' }}
                        >
                            💻 Developer / System Health
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
