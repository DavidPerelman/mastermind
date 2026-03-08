# Fix 06 — Show secret code on win screen (Mode A)

## Fix — Show the computer's secret code on the result screen (win AND loss)
Currently `showResultA(won)` only calls `renderResultCode(G.secret)` on loss.
On win, `result-code` stays empty.

Fix: always call `renderResultCode(G.secret)` regardless of win or loss.
Change the subtitle on win to: "הקוד היה:" (same as loss) — so the player can verify.

The result screen should show:
- Win: 🎉 "ניצחת!" → "פצחת את הקוד ב־X ניסיונות" → then the code below
- Loss: 💔 "הפסדת" → "הקוד היה:" → then the code below

This way the player can always verify the computer played fairly.
