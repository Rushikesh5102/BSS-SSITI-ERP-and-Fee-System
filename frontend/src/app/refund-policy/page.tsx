import React from 'react';
import Navbar from '../../components/foundation/Navbar';
import Footer from '../../components/foundation/Footer';
import '../../styles/bss-foundation.css';

export const metadata = {
  title: 'Refund & Cancellation Policy — BSS Foundation',
  description: 'Refund policy guidelines for donations made to BSS Foundation.',
};

export default function RefundPolicyPage() {
  return (
    <div className="bss-root">
      <Navbar />
      
      <main className="bss-legal-page">
        <div className="bss-container" style={{ maxWidth: '52rem' }}>
          <div className="bss-legal-card">
            <span className="bss-section-eyebrow">INSTITUTIONAL POLICY</span>
            <h1>Refund & Cancellation Policy</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--bss-muted)' }}>
              Last updated: August 2026 | Bharat Shikshan Sanstha
            </p>

            <hr style={{ border: 0, borderTop: '1px solid var(--bss-border)', margin: '1.5rem 0' }} />

            <h2>1. Voluntary Contributions</h2>
            <p>
              As a non-profit educational institution fundraising initiative, contributions made to BSS Foundation are generally non-refundable once allocated to active educational funds.
            </p>

            <h2>2. Duplicate or Erroneous Transactions</h2>
            <p>
              In the event of an accidental duplicate transaction or technical payment processing error, donors may submit a refund request within 7 days of the transaction date by emailing <strong>support@bssfoundation.org</strong> with payment transaction details. Verified duplicate amounts will be refunded to the original payment source.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
