'use client';

import { useEffect, useState, Suspense } from 'react';
import Sidebar from '../../../components/Sidebar';
import { useAuth } from '../../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../../services/api';
import ImageUploadWidget from '../../../components/ImageUploadWidget';
import WelcomeOverlay from '../../../components/WelcomeOverlay';
import Footer from '../../../components/Footer';

interface StoreItem {
    id: string;
    name: string;
    sku: string | null;
    description: string | null;
    category: string;
    quantity: number;
    unit: string;
    reorderLevel: number;
    location: string | null;
    status: string;
    notes: string | null;
    branchId: string;
    image: string | null;
    createdBy?: { name: string; email: string } | null;
    branch?: { name: string };
}

const categoriesList = [
    'Electrical Tools',
    'Fitter & Machining',
    'Welding Equipment',
    'Electronics & IT',
    'Automotive & Mechanic',
    'Measurement & Calibration',
    'Safety & Protective Gear',
    'General Tools & Consumables'
];

const statusOptions = [
    { label: 'Available', value: 'AVAILABLE', color: '#10b981' },
    { label: 'Issued', value: 'ISSUED', color: '#0284c7' },
    { label: 'Under Maintenance', value: 'UNDER_MAINTENANCE', color: '#8b5cf6' },
    { label: 'Damaged', value: 'DAMAGED', color: '#ef4444' },
    { label: 'Lost', value: 'LOST', color: '#f59e0b' },
    { label: 'Decommissioned', value: 'DECOMMISSIONED', color: '#6b7280' },
];

