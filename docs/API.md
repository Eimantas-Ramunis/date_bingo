# API

## Conventions
- Base path: `/api`
- JSON request/response
- Admin endpoints require session auth (`datebingo_sid` cookie)
- Receiver endpoints use token payloads

## Ideas
- `GET /api/ideas`
- `POST /api/ideas` (multipart; supports image)
- `PUT /api/ideas/:id` (multipart; supports image)
- `DELETE /api/ideas/:id`
- `GET /api/ideas/:id/media`
- `GET /api/ideas/:id/media/auto-prompt`
- `POST /api/ideas/:id/media/generate`
- `POST /api/ideas/:id/media/select`
- `POST /api/ideas/:id/prep/generate/plan-a`
- `POST /api/ideas/:id/prep/generate/plan-b`

### Idea prep fields
- `planAPrepItems: string[]` (idea-level editable preparation list)
- `planBPrepItems: string[]` (idea-level editable preparation list)

## Planning
- `GET /api/planning/current`
- `GET /api/planning/ideas`
- `GET /api/planning/suggest`
- `POST /api/planning/select`
- `PATCH /api/planning/:id/prep-item-status`
- `POST /api/planning/token`
- `POST /api/planning/preview-token`
- `GET /api/planning/history`
- `POST /api/planning/:id/done`
- `DELETE /api/planning/:id`

### Prep board status update
`PATCH /api/planning/:id/prep-item-status`

Body:
```json
{
  "planType": "A",
  "itemId": "uuid",
  "status": "doing"
}
```

Constraints:
- `planType`: `"A" | "B"`
- `status`: `"to_do" | "doing" | "done"`

Response:
```json
{
  "planAPrepBoard": [{ "id": "...", "text": "...", "status": "to_do" }],
  "planBPrepBoard": [{ "id": "...", "text": "...", "status": "done" }]
}
```

## AI
- `POST /api/ai/draft`
- `POST /api/ai/rewrite-teaser`

### Draft output additions
`POST /api/ai/draft` now includes:
- `planAPrepItems: string[]`
- `planBPrepItems: string[]`

Existing fields (`prepChecklist`, `planB.steps`) are unchanged.

## Settings
- `GET /api/settings/ai`
- `PUT /api/settings/ai`
- `POST /api/settings/ai/test`

## Receiver
- `GET /api/receiver?token=...`
- `POST /api/receiver/veto`

## Bingo
- `GET /api/bingo`
- `POST /api/bingo/reset`
