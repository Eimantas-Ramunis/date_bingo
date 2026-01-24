# Agents & Context

## Project Goals
"Date Bingo" is a self-hosted tool to help reduce relationship burnout by planning dates proactively. It prioritizes privacy (local DB), simplicity (admin/receiver roles), and low friction (tokenized links).

## Sensitive Data Handling
- **Tokens:** Never log raw tokens. Store only hashes.
- **Passwords:** Store only Argon2 hashes.
- **API Keys:** `GEMINI_API_KEY` stays on the server. Never expose to client.

## Testing & Verification
- **Manual QA:**
  1. Login as admin/admin123.
  2. Create a Date Idea (or use seeded).
  3. "Suggest 3" -> Select one -> Enter Hint details.
  4. Copy Hint Link -> Open in Incognito -> Verify it loads (Hint view).
  5. Copy Reveal Link -> Open in Incognito -> Verify it loads (Reveal view).
  6. Click "Veto" on Reveal -> Verify Plan B shows.
  7. In Admin, Mark Done -> Verify Bingo board updates.

## Architecture
- Node.js/Express Backend
- React Frontend
- SQLite Database (Prisma)
- Docker Deployment

## Build Instructions
1. `docker compose up -d --build`
2. Access at `http://localhost:3000`