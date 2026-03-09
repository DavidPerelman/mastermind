# Mastermind (בול פגיעה)

A modern web-based Mastermind game with single-player and real-time online multiplayer.

## Live Demo

[link to be added after deployment]

## Game Modes

- **Player vs Computer** - guess the computer's secret code
- **Computer vs Player** - the AI tries to guess your code
- **Online Multiplayer** - play against a friend in real time via room codes

## How to Play

- A secret code of colored pegs is chosen
- After each guess you receive feedback:
  - ⚫ Black = correct color, correct position
  - ⚪ White = correct color, wrong position
- Crack the code in as few guesses as possible

## Difficulty Levels

| Level  | Code Length | Colors   |
| ------ | ----------- | -------- |
| Easy   | 4 pegs      | 6 colors |
| Medium | 6 pegs      | 8 colors |
| Hard   | 5 pegs      | 8 colors |

## Tech Stack

- Frontend: Vanilla HTML, CSS, JavaScript
- Backend: Node.js + Express + Socket.io
- Deployment: Render.com (server) + GitHub Pages (static fallback)

## Running Locally

```
npm install
node server.js
```

Then open http://localhost:3000
