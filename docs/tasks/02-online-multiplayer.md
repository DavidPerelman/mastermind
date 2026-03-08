# Task 02 — Online Multiplayer (Phase 2)

## ⚠️ DO NOT START until Phase 1 is complete and confirmed working.

## Key Insight

Phase 2 is the same mechanic as Phase 1 Mode B — just replace the AI with a human on another device.

- Each player sets a secret code that only they can see
- Each player guesses the opponent's code
- Each player manually gives feedback on the opponent's guesses (because only they know their own code)
- The server never needs to calculate feedback — players do it themselves

## Architecture

- `server.js` — Node.js + Socket.io
- Each player connects from their own device
- Secret codes are NEVER sent to the server or the opponent
- Feedback is calculated client-side by the code owner and sent to the server, then forwarded to the guesser

## Flow

1. Player 1 opens app → taps "צור חדר" → gets a 4-digit room code
2. Player 2 opens app on their device → taps "הצטרף לחדר" → enters code
3. Both see: "שחקן 2 הצטרף — מתחילים!"
4. Each player sets their secret code privately on their own device (never leaves the device)
5. Both players guess simultaneously at their own pace:
   - Player A sends a guess → Player B sees it, inputs black/white feedback → sends feedback back
   - Player B sends a guess → Player A sees it, inputs black/white feedback → sends feedback back
6. When a player's guess gets 5 black pegs → that player wins
7. Result screen shows on both devices

## Two Simultaneous Flows Per Player

Each player is doing two things at the same time:

- **Guesser role:** submitting guesses against the opponent's code, receiving feedback
- **Code owner role:** receiving opponent's guesses, inputting feedback (same UI as Phase 1 Mode B)

The UI should make both roles clear — perhaps two panels or tabs.

## Socket Events

- `create-room` → server creates room, returns 4-digit code
- `join-room(code)` → server confirms both players connected
- `player-ready` → sent when player has set their code (server waits for both before starting)
- `submit-guess(guess)` → server forwards guess to opponent (the code owner)
- `submit-feedback(blackPegs, whitePegs)` → code owner sends feedback → server forwards to guesser
- `opponent-guess-count(n)` → server broadcasts how many guesses opponent has used (not the guesses themselves)
- `game-over(result)` → server broadcasts winner and final stats

## Security

- Secret codes stored on client only — never sent anywhere
- Server only routes guesses and feedback between players
- Room auto-closes after game ends or 30 min inactivity

## UI Additions

- Home screen: add "צור חדר" / "הצטרף לחדר" buttons
- Waiting screen: "ממתין לשחקן השני..."
- In-game: show opponent's guess count progress (not their actual guesses)
- Disconnection message: "השחקן השני התנתק"

## Deployment — Render.com

Phase 2 requires a live server for WebSockets.

### Setup steps

1. Push the full project to GitHub (including `server.js`)
2. Create a free account at render.com
3. New → Web Service → connect GitHub repo
4. Settings:
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
   - **Environment:** Node
5. Render provides a public URL (e.g. `https://mastermind.onrender.com`)
6. Update the client-side Socket.io connection URL to use this address in production

### Add this file to the project root: `render.yaml`

```yaml
services:
  - type: web
    name: mastermind
    env: node
    buildCommand: npm install
    startCommand: node server.js
    plan: free
```

### Add `package.json` if not already present:

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

### Important note

Free tier on Render sleeps after 15 min of inactivity.
First connection after sleep takes ~30 seconds to wake up.
Show a "מתחבר לשרת..." loading message on the client during this time.

## Definition of Done

- [ ] Room creation and joining works on mobile
- [ ] Both players connected and synced
- [ ] Each player's code stays only on their own device
- [ ] Guess/feedback loop works correctly between two devices
- [ ] Simultaneous play (no waiting for turns)
- [ ] Win detection and result broadcast works
- [ ] Disconnection handled gracefully
- [ ] Works on iOS Safari and Android Chrome
