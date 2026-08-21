'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().length > 0) {
      setSubscribed(true);
    }
  };

  return (
    <section className="bss-newsletter-section">
      <div className="bss-container" style={{ maxWidth: '46rem' }}>
        <div style={{ backgroundColor: 'var(--bss-bg)', border: '1px solid var(--bss-border)', borderRadius: '8px', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 4px 16px rgba(17, 40, 64, 0.04)' }}>
          
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(9, 121, 101, 0.1)', color: 'var(--bss-emerald)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Mail size={22} />
          </div>

          <span className="bss-section-eyebrow" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
            NEWSLETTER
          </span>
          
          <h2 className="bss-section-heading" style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
            Stay Connected
          </h2>
          
          <p style={{ fontSize: '0.95rem', color: 'var(--bss-muted)', lineHeight: 1.6, maxWidth: '32rem', margin: '0 auto 1.75rem auto' }}>
            Receive updates about educational initiatives, scholarships, workshops, student success stories, and community programs.
          </p>

          {subscribed ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(9, 121, 101, 0.12)', color: 'var(--bss-emerald)', padding: '0.75rem 1.5rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
              <CheckCircle2 size={18} />
              <span>Thank you for subscribing! Updates will be sent to {email}.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', maxWidth: '30rem', margin: '0 auto' }}>
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bss-form-input"
                style={{ flex: 1, minWidth: '220px' }}
              />
              <button
                type="submit"
                className="bss-btn-primary"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                Subscribe
              </button>
            </form>
          )}

        </div>
      </div>
    </section>
  );
}
