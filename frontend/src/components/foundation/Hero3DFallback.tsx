'use client';

import React from 'react';
import { Move3d } from 'lucide-react';

export default function Hero3DFallback() {
  return (
    <div className="bss-fallback-container">
      <div className="bss-fallback-icon">
        <Move3d size={28} />
      </div>
      <h3 className="bss-fallback-title">
        BSS Learning Lab
      </h3>
      <p className="bss-fallback-text">
        Miniature electronics & prototyping workshop space.
      </p>
      <span className="bss-fallback-badge">
        <span className="bss-fallback-dot"></span>
        Static View Active
      </span>
    </div>
  );
}
