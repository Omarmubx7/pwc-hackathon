import { fallbackAnalysis } from '../data/fallback'

const PRIMARY_API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const ANALYZE_PATH = '/analyze'
const LEGACY_ANALYZE_PATH = '/api/skillsnap/match'
const SAVE_JOB_PATH = '/save-job'
const REJECT_JOB_PATH = '/reject-job'
const CAREER_PATH = '/career-path'

async function readJson(response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function normalizeAnalysis(payload) {
  if (!payload || typeof payload !== 'object') {
    return fallbackAnalysis
  }

  const extractedSkills = payload.extracted_skills || payload.skills || []
  const jobMatches = payload.job_matches || payload.jobs || []
  const roadmap = payload.career_roadmap || payload.roadmap || payload.careerPath || []

  return {
    extracted_skills: Array.isArray(extractedSkills) ? extractedSkills : fallbackAnalysis.extracted_skills,
    predicted_role: payload.predicted_role || payload.role || fallbackAnalysis.predicted_role,
    job_matches: Array.isArray(jobMatches) && jobMatches.length > 0 ? jobMatches : fallbackAnalysis.job_matches,
    career_roadmap: Array.isArray(roadmap) && roadmap.length > 0 ? roadmap : fallbackAnalysis.career_roadmap,
    market_insight: payload.market_insight || payload.insight || fallbackAnalysis.market_insight,
  }
}

async function safeRequest(path, options = {}) {
  try {
    const response = await fetch(`${PRIMARY_API}${path}`, options)
    const payload = await readJson(response)
    return { ok: response.ok, payload, status: response.status }
  } catch (error) {
    return { ok: false, payload: null, status: 0, error }
  }
}

export async function analyzeCandidate({ cvText, skills }) {
  const body = JSON.stringify({
    cv_text: cvText,
    skills,
  })

  const primary = await safeRequest(ANALYZE_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  if (primary.ok && primary.payload) {
    return normalizeAnalysis(primary.payload)
  }

  const legacy = await safeRequest(LEGACY_ANALYZE_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  if (legacy.ok && legacy.payload) {
    return normalizeAnalysis(legacy.payload)
  }

  return fallbackAnalysis
}

export async function saveJob(job) {
  await safeRequest(SAVE_JOB_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  })
}

export async function rejectJob(job) {
  await safeRequest(REJECT_JOB_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  })
}

export async function fetchCareerPath() {
  const response = await safeRequest(CAREER_PATH, { method: 'GET' })
  if (response.ok && response.payload) {
    const data = response.payload
    const steps = data.career_path || data.steps || data.roadmap || data.career_roadmap
    if (Array.isArray(steps) && steps.length > 0) {
      return steps
    }
  }

  return fallbackAnalysis.career_roadmap
}
