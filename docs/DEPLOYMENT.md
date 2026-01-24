MVP Deployment (Docker on RPi)

Containers
	•	app (backend + frontend served)
	•	volume for SQLite database

Environment Variables

See .env.example:
	•	BASE_URL (public URL including port, used to generate links)
	•	DB_PATH (e.g., /data/datebingo.sqlite)
	•	ADMIN_USERNAME
	•	ADMIN_PASSWORD (only used for initial bootstrap; stored hashed)
	•	TOKEN_TTL_HOURS_HINT (default 72)
	•	TOKEN_TTL_HOURS_REVEAL (default 72)
	•	RATE_LIMIT_*
	•	AI_ENABLED=true/false
	•	AI_PROVIDER=gemini
	•	GEMINI_API_KEY
	•	AI_OUTPUT_LANGUAGE=lt (enforced)
	•	LOG_LEVEL

External Access

You’re port-forwarding:
	•	Forward router external port → RPi container port
	•	Set BASE_URL accordingly (domain/ip + port)

Strongly recommended minimal safety:
	•	Use a random external port
	•	Keep receiver tokens long
	•	Redact tokens from logs (mandatory)
	•	Rate limit receiver endpoints

Admin exposure
	•	You can expose /admin too, but it’s safer to:
	•	keep admin behind login (mandatory)
	•	optionally add reverse-proxy basic auth (optional)