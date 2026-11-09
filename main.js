/* =========================================================
   KIBORY · interacciones
   ========================================================= */
(() => {
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

/* generador pseudoaleatorio con semilla: los dibujos salen siempre iguales */
function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/* =========================================================
   1. HERO: palabra gigante apoyada en el borde del panel
   ========================================================= */
const heroTop = $('.hero-top');
const word = $('.hero-word');
const wordInner = $('.hw-inner');
const ball = $('.ball');

// la "i" sin punto: la pelota amarilla hace de punto
const iLetter = $$('.hero-word .l')[1];
if (iLetter) iLetter.textContent = 'ı';

function fitHeroWord() {
    if (!heroTop || !word) return;
    const avail = heroTop.clientWidth * (innerWidth < 860 ? .92 : .86);
    // ajuste iterativo: mide, corrige y vuelve a medir
    let size = 100;
    word.style.fontSize = size + 'px';
    for (let k = 0; k < 3; k++) {
        const w = wordInner.offsetWidth || 1;
        size = size * avail / w;
        word.style.fontSize = size + 'px';
    }
    // tampoco puede ser más alta que el panel (pantallas bajas y anchas)
    const mctx = document.createElement('canvas').getContext('2d');
    mctx.font = `800 ${size}px "Bricolage Grotesque"`;
    const asc = mctx.measureText('kbl').actualBoundingBoxAscent || size * .75;
    const availH = heroTop.clientHeight - (innerWidth < 860 ? 110 : 140);
    if (asc > availH) { size *= availH / asc; word.style.fontSize = size + 'px'; }

    // situar la línea base exactamente en el borde inferior del panel
    word.style.bottom = '0px';
    const box = word.getBoundingClientRect();
    const bl = $('.bl', word).getBoundingClientRect();
    const baselineFromBottom = box.bottom - bl.top;
    word.style.bottom = (-baselineFromBottom) + 'px';

    // la pelota sobre la "ı"
    if (ball && iLetter) {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = `800 ${size}px "Bricolage Grotesque"`;
        const xh = ctx.measureText('x').actualBoundingBoxAscent || size * .52;
        const ir = iLetter.getBoundingClientRect();
        const hr = heroTop.getBoundingClientRect();
        const bsize = clamp(size * .15, 24, 70);
        ball.style.width = bsize + 'px';
        const panelBottom = hr.height;
        ball.style.left = (ir.left - hr.left + ir.width / 2 - bsize / 2) + 'px';
        ball.style.top = (panelBottom - xh * 1.02 - bsize * 1.18) + 'px';
    }
}

/* =========================================================
   2. Bolsas de Kibory (HTML puro, sin imágenes de producto)
   ========================================================= */
$$('.bag').forEach(bag => {
    const flavor = bag.dataset.flavor || 'Pollo de corral';
    if (bag.dataset.color) bag.style.setProperty('--label', bag.dataset.color);
    bag.innerHTML = `
        <div class="bag-top"><span>RECETA REAL</span><svg><use href="#paw"/></svg><span>RACIONES A MEDIDA</span></div>
        <span class="bag-flavor">${flavor}</span>
        <div class="bag-brand">Kibory</div>
        <div class="bag-sub">COMIDA FRESCA<br>PARA PERROS</div>
        <div class="bag-small">Cocinada a baja temperatura</div>
        <div class="bag-badges"><span><i></i>100%<br>natural</span><span><i></i>Sin<br>conservantes</span></div>
        <img class="bag-dog" src="${bag.dataset.dog}" alt="" loading="lazy">`;
});

/* =========================================================
   3. Pintores de comida en canvas
   ========================================================= */
function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    return `rgb(${clamp(r,0,255)},${clamp(g,0,255)},${clamp(b,0,255)})`;
}
function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// croqueta: cuadrado redondeado con hoyuelo central
function kibble(ctx, x, y, s, rot, R) {
    const base = ['#b8642a', '#c06d2f', '#a85a24', '#c97a38', '#b06128'][Math.floor(R() * 5)];
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.shadowColor = 'rgba(60,25,5,.45)'; ctx.shadowBlur = s * .22; ctx.shadowOffsetY = s * .12;
    rrect(ctx, -s / 2, -s / 2, s, s, s * .3);
    const g = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
    g.addColorStop(0, shade(base, 38)); g.addColorStop(.55, base); g.addColorStop(1, shade(base, -40));
    ctx.fillStyle = g; ctx.fill();
    ctx.shadowColor = 'transparent';
    // textura porosa
    for (let i = 0; i < 7; i++) {
        ctx.fillStyle = `rgba(90,40,10,${.15 + R() * .2})`;
        ctx.beginPath(); ctx.arc((R() - .5) * s * .75, (R() - .5) * s * .75, s * (.025 + R() * .03), 0, 7); ctx.fill();
    }
    // hoyuelo
    const d = ctx.createRadialGradient(-s * .04, -s * .04, 0, 0, 0, s * .2);
    d.addColorStop(0, shade(base, -55)); d.addColorStop(1, shade(base, -10));
    rrect(ctx, -s * .16, -s * .16, s * .32, s * .32, s * .1);
    ctx.fillStyle = d; ctx.fill();
    ctx.restore();
}

function sphere(ctx, x, y, r, col, hl = .5) {
    const g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
    g.addColorStop(0, shade(col, 70 * hl + 20)); g.addColorStop(.6, col); g.addColorStop(1, shade(col, -45));
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = r * .4; ctx.shadowOffsetY = r * .2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = g; ctx.fill();
    ctx.restore();
}

function blueberry(ctx, x, y, r, R) {
    sphere(ctx, x, y, r, ['#2e3f7a', '#27346a', '#344a8a'][Math.floor(R() * 3)], .35);
    ctx.save();
    ctx.fillStyle = 'rgba(190,200,235,.25)';
    ctx.beginPath(); ctx.ellipse(x - r * .2, y - r * .3, r * .55, r * .35, -.5, 0, 7); ctx.fill();
    // corona
    const a = R() * 6;
    ctx.translate(x + Math.cos(a) * r * .45, y + Math.sin(a) * r * .45);
    ctx.fillStyle = '#1a2148';
    for (let i = 0; i < 5; i++) { ctx.rotate(1.256); ctx.beginPath(); ctx.ellipse(r * .1, 0, r * .12, r * .05, 0, 0, 7); ctx.fill(); }
    ctx.restore();
}

function cube(ctx, x, y, s, rot, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = s * .25; ctx.shadowOffsetY = s * .12;
    rrect(ctx, -s / 2, -s / 2, s, s, s * .12);
    const g = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
    g.addColorStop(0, shade(col, 45)); g.addColorStop(.5, col); g.addColorStop(1, shade(col, -35));
    ctx.fillStyle = g; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    rrect(ctx, -s / 2 + s * .1, -s / 2 + s * .08, s * .5, s * .14, s * .06); ctx.fill();
    ctx.restore();
}

function chunk(ctx, x, y, s, rot, R, col = '#f0dcb8') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.shadowColor = 'rgba(80,50,20,.3)'; ctx.shadowBlur = s * .25; ctx.shadowOffsetY = s * .1;
    ctx.beginPath();
    const n = 7;
    for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2, rr = s * (.42 + R() * .14);
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr * .85;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
    g.addColorStop(0, shade(col, 18)); g.addColorStop(.6, col); g.addColorStop(1, shade(col, -45));
    ctx.fillStyle = g; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = shade(col, -30); ctx.lineWidth = 1; ctx.globalAlpha = .5;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-s * .3, -s * .2 + i * s * .18); ctx.quadraticCurveTo(0, -s * .1 + i * s * .18, s * .3, -s * .25 + i * s * .18); ctx.stroke(); }
    ctx.restore();
}

