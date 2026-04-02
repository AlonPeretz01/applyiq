import {
  ResponsiveContainer,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts'
import { useAnalyticsOverview } from '../hooks/useAnalytics.js'

// ─── Status meta ──────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  DRAFT:     '#44445A',
  READY:     '#60A5FA',
  APPLIED:   '#7C6FF7',
  OA:        '#F59E0B',
  INTERVIEW: '#A78BFA',
  REJECTED:  '#EF4444',
  OFFER:     '#22C55E',
  WITHDRAWN: '#4B4B6A',
}
const STATUS_LABELS = {
  DRAFT: 'Draft', READY: 'Ready', APPLIED: 'Applied', OA: 'OA',
  INTERVIEW: 'Interview', REJECTED: 'Rejected', OFFER: 'Offer', WITHDRAWN: 'Withdrawn',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function matchColor(score) {
  if (score == null) return '#44445A'
  if (score >= 75) return '#22C55E'
  if (score >= 50) return '#F59E0B'
  return '#EF4444'
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Recharts tooltip ─────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, labelFormatter }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1A1A2E',
      border: '1px solid #2A2A40',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      color: '#E8E8FF',
    }}>
      <div style={{ color: '#8888AA', marginBottom: 4 }}>
        {labelFormatter ? labelFormatter(label) : label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#7C6FF7', fontWeight: 500 }}>
          {p.name ? `${p.name}: ` : ''}{p.value}
        </div>
      ))}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent, sub }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderLeft: `3px solid ${accent}`,
      borderRadius: 12,
      padding: '20px 22px 18px',
      boxShadow: `inset 0 0 40px ${accent}10`,
    }}>
      <p style={{
        margin: '0 0 12px',
        fontSize: 10, fontWeight: 500,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
      }}>
        {label}
      </p>
      <p style={{
        margin: 0,
        fontSize: 38, fontWeight: 700,
        fontFamily: 'JetBrains Mono, monospace',
        color: accent,
        letterSpacing: '-0.03em',
        lineHeight: 1,
      }}>
        {value}
      </p>
      {sub && (
        <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>{sub}</p>
      )}
    </div>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children, style }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      overflow: 'hidden',
      ...style,
    }}>
      {title && (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function SkeletonBox({ height = 20, width = '100%', style }) {
  return (
    <div style={{
      height, width,
      borderRadius: 8,
      background: 'var(--bg-elevated)',
      opacity: 0.6,
      ...style,
    }} />
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <SkeletonBox height={32} width={180} style={{ marginBottom: 8 }} />
      <SkeletonBox height={14} width={260} style={{ marginBottom: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[0, 1, 2, 3].map(i => <SkeletonBox key={i} height={106} />)}
      </div>
      <SkeletonBox height={248} style={{ marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <SkeletonBox height={300} />
        <SkeletonBox height={300} />
      </div>
      <SkeletonBox height={180} />
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 40px', gap: 14, textAlign: 'center',
    }}>
      <svg width="52" height="52" fill="none" viewBox="0 0 24 24" stroke="#2A2A45" strokeWidth={1.25}>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
      <div>
        <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>
          No data yet
        </p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', maxWidth: 280 }}>
          Start applying to jobs to see your analytics here.
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Analytics() {
  const { data, isLoading, error } = useAnalyticsOverview()

  if (isLoading) return <LoadingSkeleton />

  if (error) {
    return (
      <div style={{ padding: '32px 40px', color: 'var(--danger)', fontSize: 13 }}>
        Failed to load analytics. Please try refreshing.
      </div>
    )
  }

  const pageHeader = (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
        Analytics
      </h1>
      <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
        Your job search performance at a glance
      </p>
    </div>
  )

  if (!data || data.total_applications === 0) {
    return (
      <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
        {pageHeader}
        <EmptyState />
      </div>
    )
  }

  const pieData = Object.entries(data.by_status)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      {pageHeader}

      {/* ── Row 1: Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard
          label="Total Applications"
          value={data.total_applications}
          accent="#7C6FF7"
          sub={`${data.applications_this_month} this month`}
        />
        <StatCard
          label="Interview Rate"
          value={`${data.interview_rate}%`}
          accent="#A78BFA"
          sub={`${data.total_interviews} interview${data.total_interviews !== 1 ? 's' : ''}`}
        />
        <StatCard
          label="Avg Match Score"
          value={`${data.avg_match_score}%`}
          accent={matchColor(data.avg_match_score)}
          sub="from AI analyses"
        />
        <StatCard
          label="Response Rate"
          value={`${data.response_rate}%`}
          accent="#F59E0B"
          sub={`${data.total_offers} offer${data.total_offers !== 1 ? 's' : ''}`}
        />
      </div>

      {/* ── Row 2: Applications over time ── */}
      <SectionCard title="Applications over time" style={{ marginBottom: 20 }}>
        <div style={{ padding: '16px 8px 8px' }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={data.applications_over_time}
              margin={{ top: 5, right: 24, left: -20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7C6FF7" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#7C6FF7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E30" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateShort}
                interval={4}
                tick={{ fontSize: 10, fill: '#8888AA' }}
                axisLine={{ stroke: '#2A2A40' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#8888AA' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip labelFormatter={formatDateShort} />}
                cursor={{ stroke: '#7C6FF7', strokeWidth: 1, strokeDasharray: '4 2' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#7C6FF7"
                strokeWidth={2}
                fill="url(#areaGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#7C6FF7', stroke: '#1A1A2E', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* ── Row 3: Status pie + Top tech bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Donut — Application Status */}
        <SectionCard title="Application Status">
          <div style={{ padding: '16px 8px 8px' }}>
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#44445A'} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const { name, value } = payload[0]
                      return (
                        <div style={{ background: '#1A1A2E', border: '1px solid #2A2A40', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#E8E8FF' }}>
                          <div style={{ color: STATUS_COLORS[name] ?? '#8888AA', fontWeight: 600 }}>
                            {STATUS_LABELS[name] ?? name}
                          </div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                            {value}
                          </div>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center total label */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#E8E8FF', lineHeight: 1 }}>
                    {data.total_applications}
                  </div>
                  <div style={{ fontSize: 10, color: '#8888AA', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Total
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 14px', justifyContent: 'center', padding: '6px 12px 4px' }}>
              {pieData.map(({ name, value }) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_COLORS[name] ?? '#44445A', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#8888AA' }}>{STATUS_LABELS[name]}</span>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#E8E8FF' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Horizontal bar — Top Technologies */}
        <SectionCard title="Most analyzed technologies">
          <div style={{ padding: '16px 8px 12px' }}>
            {data.top_technologies.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260, fontSize: 12, color: 'var(--text-muted)' }}>
                No AI analyses yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(data.top_technologies.length * 36, 100)}>
                <BarChart
                  data={data.top_technologies}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E1E30" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#8888AA' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={84}
                    tick={{ fontSize: 11, fill: '#8888AA' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: 'rgba(124,111,247,0.06)' }}
                  />
                  <Bar dataKey="count" fill="#7C6FF7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Row 4: CV Performance table ── */}
      {data.cv_performance.length > 0 && (
        <SectionCard title="CV Performance">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['CV Name', 'Type', 'Uses', 'Avg Match', 'Interviews'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '10px 20px',
                    fontSize: 10,
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.cv_performance.map((cv, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {cv.cv_name}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 500,
                      color: '#7C6FF7',
                      background: 'rgba(124,111,247,0.1)',
                      padding: '2px 8px',
                      borderRadius: 20,
                      border: '1px solid rgba(124,111,247,0.25)',
                    }}>
                      {cv.cv_type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {cv.uses}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    {cv.avg_match == null ? (
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>—</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: matchColor(cv.avg_match),
                          boxShadow: `0 0 6px ${matchColor(cv.avg_match)}`,
                          flexShrink: 0,
                        }} />
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
                          fontWeight: 600, color: matchColor(cv.avg_match),
                        }}>
                          {cv.avg_match}%
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{
                    padding: '12px 20px',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
                    color: cv.interviews > 0 ? '#A78BFA' : 'var(--text-secondary)',
                    fontWeight: cv.interviews > 0 ? 600 : 400,
                  }}>
                    {cv.interviews}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}
    </div>
  )
}
