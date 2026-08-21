'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function DonationTimeline() {
  const steps = [
    {
      number: '01',
      title: 'Contribution Received',
      description: 'Your contribution is securely received.',
    },
    {
      number: '02',
      title: 'Fund Matching',
      description: 'It is matched to your selected learning fund.',
    },
    {
      number: '03',
      title: 'Equipment & Buildout',
      description: 'Projects are equipped, built, and documented.',
    },
    {
      number: '04',
      title: 'Student Empowerment',
      description: 'Students put new resources into practice.',
    },
  ];

  return (
    <section className="bss-timeline-section">
      <div className="bss-container" style={{ position: 'relative', zIndex: 10 }}>
        
        {/* Section Header */}
        <div style={{ width: '100%', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bss-emerald-light)', display: 'block', marginBottom: '0.75rem' }}>
            Your generosity at work
          </span>
          <h2 className="bss-section-heading" style={{ color: '#ffffff' }}>
            From a moment of giving{' '}
            <span style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--bss-saffron)' }}>
              to a lifetime of possibility.
            </span>
          </h2>
        </div>

        {/* 4-Step Vertical Timeline */}
        <div className="bss-timeline-container">
          <div className="bss-timeline-line"></div>

          {steps.map((step, idx) => (
            <div key={idx} className="bss-timeline-item">
              <div className="bss-timeline-step-badge">
                {step.number}
              </div>

              <div className="bss-timeline-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <CheckCircle2 size={16} color="var(--bss-emerald-light)" />
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: 'var(--bss-emerald-light)' }}>
                    Step {step.number}
                  </span>
                </div>
                <h3 style={{ fontFamily: "var(--bss-font-heading)", fontSize: '1.15rem', fontWeight: 500, color: '#ffffff', margin: '0 0 0.35rem 0' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.9375rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0, lineHeight: 1.55 }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

      <style jsx>{`
        .bss-timeline-container {
          position: relative;
          max-width: 48rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .bss-timeline-line {
          position: absolute;
          left: 23px;
          top: 24px;
          bottom: 24px;
          width: 2px;
          background: linear-gradient(180deg, var(--bss-emerald), var(--bss-saffron), rgba(9, 121, 101, 0.3));
          display: none;
        }

        .bss-timeline-item {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: relative;
        }

        @media (min-width: 640px) {
          .bss-timeline-line {
            display: block;
          }
          .bss-timeline-item {
            flex-direction: row;
            align-items: flex-start;
            gap: 2rem;
          }
        }
      `}</style>
    </section>
  );
}
