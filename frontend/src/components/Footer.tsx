'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer" style={{
            marginTop: 'auto',
            minHeight: '52px',
            padding: '16px 28px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface-card)',
            color: '#475569',
            fontSize: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
        }}>
            <div style={{ color: '#475569' }}>
                © {new Date().getFullYear()} <b style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Shri Sai I.T.I</b> Fee & Store Management System. All rights reserved.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <Link href="/terms" style={{ color: '#334155', textDecoration: 'none', fontWeight: 600 }}>
                    📜 Terms & Conditions
                </Link>
                <span style={{ color: '#94a3b8', opacity: 0.6 }}>•</span>
                <span style={{ color: '#475569' }}>
                    Developed with ❤️ by <b style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Rushikesh Pattiwar</b>
                </span>
            </div>
        </footer>
    );
}
