# Date Bingo

A self-hosted web app for planning dates, designed for Raspberry Pi.

## Features
- **Admin Dashboard:** Manage ideas, plan dates, track bingo progress.
- **Receiver Links:** Tokenized, secure links for Hints and Reveals (Lithuanian UI).
- **AI Integration:** Google Gemini helps generate ideas and write teasers.
- **Offline-First:** SQLite database, local hosting.

## Quick Start (Docker)

1. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env and set your GEMINI_API_KEY and SESSION_SECRET
   ```

2. **Run:**
   ```bash
   docker compose up -d --build
   ```

3. **Access:**
   - **Admin:** `http://localhost:3000/admin`
     - Default Login: `admin` / `admin123`
   - **Receiver:** `http://localhost:3000` (shows neutral message until a link is generated)

## Manual Setup (Dev)

**Server:**
```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed  # Creates admin user
npm run dev
```

**Client:**
```bash
cd client
npm install
npm run dev
```

## Security Note
This app is designed to be port-forwarded.
- **Rate Limiting:** Enabled by default.
- **Auth:** Admin protected by session cookie.
- **Tokens:** Links use 32-byte random tokens, hashed in DB.

## Tech Stack
- **Backend:** Node.js, Express, Prisma, SQLite
- **Frontend:** React, Vite, Tailwind CSS
- **Container:** Docker (Multi-stage build)
