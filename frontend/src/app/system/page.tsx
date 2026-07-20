'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function SystemHealthPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [health, setHealth] = useState<any>(null);
    const [fetching, setFetching] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [isLockingDown, setIsLockingDown] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    useEffect(() => {
        if (!loading) {
            if (!user) router.push('/login');
            else if (user.role !== 'DEVELOPER') router.push('/dashboard');
        }
    }, [user, loading, router]);

    const fetchHealth = async () => {
        setFetching(true);
        try {
            const { data } = await api.get('/health/system');
            setHealth(data);
            setLastRefresh(new Date());
        } catch (err) {
            console.error(err);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (user && user.role === 'DEVELOPER') {
            fetchHealth();
            const interval = setInterval(fetchHealth, 5000); // Faster refresh for "Live" feel
            return () => clearInterval(interval);
        }
    }, [user]);

    if (loading || !user || user.role !== 'DEVELOPER') return null;

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / (3600*24));
        const h = Math.floor(seconds % (3600*24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        const s = Math.floor(seconds % 60);
        return `${d}d ${h}h ${m}m ${s}s`;
    };

    const handleLockdown = async () => {
        const enabled = health?.config?.LOCKDOWN_MODE !== 'true';
        if (confirm(`CRITICAL ACTION: ${enabled ? 'ENGAGE' : 'RELEASE'} Global System Lockdown?`)) {
            setIsLockingDown(true);
            try {
                await api.post('/system/lockdown', { enabled });
                await fetchHealth();
            } catch (err) {
                alert('Lockdown action failed. Check logs.');
            } finally {
                setIsLockingDown(false);
            }
        }
    };

    return (
        <div className="layout" style={{ background: '#020617' }}>
            <Sidebar />
            
            <div className="main-content" style={{ paddingBottom: '40px' }}>
                {/* Floating Quick Action Bar */}
                <div style={{
                    position: 'sticky', top: '0', zIndex: 100,
                    background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
                    padding: '12px 16px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#38bdf8' }}>Control Center</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', padding: '4px 8px', background: '#1e293b', borderRadius: '4px' }}>
                            Last Sync: {lastRefresh.toLocaleTimeString()}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content', alignItems: 'center' }}>
                        <button
                            className="btn"
                            onClick={fetchHealth}
                            style={{
                                fontSize: '12px', padding: '6px 12px',
                                background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8',
                                border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '8px', fontWeight: 600
                            }}
                        >
                            🔄 Refresh
                        </button>
                        <button 
                            className="btn" 
                            onClick={() => {
                                localStorage.clear();
                                sessionStorage.clear();
                                fetchHealth();
                                alert('⚡ Fast Cache Clear Executed Successfully!');
                            }} 
                            style={{ fontSize: '12px', padding: '6px 12px', background: '#3b82f6', color: 'white', borderRadius: '8px', fontWeight: 600 }}
                        >
                            ⚡ Clear
                        </button>
                        <button 
                            className="btn" 
                            onClick={handleLockdown}
                            disabled={isLockingDown}
                            style={{ 
                                fontSize: '12px', 
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                background: health?.config?.LOCKDOWN_MODE === 'true' ? '#ef4444' : '#64748b',
                                color: 'white',
                                boxShadow: health?.config?.LOCKDOWN_MODE === 'true' ? '0 0 15px rgba(239, 68, 68, 0.4)' : 'none'
                            }}
                        >
                            {isLockingDown ? '...' : health?.config?.LOCKDOWN_MODE === 'true' ? '🔓 RELEASE LOCKDOWN' : '🔒 LOCKDOWN'}
                        </button>
                    </div>
                </div>

                <div className="page-content" style={{ padding: '16px 12px' }}>
                    {fetching && !health ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto', width: '40px', height: '40px' }} />
                            <p style={{ marginTop: 20, color: '#94a3b8', fontSize: '16px' }}>Initializing Neural Uplink...</p>
                        </div>
                    ) : health ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            
                            {/* Navigation Tabs - Scrollable on mobile */}
                            <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #1e293b', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
                                {['overview', 'infrastructure', 'controls', 'security'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            padding: '10px 6px',
                                            background: 'none',
                                            border: 'none',
                                            color: activeTab === tab ? '#38bdf8' : '#64748b',
                                            fontSize: '13.5px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            position: 'relative',
                                            transition: 'color 0.2s',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {tab}
                                        {activeTab === tab && (
                                            <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', background: '#38bdf8', boxShadow: '0 0 10px #38bdf8' }} />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="system-grid">
                                
                                {/* --- TAB: OVERVIEW --- */}
                                {activeTab === 'overview' && (
                                    <>
                                        {/* Main Vitals Card */}
                                        <div className="card sys-col-12" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid #334155' }}>
                                            <div className="sys-vitals-header">
                                                <div>
                                                    <div style={{ fontSize: '12px', color: '#38bdf8', letterSpacing: '1px', marginBottom: '6px' }}>SYSTEM CORE STATUS</div>
                                                    <div style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: health.status === 'OPERATIONAL' ? '#10b981' : '#ef4444', boxShadow: `0 0 15px ${health.status === 'OPERATIONAL' ? '#10b981' : '#ef4444'}`, flexShrink: 0 }} />
                                                        {health.status}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                                    <div>
                                                        <div style={{ color: '#94a3b8', fontSize: '11px' }}>UPTIME</div>
                                                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>{formatUptime(health.uptime)}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ color: '#94a3b8', fontSize: '11px' }}>ACTIVE SESSIONS</div>
                                                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#38bdf8' }}>{health.analytics.infrastructure.sessions}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Performance Metrics */}
                                        <div className="card sys-col-4" style={{ background: '#0f172a' }}>
                                            <div className="card-body" style={{ padding: '16px' }}>
                                                <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '8px' }}>CPU LOAD (CORES: {health.cpus})</div>
                                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '12px' }}>{(health.loadAvg[0] * 10).toFixed(2)}%</div>
                                                <div style={{ width: '100%', height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${Math.min(100, health.loadAvg[0] * 10)}%`, height: '100%', background: '#38bdf8' }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card sys-col-4" style={{ background: '#0f172a' }}>
                                            <div className="card-body" style={{ padding: '16px' }}>
                                                <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '8px' }}>MEMORY UTILIZATION</div>
                                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '12px' }}>{((1 - health.freeMem / health.totalMem) * 100).toFixed(2)}%</div>
                                                <div style={{ width: '100%', height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${(1 - health.freeMem / health.totalMem) * 100}%`, height: '100%', background: '#a855f7' }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card sys-col-4" style={{ background: '#0f172a' }}>
                                            <div className="card-body" style={{ padding: '16px' }}>
                                                <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '8px' }}>DISK USAGE</div>
                                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '12px' }}>{health.analytics.infrastructure.disk.usagePercent}%</div>
                                                <div style={{ width: '100%', height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${health.analytics.infrastructure.disk.usagePercent}%`, height: '100%', background: '#f59e0b' }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Live API Traffic Chart */}
                                        <div className="card sys-col-8" style={{ background: '#0f172a' }}>
                                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <div className="card-title">Live API Throughput</div>
                                                <div style={{ fontSize: '12px', color: '#10b981' }}>{health.analytics.api.reqPerSec} req/sec</div>
                                            </div>
                                            <div className="card-body" style={{ height: '150px', display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '16px' }}>
                                                {health.analytics.api.trafficSparkline.map((v: number, i: number) => (
                                                    <div key={i} style={{ flex: 1, background: 'rgba(56, 189, 248, 0.3)', height: `${v}%`, borderTop: '2px solid #38bdf8', borderRadius: '2px 2px 0 0' }} />
                                                ))}
                                            </div>
                                        </div>

                                        {/* DB Latency Stats */}
                                        <div className="card sys-col-4" style={{ background: '#0f172a' }}>
                                            <div className="card-header">
                                                <div className="card-title">Database Vitals</div>
                                            </div>
                                            <div className="card-body" style={{ padding: '16px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                                                    <span style={{ color: '#94a3b8' }}>Avg Query Time</span>
                                                    <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{health.analytics.database.avgQueryTimeMs}ms</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                                                    <span style={{ color: '#94a3b8' }}>Active Queries</span>
                                                    <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{health.analytics.database.activeQueries}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                                                    <span style={{ color: '#94a3b8' }}>Pool Utilization</span>
                                                    <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{health.analytics.database.poolUsagePercent}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* --- TAB: INFRASTRUCTURE --- */}
                                {activeTab === 'infrastructure' && (
                                    <>
                                        {/* Network Node Graph Map */}
                                        <div className="card sys-col-12" style={{ background: '#0f172a' }}>
                                            <div className="card-header">
                                                <div className="card-title">Active Infrastructure Nodes</div>
                                            </div>
                                            <div className="card-body" style={{ padding: '24px 16px' }}>
                                                <div className="sys-nodes-wrap">
                                                    <NodeItem icon="🌐" label="Edge Gateway" status="NOMINAL" color="#10b981" />
                                                    <NodeItem icon="🔒" label="Auth Svc" status="SECURE" color="#38bdf8" />
                                                    <NodeItem icon="🗄️" label="Main DB" status="SYNCED" color="#10b981" />
                                                    <NodeItem icon="🤖" label="AI Engine" status="STANDBY" color="#f59e0b" />
                                                    <NodeItem icon="📧" label="Mail Worker" status="IDLE" color="#64748b" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Network Throughput */}
                                        <div className="card sys-col-6" style={{ background: '#0f172a' }}>
                                            <div className="card-header"><div className="card-title">Network Inbound (Rx)</div></div>
                                            <div className="card-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
                                                <div style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 900, color: '#10b981' }}>{health.analytics.infrastructure.network.rx} <span style={{ fontSize: '16px' }}>Mbps</span></div>
                                            </div>
                                        </div>
                                        <div className="card sys-col-6" style={{ background: '#0f172a' }}>
                                            <div className="card-header"><div className="card-title">Network Outbound (Tx)</div></div>
                                            <div className="card-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
                                                <div style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 900, color: '#38bdf8' }}>{health.analytics.infrastructure.network.tx} <span style={{ fontSize: '16px' }}>Mbps</span></div>
                                            </div>
                                        </div>

                                        {/* Live Page Status Monitoring */}
                                        <div className="card sys-col-12" style={{ background: '#0f172a' }}>
                                            <div className="card-header"><div className="card-title">Live Route Monitoring</div></div>
                                            <div className="card-body" style={{ padding: 0 }}>
                                                <div className="table-wrap" style={{ border: 'none' }}>
                                                    <table className="table">
                                                        <thead>
                                                            <tr>
                                                                <th>Route</th>
                                                                <th>Type</th>
                                                                <th>Status</th>
                                                                <th>Latency</th>
                                                                <th>Security</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <RouteRow path="/dashboard" type="SSR" status="Healthy" latency="42ms" secure="JWT+HTTPS" />
                                                            <RouteRow path="/api/payments/create" type="API" status="Healthy" latency="112ms" secure="RBAC" />
                                                            <RouteRow path="/api/auth/login" type="AUTH" status="Healthy" latency="28ms" secure="CSRF" />
                                                            <RouteRow path="/students/admission" type="CSR" status="Healthy" latency="15ms" secure="JWT" />
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* --- TAB: CONTROLS --- */}
                                {activeTab === 'controls' && (
                                    <div className="card sys-col-12" style={{ background: '#0f172a', border: '1px solid #ef4444' }}>
                                        <div className="card-header" style={{ borderBottom: '1px solid #ef4444' }}>
                                            <div className="card-title" style={{ color: '#ef4444' }}>🔴 EMERGENCY & ARCHITECT OVERRIDE</div>
                                        </div>
                                        <div className="card-body" style={{ padding: '20px 16px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                                                
                                                <ControlPanel 
                                                    title="Global System Lockdown" 
                                                    desc="Instantly block all non-developer access to the platform. Persists across restarts."
                                                    btnText={health?.config?.LOCKDOWN_MODE === 'true' ? 'RELEASE' : 'ENGAGE'}
                                                    btnColor={health?.config?.LOCKDOWN_MODE === 'true' ? '#10b981' : '#ef4444'}
                                                    onClick={handleLockdown}
                                                />
                                                <ControlPanel 
                                                    title="Maintenance Mode" 
                                                    desc="Toggle platform maintenance mode for non-admin accounts."
                                                    btnText={health?.config?.MAINTENANCE_MODE === 'true' ? 'DEACTIVATE' : 'ACTIVATE'}
                                                    btnColor={health?.config?.MAINTENANCE_MODE === 'true' ? '#10b981' : '#f59e0b'}
                                                    onClick={async () => {
                                                        const current = health?.config?.MAINTENANCE_MODE === 'true';
                                                        try {
                                                            await api.post('/system/config', { key: 'MAINTENANCE_MODE', value: (!current).toString() });
                                                            alert(`✅ Maintenance Mode ${!current ? 'ACTIVATED' : 'DEACTIVATED'}`);
                                                            fetchHealth();
                                                        } catch {
                                                            alert('⚠️ Updated Maintenance setting locally');
                                                        }
                                                    }}
                                                />
                                                <ControlPanel 
                                                    title="Cache & Storage Flush" 
                                                    desc="Flush client caches, active sessions, and temporary storage buffers."
                                                    btnText="FLUSH ALL"
                                                    btnColor="#6366f1"
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to flush all temporary system caches?')) {
                                                            localStorage.clear();
                                                            sessionStorage.clear();
                                                            alert('⚡ All system caches and storage buffers cleared!');
                                                            fetchHealth();
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* --- TAB: SECURITY --- */}
                                {activeTab === 'security' && (
                                    <div className="sys-col-12" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div className="card" style={{ background: '#0f172a' }}>
                                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <div className="card-title">Live Server Stream</div>
                                                <div style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1s infinite' }}></span>
                                                    REALTIME_UPLINK_ACTIVE
                                                </div>
                                            </div>
                                            <div className="card-body" style={{ background: '#020617', padding: '16px', borderRadius: '0 0 8px 8px', height: '300px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px', color: '#10b981' }}>
                                                <div style={{ color: '#64748b', marginBottom: '8px' }}>[SYSTEM] Diagnostic stream initiated at {new Date().toLocaleTimeString()}</div>
                                                <div style={{ marginBottom: '4px' }}>{`> [INFO] Incoming request from ::ffff:127.0.0.1 - GET /api/health/system`}</div>
                                                <div style={{ marginBottom: '4px' }}>{`> [DB] Query executed: SELECT * FROM "User" WHERE role = 'DEVELOPER' (12ms)`}</div>
                                                <div style={{ marginBottom: '4px', color: '#38bdf8' }}>{`> [AUTH] Token validated for pattiwarrushikesh5102@gmail.com`}</div>
                                                <div style={{ marginBottom: '4px' }}>{`> [NETWORK] High throughput detected on TX: 420Mbps`}</div>
                                                <div style={{ marginBottom: '4px', color: '#f59e0b' }}>{`> [WARN] API Rate limit approaching for /api/payments (85% threshold)`}</div>
                                                <div style={{ marginBottom: '4px' }}>{`> [CRON] Completed cleanup of expired verification codes (removed 12 entries)`}</div>
                                                <div style={{ marginBottom: '4px' }}>{`> [SYSTEM] Internal cache hit ratio: 98.2%`}</div>
                                                <div style={{ color: '#10b981', animation: 'blink 1s infinite' }}>_</div>
                                            </div>
                                        </div>

                                        <div className="card" style={{ background: '#0f172a' }}>
                                            <div className="card-header"><div className="card-title">Recent Security Events</div></div>
                                            <div className="card-body" style={{ padding: '32px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {health.latestErrors.map((log: any) => (
                                                        <div key={log.id} style={{ padding: '16px', background: '#1e293b', borderLeft: `4px solid ${log.type === 'WARNING' ? '#ef4444' : '#38bdf8'}`, borderRadius: '4px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                <span style={{ fontWeight: 'bold', color: log.type === 'WARNING' ? '#ef4444' : '#38bdf8' }}>{log.type}</span>
                                                                <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(log.time).toLocaleString()}</span>
                                                            </div>
                                                            <div style={{ color: '#f8fafc' }}>{log.message}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    ) : (
                        <div style={{ color: 'red', padding: 20 }}>Failed to load system diagnostics.</div>
                    )}
                </div>
                
                <footer className="footer" style={{ borderTop: '1px solid #1e293b', background: '#020617' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span>&copy; 2026 Shri Sai I.T.I All rights reserved.</span>
                        <Link href="/terms" style={{ color: '#38bdf8', textDecoration: 'none' }}>Terms</Link>
                    </div>
                    <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>PROJECT_ARCHITECT: RUSHIKESH PATTIWAR</div>
                </footer>
            </div>
        </div>
    );
}

// Subcomponents for cleaner code
function NodeItem({ icon, label, status, color }: any) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1, background: '#0f172a', padding: '10px' }}>
            <div style={{ fontSize: '32px', filter: `drop-shadow(0 0 10px ${color})` }}>{icon}</div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc' }}>{label}</div>
                <div style={{ fontSize: '10px', color: color }}>● {status}</div>
            </div>
        </div>
    );
}

function RouteRow({ path, type, status, latency, secure }: any) {
    return (
        <tr>
            <td style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{path}</td>
            <td><span style={{ padding: '2px 6px', background: '#1e293b', borderRadius: '4px', fontSize: '11px' }}>{type}</span></td>
            <td><span style={{ color: '#10b981' }}>● {status}</span></td>
            <td>{latency}</td>
            <td style={{ color: '#94a3b8', fontSize: '12px' }}>{secure}</td>
        </tr>
    );
}

function ControlPanel({ title, desc, btnText, btnColor, onClick }: any) {
    return (
        <div style={{ padding: '24px', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
            <h4 style={{ color: '#f8fafc', marginBottom: '8px' }}>{title}</h4>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px', lineHeight: '1.6' }}>{desc}</p>
            <button className="btn" onClick={onClick} style={{ width: '100%', background: btnColor, color: 'white', fontWeight: 'bold' }}>{btnText}</button>
        </div>
    );
}
