'use client';

import React from 'react';
import { Landmark, ShieldCheck, Users } from 'lucide-react';

export default function ImpactCards() {
  const cards = [
    {
      icon: Landmark,
      title: 'Purpose-led giving',
      description: 'Choose the learning fund that feels most meaningful to you.',
    },
    {
      icon: ShieldCheck,
      title: 'Clear accountability',
      description: 'Follow campaign milestones from contribution to implementation.',
    },
    {
      icon: Users,
      title: 'Human connection',
      description: 'Invest directly in the spaces where students discover what they can do.',
    },
  ];

  return (
    <section id="impact" className="bss-impact-section" style={{ width: '100%', overflowX: 'hidden' }}>
      <div className="bss-container" style={{ width: '100%', maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Section Header with Single Line Heading */}
        <div style={{ width: '100%', marginBottom: '3rem' }}>
          <span className="bss-section-eyebrow">
            Made tangible
          </span>
          <h2 className="bss-section-heading bss-single-line-heading" style={{
            fontSize: 'clamp(1.5rem, 4vw, 3.2rem)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            margin: '0.5rem 0 0 0',
            fontWeight: 700,
            lineHeight: 1.2
          }}>
            Small acts create a{' '}
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>shared horizon.</span>
          </h2>
        </div>

        {/* Dynamic Flex Adaptable Cards Container */}
        <div className="bss-impact-flex-wrap" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2rem',
          width: '100%'
        }}>
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="bss-impact-card" style={{
                flex: '1 1 280px',
                minWidth: '260px',
                maxWidth: '100%'
              }}>
                <div className="bss-impact-icon-badge">
                  <Icon size={20} />
                </div>
                <h3 className="bss-impact-card-title">
                  {card.title}
                </h3>
                <p className="bss-impact-card-text">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .bss-single-line-heading {
            white-space: normal !important;
            font-size: 1.8rem !important;
          }
        }
      `}</style>
    </section>
  );
}
