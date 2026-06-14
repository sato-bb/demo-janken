(() => {
  const socket = io();
  const board = document.querySelector('.display-stage');
  const heroImage = document.querySelector('[data-hero-image]');
  const status = document.querySelector('[data-status]');
  const round = document.querySelector('[data-round]');
  const resultLabel = document.querySelector('[data-result-label]');
  const playerIcon = document.querySelector('[data-player-icon]');
  const playerLabel = document.querySelector('[data-player-label]');
  const cpuIcon = document.querySelector('[data-cpu-icon]');
  const cpuLabel = document.querySelector('[data-cpu-label]');
  const playerCard = document.querySelector('.hand-card:first-of-type');
  const cpuCard = document.querySelector('.hand-card:last-of-type');

  let countdownTimer = null;
  let cycleTimer = null;
  let cycleIndex = 0;

  socket.on('connect', () => {
    status.textContent = '接続済み';
  });

  socket.on('disconnect', () => {
    status.textContent = '切断されました。再接続中...';
  });

  socket.on('state:update', (state) => {
    renderState(state);
  });

  function renderState(state) {
    clearAnimationTimers();
    round.textContent = state.round;

    if (state.status === 'waiting') {
      renderWaiting();
      return;
    }

    if (state.status === 'playing') {
      renderPlaying(state);
      return;
    }

    renderResult(state);
  }

  function setTheme(theme) {
    board.dataset.resultTheme = theme;
    setHeroImage(theme);
  }

  function setHeroImage(theme) {
    const nextSrc = window.Janken.themeImages[theme] || window.Janken.themeImages.waiting;
    const currentSrc = heroImage.getAttribute('src');

    if (currentSrc === nextSrc) {
      return;
    }

    heroImage.classList.add('is-changing');

    const onLoad = () => {
      heroImage.classList.remove('is-changing');
      heroImage.removeEventListener('load', onLoad);
    };

    heroImage.addEventListener('load', onLoad);
    heroImage.setAttribute('src', nextSrc);
  }

  function renderWaiting() {
    setTheme('waiting');
    resultLabel.textContent = 'READY';
    resultLabel.classList.remove('is-reveal');
    playerIcon.textContent = '?';
    playerLabel.textContent = '-';
    cpuIcon.textContent = '?';
    cpuLabel.textContent = '-';
    playerCard.classList.remove('is-active', 'is-reveal');
    cpuCard.classList.remove('is-active', 'is-cycling', 'is-reveal');
    status.textContent = 'コントローラーからの入力待ち';
  }

  function renderPlaying(state) {
    setTheme('playing');
    resultLabel.classList.remove('is-reveal');
    playerIcon.textContent = window.Janken.handIcons[state.player];
    playerLabel.textContent = state.labels.player;
    cpuIcon.textContent = window.Janken.handIcons.rock;
    cpuLabel.textContent = '...';
    playerCard.classList.add('is-active');
    playerCard.classList.remove('is-reveal');
    cpuCard.classList.add('is-active', 'is-cycling');
    cpuCard.classList.remove('is-reveal');

    startCountdown();
    startHandCycle();
    status.textContent = 'じゃんけん中...';
  }

  function renderResult(state) {
    const theme = state.result || 'waiting';
    setTheme(theme);
    resultLabel.textContent = window.Janken.resultText[state.result];
    resultLabel.classList.add('is-reveal');
    playerIcon.textContent = window.Janken.handIcons[state.player];
    playerLabel.textContent = state.labels.player;
    cpuIcon.textContent = window.Janken.handIcons[state.cpu];
    cpuLabel.textContent = state.labels.cpu;
    playerCard.classList.add('is-active', 'is-reveal');
    cpuCard.classList.remove('is-cycling');
    cpuCard.classList.add('is-active', 'is-reveal');
    status.textContent = `${state.labels.result} / ${formatTime(state.updatedAt)}`;
  }

  function startCountdown() {
    const labels = window.Janken.countdownLabels;
    let step = 0;

    resultLabel.textContent = labels[step];
    resultLabel.classList.add('is-countdown');

    countdownTimer = setInterval(() => {
      step += 1;
      if (step >= labels.length) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        resultLabel.classList.remove('is-countdown');
        return;
      }

      resultLabel.textContent = labels[step];
    }, 850);
  }

  function startHandCycle() {
    const { hands, handIcons } = window.Janken;
    cycleIndex = 0;
    cpuIcon.textContent = handIcons[hands[cycleIndex]];

    cycleTimer = setInterval(() => {
      cycleIndex = (cycleIndex + 1) % hands.length;
      cpuIcon.textContent = handIcons[hands[cycleIndex]];
    }, 180);
  }

  function clearAnimationTimers() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }

    if (cycleTimer) {
      clearInterval(cycleTimer);
      cycleTimer = null;
    }

    resultLabel.classList.remove('is-countdown');
  }

  function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
})();
