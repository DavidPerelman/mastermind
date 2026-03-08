'use strict';

// ── DOM helpers ───────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const el = (tag, ...cls) => {
  const e = document.createElement(tag);
  if (cls.length) e.className = cls.join(' ');
  return e;
};

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

function applyPegColor(elem, colorId) {
  if (colorId) {
    const c = COLORS.find(c => c.id === colorId);
    elem.style.backgroundColor = c.hex;
    elem.style.boxShadow = `0 2px 12px ${c.hex}99`;
    elem.classList.add('filled');
  } else {
    elem.style.backgroundColor = '';
    elem.style.boxShadow = '';
    elem.classList.remove('filled');
  }
}

// ── Shared board-row builder ──────────────────────────────────────
// options: { empty, active, completed, winning, animate, selectedSlot, onSlotClick }
function buildRow(num, guessArr, feedback, options = {}) {
  const codeLen = settings.config.codeLength;
  const row = el('div', 'board-row');
  if (options.empty)     row.classList.add('empty');
  if (options.active)    row.classList.add('active');
  if (options.completed) row.classList.add('completed');
  if (options.winning)   row.classList.add('winning');
  if (options.animate)   row.classList.add('new');

  const numEl = el('span', 'row-num');
  numEl.textContent = num ?? '';

  // Feedback dots — 2 columns for 4-peg codes, 3 columns for 5-peg codes
  const fbArea = el('div', 'feedback-area');
  const fbCols = codeLen <= 4 ? 2 : 3;
  fbArea.style.gridTemplateColumns = `repeat(${fbCols}, 8px)`;
  fbArea.style.width = fbCols === 2 ? '18px' : '30px';
  for (let i = 0; i < codeLen; i++) {
    const dot = el('div', 'fdot');
    if (feedback) {
      if (i < feedback.blacks)                        dot.classList.add('black');
      else if (i < feedback.blacks + feedback.whites) dot.classList.add('white');
    }
    fbArea.appendChild(dot);
  }
  row.appendChild(fbArea);

  row.appendChild(numEl);

  const pegsArea = el('div', 'pegs-area');
  for (let i = 0; i < codeLen; i++) {
    const slot = el('div', 'peg-slot', 'sm');
    if (options.active) {
      if (i === options.selectedSlot) slot.classList.add('selected');
      slot.addEventListener('click', () => options.onSlotClick?.(i));
    }
    applyPegColor(slot, guessArr?.[i] ?? null);
    pegsArea.appendChild(slot);
  }
  row.appendChild(pegsArea);

  return row;
}

// ── Board width calculator ────────────────────────────────────────
// Row layout (LTR): [fbArea] gap [rowNum 18px] gap [pegsArea]
//   fbArea  = 2-col (18px) for ≤4 pegs, 3-col (30px) for ≥5 pegs
//   pegsArea = n*44px pegs + (n-1)*6px gaps
//   row padding: 6px each side = 12px; gaps between 3 items: 2*6px = 12px
//   board padding: 12px each side = 24px
function calcBoardWidth(codeLen) {
  const fbWidth  = codeLen <= 4 ? 18 : 30;
  const pegsW    = codeLen * 44 + (codeLen - 1) * 6;
  const rowW     = fbWidth + 18 + pegsW + 12 /* row gaps */ + 12 /* row pad */;
  return rowW + 24 /* board pad */ + 4 /* buffer */;
}

// ── Palette helper ────────────────────────────────────────────────
function renderPalette(containerId, onPick) {
  const container = $(containerId);
  container.innerHTML = '';
  for (const c of settings.config.colors) {
    const btn = el('div', 'color-btn');
    btn.style.backgroundColor = c.hex;
    btn.style.boxShadow = `0 2px 14px ${c.hex}44`;
    btn.setAttribute('aria-label', c.label);
    btn.addEventListener('click', () => onPick(c.id));
    container.appendChild(btn);
  }
}

// ════════════════════════════════════════════════════════════════
// SETTINGS — shown before every game start
// ════════════════════════════════════════════════════════════════
const DIFFICULTIES = [
  { id: 'easy',   label: 'קל',     codeLength: 4, colorCount: 6 },
  { id: 'medium', label: 'בינוני', codeLength: 6, colorCount: 8 },
  { id: 'hard',   label: 'קשה',    codeLength: 5, colorCount: 8 },
];

