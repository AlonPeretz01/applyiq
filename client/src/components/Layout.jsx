import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconDashboard() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}
function IconBriefcase() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}
function IconFile() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
function IconClipboard() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}
function IconUser() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}
function IconBarChart() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <line strokeLinecap="round" strokeLinejoin="round" x1="18" y1="20" x2="18" y2="10" />
      <line strokeLinecap="round" strokeLinejoin="round" x1="12" y1="20" x2="12" y2="4" />
      <line strokeLinecap="round" strokeLinejoin="round" x1="6" y1="20" x2="6" y2="14" />
      <line strokeLinecap="round" strokeLinejoin="round" x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}

const NAV_ITEMS = [
  { to: '/',             label: 'Dashboard',    Icon: IconDashboard  },
  { to: '/jobs',         label: 'Jobs',         Icon: IconBriefcase  },
  { to: '/cv-versions',  label: 'CV Versions',  Icon: IconFile       },
  { to: '/applications', label: 'Applications', Icon: IconClipboard  },
  { to: '/analytics',    label: 'Analytics',    Icon: IconBarChart   },
  { to: '/profile',      label: 'Profile',      Icon: IconUser       },
]

function NavItem({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height: 36,
        borderRadius: 8,
        paddingLeft: isActive ? 10 : 12,
        paddingRight: 12,
        fontSize: 13,
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
        borderLeft: isActive ? '2px solid #7C6FF7' : '2px solid transparent',
        background: isActive
          ? 'linear-gradient(90deg, rgba(124,111,247,0.14), transparent)'
          : 'transparent',
        color: isActive ? '#A78BFA' : 'var(--text-secondary)',
      })}
      onMouseEnter={(e) => {
        const isActive = e.currentTarget.style.color === 'rgb(167, 139, 250)'
        if (!isActive) {
          e.currentTarget.style.background = 'var(--bg-elevated)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }
      }}
      onMouseLeave={(e) => {
        const isActive = e.currentTarget.style.color === 'rgb(167, 139, 250)'
        if (!isActive) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }
      }}
    >
      <Icon />
      {label}
    </NavLink>
  )
}

const AVATAR_PALETTE = ['#7C6FF7', '#60A5FA', '#A78BFA', '#34D399', '#F59E0B', '#EC4899']
function Avatar({ name, email, size = 28 }) {
  const raw = name || email || '?'
  const initials = raw.includes('@')
    ? raw[0].toUpperCase()
    : raw.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  const color = AVATAR_PALETTE[(raw.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: color + '22', border: '1px solid ' + color + '55',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 600, color,
    }}>
      {initials}
    </div>
  )
}

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'User'

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: 'linear-gradient(180deg, #16162A 0%, #13131F 100%)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Purple top accent bar */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: 60, height: 2,
          background: '#7C6FF7',
          borderRadius: '0 0 2px 0',
        }} />

        {/* Logo */}
        <div style={{
          height: 56,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: '#7C6FF7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 20px rgba(124,111,247,0.45)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                ApplyIQ
              </span>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#7C6FF7',
                boxShadow: '0 0 6px #7C6FF7, 0 0 12px rgba(124,111,247,0.5)',
                flexShrink: 0,
              }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>Job Tracker</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavItem key={to} to={to} label={label} Icon={Icon} />
          ))}
        </nav>

        {/* User section */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '12px 12px 10px',
          display: 'flex', flexDirection: 'column', gap: 8,
          flexShrink: 0,
        }}>
          <div
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '6px 8px', borderRadius: 8,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <Avatar name={user?.user_metadata?.full_name || user?.user_metadata?.name} email={user?.email} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            style={{
              width: '100%', padding: '6px 0', borderRadius: 7,
              background: 'transparent', border: '1px solid var(--border-subtle)',
              fontSize: 11, fontWeight: 500, color: 'var(--text-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-bg)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-base)' }}>
        <div className="anim-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
