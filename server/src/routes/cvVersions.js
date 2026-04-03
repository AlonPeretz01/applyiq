import { Router } from 'express'
import multer from 'multer'
import prisma from '../lib/prisma.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { extractTextFromFile } from '../services/fileParserService.js'

const router = Router()

const VALID_TARGET_TYPES = ['FULLSTACK', 'BACKEND', 'DATA', 'STUDENT']
const ACCEPTED_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ACCEPTED_MIMETYPES.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only PDF and DOCX files are allowed'))
  },
})

// ─── GET /api/cv-versions ─────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const versions = await prisma.cvVersion.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
    })
    res.json({ data: versions, error: null, message: 'CV versions retrieved successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/cv-versions/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const cv = await prisma.cvVersion.findUnique({ where: { id: req.params.id } })
    if (!cv || cv.user_id !== req.user.id) {
      return res.status(404).json({ data: null, error: 'CV version not found', message: 'CV version not found' })
    }
    res.json({ data: cv, error: null, message: 'CV version retrieved successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/cv-versions ────────────────────────────────────────────────────
// Accepts multipart/form-data (with optional cv_file) OR application/json
router.post('/', upload.single('cv_file'), async (req, res, next) => {
  try {
    const { name, target_type, plain_text } = req.body
    if (!name?.trim()) {
      return res.status(400).json({ data: null, error: 'name is required', message: 'name is required' })
    }
    if (!target_type) {
      return res.status(400).json({ data: null, error: 'target_type is required', message: 'target_type is required' })
    }
    if (!VALID_TARGET_TYPES.includes(target_type)) {
      return res.status(400).json({
        data: null,
        error: `target_type must be one of: ${VALID_TARGET_TYPES.join(', ')}`,
        message: `target_type must be one of: ${VALID_TARGET_TYPES.join(', ')}`,
      })
    }

    let finalPlainText = plain_text ?? null
    let fileUrl = null

    if (req.file) {
      // Extract text from uploaded file
      try {
        finalPlainText = await extractTextFromFile(req.file.buffer, req.file.mimetype)
      } catch (parseErr) {
        console.warn('[cv-versions/post] text extraction failed:', parseErr.message)
        // Proceed without text — don't block CV creation
      }

      // Upload original file to Supabase Storage
      const ext = req.file.mimetype === 'application/pdf' ? 'pdf' : 'docx'
      const fileName = `cv_${req.user.id}_${Date.now()}.${ext}`
      try {
        const { error: uploadError } = await supabaseAdmin.storage
          .from('cv-files')
          .upload(fileName, req.file.buffer, { contentType: req.file.mimetype })
        if (uploadError) {
          console.warn('[cv-versions/post] storage upload failed:', uploadError.message)
        } else {
          const { data: urlData } = supabaseAdmin.storage.from('cv-files').getPublicUrl(fileName)
          fileUrl = urlData.publicUrl
        }
      } catch (storageErr) {
        console.warn('[cv-versions/post] storage error (non-fatal):', storageErr.message)
      }
    }

    const cv = await prisma.cvVersion.create({
      data: {
        user_id:    req.user.id,
        name:       name.trim(),
        target_type,
        plain_text: finalPlainText,
        file_url:   fileUrl,
      },
    })
    res.status(201).json({ data: cv, error: null, message: 'CV version created successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── PUT /api/cv-versions/:id ─────────────────────────────────────────────────
router.put('/:id', upload.single('cv_file'), async (req, res, next) => {
  try {
    const existing = await prisma.cvVersion.findUnique({ where: { id: req.params.id }, select: { user_id: true } })
    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ data: null, error: 'CV version not found', message: 'CV version not found' })
    }
    const { name, target_type, plain_text, file_url } = req.body
    if (name !== undefined && !name?.trim()) {
      return res.status(400).json({ data: null, error: 'name cannot be blank', message: 'name cannot be blank' })
    }
    if (target_type !== undefined && !VALID_TARGET_TYPES.includes(target_type)) {
      return res.status(400).json({
        data: null,
        error: `target_type must be one of: ${VALID_TARGET_TYPES.join(', ')}`,
        message: `target_type must be one of: ${VALID_TARGET_TYPES.join(', ')}`,
      })
    }

    const updateData = {
      ...(name !== undefined && { name: name.trim() }),
      ...(target_type !== undefined && { target_type }),
      ...(plain_text !== undefined && { plain_text: plain_text || null }),
    }

    // file_url: null in JSON body → clear the stored file URL
    if ('file_url' in req.body && (file_url === null || file_url === 'null')) {
      updateData.file_url = null
    }

    // New file uploaded → extract text + upload to Supabase
    if (req.file) {
      try {
        updateData.plain_text = await extractTextFromFile(req.file.buffer, req.file.mimetype)
      } catch (parseErr) {
        console.warn('[cv-versions/put] text extraction failed:', parseErr.message)
      }
      const ext = req.file.mimetype === 'application/pdf' ? 'pdf' : 'docx'
      const fileName = `cv_${req.user.id}_${Date.now()}.${ext}`
      try {
        const { error: uploadError } = await supabaseAdmin.storage
          .from('cv-files')
          .upload(fileName, req.file.buffer, { contentType: req.file.mimetype })
        if (uploadError) {
          console.warn('[cv-versions/put] storage upload failed:', uploadError.message)
        } else {
          const { data: urlData } = supabaseAdmin.storage.from('cv-files').getPublicUrl(fileName)
          updateData.file_url = urlData.publicUrl
        }
      } catch (storageErr) {
        console.warn('[cv-versions/put] storage error (non-fatal):', storageErr.message)
      }
    }

    const cv = await prisma.cvVersion.update({ where: { id: req.params.id }, data: updateData })
    res.json({ data: cv, error: null, message: 'CV version updated successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── DELETE /api/cv-versions/:id ──────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.cvVersion.findUnique({ where: { id: req.params.id }, select: { user_id: true } })
    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ data: null, error: 'CV version not found', message: 'CV version not found' })
    }
    await prisma.cvVersion.delete({ where: { id: req.params.id } })
    res.json({ data: null, error: null, message: 'CV version deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
