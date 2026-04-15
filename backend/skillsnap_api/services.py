import json
import os
from collections import Counter
from urllib.error import URLError
from urllib.request import Request, urlopen

from django.db import connection


SKILL_ALIASES = {
    "python": "Python",
    "sql": "SQL",
    "excel": "Excel",
    "power bi": "Power BI",
    "tableau": "Tableau",
    "postgresql": "PostgreSQL",
    "react": "React",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "html": "HTML",
    "css": "CSS",
    "django": "Django",
    "node": "Node.js",
    "node.js": "Node.js",
    "express": "Express",
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "nlp": "NLP",
    "llm": "LLM",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "data analysis": "Data Analysis",
    "statistics": "Statistics",
    "git": "Git",
    "docker": "Docker",
    "aws": "AWS",
    "azure": "Azure",
    "communication": "Communication",
    "problem solving": "Problem Solving",
    "api": "API Development",
    "rest": "REST APIs",
}

ROLE_KEYWORDS = {
    "Data Analyst": {"Python", "SQL", "Excel", "Power BI", "Tableau", "Statistics", "Data Analysis"},
    "Frontend Developer": {"React", "JavaScript", "TypeScript", "HTML", "CSS"},
    "Backend Developer": {"Python", "Django", "Node.js", "Express", "PostgreSQL", "REST APIs", "API Development"},
    "AI Engineer": {"Python", "Machine Learning", "Deep Learning", "NLP", "LLM", "PyTorch", "TensorFlow"},
}


def _normalize_skill(skill):
    cleaned = (skill or "").strip().lower()
    return SKILL_ALIASES.get(cleaned)


def extract_skills_from_text(cv_text):
    text = (cv_text or "").lower()
    found = set()

    for key, canonical in SKILL_ALIASES.items():
        if key in text:
            found.add(canonical)

    return sorted(found)


def normalize_provided_skills(skills):
    normalized = set()
    for skill in skills or []:
        mapped = _normalize_skill(skill)
        if mapped:
            normalized.add(mapped)
        elif isinstance(skill, str) and skill.strip():
            normalized.add(skill.strip())
    return sorted(normalized)


def infer_role(skills):
    if not skills:
        return "Generalist"

    skill_set = set(skills)
    scores = {}

    for role, keywords in ROLE_KEYWORDS.items():
        overlap = len(skill_set.intersection(keywords))
        coverage = overlap / max(len(keywords), 1)
        scores[role] = overlap + coverage

    best_role, best_score = max(scores.items(), key=lambda item: item[1])
    if best_score <= 0:
        return "Generalist"
    return best_role


def fetch_jobs_from_db():
    with connection.cursor() as cursor:
        cursor.execute("SELECT id, title, skills, demand_score FROM jobs")
        rows = cursor.fetchall()

    jobs = []
    for row in rows:
        jobs.append(
            {
                "id": row[0],
                "title": row[1],
                "skills": row[2] or [],
                "demand_score": int(row[3]),
            }
        )
    return jobs


def _score_match(candidate_skills, job_skills, demand_score):
    candidate_set = set(candidate_skills)
    job_set = set(job_skills)

    overlap = sorted(candidate_set.intersection(job_set))
    missing = sorted(job_set - candidate_set)

    overlap_ratio = len(overlap) / max(len(job_set), 1)
    demand_ratio = max(min(demand_score, 10), 1) / 10

    weighted_score = (overlap_ratio * 0.75) + (demand_ratio * 0.25)
    match_score = int(round(weighted_score * 100))

    return match_score, overlap, missing


def build_career_roadmap(predicted_role, top_matches):
    if not top_matches:
        return [
            "Build a baseline portfolio with one project in your target domain.",
            "Add two in-demand technical skills from local market job posts.",
            "Apply weekly to relevant entry roles and track feedback to refine your profile.",
        ]

    missing_counter = Counter()
    for job in top_matches:
        missing_counter.update(job["missing_skills"])

    top_missing = [skill for skill, _ in missing_counter.most_common(3)]

    step_1 = f"Strengthen your {predicted_role} profile with one portfolio project aligned to real business problems."

    if top_missing:
        step_2 = "Close the most common skill gaps: " + ", ".join(top_missing) + "."
    else:
        step_2 = "Deepen your strongest tools by building advanced, production-style projects."

    target_job = top_matches[0]["title"]
    step_3 = f"Tailor your CV for {target_job} roles and apply with measurable project outcomes and quantified impact."

    return [step_1, step_2, step_3]


def build_market_insight(top_matches):
    if not top_matches:
        return "Market signal unavailable until job demand data is loaded."

    best = top_matches[0]
    return (
        f"{best['title']} currently shows the strongest market-adjusted fit, "
        f"with demand-aware score {best['match_score']} and clear upskilling targets."
    )


def try_llm_skill_extraction(cv_text):
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key or not (cv_text or "").strip():
        return []

    base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    payload = {
        "model": model,
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": "Extract only practical technical/professional skills from CV text. Return JSON: {\"skills\": [\"...\"]}",
            },
            {
                "role": "user",
                "content": cv_text,
            },
        ],
    }

    req = Request(
        url=f"{base_url}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return normalize_provided_skills(parsed.get("skills", []))
    except (URLError, KeyError, ValueError, TimeoutError):
        return []


def run_match_pipeline(cv_text, skills):
    provided_skills = normalize_provided_skills(skills)
    extracted = extract_skills_from_text(cv_text)

    llm_skills = try_llm_skill_extraction(cv_text)
    merged_skills = sorted(set(provided_skills).union(extracted).union(llm_skills))

    predicted_role = infer_role(merged_skills)

    jobs = fetch_jobs_from_db()
    matches = []
    for job in jobs:
        match_score, matching_skills, missing_skills = _score_match(
            merged_skills, job["skills"], job["demand_score"]
        )
        matches.append(
            {
                "title": job["title"],
                "match_score": match_score,
                "matching_skills": matching_skills,
                "missing_skills": missing_skills,
            }
        )

    top_matches = sorted(matches, key=lambda item: item["match_score"], reverse=True)[:5]

    return {
        "extracted_skills": merged_skills,
        "predicted_role": predicted_role,
        "job_matches": top_matches,
        "career_roadmap": build_career_roadmap(predicted_role, top_matches),
        "market_insight": build_market_insight(top_matches),
    }
