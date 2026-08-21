'use client';

import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';

export default function TransparencySection() {
  const points = [
    'We believe trust is earned through transparency.',
    'Every contribution is securely recorded.',
    'Funds are allocated only towards approved educational initiatives.',
    'Donation acknowledgements are generated automatically.',
    'Financial records are maintained responsibly.',
    'Institutional management regularly reviews fund utilization.',
  ];

  const trustBadges = [
    'Secure Donations',
    'Transparent Fund Usage',
    'Educational Institution',
    'Community Impact',
    'Data Privacy Protected',
  ];

  return (
    <section className="bss-transparency-section">
      <div className="bss-container">
        
        {/* Section Header */}
        <div style={{ width: '100%', marginBottom: '3rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bss-emerald-light)', display: 'block', marginBottom: '0.75rem' }}>
            TRANSPARENCY & ACCOUNTABILITY
          </span>
          <h2 className="bss-section-heading" style={{ color: '#ffffff', marginBottom: '1.25rem' }}>
            Every Contribution Matters.{' '}
            <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--bss-saffron)', display: 'inline-block', whiteSpace: 'nowrap' }}>
              Built on Trust.
            </span>
          </h2>
        </div>

        {/* Content & Points */}
        <div className="bss-transparency-grid">
          
          {/* Left Column: Key Principles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {points.map((pt, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '1rem 1.25rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--bss-emerald)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Check size={14} />
                </div>
                <span style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.5 }}>
                  {pt}
                </span>
              </div>
            ))}
          </div>

          {/* Right Column: Institutional Trust Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '2rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={28} color="var(--bss-saffron)" />
              <div>
                <h3 style={{ fontFamily: 'var(--bss-font-heading)', fontSize: '1.25rem', color: '#ffffff', margin: 0 }}>
                  Institutional Accountability
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
                  Governed by Bharat Shikshan Sanstha
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {trustBadges.map((badge, idx) => (
                <div key={idx} className="bss-trust-badge">
                  <Check size={15} color="var(--bss-emerald-light)" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      <style jsx>{`
        .bss-transparency-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }

        @media (min-width: 1024px) {
          .bss-transparency-grid {
            grid-template-columns: 7fr 5fr;
            gap: 3.5rem;
            align-items: center;
          }
        }
      `}</style>
    </section>
  );
}
