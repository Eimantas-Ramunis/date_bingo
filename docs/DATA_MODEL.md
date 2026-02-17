# Data Model (Prisma)

## `DateIdea`
Core idea catalog entry.

Key JSON-string fields:
- `vibes`
- `purposeTags`
- `seasonTags`
- `prepChecklist` (Plan A date flow steps)
- `planB` (Plan B details and steps)
- `planAPrepItems` (Plan A preparation items template)
- `planBPrepItems` (Plan B preparation items template)

Other notable fields:
- `image`
- `cooldownDays`
- `lastDoneAt`

## `PlannedDate`
Active or historical selected plan.

Key fields:
- `planASteps` (cached Plan A flow)
- `planBSteps` (cached Plan B flow)
- `planBTitle`
- `planBDesc`
- `status`
- `planBActive`

Prep board fields (active-plan progress only):
- `planAPrepBoard` (JSON array of `{ id, text, status }`)
- `planBPrepBoard` (JSON array of `{ id, text, status }`)

Prep status values:
- `to_do`
- `doing`
- `done`

## `Token`
Receiver/admin share links (hash-only storage).

## `BingoTile`
Earned bingo state.

## `AppSetting`
Encrypted/config settings storage (AI key + model overrides).

## `IdeaMedia`
Per-idea image history (uploaded and AI generated).

## Migration Notes
Latest migration for this feature:
- `server/prisma/migrations/20260217175242_prep_plan_workflow/migration.sql`

Adds:
- `DateIdea.planAPrepItems`
- `DateIdea.planBPrepItems`
- `PlannedDate.planAPrepBoard`
- `PlannedDate.planBPrepBoard`
