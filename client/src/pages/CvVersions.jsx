import { useState } from 'react'
import { useCvVersions, useCreateCvVersion, useUpdateCvVersion, useDeleteCvVersion } from '../hooks/useCvVersions.js'
import Modal from '../components/Modal.jsx'

const TARGET_TYPES = ['FULLSTACK', 'BACKEND', 'DATA', 'STUDENT']

const TARGET_TYPE_META = {
  FULLSTACK: { label: 'Fullstack', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  BACKEND:   { label: 'Backend',   cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25' },
  DATA:      { label: 'Data',      cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
  STUDENT:   { label: 'Student',   cls: 'bg-green-500/15 text-green-400 border-green-500/25' },
}

const EMPTY_FORM = { name: '', target_type: '', plain_text: '' }

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div className="py-20 flex flex-col items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-[#2a2a2a] flex items-center justify-center">
        <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-gray-400 text-sm font-medium">No CV versions yet</p>
        <p className="text-gray-600 text-xs mt-1">Add your base CV to get started with AI matching</p>
      </div>
      <button onClick={onAdd} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
        + Add your first CV version
      </button>
    </div>
  )
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────
function CvModal({ isOpen, onClose, initial }) {
  const isEdit = !!initial
  const createCv = useCreateCvVersion()
  const updateCv = useUpdateCvVersion()

  const [form, setForm] = useState(initial ?? EMPTY_FORM)
  const [errors, setErrors] = useState({})

  // Keep form in sync when switching between add/edit
  function handleClose() {
    setErrors({})
    onClose()
  }

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
      const payload = {
        name: form.name.trim(),
        target_type: form.target_type,
        plain_text: form.plain_text || null,
      }
      if (isEdit) {
        await updateCv.mutateAsync({ id: initial.id, ...payload })
      } else {
        await createCv.mutateAsync(payload)
      }
      handleClose()
    } catch (err) {
      setErrors({ submit: err.response?.data?.error ?? err.message })
    }
  }

  const isPending = createCv.isPending || updateCv.isPending

  const inputCls = (field) =>
    `w-full bg-[#0f0f0f] border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors ${errors[field] ? 'border-red-500' : 'border-[#2a2a2a]'}`

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? 'Edit CV Version' : 'Add CV Version'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.submit && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {errors.submit}
          </p>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Backend v3"
            className={inputCls('name')}
          />
          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
        </div>

        {/* Target Type */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Target Type <span className="text-red-500">*</span>
          </label>
          <select
            name="target_type"
            value={form.target_type}
            onChange={handleChange}
            className={`${inputCls('target_type')} ${!form.target_type ? 'text-gray-600' : 'text-white'}`}
          >
            <option value="">Select a type…</option>
            {TARGET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.target_type && <p className="text-xs text-red-400 mt-1">{errors.target_type}</p>}
        </div>

        {/* Plain Text */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            CV Plain Text{' '}
            <span className="text-gray-600 font-normal">(optional — used for AI matching)</span>
          </label>
          <textarea
            name="plain_text"
            value={form.plain_text}
            onChange={handleChange}
            placeholder="Paste your full CV content here for AI matching…"
            rows={7}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors resize-none font-mono text-xs leading-relaxed"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-gray-300 text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add CV Version'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CvVersions() {
  const { data: cvVersions = [], isLoading } = useCvVersions()
  const deleteCv = useDeleteCvVersion()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(cv) {
    setEditing({ id: cv.id, name: cv.name, target_type: cv.target_type, plain_text: cv.plain_text ?? '' })
    setModalOpen(true)
  }
  function closeModal() { setModalOpen(false) }

  function handleDelete(cv) {
    if (!window.confirm(`Delete CV version "${cv.name}"? This cannot be undone.`)) return
    deleteCv.mutate(cv.id)
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">CV Versions</h1>
          <p className="text-gray-500 text-sm mt-1">Manage the CV versions you use for applications</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add CV Version
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-600 text-sm">Loading…</div>
        ) : cvVersions.length === 0 ? (
          <EmptyState onAdd={openAdd} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                {['Name', 'Type', 'CV Text', 'Last Updated', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className={`text-left px-6 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cvVersions.map((cv) => {
                const meta = TARGET_TYPE_META[cv.target_type] ?? { label: cv.target_type, cls: 'bg-gray-500/15 text-gray-400 border-gray-500/25' }
                return (
                  <tr key={cv.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#222] transition-colors">
                    <td className="px-6 py-3.5 font-medium text-white">{cv.name}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs">
                      {cv.plain_text
                        ? <span className="text-green-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Yes</span>
                        : <span className="text-gray-700">—</span>}
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs">{formatDate(cv.updated_at ?? cv.created_at)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(cv)}
                          className="text-gray-600 hover:text-blue-400 transition-colors text-xs px-2 py-1 rounded hover:bg-blue-500/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cv)}
                          className="text-gray-600 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <CvModal
        key={editing ? editing.id : 'new'}
        isOpen={modalOpen}
        onClose={closeModal}
        initial={editing}
      />
    </div>
  )
}
