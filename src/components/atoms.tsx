'use client';
import { STATUS_COLORS, PRIORITY_COLORS, type Status, type Priority } from '@/lib/types';

export function StatusPill({ status }: { status: Status }) {
  const c = STATUS_COLORS[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold"
      style={{ backgroundColor: c.bg, color: c.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {status}
    </span>
  );
}

export function PriorityChip({ priority }: { priority: Priority }) {
  const c = PRIORITY_COLORS[priority];
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mono"
      style={{ backgroundColor: c.bg, color: c.fg }}>
      {priority}
    </span>
  );
}

export function Avatar({ initials, size = 24 }: { initials?: string | null; size?: number }) {
  if (!initials) return null;
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-indigo text-white font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {initials}
    </span>
  );
}

export function ProductBadge({ name, color }: { name?: string | null; color?: string | null }) {
  if (!name) return <span className="text-[11px] text-ink-3 italic">unassigned</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-2">
      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color || '#8a8da8' }} />
      {name}
    </span>
  );
}
