  function pauseGame() {
    state.running = false;
    updateHud();
  }
  const pauseButton = document.querySelector('#pause-button');
  if (pauseButton) pauseButton.addEventListener('click', pauseGame);
