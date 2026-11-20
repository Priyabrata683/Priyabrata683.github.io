import * as THREE from 'three';

/* ------------------------------------------------------------------
   Priyabrata Parida — immersive 3D portfolio
   Every model is built from code (no external assets). Interactive layer:
   ignition gate, engine sound, turbo, clickable models, drivable kart,
   and 10 hidden secrets.
------------------------------------------------------------------- */

window.__ppAlive = true; // tells the no-JS fallback in index.html that the script loaded
const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const damp = THREE.MathUtils.damp;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const sections = [...document.querySelectorAll('main > section')];
const SPACING = 14; // world units between section scenes
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

/* =================================================================
   Sound — a synthesised engine whose pitch follows the RPM
================================================================= */
const Sound = (() => {
  let ctx = null, master, engineGain, osc1, osc2, filter, lfo;
  let enabled = store.get('pp-sound') !== 'off';
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.6 : 0;
    master.connect(ctx.destination);
    engineGain = ctx.createGain();
    engineGain.gain.value = 0;
    engineGain.connect(master);
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    filter.Q.value = 5;
    const chug = ctx.createGain();
    chug.gain.value = 0.55;
    lfo = ctx.createOscillator();
    lfo.frequency.value = 7;
    const depth = ctx.createGain();
    depth.gain.value = 0.45;
    lfo.connect(depth).connect(chug.gain);
    osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2 = ctx.createOscillator();
    osc2.type = 'square';
    const g2 = ctx.createGain();
    g2.gain.value = 0.35;
    osc1.connect(filter);
    osc2.connect(g2).connect(filter);
    filter.connect(chug).connect(engineGain);
    [osc1, osc2, lfo].forEach((o) => o.start());
    document.addEventListener('visibilitychange', () => (document.hidden ? ctx.suspend() : ctx.resume()));
  }
  function setRpm(rpm, on = true) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const f = 22 + rpm / 55;
    osc1.frequency.setTargetAtTime(f, t, 0.06);
    osc2.frequency.setTargetAtTime(f * 0.502, t, 0.06);
    filter.frequency.setTargetAtTime(220 + rpm * 0.28, t, 0.08);
    lfo.frequency.setTargetAtTime(Math.max(rpm / 120, 4), t, 0.08);
    engineGain.gain.setTargetAtTime(on ? 0.03 + Math.min(rpm / 8000, 1) * 0.09 : 0, t, 0.15);
  }
  function tone(freq, dur = 0.12, type = 'sine', vol = 0.15, when = 0, slideTo) {
    if (!ctx || !enabled) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function whoosh(dur = 0.7, from = 300, to = 3000, vol = 0.18) {
    if (!ctx || !enabled) return;
    const t = ctx.currentTime;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(from, t);
    bp.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(master);
    src.start(t);
  }
  return {
    init, setRpm, tone, whoosh,
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      store.set('pp-sound', enabled ? 'on' : 'off');
      init();
      if (master) master.gain.setTargetAtTime(enabled ? 0.6 : 0, ctx.currentTime, 0.05);
      return enabled;
    },
    beeps() { for (let i = 0; i < 7; i++) tone(500 + Math.random() * 1500, 0.07, 'square', 0.05, i * 0.08); },
    chime() { tone(880, 0.3, 'triangle', 0.12); tone(1320, 0.4, 'triangle', 0.1, 0.1); },
    fanfare() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.35, 'triangle', 0.12, i * 0.12)); },
    ratchet() { for (let i = 0; i < 8; i++) tone(1400 - i * 60, 0.025, 'square', 0.04, i * 0.035); },
    honk() { tone(420, 0.22, 'square', 0.08); tone(530, 0.22, 'square', 0.06); },
  };
})();

const soundBtn = $('#sound-btn');
const syncSoundBtn = () => soundBtn.classList.toggle('muted', !Sound.enabled);
syncSoundBtn();
soundBtn.addEventListener('click', () => { Sound.toggle(); syncSoundBtn(); });

/* =================================================================
   Toasts + secrets
================================================================= */
function toast(title, msg, icon = '✦') {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = '<span class="t-ico"></span><div><b></b><span></span></div>';
  el.querySelector('.t-ico').textContent = icon;
  el.querySelector('b').textContent = title;
  el.querySelector(':scope > div > span').textContent = msg;
  $('#toasts').appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 500); }, 4000);
}

const SECRETS = [
  ['home', 'Rev master', 'Click the engine'],
  ['about', 'Spark of curiosity', 'Click the glowing core'],
  ['skills', 'Gearhead', 'Click the gears'],
  ['kart', 'Barrel roll', 'Click the go-kart'],
  ['drive', 'Test driver', 'Take the go-kart for a drive'],
  ['robo', 'Beep boop', 'Click RoboRider'],
  ['thesis', 'Stress tester', 'Click the connecting rod'],
  ['education', 'Cap toss', 'Click the graduation cap'],
  ['contact', 'Air mail', 'Click the globe'],
  ['turbo', 'Turbo boost', 'Hold SPACE or the RPM gauge'],
];
let found;
try { found = new Set(JSON.parse(store.get('pp-secrets') || '[]')); } catch { found = new Set(); }
let sceneApi = null;

function renderSecrets() {
  $('#secrets-count').textContent = `${found.size}/${SECRETS.length}`;
  const list = $('#secrets-list');
  list.innerHTML = '';
  SECRETS.forEach(([id, name, hint]) => {
    const li = document.createElement('li');
    const got = found.has(id);
    li.className = got ? 'got' : '';
    li.textContent = got ? name : `??? · ${hint}`;
    list.appendChild(li);
  });
}
renderSecrets();

function unlock(id) {
  if (found.has(id)) return;
  found.add(id);
  store.set('pp-secrets', JSON.stringify([...found]));
  renderSecrets();
  const s = SECRETS.find((x) => x[0] === id);
  toast(`Secret unlocked · ${found.size}/${SECRETS.length}`, s[1], '★');
  Sound.chime();
  const b = $('#secrets-btn');
  b.classList.remove('bump');
  void b.offsetWidth;
  b.classList.add('bump');
  if (found.size === SECRETS.length) {
    setTimeout(() => {
      toast(`All ${SECRETS.length} secrets found!`, "You're officially a curious engineer. Let's talk.", '🏆');
      Sound.fanfare();
      sceneApi?.celebrate();
    }, 900);
  }
}

const secretsBtn = $('#secrets-btn');
secretsBtn.addEventListener('click', () => {
  const panel = $('#secrets-panel');
  panel.hidden = !panel.hidden;
  secretsBtn.setAttribute('aria-expanded', String(!panel.hidden));
});

/* =================================================================
   Ignition gate (press & hold to start)
================================================================= */
const gate = { ready: false, hold: false, p: 0, done: false };
const onIgnite = [];
const igBtn = $('#ignite-btn');
const igRing = $('#ignite-progress');
const loaderPct = $('#loader-pct');
const needle = $('#gate-needle');
const gateRpm = $('#gate-rpm');
const gateState = $('#gate-state');
const RING = 578.1;
const T0 = performance.now();

// Tachometer face: ticks every 250 rpm, numerals every 1000, redline from 7000
const rpmAngle = (rpm) => -120 + (clamp(rpm, 0, 8000) / 8000) * 240;
(function buildTach() {
  const rad = (deg) => (deg * Math.PI) / 180;
  const pt = (deg, r) => [150 + Math.sin(rad(deg)) * r, 150 - Math.cos(rad(deg)) * r];
  let h = '';
  for (let r = 0; r <= 8000; r += 250) {
    const a = rpmAngle(r), major = r % 1000 === 0, red = r >= 7000 ? ' red' : '';
    const [x1, y1] = pt(a, 138), [x2, y2] = pt(a, major ? 124 : 131);
    h += `<line class="tick${major ? ' major' : ''}${red}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" />`;
    if (major) {
      const [tx, ty] = pt(a, 112);
      h += `<text class="num${red}" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}">${r / 1000}</text>`;
    }
  }
  const [rx1, ry1] = pt(rpmAngle(7000), 143), [rx2, ry2] = pt(rpmAngle(8000), 143);
  h += `<path class="redline" d="M${rx1.toFixed(1)} ${ry1.toFixed(1)} A143 143 0 0 1 ${rx2.toFixed(1)} ${ry2.toFixed(1)}" />`;
  h += '<text class="unit" x="150" y="262">×1000 r/min</text>';
  $('#tach-ticks').innerHTML = h;
})();

// System check log
const LOG = [
  ['ECU firmware 2.6', 'OK'],
  ['Crank position sensor', 'OK'],
  ['Cam phase sync', 'LOCKED'],
  ['Fuel pump prime', '3.0 bar'],
  ['Spark plug gap', '0.8 mm'],
  ['Battery', '12.6 V'],
  ['3D scenes compiled', '8 / 8'],
  ['Immobiliser · visitor key', 'ACCEPTED'],
];
const logEl = $('#ecu-log');
let logShown = 0;
function logLine(label, val, cls = '') {
  const li = document.createElement('li');
  li.innerHTML = '<span></span><i></i><b></b>';
  li.children[0].textContent = label;
  li.children[2].textContent = val;
  if (cls) li.children[2].className = cls;
  logEl.appendChild(li);
  return li;
}

