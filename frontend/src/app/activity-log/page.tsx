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
    const skip = new Set(["photo","signature","passwordHash","password_hash","submittedDocuments"]);
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])) as string[];
    const changed = keys.filter((k) => !skip.has(k) && JSON.stringify(before[k]) !== JSON.stringify(after[k]));
    if (!changed.length) return null;
    const fmt = (v: any): string => {
        if (v === null || v === undefined) return "—";
        if (typeof v === "object") return JSON.stringify(v).substring(0, 55) + (JSON.stringify(v).length > 55 ? "…" : "");
        return String(v);
    };
    return (
        <div className="al-diff">
            <div className="al-diff-lbl">✏️ Changes detected</div>
            <div className="al-diff-rows">
                {changed.map((k) => (
                    <div key={k} className="al-diff-row changed">
                        <span className="al-diff-field">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span className="al-diff-before">{fmt(before[k])}</span>
                        <span className="al-diff-arrow">→</span>
                        <span className="al-diff-after">{fmt(after[k])}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Deleted Snapshot ─────────────────────────────────────────────────────────
function DelSnap({ meta }: { meta: Record<string, any> }) {
    const skip = new Set(["deletedReceiptsCount","deletedPaymentsCount","deletedFeesCount","deletedBy","reason","role","before","after","deletionType"]);
    const keys = Object.keys(meta).filter((k) => !skip.has(k) && meta[k] !== null && meta[k] !== undefined && meta[k] !== "");
    if (!keys.length) return null;
    const fmt = (v: any): string => {
        if (v === null || v === undefined) return "—";
        if (typeof v === "boolean") return v ? "Yes" : "No";
        if (typeof v === "object") return JSON.stringify(v).substring(0, 75);
        return String(v);
    };
    return (
        <div className="al-snap">
            <div className="al-snap-box">
                <div className="al-snap-lbl">🗑️ Deleted Record Snapshot</div>
                <div className="al-snap-grid">
                    {keys.map((k) => (
                        <div key={k} className="al-snap-field">
                            <span className="al-snap-key">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                            <span className="al-snap-val">{fmt(meta[k])}</span>
                        </div>
                    ))}
                </div>
                {meta.deletedReceiptsCount !== undefined && (
                    <div style={{ marginTop: "0.4rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Purged: {meta.deletedReceiptsCount} receipt(s), {meta.deletedPaymentsCount} payment(s), {meta.deletedFeesCount} fee record(s)
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ActivityLogPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [fetching, setFetching] = useState(true);
    const [selected, setSelected] = useState<AuditLog | null>(null);
    const [page, setPage] = useState(1);
    const [typeChip, setTypeChip] = useState("");
    const [filters, setFilters] = useState({ search: "", entityType: "", action: "", from: "", to: "" });
    const timer = useRef<ReturnType<typeof setTimeout>>();

    const isAllowed = !loading && !!user && ALLOWED_ROLES.includes(user.role);

    const fetchLogs = useCallback(async (pg: number, filt: typeof filters, chip: string) => {
        setFetching(true);
        try {
            const params: Record<string, string> = { page: String(pg), limit: "30" };
            if (filt.search) params.search = filt.search;
            if (filt.entityType) params.entityType = filt.entityType;
            if (filt.action) params.action = filt.action;
            if (filt.from) params.from = filt.from;
            if (filt.to) params.to = filt.to;
            const qs = new URLSearchParams(params).toString();
            const { data } = await api.get("/system/audit-logs?" + qs);
            let rows: AuditLog[] = data.data || [];
            if (chip && !filt.action) {
                rows = rows.filter((l) => getType(l.action) === chip);
            }
            setLogs(rows);
            setPagination(data.pagination || null);
        } catch (e) { console.error(e); }
        finally { setFetching(false); }
    }, []);

    const fetchSummary = useCallback(async () => {
        try { const { data } = await api.get("/system/audit-logs/summary"); setSummary(data.data); } catch {}
    }, []);

    useEffect(() => {
        if (!loading) {
            if (!user) { router.push("/login"); return; }
            if (!ALLOWED_ROLES.includes(user.role)) { router.push("/dashboard"); return; }
        }
    }, [user, loading, router]);

    useEffect(() => { if (isAllowed) fetchSummary(); }, [isAllowed, fetchSummary]);
    useEffect(() => { if (isAllowed) fetchLogs(page, filters, typeChip); }, [page, isAllowed, filters, typeChip, fetchLogs]);

    const applyFilter = (key: keyof typeof filters, val: string) => {
        clearTimeout(timer.current);
        const nf = { ...filters, [key]: val };
        setFilters(nf); setPage(1);
        if (key === "search") { timer.current = setTimeout(() => fetchLogs(1, nf, typeChip), 380); }
        else fetchLogs(1, nf, typeChip);
    };

    const applyChip = (chip: string) => {
        const nc = typeChip === chip ? "" : chip;
        setTypeChip(nc); setPage(1);
        fetchLogs(1, filters, nc);
    };

    const clearAll = () => {
        const cleared = { search: "", entityType: "", action: "", from: "", to: "" };
        setFilters(cleared); setTypeChip(""); setPage(1);
        fetchLogs(1, cleared, "");
    };

    const exportCSV = () => {
        if (!logs.length) return;
        const hdrs = ["Timestamp","Action","Entity","Entity ID","Performed By","Role","IP Address","Description"];
        const rows = logs.map((l) => [fullTime(l.createdAt), l.action, l.entityType, l.entityId, l.user?.name || l.userId, l.user?.role || "", l.ipAddress || "", describe(l)]);
        const csv = [hdrs, ...rows].map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url;
        a.download = "activity-log-" + new Date().toISOString().split("T")[0] + ".csv"; a.click();
        URL.revokeObjectURL(url);
    };

    // Stats
    const total = pagination?.total || 0;
    const created  = summary?.byAction.filter((a) => getType(a.action) === "c").reduce((s, a) => s + a.count, 0) || 0;
    const updated  = summary?.byAction.filter((a) => getType(a.action) === "u").reduce((s, a) => s + a.count, 0) || 0;
    const deleted  = summary?.byAction.filter((a) => getType(a.action) === "d").reduce((s, a) => s + a.count, 0) || 0;
    const payments = summary?.byAction.filter((a) => getType(a.action) === "p").reduce((s, a) => s + a.count, 0) || 0;

    const entityTypes = summary?.byEntity.map((e) => e.entityType) || [];
    const hasFilters = !!(filters.search || filters.entityType || filters.action || filters.from || filters.to || typeChip);

    if (loading) {
        return (
            <div className="al-page">
                <Sidebar />
                <div className="al-content">
                    <div className="al-skeleton-wrap">{[1,2,3,4,5].map((i) => <div key={i} className="al-skel-card" />)}</div>
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
                {/* Header */}
                <div className="al-header">
                    <div className="al-header-row">
                        <div className="al-title-group">
                            <div className="al-title-icon-wrap">📋</div>
                            <div>
                                <div className="al-page-title">Activity Log</div>
                                <div className="al-page-subtitle">Complete system audit trail — all operations, sorted by time</div>
                            </div>
                        </div>
                        <div className="al-header-btns">
                            <button className="al-btn al-btn-ghost" onClick={() => fetchLogs(page, filters, typeChip)} title="Refresh">🔄 Refresh</button>
                            <button className="al-btn al-btn-primary" onClick={exportCSV}>⬇️ Export CSV</button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="al-stats">
                    <div className="al-stat"><span className="al-stat-dot" style={{ background:"#0ea5e9" }} />{total.toLocaleString()} Total</div>
                    <div className="al-stat"><span className="al-stat-dot" style={{ background:"#22c55e" }} />{created.toLocaleString()} Created</div>
                    <div className="al-stat"><span className="al-stat-dot" style={{ background:"#d97706" }} />{updated.toLocaleString()} Updated</div>
                    <div className="al-stat"><span className="al-stat-dot" style={{ background:"#dc2626" }} />{deleted.toLocaleString()} Deleted</div>
                    <div className="al-stat"><span className="al-stat-dot" style={{ background:"#7c3aed" }} />{payments.toLocaleString()} Payments</div>
                    {summary?.recentActiveUsers?.[0]?.user?.name && (
                        <div className="al-stat" style={{ marginLeft:"auto" }}>👤 {summary.recentActiveUsers[0].user.name}</div>
                    )}
                </div>

                {/* Filters */}
                <div className="al-filters">
                    {/* Type chip filters */}
                    <div className="al-filter-chips">
                        <button className={"al-chip chip-all" + (typeChip === "" ? " active-chip" : "")} onClick={() => applyChip("")}>All</button>
                        <button className={"al-chip chip-create" + (typeChip === "c" ? " active-chip" : "")} onClick={() => applyChip("c")}>✨ Created</button>
                        <button className={"al-chip chip-update" + (typeChip === "u" ? " active-chip" : "")} onClick={() => applyChip("u")}>✏️ Edited</button>
                        <button className={"al-chip chip-delete" + (typeChip === "d" ? " active-chip" : "")} onClick={() => applyChip("d")}>🗑️ Deleted</button>
                        <button className={"al-chip chip-payment" + (typeChip === "p" ? " active-chip" : "")} onClick={() => applyChip("p")}>💰 Payments</button>
                        <button className={"al-chip chip-auth" + (typeChip === "a" ? " active-chip" : "")} onClick={() => applyChip("a")}>🔐 Auth</button>
                    </div>
                    <div className="al-filter-sep" />
                    {/* Search */}
                    <div className="al-search-wrap">
                        <span className="al-search-ico">🔍</span>
                        <input id="al-search" className="al-search" placeholder="Search..." value={filters.search} onChange={(e) => applyFilter("search", e.target.value)} />
                    </div>
                    {/* Entity */}
                    <select id="al-entity-filter" className="al-select" value={filters.entityType} onChange={(e) => applyFilter("entityType", e.target.value)}>
                        <option value="">All Entities</option>
                        {entityTypes.map((et) => <option key={et} value={et}>{et}</option>)}
                    </select>
                    {/* Date from/to */}
                    <input id="al-from" type="date" className="al-date" value={filters.from} onChange={(e) => applyFilter("from", e.target.value)} title="From" />
                    <input id="al-to" type="date" className="al-date" value={filters.to} onChange={(e) => applyFilter("to", e.target.value)} title="To" />
                    {hasFilters && <button className="al-clear" onClick={clearAll}>✕ Clear</button>}
                </div>

                {/* Body */}
                <div className="al-body">
                    {/* Feed */}
                    <div>
                        {fetching ? (
                            <div className="al-skeleton-wrap">{[1,2,3,4].map((i) => <div key={i} className="al-skel-card" />)}</div>
                        ) : logs.length === 0 ? (
                            <div className="al-empty">
                                <div className="al-empty-ico">📬</div>
                                <div className="al-empty-h">No activity found</div>
                                <div className="al-empty-sub">{hasFilters ? "No events match your current filters. Try clearing them." : "No system events have been recorded yet."}</div>
                            </div>
                        ) : (
                            <div className="al-feed">
                                {logs.map((log, idx) => {
                                    const t = getType(log.action);
                                    const emoji = DOT_EMOJI[log.action] || DOT_EMOJI[t] || "⚙️";
                                    const hasDiff = log.metadata?.before && log.metadata?.after;
                                    const isDel = t === "d";
                                    const isSel = selected?.id === log.id;
                                    const isLast = idx === logs.length - 1;
                                    return (
                                        <div key={log.id} className="al-entry">
                                            <div className="al-entry-left">
                                                <div className={"al-dot dot-" + t}><span>{emoji}</span></div>
                                                {!isLast && <div className="al-line" />}
                                            </div>
                                            <div className={"al-card" + (isSel ? " al-selected" : "")} onClick={() => setSelected(isSel ? null : log)}>
                                                <div className="al-card-top">
                                                    <div className="al-card-body">
                                                        <div className="al-card-row1">
                                                            <span className={"al-badge badge-" + t}>{humanize(log.action)}</span>
                                                            <span className="al-entity-lbl">{log.entityType}</span>
                                                        </div>
                                                        <div className="al-card-desc" title={describe(log)}>{describe(log)}</div>
                                                        <div className="al-card-meta">
                                                            <span className="al-meta-user">👤 {log.user?.name || log.userId}</span>
                                                            {log.user?.role && (<><span className="al-meta-sep">·</span><span className={"al-role r-" + (log.user.role || "").toLowerCase()}>{log.user.role}</span></>)}
                                                            {log.ipAddress && (<><span className="al-meta-sep">·</span><span>🌐 {log.ipAddress}</span></>)}
                                                        </div>
                                                    </div>
                                                    <div className="al-card-time" title={fullTime(log.createdAt)}>{relTime(log.createdAt)}</div>
                                                </div>
                                                {hasDiff && <DiffViewer before={log.metadata!.before} after={log.metadata!.after} />}
                                                {isDel && log.metadata && <DelSnap meta={log.metadata} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination && pagination.pages > 1 && (
                            <div className="al-pager">
                                <div className="al-pager-info">Showing {((page-1)*30)+1}–{Math.min(page*30, pagination.total)} of {pagination.total.toLocaleString()} events</div>
                                <div className="al-pager-btns">
                                    <button id="al-prev" className="al-pg-btn" disabled={page <= 1} onClick={() => setPage((p) => p-1)}>←</button>
                                    {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                                        let p = i+1;
                                        if (pagination.pages > 7) {
                                            if (page <= 4) p = i+1;
                                            else if (page >= pagination.pages-3) p = pagination.pages-6+i;
                                            else p = page-3+i;
                                        }
                                        return <button key={p} id={"al-p-" + p} className={"al-pg-btn" + (p===page?" pg-active":"")} onClick={() => setPage(p)}>{p}</button>;
                                    })}
                                    <button id="al-next" className="al-pg-btn" disabled={page >= pagination.pages} onClick={() => setPage((p) => p+1)}>→</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Detail Panel */}
                    <div className="al-panel">
                        {!selected ? (
                            <div className="al-panel-empty">
                                <div className="al-panel-empty-ico">👆</div>
                                <div className="al-panel-empty-txt">Click any entry to see full event details</div>
                            </div>
                        ) : (
                            <>
                                <div className="al-panel-head">
                                    <div className="al-panel-title">Event Detail</div>
                                    <button className="al-panel-close" onClick={() => setSelected(null)}>✕</button>
                                </div>
                                <div className="al-panel-sec">
                                    <div className="al-panel-sec-title">📌 Event Info</div>
                                    <div className="al-panel-field"><span className="al-panel-key">Action</span><span className="al-panel-val"><span className={"al-badge badge-" + getType(selected.action)}>{humanize(selected.action)}</span></span></div>
                                    <div className="al-panel-field"><span className="al-panel-key">Entity</span><span className="al-panel-val">{selected.entityType}</span></div>
                                    <div className="al-panel-field"><span className="al-panel-key">Entity ID</span><span className="al-panel-val" style={{ fontFamily:"monospace", fontSize:"0.68rem" }}>{selected.entityId}</span></div>
                                    <div className="al-panel-field"><span className="al-panel-key">Log ID</span><span className="al-panel-val" style={{ fontFamily:"monospace", fontSize:"0.65rem" }}>{selected.id}</span></div>
                                    <div className="al-panel-field"><span className="al-panel-key">Timestamp</span><span className="al-panel-val">{fullTime(selected.createdAt)}</span></div>
                                    <div className="al-panel-field"><span className="al-panel-key">IP Address</span><span className="al-panel-val">{selected.ipAddress || "—"}</span></div>
                                </div>
                                <div className="al-panel-sec">
                                    <div className="al-panel-sec-title">👤 Performed By</div>
                                    <div className="al-panel-field"><span className="al-panel-key">Name</span><span className="al-panel-val">{selected.user?.name || "—"}</span></div>
                                    <div className="al-panel-field"><span className="al-panel-key">Email</span><span className="al-panel-val" style={{ fontSize:"0.72rem" }}>{selected.user?.email || "—"}</span></div>
                                    <div className="al-panel-field"><span className="al-panel-key">Role</span><span className="al-panel-val"><span className={"al-role r-" + (selected.user?.role || "").toLowerCase()}>{selected.user?.role || "—"}</span></span></div>
                                </div>
                                {selected.metadata?.before && selected.metadata?.after && (
                                    <div className="al-panel-sec">
                                        <div className="al-panel-sec-title">✏️ Field Changes</div>
                                        <DiffViewer before={selected.metadata.before} after={selected.metadata.after} />
                                    </div>
                                )}
                                {selected.metadata && (
                                    <div className="al-panel-sec">
                                        <div className="al-panel-sec-title">📄 Raw Metadata</div>
                                        <pre className="al-panel-json">{JSON.stringify(selected.metadata, null, 2)}</pre>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
