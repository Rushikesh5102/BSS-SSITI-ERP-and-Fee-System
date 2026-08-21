import React from 'react';
import Navbar from '../../components/foundation/Navbar';
import Footer from '../../components/foundation/Footer';
import '../../styles/bss-foundation.css';

export const metadata = {
  title: 'Disclaimer — BSS Foundation',
  description: 'Legal disclaimer for BSS Foundation platform and Bharat Shikshan Sanstha.',
};

export default function DisclaimerPage() {
  return (
    <div className="bss-root">
      <Navbar />
      
      <main className="bss-legal-page">
        <div className="bss-container" style={{ maxWidth: '52rem' }}>
          <div className="bss-legal-card">
            <span className="bss-section-eyebrow">LEGAL NOTICE</span>
            <h1>Disclaimer</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--bss-muted)' }}>
              Last updated: August 2026 | Bharat Shikshan Sanstha
            </p>

            <hr style={{ border: 0, borderTop: '1px solid var(--bss-border)', margin: '1.5rem 0' }} />

            <h2>1. General Information</h2>
            <p>
              The information provided on the BSS Foundation website is for educational and fundraising purposes relating to Bharat Shikshan Sanstha and Shri Sai Private Industrial Training Institute.
            </p>

            <h2>2. Official Institutional Details</h2>
            <p>
              Official accreditation details, NCVT/DGET affiliation numbers, trade recognitions, and annual audited statements may be inspected upon request at our administrative office in Bhadrawati, District Chandrapur, Maharashtra.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
