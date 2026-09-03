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
      background: 'radial-gradient(ellipse at top, #1e1035 0%, #0d071d 50%, #06030c 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        marginBottom: '20px',
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
            filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.8))'
          }}
        />
      </div>
      <div className="spinner" style={{ width: 38, height: 38, borderWidth: 3.5, borderColor: '#a855f7' }} />
      <p style={{ marginTop: 16, fontSize: 13.5, fontWeight: 600, color: '#e9d5ff', letterSpacing: '0.5px' }}>
        Launching Shri Sai ITI ERP System...
      </p>
    </div>
  );
}
