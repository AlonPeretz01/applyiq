import api from './client.js'

export const cvGeneratorApi = {
  // POST /api/cv-generator/generate
  // Returns { data: { html, cvData }, error, message }
  generate: (jobId, cvVersionId) =>
    api.post('/cv-generator/generate', { job_id: jobId, cv_version_id: cvVersionId }),

  // POST /api/cv-generator/download
  // Returns a PDF as arraybuffer for reliable binary handling
  download: (html) =>
    api.post('/cv-generator/download', { html }, { responseType: 'arraybuffer' }),
}
