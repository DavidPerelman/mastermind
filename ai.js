'use strict';

// ── Shared constants (loaded before game.js) ──────────────────────────────

const COLORS = [
  { id: 'red',    label: 'אדום',  hex: '#e63946' },
  { id: 'yellow', label: 'צהוב',  hex: '#f4d03f' },
  { id: 'blue',   label: 'כחול',  hex: '#2980b9' },
  { id: 'green',  label: 'ירוק',  hex: '#27ae60' },
  { id: 'orange', label: 'כתום',  hex: '#e67e22' },
  { id: 'brown',  label: 'חום',   hex: '#a0522d' },
  { id: 'purple', label: 'סגול',  hex: '#8e44ad' },
  { id: 'pink',   label: 'ורוד',  hex: '#e91e8c' },
];

const MAX_GUESSES = 10;

// ── Feedback calculation ──────────────────────────────────────────────────
// Returns { blacks, whites }
// blacks = correct colour AND position (בול)
// whites = correct colour, wrong position (פגיעה)

function calcFeedback(secret, guess) {
  const s = [...secret];
  const g = [...guess];
  const len = s.length;
  let blacks = 0;
  let whites  = 0;

  // First pass: exact matches
  for (let i = 0; i < len; i++) {
    if (g[i] === s[i]) { blacks++; s[i] = null; g[i] = null; }
  }

  // Second pass: colour-only matches
  for (let i = 0; i < len; i++) {
    if (g[i] !== null) {
      const j = s.indexOf(g[i]);
      if (j !== -1) { whites++; s[j] = null; }
    }
  }

  return { blacks, whites };
}

// ── Random code generation ────────────────────────────────────────────────

function generateRandomCode({ codeLength, colors }) {
  return Array.from({ length: codeLength }, () =>
    colors[Math.floor(Math.random() * colors.length)].id
  );
}

// ── Mode B: constraint-based AI ───────────────────────────────────────────
//
// Algorithm:
//   1. Start with all n^codeLength possible codes.
//   2. After each feedback, discard every candidate that would NOT produce
//      the same feedback if it were the secret code.
//   3. Next guess = first remaining candidate (typically solves within 6 guesses).

class MastermindAI {
  constructor({ codeLength, colors }) {
    this._codeLength = codeLength;
    this._colors     = colors;
    this._candidates = this._buildAllCodes();
  }

  _buildAllCodes() {
    const ids   = this._colors.map(c => c.id);
    const codes = [];
    const n     = ids.length;
    const total = Math.pow(n, this._codeLength);

    for (let num = 0; num < total; num++) {
      const code = [];
      let tmp    = num;
      for (let i = 0; i < this._codeLength; i++) {
        code.push(ids[tmp % n]);
        tmp = Math.floor(tmp / n);
      }
      codes.push(code);
    }

    // Fisher-Yates shuffle so every game starts with a different first guess
    for (let i = codes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [codes[i], codes[j]] = [codes[j], codes[i]];
    }
    return codes;
  }

  nextGuess() {
    // Fallback: if candidates exhausted (contradictory feedback), guess randomly
    if (this._candidates.length === 0) {
      return generateRandomCode({ codeLength: this._codeLength, colors: this._colors });
    }
    return [...this._candidates[0]];
  }

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
