
  // replace collect function to use upgrades
  function collect(padda) {
    const gained = padda.kind.points * state.combo;
    if (padda.kind.name === "Sun") {
      state.score += gained + gained * 0.2 * upgrades.sunBooster;
      state.timeLeft = Math.min(35, state.timeLeft + 0);
      state.combo = Math.min(9, state.combo + 1);
    } else if (padda.kind.name === "Tide") {
      state.score += gained;
      state.timeLeft = Math.min(35, state.timeLeft + 1.5 + upgrades.tideBooster * 0.5);
      state.combo = Math.min(9, state.combo + 1);
    } else if (padda.kind.name === "Moss") {
      state.score += gained;
      state.timeLeft = Math.min(35, state.timeLeft + 0);
      state.combo = Math.min(9, state.combo + 2);
    }
    addRipple(padda.x, padda.y, padda.kind.color, 1.35);
    announcer.textContent = `${padda.kind.name} Padda collected. ${gained} points.`;
    state.paddas = state.paddas.filter((item) => item !== padda);
    updateHud();
  }
  