// Sensors: [label, unit, min, max, value(p, t), decimals]
const SENS = [
  ['OIL PRESSURE', 'bar', 0, 6, (p, t) => p * 3.1 + (p > 0 ? Math.sin(t * 30) * 0.08 : 0), 1],
  ['COOLANT', '°C', 0, 120, (p) => 24 + p * 6, 0],
  ['BATTERY', 'V', 0, 15, (p) => 12.6 - p * 1.9 + (p > 0 ? Math.random() * 0.2 : 0), 1],
  ['MANIFOLD', 'kPa', 0, 110, (p) => 101 - p * 58, 0],
  ['IGNITION ADV', '°', 0, 40, (p) => 4 + p * 8, 1],
  ['AIR / FUEL', ':1', 8, 20, (p) => (p > 0 ? 12.4 + Math.random() * 0.5 : 14.7), 1],
];
const sensEl = $('#ecu-sensors');
const sensRows = SENS.map(([label]) => {
  const d = document.createElement('div');
  d.className = 'sensor';
  d.innerHTML = '<span></span><em>--</em><i><b></b></i>';
  d.querySelector('span').textContent = label;
  sensEl.appendChild(d);
  return d;
});
function updateSensors(t) {
  SENS.forEach(([, unit, min, max, fn, dec], i) => {
    const row = sensRows[i];
    if (!gate.ready) { row.querySelector('em').textContent = '--'; return; }
    const v = fn(gate.p, t);
    row.querySelector('em').textContent = `${v.toFixed(dec)} ${unit}`;
    row.querySelector('b').style.width = `${clamp((v - min) / (max - min), 0, 1) * 100}%`;
    row.classList.toggle('hot', i === 2 && v < 11.5);
  });
}
function setState(txt, cls = '') {
  gateState.textContent = txt;
  gateState.className = cls;
}

// IST clock
const clockEl = $('#ecu-clock');
const tickClock = () => {
  try { clockEl.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST'; }
  catch { clockEl.textContent = new Date().toLocaleTimeString(); }
};
tickClock();
const clockTimer = setInterval(tickClock, 1000);

let pct = 0;
let sceneReady = false;
const loaderTimer = setInterval(() => {
  pct = Math.min(pct + Math.ceil(Math.random() * 7), sceneReady ? 100 : 92);
  loaderPct.textContent = `${pct}%`;
  while (logShown < LOG.length && pct >= ((logShown + 1) * 100) / (LOG.length + 1)) logLine(...LOG[logShown++]);
  if (pct >= 100) finishBoot();
}, 90);

function setReady() { sceneReady = true; }
function finishBoot() {
  if (gate.ready) return;
  while (logShown < LOG.length) logLine(...LOG[logShown++]);
  gate.ready = true;
  window.__ppReady = true;
  clearInterval(loaderTimer);
  loaderPct.textContent = 'HOLD';
  igBtn.disabled = false;
  igBtn.classList.add('ready');
  igBtn.querySelector('.ig-label').textContent = 'START';
  logLine('STATUS', 'READY · HOLD START', 'warn');
  setState('READY');
}
setTimeout(setReady, 7000); // safety net

function holdStart(e) {
  if (!gate.ready || gate.done) return;
  e?.preventDefault?.();
  gate.hold = true;
  if (e?.pointerId !== undefined) { try { igBtn.setPointerCapture(e.pointerId); } catch { /* not capturable */ } }
  igBtn.classList.add('holding');
  Sound.init();
}
function holdEnd() {
  gate.hold = false;
  igBtn.classList.remove('holding');
}
igBtn.addEventListener('pointerdown', holdStart);
window.addEventListener('pointerup', holdEnd);
window.addEventListener('pointercancel', holdEnd);
$('#skip-intro').addEventListener('click', () => { if (!gate.ready) { setReady(); finishBoot(); } ignite(true); });

function ignite(skipped = false) {
  if (gate.done) return;
  gate.done = true;
  holdEnd();
  clearInterval(clockTimer);
  needle.style.transform = `rotate(${rpmAngle(6500)}deg)`;
  gateRpm.textContent = '6500';
  setState('RUNNING', 'run');
  logLine('IGNITION', 'RUNNING');
  $('#loader').classList.add('done');
  document.body.classList.remove('locked');
  if (!skipped) {
    Sound.tone(70, 0.7, 'sawtooth', 0.12, 0, 160);
    Sound.whoosh(0.9, 200, 2500, 0.14);
  }
  onIgnite.forEach((f) => f(skipped));
  setTimeout(() => toast('Welcome aboard', `Click the 3D models to uncover ${SECRETS.length} hidden secrets`, '✦'), 1800);
}

(function gateLoop(last = performance.now()) {
  if (gate.done) return;
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.25);
  gate.p = clamp(gate.p + (gate.hold ? dt / (reduceMotion ? 0.35 : 1.3) : -dt * 1.6), 0, 1);
  igRing.style.strokeDashoffset = RING * (1 - gate.p);
  const ts = (now - T0) / 1000;
  // gauge self-test sweep while booting, then cranking rpm while held
  const shown = !gate.ready
    ? (ts < 1.8 ? Math.sin((ts / 1.8) * Math.PI) * 8000 : 0)
    : (gate.p > 0 ? 180 + gate.p * 2700 + (gate.hold ? Math.random() * 260 : 0) : 0);
  needle.style.transform = `rotate(${rpmAngle(shown)}deg)`;
  gateRpm.textContent = gate.ready ? Math.round(shown / 10) * 10 : '----';
  if (gate.ready) setState(gate.hold ? 'CRANKING' : gate.p > 0.02 ? 'SPINNING DOWN' : 'READY', gate.hold ? 'crank' : '');
  updateSensors(ts);
  igBtn.style.transform = gate.hold && !reduceMotion
    ? `translate(${(Math.random() - 0.5) * 4 * gate.p}px, ${(Math.random() - 0.5) * 4 * gate.p}px)` : '';
  Sound.setRpm(300 + gate.p * 2800 + (gate.hold ? Math.random() * 300 : 0), gate.p > 0.02);
  if (gate.p >= 1) { ignite(); return; }
  requestAnimationFrame(() => gateLoop(now));
})();

/* =================================================================
   Page UI (works without WebGL too)
================================================================= */
$('#year').textContent = new Date().getFullYear();
if (!finePointer) {
  const h = $('.hero-card .hint');
  if (h) h.innerHTML = '&#10022; Psst: tap any 3D model, and 10 secrets are hidden here. Hold the RPM gauge for turbo.';
}

const dotsNav = $('#dots');
const dots = sections.map((s) => {
  const b = document.createElement('button');
  b.dataset.label = s.dataset.label;
  b.setAttribute('aria-label', s.dataset.label);
  b.addEventListener('click', () => s.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }));
  dotsNav.appendChild(b);
  return b;
});
const topLinks = [...document.querySelectorAll('.toplinks a')];

const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
  { threshold: 0.15 }
);
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Typing effect
const roles = ['Mechanical Engineer', 'Automotive Designer', 'CAD · FEA Enthusiast', 'EV Go-Kart Design Lead', 'Python Learner'];
(function typeLoop(i = 0, j = 0, del = false) {
  const el = $('#typed');
  const word = roles[i % roles.length];
  el.textContent = word.slice(0, j);
  let next = del ? j - 1 : j + 1;
  let delay = del ? 35 : 75;
  if (!del && j === word.length) { del = true; next = j; delay = 1600; }
  else if (del && j === 0) { del = false; i++; next = 0; delay = 300; }
  setTimeout(() => typeLoop(i, next, del), delay);
})();

// Name letters: scatter away from the cursor, jump when clicked
const letters = [];
(function splitName() {
  const h = $('.hero-name');
  const stops = [new THREE.Color(0x22d3ee), new THREE.Color(0xa78bfa), new THREE.Color(0xf472b6)];
  h.setAttribute('aria-label', 'Priyabrata Parida');
  h.innerHTML = '';
  ['Priyabrata', 'Parida'].forEach((word, wi) => {
    const line = document.createElement('span');
    line.className = 'line';
    line.setAttribute('aria-hidden', 'true');
    [...word].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = ch;
      if (wi === 1) {
        const k = i / (word.length - 1) * 2;
        const c = stops[Math.floor(k)].clone().lerp(stops[Math.min(Math.floor(k) + 1, 2)], k % 1);
        s.style.color = `#${c.getHexString()}`;
      }
      s.addEventListener('click', () => {
        s.classList.remove('jump');
        void s.offsetWidth;
        s.classList.add('jump');
        Sound.tone(500 + Math.random() * 600, 0.12, 'triangle', 0.08);
      });
      s.addEventListener('animationend', () => s.classList.remove('jump'));
      line.appendChild(s);
      letters.push(s);
    });
    h.appendChild(line);
  });
})();

// Cursor glow, card spotlight, letter scatter
const glow = $('#cursor-glow');
const glowPos = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2 };
if (finePointer) document.body.classList.add('has-pointer');
window.addEventListener('pointermove', (e) => {
  glowPos.tx = e.clientX;
  glowPos.ty = e.clientY;
  const card = e.target.closest?.('.card');
  if (card) {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }
  if (finePointer && !reduceMotion && window.scrollY < innerHeight) {
    letters.forEach((s) => {
      const r = s.getBoundingClientRect();
      const dx = r.left + r.width / 2 - e.clientX, dy = r.top + r.height / 2 - e.clientY;
      const d = Math.hypot(dx, dy);
      if (d < 130) {
        const f = (1 - d / 130) * 26;
        s.style.transform = `translate(${(dx / d) * f}px, ${(dy / d) * f}px) rotate(${(dx / d) * f * 0.6}deg)`;
      } else if (s.style.transform) s.style.transform = '';
    });
  }
});
(function glowLoop() {
  glowPos.x += (glowPos.tx - glowPos.x) * 0.15;
  glowPos.y += (glowPos.ty - glowPos.y) * 0.15;
  glow.style.transform = `translate(${glowPos.x}px, ${glowPos.y}px)`;
  requestAnimationFrame(glowLoop);
})();

// Contact form -> opens the visitor's mail app with the message pre-filled
$('#contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const subject = encodeURIComponent(`Portfolio enquiry from ${f.get('name')}`);
  const body = encodeURIComponent(`${f.get('message')}\n\n— ${f.get('name')} (${f.get('email')})`);
  window.location.href = `mailto:priyabrata683@gmail.com?subject=${subject}&body=${body}`;
});

/* ---------------- Input: turbo + drive ---------------- */
const input = { turbo: false, keys: { up: false, down: false, left: false, right: false } };
const drive = { on: false };
const keyMap = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
const typing = (e) => e.target.closest?.('input, textarea, select');

