'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Sparkles, Move3d } from 'lucide-react';
import Hero3DFallback from './Hero3DFallback';

const R3FCanvasScene = dynamic(() => import('./R3FCanvasScene'), {
  ssr: false,
});

export default function Hero3DScene() {
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      try {
        const canvas = document.createElement('canvas');
        const hasWebGL = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        setWebglSupported(hasWebGL);
      } catch (e) {
        setWebglSupported(false);
      }
    }
  }, []);

  if (!mounted || prefersReducedMotion || !webglSupported) {
    return <Hero3DFallback />;
  }

  return (
    <div className="bss-scene-container">
      {/* Floating Status Card (Top Left) */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(6px)',
          padding: '0.45rem 0.85rem',
          borderRadius: '6px',
          border: '1px solid rgba(17, 40, 64, 0.12)',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#112840',
          boxShadow: '0 2px 6px rgba(17, 40, 64, 0.06)',
        }}
      >
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#097965', display: 'inline-block' }}></span>
        <span>Explore a learning lab</span>
      </div>

      {/* Dark Navy 3D Badge (Top Right) */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: 10,
          backgroundColor: '#112840',
          color: '#ffffff',
          padding: '0.35rem 0.75rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          letterSpacing: '0.03em',
        }}
      >
        <Sparkles size={14} color="#f5b544" />
        <span>BSS learning lab</span>
      </div>

      {/* Dynamic 3D WebGL Canvas */}
      <R3FCanvasScene />

      {/* Small "Drag to explore" label (Bottom Right) */}
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(4px)',
          padding: '0.3rem 0.65rem',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: 500,
          color: '#637082',
          border: '1px solid rgba(17, 40, 64, 0.1)',
          pointerEvents: 'none',
        }}
      >
        <Move3d size={13} color="#097965" />
        <span>Drag to explore</span>
      </div>
    </div>
  );
}
