import React from 'react';
import Navbar from '../../components/foundation/Navbar';
import Footer from '../../components/foundation/Footer';
import '../../styles/bss-foundation.css';

export const metadata = {
  title: 'Cookie Policy — BSS Foundation',
  description: 'Cookie policy and technical indicators used on BSS Foundation website.',
};

export default function CookiePolicyPage() {
  return (
    <div className="bss-root">
      <Navbar />
      
      <main className="bss-legal-page">
        <div className="bss-container" style={{ maxWidth: '52rem' }}>
          <div className="bss-legal-card">
            <span className="bss-section-eyebrow">TECHNICAL POLICY</span>
            <h1>Cookie Policy</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--bss-muted)' }}>
              Last updated: August 2026 | Bharat Shikshan Sanstha
            </p>

            <hr style={{ border: 0, borderTop: '1px solid var(--bss-border)', margin: '1.5rem 0' }} />

            <h2>1. Use of Cookies</h2>
            <p>
              BSS Foundation uses essential cookies and local browser storage strictly to remember donor session state, theme preferences, and form accessibility settings. We do not use intrusive third-party tracking cookies.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
