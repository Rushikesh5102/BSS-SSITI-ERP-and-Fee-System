'use client';

import React from 'react';
import { Target, Compass } from 'lucide-react';

export default function MissionVisionSection() {
  return (
    <section className="bss-mission-vision-section">
      <div className="bss-container">
        <div className="bss-mv-grid">
          
          {/* Mission Card */}
          <div className="bss-mv-card">
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(9, 121, 101, 0.12)', color: 'var(--bss-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Target size={24} />
            </div>
            <span className="bss-section-eyebrow">OUR COMMITMENT</span>
            <h3 style={{ fontFamily: 'var(--bss-font-heading)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--bss-navy)', marginBottom: '1rem' }}>
              Our Mission
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: 1.65, color: 'var(--bss-muted)', margin: 0 }}>
              Our mission is to provide accessible, affordable, and high-quality technical education that equips students with practical knowledge, industry-relevant skills, confidence, and values. We are committed to supporting innovation, encouraging lifelong learning, and creating opportunities for every learner irrespective of their background.
            </p>
          </div>

          {/* Vision Card */}
          <div className="bss-mv-card">
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(245, 181, 68, 0.18)', color: 'var(--bss-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Compass size={24} color="var(--bss-navy)" />
            </div>
            <span className="bss-section-eyebrow" style={{ color: 'var(--bss-navy)' }}>OUR HORIZON</span>
            <h3 style={{ fontFamily: 'var(--bss-font-heading)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--bss-navy)', marginBottom: '1rem' }}>
              Our Vision
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: 1.65, color: 'var(--bss-muted)', margin: 0 }}>
              To become a leading institution that transforms lives through excellence in technical education, vocational training, innovation, community engagement, and sustainable development while preparing future professionals who positively contribute to society.
            </p>
          </div>

        </div>
      </div>

      <style jsx>{`
        .bss-mv-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .bss-mv-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2.5rem;
          }
        }
      `}</style>
    </section>
  );
}