function setDrive(on) {
  if (drive.on === on) return;
  drive.on = on;
  document.body.classList.toggle('driving', on);
  $('#drive-btn span').textContent = on ? 'Park the kart' : 'Take the wheel';
  $('#drive-pad').hidden = !on;
  Object.keys(input.keys).forEach((k) => (input.keys[k] = false));
  if (on) {
    Sound.init();
    $('#kart').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    toast('Drive mode', finePointer ? 'W A S D or arrow keys to drive · Esc to park' : 'Use the arrow pad to drive', '➜');
  }
}
$('#drive-btn').addEventListener('click', () => setDrive(!drive.on));
document.querySelectorAll('#drive-pad button').forEach((b) => {
  const k = b.dataset.k;
  const on = (e) => { e.preventDefault(); input.keys[k] = true; b.classList.add('on'); };
  const off = () => { input.keys[k] = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, off));
});

window.addEventListener('keydown', (e) => {
  if (typing(e)) return;
  if (!gate.done) {
    if (e.code === 'Space' || e.code === 'Enter') holdStart(e);
    return;
  }
  if (drive.on && keyMap[e.code]) { input.keys[keyMap[e.code]] = true; e.preventDefault(); return; }
  if (e.code === 'Escape' && drive.on) { setDrive(false); return; }
  if (e.code === 'Space' && !drive.on) { input.turbo = true; e.preventDefault(); Sound.init(); }
});
window.addEventListener('keyup', (e) => {
  if (!gate.done) { if (e.code === 'Space' || e.code === 'Enter') holdEnd(); return; }
  if (keyMap[e.code]) input.keys[keyMap[e.code]] = false;
  if (e.code === 'Space') input.turbo = false;
});
const turboBtn = $('#turbo-btn');
turboBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); input.turbo = true; Sound.init(); });
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => turboBtn.addEventListener(ev, () => (input.turbo = false)));
turboBtn.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('blur', () => { input.turbo = false; Object.keys(input.keys).forEach((k) => (input.keys[k] = false)); });

/* ---------------- Scroll state ---------------- */
let scrollY = window.scrollY;
let lastScrollY = scrollY;
let scrollVel = 0;
let activeIndex = -1;
let centers = [];
function measure() { centers = sections.map((s) => s.offsetTop + s.offsetHeight / 2); }
function sectionProgress() {
  const mid = scrollY + window.innerHeight / 2;
  if (mid <= centers[0]) return 0;
  for (let i = 0; i < centers.length - 1; i++) {
    if (mid < centers[i + 1]) return i + (mid - centers[i]) / (centers[i + 1] - centers[i]);
  }
  return centers.length - 1;
}
window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

function updateUI(p) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  $('#progress-bar').style.width = `${(scrollY / Math.max(max, 1)) * 100}%`;
  const idx = Math.round(p);
  if (idx !== activeIndex) {
    activeIndex = idx;
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    const id = sections[idx].id;
    topLinks.forEach((a) => {
      const target = a.getAttribute('href').slice(1);
      a.classList.toggle('active', target === id || (target === 'kart' && ['kart', 'robo', 'thesis'].includes(id)));
    });
  }
}

const rpmFill = $('#rpm-fill');
const rpmNeedle = $('#rpm-needle');
const rpmVal = $('#rpm-val');
function updateGauge(rpm) {
  const t = clamp((rpm - 800) / 7200, 0, 1);
  rpmFill.style.strokeDashoffset = 157 * (1 - t);
  rpmFill.style.stroke = t > 0.75 ? '#f472b6' : t > 0.45 ? '#fbbf24' : '#22d3ee';
  rpmNeedle.style.transform = `rotate(${-90 + t * 180}deg)`;
  rpmVal.textContent = Math.round(Math.min(rpm, 8000) / 10) * 10;
}

/* =================================================================
   WebGL
================================================================= */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('#webgl'), antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (err) {
  document.body.classList.add('no-webgl');
}

if (!renderer) {
  LOG[6] = ['3D renderer', 'TEXT MODE', 'warn'];
  measure();
  setReady();
  onIgnite.push(() => Sound.setRpm(0, false));
  const uiOnly = () => { updateUI(sectionProgress()); requestAnimationFrame(uiOnly); };
  uiOnly();
}
// the scene is started at the end of this file, once every class and constant below is defined

