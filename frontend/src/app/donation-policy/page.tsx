import React from 'react';
import Navbar from '../../components/foundation/Navbar';
import Footer from '../../components/foundation/Footer';
import '../../styles/bss-foundation.css';

export const metadata = {
  title: 'Donation Policy — BSS Foundation',
  description: 'Institutional donation policy and allocation guidelines of BSS Foundation.',
};

export default function DonationPolicyPage() {
  return (
    <div className="bss-root">
      <Navbar />
      
      <main className="bss-legal-page">
        <div className="bss-container" style={{ maxWidth: '52rem' }}>
          <div className="bss-legal-card">
            <span className="bss-section-eyebrow">INSTITUTIONAL POLICY</span>
            <h1>Donation Policy</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--bss-muted)' }}>
              Last updated: August 2026 | Bharat Shikshan Sanstha
            </p>

            <hr style={{ border: 0, borderTop: '1px solid var(--bss-border)', margin: '1.5rem 0' }} />

            <h2>1. Institutional Fund Allocation</h2>
            <p>
              100% of designated contributions received by BSS Foundation are directly matched to approved educational initiatives including student merit scholarships, practical workshop machinery, computer hardware, technical books, and safety upgrades.
            </p>

            <h2>2. Automatic Acknowledgements</h2>
            <p>
              Every donation processed online receives an immediate digital receipt and contribution voucher via email confirming receipt of funds and donor instructions.
            </p>

            <h2>3. Corporate & Institutional Contributions</h2>
            <p>
              Corporate CSR contributions, industrial sponsorships, and alumni grants are welcome and managed under dedicated project agreements supervised by institutional management.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
