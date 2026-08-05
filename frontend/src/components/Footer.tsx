'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer style={{
            marginTop: 'auto',
            padding: '20px 24px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface-card)',
            color: 'var(--text-muted)',
            fontSize: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            width: '100%'
        }}>
            <div>
                © {new Date().getFullYear()} <b>Shri Sai I.T.I</b> Fee & Store Management System. All rights reserved.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <Link href="/terms" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                    📜 Terms & Conditions
                </Link>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>
                    Developed with ❤️ by <b style={{ color: 'var(--text-primary)' }}>Rushikesh Pattiwar</b>
                </span>
            </div>
        </footer>
    );
}
