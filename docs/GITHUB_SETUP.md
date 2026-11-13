# GitHub Setup Guide

## Suggested repository name

`rosesync-ai-deadline-companion`

## Suggested repository description

> Adaptive AI deadline companion with rose-growth progress, daily focus, weather-aware lock screens, and Bloom Boost momentum support.

## Suggested topics

```text
ai-productivity
nodejs
express
lockscreen
planner
deadline-tracker
human-centered-ai
weather-ui
competition-project
```

## First push

Create an empty GitHub repository, then from this folder run:

```bash
git init
git add .
git commit -m "Initial RoseSync competition demo"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/rosesync-ai-deadline-companion.git
git push -u origin main
```

## Recommended GitHub settings

- Keep the repository **public** if the competition requires a publicly reviewable project.
- Add the live Render URL under **About → Website**.
- Add a social preview image using `docs/assets/rosesync-storyboard.png` or a dedicated 1280×640 banner later.
- Enable GitHub Actions so `.github/workflows/ci.yml` validates every push.
- Do not commit real API keys. Put secrets in GitHub/Render environment variables.

## Render deployment

After pushing to GitHub:

1. Open Render.
2. Create a **Blueprint** using `render.yaml`, or create a Node Web Service manually.
3. Connect this repository.
4. Deploy.
5. Add the live URL back to the GitHub repository About section.

## Future environment secrets

When AI/weather integrations are added, configure these in the hosting platform rather than in source control:

```text
AI_PROVIDER
AI_API_KEY
WEATHER_PROVIDER
WEATHER_API_KEY
DATABASE_URL
```
