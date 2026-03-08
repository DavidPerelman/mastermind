# Fix 07 — Show full guess history on result screen (Mode A)

## Goal
On the result screen, show the complete history of guesses + feedback
so the player can verify every calculation was correct.

## What to add to the result screen
After the secret code display, add a scrollable history section showing
all rows from the game — same format as the board during gameplay:
- Each row: row number + 5 colored pegs + feedback dots (black/white)
- Compact size (pegs ~36px)
- Scrollable if many rows
- Label above: "היסטוריית הניחושים:"

## Implementation
- Pass `G.history` and `G.secret` to the result screen
- Build the history rows using the existing `buildRow()` function
- Render them into a new `<div id="result-history">` element in index.html
- Place it between `result-code` and the "שחק שוב" button
- Add `max-height: 40vh; overflow-y: auto` to the history container

## Hebrew text
- "היסטוריית הניחושים:" — section label
