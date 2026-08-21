'use client';

import React from 'react';

interface AutoRecoverBannerProps {
  show: boolean;
  savedAt: string | null;
  onRestore: () => void;
  onDiscard: () => void;
}

export const AutoRecoverBanner: React.FC<AutoRecoverBannerProps> = ({
  show,
  savedAt,
  onRestore,
  onDiscard,
}) => {
  if (!show) return null;

  return (
    <div style={{
      background: 'rgba(2, 132, 199, 0.10)',
      border: '1px solid #0284c7',
      borderRadius: '10px',
      padding: '12px 16px',
      marginBottom: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#0369a1', fontWeight: 600 }}>
        <span style={{ fontSize: '18px' }}>📝</span>
        <span>
          <strong>Unsaved Form Found:</strong> We saved what you were typing earlier {savedAt ? `(${savedAt})` : ''}.
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={onRestore}
          className="btn btn-sm"
          style={{
            background: '#0284c7',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '12px',
            padding: '6px 14px',
            borderRadius: '6px',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
          }}
        >
          Restore My Work
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="btn btn-sm"
          style={{
            background: 'transparent',
            color: 'var(--text-muted, #64748b)',
            fontWeight: 600,
            fontSize: '12px',
            padding: '6px 12px',
            border: '1px solid var(--border, #cbd5e1)',
            borderRadius: '6px'
          }}
        >
          Start Fresh
        </button>
      </div>
    </div>
  );
};

export default AutoRecoverBanner;
