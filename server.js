const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const HANDS = ['rock', 'scissors', 'paper'];

const handLabel = {
  rock: 'ぐー',
  scissors: 'ちょき',
  paper: 'ぱー',
};

const resultLabel = {
  win: '勝ち',
  lose: '負け',
  draw: 'あいこ',
};

let gameState = createInitialState();
let revealTimer = null;

const REVEAL_DELAY_MS = 2600;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.redirect('/controller');
});

app.get('/controller', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'controller.html'));
});

app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

io.on('connection', (socket) => {
  socket.emit('state:update', gameState);

  socket.on('game:play', ({ hand } = {}) => {
    if (!HANDS.includes(hand)) {
      socket.emit('game:error', { message: '不正な手です。' });
      return;
    }

    if (gameState.status === 'playing') {
      socket.emit('game:error', { message: '結果表示中です。少し待ってください。' });
      return;
    }

    clearRevealTimer();

    const nextRound = gameState.round + 1;

    gameState = {
      status: 'playing',
      round: nextRound,
      player: hand,
      cpu: null,
      result: null,
      labels: {
        player: handLabel[hand],
        cpu: '...',
        result: '...',
      },
      updatedAt: new Date().toISOString(),
    };

    io.emit('state:update', gameState);

    revealTimer = setTimeout(() => {
      const cpu = getRandomHand();
      const result = judge(hand, cpu);

      gameState = {
        status: 'result',
        round: nextRound,
        player: hand,
        cpu,
        result,
        labels: {
          player: handLabel[hand],
          cpu: handLabel[cpu],
          result: resultLabel[result],
        },
        updatedAt: new Date().toISOString(),
      };

      revealTimer = null;
      io.emit('state:update', gameState);
    }, REVEAL_DELAY_MS);
  });

  socket.on('game:reset', () => {
    clearRevealTimer();
    gameState = createInitialState();
    io.emit('state:update', gameState);
  });
});

function clearRevealTimer() {
  if (revealTimer) {
    clearTimeout(revealTimer);
    revealTimer = null;
  }
}

function createInitialState() {
  return {
    status: 'waiting',
    round: 0,
    player: null,
    cpu: null,
    result: null,
    labels: {
      player: '-',
      cpu: '-',
      result: '待機中',
    },
    updatedAt: new Date().toISOString(),
  };
}

function getRandomHand() {
  return HANDS[Math.floor(Math.random() * HANDS.length)];
}

function judge(player, cpu) {
  if (player === cpu) return 'draw';

  const winPatterns = {
    rock: 'scissors',
    scissors: 'paper',
    paper: 'rock',
  };

  return winPatterns[player] === cpu ? 'win' : 'lose';
}

server.listen(PORT, () => {
  console.log(`Janken MVP is running: http://localhost:${PORT}`);
});
