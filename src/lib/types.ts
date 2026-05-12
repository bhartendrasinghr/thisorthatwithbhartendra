export const STATUSES = ['Not Started', 'In Progress', 'Blocked', 'UAT', 'Live'] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ['P0', 'P1', 'P2', 'P3'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const;
export type Size = (typeof SIZES)[number];

export const STATUS_COLORS: Record<Status, { bg: string; fg: string; dot: string }> = {
  'Not Started': { bg: '#eef0f7', fg: '#4a4d70', dot: '#8a8da8' },
  'In Progress': { bg: '#e7eaff', fg: '#1a1f6b', dot: '#1a1f6b' },
  'Blocked':     { bg: '#fde8e8', fg: '#9b1c1c', dot: '#c62828' },
  'UAT':         { bg: '#fff4d6', fg: '#7a5b00', dot: '#d4a93a' },
  'Live':        { bg: '#dff5e1', fg: '#1e5128', dot: '#2e7d32' },
};

export const PRIORITY_COLORS: Record<Priority, { bg: string; fg: string }> = {
  P0: { bg: '#fde8e8', fg: '#9b1c1c' },
  P1: { bg: '#fff4d6', fg: '#7a5b00' },
  P2: { bg: '#e7eaff', fg: '#1a1f6b' },
  P3: { bg: '#eef0f7', fg: '#4a4d70' },
};
