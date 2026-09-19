'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function RootIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      padding: '20px'
    }}>
      <div style={{
        width: '100px',
        height: '100px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img
          src="/sai_iti_logo.png"
          alt="Shri Sai ITI"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 20px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 35px rgba(56, 189, 248, 0.9))'
          }}
        />
      </div>
      <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px', textShadow: '0 2px 14px rgba(0, 0, 0, 0.5)' }}>
        Shri Sai I.T.I
      </h1>
      <p style={{
        fontSize: '13px',
        color: '#ffffff',
        background: 'rgba(3, 44, 94, 0.5)',
        border: '1px solid rgba(186, 230, 253, 0.45)',
        padding: '3px 14px',
        borderRadius: '20px',
        fontWeight: 700,
        margin: '6px 0 24px',
        letterSpacing: '0.4px',
        backdropFilter: 'blur(8px)'
      }}>
        Institutional Management Portal
      </p>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3.5, borderColor: 'rgba(233, 220, 201, 0.25)', borderTopColor: '#38bdf8' }} />
      <p style={{ marginTop: 14, fontSize: 13.5, fontWeight: 600, color: '#e0f2fe', letterSpacing: '0.4px' }}>
        Launching Shri Sai ITI ERP System...
      </p>
    </div>
  );
}
