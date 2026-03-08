# Fix 01 — Bug fixes + UI improvements

## Fix 1 — CRITICAL BUG: game freezes when computer wins
When the player enters 5 black pegs, the game freezes on "המחשב חושב".
In `confirmFeedback()`: when `blacks === CODE_LENGTH`, call `showResultB(false)` immediately.
Do NOT call `scheduleComputerGuess()` in this case.

## Fix 2 — Home screen: revert to original style
Remove the card/container wrapping the buttons.
Layout should be: gradient title → subtitle "בול פגיעה" → two plain buttons with gap between them.

## Fix 3 — Game board: narrow and tall like a real Mastermind board
- Board max-width: 320px, centered on screen
- Feedback dots on the LEFT of each row (like the physical game)
- Rows should feel compact and vertical
- The whole board should look like a narrow column, not a wide table
