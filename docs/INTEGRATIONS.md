# Integrations

## OpenAI

RoseSync uses the server-side Responses API. The browser never receives the API key.

Environment variables:

- `OPENAI_API_KEY` — required for live AI.
- `OPENAI_MODEL` — optional; defaults to `gpt-6-luna`.

Live AI powers:

1. **Let AI Shape My Journey** — milestone and planning suggestions.
2. **Bloom Boost** — context-aware momentum support.

The application has deterministic fallbacks so the competition demo remains usable if an AI request fails or no key is configured.

## Open-Meteo

The frontend requests browser geolocation only after the user presses **Use My Live Weather**. Latitude and longitude are sent to the RoseSync backend, which calls Open-Meteo. The UI maps current weather into RoseSync atmospheres: Sunny, Cloudy, Rainy, or Night.

Manual atmosphere buttons remain intentionally available for judge/demo control.

## Privacy-oriented demo choices

- No API key is exposed to the browser.
- RoseSync does not request location until the user explicitly activates live weather.
- The current demo stores only project data in `data/db.json`; production should use a proper database and explicit privacy/retention rules.
