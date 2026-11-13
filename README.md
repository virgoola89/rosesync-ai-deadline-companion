# 🌹 RoseSync — Proposal Prototype v1.6

**An adaptive AI deadline companion that helps your goals grow — one meaningful step at a time.**

RoseSync transforms a deadline from a stressful number into a visual growth journey. The user chooses a rose, sets a deadline, sketches a simple plan, and receives a daily lock-screen experience that evolves as the project progresses. AI acts as a **goal partner**, helping the user regain clarity, refresh ideas, and keep momentum without taking ownership of the goal away from them.

> **Core principle:** AI supports the journey. The user owns the goal.

## Proposal prototype

This version is optimized for an international product proposal presentation. It adds a clean concept narrative, presentation navigation, and a **Presentation Mode** that can simulate the rose from Seed to Full Bloom instantly while preserving the interactive onboarding, AI planner, Bloom Boost, and weather-adaptive demo.

## Competition concept

RoseSync is designed as an international competition demo. The UI and product copy are English-first.

The concept combines:

- 🌹 **Choose Your Rose** — a symbolic rose that represents the user's journey.
- ⏳ **Flexible Deadline Types** — 2 weeks, 1 month, 3 months, 6 months, 1 year, or a custom date.
- 🗂️ **My Bloom Plan** — the user provides only the big picture; AI can later refine it into milestones and useful references.
- ✅ **Daily Focus** — lightweight, actionable tasks rather than a heavy project-management interface.
- 🌱 **Rose Growth** — Seed → Sprout → Young Plant → Bud Formation → Opening Bloom → Full Bloom.
- 🌦️ **Weather-Adaptive Lock Screen** — the rose remains the identity while the visual atmosphere can follow local weather.
- ✨ **Bloom Boost** — AI helps when the user feels stuck, tired, or needs a fresh idea.
- 📈 **Bloom Progress** — combines calendar progress and task progress rather than treating time alone as success.

## Rose choices

| Rose | Philosophy | Best suited for |
|---|---|---|
| Purple | Imagination & Transformation | reinvention, creative goals, bold ideas |
| White | Clarity & New Beginnings | fresh starts, discipline, focused work |
| Yellow | Optimism & Creative Energy | learning, collaboration, joyful projects |
| Red | Passion & Determination | ambitious goals, persistence, high commitment |
| Pink | Growth & Self-Development | skill building, personal progress, steady growth |

## User journey

```text
Choose Your Rose
      ↓
Choose Journey Length
      ↓
Set Project + Main Goal
      ↓
My Bloom Plan (rough outline only)
      ↓
AI Refines the Journey
      ↓
Daily Lock Screen + Today's Focus
      ↓
Check-in: Focused / Stuck / Tired / Inspired
      ↓
Bloom Boost when extra support is needed
      ↓
Full Bloom on completion / deadline
```

## What makes RoseSync different

RoseSync is deliberately **not** a large project-management dashboard. It keeps the user's attention on the next meaningful step. The visual rose provides emotional continuity, while AI is used to restore momentum rather than merely generate answers.

A pause is not shown as a dying flower. RoseSync treats slow periods as part of growth — rooting, resting, and preparing for the next visible change.

## Demo capabilities in this repository

The current demo includes:

- Rose selection and philosophy
- Deadline presets and custom dates
- Project goal and rough-plan capture
- Live AI planner through the OpenAI Responses API (with safe fallback mode)
- AI milestone suggestions with Add / Skip controls
- AI next-step, risk, and reference-direction suggestions
- Growth-stage calculations
- Time, task, and Bloom Progress calculations
- Task creation/completion endpoints
- User energy check-ins
- Momentum detection
- Bloom Boost with live AI when configured, plus fallback coaching logic
- Demo weather themes: Sunny, Cloudy, Rainy, Night
- Live local weather through Open-Meteo after browser location permission
- Daily lock-screen/dashboard payload

The manual weather modes remain available so judges can instantly demonstrate all atmospheres. **Use My Live Weather** requests browser location permission and uses coordinates only to retrieve current conditions.

## Tech stack

- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend:** Node.js + Express
- **Demo persistence:** JSON file
- **Recommended demo hosting:** Render
- **Recommended production database:** PostgreSQL / Supabase
- **AI:** OpenAI Responses API
- **Weather:** Open-Meteo Forecast API
- **Future integrations:** authentication + PostgreSQL/Supabase + notifications

## Run locally

Requirements: Node.js 18+

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

For development:

```bash
npm run dev
```

Validate JavaScript syntax:

```bash
npm test
```

## Configure live AI

RoseSync keeps the OpenAI API key on the server. Never place it in `public/app.js` or commit it to GitHub.

Create a local `.env` from `.env.example`:

```env
OPENAI_API_KEY=your_server_side_key
OPENAI_MODEL=gpt-6-luna
```

If `OPENAI_API_KEY` is missing, RoseSync automatically uses its built-in fallback planning and coaching logic, so the demo still works.

### Live weather

No weather API key is required for the current non-commercial demo. The browser asks the user for geolocation permission only when **Use My Live Weather** is pressed. RoseSync sends latitude/longitude to its own backend, which requests current conditions from Open-Meteo. Manual weather demo buttons remain available.

## Deploy to Render

This repository includes `render.yaml`.

1. Push this folder to GitHub.
2. In Render choose **New → Blueprint** or **New → Web Service**.
3. Connect the GitHub repository.
4. Build command: `npm install`
5. Start command: `npm start`
6. Health check: `/api/health`
7. In Render → **Environment**, set `OPENAI_API_KEY` as a secret environment variable.
8. Optional: change `OPENAI_MODEL`; otherwise RoseSync uses `gpt-6-luna`.

> `data/db.json` is suitable only for a competition demo. Cloud filesystems are not a durable production database. Move persistent user data to PostgreSQL/Supabase before real-user deployment.

## Repository structure

```text
rosesync/
├── .github/workflows/ci.yml
├── data/db.json
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── COMPETITION_BRIEF.md
│   ├── ROADMAP.md
│   └── assets/
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── .env.example
├── .gitignore
├── CONTRIBUTING.md
├── package.json
├── render.yaml
├── server.js
└── README.md
```

## Product vision

**Plan → Grow → Adapt → Recover → Bloom**

RoseSync presents AI positively: not as a machine that only returns answers and outputs, but as a thoughtful partner that can help a person move toward a goal while preserving the user's agency.
