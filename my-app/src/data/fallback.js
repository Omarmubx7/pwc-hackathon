export const fallbackAnalysis = {
  extracted_skills: ['React', 'JavaScript', 'HTML', 'CSS', 'SQL', 'Communication'],
  predicted_role: 'Frontend Developer',
  job_matches: [
    {
      title: 'Frontend Developer',
      match_score: 94,
      matching_skills: ['React', 'JavaScript', 'HTML', 'CSS'],
      missing_skills: ['TypeScript', 'Testing'],
    },
    {
      title: 'Data Analyst',
      match_score: 88,
      matching_skills: ['SQL'],
      missing_skills: ['Python', 'Excel', 'Power BI', 'Statistics'],
    },
    {
      title: 'Product Analyst',
      match_score: 81,
      matching_skills: ['SQL', 'Communication'],
      missing_skills: ['Experiment Design', 'Dashboarding', 'Python'],
    },
    {
      title: 'Backend Developer',
      match_score: 76,
      matching_skills: ['SQL'],
      missing_skills: ['Python', 'Django', 'REST APIs', 'Docker'],
    },
    {
      title: 'AI Engineer',
      match_score: 70,
      matching_skills: [],
      missing_skills: ['Python', 'Machine Learning', 'LLM', 'PyTorch'],
    },
  ],
  career_roadmap: [
    'Build one portfolio project that combines React with a data-backed dashboard.',
    'Add TypeScript and testing to close the largest front-end skill gaps.',
    'Tailor your CV for product-facing frontend roles and show measurable impact.',
  ],
  market_insight:
    'Frontend Developer shows the strongest blend of skill overlap and market demand in the current job set.',
}
