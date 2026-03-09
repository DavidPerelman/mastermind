const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Serve static files (index.html, style.css, game.js, ai.js)
app.use(express.static("."));

// rooms: Map<code, RoomState>
// RoomState = { code, players: [p1Id, p2Id], settings, readyCount, secrets, turn, guessCount, won, finished }
const rooms = new Map();

function generateRoomCode() {
  let code;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (rooms.has(code));
  return code;
}

function findRoom(socketId) {
  for (const room of rooms.values()) {
    if (room.players.includes(socketId)) return room;
  }
  return null;
}

function opponentOf(room, socketId) {
  return room.players.find((id) => id !== socketId);
}

function playerIndex(room, socketId) {
  return room.players.indexOf(socketId);
}

// Advance the active turn to the next unfinished player.
// If the other player is finished, the current player keeps their turn.
function advanceTurn(room) {
  const next = (room.turn + 1) % 2;
  if (!room.finished[next]) {
    room.turn = next;
  }
  // Always emit so both clients know the current turn
  io.to(room.code).emit("turn-change", { turn: room.turn });
}

function checkGameOver(room) {
  if (room.finished[0] && room.finished[1]) {
    const result = {
      p1: { won: room.won[0], guesses: room.guessCount[0] },
      p2: { won: room.won[1], guesses: room.guessCount[1] },
    };
    console.log("game-over secrets:", room.secrets);
    if (room.players[0]) {
      io.to(room.players[0]).emit("game-over", {
        ...result,
        opponentSecret: room.secrets[1],
      });
    }
    if (room.players[1]) {
      io.to(room.players[1]).emit("game-over", {
        ...result,
        opponentSecret: room.secrets[0],
      });
    }
    rooms.delete(room.code);
  }
}

io.on("connection", (socket) => {
  console.log("connect", socket.id);

  // Player 1 creates a room and configures settings
  socket.on("create-room", ({ difficulty, limitType, limitCount }) => {
    const code = generateRoomCode();
    rooms.set(code, {
      code,
      players: [socket.id],
      settings: { difficulty, limitType, limitCount },
      readyCount: 0,
      secrets: [null, null], // stored only for end-of-game reveal
      names: [null, null],
      turn: 0, // index into players[] - Player 1 guesses first
      guessCount: [0, 0],
      won: [false, false],
      finished: [false, false],
    });
    socket.join(code);
    socket.emit("room-created", { code });
    console.log("room created", code);
  });

  // Player 2 joins by 4-digit code
  socket.on("join-room", (code) => {
    const room = rooms.get(code);
    if (!room) {
      socket.emit("join-error", "חדר לא נמצא");
      return;
    }
    if (room.players.length >= 2) {
      socket.emit("join-error", "החדר מלא");
      return;
    }

    room.players.push(socket.id);
    socket.join(code);
    socket.emit("room-joined", { settings: room.settings });
    io.to(room.players[0]).emit("opponent-joined");
    console.log("player joined room", code);
  });

  // Each player emits this after setting their secret code.
  // The secret is stored server-side solely for the end-of-game reveal.
  socket.on("player-ready", ({ secret, name } = {}) => {
    const room = findRoom(socket.id);
    if (!room) return;
    const idx = playerIndex(room, socket.id);
    if (secret) room.secrets[idx] = secret;
    if (name) room.names[idx] = name;
    else room.names[idx] = `שחקן ${idx + 1}`;
    console.log(`player ${idx} secret saved:`, room.secrets[idx]);
    room.readyCount++;
    if (room.readyCount === 2) {
      // Both players set their codes - start the game
      io.to(room.players[0]).emit("game-start", {
        firstTurn: 0,
        myName: room.names[0],
        opponentName: room.names[1],
      });
      io.to(room.players[1]).emit("game-start", {
        firstTurn: 0,
        myName: room.names[1],
        opponentName: room.names[0],
      });
    }
  });

  // Active guesser submits a guess - server forwards it to the code owner (opponent)
  socket.on("submit-guess", (guess) => {
    const room = findRoom(socket.id);
    if (!room) return;
    if (playerIndex(room, socket.id) !== room.turn) return; // not your turn
    const opponent = opponentOf(room, socket.id);
    if (opponent) io.to(opponent).emit("opponent-guess", { guess });
  });

  // Code owner submits feedback (blacks, whites) after seeing the guess
  // Server forwards feedback to the guesser and advances the turn.
  // Secret codes stay on the client - the server never sees them.
  socket.on("submit-feedback", ({ blacks, whites }) => {
    const room = findRoom(socket.id);
    if (!room) return;

    const guesserIdx = room.turn;
    const guesserId = room.players[guesserIdx];
    if (!guesserId) return;

    room.guessCount[guesserIdx]++;

    // Send feedback to the guesser (they decide if they won based on blacks)
    io.to(guesserId).emit("feedback", { blacks, whites });

    // Tell the code owner (feedback provider) the updated guess count
    io.to(socket.id).emit("opponent-guess-count", room.guessCount[guesserIdx]);

    // Advance turn - player-won / player-lost events arrive separately from the client
    advanceTurn(room);
  });

  // Guesser cracked the code (all blacks) - client is authoritative on win detection
  socket.on("player-won", ({ guessCount }) => {
    const room = findRoom(socket.id);
    if (!room) return;
    const idx = playerIndex(room, socket.id);
    room.won[idx] = true;
    room.finished[idx] = true;
    if (guessCount !== undefined) room.guessCount[idx] = guessCount;
    io.to(room.code).emit("player-won", {
      playerIndex: idx,
      guessCount: room.guessCount[idx],
    });
    checkGameOver(room);
  });

  // Guesser hit the hard limit without cracking the code
  socket.on("player-lost", () => {
    const room = findRoom(socket.id);
    if (!room) return;
    const idx = playerIndex(room, socket.id);
    room.finished[idx] = true;
    io.to(room.code).emit("player-lost", {
      playerIndex: idx,
      guessCount: room.guessCount[idx],
    });
    checkGameOver(room);
  });

  socket.on("disconnect", () => {
    console.log("disconnect", socket.id);
    const room = findRoom(socket.id);
    if (!room) return;
    const opponent = opponentOf(room, socket.id);
    if (opponent) io.to(opponent).emit("opponent-disconnected");
    rooms.delete(room.code);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Mastermind server on port ${PORT}`));
