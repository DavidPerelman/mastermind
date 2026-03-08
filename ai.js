'use strict';

// ── Shared constants (loaded before game.js) ──────────────────────────────

const COLORS = [
  { id: 'red',    label: 'אדום',   hex: '#ff4757' },
  { id: 'orange', label: 'כתום',   hex: '#ff9f43' },
  { id: 'yellow', label: 'צהוב',   hex: '#ffd32a' },
  { id: 'green',  label: 'ירוק',   hex: '#2ed573' },
  { id: 'teal',   label: 'טורקיז', hex: '#01adb5' },
  { id: 'blue',   label: 'כחול',   hex: '#1e90ff' },
  { id: 'purple', label: 'סגול',   hex: '#a29bfe' },
  { id: 'pink',   label: 'ורוד',   hex: '#fd79a8' },
];

const CODE_LENGTH = 5;
const MAX_GUESSES = 10;

// ── Feedback calculation ──────────────────────────────────────────────────
// Returns { blacks, whites }
// blacks = correct colour AND position
// whites = correct colour, wrong position (not already counted as black)

function calcFeedback(secret, guess) {
  const s = [...secret];
  const g = [...guess];
  let blacks = 0;
  let whites  = 0;

  // First pass: exact matches
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (g[i] === s[i]) { blacks++; s[i] = null; g[i] = null; }
  }

  // Second pass: colour-only matches
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (g[i] !== null) {
      const j = s.indexOf(g[i]);
      if (j !== -1) { whites++; s[j] = null; }
    }
  }

  return { blacks, whites };
}

// ── Mode A: random code generation ───────────────────────────────────────

function generateRandomCode(allowRepeats = true) {
  if (allowRepeats) {
    return Array.from({ length: CODE_LENGTH }, () =>
      COLORS[Math.floor(Math.random() * COLORS.length)].id
    );
  }
  // No repeats: shuffle colours and take first CODE_LENGTH
  const pool = [...COLORS].sort(() => Math.random() - 0.5);
  return pool.slice(0, CODE_LENGTH).map(c => c.id);
}

// ── Mode B: constraint-based AI ───────────────────────────────────────────
//
// Algorithm:
//   1. Start with the full set of all 8^5 = 32 768 possible codes.
//   2. First guess is always [red, red, orange, orange, yellow] (as per spec).
//   3. After each feedback, discard every candidate that would NOT produce
//      the same feedback if it were the secret code.
//   4. Next guess = first remaining candidate (simple but effective;
//      typically solves within 6 guesses).

class MastermindAI {
  constructor(allowRepeats = true) {
    this._allowRepeats = allowRepeats;
    this._candidates   = this._buildAllCodes();
  }

  // Enumerate all valid codes (filtered by allowRepeats)
  _buildAllCodes() {
    const ids   = COLORS.map(c => c.id);
    const codes = [];
    const n     = ids.length;
    const total = Math.pow(n, CODE_LENGTH);

    for (let num = 0; num < total; num++) {
      const code = [];
      let tmp    = num;
      for (let i = 0; i < CODE_LENGTH; i++) {
        code.push(ids[tmp % n]);
        tmp = Math.floor(tmp / n);
      }
      if (!this._allowRepeats && new Set(code).size !== CODE_LENGTH) continue;
      codes.push(code);
    }

    // Fisher-Yates shuffle so every game starts with a different first guess
    for (let i = codes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [codes[i], codes[j]] = [codes[j], codes[i]];
    }
    return codes;
  }

  // Return the next guess
  nextGuess() {
    // Fallback: if candidates exhausted (contradictory feedback), guess randomly
    if (this._candidates.length === 0) {
      return generateRandomCode(this._allowRepeats);
    }
    return [...this._candidates[0]];
  }

  // Prune candidates that are inconsistent with the latest feedback
  update(lastGuess, blacks, whites) {
    this._candidates = this._candidates.filter(candidate => {
      const fb = calcFeedback(candidate, lastGuess);
      return fb.blacks === blacks && fb.whites === whites;
    });
  }

  get candidatesLeft() {
    return this._candidates.length;
  }
}
