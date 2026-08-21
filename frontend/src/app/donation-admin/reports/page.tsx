'use client';

import { Suspense } from 'react';
import DonationModuleContent from '../../../components/DonationModuleContent';

export default function DonationReportsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
      </div>
    }>
      <DonationModuleContent activeTab="reports" />
    </Suspense>
  );
}
