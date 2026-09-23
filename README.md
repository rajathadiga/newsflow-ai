# Outside (newsflow_ai)

**Stay informed. Stay offline.** Outside is a news app that shows you what matters,
without endless scrolling. It pulls news from RSS feeds, has an AI summarize and rank
each story, groups related stories together, and shows what people are saying on
social media.

Built as a full-stack + AI learning project: **FastAPI + SQLite** backend and a
**Next.js + Tailwind + framer-motion** frontend.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [How it works](#how-it-works)
4. [Project structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Get the code (clone / pull)](#get-the-code-clone--pull)
7. [Backend setup](#backend-setup)
8. [Database setup](#database-setup)
9. [Frontend setup](#frontend-setup)
10. [Running the app](#running-the-app)
11. [Environment variables](#environment-variables)
12. [API reference](#api-reference)
13. [Production build](#production-build)
14. [Troubleshooting](#troubleshooting)
15. [Known limitations](#known-limitations)

---

## Features

| Page | What it does |
|---|---|
| **Today** (`/`) | Greeting, news grouped by category (World, India, Technology, Internet), **Top Developments** (related stories merged into one card with an AI synthesis, a timeline and claim checking), and **Around You** (local news for your detected or chosen city). |
| **FOMO Shield** (`/fomo`) | "What did I miss?" Counts stories since your last visit, estimates catch-up time, and can generate an AI briefing (with read-aloud audio). If little is new, it shows the day's most important stories instead. |
| **Social Pulse** (`/pulse`) | By default a **Trending now** feed of real posts from Reddit (India), Mastodon and Hacker News that **auto-refreshes every 5 minutes**. Search any topic to see posts about it, filtered by platform. |
| **History** (`/history`) | Everything you searched for and opened, grouped by day. Click an entry to run the search again or reopen the item, or delete entries. |
| Everywhere | Header search and **⌘K / Ctrl+K** "Ask Outside" with an AI overview, voice search (mic), a light/dark theme, a mobile bottom nav, and animations that switch off when your system has "reduce motion" on. |

Per story: **Explain** (30 sec / Simple / Detailed / Technical), **Follow**, and a link
to its **Social Pulse**.

---

## Tech stack

**Backend** (`backend/`)
- Python 3.11, [FastAPI](https://fastapi.tiangolo.com/) and Uvicorn
- SQLite via SQLAlchemy 2 (no separate database server needed)
- APScheduler: re-fetches the RSS feeds every 15 minutes
- feedparser for RSS, requests for HTTP
- AI: [OpenRouter](https://openrouter.ai) through the `openai` SDK (default model `google/gemma-4-31b-it:free`)
- Live news search: [Event Registry / newsapi.ai](https://newsapi.ai)
- Social: Reddit RSS, the Mastodon public API and the Hacker News (Algolia) API. None of them need keys.
- Reverse geocoding: OpenStreetMap Nominatim (no key)

**Frontend** (`frontend/`)
- [Next.js 16](https://nextjs.org) (App Router, Turbopack) and React 19
- TypeScript, Tailwind CSS v4
- framer-motion (animations), lucide-react (icons)

---

## How it works

```
                 every 15 min (APScheduler)
RSS feeds ──────────────► ingest.py ──► summarizer.py (OpenRouter AI: summary + importance 1-5)
(BBC, NDTV,                   │
 TechCrunch, HN)              ▼
                        SQLite: newsflow.db ◄── clustering.py (groups related stories)
                              │
Browser (Next.js :3000) ◄──► FastAPI (:8000) ──► Event Registry (live search)
                                           ├──► Reddit / Mastodon / HN (Social Pulse)
                                           ├──► Nominatim (city from GPS coordinates)
                                           └──► OpenRouter (explain, claims, briefing)
```

- The **backend** is the only part that talks to external services and the database.
- The **frontend** calls the backend's `/api/...` endpoints (set by `NEXT_PUBLIC_API_URL`).
- Social Pulse and trending results are **cached in memory for 5 minutes**. This keeps
  Reddit from rate-limiting the app.

---

## Project structure

```
newsflow_ai/
├── README.md
├── backend/
│   ├── main.py            # FastAPI app + every API route
│   ├── database.py        # SQLite engine/session (DATABASE_URL)
│   ├── models.py          # Tables: stories, story_clusters, history
│   ├── schemas.py         # Pydantic request/response shapes
│   ├── feeds.py           # RSS feed list (add/remove sources here)
│   ├── ingest.py          # Fetch feeds → AI summarize → save → cluster
│   ├── clustering.py      # Groups related stories into clusters
│   ├── scheduler.py       # Runs ingest every 15 minutes
│   ├── summarizer.py      # All AI prompts (OpenRouter)
│   ├── news_search.py     # Live web news search (Event Registry)
│   ├── social.py          # Social Pulse: search + trending (Reddit, Mastodon, HN)
│   ├── geo.py             # GPS coordinates → city name (Nominatim)
│   ├── requirements.txt
│   ├── .env.example       # Copy to .env and fill in keys
│   └── newsflow.db        # SQLite database (auto-created, git-ignored)
└── frontend/
    ├── package.json
    ├── .env.local         # NEXT_PUBLIC_API_URL (you create this)
    └── src/
        ├── app/           # Pages: / , /fomo , /pulse , /history (+ layout, template)
        ├── components/    # UI pieces (StoryCard, Header, SocialPostCard, motion.tsx, …)
        └── lib/           # api.ts (backend calls), history.ts, location.ts, helpers
```

---

## Prerequisites

Install these first:

| Tool | Version | Check with |
|---|---|---|
| [Git](https://git-scm.com/downloads) | any recent | `git --version` |
| [Python](https://www.python.org/downloads/) | **3.11+** (developed on 3.11.5) | `python --version` |
| [Node.js](https://nodejs.org/) | **20.9+** (developed on 24.x) | `node --version` |
| npm | comes with Node | `npm --version` |

You'll also want two free API keys:
- **OpenRouter** (AI features): https://openrouter.ai/keys
- **Event Registry / newsapi.ai** (live news search and "Around You"): https://newsapi.ai

> The app still runs without the keys, but AI summaries, explanations, briefings and live
> search won't work. Social Pulse and the RSS feed work without any key.

---

## Get the code (clone / pull)

**First time: clone the repository**

```bash
git clone https://github.com/rajathadiga/newsflow-ai.git
cd newsflow-ai
```

**Already cloned: get the latest changes**

```bash
cd newsflow-ai
git pull origin main

# then re-install dependencies in case they changed:
cd backend && pip install -r requirements.txt    # with the venv activated (see below)
cd ../frontend && npm install
```

---

## Backend setup

All commands run from the `backend/` folder.

### 1. Create and activate a virtual environment

A virtual environment keeps this project's Python packages separate from the rest of
your system.

**Windows (PowerShell)**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```
> If PowerShell blocks the script, run this once:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

**Windows (Git Bash)**
```bash
cd backend
python -m venv venv
source venv/Scripts/activate
```

**macOS / Linux**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

Your prompt now starts with `(venv)`. Activate it again every time you open a new terminal.

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
# Windows PowerShell
Copy-Item .env.example .env
# macOS / Linux / Git Bash
cp .env.example .env
```

Open `backend/.env` and fill in your keys:

```env
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=google/gemma-4-31b-it:free
NEWSAPI_KEY=your-event-registry-key
```

> `.env` is git-ignored. **Never commit real keys.**

---

## Database setup

The app uses **SQLite**: the whole database is a single file, `backend/newsflow.db`.
You don't install or run a database server.

### Create the database

It's **created automatically** the first time the backend starts or ingest runs:
`Base.metadata.create_all()` builds any missing tables. The tables are:

| Table | Holds |
|---|---|
| `stories` | Each news article: title, AI summary, url, source, category, importance (1-5), timestamps, cluster link |
| `story_clusters` | Groups of related stories: headline, AI synthesis, source and article counts |
| `history` | Your searches and opened items (for the History page) |

### Fill it with news (first ingest)

A fresh database is empty. Pull the RSS feeds once (with the venv active, inside `backend/`):

```bash
python ingest.py
```

This fetches up to 10 items per feed, asks the AI for a summary and an importance
rating for each, saves them, and groups related stories. Expect it to take a minute or
two, since every story is one AI call.

You can also trigger it while the server is running:

```bash
curl -X POST http://127.0.0.1:8000/api/ingest
```

After that, the **scheduler re-runs ingest every 15 minutes** while the backend is running.

### Inspect the data

```bash
# Using the sqlite3 CLI (if installed)
sqlite3 newsflow.db "select count(*) from stories;"

# Or with Python (no extra install)
python -c "import sqlite3; c=sqlite3.connect('newsflow.db'); print(c.execute('select category, count(*) from stories group by 1').fetchall())"
```

A GUI such as [DB Browser for SQLite](https://sqlitebrowser.org/) works too.

### Reset the database

Stop the backend, delete the file, and ingest again:

```bash
# Windows PowerShell:  Remove-Item newsflow.db
rm newsflow.db
python ingest.py
```

> **Schema changes:** `create_all()` creates *new* tables but does **not** alter existing
> ones. If you add a column to an existing model, either reset the database (above) or
> add a migration tool such as Alembic.

### Change news sources

Edit `backend/feeds.py`. Each feed has a `name`, an RSS `url` and a `category`
(`World`, `India`, `Technology` or `Internet`, matching `frontend/src/lib/categories.ts`).

---

## Frontend setup

All commands run from the `frontend/` folder.

```bash
cd frontend
npm install
```

Create `frontend/.env.local` so the frontend knows where the backend is:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

> If this file is missing, the app falls back to `http://127.0.0.1:8000` anyway.

---

## Running the app

You need **two terminals**, one for the backend and one for the frontend.

**Terminal 1: backend (port 8000)**
```bash
cd backend
# activate the venv first (see Backend setup)
uvicorn main:app --port 8000 --reload
```

**Terminal 2: frontend (port 3000)**
```bash
cd frontend
npm run dev
```

Then open:

| URL | What |
|---|---|
| http://localhost:3000 | The app |
| http://127.0.0.1:8000/docs | Interactive API docs (Swagger), where you can try every endpoint |
| http://127.0.0.1:8000 | Backend health check |

> Use **`localhost:3000`**, not `127.0.0.1:3000`. The backend's CORS setting only
> allows `http://localhost:3000` (see `main.py`).

### Useful commands

| Where | Command | Purpose |
|---|---|---|
| backend | `uvicorn main:app --port 8000 --reload` | Run the API with auto-reload |
| backend | `python ingest.py` | Fetch the RSS feeds into the database once |
| backend | `pip install -r requirements.txt` | Install or update Python packages |
| frontend | `npm run dev` | Dev server with hot reload |
| frontend | `npm run build` | Production build (also type-checks) |
| frontend | `npm start` | Serve the production build |
| frontend | `npm run lint` | Run ESLint |
| frontend | `npx tsc --noEmit` | Type-check only |

---

## Environment variables

**`backend/.env`**

| Variable | Required | Default | Used for |
|---|---|---|---|
| `OPENROUTER_API_KEY` | For AI features | none | Summaries, importance, Explain, Claims, Briefing, search overview |
| `OPENROUTER_MODEL` | No | `google/gemma-4-31b-it:free` | Which OpenRouter model to call |
| `NEWSAPI_KEY` | For live search | none | Header / ⌘K search and "Around You". This is an **Event Registry (newsapi.ai)** key, *not* newsapi.org. The free tier is about 2,000 searches a month. |

**`frontend/.env.local`**

| Variable | Default | Used for |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` | Base URL of the backend |

---

## API reference

Full interactive docs: **http://127.0.0.1:8000/docs**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/api/stories?category=` | Latest stories (optionally one category) |
| GET | `/api/clusters` | Top Developments (multi-source story groups) |
| GET | `/api/fomo?hours=` | Catch-up summary since the last visit (falls back to today's top stories) |
| GET | `/api/briefing` | AI-written briefing of recent news |
| GET | `/api/search?q=` | Live news search with an AI-refined query and overview |
| GET | `/api/explain?title=&summary=&depth=` | Explain a story (`30sec`, `simple`, `detailed`, `technical`) |
| GET | `/api/claims?title=&summary=` | Extract claims and their confidence |
| GET | `/api/social?q=` | Social Pulse search (Reddit, Mastodon, HN), cached 5 min |
| GET | `/api/social/trending` | Trending posts and hashtags, cached 5 min |
| GET | `/api/location?lat=&lon=` | Turn coordinates into a city/state |
| GET | `/api/history?kind=` | List history (`search` or `view`) |
| POST | `/api/history` | Add an entry `{kind, source, title, url}` |
| DELETE | `/api/history/{id}` | Delete one entry |
| DELETE | `/api/history` | Clear all history |
| POST | `/api/ingest` | Run RSS ingest now |

---

## Production build

```bash
# Frontend
cd frontend
npm run build
npm start                       # serves on :3000

# Backend (no --reload in production)
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

When deploying, set `NEXT_PUBLIC_API_URL` to the public backend URL **before**
`npm run build` (it's baked in at build time), and add the frontend's domain to
`allow_origins` in `backend/main.py`.

---

## Troubleshooting

**The feed is empty ("No stories yet")**
Run `python ingest.py` in `backend/`. A fresh database has no stories.

**My backend change has no effect / `/api/...` returns 404 for a route that exists**
On Windows, `--reload` sometimes fails to replace the old server process, so old code
keeps answering on port 8000. Stop everything and start again:
```powershell
# PowerShell: stop every uvicorn process AND its worker processes.
# (Killing only the process that owns port 8000 isn't enough: an orphaned
#  worker can keep serving the old code.)
Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
  Where-Object { $_.CommandLine -like '*uvicorn main:app*' -or $_.CommandLine -like '*multiprocessing-fork*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```
Then start uvicorn again. On macOS/Linux: `pkill -f "uvicorn main:app"`.

**Port already in use**
Another copy is running. Stop it with the command above, or use another port
(`--port 8001`) and update `NEXT_PUBLIC_API_URL`.

**Every story has importance 3 / "major" is always 0**
The AI model was rate-limited (`429` in the backend log), so the default score was
used. Free OpenRouter models are shared and often busy. Wait and re-ingest, or add
credit or your own provider key on OpenRouter.

**Social Pulse says "Reddit is busy right now"**
Reddit rate-limits requests that aren't logged in. Results are cached for 5 minutes,
so try again shortly. The other platforms still load.

**"Use my location" doesn't work**
Browsers only allow location on `localhost` or `https://`. Also check that the browser
has location permission for the site. You can always type a city instead.

**CORS errors in the browser console**
Open the app at `http://localhost:3000` (not `127.0.0.1:3000`), and check that the
backend is running.

**`Activate.ps1 cannot be loaded because running scripts is disabled`**
Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once in PowerShell.

---

## Known limitations

- **No user accounts.** History is one shared list for everyone using the same backend.
  The saved location, followed stories and last-visit time live in the browser.
- **X/Twitter, Instagram and YouTube** posts can't be shown in the app (no free public
  API). Social Pulse links out to them instead.
- **Clustering** is keyword-based, not semantic, so related stories with different
  wording may not be grouped.
- **The scheduler's first run** is 15 minutes after the backend starts. Run
  `python ingest.py` to get fresh stories right away.
- **SQLite** is ideal for one user or a small deployment. For many users, switch
  `DATABASE_URL` in `database.py` to PostgreSQL.