function salmonPiece(ctx, x, y, w, h, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.shadowColor = 'rgba(120,40,20,.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5;
    rrect(ctx, -w / 2, -h / 2, w, h, h * .35);
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, '#ff9a6e'); g.addColorStop(.6, '#f27a52'); g.addColorStop(1, '#d9603e');
    ctx.fillStyle = g; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255,235,220,.85)'; ctx.lineWidth = Math.max(1.5, h * .05);
    for (let i = -3; i <= 3; i++) {
        ctx.beginPath(); ctx.moveTo(i * w * .14 - w * .05, -h / 2 + 2);
        ctx.quadraticCurveTo(i * w * .14 + w * .06, 0, i * w * .14 - w * .02, h / 2 - 2); ctx.stroke();
    }
    ctx.restore();
}

function carrotCoin(ctx, x, y, r, R) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = r * .4; ctx.shadowOffsetY = r * .2;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * (.85 + R() * .15), R() * 3, 0, 7);
    ctx.fillStyle = '#f07f1f'; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, r * .62, 0, 7); ctx.fillStyle = '#ffa043'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r * .3, 0, 7); ctx.fillStyle = '#ffb867'; ctx.fill();
}

function leaf(ctx, x, y, len, rot, col = '#3f8f3a') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * .5, -len * .35, len, 0);
    ctx.quadraticCurveTo(len * .5, len * .35, 0, 0);
    ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = shade(col, 40); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * .9, 0); ctx.stroke();
    ctx.restore();
}

