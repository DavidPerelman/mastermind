# Task 01 — Single Player vs Computer (Phase 1)

## Goal

Build a fully working single-player Mastermind game in the browser.
Player plays against the computer. Mobile-first design.
No server needed. HTML + CSS + JS only.

## Read First

Before coding, read `docs/spec.md` for full game rules and UI details.

## Files to Create

- `index.html` — structure
- `style.css` — modern dark UI, mobile-first
- `game.js` — game flow and UI logic
- `ai.js` — AI logic (separate file)

## Core Mechanic — Who Scores?

**The rule:** Only the person who set the code can give the score.
They are the only one who knows the secret code.

This means:

- **Mode A (player guesses):** Computer set the code → computer calculates feedback automatically
- **Mode B (computer guesses):** Player set the code → player manually inputs feedback (black + white pegs)
  - The computer never "sees" the player's code — it only receives the feedback the player provides
  - This is the same mechanic as online multiplayer (Phase 2), just with an AI instead of a human

## Two Game Sub-Modes

### Mode A: Player Guesses

- Computer randomly generates a secret 5-peg code (hidden)
- Player tries to guess it in 10 attempts
- After each guess, computer automatically calculates and shows black/white peg feedback

### Mode B: Computer Guesses

- Player sets a secret 5-peg code (only the player knows it)
- Computer makes a guess using a smart algorithm
- Player sees the computer's guess and inputs the feedback manually:
  - A simple +/- control for black pegs (פגיעות) and white pegs (בולים)
  - Button: "אשר ניקוד"
- Computer uses the feedback to narrow down its next guess
- Add 1.2 second delay before each computer guess (feels natural)

## Screens

1. **Home screen**
   - Title: "מאסטרמיינד"
   - Two buttons: "אני מנחש" / "המחשב מנחש"

2. **Setup screen** (Mode B only)
   - Player picks their 5-peg secret code privately
   - Button: "אני מוכן, תתחיל לנחש"

3. **Game screen — Mode A**
   - Board: 10 rows × 5 peg slots
   - Active row at bottom, completed rows above
   - Color palette: 8 large color circles (touch-friendly)
   - Button: "שלח ניחוש"
   - Counter: "ניסיון X מתוך 10"
   - Feedback shown automatically after each guess

4. **Game screen — Mode B**
   - Board showing all of computer's guesses so far
   - Computer's current guess displayed prominently
   - Feedback input UI:
     - "כמה פגיעות?" (black pegs — right color, right position) with +/- buttons
     - "כמה בולים?" (white pegs — right color, wrong position) with +/- buttons
     - Button: "אשר ניקוד"
   - Counter: "ניסיון X מתוך 10"

5. **Result screen**
   - Mode A win: "ניצחת! פצחת את הקוד ב־X ניסיונות"
   - Mode A loss: "הפסדת — הקוד היה:" + reveal animation
   - Mode B win (computer guessed): "המחשב ניצח — פצח את הקוד ב־X ניסיונות"
   - Mode B loss (computer failed): "ניצחת! המחשב לא הצליח לפצח את הקוד"
   - Button: "שחק שוב"

## Game Logic

- Code length: 5 pegs
- Colors: 8 (Red, Orange, Yellow, Green, Teal, Blue, Purple, Pink)
- Colors CAN repeat
- Max attempts: 10
- Feedback:
  - Black pegs (פגיעות) = correct color AND correct position
  - White pegs (בולים) = correct color, wrong position (not already counted as black)

## AI Logic (ai.js)

### Mode A

- Generate a random valid 5-peg code at game start

### Mode B — Constraint-based guessing

1. Start with a fixed opening guess (e.g. [Red, Red, Orange, Orange, Yellow])
2. After player confirms feedback, eliminate all codes that would NOT produce the same feedback if they were the secret
3. Pick next guess from remaining valid codes
4. Repeat until solved or 10 attempts used

- Never trust the player's feedback blindly — if feedback is logically impossible (cheating), handle gracefully

## Mobile-First UI

- Minimum touch target: 44px
- Color palette: large circles, easy to tap
- Feedback input (+/- buttons): large and clear
- Works on screens 375px and up
- No hover-only interactions

## Hebrew Text Reference

- "מאסטרמיינד" — title
- "אני מנחש" / "המחשב מנחש" — mode selection
- "בחר קוד סודי" — setup prompt
- "אני מוכן, תתחיל לנחש" — ready button
- "שלח ניחוש" — submit guess
- "ניסיון X מתוך 10" — counter
- "כמה פגיעות?" — black pegs input label
- "כמה בולים?" — white pegs input label
- "אשר ניקוד" — confirm feedback
- "ניצחת!" / "הפסדת" / "המחשב ניצח" — results
- "הקוד היה:" — reveal label
- "שחק שוב" — play again

## Definition of Done

- [ ] Mode A: player guesses computer's code, feedback auto-calculated
- [ ] Mode B: computer guesses, player manually inputs feedback
- [ ] Feedback calculated correctly (black/white pegs)
- [ ] AI makes intelligent constraint-based guesses
- [ ] All text in Hebrew
- [ ] Smooth animations
- [ ] Works on mobile (iOS Safari + Android Chrome)
