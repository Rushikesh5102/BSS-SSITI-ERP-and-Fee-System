'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function FloatingActions() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!showBackToTop) return null;

  return (
    <button
      onClick={scrollToTop}
      className="bss-back-to-top-btn"
      aria-label="Back to Top"
    >
      <ArrowUp size={18} />
      <style jsx>{`
        .bss-back-to-top-btn {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 90;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: var(--bss-navy);
          color: #ffffff;
          border: 1px solid var(--bss-border);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(11, 31, 51, 0.25);
          transition: all 0.25s ease;
        }

        .bss-back-to-top-btn:hover {
          background-color: var(--bss-emerald);
          color: #ffffff;
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(8, 107, 89, 0.35);
        }

        @media (max-width: 640px) {
          .bss-back-to-top-btn {
            bottom: 1rem;
            right: 1rem;
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </button>
  );
}