function carrot(ctx, x, y, len, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6;
    ctx.beginPath(); ctx.moveTo(0, -len * .09);
    ctx.quadraticCurveTo(len * .6, -len * .07, len, 0);
    ctx.quadraticCurveTo(len * .6, len * .07, 0, len * .09);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -len * .09, 0, len * .09);
    g.addColorStop(0, '#ffa24a'); g.addColorStop(.5, '#f5821f'); g.addColorStop(1, '#d9640e');
    ctx.fillStyle = g; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(160,70,0,.4)'; ctx.lineWidth = 1.2;
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(len * i * .15, -len * .05); ctx.lineTo(len * i * .15 + 4, -len * .02); ctx.stroke(); }
    for (let i = 0; i < 6; i++) leaf(ctx, -2, 0, len * (.35 + i * .03), Math.PI + (i - 2.5) * .22, i % 2 ? '#3d9a3a' : '#2f7f2c');
    ctx.restore();
}

function texture(w, h, painter, seed) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    painter(c.getContext('2d'), w, h, rng(seed)); return c;
}

/* --- relleno completo de cada ingrediente para las cuñas del cuenco --- */
const fills = {
    chicken(ctx, w, h, R) {
        ctx.fillStyle = '#e7cfa6'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 70; i++) chunk(ctx, R() * w, R() * h, 70 + R() * 30, R() * 6, R);
    },
    salmon(ctx, w, h, R) {
        ctx.fillStyle = '#e8775a'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 60; i++) salmonPiece(ctx, R() * w, R() * h, 90 + R() * 30, 46 + R() * 14, R() * 6);
    },
    sweet(ctx, w, h, R) {
        ctx.fillStyle = '#d8661f'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 120; i++) cube(ctx, R() * w, R() * h, 54 + R() * 14, R() * 6, ['#ee7a2a', '#f08a35', '#e66f22'][i % 3]);
    },
    carrot(ctx, w, h, R) {
        ctx.fillStyle = '#e5701a'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 150; i++) carrotCoin(ctx, R() * w, R() * h, 26 + R() * 10, R);
    },
    peas(ctx, w, h, R) {
        ctx.fillStyle = '#4f9a2b'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 380; i++) sphere(ctx, R() * w, R() * h, 18 + R() * 6, ['#6dbb3c', '#7cc84a', '#5fae33'][i % 3]);
    },
    berries(ctx, w, h, R) {
        ctx.fillStyle = '#1f2b5a'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 220; i++) blueberry(ctx, R() * w, R() * h, 28 + R() * 9, R);
    },
};

/* =========================================================
   4. CUENCO DE INGREDIENTES
   ========================================================= */
const bowlCanvas = $('.bowl-canvas');
const ings = $$('.ing');
const ANG = [-120, 180, 120, -60, 0, 60].map(a => a * Math.PI / 180);
const FILL_KEYS = ['chicken', 'salmon', 'sweet', 'carrot', 'peas', 'berries'];
let bowl = null;

function buildBowl() {
    if (!bowlCanvas) return;
    const S = bowlCanvas.width, C = S / 2;
    const foodR = S * .405;
    // capa de croquetas, ordenada para que se solapen con naturalidad
    const kib = texture(S, S, (ctx, w, h, R) => {
        ctx.fillStyle = '#7a4318';
        ctx.beginPath(); ctx.arc(C, C, foodR, 0, 7); ctx.fill();
        const pts = [];
        for (let y = C - foodR; y < C + foodR + 40; y += 52) {
            for (let x = C - foodR; x < C + foodR + 40; x += 54) {
                const px = x + (R() - .5) * 26, py = y + (R() - .5) * 26;
                if (Math.hypot(px - C, py - C) < foodR - 18) pts.push([px, py]);
            }
        }
        pts.sort((a, b) => a[1] - b[1]);
        ctx.save(); ctx.beginPath(); ctx.arc(C, C, foodR, 0, 7); ctx.clip();
        pts.forEach(([x, y]) => kibble(ctx, x, y, 60 + R() * 10, (R() - .5) * 1.2, R));
        // sombra interior del cuenco
        const g = ctx.createRadialGradient(C, C, foodR * .7, C, C, foodR);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,15,0,.45)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }, 7);
    const tex = FILL_KEYS.map((k, i) => texture(S, S, fills[k], 100 + i));
    bowl = { S, C, foodR, kib, tex, active: 5, open: 0 };
    placeMarks();
}

