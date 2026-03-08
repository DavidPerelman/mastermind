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
  const row = el('div', 'board-row');
  if (options.empty)     row.classList.add('empty');
  if (options.active)    row.classList.add('active');
  if (options.completed) row.classList.add('completed');
  if (options.winning)   row.classList.add('winning');
  if (options.animate)   row.classList.add('new');

  const numEl = el('span', 'row-num');
  numEl.textContent = num ?? '';
  const fbArea = el('div', 'feedback-area');
  for (let i = 0; i < CODE_LENGTH; i++) {
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
  for (let i = 0; i < CODE_LENGTH; i++) {
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

// ── Palette helper ────────────────────────────────────────────────
// usedColors: array of colorIds already placed (grayed out when allowRepeats=false)
function renderPalette(containerId, onPick, usedColors = []) {
  const container = $(containerId);
  container.innerHTML = '';
  for (const c of COLORS) {
    const btn = el('div', 'color-btn');
    btn.style.backgroundColor = c.hex;
    btn.style.boxShadow = `0 2px 14px ${c.hex}44`;
    btn.setAttribute('aria-label', c.label);
    const isDisabled = !settings.allowRepeats && usedColors.includes(c.id);
    if (isDisabled) {
      btn.classList.add('disabled');
    } else {
      btn.addEventListener('click', () => onPick(c.id));
    }
    container.appendChild(btn);
  }
}

// ════════════════════════════════════════════════════════════════
// SETTINGS — shown before every game start
// ════════════════════════════════════════════════════════════════
const settings = {
  allowRepeats: true,
  pendingMode:  null,   // 'A' or 'B' — which mode to start after settings
};

$('btn-mode-a').addEventListener('click', () => {
  settings.pendingMode = 'A';
  showScreen('screen-settings');
});
$('btn-mode-b').addEventListener('click', () => {
  settings.pendingMode = 'B';
  showScreen('screen-settings');
});

$('opt-yes').addEventListener('click', () => {
  settings.allowRepeats = true;
  $('opt-yes').classList.add('selected');
  $('opt-no').classList.remove('selected');
});
$('opt-no').addEventListener('click', () => {
  settings.allowRepeats = false;
  $('opt-no').classList.add('selected');
  $('opt-yes').classList.remove('selected');
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
  setupCode = Array(CODE_LENGTH).fill(null);
  renderSetupSlots();
  renderPalette('setup-palette', onSetupColorPick, []);
  $('btn-ready').disabled = true;
  showScreen('screen-setup');
}

function renderSetupSlots() {
  const container = $('setup-slots');
  container.innerHTML = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const slot = el('div', 'peg-slot');
    applyPegColor(slot, setupCode[i]);
    slot.addEventListener('click', () => {
      if (setupCode[i] === null) return;
      setupCode[i] = null;
      renderSetupSlots();
      renderPalette('setup-palette', onSetupColorPick, setupCode.filter(Boolean));
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
  renderPalette('setup-palette', onSetupColorPick, setupCode.filter(Boolean));
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
  G = {
    mode:    'A',
    secret:  generateRandomCode(settings.allowRepeats),
    attempt: 0,
    history: [],
    guess:   Array(CODE_LENGTH).fill(null),
    selected: 0,
    over:    false,
  };
  renderBoardA();
  refreshPaletteA();
  updateCounterA();
  $('btn-submit-a').disabled = true;
  showScreen('screen-game-a');
}

function updateCounterA() {
  $('counter-a').textContent = `ניסיון ${G.attempt + 1} מתוך ${MAX_GUESSES}`;
}

// Re-render palette reflecting currently placed colours (for no-repeat mode)
function refreshPaletteA() {
  const used = G.guess.filter(c => c !== null);
  renderPalette('palette-a', onModeAColorPick, used);
}

function renderBoardA() {
  const board = $('board-a');
  board.innerHTML = '';

  // Future empty rows at top
  const futureCount = MAX_GUESSES - G.attempt - (G.over ? 0 : 1);
  for (let i = 0; i < futureCount; i++) {
    board.appendChild(buildRow(null, null, null, { empty: true }));
  }

  // Completed rows (oldest first → newest just above active)
  for (let i = 0; i < G.attempt; i++) {
    const { guess, feedback } = G.history[i];
    board.appendChild(buildRow(i + 1, guess, feedback, {
      completed: true,
      winning:   feedback.blacks === CODE_LENGTH,
      animate:   i === G.attempt - 1,
    }));
  }

  // Active row at bottom
  if (!G.over) {
    board.appendChild(buildRow(G.attempt + 1, G.guess, null, {
      active:      true,
      selectedSlot: G.selected,
      onSlotClick:  i => {
        // Tapping a filled slot clears it; tapping any slot selects it
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
  // In no-repeat mode, skip if this colour is already placed
  if (!settings.allowRepeats && G.guess.includes(colorId)) return;
  G.guess[G.selected] = colorId;

  // Auto-advance selection to the next empty slot
  const nextEmpty = G.guess.findIndex((c, i) => i > G.selected && c === null);
  if (nextEmpty !== -1) {
    G.selected = nextEmpty;
  } else {
    const anyEmpty = G.guess.indexOf(null);
    G.selected = anyEmpty !== -1 ? anyEmpty : Math.min(G.selected + 1, CODE_LENGTH - 1);
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

  const won  = feedback.blacks === CODE_LENGTH;
  const lost = !won && G.attempt >= MAX_GUESSES;

  if (won || lost) {
    G.over = true;
    renderBoardA();
    setTimeout(() => showResultA(won), 700);
  } else {
    G.guess    = Array(CODE_LENGTH).fill(null);
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
    ai:           new MastermindAI(settings.allowRepeats),
    currentGuess: null,
    blackInput:   0,
    whiteInput:   0,
    over:         false,
    _secret:      playerSecret,
  };

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

// Render the player's secret code in the persistent display strip
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
  board.innerHTML = '';

  const emptyCount = MAX_GUESSES - G.attempt;
  for (let i = 0; i < emptyCount; i++) {
    board.appendChild(buildRow(null, null, null, { empty: true }));
  }

  for (let i = 0; i < G.attempt; i++) {
    const { guess, feedback } = G.history[i];
    board.appendChild(buildRow(i + 1, guess, feedback, {
      completed: true,
      winning:   feedback.blacks === CODE_LENGTH,
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
  // Show secret + feedback controls together so player can compare
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
  if (G.blackInput + G.whiteInput < CODE_LENGTH) {
    G.blackInput++;
    $('black-val').textContent = G.blackInput;
  }
});
$('white-minus').addEventListener('click', () => {
  if (G.whiteInput > 0) { G.whiteInput--; $('white-val').textContent = G.whiteInput; }
});
$('white-plus').addEventListener('click', () => {
  if (G.whiteInput + G.blackInput < CODE_LENGTH) {
    G.whiteInput++;
    $('white-val').textContent = G.whiteInput;
  }
});

$('btn-confirm').addEventListener('click', confirmFeedback);
$('back-game-b').addEventListener('click', () => showScreen('screen-home'));

function confirmFeedback() {
  if (!G.currentGuess || G.over) return;

  const blacks = G.blackInput;
  const whites = G.whiteInput;
  const guess  = [...G.currentGuess];

  G.history.push({ guess, feedback: { blacks, whites } });
  G.ai.update(guess, blacks, whites);
  G.attempt++;

  hideBPanel('feedback-controls');
  hideBPanel('computer-guess-area');
  hideBPanel('player-secret-row');
  G.currentGuess = null;

  if (blacks === CODE_LENGTH) {
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
