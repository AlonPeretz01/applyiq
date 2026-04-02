import { useState } from 'react'
import { useCvVersions, useCreateCvVersion, useUpdateCvVersion, useDeleteCvVersion } from '../hooks/useCvVersions.js'
import Modal, { ConfirmModal } from '../components/Modal.jsx'

const TARGET_TYPES = ['FULLSTACK', 'BACKEND', 'DATA', 'STUDENT']

const TARGET_TYPE_META = {
  FULLSTACK: { label: 'Fullstack', strip: 'linear-gradient(90deg,#7C6FF7,#A78BFA)', color: 'var(--accent-primary)',  bg: 'var(--accent-glow)',    border: 'rgba(124,111,247,0.3)' },
  BACKEND:   { label: 'Backend',   strip: 'linear-gradient(90deg,#60A5FA,#34D399)', color: 'var(--info)',            bg: 'var(--info-bg)',         border: 'rgba(96,165,250,0.3)'  },
  DATA:      { label: 'Data',      strip: 'linear-gradient(90deg,#F59E0B,#F97316)', color: 'var(--warning)',         bg: 'var(--warning-bg)',      border: 'rgba(245,158,11,0.3)'  },
  STUDENT:   { label: 'Student',   strip: 'linear-gradient(90deg,#22C55E,#34D399)', color: 'var(--success)',         bg: 'var(--success-bg)',      border: 'rgba(34,197,94,0.3)'   },
}

const EMPTY_FORM = { name: '', target_type: '', plain_text: '' }

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Input / field helpers ────────────────────────────────────────────────────
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

