(() => {
  const socket = io();
  const status = document.querySelector('[data-status]');
  const handButtons = document.querySelectorAll('[data-hand]');
  const resetButton = document.querySelector('[data-reset]');

  let isPlaying = false;

  socket.on('connect', () => {
    status.textContent = '接続済み';
  });

  socket.on('disconnect', () => {
    status.textContent = '切断されました。再接続中...';
  });

  socket.on('state:update', (state) => {
    isPlaying = state.status === 'playing';
    setControlsDisabled(isPlaying);

    if (state.status === 'playing') {
      status.textContent = `Round ${state.round}: ${state.labels.player}を選択中...`;
      return;
    }

    if (state.status === 'result') {
      status.textContent = `Round ${state.round}: ${state.labels.player}を送信しました`;
      return;
    }

    status.textContent = '待機中';
  });

  socket.on('game:error', ({ message }) => {
    status.textContent = message;
  });

  handButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (isPlaying) return;

      const hand = button.dataset.hand;
      socket.emit('game:play', { hand });
    });
  });

  resetButton.addEventListener('click', () => {
    socket.emit('game:reset');
  });

  function setControlsDisabled(disabled) {
    handButtons.forEach((button) => {
      button.disabled = disabled;
      button.classList.toggle('is-disabled', disabled);
    });
  }
})();
