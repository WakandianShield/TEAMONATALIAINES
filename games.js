const GAMES = [
    {
        id: 'dibujar',
        name: 'NatArt Studio',
        img: 'draw.jpg',
        color: '#d946a8',
        launch: launchDrawingGame,
    },
    {
        id: 'flappy',
        name: 'Flappy Nat',
        img: 'bird.jpg',
        color: '#38b2e0',
        launch: launchFlappyGame,
    },
];

let currentGameId = null;
let cleanupCurrentGame = null;
const screen = document.getElementById('switchScreen');
const shelf = document.getElementById('estanteJuegos');

function buildShelf() {
    shelf.innerHTML = '';
    GAMES.forEach(game => {
        const el = document.createElement('div');
        el.className = 'cartucho';
        el.setAttribute('role', 'listitem');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', game.name);
        el.dataset.id = game.id;

        const iconHTML = game.img
            ? `<img src="${game.img}" alt="${game.name}" class="cart-cover">`
            : game.emoji || '';

        el.innerHTML = `
            <div class="cart-icon" style="${game.img ? '' : `background: linear-gradient(145deg, ${game.color}, ${darken(game.color)})`}">
                ${iconHTML}
            </div>
            <span class="cart-name">${game.name}</span>
        `;

        el.addEventListener('click', () => selectGame(game));
        el.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectGame(game); }
        });

        shelf.appendChild(el);
    });
}

function darken(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (n >> 16) - 40);
    const g = Math.max(0, ((n >> 8) & 0xff) - 40);
    const b = Math.max(0, (n & 0xff) - 40);
    return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function selectGame(game) {
    if (currentGameId === game.id) return;
    if (cleanupCurrentGame) { cleanupCurrentGame(); cleanupCurrentGame = null; }

    currentGameId = game.id;
    document.querySelectorAll('.cartucho').forEach(el => {
        el.classList.toggle('activo', el.dataset.id === game.id);
    });

    screen.innerHTML = '';
    cleanupCurrentGame = game.launch(screen) || null;
}

