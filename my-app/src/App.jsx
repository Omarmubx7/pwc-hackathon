import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import JobFlashcard from './components/JobFlashcard'
import { fallbackAnalysis } from './data/fallback'
import { analyzeCandidate, fetchCareerPath, rejectJob, saveJob } from './lib/skillsnapApi'

const STORAGE_KEY = 'skillsnap-ai.frontend-state'
const PAGE_TABS = [
  { id: 'upload', label: 'CV Upload' },
  { id: 'jobs', label: 'Job Flashcards' },
  { id: 'saved', label: 'Saved Jobs' },
  { id: 'not-now', label: 'Not For Now' },
  { id: 'career', label: 'Career Path' },
]

function formatSkills(skills) {
  return Array.isArray(skills) ? skills.filter(Boolean) : []
}

function HistoryCard({ job, tone }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${tone.text}`}>{tone.label}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{job.title}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tone.badge}`}>{job.match_score}%</span>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Matching Skills</p>
          <div className="flex flex-wrap gap-2">
            {formatSkills(job.matching_skills).map((skill) => (
              <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Missing Skills</p>
          <div className="flex flex-wrap gap-2">
            {formatSkills(job.missing_skills).map((skill) => (
              <span key={skill} className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

HistoryCard.propTypes = {
  job: PropTypes.shape({
    title: PropTypes.string.isRequired,
    match_score: PropTypes.number.isRequired,
    matching_skills: PropTypes.arrayOf(PropTypes.string),
    missing_skills: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  tone: PropTypes.shape({
    label: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    badge: PropTypes.string.isRequired,
  }).isRequired,
}

function Timeline({ steps }) {
  const itemCount = steps.length

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white shadow-md shadow-blue-900/20">
              {index + 1}
            </span>
            {index < itemCount - 1 ? <span className="mt-2 h-full w-px flex-1 bg-slate-200" /> : null}
          </div>
          <div className="pb-4">
            <p className="text-base font-medium leading-7 text-slate-800">{step}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

Timeline.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.string).isRequired,
}

function UploadPanel({ fileName, loading, onFileChange, onAnalyze, error }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-4xl border border-slate-200 bg-white p-7 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">Candidate Intake</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Upload CV to start matching</h2>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={onAnalyze}>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="cv-file">
            CV file
          </label>
          <input
            id="cv-file"
            type="file"
            accept=".txt,.md,.rtf,.doc,.docx"
            onChange={onFileChange}
            className="block w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-blue-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-blue-400"
          />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">Selected:</span>{' '}
            {fileName ? fileName : 'No file selected yet'}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Analyzing profile...' : 'Analyze CV'}
            </button>
          </div>

          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}
        </form>
      </div>

      <aside className="rounded-4xl border border-blue-200 bg-blue-950 p-6 text-white shadow-[0_16px_38px_rgba(30,64,175,0.2)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">Professional Demo Flow</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight">Career matching with clear decisions</h2>
        <p className="mt-4 max-w-md text-sm leading-7 text-blue-100/90">
          Upload CV, review market-ranked job cards, swipe right to save, and swipe left when a role is not for now.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {[
            ['Upload once', 'Auto skill extraction'],
            ['Swipe decisions', 'Save or Not for now'],
            ['Career direction', 'Roadmap and skill gaps'],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-3xl border border-blue-300/20 bg-blue-900/30 p-4">
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-1 text-sm leading-6 text-blue-100/80">{copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-blue-300/20 bg-blue-400/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-blue-200">Tip</p>
          <p className="mt-2 text-sm leading-6 text-blue-100/90">
            Use a real CV for best results. If the backend is unavailable, demo fallback data still keeps the flow live.
          </p>
        </div>
      </aside>
    </section>
  )
}

UploadPanel.propTypes = {
  fileName: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  onFileChange: PropTypes.func.isRequired,
  onAnalyze: PropTypes.func.isRequired,
  error: PropTypes.string.isRequired,
}

function PageFrame({ activePage, onNavigate, stats, children }) {
  return (
    <div className="min-h-screen px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-7xl flex-col gap-6">
        <header className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
          <div className="bg-blue-900 px-6 py-6 text-white sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-blue-200">PwC hackathon demo</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">NextForsa</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                  Intelligent career matching with AI skill extraction, market-aware job ranking, and a clean decision flow.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center sm:min-w-[20rem]">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-200">Matches</div>
                </div>
                <div className="rounded-2xl border border-blue-300/25 bg-blue-400/15 px-4 py-3">
                  <div className="text-2xl font-bold">{stats.saved}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-blue-100">Saved</div>
                </div>
                <div className="rounded-2xl border border-blue-300/25 bg-blue-400/15 px-4 py-3">
                  <div className="text-2xl font-bold">{stats.notNow}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-blue-100">Not For Now</div>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
            {PAGE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.id)}
                className={[
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  activePage === tab.id
                    ? 'bg-blue-700 text-white shadow-md shadow-blue-900/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

PageFrame.propTypes = {
  activePage: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    saved: PropTypes.number.isRequired,
    notNow: PropTypes.number.isRequired,
  }).isRequired,
  children: PropTypes.node.isRequired,
}

function appendUniqueJob(items, job) {
  return items.some((entry) => entry.title === job.title) ? items : [...items, job]
}

function App() {
  const [activePage, setActivePage] = useState('upload')
  const [cvText, setCvText] = useState('')
  const [analysis, setAnalysis] = useState(fallbackAnalysis)
  const [careerPath, setCareerPath] = useState(fallbackAnalysis.career_roadmap)
  const [currentJobIndex, setCurrentJobIndex] = useState(0)
  const [savedJobs, setSavedJobs] = useState([])
  const [notNowJobs, setNotNowJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [swipeState, setSwipeState] = useState(null)
  const [fileName, setFileName] = useState('')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setHydrated(true)
        return
      }

      const stored = JSON.parse(raw)
      setActivePage(stored.activePage || 'upload')
      setCvText(stored.cvText || '')
      setAnalysis(stored.analysis || fallbackAnalysis)
      setCareerPath(stored.careerPath || stored.analysis?.career_roadmap || fallbackAnalysis.career_roadmap)
      setCurrentJobIndex(stored.currentJobIndex || 0)
      setSavedJobs(Array.isArray(stored.savedJobs) ? stored.savedJobs : [])
      setNotNowJobs(Array.isArray(stored.notNowJobs) ? stored.notNowJobs : [])
      setFileName(stored.fileName || '')
    } catch {
      setAnalysis(fallbackAnalysis)
      setCareerPath(fallbackAnalysis.career_roadmap)
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activePage,
        cvText,
        analysis,
        careerPath,
        currentJobIndex,
        savedJobs,
        notNowJobs,
        fileName,
      }),
    )
  }, [activePage, analysis, careerPath, currentJobIndex, cvText, fileName, hydrated, notNowJobs, savedJobs])

  useEffect(() => {
    if (activePage === 'career' && (!careerPath || careerPath.length === 0)) {
      fetchCareerPath().then((steps) => setCareerPath(steps))
    }
  }, [activePage, careerPath])

  const currentJobs = analysis.job_matches || []
  const activeJob = currentJobs[currentJobIndex]
  const isDeckFinished = currentJobs.length > 0 && currentJobIndex >= currentJobs.length

  const stats = useMemo(
    () => ({
      total: currentJobs.length,
      saved: savedJobs.length,
      notNow: notNowJobs.length,
    }),
    [currentJobs.length, notNowJobs.length, savedJobs.length],
  )

  const handleAnalyze = async (event) => {
    event.preventDefault()
    setError('')

    if (!cvText.trim()) {
      setError('Please upload a CV file first.')
      return
    }

    setLoading(true)

    try {
      const nextAnalysis = await analyzeCandidate({
        cvText,
        skills: [],
      })

      const normalized = nextAnalysis?.job_matches?.length ? nextAnalysis : fallbackAnalysis
      setAnalysis(normalized)
      setCareerPath(normalized.career_roadmap || fallbackAnalysis.career_roadmap)
      setCurrentJobIndex(0)
      setSavedJobs([])
      setNotNowJobs([])
      setActivePage('jobs')
    } catch (analysisError) {
      setAnalysis(fallbackAnalysis)
      setCareerPath(fallbackAnalysis.career_roadmap)
      setCurrentJobIndex(0)
      setSavedJobs([])
      setNotNowJobs([])
      setActivePage('jobs')
      setError(analysisError.message || 'Using fallback demo data because the API is unavailable.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (event) => {
    const [file] = event.target.files || []
    if (!file) return

    setFileName(file.name)
    file.text().then((content) => {
      setCvText(content)
    })
  }

  const handleDecision = async (job, action) => {
    if (!job) return

    const swipeDirection = action === 'save' ? 'right' : 'left'
    setSwipeState(swipeDirection)

    globalThis.setTimeout(async () => {
      if (action === 'save') {
        setSavedJobs((items) => appendUniqueJob(items, job))
        await saveJob(job)
      } else {
        setNotNowJobs((items) => appendUniqueJob(items, job))
        await rejectJob(job)
      }

      setCurrentJobIndex((index) => index + 1)
      setSwipeState(null)
    }, 240)
  }

  const renderUploadView = () => (
    <UploadPanel
      fileName={fileName}
      loading={loading}
      onFileChange={handleFileChange}
      onAnalyze={handleAnalyze}
      error={error}
    />
  )

  const renderJobsView = () => (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">Swipe deck</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Review jobs one by one</h2>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            {currentJobIndex + 1} / {Math.max(currentJobs.length, 1)}
          </div>
        </div>

        <div className="mt-6 min-h-136 rounded-4xl bg-slate-50 p-4 sm:p-6">
          {activeJob ? (
            <div className="relative mx-auto h-116 max-w-xl">
              <div className="absolute inset-x-0 bottom-4 top-10 rounded-[1.75rem] border border-slate-200 bg-white/70 p-5 opacity-60 shadow-sm blur-[0.2px] translate-y-4 scale-[0.97]">
                <p className="text-sm font-semibold text-slate-400">Next up</p>
                <div className="mt-3 h-4 w-40 rounded-full bg-slate-200" />
                <div className="mt-4 space-y-3">
                  <div className="h-3 w-full rounded-full bg-slate-200" />
                  <div className="h-3 w-5/6 rounded-full bg-slate-200" />
                  <div className="h-3 w-2/3 rounded-full bg-slate-200" />
                </div>
              </div>
              <JobFlashcard
                job={activeJob}
                isActive
                direction={swipeState}
                onSave={(job) => handleDecision(job, 'save')}
                onReject={(job) => handleDecision(job, 'not_now')}
              />
            </div>
          ) : (
            <div className="flex h-116 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-300 bg-white text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">Deck complete</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">You reached the end of the current job stack.</h3>
              <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600">
                Move to Saved Jobs, Not For Now, or Career Path to continue the demo narrative.
              </p>
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-4xl border border-blue-200 bg-blue-950 p-6 text-white shadow-[0_16px_38px_rgba(30,64,175,0.2)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">AI summary</p>
          <h3 className="mt-3 text-2xl font-semibold">{analysis.predicted_role}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-300">{analysis.market_insight}</p>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200/80">Extracted skills</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {formatSkills(analysis.extracted_skills).map((skill) => (
                <span key={skill} className="rounded-full bg-blue-900/50 px-3 py-1 text-sm text-blue-50">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Action history</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>Saved jobs: {savedJobs.length}</p>
            <p>Not for now: {notNowJobs.length}</p>
            <p>Current index: {currentJobIndex}</p>
            <p className="text-blue-700">Swipe right = Save, Swipe left = Not for now</p>
          </div>
        </div>
      </aside>
    </section>
  )

  const renderSavedView = () => (
    <section className="rounded-4xl border border-slate-200 bg-white/95 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">Saved jobs</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Jobs marked for follow-up</h2>
        </div>
        <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">{savedJobs.length} saved</span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {savedJobs.length > 0 ? (
          savedJobs.map((job) => (
            <HistoryCard key={`${job.title}-${job.match_score}`} job={job} tone={{ label: 'Saved', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' }} />
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600 md:col-span-2 xl:col-span-3">
            No saved jobs yet. Analyze a CV and save the matches you want to keep.
          </div>
        )}
      </div>
    </section>
  )

  const renderNotNowView = () => (
    <section className="rounded-4xl border border-slate-200 bg-white/95 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">Not For Now</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Roles parked for later</h2>
        </div>
        <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">{notNowJobs.length} not for now</span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {notNowJobs.length > 0 ? (
          notNowJobs.map((job) => (
            <HistoryCard key={`${job.title}-${job.match_score}`} job={job} tone={{ label: 'Not For Now', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' }} />
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600 md:col-span-2 xl:col-span-3">
            No "not for now" roles yet. Swipe left on any job you want to revisit later.
          </div>
        )}
      </div>
    </section>
  )

  const renderCareerView = () => (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-4xl border border-slate-200 bg-white/95 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">Career path</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Recommended roadmap</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          This roadmap is generated from the strongest job matches and the skills your profile still needs to close.
        </p>

        <div className="mt-6 rounded-[1.75rem] bg-blue-950 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Current role signal</p>
          <p className="mt-2 text-2xl font-semibold">{analysis.predicted_role}</p>
          <p className="mt-2 text-sm leading-7 text-slate-300">{analysis.market_insight}</p>
        </div>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
        <Timeline steps={careerPath?.length ? careerPath : fallbackAnalysis.career_roadmap} />
      </div>
    </section>
  )

  let content = renderCareerView()
  if (activePage === 'upload') {
    content = renderUploadView()
  } else if (activePage === 'jobs') {
    content = renderJobsView()
  } else if (activePage === 'saved') {
    content = renderSavedView()
  } else if (activePage === 'not-now') {
    content = renderNotNowView()
  }

  return (
    <PageFrame activePage={activePage} onNavigate={setActivePage} stats={stats}>
      <div className="space-y-6 animate-rise-in">{content}</div>

      {activePage === 'jobs' && isDeckFinished ? (
        <div className="mt-6 rounded-[1.75rem] border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-medium text-blue-900">
          The current deck is complete. Review saved jobs, Not For Now, or open Career Path to continue.
        </div>
      ) : null}
    </PageFrame>
  )
}

export default App