function initScene() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060f, 0.026);
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 34);

  scene.add(new THREE.HemisphereLight(0x9ecbff, 0x1a1033, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(5, 8, 10);
  scene.add(key);
  const cyanLight = new THREE.PointLight(0x22d3ee, 40, 30, 1.6);
  const pinkLight = new THREE.PointLight(0xf472b6, 30, 30, 1.6);
  scene.add(cyanLight, pinkLight);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(makeEnvScene(), 0.04).texture;

  const M = {
    steel: new THREE.MeshStandardMaterial({ color: 0xc7d2e0, metalness: 1, roughness: 0.28 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.9, roughness: 0.35 }),
    cyan: new THREE.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.5, roughness: 0.25, emissive: 0x0891b2, emissiveIntensity: 0.6 }),
    violet: new THREE.MeshStandardMaterial({ color: 0xa78bfa, metalness: 0.6, roughness: 0.3, emissive: 0x6d28d9, emissiveIntensity: 0.35 }),
    pink: new THREE.MeshStandardMaterial({ color: 0xf472b6, metalness: 0.4, roughness: 0.35, emissive: 0xdb2777, emissiveIntensity: 0.4 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x111318, metalness: 0, roughness: 0.85 }),
    red: new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.3, roughness: 0.4 }),
    amber: new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.3, roughness: 0.4 }),
    green: new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.2, roughness: 0.4, emissive: 0x16a34a, emissiveIntensity: 0.8 }),
    pcb: new THREE.MeshStandardMaterial({ color: 0x0f766e, metalness: 0.2, roughness: 0.6 }),
    arduino: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.2, roughness: 0.5 }),
    chip: new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.4, roughness: 0.5 }),
    navy: new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.2, roughness: 0.7, side: THREE.DoubleSide }),
    gold: new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 1, roughness: 0.3, emissive: 0xb45309, emissiveIntensity: 0.3 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x67e8f9, metalness: 0, roughness: 0.05, transmission: 0.9, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
    wire: new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.25 }),
    flame: new THREE.MeshBasicMaterial({ color: 0xff8a1c, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
  };

  const totalDepth = (sections.length - 1) * SPACING;
  const stars = makeStars(3500, totalDepth);
  scene.add(stars.points);
  const grid = new THREE.GridHelper(260, 130, 0x22d3ee, 0x22d3ee);
  grid.material.transparent = true;
  grid.material.opacity = 0.06;
  grid.rotation.x = Math.PI / 2;
  grid.position.set(0, -totalDepth / 2, -18);
  scene.add(grid);

  const sparks = new Sparks(1400);
  scene.add(sparks.points);

  let boost = 0;
  const ctx = { sparks, input, drive, unlock, addBoost: (n) => (boost = Math.min(boost + n, 7200)) };

  const builders = {
    home: buildEngine, about: buildCore, skills: buildGears, kart: buildKart,
    robo: buildRobo, thesis: buildRod, education: buildCap, contact: buildGlobe,
  };
  const stages = sections.map((s, i) => {
    const holder = new THREE.Group();
    const built = builders[s.id](M, ctx);
    built.group.userData.baseY = built.group.position.y;
    holder.add(built.group);
    holder.userData = {
      id: s.id, side: s.dataset.side === 'left' ? 1 : -1, baseY: -i * SPACING,
      update: built.update, poke: built.poke, hint: built.hint, focus: 0, pop: 0,
    };
    scene.add(holder);
    return holder;
  });
  const kartIndex = sections.findIndex((s) => s.id === 'kart');

  /* ----- Layout ----- */
  let mobile = false;
  let baseFov = 45;
  function layout() {
    measure();
    const w = window.innerWidth, h = window.innerHeight;
    mobile = w < 820;
    camera.aspect = w / h;
    baseFov = mobile ? 55 : 45;
    renderer.setSize(w, h);
    const halfW = Math.tan(THREE.MathUtils.degToRad(baseFov / 2)) * 12 * camera.aspect;
    stages.forEach((st) => {
      const { side, baseY } = st.userData;
      if (mobile) {
        st.position.set(0, baseY + 4.4, -1.5);
        st.scale.setScalar(0.62);
      } else {
        st.position.set(side * Math.min(halfW * 0.48, 5.2), baseY, 0);
        st.scale.setScalar(Math.min(1, halfW / 9.5) + 0.05);
      }
    });
  }
  layout();
  window.addEventListener('resize', layout);

  /* ----- Pointer: parallax, drag-to-rotate, hover hints, clicks ----- */
  const pointer = new THREE.Vector2(0, 0);
  const drag = { active: false, x: 0, spin: 0, vel: 0 };
  const down = { x: 0, y: 0, t: 0, valid: false };
  const raycaster = new THREE.Raycaster();
  raycaster.camera = camera;
  raycaster.params.Points.threshold = 0.05;
  const tip = $('#hint-tip');
  const uiTarget = (el) => el.closest?.('.card, a, button, input, textarea, nav, header, .hud, #loader');
  let hovered = null;

  function setPointer(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }
  function pick() {
    raycaster.setFromCamera(pointer, camera);
    for (const st of stages) {
      if (!st.visible || st.userData.focus < 0.45) continue;
      const hit = raycaster.intersectObject(st, true).find((h) => h.object.visible && !h.object.userData.noPick);
      if (hit) return { st, hit };
    }
    return null;
  }
  window.addEventListener('pointermove', (e) => {
    setPointer(e);
    if (drag.active) {
      drag.vel = (e.clientX - drag.x) * 0.01;
      drag.spin += drag.vel;
      drag.x = e.clientX;
    }
    if (!finePointer || !gate.done) return;
    const r = uiTarget(e.target) ? null : pick();
    hovered = r?.st || null;
    document.body.style.cursor = hovered ? 'pointer' : '';
    if (hovered) {
      tip.textContent = hovered.userData.hint;
      tip.style.left = `${e.clientX}px`;
      tip.style.top = `${e.clientY}px`;
    }
    tip.classList.toggle('show', !!hovered);
  });
  window.addEventListener('pointerdown', (e) => {
    down.valid = !uiTarget(e.target);
    if (!down.valid) return;
    setPointer(e);
    Object.assign(down, { x: e.clientX, y: e.clientY, t: performance.now() });
    drag.active = true;
    drag.x = e.clientX;
  });
  window.addEventListener('pointerup', (e) => {
    drag.active = false;
    if (!down.valid || !gate.done) return;
    down.valid = false;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8 || performance.now() - down.t > 600) return;
    setPointer(e);
    const r = pick();
    if (!r) return;
    Sound.init();
    r.st.userData.pop = 1;
    const secret = r.st.userData.poke?.(r.hit.point);
    if (secret) unlock(secret);
  });

  /* ----- Celebration + ignition hooks ----- */
  const tmp = new THREE.Vector3();
  const confetti = ['#22d3ee', '#a78bfa', '#f472b6', '#fbbf24', '#4ade80', '#ffffff'];
  sceneApi = {
    celebrate() {
      for (let k = 0; k < 7; k++) {
        setTimeout(() => {
          tmp.set((Math.random() - 0.5) * 10, camera.position.y + (Math.random() - 0.2) * 5, camera.position.z - 9);
          sparks.burst(tmp, confetti, 160, 7);
        }, k * 180);
      }
    },
  };
  let camZ = 34;
  let camZTarget = 34;
  let warp = 3;
  onIgnite.push((skipped) => {
    camZTarget = 12;
    warp = skipped ? 12 : 55;
    if (!skipped) {
      boost = 6500;
      stages[0].userData.poke?.(null, true);
    }
  });

  /* ----- Loop ----- */
  const clock = new THREE.Clock();
  let camY = -sectionProgress() * SPACING;
  let turboAmt = 0;
  let turboHeld = 0;
  let firstFrame = true;
  const speedlines = $('#speedlines');

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // RPM: scroll speed + clicks + turbo (+ cranking during the intro)
    const v = Math.abs(scrollY - lastScrollY) / Math.max(dt, 0.001);
    lastScrollY = scrollY;
    scrollVel += (v - scrollVel) * 0.08;
    boost *= Math.exp(-1.6 * dt);
    const turboOn = input.turbo && gate.done;
    turboAmt = damp(turboAmt, turboOn ? 1 : 0, turboOn ? 3 : 5, dt);
    if (turboOn) {
      if (turboHeld === 0) Sound.whoosh(1.2, 200, 4000, 0.16);
      turboHeld += dt;
      if (turboHeld > 1) unlock('turbo');
    } else turboHeld = 0;
    document.body.classList.toggle('turbo', turboAmt > 0.3);
    speedlines.style.opacity = (turboAmt * 0.55).toFixed(3);

    let rpm = gate.done
      ? Math.min(800 + scrollVel * 3.2 + boost + turboAmt * 7000, 8600)
      : 300 + gate.p * 2800;
    updateGauge(rpm);
    if (gate.done) Sound.setRpm(rpm, true);
    const crankSpeed = reduceMotion ? 0.4 : rpm / 400;

    // Camera
    const p = sectionProgress();
    updateUI(p);
    camY = damp(camY, -p * SPACING, 5, dt);
    camZ = damp(camZ, camZTarget, gate.done ? 2.2 : 1, dt);
    warp = damp(warp, gate.done ? 0.6 : 3 + gate.p * 20, 1.5, dt);
    const shake = (turboAmt * 0.07 + (gate.done ? 0 : gate.p * 0.08)) * (reduceMotion ? 0 : 1);
    camera.position.x = damp(camera.position.x, pointer.x * 0.8, 2.5, dt) + (Math.random() - 0.5) * shake;
    camera.position.y = camY + pointer.y * 0.5 + (Math.random() - 0.5) * shake;
    camera.position.z = camZ;
    const fov = baseFov + turboAmt * 22;
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.lookAt(0, camY, 0);
    cyanLight.position.set(-6, camY + 4, 6);
    pinkLight.position.set(6, camY - 4, 4);

    stars.update(dt, warp + turboAmt * 70, camY);
    stars.points.material.size = 0.09 + turboAmt * 0.12;
    sparks.update(dt);

    if (!drag.active) { drag.vel *= 0.95; drag.spin += drag.vel; }
    if (drive.on && Math.abs(p - kartIndex) > 0.6) setDrive(false);

    stages.forEach((st, i) => {
      const dist = Math.abs(camY - st.userData.baseY) / SPACING;
      st.visible = dist < 1.6;
      st.userData.focus = clamp(1 - dist, 0, 1);
      if (!st.visible) return;
      const focus = st.userData.focus;
      const inner = st.children[0];
      inner.position.y = inner.userData.baseY + Math.sin(t * 0.8 + i) * 0.15;
      inner.rotation.y = (i === Math.round(p) ? drag.spin : 0) * focus + (1 - focus) * st.userData.side * 0.6;
      // springy "pop" when clicked
      const pop = st.userData.pop;
      if (pop > 0) {
        st.userData.pop = Math.max(pop - dt * 1.6, 0);
        inner.scale.setScalar(1 + Math.sin((1 - pop) * Math.PI * 3) * pop * 0.09);
      } else if (inner.scale.x !== 1) inner.scale.setScalar(1);
      st.userData.update?.(t, dt, { crankSpeed, focus, mobile });
    });

    renderer.render(scene, camera);
    if (firstFrame) { firstFrame = false; setReady(); }
    requestAnimationFrame(tick);
  }
  tick();
}

/* =================================================================
   Builders — each returns { group, update, poke, hint }
   poke(point) returns the id of the secret it unlocks (or null)
================================================================= */
const v3 = new THREE.Vector3();
const FIRE = ['#ffb347', '#ff7a18', '#fde68a', '#ffffff'];
const COOL = ['#22d3ee', '#a78bfa', '#ffffff'];

// 01 · HERO — working slider-crank engine
function buildEngine(M, ctx) {
  const group = new THREE.Group();
  const rig = new THREE.Group();
  rig.position.y = -2.2;
  group.add(rig);
  const r = 0.8, L = 2.6;

  const crank = new THREE.Group();
  rig.add(crank);
  const webGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.22, 64).rotateX(Math.PI / 2);
  [-0.38, 0.38].forEach((z) => {
    const w = new THREE.Mesh(webGeo, M.steel);
    w.position.z = z;
    crank.add(w);
    const cw = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.24, 48, 1, false, Math.PI * 0.25, Math.PI * 1.5), M.darkSteel);
    cw.rotation.x = Math.PI / 2;
    cw.position.set(0, -0.35, z);
    crank.add(cw);
  });
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 1.0, 24), M.cyan);
  pin.rotation.x = Math.PI / 2;
  pin.position.y = r;
  crank.add(pin);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 3.2, 32), M.steel);
  shaft.rotation.x = Math.PI / 2;
  rig.add(shaft);
  const fly = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.08, 16, 96), M.violet);
  fly.position.z = -1.5;
  crank.add(fly);

  const rod = new THREE.Group();
  rig.add(rod);
  const big = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.12, 16, 40), M.steel);
  const small = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.09, 16, 32), M.steel);
  small.position.y = L;
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.2, L - 0.6, 0.16), M.steel);
  beam.position.y = L / 2;
  const flangeGeo = new THREE.BoxGeometry(0.06, L - 0.75, 0.3);
  [-0.12, 0.12].forEach((x) => {
    const f = new THREE.Mesh(flangeGeo, M.steel);
    f.position.set(x, L / 2, 0);
    rod.add(f);
  });
  rod.add(big, small, beam);

  const piston = new THREE.Group();
  rig.add(piston);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.95, 48), M.steel);
  crown.position.y = 0.3;
  piston.add(crown);
  for (let k = 0; k < 3; k++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.585, 0.025, 8, 48), k === 0 ? M.pink : M.darkSteel);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.62 - k * 0.12;
    piston.add(ring);
  }
  const gudgeon = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.0, 16), M.cyan);
  gudgeon.rotation.x = Math.PI / 2;
  piston.add(gudgeon);

  const liner = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 2.8, 48, 1, true), M.glass);
  liner.position.y = L + 0.55;
  rig.add(liner);
  const linerWire = new THREE.Mesh(new THREE.CylinderGeometry(0.67, 0.67, 2.8, 24, 6, true), M.wire);
  linerWire.position.copy(liner.position);
  rig.add(linerWire);
  const flame = new THREE.PointLight(0xff7a18, 0, 6, 2);
  flame.position.y = L + r + 1.4;
  rig.add(flame);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.25, 48), M.darkSteel);
  head.position.y = L + 2.05;
  rig.add(head);
  const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.45, 12), M.amber);
  plug.position.y = L + 2.35;
  rig.add(plug);
  // exhaust pipe
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.1, 16), M.darkSteel);
  exhaust.rotation.z = Math.PI / 2.6;
  exhaust.position.set(-1.05, L + 1.75, 0);
  rig.add(exhaust);
  const exhaustTip = new THREE.Object3D();
  exhaustTip.position.set(-1.55, L + 1.95, 0);
  rig.add(exhaustTip);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.015, 8, 160), M.cyan);
  halo.rotation.x = Math.PI / 2.3;
  const halo2 = new THREE.Mesh(new THREE.TorusGeometry(3.8, 0.01, 8, 160), M.violet);
  halo2.rotation.set(Math.PI / 1.8, 0.4, 0);
  halo.userData.noPick = halo2.userData.noPick = true;
  group.add(halo, halo2);

  group.rotation.x = 0.15;
  let theta = 0;
  let kick = 0;
  let lastFire = 0;
  return {
    group,
    hint: 'Click to rev it',
    poke() {
      ctx.addBoost(5500);
      kick = 1;
      plug.getWorldPosition(v3);
      ctx.sparks.burst(v3, FIRE, 90, 5);
      return 'home';
    },
    update(t, dt, { crankSpeed }) {
      theta += crankSpeed * dt;
      crank.rotation.z = -theta;
      const px = r * Math.sin(theta), py = r * Math.cos(theta);
      const yp = py + Math.sqrt(L * L - px * px);
      rod.position.set(px, py, 0);
      rod.rotation.z = Math.atan2(px, yp - py);
      piston.position.y = yp;
      const tdc = Math.cos(theta);
      kick = Math.max(kick - dt * 0.8, 0);
      flame.intensity = tdc > 0.92 ? (tdc - 0.92) * (400 + kick * 2500) : flame.intensity * 0.85;
      // exhaust pops at high revs
      if (crankSpeed > 9 && t - lastFire > 0.12 && Math.random() < 0.5) {
        lastFire = t;
        exhaustTip.getWorldPosition(v3);
        ctx.sparks.burst(v3, FIRE, 10, 2.5);
      }
      halo.rotation.z = t * 0.2;
      halo2.rotation.z = -t * 0.15;
    },
  };
}

