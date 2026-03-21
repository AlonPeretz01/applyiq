import { useState, useEffect } from 'react'
import { useJobs, useCreateJob, useDeleteJob } from '../hooks/useJobs.js'
import { useCvVersions } from '../hooks/useCvVersions.js'
import { useCreateApplication } from '../hooks/useApplications.js'
import { useAiAnalysis, getSavedAnalysis } from '../hooks/useAiAnalysis.js'
import { useToast } from '../context/ToastContext.jsx'
import Modal from '../components/Modal.jsx'

const EMPTY_FORM = { company_name: '', title: '', description: '', url: '', source: '' }

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div className="py-20 flex flex-col items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-[#2a2a2a] flex items-center justify-center">
        <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-gray-400 text-sm font-medium">No jobs added yet</p>
        <p className="text-gray-600 text-xs mt-1">Click "Add Job" to start tracking job listings</p>
      </div>
      <button onClick={onAdd} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
        + Add your first job
      </button>
    </div>
  )
}

// ─── Pill tag ─────────────────────────────────────────────────────────────────
function Pill({ children, color = 'gray' }) {
  const colors = {
    gray:   'bg-[#2a2a2a] text-gray-400',
    blue:   'bg-blue-500/15 text-blue-300',
    purple: 'bg-purple-500/15 text-purple-300',
    green:  'bg-green-500/15 text-green-300',
    yellow: 'bg-yellow-500/15 text-yellow-300',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${colors[color] ?? colors.gray}`}>
      {children}
    </span>
  )
}

// ─── Match score bar ──────────────────────────────────────────────────────────
function MatchScoreBar({ score }) {
  const pct = Math.max(0, Math.min(100, score))
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  const textColor = pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Match Score</span>
        <span className={`text-sm font-bold ${textColor}`}>{pct}%</span>
      </div>
      <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{children}</p>
}

function Spinner({ className = 'w-4 h-4' }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

// ─── Analysis Modal ───────────────────────────────────────────────────────────
function AnalysisModal({ isOpen, onClose, job, result, cvVersions, savedAt, onReanalyze, reanalyzing }) {
  const createApp = useCreateApplication()
  const toast = useToast()
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  if (!isOpen || !result || !job) return null

  const { analysis, recommendation } = result
  const recCv = recommendation?.recommended_cv_id
    ? cvVersions.find((cv) => cv.id === recommendation.recommended_cv_id)
    : null

  async function handleQuickApply() {
    if (!recommendation?.recommended_cv_id) return
    setApplying(true)
    try {
      await createApp.mutateAsync({
        job_id: job.id,
        cv_version_id: recommendation.recommended_cv_id,
        match_score: recommendation.match_score != null ? Math.round(recommendation.match_score) : null,
        notes: null,
      })
      setApplied(true)
      toast.success('Application created! Go to Applications to track it.')
      setTimeout(onClose, 1800)
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Failed to create application')
    } finally {
      setApplying(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`AI Analysis — ${job.company_name}`}>
      <div className="space-y-5 max-h-[68vh] overflow-y-auto pr-1 -mr-1">

        {/* Saved analysis banner */}
        {savedAt && (
          <div className="flex items-center justify-between bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5">
            <span className="text-xs text-gray-500">
              Last analyzed: {new Date(savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={onReanalyze}
              disabled={reanalyzing}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {reanalyzing ? (
                <><Spinner className="w-3 h-3 text-blue-400" />Re-analyzing…</>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          <div className="bg-[#0f0f0f] rounded-lg px-4 py-3 border border-[#2a2a2a]">
            <p className="text-sm text-gray-300 leading-relaxed">{analysis.summary}</p>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {analysis?.job_type && analysis.job_type !== 'unknown' && <Pill color="blue">{analysis.job_type}</Pill>}
          {analysis?.seniority && analysis.seniority !== 'unknown' && <Pill color="purple">{analysis.seniority}</Pill>}
          {analysis?.experience_years != null && <Pill>{analysis.experience_years}+ yrs exp</Pill>}
        </div>

        {/* Required Skills */}
        {analysis?.required_skills?.length > 0 && (
          <div>
            <SectionLabel>Required Skills</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {analysis.required_skills.map((s) => <Pill key={s}>{s}</Pill>)}
            </div>
          </div>
        )}

        {/* Technologies */}
        {analysis?.technologies?.length > 0 && (
          <div>
            <SectionLabel>Technologies</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {analysis.technologies.map((t) => <Pill key={t} color="blue">{t}</Pill>)}
            </div>
          </div>
        )}

        {/* Keywords */}
        {analysis?.keywords?.length > 0 && (
          <div>
            <SectionLabel>ATS Keywords</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {analysis.keywords.map((k) => <Pill key={k} color="yellow">{k}</Pill>)}
            </div>
          </div>
        )}

        {/* Match Tips */}
        {analysis?.match_tips?.length > 0 && (
          <div>
            <SectionLabel>Match Tips</SectionLabel>
            <ul className="space-y-1.5">
              {analysis.match_tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-400 leading-relaxed">
                  <span className="text-blue-500 mt-0.5 flex-shrink-0">›</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-[#2a2a2a]" />

        {/* CV Recommendation */}
        {recommendation?.recommended_cv_id ? (
          <div className="space-y-4">
            <SectionLabel>CV Recommendation</SectionLabel>

            {recommendation.match_score != null && (
              <MatchScoreBar score={recommendation.match_score} />
            )}

            {recCv && (
              <div className="flex items-center gap-3 bg-[#0f0f0f] rounded-lg px-4 py-3 border border-[#2a2a2a]">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{recCv.name}</p>
                  <p className="text-xs text-gray-600">{recCv.target_type}</p>
                </div>
              </div>
            )}

            {recommendation.reason && (
              <p className="text-xs text-gray-400 leading-relaxed">{recommendation.reason}</p>
            )}

            {recommendation.suggested_tweaks?.length > 0 && (
              <div>
                <SectionLabel>Suggested Tweaks</SectionLabel>
                <ul className="space-y-1.5">
                  {recommendation.suggested_tweaks.map((tweak, i) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-400 leading-relaxed">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">›</span>
                      <span>{tweak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] px-4 py-5 text-center">
            <p className="text-sm text-gray-500">Add CV versions to get personalized recommendations</p>
            <p className="text-xs text-gray-700 mt-1">Go to CV Versions and paste your CV text</p>
          </div>
        )}

        {/* Quick Apply */}
        {recommendation?.recommended_cv_id && !applied && (
          <button
            onClick={handleQuickApply}
            disabled={applying}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {applying ? (
              <><Spinner className="w-4 h-4 text-white" />Creating…</>
            ) : (
              <>
                Apply with this CV
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        )}

        {applied && (
          <div className="flex items-center gap-2 justify-center text-green-400 text-sm py-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Application created!
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Jobs() {
  const { data: jobs = [], isLoading } = useJobs()
  const { data: cvVersions = [] } = useCvVersions()
  const createJob = useCreateJob()
  const deleteJob = useDeleteJob()
  const aiAnalysis = useAiAnalysis()
  const toast = useToast()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const [analysisModalOpen, setAnalysisModalOpen] = useState(false)
  const [analysisJob, setAnalysisJob] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisSavedAt, setAnalysisSavedAt] = useState(null)
  const [analyzingId, setAnalyzingId] = useState(null)
  const [reanalyzingId, setReanalyzingId] = useState(null)

  // Map of jobId → saved AiAnalysis row (or null). Populated on load, updated after each AI call.
  const [savedAnalysesMap, setSavedAnalysesMap] = useState({})

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
  function closeAdd() { setAddModalOpen(false) }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((err) => ({ ...err, [name]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.company_name.trim()) errs.company_name = 'Company name is required'
    if (!form.title.trim()) errs.title = 'Job title is required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    try {
      await createJob.mutateAsync({
        company_name: form.company_name.trim(),
        title: form.title.trim(),
        description: form.description || null,
        url: form.url || null,
        source: form.source || null,
      })
      closeAdd()
    } catch (err) {
      setErrors({ submit: err.response?.data?.error ?? err.message })
    }
  }

  function handleDelete(job) {
    if (!window.confirm(`Delete "${job.company_name} — ${job.title}"? This will also delete all related applications.`)) return
    deleteJob.mutate(job.id)
  }

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
      toast.error(err.response?.data?.error ?? 'AI analysis failed. Check the job description.')
    } finally {
      setAnalyzingId(null)
    }
  }

  // Forces a new AI call — used from the table row or from inside the modal.
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
      toast.error(err.response?.data?.error ?? 'Re-analysis failed.')
    } finally {
      setReanalyzingId(null)
    }
  }

  const inputCls = (field) =>
    `w-full bg-[#0f0f0f] border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors ${errors[field] ? 'border-red-500' : 'border-[#2a2a2a]'}`

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Jobs</h1>
          <p className="text-gray-500 text-sm mt-1">Manage the job listings you're tracking</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Job
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-600 text-sm">Loading…</div>
        ) : jobs.length === 0 ? (
          <EmptyState onAdd={openAdd} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                {['Company', 'Role', 'Source', 'Date Added', 'Actions'].map((h) => (
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
              {jobs.map((job) => {
                const hasSaved = !!savedAnalysesMap[job.id]
                const isAnalyzing = analyzingId === job.id
                const isReanalyzing = reanalyzingId === job.id
                return (
                  <tr key={job.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#222] transition-colors">
                    <td className="px-6 py-3.5 font-medium text-white">{job.company_name}</td>
                    <td className="px-6 py-3.5 text-gray-300">{job.title}</td>
                    <td className="px-6 py-3.5 text-gray-500">
                      {job.source
                        ? <span className="text-xs bg-[#2a2a2a] text-gray-400 px-2 py-0.5 rounded">{job.source}</span>
                        : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs">{formatDate(job.created_at)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {hasSaved ? (
                          <>
                            {/* View Analysis — opens modal with saved data, no AI call */}
                            <button
                              onClick={() => handleViewSaved(job)}
                              className="flex items-center gap-1.5 text-gray-600 hover:text-blue-400 transition-colors text-xs px-2 py-1 rounded hover:bg-blue-500/10"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              View Analysis
                            </button>

                            {/* Re-analyze — forces a new AI call */}
                            <button
                              onClick={() => handleReanalyze(job)}
                              disabled={isReanalyzing}
                              title="Run a fresh AI analysis (uses API credits)"
                              className="flex items-center justify-center text-gray-600 hover:text-yellow-400 disabled:text-yellow-400 transition-colors p-1.5 rounded hover:bg-yellow-500/10 disabled:bg-yellow-500/10 disabled:cursor-default"
                            >
                              {isReanalyzing ? (
                                <Spinner className="w-3.5 h-3.5 text-yellow-400" />
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                              )}
                            </button>
                          </>
                        ) : (
                          // No saved analysis — show Analyze button
                          <button
                            onClick={() => handleAnalyze(job)}
                            disabled={isAnalyzing}
                            className="flex items-center gap-1.5 text-gray-600 hover:text-blue-400 disabled:text-blue-400 transition-colors text-xs px-2 py-1 rounded hover:bg-blue-500/10 disabled:bg-blue-500/10 disabled:cursor-default"
                          >
                            {isAnalyzing ? (
                              <><Spinner className="w-3.5 h-3.5 text-blue-400" />Analyzing…</>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                                Analyze
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(job)}
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

      {/* Add Job Modal */}
      <Modal isOpen={addModalOpen} onClose={closeAdd} title="Add Job">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.submit && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {errors.submit}
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              placeholder="e.g. Google"
              className={inputCls('company_name')}
            />
            {errors.company_name && <p className="text-xs text-red-400 mt-1">{errors.company_name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Software Engineer"
              className={inputCls('title')}
            />
            {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Paste the job description here for AI analysis…"
              rows={4}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Job URL</label>
              <input
                name="url"
                value={form.url}
                onChange={handleChange}
                placeholder="https://…"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Source</label>
              <input
                name="source"
                value={form.source}
                onChange={handleChange}
                placeholder="e.g. LinkedIn"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeAdd}
              className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-gray-300 text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createJob.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {createJob.isPending ? 'Saving…' : 'Add Job'}
            </button>
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
        savedAt={analysisSavedAt}
        onReanalyze={() => handleReanalyze(analysisJob)}
        reanalyzing={reanalyzingId === analysisJob?.id}
      />
    </div>
  )
}
