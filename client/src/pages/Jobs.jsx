import { useState, useEffect } from 'react'
import { useJobs, useCreateJob, useDeleteJob } from '../hooks/useJobs.js'
import { useCvVersions } from '../hooks/useCvVersions.js'
import { useApplications, useCreateApplication } from '../hooks/useApplications.js'
import { applicationsApi } from '../api/applications.js'
import { useAiAnalysis, getSavedAnalysis } from '../hooks/useAiAnalysis.js'
import { useToast } from '../context/ToastContext.jsx'
import Modal, { ConfirmModal } from '../components/Modal.jsx'
import CvPreviewModal from '../components/CvPreviewModal.jsx'

const EMPTY_FORM = { company_name: '', title: '', description: '', url: '', source: '' }

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Shared helpers ────────────────────────────────────────────────────────────
const inputStyle = (hasError) => ({
  width: '100%',
  background: 'var(--bg-input)',
  border: `1px solid ${hasError ? 'var(--danger)' : 'var(--border-subtle)'}`,
  borderRadius: 8, height: 38, padding: '0 12px',
  fontSize: 13, color: 'var(--text-primary)', outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
})

function Field({ label, required, hint, error, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.02em' }}>
        {label}
        {required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}
        {hint && <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>({hint})</span>}
      </label>
      {children}
      {error && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--danger)' }}>{error}</p>}
    </div>
  )
}

function BtnPrimary({ children, disabled, type = 'button', onClick }) {
  return (
    <button
      type={type} disabled={disabled} onClick={onClick}
      style={{
        flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
        background: disabled ? 'var(--bg-elevated)' : 'var(--accent-primary)',
        border: 'none', color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1, transition: 'all 0.2s',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.filter = 'brightness(1.12)'; e.currentTarget.style.boxShadow = '0 0 20px var(--accent-glow)' } }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {children}
    </button>
  )
}

function BtnGhost({ children, disabled, type = 'button', onClick }) {
  return (
    <button
      type={type} disabled={disabled} onClick={onClick}
      style={{
        flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
        background: 'transparent', border: '1px solid var(--border-default)',
        color: 'var(--text-secondary)', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.color = 'var(--text-primary)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
    >
      {children}
    </button>
  )
}

function Spinner({ size = 14 }) {
  return (
    <div className="anim-spin" style={{
      width: size, height: size, borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.2)',
      borderTopColor: 'currentColor',
      flexShrink: 0,
    }} />
  )
}

// ─── Pill tags ─────────────────────────────────────────────────────────────────
function Pill({ children, tint = 'muted' }) {
  const styles = {
    purple: { color: 'var(--accent-secondary)', bg: 'var(--accent-glow)',    border: 'rgba(124,111,247,0.25)' },
    blue:   { color: 'var(--info)',             bg: 'var(--info-bg)',         border: 'rgba(96,165,250,0.25)'  },
    yellow: { color: 'var(--warning)',          bg: 'var(--warning-bg)',      border: 'rgba(245,158,11,0.2)'   },
    muted:  { color: 'var(--text-secondary)',   bg: 'var(--bg-elevated)',     border: 'var(--border-subtle)'   },
  }
  const s = styles[tint] ?? styles.muted
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 9px', borderRadius: 20,
      fontSize: 11, fontWeight: 500,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

// ─── Circular score ring (large, for modal) ────────────────────────────────────
function ScoreRingLarge({ score }) {
  if (score == null) return null
  const pct   = Math.max(0, Math.min(100, score))
  const color = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)'
  const r     = 24
  const circ  = 2 * Math.PI * r
  const dash  = (pct / 100) * circ

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="3" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      </svg>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 600,
        color, letterSpacing: '-0.03em', marginTop: -46, marginBottom: 16,
        pointerEvents: 'none',
      }}>
        {pct}%
      </span>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p style={{
      margin: '0 0 8px', fontSize: 11, fontWeight: 500,
      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
    }}>
      {children}
    </p>
  )
}

