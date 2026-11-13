# RoseSync — Competition Concept Brief

## One-line pitch

**RoseSync is an adaptive AI deadline companion that turns a goal into a living rose journey, combining daily focus, visual progress, weather-aware lock screens, and supportive AI momentum coaching.**

## Problem

Deadlines often become stressful countdowns. Traditional planners can also become another task to maintain. When motivation drops, users may know the goal but struggle to decide what to do next.

## Solution

RoseSync changes the relationship with a deadline. A user chooses a rose that symbolizes the journey, sets a timeframe, and provides only a broad plan. RoseSync then creates a lightweight path toward the goal.

The lock screen evolves with the rose's growth and can adapt its atmosphere to the user's local weather. Daily tasks remain concise. When progress slows, Bloom Boost offers a fresh angle, a smaller next step, or a contextual encouragement.

## Product principles

1. **User agency first** — AI proposes; the user decides.
2. **Progress should feel alive** — visual growth creates continuity.
3. **Small wins matter** — the system rewards meaningful action, not perfection.
4. **Stagnation is not failure** — slower phases are represented as rooting/resting, not decay.
5. **Context should improve support** — time, task progress, energy check-ins, and weather can make the experience more relevant.

## Main flow

### 1. Choose Your Rose
Purple, White, Yellow, Red, or Pink, each with a philosophy.

### 2. Set Deadline Type
2 Weeks / 1 Month / 3 Months / 6 Months / 1 Year / Custom Date.

### 3. My Bloom Plan
The user writes only:
- project name
- main goal
- rough plan
- optional context

### 4. AI Shapes the Journey
Future AI integration can suggest:
- milestones
- useful next steps
- risks to consider
- references/resources

Each suggestion should be **Add / Edit / Skip**, preserving user control.

### 5. Daily Experience
The lock screen can show:
- countdown
- rose growth state
- Today's Focus
- project progress
- contextual weather atmosphere

### 6. Bloom Boost
User can check in as Focused / Stuck / Tired / Inspired.

Bloom Boost offers:
- **Refresh My Idea**
- **Simplify My Next Step**
- **Give Me a Boost**

## Progress model

RoseSync differentiates:

- **Time Progress** — how much of the deadline window has elapsed.
- **Task Progress** — how much work has been completed.
- **Bloom Progress** — a combined signal used to represent overall growth.

Current demo formula when tasks exist:

```text
Bloom Progress = (Time Progress + Task Progress) / 2
```

This is intentionally simple for the prototype and can later become milestone-aware.

## Rose growth model

Seed → Sprout → Young Plant → Bud Formation → Opening Bloom → Full Bloom

For a short deadline, visible changes happen quickly. For a one-year journey, the same phases stretch over longer intervals with smaller variations in between.

## Weather concept

The rose identity remains consistent while the background atmosphere changes:

- Sunny — warm golden light
- Cloudy — muted calm tones
- Rainy — droplets and reflective cool atmosphere
- Night — quiet moonlit deep-work mood

## Why AI matters

RoseSync deliberately avoids presenting AI as a replacement for human intent. AI becomes useful at the moments where humans often struggle: ambiguity, fatigue, idea stagnation, and deciding the next small action.

**AI supports the journey. The user owns the goal.**
