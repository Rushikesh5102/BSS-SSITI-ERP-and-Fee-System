'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface StorySectionProps {
  onOpenDonate: () => void;
}

export default function StorySection({ onOpenDonate }: StorySectionProps) {
  return (
    <section id="stories" style={{ width: '100%', paddingTop: '4.5rem', paddingBottom: '4.5rem', backgroundColor: 'var(--bss-bg)', borderTop: '1px solid var(--bss-border)' }}>
      <div className="bss-container">
        <div className="bss-story-grid">
          
          {/* Left Column: Navy/Emerald Editorial Visual Block */}
          <div className="bss-story-visual-col">
            <div className="bss-editorial-card">
              <div className="bss-accent-bar"></div>

              {/* Large 01 Editorial Number */}
              <div className="bss-editorial-number">
                01
              </div>

              <div style={{ position: 'relative', zIndex: 10 }}>
                <span className="bss-spotlight-badge">
                  <Sparkles size={12} color="#f5b544" /> Impact Spotlight
                </span>
                <h3 className="bss-editorial-title">
                  Real progress, visible in the work.
                </h3>
                <p className="bss-editorial-text">
                  Every donor contribution directly provisions precision instruments, benchtop supplies, and student merit awards.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Copy & CTA */}
          <div className="bss-story-copy-col">
            <span className="bss-section-eyebrow">
              A shared investment
            </span>

            <h2 className="bss-section-heading" style={{ marginBottom: '1.5rem' }}>
              Workshops that turn{' '}
              <span style={{ fontStyle: 'italic', fontWeight: 400 }}>curiosity into capability.</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1rem', color: 'var(--bss-muted)', lineHeight: 1.65, marginBottom: '2rem' }}>
              <p style={{ margin: 0 }}>
                Hands-on practical training is the catalyst for real-world confidence. When students work directly with high-grade testing equipment, real components, and dedicated experimentation labs, theoretical learning transforms into tangible skills.
              </p>
              <p style={{ margin: 0 }}>
                Through the BSS Foundation, your contribution equips technical laboratories, sustains competitive merit scholarship pathways, and builds inspiring physical spaces where the next generation of technicians, creators, and engineers discover what they can accomplish.
              </p>
            </div>

            <button
              onClick={onOpenDonate}
              className="bss-story-cta-btn"
            >
              <span>Support a learning fund</span>
              <ArrowRight size={16} color="var(--bss-emerald)" />
            </button>
          </div>

        </div>
      </div>

      <style jsx>{`
        .bss-story-grid {
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }

        .bss-editorial-card {
          position: relative;
          background-color: var(--bss-navy);
          border-radius: var(--bss-radius-md);
          padding: 2.5rem;
          color: #ffffff;
          overflow: hidden;
          box-shadow: 0 8px 24px -4px rgba(17, 40, 64, 0.15);
          border: 1px solid rgba(9, 121, 101, 0.3);
        }

        .bss-accent-bar {
          position: absolute;
          top: 2rem;
          left: 0;
          width: 6px;
          height: 60px;
          background-color: var(--bss-emerald);
          border-radius: 0 4px 4px 0;
        }

        .bss-editorial-number {
          font-family: var(--bss-font-heading);
          font-size: 5.5rem;
          font-weight: 700;
          color: rgba(245, 181, 68, 0.18);
          line-height: 1;
          margin-bottom: 1.5rem;
        }

        .bss-spotlight-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem 0.65rem;
          border-radius: var(--bss-radius-sm);
          background-color: var(--bss-emerald);
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
        }

        .bss-editorial-title {
          font-family: var(--bss-font-heading);
          font-size: 1.65rem;
          font-weight: 600;
          color: #ffffff;
          line-height: 1.3;
          margin: 0 0 1rem 0;
        }

        .bss-editorial-text {
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.85);
          margin: 0;
          line-height: 1.55;
        }

        .bss-story-cta-btn {
          background: transparent;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 500;
          color: var(--bss-navy);
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          text-underline-offset: 4px;
          text-decoration-color: rgba(17, 40, 64, 0.3);
          transition: color 0.15s ease, text-decoration-color 0.15s ease;
        }

        .bss-story-cta-btn:hover {
          color: var(--bss-emerald);
          text-decoration-color: var(--bss-emerald);
        }

        @media (min-width: 1024px) {
          .bss-story-grid {
            display: grid;
            grid-template-columns: 5fr 7fr;
            gap: 4rem;
            align-items: center;
          }
        }
      `}</style>
    </section>
  );
}
