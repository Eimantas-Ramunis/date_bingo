Product Requirements Document (PRD)

Problem

Weekends—especially Saturdays—can become emotionally heavy due to burnout, anxiety, and unstructured time. This can trigger withdrawal (“blanket mode”) and compound the feeling of being “roommates” rather than spouses.

Goal

Create a lightweight system that:
	•	reduces unstructured-time spirals via gentle structure,
	•	increases connection and passion through repeatable rituals (touch + feeling seen),
	•	preserves surprise while giving the Admin prep time,
	•	avoids shifting mental load to the Receiver.

Users
	•	Admin/Planner: curates deck, selects plans, sends links, marks done.
	•	Receiver: sees hint/reveal, may veto, can open neutral home screen without link.

Success Criteria
	•	Admin can plan a date in ≤ 2 minutes.
	•	Receiver sees hint/reveal in ≤ 1 tap.
	•	Veto immediately yields a viable Plan B, without guilt.
	•	Adding a new idea takes ≤ 90 seconds.
	•	Bingo updates automatically on “Done”.
	•	Receiver never sees the full deck/candidates.

MVP Scope

Must-have
	•	Idea Deck CRUD (Admin)
	•	Suggest 3 (Admin, private) + choose 1 “Next Planned Date”
	•	Generate Hint link (T-1) and Reveal link (day-of)
	•	Receiver hint/reveal pages (LT)
	•	Veto + Plan B activation
	•	History log + 3×3 Bingo board
	•	Admin-only AI helpers (Gemini): generate idea drafts, rewrite hint teaser, rewrite description

Non-goals (MVP)
	•	Multiple planned dates
	•	Calendar UI + Google Calendar sync
	•	Weather API integration
	•	Notifications / reminders
	•	Multi-user accounts

Key Design Decisions
	•	Receiver link access is token-only (unguessable URL).
	•	Admin requires login (app-level).
	•	External access via port-forwarding is allowed; app includes token entropy + rate limit to reduce risk.
	•	Receiver UI in Lithuanian; Admin UI in English.
	•	All AI features Admin-only. Gemini outputs Lithuanian for Receiver-facing content.