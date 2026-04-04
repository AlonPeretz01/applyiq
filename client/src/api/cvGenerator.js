import api from './client.js'

export const cvGeneratorApi = {
  // POST /api/cv-generator/generate
  generate: (jobId, cvVersionId) =>
    api.post('/cv-generator/generate', { job_id: jobId, cv_version_id: cvVersionId }),

  // POST /api/cv-generator/download
  // jobId is optional — if provided, the PDF is saved to storage and linked to the application
  download: (html, jobId) =>
    api.post('/cv-generator/download', { html, jobId }, { responseType: 'arraybuffer' }),

  // POST /api/cv-generator/download (returnUrl mode)
  // Generates PDF, saves to Supabase storage, returns { data: { url } } — no binary download
  save: (html, jobId) =>
    api.post('/cv-generator/download', { html, jobId, returnUrl: true }),

  // GET /api/cv-generator/download/:applicationId
  getCvForApplication: (applicationId) =>
    api.get(`/cv-generator/download/${applicationId}`),
}
