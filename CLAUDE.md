# Startup Idea Validator — Claude Code Briefing

## Who Is Building This

Yash Goel — 3rd year CS student, Delhi, India. This is his first Next.js project.
He has completed one prior project (Habit Tracker) in plain HTML/CSS/JS.
He understands concepts well but is actively building his ability to write code manually.

### How Yash works

- Understands the big picture first, then details
- Responds well to mental models and analogies
- Asks "why" not just "what" — always explain reasoning, not just syntax
- Does NOT want code handed to him without explanation
- Writes HTML/CSS/Tailwind himself — uses Claude Code for logic, API wiring, and JS
- Every function must have a comment above it explaining what it does
- Keep code simple and readable — this is a learning project, not a production codebase

---

## What This Project Is

A web app where a user types a startup idea (e.g. "AI tutoring for rural India")
and gets back a structured validation report. The app fetches real news about
that market space and uses the Claude AI API to analyze the idea.

### What the report shows

- Market Signal — what recent news says about this space
- Competition Level — how crowded the market is
- Timing — is now a good or bad time to build this?
- Execution Risk — how hard is this to actually build and sell?
- Overall Verdict — go, wait, or avoid
- 3–5 recent news headlines with clickable links

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** JavaScript — NOT TypeScript (no type annotations ever)
- **Styling:** Tailwind CSS (utility classes directly in JSX)
- **APIs:** Anthropic Claude API + NewsAPI.org
- **Deployment:** Vercel
- **Version control:** Git + GitHub

---

## Project Structure

```
startup_validator/
├── src/
│   └── app/
│       ├── layout.js          → Root layout, wraps every page
│       ├── page.js            → Main UI (form + results display)
│       ├── globals.css        → Global styles
│       └── api/
│           └── validate/
│               └── route.js   → Backend: calls Anthropic + NewsAPI
├── public/                    → Static assets
├── .env.local                 → Secret API keys (never touch this, never push)
├── .gitignore                 → Git ignore rules
├── CLAUDE.md                  → This file
├── package.json               → Dependencies and scripts
└── next.config.mjs            → Next.js config
```

---

## How the App Works (Full Request Flow)

1. User types a startup idea into the form on `page.js`
2. User clicks Submit
3. JavaScript in `page.js` sends the idea to `/api/validate` (POST request)
4. `route.js` receives the idea on the server
5. `route.js` calls NewsAPI with relevant keywords → gets recent headlines
6. `route.js` calls Anthropic API with the idea + headlines → gets structured analysis
7. `route.js` sends back a JSON object with the full report
8. `page.js` receives the JSON and displays the report on screen

Steps 5 and 6 happen entirely server-side. The browser never sees the API keys.

---

## Key Rules — Never Break These

### Security

- API keys live ONLY in `.env.local`
- API keys are accessed ONLY via `process.env.VARIABLE_NAME`
- API calls happen ONLY in `route.js` — never in `page.js` or any client component
- Never hardcode a key anywhere in the codebase

### Code style

- JavaScript only — no TypeScript, no type annotations
- Every function gets a comment above it explaining what it does in plain English
- Keep variable names clear and descriptive — no single letters except loop counters
- No unnecessary packages — if it can be done with what's installed, do it that way
- No external UI component libraries — build UI with plain JSX + Tailwind only

### Next.js specifics

- Use App Router only — all files inside `src/app/`
- `page.js` is a client component (needs interactivity) — add `'use client'` at the top
- `route.js` is always server-side — never add `'use client'` there
- Keep `layout.js` minimal — only global fonts and metadata

---

## Environment Variables

Create a `.env.local` file in the project root with these keys:

```
GROQ_API_KEY=your_key_here
GNEWS_API_KEY=your_key_here
```

This file is already in `.gitignore` — it will never be pushed to GitHub.
On Vercel, add these same keys in the project's Environment Variables dashboard.

---

## Feature Checklist

- [ ] Default Next.js page cleared and replaced with custom UI
- [ ] Input form built (textarea + submit button)
- [ ] Loading state shown while APIs respond
- [ ] API route file created at `src/app/api/validate/route.js`
- [ ] NewsAPI connected and returning headlines
- [ ] Anthropic API connected and returning structured analysis
- [ ] Results displayed on page (all 6 sections)
- [ ] Error handling when APIs fail or idea is empty
- [ ] Metadata updated (title, description in layout.js)
- [ ] Deployed to Vercel with env variables set

---

## Concepts Yash Has Already Learned

These don't need to be explained again:

- How HTML/CSS/JS interact and the DOM
- localStorage (reading, writing, JSON.stringify/parse)
- Git workflow (branching, committing, pushing)
- How the request/response cycle works
- What JSON is and why it exists
- npm and package.json
- What Next.js is and why it exists
- What API routes are and why keys must stay server-side
- What async/await does and why it exists
- What environment variables are and how .env.local works
- What Tailwind is (CSS utility classes written directly in JSX)

---

## Concepts Yash Is Learning In This Project

Explain these clearly when they come up:

- How to actually call an external API from a Next.js route (fetch syntax)
- How to handle the response from Anthropic (parsing the content object)
- How useState works in React (storing data that makes the UI re-render)
- How to send data from a form in page.js to route.js (POST request with fetch)
- Error handling patterns (try/catch, showing errors to the user)
- How Tailwind classes map to real CSS properties

---

## Mistakes to Avoid

- Do not put `'use client'` in route.js
- Do not call APIs directly from page.js
- Do not install packages without checking if it's already possible without them
- Do not use TypeScript syntax (no colons after variable names for types, no interfaces)
- Do not create a `pages/` folder — this project uses App Router, not Pages Router
- Do not run `git init` in any parent folder — git lives only inside `startup_validator/`

---

## Previous Project For Reference

Project 1 was a Habit Tracker built in plain HTML/CSS/JS.

- Live: https://habit-tracker-ten-blond.vercel.app/login.html
- GitHub: https://github.com/slash0403/habit-tracker
- That project used localStorage. This project uses real APIs instead.
