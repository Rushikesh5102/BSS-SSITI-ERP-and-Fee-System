'use client';

import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../services/api';
import ImageUploadWidget from './ImageUploadWidget';
import WelcomeOverlay from './WelcomeOverlay';

interface StoreDashboardStats {
    totalItems: number;
    availableCount: number;
    issuedCount: number;
    issuedQuantity: number;
    overdueCount: number;
    damagedCount: number;
    maintenanceCount: number;
    lowStockCount: number;
}

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

export default function StoreModuleContent({ initialTab }: { initialTab?: string }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const simulateParam = searchParams.get('simulate');
    const tabParam = searchParams.get('tab') || initialTab || 'issue';

    const [activeTab, setActiveTab] = useState<string>(tabParam);
    useEffect(() => {
        if (tabParam) setActiveTab(tabParam);
    }, [tabParam]);

    const handleTabChange = (newTab: string) => {
        setActiveTab(newTab);
        let url = `/store?tab=${newTab}`;
        if (simulateParam) url += `&simulate=${simulateParam}`;
        router.push(url);
    };

    const [showWelcome, setShowWelcome] = useState(false);
    const [stats, setStats] = useState<StoreDashboardStats | null>(null);
    const [items, setItems] = useState<StoreItem[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [issues, setIssues] = useState<any[]>([]);
    const [activeIssues, setActiveIssues] = useState<any[]>([]);
    const [returnsList, setReturnsList] = useState<any[]>([]);
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
    const [damagedItems, setDamagedItems] = useState<any[]>([]);
    const [damageLogs, setDamageLogs] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);

    const [fetching, setFetching] = useState(true);

    // Filters for Asset Register
    const [itemSearch, setItemSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [onlyLowStock, setOnlyLowStock] = useState(false);

    // History Filters
    const [historySearch, setHistorySearch] = useState('');
    const [historyTypeFilter, setHistoryTypeFilter] = useState('');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);

    // Item Form
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

    // Issue Modal Form
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [issueItemId, setIssueItemId] = useState('');
    const [issueQuantity, setIssueQuantity] = useState('1');
    const [recipientType, setRecipientType] = useState<'STUDENT' | 'STAFF'>('STUDENT');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [staffName, setStaffName] = useState('');
    const [expectedReturnDate, setExpectedReturnDate] = useState('');
    const [issueRemarks, setIssueRemarks] = useState('');

    // Return Modal Form
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnIssueId, setReturnIssueId] = useState('');
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
    const [returnCondition, setReturnCondition] = useState<'GOOD' | 'MINOR_DAMAGE' | 'DAMAGED' | 'LOST'>('GOOD');
    const [returnRemarks, setReturnRemarks] = useState('');

    // Maintenance Modal Form
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [maintenanceItemId, setMaintenanceItemId] = useState('');
    const [maintenanceAction, setMaintenanceAction] = useState<'START' | 'COMPLETE' | 'UNREPAIRABLE'>('START');
    const [maintenanceRemarks, setMaintenanceRemarks] = useState('');

    // Damage Modal Form
    const [showDamageModal, setShowDamageModal] = useState(false);
    const [damageItemId, setDamageItemId] = useState('');
    const [damageCondition, setDamageCondition] = useState<'DAMAGED' | 'LOST'>('DAMAGED');
    const [damageQuantity, setDamageQuantity] = useState('1');
    const [damageRemarks, setDamageRemarks] = useState('');

    // Reports View Selection
    const [selectedReportType, setSelectedReportType] = useState<'ASSETS' | 'ISSUES' | 'MOVEMENT'>('ASSETS');

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

    const fetchAllData = async () => {
        setFetching(true);
        try {
            const [statsRes, itemsRes, txRes, activeIssuesRes, returnsRes, studentsRes] = await Promise.all([
                api.get('/store/dashboard-stats'),
                api.get(`/store/items?search=${encodeURIComponent(itemSearch)}&category=${encodeURIComponent(categoryFilter)}&status=${encodeURIComponent(statusFilter)}${selectedBranch ? `&branchId=${selectedBranch}` : ''}`),
                api.get('/store/transactions?limit=200'),
                api.get('/store/transactions?type=ISSUE&status=ISSUED'),
                api.get('/store/transactions?type=RETURN'),
                api.get('/students')
            ]);

            setStats(statsRes.data?.data || null);
            const allItemsList = itemsRes.data?.data || [];
            setItems(allItemsList);
            setDamagedItems(allItemsList.filter((i: any) => i.status === 'DAMAGED' || i.status === 'LOST'));

            const allTx = txRes.data?.data || [];
            setHistoryLogs(allTx);
            setIssues(allTx.filter((t: any) => t.type === 'ISSUE'));
            setMaintenanceLogs(allTx.filter((t: any) => t.type === 'MAINTENANCE'));
            setDamageLogs(allTx.filter((t: any) => t.type === 'DAMAGE' || t.type === 'LOSS' || t.condition === 'DAMAGED' || t.condition === 'LOST'));

            setActiveIssues(activeIssuesRes.data?.data || []);
            setReturnsList(returnsRes.data?.data || []);
            setStudents(studentsRes.data?.data || []);

            if (isAdminOrDev) {
                api.get('/branches').then(res => setBranches(res.data?.data || [])).catch(() => {});
            }
        } catch (err) {
            console.error('Error loading workshop asset data:', err);
        } finally {
            setFetching(false);
        }
    };

    const [storageStats, setStorageStats] = useState<any>(null);

    useEffect(() => {
        if (user) {
            fetchAllData();
            api.get('/reports/storage-stats').then(({ data }) => setStorageStats(data.data)).catch(() => { });
        }
    }, [user, itemSearch, categoryFilter, statusFilter, selectedBranch, simulateParam]);

    // Low stock items list for alerts
    const lowStockItems = items.filter(i => i.quantity <= i.reorderLevel);

    // Modal Trigger Handlers
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

    const openIssueModal = () => {
        setIssueItemId(items.find(i => i.quantity > 0)?.id || items[0]?.id || '');
        setIssueQuantity('1');
        setRecipientType('STUDENT');
        setSelectedStudentId(students[0]?.id || '');
        setStaffName('');
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        setExpectedReturnDate(defaultDate.toISOString().split('T')[0]);
        setIssueRemarks('');
        setFormError('');
        setShowIssueModal(true);
    };

    const openReturnModal = (issueId?: string) => {
        setReturnIssueId(issueId || activeIssues[0]?.id || '');
        setReturnDate(new Date().toISOString().split('T')[0]);
        setReturnCondition('GOOD');
        setReturnRemarks('');
        setFormError('');
        setShowReturnModal(true);
    };

    const openMaintenanceModal = (itemId?: string, action: 'START' | 'COMPLETE' | 'UNREPAIRABLE' = 'START') => {
        setMaintenanceItemId(itemId || items[0]?.id || '');
        setMaintenanceAction(action);
        setMaintenanceRemarks('');
        setFormError('');
        setShowMaintenanceModal(true);
    };

    const openDamageModal = () => {
        setDamageItemId(items[0]?.id || '');
        setDamageCondition('DAMAGED');
        setDamageQuantity('1');
        setDamageRemarks('');
        setFormError('');
        setShowDamageModal(true);
    };

    // Form Submit Handlers
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
            fetchAllData();
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
            fetchAllData();
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
                fetchAllData();
            } catch (err: any) {
                alert(err.response?.data?.message || 'Failed to archive item');
            }
        }
    };

    const handleIssueSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);
        try {
            await api.post('/store/transactions/issue', {
                itemId: issueItemId,
                quantity: parseInt(issueQuantity, 10),
                recipientType,
                studentId: recipientType === 'STUDENT' ? selectedStudentId : undefined,
                staffName: recipientType === 'STAFF' ? staffName : undefined,
                expectedReturnDate,
                remarks: issueRemarks
            });
            setShowIssueModal(false);
            fetchAllData();
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to issue tool');
        } finally {
            setFormLoading(false);
        }
    };

    const handleReturnSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);
        const targetIssue = activeIssues.find(i => i.id === returnIssueId);
        try {
            await api.post('/store/transactions/return', {
                transactionId: returnIssueId,
                itemId: targetIssue?.itemId,
                quantity: targetIssue?.quantity || 1,
                condition: returnCondition,
                returnDate,
                remarks: returnRemarks
            });
            setShowReturnModal(false);
            fetchAllData();
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to process return');
        } finally {
            setFormLoading(false);
        }
    };

    const handleMaintenanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);
        try {
            await api.post('/store/transactions/maintenance', {
                itemId: maintenanceItemId,
                action: maintenanceAction,
                quantity: 1,
                remarks: maintenanceRemarks
            });
            setShowMaintenanceModal(false);
            fetchAllData();
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to update maintenance record');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDamageSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);
        try {
            await api.post('/store/transactions/damage', {
                itemId: damageItemId,
                condition: damageCondition,
                quantity: parseInt(damageQuantity, 10),
                remarks: damageRemarks
            });
            setShowDamageModal(false);
            fetchAllData();
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to record damaged item');
        } finally {
            setFormLoading(false);
        }
    };

    // CSV Download Helper
    const downloadCSV = (filename: string, rows: string[][]) => {
        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => {
            const val = (cell || '').toString().split('"').join('""');
            return '"' + val + '"';
        }).join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', filename + '_' + new Date().toISOString().split('T')[0] + '.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isOverdue = (record: any) => {
        if (record.status !== 'ISSUED') return false;
        if (!record.expectedReturnDate) return false;
        return new Date(record.expectedReturnDate) < new Date();
    };

    const displayedItems = items.filter(item => {
        if (onlyLowStock && item.quantity > item.reorderLevel) return false;
        return true;
    });

    const filteredHistory = historyLogs.filter(log => {
        if (historyTypeFilter && log.type !== historyTypeFilter) return false;
        if (!historySearch) return true;
        const q = historySearch.toLowerCase();
        return (
            log.item?.name?.toLowerCase().includes(q) ||
            log.student?.name?.toLowerCase().includes(q) ||
            log.staffName?.toLowerCase().includes(q) ||
            log.remarks?.toLowerCase().includes(q) ||
            log.recordedBy?.name?.toLowerCase().includes(q)
        );
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

            <div className="main-content" style={{ paddingBottom: '40px', overflowX: 'hidden' }}>
                {/* Page Header */}
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
                            Sai ITI Workshop & Inventory Software
                        </span>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '4px 0 0', color: 'var(--text-primary)' }}>
                            🛠️ Workshop Tool Issue & Movement Management
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={openIssueModal} className="btn btn-primary" style={{ fontSize: 13 }}>
                            📤 Issue Tool
                        </button>
                        <button onClick={() => openReturnModal()} disabled={activeIssues.length === 0} className="btn btn-secondary" style={{ fontSize: 13 }}>
                            📥 Return Tool ({activeIssues.length})
                        </button>
                    </div>
                </div>

                <div className="page-content" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    
                    {/* ALERT BANNERS SECTION */}
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
                    {stats && stats.overdueCount > 0 && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '12px',
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 12
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 24 }}>🚨</span>
                                <div>
                                    <div style={{ fontWeight: 800, color: 'var(--danger)', fontSize: 14 }}>
                                        {stats.overdueCount} Overdue Tool Return Alert(s)
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2 }}>
                                        Tools issued to students/staff have passed their expected return date. Please check the Tool Issue Register.
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => handleTabChange('issue')} className="btn" style={{ background: 'var(--danger)', color: '#fff', fontSize: 12, padding: '6px 14px' }}>
                                View Overdue Tools →
                            </button>
                        </div>
                    )}

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
                            <button onClick={() => router.push('/store/items')} className="btn" style={{ background: '#f59e0b', color: '#fff', fontSize: 12, padding: '6px 14px' }}>
                                Go to Asset Register →
                            </button>
                        </div>
                    )}

                    {/* TOP METRIC CARDS - PERFECT FLEX & GRID FIX (FITS IN A SINGLE ROW AT 100% ZOOM) */}
                    {stats && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                            gap: 8,
                            width: '100%'
                        }}>
                            <div className="stat-card" style={{ padding: '10px 12px', cursor: 'pointer', overflow: 'hidden', minWidth: 0 }} onClick={() => router.push('/store/items')}>
                                <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
                                    <span style={{ fontSize: 15 }}>✅</span>
                                </div>
                                <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.4px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>TOTAL ASSETS</div>
                                    <div style={{ color: '#10b981', fontSize: 18, fontWeight: 800, lineHeight: 1.1, marginTop: 2 }}>{stats.availableCount}</div>
                                </div>
                            </div>

                            <div className="stat-card" style={{ padding: '10px 12px', cursor: 'pointer', overflow: 'hidden', minWidth: 0 }} onClick={() => handleTabChange('issue')}>
                                <div className="stat-icon" style={{ background: 'rgba(2, 132, 199, 0.1)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
                                    <span style={{ fontSize: 15 }}>📤</span>
                                </div>
                                <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.4px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>ISSUED TOOLS</div>
                                    <div style={{ color: '#0284c7', fontSize: 18, fontWeight: 800, lineHeight: 1.1, marginTop: 2 }}>{stats.issuedCount}</div>
                                </div>
                            </div>

                            <div className="stat-card" style={{ padding: '10px 12px', cursor: 'pointer', overflow: 'hidden', minWidth: 0 }} onClick={() => handleTabChange('issue')}>
                                <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
                                    <span style={{ fontSize: 15 }}>⏳</span>
                                </div>
                                <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.4px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>OVERDUE</div>
                                    <div style={{ color: stats.overdueCount > 0 ? '#ef4444' : 'var(--text-primary)', fontSize: 18, fontWeight: 800, lineHeight: 1.1, marginTop: 2 }}>
                                        {stats.overdueCount}
                                    </div>
                                </div>
                            </div>

                            <div className="stat-card" style={{ padding: '10px 12px', cursor: 'pointer', overflow: 'hidden', minWidth: 0 }} onClick={() => router.push('/store/items')}>
                                <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
                                    <span style={{ fontSize: 15 }}>📉</span>
                                </div>
                                <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.4px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>LOW STOCK</div>
                                    <div style={{ color: lowStockItems.length > 0 ? '#f59e0b' : 'var(--text-primary)', fontSize: 18, fontWeight: 800, lineHeight: 1.1, marginTop: 2 }}>
                                        {lowStockItems.length}
                                    </div>
                                </div>
                            </div>

                            <div className="stat-card" style={{ padding: '10px 12px', cursor: 'pointer', overflow: 'hidden', minWidth: 0 }} onClick={() => handleTabChange('maintenance')}>
                                <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
                                    <span style={{ fontSize: 15 }}>🔧</span>
                                </div>
                                <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.4px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>MAINTENANCE</div>
                                    <div style={{ color: '#8b5cf6', fontSize: 18, fontWeight: 800, lineHeight: 1.1, marginTop: 2 }}>{stats.maintenanceCount}</div>
                                </div>
                            </div>

                            <div className="stat-card" style={{ padding: '10px 12px', cursor: 'pointer', overflow: 'hidden', minWidth: 0 }} onClick={() => handleTabChange('damaged')}>
                                <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
                                    <span style={{ fontSize: 15 }}>⚠️</span>
                                </div>
                                <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.4px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>DAMAGED / LOST</div>
                                    <div style={{ color: '#ef4444', fontSize: 18, fontWeight: 800, lineHeight: 1.1, marginTop: 2 }}>{stats.damagedCount}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* INTEGRATED TAB BAR */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '6px',
                        gap: '6px',
                        width: '100%'
                    }}>
                        {[
                            { id: 'issue', label: '📤 Tool Issue Register', count: activeIssues.length },
                            { id: 'returns', label: '📥 Tool Return Register' },
                            { id: 'history', label: '🔄 Movement History' },
                            { id: 'maintenance', label: '🔧 Maintenance Log', count: stats?.maintenanceCount },
                            { id: 'damaged', label: '⚠️ Damaged / Lost', count: stats?.damagedCount },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => handleTabChange(t.id)}
                                style={{
                                    flex: '1 1 auto',
                                    minWidth: '130px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '9px 12px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    background: activeTab === t.id ? 'var(--primary)' : 'transparent',
                                    color: activeTab === t.id ? '#ffffff' : 'var(--text-primary)',
                                    boxShadow: activeTab === t.id ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <span>{t.label}</span>
                                {t.count !== undefined && t.count > 0 && (
                                    <span style={{
                                        fontSize: 10,
                                        padding: '1px 6px',
                                        borderRadius: 10,
                                        background: activeTab === t.id ? 'rgba(255,255,255,0.25)' : 'var(--surface-2)',
                                        color: activeTab === t.id ? '#ffffff' : 'var(--text-primary)'
                                    }}>
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>



                    {/* TAB 2: TOOL ISSUE REGISTER */}
                    {activeTab === 'issue' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>📤 Active & Issued Workshop Tools ({issues.length})</h3>
                                <button onClick={openIssueModal} className="btn btn-primary" style={{ fontSize: 13 }}>
                                    ➕ Issue Tool to Student / Staff
                                </button>
                            </div>

                            {issues.length === 0 ? (
                                <div className="card" style={{ padding: '50px 20px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 36, marginBottom: 8 }}>📤</div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>No Tool Issues Recorded</h3>
                                </div>
                            ) : (
                                <div className="table-wrap" style={{ border: 'none' }}>
                                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                                <th style={{ textAlign: 'left', padding: '14px' }}>Tool / Asset</th>
                                                <th style={{ textAlign: 'center', padding: '14px' }}>Quantity</th>
                                                <th style={{ textAlign: 'left', padding: '14px' }}>Issued To</th>
                                                <th style={{ textAlign: 'left', padding: '14px' }}>Issue Date</th>
                                                <th style={{ textAlign: 'left', padding: '14px' }}>Expected Return</th>
                                                <th style={{ textAlign: 'left', padding: '14px' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {issues.map((rec) => {
                                                const overdue = isOverdue(rec);
                                                const recipientName = rec.recipientType === 'STUDENT'
                                                    ? `${rec.student?.name || 'Student'} (${rec.student?.studentId || 'ID'})`
                                                    : `Staff: ${rec.staffName || 'N/A'}`;

                                                return (
                                                    <tr key={rec.id} style={{ borderBottom: '1px solid var(--border)', background: overdue ? 'rgba(239, 68, 68, 0.04)' : 'transparent' }}>
                                                        <td style={{ padding: '14px', fontWeight: 700 }}>{rec.item?.name}</td>
                                                        <td style={{ padding: '14px', textAlign: 'center', fontWeight: 800 }}>{rec.quantity} {rec.item?.unit || 'pcs'}</td>
                                                        <td style={{ padding: '14px', fontSize: 13 }}>{rec.recipientType === 'STUDENT' ? '🎓 ' : '👔 '}{recipientName}</td>
                                                        <td style={{ padding: '14px', fontSize: 12 }}>{new Date(rec.issuedDate || rec.createdAt).toLocaleDateString()}</td>
                                                        <td style={{ padding: '14px', fontSize: 12 }}>{rec.expectedReturnDate ? new Date(rec.expectedReturnDate).toLocaleDateString() : 'N/A'}</td>
                                                        <td style={{ padding: '14px' }}>
                                                            {rec.status === 'RETURNED' ? (
                                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>✓ Returned</span>
                                                            ) : overdue ? (
                                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>🚨 OVERDUE</span>
                                                            ) : (
                                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>● Active Issue</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: TOOL RETURN REGISTER */}
                    {activeTab === 'returns' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="card" style={{ padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>⏳ Pending Tools Waiting for Return ({activeIssues.length})</h3>
                                    <button onClick={() => openReturnModal()} disabled={activeIssues.length === 0} className="btn btn-primary" style={{ fontSize: 13 }}>
                                        📥 Process Return
                                    </button>
                                </div>

                                {activeIssues.length === 0 ? (
                                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                        ✅ No tools are currently pending return.
                                    </div>
                                ) : (
                                    <div className="table-wrap" style={{ border: 'none' }}>
                                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                                    <th style={{ textAlign: 'left', padding: '12px' }}>Tool Name</th>
                                                    <th style={{ textAlign: 'center', padding: '12px' }}>Qty</th>
                                                    <th style={{ textAlign: 'left', padding: '12px' }}>Issued To</th>
                                                    <th style={{ textAlign: 'left', padding: '12px' }}>Expected Return</th>
                                                    <th style={{ textAlign: 'right', padding: '12px' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {activeIssues.map((issue) => {
                                                    const overdue = issue.expectedReturnDate && new Date(issue.expectedReturnDate) < new Date();
                                                    return (
                                                        <tr key={issue.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                            <td style={{ padding: '12px', fontWeight: 700 }}>{issue.item?.name}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>{issue.quantity}</td>
                                                            <td style={{ padding: '12px', fontSize: 13 }}>{issue.recipientType === 'STUDENT' ? `🎓 ${issue.student?.name}` : `👔 Staff: ${issue.staffName}`}</td>
                                                            <td style={{ padding: '12px', fontSize: 12, color: overdue ? 'var(--danger)' : 'var(--text-primary)', fontWeight: overdue ? 700 : 400 }}>
                                                                {issue.expectedReturnDate ? new Date(issue.expectedReturnDate).toLocaleDateString() : 'N/A'} {overdue ? '(OVERDUE)' : ''}
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                                <button onClick={() => openReturnModal(issue.id)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}>
                                                                    📥 Return Tool
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: MOVEMENT HISTORY */}
                    {activeTab === 'history' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="card" style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                                    <div>
                                        <label className="form-label" style={{ fontSize: 11 }}>Search Movement Log</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="🔍 Search item, person, remarks..."
                                            value={historySearch}
                                            onChange={e => setHistorySearch(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label" style={{ fontSize: 11 }}>Action Type</label>
                                        <select className="form-control" value={historyTypeFilter} onChange={e => setHistoryTypeFilter(e.target.value)}>
                                            <option value="">All Movement Types</option>
                                            <option value="ISSUE">📤 Tool Issue</option>
                                            <option value="RETURN">📥 Tool Return</option>
                                            <option value="TRANSFER">🔄 Location Transfer</option>
                                            <option value="MAINTENANCE">🔧 Maintenance</option>
                                            <option value="DAMAGE">⚠️ Damage / Loss</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="table-wrap" style={{ border: 'none' }}>
                                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                            <th style={{ textAlign: 'left', padding: '14px' }}>Date & Time</th>
                                            <th style={{ textAlign: 'left', padding: '14px' }}>Action</th>
                                            <th style={{ textAlign: 'left', padding: '14px' }}>Asset / Tool</th>
                                            <th style={{ textAlign: 'center', padding: '14px' }}>Qty</th>
                                            <th style={{ textAlign: 'left', padding: '14px' }}>Person</th>
                                            <th style={{ textAlign: 'left', padding: '14px' }}>Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistory.map((log) => (
                                            <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '14px', fontSize: 11, color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                                                <td style={{ padding: '14px' }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'var(--surface-2)' }}>
                                                        {log.type}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px', fontWeight: 700 }}>{log.item?.name}</td>
                                                <td style={{ padding: '14px', textAlign: 'center', fontWeight: 700 }}>{log.quantity}</td>
                                                <td style={{ padding: '14px', fontSize: 12 }}>{log.recipientType === 'STUDENT' ? `🎓 ${log.student?.name}` : log.staffName ? `👔 ${log.staffName}` : '-'}</td>
                                                <td style={{ padding: '14px', fontSize: 12 }}>{log.remarks || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: MAINTENANCE LOG */}
                    {activeTab === 'maintenance' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="card" style={{ padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>🔧 Currently Under Maintenance ({items.filter(i => i.status === 'UNDER_MAINTENANCE').length})</h3>
                                    <button onClick={() => openMaintenanceModal(undefined, 'START')} className="btn btn-primary" style={{ fontSize: 13 }}>
                                        🔧 Send to Maintenance
                                    </button>
                                </div>

                                {items.filter(i => i.status === 'UNDER_MAINTENANCE').length === 0 ? (
                                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                        ✅ No tools are currently in repair.
                                    </div>
                                ) : (
                                    <div className="table-wrap" style={{ border: 'none' }}>
                                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                                    <th style={{ textAlign: 'left', padding: '12px' }}>Tool Name</th>
                                                    <th style={{ textAlign: 'left', padding: '12px' }}>Category</th>
                                                    <th style={{ textAlign: 'left', padding: '12px' }}>Location</th>
                                                    <th style={{ textAlign: 'right', padding: '12px' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.filter(i => i.status === 'UNDER_MAINTENANCE').map((item) => (
                                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '12px', fontWeight: 700 }}>{item.name}</td>
                                                        <td style={{ padding: '12px', fontSize: 12 }}>{item.category}</td>
                                                        <td style={{ padding: '12px', fontSize: 12 }}>📍 {item.location || 'Workshop'}</td>
                                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                                            <button onClick={() => openMaintenanceModal(item.id, 'COMPLETE')} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12, marginRight: 6 }}>
                                                                ✓ Repaired & Available
                                                            </button>
                                                            <button onClick={() => openMaintenanceModal(item.id, 'UNREPAIRABLE')} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12, color: 'var(--danger)' }}>
                                                                ❌ Unrepairable
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 6: DAMAGED / LOST */}
                    {activeTab === 'damaged' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="card" style={{ padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>⚠️ Assets Marked Damaged / Lost ({damagedItems.length})</h3>
                                    <button onClick={openDamageModal} className="btn btn-primary" style={{ fontSize: 13 }}>
                                        ⚠️ Report Damaged / Lost Asset
                                    </button>
                                </div>

                                {damagedItems.length === 0 ? (
                                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                        ✅ No assets are currently marked as damaged or lost.
                                    </div>
                                ) : (
                                    <div className="table-wrap" style={{ border: 'none' }}>
                                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                                    <th style={{ textAlign: 'left', padding: '12px' }}>Asset Name</th>
                                                    <th style={{ textAlign: 'left', padding: '12px' }}>Category</th>
                                                    <th style={{ textAlign: 'left', padding: '12px' }}>Location</th>
                                                    <th style={{ textAlign: 'left', padding: '12px' }}>Status</th>
                                                    <th style={{ textAlign: 'left', padding: '12px' }}>Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {damagedItems.map((item) => (
                                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '12px', fontWeight: 700 }}>{item.name}</td>
                                                        <td style={{ padding: '12px', fontSize: 12 }}>{item.category}</td>
                                                        <td style={{ padding: '12px', fontSize: 12 }}>📍 {item.location || 'N/A'}</td>
                                                        <td style={{ padding: '12px' }}>
                                                            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '12px', fontSize: 12 }}>{item.notes || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS */}
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

            {showIssueModal && (
                <div className="modal-overlay" onClick={() => setShowIssueModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500, width: '90vw' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">📤 Issue Workshop Tool</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowIssueModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleIssueSubmit}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {formError && <div style={{ color: 'var(--danger)', fontSize: 13, background: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '8px' }}>⚠️ {formError}</div>}

                                <div className="form-group">
                                    <label className="form-label">Select Asset / Tool *</label>
                                    <select className="form-control" required value={issueItemId} onChange={e => setIssueItemId(e.target.value)}>
                                        {items.map(item => (
                                            <option key={item.id} value={item.id} disabled={item.quantity <= 0}>
                                                {item.name} — Available: {item.quantity} {item.unit}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Quantity to Issue *</label>
                                    <input type="number" className="form-control" required min="1" value={issueQuantity} onChange={e => setIssueQuantity(e.target.value)} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Issue To *</label>
                                    <div style={{ display: 'flex', gap: 16, margin: '4px 0' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                            <input type="radio" name="recType" checked={recipientType === 'STUDENT'} onChange={() => setRecipientType('STUDENT')} />
                                            🎓 Student
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                            <input type="radio" name="recType" checked={recipientType === 'STAFF'} onChange={() => setRecipientType('STAFF')} />
                                            👔 Staff / Instructor
                                        </label>
                                    </div>
                                </div>

                                {recipientType === 'STUDENT' ? (
                                    <div className="form-group">
                                        <label className="form-label">Select Student *</label>
                                        <select className="form-control" required value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
                                            {students.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.studentId}) — {s.class}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label className="form-label">Staff Name *</label>
                                        <input type="text" className="form-control" required value={staffName} onChange={e => setStaffName(e.target.value)} placeholder="e.g. Prof. R. Sharma" />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Expected Return Date *</label>
                                    <input type="date" className="form-control" required value={expectedReturnDate} onChange={e => setExpectedReturnDate(e.target.value)} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowIssueModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Issuing...' : '📤 Issue Tool'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showReturnModal && (
                <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500, width: '90vw' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">📥 Process Tool Return</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowReturnModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleReturnSubmit}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {formError && <div style={{ color: 'var(--danger)', fontSize: 13, background: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '8px' }}>⚠️ {formError}</div>}

                                <div className="form-group">
                                    <label className="form-label">Select Active Issue *</label>
                                    <select className="form-control" required value={returnIssueId} onChange={e => setReturnIssueId(e.target.value)}>
                                        {activeIssues.map(issue => (
                                            <option key={issue.id} value={issue.id}>
                                                {issue.item?.name} — Issued to: {issue.recipientType === 'STUDENT' ? issue.student?.name : issue.staffName} (Qty: {issue.quantity})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Return Date *</label>
                                    <input type="date" className="form-control" required value={returnDate} onChange={e => setReturnDate(e.target.value)} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Returned Condition *</label>
                                    <select className="form-control" value={returnCondition} onChange={e => setReturnCondition(e.target.value as any)}>
                                        <option value="GOOD">✅ Good Condition (Return to Stock)</option>
                                        <option value="MINOR_DAMAGE">⚠️ Minor Wear (Return to Stock)</option>
                                        <option value="DAMAGED">❌ Damaged (Move to Damaged Register)</option>
                                        <option value="LOST">🚫 Lost (Move to Lost Register)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowReturnModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Processing...' : '📥 Complete Return'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showMaintenanceModal && (
                <div className="modal-overlay" onClick={() => setShowMaintenanceModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500, width: '90vw' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">🔧 Update Maintenance Status</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowMaintenanceModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleMaintenanceSubmit}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {formError && <div style={{ color: 'var(--danger)', fontSize: 13, background: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '8px' }}>⚠️ {formError}</div>}

                                <div className="form-group">
                                    <label className="form-label">Select Tool *</label>
                                    <select className="form-control" required value={maintenanceItemId} onChange={e => setMaintenanceItemId(e.target.value)}>
                                        {items.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.name} — Status: {item.status}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Action *</label>
                                    <select className="form-control" value={maintenanceAction} onChange={e => setMaintenanceAction(e.target.value as any)}>
                                        <option value="START">🔧 Send to Repair / Maintenance</option>
                                        <option value="COMPLETE">✅ Repair Completed (Return to Stock)</option>
                                        <option value="UNREPAIRABLE">❌ Unrepairable (Move to Damaged)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowMaintenanceModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Saving...' : '💾 Save Action'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDamageModal && (
                <div className="modal-overlay" onClick={() => setShowDamageModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500, width: '90vw' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">⚠️ Report Damaged or Lost Asset</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowDamageModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleDamageSubmit}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {formError && <div style={{ color: 'var(--danger)', fontSize: 13, background: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '8px' }}>⚠️ {formError}</div>}

                                <div className="form-group">
                                    <label className="form-label">Select Asset *</label>
                                    <select className="form-control" required value={damageItemId} onChange={e => setDamageItemId(e.target.value)}>
                                        {items.map(item => (
                                            <option key={item.id} value={item.id}>{item.name} (Stock: {item.quantity})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Report Type *</label>
                                    <select className="form-control" value={damageCondition} onChange={e => setDamageCondition(e.target.value as any)}>
                                        <option value="DAMAGED">⚠️ Damaged Item</option>
                                        <option value="LOST">🚫 Lost / Missing Item</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Quantity *</label>
                                    <input type="number" className="form-control" required min="1" value={damageQuantity} onChange={e => setDamageQuantity(e.target.value)} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowDamageModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? 'Saving...' : '⚠️ Confirm Report'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
