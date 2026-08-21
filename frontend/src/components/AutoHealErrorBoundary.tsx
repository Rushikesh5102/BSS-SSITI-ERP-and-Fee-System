'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { safeStorage } from '../utils/safeStorage';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  autoHealAttempted: boolean;
}

export class AutoHealErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    autoHealAttempted: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, autoHealAttempted: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[AutoHeal] Component crash captured in ${this.props.moduleName || 'Workspace'}:`, error, errorInfo);
  }

  public handleAutoHeal = () => {
    // Purge corrupted local component states
    if (this.props.moduleName) {
      safeStorage.remove(`${this.props.moduleName.toLowerCase()}_state_cache`);
    }
    this.setState({ hasError: false, error: null, autoHealAttempted: true });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          background: 'var(--surface-2)',
          borderRadius: '12px',
          border: '1px solid var(--danger)',
          margin: '20px 0',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.1)'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🛡️</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            {this.props.fallbackTitle || 'Component Protected & Isolated'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 16px' }}>
            An unexpected runtime anomaly was safely isolated to prevent this module from crashing your entire session.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={this.handleAutoHeal}
              className="btn btn-primary btn-sm"
              style={{ background: '#0284c7', borderColor: '#0284c7', fontWeight: 700 }}
            >
              ⚡ Auto-Heal & Recover
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-secondary btn-sm"
            >
              🔄 Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AutoHealErrorBoundary;
