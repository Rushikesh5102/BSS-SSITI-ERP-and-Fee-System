'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer app-footer" role="contentinfo">
            <div className="footer-brand">
                <span className="footer-copy">© {new Date().getFullYear()}</span>
                <strong className="footer-institute">Shri Sai I.T.I</strong>
                <span className="footer-brand-sep" aria-hidden="true">•</span>
                <span className="footer-tagline">Fee & Institutional ERP System</span>
            </div>

            <div className="footer-links-group">
                <div className="footer-nav-links">
                    <Link href="/terms" className="footer-link">
                        Terms & Conditions
                    </Link>
                    <span className="footer-sep" aria-hidden="true">•</span>
                    <Link href="/privacy" className="footer-link">
                        Privacy Policy
                    </Link>
                </div>

                <span className="footer-sep footer-sep-desktop" aria-hidden="true">•</span>

                <div className="footer-credit">
                    <span className="footer-credit-text">Crafted with</span>
                    <span className="footer-heart" aria-label="love">❤️</span>
                    <span className="footer-credit-text">by</span>
                    <strong className="footer-author-name">Rushikesh Pattiwar</strong>
                </div>
            </div>
        </footer>
    );
}
