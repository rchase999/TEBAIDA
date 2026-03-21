import React, { useState, useEffect, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  BarChart3,
  ScrollText,
  Globe,
  Database,
  Cpu,
  HardDrive,
  Package,
  Clock,
  Activity,
  CheckCircle,
  Trash2,
  Archive,
  Eye,
  AlertTriangle,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Swords,
  ToggleLeft,
  Megaphone,
  Gauge,
  Calendar,
  User,
  Mail,
  ShieldCheck,
  Crown,
  UserCog,
  Search,
  ExternalLink,
  RefreshCw,
  X,
  FileText,
  Zap,
  Brain,
  FlaskConical,
  Bug,
  Wrench,
  TrendingUp,
  Hash,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import { useStore } from '../store';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Toggle } from '../components/Toggle';
import type { Debate, DebateStatus } from '../../types';

/* ============================================================
   Types
   ============================================================ */

type AdminTab = 'overview' | 'users' | 'moderation' | 'settings' | 'analytics' | 'audit' | 'landing';

interface TabDef {
  id: AdminTab;
  label: string;
  icon: LucideIcon;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  details: string;
}

interface FeatureFlags {
  tournamentMode: boolean;
  eloRankings: boolean;
  fallacyDetection: boolean;
  evidenceVerification: boolean;
  extendedThinking: boolean;
  maintenanceMode: boolean;
  debugMode: boolean;
}

/* ============================================================
   Constants
   ============================================================ */

const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'moderation', label: 'Moderation', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'audit', label: 'Audit Log', icon: ScrollText },
  { id: 'landing', label: 'Landing Page', icon: Globe },
];

const LS_FLAGS_KEY = 'debateforge-admin-flags';
const LS_ROLE_KEY = 'debateforge-admin-role';
const LS_ANNOUNCEMENT_KEY = 'debateforge-announcement';
const LS_RATE_LIMIT_KEY = 'debateforge-rate-limit';
const LS_RETENTION_KEY = 'debateforge-data-retention';

const DEFAULT_FLAGS: FeatureFlags = {
  tournamentMode: true,
  eloRankings: true,
  fallacyDetection: true,
  evidenceVerification: true,
  extendedThinking: true,
  maintenanceMode: false,
  debugMode: false,
};

