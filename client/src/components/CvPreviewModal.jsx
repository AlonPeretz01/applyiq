import { useState } from 'react'
import { cvGeneratorApi } from '../api/cvGenerator.js'
import { applicationsApi } from '../api/applications.js'
import Modal from './Modal.jsx'

// ─── States ───────────────────────────────────────────────────────────────────
// idle     → show "Generate" button
// loading  → spinner + "Claude is tailoring your CV..."
// preview  → iframe + Download / Close buttons
// error    → error message + retry

export default function CvPreviewModal({ isOpen, onClose, jobId, cvVersionId, jobTitle, companyName, applicationId, jobUrl }) {
  const [phase, setPhase]         = useState('idle')
  const [html, setHtml]           = useState(null)
  const [errorMsg, setErrorMsg]   = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [markingApplied, setMarkingApplied] = useState(false)
  const [markedApplied, setMarkedApplied]   = useState(false)

  // Reset state when modal opens fresh
  function handleClose() {
    setPhase('idle')
    setHtml(null)
    setErrorMsg(null)
    setMarkedApplied(false)
    onClose()
  }

  async function handleGenerate() {
    setPhase('loading')
    setErrorMsg(null)
    try {
      const res = await cvGeneratorApi.generate(jobId, cvVersionId)
      setHtml(res.data.html)
      setPhase('preview')
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate CV')
      setPhase('error')
    }
  }

  async function handleDownload() {
    if (!html) return
    setDownloading(true)
    try {
      const arrayBuffer = await cvGeneratorApi.download(html, jobId)
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cv_${companyName?.replace(/\s+/g, '_') ?? 'applyiq'}_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to download PDF')
    } finally {
      setDownloading(false)
    }
  }

  async function handleMarkApplied() {
    if (!applicationId) return
    setMarkingApplied(true)
    try {
      await applicationsApi.updateStatus(applicationId, 'APPLIED', null)
      setMarkedApplied(true)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update status')
    } finally {
      setMarkingApplied(false)
    }
  }

  const title = companyName && jobTitle
    ? `Tailored CV — ${companyName} · ${jobTitle}`
    : 'Generate Tailored CV'

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth={720}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── idle ── */}
        {phase === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              padding: '14px 16px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '3px solid var(--accent-primary)',
              borderRadius: 8,
            }}>
              <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                AI-Tailored CV
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Claude will rewrite your CV to highlight skills relevant to this role, reorder bullets by relevance,
                and weave in keywords from the job analysis. Your actual experience stays intact — nothing is invented.
              </p>
            </div>

            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
              CV is tailored to highlight skills relevant to this role
            </p>

            <button
              onClick={handleGenerate}
              style={{
                width: '100%', padding: '10px', borderRadius: 8,
                fontSize: 13, fontWeight: 500,
                background: 'var(--accent-primary)', border: 'none', color: '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.12)'; e.currentTarget.style.boxShadow = '0 0 20px var(--accent-glow)' }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Generate Tailored CV
            </button>
          </div>
        )}

        {/* ── loading ── */}
        {phase === 'loading' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 16, padding: '48px 0',
          }}>
            <div className="anim-spin" style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid var(--border-default)',
              borderTopColor: 'var(--accent-primary)',
            }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                Claude is tailoring your CV…
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                This usually takes 15–30 seconds
              </p>
            </div>
          </div>
        )}

        {/* ── preview ── */}
        {phase === 'preview' && html && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
              CV is tailored to highlight skills relevant to this role
            </p>

            <iframe
              srcDoc={html}
              title="CV Preview"
              style={{
                width: '100%', height: 380, border: '1px solid var(--border-subtle)',
                borderRadius: 8, background: '#fff',
              }}
              sandbox="allow-same-origin"
            />

            {/* Download + Close */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: downloading ? 'var(--bg-elevated)' : 'var(--accent-primary)',
                  border: 'none', color: '#fff',
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  opacity: downloading ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!downloading) { e.currentTarget.style.filter = 'brightness(1.12)'; e.currentTarget.style.boxShadow = '0 0 20px var(--accent-glow)' } }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {downloading ? (
                  <>
                    <div className="anim-spin" style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>

              <button
                onClick={handleClose}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: 'transparent', border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                Close
              </button>
            </div>

            {/* Mark as Applied — only shown if we have an applicationId */}
            {applicationId && !markedApplied && (
              <button
                onClick={handleMarkApplied}
                disabled={markingApplied}
                style={{
                  width: '100%', padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: markingApplied ? 'var(--bg-elevated)' : 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  color: markingApplied ? 'var(--text-muted)' : 'var(--success)',
                  cursor: markingApplied ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!markingApplied) { e.currentTarget.style.background = 'rgba(34,197,94,0.16)' } }}
                onMouseLeave={e => { if (!markingApplied) { e.currentTarget.style.background = 'rgba(34,197,94,0.1)' } }}
              >
                {markingApplied ? (
                  <>
                    <div className="anim-spin" style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(34,197,94,0.3)', borderTopColor: 'var(--success)' }} />
                    Updating…
                  </>
                ) : (
                  <>
                    Mark as Applied
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            )}

            {/* Post-mark-applied actions */}
            {markedApplied && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--success)', fontSize: 13, padding: '2px 0' }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Application marked as Applied!
                </div>
                {jobUrl && (
                  <button
                    onClick={() => window.open(jobUrl, '_blank')}
                    style={{
                      width: '100%', padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                      background: 'transparent', border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                  >
                    Open job listing
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── error ── */}
        {phase === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              padding: '14px 16px', borderRadius: 8,
              background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.25)',
              borderLeft: '3px solid var(--danger)',
            }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 500, color: 'var(--danger)' }}>
                Generation failed
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {errorMsg}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleGenerate}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: 'var(--accent-primary)', border: 'none', color: '#fff',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.12)' }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
              >
                Retry
              </button>
              <button
                onClick={handleClose}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: 'transparent', border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  )
}
