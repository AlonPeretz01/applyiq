import { useState } from 'react'

const TOTAL = 5

// ─── Shared slide heading styles ──────────────────────────────────────────────
const H2 = {
  margin: '0 0 10px',
  fontSize: 22,
  fontWeight: 700,
  color: 'var(--text-primary)',
  letterSpacing: '-0.025em',
  lineHeight: 1.2,
}
const SUB = {
  margin: 0,
  fontSize: 13,
  color: 'var(--text-muted)',
  lineHeight: 1.65,
}
const SECTION_LABEL = {
  fontSize: 10,
  fontWeight: 500,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
  marginBottom: 7,
}
const MOCK_CARD = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 12,
  padding: '18px 20px',
}
const MOCK_INPUT = {
  width: '100%',
  background: 'var(--bg-base)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 7,
  height: 34,
  padding: '0 12px',
  fontSize: 12,
  color: 'var(--text-secondary)',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
}

// ─── Slide 1 — Welcome ────────────────────────────────────────────────────────
function SlideWelcome() {
  return (
    <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
      <div style={{ fontSize: 60, lineHeight: 1, marginBottom: 22 }}>🚀</div>
      <h2 style={{ ...H2, fontSize: 26, marginBottom: 14 }}>Welcome to HireTrack</h2>
      <p style={{ ...SUB, fontSize: 15, maxWidth: 360, marginInline: 'auto' }}>
        Your AI-powered job application tracker. Let&apos;s show you how it works.
      </p>
    </div>
  )
}

// ─── Slide 2 — Add a Job ──────────────────────────────────────────────────────
function SlideAddJob() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <h2 style={H2}>Add jobs you&apos;re interested in</h2>
        <p style={SUB}>Paste a job description from LinkedIn or any job board.</p>
      </div>

      <div style={MOCK_CARD}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <div style={SECTION_LABEL}>Company</div>
            <div style={MOCK_INPUT}>Stripe</div>
          </div>
          <div>
            <div style={SECTION_LABEL}>Role</div>
            <div style={MOCK_INPUT}>Backend Engineer</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={SECTION_LABEL}>Job Description</div>
          <div style={{
            ...MOCK_INPUT,
            height: 68,
            alignItems: 'flex-start',
            paddingTop: 10,
            lineHeight: 1.55,
            borderRadius: 7,
          }}>
            We are looking for a talented Backend Engineer to build and scale our payments infrastructure…
          </div>
        </div>

        {/* Button row with pointing arrow */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#7C6FF7', fontSize: 12, fontWeight: 500 }}>
            click here
            <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
              <path d="M1 6h17M13 1l6 5-6 5" stroke="#7C6FF7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: 'var(--accent-primary)', color: '#fff',
            boxShadow: '0 0 18px rgba(124,111,247,0.4)',
          }}>
            Add Job
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Slide 3 — AI Analysis ────────────────────────────────────────────────────
function SlideAiAnalysis() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <h2 style={H2}>Let AI analyze the job</h2>
        <p style={SUB}>Claude reads the job description and gives you a match score, required skills, and tips.</p>
      </div>

      <div style={MOCK_CARD}>
        {/* Match score banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18,
          padding: '12px 16px',
          background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10,
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(34,197,94,0.1)', border: '2px solid #22C55E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#22C55E' }}>88%</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#22C55E', marginBottom: 2 }}>Strong Match</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Your profile aligns well with this role</div>
          </div>
        </div>

        {/* Required skills */}
        <div style={{ marginBottom: 16 }}>
          <div style={SECTION_LABEL}>Required Skills</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {['Node.js', 'AWS', 'PostgreSQL'].map(skill => (
              <span key={skill} style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                color: 'var(--accent-primary)',
                background: 'rgba(124,111,247,0.12)', border: '1px solid rgba(124,111,247,0.28)',
              }}>
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Match tips */}
        <div>
          <div style={SECTION_LABEL}>Match Tips</div>
          {[
            'Highlight your cloud infrastructure experience with AWS',
            'Mention PostgreSQL query optimisation in your CV',
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: i === 0 ? 6 : 0 }}>
              <span style={{ color: 'var(--accent-primary)', flexShrink: 0, lineHeight: 1.6 }}>•</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Slide 4 — Generate CV ────────────────────────────────────────────────────
