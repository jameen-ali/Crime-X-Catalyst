import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple';
  suffix?: string;
  change?: number;
  delay?: number;
}

const COLOR_MAP = {
  blue:   { bg: 'bg-[var(--info)]/15',   text: 'text-[var(--info)]',   border: 'border-[var(--info)]/20',   icon: 'bg-[var(--info)]/20',   glow: 'shadow-[0_0_20px_rgba(var(--info-rgb),0.15)]' },
  green:  { bg: 'bg-[var(--success)]/15',  text: 'text-[var(--success)]',  border: 'border-[var(--success)]/20',  icon: 'bg-[var(--success)]/20',  glow: 'shadow-[0_0_20px_rgba(var(--success-rgb),0.15)]' },
  red:    { bg: 'bg-[var(--danger)]/15',    text: 'text-[var(--danger)]',    border: 'border-[var(--danger)]/20',    icon: 'bg-[var(--danger)]/20',    glow: 'shadow-[0_0_20px_rgba(var(--danger-rgb),0.15)]' },
  amber:  { bg: 'bg-[var(--warning)]/15',  text: 'text-[var(--warning)]',  border: 'border-[var(--warning)]/20',  icon: 'bg-[var(--warning)]/20',  glow: 'shadow-[0_0_20px_rgba(var(--warning-rgb),0.15)]' },
  purple: { bg: 'bg-[var(--accent)]/15', text: 'text-[var(--accent)]', border: 'border-[var(--accent)]/20', icon: 'bg-[var(--accent)]/20', glow: 'shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)]' },
};

export function KPICard({ title, value, icon: Icon, color, suffix = '', change, delay = 0 }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const c = COLOR_MAP[color];

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), value);
      setDisplayValue(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`relative rounded-2xl p-5 border ${c.border} ${c.bg} ${c.glow} glass-hover cursor-default`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-400 font-medium mb-3 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full inline-block ${
              color === 'green' ? 'bg-[var(--success)]' :
              color === 'red' ? 'bg-[var(--danger)]' :
              color === 'amber' ? 'bg-[var(--warning)]' :
              color === 'purple' ? 'bg-[var(--accent)]' :
              'bg-[var(--info)]'
            }`} />
            {title}
          </div>
          <div className={`text-3xl font-bold ${c.text} tabular-nums`}>
            {displayValue.toLocaleString()}{suffix}
          </div>
          {change !== undefined && (
            <div className={`text-xs mt-1.5 font-medium ${change >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last week
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center`}>
          <Icon size={20} className={c.text} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
export function KPICardSkeleton() {
  return (
    <div className="rounded-2xl p-5 border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="skeleton h-3 w-24 rounded-full mb-3" />
          <div className="skeleton h-8 w-20 rounded-full" />
          <div className="skeleton h-3 w-16 rounded-full mt-2" />
        </div>
        <div className="skeleton w-11 h-11 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Generic Glass Card ───────────────────────────────────────────────────────
interface GlassCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
  padding?: boolean;
}

export function GlassCard({ title, children, className = '', headerRight, padding = true }: GlassCardProps) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] glass ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      <div className={padding ? 'p-5' : ''}>{children}</div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; dot: string }> = {
    'Open': { bg: 'badge-medium', dot: 'bg-[var(--info)]' },
    'Under Investigation': { bg: 'badge-high', dot: 'bg-[var(--warning)]' },
    'Closed': { bg: 'bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30', dot: 'bg-[var(--success)]' },
    'Pending': { bg: 'bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/30', dot: 'bg-[var(--warning)]' },
    'Critical': { bg: 'badge-critical', dot: 'bg-[var(--danger)]' },
    'High': { bg: 'badge-high', dot: 'bg-[var(--danger)]' },
    'Medium': { bg: 'badge-medium', dot: 'bg-[var(--info)]' },
    'Low': { bg: 'badge-low', dot: 'bg-[var(--success)]' },
    'Active': { bg: 'bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30', dot: 'bg-[var(--success)]' },
    'On Leave': { bg: 'bg-[var(--text-muted)]/15 text-[var(--text-muted)] border border-[var(--border)]', dot: 'bg-[var(--text-muted)]' },
    'Suspended': { bg: 'badge-critical', dot: 'bg-[var(--danger)]' },
    'online': { bg: 'bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30', dot: 'bg-[var(--success)]' },
    'degraded': { bg: 'badge-high', dot: 'bg-[var(--warning)]' },
    'offline': { bg: 'badge-critical', dot: 'bg-[var(--danger)]' },
  };
  const style = map[status] || { bg: 'badge-medium', dot: 'bg-[var(--info)]' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${style.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

// ─── Skeleton panel ───────────────────────────────────────────────────────────
export function SkeletonPanel({ rows = 4, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-4 rounded-full" style={{ width: `${70 + Math.random() * 30}%` }} />
      ))}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-lg font-bold text-[var(--text)]">{title}</h2>
        {subtitle && <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

// ─── Select Filter ────────────────────────────────────────────────────────────
interface FilterSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export function FilterSelect({ value, onChange, options, placeholder = 'All', className = '' }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] rounded-xl px-3 py-2 focus:border-[var(--accent)] transition-colors ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── Confidence bar ───────────────────────────────────────────────────────────
export function ConfidenceBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="space-y-1">
      {label && <div className="flex justify-between text-xs text-[var(--text-muted)]"><span>{label}</span><span className="text-[var(--accent)] font-medium">{value}%</span></div>}
      <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${value >= 80 ? 'bg-[var(--success)]' : value >= 60 ? 'bg-[var(--accent)]' : 'bg-[var(--warning)]'}`}
        />
      </div>
    </div>
  );
}
