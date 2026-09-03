'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>© {new Date().getFullYear()}</span>
                <b style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Shri Sai I.T.I</b>
                <span style={{ opacity: 0.8 }}>Fee & Institutional ERP System</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <Link href="/terms" className="footer-link">
                    Terms & Conditions
                </Link>
                <span style={{ opacity: 0.35, userSelect: 'none' }}>•</span>
                <Link href="/privacy" className="footer-link">
                    Privacy Policy
                </Link>
                <span style={{ opacity: 0.35, userSelect: 'none' }}>•</span>
                <span>
                    Crafted with ❤️ by <b style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Rushikesh Pattiwar</b>
                </span>
            </div>
        </footer>
    );
}

