import { useState, useRef, useEffect } from 'react'
import {
  useApplications,
  useCreateApplication,
  useUpdateApplicationStatus,
  useDeleteApplication,
} from '../hooks/useApplications.js'
import { useJobs } from '../hooks/useJobs.js'
import { useCvVersions } from '../hooks/useCvVersions.js'
import Modal from '../components/Modal.jsx'
import StatusBadge, { ALL_STATUSES, STATUS_META } from '../components/StatusBadge.jsx'

const EMPTY_FORM = { job_id: '', cv_version_id: '', match_score: '', notes: '' }

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Inline status dropdown ───────────────────────────────────────────────────
function StatusDropdown({ appId, current, onUpdate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function pick(status) {
    if (status !== current) onUpdate(appId, status)
    setOpen(false)
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="cursor-pointer hover:opacity-80 transition-opacity"
        title="Click to change status"
      >
        <StatusBadge status={current} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 w-36 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg shadow-xl py-1 overflow-hidden">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => pick(s)}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                s === current
                  ? 'bg-[#2a2a2a] text-white'
                  : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[s]?.cls.includes('blue') ? 'bg-blue-400' : STATUS_META[s]?.cls.includes('yellow') ? 'bg-yellow-400' : STATUS_META[s]?.cls.includes('orange') ? 'bg-orange-400' : STATUS_META[s]?.cls.includes('purple') ? 'bg-purple-400' : STATUS_META[s]?.cls.includes('red') ? 'bg-red-400' : STATUS_META[s]?.cls.includes('green') ? 'bg-green-400' : 'bg-gray-500'}`} />
              {STATUS_META[s]?.label ?? s}
              {s === current && <span className="ml-auto text-gray-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Applications() {
  const { data: apps = [], isLoading } = useApplications()
  const { data: jobs = [] } = useJobs()
  const { data: cvVersions = [] } = useCvVersions()
  const createApp     = useCreateApplication()
  const updateStatus  = useUpdateApplicationStatus()
  const deleteApp     = useDeleteApplication()

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

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
      await createApp.mutateAsync({
        job_id: form.job_id,
        cv_version_id: form.cv_version_id,
        match_score: form.match_score !== '' ? Number(form.match_score) : null,
        notes: form.notes || null,
      })
      closeModal()
    } catch (err) {
      setErrors({ submit: err.message })
    }
  }

  function handleStatusChange(id, status) {
    updateStatus.mutate({ id, status, note: null })
  }

  function handleDelete(app) {
    const label = `${app.job?.company_name ?? ''} — ${app.job?.title ?? ''}`
    if (!window.confirm(`Delete application for "${label.trim()}"?`)) return
    deleteApp.mutate(app.id)
  }

  const inputCls = (field) =>
    `w-full bg-[#0f0f0f] border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors ${errors[field] ? 'border-red-500' : 'border-[#2a2a2a]'}`

  const selectCls = (field) =>
    `w-full bg-[#0f0f0f] border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors ${errors[field] ? 'border-red-500' : 'border-[#2a2a2a]'}`

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Applications</h1>
          <p className="text-gray-500 text-sm mt-1">Track every step of your job search</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Application
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-600 text-sm">Loading…</div>
        ) : apps.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#2a2a2a] flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm font-medium">No applications yet</p>
              <p className="text-gray-600 text-xs mt-1">Analyze a job and apply with one click</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  {['Company', 'Role', 'CV Version', 'Date Applied', 'Status', 'Match', 'Notes', 'Actions'].map(h => (
                    <th
                      key={h}
                      className={`text-left px-5 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap ${h === 'Actions' ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.map(app => (
                  <tr key={app.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#222] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-white whitespace-nowrap">
                      {app.job?.company_name ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-300 max-w-[160px] truncate">
                      {app.job?.title ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {app.cv_version?.name ?? '—'}
                      {app.cv_version?.target_type && (
                        <span className="ml-1.5 text-gray-600 bg-[#2a2a2a] px-1.5 py-0.5 rounded text-[10px]">
                          {app.cv_version.target_type}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(app.applied_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusDropdown
                        appId={app.id}
                        current={app.status}
                        onUpdate={handleStatusChange}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">
                      {app.match_score != null ? (
                        <span className={`font-semibold ${app.match_score >= 70 ? 'text-green-400' : app.match_score >= 50 ? 'text-yellow-400' : 'text-gray-500'}`}>
                          {app.match_score}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs max-w-[180px] truncate">
                      {app.notes || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(app)}
                        className="text-gray-600 hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-red-500/10"
                      >
                        Delete
                      </button>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.submit && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {errors.submit}
            </p>
          )}

          {/* Job */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Job <span className="text-red-500">*</span>
            </label>
            <select name="job_id" value={form.job_id} onChange={handleChange} className={selectCls('job_id')}>
              <option value="">Select a job…</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.company_name} — {j.title}</option>
              ))}
            </select>
            {jobs.length === 0 && (
              <p className="text-xs text-gray-600 mt-1">No jobs yet — add one in the Jobs page first.</p>
            )}
            {errors.job_id && <p className="text-xs text-red-400 mt-1">{errors.job_id}</p>}
          </div>

          {/* CV Version */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              CV Version <span className="text-red-500">*</span>
            </label>
            <select name="cv_version_id" value={form.cv_version_id} onChange={handleChange} className={selectCls('cv_version_id')}>
              <option value="">Select a CV version…</option>
              {cvVersions.map(cv => (
                <option key={cv.id} value={cv.id}>{cv.name} ({cv.target_type})</option>
              ))}
            </select>
            {cvVersions.length === 0 && (
              <p className="text-xs text-gray-600 mt-1">No CV versions yet — add one in the CV Versions page first.</p>
            )}
            {errors.cv_version_id && <p className="text-xs text-red-400 mt-1">{errors.cv_version_id}</p>}
          </div>

          {/* Match Score */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Match Score <span className="text-gray-600">(0–100, optional)</span>
            </label>
            <input
              name="match_score"
              type="number"
              min="0"
              max="100"
              value={form.match_score}
              onChange={handleChange}
              placeholder="e.g. 82"
              className={inputCls('match_score')}
            />
            {errors.match_score && <p className="text-xs text-red-400 mt-1">{errors.match_score}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any notes about this application…"
              rows={3}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-gray-300 text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createApp.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {createApp.isPending ? 'Creating…' : 'Create Application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
