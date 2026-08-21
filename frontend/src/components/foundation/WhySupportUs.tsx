'use client';

import React from 'react';
import { GraduationCap, Zap, Laptop, BookOpen, FlaskConical, Building2 } from 'lucide-react';

interface WhySupportUsProps {
  onSelectFund: (fundName: string) => void;
}

export default function WhySupportUs({ onSelectFund }: WhySupportUsProps) {
  const impactCards = [
    {
      id: 'Scholarships',
      icon: GraduationCap,
      emoji: '🎓',
      title: 'Student Scholarships',
      description: 'Support financially deserving students.',
    },
    {
      id: 'Workshop equipment',
      icon: Zap,
      emoji: '⚡',
      title: 'Workshop Equipment',
      description: 'Provide modern practical training tools.',
    },
    {
      id: 'Laboratories',
      icon: Laptop,
      emoji: '💻',
      title: 'Digital Learning',
      description: 'Improve computer laboratories and digital resources.',
    },
    {
      id: 'Where needed most',
      icon: BookOpen,
      emoji: '📚',
      title: 'Library Development',
      description: 'Expand technical books and learning materials.',
    },
    {
      id: 'Laboratories',
      icon: FlaskConical,
      emoji: '🧪',
      title: 'Laboratory Modernization',
      description: 'Upgrade laboratories with advanced equipment.',
    },
    {
      id: 'Where needed most',
      icon: Building2,
      emoji: '🏫',
      title: 'Campus Infrastructure',
      description: 'Improve classrooms, safety, accessibility, and student facilities.',
    },
  ];

  return (
    <section className="bss-support-section">
      <div className="bss-container">
        
        {/* Section Header */}
        <div style={{ width: '100%', marginBottom: '3.5rem' }}>
          <span className="bss-section-eyebrow">
            WHY SUPPORT US
          </span>
          <h2 className="bss-section-heading" style={{ marginBottom: '1.25rem' }}>
            Your Support Creates{' '}
            <span className="bss-text-emerald-italic">
              Real Educational Impact
            </span>
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--bss-muted)', margin: 0, textAlign: 'justify' }}>
            Every donation directly contributes towards creating better learning opportunities. Rather than simply funding infrastructure, your generosity helps students gain practical experience, improve employability, and receive quality education in a safe and modern environment.
          </p>
        </div>

        {/* 6 Elegant Cards Grid */}
        <div className="bss-support-grid">
          {impactCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <button
                key={idx}
                onClick={() => onSelectFund(card.id)}
                className="bss-support-card"
              >
                <div className="bss-support-card-top">
                  <div className="bss-support-icon">
                    <Icon size={22} />
                  </div>
                  <span style={{ fontSize: '1.5rem' }}>{card.emoji}</span>
                </div>

                <h3 className="bss-support-card-title">
                  {card.title}
                </h3>
                
                <p className="bss-support-card-desc">
                  {card.description}
                </p>

                <div className="bss-support-card-action">
                  Contribute to this cause &rarr;
                </div>
              </button>
            );
          })}
        </div>

      </div>

      <style jsx>{`
        .bss-support-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        .bss-support-card {
          background-color: var(--bss-bg);
          border: 1px solid var(--bss-border);
          border-radius: var(--bss-radius-md);
          padding: 1.75rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 210px;
        }

        .bss-support-card:hover {
          background-color: var(--bss-navy);
          border-color: var(--bss-navy);
          transform: translateY(-3px);
          box-shadow: 0 10px 24px -4px rgba(17, 40, 64, 0.2);
        }

        .bss-support-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .bss-support-icon {
          width: 42px;
          height: 42px;
          border-radius: var(--bss-radius-sm);
          background-color: rgba(9, 121, 101, 0.12);
          color: var(--bss-emerald);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
        }

        .bss-support-card:hover .bss-support-icon {
          background-color: var(--bss-saffron);
          color: var(--bss-navy);
        }

        .bss-support-card-title {
          font-family: var(--bss-font-heading);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--bss-navy);
          margin-bottom: 0.5rem;
          transition: color 0.25s ease;
        }

        .bss-support-card:hover .bss-support-card-title {
          color: #ffffff;
        }

        .bss-support-card-desc {
          font-size: 0.9375rem;
          line-height: 1.5;
          color: var(--bss-muted);
          margin: 0 0 1.25rem 0;
          transition: color 0.25s ease;
        }

        .bss-support-card:hover .bss-support-card-desc {
          color: rgba(255, 255, 255, 0.85);
        }

        .bss-support-card-action {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--bss-emerald);
          transition: color 0.25s ease;
        }

        .bss-support-card:hover .bss-support-card-action {
          color: var(--bss-saffron);
        }

        @media (min-width: 640px) {
          .bss-support-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .bss-support-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </section>
  );
}
