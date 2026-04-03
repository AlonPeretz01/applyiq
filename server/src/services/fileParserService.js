import { createRequire } from 'module'
import mammoth from 'mammoth'

const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')

const PDF_MIME  = 'application/pdf'
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export async function extractTextFromPdf(buffer) {
  const data = await pdfParse(buffer)
  return data.text?.trim() ?? ''
}

export async function extractTextFromDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer })
  return result.value?.trim() ?? ''
}

export async function extractTextFromFile(buffer, mimetype) {
  if (mimetype === PDF_MIME)  return extractTextFromPdf(buffer)
  if (mimetype === DOCX_MIME) return extractTextFromDocx(buffer)
  throw new Error(`Unsupported file type: ${mimetype}`)
}