function drawBowl() {
    if (!bowl) return;
    const { S, C, foodR, kib, tex, active, open } = bowl;
    const ctx = bowlCanvas.getContext('2d');
    ctx.clearRect(0, 0, S, S);
    // borde verde
    const rim = ctx.createLinearGradient(0, 0, S, S);
    rim.addColorStop(0, '#2fc274'); rim.addColorStop(.5, '#1a9a58'); rim.addColorStop(1, '#127a44');
    ctx.beginPath(); ctx.arc(C, C, S * .495, 0, 7); ctx.fillStyle = rim; ctx.fill();
    // borde blanco interior
    ctx.beginPath(); ctx.arc(C, C, S * .455, 0, 7);
    const wr = ctx.createRadialGradient(C - 40, C - 60, S * .3, C, C, S * .455);
    wr.addColorStop(0, '#ffffff'); wr.addColorStop(1, '#ece6e9');
    ctx.fillStyle = wr; ctx.fill();
    ctx.drawImage(kib, 0, 0);
    // cuña del ingrediente activo
    if (open > 0.01) {
        const a0 = ANG[active] - (Math.PI / 6) * open, a1 = ANG[active] + (Math.PI / 6) * open;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(C, C); ctx.arc(C, C, foodR + 2, a0, a1); ctx.closePath();
        ctx.clip();
        ctx.drawImage(tex[active], 0, 0);
        const g = ctx.createRadialGradient(C, C, foodR * .6, C, C, foodR);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(C + Math.cos(a0) * (foodR + 2), C + Math.sin(a0) * (foodR + 2));
        ctx.lineTo(C, C);
        ctx.lineTo(C + Math.cos(a1) * (foodR + 2), C + Math.sin(a1) * (foodR + 2));
        ctx.stroke();
        ctx.restore();
    }
}

const marksBox = $('.bowl-marks');
function placeMarks() {
    if (!marksBox) return;
    marksBox.innerHTML = '';
    ANG.forEach((a, i) => {
        const s = document.createElement('span');
        s.textContent = i + 1;
        s.style.left = (50 + Math.cos(a) * 25) + '%';
        s.style.top = (50 + Math.sin(a) * 25) + '%';
        marksBox.appendChild(s);
    });
}

const leaders = $('.leaders');
function drawLeaders() {
    if (!leaders || !marksBox) return;
    const stage = $('.bowl-stage').getBoundingClientRect();
    const marks = $$('span', marksBox);
    let html = '';
    ings.forEach((li, i) => {
        const b = $('h3 b', li).getBoundingClientRect();
        const m = marks[i].getBoundingClientRect();
        const left = i < 3;
        const x1 = (left ? b.right + 6 : b.left - 6) - stage.left, y1 = b.top + b.height / 2 - stage.top;
        const x2 = m.left + m.width / 2 - stage.left, y2 = m.top + m.height / 2 - stage.top;
        const mx = lerp(x1, x2, .55);
        html += `<path data-i="${i}" d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}"/>`;
    });
    leaders.innerHTML = html;
    setActive(bowl ? bowl.active : 5, true);
}

let openAnim = null;
function setActive(i, instant) {
    if (!bowl) return;
    ings.forEach((li, k) => li.classList.toggle('on', k === i));
    $$('span', marksBox).forEach((s, k) => s.classList.toggle('on', k === i));
    $$('path', leaders).forEach((p, k) => p.classList.toggle('on', k === i));
    if (bowl.active === i && !instant && bowl.open > .99) return;
    bowl.active = i;
    cancelAnimationFrame(openAnim);
    if (reduce || instant) { bowl.open = 1; drawBowl(); return; }
    const t0 = performance.now();
    const step = t => {
        const p = clamp((t - t0) / 650, 0, 1);
        bowl.open = 1 - Math.pow(1 - p, 3);
        drawBowl();
        if (p < 1) openAnim = requestAnimationFrame(step);
    };
    bowl.open = 0;
    openAnim = requestAnimationFrame(step);
}

let cycleTimer = null, userPicked = false;
function startCycle() {
    clearInterval(cycleTimer);
    if (reduce) return;
    cycleTimer = setInterval(() => { if (!userPicked) setActive((bowl.active + 1) % 6); }, 2600);
}
ings.forEach((li, i) => {
    li.addEventListener('mouseenter', () => { userPicked = true; setActive(i); });
    li.addEventListener('mouseleave', () => { userPicked = false; });
    li.addEventListener('click', () => { userPicked = true; setActive(i); setTimeout(() => userPicked = false, 6000); });
});

/* =========================================================
   5. Polaroids de la cocina
   ========================================================= */
