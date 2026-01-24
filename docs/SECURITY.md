Threat Model (pragmatic)

You will port-forward externally. Even if “no sensitive info,” the app should avoid becoming a nuisance endpoint.

Threats
	•	Random scanning / brute forcing URLs
	•	Token leakage from logs or screenshots
	•	Admin password guessing
	•	Abuse of AI endpoints (cost/rate)

Controls (MVP)
	1.	Token entropy
	•	128-bit+ random token (e.g., 32+ chars URL-safe)
	2.	Rate limiting
	•	Global per-IP limit (e.g., 60 req/min)
	•	Stricter on receiver token endpoints (e.g., 20 req/min)
	•	Stricter on AI endpoints (e.g., 10 req/min) and Admin-only
	3.	Token redaction
	•	Never log raw tokens
	•	Redact tokens in request logs and error logs
	4.	Admin login
	•	Password stored hashed (argon2/bcrypt)
	•	Session cookie HttpOnly
	5.	CORS
	•	Locked down if using separate origins; otherwise same-origin only

Recommended “almost-free” hardening (optional)
	•	Use a reverse proxy (Traefik) to add HTTPS + basic auth on /admin
	•	Use a non-standard forwarded port
	•	Restrict Admin path by IP allowlist if possible