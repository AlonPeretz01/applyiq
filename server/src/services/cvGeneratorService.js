import client from '../lib/claude.js'
import puppeteer from 'puppeteer'

const MODEL = 'claude-sonnet-4-20250514'

function parseClaudeJson(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  return JSON.parse(cleaned)
}

// ─── generateTailoredCv ───────────────────────────────────────────────────────
// Calls Claude to rewrite the CV tailored for the specific job.
// Does NOT invent experience — only enhances and reorders existing content.
export async function generateTailoredCv(cvPlainText, jobAnalysis, recommendation, profile = null) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: `You are an expert CV writer. Tailor CVs to specific job requirements and return ONLY valid JSON — no markdown, no explanation, no code fences.`,
    messages: [
      {
        role: 'user',
        content: `Tailor this candidate's CV for the specific job below.

CRITICAL RULES — YOU MUST FOLLOW THESE EXACTLY:
1. NEVER remove any job position or work experience — keep ALL of them
2. NEVER remove any project — keep ALL projects listed
3. NEVER remove volunteer work, teaching experience, or extracurricular activities
4. NEVER invent or add experience that doesn't exist in the original CV
5. For seemingly unrelated jobs (e.g. English teacher, tutor), KEEP them but reframe the bullets to emphasize transferable skills (communication, leadership, mentoring, attention to detail)
6. ONLY reorder bullet points within each section by relevance to the job
7. ONLY enhance wording to better highlight relevant skills
8. The output must contain AT LEAST the same number of jobs, projects, and experiences as the input
9. If in doubt — KEEP IT, never remove

The candidate has provided their full CV. Your job is to ENHANCE and REFRAME, not to filter or remove. Every single item in the original CV must appear in the output.

ADDITIONAL RULES:
- Extract real contact info (name, email, phone, location, GitHub, LinkedIn) from the CV text
- Write a new tailored summary (2-3 sentences) focused on this job's requirements

Original CV:
${cvPlainText}

Job Analysis:
${JSON.stringify(jobAnalysis, null, 2)}

Suggested Tweaks from AI:
${JSON.stringify(recommendation?.suggested_tweaks ?? [], null, 2)}
${profile ? `
Profile Hints (supplement CV content where missing — do NOT invent new roles or companies):
- Bio/Summary: ${profile.summary || 'none'}
- Profile Skills: ${(profile.skills || []).join(', ') || 'none'}
- GitHub: ${profile.github_url || 'none'}
- LinkedIn: ${profile.linkedin_url || 'none'}
` : ''}
Return a JSON object with EXACTLY this structure:
{
  "name": "candidate full name",
  "email": "email or empty string",
  "phone": "phone or empty string",
  "location": "location or empty string",
  "github": "github url or null",
  "linkedin": "linkedin url or null",
  "summary": "2-3 sentence professional summary tailored to this job",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "period": "2024 – Present",
      "bullets": ["achievement 1", "achievement 2", "achievement 3"]
    }
  ],
  "education": [
    {
      "degree": "B.Sc Computer Science",
      "institution": "Tel Aviv University",
      "period": "2023 – 2026"
    }
  ],
  "skills": {
    "languages": ["JavaScript", "Python"],
    "frameworks": ["Node.js", "Express", "React"],
    "databases": ["PostgreSQL", "MongoDB"],
    "tools": ["Git", "Docker", "AWS"]
  },
  "projects": [
    {
      "name": "Project Name",
      "description": "one sentence description",
      "tech": ["React", "Node.js"]
    }
  ]
}`,
      },
    ],
  })

  const text = message.content[0].text
  return parseClaudeJson(text)
}

