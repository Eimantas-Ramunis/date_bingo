# Date Bingo

## Project Overview
"Date Bingo" is a web-based application designed to help couples plan and execute "anti-burnout, connection-first" dates. It features an Admin UI for the planner (curating ideas, scheduling) and a Receiver UI for the partner (viewing hints/reveals).

**Current Status:** The project currently exists as a **standalone, client-side prototype** contained within a single `index.html` file. While the documentation (`docs/`) and `README.md` describe a full-stack architecture (Docker, SQLite, Backend API), these components are not currently present in the file structure. The prototype simulates backend features (persistence, logic) using browser `localStorage`.

## Tech Stack
*   **Frontend:** HTML5, React 18 (via CDN), Tailwind CSS (via CDN), Lucide React (Icons).
*   **Logic:** In-browser JavaScript (Babel standalone).
*   **Persistence:** `localStorage` (simulating a database).
*   **AI:** Google Gemini API (integrated directly in frontend code).

## Key Files
*   `index.html`: The complete application logic and UI. Contains the React components, state management, and Gemini API integration.
*   `docs/`: Contains architectural design documents (`PRD.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`) describing the intended full-stack implementation.
*   `README.md`: Project introduction and instructions (Note: Docker instructions are currently not applicable to the `index.html` prototype).
*   `.env.example`: Template for environment variables (referenced by the intended backend).

## Setup & Usage (Prototype)
1.  **Run the App:** Simply open `index.html` in a modern web browser. No build step or server is required for basic functionality.
2.  **AI Configuration:** To enable Gemini AI features (Idea Generation, Hint Rewriting):
    *   Open `index.html` in a text editor.
    *   Locate the line: `const apiKey = ""; // Provided by runtime environment`
    *   Insert a valid Gemini API key.
3.  **Data Reset:** Since data is stored in `localStorage`, clearing browser data or running `localStorage.clear()` in the console will reset the app.

## Development Conventions
*   **Single File Component:** All code (React components, styles, logic) resides in `index.html`.
*   **No Build Tools:** The project relies on CDN imports. Do not use `npm` or `import` statements requiring a bundler unless migrating to a full build system.
*   **Mocking:** Backend features (like database queries) are mocked within the React `useEffect` hooks and state initialization.

## Roadmap Note
The current `index.html` serves as a high-fidelity prototype ("v1.1 AI") validating the UX described in `docs/PRD.md`. Future development is expected to migrate this logic to the server-side architecture described in `docs/ARCHITECTURE.md`.
