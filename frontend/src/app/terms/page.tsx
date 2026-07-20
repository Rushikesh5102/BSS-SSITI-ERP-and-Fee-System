'use client';

import { useRouter } from 'next/navigation';

export default function TermsAndConditions() {
    const router = useRouter();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
            <header className="header" style={{ position: 'relative' }}>
                <div>
                    <div className="header-title" style={{ color: 'white' }}>Shri Sai I.T.I</div>
                    <div className="header-subtitle" style={{ color: 'var(--sidebar-text)' }}>Fee Management System</div>
                </div>
                <div className="header-actions">
                    <button onClick={() => router.back()} className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}>
                        ← Go Back
                    </button>
                </div>
            </header>
            
            <main style={{ flex: 1, padding: '40px 24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <div className="card" style={{ border: 'none', boxShadow: 'none', background: 'var(--surface)' }}>
                    <div className="card-header" style={{ padding: '24px 32px', background: 'transparent', borderBottom: '1px solid var(--border)' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>Terms and Conditions</h1>
                        <p className="text-muted" style={{ marginTop: '8px' }}>Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="card-body" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px', lineHeight: 1.7, background: 'var(--surface)' }}>
                        
                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>1. Introduction</h2>
                            <p className="text-secondary" style={{ color: 'var(--text-secondary)' }}>Welcome to the Shri Sai I.T.I Fee Management System. By accessing or using this portal, you agree to be bound by these Terms and Conditions. Please read them carefully before proceeding with any fee payments or utilizing our online services.</p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>2. Online Fee Payment</h2>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-secondary)' }}>
                                <li>All fee payments made through this portal are strictly for educational services provided by Shri Sai I.T.I.</li>
                                <li>The portal accepts payments via integrated secure payment gateways. The Institute does not store your credit/debit card details or net banking credentials.</li>
                                <li>Please ensure you have a stable internet connection during the transaction. Do not refresh or close the browser window while a payment is processing.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>3. Refund and Cancellation Policy</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Fees once paid are generally non-refundable. However, in the event of a technical error resulting in a double payment or an excessive deduction:</p>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', color: 'var(--text-secondary)' }}>
                                <li>The student or parent must contact the administration office within 48 hours of the transaction.</li>
                                <li>Valid proof of double deduction (bank statement or transaction receipt) must be provided.</li>
                                <li>If verified, the excess amount will be adjusted against future dues or refunded to the original payment method within 7-10 working days.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>4. User Responsibilities</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>As a user of this system, you are responsible for maintaining the confidentiality of your login credentials. Any activity occurring under your account is your responsibility. You agree to provide accurate and up-to-date information when interacting with the system.</p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>5. Privacy and Data Security</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Your privacy is important to us. All personal and academic data is encrypted and used solely for administrative and academic purposes within Shri Sai I.T.I. We do not share your information with third-party marketing agencies.</p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>6. System Availability</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>While we strive for 99.9% uptime, the Fee Management System may occasionally be unavailable due to scheduled maintenance or unforeseen technical difficulties. We are not liable for any delays in payment caused by such downtime, provided the student initiates the payment in a reasonable timeframe.</p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>7. Contact Information</h2>
                            <p style={{ color: 'var(--text-secondary)', background: 'var(--surface-2)', padding: '16px', borderRadius: '8px' }}>
                                For any payment-related disputes or technical assistance, please contact the administration:<br/>
                                <br/>
                                <strong>Bharat Shikshan Sanstha's Shri Sai Private I.T.I</strong><br/>
                                📍 <b>Address:</b> Shri Sai I.T.I, Jain Mandir Rd, Ramnagar, Bhadravati, Maharashtra 442902<br/>
                                🏛️ <b>I.T.I Registration No:</b> I.T.I.- 2011/P.K.11/V.S.-03 DGET-06/13/2/2013-TC<br/>
                                📞 <b>Phone:</b> +91 9529054868<br/>
                                ✉️ <b>Email:</b> saiiti151@gmail.com<br/>
                                🕒 <b>Working Hours:</b> Monday - Saturday, 9:00 AM - 5:00 PM
                            </p>
                        </section>

                    </div>
                </div>
            </main>

            <footer className="footer" style={{ justifyContent: 'center' }}>
                <div>&copy; {new Date().getFullYear()} Shri Sai I.T.I All rights reserved. Developed by Rushikesh Pattiwar.</div>
            </footer>
        </div>
    );
}
