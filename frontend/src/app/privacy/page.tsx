import React from 'react';
import Navbar from '../../components/foundation/Navbar';
import Footer from '../../components/foundation/Footer';
import '../../styles/bss-foundation.css';

export const metadata = {
  title: 'Privacy Policy — BSS Foundation',
  description: 'Privacy policy and data protection principles of BSS Foundation, Bharat Shikshan Sanstha.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bss-root">
      <Navbar />
      
      <main className="bss-legal-page">
        <div className="bss-container" style={{ maxWidth: '52rem' }}>
          <div className="bss-legal-card">
            <span className="bss-section-eyebrow">LEGAL DOCUMENTATION</span>
            <h1>Privacy Policy</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--bss-muted)' }}>
              Last updated: August 2026 | Bharat Shikshan Sanstha — Shri Sai Private ITI
            </p>

            <hr style={{ border: 0, borderTop: '1px solid var(--bss-border)', margin: '1.5rem 0' }} />

            <h2>1. Institutional Overview</h2>
            <p>
              BSS Foundation, the educational and social initiative of Bharat Shikshan Sanstha (Shri Sai Private Industrial Training Institute, Bhadrawati, Maharashtra), is committed to respecting and protecting the privacy of our donors, students, faculty, and website visitors.
            </p>

            <h2>2. Information We Collect</h2>
            <p>
              When you make a contribution, submit an inquiry, or subscribe to our updates, we collect personal information necessary to fulfill your request:
            </p>
            <ul>
              <li>Contact Details: Full name, email address, phone number, and postal address.</li>
              <li>Donation Data: Selected fund, contribution amount, frequency, and donor preferences (such as anonymous giving).</li>
              <li>Technical Logs: Standard browser details, IP address, and cookie indicators used solely for site security and performance.</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>
              Your data is utilized exclusively for official educational purposes:
            </p>
            <ul>
              <li>Issuing official tax-deductible donation receipts and acknowledgements.</li>
              <li>Communicating institutional milestones, scholarship allocations, and project updates.</li>
              <li>Responding to institutional inquiries and contact form communications.</li>
              <li>Ensuring payment gateway security and compliance.</li>
            </ul>

            <h2>4. Data Confidentiality & Protection</h2>
            <p>
              We do not sell, trade, rent, or lease donor databases or personal data to third parties. All financial transactions are processed over encrypted 256-bit SSL channels with strict PCI-DSS compliant banking partners.
            </p>

            <h2>5. Donor Rights & Contact</h2>
            <p>
              Donors have the right to request access to their transaction records or request removal from non-essential communications by contacting us at <strong>privacy@bssfoundation.org</strong> or <strong>info@bssfoundation.org</strong>.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
