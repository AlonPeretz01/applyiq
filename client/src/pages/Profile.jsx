import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useApplications } from '../hooks/useApplications.js'
import { useCvVersions } from '../hooks/useCvVersions.js'
import { useCredits } from '../hooks/useCredits.js'
import api from '../api/client.js'

const ADMIN_EMAILS = ['alonperetz2001@gmail.com']

// ─── Constants ────────────────────────────────────────────────────────────────
const AVATAR_PALETTES = [
  ['#7C6FF7', 'rgba(124,111,247,0.2)'],
  ['#60A5FA', 'rgba(96,165,250,0.2)'],
  ['#A78BFA', 'rgba(167,139,250,0.2)'],
  ['#22C55E', 'rgba(34,197,94,0.2)'],
  ['#F59E0B', 'rgba(245,158,11,0.2)'],
  ['#EF4444', 'rgba(239,68,68,0.2)'],
  ['#34D399', 'rgba(52,211,153,0.2)'],
]

const SENIORITY_OPTIONS = [
  { label: '— Not set —',    value: '' },
  { label: 'Student / Intern', value: 'Student/Intern' },
  { label: 'Junior',          value: 'Junior' },
  { label: 'Mid',             value: 'Mid' },
  { label: 'Senior',          value: 'Senior' },
]

const EXPERIENCE_OPTIONS = [
  { label: '— Not set —',      value: '' },
  { label: '0 (No experience)', value: '0' },
  { label: '1 year',           value: '1' },
  { label: '2 years',          value: '2' },
  { label: '3 years',          value: '3' },
  { label: '4 years',          value: '4' },
  { label: '5 years',          value: '5' },
  { label: '6–10 years',       value: '8' },
  { label: '10+ years',        value: '15' },
]

const EMPTY_FORM = {
  full_name: '', headline: '', location: '', summary: '',
  target_role: '', target_seniority: '', years_experience: '',
  skills: [], github_url: '', linkedin_url: '', portfolio_url: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function avatarColors(name) {
  const code = ((name ?? 'A').toUpperCase().charCodeAt(0) - 65)
  return AVATAR_PALETTES[Math.abs(code) % AVATAR_PALETTES.length]
}

function mapYearsToOption(n) {
  if (n == null) return ''
  if (n <= 5)  return String(n)
  if (n <= 10) return '8'
  return '15'
}

function formatMemberSince(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const INPUT_BASE = {
  width: '100%',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 8,
  height: 38,
  padding: '0 12px',
  fontSize: 13,
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const SECTION_CARD = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 12,
  padding: '22px 24px',
  marginBottom: 14,
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function Spinner({ size = 13 }) {
  return (
    <div className="anim-spin" style={{
      width: size, height: size, borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'currentColor', flexShrink: 0,
    }} />
  )
}

function FieldLabel({ children }) {
  return (
    <label style={{
      display: 'block', fontSize: 12, fontWeight: 500,
      color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.02em',
    }}>
      {children}
    </label>
  )
}

function SectionHeader({ title }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)',
    }}>
      {title}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={INPUT_BASE}
      onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
      onBlur={e =>  { e.target.style.borderColor = 'var(--border-subtle)';  e.target.style.boxShadow = 'none' }}
    />
  )
}

function TextareaInput({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{ ...INPUT_BASE, height: 'auto', padding: '10px 12px', resize: 'vertical', lineHeight: 1.65 }}
      onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
      onBlur={e =>  { e.target.style.borderColor = 'var(--border-subtle)';  e.target.style.boxShadow = 'none' }}
    />
  )
}

function SelectInput({ value, onChange, options }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={onChange}
        style={{ ...INPUT_BASE, appearance: 'none', WebkitAppearance: 'none', paddingRight: 34, cursor: 'pointer' }}
        onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
        onBlur={e =>  { e.target.style.borderColor = 'var(--border-subtle)';  e.target.style.boxShadow = 'none' }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} style={{ background: '#13131F', color: '#E8E8FF' }}>
            {opt.label}
          </option>
        ))}
      </select>
      <div style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function GitHubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  )
}

