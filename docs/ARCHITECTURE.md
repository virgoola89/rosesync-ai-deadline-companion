# Architecture

## Current demo architecture

```text
Browser
  │
  ├── public/index.html
  ├── public/styles.css
  └── public/app.js
         │
         ▼
Node.js / Express (server.js)
         │
         ├── Rose catalog
         ├── Deadline engine
         ├── Organizer model
         ├── Growth-stage engine
         ├── Progress engine
         ├── Momentum engine
         ├── Bloom Boost fallback logic
         ├── Demo weather themes
         └── REST API
                 │
                 ▼
             data/db.json
```

## Recommended production architecture

```text
Web / Mobile Client
      │
      ▼
Application API
      ├── Authentication
      ├── Project service
      ├── Task & milestone service
      ├── Momentum/Bloom service
      ├── AI orchestration service ──► AI provider
      ├── Weather service ───────────► Weather provider
      └── Notification service
             │
             ▼
        PostgreSQL / Supabase
```

## AI context design

The future AI planner should receive only useful project context:

- goal
- rough plan
- deadline and days remaining
- accepted milestones
- completed/pending tasks
- time/task/bloom progress
- current user-energy check-in
- recent AI suggestions to avoid repetition

AI output should be structured and reversible. Suggestions should never silently overwrite the user's plan.

## Data persistence warning

`data/db.json` is demo storage. It is intentionally simple and should not be used as permanent storage on stateless cloud hosts.
