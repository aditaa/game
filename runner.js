(() => {
  "use strict";

  const canvas = document.querySelector("#game-canvas");
  const ctx = canvas.getContext("2d");
  const scoreNode = document.querySelector("#score");
  const comboNode = document.querySelector("#combo");
  const timeNode = document.querySelector("#time");
  const bestNode = document.querySelector("#best");
  const startButton = document.querySelector("#start-button");
  const overlay = document.querySelector("#overlay");
  const overlayTitle = document.querySelector("#overlay-title");
  const overlayCopy = document.querySelector("#overlay-copy");
  const announcer = document.querySelector("#announcer");

  const kinds = [
    { name: "Sun", color: "#ffd166", glow: "#ff9f1c", points: 3 },
    { name: "Tide", color: "#5be7ff", glow: "#337dff", points: 1 },
    { name: "Moss", color: "#83f28f", glow: "#26a96c", points: 1 },
  ];

  const state = {
    running: false,
    score: 0,
    combo: 1,
    timeLeft: 30,
    lastFrame: performance.now(),
    spawnIn: 0,
    paddas: [],
    ripples: [],
    width: 960,
    height: 560,
  };

  let best = Number.parseInt(localStorage.getItem("padda-ripples-best") || "0", 10);
  bestNode.textContent = String(best);

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    state.width = Math.max(320, rect.width);
    state.height = Math.max(360, rect.height);
    canvas.width = Math.round(state.width * scale);
    canvas.height = Math.round(state.height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function updateHud() {
    scoreNode.textContent = String(state.score);
    comboNode.textContent = `x${state.combo}`;
    timeNode.textContent = state.timeLeft.toFixed(1);
    bestNode.textContent = String(best);
  }

  function spawnPadda() {
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const radius = 22 + Math.random() * 10;
    state.paddas.push({
      x: radius + Math.random() * (state.width - radius * 2),
      y: radius + Math.random() * (state.height - radius * 2),
      radius,
      kind,
      age: 0,
      life: 2.4 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function addRipple(x, y, color, strength = 1) {
    state.ripples.push({ x, y, color, age: 0, life: 0.75, strength });
  }

  function collect(padda) {
    const gained = padda.kind.points * state.combo;
    state.score += gained;
    if (padda.kind.name === "Tide") {
      state.timeLeft = Math.min(35, state.timeLeft + 1.5);
    } else if (padda.kind.name === "Moss") {
      state.combo = Math.min(9, state.combo + 2);
    } else {
      state.combo = Math.min(9, state.combo + 1);
    }
    addRipple(padda.x, padda.y, padda.kind.color, 1.35);
    announcer.textContent = `${padda.kind.name} Padda collected. ${gained} points.`;
    state.paddas = state.paddas.filter((item) => item !== padda);
    updateHud();
  }

  function miss(x, y) {
    state.combo = 1;
    addRipple(x, y, "#6673a5", 0.55);
    updateHud();
  }

  function activateAt(x, y) {
    if (!state.running) return;
    const hit = [...state.paddas].reverse().find((padda) =>
      Math.hypot(x - padda.x, y - padda.y) <= padda.radius * 1.2
    );
    if (hit) collect(hit);
    else miss(x, y);
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * state.width,
      y: ((event.clientY - rect.top) / rect.height) * state.height,
    };
  }

  function startRound() {
    state.running = true;
    state.score = 0;
    state.combo = 1;
    state.timeLeft = 30;
    state.spawnIn = 0;
    state.paddas = [];
    state.ripples = [];
    state.lastFrame = performance.now();
    overlay.classList.add("hidden");
    startButton.textContent = "Restart round";
    canvas.focus();
    updateHud();
  }

  function endRound() {
    state.running = false;
    if (state.score > best) {
      best = state.score;
      localStorage.setItem("padda-ripples-best", String(best));
    }
    updateHud();
    overlayTitle.textContent = `Round complete — ${state.score} points`;
    overlayCopy.textContent = "Press Start round to make another set of ripples.";
    overlay.classList.remove("hidden");
    startButton.textContent = "Start round";
    announcer.textContent = `Round complete. Final score ${state.score}.`;
  }

  function update(delta) {
    state.ripples.forEach((ripple) => { ripple.age += delta; });
    state.ripples = state.ripples.filter((ripple) => ripple.age < ripple.life);
    if (!state.running) return;
    state.timeLeft = Math.max(0, state.timeLeft - delta);
    state.spawnIn -= delta;
    state.paddas.forEach((padda) => { padda.age += delta; });
    const expired = state.paddas.filter((padda) => padda.age >= padda.life);
    if (expired.length) state.combo = 1;
    state.paddas = state.paddas.filter((padda) => padda.age < padda.life);
    if (state.spawnIn <= 0 && state.paddas.length < 7) {
      spawnPadda();
      state.spawnIn = Math.max(0.38, 0.82 - state.score * 0.004);
    }
    if (state.timeLeft <= 0) endRound();
    updateHud();
  }

  function drawBackground(now) {
    const gradient = ctx.createLinearGradient(0, 0, state.width, state.height);
    gradient.addColorStop(0, "#101b37");
    gradient.addColorStop(1, "#071b24");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.strokeStyle = "rgba(143, 255, 215, 0.055)";
    ctx.lineWidth = 1;
    const spacing = 44;
    const drift = (now * 0.009) % spacing;
    for (let x = -spacing + drift; x < state.width + spacing; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - 70, state.height);
      ctx.stroke();
    }
  }

  function drawPadda(padda, now) {
    const pulse = 1 + Math.sin(now * 0.005 + padda.phase) * 0.09;
    const radius = padda.radius * pulse;
    const fade = Math.min(1, (padda.life - padda.age) * 2.5);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.shadowBlur = 26;
    ctx.shadowColor = padda.kind.glow;
    ctx.fillStyle = padda.kind.color;
    ctx.beginPath();
    ctx.arc(padda.x, padda.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(5, 13, 25, 0.78)";
    ctx.font = "900 13px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(padda.kind.name[0], padda.x, padda.y + 1);
    ctx.restore();
  }

  function drawRipple(ripple) {
    const progress = ripple.age / ripple.life;
    ctx.save();
    ctx.globalAlpha = (1 - progress) * 0.8;
    ctx.strokeStyle = ripple.color;
    ctx.lineWidth = 3 * ripple.strength;
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, 10 + progress * 90 * ripple.strength, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function frame(now) {
    const delta = Math.min(0.05, (now - state.lastFrame) / 1000 || 0);
    state.lastFrame = now;
    update(delta);
    drawBackground(now);
    state.ripples.forEach(drawRipple);
    state.paddas.forEach((padda) => drawPadda(padda, now));
    requestAnimationFrame(frame);
  }

  canvas.addEventListener("pointerdown", (event) => {
    const point = canvasPoint(event);
    activateAt(point.x, point.y);
  });

  canvas.addEventListener("keydown", (event) => {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (!state.running) {
      startRound();
      return;
    }
    const centerX = state.width / 2;
    const centerY = state.height / 2;
    const nearest = state.paddas.reduce((bestPadda, padda) => {
      if (!bestPadda) return padda;
      return Math.hypot(padda.x - centerX, padda.y - centerY) <
        Math.hypot(bestPadda.x - centerX, bestPadda.y - centerY) ? padda : bestPadda;
    }, null);
    if (nearest) collect(nearest);
  });

  startButton.addEventListener("click", startRound);
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  updateHud();
  requestAnimationFrame(frame);
})();
