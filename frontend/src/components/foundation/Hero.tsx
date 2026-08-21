'use client';

import React from 'react';
import { Sparkles, ArrowRight, Heart } from 'lucide-react';
import HeroCampusGallery from './HeroCampusGallery';

interface HeroProps {
  onOpenDonate: () => void;
}

export default function Hero({ onOpenDonate }: HeroProps) {
  return (
    <section className="bss-hero">
      <div className="bss-container">
        <div className="bss-hero-grid">
          
          {/* Copy Column (Desktop Order 1, Mobile Order 2) */}
          <div className="bss-hero-copy-col">
            
            {/* Eyebrow badge */}
            <div className="bss-eyebrow">
              <Sparkles size={14} color="#097965" />
              <span>Education changes everything</span>
            </div>

            {/* Main Heading */}
            <h1 className="bss-hero-heading">
              Give a future{' '}
              <span className="bss-text-emerald-italic">
                the tools to begin.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="bss-hero-copy">
              Your gift brings practical learning, technical confidence, and lasting opportunity closer to every student.
            </p>

            {/* Calls to Action */}
            <div className="bss-hero-cta-wrap">
              <button
                onClick={onOpenDonate}
                className="bss-btn-primary"
                style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
              >
                <span>Donate now</span>
                <ArrowRight size={18} color="#f5b544" />
              </button>

              <a href="#impact" className="bss-secondary-cta">
                See your impact
              </a>
            </div>

            {/* Lower note with Heart icon */}
            <div className="bss-hero-note">
              <Heart size={14} color="#097965" fill="#097965" style={{ flexShrink: 0 }} />
              <span>Every contribution is directed to a purpose you choose.</span>
            </div>

          </div>

          {/* Real Campus & Workshop Showcase Gallery Column (Desktop Order 2, Mobile Order 1) */}
          <div className="bss-hero-3d-col">
            <HeroCampusGallery />
          </div>

        </div>
      </div>
    </section>
  );
}
