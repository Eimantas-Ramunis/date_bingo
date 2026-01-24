High-Level Architecture

Components
	1.	Backend API (server)
	•	SQLite persistence
	•	Business logic (planning, link tokens, veto, history, bingo)
	•	AI provider proxy (Gemini now; interface supports others later)
	•	Rate limiting + logging
	2.	Frontend
	•	Admin UI (EN): deck management, plan flow, AI tools
	•	Receiver UI (LT): hint/reveal only; minimal, no deck access
	•	Neutral Receiver home screen (LT/neutral): “Viskas gerai — lauk nuorodos” message

Storage
	•	SQLite DB stored on persistent volume
	•	Tables: ideas, planned_date, tokens, events/history, bingo_state (or computed), settings

External Access
	•	Port-forwarded service (HTTP). Recommended: add TLS via reverse proxy later.
	•	Admin and Receiver share one host, separated by routes and auth.

⸻

State Machine

Core states
	•	PLANNED: Admin selected Plan A for Next Planned Date.
	•	HINT_SENT: hint link created (and optionally shared).
	•	REVEAL_SENT: reveal link created.
	•	VETOED / PLAN_B_ACTIVE: receiver vetoed; Plan B activated for this run.
	•	DONE: Admin marked completed; bingo + history updated.
	•	DEFERRED: Plan A deferred due to veto (kept for future, not “failed”).

Transitions
	•	Suggest → Select → PLANNED
	•	Generate Hint Token → HINT_SENT
	•	Generate Reveal Token → REVEAL_SENT
	•	Receiver Veto → PLAN_B_ACTIVE (+ Plan A set to DEFERRED)
	•	Mark Done → DONE

⸻

Token Model

Token types
	•	HINT: accessible T-1; shows hint card only
	•	REVEAL: accessible day-of; shows reveal card and veto action

Token behavior
	•	Tokens reference a planned_date_id and a token type
	•	Tokens are opaque random strings (no readable data)
	•	Tokens have TTLs (configurable), default:
	•	Hint: 72 hours
	•	Reveal: 72 hours
	•	Tokens can be revoked when a new “Next Planned Date” is chosen

Receiver privacy
	•	Receiver never sees:
	•	deck list
	•	suggestion candidates
	•	admin notes
	•	AI controls