function SlideGenerateCv() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <h2 style={H2}>Generate a tailored CV</h2>
        <p style={SUB}>One click creates a professionally formatted PDF, customised for this specific job.</p>
      </div>

      {/* Mock CV — light background mimics real document */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #d8d8e0',
        borderRadius: 10,
        padding: '18px 22px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
      }}>
        {/* CV Header */}
        <div style={{ borderBottom: '2px solid #7C6FF7', paddingBottom: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0e0e1a', letterSpacing: '-0.01em', fontFamily: 'Georgia, serif' }}>
            Alex Johnson
          </div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 3, fontFamily: 'Inter, sans-serif' }}>
            alex@email.com &nbsp;·&nbsp; linkedin.com/in/alexjohnson &nbsp;·&nbsp; github.com/alexj
          </div>
        </div>

        {/* Experience */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#7C6FF7', textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
            Experience
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 1, fontFamily: 'Georgia, serif' }}>
            Senior Backend Engineer — Acme Corp
          </div>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 7, fontFamily: 'Inter, sans-serif' }}>
            Jan 2022 – Present
          </div>
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <span style={{ flexShrink: 0, color: '#555', fontSize: 11 }}>•</span>
            <span style={{ fontSize: 11, color: '#333', lineHeight: 1.55, fontFamily: 'Inter, sans-serif' }}>
              Led migration of core services to AWS Lambda, reducing infrastructure costs by 40% and improving API response times by 3×
            </span>
          </div>
        </div>

        {/* Download button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 6, fontSize: 11, fontWeight: 500,
            background: '#7C6FF7', color: '#fff', fontFamily: 'Inter, sans-serif',
          }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Slide 5 — Track Everything ───────────────────────────────────────────────
const MOCK_ROWS = [
  { company: 'Amazon', role: 'Backend Intern',   statusLabel: 'Applied',   statusColor: '#7C6FF7', statusBg: 'rgba(124,111,247,0.12)', statusBorder: 'rgba(124,111,247,0.3)',  score: 88, scoreColor: '#22C55E' },
  { company: 'Google', role: 'SWE Intern',        statusLabel: 'Interview', statusColor: '#A78BFA', statusBg: 'rgba(167,139,250,0.12)', statusBorder: 'rgba(167,139,250,0.3)',  score: 82, scoreColor: '#22C55E' },
  { company: 'Meta',   role: 'Full Stack',         statusLabel: 'OA',        statusColor: '#F59E0B', statusBg: 'rgba(245,158,11,0.12)',  statusBorder: 'rgba(245,158,11,0.3)',   score: 75, scoreColor: '#F59E0B' },
]

function SlideTrack() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <h2 style={H2}>Track every application</h2>
        <p style={SUB}>Update statuses, see your match scores, and never lose track of where you applied.</p>
      </div>

      <div style={{ ...MOCK_CARD, padding: 0, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 90px 58px',
          padding: '10px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          {['Company', 'Role', 'Status', 'Match'].map(h => (
            <div key={h} style={{ ...SECTION_LABEL, marginBottom: 0 }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {MOCK_ROWS.map((row, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 90px 58px',
            padding: '11px 18px',
            borderBottom: i < MOCK_ROWS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            alignItems: 'center',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{row.company}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.role}</div>
            <div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 9px',
                borderRadius: 20, fontSize: 10, fontWeight: 500,
                color: row.statusColor, background: row.statusBg, border: `1px solid ${row.statusBorder}`,
              }}>
                {row.statusLabel}
              </span>
            </div>
            <div style={{
              fontSize: 12, fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
              color: row.scoreColor,
            }}>
              {row.score}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Slide registry ───────────────────────────────────────────────────────────
const SLIDES = [SlideWelcome, SlideAddJob, SlideAiAnalysis, SlideGenerateCv, SlideTrack]

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function OnboardingModal({ onComplete }) {
  const [slide, setSlide] = useState(0)
  const isLast  = slide === TOTAL - 1
  const isFirst = slide === 0

  function next() {
    if (isLast) onComplete()
    else setSlide(s => s + 1)
  }

  function back() {
    setSlide(s => s - 1)
  }

  const SlideContent = SLIDES[slide]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 580,
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 20,
        padding: '44px 40px 32px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,111,247,0.1)',
      }}>

        {/* Skip button — top right */}
        <button
          onClick={onComplete}
          style={{
            position: 'absolute',
            top: 18,
            right: 20,
            background: 'none',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '5px 12px',
            fontSize: 12,
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          Skip
        </button>

        {/* Slide content — keyed so anim-fade-in fires on every change */}
        <div key={slide} className="anim-fade-in" style={{ minHeight: 320 }}>
          <SlideContent />
        </div>

        {/* Bottom navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 32,
          paddingTop: 22,
          borderTop: '1px solid var(--border-subtle)',
        }}>
          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                style={{
                  width:  i === slide ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  border: i === slide ? 'none' : '1px solid var(--border-default)',
                  background: i === slide ? 'var(--accent-primary)' : 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                }}
              />
            ))}
          </div>

          {/* Back / Next buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!isFirst && (
              <button
                onClick={back}
                style={{
                  padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                  background: 'none', border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
              >
                ← Back
              </button>
            )}

            <button
              onClick={next}
              style={{
                padding: isLast ? '10px 24px' : '9px 20px',
                borderRadius: 9,
                fontSize: isLast ? 14 : 13,
                fontWeight: 600,
                background: 'var(--accent-primary)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                transition: 'filter 0.15s, box-shadow 0.15s',
                boxShadow: isLast ? '0 0 24px rgba(124,111,247,0.4)' : 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.12)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(124,111,247,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = isLast ? '0 0 24px rgba(124,111,247,0.4)' : 'none' }}
            >
              {isLast ? "Let's get started →" : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
