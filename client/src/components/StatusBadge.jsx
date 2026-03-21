// Status badge colors aligned to the Space Editorial design system
export const STATUS_META = {
  DRAFT:     { label: 'Draft',     color: 'var(--text-muted)',   bg: 'rgba(68,68,90,0.15)',  border: 'rgba(68,68,90,0.3)'  },
  READY:     { label: 'Ready',     color: 'var(--info)',         bg: 'var(--info-bg)',        border: 'rgba(96,165,250,0.3)' },
  APPLIED:   { label: 'Applied',   color: 'var(--accent-primary)', bg: 'var(--accent-glow)', border: 'rgba(124,111,247,0.3)' },
  OA:        { label: 'OA',        color: 'var(--warning)',      bg: 'var(--warning-bg)',     border: 'rgba(245,158,11,0.3)' },
  INTERVIEW: { label: 'Interview', color: 'var(--interview)',    bg: 'var(--interview-bg)',   border: 'rgba(167,139,250,0.3)' },
  REJECTED:  { label: 'Rejected',  color: 'var(--danger)',       bg: 'var(--danger-bg)',      border: 'rgba(239,68,68,0.3)' },
  OFFER:     { label: 'Offer',     color: 'var(--success)',      bg: 'var(--success-bg)',     border: 'rgba(34,197,94,0.3)' },
  WITHDRAWN: { label: 'Withdrawn', color: 'var(--text-muted)',   bg: 'rgba(68,68,90,0.1)',   border: 'rgba(68,68,90,0.25)' },
}

export const ALL_STATUSES = Object.keys(STATUS_META)

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, color: 'var(--text-muted)', bg: 'rgba(68,68,90,0.15)', border: 'rgba(68,68,90,0.3)' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 22,
        padding: '0 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.01em',
        color: meta.color,
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {meta.label}
    </span>
  )
}