function AssetRegisterContent() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const simulateParam = searchParams.get('simulate');

    const [items, setItems] = useState<StoreItem[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);

    // Filters
    const [itemSearch, setItemSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [onlyLowStock, setOnlyLowStock] = useState(false);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);

    // Form fields
    const [itemName, setItemName] = useState('');
    const [itemSku, setItemSku] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [itemCategory, setItemCategory] = useState('Electrical Tools');
    const [itemQuantity, setItemQuantity] = useState('1');
    const [itemUnit, setItemUnit] = useState('pcs');
    const [itemReorderLevel, setItemReorderLevel] = useState('5');
    const [itemLocation, setItemLocation] = useState('');
    const [itemStatus, setItemStatus] = useState('AVAILABLE');
    const [itemNotes, setItemNotes] = useState('');
    const [itemBranchId, setItemBranchId] = useState('');
    const [itemImage, setItemImage] = useState('');

    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const effectiveRole = (user?.role === 'DEVELOPER' && simulateParam) ? simulateParam.toUpperCase() : user?.role;
    const isAdminOrDev = effectiveRole === 'ADMIN' || effectiveRole === 'DEVELOPER';

    useEffect(() => {
        if (user && sessionStorage.getItem('showWelcomeAnimation')) {
            setShowWelcome(true);
            sessionStorage.removeItem('showWelcomeAnimation');
        }
    }, [user]);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    const fetchItems = async () => {
        setFetching(true);
        try {
            const { data } = await api.get(`/store/items?search=${encodeURIComponent(itemSearch)}&category=${encodeURIComponent(categoryFilter)}&status=${encodeURIComponent(statusFilter)}${selectedBranch ? `&branchId=${selectedBranch}` : ''}`);
            setItems(data.data || []);
            if (isAdminOrDev) {
                api.get('/branches').then(res => setBranches(res.data?.data || [])).catch(() => {});
            }
        } catch (err) {
            console.error('Error fetching asset register:', err);
        } finally {
            setFetching(false);
        }
    };

    const [storageStats, setStorageStats] = useState<any>(null);

    useEffect(() => {
        if (user) {
            fetchItems();
            api.get('/reports/storage-stats').then(({ data }) => setStorageStats(data.data)).catch(() => { });
        }
    }, [user, itemSearch, categoryFilter, statusFilter, selectedBranch, simulateParam]);

    const lowStockItems = items.filter(i => i.quantity <= i.reorderLevel);

    const openAddModal = () => {
        setItemName('');
        setItemSku('');
        setItemDescription('');
        setItemCategory('Electrical Tools');
        setItemQuantity('1');
        setItemUnit('pcs');
        setItemReorderLevel('5');
        setItemLocation('');
        setItemStatus('AVAILABLE');
        setItemNotes('');
        setItemBranchId(user?.branch?.id || '');
        setItemImage('');
        setFormError('');
        setShowAddModal(true);
    };

    const openEditModal = (item: StoreItem) => {
        setSelectedItem(item);
        setItemName(item.name);
        setItemSku(item.sku || '');
        setItemDescription(item.description || '');
        setItemCategory(item.category);
        setItemQuantity(item.quantity.toString());
        setItemUnit(item.unit);
        setItemReorderLevel(item.reorderLevel.toString());
        setItemLocation(item.location || '');
        setItemStatus(item.status || 'AVAILABLE');
        setItemNotes(item.notes || '');
        setItemBranchId(item.branchId);
        setItemImage(item.image || '');
        setFormError('');
        setShowEditModal(true);
    };

    const handleCreateAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);
        try {
            await api.post('/store/items', {
                name: itemName,
                sku: itemSku || undefined,
                description: itemDescription,
                category: itemCategory,
                quantity: parseInt(itemQuantity, 10) || 0,
                unit: itemUnit,
                reorderLevel: parseInt(itemReorderLevel, 10) || 5,
                location: itemLocation,
                status: itemStatus,
                notes: itemNotes,
                branchId: itemBranchId,
                image: itemImage || undefined
            });
            setShowAddModal(false);
            fetchItems();
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to create asset');
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        setFormError('');
        setFormLoading(true);
        try {
            await api.put(`/store/items/${selectedItem.id}`, {
                name: itemName,
                sku: itemSku || undefined,
                description: itemDescription,
                category: itemCategory,
                quantity: parseInt(itemQuantity, 10) || 0,
                unit: itemUnit,
                reorderLevel: parseInt(itemReorderLevel, 10) || 5,
                location: itemLocation,
                status: itemStatus,
                notes: itemNotes,
                image: itemImage || null
            });
            setShowEditModal(false);
            fetchItems();
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to update asset');
        } finally {
            setFormLoading(false);
        }
    };

    const handleSoftArchiveAsset = async (itemId: string, name: string) => {
        if (confirm(`Archive "${name}"? Status will be updated to Decommissioned and safely preserved for audit records.`)) {
            try {
                await api.delete(`/store/items/${itemId}`);
                fetchItems();
            } catch (err: any) {
                alert(err.response?.data?.message || 'Failed to archive item');
            }
        }
    };

    const displayedItems = items.filter(item => {
        if (onlyLowStock && item.quantity > item.reorderLevel) return false;
        return true;
    });

    if (loading || !user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        );
    }

    return (
        <div className="layout">
            {showWelcome && <WelcomeOverlay role={user.role} />}
            <Sidebar />

            <div className="main-content" style={{ paddingBottom: '40px' }}>
                {/* Header */}
                <div className="page-header" style={{
                    background: 'var(--surface-card)',
                    borderBottom: '1px solid var(--border)',
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 16
                }}>
                    <div>
                        <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Sai ITI Workshop Inventory
                        </span>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '4px 0 0', color: 'var(--text-primary)' }}>
                            📋 Workshop Asset Register
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={openAddModal} className="btn btn-primary" style={{ fontSize: 13 }}>
                            ➕ Add New Workshop Asset
                        </button>
                        <button onClick={() => router.push('/store')} className="btn btn-secondary" style={{ fontSize: 13 }}>
                            🛠️ Tool Issue & Movement →
                        </button>
                    </div>
                </div>

                <div className="page-content" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Storage Alert (90% Warning Threshold) */}
                    {storageStats && storageStats.totalUsedPercent >= 80 && (
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.18) 100%)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '12px',
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 12,
                            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 24 }}>🚨</span>
                                <div>
                                    <div style={{ fontWeight: 800, color: 'var(--danger)', fontSize: 14 }}>
                                        CRITICAL STORAGE WARNING: System Storage Reached {storageStats.totalUsedPercent}% Capacity!
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2 }}>
                                        PostgreSQL & file storage usage has crossed 90% threshold ({storageStats.dbUsedMb} MB / {storageStats.dbLimitMb} MB limit). Contact Administrator to purge audit logs.
                                    </div>
                                </div>
                            </div>
                            <a href="/system" className="btn" style={{ background: 'var(--danger)', color: '#ffffff', fontSize: 12, padding: '6px 14px', border: 'none' }}>
                                ⚙️ Manage System Storage
                            </a>
                        </div>
                    )}

                    {/* Low stock alert banner */}
                    {lowStockItems.length > 0 && (
                        <div style={{
                            background: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '12px',
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 12
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 24 }}>⚠️</span>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#d97706', fontSize: 14 }}>
                                        Low Stock & Reorder Alert ({lowStockItems.length} Asset Types At/Below Minimum Threshold)
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2 }}>
                                        Consumables & tools requiring replenishment: <b>{lowStockItems.map(i => `${i.name} (${i.quantity} left)`).join(', ')}</b>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setOnlyLowStock(!onlyLowStock)} className="btn" style={{ background: '#f59e0b', color: '#fff', fontSize: 12, padding: '6px 14px' }}>
                                {onlyLowStock ? 'Show All Assets' : 'View Low Stock Only'}
                            </button>
                        </div>
                    )}

                    {/* Summary metrics cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 12
                    }}>
                        <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', width: 38, height: 38, borderRadius: 10 }}>
                                <span style={{ fontSize: 18 }}>📋</span>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>TOTAL ASSETS</div>
                                <div style={{ color: '#10b981', fontSize: 22, fontWeight: 800 }}>{items.length}</div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-icon" style={{ background: 'rgba(2, 132, 199, 0.1)', width: 38, height: 38, borderRadius: 10 }}>
                                <span style={{ fontSize: 18 }}>📦</span>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>TOTAL QUANTITY</div>
                                <div style={{ color: '#0284c7', fontSize: 22, fontWeight: 800 }}>
                                    {items.reduce((acc, curr) => acc + curr.quantity, 0)}
                                </div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', width: 38, height: 38, borderRadius: 10 }}>
                                <span style={{ fontSize: 18 }}>📉</span>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>LOW STOCK ALERTS</div>
                                <div style={{ color: lowStockItems.length > 0 ? '#f59e0b' : 'var(--text-primary)', fontSize: 22, fontWeight: 800 }}>
                                    {lowStockItems.length}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="card" style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, alignItems: 'center' }}>
                            <div>
                                <label className="form-label" style={{ fontSize: 11 }}>Search Asset / SKU / Location</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="🔍 Search name, SKU, location..."
                                    value={itemSearch}
                                    onChange={(e) => setItemSearch(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="form-label" style={{ fontSize: 11 }}>Category</label>
                                <select className="form-control" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                    <option value="">All Categories</option>
                                    {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="form-label" style={{ fontSize: 11 }}>Status Filter</label>
                                <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="">All Statuses</option>
                                    {statusOptions.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingTop: 20 }}>
                                <button
                                    type="button"
                                    onClick={() => setOnlyLowStock(!onlyLowStock)}
                                    className={`btn ${onlyLowStock ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ width: '100%', fontSize: 12, justifyContent: 'center' }}
                                >
                                    {onlyLowStock ? '⚠️ Showing Low Stock Only' : '📉 Filter Low Stock Alerts'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Asset Table */}
                    {fetching ? (
                        <div style={{ padding: '60px 0', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto', width: 36, height: 36 }} />
                            <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Loading Asset Register...</p>
                        </div>
                    ) : displayedItems.length === 0 ? (
                        <div className="card" style={{ padding: '50px 20px', textAlign: 'center' }}>
                            <div style={{ fontSize: 36, marginBottom: 8 }}>🛠️</div>
                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>No Assets Found</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                                {onlyLowStock ? 'No assets are currently low in stock!' : 'Adjust your filters or click "Add New Workshop Asset".'}
                            </p>
                        </div>
                    ) : (
                        <div className="table-wrap" style={{ border: 'none', background: 'var(--surface-card)', borderRadius: '12px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                            <table className="table" style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--surface-2)' }}>
                                        <th style={{ textAlign: 'left', padding: '14px 16px', whiteSpace: 'nowrap' }}>Item Name</th>
                                        <th style={{ textAlign: 'left', padding: '14px 12px', whiteSpace: 'nowrap' }}>Category</th>
                                        <th style={{ textAlign: 'center', padding: '14px 12px', whiteSpace: 'nowrap' }}>Quantity</th>
                                        <th style={{ textAlign: 'center', padding: '14px 12px', whiteSpace: 'nowrap' }}>Reorder Level</th>
                                        <th style={{ textAlign: 'left', padding: '14px 12px', whiteSpace: 'nowrap' }}>Rack Location</th>
                                        <th style={{ textAlign: 'center', padding: '14px 12px', whiteSpace: 'nowrap' }}>Status</th>
                                        <th style={{ textAlign: 'right', padding: '14px 16px', whiteSpace: 'nowrap' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedItems.map((item) => {
                                        const isLow = item.quantity <= item.reorderLevel;
                                        const stObj = statusOptions.find(s => s.value === item.status) || { label: item.status || 'Available', color: '#10b981' };
                                        const cleanUnit = (item.unit || 'pcs').replace(/pcs\s*pcs/gi, 'pcs').trim();

                                        return (
                                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', background: isLow ? 'rgba(245, 158, 11, 0.04)' : 'transparent' }}>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{
                                                            width: '40px', height: '40px', borderRadius: '8px',
                                                            background: 'var(--surface-2)', display: 'flex', alignItems: 'center',
                                                            justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border)',
                                                            flexShrink: 0
                                                        }}>
                                                            {item.image ? (
                                                                <img
                                                                    src={item.image}
                                                                    alt={item.name}
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    onError={(e) => {
                                                                        (e.target as HTMLElement).style.display = 'none';
                                                                        if ((e.target as HTMLElement).parentElement) {
                                                                            (e.target as HTMLElement).parentElement!.innerHTML = '<span style="font-size: 18px;">🛠️</span>';
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span style={{ fontSize: '18px' }}>🛠️</span>
                                                            )}
                                                        </div>
                                                        <div style={{ minWidth: 0, flex: 1 }}>
                                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                                <span>{item.name}</span>
                                                                {isLow && (
                                                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#f59e0b', color: '#ffffff', whiteSpace: 'nowrap' }}>
                                                                        ⚠️ Low Stock Reorder
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {item.sku && <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginTop: 2 }}>SKU: {item.sku}</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 12px', whiteSpace: 'nowrap' }}>
                                                    <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: '6px', background: 'var(--surface-2)', color: 'var(--text-primary)', fontWeight: 700 }}>
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                                                        {item.quantity} {cleanUnit}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                                    {item.reorderLevel} {cleanUnit}
                                                </td>
                                                <td style={{ padding: '14px 12px', color: 'var(--text-primary)', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>
                                                    {item.location ? `📍 ${item.location}` : 'Unassigned'}
                                                </td>
                                                <td style={{ padding: '14px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <span style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        background: `${stObj.color}18`,
                                                        color: stObj.color,
                                                        border: `1px solid ${stObj.color}40`,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        ● {stObj.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => openEditModal(item)}
                                                            className="btn"
                                                            style={{
                                                                padding: '5px 10px',
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                background: 'rgba(2, 132, 199, 0.12)',
                                                                color: '#0284c7',
                                                                border: '1px solid rgba(2, 132, 199, 0.3)',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleSoftArchiveAsset(item.id, item.name)}
                                                            className="btn"
                                                            style={{
                                                                padding: '5px 10px',
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                background: 'rgba(239, 68, 68, 0.12)',
                                                                color: '#ef4444',
                                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            📦 Archive
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <Footer />
            </div>

            {/* ADD ASSET MODAL */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, width: '92vw' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">➕ Add New Workshop Asset</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateAsset}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {formError && <div style={{ color: 'var(--danger)', fontSize: 13, background: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '8px' }}>⚠️ {formError}</div>}

                                <ImageUploadWidget value={itemImage} onChange={(val) => setItemImage(val)} label="Item / Asset Photo (Drag & Drop or Choose File)" />

                                <div className="form-group">
                                    <label className="form-label">Asset Name *</label>
                                    <input type="text" className="form-control" required value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Digital Vernier Caliper 150mm" />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div className="form-group">
                                        <label className="form-label">SKU / Serial No</label>
                                        <input type="text" className="form-control" value={itemSku} onChange={e => setItemSku(e.target.value)} placeholder="e.g. ITI-FIT-0042" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Category *</label>
                                        <select className="form-control" required value={itemCategory} onChange={e => setItemCategory(e.target.value)}>
                                            {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                                    <div className="form-group">
                                        <label className="form-label">Quantity *</label>
                                        <input type="number" className="form-control" required value={itemQuantity} onChange={e => setItemQuantity(e.target.value)} min="0" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Unit *</label>
                                        <input type="text" className="form-control" required value={itemUnit} onChange={e => setItemUnit(e.target.value)} placeholder="pcs, sets" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Reorder Level *</label>
                                        <input type="number" className="form-control" required value={itemReorderLevel} onChange={e => setItemReorderLevel(e.target.value)} min="0" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div className="form-group">
                                        <label className="form-label">Rack Location</label>
                                        <input type="text" className="form-control" value={itemLocation} onChange={e => setItemLocation(e.target.value)} placeholder="e.g. Fitter Lab - Rack B2" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Status *</label>
                                        <select className="form-control" value={itemStatus} onChange={e => setItemStatus(e.target.value)}>
                                            {statusOptions.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Saving...' : '💾 Save Asset'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT ASSET MODAL */}
            {showEditModal && selectedItem && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, width: '92vw' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">✏️ Edit Asset: {selectedItem.name}</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowEditModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleUpdateAsset}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {formError && <div style={{ color: 'var(--danger)', fontSize: 13, background: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '8px' }}>⚠️ {formError}</div>}

                                <ImageUploadWidget value={itemImage} onChange={(val) => setItemImage(val)} label="Item / Asset Photo (Drag & Drop or Choose File)" />

                                <div className="form-group">
                                    <label className="form-label">Asset Name *</label>
                                    <input type="text" className="form-control" required value={itemName} onChange={e => setItemName(e.target.value)} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div className="form-group">
                                        <label className="form-label">SKU / Serial No</label>
                                        <input type="text" className="form-control" value={itemSku} onChange={e => setItemSku(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Category *</label>
                                        <select className="form-control" required value={itemCategory} onChange={e => setItemCategory(e.target.value)}>
                                            {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                                    <div className="form-group">
                                        <label className="form-label">Quantity *</label>
                                        <input type="number" className="form-control" required value={itemQuantity} onChange={e => setItemQuantity(e.target.value)} min="0" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Unit *</label>
                                        <input type="text" className="form-control" required value={itemUnit} onChange={e => setItemUnit(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Reorder Level *</label>
                                        <input type="number" className="form-control" required value={itemReorderLevel} onChange={e => setItemReorderLevel(e.target.value)} min="0" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div className="form-group">
                                        <label className="form-label">Rack Location</label>
                                        <input type="text" className="form-control" value={itemLocation} onChange={e => setItemLocation(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Status *</label>
                                        <select className="form-control" value={itemStatus} onChange={e => setItemStatus(e.target.value)}>
                                            {statusOptions.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Saving...' : '💾 Update Asset'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AssetRegisterPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
        }>
            <AssetRegisterContent />
        </Suspense>
    );
}
