'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'Will I receive a donation acknowledgement?',
      answer:
        'Yes, all donors receive an official institutional contribution receipt immediately via email upon completion of your gift.',
    },
    {
      question: 'Can I donate anonymously?',
      answer:
        'Optionally, you can select the anonymous donation checkbox during checkout, and your donor details will remain strictly confidential.',
    },
    {
      question: 'How are donations used?',
      answer:
        '100% of designated gifts directly equip practical workshops, upgrade laboratories, fund merit scholarships, and improve learning infrastructure.',
    },
    {
      question: 'Can organizations contribute?',
      answer:
        'Yes, corporate foundations, alumni groups, and industrial partners can contribute towards institutional funds, workshop equipment drives, or student sponsorship programs.',
    },
    {
      question: 'Is my payment secure?',
      answer:
        'Yes, all online transactions are processed through 256-bit SSL encrypted channels powered by trusted payment gateways like Razorpay.',
    },
    {
      question: 'Can international donors contribute?',
      answer:
        'We welcome support worldwide. International cards and foreign remittances can be processed in accordance with institutional giving guidelines.',
    },
    {
      question: 'Who should I contact regarding donations?',
      answer:
        'You can reach our institutional giving desk at saiiti151@gmail.com or call +91 9529054868 during working hours (Mon–Sat, 9:00 AM – 5:30 PM).',
    },
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="bss-faq-section">
      <div className="bss-container" style={{ maxWidth: '54rem' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span className="bss-section-eyebrow" style={{ display: 'inline-block' }}>
            Answers, clearly
          </span>
          <h2 className="bss-section-heading" style={{ marginBottom: 0 }}>
            Questions worth asking.
          </h2>
        </div>

        {/* Accordion Container */}
        <div>
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="bss-faq-item">
                <button
                  onClick={() => toggleAccordion(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  id={`faq-button-${idx}`}
                  className="bss-faq-button"
                >
                  <span>{faq.question}</span>
                  <div
                    className={`bss-faq-chevron ${isOpen ? 'is-open' : ''}`}
                  >
                    <ChevronDown size={18} />
                  </div>
                </button>

                {/* Answer Content */}
                <div
                  id={`faq-answer-${idx}`}
                  role="region"
                  aria-labelledby={`faq-button-${idx}`}
                  style={{
                    maxHeight: isOpen ? '220px' : '0px',
                    opacity: isOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    paddingLeft: '1.5rem',
                    paddingRight: '1.5rem',
                    paddingBottom: isOpen ? '1.5rem' : '0px',
                  }}
                >
                  <p style={{ margin: 0, paddingTop: '1rem', borderTop: '1px solid var(--bss-border)', fontSize: '0.95rem', color: 'var(--bss-muted)', lineHeight: 1.6 }}>
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      <style jsx>{`
        .bss-faq-chevron {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(17, 40, 64, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--bss-navy);
          transition: transform 0.3s ease, background 0.3s ease, color 0.3s ease;
          flex-shrink: 0;
        }

        .bss-faq-chevron.is-open {
          transform: rotate(180deg);
          background: var(--bss-emerald);
          color: #ffffff;
        }
      `}</style>
    </section>
  );
}
