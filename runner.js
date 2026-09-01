  function resetState() {
    state.paddas = [];
    state.ripples = [];
    updateHud();
  }
  // attach
  const resetButton = document.querySelector('#reset-button');
  if (resetButton) resetButton.addEventListener('click', resetState);
