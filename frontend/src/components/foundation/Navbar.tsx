'use client';

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface NavbarProps {
  onOpenDonate?: () => void;
}

export default function Navbar({ onOpenDonate }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Main Distinct Dark Header Bar */}
      <header className={`bss-navbar ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="bss-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Left Brand: Monogram + White Title */}
          <a
            href="#"
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}
            aria-label="BSS Foundation Home"
          >
            <div className="bss-brand-monogram" style={{ backgroundColor: 'var(--bss-emerald)', color: '#ffffff', boxShadow: '0 0 12px rgba(8, 107, 89, 0.5)' }}>
              BSS
            </div>
            <span style={{ fontFamily: "var(--bss-font-heading)", fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Foundation
            </span>
          </a>

          {/* Center Nav Links (Desktop) */}
          <nav
            style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}
            className="bss-desktop-nav"
          >
            <a href="#about" className="bss-dark-nav-link">
              About us
            </a>
            <a href="#impact" className="bss-dark-nav-link">
              Our impact
            </a>
            <a href="#campaigns" className="bss-dark-nav-link">
              Campaigns
            </a>
            <a href="#stories" className="bss-dark-nav-link">
              Stories
            </a>
            <a href="#contact" className="bss-dark-nav-link">
              Contact
            </a>
            <a href="#faq" className="bss-dark-nav-link">
              FAQ
            </a>
          </nav>

          {/* Right Spacer for Header Alignment */}
          <div style={{ width: '135px' }} className="bss-desktop-nav" />

        </div>
      </header>

      {/* Ultra Glassmorphism Permanently Fixed Top-Right Donate Button */}
      <button
        onClick={onOpenDonate}
        className="bss-glass-fixed-donate-btn"
        aria-label="Donate Now"
      >
        <div className="bss-heart-pulse-wrap">
          <Heart size={16} fill="var(--bss-saffron)" color="var(--bss-saffron)" />
        </div>
        <span>Donate Now</span>
      </button>

      <style jsx>{`
        .bss-navbar {
          width: 100%;
          background: #061524;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          padding-top: 0.9rem;
          padding-bottom: 0.9rem;
          position: sticky;
          top: 0;
          z-index: 80;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
          transition: background 0.3s ease;
        }

        .bss-navbar.is-scrolled {
          background: rgba(6, 21, 36, 0.94);
          backdrop-filter: blur(12px);
        }

        .bss-dark-nav-link {
          font-size: 0.9375rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.88);
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .bss-dark-nav-link:hover {
          color: var(--bss-emerald-light);
        }

        /* Ultra Glassmorphism Permanently Fixed Top-Right Donate Button */
        .bss-glass-fixed-donate-btn {
          position: fixed;
          top: 0.9rem;
          right: 1.5rem;
          z-index: 9999;
          background: linear-gradient(135deg, rgba(9, 121, 101, 0.88) 0%, rgba(11, 31, 51, 0.88) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          color: #ffffff;
          font-family: var(--bss-font-body);
          font-weight: 700;
          font-size: 0.9375rem;
          padding: 0.65rem 1.4rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 10px 30px rgba(9, 121, 101, 0.45);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .bss-glass-fixed-donate-btn:hover {
          background: linear-gradient(135deg, rgba(9, 121, 101, 0.98) 0%, rgba(17, 40, 64, 0.98) 100%);
          transform: translateY(-2px) scale(1.04);
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.7), 0 14px 36px rgba(9, 121, 101, 0.6);
          border-color: #ffffff;
        }

        .bss-heart-pulse-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          animation: bssPulse 2s infinite ease-in-out;
        }

        @keyframes bssPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }

        @media (max-width: 900px) {
          .bss-desktop-nav {
            display: none !important;
          }
        }

        @media (max-width: 640px) {
          .bss-glass-fixed-donate-btn {
            top: 0.75rem;
            right: 0.85rem;
            padding: 0.5rem 0.95rem;
            font-size: 0.8125rem;
          }
        }
      `}</style>
    </>
  );
}
