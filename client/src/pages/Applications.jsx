import { useState, useRef, useEffect } from 'react'
import {
  useApplications,
  useCreateApplication,
  useUpdateApplicationStatus,
  useDeleteApplication,
} from '../hooks/useApplications.js'
import { useJobs } from '../hooks/useJobs.js'
import { useCvVersions } from '../hooks/useCvVersions.js'
import Modal, { ConfirmModal } from '../components/Modal.jsx'
import StatusBadge, { ALL_STATUSES, STATUS_META } from '../components/StatusBadge.jsx'

const TODAY = new Date().toISOString().split('T')[0]
const EMPTY_FORM = { job_id: '', cv_version_id: '', status: 'DRAFT', match_score: '', notes: '', applied_at: TODAY }

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Shared style helpers ─────────────────────────────────────────────────────
const inputStyle = (hasError) => ({
  width: '100%',
  background: 'var(--bg-input)',
  border: `1px solid ${hasError ? 'var(--danger)' : 'var(--border-subtle)'}`,
  borderRadius: 8,
  height: 38,
  padding: '0 12px',
  fontSize: 13,
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
})

// ─── Circular score ring ──────────────────────────────────────────────────────
function ScoreRing({ score }) {
  if (score == null) return <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>—</span>
  const pct   = Math.max(0, Math.min(100, score))
  const color = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)'
  const r     = 11
  const circ  = 2 * Math.PI * r
  const dash  = (pct / 100) * circ

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx="14" cy="14" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="2" />
        <circle cx="14" cy="14" r={r} fill="none" stroke={color} strokeWidth="2"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      </svg>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color, letterSpacing: '-0.02em' }}>
        {pct}%
      </span>
    </div>
  )
}

// ─── Status dropdown ──────────────────────────────────────────────────────────
// Uses position:fixed so it's never clipped by table overflow.
const DROPDOWN_HEIGHT = 300 // approximate max height for all status items

