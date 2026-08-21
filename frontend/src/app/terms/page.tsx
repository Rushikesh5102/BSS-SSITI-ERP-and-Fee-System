import React from 'react';
import Navbar from '../../components/foundation/Navbar';
import Footer from '../../components/foundation/Footer';
import '../../styles/bss-foundation.css';

export const metadata = {
  title: 'Terms & Conditions — BSS Foundation',
  description: 'Terms and conditions governing the use of the BSS Foundation educational platform.',
};

export default function TermsPage() {
  return (
    <div className="bss-root">
      <Navbar />
      
      <main className="bss-legal-page">
        <div className="bss-container" style={{ maxWidth: '52rem' }}>
          <div className="bss-legal-card">
            <span className="bss-section-eyebrow">LEGAL DOCUMENTATION</span>
            <h1>Terms & Conditions</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--bss-muted)' }}>
              Last updated: August 2026 | Bharat Shikshan Sanstha
            </p>

            <hr style={{ border: 0, borderTop: '1px solid var(--bss-border)', margin: '1.5rem 0' }} />

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and utilizing the BSS Foundation website and giving platform, you agree to comply with and be bound by the following terms and conditions governed by Bharat Shikshan Sanstha (Shri Sai Private ITI, Bhadrawati).
            </p>

            <h2>2. Purpose of Platform</h2>
            <p>
              This website serves as an educational institution fundraising platform dedicated to supporting student scholarships, workshop equipment procurement, laboratory modernization, library expansion, and campus infrastructure development.
            </p>

            <h2>3. Voluntary Giving & Use of Funds</h2>
            <p>
              All contributions made on this platform are voluntary gifts intended for educational development. Funds are managed responsibly by the institutional governing body of Bharat Shikshan Sanstha and allocated to designated educational initiatives.
            </p>

            <h2>4. Intellectual Property</h2>
            <p>
              All institutional logos, brand monograms, photographs, curriculum references, and web design elements belong exclusively to Bharat Shikshan Sanstha and BSS Foundation.
            </p>

            <h2>5. Governing Law & Jurisdiction</h2>
            <p>
              These terms shall be construed and governed in accordance with the laws of India, under the jurisdiction of the courts of Chandrapur, Maharashtra.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
