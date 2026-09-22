"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../services/api";
import "./activity-log.css";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuditUser { id: string; name: string; email: string; role: string; }
interface AuditLog {
    id: string; userId: string; action: string; entityType: string; entityId: string;
    metadata: Record<string, any> | null; ipAddress: string | null; createdAt: string; user: AuditUser;
}
interface Pagination { page: number; limit: number; total: number; pages: number; }
interface SummaryData {
    byAction: { action: string; count: number }[];
    byEntity: { entityType: string; count: number }[];
    recentActiveUsers: any[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ALLOWED_ROLES = ["ADMIN", "SUPERADMIN", "DEVELOPER"];

const FALLBACK_ENTITIES = [
    "STUDENT", "PAYMENT", "RECEIPT", "FEE_STRUCTURE", "STUDENT_FEE",
    "USER", "BRANCH", "STORE_ITEM", "STOCK_TRANSACTION", "BOOK", "BOOK_ISSUE", "INQUIRY"
];

const ACTION_TYPE: Record<string, string> = {
    STUDENT_CREATED:"c", FEE_STRUCTURE_CREATED:"c", USER_CREATED:"c",
    ITEM_CREATED:"c", SUPPLIER_ADDED:"c", BRANCH_CREATED:"c", BOOK_CREATED:"c",
    INQUIRY_CREATED:"c", FEE_CATEGORY_CREATED:"c",
    STUDENT_UPDATED:"u", FEE_STRUCTURE_MODIFIED:"u", USER_UPDATED:"u", ITEM_UPDATED:"u",
    BRANCH_UPDATED:"u", BOOK_UPDATED:"u", INQUIRY_UPDATED:"u", FEE_ASSIGNED:"u",
    STOCK_ADJUSTED:"u", SUPPLIER_UPDATED:"u", FEE_CATEGORY_UPDATED:"u",
    STUDENT_DELETED:"d", FEE_STRUCTURE_DELETED:"d", USER_DELETED:"d", ITEM_DELETED:"d",
    BOOK_DELETED:"d", INQUIRY_DELETED:"d", SUPPLIER_DELETED:"d",
    PAYMENT_RECORDED:"p", PAYMENT_APPROVED:"p", PAYMENT_UPDATED:"p",
    PAYMENT_DELETED:"p", PAYMENT_FAILED:"p", RECEIPT_GENERATED:"p",
    STOCK_INWARD:"p", STOCK_OUTWARD:"p", BOOK_ISSUED:"p", BOOK_RETURNED:"p",
    LOGIN:"a", LOGOUT:"a",
};

const DOT_EMOJI: Record<string, string> = {
    STUDENT_CREATED: "👤", STUDENT_UPDATED: "✏️", STUDENT_DELETED: "🗑️",
    PAYMENT_RECORDED: "💳", PAYMENT_APPROVED: "✅", RECEIPT_GENERATED: "🧾",
    FEE_STRUCTURE_CREATED: "📋", FEE_STRUCTURE_MODIFIED: "📝", FEE_STRUCTURE_DELETED: "📋",
    USER_CREATED: "👥", USER_UPDATED: "🔧", USER_DELETED: "🚫",
    BOOK_CREATED: "📚", BOOK_ISSUED: "📖", BOOK_RETURNED: "📚",
    ITEM_CREATED: "📦", STOCK_INWARD: "📥", STOCK_OUTWARD: "📤",
    LOGIN: "🔑", LOGOUT: "🚪",
    c: "✨", u: "✏️", d: "🗑️", p: "💰", a: "🔐", s: "⚙️",
};

function getType(action: string): string { return ACTION_TYPE[action] || "s"; }

function humanize(action: string): string {
    return action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
}

function describe(log: AuditLog): string {
    const m = log.metadata; const a = log.action;
    if (a === "STUDENT_CREATED") return "New student enrolled: " + (m?.studentId || log.entityId);
    if (a === "STUDENT_UPDATED") return "Profile updated: " + (m?.studentName || m?.after?.name || "Student");
    if (a === "STUDENT_DELETED") return "Student deleted: " + (m?.name || "Student") + (m?.studentId ? " (" + m.studentId + ")" : "");
    if (a === "PAYMENT_RECORDED") { const amt = m?.amount ? "₹" + (m.amount / 100).toLocaleString("en-IN") : ""; return "Payment recorded" + (amt ? ": " + amt : ""); }
    if (a === "RECEIPT_GENERATED") return "Receipt generated";
    if (a === "USER_CREATED") return "New user created: " + (m?.name || m?.email || log.entityId);
    if (a === "USER_UPDATED") return "User profile updated: " + (m?.after?.name || m?.before?.name || log.entityId);
    if (a === "USER_DELETED") { const dt = m?.deletionType === "HARD_DELETE" ? "permanently deleted" : "deactivated"; return "User " + dt + ": " + (m?.name || m?.email || log.entityId); }
    if (a === "FEE_STRUCTURE_CREATED") return "Fee structure created: " + (m?.name || log.entityId);
    if (a === "FEE_STRUCTURE_MODIFIED") return "Fee structure modified";
    if (a === "FEE_STRUCTURE_DELETED") return "Fee structure deleted";
    if (a === "BOOK_CREATED") return "Book added to library";
    if (a === "BOOK_ISSUED") return "Book issued to " + (m?.borrowerName || "borrower");
    if (a === "BOOK_RETURNED") return "Book returned";
    if (a === "ITEM_CREATED") return "Store item created: " + (m?.name || log.entityId);
    if (a === "STOCK_INWARD") return "Stock inward recorded";
    if (a === "STOCK_OUTWARD") return "Stock outward recorded";
    if (a === "LOGIN") return "User signed in";
    if (a === "LOGOUT") return "User signed out";
    return humanize(a) + " on " + log.entityType;
}

function relTime(d: string): string {
    const ms = Date.now() - new Date(d).getTime();
    const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), dy = Math.floor(h / 24);
    if (s < 60) return "just now";
    if (m < 60) return m + "m ago";
    if (h < 24) return h + "h ago";
    if (dy < 7) return dy + "d ago";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

function fullTime(d: string): string {
    return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}

// ─── Diff Viewer ──────────────────────────────────────────────────────────────
function DiffViewer({ before, after }: { before: Record<string, any>; after: Record<string, any> }) {
    const skip = new Set(["photo", "signature", "passwordHash", "password_hash", "submittedDocuments"]);
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])) as string[];
    const changed = keys.filter((k) => !skip.has(k) && JSON.stringify(before[k]) !== JSON.stringify(after[k]));
    if (!changed.length) return null;
    const fmt = (v: any): string => {
        if (v === null || v === undefined) return "—";
        if (typeof v === "object") return JSON.stringify(v).substring(0, 55) + (JSON.stringify(v).length > 55 ? "…" : "");
        return String(v);
    };
    return (
        <div className="al-diff-box">
            <div className="al-diff-header">✏️ Field Modifications Detected ({changed.length})</div>
            <div className="al-diff-rows">
                {changed.map((k) => (
                    <div key={k} className="al-diff-item">
                        <span className="al-diff-key">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span className="al-diff-old">{fmt(before[k])}</span>
                        <span className="al-diff-arrow">→</span>
                        <span className="al-diff-new">{fmt(after[k])}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Deleted Snapshot ─────────────────────────────────────────────────────────
function DelSnap({ meta }: { meta: Record<string, any> }) {
    const skip = new Set(["deletedReceiptsCount", "deletedPaymentsCount", "deletedFeesCount", "deletedBy", "reason", "role", "before", "after", "deletionType"]);
    const keys = Object.keys(meta).filter((k) => !skip.has(k) && meta[k] !== null && meta[k] !== undefined && meta[k] !== "");
    if (!keys.length) return null;
    const fmt = (v: any): string => {
        if (v === null || v === undefined) return "—";
        if (typeof v === "boolean") return v ? "Yes" : "No";
        if (typeof v === "object") return JSON.stringify(v).substring(0, 75);
        return String(v);
    };
    return (
        <div className="al-del-box">
            <div className="al-del-header">🗑️ Preserved Deleted Record Snapshot</div>
            <div className="al-del-grid">
                {keys.map((k) => (
                    <div key={k} className="al-del-item">
                        <span className="al-del-k">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span className="al-del-v">{fmt(meta[k])}</span>
                    </div>
                ))}
            </div>
            {meta.deletedReceiptsCount !== undefined && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Purged Sub-records: {meta.deletedReceiptsCount} receipt(s), {meta.deletedPaymentsCount} payment(s), {meta.deletedFeesCount} fee record(s)
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ActivityLogPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);
    
    // Expanded Accordion Card IDs
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [showRawJson, setShowRawJson] = useState<Record<string, boolean>>({});

    const [page, setPage] = useState(1);
    const [typeChip, setTypeChip] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({ entityType: "", from: "", to: "" });
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const searchTimer = useRef<ReturnType<typeof setTimeout>>();
    const filterRef = useRef<HTMLDivElement>(null);

    const isAllowed = !authLoading && !!user && ALLOWED_ROLES.includes(user.role);

    // Toggle expand-down accordion
    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const fetchLogs = useCallback(async (pg: number, query: string, filt: typeof filters, chip: string, isSilent = false) => {
        if (isSilent) setIsRefetching(true);
        else setInitialLoading(true);

        try {
            const params: Record<string, string> = { page: String(pg), limit: "30" };
            if (query && query.trim()) params.search = query.trim();
            if (filt.entityType) params.entityType = filt.entityType;
            if (filt.from) params.from = filt.from;
            if (filt.to) params.to = filt.to;
            if (chip) params.type = chip;

            const qs = new URLSearchParams(params).toString();
            const { data } = await api.get("/system/audit-logs?" + qs);
            
            setLogs(data.data || []);
            setPagination(data.pagination || null);
        } catch (e) {
            console.error("Failed to load audit logs", e);
        } finally {
            setInitialLoading(false);
            setIsRefetching(false);
        }
    }, []);

    const fetchSummary = useCallback(async () => {
        try {
            const { data } = await api.get("/system/audit-logs/summary");
            setSummary(data.data);
        } catch {}
    }, []);

    useEffect(() => {
        if (!authLoading) {
            if (!user) { router.push("/login"); return; }
            if (!ALLOWED_ROLES.includes(user.role)) { router.push("/dashboard"); return; }
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (isAllowed) {
            fetchSummary();
            fetchLogs(1, "", filters, "", false);
        }
    }, [isAllowed, fetchSummary, fetchLogs]);

    // Handle search input with debouncing without clearing current logs
    const handleSearchChange = (val: string) => {
        setSearchQuery(val);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setPage(1);
            fetchLogs(1, val, filters, typeChip, true);
        }, 320);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        setPage(1);
        fetchLogs(1, "", filters, typeChip, true);
    };

    const applyChip = (chip: string) => {
        const nextChip = typeChip === chip ? "" : chip;
        setTypeChip(nextChip);
        setPage(1);
        fetchLogs(1, searchQuery, filters, nextChip, true);
    };

    const handleFilterChange = (key: keyof typeof filters, val: string) => {
        const nextFilters = { ...filters, [key]: val };
        setFilters(nextFilters);
        setPage(1);
        fetchLogs(1, searchQuery, nextFilters, typeChip, true);
    };

    const applyDatePreset = (preset: "today" | "7d" | "30d" | "month" | "all") => {
        const now = new Date();
        const toStr = now.toISOString().split("T")[0];
        let fromStr = "";

        if (preset === "today") {
            fromStr = toStr;
        } else if (preset === "7d") {
            const d = new Date(now.getTime() - 7 * 86400000);
            fromStr = d.toISOString().split("T")[0];
        } else if (preset === "30d") {
            const d = new Date(now.getTime() - 30 * 86400000);
            fromStr = d.toISOString().split("T")[0];
        } else if (preset === "month") {
            fromStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        } else if (preset === "all") {
            fromStr = "";
        }

        const nextFilters = { ...filters, from: fromStr, to: preset === "all" ? "" : toStr };
        setFilters(nextFilters);
        setPage(1);
        fetchLogs(1, searchQuery, nextFilters, typeChip, true);
    };

    const resetAllFilters = () => {
        const cleared = { entityType: "", from: "", to: "" };
        setFilters(cleared);
        setSearchQuery("");
        setTypeChip("");
        setPage(1);
        setShowFilterDropdown(false);
        fetchLogs(1, "", cleared, "", true);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchLogs(newPage, searchQuery, filters, typeChip, true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const exportCSV = () => {
        if (!logs.length) return;
        const hdrs = ["Timestamp", "Action", "Entity", "Entity ID", "Performed By", "Role", "IP Address", "Description"];
        const rows = logs.map((l) => [fullTime(l.createdAt), l.action, l.entityType, l.entityId, l.user?.name || l.userId, l.user?.role || "", l.ipAddress || "", describe(l)]);
        const csv = [hdrs, ...rows].map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "activity-log-" + new Date().toISOString().split("T")[0] + ".csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    // Aggregate summary statistics
    const total = pagination?.total || 0;
    const created  = summary?.byAction.filter((a) => getType(a.action) === "c").reduce((s, a) => s + a.count, 0) || 0;
    const updated  = summary?.byAction.filter((a) => getType(a.action) === "u").reduce((s, a) => s + a.count, 0) || 0;
    const deleted  = summary?.byAction.filter((a) => getType(a.action) === "d").reduce((s, a) => s + a.count, 0) || 0;
    const payments = summary?.byAction.filter((a) => getType(a.action) === "p").reduce((s, a) => s + a.count, 0) || 0;

    // Available entities for dropdown
    const availableEntities = Array.from(new Set([
        ...(summary?.byEntity.map((e) => e.entityType) || []),
        ...FALLBACK_ENTITIES
    ])).sort();

    const activeFiltersCount = (filters.entityType ? 1 : 0) + (filters.from || filters.to ? 1 : 0);
    const hasAnyFilterActive = !!(searchQuery || typeChip || filters.entityType || filters.from || filters.to);

    if (authLoading) {
        return (
            <div className="al-page">
                <Sidebar />
                <div className="al-content">
                    <div className="al-body">
                        <div className="al-skeleton-wrap">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="al-skel-card" />)}</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAllowed) {
        return (
            <div className="al-denied">
                <div className="al-denied-ico">🔒</div>
                <div className="al-denied-h">Access Restricted</div>
                <div className="al-denied-sub">The Activity Log is only accessible to Administrators and Developers.</div>
                <Link href="/dashboard" className="al-denied-btn">Go to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="al-page">
            <Sidebar />
            <div className="al-content">
                {/* Seamless loading progress bar without screen flickering */}
                {isRefetching && <div className="al-loading-bar" />}

                {/* Header */}
                <div className="al-header">
                    <div className="al-header-row">
                        <div className="al-title-group">
                            <div className="al-title-icon-wrap">📋</div>
                            <div>
                                <div className="al-page-title">Activity Log</div>
                                <div className="al-page-subtitle">Complete system audit trail — all operations, sorted chronologically</div>
                            </div>
                        </div>
                        <div className="al-header-btns">
                            <button className="al-btn al-btn-ghost" onClick={() => fetchLogs(page, searchQuery, filters, typeChip, true)} title="Refresh logs">
                                🔄 {isRefetching ? "Refreshing..." : "Refresh"}
                            </button>
                            <button className="al-btn al-btn-primary" onClick={exportCSV}>
                                ⬇️ Export CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="al-stats">
                    <div className="al-stat"><span className="al-stat-dot" style={{ background: "#0ea5e9" }} />{total.toLocaleString()} Total</div>
                    <div className="al-stat"><span className="al-stat-dot" style={{ background: "#22c55e" }} />{created.toLocaleString()} Created</div>
                    <div className="al-stat"><span className="al-stat-dot" style={{ background: "#d97706" }} />{updated.toLocaleString()} Updated</div>
                    <div className="al-stat"><span className="al-stat-dot" style={{ background: "#dc2626" }} />{deleted.toLocaleString()} Deleted</div>
                    <div className="al-stat"><span className="al-stat-dot" style={{ background: "#7c3aed" }} />{payments.toLocaleString()} Payments</div>
                </div>

                {/* Single-Line Filter Bar */}
                <div className="al-filters-bar" ref={filterRef}>
                    <div className="al-filters-row">
                        {/* 1. Search Input First (Left) */}
                        <div className="al-search-box">
                            <span className="al-search-icon">🔍</span>
                            <input
                                id="al-search-input"
                                className="al-search-input"
                                placeholder="Search actions, students, users, remarks, IDs..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                            {searchQuery && (
                                <button className="al-search-clear" onClick={handleClearSearch} title="Clear search">✕</button>
                            )}
                        </div>

                        {/* 2. Date Filter (Middle - Beside Search Bar) */}
                        <div className="al-date-filter-group" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 13 }}>📅</span>
                            <select
                                className="al-pop-select"
                                style={{ padding: '6px 10px', fontSize: 12.5, minWidth: 120, height: 36, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                                value={filters.from || 'all'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'all') applyDatePreset('all');
                                    else if (val === 'today') applyDatePreset('today');
                                    else if (val === '7d') applyDatePreset('7d');
                                    else if (val === '30d') applyDatePreset('30d');
                                    else if (val === 'month') applyDatePreset('month');
                                }}
                            >
                                <option value="all">All Dates</option>
                                <option value="today">Today</option>
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                                <option value="month">This Month</option>
                            </select>
                        </div>

                        {/* 3. Filter Dropdown Button (Right - Beside Date Filter) */}
                        <button
                            id="al-filter-dropdown-btn"
                            className={"al-dropdown-toggle" + (showFilterDropdown ? " open" : "")}
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            title="Filter by action category, entity type, and custom date range"
                            style={{ height: 36, flexShrink: 0 }}
                        >
                            <span>⚡ Filters</span>
                            {(activeFiltersCount > 0 || typeChip) && (
                                <span className="al-filter-badge">{activeFiltersCount + (typeChip ? 1 : 0)}</span>
                            )}
                            <span>{showFilterDropdown ? "▲" : "▼"}</span>
                        </button>

                        {/* 4. Reset All Filters Button */}
                        {hasAnyFilterActive && (
                            <button className="al-reset-btn" onClick={resetAllFilters} title="Reset all active filters" style={{ height: 36, flexShrink: 0 }}>
                                ✕ Reset
                            </button>
                        )}
                    </div>

                    {/* Filter Popover Dropdown Drawer (Contains All Category Filters & Entity Types) */}
                    {showFilterDropdown && (
                        <div className="al-filter-popover">
                            {/* Action Category Chips */}
                            <div className="al-pop-group" style={{ gridColumn: "1 / -1" }}>
                                <label className="al-pop-label">Action Category</label>
                                <div className="al-chips-scroll" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '4px 0' }}>
                                    <button className={"al-chip chip-all" + (typeChip === "" ? " active-chip" : "")} onClick={() => applyChip("")}>All</button>
                                    <button className={"al-chip chip-create" + (typeChip === "c" ? " active-chip" : "")} onClick={() => applyChip("c")}>✨ Created</button>
                                    <button className={"al-chip chip-update" + (typeChip === "u" ? " active-chip" : "")} onClick={() => applyChip("u")}>✏️ Edited</button>
                                    <button className={"al-chip chip-delete" + (typeChip === "d" ? " active-chip" : "")} onClick={() => applyChip("d")}>🗑️ Deleted</button>
                                    <button className={"al-chip chip-payment" + (typeChip === "p" ? " active-chip" : "")} onClick={() => applyChip("p")}>💰 Payments</button>
                                    <button className={"al-chip chip-auth" + (typeChip === "a" ? " active-chip" : "")} onClick={() => applyChip("a")}>🔐 Auth</button>
                                </div>
                            </div>

                            {/* Entity Type Filter */}
                            <div className="al-pop-group">
                                <label className="al-pop-label">Entity Type</label>
                                <select
                                    id="al-entity-select"
                                    className="al-pop-select"
                                    value={filters.entityType}
                                    onChange={(e) => handleFilterChange("entityType", e.target.value)}
                                >
                                    <option value="">All Entities</option>
                                    {availableEntities.map((et) => (
                                        <option key={et} value={et}>{et}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Custom Date Range */}
                            <div className="al-pop-group">
                                <label className="al-pop-label">From Date</label>
                                <input
                                    type="date"
                                    id="al-date-from"
                                    className="al-pop-input"
                                    value={filters.from}
                                    onChange={(e) => handleFilterChange("from", e.target.value)}
                                />
                            </div>

                            <div className="al-pop-group">
                                <label className="al-pop-label">To Date</label>
                                <input
                                    type="date"
                                    id="al-date-to"
                                    className="al-pop-input"
                                    value={filters.to}
                                    onChange={(e) => handleFilterChange("to", e.target.value)}
                                />
                            </div>

                            {/* Date Presets */}
                            <div className="al-pop-group" style={{ gridColumn: "1 / -1" }}>
                                <div className="al-pop-label">Quick Date Presets</div>
                                <div className="al-date-presets">
                                    <button className="al-date-pill" onClick={() => applyDatePreset("today")}>Today</button>
                                    <button className="al-date-pill" onClick={() => applyDatePreset("7d")}>Last 7 Days</button>
                                    <button className="al-date-pill" onClick={() => applyDatePreset("30d")}>Last 30 Days</button>
                                    <button className="al-date-pill" onClick={() => applyDatePreset("month")}>This Month</button>
                                    <button className="al-date-pill" onClick={() => applyDatePreset("all")}>All Time</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Body Feed (Full Width Accordion List) */}
                <div className="al-body">
                    {initialLoading && logs.length === 0 ? (
                        <div className="al-skeleton-wrap">
                            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="al-skel-card" />)}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="al-empty">
                            <div className="al-empty-ico">📬</div>
                            <div className="al-empty-h">No activity logs found</div>
                            <div className="al-empty-sub">
                                {hasAnyFilterActive ? "No events match your current filter criteria. Try resetting your search or filters." : "No system activity events have been recorded yet."}
                            </div>
                        </div>
                    ) : (
                        <div className="al-feed">
                            {logs.map((log) => {
                                const t = getType(log.action);
                                const emoji = DOT_EMOJI[log.action] || DOT_EMOJI[t] || "⚙️";
                                const isExpanded = expandedIds.has(log.id);
                                const hasDiff = log.metadata?.before && log.metadata?.after;
                                const isDel = t === "d";

                                return (
                                    <div key={log.id} className={"al-card" + (isExpanded ? " expanded" : "")}>
                                        {/* Card Summary Header (Clicking expands down) */}
                                        <div className="al-card-summary" onClick={() => toggleExpand(log.id)}>
                                            <div className={"al-card-left-dot dot-" + t}>
                                                <span>{emoji}</span>
                                            </div>

                                            <div className="al-card-main">
                                                <div className="al-card-row1">
                                                    <span className={"al-badge badge-" + t}>{humanize(log.action)}</span>
                                                    <span className="al-entity-lbl">{log.entityType}</span>
                                                </div>

                                                <div className="al-card-desc" title={describe(log)}>
                                                    {describe(log)}
                                                </div>

                                                <div className="al-card-meta">
                                                    <span className="al-meta-user">👤 {log.user?.name || log.userId}</span>
                                                    {log.user?.role && (
                                                        <>
                                                            <span className="al-meta-sep">·</span>
                                                            <span className={"al-role r-" + (log.user.role || "").toLowerCase()}>{log.user.role}</span>
                                                        </>
                                                    )}
                                                    {log.ipAddress && (
                                                        <>
                                                            <span className="al-meta-sep">·</span>
                                                            <span>🌐 {log.ipAddress}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="al-card-right">
                                                <div className="al-card-time" title={fullTime(log.createdAt)}>
                                                    {relTime(log.createdAt)}
                                                </div>
                                                <div className="al-card-chevron">
                                                    ▼
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expand Down Drawer (Revealed beneath the card) */}
                                        {isExpanded && (
                                            <div className="al-card-drawer">
                                                <div className="al-drawer-grid">
                                                    {/* Event Information */}
                                                    <div className="al-drawer-sec">
                                                        <div className="al-drawer-sec-title">📌 Event Details</div>
                                                        <div className="al-drawer-field">
                                                            <span className="al-drawer-key">Action</span>
                                                            <span className="al-drawer-val">
                                                                <span className={"al-badge badge-" + t}>{humanize(log.action)}</span>
                                                            </span>
                                                        </div>
                                                        <div className="al-drawer-field">
                                                            <span className="al-drawer-key">Entity</span>
                                                            <span className="al-drawer-val">{log.entityType}</span>
                                                        </div>
                                                        <div className="al-drawer-field">
                                                            <span className="al-drawer-key">Entity ID</span>
                                                            <span className="al-drawer-val" style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>
                                                                {log.entityId}
                                                            </span>
                                                        </div>
                                                        <div className="al-drawer-field">
                                                            <span className="al-drawer-key">Timestamp</span>
                                                            <span className="al-drawer-val">{fullTime(log.createdAt)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Actor Information */}
                                                    <div className="al-drawer-sec">
                                                        <div className="al-drawer-sec-title">👤 Performed By</div>
                                                        <div className="al-drawer-field">
                                                            <span className="al-drawer-key">Name</span>
                                                            <span className="al-drawer-val">{log.user?.name || "—"}</span>
                                                        </div>
                                                        <div className="al-drawer-field">
                                                            <span className="al-drawer-key">Email</span>
                                                            <span className="al-drawer-val" style={{ fontSize: "0.72rem" }}>{log.user?.email || "—"}</span>
                                                        </div>
                                                        <div className="al-drawer-field">
                                                            <span className="al-drawer-key">Role</span>
                                                            <span className="al-drawer-val">
                                                                <span className={"al-role r-" + (log.user?.role || "").toLowerCase()}>{log.user?.role || "—"}</span>
                                                            </span>
                                                        </div>
                                                        <div className="al-drawer-field">
                                                            <span className="al-drawer-key">IP Address</span>
                                                            <span className="al-drawer-val">{log.ipAddress || "—"}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Field-by-Field Modification Diff */}
                                                {hasDiff && (
                                                    <DiffViewer before={log.metadata!.before} after={log.metadata!.after} />
                                                )}

                                                {/* Deleted Record Snapshot */}
                                                {isDel && log.metadata && (
                                                    <DelSnap meta={log.metadata} />
                                                )}

                                                {/* Raw JSON Toggle */}
                                                {log.metadata && (
                                                    <div className="al-raw-box">
                                                        <button
                                                            className="al-raw-toggle"
                                                            onClick={() => setShowRawJson((prev) => ({ ...prev, [log.id]: !prev[log.id] }))}
                                                        >
                                                            <span>{showRawJson[log.id] ? "▼" : "▶"} Raw Metadata Payload</span>
                                                        </button>
                                                        {showRawJson[log.id] && (
                                                            <pre className="al-raw-json">
                                                                {JSON.stringify(log.metadata, null, 2)}
                                                            </pre>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="al-pager">
                            <div className="al-pager-info">
                                Showing {((page - 1) * 30) + 1}–{Math.min(page * 30, pagination.total)} of {pagination.total.toLocaleString()} records
                            </div>
                            <div className="al-pager-btns">
                                <button id="al-prev-btn" className="al-pg-btn" disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>
                                    ←
                                </button>
                                {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                                    let p = i + 1;
                                    if (pagination.pages > 7) {
                                        if (page <= 4) p = i + 1;
                                        else if (page >= pagination.pages - 3) p = pagination.pages - 6 + i;
                                        else p = page - 3 + i;
                                    }
                                    return (
                                        <button
                                            key={p}
                                            className={"al-pg-btn" + (p === page ? " pg-active" : "")}
                                            onClick={() => handlePageChange(p)}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                                <button id="al-next-btn" className="al-pg-btn" disabled={page >= pagination.pages} onClick={() => handlePageChange(page + 1)}>
                                    →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
