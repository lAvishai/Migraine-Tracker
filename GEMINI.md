# Migraine Tracker - Agent Guidelines & Instructions

## 1. Mandatory Versioning Rule
**Every code modification or feature change MUST bump the version in `package.json`:**
* **Patch bump** (e.g. `1.0.0` -> `1.0.1`): For bug fixes, minor UI adjustments, styling tweaks, refactoring.
* **Minor bump** (e.g. `1.0.1` -> `1.1.0`): For new features, new components, or significant functional improvements.
* **Major bump** (e.g. `1.1.0` -> `2.0.0`): For breaking architectural changes.

> **Note:** `src/types.ts` dynamically imports `version` from `package.json`. Bumping `package.json` automatically updates the About modal popup, user dropdown menu, and all UI version badges across the entire application.

---

## 2. Commit & Deployment Conventions
* Reference the new version in commit messages when relevant (e.g., `feat: ... (v1.0.1)`).
* Verify that `npm run lint` and `npm run build` pass before completing tasks.
* Deployments are handled via GitHub Actions to GitHub Pages (`main` branch).

---

## 3. Architecture & Tech Stack Guidelines
* **Framework:** React 19 + Vite + TypeScript.
* **Styling:** Tailwind CSS with custom eye-comfort dark palette (`warm-dark`, `warm-card`, `warm-border`, `warm-text`, `sunset`, `sage`). Maintain soothing low-contrast styling suitable for migraine sufferers.
* **Direction:** RTL by default (Hebrew interface).
* **Authentication & Sync:** Direct Google Identity Services (GIS) via `src/lib/googleAuth.ts` and Google Drive REST API v3 via `src/lib/googleDriveSync.ts`.
* **Local Persistence:** All logs persist primarily in browser `localStorage` (`migraine_logs`).
