'use client';

import React from 'react';
import { Shield, Award, Lightbulb, UserCheck, Heart, Eye } from 'lucide-react';

export default function CoreValuesSection() {
  const values = [
    {
      icon: Shield,
      title: 'Integrity',
      description: 'We uphold honesty, ethics, and accountability in every activity.',
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'We continuously improve our educational standards and learning environment.',
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'We encourage creativity, technology, and practical problem-solving.',
    },
    {
      icon: UserCheck,
      title: 'Student First',
      description: 'Every decision is taken with student growth and success in mind.',
    },
    {
      icon: Heart,
      title: 'Community Service',
      description: 'We believe education should positively impact society.',
    },
    {
      icon: Eye,
      title: 'Transparency',
      description: 'Every donation and initiative is managed responsibly and ethically.',
    },
  ];

  return (
    <section className="bss-values-section">
      <div className="bss-container">
        
        {/* Section Header */}
        <div style={{ width: '100%', marginBottom: '3.5rem' }}>
          <span className="bss-section-eyebrow">
            OUR CORE VALUES
          </span>
          <h2 className="bss-section-heading">
            Guiding Principles behind{' '}
            <span className="bss-text-emerald-italic" style={{ display: 'inline' }}>
              every initiative.
            </span>
          </h2>
        </div>

        {/* 6 Animated Values Cards */}
        <div className="bss-values-grid">
          {values.map((val, idx) => {
            const Icon = val.icon;
            return (
              <div key={idx} className="bss-value-card">
                <div className="bss-value-icon">
                  <Icon size={22} />
                </div>
                <h3 className="bss-value-title">
                  {val.title}
                </h3>
                <p className="bss-value-desc">
                  {val.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
