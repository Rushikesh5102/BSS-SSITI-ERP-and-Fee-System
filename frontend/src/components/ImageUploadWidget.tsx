'use client';

import React, { useState, useRef } from 'react';

interface ImageUploadWidgetProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export default function ImageUploadWidget({ value, onChange, label = 'Asset Image' }: ImageUploadWidgetProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [mode, setMode] = useState<'upload' | 'url'>('upload');
    const [urlInput, setUrlInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file (PNG, JPG, WEBP, etc.)');
            return;
        }

        // Limit file size to ~2MB before compression
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size exceeds 5MB. Please choose a smaller image.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
                // Compress image if needed using HTML canvas
                compressImage(result, (compressed) => {
                    onChange(compressed);
                });
            }
        };
        reader.readAsDataURL(file);
    };

    const compressImage = (dataUrl: string, callback: (compressed: string) => void) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 800; // Resize to max 800px width/height for fast loading

            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                callback(canvas.toDataURL('image/jpeg', 0.85));
            } else {
                callback(dataUrl);
            }
        };
        img.onerror = () => callback(dataUrl);
        img.src = dataUrl;
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleUrlApply = () => {
        if (urlInput.trim()) {
            onChange(urlInput.trim());
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>{label}</label>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        type="button"
                        onClick={() => setMode('upload')}
                        style={{
                            padding: '2px 8px',
                            fontSize: 11,
                            borderRadius: 4,
                            border: '1px solid var(--border)',
                            background: mode === 'upload' ? 'var(--primary)' : 'var(--surface-2)',
                            color: mode === 'upload' ? '#fff' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        📁 File Upload
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('url')}
                        style={{
                            padding: '2px 8px',
                            fontSize: 11,
                            borderRadius: 4,
                            border: '1px solid var(--border)',
                            background: mode === 'url' ? 'var(--primary)' : 'var(--surface-2)',
                            color: mode === 'url' ? '#fff' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        🔗 Web URL
                    </button>
                </div>
            </div>

            {value ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 12,
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--surface-2)'
                }}>
                    <div style={{
                        width: 64,
                        height: 64,
                        borderRadius: 6,
                        overflow: 'hidden',
                        background: '#000',
                        border: '1px solid var(--border)',
                        flexShrink: 0
                    }}>
                        <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Image Attached</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, wordBreak: 'break-all', maxLines: 1 }}>
                            {value.startsWith('data:') ? 'Local Image File (Compressed Base64)' : value}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="btn btn-ghost"
                        style={{ color: 'var(--danger)', fontSize: 12, padding: '4px 8px' }}
                    >
                        🗑️ Remove
                    </button>
                </div>
            ) : mode === 'upload' ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border)',
                        borderRadius: 8,
                        padding: '20px 16px',
                        textAlign: 'center',
                        background: isDragging ? 'rgba(2, 132, 199, 0.05)' : 'var(--surface-2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                handleFile(e.target.files[0]);
                            }
                        }}
                    />
                    <div style={{ fontSize: 28, marginBottom: 4 }}>🖼️</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Drag & Drop image here or <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Choose Image</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        Supports JPG, PNG, WEBP (Max 5MB)
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="url"
                        className="form-control"
                        placeholder="https://example.com/image.jpg"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                    />
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleUrlApply}
                    >
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
}
