"use strict";

// ── DOM helpers ───────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const el = (tag, ...cls) => {
  const e = document.createElement(tag);
  if (cls.length) e.className = cls.join(" ");
  return e;
};

function showScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
}

function applyPegColor(elem, colorId) {
  if (colorId) {
    const c = COLORS.find((c) => c.id === colorId);
    elem.style.backgroundColor = c.hex;
    elem.style.boxShadow = `0 2px 12px ${c.hex}99`;
    elem.classList.add("filled");
  } else {
    elem.style.backgroundColor = "";
    elem.style.boxShadow = "";
    elem.classList.remove("filled");
  }
}

// ── Shared board-row builder ──────────────────────────────────────
// options: { empty, active, completed, winning, animate, selectedSlot, onSlotClick }
function buildRow(num, guessArr, feedback, options = {}) {
  const codeLen = settings.config.codeLength;
  const row = el("div", "board-row");
  if (options.empty) row.classList.add("empty");
  if (options.active) row.classList.add("active");
  if (options.completed) row.classList.add("completed");
  if (options.winning) row.classList.add("winning");
  if (options.animate) row.classList.add("new");

  const numEl = el("span", "row-num");
  numEl.textContent = num ?? "";

  // Feedback dots - 2 columns for 4-peg codes, 3 columns for 5-peg codes
  const fbArea = el("div", "feedback-area");
  const fbCols = codeLen <= 4 ? 2 : 3;
  fbArea.style.gridTemplateColumns = `repeat(${fbCols}, 8px)`;
  fbArea.style.width = fbCols === 2 ? "18px" : "30px";
  for (let i = 0; i < codeLen; i++) {
    const dot = el("div", "fdot");
    if (feedback) {
      if (i < feedback.blacks) dot.classList.add("black");
      else if (i < feedback.blacks + feedback.whites)
        dot.classList.add("white");
    }
    fbArea.appendChild(dot);
  }
  row.appendChild(fbArea);

  row.appendChild(numEl);

  const pegsArea = el("div", "pegs-area");
  for (let i = 0; i < codeLen; i++) {
    const slot = el("div", "peg-slot", "sm");
    if (options.active) {
      if (i === options.selectedSlot) slot.classList.add("selected");
      slot.addEventListener("click", () => options.onSlotClick?.(i));
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
  const fbWidth = codeLen <= 4 ? 18 : 30;
  const pegsW = codeLen * 44 + (codeLen - 1) * 6;
  const rowW = fbWidth + 18 + pegsW + 12 /* row gaps */ + 12; /* row pad */
  return rowW + 24 /* board pad */ + 4 /* buffer */;
}

// ── Palette helper ────────────────────────────────────────────────
function renderPalette(containerId, onPick) {
  const container = $(containerId);
  container.innerHTML = "";
  for (const c of settings.config.colors) {
    const btn = el("div", "color-btn");
    btn.style.backgroundColor = c.hex;
    btn.style.boxShadow = `0 2px 14px ${c.hex}44`;
    btn.setAttribute("aria-label", c.label);
    btn.addEventListener("click", () => onPick(c.id));
    container.appendChild(btn);
  }
}

// ════════════════════════════════════════════════════════════════
// SETTINGS - shown before every game start
// ════════════════════════════════════════════════════════════════
const DIFFICULTIES = [
  { id: "easy", label: "קל", codeLength: 4, colorCount: 6 },
  { id: "medium", label: "בינוני", codeLength: 6, colorCount: 8 },
  { id: "hard", label: "קשה", codeLength: 5, colorCount: 8 },
];

const settings = {
  difficulty: "easy",
  allowRepeats: true,
  pendingMode: null,
  get config() {
    const d = DIFFICULTIES.find((d) => d.id === this.difficulty);
    return {
      codeLength: d.codeLength,
      colors: COLORS.slice(0, d.colorCount),
      allowRepeats: this.allowRepeats,
    };
  },
};

$("btn-help").addEventListener("click", () => {
  $("modal-help").hidden = false;
});
$("btn-close-help").addEventListener("click", () => {
  $("modal-help").hidden = true;
});
$("modal-help").addEventListener("click", (e) => {
  if (e.target === $("modal-help")) $("modal-help").hidden = true;
});

$("btn-mode-a").addEventListener("click", () => {
  settings.pendingMode = "A";
  showScreen("screen-settings");
});
$("btn-mode-b").addEventListener("click", () => {
  settings.pendingMode = "B";
  showScreen("screen-settings");
});

["easy", "medium", "hard"].forEach((id) => {
  $(`opt-${id}`).addEventListener("click", () => {
    settings.difficulty = id;
    document
      .querySelectorAll("#screen-settings .option-btn")
      .forEach((b) => b.classList.remove("selected"));
    $(`opt-${id}`).classList.add("selected");
    // Re-select the active repeat option
    if (settings.allowRepeats) {
      $("opt-repeat-yes").classList.add("selected");
    } else {
      $("opt-repeat-no").classList.add("selected");
    }
  });
});

$("opt-repeat-yes").addEventListener("click", () => {
  settings.allowRepeats = true;
  $("opt-repeat-yes").classList.add("selected");
  $("opt-repeat-no").classList.remove("selected");
});
$("opt-repeat-no").addEventListener("click", () => {
  settings.allowRepeats = false;
  $("opt-repeat-no").classList.add("selected");
  $("opt-repeat-yes").classList.remove("selected");
});

$("btn-start-game").addEventListener("click", () => {
  if (settings.pendingMode === "A") startModeA();
  else goToSetup();
});

$("back-settings").addEventListener("click", () => showScreen("screen-home"));

// ════════════════════════════════════════════════════════════════
// SETUP  (Mode B - player picks their secret code)
// ════════════════════════════════════════════════════════════════
let setupCode = [];

function goToSetup() {
  const { codeLength } = settings.config;
  setupCode = Array(codeLength).fill(null);
  $("setup-hint").textContent = `בחר ${codeLength} צבעים - רק אתה יודע את הקוד`;
  renderSetupSlots();
  renderPalette("setup-palette", onSetupColorPick);
  $("btn-ready").disabled = true;
  showScreen("screen-setup");
}

function renderSetupSlots() {
  const container = $("setup-slots");
  container.innerHTML = "";
  for (let i = 0; i < setupCode.length; i++) {
    const slot = el("div", "peg-slot");
    applyPegColor(slot, setupCode[i]);
    slot.addEventListener("click", () => {
      if (setupCode[i] === null) return;
      setupCode[i] = null;
      renderSetupSlots();
      $("btn-ready").disabled = setupCode.includes(null);
    });
    container.appendChild(slot);
  }
}

function onSetupColorPick(colorId) {
  if (settings.config.allowRepeats === false && setupCode.includes(colorId))
    return;
  const idx = setupCode.indexOf(null);
  if (idx === -1) return;
  setupCode[idx] = colorId;
  renderSetupSlots();
  $("btn-ready").disabled = setupCode.includes(null);
}

$("btn-ready").addEventListener("click", () => {
  if (setupCode.includes(null)) return;
  if (settings.pendingMode === "MP") mpOnReady([...setupCode]);
  else startModeB([...setupCode]);
});

$("back-setup").addEventListener("click", () => {
  if (settings.pendingMode === "MP") {
    leaveGame();
    showScreen("screen-home");
  } else showScreen("screen-settings");
});

// ── Game State ────────────────────────────────────────────────────
let G = {};

// ════════════════════════════════════════════════════════════════
// MODE A - Player guesses the computer's secret code
// ════════════════════════════════════════════════════════════════
function startModeA() {
  const cfg = settings.config;
  G = {
    mode: "A",
    secret: generateRandomCode(cfg),
    attempt: 0,
    history: [],
    guess: Array(cfg.codeLength).fill(null),
    selected: 0,
    over: false,
  };
  $("board-a").style.maxWidth = calcBoardWidth(cfg.codeLength) + "px";
  renderBoardA();
  refreshPaletteA();
  updateCounterA();
  $("btn-submit-a").disabled = true;
  showScreen("screen-game-a");
}

function updateCounterA() {
  $("counter-a").textContent = `ניסיון ${G.attempt + 1} מתוך ${MAX_GUESSES}`;
}

function refreshPaletteA() {
  renderPalette("palette-a", onModeAColorPick);
}

function renderBoardA() {
  const board = $("board-a");
  const codeLen = settings.config.codeLength;
  board.innerHTML = "";

  const futureCount = MAX_GUESSES - G.attempt - (G.over ? 0 : 1);
  for (let i = 0; i < futureCount; i++) {
    board.appendChild(buildRow(null, null, null, { empty: true }));
  }

  for (let i = 0; i < G.attempt; i++) {
    const { guess, feedback } = G.history[i];
    board.appendChild(
      buildRow(i + 1, guess, feedback, {
        completed: true,
        winning: feedback.blacks === codeLen,
        animate: i === G.attempt - 1,
      }),
    );
  }

  if (!G.over) {
    board.appendChild(
      buildRow(G.attempt + 1, G.guess, null, {
        active: true,
        selectedSlot: G.selected,
        onSlotClick: (i) => {
          if (G.guess[i] !== null) {
            G.guess[i] = null;
            $("btn-submit-a").disabled = true;
          }
          G.selected = i;
          renderBoardA();
          refreshPaletteA();
        },
      }),
    );
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
    G.selected =
      anyEmpty !== -1 ? anyEmpty : Math.min(G.selected + 1, codeLen - 1);
  }

  renderBoardA();
  refreshPaletteA();
  $("btn-submit-a").disabled = G.guess.includes(null);
}

$("btn-submit-a").addEventListener("click", submitGuessA);
$("back-game-a").addEventListener("click", () => showScreen("screen-home"));

function submitGuessA() {
  if (G.guess.includes(null) || G.over) return;

  const guess = [...G.guess];
  const feedback = calcFeedback(G.secret, guess);
  G.history.push({ guess, feedback });
  G.attempt++;

  const codeLen = settings.config.codeLength;
  const won = feedback.blacks === codeLen;
  const lost = !won && G.attempt >= MAX_GUESSES;

  if (won || lost) {
    G.over = true;
    renderBoardA();
    setTimeout(() => showResultA(won), 700);
  } else {
    G.guess = Array(codeLen).fill(null);
    G.selected = 0;
    updateCounterA();
    renderBoardA();
    refreshPaletteA();
    $("btn-submit-a").disabled = true;
  }
}

function showResultA(won) {
  if (won) {
    $("result-icon").textContent = "🎉";
    $("result-title").textContent = "ניצחת!";
    $("result-subtitle").textContent = `פיצחת את הקוד ב־${G.attempt} ניסיונות`;
  } else {
    $("result-icon").textContent = "💔";
    $("result-title").textContent = "הפסדת";
    $("result-subtitle").textContent = "הקוד היה:";
  }
  $("mp-result-opp").hidden = true;
  $("mp-history-wrap").hidden = true;
  renderResultCode(G.secret);
  renderResultHistory(G.history);
  showScreen("screen-result");
}

function renderResultHistory(history) {
  const wrap = $("result-history-wrap");
  const container = $("result-history");
  container.innerHTML = "";
  if (!history || history.length === 0) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  history.forEach(({ guess, feedback }, i) => {
    container.appendChild(
      buildRow(i + 1, guess, feedback, { completed: true }),
    );
  });
}

// ════════════════════════════════════════════════════════════════
// MODE B - Computer guesses the player's secret code
// ════════════════════════════════════════════════════════════════
function startModeB(playerSecret) {
  G = {
    mode: "B",
    attempt: 0,
    history: [],
    ai: new MastermindAI(settings.config),
    currentGuess: null,
    blackInput: 0,
    whiteInput: 0,
    over: false,
    _secret: playerSecret,
  };

  $("board-b").style.maxWidth =
    calcBoardWidth(settings.config.codeLength) + "px";
  renderBoardB();
  updateCounterB();
  renderPlayerSecret(playerSecret);

  hideBPanel("computer-guess-area");
  hideBPanel("thinking-area");
  hideBPanel("feedback-controls");
  hideBPanel("player-secret-row");
  showScreen("screen-game-b");
  scheduleComputerGuess();
}

function renderPlayerSecret(code) {
  const container = $("player-secret-pegs");
  container.innerHTML = "";
  for (const colorId of code) {
    const slot = el("div", "peg-slot");
    applyPegColor(slot, colorId);
    container.appendChild(slot);
  }
}

function updateCounterB() {
  $("counter-b").textContent = `ניסיון ${G.attempt + 1} מתוך ${MAX_GUESSES}`;
}

function renderBoardB() {
  const board = $("board-b");
  const codeLen = settings.config.codeLength;
  board.innerHTML = "";

  const emptyCount = MAX_GUESSES - G.attempt;
  for (let i = 0; i < emptyCount; i++) {
    board.appendChild(buildRow(null, null, null, { empty: true }));
  }

  for (let i = 0; i < G.attempt; i++) {
    const { guess, feedback } = G.history[i];
    board.appendChild(
      buildRow(i + 1, guess, feedback, {
        completed: true,
        winning: feedback.blacks === codeLen,
        animate: i === G.attempt - 1,
      }),
    );
  }

  board.scrollTop = board.scrollHeight;
}

function hideBPanel(id) {
  $(id).hidden = true;
}
function showBPanel(id) {
  $(id).hidden = false;
}

function scheduleComputerGuess() {
  if (G.over) return;
  showBPanel("thinking-area");
  hideBPanel("computer-guess-area");
  hideBPanel("feedback-controls");
  hideBPanel("player-secret-row");
  setTimeout(makeComputerGuess, 1200);
}

function makeComputerGuess() {
  if (G.over) return;
  const guess = G.ai.nextGuess();
  G.currentGuess = guess;

  const container = $("computer-guess-pegs");
  container.innerHTML = "";
  for (const colorId of guess) {
    const slot = el("div", "peg-slot");
    applyPegColor(slot, colorId);
    container.appendChild(slot);
  }

  hideBPanel("thinking-area");
  showBPanel("computer-guess-area");
  resetFeedbackInput();
  showBPanel("player-secret-row");
  showBPanel("feedback-controls");
}

function resetFeedbackInput() {
  G.blackInput = 0;
  G.whiteInput = 0;
  $("black-val").textContent = "0";
  $("white-val").textContent = "0";
}

// Stepper controls
$("black-minus").addEventListener("click", () => {
  if (G.blackInput > 0) {
    G.blackInput--;
    $("black-val").textContent = G.blackInput;
  }
});
$("black-plus").addEventListener("click", () => {
  if (G.blackInput + G.whiteInput < settings.config.codeLength) {
    G.blackInput++;
    $("black-val").textContent = G.blackInput;
  }
});
$("white-minus").addEventListener("click", () => {
  if (G.whiteInput > 0) {
    G.whiteInput--;
    $("white-val").textContent = G.whiteInput;
  }
});
$("white-plus").addEventListener("click", () => {
  if (G.whiteInput + G.blackInput < settings.config.codeLength) {
    G.whiteInput++;
    $("white-val").textContent = G.whiteInput;
  }
});

$("btn-confirm").addEventListener("click", confirmFeedback);
$("back-game-b").addEventListener("click", () => showScreen("screen-home"));

function confirmFeedback() {
  if (!G.currentGuess || G.over) return;

  const blacks = G.blackInput;
  const whites = G.whiteInput;
  const guess = [...G.currentGuess];
  const codeLen = settings.config.codeLength;

  G.history.push({ guess, feedback: { blacks, whites } });
  G.ai.update(guess, blacks, whites);
  G.attempt++;

  hideBPanel("feedback-controls");
  hideBPanel("computer-guess-area");
  hideBPanel("player-secret-row");
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
    console.warn(
      "Inconsistent feedback detected - no valid candidates remain.",
    );
  }

  updateCounterB();
  scheduleComputerGuess();
}

function showResultB(playerWon) {
  if (playerWon) {
    $("result-icon").textContent = "🏆";
    $("result-title").textContent = "ניצחת!";
    $("result-subtitle").textContent = "המחשב לא הצליח לפצח את הקוד";
  } else {
    $("result-icon").textContent = "🤖";
    $("result-title").textContent = "המחשב ניצח";
    $("result-subtitle").textContent = `פיצח את הקוד ב־${G.attempt} ניסיונות`;
  }
  $("result-code").innerHTML = "";
  $("result-history-wrap").hidden = true;
  $("mp-result-opp").hidden = true;
  $("mp-history-wrap").hidden = true;
  showScreen("screen-result");
}

// ════════════════════════════════════════════════════════════════
// RESULT
// ════════════════════════════════════════════════════════════════
function renderResultCode(code) {
  const container = $("result-code");
  container.innerHTML = "";
  for (const colorId of code) {
    const peg = el("div", "peg-slot");
    applyPegColor(peg, colorId);
    container.appendChild(peg);
  }
}

$("btn-play-again").addEventListener("click", () => {
  leaveGame();
  showScreen("screen-home");
});

// ════════════════════════════════════════════════════════════════
// MULTIPLAYER - Socket.io client
// ════════════════════════════════════════════════════════════════

const SERVER_URL =
  location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://mastermind-6ttb.onrender.com";

// Active socket (created on first MP click, destroyed on leave)
let socket = null;

// Per-game multiplayer state
const MP = {
  playerIndex: null, // 0 = P1 (creator), 1 = P2 (joiner)
  settings: null, // { difficulty, limitType, limitCount }
  opponentName: "",
  mySecret: null, // my secret code - never sent to server
  history: [], // [{ guess, feedback }] - my own guesses + received feedback
  myGuessCount: 0,
  oppGuessCount: 0,
  isMyTurn: false,
  myFinished: false,
  myWon: false,
  currentGuess: null,
  selectedSlot: 0,
  blackInput: 0,
  whiteInput: 0,
  opponentHistory: [], // [{ guess, feedback }] - opponent's guesses I evaluated
  _pendingOppGuess: null, // opponent's current guess, held until I confirm feedback
  unreadCount: 0,
};

// Room-creation form state
let mpDifficulty = "easy";
let mpLimitType = "none";
let mpLimitCount = 10;
let mpAllowRepeats = true;
let playerName = "";

// ── Socket lifecycle ──────────────────────────────────────────

function connectSocket() {
  if (socket) return;
  socket = io(SERVER_URL, { autoConnect: true });

  socket.on("connect", () => {
    $("room-connecting").hidden = true;
  });

  socket.on("connect_error", () => {
    $("room-connecting").textContent = "שגיאת חיבור לשרת...";
    $("room-connecting").hidden = false;
  });

  // ── Room events ──────────────────────────────────────────────

  socket.on("room-created", ({ code }) => {
    MP.playerIndex = 0;
    $("waiting-code").textContent = code;
    $("waiting-code-wrap").hidden = false;
    $("waiting-label").textContent = "ממתין לשחקן השני";
    showScreen("screen-waiting");
  });

  socket.on("opponent-joined", () => {
    // P1: opponent arrived - proceed to setup
    MP.settings = {
      difficulty: mpDifficulty,
      limitType: mpLimitType,
      limitCount: mpLimitCount,
      allowRepeats: mpAllowRepeats,
    };
    goToMpSetup();
  });

  socket.on("room-joined", ({ settings: s }) => {
    // P2: joined successfully - proceed directly to setup
    MP.playerIndex = 1;
    MP.settings = s;
    goToMpSetup();
  });

  socket.on("join-error", (msg) => {
    $("join-error-msg").textContent = msg;
    $("join-error-msg").hidden = false;
  });

  // ── Game events ───────────────────────────────────────────────

  socket.on("game-start", ({ firstTurn, myName, opponentName }) => {
    if (myName) playerName = myName;
    MP.opponentName = opponentName || "יריב";
    startMpGame(firstTurn);
  });

  // Opponent guessed my code - I need to give feedback
  socket.on("opponent-guess", ({ guess }) => {
    showMpFeedbackPanel(guess);
  });

  // I received feedback on my guess from the opponent
  socket.on("feedback", ({ blacks, whites }) => {
    const codeLen = settings.config.codeLength;
    MP.history.push({
      guess: [...MP.currentGuess],
      feedback: { blacks, whites },
    });
    MP.myGuessCount++;
    MP.currentGuess = Array(codeLen).fill(null);
    MP.selectedSlot = 0;
    renderBoardMp();

    if (blacks === codeLen) {
      MP.myWon = MP.myFinished = true;
      socket.emit("player-won", { guessCount: MP.myGuessCount });
      showMpBanner("פיצחת את הקוד! 🎉 ממתין לסיום המשחק...");
      hideMpPanels();
    } else if (
      MP.settings.limitType === "hard" &&
      MP.myGuessCount >= MP.settings.limitCount
    ) {
      MP.myFinished = true;
      socket.emit("player-lost");
      hideMpPanels();
    }
    // turn-change will update the UI for the next state
  });

  // Whose turn it is changed
  socket.on("turn-change", ({ turn }) => {
    MP.isMyTurn = turn === MP.playerIndex;
    if (!MP.myFinished) updateMpTurnUI();
  });

  // Server tells me the updated count of opponent's guesses
  socket.on("opponent-guess-count", (count) => {
    MP.oppGuessCount = count;
    const name = MP.opponentName || "היריב";
    $("mp-opp-count").textContent =
      `${name} ניחש ${count} ${count === 1 ? "פעם" : "פעמים"}`;
  });

  // A player cracked the code
  socket.on("player-won", ({ playerIndex }) => {
    if (playerIndex !== MP.playerIndex && !MP.myFinished) {
      showMpBanner("היריב פיצח את הקוד! המשחק ממשיך...");
    }
  });

  // Both players finished - show final result
  socket.on("game-over", ({ p1, p2, opponentSecret }) => {
    console.log("opponentSecret received:", opponentSecret);
    const me = MP.playerIndex === 0 ? p1 : p2;
    const opp = MP.playerIndex === 0 ? p2 : p1;
    showMpResult(me, opp, opponentSecret);
  });

  socket.on("chat-message", ({ name, text, from }) => {
    const isMe = from === MP.playerIndex;
    addChatMessage(name, text, isMe);
    if ($("chat-panel").hidden) {
      MP.unreadCount++;
      $("chat-badge").textContent = MP.unreadCount;
      $("chat-badge").hidden = false;
    }
  });

  socket.on("opponent-disconnected", () => {
    $("result-icon").textContent = "🏆";
    $("result-title").textContent = "ניצחת!";
    $("result-subtitle").textContent = "היריב התנתק";
    $("mp-result-opp").hidden = true;
    $("result-code").innerHTML = "";
    $("result-history-wrap").hidden = true;
    socket = null; // already disconnected from server side
    showScreen("screen-result");
  });
}

function leaveGame() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ── Room screen ───────────────────────────────────────────────

$("btn-mode-mp").addEventListener("click", () => {
  connectSocket();
  showRoomChoice();
  $("room-connecting").hidden = !!(socket && socket.connected);
  showScreen("screen-room");
});

$("back-room").addEventListener("click", () => {
  leaveGame();
  showScreen("screen-home");
});

function showRoomChoice() {
  $("room-choice").hidden = false;
  $("room-create-form").hidden = true;
  $("room-join-form").hidden = true;
  $("join-error-msg").hidden = true;
}

$("btn-create-room").addEventListener("click", () => {
  $("room-choice").hidden = true;
  $("room-create-form").hidden = false;
});

$("btn-join-room-show").addEventListener("click", () => {
  $("room-choice").hidden = true;
  $("room-join-form").hidden = false;
  $("join-error-msg").hidden = true;
  $("room-code-input").value = "";
});

// MP difficulty selection (independent from SP settings buttons)
["easy", "medium", "hard"].forEach((id) => {
  $(`mp-opt-${id}`).addEventListener("click", () => {
    mpDifficulty = id;
    document
      .querySelectorAll('#room-create-form .option-btn[id^="mp-opt"]')
      .forEach((b) => b.classList.remove("selected"));
    $(`mp-opt-${id}`).classList.add("selected");
  });
});

$("mp-limit-none").addEventListener("click", () => {
  mpLimitType = "none";
  $("mp-limit-none").classList.add("selected");
  $("mp-limit-hard-btn").classList.remove("selected");
  $("mp-limit-count-wrap").hidden = true;
});

$("mp-limit-hard-btn").addEventListener("click", () => {
  mpLimitType = "hard";
  $("mp-limit-hard-btn").classList.add("selected");
  $("mp-limit-none").classList.remove("selected");
  $("mp-limit-count-wrap").hidden = false;
});

$("mp-opt-repeat-yes").addEventListener("click", () => {
  mpAllowRepeats = true;
  $("mp-opt-repeat-yes").classList.add("selected");
  $("mp-opt-repeat-no").classList.remove("selected");
});
$("mp-opt-repeat-no").addEventListener("click", () => {
  mpAllowRepeats = false;
  $("mp-opt-repeat-no").classList.add("selected");
  $("mp-opt-repeat-yes").classList.remove("selected");
});

$("btn-create-room-confirm").addEventListener("click", () => {
  playerName = $("player-name-input").value.trim() || "שחקן";
  mpLimitCount = Math.max(1, parseInt($("mp-limit-count").value) || 10);
  if (socket)
    socket.emit("create-room", {
      difficulty: mpDifficulty,
      limitType: mpLimitType,
      limitCount: mpLimitCount,
      allowRepeats: mpAllowRepeats,
    });
});

$("room-code-input").addEventListener("input", () => {
  $("join-error-msg").hidden = true;
});

$("btn-join-room-confirm").addEventListener("click", () => {
  playerName = $("player-name-input").value.trim() || "שחקן";
  const code = $("room-code-input").value.trim();
  if (!/^\d{4}$/.test(code)) return;
  if (socket) socket.emit("join-room", code);
});

// ── Setup (MP mode) ───────────────────────────────────────────

function goToMpSetup() {
  settings.difficulty = MP.settings.difficulty;
  settings.allowRepeats = MP.settings.allowRepeats !== false;
  settings.pendingMode = "MP";
  const { codeLength } = settings.config;
  setupCode = Array(codeLength).fill(null);
  $("setup-hint").textContent = `בחר ${codeLength} צבעים - הקוד שלך יישאר פרטי`;
  $("btn-ready").textContent = "אני מוכן";
  renderSetupSlots();
  renderPalette("setup-palette", onSetupColorPick);
  $("btn-ready").disabled = true;
  showScreen("screen-setup");
}

function mpOnReady(secret) {
  MP.mySecret = secret;
  socket.emit("player-ready", { secret, name: playerName });
  // Show waiting screen until both players are ready
  $("waiting-code-wrap").hidden = MP.playerIndex !== 0;
  if (MP.playerIndex === 0) {
    // code was already set in waiting-code from room-created event
  }
  $("waiting-label").textContent = "ממתין לשחקן השני...";
  showScreen("screen-waiting");
}

// ── Game ──────────────────────────────────────────────────────

function startMpGame(firstTurn) {
  MP.history = [];
  MP.opponentHistory = [];
  MP.myGuessCount = 0;
  MP.oppGuessCount = 0;
  MP.myWon = false;
  MP.myFinished = false;
  MP.isMyTurn = firstTurn === MP.playerIndex;
  MP.currentGuess = Array(settings.config.codeLength).fill(null);
  MP.selectedSlot = 0;
  MP.blackInput = 0;
  MP.whiteInput = 0;

  $("board-mp").style.maxWidth =
    calcBoardWidth(settings.config.codeLength) + "px";
  $("mp-banner").hidden = true;
  $("mp-opp-count").textContent = "היריב ניחש 0 פעמים";
  $("chat-messages").innerHTML = "";
  MP.unreadCount = 0;
  $("chat-badge").hidden = true;
  $("chat-panel").hidden = true;

  renderBoardMp();
  updateMpTurnUI();
  showScreen("screen-mp-game");
}

function renderBoardMp() {
  const board = $("board-mp");
  const codeLen = settings.config.codeLength;
  board.innerHTML = "";

  // Empty future rows - only meaningful with a hard guess limit
  if (MP.settings.limitType === "hard") {
    const future =
      MP.settings.limitCount - MP.myGuessCount - (MP.myFinished ? 0 : 1);
    for (let i = 0; i < Math.max(0, future); i++) {
      board.appendChild(buildRow(null, null, null, { empty: true }));
    }
  }

  // Completed rows (my previous guesses)
  for (let i = 0; i < MP.history.length; i++) {
    const { guess, feedback } = MP.history[i];
    board.appendChild(
      buildRow(i + 1, guess, feedback, {
        completed: true,
        winning: feedback.blacks === codeLen,
        animate: i === MP.history.length - 1,
      }),
    );
  }

  // Active row - only when it's my turn and I haven't finished
  if (MP.isMyTurn && !MP.myFinished) {
    board.appendChild(
      buildRow(MP.myGuessCount + 1, MP.currentGuess, null, {
        active: true,
        selectedSlot: MP.selectedSlot,
        onSlotClick: (i) => {
          if (MP.currentGuess[i] !== null) {
            MP.currentGuess[i] = null;
            $("btn-submit-mp").disabled = true;
          }
          MP.selectedSlot = i;
          renderBoardMp();
          renderPalette("palette-mp", onMpColorPick);
        },
      }),
    );
  }

  board.scrollTop = board.scrollHeight;
}

function onMpColorPick(colorId) {
  if (!MP.isMyTurn || MP.myFinished) return;
  MP.currentGuess[MP.selectedSlot] = colorId;

  const codeLen = settings.config.codeLength;
  const nextEmpty = MP.currentGuess.findIndex(
    (c, i) => i > MP.selectedSlot && c === null,
  );
  if (nextEmpty !== -1) {
    MP.selectedSlot = nextEmpty;
  } else {
    const anyEmpty = MP.currentGuess.indexOf(null);
    MP.selectedSlot =
      anyEmpty !== -1 ? anyEmpty : Math.min(MP.selectedSlot + 1, codeLen - 1);
  }

  renderBoardMp();
  renderPalette("palette-mp", onMpColorPick);
  $("btn-submit-mp").disabled = MP.currentGuess.includes(null);
}

$("btn-submit-mp").addEventListener("click", () => {
  if (!MP.isMyTurn || MP.myFinished) return;
  if (MP.currentGuess.includes(null)) return;
  socket.emit("submit-guess", [...MP.currentGuess]);
  // Switch to "waiting for feedback" state
  hideMpPanels();
  $("mp-panel-guessing").hidden = false;
  $("mp-turn-label").textContent = "ממתין לאישור ניקוד";
  $("mp-turn-label").className = "mp-turn-label opp-turn";
});

$("back-mp-game").addEventListener("click", () => {
  leaveGame();
  showScreen("screen-home");
});

function updateMpTurnUI() {
  hideMpPanels();
  if (MP.isMyTurn) {
    $("mp-turn-label").textContent = `תורך לנחש, ${playerName || "שחקן"}!`;
    $("mp-turn-label").className = "mp-turn-label my-turn";
    $("mp-panel-active").hidden = false;
    renderBoardMp();
    renderPalette("palette-mp", onMpColorPick);
    $("btn-submit-mp").disabled = MP.currentGuess.includes(null);
  } else {
    $("mp-turn-label").textContent = "תור היריב...";
    $("mp-turn-label").className = "mp-turn-label opp-turn";
    $("mp-panel-waiting").hidden = false;
    renderBoardMp();
  }
}

function hideMpPanels() {
  [
    "mp-panel-active",
    "mp-panel-guessing",
    "mp-panel-waiting",
    "mp-panel-feedback",
  ].forEach((id) => ($(id).hidden = true));
}

function showMpBanner(msg) {
  const b = $("mp-banner");
  b.textContent = msg;
  b.hidden = false;
}

// ── Feedback panel (I'm the code owner, opponent guessed) ─────

function showMpFeedbackPanel(oppGuess) {
  MP._pendingOppGuess = [...oppGuess];

  // Render opponent's guess pegs
  const oppPegs = $("mp-opp-guess-pegs");
  oppPegs.innerHTML = "";
  for (const colorId of oppGuess) {
    const slot = el("div", "peg-slot");
    applyPegColor(slot, colorId);
    oppPegs.appendChild(slot);
  }

  // Render my secret code for comparison
  const secretPegs = $("mp-my-secret-pegs");
  secretPegs.innerHTML = "";
  for (const colorId of MP.mySecret) {
    const slot = el("div", "peg-slot");
    applyPegColor(slot, colorId);
    secretPegs.appendChild(slot);
  }

  // Reset stepper inputs
  MP.blackInput = 0;
  MP.whiteInput = 0;
  $("mp-black-val").textContent = "0";
  $("mp-white-val").textContent = "0";

  hideMpPanels();
  $("mp-panel-feedback").hidden = false;
  $("mp-turn-label").textContent = "תן ניקוד לניחוש של היריב";
  $("mp-turn-label").className = "mp-turn-label";
}

// MP feedback steppers
$("mp-black-minus").addEventListener("click", () => {
  if (MP.blackInput > 0) {
    MP.blackInput--;
    $("mp-black-val").textContent = MP.blackInput;
  }
});
$("mp-black-plus").addEventListener("click", () => {
  if (MP.blackInput + MP.whiteInput < settings.config.codeLength) {
    MP.blackInput++;
    $("mp-black-val").textContent = MP.blackInput;
  }
});
$("mp-white-minus").addEventListener("click", () => {
  if (MP.whiteInput > 0) {
    MP.whiteInput--;
    $("mp-white-val").textContent = MP.whiteInput;
  }
});
$("mp-white-plus").addEventListener("click", () => {
  if (MP.whiteInput + MP.blackInput < settings.config.codeLength) {
    MP.whiteInput++;
    $("mp-white-val").textContent = MP.whiteInput;
  }
});

$("mp-btn-confirm").addEventListener("click", () => {
  const blacks = MP.blackInput;
  const whites = MP.whiteInput;
  if (MP._pendingOppGuess) {
    MP.opponentHistory.push({
      guess: MP._pendingOppGuess,
      feedback: { blacks, whites },
    });
    MP._pendingOppGuess = null;
  }
  socket.emit("submit-feedback", { blacks, whites });
  hideMpPanels();
  // If I've already finished (won), just keep showing banner while opponent continues
  // Otherwise turn-change will call updateMpTurnUI
});

// ── Chat ──────────────────────────────────────────────────────

function addChatMessage(name, text, isMe) {
  const container = $("chat-messages");
  const msg = el(
    "div",
    isMe ? "chat-msg chat-msg-me" : "chat-msg chat-msg-them",
  );
  const nameEl = el("span", "chat-msg-name");
  nameEl.textContent = name;
  const textEl = el("span", "chat-msg-text");
  textEl.textContent = text;
  msg.appendChild(nameEl);
  msg.appendChild(textEl);
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
  const input = $("chat-input");
  const text = input.value.trim();
  if (!text) return;
  if (!socket || !socket.connected) return;
  socket.emit("chat-message", text);
  input.value = "";
}

$("btn-chat").addEventListener("click", () => {
  $("chat-panel").hidden = false;
  MP.unreadCount = 0;
  $("chat-badge").hidden = true;
  $("chat-messages").scrollTop = $("chat-messages").scrollHeight;
  $("chat-input").focus();
});

$("btn-close-chat").addEventListener("click", () => {
  $("chat-panel").hidden = true;
});

$("btn-send-chat").addEventListener("click", sendChatMessage);

$("chat-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendChatMessage();
});