const scenes = {
    meat(ctx, w, h, R) {
        ctx.fillStyle = '#f1e4d2'; ctx.save(); ctx.translate(w * .5, h * .55); ctx.rotate(-.06); ctx.fillRect(-w * .46, -h * .38, w * .92, h * .76); ctx.restore();
        // pechuga
        ctx.save(); ctx.translate(w * .2, h * .55); ctx.rotate(-.3);
        ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
        ctx.beginPath(); ctx.ellipse(0, 0, 60, 120, 0, 0, 7);
        const g = ctx.createLinearGradient(-60, -120, 60, 120); g.addColorStop(0, '#f7d9cf'); g.addColorStop(1, '#e2a99b');
        ctx.fillStyle = g; ctx.fill(); ctx.restore();
        // dados de ternera
        for (let i = 0; i < 9; i++) cube(ctx, w * .44 + (i % 3) * 44 + R() * 10, h * .32 + Math.floor(i / 3) * 44 + R() * 10, 46, R() * .6, ['#a3222f', '#b52e3a', '#8f1c28'][i % 3]);
        // chuleta
        ctx.save(); ctx.translate(w * .62, h * .78); ctx.rotate(.4);
        ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
        ctx.beginPath(); ctx.ellipse(0, 0, 70, 46, 0, 0, 7); ctx.fillStyle = '#b8323f'; ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.beginPath(); ctx.ellipse(-8, 4, 46, 26, 0, 0, 7); ctx.fillStyle = '#d4505b'; ctx.fill();
        ctx.strokeStyle = '#f6e4dd'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(0, 0, 66, 42, 0, 0, 7); ctx.stroke();
        ctx.restore();
        // salmón
        salmonPiece(ctx, w * .88, h * .5, 120, 210, .05);
        // romero
        ctx.strokeStyle = '#4b6b35'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * .3, h * .9); ctx.lineTo(w * .52, h * .82); ctx.stroke();
        for (let i = 0; i < 12; i++) leaf(ctx, w * .3 + i * 7, h * .9 - i * 2.6, 16, (i % 2 ? -1 : 1) * 1.1 - .3, '#5a7f3c');
    },
    veg(ctx, w, h, R) {
        // boniato partido
        ctx.save(); ctx.translate(w * .14, h * .55); ctx.rotate(.15);
        ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
        ctx.beginPath(); ctx.ellipse(0, 0, 56, 130, 0, 0, 7); ctx.fillStyle = '#9b4a2f'; ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.beginPath(); ctx.ellipse(6, 0, 46, 120, 0, 0, 7); ctx.fillStyle = '#f2913f'; ctx.fill();
        ctx.restore();
        // calabaza
        ctx.save(); ctx.translate(w * .38, h * .55);
        ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
        ctx.beginPath(); ctx.ellipse(0, 0, 70, 110, -.2, 0, 7); ctx.fillStyle = '#5e8f3a'; ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.beginPath(); ctx.ellipse(4, 0, 60, 100, -.2, 0, 7); ctx.fillStyle = '#f5a23a'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(10, 0, 30, 60, -.2, 0, 7); ctx.fillStyle = '#e8862b'; ctx.fill();
        for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(8 + (R() - .5) * 30, (R() - .5) * 90, 6, 3, R() * 3, 0, 7); ctx.fillStyle = '#fbe6b8'; ctx.fill(); }
        ctx.restore();
        // zanahorias
        carrot(ctx, w * .62, h * .12, 250, 1.45);
        carrot(ctx, w * .7, h * .14, 240, 1.62);
        // dados de zanahoria
        for (let i = 0; i < 10; i++) cube(ctx, w * .84 + (i % 2) * 34 + R() * 8, h * .3 + Math.floor(i / 2) * 36, 32, R() * .8, '#f5821f');
    },
    oil(ctx, w, h, R) {
        // botella cuentagotas
        ctx.save(); ctx.translate(w * .32, h * .62); ctx.rotate(-.12);
        ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10;
        rrect(ctx, -46, -80, 92, 170, 18);
        const g = ctx.createLinearGradient(-46, 0, 46, 0); g.addColorStop(0, '#7a3d0c'); g.addColorStop(.4, '#c0701f'); g.addColorStop(1, '#6b3308');
        ctx.fillStyle = g; ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#1c1c1c'; rrect(ctx, -22, -150, 44, 76, 12); ctx.fill();
        ctx.fillStyle = '#2b2b2b'; rrect(ctx, -30, -96, 60, 22, 6); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.25)'; rrect(ctx, -34, -60, 12, 120, 6); ctx.fill();
        ctx.restore();
        // gotas de aceite
        for (let i = 0; i < 6; i++) sphere(ctx, w * .2 + R() * w * .3, h * .82 + R() * h * .1, 8 + R() * 10, '#f2c43c', 1);
        // salmón
        salmonPiece(ctx, w * .74, h * .5, 210, 120, -.35);
    },
    fruit(ctx, w, h, R) {
        const pts = [];
        for (let i = 0; i < 46; i++) { const a = R() * 7, r = Math.sqrt(R()) * 130; pts.push([w * .32 + Math.cos(a) * r, h * .52 + Math.sin(a) * r * .9]); }
        pts.sort((a, b) => a[1] - b[1]).forEach(([x, y]) => blueberry(ctx, x, y, 20 + R() * 4, R));
        // gajos de manzana
        for (let i = 0; i < 4; i++) {
            ctx.save(); ctx.translate(w * .78 + (i % 2) * 20, h * .2 + i * 70); ctx.rotate(-.6 + i * .2);
            ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
            ctx.beginPath(); ctx.moveTo(-70, 0); ctx.quadraticCurveTo(0, -60, 70, 0); ctx.quadraticCurveTo(0, -16, -70, 0); ctx.closePath();
            ctx.fillStyle = '#c9283a'; ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.beginPath(); ctx.moveTo(-64, -2); ctx.quadraticCurveTo(0, -50, 64, -2); ctx.quadraticCurveTo(0, -18, -64, -2); ctx.closePath();
            ctx.fillStyle = '#fbf0d6'; ctx.fill();
            ctx.restore();
        }
    },
    seeds(ctx, w, h, R) {
        // linaza
        for (let i = 0; i < 420; i++) {
            const a = R() * 7, r = Math.sqrt(R()) * 80;
            ctx.save(); ctx.translate(w * .2 + Math.cos(a) * r, h * .55 + Math.sin(a) * r * .9); ctx.rotate(R() * 3);
            ctx.beginPath(); ctx.ellipse(0, 0, 5.5, 3, 0, 0, 7); ctx.fillStyle = ['#8a5524', '#a0662d', '#74451c'][i % 3]; ctx.fill(); ctx.restore();
        }
        // pipas de calabaza
        for (let i = 0; i < 26; i++) {
            const a = R() * 7, r = Math.sqrt(R()) * 70;
            ctx.save(); ctx.translate(w * .52 + Math.cos(a) * r, h * .36 + Math.sin(a) * r * .8); ctx.rotate(R() * 3);
            ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
            ctx.beginPath(); ctx.ellipse(0, 0, 15, 8, 0, 0, 7); ctx.fillStyle = '#7d9a45'; ctx.fill();
            ctx.shadowColor = 'transparent'; ctx.beginPath(); ctx.ellipse(-2, -1, 10, 4, 0, 0, 7); ctx.fillStyle = '#9db95a'; ctx.fill();
            ctx.restore();
        }
        // algas
        for (let i = 0; i < 16; i++) {
            ctx.save(); ctx.translate(w * .82 + (R() - .5) * 110, h * .38 + (R() - .5) * 120); ctx.rotate(R() * 6);
            ctx.beginPath(); ctx.moveTo(0, 0);
            for (let k = 0; k < 6; k++) ctx.lineTo((R() - .3) * 40, (R() - .3) * 40);
            ctx.closePath(); ctx.fillStyle = ['#1f3524', '#2a4630', '#16281b'][i % 3]; ctx.fill(); ctx.restore();
        }
        // perejil
        ctx.strokeStyle = '#3d7a2a'; ctx.lineWidth = 3;
        for (let s = 0; s < 3; s++) {
            const bx = w * .58 + s * 22, by = h * .9;
            ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 10 + s * 10, h * .66); ctx.stroke();
            for (let k = 0; k < 5; k++) leaf(ctx, bx - 10 + s * 10, h * .66, 26, k * 1.25 + s, '#3f9a33');
        }
    },
};