// 02 · ABOUT — "engineer meets code" core
function buildCore(M, ctx) {
  const group = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(2.1, 1), M.wire);
  const core = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 0), M.steel);
  const inner = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), M.pink);
  group.add(shell, core, inner);
  const orbits = [];
  [[0.3, 0], [1.2, 0.8], [-0.9, 1.9]].forEach(([rx, rz], i) => {
    const pivot = new THREE.Group();
    pivot.rotation.set(rx, 0, rz);
    const mat = [M.cyan, M.violet, M.amber][i];
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.7 + i * 0.25, 0.012, 8, 160), mat);
    ring.rotation.x = Math.PI / 2;
    ring.userData.noPick = true;
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), mat);
    pivot.add(ring, e);
    group.add(pivot);
    orbits.push({ e, r: 2.7 + i * 0.25, s: 0.8 + i * 0.35, a: i });
  });
  const tag = makeLabel('{ mech + code }', { color: '#a5f3fc', size: 44 });
  tag.position.set(0, -3.1, 0);
  tag.scale.multiplyScalar(0.9);
  group.add(tag);
  let kick = 0;
  return {
    group,
    hint: 'Click to energise',
    poke() {
      kick = 1;
      core.getWorldPosition(v3);
      ctx.sparks.burst(v3, COOL, 160, 7);
      Sound.tone(180, 0.5, 'sine', 0.18, 0, 1200);
      return 'about';
    },
    update(t, dt) {
      kick = Math.max(kick - dt * 0.6, 0);
      const k = kick * kick;
      shell.scale.setScalar(1 + k * 0.7);
      shell.rotation.y += dt * (0.15 + k * 4);
      shell.rotation.x = t * 0.1;
      core.rotation.y -= dt * (0.4 + k * 8);
      core.rotation.z = t * 0.2;
      inner.rotation.y = t * 1.5;
      inner.scale.setScalar(1 + k * 1.5);
      orbits.forEach((o) => {
        o.a += dt * o.s * (1 + k * 8);
        o.e.position.set(Math.cos(o.a) * o.r, 0, Math.sin(o.a) * o.r);
      });
    },
  };
}

// 03 · SKILLS — meshing gears with orbiting skill labels
function buildGears(M, ctx) {
  const group = new THREE.Group();
  const big = new THREE.Mesh(gearGeometry(18, 1.3, 1.6, 0.35), M.steel);
  const smallG = new THREE.Mesh(gearGeometry(12, 0.82, 1.12, 0.3), M.cyan);
  const tiny = new THREE.Mesh(gearGeometry(9, 0.55, 0.82, 0.25), M.violet);
  big.position.set(-0.9, 0.3, 0);
  smallG.position.set(-0.9 + 2.42, 0.3 + 0.35, 0);
  tiny.position.set(-0.9 - 0.4, 0.3 - 2.22, 0);
  group.add(big, smallG, tiny);

  const skills = ['AutoCAD', 'ANSYS', 'PTC Creo', 'Fusion 360', 'Python', 'Automotive'];
  const labels = skills.map((s, i) => {
    const l = makeLabel(s, { color: i % 2 ? '#ddd6fe' : '#a5f3fc', size: 46 });
    group.add(l);
    return l;
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.01, 8, 200), M.cyan);
  ring.rotation.x = Math.PI / 2 - 0.35;
  ring.userData.noPick = true;
  group.add(ring);
  group.rotation.x = 0.1;
  let a = 0, la = 0, spin = 0;
  return {
    group,
    hint: 'Click to spin them up',
    poke(point) {
      spin = 14;
      ctx.sparks.burst(point || big.getWorldPosition(v3), ['#fbbf24', '#fde68a', '#ffffff'], 70, 5);
      Sound.ratchet();
      return 'skills';
    },
    update(t, dt, { crankSpeed }) {
      spin = damp(spin, 0, 1.2, dt);
      a += dt * (0.4 + crankSpeed * 0.1 + spin);
      la += dt * (0.25 + spin * 0.15);
      big.rotation.z = a;
      smallG.rotation.z = -a * (18 / 12) + 0.13;
      tiny.rotation.z = -a * (18 / 9) + 0.2;
      labels.forEach((l, i) => {
        const ang = la + (i / labels.length) * Math.PI * 2;
        l.position.set(Math.cos(ang) * 3.6, Math.sin(ang) * 3.6 * Math.sin(0.35), Math.sin(ang) * 3.6 * Math.cos(0.35));
        l.material.opacity = 0.55 + 0.45 * ((Math.sin(ang) + 1) / 2);
      });
    },
  };
}

