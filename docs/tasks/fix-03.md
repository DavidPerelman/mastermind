# Fix 03 — Win detection + UI compactness

## Fix 1 — CRITICAL: 5 blacks does not end the game (Mode B)
In `confirmFeedback()`, when `blacks === CODE_LENGTH`, the game continues instead of ending.
Fix:
- Set `G.over = true` BEFORE calling `renderBoardB()` and BEFORE any setTimeout
- Wrap `showResultB(false)` in `setTimeout(..., 700)` like Mode A does
- Add an early guard at the top of `scheduleComputerGuess()` and `makeComputerGuess()`:
  `if (G.over) return;`
- The correct order in confirmFeedback:
  1. Push to history
  2. Update AI
  3. Increment attempt
  4. Hide panels
  5. Check win/loss → set G.over = true → renderBoardB() → setTimeout(showResultB, 700) → return
  6. Only if not over: updateCounterB() → scheduleComputerGuess()

## Fix 2 — AI first guess should not be fixed/predictable
In `MastermindAI.nextGuess()`, remove the fixed first guess.
Instead, always return `this._candidates[0]` (the first candidate from the full pool).
This avoids the awkward situation where the opening guess accidentally matches the player's code.

## Fix 3 — Footer too tall, takes up too much screen space
The mode-b footer area is too large. Make it more compact:
- Reduce padding on `.game-footer` to `6px 12px`
- Reduce gap in `.mode-b-footer` to `6px`
- Make computer-guess pegs and player-secret pegs smaller: `28px × 28px`
- Reduce stepper button size to `34px × 34px`
- Reduce font sizes slightly in feedback controls
- The board area above should take up at least 55% of the screen height