function paintPolaroids() {
    $$('canvas[data-food]').forEach((c, i) => {
        const ctx = c.getContext('2d');
        const w = c.width, h = c.height;
        const bg = ctx.createRadialGradient(w * .5, h * .4, 40, w * .5, h * .5, w * .7);
        bg.addColorStop(0, '#f8eef2'); bg.addColorStop(1, '#ead7df');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
        scenes[c.dataset.food](ctx, w, h, rng(40 + i));
    });
}

/* =========================================================
   6. Texturas de croquetas (manchas y cuenco de la promo)
   ========================================================= */
function kibblePattern() {
    const c = texture(440, 440, (ctx, w, h, R) => {
        ctx.fillStyle = '#6e3d16'; ctx.fillRect(0, 0, w, h);
        const pts = [];
        for (let y = -20; y < h + 40; y += 46) for (let x = -20; x < w + 40; x += 48) pts.push([x + (R() - .5) * 20, y + (R() - .5) * 20]);
        pts.sort((a, b) => a[1] - b[1]).forEach(([x, y]) => kibble(ctx, x, y, 52 + R() * 8, (R() - .5) * 1.6, R));
    }, 3);
    const url = c.toDataURL('image/jpeg', .82);
    $$('.kib-bg').forEach(el => el.style.backgroundImage = `url(${url})`);
}
function cupKibble() {
    $$('.cup-kibble').forEach(c => {
    const ctx = c.getContext('2d'), R = rng(11), w = c.width, h = c.height;
    const pts = [];
    for (let i = 0; i < 170; i++) {
        const x = 24 + R() * (w - 48);
        const dome = Math.sin((x / w) * Math.PI);
        const y = h - 26 - Math.sqrt(R()) * dome * (h * .62);
        pts.push([x, y]);
    }
    pts.sort((a, b) => a[1] - b[1]).forEach(([x, y]) => kibble(ctx, x, y, 44 + R() * 6, (R() - .5) * 1.4, R));
    });
}

/* =========================================================
   7. Texto que se colorea con el scroll
   ========================================================= */