// ── Result ────────────────────────────────────────────────────

function showMpResult(me, opp, opponentSecret) {
  // Hide SP-only sections before rendering anything
  $("result-history-wrap").hidden = true;
  $("result-code").innerHTML = "";

  // Win / loss / tie logic
  let icon, title, subtitle;
  const myN = playerName || "אתה";
  const oppN = MP.opponentName || "היריב";
  if (me.won && opp.won) {
    if (me.guesses < opp.guesses) {
      icon = "🎉";
      title = "ניצחת!";
      subtitle = `פיצחת ב־${me.guesses} ניחושים לעומת ${opp.guesses} של ${oppN}`;
    } else if (me.guesses > opp.guesses) {
      icon = "💔";
      title = "הפסדת";
      subtitle = `פיצחת ב־${me.guesses} ניחושים, ${oppN} פיצח ב־${opp.guesses}`;
    } else {
      icon = "🤝";
      title = "תיקו!";
      subtitle = `שניכם פיצחתם ב־${me.guesses} ניחושים`;
    }
  } else if (me.won && !opp.won) {
    icon = "🎉";
    title = "ניצחת!";
    subtitle = `פיצחת ב־${me.guesses} ניחושים - ${oppN} לא הצליח`;
  } else if (!me.won && opp.won) {
    icon = "💔";
    title = "הפסדת";
    subtitle = `${oppN} פיצח ב־${opp.guesses} ניחושים`;
  } else {
    icon = "💔";
    title = "שניכם הפסדתם";
    subtitle = "אף אחד לא פיצח את הקוד";
  }
  $("result-icon").textContent = icon;
  $("result-title").textContent = title;
  $("result-subtitle").textContent = subtitle;
  $("mp-result-opp").hidden = true;

  // Show the MP history wrap FIRST so child elements are visible when we append pegs
  $("mp-history-wrap").hidden = false;

  // Render opponent's secret code
  const secretPegs = $("mp-opp-secret-pegs");
  secretPegs.innerHTML = "";
  if (opponentSecret && opponentSecret.length > 0) {
    for (const colorId of opponentSecret) {
      const peg = el("div", "peg-slot");
      applyPegColor(peg, colorId);
      secretPegs.appendChild(peg);
    }
  }

  // Render my guess history
  const myList = $("mp-my-history");
  myList.innerHTML = "";
  MP.history.forEach(({ guess, feedback }, i) => {
    myList.appendChild(buildRow(i + 1, guess, feedback, { completed: true }));
  });

  showScreen("screen-result");
}