const settings = {
  difficulty:  'easy',
  pendingMode: null,
  get config() {
    const d = DIFFICULTIES.find(d => d.id === this.difficulty);
    return { codeLength: d.codeLength, colors: COLORS.slice(0, d.colorCount) };
  },
};

$('btn-mode-a').addEventListener('click', () => {
  settings.pendingMode = 'A';
  showScreen('screen-settings');
});
$('btn-mode-b').addEventListener('click', () => {
  settings.pendingMode = 'B';
  showScreen('screen-settings');
});

['easy', 'medium', 'hard'].forEach(id => {
  $(`opt-${id}`).addEventListener('click', () => {
    settings.difficulty = id;
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    $(`opt-${id}`).classList.add('selected');
  });
});

$('btn-start-game').addEventListener('click', () => {
  if (settings.pendingMode === 'A') startModeA();
  else                               goToSetup();
});

$('back-settings').addEventListener('click', () => showScreen('screen-home'));

// ════════════════════════════════════════════════════════════════
// SETUP  (Mode B — player picks their secret code)
// ════════════════════════════════════════════════════════════════
let setupCode = [];

function goToSetup() {
  const { codeLength } = settings.config;
  setupCode = Array(codeLength).fill(null);
  $('setup-hint').textContent = `בחר ${codeLength} צבעים — רק אתה יודע את הקוד`;
  renderSetupSlots();
  renderPalette('setup-palette', onSetupColorPick);
  $('btn-ready').disabled = true;
  showScreen('screen-setup');
}

function renderSetupSlots() {
  const container = $('setup-slots');
  container.innerHTML = '';
  for (let i = 0; i < setupCode.length; i++) {
    const slot = el('div', 'peg-slot');
    applyPegColor(slot, setupCode[i]);
    slot.addEventListener('click', () => {
      if (setupCode[i] === null) return;
      setupCode[i] = null;
      renderSetupSlots();
      $('btn-ready').disabled = setupCode.includes(null);
    });
    container.appendChild(slot);
  }
}

function onSetupColorPick(colorId) {
  const idx = setupCode.indexOf(null);
  if (idx === -1) return;
  setupCode[idx] = colorId;
  renderSetupSlots();
  $('btn-ready').disabled = setupCode.includes(null);
}

$('btn-ready').addEventListener('click', () => {
  if (setupCode.includes(null)) return;
  startModeB([...setupCode]);
});

$('back-setup').addEventListener('click', () => showScreen('screen-settings'));

// ── Game State ────────────────────────────────────────────────────
let G = {};

// ════════════════════════════════════════════════════════════════
// MODE A — Player guesses the computer's secret code
// ════════════════════════════════════════════════════════════════
function startModeA() {
  const cfg = settings.config;
  G = {
    mode:     'A',
    secret:   generateRandomCode(cfg),
    attempt:  0,
    history:  [],
    guess:    Array(cfg.codeLength).fill(null),
    selected: 0,
    over:     false,
  };
  $('board-a').style.maxWidth = calcBoardWidth(cfg.codeLength) + 'px';
  renderBoardA();
  refreshPaletteA();
  updateCounterA();
  $('btn-submit-a').disabled = true;
  showScreen('screen-game-a');
}

function updateCounterA() {
  $('counter-a').textContent = `ניסיון ${G.attempt + 1} מתוך ${MAX_GUESSES}`;
}

function refreshPaletteA() {
  renderPalette('palette-a', onModeAColorPick);
}

function renderBoardA() {
  const board = $('board-a');
  const codeLen = settings.config.codeLength;
  board.innerHTML = '';

  const futureCount = MAX_GUESSES - G.attempt - (G.over ? 0 : 1);
  for (let i = 0; i < futureCount; i++) {
    board.appendChild(buildRow(null, null, null, { empty: true }));
  }

  for (let i = 0; i < G.attempt; i++) {
    const { guess, feedback } = G.history[i];
    board.appendChild(buildRow(i + 1, guess, feedback, {
      completed: true,
      winning:   feedback.blacks === codeLen,
      animate:   i === G.attempt - 1,
    }));
  }

  if (!G.over) {
    board.appendChild(buildRow(G.attempt + 1, G.guess, null, {
      active:       true,
      selectedSlot: G.selected,
      onSlotClick:  i => {
        if (G.guess[i] !== null) {
          G.guess[i] = null;
          $('btn-submit-a').disabled = true;
        }
        G.selected = i;
        renderBoardA();
        refreshPaletteA();
      },
    }));
  }

  board.scrollTop = board.scrollHeight;
}

