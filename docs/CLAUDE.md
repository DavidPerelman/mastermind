# Mastermind — Project Instructions for Claude Code

## Language Rules

- **Code & comments**: English only
- **UI / all user-facing text**: Hebrew only
- **Commit messages**: English

## Working Method

- Always read the relevant `docs/` spec file before starting a task
- Work one phase at a time — do NOT start Phase 2 until Phase 1 is complete and confirmed
- After finishing a task, summarize what you did in 2–3 lines

## Task Files

All tasks are in `docs/tasks/`.
Run them in order:

1. `01-vs-computer.md` — Phase 1: single player vs AI
2. `02-online-multiplayer.md` — Phase 2: online multiplayer (do NOT start until instructed)

## Spec File

Full game spec is in `docs/spec.md`

## File Structure

```
mastermind/
├── CLAUDE.md           ← you are here
├── index.html
├── style.css
├── game.js
├── ai.js               (AI opponent logic)
├── server.js           (Phase 2 only — do not create yet)
└── docs/
    ├── spec.md
    └── tasks/
        ├── 01-vs-computer.md
        └── 02-online-multiplayer.md
```

## Deployment

- **Phase 1** (static files only) → GitHub Pages
  - No build step needed, just push to `main` branch
  - Enable GitHub Pages in repo settings → source: `main` branch, root folder
- **Phase 2** (Node.js server) → Render.com
  - Free tier, supports Node.js + Socket.io
  - Add a `render.yaml` config file (see `docs/tasks/02-online-multiplayer.md`)
  - Note: free tier sleeps after 15 min of inactivity

## Definition of Done (Phase 1)

- [ ] Player can play against the computer
- [ ] AI sets a secret code and gives correct feedback
- [ ] Player sets a secret code and AI guesses intelligently
- [ ] Black/white peg feedback is calculated correctly
- [ ] Win/lose detection works
- [ ] UI is in Hebrew
- [ ] Animations are smooth
- [ ] Works well on mobile (touch-friendly, responsive)
