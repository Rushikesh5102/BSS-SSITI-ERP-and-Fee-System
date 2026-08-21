import React from 'react';
import Navbar from '../../components/foundation/Navbar';
import Footer from '../../components/foundation/Footer';
import '../../styles/bss-foundation.css';

export const metadata = {
  title: 'Accessibility Statement — BSS Foundation',
  description: 'Accessibility commitments and standards at BSS Foundation.',
};

export default function AccessibilityPage() {
  return (
    <div className="bss-root">
      <Navbar />
      
      <main className="bss-legal-page">
        <div className="bss-container" style={{ maxWidth: '52rem' }}>
          <div className="bss-legal-card">
            <span className="bss-section-eyebrow">ACCESSIBILITY COMMITMENT</span>
            <h1>Accessibility Statement</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--bss-muted)' }}>
              Last updated: August 2026 | Bharat Shikshan Sanstha
            </p>

            <hr style={{ border: 0, borderTop: '1px solid var(--bss-border)', margin: '1.5rem 0' }} />

            <h2>1. Universal Access</h2>
            <p>
              BSS Foundation is dedicated to ensuring digital accessibility for all users, including individuals with visual, auditory, cognitive, or motor impairments.
            </p>

            <h2>2. Standards & Features</h2>
            <p>
              Our website follows WCAG 2.1 AA guidelines, incorporating high color contrast ratios, keyboard-navigable focus states, screen-reader friendly ARIA labels, skip-to-content links, and automatic reduced-motion detection for WebGL components.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