// 04 · ELECTRIC GO-KART — click for a barrel roll, or take the wheel
function buildKart(M, ctx) {
  const group = new THREE.Group();
  const kart = new THREE.Group();
  kart.rotation.order = 'YXZ';
  group.add(kart);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const fr = 0.045;
  [1, -1].forEach((s) => {
    const pts = [V(-1.45, 0.32, 0.72 * s), V(-0.2, 0.3, 0.75 * s), V(0.9, 0.3, 0.55 * s), V(1.55, 0.36, 0.38 * s)];
    for (let i = 0; i < pts.length - 1; i++) kart.add(tube(pts[i], pts[i + 1], fr, M.cyan));
    kart.add(tube(V(1.55, 0.36, 0.38 * s), V(1.75, 0.3, 0.2 * s), fr, M.cyan));
    kart.add(tube(V(-1.45, 0.32, 0.72 * s), V(-1.62, 0.4, 0.4 * s), fr, M.cyan));
  });
  kart.add(tube(V(1.75, 0.3, 0.2), V(1.75, 0.3, -0.2), fr, M.cyan));
  kart.add(tube(V(-1.62, 0.4, 0.4), V(-1.62, 0.4, -0.4), fr, M.cyan));
  [-1.45, -0.2, 0.9].forEach((x, i) => {
    const z = [0.72, 0.75, 0.55][i];
    kart.add(tube(V(x, 0.31, z), V(x, 0.31, -z), fr, M.cyan));
  });
  const tray = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.02, 1.1), M.darkSteel);
  tray.position.set(-0.1, 0.28, 0);
  kart.add(tray);
  kart.add(tube(V(-1.2, 0.36, -0.95), V(-1.2, 0.36, 0.95), 0.05, M.steel));
  kart.add(tube(V(1.2, 0.33, -0.85), V(1.2, 0.33, 0.85), 0.04, M.steel));

  const wheels = [];
  function wheel(x, z, r, w) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 32).rotateX(Math.PI / 2), M.rubber));
    g.add(new THREE.Mesh(new THREE.TorusGeometry(r - 0.02, 0.035, 8, 32), M.rubber));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, w + 0.02, 24).rotateX(Math.PI / 2), M.steel));
    for (let k = 0; k < 5; k++) {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(r * 1.1, 0.04, 0.02), M.pink);
      sp.rotation.z = (k / 5) * Math.PI;
      sp.position.z = (w / 2 + 0.012) * Math.sign(z);
      g.add(sp);
    }
    g.position.set(x, r, z);
    kart.add(g);
    wheels.push(g);
  }
  wheel(-1.2, 0.98, 0.38, 0.34);
  wheel(-1.2, -0.98, 0.38, 0.34);
  wheel(1.2, 0.88, 0.32, 0.26);
  wheel(1.2, -0.88, 0.32, 0.26);

  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.62), M.red);
  seatBase.position.set(-0.55, 0.45, 0);
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.6), M.red);
  seatBack.position.set(-0.92, 0.75, 0);
  seatBack.rotation.z = 0.35;
  kart.add(seatBase, seatBack);
  kart.add(tube(V(0.95, 0.32, 0), V(0.45, 0.85, 0), 0.03, M.steel));
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 10, 32), M.rubber);
  sw.position.set(0.45, 0.86, 0);
  sw.rotation.y = Math.PI / 2;
  sw.rotateX(0.7);
  kart.add(sw);
  [0.62, -0.62].forEach((z) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.2, 0.22), M.green);
    b.position.set(-0.3, 0.4, z);
    kart.add(b);
  });
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.34, 24).rotateX(Math.PI / 2), M.amber);
  motor.position.set(-1.25, 0.6, 0.45);
  kart.add(motor);
  const controller = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.3), M.darkSteel);
  controller.position.set(-1.25, 0.42, -0.35);
  kart.add(controller);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.9), M.violet);
  nose.position.set(1.45, 0.45, 0);
  nose.rotation.z = -0.25;
  kart.add(nose);
  const plate = makeLabel('#19', { color: '#fff', size: 64, bg: 'rgba(225,29,72,.9)' });
  plate.position.set(1.72, 0.62, 0);
  plate.scale.multiplyScalar(0.45);
  kart.add(plate);
  // nitro flames
  const flames = [0.22, -0.22].map((z) => {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.7, 12), M.flame);
    f.rotation.z = Math.PI / 2;
    f.position.set(-1.95, 0.5, z);
    f.userData.noPick = true;
    kart.add(f);
    return f;
  });

  const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.06, 64), new THREE.MeshStandardMaterial({ color: 0x0b1224, metalness: 0.8, roughness: 0.4 }));
  disc.position.y = -0.03;
  const discRing = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.02, 8, 128), M.cyan);
  discRing.rotation.x = Math.PI / 2;
  group.add(disc, discRing);
  const lbl = makeLabel('GKDC 2019 · EV', { color: '#a5f3fc', size: 40 });
  lbl.position.set(0, 2.2, 0);
  group.add(lbl);

  kart.scale.setScalar(1.35);
  group.position.y = -0.9;
  group.rotation.x = 0.25;

  const car = { v: 0, h: 0, steer: 0, dist: 0 };
  const jump = { y: 0, vy: 0, roll: 0, rs: 0, nitro: 0 };
  let nitro = 0;
  const DUST = ['#94a3b8', '#cbd5e1', '#ffffff'];
  return {
    group,
    hint: 'Click for a barrel roll',
    poke() {
      if (ctx.drive.on) { Sound.honk(); return null; }
      if (jump.y > 0) return null;
      jump.vy = 6;
      jump.rs = (Math.PI * 2) / ((2 * jump.vy) / 14);
      jump.nitro = 0.6;
      Sound.whoosh(0.8, 400, 2500, 0.15);
      return 'kart';
    },
    update(t, dt, { crankSpeed }) {
      const d = ctx.drive.on;
      const ks = damp(kart.scale.x, d ? 0.62 : 1.35, 4, dt);
      kart.scale.setScalar(ks);
      const ds = damp(disc.scale.x, d ? 1.5 : 1, 4, dt);
      disc.scale.set(ds, 1, ds);
      discRing.scale.set(ds, ds, 1);
      group.rotation.x = damp(group.rotation.x, d ? 0.6 : 0.25, 3, dt);
      lbl.visible = !d;
      let spin;
      let nitroTarget = jump.nitro > 0 ? 1 : 0;
      jump.nitro = Math.max(jump.nitro - dt, 0);
      if (d) {
        const k = ctx.input.keys;
        const acc = (k.up ? 1 : 0) - (k.down ? 0.7 : 0);
        car.v += acc * 5.5 * dt;
        car.v *= 1 - 1.3 * dt;
        car.steer = damp(car.steer, (k.left ? 1 : 0) - (k.right ? 1 : 0), 8, dt);
        car.h += car.steer * car.v * 0.9 * dt;
        kart.position.x += Math.cos(car.h) * car.v * dt;
        kart.position.z -= Math.sin(car.h) * car.v * dt;
        const R = 2.6 * 1.5 - 0.95;
        const rr = Math.hypot(kart.position.x, kart.position.z);
        if (rr > R) {
          kart.position.x *= R / rr;
          kart.position.z *= R / rr;
          if (Math.abs(car.v) > 1) {
            kart.getWorldPosition(v3);
            ctx.sparks.burst(v3, FIRE, 30, 3);
            Sound.tone(90, 0.15, 'square', 0.08);
          }
          car.v *= -0.35;
        }
        car.dist += Math.abs(car.v) * dt;
        if (car.dist > 10) ctx.unlock('drive');
        if (k.up) nitroTarget = 0.5 + Math.random() * 0.5;
        if (Math.abs(car.steer * car.v) > 2.2 && Math.random() < 0.4) {
          kart.getWorldPosition(v3);
          ctx.sparks.burst(v3, DUST, 4, 1.2);
        }
        ctx.addBoost(Math.abs(car.v) * 40 * dt * 60 * 0.02);
        spin = car.v * 3;
      } else {
        kart.position.x = damp(kart.position.x, 0, 3, dt);
        kart.position.z = damp(kart.position.z, 0, 3, dt);
        car.v = 0;
        car.h += dt * 0.3;
        car.steer = damp(car.steer, 0, 6, dt);
        spin = 2 + crankSpeed * 0.8;
      }
      kart.rotation.y = car.h;
      wheels.forEach((w, i) => {
        w.rotation.z -= dt * spin;
        if (i >= 2) w.rotation.y = car.steer * 0.45;
      });
      if (jump.y > 0 || jump.vy > 0) {
        jump.vy -= 14 * dt;
        jump.y += jump.vy * dt;
        jump.roll += jump.rs * dt;
        if (jump.y <= 0) {
          jump.y = 0; jump.vy = 0; jump.roll = 0;
          kart.getWorldPosition(v3);
          ctx.sparks.burst(v3, DUST, 60, 3);
          Sound.tone(60, 0.25, 'sine', 0.2);
        }
      }
      kart.position.y = jump.y + Math.abs(Math.sin(t * 6)) * 0.015;
      kart.rotation.x = jump.roll;
      nitro = damp(nitro, nitroTarget, 10, dt);
      flames.forEach((f) => {
        f.visible = nitro > 0.04;
        f.scale.set(1, 0.3 + nitro * (1.2 + Math.random() * 0.4), 1);
        f.position.x = -1.75 - f.scale.y * 0.3;
      });
    },
  };
}

// 05 · ROBORIDER — Arduino RC car
function buildRobo(M, ctx) {
  const group = new THREE.Group();
  const bot = new THREE.Group();
  group.add(bot);
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.2), M.pcb);
  base.position.y = 0.5;
  bot.add(base);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 1.1), new THREE.MeshStandardMaterial({ color: 0x0b0f1a, transparent: true, opacity: 0.85, metalness: 0.3, roughness: 0.2 }));
  deck.position.y = 0.95;
  bot.add(deck);
  [[-0.8, -0.45], [-0.8, 0.45], [0.8, -0.45], [0.8, 0.45]].forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), M.steel);
    p.position.set(x, 0.72, z);
    bot.add(p);
  });
  const ard = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.6), M.arduino);
  ard.position.set(-0.2, 1.0, 0);
  bot.add(ard);
  const chipM = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.1), M.chip);
  chipM.position.set(-0.2, 1.04, 0.05);
  bot.add(chipM);
  for (let i = 0; i < 10; i++) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.05), M.chip);
    h.position.set(-0.6 + i * 0.08, 1.05, -0.26);
    bot.add(h);
  }
  const battery = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 0.4), M.amber);
  battery.position.set(-0.4, 0.66, 0);
  bot.add(battery);
  const driver = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.35), M.red);
  driver.position.set(0.35, 0.58, 0);
  bot.add(driver);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.25, 0.55), M.arduino);
  plate.position.set(1.02, 0.7, 0);
  bot.add(plate);
  const lensMat = M.cyan.clone();
  [-0.14, 0.14].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 24).rotateZ(Math.PI / 2), M.steel);
    eye.position.set(1.1, 0.7, z);
    bot.add(eye);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24).rotateY(Math.PI / 2), lensMat);
    lens.position.set(1.165, 0.7, z);
    bot.add(lens);
  });
  bot.add(tube(new THREE.Vector3(-0.75, 1.0, 0.4), new THREE.Vector3(-0.85, 1.9, 0.4), 0.015, M.steel));
  const ledMat = new THREE.MeshStandardMaterial({ color: 0xff3355, emissive: 0xff1133, emissiveIntensity: 2 });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), ledMat);
  led.position.set(-0.85, 1.92, 0.4);
  bot.add(led);
  const wheels = [];
  [[-0.65, 0.72], [-0.65, -0.72], [0.65, 0.72], [0.65, -0.72]].forEach(([x, z]) => {
    const w = new THREE.Group();
    w.add(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 28).rotateX(Math.PI / 2), M.rubber));
    w.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.22, 6).rotateX(Math.PI / 2), M.amber));
    w.position.set(x, 0.34, z);
    bot.add(w);
    wheels.push(w);
    const tt = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.2), M.amber);
    tt.position.set(x, 0.4, z * 0.65);
    bot.add(tt);
  });
  const waves = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 6, 48), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true }));
    m.rotation.x = Math.PI / 2;
    m.position.set(-0.85, 1.92, 0.4);
    m.userData.noPick = true;
    bot.add(m);
    return m;
  });
  const trophy = makeLabel('🥉 3rd place', { color: '#fde68a', size: 42 });
  trophy.position.set(0, 2.9, 0);
  group.add(trophy);
  const track = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.03, 8, 128), M.violet);
  track.rotation.x = Math.PI / 2;
  group.add(track);
  bot.scale.setScalar(1.15);
  group.position.y = -1;
  group.rotation.x = 0.3;
  let a = 0, hopY = 0, hopV = 0, party = 0;
  return {
    group,
    hint: 'Click to say hi',
    poke() {
      if (hopY <= 0) hopV = 4.5;
      party = 2.2;
      Sound.beeps();
      led.getWorldPosition(v3);
      ctx.sparks.burst(v3, COOL, 60, 3.5);
      return 'robo';
    },
    update(t, dt) {
      party = Math.max(party - dt, 0);
      a += dt * (0.6 + party * 1.5);
      bot.position.set(Math.cos(a) * 1.0, hopY, Math.sin(a) * 1.0);
      bot.rotation.y = -a - Math.PI / 2;
      if (hopY > 0 || hopV > 0) {
        hopV -= 14 * dt;
        hopY = Math.max(hopY + hopV * dt, 0);
        if (hopY === 0) hopV = party > 0.8 ? 3.5 : 0;
      }
      bot.rotation.z = Math.sin(t * 20) * 0.05 * party;
      wheels.forEach((w) => (w.rotation.z -= dt * (6 + party * 10)));
      if (party > 0) {
        ledMat.emissive.setHSL((t * 2) % 1, 1, 0.5);
        lensMat.emissive.setHSL((t * 2 + 0.5) % 1, 1, 0.5);
        ledMat.emissiveIntensity = 3;
      } else {
        ledMat.emissive.setHex(0xff1133);
        lensMat.emissive.setHex(0x0891b2);
        ledMat.emissiveIntensity = Math.sin(t * 8) > 0 ? 3 : 0.2;
      }
      waves.forEach((w, i) => {
        const k = (t * (0.8 + party) + i / 3) % 1;
        w.scale.setScalar(0.5 + k * 3);
        w.material.opacity = 1 - k;
      });
    },
  };
}

