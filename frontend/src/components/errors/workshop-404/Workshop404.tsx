'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  ArrowLeft,
  RotateCcw,
  Zap,
  Activity,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import './workshop404.css';

// Verified final reveal timestamp where both students settle with the physical 404 placard
const FREEZE_AT = 9.21;

// Dialogue lines for Student 1 (Yellow Helmet) - Authentic Manga/Comic Lines
const STUDENT_1_DIALOGUES = [
  'Bhai, neutral wire check kiya kya?!',
  'Sir said 404 is completely out of syllabus!',
  'I told you to connect Phase to Red, not the Wi-Fi router!',
  'Have you tried turning the workshop off and on again?',
  'At least the safety helmet is ISI certified!',
];

// Dialogue lines for Student 2 (Blue Shirt / Toolbox)
const STUDENT_2_DIALOGUES = [
  'Toolbox is ready, but where is the URL blueprint?!',
  'At least nobody got electrocuted this time!',
  "Let's blame the server room electrician.",
  'Resistance is infinite! Try navigating back!',
  'Workshop inspection passed: 0 pages found.',
];

// Single Active Easter Egg Type
type ActiveEasterEgg = 'mcb' | 'multimeter' | 'dialogue' | 'blackout' | null;

export default function Workshop404() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isUiVisible, setIsUiVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sparkActive, setSparkActive] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // ─── STRICT MUTUALLY EXCLUSIVE EASTER EGG STATE ───────────────────────
  const [activeEgg, setActiveEgg] = useState<ActiveEasterEgg>(null);

  // 1. MCB Breaker State
  const [mcbOn, setMcbOn] = useState(false);
  const [mcbTripCount, setMcbTripCount] = useState(0);

  // 2. Multimeter Probe State
  const [multimeterReading, setMultimeterReading] = useState<{
    target: string;
    voltage: string;
    status: string;
  } | null>(null);

  // 3. Comic/Manga Dialogue Bubbles
  const [activeDialogue, setActiveDialogue] = useState<{
    student: 1 | 2;
    text: string;
  } | null>(null);
  const [student1Index, setStudent1Index] = useState(0);
  const [student2Index, setStudent2Index] = useState(0);

  // 4. Emergency Pull-Lever
  const [leverPulling, setLeverPulling] = useState(false);

  // Timers
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dialogueTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to show timed toast
  const showTimedToast = useCallback((msg: string, duration = 3800) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, duration);
  }, []);

  // Check reduced-motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      if (mediaQuery.matches) {
        setIsFrozen(true);
        setIsUiVisible(true);
      }

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
        if (e.matches) {
          setIsFrozen(true);
          setIsUiVisible(true);
        }
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    }
  }, []);

  // ─── MASTER RESET ALL EASTER EGGS ─────────────────────────────────────
  const handleResetAllEasterEggs = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);

    setActiveEgg(null);
    setMcbOn(false);
    setMcbTripCount(0);
    setMultimeterReading(null);
    setActiveDialogue(null);
    setLeverPulling(false);
    setSparkActive(false);
    setToastMessage(null);
  }, []);

  // Handle freeze at exact 9.21s reveal timestamp
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || isFrozen) return;

    if (video.currentTime >= FREEZE_AT) {
      video.pause();
      video.currentTime = FREEZE_AT;
      setIsFrozen(true);

      setTimeout(() => {
        setIsUiVisible(true);
      }, 300);
    }
  }, [isFrozen]);

  // Video ended fallback (ensure permanent freeze on hero frame)
  const handleEnded = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = FREEZE_AT;
      video.pause();
    }
    setIsFrozen(true);
    setTimeout(() => {
      setIsUiVisible(true);
    }, 300);
  }, []);

  // Handle metadata loaded (for reduced motion hold frame immediately)
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (prefersReducedMotion) {
      video.currentTime = FREEZE_AT;
      video.pause();
      setIsFrozen(true);
      setIsUiVisible(true);
    }
  }, [prefersReducedMotion]);

  // Replay the incident animation from the start
  const handleReplay = useCallback(() => {
    setIsUiVisible(false);
    setIsFrozen(false);
    handleResetAllEasterEggs();

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  }, [handleResetAllEasterEggs]);

  // Role-aware canonical destination for "Return to Workshop"
  const handleReturnToWorkshop = useCallback(() => {
    if (authLoading) return;

    if (user) {
      if (user.role === 'DEVELOPER' || user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
        router.push('/portal');
      } else if (user.role === 'STORE_MANAGER') {
        router.push('/store');
      } else if (user.role === 'LIBRARIAN') {
        router.push('/library');
      } else if (user.role === 'TEACHER') {
        router.push('/students');
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Robust Go Back with fallback to home
  const handleGoBack = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        router.push('/');
      }
    }
  }, [router]);

  // ─── EASTER EGG 1: EXACT 1P SINGLE-POLE SCHEMATIC MCB TOGGLE ──────────
  const handleToggleMcb = useCallback(() => {
    setSparkActive(true);
    setTimeout(() => setSparkActive(false), 400);

    const nextState = !mcbOn;
    setMcbOn(nextState);
    setMcbTripCount((c) => c + 1);

    if (nextState) {
      // Switching MCB ON
      if (activeEgg !== 'mcb') {
        if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
        setActiveDialogue(null);
        setMultimeterReading(null);
        setActiveEgg('mcb');
      }

      if (mcbTripCount >= 3) {
        showTimedToast('🚨 [MCB C16 OVERLOAD] Transformer coil heating! Breaker holding 240V AC.', 4500);
      } else {
        showTimedToast('⚡ [MCB C16 CLOSED] 240V AC 50Hz Line Active — Main Bus Energized!', 3800);
      }
    } else {
      // Tripping MCB OFF
      if (activeEgg === 'mcb') {
        setActiveEgg(null);
      }
      showTimedToast('🔌 [MCB C16 TRIPPED] Circuit Isolated — Safe Standby Mode.', 3500);
    }
  }, [mcbOn, activeEgg, mcbTripCount, showTimedToast]);

  // ─── EASTER EGG 2: MULTIMETER TOGGLE & REAL-TIME PROBE HOVER ──────────
  const handleToggleMultimeter = useCallback(() => {
    if (activeEgg === 'multimeter') {
      setActiveEgg(null);
      setMultimeterReading(null);
    } else {
      handleResetAllEasterEggs();
      setActiveEgg('multimeter');
      setMultimeterReading({
        target: 'Workshop Test Probes Ready',
        voltage: '0.00 V AC',
        status: 'HOVER PROBE OVER ANY OBJECT TO MEASURE',
      });
    }
  }, [activeEgg, handleResetAllEasterEggs]);

  // Real-time hover diagnosis handler
  const handleProbeHover = useCallback((target: string, voltage: string, status: string) => {
    if (activeEgg === 'multimeter') {
      setMultimeterReading({ target, voltage, status });
    }
  }, [activeEgg]);

  // ─── EASTER EGG 3: STUDENT 1 CLICK (MANGA COMIC DIALOGUE) ────────────
  const handleStudent1Click = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    // If multimeter is active, ONLY take voltage reading (NO dialogue!)
    if (activeEgg === 'multimeter') {
      handleProbeHover(
        'Student 1 Helmet & Face',
        '240.0 V AC',
        '100% SHOCK DIELECTRIC INSULATED (ISI CERTIFIED)'
      );
      return;
    }

    if (activeEgg !== 'dialogue') {
      handleResetAllEasterEggs();
      setActiveEgg('dialogue');
    }

    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);

    const quote = STUDENT_1_DIALOGUES[student1Index % STUDENT_1_DIALOGUES.length];
    setActiveDialogue({ student: 1, text: quote });
    setStudent1Index((i) => i + 1);

    dialogueTimerRef.current = setTimeout(() => {
      setActiveDialogue(null);
      setActiveEgg((cur) => (cur === 'dialogue' ? null : cur));
    }, 4500);
  }, [activeEgg, student1Index, handleResetAllEasterEggs, handleProbeHover]);

  // ─── EASTER EGG 3: STUDENT 2 CLICK (MANGA COMIC DIALOGUE) ────────────
  const handleStudent2Click = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    // If multimeter is active, ONLY take toolbox reading (NO dialogue!)
    if (activeEgg === 'multimeter') {
      handleProbeHover(
        'Student 2 Toolbox & Gear',
        '0.00 V',
        '12 INSULATED TOOLS DETECTED • 0 BLUEPRINTS'
      );
      return;
    }

    if (activeEgg !== 'dialogue') {
      handleResetAllEasterEggs();
      setActiveEgg('dialogue');
    }

    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);

    const quote = STUDENT_2_DIALOGUES[student2Index % STUDENT_2_DIALOGUES.length];
    setActiveDialogue({ student: 2, text: quote });
    setStudent2Index((i) => i + 1);

    dialogueTimerRef.current = setTimeout(() => {
      setActiveDialogue(null);
      setActiveEgg((cur) => (cur === 'dialogue' ? null : cur));
    }, 4500);
  }, [activeEgg, student2Index, handleResetAllEasterEggs, handleProbeHover]);

  // ─── EASTER EGG 4: 404 PLACARD CLICK ──────────────────────────────────
  const handleBoardClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSparkActive(true);
    setTimeout(() => setSparkActive(false), 500);

    if (activeEgg === 'multimeter') {
      handleProbeHover(
        'Physical 404 Circuit Board',
        '0.00 V',
        'OPEN CIRCUIT (FAULT CODE: HTTP_404_PAGE_NOT_FOUND)'
      );
    }
  }, [activeEgg, handleProbeHover]);

  // ─── EASTER EGG 5: EMERGENCY BLACKOUT PULL-LEVER ─────────────────────
  const handleLeverPull = useCallback(() => {
    if (leverPulling) return;
    setLeverPulling(true);
    setSparkActive(true);

    setTimeout(() => {
      setSparkActive(false);
      setLeverPulling(false);

      if (activeEgg === 'blackout') {
        // Power restored!
        setActiveEgg(null);
      } else {
        // Clean, mysterious blackout
        handleResetAllEasterEggs();
        setActiveEgg('blackout');
      }
    }, 350);
  }, [leverPulling, activeEgg, handleResetAllEasterEggs]);

  const isBlackout = activeEgg === 'blackout';
  const isMultimeter = activeEgg === 'multimeter';
  const isDialogue = activeEgg === 'dialogue' && activeDialogue !== null;
  const hasAnyActiveEgg = activeEgg !== null;

  return (
    <main
      className={isMultimeter ? 'multimeter-active-cursor' : ''}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
        maxWidth: '100%',
        overflow: 'hidden',
        backgroundColor: isBlackout ? '#000000' : '#eee2c8',
        color: '#0f172a',
        fontFamily: "'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        boxSizing: 'border-box',
        transition: 'background-color 0.3s ease',
      }}
      onMouseEnter={() => {
        if (isMultimeter) {
          handleProbeHover('Workshop Ambient Field', '238.4 V AC 50Hz', 'GRID ACTIVE • NOMINAL SINE WAVE');
        }
      }}
    >
      {/* ─── 1. CINEMATIC VIDEO (PERFECTLY CENTERED, PRISTINE) ─────────────── */}
      <video
        ref={videoRef}
        src="/media/404-workshop-incident.mp4"
        poster="/media/404-poster.jpg"
        playsInline
        muted
        autoPlay={!prefersReducedMotion}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          zIndex: 1,
          display: 'block',
          opacity: isBlackout ? 0.02 : 1,
          filter: isBlackout ? 'brightness(0)' : 'none',
          transition: 'opacity 0.3s ease, filter 0.3s ease',
        }}
      />

      {/* ─── 2. PURE MYSTERIOUS BLACKOUT OVERLAY ───────────────────────────── */}
      {isBlackout && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#000000',
            zIndex: 15,
            pointerEvents: 'none',
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* Electrical spark flash overlay (Triggered on Breaker reset, generator pull, or clicks) */}
      {sparkActive && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 35,
            boxShadow:
              'inset 0 0 160px rgba(245, 181, 68, 0.8), inset 0 0 90px rgba(56, 189, 248, 0.9)',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            transition: 'all 0.1s ease-out',
          }}
        />
      )}

      {/* ─── 3. EASTER EGG: MANGA / COMIC DIALOGUE BOX ─────────────────────── */}
      {isDialogue && !isBlackout && (
        <div
          className="manga-bubble"
          role="dialog"
          aria-label={activeDialogue.student === 1 ? 'Student 1 Dialogue' : 'Student 2 Dialogue'}
          style={{
            position: 'absolute',
            left: activeDialogue.student === 1 ? '34.5%' : '62.5%',
            top: activeDialogue.student === 1 ? '10%' : '12%',
            transform: 'translate(-50%, 0)',
            backgroundColor: '#ffffff',
            color: '#09090b',
            padding: '0.75rem 1.25rem',
            borderRadius: '16px',
            border: '2.5px solid #18181b',
            boxShadow: '4px 4px 0px #18181b, 0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 32,
            maxWidth: '310px',
            fontSize: '0.88rem',
            fontWeight: 800,
            lineHeight: 1.35,
            letterSpacing: '-0.01em',
            animation: 'mangaPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            textAlign: 'center',
          }}
        >
          {activeDialogue.text}
          <div className="manga-bubble-tail" />
          <div className="manga-bubble-tail-inner" />
        </div>
      )}

      {/* ─── 4. INTERACTIVE LIVE MULTIMETER HOVER HOTSPOTS ─────────────────── */}
      {isFrozen && isUiVisible && !isBlackout && (
        <>
          {/* Hotspot 1: Student 1 Helmet (Dielectric Insulation) */}
          <button
            onClick={handleStudent1Click}
            onMouseEnter={() =>
              handleProbeHover(
                'Student 1 ISI Safety Helmet',
                '240.0 V AC',
                '100% DIELECTRIC INSULATION (ISI CERTIFIED 10kV)'
              )
            }
            aria-label="Probe Student 1 Helmet"
            title={isMultimeter ? '⚡ Probe Helmet Insulation' : 'Click to talk with Student 1 ⚡'}
            style={{
              position: 'absolute',
              left: '21%',
              top: '8%',
              width: '26%',
              height: '22%',
              background: 'transparent',
              border: 'none',
              cursor: isMultimeter ? 'url(/media/multimeter-probe.svg) 3 3, crosshair' : 'pointer',
              zIndex: 12,
              outline: 'none',
            }}
          />

          {/* Hotspot 2: Student 1 Body / Shirt */}
          <button
            onClick={handleStudent1Click}
            onMouseEnter={() =>
              handleProbeHover(
                'Student 1 (Apprentice Electrician)',
                '1.20 mV',
                'BODY CAPACITANCE DETECTED • PULSE NOMINAL'
              )
            }
            aria-label="Probe Student 1"
            title={isMultimeter ? '⚡ Probe Student 1' : 'Click to talk with Student 1 ⚡'}
            style={{
              position: 'absolute',
              left: '20%',
              top: '30%',
              width: '28%',
              height: '24%',
              background: 'transparent',
              border: 'none',
              cursor: isMultimeter ? 'url(/media/multimeter-probe.svg) 3 3, crosshair' : 'pointer',
              zIndex: 10,
              outline: 'none',
            }}
          />

          {/* Hotspot 3: Student 2 (Apprentice / Electrician) */}
          <button
            onClick={handleStudent2Click}
            onMouseEnter={() =>
              handleProbeHover(
                'Student 2 (Apprentice Electrician)',
                '0.85 mV',
                'GROUNDED CONTACT • ROUTE BLUEPRINTS UNRESOLVED'
              )
            }
            aria-label="Probe Student 2"
            title={isMultimeter ? '🧰 Probe Student 2' : 'Click to talk with Student 2 🧰'}
            style={{
              position: 'absolute',
              left: '52%',
              top: '12%',
              width: '26%',
              height: '42%',
              background: 'transparent',
              border: 'none',
              cursor: isMultimeter ? 'url(/media/multimeter-probe.svg) 3 3, crosshair' : 'pointer',
              zIndex: 10,
              outline: 'none',
            }}
          />

          {/* Hotspot 4: Physical 404 Placard Board */}
          <button
            onClick={handleBoardClick}
            onMouseEnter={() =>
              handleProbeHover(
                'Physical 404 Circuit Board',
                '0.00 V',
                'OPEN CIRCUIT (FAULT CODE: HTTP_404_PAGE_NOT_FOUND)'
              )
            }
            aria-label="Probe 404 circuit board"
            title={isMultimeter ? '⚡ Probe 404 Board Circuit' : 'Inspect 404 Board'}
            style={{
              position: 'absolute',
              left: '23%',
              top: '54%',
              width: '24%',
              height: '30%',
              background: 'transparent',
              border: 'none',
              cursor: isMultimeter ? 'url(/media/multimeter-probe.svg) 3 3, crosshair' : 'pointer',
              zIndex: 11,
              outline: 'none',
            }}
          />

          {/* Hotspot 5: Metal Toolbox & Insulated Tools */}
          <button
            onClick={handleStudent2Click}
            onMouseEnter={() =>
              handleProbeHover(
                'Workshop Heavy Steel Toolbox',
                '0.00 V',
                '12 INSULATED TOOLS DETECTED • 0 ROUTE BLUEPRINTS'
              )
            }
            aria-label="Probe workshop toolbox"
            title={isMultimeter ? '🧰 Probe Insulated Tools' : 'Inspect Toolbox'}
            style={{
              position: 'absolute',
              left: '58%',
              top: '76%',
              width: '24%',
              height: '24%',
              background: 'transparent',
              border: 'none',
              cursor: isMultimeter ? 'url(/media/multimeter-probe.svg) 3 3, crosshair' : 'pointer',
              zIndex: 11,
              outline: 'none',
            }}
          />
        </>
      )}

      {/* ─── 5. TOP HEADER TOOLS WITH DEDICATED LEVER MARGIN ──────────────── */}
      <header
        className="workshop-header-tools"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          maxWidth: 'calc(100% - 64px)',
          padding: 'clamp(0.6rem, 1.8vw, 1.25rem)',
          zIndex: 50,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          opacity: isUiVisible ? 1 : 0,
          transform: isUiVisible ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
          pointerEvents: isUiVisible ? 'auto' : 'none',
        }}
      >
        {/* Box 1: Institution Brand Badge */}
        <div
          className="workshop-header-brand"
          style={{
            height: '38px',
            boxSizing: 'border-box',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0 0.95rem',
            borderRadius: '8px',
            backgroundColor: isBlackout ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(245, 181, 68, 0.3)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
          onMouseEnter={() => {
            if (isMultimeter) {
              handleProbeHover('Workshop Control Panel Header', '5.00 V DC', 'DIGITAL MICROCONTROLLER BUS ACTIVE');
            }
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: '0.78rem',
              letterSpacing: '0.06em',
              color: '#fbfaf5',
              textTransform: 'uppercase',
            }}
          >
            Shri Sai ITI
          </span>
          <span style={{ color: '#637082' }}>/</span>
          <span
            style={{
              fontSize: '0.75rem',
              color: '#cbd5e1',
              fontWeight: 500,
            }}
          >
            Electrical Workshop
          </span>
        </div>

        {/* Box 2: MCB (C16) Single-Pole Schematic Module (RED for I-ON, GREEN for O-OFF) */}
        {!isBlackout && (
          <button
            onClick={handleToggleMcb}
            onMouseEnter={() => {
              if (isMultimeter) {
                handleProbeHover(
                  'Single-Pole MCB C16 Breaker',
                  mcbOn ? '240.4 V AC 50Hz' : '0.00 V (ISOLATED)',
                  mcbOn ? 'CLOSED CONTACTS • 16A RATED LOAD ENERGIZED' : 'OPEN CONTACTS • AIR GAP ISOLATION 3.5mm'
                );
              }
            }}
            title={mcbOn ? 'MCB (C16): ON (Click to Trip)' : 'MCB (C16): TRIPPED (Click to Reset)'}
            aria-label="Toggle Single-Pole MCB Breaker"
            style={{
              height: '38px',
              boxSizing: 'border-box',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0 0.85rem 0 0.45rem',
              borderRadius: '8px',
              backgroundColor: mcbOn ? '#fef2f2' : 'rgba(248, 250, 252, 0.96)',
              border: mcbOn ? '1.5px solid #ef4444' : '1.5px solid #64748b',
              boxShadow: mcbOn
                ? '0 0 12px rgba(239, 68, 68, 0.45), 0 2px 6px rgba(0,0,0,0.12)'
                : '0 2px 6px rgba(0,0,0,0.12)',
              cursor: isMultimeter ? 'url(/media/multimeter-probe.svg) 3 3, crosshair' : 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* 1P Slim MCB Vector Icon */}
            <svg
              width="15"
              height="28"
              viewBox="0 0 32 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0 }}
            >
              <rect x="7" y="1" width="18" height="4" rx="1" fill="#0f172a" stroke="#0f172a" strokeWidth="1" />
              <rect x="7" y="55" width="18" height="4" rx="1" fill="#0f172a" stroke="#0f172a" strokeWidth="1" />

              <rect
                x="4"
                y="5"
                width="24"
                height="50"
                rx="2"
                fill={mcbOn ? '#ffffff' : '#f1f5f9'}
                stroke="#0f172a"
                strokeWidth="2.5"
              />

              <circle cx="16" cy="13" r="3.5" fill="none" stroke="#0f172a" strokeWidth="1.8" />
              <line x1="13.5" y1="10.5" x2="18.5" y2="15.5" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />

              <rect x="7" y="21" width="18" height="18" rx="1.5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />

              <g
                style={{
                  transform: mcbOn ? 'translateY(-3px)' : 'translateY(3px)',
                  transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
              >
                <rect
                  x="11.5"
                  y="24"
                  width="9"
                  height="12"
                  rx="1.5"
                  fill={mcbOn ? '#dc2626' : '#0f172a'}
                  stroke="#0f172a"
                  strokeWidth="1.8"
                />
                <rect
                  x="8.5"
                  y={mcbOn ? '31' : '25'}
                  width="15"
                  height="4.5"
                  rx="1"
                  fill={mcbOn ? '#ef4444' : '#334155'}
                  stroke="#0f172a"
                  strokeWidth="1.8"
                />
              </g>

              <circle cx="16" cy="47" r="3.5" fill="none" stroke="#0f172a" strokeWidth="1.8" />
              <line x1="13.5" y1="44.5" x2="18.5" y2="49.5" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
            </svg>

            {/* Label: RED for I-ON, GREEN for O-OFF */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
              <span
                style={{
                  padding: '0.12rem 0.35rem',
                  borderRadius: '4px',
                  backgroundColor: mcbOn ? '#ef4444' : '#22c55e',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  boxShadow: mcbOn ? '0 0 6px rgba(239, 68, 68, 0.7)' : '0 0 4px rgba(34, 197, 94, 0.6)',
                }}
              >
                {mcbOn ? 'I-ON' : 'O-OFF'}
              </span>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: mcbOn ? '#b91c1c' : '#0f172a', letterSpacing: '0.02em' }}>
                MCB (C16)
              </span>
            </div>
          </button>
        )}

        {/* Box 3: Multimeter Diagnostic Probe Toggle */}
        {!isBlackout && (
          <button
            onClick={handleToggleMultimeter}
            title="Toggle Digital Multimeter Probe"
            aria-label="Toggle Digital Multimeter"
            style={{
              height: '38px',
              boxSizing: 'border-box',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0 0.95rem',
              borderRadius: '8px',
              backgroundColor: isMultimeter ? 'rgba(180, 83, 9, 0.95)' : 'rgba(15, 23, 42, 0.88)',
              border: `1px solid ${isMultimeter ? '#f5b544' : 'rgba(255,255,255,0.2)'}`,
              color: '#fbfaf5',
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isMultimeter ? '0 0 16px rgba(245, 181, 68, 0.6)' : '0 4px 14px rgba(0,0,0,0.15)',
            }}
          >
            <Activity size={15} color={isMultimeter ? '#ffffff' : '#f5b544'} />
            <span>{isMultimeter ? 'PROBE ACTIVE' : 'MULTIMETER'}</span>
          </button>
        )}

        {/* Box 4: Reset Easter Eggs Button */}
        <button
          onClick={handleResetAllEasterEggs}
          title="Reset all Easter Eggs to default"
          aria-label="Reset Easter Eggs"
          style={{
            height: '38px',
            boxSizing: 'border-box',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0 0.95rem',
            borderRadius: '8px',
            backgroundColor: hasAnyActiveEgg
              ? 'rgba(220, 38, 38, 0.92)'
              : isBlackout
              ? '#22c55e'
              : 'rgba(15, 23, 42, 0.75)',
            border: hasAnyActiveEgg
              ? '1px solid #ef4444'
              : isBlackout
              ? '1px solid #4ade80'
              : '1px solid rgba(255,255,255,0.18)',
            color: '#fbfaf5',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: hasAnyActiveEgg || isBlackout ? '0 0 16px rgba(239, 68, 68, 0.6)' : '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease',
          }}
        >
          <RefreshCw size={14} color="#ffffff" />
          <span>{isBlackout ? 'Restore Lights' : 'Reset Easter Eggs'}</span>
        </button>
      </header>

      {/* ─── EASTER EGG 5: EMERGENCY BLACKOUT PULL-LEVER (ANCHORED TOP RIGHT) ─ */}
      <div
        className="workshop-pull-cord"
        style={{
          position: 'absolute',
          top: 0,
          right: 'clamp(1rem, 2.5vw, 2.5rem)',
          zIndex: 55,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: isMultimeter ? 'url(/media/multimeter-probe.svg) 3 3, crosshair' : isUiVisible ? 'pointer' : 'default',
          transformOrigin: 'top center',
          animation: leverPulling ? 'none' : 'cordWiggle 4s ease-in-out infinite',
          opacity: isUiVisible ? 1 : 0,
          transform: isUiVisible ? 'translateY(0)' : 'translateY(-20px)',
          pointerEvents: isUiVisible ? 'auto' : 'none',
          transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={handleLeverPull}
        onMouseEnter={() => {
          if (isMultimeter) {
            handleProbeHover(
              'Emergency Power Blackout Lever',
              '24.0 V DC',
              'AUXILIARY GENERATOR TRIP COIL STANDBY'
            );
          }
        }}
        title={isBlackout ? 'Pull to restore workshop power!' : 'Pull emergency blackout lever!'}
      >
        <div
          style={{
            width: '3.5px',
            height: leverPulling ? '80px' : '48px',
            backgroundColor: isBlackout ? '#ef4444' : '#d97706',
            boxShadow: isBlackout ? '0 0 12px #ef4444' : '0 2px 6px rgba(0,0,0,0.2)',
            transition: 'height 0.15s ease-out, background-color 0.3s ease',
          }}
        />
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: `4px solid ${isBlackout ? '#ef4444' : '#b45309'}`,
            backgroundColor: isBlackout ? '#ef4444' : '#f59e0b',
            boxShadow: isBlackout ? '0 0 24px #ef4444, 0 0 40px rgba(239, 68, 68, 0.8)' : '0 4px 10px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}
        >
          <Zap size={13} color="#ffffff" fill="#ffffff" />
        </div>
      </div>

      {/* ─── EASTER EGG 2: LIVE MULTIMETER DIGITAL HUD ────────────────────── */}
      {isMultimeter && !isBlackout && (
        <div
          className="multimeter-hud"
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '1.5rem',
            zIndex: 35,
            width: '280px',
            backgroundColor: '#0f172a',
            border: '2px solid #f5b544',
            borderRadius: '12px',
            padding: '0.85rem',
            boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
            fontFamily: "'Courier New', Courier, monospace",
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.4rem',
              borderBottom: '1px solid rgba(245, 181, 68, 0.3)',
              paddingBottom: '0.3rem',
            }}
          >
            <span style={{ color: '#f5b544', fontSize: '0.72rem', fontWeight: 800 }}>
              FLUKE-404 PROBE HUD
            </span>
            <span style={{ color: '#34d399', fontSize: '0.68rem', fontWeight: 700 }}>LIVE AUTO-SENSE</span>
          </div>

          <div
            style={{
              backgroundColor: '#022c22',
              borderRadius: '6px',
              padding: '0.5rem',
              border: '1px solid #065f46',
              textAlign: 'right',
              marginBottom: '0.45rem',
            }}
          >
            <div style={{ color: '#6ee7b7', fontSize: '1.45rem', fontWeight: 900, letterSpacing: '0.05em' }}>
              {multimeterReading ? multimeterReading.voltage : '0.00 V'}
            </div>
            <div style={{ color: '#34d399', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700 }}>
              {multimeterReading ? multimeterReading.target : 'HOVER PROBE OVER ANY OBJECT'}
            </div>
          </div>

          <div style={{ color: '#94a3b8', fontSize: '0.68rem', lineHeight: 1.35 }}>
            Diagnostic:{' '}
            <span style={{ color: '#f8fafc', fontWeight: 600 }}>
              {multimeterReading ? multimeterReading.status : 'Move red probe lead across characters & tools...'}
            </span>
          </div>
        </div>
      )}

      {/* ─── 6. FLOATING MCB FEEDBACK TOAST ───────────────────────────────── */}
      {toastMessage && !isBlackout && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            top: '1.25rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1.25rem',
            borderRadius: '8px',
            backgroundColor: '#0f172a',
            color: '#fbfaf5',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: '1px solid #f5b544',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            animation: 'fadeIn 0.25s ease-out',
            textAlign: 'center',
            maxWidth: '90vw',
          }}
        >
          <Zap size={14} color="#f5b544" fill="#f5b544" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── 7. BLENDED RECOVERY CONTENT (SEAMLESS IN RIGHT BLANK SPACE) ─── */}
      {/* Automatically hides during any active Easter Egg interaction for full immersion */}
      <aside
        className="workshop-blended-panel"
        style={{
          position: 'absolute',
          top: '50%',
          right: 'clamp(2rem, 5vw, 6rem)',
          transform: isUiVisible && !hasAnyActiveEgg
            ? 'translateY(-50%) scale(1)'
            : 'translateY(-44%) scale(0.96)',
          width: 'clamp(320px, 25vw, 400px)',
          background: 'transparent',
          zIndex: 25,
          boxSizing: 'border-box',
          opacity: isUiVisible && !hasAnyActiveEgg ? 1 : 0,
          transition:
            'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: isUiVisible && !hasAnyActiveEgg ? 'auto' : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.95rem',
        }}
      >
        {/* Dialogue Quote Pill */}
        <div
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(180, 83, 9, 0.08)',
            border: '1px solid rgba(180, 83, 9, 0.22)',
            color: '#9a3412',
            fontSize: '0.84rem',
            fontWeight: 600,
            fontStyle: 'italic',
          }}
        >
          <span>&ldquo;We couldn&apos;t find that page either.&rdquo;</span>
        </div>

        {/* Eyebrow with 404 ERROR Badge */}
        <div>
          <div
            style={{
              fontSize: '0.76rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#d97706',
              marginBottom: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Zap size={13} color="#d97706" />
              <span>Workshop Incident</span>
            </div>
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>•</span>
            <span
              style={{
                padding: '0.12rem 0.45rem',
                borderRadius: '4px',
                backgroundColor: 'rgba(217, 119, 6, 0.12)',
                color: '#b45309',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
              }}
            >
              404 ERROR
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.02em',
              lineHeight: 1.22,
            }}
          >
            Looks like something went wrong in the workshop.
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.84rem, 1.2vw, 0.92rem)',
              color: '#475569',
              margin: 0,
              lineHeight: 1.5,
              fontWeight: 450,
            }}
          >
            The circuit shorted and the page seems to have disappeared. Let&apos;s get you back to safety.
          </p>
        </div>

        {/* Action Navigation Buttons */}
        <nav
          aria-label="404 recovery actions"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            marginTop: '0.4rem',
          }}
        >
          {/* Primary Action Button: Return to Workshop (Role-Aware) */}
          <button
            onClick={handleReturnToWorkshop}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              minHeight: '44px',
              padding: '0.65rem 1.25rem',
              backgroundColor: '#097965',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.92rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(9, 121, 101, 0.28)',
              transition: 'background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#076353';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(9, 121, 101, 0.38)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#097965';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(9, 121, 101, 0.28)';
            }}
          >
            <Home size={16} />
            <span>Return to Workshop</span>
          </button>

          {/* Secondary Action Button: Go Back */}
          <button
            onClick={handleGoBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              minHeight: '42px',
              padding: '0.6rem 1.2rem',
              backgroundColor: 'rgba(15, 23, 42, 0.06)',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: '0.88rem',
              borderRadius: '10px',
              border: '1.5px solid rgba(15, 23, 42, 0.16)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.16)';
            }}
          >
            <ArrowLeft size={15} />
            <span>Go Back</span>
          </button>

          {/* Secondary Action Button: Replay Incident */}
          <button
            onClick={handleReplay}
            aria-label="Replay workshop incident animation"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              minHeight: '40px',
              padding: '0.55rem 1rem',
              backgroundColor: 'rgba(217, 119, 6, 0.08)',
              color: '#9a3412',
              fontWeight: 600,
              fontSize: '0.86rem',
              borderRadius: '10px',
              border: '1.5px solid rgba(217, 119, 6, 0.28)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.16)';
              e.currentTarget.style.borderColor = '#d97706';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.28)';
            }}
          >
            <RotateCcw size={14} />
            <span>Replay Incident</span>
          </button>
        </nav>

        {/* Tip */}
        <div
          style={{
            fontSize: '0.68rem',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            userSelect: 'none',
          }}
        >
          <Sparkles size={11} color="#f5b544" />
          <span>Tip: Click on students or workshop tools to interact</span>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'rgba(15, 23, 42, 0.08)', margin: '0.1rem 0' }} />

        {/* ─── PROMINENT OFFICIAL FOOTER WITH DEVELOPER CREDIT ───────────── */}
        <div
          style={{
            fontSize: '0.84rem',
            color: '#334155',
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          <div>
            &copy; 2026 <strong style={{ color: '#0f172a', fontWeight: 700 }}>Shri Sai I.T.I.</strong> All rights reserved.
          </div>
          <div style={{ marginTop: '0.2rem', color: '#475569' }}>
            Developed by{' '}
            <strong
              style={{
                color: '#097965',
                fontWeight: 800,
                letterSpacing: '0.01em',
              }}
            >
              Rushikesh Pattiwar
            </strong>
          </div>
        </div>
      </aside>
    </main>
  );
}