const scrub = $('[data-scrub]');
let scrubWords = [];
if (scrub) {
    const walk = node => {
        [...node.childNodes].forEach(n => {
            if (n.nodeType === 3) {
                const frag = document.createDocumentFragment();
                n.textContent.split(/(\s+)/).forEach(part => {
                    if (!part) return;
                    if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
                    else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
                });
                n.replaceWith(frag);
            } else if (n.nodeType === 1) walk(n);
        });
    };
    walk(scrub);
    scrubWords = $$('.w', scrub);
}

/* =========================================================
   8. Contadores
   ========================================================= */
const fmt = (v, dec) => v.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
function runCounter(el) {
    const target = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = fmt(target, dec) + suf; return; }
    const t0 = performance.now(), dur = 1800;
    const tick = t => {
        const p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(target * e, dec) + suf;
        if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

/* =========================================================
   9. Apariciones al entrar en pantalla
   ========================================================= */
const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add('in');
        if (el.matches('[data-count]')) runCounter(el);
        io.unobserve(el);
    });
}, { threshold: .25, rootMargin: '0px 0px -8% 0px' });
$$('.reveal-up, .peek, .polaroids, .ft-dogs, [data-count]').forEach(el => io.observe(el));
$$('[data-count]').forEach(el => { el.textContent = fmt(0, +(el.dataset.dec || 0)) + (el.dataset.suffix || ''); });

/* =========================================================
   10. Bucle de scroll (texto, palabra que se rellena, banner)
   ========================================================= */
const fillWord = $('[data-fill]');
const realFood = $('.real-food');
const rfImg = $('.rf-dog');
const heroEl = $('.hero');
const heroDogImg = $('.hero-dog img');

function progress(el, start, end) {
    const r = el.getBoundingClientRect(), vh = innerHeight;
    return clamp((vh * start - r.top) / (vh * start - vh * end + r.height * 0), 0, 1);
}
function onScroll() {
    const vh = innerHeight;
    if (scrub && scrubWords.length) {
        const r = scrub.getBoundingClientRect();
        const p = clamp((vh * .85 - r.top) / (r.height + vh * .35), 0, 1);
        const n = Math.round(p * scrubWords.length * 1.08);
        scrubWords.forEach((w, i) => w.classList.toggle('on', i < n));
    }
    if (fillWord) {
        const r = fillWord.getBoundingClientRect();
        const p = clamp((vh * .9 - r.top) / (vh * .55), 0, 1);
        fillWord.style.setProperty('--fill', (p * 100).toFixed(1) + '%');
    }
    if (realFood) {
        const r = realFood.getBoundingClientRect();
        const p = clamp((vh - r.top) / (vh * .8), 0, 1);
        realFood.style.setProperty('--clip', ((1 - p) * 6).toFixed(2) + '%');
        if (rfImg) rfImg.style.setProperty('--s', (1.18 - p * .18).toFixed(3));
    }
    // el hero se hunde un poco mientras los paneles lo tapan
    if (heroEl && innerWidth > 860) {
        const y = scrollY, p = clamp(y / vh, 0, 1);
        heroEl.style.transform = `scale(${1 - p * .06})`;
        heroEl.style.opacity = (1 - p * .5).toFixed(3);
    }
}

/* =========================================================
   11. Parallax del perro y de las manchas con el ratón
   ========================================================= */
let mx = 0, my = 0, tx = 0, ty = 0;
addEventListener('mousemove', e => {
    mx = e.clientX / innerWidth - .5;
    my = e.clientY / innerHeight - .5;
}, { passive: true });
const blobs = $$('.bite .blob');
function parallaxLoop() {
    tx = lerp(tx, mx, .08); ty = lerp(ty, my, .08);
    if (heroDogImg && document.documentElement.classList.contains('ready') && !reduce) {
        heroDogImg.style.transform = `translate(${tx * 18}px, ${ty * 8}px) rotate(${tx * 4}deg)`;
    }
    blobs.forEach((b, i) => { b.style.transform = `translate(${tx * (i + 1) * 10}px, ${ty * (i + 1) * 8}px)`; });
    requestAnimationFrame(parallaxLoop);
}

/* =========================================================
   12. Carrusel de opiniones (arrastrable)
   ========================================================= */
