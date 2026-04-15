CREATE TABLE IF NOT EXISTS jobs (
	id SERIAL PRIMARY KEY,
	title VARCHAR(255) NOT NULL,
	skills TEXT[] NOT NULL,
	demand_score INTEGER NOT NULL CHECK (demand_score BETWEEN 1 AND 10)
);

INSERT INTO jobs (title, skills, demand_score)
VALUES
	('Data Analyst', ARRAY['Python', 'SQL', 'Excel', 'Power BI', 'Statistics'], 9),
	('Frontend Developer', ARRAY['React', 'JavaScript', 'HTML', 'CSS', 'Git'], 8),
	('Backend Developer', ARRAY['Python', 'Django', 'PostgreSQL', 'REST APIs', 'Docker'], 8),
	('AI Engineer', ARRAY['Python', 'Machine Learning', 'Deep Learning', 'NLP', 'PyTorch'], 10),
	('MLOps Engineer', ARRAY['Python', 'Docker', 'AWS', 'Azure', 'Machine Learning'], 9)
ON CONFLICT DO NOTHING;
