# Task 02 — Online Multiplayer (Phase 2)

## ⚠️ DO NOT START until Phase 1 is complete and confirmed working.

## Goal
Real-time turn-based multiplayer. Two players on different devices,
connected via a shared 4-digit room code.

---

## Game Flow

### Setup
1. Player 1 creates a room → selects difficulty + guess limit setting
2. Player 2 joins via room code
3. Each player sets their own secret code privately (never leaves their device)
4. Both tap "אני מוכן" → game starts when both are ready

### Turn Structure
- Players alternate turns. Player 1 goes first.
- Each turn = one guess by the active player
- After the guess: the OTHER player (who owns the code) sees it and inputs feedback (בולים/פגיעות)
- After feedback is confirmed → turn passes to the other player
- Each player always sees:
  - Their own guess history + feedback received
  - How many guesses the opponent has made (not what they guessed)

### Win Condition
- A player cracks the code (all blacks) → declared winner immediately
- The other player continues guessing until they also crack it (or hit the limit)
- Final result shows: who won, how many guesses each used

### Guess Limit (configured by Player 1 in settings)
- **ללא הגבלה** (default): 10 guesses, then +1 extra guess each time they fail
- **הגבלה קשיחה**: Player 1 sets a number (e.g. 8). If a player reaches the limit without cracking → they lose. Game ends when both have finished (won or lost).

---

## Architecture
- `server.js` — Node.js + Socket.io
- Secret codes stored CLIENT-SIDE only — never sent to server
- Server manages: room state, whose turn it is, guess routing, feedback routing

## Socket Events
- `create-room({ difficulty, limitType, limitCount })` → server returns 4-digit code
- `join-room(code)` → server confirms, notifies Player 1
- `player-ready` → sent when player has set their secret code (server waits for both)
- `submit-guess(guess)` → server forwards guess to opponent (the code owner)
- `submit-feedback(blacks, whites)` → opponent confirms feedback → server forwards to guesser + advances turn
- `opponent-guess-count(n)` → broadcast after each turn (count only, not content)
- `player-won(playerId, guessCount)` → server broadcasts when a player cracks the code
- `game-over({ p1: { won, guesses }, p2: { won, guesses } })` → when both players finished
- `opponent-disconnected` → server notifies remaining player → they win

---

## Screens

### Home screen
Add a third button below existing two:
- "שחק נגד חבר 👥"

### Room screen (new)
Two options:
- **"צור חדר חדש"** → difficulty selector + guess limit setting → show 4-digit code + "ממתין לשחקן השני..."
- **"הצטרף לחדר"** → 4-digit input field + "הצטרף" button

Guess limit setting (shown when creating):
- Toggle: "ללא הגבלה" / "הגבלת ניחושים"
- If limited: number input (default 10)

### Waiting screen
"ממתין לשחקן השני..." with animated dots

### Setup screen (same as Phase 1 Mode B)
Each player sets their secret code privately → "אני מוכן"

### Game screen (multiplayer)
**My turn (active):**
- My guess board (history + active row + palette)
- "תורך לנחש!" indicator
- Opponent's guess count: "היריב ניחש X פעמים"

**Opponent's turn (waiting):**
- "תור היריב..." indicator
- If opponent submitted a guess → show it prominently:
  - "הניחוש של היריב:" + colored pegs
  - "הקוד שלך:" + my secret code (for comparison)
  - "כמה בולים?" / "כמה פגיעות?" steppers
  - "אשר ניקוד" button
- After confirming → turn returns to me

**Mid-game win announcement:**
- Banner: "פצחת את הקוד! 🎉 ממתין לסיום המשחק..." (if I won first)
- Banner: "היריב פצח את הקוד! המשחק ממשיך..." (if opponent won first)

### Result screen
Shows both players' results:
- "ניצחת! פצחת ב־X ניחושים" / "הפסדת"
- Opponent's result: "היריב פצח ב־Y ניחושים" / "היריב לא הצליח"
- "שחק שוב" button

---

## Disconnection
- Any disconnect at any point → `opponent-disconnected` event
- Remaining player sees: "היריב התנתק — ניצחת! 🏆"
- Room closed immediately

---

## Deployment — Render.com
### render.yaml
```yaml
services:
  - type: web
    name: mastermind
    env: node
    buildCommand: npm install
    startCommand: node server.js
    plan: free
```

### package.json
```json
{
  "name": "mastermind",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1"
  }
}
```

### Auto-detect environment
```js
const SERVER = location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://mastermind.onrender.com';
```

Show "מתחבר לשרת..." on initial load (Render free tier wakes up in ~30 sec).

---

## Definition of Done
- [ ] Room creation and joining works on mobile
- [ ] Difficulty + guess limit set by Player 1, respected by both
- [ ] Each player's code stays only on their device
- [ ] Turn-based flow works correctly (only active player can guess)
- [ ] Opponent's guess shown with secret code for feedback input
- [ ] First player to crack → declared winner, other continues
- [ ] Guess limit enforced correctly (lose or extra guess)
- [ ] Disconnection → other player wins immediately
- [ ] Works on iOS Safari and Android Chrome
