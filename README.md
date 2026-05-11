# Life Tracker

A private, single-page dashboard for tracking all areas of life.

Hierarchy: **Areas → Projects → Tasks**, with an update log on every item, a separate quick-capture **To-Dos** section, and a global update log.

## How to run

This is a static site — no build, no server.

- **Locally**: open `index.html` in a browser, or run `python3 -m http.server` in this directory and visit `http://localhost:8000`.
- **Hosted**: works on GitHub Pages or any static host. Push and enable Pages on the branch.

## First run

You'll be asked to set a passcode. The SHA-256 hash is stored in `localStorage` on this device — keep the passcode somewhere safe; it can't be recovered.

## Features

- Add Areas, Projects (under an area), and Tasks (under a project)
- Mark tasks done / reopen
- Add free-form **updates** to any area, project, or task — each item shows its own update log
- Dashboard with progress across all areas; click into any area / project / task for a focused view
- Quick-capture **To-Dos** section, separate from project tasks
- Global **Update Log** view
- **Export current view as PDF** (visual snapshot)
- **Export current view as PPT** (.pptx with tables and summaries per slide)
- **Export all data as Excel** (.xlsx with Areas / Projects / Tasks / Updates / ToDos sheets)
- Passcode lock screen + Lock button in sidebar

## Privacy

All data lives in your browser's `localStorage`. Nothing is sent anywhere. Clearing browser storage will delete the data, so use the XLSX export occasionally as a backup.
