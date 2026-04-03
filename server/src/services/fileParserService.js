import mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

const PDF_MIME  = 'application/pdf'
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export async function extractTextFromPdf(buffer) {
  console.log('[fileParser] extractTextFromPdf called, buffer size:', buffer?.length)
  const uint8Array = new Uint8Array(buffer)
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
  const pdf = await loadingTask.promise
  console.log('[fileParser] pdf loaded, numPages:', pdf.numPages)

  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map(item => item.str).join(' ')
    fullText += pageText + '\n'
  }

  const text = fullText.trim()
  console.log('[fileParser] extracted text length:', text.length)
  console.log('[fileParser] text preview:', text.slice(0, 200))
  return text
}

export async function extractTextFromDocx(buffer) {
  console.log('[fileParser] extractTextFromDocx called, buffer size:', buffer?.length)
  const result = await mammoth.extractRawText({ buffer })
  console.log('[fileParser] mammoth result — text length:', result.value?.length)
  return result.value?.trim() ?? ''
}

export async function extractTextFromFile(buffer, mimetype) {
  console.log('[fileParser] extractTextFromFile — mimetype:', mimetype, '| buffer size:', buffer?.length)
  if (mimetype === PDF_MIME)  return extractTextFromPdf(buffer)
  if (mimetype === DOCX_MIME) return extractTextFromDocx(buffer)
  throw new Error(`Unsupported file type: ${mimetype}`)
}
