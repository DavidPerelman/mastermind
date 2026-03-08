# Fix 04 — Terminology swap + responsive layout

## Fix 1 — CRITICAL: Hebrew terms are swapped
In the game "בול פגיעה":
- **בול** = correct color AND correct position (black peg) → winning = 5 בולים
- **פגיעה** = correct color, wrong position (white peg)

Currently the UI has it backwards. Fix everywhere:
- "כמה פגיעות?" → change to "כמה בולים?" (black pegs — correct position)
- "כמה בולים?" → change to "כמה פגיעות?" (white pegs — correct color, wrong position)
- In result: winning in Mode B is "5 בולים" not "5 פגיעות"
- Variable names in JS can stay as `blacks`/`whites` — only fix the Hebrew UI labels

## Fix 2 — Layout gets cut off on smaller screens
The board + footer don't fit on screen without scrolling or zoom-out.
Fix:
- The entire game screen must fit within 100dvh with NO overflow
- `.game-footer` must never exceed 35% of screen height
- `.board` must use `flex: 1` and `overflow-y: auto` so it scrolls internally
- Footer elements should shrink if needed:
  - If screen height < 700px: reduce peg sizes to 24px, stepper to 30px, font to 0.8rem
  - The "אשר ניקוד" button must always be visible without scrolling
- Test at 667px height (iPhone SE) — everything must fit
