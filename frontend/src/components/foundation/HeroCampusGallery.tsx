'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, MapPin, Eye, Award } from 'lucide-react';

const galleryItems = [
  {
    image: '/gallery/gallery_1.jpg',
    title: 'Institutional Library & Reading Room',
    subtitle: 'Technical textbooks, reference journals, student study tables & syllabus archives.',
    tag: 'Institutional Library',
  },
  {
    image: '/gallery/gallery_2.jpg',
    title: 'Academic Hallway & Notice Center',
    subtitle: 'Spacious corridor connecting trade classrooms, practical labs & student notice boards.',
    tag: 'Campus Corridor',
  },
  {
    image: '/gallery/gallery_3.jpg',
    title: 'Training & Placement Cell (Room 15)',
    subtitle: 'Dedicated career counseling, apprentice coordination & industry interview cabin.',
    tag: 'Placement Office',
  },
  {
    image: '/gallery/gallery_4.jpg',
    title: 'Executive Desk & Placement Cell',
    subtitle: 'Academic administration, employer liaison, and student career mentorship.',
    tag: 'Administrative Office',
  },
  {
    image: '/gallery/gallery_5.jpg',
    title: 'Faculty Chamber & Counseling Room',
    subtitle: 'One-on-one instructor guidance, academic counseling, and staff workstations.',
    tag: 'Faculty Cabin',
  },
  {
    image: '/gallery/gallery_6.jpg',
    title: 'Shri Sai ITI Campus Building',
    subtitle: 'Institute frontage and entrance located on Jain Mandir Road, Bhadrawati.',
    tag: 'Campus Exterior',
  },
  {
    image: '/gallery/gallery_7.jpg',
    title: 'Accounts & Inquiries Counter',
    subtitle: 'Student inquiry desk, admission registration & instant digital payment reception.',
    tag: 'Reception & Accounts',
  },
  {
    image: '/gallery/gallery_8.jpg',
    title: 'Sewing Technology & Craft Workshop',
    subtitle: 'Industrial sewing workstations for vocational trade training & Skill India initiatives.',
    tag: 'Practical Trade Workshop',
  },
  {
    image: '/gallery/gallery_9.jpg',
    title: 'Fire Safety & Emergency Station',
    subtitle: 'Dry-powder fire suppression units stationed across all practical workshop corridors.',
    tag: 'Safety Infrastructure',
  },
  {
    image: '/gallery/gallery_10.jpg',
    title: '24/7 CCTV Surveillance System',
    subtitle: 'Continuous electronic campus monitoring for student safety and asset security.',
    tag: 'Campus Security',
  },
  {
    image: '/gallery/gallery_11.jpg',
    title: 'Central Institute Reception & Office',
    subtitle: 'Accredited administrative control desk for parent inquiries and student services.',
    tag: 'Central Office',
  },
  {
    image: '/gallery/gallery_12.jpg',
    title: 'Central Office Entrance & Campus Facade',
    subtitle: 'Multi-storey academic complex housing administrative offices and trade workshops.',
    tag: 'Institute Entrance',
  },
];

