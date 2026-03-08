# Fix 05 — AI randomness + no footer scroll

## Fix 1 — AI always starts with the same first guess
In `_buildAllCodes()`, the candidate pool is always in the same deterministic order.
Since `nextGuess()` returns `this._candidates[0]`, the first guess is always identical.

Fix: shuffle `this._candidates` randomly at the end of `_buildAllCodes()` before returning:
```js
// at the end of _buildAllCodes(), before return:
for (let i = codes.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [codes[i], codes[j]] = [codes[j], codes[i]];
}
return codes;
```
This makes every game start with a different first guess.

## Fix 2 — Footer must NOT scroll, ever
The footer area (computer guess + secret code + steppers + confirm button) must be 
a fixed-height block with NO internal scroll. Everything must be visible at once.

Rules:
- `.game-footer` must have `overflow: hidden` (not auto, not scroll)
- Remove `max-height: 35dvh` — instead set a fixed `height` that fits all content
- All footer content must be visible without ANY scrolling
- Shrink everything in the footer until it fits:
  - Computer guess pegs: 26px
  - Player secret pegs: 22px  
  - Stepper buttons: 32px × 32px
  - Step value font: 1rem
  - Feedback label font: 0.85rem
  - "אשר ניקוד" button height: 44px
  - Gap between footer items: 4px
  - Footer padding: 6px 12px
- The board above takes all remaining space via `flex: 1; overflow-y: auto`
- Total footer height should be approximately 220px max