function onModeAColorPick(colorId) {
  if (G.over) return;
  G.guess[G.selected] = colorId;

  const codeLen = settings.config.codeLength;
  const nextEmpty = G.guess.findIndex((c, i) => i > G.selected && c === null);
  if (nextEmpty !== -1) {
    G.selected = nextEmpty;
  } else {
    const anyEmpty = G.guess.indexOf(null);
    G.selected = anyEmpty !== -1 ? anyEmpty : Math.min(G.selected + 1, codeLen - 1);
  }

  renderBoardA();
  refreshPaletteA();
  $('btn-submit-a').disabled = G.guess.includes(null);
}

$('btn-submit-a').addEventListener('click', submitGuessA);
$('back-game-a').addEventListener('click', () => showScreen('screen-home'));

function submitGuessA() {
  if (G.guess.includes(null) || G.over) return;

  const guess    = [...G.guess];
  const feedback = calcFeedback(G.secret, guess);
  G.history.push({ guess, feedback });
  G.attempt++;

  const codeLen = settings.config.codeLength;
  const won  = feedback.blacks === codeLen;
  const lost = !won && G.attempt >= MAX_GUESSES;

  if (won || lost) {
    G.over = true;
    renderBoardA();
    setTimeout(() => showResultA(won), 700);
  } else {
    G.guess    = Array(codeLen).fill(null);
    G.selected = 0;
    updateCounterA();
    renderBoardA();
    refreshPaletteA();
    $('btn-submit-a').disabled = true;
  }
}

function showResultA(won) {
  if (won) {
    $('result-icon').textContent     = '🎉';
    $('result-title').textContent    = 'ניצחת!';
    $('result-subtitle').textContent = `פצחת את הקוד ב־${G.attempt} ניסיונות`;
  } else {
    $('result-icon').textContent     = '💔';
    $('result-title').textContent    = 'הפסדת';
    $('result-subtitle').textContent = 'הקוד היה:';
  }
  renderResultCode(G.secret);
  renderResultHistory(G.history);
  showScreen('screen-result');
}

function renderResultHistory(history) {
  const wrap = $('result-history-wrap');
  const container = $('result-history');
  container.innerHTML = '';
  if (!history || history.length === 0) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  history.forEach(({ guess, feedback }, i) => {
    container.appendChild(buildRow(i + 1, guess, feedback, { completed: true }));
  });
}

// ════════════════════════════════════════════════════════════════
// MODE B — Computer guesses the player's secret code
// ════════════════════════════════════════════════════════════════
function startModeB(playerSecret) {
  G = {
    mode:         'B',
    attempt:      0,
    history:      [],
    ai:           new MastermindAI(settings.config),
    currentGuess: null,
    blackInput:   0,
    whiteInput:   0,
    over:         false,
    _secret:      playerSecret,
  };

  $('board-b').style.maxWidth = calcBoardWidth(settings.config.codeLength) + 'px';
  renderBoardB();
  updateCounterB();
  renderPlayerSecret(playerSecret);

  hideBPanel('computer-guess-area');
  hideBPanel('thinking-area');
  hideBPanel('feedback-controls');
  hideBPanel('player-secret-row');
  showScreen('screen-game-b');
  scheduleComputerGuess();
}

function renderPlayerSecret(code) {
  const container = $('player-secret-pegs');
  container.innerHTML = '';
  for (const colorId of code) {
    const slot = el('div', 'peg-slot');
    applyPegColor(slot, colorId);
    container.appendChild(slot);
  }
}

function updateCounterB() {
  $('counter-b').textContent = `ניסיון ${G.attempt + 1} מתוך ${MAX_GUESSES}`;
}

function renderBoardB() {
  const board = $('board-b');
  const codeLen = settings.config.codeLength;
  board.innerHTML = '';

  const emptyCount = MAX_GUESSES - G.attempt;
  for (let i = 0; i < emptyCount; i++) {
    board.appendChild(buildRow(null, null, null, { empty: true }));
  }

  for (let i = 0; i < G.attempt; i++) {
    const { guess, feedback } = G.history[i];
    board.appendChild(buildRow(i + 1, guess, feedback, {
      completed: true,
      winning:   feedback.blacks === codeLen,
      animate:   i === G.attempt - 1,
    }));
  }

  board.scrollTop = board.scrollHeight;
}

