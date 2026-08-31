let canvas;
let ctx;
let gameFrame = 0;

function initGame() {
  const body = document.querySelector('body');
  canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.id = 'game-canvas';
  canvas.style.backgroundColor = '#1a1a1a';
  body.appendChild(canvas);
  ctx = canvas.getContext('2d');

  // Click-to-gather listener
  canvas.addEventListener('click', handleClick);

  gameLoop();
}

function handleClick(e) {
  gameFrame++;
  ctx.beginPath();
  ctx.arc(e.clientX, e.clientY, 10, 0, 2 * Math.PI);
  ctx.fill();

  // Placeholder for core gathering logic: each click could add energy, spawn a ripple,
  // or trigger a reveal mechanic. We'll flesh out the next layer once the concept details arrive.
}

function gameLoop() {
  gameFrame++;
  requestAnimationFrame(gameLoop);
}

<body>
</body>
</html>
