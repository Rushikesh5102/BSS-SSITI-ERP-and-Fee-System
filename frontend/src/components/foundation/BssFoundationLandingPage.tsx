'use client';

import React, { useState } from 'react';
import '../../styles/bss-foundation.css';
import Navbar from './Navbar';
import Hero from './Hero';
import AboutSection from './AboutSection';
import MissionVisionSection from './MissionVisionSection';
import CoreValuesSection from './CoreValuesSection';
import WhySupportUs from './WhySupportUs';
import TransparencySection from './TransparencySection';
import ImpactCards from './ImpactCards';
import CampaignSelector from './CampaignSelector';
import DonationTimeline from './DonationTimeline';
import StorySection from './StorySection';
import ContactSection from './ContactSection';
import GoogleMapEmbed from './GoogleMapEmbed';
import FAQAccordion from './FAQAccordion';
import Footer from './Footer';
import DonationModal from './DonationModal';
import FloatingActions from './FloatingActions';

export default function BssFoundationLandingPage() {
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState<string>('Where needed most');

  const handleOpenDonate = (purpose: string = 'Where needed most') => {
    setSelectedPurpose(purpose);
    setIsDonateModalOpen(true);
  };

  const handleCloseDonate = () => {
    setIsDonateModalOpen(false);
  };

  return (
    <div className="bss-root">
      {/* Accessible Skip to Main Content Link */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        Skip to main content
      </a>

      {/* Floating Back to Top Action */}
      <FloatingActions />

      {/* Navigation */}
      <Navbar onOpenDonate={() => handleOpenDonate('Where needed most')} />

      {/* Main Content Area */}
      <main id="main-content">
        {/* 1. Hero Section */}
        <Hero onOpenDonate={() => handleOpenDonate('Where needed most')} />

        {/* 2. About Us Section (Two-column layout + Educational Collage) */}
        <AboutSection />

        {/* 3. Mission & Vision Section */}
        <MissionVisionSection />

        {/* 4. Core Values Section (6 Animated Cards) */}
        <CoreValuesSection />

        {/* 5. Why Support Us Section (6 Impact Cards) */}
        <WhySupportUs onSelectFund={(fund) => handleOpenDonate(fund)} />

        {/* 6. Transparency & Accountability Section */}
        <TransparencySection />

        {/* 7. Impact Cards Section */}
        <ImpactCards />

        {/* 8. Campaign Selector Section */}
        <div id="campaigns">
          <CampaignSelector onSelectCampaign={(purpose) => handleOpenDonate(purpose)} />
        </div>

        {/* 9. Donation Journey Timeline */}
        <DonationTimeline />

        {/* 10. Story Section */}
        <StorySection onOpenDonate={() => handleOpenDonate('Where needed most')} />

        {/* 11. Contact Section (Left Info + Right Animated Form) */}
        <ContactSection />

        {/* 12. Google Map Embed */}
        <GoogleMapEmbed />

        {/* 13. Expanded FAQ Section */}
        <FAQAccordion />
      </main>

      {/* 14. Premium Footer */}
      <Footer onOpenDonate={() => handleOpenDonate('Where needed most')} />

      {/* 15. Donation Modal */}
      <DonationModal
        isOpen={isDonateModalOpen}
        onClose={handleCloseDonate}
        initialPurpose={selectedPurpose}
      />
    </div>
  );
}