// ─── Analysis Modal ───────────────────────────────────────────────────────────
function AnalysisModal({ isOpen, onClose, job, result, cvVersions, applications, savedAt, onReanalyze, reanalyzing, onApplyWithCv }) {
  const createApp = useCreateApplication()
  const toast     = useToast()
  const [applyMode, setApplyMode]         = useState(null) // null | 'existing' | 'tailored'
  const [applied, setApplied]             = useState(false)
  const [conflictApp, setConflictApp]     = useState(null) // existing application for this job

  if (!isOpen || !result || !job) return null

  const { analysis, recommendation } = result
  const recCv = recommendation?.recommended_cv_id
    ? cvVersions.find((cv) => cv.id === recommendation.recommended_cv_id)
    : null

  async function applyWithAppId(appId, isNew) {
    if (isNew) {
      await applicationsApi.updateStatus(appId, 'APPLIED', null)
    }
    console.log('[applyExisting] recommendedCv:', recCv)
    console.log('[applyExisting] file_url:', recCv?.file_url)
    if (recCv?.file_url) {
      console.log('[applyExisting] patching application:', appId, 'with original_cv_url:', recCv.file_url)
      try {
        await applicationsApi.update(appId, { original_cv_url: recCv.file_url })
        console.log('[applyExisting] patch successful')
      } catch (updateErr) {
        console.error('[applyExisting] patch failed:', updateErr)
      }
    }
    setApplied(true)
    setConflictApp(null)
    toast.success(isNew ? 'Application created! Check Applications to track it.' : 'Existing application updated!')
  }

  async function handleApplyExisting() {
    if (!recommendation?.recommended_cv_id) return

    // Check for existing application for this job
    const existing = applications?.find(a => a.job_id === job.id)
    if (existing) {
      setConflictApp(existing)
      return
    }

    setApplyMode('existing')
    try {
      console.log('[applyExisting] creating application...')
      const app = await createApp.mutateAsync({
        job_id: job.id,
        cv_version_id: recommendation.recommended_cv_id,
        match_score: recommendation.match_score != null ? Math.round(recommendation.match_score) : null,
        notes: null,
      })
      console.log('[applyExisting] app created:', app)
      await applyWithAppId(app.data.id, true)
    } catch (err) {
      toast.error(err.message || 'Failed to create application')
    } finally {
      setApplyMode(null)
    }
  }

  async function handleUpdateExisting() {
    if (!conflictApp) return
    setApplyMode('existing')
    setConflictApp(null)
    try {
      await applyWithAppId(conflictApp.id, false)
    } catch (err) {
      toast.error(err.message || 'Failed to update application')
    } finally {
      setApplyMode(null)
    }
  }

  async function handleCreateNew() {
    if (!recommendation?.recommended_cv_id) return
    setConflictApp(null)
    setApplyMode('existing')
    try {
      console.log('[applyExisting] creating new application (conflict override)...')
      const app = await createApp.mutateAsync({
        job_id: job.id,
        cv_version_id: recommendation.recommended_cv_id,
        match_score: recommendation.match_score != null ? Math.round(recommendation.match_score) : null,
        notes: null,
      })
      console.log('[applyExisting] app created:', app)
      await applyWithAppId(app.data.id, true)
    } catch (err) {
      toast.error(err.message || 'Failed to create application')
    } finally {
      setApplyMode(null)
    }
  }

  async function handleGenerateTailored() {
    if (!recommendation?.recommended_cv_id) return
    setApplyMode('tailored')
    try {
      const app = await createApp.mutateAsync({
        job_id: job.id,
        cv_version_id: recommendation.recommended_cv_id,
        match_score: recommendation.match_score != null ? Math.round(recommendation.match_score) : null,
        notes: null,
      })
      onApplyWithCv({ cvVersionId: recommendation.recommended_cv_id, appId: app.data.id })
    } catch (err) {
      toast.error(err.message || 'Failed to create application')
      setApplyMode(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`AI Analysis — ${job.company_name}`} maxWidth={600}>
      {/* Scrollable analysis content */}
      <div style={{ maxHeight: '52vh', overflowY: 'auto', marginRight: -8, paddingRight: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* CVs being analyzed */}
        {cvVersions.length > 0 && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
          }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              CVs being analyzed
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {cvVersions.map(cv => (
                <span key={cv.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 8px', borderRadius: 20,
                  fontSize: 11, fontWeight: 500,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                }}>
                  {cv.name}
                  <span style={{
                    fontSize: 10, padding: '1px 5px', borderRadius: 10,
                    background: 'rgba(124,111,247,0.12)',
                    color: 'var(--accent-secondary)',
                    border: '1px solid rgba(124,111,247,0.2)',
                  }}>
                    {cv.target_type}
                  </span>
                </span>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Claude will compare all your CV versions and recommend the best one for this role.
            </p>
          </div>
        )}

        {/* Saved analysis banner */}
        {savedAt && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 8,
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Last analyzed: {new Date(savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={onReanalyze}
              disabled={reanalyzing}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6,
                background: 'transparent', border: '1px solid var(--border-default)',
                fontSize: 11, fontWeight: 500, color: 'var(--accent-secondary)',
                cursor: reanalyzing ? 'not-allowed' : 'pointer',
                opacity: reanalyzing ? 0.6 : 1, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!reanalyzing) { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.background = 'var(--accent-glow)' } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'transparent' }}
            >
              {reanalyzing ? (
                <><Spinner size={11} /> Re-analyzing…</>
              ) : (
                <>
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Re-analyze
                </>
              )}
            </button>
          </div>
        )}

        {/* Summary */}
        {analysis?.summary && (
          <div style={{ padding: '12px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{analysis.summary}</p>
          </div>
        )}

        {/* Badges row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {analysis?.job_type   && analysis.job_type   !== 'unknown' && <Pill tint="blue">{analysis.job_type}</Pill>}
          {analysis?.seniority  && analysis.seniority  !== 'unknown' && <Pill tint="purple">{analysis.seniority}</Pill>}
          {analysis?.experience_years != null && <Pill tint="muted">{analysis.experience_years}+ yrs exp</Pill>}
        </div>

        {/* Required Skills */}
        {analysis?.required_skills?.length > 0 && (
          <div>
            <SectionLabel>Required Skills</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {analysis.required_skills.map((s) => <Pill key={s} tint="purple">{s}</Pill>)}
            </div>
          </div>
        )}

        {/* Technologies */}
        {analysis?.technologies?.length > 0 && (
          <div>
            <SectionLabel>Technologies</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {analysis.technologies.map((t) => <Pill key={t} tint="blue">{t}</Pill>)}
            </div>
          </div>
        )}

        {/* Keywords */}
        {analysis?.keywords?.length > 0 && (
          <div>
            <SectionLabel>ATS Keywords</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {analysis.keywords.map((k) => <Pill key={k} tint="yellow">{k}</Pill>)}
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

        {/* CV Recommendation */}
        {recommendation?.recommended_cv_id ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SectionLabel>CV Recommendation</SectionLabel>

            {/* Recommendation card */}
            <div style={{
              padding: '16px 18px',
              background: 'rgba(34,197,94,0.05)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderLeft: '3px solid var(--success)',
              borderRadius: 10,
              display: 'flex', alignItems: 'flex-start', gap: 16,
            }}>
              {/* Score ring */}
              {recommendation.match_score != null && (
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <ScoreRingLarge score={recommendation.match_score} />
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                {recCv && (
                  <>
                    <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Recommended
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: 'rgba(34,197,94,0.1)',
                        border: '1px solid rgba(34,197,94,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} style={{ color: 'var(--success)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>
                          {recCv.name}
                          <span style={{
                            marginLeft: 7, fontSize: 10, fontWeight: 500, padding: '2px 7px',
                            borderRadius: 10, background: 'rgba(34,197,94,0.12)',
                            border: '1px solid rgba(34,197,94,0.25)', color: 'var(--success)',
                            verticalAlign: 'middle',
                          }}>
                            {recCv.target_type}
                          </span>
                        </p>
                        {cvVersions.length > 1 && (
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                            vs {cvVersions.length - 1} other CV version{cvVersions.length - 1 !== 1 ? 's' : ''} analyzed
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {recommendation.reason && (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {recommendation.reason}
                  </p>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div style={{
            padding: '20px', borderRadius: 10, textAlign: 'center',
            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--text-secondary)' }}>Add CV versions to get personalized recommendations</p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Go to CV Versions and paste your CV text</p>
          </div>
        )}

        {/* How to improve your chances — merged match_tips + suggested_tweaks, deduped */}
        {(() => {
          const tips = [...(analysis?.match_tips ?? []), ...(recommendation?.suggested_tweaks ?? [])]
          const unique = tips.filter((tip, i, arr) =>
            arr.findIndex(t => t.toLowerCase() === tip.toLowerCase()) === i
          )
          if (!unique.length) return null
          return (
            <div>
              <SectionLabel>How to improve your chances</SectionLabel>
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {unique.map((tip, i) => (
                  <li key={i} style={{
                    display: 'flex', gap: 10, padding: '8px 12px',
                    background: 'var(--bg-input)', borderRadius: 6,
                    borderLeft: '2px solid var(--accent-primary)',
                  }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--accent-primary)', flexShrink: 0, marginTop: 1 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</span>
                  </li>
                ))}
              </ol>
            </div>
          )
        })()}
      </div>

      {/* ── Conflict dialog — existing application found ── */}
      {conflictApp && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
          <div style={{
            border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: 12, overflow: 'hidden',
            background: 'rgba(245,158,11,0.04)',
          }}>
            <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--warning)' }}>
                Application already exists
              </p>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                You already have an application for this job (status: <strong style={{ color: 'var(--text-primary)' }}>{conflictApp.status}</strong>).
                Do you want to update it or create a separate one?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleUpdateExisting}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
                >
                  Update existing
                </button>
                <button
                  onClick={handleCreateNew}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: 'transparent', border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                >
                  Create new
                </button>
                <button
                  onClick={() => setConflictApp(null)}
                  style={{
                    padding: '8px 12px', borderRadius: 8, fontSize: 12,
                    background: 'transparent', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Ready to apply? choice panel — outside scroll so always visible ── */}
      {recommendation?.recommended_cv_id && !conflictApp && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
          {!applied ? (
            <div style={{ border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Ready to apply?</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Option 1 — existing CV */}
                <button
                  onClick={handleApplyExisting}
                  disabled={!!applyMode}
                  style={{
                    width: '100%', textAlign: 'left', padding: '14px 16px',
                    background: 'transparent', border: 'none',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: applyMode ? 'not-allowed' : 'pointer',
                    opacity: applyMode && applyMode !== 'existing' ? 0.45 : 1,
                    transition: 'background 0.15s',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}
                  onMouseEnter={e => { if (!applyMode) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}>
                    {applyMode === 'existing' ? <Spinner size={14} /> : (
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#60A5FA" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {applyMode === 'existing' ? 'Creating application…' : 'Apply with existing CV'}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Use your current CV as-is</p>
                  </div>
                </button>

                {/* Option 2 — generate tailored */}
                <button
                  onClick={handleGenerateTailored}
                  disabled={!!applyMode}
                  style={{
                    width: '100%', textAlign: 'left', padding: '14px 16px',
                    background: 'transparent', border: 'none',
                    cursor: applyMode ? 'not-allowed' : 'pointer',
                    opacity: applyMode && applyMode !== 'tailored' ? 0.45 : 1,
                    transition: 'background 0.15s',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}
                  onMouseEnter={e => { if (!applyMode) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-glow)', border: '1px solid rgba(124,111,247,0.3)' }}>
                    {applyMode === 'tailored' ? <Spinner size={14} /> : (
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--accent-primary)" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {applyMode === 'tailored' ? 'Creating application…' : 'Generate tailored CV'}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Let AI customize it for this job</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--success)', fontSize: 13, padding: '4px 0' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Application created! Check Applications to track it.
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

// ─── Table icon button ─────────────────────────────────────────────────────────
function TableIconBtn({ onClick, title, disabled, accentColor, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        width: 30, height: 30, borderRadius: 8,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
        color: disabled ? accentColor : 'var(--text-muted)',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s', flexShrink: 0,
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.color = accentColor; e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.background = `${accentColor}18` } }}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-elevated)' } }}
    >
      {children}
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Jobs() {
  const { data: jobs = [], isLoading } = useJobs()
  const { data: cvVersions = [] }      = useCvVersions()
  const { data: applications = [] }    = useApplications()
  const createJob   = useCreateJob()
  const deleteJob   = useDeleteJob()
  const aiAnalysis  = useAiAnalysis()
  const toast       = useToast()

  const [addModalOpen, setAddModalOpen]     = useState(false)
  const [form, setForm]                     = useState(EMPTY_FORM)
  const [errors, setErrors]                 = useState({})

  const [analysisModalOpen, setAnalysisModalOpen] = useState(false)
  const [analysisJob, setAnalysisJob]             = useState(null)
  const [analysisResult, setAnalysisResult]       = useState(null)
  const [analysisSavedAt, setAnalysisSavedAt]     = useState(null)
  const [analyzingId, setAnalyzingId]             = useState(null)
  const [reanalyzingId, setReanalyzingId]         = useState(null)

  // Map of jobId → saved AiAnalysis row (or null).
  const [savedAnalysesMap, setSavedAnalysesMap] = useState({})

  const [confirmState, setConfirm] = useState({ open: false, target: null })

  // CV Preview Modal state
  const [cvPreviewOpen, setCvPreviewOpen]               = useState(false)
  const [cvPreviewCvVersionId, setCvPreviewCvVersionId] = useState(null)
  const [cvPreviewAppId, setCvPreviewAppId]             = useState(null)

  // On page load, fetch saved analyses for all jobs (cheap DB calls, no AI).
  useEffect(() => {
    console.log('[useEffect] jobs length:', jobs?.length)
    if (!jobs || jobs.length === 0) return
    jobs.forEach(async (job) => {
      try {
        const saved = await getSavedAnalysis(job.id)
        console.log(`[savedAnalysesMap] job=${job.id} (${job.company_name}) → saved value:`, saved)
        console.log(`[savedAnalysesMap] hasSaved will be:`, !!saved)
        setSavedAnalysesMap((prev) => ({ ...prev, [job.id]: saved }))
      } catch (err) {
        console.warn(`[savedAnalysesMap] job=${job.id} fetch failed:`, err.message)
        setSavedAnalysesMap((prev) => ({ ...prev, [job.id]: null }))
      }
    })
  }, [jobs])

  function openAdd() { setForm(EMPTY_FORM); setErrors({}); setAddModalOpen(true) }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((err) => ({ ...err, [name]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.company_name.trim()) errs.company_name = 'Company name is required'
    if (!form.title.trim())        errs.title        = 'Job title is required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      await createJob.mutateAsync({
        company_name: form.company_name.trim(),
        title:        form.title.trim(),
        description:  form.description || null,
        url:          form.url  || null,
        source:       form.source || null,
      })
      setAddModalOpen(false)
    } catch (err) {
      setErrors({ submit: err.response?.data?.error ?? err.message })
    }
  }

  function handleApplyWithCv({ cvVersionId, appId }) {
    setAnalysisModalOpen(false)
    setCvPreviewCvVersionId(cvVersionId)
    setCvPreviewAppId(appId ?? null)
    setCvPreviewOpen(true)
  }

  function askDelete(job) { setConfirm({ open: true, target: job }) }
  function doDelete()     { if (confirmState.target) deleteJob.mutate(confirmState.target.id) }

  // Opens modal instantly with cached data — no AI call.
  function handleViewSaved(job) {
    const saved = savedAnalysesMap[job.id]
    if (!saved) return
    setAnalysisJob(job)
    setAnalysisSavedAt(saved.created_at)
    setAnalysisResult({
      analysis: {
        required_skills:  saved.required_skills,
        technologies:     saved.technologies,
        experience_years: saved.experience_years,
        job_type:         saved.job_type,
        seniority:        saved.seniority,
        keywords:         saved.keywords,
        summary:          saved.summary,
        match_tips:       saved.match_tips,
      },
      recommendation: {
        recommended_cv_id: saved.recommended_cv_id,
        match_score:       saved.match_score,
        reason:            saved.reason,
        suggested_tweaks:  saved.suggested_tweaks,
      },
    })
    setAnalysisModalOpen(true)
  }

  // Runs a fresh AI call — used when no saved analysis exists.
  async function handleAnalyze(job) {
    if (!cvVersions || cvVersions.length === 0) {
      toast.error('Please add a CV version first before analyzing a job. Go to CV Versions to add one.')
      return
    }
    setAnalyzingId(job.id)
    try {
      const data = await aiAnalysis.mutateAsync(job.id)
      // Refetch the saved row to update the map with the freshly stored result.
      const saved = await getSavedAnalysis(job.id)
      console.log('[handleAnalyze] getSavedAnalysis returned:', saved)
      console.log('[handleAnalyze] hasSaved will be:', !!saved)
      setSavedAnalysesMap((prev) => ({ ...prev, [job.id]: saved }))
      setAnalysisJob(job)
      setAnalysisSavedAt(saved?.created_at ?? null)
      setAnalysisResult(data)
      setAnalysisModalOpen(true)
    } catch (err) {
      toast.error(err.message || 'AI analysis failed. Check the job description.')
    } finally {
      setAnalyzingId(null)
    }
  }

  // Forces a new AI call — from table row or modal.
  async function handleReanalyze(job) {
    const targetJob = job ?? analysisJob
    if (!targetJob) return
    setReanalyzingId(targetJob.id)
    try {
      const data = await aiAnalysis.mutateAsync(targetJob.id)
      const saved = await getSavedAnalysis(targetJob.id)
      console.log('[handleReanalyze] getSavedAnalysis returned:', saved)
      setSavedAnalysesMap((prev) => ({ ...prev, [targetJob.id]: saved }))
      setAnalysisSavedAt(saved?.created_at ?? null)
      setAnalysisResult(data)
    } catch (err) {
      toast.error(err.message || 'Re-analysis failed.')
    } finally {
      setReanalyzingId(null)
    }
  }

  return (
    <div className="page-wrapper">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Jobs
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Manage the job listings you're tracking
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: 'var(--accent-primary)', border: 'none', color: '#fff',
            cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.boxShadow = '0 0 20px var(--accent-glow)' }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Job
        </button>
      </div>

      {/* ── Mobile card list ── */}
      <div className="jobs-card-list">
        {isLoading ? (
          <LoadingState />
        ) : jobs.length === 0 ? (
          <EmptyState onAdd={openAdd} />
        ) : jobs.map((job) => {
          const hasSaved    = !!savedAnalysesMap[job.id]
          const isAnalyzing = analyzingId === job.id
          const isReanalyzing = reanalyzingId === job.id
          return (
            <div key={job.id} style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 10, padding: '14px 16px',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                {job.company_name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                {job.title}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {hasSaved ? (
                  <>
                    <button
                      onClick={() => handleViewSaved(job)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '7px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)', cursor: 'pointer',
                      }}
                    >
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      View Analysis
                    </button>
                    <button
                      onClick={() => handleReanalyze(job)}
                      disabled={isReanalyzing}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '7px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)', cursor: isReanalyzing ? 'default' : 'pointer',
                        opacity: isReanalyzing ? 0.6 : 1,
                      }}
                    >
                      {isReanalyzing ? <Spinner size={12} /> : (
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                      )}
                      Re-analyze
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleAnalyze(job)}
                    disabled={isAnalyzing}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '7px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                      background: isAnalyzing ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                      border: `1px solid ${isAnalyzing ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      color: isAnalyzing ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                      cursor: isAnalyzing ? 'default' : 'pointer',
                    }}
                  >
                    {isAnalyzing ? <><Spinner size={12} /> Analyzing…</> : (
                      <>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        Analyze
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => askDelete(job)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)', cursor: 'pointer',
                  }}
                >
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Desktop table ── */}
      <div className="jobs-table-wrap" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
        {isLoading ? (
          <LoadingState />
        ) : jobs.length === 0 ? (
          <EmptyState onAdd={openAdd} />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {[
                  { label: 'Company', w: '22%' },
                  { label: 'Role',    w: '28%' },
                  { label: 'Source',  w: '14%', hideMobile: true },
                  { label: 'Added',   w: '14%', hideMobile: true },
                  { label: 'Actions', w: '22%', right: true },
                ].map(({ label, w, right, hideMobile }) => (
                  <th key={label} className={hideMobile ? 'col-hide-mobile' : undefined} style={{
                    width: w,
                    textAlign: right ? 'right' : 'left',
                    padding: '10px 16px',
                    fontSize: 11, fontWeight: 500,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, idx) => {
                const hasSaved      = !!savedAnalysesMap[job.id]
                const isAnalyzing   = analyzingId   === job.id
                const isReanalyzing = reanalyzingId === job.id
                return (
                  <tr
                    key={job.id}
                    style={{
                      borderBottom: idx < jobs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {job.company_name}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {job.title}
                    </td>
                    <td className="col-hide-mobile" style={{ padding: '13px 16px' }}>
                      {job.source ? (
                        <span style={{
                          fontSize: 11, color: 'var(--text-secondary)',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 20, padding: '3px 8px',
                        }}>
                          {job.source}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="col-hide-mobile" style={{ padding: '13px 16px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>
                      {formatDate(job.created_at)}
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>

                        {hasSaved ? (
                          <>
                            {/* View Analysis */}
                            <button
                              onClick={() => handleViewSaved(job)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '5px 10px', borderRadius: 7,
                                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                                fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
                                cursor: 'pointer', transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-secondary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--accent-glow)' }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
                            >
                              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              View Analysis
                            </button>

                            {/* Re-analyze */}
                            <TableIconBtn
                              onClick={() => handleReanalyze(job)}
                              disabled={isReanalyzing}
                              title="Run a fresh AI analysis (uses API credits)"
                              accentColor="var(--warning)"
                            >
                              {isReanalyzing ? (
                                <Spinner size={12} />
                              ) : (
                                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                              )}
                            </TableIconBtn>
                          </>
                        ) : (
                          /* Analyze */
                          <button
                            onClick={() => handleAnalyze(job)}
                            disabled={isAnalyzing}
                            title={cvVersions.length === 0 ? 'Add a CV version first' : 'Run AI analysis'}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '5px 10px', borderRadius: 7,
                              background: isAnalyzing ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                              border: `1px solid ${isAnalyzing ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                              fontSize: 12, fontWeight: 500,
                              color: isAnalyzing ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                              cursor: isAnalyzing ? 'default' : 'pointer',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { if (!isAnalyzing) { e.currentTarget.style.color = 'var(--accent-secondary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--accent-glow)' } }}
                            onMouseLeave={e => { if (!isAnalyzing) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-elevated)' } }}
                          >
                            {isAnalyzing ? (
                              <><Spinner size={12} /> Analyzing…</>
                            ) : (
                              <>
                                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                                Analyze
                              </>
                            )}
                          </button>
                        )}

                        {/* Delete */}
                        <TableIconBtn
                          onClick={() => askDelete(job)}
                          title="Delete job"
                          accentColor="var(--danger)"
                        >
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </TableIconBtn>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Job Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Job">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {errors.submit && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 12, color: 'var(--danger)' }}>
              {errors.submit}
            </div>
          )}

          <Field label="Company Name" required error={errors.company_name}>
            <input
              name="company_name" value={form.company_name} onChange={handleChange}
              placeholder="e.g. Google"
              style={inputStyle(!!errors.company_name)}
              onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
              onBlur={e => { e.target.style.borderColor = errors.company_name ? 'var(--danger)' : 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
            />
          </Field>

          <Field label="Job Title" required error={errors.title}>
            <input
              name="title" value={form.title} onChange={handleChange}
              placeholder="e.g. Software Engineer"
              style={inputStyle(!!errors.title)}
              onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
              onBlur={e => { e.target.style.borderColor = errors.title ? 'var(--danger)' : 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
            />
          </Field>

          <Field label="Description" hint="paste job posting for AI analysis">
            <textarea
              name="description" value={form.description} onChange={handleChange}
              placeholder="Paste the job description here for AI analysis…"
              rows={4}
              style={{
                width: '100%', background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)', borderRadius: 8,
                padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)',
                outline: 'none', resize: 'vertical', minHeight: 90,
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Job URL">
              <input
                name="url" value={form.url} onChange={handleChange}
                placeholder="https://…"
                style={inputStyle(false)}
                onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
              />
            </Field>
            <Field label="Source">
              <input
                name="source" value={form.source} onChange={handleChange}
                placeholder="e.g. LinkedIn"
                style={inputStyle(false)}
                onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
              />
            </Field>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <BtnGhost onClick={() => setAddModalOpen(false)} type="button">Cancel</BtnGhost>
            <BtnPrimary type="submit" disabled={createJob.isPending}>
              {createJob.isPending ? 'Saving…' : 'Add Job'}
            </BtnPrimary>
          </div>
        </form>
      </Modal>

      {/* Analysis Modal */}
      <AnalysisModal
        key={analysisJob?.id}
        isOpen={analysisModalOpen}
        onClose={() => setAnalysisModalOpen(false)}
        job={analysisJob}
        result={analysisResult}
        cvVersions={cvVersions}
        applications={applications}
        savedAt={analysisSavedAt}
        onReanalyze={() => handleReanalyze(analysisJob)}
        reanalyzing={reanalyzingId === analysisJob?.id}
        onApplyWithCv={handleApplyWithCv}
      />

      {/* CV Preview Modal */}
      <CvPreviewModal
        isOpen={cvPreviewOpen}
        onClose={() => setCvPreviewOpen(false)}
        jobId={analysisJob?.id}
        cvVersionId={cvPreviewCvVersionId}
        jobTitle={analysisJob?.title}
        companyName={analysisJob?.company_name}
        applicationId={cvPreviewAppId}
        jobUrl={analysisJob?.url}
      />

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={confirmState.open}
        onClose={() => setConfirm({ open: false, target: null })}
        onConfirm={doDelete}
        title="Delete Job?"
        message={confirmState.target ? `"${confirmState.target.company_name} — ${confirmState.target.title}" and all related applications will be permanently deleted.` : ''}
      />
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ padding: '60px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <div className="anim-spin" style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--border-default)', borderTopColor: 'var(--accent-primary)' }} />
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</span>
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>No jobs added yet</p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Click "Add Job" to start tracking job listings</p>
      </div>
      <button
        onClick={onAdd}
        style={{ fontSize: 13, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-secondary)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--accent-primary)' }}
      >
        + Add your first job
      </button>
    </div>
  )
}