function hideBPanel(id) { $(id).hidden = true;  }
function showBPanel(id) { $(id).hidden = false; }

function scheduleComputerGuess() {
  if (G.over) return;
  showBPanel('thinking-area');
  hideBPanel('computer-guess-area');
  hideBPanel('feedback-controls');
  hideBPanel('player-secret-row');
  setTimeout(makeComputerGuess, 1200);
}

function makeComputerGuess() {
  if (G.over) return;
  const guess = G.ai.nextGuess();
  G.currentGuess = guess;

  const container = $('computer-guess-pegs');
  container.innerHTML = '';
  for (const colorId of guess) {
    const slot = el('div', 'peg-slot');
    applyPegColor(slot, colorId);
    container.appendChild(slot);
  }

  hideBPanel('thinking-area');
  showBPanel('computer-guess-area');
  resetFeedbackInput();
  showBPanel('player-secret-row');
  showBPanel('feedback-controls');
}

function resetFeedbackInput() {
  G.blackInput = 0;
  G.whiteInput = 0;
  $('black-val').textContent = '0';
  $('white-val').textContent = '0';
}

// Stepper controls
$('black-minus').addEventListener('click', () => {
  if (G.blackInput > 0) { G.blackInput--; $('black-val').textContent = G.blackInput; }
});
$('black-plus').addEventListener('click', () => {
  if (G.blackInput + G.whiteInput < settings.config.codeLength) {
    G.blackInput++;
    $('black-val').textContent = G.blackInput;
  }
});
$('white-minus').addEventListener('click', () => {
  if (G.whiteInput > 0) { G.whiteInput--; $('white-val').textContent = G.whiteInput; }
});
$('white-plus').addEventListener('click', () => {
  if (G.whiteInput + G.blackInput < settings.config.codeLength) {
    G.whiteInput++;
    $('white-val').textContent = G.whiteInput;
  }
});

$('btn-confirm').addEventListener('click', confirmFeedback);
$('back-game-b').addEventListener('click', () => showScreen('screen-home'));

function confirmFeedback() {
  if (!G.currentGuess || G.over) return;

  const blacks  = G.blackInput;
  const whites  = G.whiteInput;
  const guess   = [...G.currentGuess];
  const codeLen = settings.config.codeLength;

  G.history.push({ guess, feedback: { blacks, whites } });
  G.ai.update(guess, blacks, whites);
  G.attempt++;

  hideBPanel('feedback-controls');
  hideBPanel('computer-guess-area');
  hideBPanel('player-secret-row');
  G.currentGuess = null;

  if (blacks === codeLen) {
    G.over = true;
    renderBoardB();
    setTimeout(() => showResultB(false), 700);
    return;
  }

  if (G.attempt >= MAX_GUESSES) {
    G.over = true;
    renderBoardB();
    setTimeout(() => showResultB(true), 700);
    return;
  }

  renderBoardB();

  if (G.ai.candidatesLeft === 0) {
    console.warn('Inconsistent feedback detected — no valid candidates remain.');
  }

  updateCounterB();
  scheduleComputerGuess();
}

function showResultB(playerWon) {
  if (playerWon) {
    $('result-icon').textContent     = '🏆';
    $('result-title').textContent    = 'ניצחת!';
    $('result-subtitle').textContent = 'המחשב לא הצליח לפצח את הקוד';
  } else {
    $('result-icon').textContent     = '🤖';
    $('result-title').textContent    = 'המחשב ניצח';
    $('result-subtitle').textContent = `פצח את הקוד ב־${G.attempt} ניסיונות`;
  }
  $('result-code').innerHTML = '';
  $('result-history-wrap').hidden = true;
  showScreen('screen-result');
}

// ════════════════════════════════════════════════════════════════
// RESULT
// ════════════════════════════════════════════════════════════════
function renderResultCode(code) {
  const container = $('result-code');
  container.innerHTML = '';
  for (const colorId of code) {
    const peg = el('div', 'peg-slot');
    applyPegColor(peg, colorId);
    container.appendChild(peg);
  }
}

$('btn-play-again').addEventListener('click', () => showScreen('screen-home'));
