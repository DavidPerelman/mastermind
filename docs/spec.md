# Mastermind Multiplayer — Game Spec

## Overview

A modern web-based Mastermind (בול פגיעה) game for 2 players.
Both players try to crack each other's secret code simultaneously.
Playable locally (same screen) or remotely (shared room link).

---

## Game Rules

- Each player secretly sets a code: **5 pegs, chosen from 8 colors**
- Colors **can repeat** in the code
- Each player gets **10 attempts** to guess the opponent's code
- After each guess, feedback is shown:
  - ⚫ Black peg = correct color, correct position
  - ⚪ White peg = correct color, wrong position
- The player who cracks the code **in fewer guesses wins**
- If both crack it on the same turn → **tie**
- If neither cracks it in 10 turns → **both lose**

---

## Game Modes

### Local (Hot-seat)

- Both players on the same device
- Player 1 sets their code secretly → Player 2 looks away
- Player 2 sets their code secretly → Player 1 looks away
- Then they take turns guessing (or simultaneously — see UI section)

### Remote (Room-based)

- Player 1 creates a room → gets a shareable link/code
- Player 2 joins via the code
- Each player sees only their own guessing board + opponent's feedback
- Real-time sync via WebSockets

---

## UI / Visual Design

### Style

- **Modern dark theme** (deep navy or dark gray background)
- **Glassmorphism** cards for each player's board
- Smooth **CSS animations** on peg placement and feedback reveal
- Clean sans-serif font (e.g. Inter or system-ui)
- Responsive: works on desktop and mobile

### Layout (Local mode)

- **Side by side**: Player 1 board on left, Player 2 board on right
- Each board shows:
  - 10 rows of 5 peg slots (guesses)
  - Feedback pegs (black/white) on the right of each row
  - Color palette at the bottom to pick pegs
  - A "Submit Guess" button
- The **secret code row** at the top is hidden (covered) until the game ends

### Colors (8 options)

Red, Orange, Yellow, Green, Teal, Blue, Purple, Pink
— shown as vibrant circles with a slight glow effect

### Feedback Animation

- When a guess is submitted: pegs "flip in" one by one
- Black/white feedback pegs appear with a short delay
- Winning row gets a **pulse/glow animation**

---

## Screens

1. **Home Screen** — "New Local Game" / "Create Online Room" / "Join Room"
2. **Setup Screen** — Each player secretly places their 5-peg code
3. **Game Screen** — Main board, alternating or simultaneous turns
4. **Result Screen** — Winner announcement, stats (guesses used), "Play Again"

---

## Tech Stack (Claude Code decides, but suggestions)

- Pure HTML/CSS/JS (single file) for local mode prototype
- If implementing remote: Node.js + Socket.io for real-time sync
- No framework required for prototype — vanilla JS is fine
- Mobile-friendly layout

---

## Prototype Priority (Phase 1)

1. Local 2-player hot-seat game, fully working
2. Modern UI with animations
3. Correct scoring logic (black/white pegs)

## Phase 2 (stretch goal)

- Online multiplayer with room codes via WebSockets

---

## File Structure (suggested)

```
mastermind/
├── index.html
├── style.css
├── game.js
└── server.js (Phase 2 only)
```
