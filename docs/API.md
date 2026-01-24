Conventions
	•	JSON request/response
	•	Errors return: { error: { code, message } }
	•	Admin endpoints require session auth
	•	Receiver endpoints require token

⸻

Admin Endpoints

Ideas
	•	GET /api/admin/ideas
	•	POST /api/admin/ideas
	•	PUT /api/admin/ideas/:id
	•	DELETE /api/admin/ideas/:id

Planning
	•	POST /api/admin/plan/suggest
	•	Input: optional constraints { budgetCap, energy, radius, seasonTags, purposeTags, vibes }
	•	Output: { candidates: [ideaSummary...] }
	•	POST /api/admin/plan/select
	•	Input: { ideaId }
	•	Output: { plannedDate }
	•	GET /api/admin/plan/next
	•	Output: { plannedDate | null }

Tokens / Links
	•	POST /api/admin/plan/token/hint
	•	POST /api/admin/plan/token/reveal
	•	Output: { url } (constructed with BASE_URL + path)

Completion
	•	POST /api/admin/plan/done
	•	Input: { plannedDateId, toggles: { touchDone, noPhones60, laughed, honestSentence, newThing }, rating?, notes? }

AI (Admin-only)
	•	POST /api/admin/ai/generate-idea
	•	Input: { promptSeed?, constraints? }
	•	Output: { draftIdea } (LT by default or bilingual as configured)
	•	POST /api/admin/ai/rewrite-hint
	•	Input: { hint, contextTags }
	•	Output: { teaserLt, dressCodeLt?, durationTextLt? }
	•	POST /api/admin/ai/rewrite-description
	•	Input: { text, target: 'LT'|'EN', style: 'short'|'cozy'|'playful' }

⸻

Receiver Endpoints (token-based)

Hint view data
	•	GET /api/r/:token
	•	Token resolves to either hint or reveal payload depending on token type.
	•	Output (Hint):

    {
  "mode": "HINT",
  "startTimeWindow": "Rytoj 12:00–18:00",
  "dressCode": "Šilta apranga, batai",
  "duration": "~4 val.",
  "teaserLine": "Maža išvyka + jaukus vakaras.",
  "canVeto": false
    }

    Reveal view data
	•	Output (Reveal):

    {
  "mode": "REVEAL",
  "planA": { "title": "...", "steps": ["..."] },
  "planB": { "title": "...", "steps": ["..."] },
  "planBActive": false,
  "canVeto": true
    }

    Veto
	•	POST /api/r/:token/veto
	•	Input: { reason: "too_tired" | "too_cold" | "not_social" | "not_today" }
	•	Output: reveal payload with planBActive=true
	•	Important: Plan A summary returned after veto must be generic/de-hyped.