// 06 · THESIS — connecting rod with FEA-style stress colouring; click to load it
function buildRod(M, ctx) {
  const group = new THREE.Group();
  const rod = new THREE.Group();
  group.add(rod);
  const L = 3.4;
  const stops = [[0, 0x1e3a8a], [0.25, 0x06b6d4], [0.5, 0x22c55e], [0.75, 0xfacc15], [1, 0xef4444]].map(([s, c]) => [s, new THREE.Color(c)]);
  const tmpC = new THREE.Color();
  const jet = (s) => {
    for (let i = 0; i < stops.length - 1; i++) {
      const [a, ca] = stops[i], [b, cb] = stops[i + 1];
      if (s <= b) return tmpC.copy(ca).lerp(cb, (s - a) / (b - a));
    }
    return tmpC.copy(stops[4][1]);
  };
  const gauss = (x, m, w) => Math.exp(-((x - m) ** 2) / (2 * w * w));
  const stress = (x, y) => Math.min(1, 0.12 + 0.85 * Math.max(gauss(y, L - 0.62, 0.28), 0.8 * gauss(y, 0.78, 0.3)) + 0.18 * Math.abs(x));
  function colorize(geo) {
    const pos = geo.attributes.position;
    geo.userData.base = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) geo.userData.base[i] = stress(pos.getX(i), pos.getY(i));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
    recolor(geo, 0);
  }
  function recolor(geo, load) {
    const col = geo.attributes.color;
    const base = geo.userData.base;
    for (let i = 0; i < base.length; i++) {
      const c = jet(Math.min(1, base[i] * (1 + load * 1.4) + load * 0.1));
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
  }
  const fea = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 60, specular: 0x444444 });
  const meshMat = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true, opacity: 0.18 });
  const parts = [
    new THREE.TorusGeometry(0.62, 0.22, 20, 56),
    new THREE.TorusGeometry(0.32, 0.14, 16, 40).translate(0, L, 0),
    new THREE.BoxGeometry(0.34, L - 0.9, 0.22, 2, 28, 2).translate(0, L / 2 + 0.02, 0),
    new THREE.BoxGeometry(0.08, L - 1.0, 0.46, 1, 28, 2).translate(0.17, L / 2, 0),
    new THREE.BoxGeometry(0.08, L - 1.0, 0.46, 1, 28, 2).translate(-0.17, L / 2, 0),
    new THREE.BoxGeometry(1.7, 0.22, 0.42, 12, 2, 2).translate(0, -0.62, 0),
  ];
  parts.forEach((g) => {
    colorize(g);
    rod.add(new THREE.Mesh(g, fea));
    rod.add(new THREE.Mesh(g, meshMat));
  });
  [-0.68, 0.68].forEach((x) => {
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.75, 12), M.steel);
    bolt.position.set(x, -0.45, 0);
    rod.add(bolt);
  });
  rod.position.y = -L / 2 + 0.2;

  const arrows = [];
  [0.35, 0, -0.35].forEach((z) => {
    const a = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8), M.pink);
    shaft.position.y = 0.35;
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 16), M.pink);
    head.rotation.z = Math.PI;
    a.add(shaft, head);
    a.position.set(0, L / 2 + 0.75, z);
    group.add(a);
    arrows.push(a);
  });
  const fl = makeLabel('F = load', { color: '#fbcfe8', size: 38 });
  fl.position.set(0.9, L / 2 + 1.5, 0);
  fl.scale.multiplyScalar(0.8);
  group.add(fl);
  const support = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.0), M.darkSteel);
  support.position.y = -L / 2 - 0.75;
  group.add(support);

  group.rotation.z = 0.12;
  let load = 0, lastLoad = 0;
  return {
    group,
    hint: 'Click to apply load',
    poke(point) {
      load = 1;
      Sound.tone(80, 0.6, 'sawtooth', 0.12, 0, 45);
      ctx.sparks.burst(point || rod.getWorldPosition(v3), ['#ef4444', '#facc15', '#ffffff'], 60, 4);
      return 'thesis';
    },
    update(t, dt) {
      rod.rotation.y = t * 0.35;
      load = Math.max(load - dt * 0.45, 0);
      const e = load > 0 ? Math.sin(Math.min((1 - load) * 6, Math.PI)) * 0.4 + load * 0.6 : 0;
      if (Math.abs(e - lastLoad) > 0.01 || (e === 0 && lastLoad !== 0)) {
        parts.forEach((g) => recolor(g, e));
        lastLoad = e;
      }
      rod.scale.set(1 + e * 0.04, 1 - e * 0.06, 1 + e * 0.04);
      arrows.forEach((a, i) => (a.position.y = L / 2 + 0.75 + Math.sin(t * 3 + i) * 0.08 - e * 0.3));
    },
  };
}

// 07 · EDUCATION — graduation cap; click to toss it
function buildCap(M, ctx) {
  const group = new THREE.Group();
  const cap = new THREE.Group();
  group.add(cap);
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 2.4), M.navy);
  board.rotation.y = Math.PI / 4;
  const skull = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.7, 48, 1, true), M.navy);
  skull.position.y = -0.4;
  const button = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16), M.gold);
  button.position.y = 0.08;
  cap.add(board, skull, button);
  const tassel = new THREE.Group();
  tassel.position.y = 0.09;
  cap.add(tassel);
  tassel.add(tube(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1.55, 0, 0), 0.025, M.gold));
  const hang = new THREE.Group();
  hang.position.x = 1.55;
  tassel.add(hang);
  hang.add(tube(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.8, 0), 0.025, M.gold));
  const fringe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.13, 0.35, 12), M.gold);
  fringe.position.y = -0.95;
  hang.add(fringe);
  cap.rotation.x = 0.35;
  cap.position.y = 0.5;

  const years = [['2015', '10th · 80.2%'], ['2017', '12th · 52.83%'], ['2021', 'B.Tech · 7.97']];
  const tags = years.map(([y, d], i) => {
    const l = makeLabel(`${y}  ${d}`, { color: ['#a5f3fc', '#ddd6fe', '#fde68a'][i], size: 40 });
    l.scale.multiplyScalar(0.95);
    group.add(l);
    return l;
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.012, 8, 200), M.violet);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.2;
  ring.userData.noPick = true;
  group.add(ring);
  [M.cyan, M.violet, M.pink].forEach((m, i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.6 - i * 0.15, 0.22, 1.1 - i * 0.1), m);
    b.position.y = -1.8 + i * 0.23;
    b.rotation.y = i * 0.25;
    group.add(b);
  });
  const toss = { y: 0, vy: 0, flip: 0 };
  let spinY = 0;
  return {
    group,
    hint: 'Click to toss the cap',
    poke() {
      if (toss.y > 0) return null;
      toss.vy = 7.5;
      Sound.tone(500, 0.6, 'sine', 0.1, 0, 1600);
      cap.getWorldPosition(v3);
      ctx.sparks.burst(v3, ['#22d3ee', '#a78bfa', '#f472b6', '#fbbf24', '#4ade80'], 180, 6);
      return 'education';
    },
    update(t, dt) {
      if (toss.y > 0 || toss.vy > 0) {
        toss.vy -= 12 * dt;
        toss.y += toss.vy * dt;
        toss.flip += dt * 9;
        if (toss.y <= 0) {
          toss.y = 0; toss.vy = 0; toss.flip = 0;
          Sound.tone(120, 0.15, 'triangle', 0.1);
        }
      }
      spinY += dt * (0.4 + (toss.y > 0 ? 6 : 0));
      cap.position.y = 0.5 + toss.y;
      cap.rotation.y = spinY;
      cap.rotation.x = 0.35 + toss.flip;
      hang.rotation.z = Math.sin(t * 2) * 0.15;
      tags.forEach((l, i) => {
        const a = t * 0.3 + (i / 3) * Math.PI * 2;
        l.position.set(Math.cos(a) * 3.1, -1.0 + Math.sin(t + i) * 0.1, Math.sin(a) * 3.1);
        l.material.opacity = 0.5 + 0.5 * ((Math.sin(a) + 1) / 2);
      });
    },
  };
}

