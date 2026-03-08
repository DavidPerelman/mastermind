# Fix 08 — Difficulty levels + clearer colors

## Fix 1 — Difficulty levels
Replace the "האם צבעים יכולים לחזור?" settings screen with a full difficulty selector.
The difficulty affects: number of peg slots (code length) and number of available colors.
Colors can ALWAYS repeat (remove the repeat toggle entirely).

### Difficulty options:
| Level | Hebrew name | Code length | Colors available |
|-------|-------------|-------------|-----------------|
| קל | קל | 4 | 6 (first 6 colors) |
| בינוני | בינוני | 4 | 8 (all colors) |
| קשה | קשה | 5 | 8 (all colors) |

- Default selected: "קל"
- Settings screen shows 3 buttons (like the repeat options)
- Pass difficulty to game logic: CODE_LENGTH and active COLORS subset
- AI must also respect the active difficulty settings

## Fix 2 — Clearer, more natural colors
Replace the current neon colors with more distinct, natural colors that are 
easier to tell apart, especially for people with color vision differences.

New color palette (replace in ai.js COLORS array):
- 🔴 Red:    #e63946  (clear red)
- 🟡 Yellow: #f4d03f  (clear yellow)
- 🔵 Blue:   #2980b9  (clear blue)
- 🟢 Green:  #27ae60  (clear green)
- 🟠 Orange: #e67e22  (clear orange)
- 🟤 Brown:  #a0522d  (clear brown — easy to distinguish from all others)
- 🟣 Purple: #8e44ad  (clear purple)
- 🩷 Pink:   #e91e8c  (clear pink)

These 6 are used in "קל" mode: Red, Yellow, Blue, Green, Orange, White.
All 8 are used in "בינוני" and "קשה" modes.

## Notes
- Remove `allowRepeats` setting entirely from settings, game state, and AI
- Colors always repeat in all difficulty levels
- Update `generateRandomCode()` and `MastermindAI` to accept `{ codeLength, colors }` config