const vp = $('.rv-viewport'), track = $('.rv-track');
if (vp && track) {
    const cards = $$('.rv-card', track);
    const dotsBox = $('.rv-dots');
    let idx = 0, x = 0, startX = 0, startT = 0, dragging = false, moved = 0;
    cards.forEach((_, i) => {
        const b = document.createElement('button');
        b.setAttribute('aria-label', `Opinión ${i + 1}`);
        b.addEventListener('click', () => go(i));
        dotsBox.appendChild(b);
    });
    const step = () => cards[1].offsetLeft - cards[0].offsetLeft;
    const maxX = () => Math.max(0, track.scrollWidth - vp.clientWidth + parseFloat(getComputedStyle(vp).paddingLeft) * 2);
    const set = (v, anim) => {
        x = v;
        track.style.transition = anim ? 'transform .7s cubic-bezier(.2,.8,.2,1)' : 'none';
        track.style.transform = `translate3d(${-x}px,0,0)`;
    };
    function go(i) {
        idx = clamp(i, 0, cards.length - 1);
        set(clamp(idx * step(), 0, maxX()), true);
        $$('button', dotsBox).forEach((d, k) => d.classList.toggle('on', k === idx));
    }
    $('.rv-btn.prev').addEventListener('click', () => go(idx - 1));
    $('.rv-btn.next').addEventListener('click', () => go(idx + 1));
    vp.addEventListener('pointerdown', e => {
        dragging = true; moved = 0; startX = e.clientX; startT = x;
        vp.setPointerCapture(e.pointerId);
        boneDown(true);
    });
    vp.addEventListener('pointermove', e => {
        if (!dragging) return;
        const dx = e.clientX - startX; moved = Math.abs(dx);
        let nx = startT - dx;
        const mxx = maxX();
        if (nx < 0) nx *= .35; if (nx > mxx) nx = mxx + (nx - mxx) * .35;
        set(nx, false);
    });
    const end = () => {
        if (!dragging) return;
        dragging = false; boneDown(false);
        go(Math.round(x / step()));
    };
    vp.addEventListener('pointerup', end);
    vp.addEventListener('pointercancel', end);
    vp.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(idx + 1); if (e.key === 'ArrowLeft') go(idx - 1); });
    vp.tabIndex = 0;
    addEventListener('resize', () => go(idx));
    go(0);
}

/* =========================================================
   13. Cursor hueso
   ========================================================= */
const bone = $('.bone-cursor'), boneLabel = $('.bone-label');
let bx = innerWidth / 2, by = innerHeight / 2, cx = bx, cy = by, vx = 0;
function boneDown(on) { bone && bone.classList.toggle('down', on); }
if (bone && finePointer) {
    addEventListener('pointermove', e => { cx = e.clientX; cy = e.clientY; }, { passive: true });
    addEventListener('pointerdown', () => boneDown(true));
    addEventListener('pointerup', () => boneDown(false));
    document.addEventListener('pointerover', e => {
        const t = e.target.closest('[data-cursor], a, button, .ing');
        const label = t && t.dataset ? t.dataset.cursor : '';
        if (label) { boneLabel.textContent = label; bone.classList.add('has-label'); }
        else bone.classList.remove('has-label');
        bone.querySelector('.bone-svg').style.setProperty('--sc', t ? 1.25 : 1);
    });
    document.addEventListener('pointerleave', () => bone.style.opacity = 0);
    document.addEventListener('pointerenter', () => bone.style.opacity = 1);
    const loop = () => {
        const nbx = lerp(bx, cx, .28), nby = lerp(by, cy, .28);
        vx = lerp(vx, nbx - bx, .2);
        bx = nbx; by = nby;
        bone.style.transform = `translate3d(${bx}px, ${by}px, 0)`;
        bone.querySelector('.bone-svg').style.setProperty('--rot', (-20 + clamp(vx * 2.5, -40, 40)) + 'deg');
        requestAnimationFrame(loop);
    };
    loop();
}

/* =========================================================
   ARRANQUE
   ========================================================= */
function layout() {
    fitHeroWord();
    drawLeaders();
    onScroll();
}

buildBowl();
drawBowl();
paintPolaroids();
kibblePattern();
cupKibble();

let ticking = false;
addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
}, { passive: true });
let rT;
addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(layout, 80); });

// la palabra se reajusta siempre que cambie el tamaño del panel
if ('ResizeObserver' in window && heroTop) new ResizeObserver(() => fitHeroWord()).observe(heroTop);

let started = false;
const start = () => {
    if (started) return; started = true;
    layout();
    setActive(5, true);
    startCycle();
    requestAnimationFrame(() => document.documentElement.classList.add('ready'));
    [300, 1200, 3000].forEach(t => setTimeout(fitHeroWord, t));
    parallaxLoop();
};
const fontsReady = document.fonts
    ? Promise.all([
        document.fonts.load('800 100px "Bricolage Grotesque"'),
        document.fonts.load('700 20px "Manrope"'),
        document.fonts.load('700 20px "Caveat"')
      ]).catch(() => {})
    : Promise.resolve();
fontsReady.then(start);
if (document.fonts) document.fonts.addEventListener('loadingdone', () => layout());
// por si las fuentes tardan demasiado
setTimeout(() => { if (!document.documentElement.classList.contains('ready')) start(); }, 2500);
addEventListener('load', layout);

})();
