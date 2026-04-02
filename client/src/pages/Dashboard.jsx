import { useNavigate } from 'react-router-dom'
import { useApplications } from '../hooks/useApplications.js'
import StatusBadge from '../components/StatusBadge.jsx'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// ─── Avatar initials ──────────────────────────────────────────────────────────
const AVATAR_PALETTES = [
  ['#7C6FF7', 'rgba(124,111,247,0.18)'],
  ['#60A5FA', 'rgba(96,165,250,0.18)'],
  ['#A78BFA', 'rgba(167,139,250,0.18)'],
  ['#22C55E', 'rgba(34,197,94,0.18)'],
  ['#F59E0B', 'rgba(245,158,11,0.18)'],
  ['#EF4444', 'rgba(239,68,68,0.18)'],
  ['#34D399', 'rgba(52,211,153,0.18)'],
]

function avatarColors(name) {
  const idx = (name?.charCodeAt(0) ?? 65) % AVATAR_PALETTES.length
  return AVATAR_PALETTES[idx]
}

function Avatar({ name }) {
  const [color, bg] = avatarColors(name)
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
      background: bg, border: `1px solid ${color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color, letterSpacing: '-0.01em',
    }}>
      {(name ?? '?')[0].toUpperCase()}
    </div>
  )
}

// ─── Score cell with colored dot ──────────────────────────────────────────────
function ScoreCell({ score }) {
  if (score == null) return <span style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>—</span>
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: color,
        boxShadow: `0 0 6px ${color}`,
        flexShrink: 0,
      }} />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color, letterSpacing: '-0.02em' }}>
        {score}%
      </span>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
const CARD_CONFIG = {
  purple: {
    color:      '#7C6FF7',
    border:     '#7C6FF7',
    insetGlow:  'inset 0 0 40px rgba(124,111,247,0.05)',
    hoverGlow:  'inset 0 0 40px rgba(124,111,247,0.1)',
    icon: (
      <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  blue: {
    color:      '#60A5FA',
    border:     '#60A5FA',
    insetGlow:  'inset 0 0 40px rgba(96,165,250,0.05)',
    hoverGlow:  'inset 0 0 40px rgba(96,165,250,0.1)',
    icon: (
      <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  violet: {
    color:      '#A78BFA',
    border:     '#A78BFA',
    insetGlow:  'inset 0 0 40px rgba(167,139,250,0.05)',
    hoverGlow:  'inset 0 0 40px rgba(167,139,250,0.1)',
    icon: (
      <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  green: {
    color:      '#22C55E',
    border:     '#22C55E',
    insetGlow:  'inset 0 0 40px rgba(34,197,94,0.05)',
    hoverGlow:  'inset 0 0 40px rgba(34,197,94,0.1)',
    icon: (
      <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
}

function StatCard({ label, value, accent }) {
  const cfg = CARD_CONFIG[accent] ?? CARD_CONFIG.purple

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-surface)',
        borderRadius: 14,
        padding: '22px 22px 20px',
        borderLeft: `3px solid ${cfg.border}`,
        border: `1px solid var(--border-subtle)`,
        borderLeftWidth: 3,
        borderLeftColor: cfg.border,
        boxShadow: cfg.insetGlow,
        transition: 'box-shadow 0.25s, border-color 0.25s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = cfg.hoverGlow
        e.currentTarget.style.borderColor = `${cfg.border}60`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = cfg.insetGlow
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
      }}
    >
      {/* Large faded background icon */}
      <div style={{
        position: 'absolute',
        top: 12, right: 12,
        color: cfg.color,
        opacity: 0.07,
        pointerEvents: 'none',
        lineHeight: 1,
      }}>
        {cfg.icon}
      </div>

      <p style={{
        margin: '0 0 14px',
        fontSize: 10,
        fontWeight: 500,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
      }}>
        {label}
      </p>
      <p style={{
        margin: 0,
        fontSize: 40,
        fontWeight: 700,
        fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '-0.03em',
        color: cfg.color,
        lineHeight: 1,
      }}>
        {value}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { data: apps = [], isLoading } = useApplications()

  const total      = apps.length
  const inProgress = apps.filter(a => ['OA', 'INTERVIEW'].includes(a.status)).length
  const interviews = apps.filter(a => a.status === 'INTERVIEW').length
  const offers     = apps.filter(a => a.status === 'OFFER').length
  const recent     = apps.slice(0, 10)

  return (
    <div className="page-wrapper">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.01em' }}>
          {getGreeting()}, Alon 👋
        </p>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Dashboard
        </h1>
        <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
          Your job search at a glance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid-4" style={{ marginBottom: 28 }}>
        <StatCard label="Total Applications" value={total}      accent="purple" />
        <StatCard label="In Progress"         value={inProgress} accent="blue"   />
        <StatCard label="Interviews"          value={interviews} accent="violet" />
        <StatCard label="Offers"              value={offers}     accent="green"  />
      </div>

      {/* Recent Applications */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid #1E1E30',
        borderTop: '1px solid #1E1E30',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Recent Applications</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => navigate('/applications')}
              style={{ fontSize: 12, color: '#7C6FF7', background: 'none', border: 'none', padding: 0, fontWeight: 500, cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#A78BFA' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#7C6FF7' }}
            >
              View all →
            </button>
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>
              {total} total
            </span>
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : recent.length === 0 ? (
          <EmptyState />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {[
                  { label: 'Company' },
                  { label: 'Role',         hideMobile: true },
                  { label: 'Status' },
                  { label: 'Match' },
                  { label: 'Date Applied', hideMobile: true },
                ].map(({ label, hideMobile }) => (
                  <th key={label} className={hideMobile ? 'col-hide-mobile' : undefined} style={{
                    textAlign: 'left',
                    padding: '10px 20px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((app, idx) => (
                <tr
                  key={app.id}
                  style={{
                    borderBottom: idx < recent.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(90deg, rgba(124,111,247,0.05), transparent)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Company with avatar */}
                  <td style={{ padding: '11px 20px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={app.job?.company_name} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#E8E8FF' }}>
                        {app.job?.company_name ?? '—'}
                      </span>
                    </div>
                  </td>
                  {/* Role */}
                  <td className="col-hide-mobile" style={{ padding: '11px 20px', fontSize: 13, color: '#6666AA', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {app.job?.title ?? '—'}
                  </td>
                  <td style={{ padding: '11px 20px' }}>
                    <StatusBadge status={app.status} />
                  </td>
                  <td style={{ padding: '11px 20px' }}>
                    <ScoreCell score={app.match_score} />
                  </td>
                  <td className="col-hide-mobile" style={{ padding: '11px 20px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>
                    {formatDate(app.applied_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ padding: '48px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <div className="anim-spin" style={{
        width: 18, height: 18, borderRadius: '50%',
        border: '2px solid var(--border-default)',
        borderTopColor: '#7C6FF7',
      }} />
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</span>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ padding: '52px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>No applications yet</p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Head to Applications to add your first one</p>
      </div>
    </div>
  )
}
