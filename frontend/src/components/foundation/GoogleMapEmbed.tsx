'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

export default function GoogleMapEmbed() {
  const [mapError, setMapError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=Shri+Sai+Private+Industrial+Training+Institute+Jain+Mandir+Road+Bhadrawati+442902';
  const iframeSrc = 'https://maps.google.com/maps?q=Shri%20Sai%20Private%20Industrial%20Training%20Institute%20Jain%20Mandir%20Road%20Bhadrawati%20442902&t=&z=16&ie=UTF8&iwloc=&output=embed';

  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section id="map" style={{ width: '100%', paddingBottom: '4.5rem', backgroundColor: 'var(--bss-bg)' }}>
      <div className="bss-container">
        
        {/* Full-Height Responsive Map Card */}
        <div style={{ position: 'relative', width: '100%', height: '480px', minHeight: '480px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--bss-border)', boxShadow: 'var(--bss-shadow-md)', backgroundColor: 'var(--bss-pale-sage)' }}>
          
          {/* Action Bar Overlay - Positioned Bottom Right so it NEVER obscures Google Maps controls */}
          <div style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem', zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: '0.65rem', pointerEvents: 'auto' }}>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bss-btn-primary"
              style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)' }}
            >
              <Navigation size={15} />
              <span>Get Directions</span>
            </a>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', color: 'var(--bss-navy)', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--bss-border)', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)', transition: 'all 0.2s ease' }}
            >
              <ExternalLink size={15} />
              <span>Open Google Maps</span>
            </a>
          </div>

          {!iframeLoaded && !mapError && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 5, backgroundColor: 'var(--bss-pale-sage)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: 'rgba(8, 107, 89, 0.14)', color: 'var(--bss-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'bssPulseIcon 1.5s infinite ease-in-out' }}>
                <MapPin size={28} />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--bss-navy)', letterSpacing: '0.02em' }}>
                Loading Interactive Campus Map...
              </span>
            </div>
          )}

          {mapError ? (
            /* Fallback Location Info Card */
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
              <MapPin size={42} color="var(--bss-emerald)" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ fontFamily: 'var(--bss-font-heading)', fontSize: '1.4rem', color: 'var(--bss-navy)', margin: '0 0 0.5rem 0' }}>
                Shri Sai Private Industrial Training Institute
              </h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--bss-muted)', margin: '0 0 1.25rem 0', maxWidth: '32rem', lineHeight: 1.55 }}>
                Jain Mandir Road, Bhadrawati, District Chandrapur, Maharashtra - 442902
              </p>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="bss-btn-primary">
                Open Location in Maps
              </a>
            </div>
          ) : isLoaded ? (
            /* Full-Cover Embedded Map Frame */
            <iframe
              title="Shri Sai Private ITI Location Map - Jain Mandir Road Bhadrawati"
              src={iframeSrc}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                minHeight: '480px',
                border: 0,
                display: 'block',
              }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setIframeLoaded(true)}
              onError={() => setMapError(true)}
            ></iframe>
          ) : null}

        </div>

      </div>
    </section>
  );
}
