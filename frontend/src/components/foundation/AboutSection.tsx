'use client';

import React from 'react';
import { Cpu, Zap, Laptop, Users, GraduationCap, HeartHandshake, Quote } from 'lucide-react';

export default function AboutSection() {
  const collageItems = [
    {
      icon: Cpu,
      title: 'Practicals & Lab Work',
      description: 'Hands-on electronic experimentation & circuit testing.',
    },
    {
      icon: Zap,
      title: 'Electrical Workshop',
      description: 'Industrial machinery, wiring & motor control setups.',
    },
    {
      icon: Laptop,
      title: 'Computer Laboratory',
      description: 'Modern workstations, digital design & CAD drafting.',
    },
    {
      icon: Users,
      title: 'Faculty Guidance',
      description: 'Personalized mentorship from experienced trade instructors.',
    },
    {
      icon: GraduationCap,
      title: 'Graduation & Placement',
      description: 'Celebrating certified graduates entering leading industries.',
    },
    {
      icon: HeartHandshake,
      title: 'Community Service',
      description: 'Technical outreach, repairs & local skill workshops.',
    },
  ];

  return (
    <section id="about" className="bss-about-section">
      <div className="bss-container">
        <div className="bss-about-grid">
          
          {/* Left Column: Equal 50% Size */}
          <div className="bss-about-col">
            <div className="bss-about-header">
              <span className="bss-section-eyebrow">
                WHO WE ARE
              </span>
              <h2 className="bss-section-heading" style={{ fontSize: '2.1rem', marginBottom: '1.25rem', lineHeight: 1.2 }}>
                Building Opportunities Through{' '}
                <span className="bss-text-emerald-italic">
                  Education, Skills & Service.
                </span>
              </h2>
            </div>

            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--bss-navy)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              For years, Bharat Shikshan Sanstha has worked towards empowering individuals through quality education, practical training, and community development. Through Shri Sai Private Industrial Training Institute, we strive to create an environment where every learner can discover their potential, develop industry-ready skills, and build a brighter future.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', fontSize: '0.95rem', color: 'var(--bss-muted)', lineHeight: 1.65, flex: 1, justifyContent: 'space-between' }}>
              <p style={{ margin: 0 }}>
                BSS Foundation is the social and educational development initiative of Bharat Shikshan Sanstha. Our objective is to make quality technical education accessible while continuously improving learning infrastructure, practical laboratories, workshops, libraries, scholarships, and student welfare initiatives.
              </p>
              <p style={{ margin: 0 }}>
                Every contribution received through this platform directly supports educational development and helps create better opportunities for deserving students. Whether it is providing modern workshop equipment, improving laboratories, supporting financially challenged learners, or creating innovative learning spaces, each donation contributes towards long-term educational impact.
              </p>

              {/* Enhanced Quote Box */}
              <div className="bss-quote-box">
                <Quote size={22} color="var(--bss-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--bss-navy)', fontWeight: 500, fontSize: '0.95rem' }}>
                  "We believe that education is not merely about classrooms—it is about creating confidence, building skills, encouraging innovation, and preparing students for successful careers and meaningful lives."
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Equal 50% Size */}
          <div className="bss-about-col">
            <div className="bss-about-header">
              <span className="bss-section-eyebrow">
                INSTITUTIONAL ENVIRONMENT
              </span>
              <h3 className="bss-section-heading" style={{ fontSize: '2.1rem', marginBottom: '1.25rem', lineHeight: 1.2 }}>
                Practical Spaces & Learning Moments
              </h3>
            </div>

            <div className="bss-collage-equal-grid">
              {collageItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="bss-collage-equal-card">
                    <div className="bss-collage-icon">
                      <Icon size={20} />
                    </div>
                    <h4 className="bss-collage-title">{item.title}</h4>
                    <p className="bss-collage-desc">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        .bss-about-grid {
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }

        .bss-about-col {
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .bss-about-header {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          min-height: 110px;
        }

        .bss-quote-box {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          background-color: rgba(8, 107, 89, 0.08);
          border-left: 3px solid var(--bss-emerald);
          padding: 1.25rem;
          border-radius: 0 var(--bss-radius-md) var(--bss-radius-md) 0;
          margin-top: 0.5rem;
        }

        .bss-collage-equal-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          flex: 1;
        }

        .bss-collage-equal-card {
          background-color: #ffffff;
          border: 1px solid var(--bss-border);
          border-radius: var(--bss-radius-md);
          padding: 1.35rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.75rem;
          transition: all 0.25s ease;
          box-shadow: var(--bss-shadow-sm);
        }

        .bss-collage-equal-card:hover {
          background-color: var(--bss-navy);
          color: #ffffff;
          border-color: var(--bss-navy);
          transform: translateY(-4px);
          box-shadow: var(--bss-shadow-md);
        }

        .bss-collage-equal-card:hover .bss-collage-icon {
          background-color: var(--bss-saffron);
          color: var(--bss-navy);
        }

        .bss-collage-equal-card:hover .bss-collage-title {
          color: #ffffff;
        }

        .bss-collage-equal-card:hover .bss-collage-desc {
          color: rgba(255, 255, 255, 0.88);
        }

        @media (min-width: 1024px) {
          .bss-about-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3.5rem;
            align-items: stretch;
          }
        }
      `}</style>
    </section>
  );
}