// ─── CV Card ──────────────────────────────────────────────────────────────────
function CvCard({ cv, onEdit, onDelete }) {
  const meta = TARGET_TYPE_META[cv.target_type] ?? {
    label: cv.target_type,
    strip: 'linear-gradient(90deg,#44445A,#44445A)',
    color: 'var(--text-muted)',
    bg: 'rgba(68,68,90,0.1)',
    border: 'rgba(68,68,90,0.25)',
  }

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
    >
      {/* Colored strip */}
      <div style={{ height: 4, background: meta.strip, flexShrink: 0 }} />

      <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Name + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cv.name}
            </h3>
            <div style={{ marginTop: 6 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                height: 20, padding: '0 8px', borderRadius: 20,
                fontSize: 11, fontWeight: 500,
                color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`,
              }}>
                {meta.label}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <IconBtn onClick={onEdit} title="Edit" color="var(--info)">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
            </IconBtn>
            <IconBtn onClick={onDelete} title="Delete" color="var(--danger)">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </IconBtn>
          </div>
        </div>

        {/* Date */}
        <p style={{ margin: 0, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>
          Added {formatDate(cv.created_at)}
        </p>

        {/* Plain text preview */}
        {cv.plain_text ? (
          <div style={{
            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
            borderRadius: 6, padding: '8px 10px',
          }}>
            <p style={{
              margin: 0, fontSize: 11,
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {cv.plain_text.slice(0, 120)}
            </p>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No CV text — add it for AI matching
          </p>
        )}
      </div>
    </div>
  )
}

function IconBtn({ children, onClick, title, color }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 30, height: 30, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = color
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.background = `${color}18`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--text-muted)'
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
        e.currentTarget.style.background = 'var(--bg-elevated)'
      }}
    >
      {children}
    </button>
  )
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────
function CvModal({ isOpen, onClose, initial }) {
  const isEdit = !!initial
  const createCv = useCreateCvVersion()
  const updateCv = useUpdateCvVersion()

  const [form, setForm] = useState(initial ?? EMPTY_FORM)
  const [errors, setErrors] = useState({})

  function handleClose() { setErrors({}); onClose() }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((err) => ({ ...err, [name]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.target_type) errs.target_type = 'Target type is required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      const payload = { name: form.name.trim(), target_type: form.target_type, plain_text: form.plain_text || null }
      if (isEdit) await updateCv.mutateAsync({ id: initial.id, ...payload })
      else        await createCv.mutateAsync(payload)
      handleClose()
    } catch (err) {
      setErrors({ submit: err.response?.data?.error ?? err.message })
    }
  }

  const isPending = createCv.isPending || updateCv.isPending

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? 'Edit CV Version' : 'Add CV Version'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {errors.submit && (
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 12, color: 'var(--danger)' }}>
            {errors.submit}
          </div>
        )}

        <Field label="Name" required error={errors.name}>
          <input
            name="name" value={form.name} onChange={handleChange}
            placeholder="e.g. Backend v3"
            style={inputStyle(!!errors.name)}
            onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
            onBlur={e => { e.target.style.borderColor = errors.name ? 'var(--danger)' : 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
          />
        </Field>

        <Field label="Target Type" required error={errors.target_type}>
          <select
            name="target_type" value={form.target_type} onChange={handleChange}
            style={{ ...inputStyle(!!errors.target_type), color: form.target_type ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer' }}
            onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
            onBlur={e => { e.target.style.borderColor = errors.target_type ? 'var(--danger)' : 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
          >
            <option value="">Select a type…</option>
            {TARGET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>

        <Field label="CV Plain Text" hint="optional — used for AI matching">
          <textarea
            name="plain_text" value={form.plain_text} onChange={handleChange}
            placeholder="Paste your full CV content here for AI matching…"
            rows={7}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--text-primary)',
              outline: 'none',
              resize: 'vertical',
              minHeight: 100,
              lineHeight: 1.5,
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
          />
        </Field>

        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <BtnGhost onClick={handleClose} type="button">Cancel</BtnGhost>
          <BtnPrimary type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add CV Version'}
          </BtnPrimary>
        </div>
      </form>
    </Modal>
  )
}

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
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.boxShadow = '0 0 20px var(--accent-glow)'; e.currentTarget.style.filter = 'brightness(1.12)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.filter = 'none' }}
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
        background: 'transparent',
        border: '1px solid var(--border-default)',
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CvVersions() {
  const { data: cvVersions = [], isLoading } = useCvVersions()
  const deleteCv = useDeleteCvVersion()

  const [modalOpen, setModalOpen]   = useState(false)
  const [editing, setEditing]       = useState(null)
  const [confirmState, setConfirm]  = useState({ open: false, target: null })

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(cv) {
    setEditing({ id: cv.id, name: cv.name, target_type: cv.target_type, plain_text: cv.plain_text ?? '' })
    setModalOpen(true)
  }

  function askDelete(cv) {
    setConfirm({ open: true, target: cv })
  }

  function doDelete() {
    if (confirmState.target) deleteCv.mutate(confirmState.target.id)
  }

  return (
    <div className="page-wrapper">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            CV Versions
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Manage the CV versions you use for applications
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
          Add CV Version
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingState />
      ) : cvVersions.length === 0 ? (
        <EmptyState onAdd={openAdd} />
      ) : (
        <div className="cv-grid">
          {cvVersions.map((cv) => (
            <CvCard key={cv.id} cv={cv} onEdit={() => openEdit(cv)} onDelete={() => askDelete(cv)} />
          ))}
        </div>
      )}

      <CvModal key={editing ? editing.id : 'new'} isOpen={modalOpen} onClose={() => setModalOpen(false)} initial={editing} />

      <ConfirmModal
        isOpen={confirmState.open}
        onClose={() => setConfirm({ open: false, target: null })}
        onConfirm={doDelete}
        title="Delete CV Version?"
        message={confirmState.target ? `"${confirmState.target.name}" will be permanently deleted.` : ''}
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
    <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>No CV versions yet</p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Add your base CV to get started with AI matching</p>
      </div>
      <button
        onClick={onAdd}
        style={{ fontSize: 13, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-secondary)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--accent-primary)' }}
      >
        + Add your first CV version
      </button>
    </div>
  )
}
