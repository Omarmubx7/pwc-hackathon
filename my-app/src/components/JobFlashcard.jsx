import PropTypes from 'prop-types'

function JobFlashcard({ job, isActive, direction, onSave, onReject }) {
  return (
    <article
      className={[
        'absolute inset-0 rounded-4xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-500 ease-in-out',
        isActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-70 translate-y-2 scale-[0.98]',
        direction === 'left' ? '-translate-x-10 -rotate-6 opacity-0' : '',
        direction === 'right' ? 'translate-x-10 rotate-6 opacity-0' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">Job Match</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">{job.title}</h3>
        </div>
        <div className="rounded-2xl bg-slate-900 px-4 py-3 text-right text-white shadow-lg shadow-slate-900/20">
          <div className="text-[10px] uppercase tracking-[0.28em] text-slate-300">Match</div>
          <div className="text-2xl font-bold">{job.match_score}%</div>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Matching Skills</div>
          <div className="flex flex-wrap gap-2">
            {(job.matching_skills || []).map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Missing Skills</div>
          <div className="flex flex-wrap gap-2">
            {(job.missing_skills || []).map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
              >
                {skill}
              </span>
            ))}
            {(!job.missing_skills || job.missing_skills.length === 0) && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600">
                Strong match
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onReject(job)}
          className="rounded-2xl bg-blue-100 px-4 py-3 font-semibold text-blue-700 transition duration-200 ease-in-out hover:bg-blue-200 active:scale-95"
        >
          Not for now
        </button>
        <button
          type="button"
          onClick={() => onSave(job)}
          className="rounded-2xl bg-blue-700 px-4 py-3 font-semibold text-white transition duration-200 ease-in-out hover:bg-blue-800 active:scale-95"
        >
          Save
        </button>
      </div>
    </article>
  )
}

JobFlashcard.propTypes = {
  job: PropTypes.shape({
    title: PropTypes.string.isRequired,
    match_score: PropTypes.number.isRequired,
    matching_skills: PropTypes.arrayOf(PropTypes.string),
    missing_skills: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  direction: PropTypes.oneOf(['left', 'right', null]),
  onSave: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
}

JobFlashcard.defaultProps = {
  direction: null,
}

export default JobFlashcard
