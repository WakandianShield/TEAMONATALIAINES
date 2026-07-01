const GAMES = [
    { id: 'dibujar', name: 'NatArt',    img: 'draw.jpg', color: '#d946a8', launch: launchDrawingGame },
    { id: 'flappy',  name: 'Flappy Nat',img: 'bird.jpg', color: '#38b2e0', launch: launchFlappyGame },
    { id: 'stack',   name: 'NaTower', img: 'tower.png', color: '#f59e0b', launch: launchStackGame },
    { id: 'dino',    name: 'Nat Run',   img: 'run.jpg',   color: '#8b5cf6', launch: launchDinoGame },
];

let currentGameId     = null;
let cleanupCurrentGame = null;
const screen = document.getElementById('switchScreen');
const shelf  = document.getElementById('estanteJuegos');

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
            : `<span style="font-size:2rem;line-height:1">${game.emoji || 'ðŸŽ®'}</span>`;

        el.innerHTML = `
            <div class="cart-icon" style="${game.img ? '' : `background:linear-gradient(145deg,${game.color},${darken(game.color)})`}">
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

/* ========================================================
   DRAWING GAME
======================================================== */
function launchDrawingGame(container) {
    let drawing = false, currentColor = '#000000', brushSize = 6, isEraser = false, lastX = 0, lastY = 0;

    container.innerHTML = `
        <div class="game-draw">
            <div class="draw-toolbar">
                <input type="color" id="colorPicker" class="color-picker" value="#000000" title="Elige un color">
                <div class="toolbar-sep"></div>
                <div class="brush-sizes">
                    <button class="brush-btn btn-xsmall" data-size="1"></button>
                    <button class="brush-btn btn-small"  data-size="4"></button>
                    <button class="brush-btn btn-medium active" data-size="10"></button>
                    <button class="brush-btn btn-large"  data-size="24"></button>
                    <button class="brush-btn btn-xlarge" data-size="55"></button>
                </div>
                <div class="toolbar-sep"></div>
                <button class="draw-tool-btn" id="btnEraser">Borrador</button>
                <button class="draw-tool-btn" id="btnClear">Limpiar</button>
                <button class="draw-tool-btn btn-save" id="btnGuardar">Guardar</button>
            </div>
            <div class="draw-canvas-wrap" id="canvasWrap">
                <canvas id="drawCanvas"></canvas>
            </div>
        </div>`;

    const colorPicker = container.querySelector('#colorPicker');
    colorPicker.addEventListener('input', () => {
        currentColor = colorPicker.value;
        isEraser = false;
        container.querySelector('#btnEraser').classList.remove('active');
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
    });

    const wrap   = container.querySelector('#canvasWrap');
    const canvas = container.querySelector('#drawCanvas');
    const ctx    = canvas.getContext('2d');

    container.querySelector('#btnClear').addEventListener('click', () => {
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
    container.querySelector('#btnGuardar').addEventListener('click', () => {
        const a = document.createElement('a');
        a.download = 'NatArt.png'; a.href = canvas.toDataURL('image/png'); a.click();
    });

    function initCanvas() {
        canvas.width  = wrap.offsetWidth  || 400;
        canvas.height = wrap.offsetHeight || 300;
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(initCanvas);

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
        const src = e.touches ? e.touches[0] : e;
        return { x: (src.clientX - rect.left) * sx, y: (src.clientY - rect.top) * sy };
    }
    function startDraw(e) { e.preventDefault(); drawing = true; const p = getPos(e); lastX = p.x; lastY = p.y; }
    function doDraw(e) {
        if (!drawing) return; e.preventDefault();
        const { x, y } = getPos(e);
        ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(x, y);
        ctx.strokeStyle = isEraser ? '#fff' : currentColor;
        ctx.lineWidth   = isEraser ? brushSize * 3 : brushSize;
        ctx.lineCap = ctx.lineJoin = 'round'; ctx.stroke();
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

/* ========================================================
   FLAPPY NAT
======================================================== */
function launchFlappyGame(container) {
    container.innerHTML = `<div class="game-flappy"><canvas id="flappyCanvas"></canvas></div>`;
    const canvas = container.querySelector('#flappyCanvas');
    const ctx    = canvas.getContext('2d');

    const natImg  = new Image(); natImg.src  = 'nat.png';
    const tungImg = new Image(); tungImg.src = 'tung.png';

    const GRAVITY = 0.18, JUMP_FORCE = -5.5;
    const PIPE_W = 64, PIPE_GAP = 195, PIPE_SPEED = 2.6, PIPE_INTERVAL = 1900, BIRD_R = 22;

    let bird, pipes, score, state, animId, lastPipeTime;

    function init() {
        bird = { x: canvas.width / 2, y: canvas.height / 2, vy: 0 };
        pipes = []; score = 0; state = 'waiting'; lastPipeTime = performance.now();
    }
    function jump() {
        if (state === 'dead') { init(); return; }
        if (state === 'waiting') state = 'playing';
        bird.vy = JUMP_FORCE;
    }
    function spawnPipe() {
        const minTop = 55, maxTop = canvas.height - PIPE_GAP - 55;
        const topH = minTop + Math.random() * (maxTop - minTop);
        pipes.push({ x: canvas.width + 10, topH, botY: topH + PIPE_GAP, scored: false });
    }
    function update(now) {
        if (state !== 'playing') return;
        bird.vy += GRAVITY; bird.y += bird.vy;
        if (now - lastPipeTime > PIPE_INTERVAL) { spawnPipe(); lastPipeTime = now; }
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
    function drawPipe(p) {
        const groundY = canvas.height - 30, botH = groundY - p.botY;
        if (tungImg.complete && tungImg.naturalWidth) {
            ctx.save(); ctx.translate(p.x + PIPE_W / 2, p.topH / 2); ctx.scale(1, -1);
            ctx.drawImage(tungImg, -PIPE_W / 2, -p.topH / 2, PIPE_W, p.topH); ctx.restore();
            if (botH > 0) ctx.drawImage(tungImg, p.x, p.botY, PIPE_W, botH);
        } else {
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(p.x, 0, PIPE_W, p.topH);
            ctx.fillRect(p.x, p.botY, PIPE_W, botH);
        }
    }
    function drawBird() {
        const angle = Math.max(-0.45, Math.min(0.9, bird.vy * 0.07)), maxSize = BIRD_R * 7;
        ctx.save(); ctx.translate(bird.x, bird.y); ctx.rotate(angle);
        if (natImg.complete && natImg.naturalWidth) {
            const aspect = natImg.naturalWidth / natImg.naturalHeight;
            const dw = aspect >= 1 ? maxSize : maxSize * aspect, dh = aspect >= 1 ? maxSize / aspect : maxSize;
            ctx.drawImage(natImg, -dw / 2, -dh / 2, dw, dh);
        } else {
            ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
    function drawPanel(cx, cy, title, sub) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath();
        ctx.roundRect(cx - 155, cy - 52, 310, 100, 16); ctx.fill();
        ctx.textAlign = 'center';
        ctx.font = 'bold 18px "Courier Prime",monospace'; ctx.fillStyle = '#fff'; ctx.fillText(title, cx, cy - 10);
        ctx.font = '14px "Courier Prime",monospace'; ctx.fillStyle = 'rgba(255,255,255,0.82)'; ctx.fillText(sub, cx, cy + 20);
    }
    function draw() {
        const W = canvas.width, H = canvas.height;
        const sky = ctx.createLinearGradient(0, 0, 0, H - 30);
        sky.addColorStop(0, '#5BBCF0'); sky.addColorStop(1, '#C8EEF8');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.78)';
        [[100,55,50,20],[280,32,42,17],[W-110,50,56,22]].forEach(([x,y,rw,rh]) => {
            ctx.beginPath(); ctx.ellipse(x,y,rw,rh,0,0,Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(x+rw*0.5,y+5,rw*0.7,rh*0.8,0,0,Math.PI*2); ctx.fill();
        });
        pipes.forEach(drawPipe);
        ctx.fillStyle = '#7ED34A'; ctx.fillRect(0, H-30, W, 30);
        ctx.fillStyle = '#5AA830'; ctx.fillRect(0, H-30, W, 8);
        if (state !== 'waiting') drawBird();
        ctx.textAlign = 'center'; ctx.font = 'bold 26px "Courier Prime",monospace';
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillText(score, W/2+1, 45);
        ctx.fillStyle = '#fff'; ctx.fillText(score, W/2, 44);
        if (state === 'waiting') {
            ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0,0,W,H);
            if (natImg.complete && natImg.naturalWidth) {
                const big = Math.min(W,H)*0.52, asp = natImg.naturalWidth/natImg.naturalHeight;
                const dw = asp>=1?big:big*asp, dh = asp>=1?big/asp:big;
                ctx.drawImage(natImg, W/2-dw/2, H/2-dh/2-30, dw, dh);
            }
            drawPanel(W/2, H-105, 'Flappy Nat', 'DALE CLICK O ESPACIO PARA VOLAR');
        }
        if (state === 'dead') {
            ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0,0,W,H);
            drawPanel(W/2, H/2, `PERDISTE NUB  -  ${score} PTS`, 'TOCA PARA REINTENTAR');
        }
    }
    function loop(now) { update(now); draw(); animId = requestAnimationFrame(loop); }
    canvas.addEventListener('click', jump);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, { passive: false });
    function onKey(e) { if (e.code==='Space'||e.code==='ArrowUp') { e.preventDefault(); jump(); } }
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => {
        const wrap = container.querySelector('.game-flappy');
        canvas.width = wrap.offsetWidth||400; canvas.height = wrap.offsetHeight||300;
        init(); animId = requestAnimationFrame(loop);
    });
    return () => { cancelAnimationFrame(animId); document.removeEventListener('keydown', onKey); };
}

/* ========================================================
   TOWERBLOX  â€"  movimiento sinusoidal suave, feedback al colocar
======================================================== */
function launchStackGame(container) {
    container.innerHTML = `<div class="game-canvas"><canvas id="stackCanvas"></canvas></div>`;
    const canvas = container.querySelector('#stackCanvas');
    const ctx    = canvas.getContext('2d');
    // 32 colores Rojo→Naranja→Amarillo→Verde→Cian→Azul→Violeta→Rosa (3 tonos entre cada uno)
    const COLORS = [
        'hsl(0,100%,52%)',   'hsl(8,100%,52%)',   'hsl(16,100%,52%)',  'hsl(24,100%,52%)',
        'hsl(32,100%,52%)',  'hsl(42,100%,52%)',  'hsl(52,100%,52%)',  'hsl(58,100%,52%)',
        'hsl(66,100%,52%)',  'hsl(80,100%,52%)',  'hsl(95,100%,52%)',  'hsl(110,100%,52%)',
        'hsl(120,100%,42%)', 'hsl(135,100%,42%)', 'hsl(150,100%,42%)', 'hsl(165,100%,42%)',
        'hsl(180,100%,42%)', 'hsl(195,100%,45%)', 'hsl(210,100%,52%)', 'hsl(225,100%,55%)',
        'hsl(240,100%,58%)', 'hsl(252,100%,58%)', 'hsl(264,100%,56%)', 'hsl(274,100%,54%)',
        'hsl(284,100%,52%)', 'hsl(296,100%,52%)', 'hsl(308,100%,52%)', 'hsl(318,100%,52%)',
        'hsl(326,100%,52%)', 'hsl(333,100%,52%)', 'hsl(340,100%,52%)', 'hsl(348,100%,52%)',
    ];
    const BH = 24;

    let blocks, mover, score, phase, state, animId, scrollY, perfectFlash;

    function init() {
        const W = canvas.width, H = canvas.height;
        const bw = W * 0.55;
        blocks = [{ x: W/2-bw/2, y: H-BH-10, w: bw, h: BH, color: COLORS[0], flash: 0 }];
        mover  = { y: H-BH*2-22, w: bw, h: BH, color: COLORS[1] };
        mover.x = 0; // will be overwritten each frame by phase
        score = 0; phase = 0; state = 'playing'; scrollY = 0; perfectFlash = 0;
    }

    function drop() {
        if (state === 'dead') { init(); return; }
        const top = blocks[blocks.length-1];
        const left = Math.max(mover.x, top.x);
        const right= Math.min(mover.x+mover.w, top.x+top.w);
        const ow   = right-left;

        if (ow <= 2) { state = 'dead'; return; }

        const isPerfect = Math.abs(mover.x-top.x) < 5;
        const nx = isPerfect ? top.x : left;
        const nw = isPerfect ? top.w : ow;

        blocks.push({ x: nx, y: mover.y, w: nw, h: BH, color: mover.color, flash: 12 });
        score++;
        if (isPerfect) { perfectFlash = 30; }
        mover = { x: 0, y: mover.y-BH-3, w: nw, h: BH, color: COLORS[score%COLORS.length] };
        scrollY = Math.max(0, -(mover.y - canvas.height*0.38));
    }

    function loop() {
        if (state === 'playing') {
            // Smooth sinusoidal motion â€" gets faster with score
            phase += 0.022 + score * 0.0012;
            const maxX = canvas.width - mover.w;
            mover.x = maxX * (0.5 + 0.5 * Math.sin(phase));
        }
        if (perfectFlash > 0) perfectFlash--;

        const W = canvas.width, H = canvas.height;
        const bg = ctx.createLinearGradient(0,0,0,H);
        bg.addColorStop(0, '#0f0c29'); bg.addColorStop(1, '#302b63');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

        // Grid lines for depth
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
        for (let gy = 0; gy < H; gy += 20) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }

        blocks.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y+scrollY, b.w, b.h);
            // Top highlight
            ctx.fillStyle = 'rgba(255,255,255,0.22)';
            ctx.fillRect(b.x, b.y+scrollY, b.w, 5);
            // Flash overlay on new block
            if (b.flash > 0) {
                ctx.fillStyle = `rgba(255,255,255,${b.flash/12*0.55})`;
                ctx.fillRect(b.x, b.y+scrollY, b.w, b.h);
                b.flash--;
            }
        });

        if (state === 'playing') {
            ctx.fillStyle = mover.color;
            ctx.fillRect(mover.x, mover.y+scrollY, mover.w, mover.h);
            ctx.fillStyle = 'rgba(255,255,255,0.22)';
            ctx.fillRect(mover.x, mover.y+scrollY, mover.w, 5);
        }

        // Score
        ctx.textAlign = 'center'; ctx.font = 'bold 30px "Courier Prime",monospace';
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillText(score, W/2+1, 41);
        ctx.fillStyle = '#fff'; ctx.fillText(score, W/2, 40);

        // Perfect flash banner
        if (perfectFlash > 0) {
            ctx.textAlign = 'center'; ctx.font = 'bold 18px "Courier Prime",monospace';
            ctx.fillStyle = `rgba(255,230,50,${perfectFlash/30})`;
            ctx.fillText('BUENA', W/2, 68);
        }

        if (state === 'dead') {
            ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
            ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px "Courier Prime",monospace'; ctx.fillText('PERDISTE NUB', W/2, H/2-20);
            ctx.font = '15px "Courier Prime",monospace';
            ctx.fillText(`NIVEL: ${score}`, W/2, H/2+10);
            ctx.fillText('TOCA PARA REINTENTAR', W/2, H/2+38);
        }
        animId = requestAnimationFrame(loop);
    }

    canvas.addEventListener('click', drop);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); drop(); }, { passive: false });
    function onKey(e) { if (e.code==='Space'||e.code==='ArrowDown') { e.preventDefault(); drop(); } }
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => {
        const wrap = container.querySelector('.game-canvas');
        canvas.width = wrap.offsetWidth||400; canvas.height = wrap.offsetHeight||300;
        init(); animId = requestAnimationFrame(loop);
    });
    return () => { cancelAnimationFrame(animId); document.removeEventListener('keydown', onKey); };
}

/* ========================================================
   NAT RUN  -  ciudad atardecer, tubos de incendio y pajaros
======================================================== */
function launchDinoGame(container) {
    container.innerHTML = `<div class="game-canvas"><canvas id="dinoCanvas"></canvas></div>`;
    const canvas = container.querySelector('#dinoCanvas');
    const ctx    = canvas.getContext('2d');

    const natImg  = new Image(); natImg.src  = 'nat-skate.png';
    const birdImg = new Image(); birdImg.src = 'nat.png';

    const GRAV   = 0.55;
    const JUMP_V = -13;
    const GY     = () => canvas.height - 55;   // ground surface y
    const CHAR_X = 85;
    const CHAR_H = 120;
    const CHAR_W = 62;

    let player, obstacles, score, hiScore, speed, state, animId, frame;
    let bgFar = 0, bgMid = 0, bgNear = 0;
    let startT = 0; // 0→1 transition from waiting to playing

    // Stable hash: integer seed → [0,1)
    function ph(n) { return Math.abs(Math.sin(n * 127.1 + 311.7) * 43758.5) % 1; }

    function init() {
        const gY = GY();
        player = { y: gY - CHAR_H, vy: 0, onGround: true, jumps: 0, duck: false };
        obstacles = [];
        score = 0; speed = 5; frame = 0; state = 'waiting';
        if (!hiScore) hiScore = 0;
    }

    function jump() {
        if (state === 'dead')     { init(); return; }
        if (state === 'waiting')  { state = 'starting'; startT = 0; return; }
        if (state === 'starting') return;
        if (player.duck) { player.duck = false; return; }
        if (player.jumps < 2) {
            player.vy = JUMP_V - player.jumps * 2.5;
            player.onGround = false; player.jumps++;
        }
    }

    function spawnObs() {
        const W = canvas.width, gY = GY();
        if (Math.random() < 0.28 && score > 150) {
            // Pajaro en 3 alturas distintas
            const tiers = [gY - CHAR_H*0.55, gY - CHAR_H*1.1, gY - CHAR_H*1.8];
            const birdY = tiers[Math.floor(Math.random()*3)];
            obstacles.push({ type:'bird', x: W+40, y: birdY, w: 66, h: 42 });
        } else {
            // Tubo de incendio (1 o 2)
            const count = Math.random() < 0.28 ? 2 : 1;
            const hh = 56 + Math.random()*18;
            obstacles.push({ type:'hydrant', x: W+40, y: gY - hh, w: count*44 + (count-1)*12, h: hh });
        }
    }

    function update() {
        if (state === 'starting') {
            startT = Math.min(1, startT + 0.045);
            if (startT >= 1) state = 'playing';
            return;
        }
        if (state !== 'playing') return;
        const W = canvas.width, gY = GY();
        frame++;

        player.vy += GRAV; player.y += player.vy;
        if (player.y + CHAR_H >= gY) {
            player.y = gY - CHAR_H; player.vy = 0;
            player.onGround = true; player.jumps = 0;
        }

        const minGap = Math.max(300, 680 - score * 0.5);
        const last   = obstacles[obstacles.length - 1];
        if (!last || W - last.x > minGap)
            if (Math.random() < 0.025 + score*0.00004) spawnObs();

        let dead = false;
        const pH = player.duck ? CHAR_H*0.5 : CHAR_H;
        const pY = player.duck ? player.y + CHAR_H*0.5 : player.y;
        obstacles.forEach(o => {
            o.x -= speed;
            if (CHAR_X+CHAR_W-10 > o.x+6 && CHAR_X+10 < o.x+o.w-6 &&
                pY+pH-8 > o.y+6 && pY+8 < o.y+o.h-6) dead = true;
        });
        obstacles = obstacles.filter(o => o.x + o.w > -10);
        if (dead) { state = 'dead'; if (score > hiScore) hiScore = score; return; }

        score += 0.1;
        speed  = 5 + Math.floor(score / 100) * 0.45;
    }

    // --- Draw helpers ---

    function drawSky() {
        const W = canvas.width, gY = GY();
        const sky = ctx.createLinearGradient(0, 0, 0, gY);
        sky.addColorStop(0,    '#08021c');
        sky.addColorStop(0.28, '#2d0855');
        sky.addColorStop(0.55, '#8c1a3c');
        sky.addColorStop(0.78, '#d44010');
        sky.addColorStop(0.92, '#f07a00');
        sky.addColorStop(1,    '#ffc060');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, gY);

        // Estrellas en la parte oscura
        ctx.fillStyle = 'rgba(255,255,255,0.78)';
        [[0.08,0.06],[0.22,0.10],[0.40,0.04],[0.56,0.13],[0.14,0.20],[0.70,0.08],[0.86,0.11],[0.32,0.22]].forEach(([px,py]) => {
            if (py < 0.32) { ctx.beginPath(); ctx.arc(W*px, gY*py, 1.3, 0, Math.PI*2); ctx.fill(); }
        });

        // Sol casi oculto en el horizonte
        const sunX = W*0.68, sunY = gY, sunR = 32;
        const glow = ctx.createRadialGradient(sunX, sunY, sunR*0.5, sunX, sunY, sunR*4.5);
        glow.addColorStop(0, 'rgba(255,210,60,0.55)');
        glow.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(sunX - sunR*5, sunY - sunR*5, sunR*10, sunR*10);
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, W, gY); ctx.clip();
        ctx.fillStyle = '#ffe055';
        ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }

    // Capa de edificios con ventanas estables (ph da resultados deterministicos)
    function drawBuildLayer(scrollX, color, minH, maxH, bw, winColor) {
        const W = canvas.width, gY = GY();
        const step = bw + 5;
        const startB = Math.floor(scrollX / step) - 1;
        const endB   = startB + Math.ceil(W / step) + 3;
        for (let bid = startB; bid <= endB; bid++) {
            const sx = bid * step - scrollX;
            if (sx + bw < -5 || sx > W + 5) continue;
            const h = minH + (maxH - minH) * ph(bid * 7.3 + bw);
            ctx.fillStyle = color;
            ctx.fillRect(sx, gY - h, bw, h);
            if (winColor) {
                for (let row = 0; row < Math.floor((h - 10) / 13); row++) {
                    const wy = gY - h + 8 + row * 13;
                    for (let col = 0; col < Math.floor((bw - 6) / 8); col++) {
                        if (ph(bid * 997 + row * 13 + col) > 0.44) {
                            ctx.fillStyle = winColor;
                            ctx.fillRect(sx + 4 + col * 8, wy, 4, 5);
                            ctx.fillStyle = color;
                        }
                    }
                }
            }
        }
    }

    function drawGround() {
        const W = canvas.width, H = canvas.height, gY = GY();
        const grd = ctx.createLinearGradient(0, gY, 0, H);
        grd.addColorStop(0, '#1a1530'); grd.addColorStop(1, '#0a0a18');
        ctx.fillStyle = grd; ctx.fillRect(0, gY, W, H - gY);
        ctx.strokeStyle = '#c84400'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, gY); ctx.lineTo(W, gY); ctx.stroke();
        // Marcas de acera que se mueven
        ctx.fillStyle = 'rgba(120,90,160,0.32)';
        const off = bgNear % 55;
        for (let x = -off; x < W + 55; x += 55) ctx.fillRect(x, gY + 6, 28, 2);
    }

    function drawHydrant(o) {
        const count = Math.max(1, Math.round(o.w / 30));
        const slotW = o.w / count;
        for (let i = 0; i < count; i++) {
            const bx = o.x + i * slotW + slotW*0.05;
            const bw = slotW * 0.9;
            const { y, h } = o;
            const cx = bx + bw/2;
            // Base
            ctx.fillStyle = '#aa0000'; ctx.fillRect(bx, y+h*0.82, bw, h*0.18);
            // Cuerpo
            ctx.fillStyle = '#dd1111';
            ctx.fillRect(bx+bw*0.2, y+h*0.2, bw*0.6, h*0.65);
            // Collar superior
            ctx.fillStyle = '#aa0000'; ctx.fillRect(bx+bw*0.08, y+h*0.08, bw*0.84, h*0.15);
            // Domo
            ctx.fillStyle = '#dd1111';
            ctx.beginPath(); ctx.arc(cx, y+h*0.12, bw*0.38, Math.PI, 0); ctx.fill();
            // Boquillas laterales
            ctx.fillStyle = '#aa0000';
            ctx.fillRect(bx-bw*0.22, y+h*0.42, bw*0.22, h*0.16);
            ctx.fillRect(bx+bw,      y+h*0.42, bw*0.22, h*0.16);
            ctx.beginPath(); ctx.arc(bx-bw*0.04, y+h*0.50, bw*0.10, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(bx+bw+bw*0.04, y+h*0.50, bw*0.10, 0, Math.PI*2); ctx.fill();
            // Cadena
            ctx.strokeStyle='#888'; ctx.lineWidth=1.5;
            ctx.beginPath();
            ctx.moveTo(bx-bw*0.04, y+h*0.44);
            ctx.bezierCurveTo(bx-bw*0.04, y+h*0.72, bx+bw+bw*0.04, y+h*0.72, bx+bw+bw*0.04, y+h*0.44);
            ctx.stroke();
            // Brillo
            ctx.fillStyle='rgba(255,255,255,0.18)';
            ctx.beginPath(); ctx.ellipse(bx+bw*0.42, y+h*0.35, bw*0.14, h*0.10, -0.3, 0, Math.PI*2); ctx.fill();
            // Perno amarillo arriba
            ctx.fillStyle='#ffcc00';
            ctx.beginPath(); ctx.arc(cx, y+h*0.12, 3.5, 0, Math.PI*2); ctx.fill();
        }
    }

    function drawBirdObs(o, ts) {
        const cx  = o.x + o.w * 0.5;
        const cy  = o.y + o.h * 0.5 + Math.sin(ts * 0.007) * 5;
        const dh  = o.h * 2.6;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(-1, 1);
        if (birdImg.complete && birdImg.naturalWidth) {
            const asp = birdImg.naturalWidth / birdImg.naturalHeight;
            ctx.drawImage(birdImg, -(dh * asp) * 0.5, -dh * 0.5, dh * asp, dh);
        } else {
            ctx.fillStyle = '#7744bb';
            ctx.fillRect(-o.w * 0.5, -o.h * 0.5, o.w, o.h);
        }
        ctx.restore();
    }

    function draw(ts) {
        const W = canvas.width, H = canvas.height;

        // Ciudad se mueve siempre (incluso en pausa/dead)
        const s = state === 'playing' ? speed : 1.5;
        bgFar  += s * 0.14;
        bgMid  += s * 0.36;
        bgNear += s * 0.70;

        drawSky();
        // Capas de edificios (lejanos=lentos, cercanos=rapidos)
        drawBuildLayer(bgFar,  '#1a0a3a',  65, 130, 22, null);
        drawBuildLayer(bgMid,  '#110820',  40,  85, 34, 'rgba(255,200,80,0.5)');
        drawBuildLayer(bgNear, '#070410',  25,  50, 50, 'rgba(255,160,30,0.38)');
        drawGround();

        // Obstaculos
        obstacles.forEach(o => {
            if (o.type === 'hydrant') drawHydrant(o);
            else drawBirdObs(o, ts);
        });

        // Nat
        const pH    = player.duck ? CHAR_H*0.55 : CHAR_H;
        const pY    = player.duck ? player.y + CHAR_H*0.45 : player.y;
        const t     = frame * Math.PI / 8;
        const bob   = player.onGround ? Math.sin(t) * 1 : 0;
        const tilt  = player.onGround ? Math.sin(t+0.9)*0.02 : (player.vy<0?-0.15:0.13);
        const gameCX = CHAR_X + CHAR_W * 0.5;
        const gameCY = pY + bob + pH * 0.5;

        if (state === 'waiting' || state === 'starting') {
            // Pantalla de inicio: personaje grande centrado, se anima hacia posicion de juego
            const bigH  = Math.min(W, H) * 0.54;
            const bigCX = W * 0.5;
            const bigCY = H * 0.46;
            const ease  = state === 'starting' ? startT*startT*(3 - 2*startT) : 0;
            const dH    = bigH  + (pH    - bigH)  * ease;
            const dCX   = bigCX + (gameCX - bigCX) * ease;
            const dCY   = bigCY + (gameCY - bigCY) * ease;
            if (state === 'waiting') {
                ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fillRect(0,0,W,H);
            }
            if (natImg.complete && natImg.naturalWidth) {
                const asp = natImg.naturalWidth / natImg.naturalHeight;
                ctx.drawImage(natImg, dCX - (dH*asp)*0.5, dCY - dH*0.5, dH*asp, dH);
            }
            if (state === 'waiting') {
                const textY = bigCY + bigH*0.5 + 18;
                ctx.textAlign = 'center';
                ctx.font = 'bold 19px "Courier Prime",monospace'; ctx.fillStyle = '#ffcc88';
                ctx.fillText('Nat Run', W/2, textY);
                ctx.font = '12px "Courier Prime",monospace'; ctx.fillStyle = 'rgba(255,200,140,0.85)';
                ctx.fillText('ESPACIO O FLECHA ARRIBA PARA SALTAR', W/2, textY + 20);
                ctx.fillText('FLECHA ABAJO PARA AGACHARSE', W/2, textY + 37);
            }
        } else {
            ctx.save();
            ctx.translate(gameCX, gameCY);
            ctx.rotate(tilt);
            if (natImg.complete && natImg.naturalWidth) {
                const asp = natImg.naturalWidth / natImg.naturalHeight;
                ctx.drawImage(natImg, -(pH*asp)*0.5, -pH*0.5, pH*asp, pH);
            } else {
                ctx.fillStyle = '#e8d5b7';
                ctx.fillRect(-CHAR_W*0.5, -pH*0.5, CHAR_W, pH);
            }
            ctx.restore();
        }

        // HUD puntuacion
        ctx.textAlign = 'right'; ctx.font = 'bold 15px "Courier Prime",monospace';
        ctx.fillStyle = 'rgba(255,210,130,0.95)';
        ctx.fillText('HI ' + String(Math.floor(hiScore)).padStart(5,'0') + '  ' + String(Math.floor(score)).padStart(5,'0'), W-10, 22);
        if (state === 'dead') {
            ctx.fillStyle='rgba(0,0,0,0.60)'; ctx.fillRect(0,0,W,H);
            ctx.textAlign='center';
            ctx.font='bold 18px "Courier Prime",monospace'; ctx.fillStyle='#ff7755';
            ctx.fillText('PERDISTE NUB', W/2, H/2-18);
            ctx.font='13px "Courier Prime",monospace'; ctx.fillStyle='rgba(255,200,140,0.85)';
            ctx.fillText('DISTANCIA: ' + Math.floor(score) + 'm', W/2, H/2+4);
            ctx.fillText('TOCA PANTALLA O ESPACIO PARA REINICIAR', W/2, H/2+24);
        }
    }

    function loop(ts) { update(); draw(ts); animId = requestAnimationFrame(loop); }

    canvas.addEventListener('click', jump);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, { passive: false });
    function onKey(e) {
        if (['Space','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault();
        if (e.type === 'keydown') {
            if (e.code === 'ArrowDown') player.duck = true; else jump();
        }
        if (e.type === 'keyup' && e.code === 'ArrowDown') player.duck = false;
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup',   onKey);

    requestAnimationFrame(() => {
        const wrap = container.querySelector('.game-canvas');
        canvas.width = wrap.offsetWidth||400; canvas.height = wrap.offsetHeight||300;
        init(); animId = requestAnimationFrame(loop);
    });
    return () => {
        cancelAnimationFrame(animId);
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('keyup',   onKey);
    };
}

buildShelf();
