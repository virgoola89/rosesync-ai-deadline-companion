# RoseSync API — v1.5

## Core

- `GET /api/health` — service status, AI configuration status, weather provider.
- `GET /api/roses` — available rose identities and philosophies.
- `GET /api/deadline-types` — deadline presets.
- `POST /api/projects` — create a Bloom Journey.
- `GET /api/projects/:id` — retrieve a project.
- `GET /api/projects/:id/progress` — time/task/Bloom Progress.

## Live AI planner

### `POST /api/projects/:id/ai-plan`
Uses the OpenAI Responses API when `OPENAI_API_KEY` is configured. Otherwise returns a safe local fallback plan.

Returns: journey summary, milestone suggestions, next-step ideas, risks, and reference directions. AI reference output is intentionally expressed as topics/source types rather than invented URLs.

### `POST /api/projects/:id/ai-plan/milestones/:milestoneId`
Body: `{ "action": "add" }` or `{ "action": "skip" }`.
Accepted suggestions become project tasks.

## Tasks and progress

- `POST /api/projects/:id/tasks` — add a task.
- `PATCH /api/projects/:id/tasks/:taskId` — edit/complete a task.

## Momentum and Bloom Boost

- `POST /api/projects/:id/check-in` — `focused`, `stuck`, `tired`, or `inspired`.
- `GET /api/projects/:id/momentum` — derive momentum state.
- `POST /api/projects/:id/bloom-boost` — modes: `auto`, `refresh-idea`, `simplify`, `motivate`. Uses live AI when configured and falls back locally if the call fails.

## Weather

### `POST /api/weather`
Body: `{ "latitude": number, "longitude": number }`. Retrieves current Open-Meteo weather.

### `POST /api/projects/:id/live-weather`
Same coordinates; also stores the latest weather state for the project demo.

### `GET /api/projects/:id/demo-dashboard?weather=sunny`
Manual competition-demo atmosphere. Supported values: `sunny`, `cloudy`, `rainy`, `night`.