export default function HeroCampusGallery() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [activeModalImg, setActiveModalImg] = useState<string | null>(null);

  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % galleryItems.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev === 0 ? galleryItems.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % galleryItems.length);
  };

  const currentItem = galleryItems[currentIndex];
  const isLoaded = !!loadedMap[currentItem.image];

  return (
    <>
      {/* Hero Campus Showcase Card */}
      <div className="bss-gallery-card">
        
        {/* Main Image Viewport */}
        <div className="bss-gallery-viewport">
          {!isLoaded && (
            <div className="bss-gallery-skeleton-overlay">
              <div className="bss-skeleton-shimmer-pulse" />
            </div>
          )}

          <img
            key={currentItem.image}
            src={currentItem.image}
            alt={currentItem.title}
            className={`bss-gallery-img ${isLoaded ? 'is-ready' : 'is-loading'}`}
            onLoad={() => {
              if (!loadedMap[currentItem.image]) {
                setLoadedMap((prev) => (prev[currentItem.image] ? prev : { ...prev, [currentItem.image]: true }));
              }
            }}
          />

          {/* Vignette Gradient Mask */}
          <div className="bss-gallery-vignette" />

          {/* Top Floating Glass Badge */}
          <div className="bss-gallery-top-badge">
            <Sparkles size={14} color="var(--bss-saffron)" />
            <span>Shri Sai ITI Practical Campus</span>
          </div>

          {/* Top Right Accreditation Pill */}
          <div className="bss-gallery-top-right-pill">
            <Award size={14} color="var(--bss-emerald-light)" />
            <span>NCVT / DGET Approved</span>
          </div>

          {/* Bottom Glass Overlay Info Panel */}
          <div className="bss-gallery-bottom-panel">
            <div className="bss-gallery-tag">
              {currentItem.tag}
            </div>

            <h3 className="bss-gallery-title">
              {currentItem.title}
            </h3>

            <p className="bss-gallery-subtitle">
              {currentItem.subtitle}
            </p>

            <div className="bss-gallery-footer-row">
              <div className="bss-gallery-location">
                <MapPin size={14} color="var(--bss-saffron)" />
                <span>Bhadrawati Campus, Maharashtra</span>
              </div>

              <button
                onClick={() => setActiveModalImg(currentItem.image)}
                className="bss-gallery-expand-btn"
                aria-label="View Fullscreen Image"
              >
                <Eye size={14} />
                <span>Enlarge Photo</span>
              </button>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="bss-gallery-nav-btn is-left"
            aria-label="Previous Campus Photo"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={handleNext}
            className="bss-gallery-nav-btn is-right"
            aria-label="Next Campus Photo"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Dots & Progress Bar */}
        <div className="bss-gallery-controls">
          <div className="bss-gallery-dots">
            {galleryItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(idx);
                }}
                className={`bss-gallery-dot ${idx === currentIndex ? 'is-active' : ''}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--bss-muted)' }}>
            {currentIndex + 1} / {galleryItems.length}
          </div>
        </div>

      </div>

      {/* Lightbox Photo View Modal */}
      {activeModalImg && (
        <div className="bss-lightbox-backdrop" onClick={() => setActiveModalImg(null)}>
          <div className="bss-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={activeModalImg} alt="Enlarged Campus View" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
            <button
              onClick={() => setActiveModalImg(null)}
              style={{ position: 'absolute', top: '-12px', right: '-12px', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#ffffff', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .bss-gallery-card {
          position: relative;
          width: 100%;
          border-radius: var(--bss-radius-lg);
          overflow: hidden;
          background-color: #0b1f33;
          border: 1px solid var(--bss-border);
          box-shadow: var(--bss-shadow-lg);
          display: flex;
          flex-direction: column;
        }

        .bss-gallery-viewport {
          position: relative;
          width: 100%;
          height: 380px;
          overflow: hidden;
          background-color: #061321;
        }

        @media (min-width: 640px) {
          .bss-gallery-viewport {
            height: 440px;
          }
        }

        @media (min-width: 1024px) {
          .bss-gallery-viewport {
            height: 500px;
          }
        }

        .bss-gallery-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          animation: bssKenBurns 8s infinite alternate ease-in-out;
        }

        @keyframes bssKenBurns {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.06);
          }
        }

        .bss-gallery-vignette {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(11, 31, 51, 0.45) 0%,
            rgba(11, 31, 51, 0.1) 40%,
            rgba(11, 31, 51, 0.92) 100%
          );
          pointer-events: none;
        }

        .bss-gallery-top-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          z-index: 10;
          background: rgba(11, 31, 51, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #ffffff;
          padding: 0.4rem 0.85rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .bss-gallery-top-right-pill {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 10;
          background: rgba(8, 107, 89, 0.88);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #ffffff;
          padding: 0.4rem 0.85rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .bss-gallery-bottom-panel {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 10;
          padding: 1.5rem;
          background: linear-gradient(180deg, transparent 0%, rgba(6, 19, 33, 0.95) 100%);
          color: #ffffff;
        }

        .bss-gallery-tag {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--bss-emerald-light);
          margin-bottom: 0.35rem;
        }

        .bss-gallery-title {
          font-family: var(--bss-font-heading);
          font-size: 1.35rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.35rem 0;
          line-height: 1.25;
        }

        .bss-gallery-subtitle {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.85);
          margin: 0 0 1rem 0;
          line-height: 1.45;
          text-align: left;
        }

        .bss-gallery-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .bss-gallery-location {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.78);
          font-weight: 500;
        }

        .bss-gallery-expand-btn {
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #ffffff;
          padding: 0.35rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .bss-gallery-expand-btn:hover {
          background: var(--bss-emerald);
          border-color: var(--bss-emerald);
        }

        .bss-gallery-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 15;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(11, 31, 51, 0.7);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .bss-gallery-nav-btn:hover {
          background: var(--bss-emerald);
          color: #ffffff;
          transform: translateY(-50%) scale(1.1);
        }

        .bss-gallery-nav-btn.is-left {
          left: 1rem;
        }

        .bss-gallery-nav-btn.is-right {
          right: 1rem;
        }

        .bss-gallery-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1.25rem;
          background-color: var(--bss-pale-sage);
          border-top: 1px solid var(--bss-border);
        }

        .bss-gallery-dots {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        .bss-gallery-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: rgba(11, 31, 51, 0.25);
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
        }

        .bss-gallery-dot.is-active {
          width: 24px;
          border-radius: 999px;
          background-color: var(--bss-emerald);
        }

        .bss-lightbox-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(6, 19, 33, 0.88);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bss-lightbox-content {
          position: relative;
        }

        .bss-gallery-skeleton-overlay {
          position: absolute;
          inset: 0;
          z-index: 5;
          background: #061321;
          overflow: hidden;
        }

        .bss-skeleton-shimmer-pulse {
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, rgba(16, 38, 64, 0.4) 0%, rgba(8, 107, 89, 0.35) 50%, rgba(16, 38, 64, 0.4) 100%);
          background-size: 200% 100%;
          animation: bssPulseShimmer 1.5s infinite linear;
        }

        @keyframes bssPulseShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </>
  );
}
