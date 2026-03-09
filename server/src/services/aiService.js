import client from '../lib/claude.js'

const MODEL = 'claude-sonnet-4-20250514'

/**
 * Parse JSON from Claude's response, handling markdown code blocks if present.
 */
function parseClaudeJson(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  return JSON.parse(cleaned)
}

/**
 * Analyze a job description and return structured data.
 */
export async function analyzeJob(jobDescription) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: `You are an expert job market analyst. Analyze job descriptions and return ONLY valid JSON — no markdown, no explanation, no code fences.`,
    messages: [
      {
        role: 'user',
        content: `Analyze this job description and return a JSON object with exactly these fields:
- required_skills: string[] (technical and soft skills explicitly required)
- technologies: string[] (specific tools, frameworks, languages, platforms)
- experience_years: number | null (minimum years required, null if not specified)
- job_type: string ("full-time" | "part-time" | "contract" | "internship" | "unknown")
- seniority: string ("junior" | "mid" | "senior" | "lead" | "staff" | "principal" | "unknown")
- keywords: string[] (top 8–12 important terms for ATS optimization)
- summary: string (2–3 sentence plain-English summary of the role)
- match_tips: string[] (3–5 actionable tips to tailor a CV for this job)

Job description:
${jobDescription}`,
      },
    ],
  })

  const text = message.content[0].text
  return parseClaudeJson(text)
}

/**
 * Recommend the best CV version for a given job analysis.
 */
export async function recommendCvVersion(jobAnalysis, cvVersions) {
  if (!cvVersions || cvVersions.length === 0) {
    return {
      recommended_cv_id: null,
      reason: 'No CV versions available to compare.',
      match_score: 0,
      suggested_tweaks: ['Add at least one CV version with plain text to get personalized recommendations.'],
    }
  }

  const cvSummaries = cvVersions.map((cv) => ({
    id: cv.id,
    name: cv.name,
    target_type: cv.target_type,
    has_text: !!cv.plain_text,
    preview: cv.plain_text ? cv.plain_text.slice(0, 600) : '(no text provided)',
  }))

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are an expert career coach and CV reviewer. Recommend the best CV version for a given job and return ONLY valid JSON — no markdown, no explanation, no code fences.`,
    messages: [
      {
        role: 'user',
        content: `Given this job analysis and list of CV versions, recommend the best CV to use.

Job analysis:
${JSON.stringify(jobAnalysis, null, 2)}

Available CV versions:
${JSON.stringify(cvSummaries, null, 2)}

Return a JSON object with exactly these fields:
- recommended_cv_id: string (the id of the best matching CV)
- reason: string (1–2 sentences explaining why this CV is the best match)
- match_score: number (0–100, how well the recommended CV matches the job)
- suggested_tweaks: string[] (3–5 specific improvements to make to the recommended CV)`,
      },
    ],
  })

  const text = message.content[0].text
  return parseClaudeJson(text)
}