// ─── Link input with icon prefix ──────────────────────────────────────────────
function LinkInput({ icon, value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex' }}>
      <div style={{
        height: 38, padding: '0 11px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
        borderRight: 'none', borderRadius: '8px 0 0 8px',
        color: 'var(--text-muted)', flexShrink: 0,
      }}>
        {icon}
      </div>
      <input
        type="url"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ ...INPUT_BASE, borderRadius: '0 8px 8px 0' }}
        onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
        onBlur={e =>  { e.target.style.borderColor = 'var(--border-subtle)';  e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}

// ─── Skills input ─────────────────────────────────────────────────────────────
function SkillsInput({ skills, onChange }) {
  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef(null)

  function commit(raw) {
    const skill = raw.trim().replace(/,+$/, '').trim()
    if (skill && !skills.includes(skill) && skills.length < 20) {
      onChange([...skills, skill])
    }
    setInputVal('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); commit(inputVal) }
    if (e.key === ',')     { e.preventDefault(); commit(inputVal) }
    if (e.key === 'Backspace' && inputVal === '' && skills.length > 0) {
      onChange(skills.slice(0, -1))
    }
  }

  function handleChange(e) {
    const val = e.target.value
    if (val.endsWith(',')) commit(val)
    else setInputVal(val)
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center',
        minHeight: 42, padding: '7px 10px',
        background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
        borderRadius: 8, cursor: 'text',
      }}
    >
      {skills.map(skill => (
        <span key={skill} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 7px 3px 11px', borderRadius: 20, fontSize: 12, fontWeight: 500,
          color: 'var(--accent-primary)',
          background: 'rgba(124,111,247,0.1)', border: '1px solid rgba(124,111,247,0.25)',
          userSelect: 'none',
        }}>
          {skill}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(skills.filter(s => s !== skill)) }}
            style={{
              background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer',
              color: 'rgba(124,111,247,0.5)', fontSize: 15, lineHeight: 1, display: 'flex', alignItems: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(124,111,247,0.5)' }}
          >
            ×
          </button>
        </span>
      ))}

      {skills.length < 20 && (
        <input
          ref={inputRef}
          value={inputVal}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={skills.length === 0 ? 'Type a skill, press Enter or comma to add…' : '+ add skill'}
          style={{
            flex: 1, minWidth: 160, background: 'none', border: 'none',
            outline: 'none', fontSize: 13, color: 'var(--text-primary)',
          }}
        />
      )}
    </div>
  )
}