// ─── renderCvHtml ─────────────────────────────────────────────────────────────
// Returns a complete HTML string for the CV. All styles are inline for Puppeteer.
export function renderCvHtml(cvData) {
  const { name, email, phone, location, github, linkedin, summary, experience, education, skills, projects } = cvData

  const contactParts = [email, phone, location, linkedin, github].filter(Boolean)

  const skillsHtml = Object.entries(skills || {})
    .filter(([, items]) => items && items.length > 0)
    .map(([category, items]) => `
      <div style="margin-bottom:7px;line-height:1.8;">
        <span style="font-weight:600;color:#374151;text-transform:capitalize;font-size:12px;">${category}:</span>
        ${items.map(s => `<span style="display:inline-block;background:#EFF6FF;color:#1D4ED8;padding:2px 8px;border-radius:3px;font-size:11px;margin:2px 3px 2px 0;border:1px solid #BFDBFE;">${s}</span>`).join('')}
      </div>
    `).join('')

  const experienceHtml = (experience || []).map(exp => `
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;flex-wrap:wrap;gap:4px;">
        <div>
          <span style="font-weight:600;font-size:14px;color:#111827;">${exp.title}</span>
          <span style="color:#6B7280;font-size:13px;"> · ${exp.company}</span>
        </div>
        <span style="font-size:12px;color:#9CA3AF;white-space:nowrap;">${exp.period}</span>
      </div>
      <ul style="margin:5px 0 0 18px;padding:0;color:#374151;font-size:13px;line-height:1.65;">
        ${(exp.bullets || []).map(b => `<li style="margin-bottom:3px;">${b}</li>`).join('')}
      </ul>
    </div>
  `).join('')

  const educationHtml = (education || []).map(edu => `
    <div style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:4px;">
      <div>
        <span style="font-weight:600;font-size:13px;color:#111827;">${edu.degree}</span>
        <span style="color:#6B7280;font-size:13px;"> · ${edu.institution}</span>
      </div>
      <span style="font-size:12px;color:#9CA3AF;white-space:nowrap;">${edu.period}</span>
    </div>
  `).join('')

  const projectsSection = (projects || []).length > 0 ? `
    <div style="margin-bottom:22px;">
      <h2 style="font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;padding-bottom:5px;border-bottom:1.5px solid #2563EB;">Projects</h2>
      ${(projects || []).map(p => `
        <div style="margin-bottom:11px;">
          <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:3px;">
            <span style="font-weight:600;font-size:13px;color:#111827;">${p.name}</span>
            ${(p.tech || []).map(t => `<span style="font-size:11px;background:#F3F4F6;color:#4B5563;padding:1px 6px;border-radius:3px;border:1px solid #E5E7EB;">${t}</span>`).join('')}
          </div>
          <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.55;">${p.description}</p>
        </div>
      `).join('')}
    </div>
  ` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — CV</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#fff;color:#111827;">
  <div style="max-width:800px;margin:0 auto;padding:40px 48px;">

    <!-- Header -->
    <div style="margin-bottom:24px;padding-bottom:18px;border-bottom:2px solid #2563EB;">
      <h1 style="font-size:28px;font-weight:700;color:#111827;margin:0 0 8px;letter-spacing:-0.02em;">${name}</h1>
      <div style="font-size:12px;color:#6B7280;display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
        ${contactParts.map((part, i) => `<span>${part}</span>${i < contactParts.length - 1 ? '<span style="color:#D1D5DB;">·</span>' : ''}`).join('')}
      </div>
    </div>

    ${summary ? `
    <!-- Summary -->
    <div style="margin-bottom:22px;">
      <h2 style="font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;padding-bottom:5px;border-bottom:1.5px solid #2563EB;">Professional Summary</h2>
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.7;">${summary}</p>
    </div>
    ` : ''}

    ${experienceHtml ? `
    <!-- Experience -->
    <div style="margin-bottom:22px;">
      <h2 style="font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;padding-bottom:5px;border-bottom:1.5px solid #2563EB;">Experience</h2>
      ${experienceHtml}
    </div>
    ` : ''}

    ${skillsHtml ? `
    <!-- Skills -->
    <div style="margin-bottom:22px;">
      <h2 style="font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px;padding-bottom:5px;border-bottom:1.5px solid #2563EB;">Skills</h2>
      ${skillsHtml}
    </div>
    ` : ''}

    ${projectsSection}

    ${educationHtml ? `
    <!-- Education -->
    <div style="margin-bottom:22px;">
      <h2 style="font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px;padding-bottom:5px;border-bottom:1.5px solid #2563EB;">Education</h2>
      ${educationHtml}
    </div>
    ` : ''}

  </div>
</body>
</html>`
}

// ─── generatePdf ─────────────────────────────────────────────────────────────
// Converts HTML string to a PDF buffer using Puppeteer.
export async function generatePdf(htmlContent) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return pdf
  } finally {
    await browser.close()
  }
}
