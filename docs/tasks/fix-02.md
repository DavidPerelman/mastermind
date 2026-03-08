# Fix 02 — Layout, AI bug, home screen

## Fix 1 — Board size: too small
The board panel is too small relative to the screen.
- Board should take up ~70% of the screen height
- Peg circles in the board rows should be larger (at least 44px)
- The feedback dots panel on the left should be smaller (dots ~8px, compact)
- The footer area (computer guess + scoring controls) should be more compact

## Fix 2 — AI freezes after guess 5
The AI stops after the 5th guess and gets stuck on "המחשב חושב".
Root cause: the candidate pool is being pruned incorrectly — 
likely the feedback comparison uses the wrong argument order.
Check `calcFeedback(candidate, lastGuess)` in the `update()` method of MastermindAI.
It should be `calcFeedback(candidate, lastGuess)` where `candidate` is the hypothetical 
secret and `lastGuess` is what was guessed — verify the argument order is correct.
Also add a safety fallback: if candidatesLeft === 0, reset to a random remaining guess 
instead of freezing.

## Fix 3 — AI ignores feedback (guesses wrong colors)
The AI is not correctly eliminating candidates based on feedback.
Example: player marks 0 whites for a color, but AI keeps guessing that color.
Review the pruning logic: after feedback (blacks, whites), keep only candidates where 
`calcFeedback(candidate, lastGuess)` returns exactly `{blacks, whites}`.
Make sure the feedback the player enters is being passed correctly to `ai.update()`.

## Fix 4 — Home screen: restore original design with icons
The home screen should look like the FIRST version that was built:
- 5 colored dots at the top (decorative, one per game color)
- Large gradient title "מאסטרמיינד"
- Subtitle "בול פגיעה" in muted color
- Two mode buttons WITHOUT a card wrapper around them:
  - Button 1: emoji 🤔 + "אני מנחש" + small subtitle "נחש את הקוד הסודי של המחשב"
  - Button 2: emoji 🤖 + "המחשב מנחש" + small subtitle "המחשב ינסה לנחש את הקוד שלך"
- Buttons should be styled as glassmorphism cards (dark background, subtle border)
- No wrapping container around both buttons