// ─── Credits section ──────────────────────────────────────────────────────────
function CreditsBar({ used, limit }) {
  const pct   = limit >= 999999 ? 0 : Math.min(used / limit, 1)
  const color = pct >= 0.8 ? 'var(--danger)' : pct >= 0.6 ? 'var(--warning)' : 'var(--success)'
  return (
    <div style={{ height: 5, borderRadius: 3, background: 'var(--border-default)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.round(pct * 100)}%`, background: color, borderRadius: 3, transition: 'width 0.3s ease' }} />
    </div>
  )
}

function CreditsSection({ email }) {
  const { data: credits } = useCredits()
  const isAdmin = ADMIN_EMAILS.includes(email)

  const daysLeft = credits
    ? Math.ceil(
        (new Date(new Date(credits.reset_at).getFullYear(), new Date(credits.reset_at).getMonth() + 1, 1) - new Date()) /
        (1000 * 60 * 60 * 24)
      )
    : null

  return (
    <div style={SECTION_CARD}>
      <SectionHeader title="Your Credits" />

      {/* AI Analyses */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>AI Analyses</span>
          <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
            {isAdmin ? (
              <span style={{ color: 'var(--success)', fontFamily: 'inherit' }}>Unlimited</span>
            ) : credits ? (
              `${credits.ai_analyses_used} / ${credits.ai_analyses_limit} used`
            ) : '—'}
          </span>
        </div>
        {!isAdmin && credits && (
          <CreditsBar used={credits.ai_analyses_used} limit={credits.ai_analyses_limit} />
        )}
      </div>

      {/* CV Generations */}
      <div style={{ marginBottom: daysLeft != null || isAdmin ? 12 : 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>CV Generations</span>
          <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
            {isAdmin ? (
              <span style={{ color: 'var(--success)', fontFamily: 'inherit' }}>Unlimited</span>
            ) : credits ? (
              `${credits.cv_generated_used} / ${credits.cv_generated_limit} used`
            ) : '—'}
          </span>
        </div>
        {!isAdmin && credits && (
          <CreditsBar used={credits.cv_generated_used} limit={credits.cv_generated_limit} />
        )}
      </div>

      {/* Reset countdown */}
      {!isAdmin && daysLeft != null && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
          Resets in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
        </div>
      )}

      {/* Loading skeleton */}
      {!isAdmin && !credits && (
        <div style={{ height: 4, borderRadius: 2, background: 'var(--border-subtle)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      )}
    </div>
  )
}

// ─── Left column components ───────────────────────────────────────────────────
function AvatarCard({ user, profile }) {
  const displayName = profile.full_name
    || user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || '?'

  const [color, bg] = avatarColors(displayName)
  const memberSince = formatMemberSince(user?.created_at)

  return (
    <div style={{ ...SECTION_CARD, textAlign: 'center' }}>
      {/* Avatar */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%', margin: '0 auto 14px',
        background: bg, border: `2px solid ${color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, fontWeight: 700, color, letterSpacing: '-0.01em', flexShrink: 0,
      }}>
        {displayName[0].toUpperCase()}
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
        {displayName}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {user?.email}
      </div>

      {profile.headline && (
        <div style={{
          fontSize: 12, color: 'var(--text-secondary)', marginTop: 10,
          lineHeight: 1.55, fontStyle: 'italic',
          padding: '8px 0', borderTop: '1px solid var(--border-subtle)',
        }}>
          {profile.headline}
        </div>
      )}

      {memberSince && (
        <div style={{
          marginTop: profile.headline ? 0 : 12,
          paddingTop: profile.headline ? 0 : 12,
          borderTop: profile.headline ? 'none' : '1px solid var(--border-subtle)',
          fontSize: 11, color: 'var(--text-muted)',
        }}>
          Member since {memberSince}
        </div>
      )}
    </div>
  )
}

function StatsCard({ totalApps, interviews, totalCvs }) {
  const items = [
    { label: 'Applications', value: totalApps  },
    { label: 'Interviews',   value: interviews  },
    { label: 'CV Versions',  value: totalCvs    },
  ]
  return (
    <div style={SECTION_CARD}>
      <SectionHeader title="Your Stats" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {items.map(({ label, value }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--accent-primary)', letterSpacing: '-0.04em', lineHeight: 1,
            }}>
              {value}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Profile() {
  const { user }  = useAuth()
  const toast     = useToast()
  const { data: apps       = [] } = useApplications()
  const { data: cvVersions = [] } = useCvVersions()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [form, setForm]       = useState(EMPTY_FORM)
  const initialRef            = useRef(null)

  // Load profile on mount
  useEffect(() => {
    api.get('/profile')
      .then(res => {
        const p = res.data ?? {}
        const loaded = {
          full_name:        p.full_name        ?? '',
          headline:         p.headline         ?? '',
          location:         p.location         ?? '',
          summary:          p.summary          ?? '',
          target_role:      p.target_role      ?? '',
          target_seniority: p.target_seniority ?? '',
          years_experience: mapYearsToOption(p.years_experience),
          skills:           Array.isArray(p.skills) ? p.skills : [],
          github_url:       p.github_url       ?? '',
          linkedin_url:     p.linkedin_url     ?? '',
          portfolio_url:    p.portfolio_url    ?? '',
        }
        setForm(loaded)
        initialRef.current = JSON.stringify(loaded)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Track dirty state
  useEffect(() => {
    if (!initialRef.current) return
    setIsDirty(JSON.stringify(form) !== initialRef.current)
  }, [form])

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const yearsRaw = form.years_experience
      await api.put('/profile', {
        full_name:        form.full_name.trim()     || null,
        headline:         form.headline.trim()      || null,
        location:         form.location.trim()      || null,
        summary:          form.summary.trim()       || null,
        target_role:      form.target_role.trim()   || null,
        target_seniority: form.target_seniority     || null,
        years_experience: yearsRaw !== '' ? parseInt(yearsRaw, 10) : null,
        skills:           form.skills,
        github_url:       form.github_url.trim()    || null,
        linkedin_url:     form.linkedin_url.trim()  || null,
        portfolio_url:    form.portfolio_url.trim() || null,
      })
      initialRef.current = JSON.stringify(form)
      setIsDirty(false)
      toast.success('Profile saved')
    } catch (err) {
      toast.error(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const totalApps  = apps.length
  const interviews = apps.filter(a => a.status === 'INTERVIEW').length
  const totalCvs   = cvVersions.length

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div className="anim-spin" style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--border-default)', borderTopColor: 'var(--accent-primary)' }} />
      </div>
    )
  }

  return (
    <div className="profile-page-root">

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Profile
        </h1>
        <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
          Your information is used to personalise CV generation.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <div className="profile-layout">

          {/* ─── Left column ─── */}
          <div className="profile-layout-left">
            <AvatarCard user={user} profile={form} />
            <StatsCard totalApps={totalApps} interviews={interviews} totalCvs={totalCvs} />
            <CreditsSection email={user?.email} />

            {/* Account — read-only email */}
            <div style={SECTION_CARD}>
              <SectionHeader title="Account" />
              <FieldLabel>Email</FieldLabel>
              <input
                type="text"
                value={user?.email ?? ''}
                readOnly
                style={{ ...INPUT_BASE, color: 'var(--text-muted)', cursor: 'default' }}
              />
              <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Managed by your auth provider
              </p>
            </div>
          </div>

          {/* ─── Right column ─── */}
          <div className="profile-layout-right">

            {/* Section 1 — Basic Info */}
            <div style={SECTION_CARD}>
              <SectionHeader title="Basic Info" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <FieldLabel>Full Name</FieldLabel>
                    <TextInput
                      value={form.full_name}
                      onChange={e => setField('full_name', e.target.value)}
                      placeholder="Alex Johnson"
                    />
                  </div>
                  <div>
                    <FieldLabel>Location</FieldLabel>
                    <TextInput
                      value={form.location}
                      onChange={e => setField('location', e.target.value)}
                      placeholder="Tel Aviv, Israel"
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel>Headline</FieldLabel>
                  <TextInput
                    value={form.headline}
                    onChange={e => setField('headline', e.target.value)}
                    placeholder="Backend Developer | Computer Science Student"
                  />
                </div>

                <div>
                  <FieldLabel>Summary</FieldLabel>
                  <TextareaInput
                    value={form.summary}
                    onChange={e => setField('summary', e.target.value)}
                    placeholder="Brief bio used in your CV generation. Describe your background, strengths, and what you're looking for."
                    rows={4}
                  />
                </div>

              </div>
            </div>

            {/* Section 2 — Career Goals */}
            <div style={SECTION_CARD}>
              <SectionHeader title="Career Goals" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <div>
                  <FieldLabel>Target Role</FieldLabel>
                  <TextInput
                    value={form.target_role}
                    onChange={e => setField('target_role', e.target.value)}
                    placeholder="Backend Engineer"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <FieldLabel>Seniority Level</FieldLabel>
                    <SelectInput
                      value={form.target_seniority}
                      onChange={e => setField('target_seniority', e.target.value)}
                      options={SENIORITY_OPTIONS}
                    />
                  </div>
                  <div>
                    <FieldLabel>Years of Experience</FieldLabel>
                    <SelectInput
                      value={form.years_experience}
                      onChange={e => setField('years_experience', e.target.value)}
                      options={EXPERIENCE_OPTIONS}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Section 3 — Skills */}
            <div style={SECTION_CARD}>
              <SectionHeader title="Skills" />
              <FieldLabel>
                Your skills{' '}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({form.skills.length} / 20)
                </span>
              </FieldLabel>
              <SkillsInput skills={form.skills} onChange={val => setField('skills', val)} />
              <p style={{ margin: '7px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                Press Enter or comma to add a skill. These are passed to Claude when generating your CV.
              </p>
            </div>

            {/* Section 4 — Links */}
            <div style={SECTION_CARD}>
              <SectionHeader title="Links" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <div>
                  <FieldLabel>GitHub</FieldLabel>
                  <LinkInput
                    icon={<GitHubIcon />}
                    value={form.github_url}
                    onChange={e => setField('github_url', e.target.value)}
                    placeholder="https://github.com/username"
                  />
                </div>

                <div>
                  <FieldLabel>LinkedIn</FieldLabel>
                  <LinkInput
                    icon={<LinkedInIcon />}
                    value={form.linkedin_url}
                    onChange={e => setField('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div>
                  <FieldLabel>Portfolio / Website</FieldLabel>
                  <LinkInput
                    icon={<GlobeIcon />}
                    value={form.portfolio_url}
                    onChange={e => setField('portfolio_url', e.target.value)}
                    placeholder="https://yoursite.com"
                  />
                </div>

              </div>
            </div>

            {/* Save bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, paddingTop: 4, paddingBottom: 8 }}>
              {isDirty && (
                <span style={{ fontSize: 12, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  Unsaved changes
                </span>
              )}
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '9px 24px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                  background: saving ? 'var(--bg-elevated)' : 'var(--accent-primary)',
                  border: 'none', color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1, transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}
                onMouseEnter={e => { if (!saving) { e.currentTarget.style.filter = 'brightness(1.12)'; e.currentTarget.style.boxShadow = '0 0 20px var(--accent-glow)' } }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {saving ? <><Spinner />Saving…</> : 'Save Changes'}
              </button>
            </div>

          </div>{/* end right col */}
        </div>
      </form>
    </div>
  )
}
