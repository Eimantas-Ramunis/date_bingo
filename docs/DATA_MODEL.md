SQLite Schema (suggested)

ideas
	•	id TEXT PK
	•	title TEXT
	•	short_description TEXT
	•	vibes_json TEXT
	•	purpose_tags_json TEXT
	•	energy TEXT
	•	season_tags_json TEXT
	•	radius TEXT
	•	duration_min INTEGER
	•	duration_max INTEGER
	•	budget_min INTEGER
	•	budget_max INTEGER
	•	prep_checklist_json TEXT
	•	plan_b_json TEXT (required)
	•	cooldown_days INTEGER DEFAULT 45
	•	last_done_at TEXT NULL
	•	is_active INTEGER DEFAULT 1
	•	created_at TEXT
	•	updated_at TEXT

planned_dates
	•	id TEXT PK
	•	idea_id TEXT FK
	•	status TEXT (planned, hint_sent, reveal_sent, plan_b_active, deferred, done)
	•	hint_json TEXT
	•	reveal_json TEXT
	•	veto_json TEXT NULL
	•	created_at TEXT
	•	updated_at TEXT

Constraint: only one row is “current” (either via a settings.current_planned_date_id pointer or by status uniqueness).

tokens
	•	token_hash TEXT PK (store hash, not raw token)
	•	planned_date_id TEXT FK
	•	type TEXT (hint|reveal)
	•	expires_at TEXT
	•	revoked_at TEXT NULL
	•	created_at TEXT

events
	•	id TEXT PK
	•	planned_date_id TEXT FK
	•	type TEXT (done|deferred|veto)
	•	payload_json TEXT
	•	created_at TEXT

bingo_state (optional; can also be computed from events)
	•	id TEXT PK
	•	earned_json TEXT
	•	updated_at TEXT

admin_users
	•	id TEXT PK
	•	username TEXT UNIQUE
	•	password_hash TEXT
	•	created_at TEXT

⸻

Migration strategy
	•	Use migration files in /server/migrations
	•	Never edit old migrations; add new ones

⸻