/* ===================================================================
   DRAWING GAME
=================================================================== */
function launchDrawingGame(container) {
    const COLORS = [
        '#000000', '#ffffff', '#e03030', '#ff6020',
        '#f0c800', '#30b830', '#2070e0', '#8020d0',
        '#e02890', '#c06000', '#888888', '#cccccc',
        '#ff9999', '#99ccff', '#aaffaa', '#ffcc88',
    ];

    let drawing = false;
    let currentColor = '#000000';
    let brushSize = 6;
    let isEraser = false;
    let lastX = 0;
    let lastY = 0;

    container.innerHTML = `
        <div class="game-draw">
            <div class="draw-toolbar">
                <div class="color-swatches" id="colorSwatches"></div>
                <div class="toolbar-sep"></div>
                <div class="brush-sizes">
                    <button class="brush-btn btn-small active" data-size="3" title="Fino"></button>
                    <button class="brush-btn btn-medium" data-size="10" title="Medio"></button>
                    <button class="brush-btn btn-large" data-size="24" title="Grueso"></button>
                </div>
                <div class="toolbar-sep"></div>
                <button class="draw-tool-btn" id="btnEraser">Borrador</button>
                <button class="draw-tool-btn" id="btnClear">Limpiar</button>
                <button class="draw-tool-btn btn-save" id="btnGuardar">💾 Guardar</button>
            </div>
            <div class="draw-canvas-wrap" id="canvasWrap">
                <canvas id="drawCanvas"></canvas>
            </div>
        </div>
    `;

    const swatchWrap = container.querySelector('#colorSwatches');
    COLORS.forEach(color => {
        const btn = document.createElement('button');
        btn.className = 'swatch' + (color === currentColor ? ' active' : '');
        btn.style.background = color;
        if (color === '#ffffff') btn.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,0.3)';
        btn.title = color;
        btn.addEventListener('click', () => {
            currentColor = color;
            isEraser = false;
            container.querySelector('#btnEraser').classList.remove('active');
            swatchWrap.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
        });
        swatchWrap.appendChild(btn);
    });

    container.querySelectorAll('.brush-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            brushSize = parseInt(btn.dataset.size);
            container.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    container.querySelector('#btnEraser').addEventListener('click', function () {
        isEraser = !isEraser;
        this.classList.toggle('active', isEraser);
        if (isEraser) swatchWrap.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    });

    container.querySelector('#btnClear').addEventListener('click', () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    container.querySelector('#btnGuardar').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'NatArt.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    const wrap = container.querySelector('#canvasWrap');
    const canvas = container.querySelector('#drawCanvas');
    const ctx = canvas.getContext('2d');

    function initCanvas() {
        canvas.width  = wrap.offsetWidth  || 400;
        canvas.height = wrap.offsetHeight || 300;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(initCanvas);

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const src = e.touches ? e.touches[0] : e;
        return {
            x: (src.clientX - rect.left) * scaleX,
            y: (src.clientY - rect.top)  * scaleY,
        };
    }

    function startDraw(e) {
        e.preventDefault();
        drawing = true;
        const { x, y } = getPos(e);
        lastX = x; lastY = y;
    }

    function doDraw(e) {
        if (!drawing) return;
        e.preventDefault();
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = isEraser ? '#ffffff' : currentColor;
        ctx.lineWidth   = isEraser ? brushSize * 3 : brushSize;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.stroke();
        lastX = x; lastY = y;
    }

    function stopDraw() { drawing = false; }

    canvas.addEventListener('mousedown',  startDraw);
    canvas.addEventListener('mousemove',  doDraw);
    canvas.addEventListener('mouseup',    stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove',  doDraw,    { passive: false });
    canvas.addEventListener('touchend',   stopDraw);
}

/* ===================================================================
   FLAPPY NAT
=================================================================== */
function launchFlappyGame(container) {
    container.innerHTML = `<div class="game-flappy"><canvas id="flappyCanvas"></canvas></div>`;

    const canvas = container.querySelector('#flappyCanvas');
    const ctx    = canvas.getContext('2d');

    /* Preload images */
    const natImg  = new Image(); natImg.src  = 'nat.png';
    const tungImg = new Image(); tungImg.src = 'tung.png';

    const GRAVITY      = 0.45;
    const JUMP_FORCE   = -8.5;
    const PIPE_W       = 64;
    const PIPE_GAP     = 195;
    const PIPE_SPEED   = 2.6;
    const PIPE_INTERVAL = 2400;
    const BIRD_R       = 22;

    let bird, pipes, score, state, animId, lastPipeTime;

    function init() {
        bird  = { x: 80, y: canvas.height / 2, vy: 0 };
        pipes = [];
        score = 0;
        state = 'waiting';
        lastPipeTime = performance.now();
    }

    function jump() {
        if (state === 'dead') { init(); return; }
        if (state === 'waiting') {
            state = 'playing';
            lastPipeTime = performance.now() - PIPE_INTERVAL + 300; // primer tubo a ~300ms
        }
        bird.vy = JUMP_FORCE;
    }

    function spawnPipe() {
        const minTop = 55;
        const maxTop = canvas.height - PIPE_GAP - 55;
        const topH   = minTop + Math.random() * (maxTop - minTop);
        pipes.push({ x: canvas.width + 10, topH, botY: topH + PIPE_GAP, scored: false });
    }

    function update(now) {
        if (state !== 'playing') return;

        bird.vy += GRAVITY;
        bird.y  += bird.vy;

        if (now - lastPipeTime > PIPE_INTERVAL) {
            spawnPipe();
            lastPipeTime = now;
        }

        pipes.forEach(p => { p.x -= PIPE_SPEED; });
        pipes = pipes.filter(p => p.x > -PIPE_W - 20);

        pipes.forEach(p => {
            if (!p.scored && p.x + PIPE_W < bird.x) { p.scored = true; score++; }

            const inX = bird.x + BIRD_R > p.x && bird.x - BIRD_R < p.x + PIPE_W;
            const inY = bird.y - BIRD_R < p.topH || bird.y + BIRD_R > p.botY;
            if (inX && inY) state = 'dead';
        });

        if (bird.y + BIRD_R >= canvas.height - 30 || bird.y - BIRD_R <= 0) state = 'dead';
    }

    /* Draw tung.png instead of green pipe */
    function drawPipe(p) {
        const groundY = canvas.height - 30;
        const botH    = groundY - p.botY;

        if (tungImg.complete && tungImg.naturalWidth) {
            /* Top pipe — tung flipped upside down */
            ctx.save();
            ctx.translate(p.x + PIPE_W / 2, p.topH / 2);
            ctx.scale(1, -1);
            ctx.drawImage(tungImg, -PIPE_W / 2, -p.topH / 2, PIPE_W, p.topH);
            ctx.restore();

            /* Bottom pipe — tung right-side up */
            if (botH > 0) ctx.drawImage(tungImg, p.x, p.botY, PIPE_W, botH);
        } else {
            /* Fallback green pipe while image loads */
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(p.x, 0,      PIPE_W, p.topH);
            ctx.fillRect(p.x, p.botY, PIPE_W, botH);
        }
    }

    /* Draw nat.png as the bird — preserves aspect ratio, bigger size */
    function drawBird() {
        const angle   = Math.max(-0.45, Math.min(0.9, bird.vy * 0.07));
        const maxSize = BIRD_R * 8;   /* visual size, larger than hitbox */

        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.rotate(angle);

        if (natImg.complete && natImg.naturalWidth) {
            const aspect = natImg.naturalWidth / natImg.naturalHeight;
            const drawW  = aspect >= 1 ? maxSize : maxSize * aspect;
            const drawH  = aspect >= 1 ? maxSize / aspect : maxSize;
            ctx.drawImage(natImg, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    function draw() {
        const W = canvas.width;
        const H = canvas.height;

        /* Sky */
        const sky = ctx.createLinearGradient(0, 0, 0, H - 30);
        sky.addColorStop(0, '#5BBCF0');
        sky.addColorStop(1, '#C8EEF8');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        /* Clouds */
        ctx.fillStyle = 'rgba(255,255,255,0.78)';
        [[100, 55, 50, 20], [280, 32, 42, 17], [W - 110, 50, 56, 22]].forEach(([x, y, rw, rh]) => {
            ctx.beginPath(); ctx.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(x + rw * 0.5, y + 5, rw * 0.7, rh * 0.8, 0, 0, Math.PI * 2); ctx.fill();
        });

        /* Pipes */
        pipes.forEach(drawPipe);

        /* Ground */
        ctx.fillStyle = '#7ED34A';
        ctx.fillRect(0, H - 30, W, 30);
        ctx.fillStyle = '#5AA830';
        ctx.fillRect(0, H - 30, W, 8);

        /* Bird */
        drawBird();

        /* Score */
        ctx.textAlign = 'center';
        ctx.font = 'bold 26px "Courier Prime", monospace';
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillText(score, W / 2 + 1, 45);
        ctx.fillStyle = '#fff';
        ctx.fillText(score, W / 2, 44);

        /* Overlays */
        if (state === 'waiting') {
            ctx.fillStyle = 'rgba(0,0,0,0.32)';
            ctx.fillRect(0, 0, W, H);
            drawPanel(W / 2, H / 2, '🐦 Flappy Nat', '¡Toca o espacio para volar!');
        }
        if (state === 'dead') {
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.fillRect(0, 0, W, H);
            drawPanel(W / 2, H / 2, `Game Over  •  ${score} pts`, 'Toca para reiniciar');
        }
    }

    function drawPanel(cx, cy, title, sub) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.roundRect(cx - 155, cy - 52, 310, 100, 16);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.font = 'bold 18px "Courier Prime", monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(title, cx, cy - 10);
        ctx.font = '14px "Courier Prime", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        ctx.fillText(sub, cx, cy + 20);
    }

    function loop(now) {
        update(now);
        draw();
        animId = requestAnimationFrame(loop);
    }

    /* Controls */
    canvas.addEventListener('click', jump);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, { passive: false });

    function onKey(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
    }
    document.addEventListener('keydown', onKey);

    /* Start after layout settles */
    requestAnimationFrame(() => {
        const wrap    = container.querySelector('.game-flappy');
        canvas.width  = wrap.offsetWidth  || 400;
        canvas.height = wrap.offsetHeight || 300;
        init();
        animId = requestAnimationFrame(loop);
    });

    return function cleanup() {
        cancelAnimationFrame(animId);
        document.removeEventListener('keydown', onKey);
    };
}

buildShelf();
