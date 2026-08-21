'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface CampaignSelectorProps {
  onSelectCampaign: (purpose: string) => void;
}

export default function CampaignSelector({ onSelectCampaign }: CampaignSelectorProps) {
  const campaigns = [
    {
      id: 'Scholarships',
      number: '01',
      title: 'Scholarships',
      description: 'Keep a bright student moving forward.',
    },
    {
      id: 'Workshop equipment',
      number: '02',
      title: 'Workshop tools',
      description: 'Put real equipment into capable hands.',
    },
    {
      id: 'Laboratories',
      number: '03',
      title: 'Future labs',
      description: 'Build spaces for bold experiments.',
    },
  ];

  return (
    <section className="bss-campaign-section">
      <div className="bss-container">
        
        {/* Section Header */}
        <div style={{ maxWidth: '42rem', marginBottom: '3rem' }}>
          <span className="bss-section-eyebrow">
            Choose a direction
          </span>
          <h2 className="bss-section-heading">
            One gift.{' '}
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>A visible difference.</span>
          </h2>
        </div>

        {/* 3 Connected Campaign Panels */}
        <div className="bss-campaign-grid">
          {campaigns.map((camp) => (
            <button
              key={camp.id}
              onClick={() => onSelectCampaign(camp.id)}
              className="bss-campaign-panel"
            >
              <div>
                {/* Number & Arrow Icon */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span className="bss-campaign-number">
                    {camp.number}
                  </span>
                  <div className="bss-arrow-circle">
                    <ArrowUpRight size={18} />
                  </div>
                </div>

                {/* Campaign Title */}
                <h3 className="bss-campaign-title">
                  {camp.title}
                </h3>

                {/* Description */}
                <p className="bss-campaign-text">
                  {camp.description}
                </p>
              </div>

              {/* Action Prompt */}
              <div className="bss-campaign-footer">
                Support this fund &rarr;
              </div>
            </button>
          ))}
        </div>

      </div>

      <style jsx>{`
        .bss-campaign-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        .bss-arrow-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(17, 40, 64, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--bss-navy);
          transition: all 0.3s ease;
        }

        .bss-campaign-panel:hover .bss-arrow-circle {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .bss-campaign-footer {
          padding-top: 1.5rem;
          margin-top: 1.5rem;
          border-top: 1px solid var(--bss-border);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--bss-emerald);
          transition: color 0.3s ease, border-color 0.3s ease;
        }

        .bss-campaign-panel:hover .bss-campaign-footer {
          color: var(--bss-saffron);
          border-top-color: rgba(255, 255, 255, 0.15);
        }

        @media (min-width: 768px) {
          .bss-campaign-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
          }
        }
      `}</style>
    </section>
  );
}