function StatusDropdown({ appId, current, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, openUp: false, bottomVal: 0 })
  const btnRef = useRef(null)
  const dropRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (!btnRef.current?.contains(e.target) && !dropRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }
    function handleScroll() { setOpen(false) }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [open])

  function handleToggle() {
    if (open) { setOpen(false); return }
    const rect = btnRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < DROPDOWN_HEIGHT
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
      openUp,
      bottomVal: window.innerHeight - rect.top + 4,
    })
    setOpen(true)
  }

  function pick(status) { if (status !== current) onUpdate(appId, status); setOpen(false) }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', transition: 'opacity 0.15s' }}
        title="Click to change status"
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.75' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
      >
        <StatusBadge status={current} />
      </button>

      {open && (
        <div
          ref={dropRef}
          style={{
            position: 'fixed',
            top: pos.openUp ? 'auto' : pos.top,
            bottom: pos.openUp ? pos.bottomVal : 'auto',
            left: pos.left,
            zIndex: 9999,
            minWidth: 140,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            padding: '4px',
          }}
        >
          {ALL_STATUSES.map(s => {
            const meta = STATUS_META[s]
            const isActive = s === current
            return (
              <button
                key={s}
                onClick={() => pick(s)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '7px 10px', borderRadius: 6, border: 'none',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12, cursor: 'pointer',
                  background: isActive ? 'var(--border-subtle)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'background 0.1s, color 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta?.color ?? 'var(--text-muted)', flexShrink: 0 }} />
                {meta?.label ?? s}
                {isActive && (
                  <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 10 }}>✓</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Applications() {
  const { data: apps = [], isLoading } = useApplications()
  const { data: jobs = [] }            = useJobs()
  const { data: cvVersions = [] }      = useCvVersions()
  const createApp    = useCreateApplication()
  const updateStatus = useUpdateApplicationStatus()
  const deleteApp    = useDeleteApplication()

  const [modalOpen, setModalOpen]  = useState(false)
  const [form, setForm]            = useState(EMPTY_FORM)
  const [errors, setErrors]        = useState({})
  const [confirmState, setConfirm] = useState({ open: false, target: null })

  function openModal() { setForm(EMPTY_FORM); setErrors({}); setModalOpen(true) }
  function closeModal() { setModalOpen(false) }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(err => ({ ...err, [name]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.job_id) errs.job_id = 'Please select a job'
    if (!form.cv_version_id) errs.cv_version_id = 'Please select a CV version'
    if (form.match_score !== '' && (isNaN(Number(form.match_score)) || Number(form.match_score) < 0 || Number(form.match_score) > 100)) {
      errs.match_score = 'Must be between 0 and 100'
    }
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      const selectedCv = cvVersions.find(cv => cv.id === form.cv_version_id)
      const payload = {
        job_id: form.job_id,
        cv_version_id: form.cv_version_id,
        status: form.status || 'DRAFT',
        match_score: form.match_score !== '' ? Number(form.match_score) : null,
        notes: form.notes || null,
        original_cv_url: selectedCv?.file_url || null,
        applied_at: form.applied_at ? new Date(form.applied_at).toISOString() : new Date().toISOString(),
      }
      console.log('[New Application] submitting:', payload)
      await createApp.mutateAsync(payload)
      closeModal()
    } catch (err) {
      setErrors({ submit: err.message })
    }
  }

  function handleStatusChange(id, status) { updateStatus.mutate({ id, status, note: null }) }

  function askDelete(app) { setConfirm({ open: true, target: app }) }
  function doDelete()     { if (confirmState.target) deleteApp.mutate(confirmState.target.id) }

  const TH = ({ children, right, className }) => (
    <th className={className} style={{
      textAlign: right ? 'right' : 'left',
      padding: '10px 16px',
      fontSize: 11, fontWeight: 500,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  )

  return (
    <div className="page-wrapper">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Applications
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Track every step of your job search
          </p>
        </div>
        <button
          onClick={openModal}
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
          New Application
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
        {isLoading ? (
          <LoadingState />
        ) : apps.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="apps-table">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <TH>Company / Role</TH>
                  <TH className="col-hide-mobile">CV Version</TH>
                  <TH className="col-hide-mobile">Date Applied</TH>
                  <TH>Status</TH>
                  <TH>Match</TH>
                  <TH className="col-hide-mobile">Notes</TH>
                  <TH right>Actions</TH>
                </tr>
              </thead>
              <tbody>
                {apps.map((app, idx) => (
                  <tr
                    key={app.id}
                    style={{
                      borderBottom: idx < apps.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Company + Role stacked */}
                    <td style={{ padding: '12px 16px', maxWidth: 220 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {app.job?.company_name ?? '—'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                        {app.job?.title ?? '—'}
                      </div>
                    </td>

                    {/* CV Version */}
                    <td className="col-hide-mobile" style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 12, color: 'var(--text-secondary)',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 6, padding: '3px 8px',
                        }}>
                          {app.cv_version?.name ?? '—'}
                          {app.cv_version?.target_type && (
                            <span style={{ marginLeft: 6, color: 'var(--text-muted)', fontSize: 10 }}>
                              {app.cv_version.target_type}
                            </span>
                          )}
                        </span>
                        {(app.original_cv_url || app.generated_cv_url) && (
                          <span style={{
                            fontSize: 10, fontWeight: 500,
                            color: 'var(--success)',
                            background: 'rgba(34,197,94,0.08)',
                            border: '1px solid rgba(34,197,94,0.25)',
                            borderRadius: 10, padding: '2px 7px',
                          }}>
                            CV Ready
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="col-hide-mobile" style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(app.applied_at)}
                    </td>

                    {/* Status dropdown */}
                    <td style={{ padding: '12px 16px' }}>
                      <StatusDropdown appId={app.id} current={app.status} onUpdate={handleStatusChange} />
                    </td>

                    {/* Match score */}
                    <td style={{ padding: '12px 16px' }}>
                      <ScoreRing score={app.match_score} />
                    </td>

                    {/* Notes */}
                    <td className="col-hide-mobile" style={{ padding: '12px 16px', maxWidth: 180 }}>
                      <span
                        title={app.notes || ''}
                        style={{
                          fontSize: 12, color: 'var(--text-muted)',
                          display: 'block', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {app.notes || '—'}
                      </span>
                    </td>

                    {/* Actions: download CV(s) + delete */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        {app.original_cv_url && (
                          <button
                            onClick={() => window.open(app.original_cv_url, '_blank')}
                            title="Download original CV"
                            style={{
                              width: 30, height: 30, borderRadius: 8,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.color = 'var(--info)'
                              e.currentTarget.style.borderColor = 'rgba(96,165,250,0.5)'
                              e.currentTarget.style.background = 'rgba(96,165,250,0.08)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.color = 'var(--text-muted)'
                              e.currentTarget.style.borderColor = 'var(--border-subtle)'
                              e.currentTarget.style.background = 'var(--bg-elevated)'
                            }}
                          >
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                          </button>
                        )}
                        {app.generated_cv_url && (
                          <button
                            onClick={() => window.open(app.generated_cv_url, '_blank')}
                            title="Download AI-tailored CV"
                            style={{
                              width: 30, height: 30, borderRadius: 8,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.color = 'var(--accent-primary)'
                              e.currentTarget.style.borderColor = 'rgba(124,111,247,0.5)'
                              e.currentTarget.style.background = 'rgba(124,111,247,0.08)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.color = 'var(--text-muted)'
                              e.currentTarget.style.borderColor = 'var(--border-subtle)'
                              e.currentTarget.style.background = 'var(--bg-elevated)'
                            }}
                          >
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                          </button>
                        )}
                      <button
                        onClick={() => askDelete(app)}
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = 'var(--danger)'
                          e.currentTarget.style.borderColor = 'var(--danger)'
                          e.currentTarget.style.background = 'var(--danger-bg)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = 'var(--text-muted)'
                          e.currentTarget.style.borderColor = 'var(--border-subtle)'
                          e.currentTarget.style.background = 'var(--bg-elevated)'
                        }}
                        title="Delete"
                      >
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Application Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="New Application">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {errors.submit && (
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 12, color: 'var(--danger)' }}>
              {errors.submit}
            </div>
          )}

          <FormField label="Job" required error={errors.job_id}>
            <select name="job_id" value={form.job_id} onChange={handleChange}
              style={{ ...inputStyle(!!errors.job_id), color: form.job_id ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer' }}
              onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
              onBlur={e => { e.target.style.borderColor = errors.job_id ? 'var(--danger)' : 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
            >
              <option value="">Select a job…</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.company_name} — {j.title}</option>)}
            </select>
            {jobs.length === 0 && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>No jobs yet — add one in the Jobs page first.</p>}
          </FormField>

          <FormField label="CV Version" required error={errors.cv_version_id}>
            <select name="cv_version_id" value={form.cv_version_id} onChange={handleChange}
              style={{ ...inputStyle(!!errors.cv_version_id), color: form.cv_version_id ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer' }}
              onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
              onBlur={e => { e.target.style.borderColor = errors.cv_version_id ? 'var(--danger)' : 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
            >
              <option value="">Select a CV version…</option>
              {cvVersions.map(cv => <option key={cv.id} value={cv.id}>{cv.name} ({cv.target_type})</option>)}
            </select>
            {cvVersions.length === 0 && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>No CV versions yet — add one in CV Versions first.</p>}
          </FormField>

          <FormField label="Status">
            <select name="status" value={form.status} onChange={handleChange}
              style={{ ...inputStyle(false), color: 'var(--text-primary)', cursor: 'pointer' }}
              onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
            >
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_META[s]?.label ?? s}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Date Applied" hint="optional">
            <input name="applied_at" type="date" value={form.applied_at} onChange={handleChange}
              style={inputStyle(false)}
              onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
            />
          </FormField>

          <FormField label="Match Score" hint="0–100, optional" error={errors.match_score}>
            <input name="match_score" type="number" min="0" max="100"
              value={form.match_score} onChange={handleChange} placeholder="e.g. 82"
              style={inputStyle(!!errors.match_score)}
              onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
              onBlur={e => { e.target.style.borderColor = errors.match_score ? 'var(--danger)' : 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
            />
          </FormField>

          <FormField label="Notes">
            <textarea name="notes" value={form.notes} onChange={handleChange}
              placeholder="Any notes about this application…" rows={3}
              style={{
                width: '100%', background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)', borderRadius: 8,
                padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)',
                outline: 'none', resize: 'none', minHeight: 80,
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
            />
          </FormField>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <BtnGhost onClick={closeModal} type="button">Cancel</BtnGhost>
            <BtnPrimary type="submit" disabled={createApp.isPending}>
              {createApp.isPending ? 'Creating…' : 'Create Application'}
            </BtnPrimary>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmState.open}
        onClose={() => setConfirm({ open: false, target: null })}
        onConfirm={doDelete}
        title="Delete Application?"
        message={confirmState.target ? `Application for "${confirmState.target.job?.company_name ?? ''} — ${confirmState.target.job?.title ?? ''}" will be permanently deleted.` : ''}
      />
    </div>
  )
}

function FormField({ label, required, hint, error, children }) {
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

function LoadingState() {
  return (
    <div style={{ padding: '60px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <div className="anim-spin" style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--border-default)', borderTopColor: 'var(--accent-primary)' }} />
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</span>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>No applications yet</p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Analyze a job and apply with one click</p>
      </div>
    </div>
  )
}
