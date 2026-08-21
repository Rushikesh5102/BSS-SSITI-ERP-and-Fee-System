'use client';

import React from 'react';
import { ShieldCheck, MapPin, Phone, Mail, Clock } from 'lucide-react';

interface FooterProps {
  onOpenDonate?: () => void;
}

export default function Footer({ onOpenDonate }: FooterProps) {
  return (
    <footer className="bss-footer">
      <div className="bss-container">
        
        {/* 4 Column Footer Grid */}
        <div className="bss-footer-grid">
          
          {/* Column 1: About Foundation */}
          <div>
            <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', marginBottom: '1rem' }} aria-label="BSS Foundation Home">
              <div className="bss-brand-monogram">
                BSS
              </div>
              <span style={{ fontFamily: 'var(--bss-font-heading)', fontSize: '1.25rem', fontWeight: 600, color: '#ffffff' }}>
                Foundation
              </span>
            </a>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.78)', lineHeight: 1.6, margin: 0 }}>
              Building a culture of opportunity through education, innovation, and skill development. Bharat Shikshan Sanstha’s Shri Sai Private Industrial Training Institute.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="bss-footer-title">Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <a href="#about" className="bss-footer-link">About Us</a>
              <button onClick={onOpenDonate} className="bss-footer-link" style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}>
                Donate Now
              </button>
              <a href="#campaigns" className="bss-footer-link">Campaigns</a>
              <a href="#stories" className="bss-footer-link">Stories</a>
              <a href="#contact" className="bss-footer-link">Contact</a>
              <a href="#faq" className="bss-footer-link">FAQ</a>
              <a href="/login" className="bss-footer-link" style={{ color: '#38bdf8', fontWeight: 600 }}>🔐 Staff / Admin ERP Portal</a>
            </div>
          </div>

          {/* Column 3: Legal Pages */}
          <div>
            <h4 className="bss-footer-title">Legal & Policies</h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <a href="/privacy" className="bss-footer-link">Privacy Policy</a>
              <a href="/terms" className="bss-footer-link">Terms & Conditions</a>
              <a href="/donation-policy" className="bss-footer-link">Donation Policy</a>
              <a href="/refund-policy" className="bss-footer-link">Refund Policy</a>
              <a href="/accessibility" className="bss-footer-link">Accessibility</a>
              <a href="/cookie-policy" className="bss-footer-link">Cookie Policy</a>
              <a href="/disclaimer" className="bss-footer-link">Disclaimer</a>
            </div>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h4 className="bss-footer-title">Institutional Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={15} color="var(--bss-emerald-light)" style={{ flexShrink: 0 }} />
                <span>Jain Mandir Road, Bhadrawati, Dist. Chandrapur, MH - 442902</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={15} color="var(--bss-emerald-light)" style={{ flexShrink: 0 }} />
                <a href="tel:+919529054868" style={{ color: 'inherit', textDecoration: 'none' }}>+91 9529054868</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={15} color="var(--bss-emerald-light)" style={{ flexShrink: 0 }} />
                <a href="mailto:saiiti151@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>saiiti151@gmail.com</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={15} color="var(--bss-emerald-light)" style={{ flexShrink: 0 }} />
                <span>Mon – Sat: 09:00 AM – 05:30 PM</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.7)' }}>
          <div>
            &copy; {new Date().getFullYear()} Bharat Shikshan Sanstha. All Rights Reserved.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
            <ShieldCheck size={16} color="var(--bss-emerald-light)" />
            <span>Secure donations powered by Razorpay.</span>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.85)' }}>
            Designed & Developed by <strong style={{ color: '#ffffff', fontWeight: 600 }}>Rushikesh Pattiwar</strong> — Project Architect & System Administrator
          </div>
        </div>

      </div>
    </footer>
  );
}
