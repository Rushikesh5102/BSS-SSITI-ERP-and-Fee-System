'use client';

import React, { useEffect } from 'react';

export interface ReceiptDownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiptNumber: string;
    studentName?: string;
    amount?: number | string;
    receiptDate?: string | Date;
}

export default function ReceiptDownloadModal({
    isOpen,
    onClose,
    receiptNumber,
    studentName,
    amount,
    receiptDate,
}: ReceiptDownloadModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !receiptNumber) return null;

    const getBaseUrl = () => {
        return typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
            ? 'https://bss-ssiti-erp-and-fee-system.onrender.com'
            : 'http://localhost:4000';
    };

    const getReceiptUrl = (withLetterhead: boolean) => {
        const base = getBaseUrl();
        const cleanReceiptNum = encodeURIComponent(receiptNumber.trim());
        return `${base}/api/receipts/download/${cleanReceiptNum}?letterhead=${withLetterhead}`;
    };

    const handleDownload = (withLetterhead: boolean) => {
        const url = getReceiptUrl(withLetterhead);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${receiptNumber}${withLetterhead ? '_with_letterhead' : '_without_letterhead'}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleOpenTab = (withLetterhead: boolean) => {
        const url = getReceiptUrl(withLetterhead);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div
            className="modal-overlay"
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(10, 18, 35, 0.72)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10050,
                padding: 16,
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={onClose}
        >
            <div
                className="modal"
                style={{
                    maxWidth: 580,
                    width: '100%',
                    background: 'var(--surface, #ffffff)',
                    borderRadius: 16,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div
                    style={{
                        padding: '18px 24px',
                        background: 'linear-gradient(135deg, #0b1f44 0%, #153a77 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '3px solid #0284c7'
                    }}
                >
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 20 }}>🧾</span>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#ffffff' }}>
                                Download Fee Receipt
                            </h3>
                        </div>
                        <div style={{ fontSize: 12, color: '#93c5fd', marginTop: 4 }}>
                            Receipt <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#fef08a' }}>#{receiptNumber}</span>
                            {studentName && <> &bull; {studentName}</>}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.12)',
                            border: 'none',
                            color: '#ffffff',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            fontSize: 15,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s'
                        }}
                        title="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden' }}>
                    {/* Institutional Logo Watermark */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 200,
                        height: 200,
                        backgroundImage: "url('/sai_iti_logo.png')",
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        backgroundSize: 'contain',
                        opacity: 0.05,
                        pointerEvents: 'none',
                        zIndex: 0
                    }} />
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary, #475569)', lineHeight: 1.5 }}>
                        Select the receipt pattern you want to download or print. Both patterns contain official counterfoils for student and accounts office copies.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
                        {/* Option 1: With Letterhead */}
                        <div
                            style={{
                                border: '2px solid #0284c7',
                                borderRadius: 12,
                                padding: 16,
                                background: 'linear-gradient(180deg, rgba(2, 132, 199, 0.05) 0%, rgba(2, 132, 199, 0.01) 100%)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                position: 'relative',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <div>
                                <span
                                    style={{
                                        display: 'inline-block',
                                        fontSize: 10,
                                        fontWeight: 800,
                                        letterSpacing: '0.05em',
                                        color: '#0284c7',
                                        background: 'rgba(2, 132, 199, 0.12)',
                                        padding: '3px 8px',
                                        borderRadius: 6,
                                        marginBottom: 10,
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    ⭐ Recommended for Plain Paper
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <span style={{ fontSize: 22 }}>🏛️</span>
                                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                                        With Letterhead
                                    </h4>
                                </div>
                                <p style={{ fontSize: 12, color: 'var(--text-muted, #64748b)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                                    Includes full institution header, logo, contact info, and official ERP footer bar spread edge-to-edge.
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <button
                                    onClick={() => handleDownload(true)}
                                    className="btn btn-primary btn-sm"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        fontWeight: 700,
                                        padding: '9px 12px',
                                        fontSize: 12,
                                    }}
                                >
                                    📥 Download (With Letterhead)
                                </button>
                                <button
                                    onClick={() => handleOpenTab(true)}
                                    className="btn btn-ghost btn-sm"
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--primary, #0284c7)',
                                        padding: '4px 8px',
                                        textAlign: 'center'
                                    }}
                                >
                                    👁️ Preview With Letterhead
                                </button>
                            </div>
                        </div>

                        {/* Option 2: Without Letterhead */}
                        <div
                            style={{
                                border: '1.5px solid var(--border, #cbd5e1)',
                                borderRadius: 12,
                                padding: 16,
                                background: 'var(--surface-subtle, #f8fafc)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <div>
                                <span
                                    style={{
                                        display: 'inline-block',
                                        fontSize: 10,
                                        fontWeight: 800,
                                        letterSpacing: '0.05em',
                                        color: '#64748b',
                                        background: 'rgba(100, 116, 139, 0.12)',
                                        padding: '3px 8px',
                                        borderRadius: 6,
                                        marginBottom: 10,
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    📜 Pre-printed Stationery
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <span style={{ fontSize: 22 }}>🖨️</span>
                                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                                        Without Letterhead
                                    </h4>
                                </div>
                                <p style={{ fontSize: 12, color: 'var(--text-muted, #64748b)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                                    Receipt data & ledger only. Omits header and footer so you can print directly onto pre-printed institute stationery sheets.
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <button
                                    onClick={() => handleDownload(false)}
                                    className="btn btn-secondary btn-sm"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        fontWeight: 700,
                                        padding: '9px 12px',
                                        fontSize: 12,
                                    }}
                                >
                                    📥 Download (Without Letterhead)
                                </button>
                                <button
                                    onClick={() => handleOpenTab(false)}
                                    className="btn btn-ghost btn-sm"
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--text-secondary, #475569)',
                                        padding: '4px 8px',
                                        textAlign: 'center'
                                    }}
                                >
                                    👁️ Preview Without Letterhead
                                </button>
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            background: 'rgba(2, 132, 199, 0.06)',
                            border: '1px dashed #38bdf8',
                            borderRadius: 8,
                            padding: '10px 14px',
                            fontSize: 11.5,
                            color: 'var(--text-secondary, #334155)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <span>💡</span>
                        <span>
                            Both patterns generate dual counterfoils (Office Copy + Student Copy) with signatures, stamps, fee ledger, and amount in words.
                        </span>
                    </div>
                </div>

                {/* Modal Footer */}
                <div
                    style={{
                        padding: '12px 24px',
                        background: 'var(--surface-subtle, #f8fafc)',
                        borderTop: '1px solid var(--border, #e2e8f0)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}
                >
                    <button
                        onClick={onClose}
                        className="btn btn-secondary btn-sm"
                        style={{ minWidth: 80 }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
