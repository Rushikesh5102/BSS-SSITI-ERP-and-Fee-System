'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, ExternalLink } from 'lucide-react';

export default function ContactSection() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
    agreePrivacy: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, agreePrivacy: e.target.checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreePrivacy) {
      setErrorMsg('Please agree to the Privacy Policy to submit your message.');
      return;
    }
    setErrorMsg('');
    setSubmitted(true);
  };

  return (
    <section id="contact" className="bss-contact-section">
      <div className="bss-container">
        
        {/* Section Header */}
        <div style={{ width: '100%', marginBottom: '3.5rem' }}>
          <span className="bss-section-eyebrow">
            CONTACT US
          </span>
          <h2 className="bss-section-heading" style={{ marginBottom: '1rem' }}>
            Get In Touch
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--bss-muted)', margin: 0, textAlign: 'justify' }}>
            Have questions about donations, partnerships, scholarships, or our educational initiatives? We'd love to hear from you.
          </p>
        </div>

        <div className="bss-contact-grid">
          
          {/* Left Side Info */}
          <div className="bss-contact-info-col">
            
            {/* Institution Badge */}
            <div style={{ backgroundColor: 'var(--bss-pale-sage)', padding: '1.25rem', borderRadius: '6px', border: '1px solid var(--bss-border)', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bss-emerald)', marginBottom: '0.2rem' }}>
                EDUCATIONAL TRUST & INSTITUTE
              </div>
              <h3 style={{ fontFamily: 'var(--bss-font-heading)', fontSize: '1.2rem', color: 'var(--bss-navy)', margin: '0 0 0.25rem 0' }}>
                Bharat Shikshan Sanstha
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--bss-muted)', margin: 0, fontWeight: 500 }}>
                Shri Sai Private Industrial Training Institute
              </p>
            </div>

            {/* Address */}
            <div className="bss-info-item">
              <div className="bss-info-icon"><MapPin size={18} /></div>
              <div>
                <span className="bss-info-label">Institute Address</span>
                <p className="bss-info-val">
                  Shri Sai Private Industrial Training Institute, Jain Mandir Road, Bhadrawati, District Chandrapur, Maharashtra - 442902
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="bss-info-item">
              <div className="bss-info-icon"><Phone size={18} /></div>
              <div>
                <span className="bss-info-label">College Helpline</span>
                <a href="tel:+919529054868" className="bss-info-val bss-info-link">+91 9529054868</a>
              </div>
            </div>

            {/* Email */}
            <div className="bss-info-item">
              <div className="bss-info-icon"><Mail size={18} /></div>
              <div>
                <span className="bss-info-label">Institute Email</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.2rem' }}>
                  <a href="mailto:saiiti151@gmail.com" className="bss-info-val bss-info-link">saiiti151@gmail.com</a>
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div className="bss-info-item">
              <div className="bss-info-icon"><Clock size={18} /></div>
              <div>
                <span className="bss-info-label">Working Hours</span>
                <p className="bss-info-val">Monday – Saturday: 09:00 AM – 05:30 PM</p>
              </div>
            </div>

            {/* Social Links & Map Action */}
            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--bss-border)', marginTop: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {['Facebook', 'Instagram', 'LinkedIn', 'YouTube'].map((net) => (
                  <span key={net} style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--bss-navy)', backgroundColor: 'var(--bss-pale-sage)', padding: '0.35rem 0.65rem', borderRadius: '4px', border: '1px solid var(--bss-border)' }}>
                    {net}
                  </span>
                ))}
              </div>

              <a href="#map" className="bss-btn-primary" style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}>
                <span>Open in Google Maps</span>
                <ExternalLink size={14} />
              </a>
            </div>

          </div>

          {/* Right Side Contact Form */}
          <div className="bss-contact-form-col">
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', backgroundColor: 'var(--bss-pale-sage)', borderRadius: '8px', border: '1px solid var(--bss-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(8, 107, 89, 0.12)', color: 'var(--bss-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontFamily: 'var(--bss-font-heading)', fontSize: '1.5rem', color: 'var(--bss-navy)', margin: 0 }}>
                  Message Sent Successfully
                </h3>
                <p style={{ fontSize: '0.9375rem', color: 'var(--bss-muted)', margin: 0, maxWidth: '24rem', lineHeight: 1.55 }}>
                  Thank you, <strong style={{ color: 'var(--bss-navy)' }}>{formData.fullName}</strong>. Our institutional team at Shri Sai ITI will get back to you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="bss-btn-primary"
                  style={{ marginTop: '1rem' }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', border: '1px solid var(--bss-border)', boxShadow: 'var(--bss-shadow-md)' }}>
                <h3 style={{ fontFamily: 'var(--bss-font-heading)', fontSize: '1.35rem', color: 'var(--bss-navy)', margin: '0 0 0.5rem 0' }}>
                  Send Us A Message
                </h3>

                {errorMsg && (
                  <div style={{ padding: '0.65rem', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', fontSize: '0.8125rem' }}>
                    {errorMsg}
                  </div>
                )}

                <div className="bss-form-grid-2">
                  <div>
                    <label className="bss-form-label">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="e.g. Rushikesh Pattiwar"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="bss-form-input"
                    />
                  </div>

                  <div>
                    <label className="bss-form-label">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. saiiti151@gmail.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="bss-form-input"
                    />
                  </div>
                </div>

                <div className="bss-form-grid-2">
                  <div>
                    <label className="bss-form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+91 9529054868"
                      value={formData.phone}
                      onChange={handleChange}
                      className="bss-form-input"
                    />
                  </div>

                  <div>
                    <label className="bss-form-label">Subject</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="bss-form-select"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Donation Question">Donation Question</option>
                      <option value="Scholarship Application">Scholarship Application</option>
                      <option value="Institutional Partnership">Institutional Partnership</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="bss-form-label">Message *</label>
                  <textarea
                    name="message"
                    required
                    placeholder="How can we assist you with BSS Foundation educational initiatives?"
                    value={formData.message}
                    onChange={handleChange}
                    className="bss-form-textarea"
                  ></textarea>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--bss-muted)' }}>
                  <input
                    type="checkbox"
                    checked={formData.agreePrivacy}
                    onChange={handleCheckbox}
                    style={{ accentColor: 'var(--bss-emerald)' }}
                  />
                  <span>I agree to the Privacy Policy.</span>
                </label>

                <button
                  type="submit"
                  className="bss-btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
                >
                  <Send size={16} />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

      <style jsx>{`
        .bss-contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }

        .bss-info-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .bss-info-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--bss-radius-sm);
          background: rgba(8, 107, 89, 0.12);
          color: var(--bss-emerald);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .bss-info-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--bss-muted);
          display: block;
        }

        .bss-info-val {
          font-size: 0.9375rem;
          color: var(--bss-navy);
          margin: 0;
          font-weight: 500;
        }

        .bss-info-link {
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .bss-info-link:hover {
          color: var(--bss-emerald);
        }

        .bss-form-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--bss-navy);
          margin-bottom: 0.35rem;
        }

        .bss-form-grid-2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .bss-form-grid-2 {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (min-width: 1024px) {
          .bss-contact-grid {
            grid-template-columns: 5fr 7fr;
            gap: 3.5rem;
            align-items: flex-start;
          }
        }
      `}</style>
    </section>
  );
}