/* ============================================================
   Helpers
   ============================================================ */

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function estimateStorageSize(): string {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) total += key.length + value.length;
      }
    }
    const kb = (total * 2) / 1024; // 2 bytes per char (UTF-16)
    if (kb > 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${kb.toFixed(1)} KB`;
  } catch {
    return 'N/A';
  }
}

function statusColor(status: DebateStatus): 'success' | 'warning' | 'error' | 'info' | 'default' {
  switch (status) {
    case 'completed': return 'success';
    case 'in-progress': return 'info';
    case 'paused': return 'warning';
    case 'cancelled': return 'error';
    default: return 'default';
  }
}

function getStoredFlags(): FeatureFlags {
  try {
    const raw = localStorage.getItem(LS_FLAGS_KEY);
    if (raw) return { ...DEFAULT_FLAGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_FLAGS };
}

function getStoredRole(): string {
  try {
    return localStorage.getItem(LS_ROLE_KEY) || 'Admin';
  } catch {
    return 'Admin';
  }
}

/** Page load time cached once */
const PAGE_LOAD_TIME = Date.now();

/* ============================================================
   Mock Audit Log Data
   ============================================================ */

function generateAuditLog(): AuditEntry[] {
  const now = Date.now();
  const entries: AuditEntry[] = [
    { id: 'a1', timestamp: new Date(now - 300000).toISOString(), action: 'Debate Created', entityType: 'Debate', details: 'New debate on AI regulation started' },
    { id: 'a2', timestamp: new Date(now - 900000).toISOString(), action: 'Persona Edited', entityType: 'Persona', details: 'Updated "The Rational Analyst" background field' },
    { id: 'a3', timestamp: new Date(now - 1800000).toISOString(), action: 'Settings Changed', entityType: 'Settings', details: 'Streaming enabled, theme set to dark' },
    { id: 'a4', timestamp: new Date(now - 3600000).toISOString(), action: 'Export Completed', entityType: 'Data', details: 'Exported 12 debates as JSON' },
    { id: 'a5', timestamp: new Date(now - 5400000).toISOString(), action: 'API Key Updated', entityType: 'Settings', details: 'Anthropic API key rotated' },
    { id: 'a6', timestamp: new Date(now - 7200000).toISOString(), action: 'Debate Completed', entityType: 'Debate', details: 'Oxford Union debate finished: "Climate Change Policy"' },
    { id: 'a7', timestamp: new Date(now - 10800000).toISOString(), action: 'Persona Created', entityType: 'Persona', details: 'Created new persona "Tech Optimist"' },
    { id: 'a8', timestamp: new Date(now - 14400000).toISOString(), action: 'Debate Deleted', entityType: 'Debate', details: 'Removed draft debate "Test topic"' },
    { id: 'a9', timestamp: new Date(now - 18000000).toISOString(), action: 'Settings Changed', entityType: 'Settings', details: 'Fallacy detection enabled' },
    { id: 'a10', timestamp: new Date(now - 21600000).toISOString(), action: 'Debate Created', entityType: 'Debate', details: 'Parliamentary debate on UBI started' },
    { id: 'a11', timestamp: new Date(now - 25200000).toISOString(), action: 'API Key Updated', entityType: 'Settings', details: 'OpenAI API key added' },
    { id: 'a12', timestamp: new Date(now - 28800000).toISOString(), action: 'Export Completed', entityType: 'Data', details: 'Exported debate as PDF' },
    { id: 'a13', timestamp: new Date(now - 32400000).toISOString(), action: 'Persona Edited', entityType: 'Persona', details: 'Updated "Devils Advocate" rhetorical style' },
    { id: 'a14', timestamp: new Date(now - 36000000).toISOString(), action: 'Debate Completed', entityType: 'Debate', details: 'Lincoln-Douglas debate finished: "Space Exploration"' },
    { id: 'a15', timestamp: new Date(now - 43200000).toISOString(), action: 'Settings Changed', entityType: 'Settings', details: 'Rate limit set to 10 debates/hour' },
    { id: 'a16', timestamp: new Date(now - 50400000).toISOString(), action: 'Debate Created', entityType: 'Debate', details: 'Oxford Union debate on "Cryptocurrency Regulation"' },
    { id: 'a17', timestamp: new Date(now - 57600000).toISOString(), action: 'Persona Deleted', entityType: 'Persona', details: 'Removed custom persona "Contrarian"' },
    { id: 'a18', timestamp: new Date(now - 64800000).toISOString(), action: 'API Key Updated', entityType: 'Settings', details: 'Google Gemini API key added' },
  ];
  return entries;
}

/* ============================================================
   Sub-components
   ============================================================ */

/* ---- Stat Card ---- */

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  accent?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, subtext, accent }) => (
  <Card className={clsx(accent && 'ring-1 ring-red-500/20')}>
    <div className="flex items-center gap-4">
      <div className={clsx(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
        accent
          ? 'bg-red-100 dark:bg-red-900/30'
          : 'bg-gray-100 dark:bg-gray-800/50',
      )}>
        <Icon className={clsx('h-5 w-5', accent ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400')} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{value}</p>
        {subtext && <p className="truncate text-xs text-gray-400 dark:text-gray-500">{subtext}</p>}
      </div>
    </div>
  </Card>
);

/* ---- Health Dot ---- */

const HealthDot: React.FC<{ label: string; healthy: boolean }> = ({ label, healthy }) => (
  <div className="flex items-center gap-2">
    <span className={clsx(
      'inline-block h-2.5 w-2.5 rounded-full',
      healthy ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]',
    )} />
    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
  </div>
);

/* ---- Toast ---- */

const Toast: React.FC<{ message: string; type: 'info' | 'success' | 'warning' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={clsx(
      'fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-xl',
      'animate-in slide-in-from-bottom-4 fade-in duration-300',
      type === 'info' && 'bg-blue-600 text-white',
      type === 'success' && 'bg-emerald-600 text-white',
      type === 'warning' && 'bg-amber-500 text-white',
      type === 'error' && 'bg-red-600 text-white',
    )}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 rounded p-0.5 hover:bg-white/20">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

/* ============================================================
   Main Component
   ============================================================ */

const AdminView: React.FC = () => {
  const debates = useStore((s) => s.debates);
  const personas = useStore((s) => s.personas);
  const deleteDebate = useStore((s) => s.deleteDebate);
  const setCurrentView = useStore((s) => s.setCurrentView);

  /* ---- Local state ---- */
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [uptime, setUptime] = useState(0);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, type });
  }, []);

  // Moderation
  const [moderationFilter, setModerationFilter] = useState<DebateStatus | 'all'>('all');
  const [selectedDebates, setSelectedDebates] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<'delete' | 'archive' | null>(null);

  // Settings
  const [flags, setFlags] = useState<FeatureFlags>(getStoredFlags);
  const [announcement, setAnnouncement] = useState(() => {
    try { return localStorage.getItem(LS_ANNOUNCEMENT_KEY) || ''; } catch { return ''; }
  });
  const [rateLimit, setRateLimit] = useState(() => {
    try { return parseInt(localStorage.getItem(LS_RATE_LIMIT_KEY) || '20', 10); } catch { return 20; }
  });
  const [dataRetention, setDataRetention] = useState(() => {
    try { return localStorage.getItem(LS_RETENTION_KEY) || 'forever'; } catch { return 'forever'; }
  });

  // Users
  const [userRole, setUserRole] = useState(getStoredRole);

  // Audit
  const [auditLog] = useState<AuditEntry[]>(generateAuditLog);
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [auditPage, setAuditPage] = useState(0);

  /* ---- Effects ---- */

  // Uptime ticker
  useEffect(() => {
    setUptime(Date.now() - PAGE_LOAD_TIME);
    const timer = setInterval(() => setUptime(Date.now() - PAGE_LOAD_TIME), 1000);
    return () => clearInterval(timer);
  }, []);

  // Persist flags
  useEffect(() => {
    try { localStorage.setItem(LS_FLAGS_KEY, JSON.stringify(flags)); } catch { /* ignore */ }
  }, [flags]);

  // Persist role
  useEffect(() => {
    try { localStorage.setItem(LS_ROLE_KEY, userRole); } catch { /* ignore */ }
  }, [userRole]);

  /* ---- Computed ---- */

  const filteredDebates = useMemo(() => {
    if (moderationFilter === 'all') return debates;
    return debates.filter((d) => d.status === moderationFilter);
  }, [debates, moderationFilter]);

  const filteredAuditLog = useMemo(() => {
    if (auditFilter === 'all') return auditLog;
    return auditLog.filter((e) => e.action === auditFilter);
  }, [auditLog, auditFilter]);

  const auditPageCount = Math.max(1, Math.ceil(filteredAuditLog.length / 10));
  const pagedAuditLog = filteredAuditLog.slice(auditPage * 10, (auditPage + 1) * 10);
  const auditActions = useMemo(() => Array.from(new Set(auditLog.map((e) => e.action))), [auditLog]);

  const recentDebates = useMemo(() =>
    [...debates]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10),
    [debates],
  );

  /* ---- Handlers ---- */

  const toggleFlag = (key: keyof FeatureFlags) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
    showToast(`${key} ${flags[key] ? 'disabled' : 'enabled'}`, 'success');
  };

  const handleDeleteDebate = (id: string) => {
    deleteDebate(id);
    setDeleteConfirm(null);
    setSelectedDebates((prev) => { const next = new Set(prev); next.delete(id); return next; });
    showToast('Debate deleted', 'success');
  };

  const handleBulkDelete = () => {
    selectedDebates.forEach((id) => deleteDebate(id));
    setSelectedDebates(new Set());
    setBulkAction(null);
    showToast(`${selectedDebates.size} debate(s) deleted`, 'success');
  };

  const handleBulkArchive = () => {
    // In a real app, this would set status to archived
    setBulkAction(null);
    showToast(`${selectedDebates.size} debate(s) archived (simulated)`, 'info');
    setSelectedDebates(new Set());
  };

  const handlePublishAnnouncement = () => {
    try { localStorage.setItem(LS_ANNOUNCEMENT_KEY, announcement); } catch { /* ignore */ }
    showToast(announcement ? 'Announcement published' : 'Announcement cleared', 'success');
  };

  const handleSaveRateLimit = () => {
    try { localStorage.setItem(LS_RATE_LIMIT_KEY, String(rateLimit)); } catch { /* ignore */ }
    showToast(`Rate limit set to ${rateLimit}/hour`, 'success');
  };

  const handleSaveRetention = () => {
    try { localStorage.setItem(LS_RETENTION_KEY, dataRetention); } catch { /* ignore */ }
    showToast(`Data retention set to ${dataRetention}`, 'success');
  };

  const handleExportAuditCSV = () => {
    const header = 'Timestamp,Action,Entity Type,Details';
    const rows = filteredAuditLog.map((e) =>
      `"${e.timestamp}","${e.action}","${e.entityType}","${e.details.replace(/"/g, '""')}"`,
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debateforge-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Audit log exported as CSV', 'success');
  };

  const toggleSelectDebate = (id: string) => {
    setSelectedDebates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedDebates.size === filteredDebates.length) {
      setSelectedDebates(new Set());
    } else {
      setSelectedDebates(new Set(filteredDebates.map((d) => d.id)));
    }
  };

  /* ---- Analytics computations ---- */

  const analyticsData = useMemo(() => {
    // Debates per day (last 30 days)
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const dailyCounts: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyCounts[key] = 0;
    }
    debates.forEach((d) => {
      const key = d.createdAt.slice(0, 10);
      if (dailyCounts[key] !== undefined) dailyCounts[key]++;
    });
    const dailyData = Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
    const maxDaily = Math.max(1, ...dailyData.map((d) => d.count));

    // Format distribution
    const formatCounts: Record<string, number> = {};
    debates.forEach((d) => {
      const f = d.format?.name || d.format?.id || 'Unknown';
      formatCounts[f] = (formatCounts[f] || 0) + 1;
    });
    const formatData = Object.entries(formatCounts).map(([name, count]) => ({ name, count }));
    const totalFormats = Math.max(1, formatData.reduce((s, d) => s + d.count, 0));

    // Most used models
    const modelCounts: Record<string, number> = {};
    debates.forEach((d) => {
      d.debaters?.forEach((db) => {
        const name = db.model?.displayName || db.model?.name || 'Unknown';
        modelCounts[name] = (modelCounts[name] || 0) + 1;
      });
    });
    const modelData = Object.entries(modelCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const maxModel = Math.max(1, ...modelData.map((d) => d.count));

    // Average debate length (turns)
    const totalTurns = debates.reduce((s, d) => s + (d.turns?.length || 0), 0);
    const avgTurns = debates.length > 0 ? (totalTurns / debates.length).toFixed(1) : '0';

    // Total words
    const totalWords = debates.reduce((s, d) => {
      return s + (d.turns || []).reduce((ts, t) => ts + (t.content?.split(/\s+/).length || 0), 0);
    }, 0);

    // Peak usage hours
    const hourCounts = new Array(24).fill(0);
    debates.forEach((d) => {
      try {
        const h = new Date(d.createdAt).getHours();
        hourCounts[h]++;
      } catch { /* ignore */ }
    });
    const maxHour = Math.max(1, ...hourCounts);

    return { dailyData, maxDaily, formatData, totalFormats, modelData, maxModel, avgTurns, totalWords, hourCounts, maxHour };
  }, [debates]);

  const formatColors = ['#EF4444', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899'];

  /* ============================================================
     Render Tabs
     ============================================================ */

  /* ---- Overview ---- */
  const renderOverview = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">System Overview</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Total Users" value={1} subtext="Local application" accent />
        <StatCard icon={Swords} label="Total Debates" value={debates.length} subtext={`${debates.filter(d => d.status === 'completed').length} completed`} />
        <StatCard icon={UserCog} label="Total Personas" value={personas.length} subtext="Built-in + custom" />
        <StatCard icon={HardDrive} label="Storage Used" value={estimateStorageSize()} subtext="localStorage estimate" />
        <StatCard icon={Package} label="App Version" value="1.0.0" subtext="DebateForge" accent />
        <StatCard icon={Clock} label="Uptime" value={formatUptime(uptime)} subtext="Since page load" />
      </div>

      {/* System Health */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">System Health</h3>
        <div className="flex flex-wrap gap-6">
          <HealthDot label="Database (localStorage)" healthy />
          <HealthDot label="Renderer (React 19)" healthy />
          <HealthDot label="API Router" healthy />
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Recent Activity</h3>
        {recentDebates.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">No debates yet. Start your first debate to see activity here.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentDebates.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{d.topic || 'Untitled debate'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(d.createdAt)}</p>
                </div>
                <Badge variant={statusColor(d.status)} size="sm">{d.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  /* ---- Users ---- */
  const renderUsers = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">User Management</h2>

      <Card className="relative overflow-hidden">
        {/* Red admin stripe */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 to-red-700" />

        <div className="pt-4">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-xl font-bold text-white shadow-lg">
              A
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              {/* Name & badges */}
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Local Admin</h3>
                  <Badge variant="error" size="sm">
                    <Crown className="mr-1 h-3 w-3" />
                    {userRole}
                  </Badge>
                  <Badge variant="success" size="sm">Active</Badge>
                </div>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">admin@debateforge.local</p>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Role</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{userRole}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Joined</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatDate(new Date().toISOString())}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Last Active</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Just now</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Debates</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{debates.length}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Eye className="h-4 w-4" />}
                  onClick={() => showToast('Impersonation is not available in local mode', 'warning')}
                >
                  Impersonate
                </Button>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role:</label>
                  <select
                    value={userRole}
                    onChange={(e) => { setUserRole(e.target.value); showToast(`Role changed to ${e.target.value}`, 'success'); }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Extra info card */}
      <Card>
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <p>This is a local-only application. User management is simulated for administrative interface completeness. In a production environment, this section would connect to a user database.</p>
        </div>
      </Card>
    </div>
  );

  /* ---- Content Moderation ---- */
  const renderModeration = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Content Moderation</h2>

        <div className="flex items-center gap-3">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={moderationFilter}
              onChange={(e) => setModerationFilter(e.target.value as DebateStatus | 'all')}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="all">All Status</option>
              <option value="setup">Setup</option>
              <option value="in-progress">In Progress</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Bulk actions */}
          {selectedDebates.size > 0 && (
            <>
              <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => setBulkAction('delete')}>
                Delete Selected ({selectedDebates.size})
              </Button>
              <Button variant="outline" size="sm" icon={<Archive className="h-4 w-4" />} onClick={() => setBulkAction('archive')}>
                Archive Selected ({selectedDebates.size})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Debate list */}
      <Card padding="none">
        {filteredDebates.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            No debates found{moderationFilter !== 'all' ? ` with status "${moderationFilter}"` : ''}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedDebates.size === filteredDebates.length && filteredDebates.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Topic</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Models</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Turns</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredDebates.map((d) => (
                  <tr key={d.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedDebates.has(d.id)}
                        onChange={() => toggleSelectDebate(d.id)}
                        className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </td>
                    <td className="max-w-[250px] truncate px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {d.topic || 'Untitled'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusColor(d.status)} size="sm">{d.status}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(d.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {d.debaters?.filter(db => db.position !== 'housemaster').map((db, i) => (
                          <span key={i} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {db.model?.displayName || db.model?.name || '?'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-500 dark:text-gray-400">
                      {d.turns?.length || 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            useStore.getState().setCurrentDebate(d);
                            setCurrentView('debateDetail');
                          }}
                          className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => showToast('Debate archived (simulated)', 'info')}
                          className="rounded p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/30 dark:hover:text-amber-400"
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(d.id)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Confirm Deletion" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Are you sure you want to permanently delete this debate? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={() => deleteConfirm && handleDeleteDebate(deleteConfirm)}>Delete</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk action confirmation modal */}
      <Modal isOpen={bulkAction !== null} onClose={() => setBulkAction(null)} title={`Confirm Bulk ${bulkAction === 'delete' ? 'Delete' : 'Archive'}`} size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={clsx(
              'flex h-10 w-10 items-center justify-center rounded-full',
              bulkAction === 'delete' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30',
            )}>
              <AlertTriangle className={clsx('h-5 w-5', bulkAction === 'delete' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400')} />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {bulkAction === 'delete'
                ? `Permanently delete ${selectedDebates.size} debate(s)? This cannot be undone.`
                : `Archive ${selectedDebates.size} debate(s)?`}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setBulkAction(null)}>Cancel</Button>
            <Button
              variant={bulkAction === 'delete' ? 'danger' : 'primary'}
              size="sm"
              onClick={bulkAction === 'delete' ? handleBulkDelete : handleBulkArchive}
            >
              {bulkAction === 'delete' ? 'Delete All' : 'Archive All'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );

  /* ---- System Settings ---- */
  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">System Settings</h2>

      {/* Feature Flags */}
      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <ToggleLeft className="h-4 w-4" />
          Feature Flags
        </h3>
        <div className="space-y-1">
          <Toggle
            checked={flags.tournamentMode}
            onChange={() => toggleFlag('tournamentMode')}
            label="Enable Tournament Mode"
            description="Allow bracket-style multi-debate tournaments"
          />
          <Toggle
            checked={flags.eloRankings}
            onChange={() => toggleFlag('eloRankings')}
            label="Enable ELO Rankings"
            description="Track model performance with ELO rating system"
          />
          <Toggle
            checked={flags.fallacyDetection}
            onChange={() => toggleFlag('fallacyDetection')}
            label="Enable Fallacy Detection"
            description="Automatically detect logical fallacies in debate turns"
          />
          <Toggle
            checked={flags.evidenceVerification}
            onChange={() => toggleFlag('evidenceVerification')}
            label="Enable Evidence Verification"
            description="Verify citations and evidence sources"
          />
          <Toggle
            checked={flags.extendedThinking}
            onChange={() => toggleFlag('extendedThinking')}
            label="Enable Extended Thinking"
            description="Show AI reasoning process for supported models"
          />
          <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
            <Toggle
              checked={flags.maintenanceMode}
              onChange={() => toggleFlag('maintenanceMode')}
              label="Maintenance Mode"
              description="Shows MaintenanceView to non-admin users"
            />
          </div>
          <Toggle
            checked={flags.debugMode}
            onChange={() => toggleFlag('debugMode')}
            label="Debug Mode"
            description="Enable verbose logging and developer tools"
          />
        </div>
      </Card>

      {/* Global Announcement */}
      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <Megaphone className="h-4 w-4" />
          Global Announcement
        </h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Enter announcement text (leave empty to clear)..."
            />
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handlePublishAnnouncement}
            className="!bg-red-600 hover:!bg-red-700"
          >
            Publish
          </Button>
        </div>
        {announcement && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            Preview: {announcement}
          </div>
        )}
      </Card>

      {/* Rate Limiting */}
      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <Gauge className="h-4 w-4" />
          Rate Limiting
        </h3>
        <div className="flex items-end gap-3">
          <div className="w-48">
            <Input
              label="Max debates per hour"
              type="number"
              min={1}
              max={100}
              value={rateLimit}
              onChange={(e) => setRateLimit(parseInt(e.target.value, 10) || 1)}
            />
          </div>
          <Button variant="outline" size="md" onClick={handleSaveRateLimit}>
            Save
          </Button>
        </div>
      </Card>

      {/* Data Retention */}
      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <Database className="h-4 w-4" />
          Data Retention
        </h3>
        <div className="flex items-end gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Retention Period</label>
            <select
              value={dataRetention}
              onChange={(e) => setDataRetention(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="forever">Forever</option>
              <option value="30-days">30 Days</option>
              <option value="90-days">90 Days</option>
              <option value="1-year">1 Year</option>
            </select>
          </div>
          <Button variant="outline" size="md" onClick={handleSaveRetention}>
            Save
          </Button>
        </div>
      </Card>
    </div>
  );

  /* ---- Analytics ---- */
  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analytics</h2>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={MessageSquare} label="Avg Debate Length" value={`${analyticsData.avgTurns} turns`} subtext="Across all debates" />
        <StatCard icon={FileText} label="Total Words Generated" value={analyticsData.totalWords.toLocaleString()} subtext="All debate content" />
      </div>

      {/* Debates per day (bar chart) */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Debates per Day (Last 30 Days)
        </h3>
        <div className="flex h-40 items-end gap-[2px]">
          {analyticsData.dailyData.map((d, i) => (
            <div
              key={d.date}
              className="group relative flex-1"
              title={`${d.date}: ${d.count} debate(s)`}
            >
              <div
                className="w-full rounded-t bg-red-500 transition-colors hover:bg-red-400 dark:bg-red-600 dark:hover:bg-red-500"
                style={{ height: `${Math.max(d.count > 0 ? 8 : 2, (d.count / analyticsData.maxDaily) * 100)}%` }}
              />
              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white shadow group-hover:block dark:bg-gray-700">
                {d.count}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-400">
          <span>{analyticsData.dailyData[0]?.date.slice(5)}</span>
          <span>{analyticsData.dailyData[analyticsData.dailyData.length - 1]?.date.slice(5)}</span>
        </div>
      </Card>

      {/* Format Distribution (CSS donut) + Model Usage side-by-side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Format distribution */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Format Distribution
          </h3>
          {analyticsData.formatData.length === 0 ? (
            <p className="text-sm text-gray-400">No debates yet</p>
          ) : (
            <div className="flex items-center gap-6">
              {/* CSS Donut */}
              <div className="relative h-32 w-32 shrink-0">
                <svg viewBox="0 0 36 36" className="h-32 w-32 -rotate-90">
                  {(() => {
                    let offset = 0;
                    return analyticsData.formatData.map((f, i) => {
                      const pct = (f.count / analyticsData.totalFormats) * 100;
                      const dashArray = `${pct} ${100 - pct}`;
                      const el = (
                        <circle
                          key={f.name}
                          cx="18"
                          cy="18"
                          r="15.91549"
                          fill="transparent"
                          stroke={formatColors[i % formatColors.length]}
                          strokeWidth="3.5"
                          strokeDasharray={dashArray}
                          strokeDashoffset={-offset}
                          strokeLinecap="round"
                        />
                      );
                      offset += pct;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{debates.length}</span>
                </div>
              </div>
              {/* Legend */}
              <div className="space-y-2">
                {analyticsData.formatData.map((f, i) => (
                  <div key={f.name} className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: formatColors[i % formatColors.length] }} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{f.name}</span>
                    <span className="text-xs text-gray-400">({f.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Most used models */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Most Used AI Models
          </h3>
          {analyticsData.modelData.length === 0 ? (
            <p className="text-sm text-gray-400">No model data yet</p>
          ) : (
            <div className="space-y-3">
              {analyticsData.modelData.map((m) => (
                <div key={m.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{m.name}</span>
                    <span className="tabular-nums text-gray-400">{m.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-red-500 dark:bg-red-600"
                      style={{ width: `${(m.count / analyticsData.maxModel) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Peak Usage Hours */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Peak Usage Hours
        </h3>
        <div className="flex h-32 items-end gap-1">
          {analyticsData.hourCounts.map((count, h) => (
            <div
              key={h}
              className="group relative flex-1"
              title={`${String(h).padStart(2, '0')}:00 - ${count} debate(s)`}
            >
              <div
                className="w-full rounded-t bg-gradient-to-t from-red-600 to-red-400 transition-colors hover:from-red-500 hover:to-red-300 dark:from-red-700 dark:to-red-500"
                style={{ height: `${Math.max(count > 0 ? 8 : 2, (count / analyticsData.maxHour) * 100)}%` }}
              />
              <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white shadow group-hover:block dark:bg-gray-700">
                {count}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-400">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </Card>
    </div>
  );

  /* ---- Audit Log ---- */
  const renderAuditLog = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Audit Log</h2>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={auditFilter}
              onChange={(e) => { setAuditFilter(e.target.value); setAuditPage(0); }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="all">All Actions</option>
              {auditActions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            onClick={handleExportAuditCSV}
          >
            Export as CSV
          </Button>
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Timestamp</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Action</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Entity Type</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {pagedAuditLog.map((entry) => (
                <tr key={entry.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-500 dark:text-gray-400">
                    {formatDateTime(entry.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        entry.action.includes('Delete') ? 'error' :
                        entry.action.includes('Created') ? 'success' :
                        entry.action.includes('Updated') || entry.action.includes('Edited') ? 'info' :
                        entry.action.includes('Completed') ? 'success' :
                        'default'
                      }
                      size="sm"
                    >
                      {entry.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{entry.entityType}</td>
                  <td className="max-w-[350px] truncate px-4 py-3 text-gray-500 dark:text-gray-400">{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {auditPageCount > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {auditPage * 10 + 1}-{Math.min((auditPage + 1) * 10, filteredAuditLog.length)} of {filteredAuditLog.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuditPage((p) => Math.max(0, p - 1))}
                disabled={auditPage === 0}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: auditPageCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setAuditPage(i)}
                  className={clsx(
                    'rounded px-2.5 py-1 text-sm font-medium',
                    i === auditPage
                      ? 'bg-red-600 text-white'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800',
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setAuditPage((p) => Math.min(auditPageCount - 1, p + 1))}
                disabled={auditPage === auditPageCount - 1}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  /* ---- Landing Page ---- */
  const renderLanding = () => {
    const hasVisited = (() => {
      try { return localStorage.getItem('debateforge-has-visited') !== null; } catch { return false; }
    })();

    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Landing Page Management</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Navigate to Landing */}
          <Card className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <Globe className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">View Landing Page</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Navigate to the public-facing landing page.
              </p>
            </div>
            <Button
              variant="primary"
              icon={<ExternalLink className="h-4 w-4" />}
              onClick={() => useStore.getState().setCurrentView('landing')}
              className="!bg-red-600 hover:!bg-red-700"
            >
              View Landing Page
            </Button>
          </Card>

          {/* Reset First Visit */}
          <Card className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <RefreshCw className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Reset First Visit</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Clear the visited flag and navigate to the landing page as a new user.
              </p>
            </div>
            <Button
              variant="outline"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={() => {
                localStorage.removeItem('debateforge-has-visited');
                useStore.getState().setCurrentView('landing');
                showToast('First visit flag cleared', 'success');
              }}
            >
              Reset First Visit
            </Button>
          </Card>
        </div>

        {/* Preview stats */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Landing Page Stats
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">First Visit Flag</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {hasVisited ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-4 w-4" /> Set
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Clock className="h-4 w-4" /> Not Set
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total Debates</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{debates.length}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total Personas</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{personas.length}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">App Version</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">1.0.0</p>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  /* ---- Tab content router ---- */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'users': return renderUsers();
      case 'moderation': return renderModeration();
      case 'settings': return renderSettings();
      case 'analytics': return renderAnalytics();
      case 'audit': return renderAuditLog();
      case 'landing': return renderLanding();
    }
  };

  /* ============================================================
     Main Layout
     ============================================================ */

  return (
    <div className="flex h-full min-h-[600px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-surface-dark-1">
      {/* ---- Dark sidebar ---- */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-800 bg-gray-900 dark:border-gray-700 dark:bg-gray-950">
        {/* Header */}
        <div className="border-b border-gray-800 px-4 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
              <ShieldCheck className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Admin Console</h1>
              <p className="text-[10px] text-gray-400">DebateForge v1.0.0</p>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-red-600/20 text-red-400'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200',
                    )}
                  >
                    <Icon className={clsx('h-4 w-4 shrink-0', isActive && 'text-red-500')} />
                    <span>{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom */}
        <div className="border-t border-gray-800 px-4 py-3 dark:border-gray-700">
          <button
            onClick={() => setCurrentView('home')}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to App</span>
          </button>
        </div>
      </aside>

      {/* ---- Content area ---- */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-surface-dark-2">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <ShieldCheck className="h-4 w-4 text-red-500" />
          <span>Admin</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {TABS.find((t) => t.id === activeTab)?.label}
          </span>
        </div>

        {renderTabContent()}
      </main>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminView;
