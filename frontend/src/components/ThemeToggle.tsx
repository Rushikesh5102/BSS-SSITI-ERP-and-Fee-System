'use client';

import React, { useEffect, useState } from 'react';

interface ThemeToggleProps {
    variant?: 'switch' | 'compact' | 'sidebar';
    className?: string;
    onToggle?: (isDark: boolean) => void;
}

export default function ThemeToggle({
    variant = 'switch',
    className = '',
    onToggle,
}: ThemeToggleProps) {
    const [isDark, setIsDark] = useState<boolean>(false);
    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        setMounted(true);
        const checkTheme = () => {
            const hasDarkClass = document.documentElement.classList.contains('dark');
            setIsDark(hasDarkClass);
        };

        checkTheme();

        const handleThemeChange = () => checkTheme();
        window.addEventListener('theme-change', handleThemeChange);
        window.addEventListener('storage', handleThemeChange);

        return () => {
            window.removeEventListener('theme-change', handleThemeChange);
            window.removeEventListener('storage', handleThemeChange);
        };
    }, []);

    const toggleTheme = () => {
        const nextDark = !isDark;
        if (nextDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        setIsDark(nextDark);
        window.dispatchEvent(new Event('theme-change'));
        onToggle?.(nextDark);
    };

    if (!mounted) {
        // Prevent layout shift during SSR hydration with an identical placeholder
        return (
            <div
                className={`theme-toggle-placeholder ${className}`}
                style={{ width: variant === 'compact' ? 40 : 64, height: 36 }}
                aria-hidden="true"
            />
        );
    }

    if (variant === 'sidebar') {
        return (
            <button
                type="button"
                onClick={toggleTheme}
                className={`theme-toggle-sidebar ${className}`}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-pressed={isDark}
            >
                <div className="theme-toggle-sidebar-content">
                    <div className="theme-toggle-sidebar-icon">
                        {isDark ? (
                            <svg className="theme-svg moon-svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        ) : (
                            <svg className="theme-svg sun-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        )}
                    </div>
                    <span className="theme-toggle-sidebar-label">
                        {isDark ? 'Dark Appearance' : 'Light Appearance'}
                    </span>
                </div>
                <div className={`theme-pill-track ${isDark ? 'is-dark' : 'is-light'}`}>
                    <div className="theme-pill-thumb" />
                </div>
            </button>
        );
    }

    if (variant === 'compact') {
        return (
            <button
                type="button"
                onClick={toggleTheme}
                className={`theme-toggle-compact ${isDark ? 'is-dark' : 'is-light'} ${className}`}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-pressed={isDark}
            >
                <span className="theme-compact-orb">
                    {isDark ? (
                        <svg className="theme-svg moon-svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    ) : (
                        <svg className="theme-svg sun-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" />
                            <line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                    )}
                </span>
            </button>
        );
    }

    // Default: 'switch' — Iconic celestial sliding pill switch with sun/moon symbols and starry backdrop
    return (
        <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={toggleTheme}
            className={`theme-celestial-switch ${isDark ? 'is-dark' : 'is-light'} ${className}`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            <span className="theme-celestial-track">
                {/* Sun side */}
                <span className="theme-track-icon sun-track-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4" />
                        <line x1="12" y1="2" x2="12" y2="4" />
                        <line x1="12" y1="20" x2="12" y2="22" />
                        <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
                        <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
                        <line x1="2" y1="12" x2="4" y2="12" />
                        <line x1="20" y1="12" x2="22" y2="12" />
                        <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
                        <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
                    </svg>
                </span>

                {/* Moon side */}
                <span className="theme-track-icon moon-track-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                </span>

                {/* Glowing Sliding Orb */}
                <span className="theme-celestial-thumb" aria-hidden="true">
                    {isDark ? (
                        <svg className="thumb-icon moon-thumb-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    ) : (
                        <svg className="thumb-icon sun-thumb-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="4" />
                            <line x1="12" y1="2" x2="12" y2="4" />
                            <line x1="12" y1="20" x2="12" y2="22" />
                            <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
                            <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
                            <line x1="2" y1="12" x2="4" y2="12" />
                            <line x1="20" y1="12" x2="22" y2="12" />
                            <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
                            <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
                        </svg>
                    )}
                </span>
            </span>
        </button>
    );
}