// 08 · CONTACT — globe with Odisha beacon and a paper plane
function buildGlobe(M, ctx) {
  const group = new THREE.Group();
  const R = 2;
  const globe = new THREE.Group();
  group.add(globe);
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.98, 48, 48), new THREE.MeshStandardMaterial({ color: 0x0b1224, metalness: 0.6, roughness: 0.6 })));
  const wf = new THREE.Mesh(new THREE.IcosahedronGeometry(R, 4), new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.12 }));
  wf.userData.noPick = true;
  globe.add(wf);
  const dots = [];
  for (let lat = -80; lat <= 80; lat += 10) {
    const n = Math.round(36 * Math.cos(THREE.MathUtils.degToRad(lat)));
    for (let k = 0; k < n; k++) dots.push(...latLon(lat, (k / n) * 360, R * 1.005).toArray());
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute(dots, 3));
  const dp = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xa78bfa, size: 0.035 }));
  dp.userData.noPick = true;
  globe.add(dp);
  const home = latLon(20.3, 84.5, R);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), M.pink);
  beacon.position.copy(home);
  globe.add(beacon);
  const pulses = [0, 1].map(() => {
    const p = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.11, 32), new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, side: THREE.DoubleSide }));
    p.position.copy(home).multiplyScalar(1.01);
    p.lookAt(home.clone().multiplyScalar(2));
    p.userData.noPick = true;
    globe.add(p);
    return p;
  });
  globe.add(tube(home, home.clone().multiplyScalar(1.35), 0.012, M.pink));
  globe.rotation.y = -THREE.MathUtils.degToRad(84.5) - Math.PI / 2;

  const planeGeo = new THREE.BufferGeometry();
  planeGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    0.5, 0, 0, -0.4, 0, 0.35, -0.3, 0, 0,
    0.5, 0, 0, -0.3, 0, 0, -0.4, 0, -0.35,
    0.5, 0, 0, -0.3, 0, 0, -0.4, -0.13, 0,
  ], 3));
  planeGeo.computeVertexNormals();
  const plane = new THREE.Mesh(planeGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.5 }));
  plane.rotation.order = 'YXZ';
  const orbit = new THREE.Group();
  orbit.rotation.set(0.4, 0, 0.3);
  orbit.add(plane);
  group.add(orbit);
  const lbl = makeLabel("let's talk →", { color: '#a5f3fc', size: 44 });
  lbl.position.set(0, -2.9, 0);
  group.add(lbl);
  let a = 0, fast = 0, roll = 0;
  return {
    group,
    hint: 'Click to send a paper plane',
    poke() {
      fast = 1;
      Sound.whoosh(1.0, 300, 3500, 0.16);
      beacon.getWorldPosition(v3);
      ctx.sparks.burst(v3, ['#f472b6', '#fbcfe8', '#ffffff'], 120, 4);
      return 'contact';
    },
    update(t, dt) {
      fast = Math.max(fast - dt * 0.4, 0);
      globe.rotation.y += dt * (0.12 + fast * 2);
      a += dt * 0.7 * (1 + fast * 4);
      roll += dt * fast * 10;
      plane.position.set(Math.cos(a) * 2.8, Math.sin(a * 2) * 0.2, Math.sin(a) * 2.8);
      plane.rotation.y = -a;
      plane.rotation.x = roll;
      plane.rotation.z = Math.sin(a * 2) * 0.2;
      pulses.forEach((p, i) => {
        const k = (t * (0.6 + fast * 2) + i * 0.5) % 1;
        p.scale.setScalar(1 + k * 5);
        p.material.opacity = 1 - k;
      });
    },
  };
}

/* =================================================================
   Helpers
================================================================= */
class Sparks {
  constructor(n) {
    this.n = n;
    this.i = 0;
    this.pos = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) this.pos[k * 3 + 1] = -9999;
    this.col = new Float32Array(n * 3);
    this.base = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    this.max = new Float32Array(n);
    this.alive = 0;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(g, new THREE.PointsMaterial({
      size: 0.13, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.points.frustumCulled = false;
    this.c = new THREE.Color();
  }
  burst(p, colors, count = 60, speed = 4) {
    for (let k = 0; k < count; k++) {
      const i = this.i;
      this.i = (this.i + 1) % this.n;
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      const sp = speed * (0.3 + Math.random() * 0.7);
      this.vel.set([Math.cos(th) * s * sp, u * sp + speed * 0.35, Math.sin(th) * s * sp], i * 3);
      this.pos.set([p.x, p.y, p.z], i * 3);
      this.c.set(colors[Math.floor(Math.random() * colors.length)]);
      this.base.set([this.c.r, this.c.g, this.c.b], i * 3);
      this.life[i] = this.max[i] = 0.7 + Math.random() * 0.9;
    }
    this.alive = this.n;
  }
  update(dt) {
    if (!this.alive) return;
    let any = 0;
    const drag = 1 - 0.9 * dt;
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      any++;
      this.life[i] -= dt;
      const j = i * 3;
      this.vel[j + 1] -= 5 * dt;
      this.vel[j] *= drag; this.vel[j + 1] *= drag; this.vel[j + 2] *= drag;
      this.pos[j] += this.vel[j] * dt;
      this.pos[j + 1] += this.vel[j + 1] * dt;
      this.pos[j + 2] += this.vel[j + 2] * dt;
      const k = Math.max(this.life[i] / this.max[i], 0);
      this.col[j] = this.base[j] * k;
      this.col[j + 1] = this.base[j + 1] * k;
      this.col[j + 2] = this.base[j + 2] * k;
      if (this.life[i] <= 0) this.pos[j + 1] = -9999;
    }
    this.alive = any;
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
}

function tube(a, b, r, mat) {
  const d = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), mat);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}

function latLon(lat, lon, r) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

function gearGeometry(teeth, rRoot, rTip, depth) {
  const s = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [[rRoot, a], [rTip, a + step * 0.18], [rTip, a + step * 0.42], [rRoot, a + step * 0.6], [rRoot, a + step]];
    pts.forEach(([r, ang], j) => {
      const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
      i === 0 && j === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
    });
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, rRoot * 0.25, 0, Math.PI * 2, true);
  s.holes.push(hole);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    const h = new THREE.Path();
    h.absarc(Math.cos(a) * rRoot * 0.6, Math.sin(a) * rRoot * 0.6, rRoot * 0.17, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2, curveSegments: 16 });
  g.translate(0, 0, -depth / 2);
  return g;
}

function makeLabel(text, { color = '#fff', size = 48, bg = 'rgba(9,13,28,.7)' } = {}) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const font = `600 ${size}px "Space Grotesk", system-ui, sans-serif`;
  ctx.font = font;
  const padX = size * 0.6;
  const w = Math.ceil(ctx.measureText(text).width + padX * 2);
  const h = Math.ceil(size * 1.7);
  c.width = w;
  c.height = h;
  ctx.font = font;
  ctx.fillStyle = bg;
  ctx.strokeStyle = 'rgba(34,211,238,.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(2, 2, w - 4, h - 4, h / 2 - 2);
  else ctx.rect(2, 2, w - 4, h - 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(w * 0.0085, h * 0.0085, 1);
  return sp;
}

// Star field that flows toward the camera (faster in turbo)
function makeStars(n, depth) {
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const palette = [new THREE.Color(0xffffff), new THREE.Color(0x22d3ee), new THREE.Color(0xa78bfa), new THREE.Color(0xf472b6)];
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 80;
    pos[i * 3 + 1] = 20 - Math.random() * (depth + 40);
    pos[i * 3 + 2] = -Math.random() * 50 + 6;
    const c = palette[Math.random() < 0.7 ? 0 : 1 + Math.floor(Math.random() * 3)];
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const points = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true }));
  points.frustumCulled = false;
  return {
    points,
    update(dt, speed) {
      for (let i = 0; i < n; i++) {
        const j = i * 3 + 2;
        pos[j] += speed * dt;
        if (pos[j] > 30) pos[j] -= 74;
      }
      g.attributes.position.needsUpdate = true;
    },
  };
}

function makeEnvScene() {
  const env = new THREE.Scene();
  const geo = new THREE.SphereGeometry(10, 32, 16);
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const top = new THREE.Color(0x8ab4ff), mid = new THREE.Color(0x1b1f3a), bottom = new THREE.Color(0x3b0d3a);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 10;
    const c = y > 0 ? mid.clone().lerp(top, y) : mid.clone().lerp(bottom, -y);
    cols.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  env.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true })));
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
  panel.position.set(0, 6, 4);
  panel.lookAt(0, 0, 0);
  env.add(panel);
  const panel2 = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide }));
  panel2.position.set(-8, 1, -2);
  panel2.lookAt(0, 0, 0);
  env.add(panel2);
  return env;
}

/* =================================================================
   Hero portrait — the photo on a depth-displaced mesh that tilts gently
   with the cursor, giving it real 3D depth
================================================================= */
function initPortrait() {
  const wrap = $('#portrait');
  const canvas = $('#portrait-canvas');
  let r;
  try { r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { return; }
  r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  r.outputColorSpace = THREE.LinearSRGBColorSpace;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(26, 0.8, 0.1, 20);
  cam.position.set(0, 0, 2.75);
  const uniforms = { uMap: { value: null }, uDepth: { value: null }, uAmp: { value: 0.22 } };
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 1.375, 100, 125),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        uniform sampler2D uDepth; uniform float uAmp; varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z += texture2D(uDepth, uv).r * uAmp;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D uMap; varying vec2 vUv;
        void main() { gl_FragColor = vec4(texture2D(uMap, vUv).rgb, 1.0); }`,
    })
  );
  scene.add(mesh);

  function size() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    r.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  new ResizeObserver(size).observe(wrap);
  size();

  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    tilt.ty = (e.clientX / innerWidth - 0.5) * 0.4;
    tilt.tx = (e.clientY / innerHeight - 0.5) * 0.25;
  });

  const tex = new THREE.TextureLoader();
  const load = (url) => new Promise((res, rej) => tex.load(url, res, undefined, rej));
  Promise.all([load('img/portrait.jpg'), load('img/portrait-depth.png')]).then(([map, depth]) => {
    map.colorSpace = THREE.NoColorSpace;
    map.anisotropy = 4;
    uniforms.uMap.value = map;
    uniforms.uDepth.value = depth;
    wrap.classList.add('is-3d');
    const clock = new THREE.Clock();
    (function loop() {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      if (window.scrollY < innerHeight * 1.1 && !document.hidden) {
        const idle = reduceMotion ? 0 : 1;
        tilt.x = damp(tilt.x, tilt.tx + Math.sin(t * 0.6) * 0.02 * idle, 5, dt);
        tilt.y = damp(tilt.y, tilt.ty + Math.sin(t * 0.4) * 0.04 * idle, 5, dt);
        mesh.rotation.set(tilt.x, tilt.y, 0);
        r.render(scene, cam);
      }
      requestAnimationFrame(loop);
    })();
  }).catch(() => { /* keep the plain photo */ });
}

/* ---------------- Boot ---------------- */
if (renderer) {
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
  initScene();
  initPortrait();
}
