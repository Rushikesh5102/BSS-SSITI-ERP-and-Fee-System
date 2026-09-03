'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ opacity: 0.9 }}>© {new Date().getFullYear()}</span>
                <b style={{ color: '#ffffff', fontWeight: 800, letterSpacing: '0.3px' }}>Shri Sai I.T.I</b>
                <span style={{ opacity: 0.85 }}>Fee & Institutional ERP System</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <Link href="/terms" className="footer-link">
                    Terms & Conditions
                </Link>
                <span style={{ opacity: 0.45, userSelect: 'none' }}>•</span>
                <Link href="/privacy" className="footer-link">
                    Privacy Policy
                </Link>
                <span style={{ opacity: 0.45, userSelect: 'none' }}>•</span>
                <span style={{ opacity: 0.9 }}>
                    Crafted with ❤️ by <b style={{ color: '#ffffff', fontWeight: 800 }}>Rushikesh Pattiwar</b>
                </span>
            </div>
        </footer>
    );
}


