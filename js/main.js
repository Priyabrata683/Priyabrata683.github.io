import * as THREE from 'three';

/* ------------------------------------------------------------------
   Priyabrata Parida — immersive 3D portfolio
   Every model below is built from code (no external assets).
------------------------------------------------------------------- */

const $ = (s) => document.querySelector(s);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sections = [...document.querySelectorAll('main > section')];
const SPACING = 14; // world units between section scenes

/* ---------------- UI (works even without WebGL) ---------------- */
const loaderPct = $('#loader-pct');
let pct = 0;
const loaderTimer = setInterval(() => {
  pct = Math.min(pct + Math.ceil(Math.random() * 12), 96);
  loaderPct.textContent = pct;
}, 60);
function hideLoader() {
  clearInterval(loaderTimer);
  loaderPct.textContent = 100;
  setTimeout(() => $('#loader').classList.add('done'), 250);
}
setTimeout(hideLoader, 6000); // safety net

$('#year').textContent = new Date().getFullYear();

// Section dots + active nav link
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

// Reveal cards when they enter the viewport
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
  { threshold: 0.2 }
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

// Contact form -> opens mail client with the message pre-filled
$('#contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const subject = encodeURIComponent(`Portfolio enquiry from ${f.get('name')}`);
  const body = encodeURIComponent(`${f.get('message')}\n\n— ${f.get('name')} (${f.get('email')})`);
  window.location.href = `mailto:priyabrata683@gmail.com?subject=${subject}&body=${body}`;
});

/* ---------------- Scroll state ---------------- */
let scrollY = window.scrollY;
let lastScrollY = scrollY;
let scrollVel = 0; // smoothed px/s
let camTargetY = 0;
let activeIndex = 0;
let centers = [];

function measure() {
  centers = sections.map((s) => s.offsetTop + s.offsetHeight / 2);
}
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
  if (idx !== activeIndex || !dots[idx].classList.contains('active')) {
    activeIndex = idx;
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    const id = sections[idx].id;
    topLinks.forEach((a) => {
      const target = a.getAttribute('href').slice(1);
      const projects = ['kart', 'robo', 'thesis'];
      a.classList.toggle('active', target === id || (target === 'kart' && projects.includes(id)));
    });
  }
}

/* ---------------- RPM gauge ---------------- */
const rpmFill = $('#rpm-fill');
const rpmNeedle = $('#rpm-needle');
const rpmVal = $('#rpm-val');
function updateGauge(rpm) {
  const t = Math.min((rpm - 800) / 7200, 1);
  rpmFill.style.strokeDashoffset = 157 * (1 - t);
  rpmFill.style.stroke = t > 0.75 ? '#f472b6' : t > 0.45 ? '#fbbf24' : '#22d3ee';
  rpmNeedle.style.transform = `rotate(${-90 + t * 180}deg)`;
  rpmVal.textContent = Math.round(rpm / 10) * 10;
}

/* ---------------- WebGL ---------------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('#webgl'), antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (err) {
  document.body.classList.add('no-webgl');
}

if (!renderer) {
  measure();
  hideLoader();
  const uiOnly = () => { updateUI(sectionProgress()); requestAnimationFrame(uiOnly); };
  uiOnly();
} else {
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
  initScene();
}

function initScene() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060f, 0.028);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 12);

  // Lights
  scene.add(new THREE.HemisphereLight(0x9ecbff, 0x1a1033, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(5, 8, 10);
  scene.add(key);
  const cyanLight = new THREE.PointLight(0x22d3ee, 40, 30, 1.6);
  const pinkLight = new THREE.PointLight(0xf472b6, 30, 30, 1.6);
  scene.add(cyanLight, pinkLight);

  // Environment map so metals look like metal
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(makeEnvScene(), 0.04).texture;

  /* ----- Materials ----- */
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
    navy: new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.2, roughness: 0.7 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 1, roughness: 0.3, emissive: 0xb45309, emissiveIntensity: 0.3 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x67e8f9, metalness: 0, roughness: 0.05, transmission: 0.9, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
    wire: new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.25 }),
  };

  /* ----- Background: stars + blueprint grid ----- */
  const totalDepth = (sections.length - 1) * SPACING;
  scene.add(makeStars(3500, totalDepth));
  const grid = new THREE.GridHelper(260, 130, 0x22d3ee, 0x22d3ee);
  grid.material.transparent = true;
  grid.material.opacity = 0.06;
  grid.rotation.x = Math.PI / 2;
  grid.position.set(0, -totalDepth / 2, -18);
  scene.add(grid);

  /* ----- Section scenes ----- */
  const builders = {
    home: buildEngine,
    about: buildCore,
    skills: buildGears,
    kart: buildKart,
    robo: buildRobo,
    thesis: buildRod,
    education: buildCap,
    contact: buildGlobe,
  };
  const stages = sections.map((s, i) => {
    const holder = new THREE.Group();
    const built = builders[s.id](M);
    built.group.userData.baseY = built.group.position.y;
    holder.add(built.group);
    holder.userData = { side: s.dataset.side === 'left' ? 1 : -1, baseY: -i * SPACING, update: built.update };
    scene.add(holder);
    return holder;
  });

  /* ----- Layout (desktop vs mobile) ----- */
  let mobile = false;
  function layout() {
    measure();
    const w = window.innerWidth, h = window.innerHeight;
    mobile = w < 820;
    camera.aspect = w / h;
    camera.fov = mobile ? 55 : 45;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    // half of visible width at z=0
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
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

  /* ----- Pointer: parallax + drag-to-rotate ----- */
  const pointer = new THREE.Vector2();
  const drag = { active: false, x: 0, spin: 0, vel: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    if (drag.active) {
      drag.vel = (e.clientX - drag.x) * 0.01;
      drag.spin += drag.vel;
      drag.x = e.clientX;
    }
  });
  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.card, a, button, input, textarea, nav, header')) return;
    drag.active = true;
    drag.x = e.clientX;
  });
  window.addEventListener('pointerup', () => (drag.active = false));

  /* ----- Loop ----- */
  const clock = new THREE.Clock();
  let camY = -sectionProgress() * SPACING;
  let crankSpeed = 2;
  let firstFrame = true;

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // scroll velocity -> rpm
    const v = Math.abs(scrollY - lastScrollY) / Math.max(dt, 0.001);
    lastScrollY = scrollY;
    scrollVel += (v - scrollVel) * 0.08;
    const rpm = Math.min(800 + scrollVel * 3.2, 8000);
    updateGauge(rpm);
    crankSpeed = reduceMotion ? 0.4 : rpm / 400; // rad/s

    const p = sectionProgress();
    updateUI(p);
    camTargetY = -p * SPACING;
    camY += (camTargetY - camY) * (1 - Math.exp(-dt * 5));

    camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.04;
    camera.position.y = camY + pointer.y * 0.5;
    camera.lookAt(0, camY, 0);
    cyanLight.position.set(-6, camY + 4, 6);
    pinkLight.position.set(6, camY - 4, 4);

    if (!drag.active) drag.vel *= 0.95;
    if (!drag.active) drag.spin += drag.vel;

    stages.forEach((st, i) => {
      const dist = Math.abs(camY - st.userData.baseY) / SPACING;
      st.visible = dist < 1.6;
      if (!st.visible) return;
      const focus = THREE.MathUtils.clamp(1 - dist, 0, 1);
      const inner = st.children[0];
      inner.position.y = inner.userData.baseY + Math.sin(t * 0.8 + i) * 0.15;
      // drag only spins the scene currently in focus
      inner.rotation.y = (i === Math.round(p) ? drag.spin : 0) * focus + (1 - focus) * st.userData.side * 0.6;
      st.userData.update?.(t, dt, { crankSpeed, focus, mobile });
    });

    renderer.render(scene, camera);
    if (firstFrame) { firstFrame = false; hideLoader(); }
    requestAnimationFrame(tick);
  }
  tick();
}

/* =================================================================
   Builders — each returns { group, update(t, dt, state) }
================================================================= */

// 01 · HERO — working slider-crank: crankshaft, connecting rod, piston
function buildEngine(M) {
  const group = new THREE.Group();
  const rig = new THREE.Group();
  rig.position.y = -2.2;
  group.add(rig);
  const r = 0.8, L = 2.6;

  const crank = new THREE.Group();
  rig.add(crank);
  const webGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.22, 64);
  webGeo.rotateX(Math.PI / 2);
  [-0.38, 0.38].forEach((z) => {
    const w = new THREE.Mesh(webGeo, M.steel);
    w.position.z = z;
    crank.add(w);
    // counterweight lobe
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
  // flywheel ring
  const fly = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.08, 16, 96), M.violet);
  fly.position.z = -1.5;
  crank.add(fly);

  // connecting rod (pivot at big end)
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

  // piston + rings
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

  // glass cylinder liner + combustion glow
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

  // orbit rings for flair
  const halo = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.015, 8, 160), M.cyan);
  halo.rotation.x = Math.PI / 2.3;
  group.add(halo);
  const halo2 = new THREE.Mesh(new THREE.TorusGeometry(3.8, 0.01, 8, 160), M.violet);
  halo2.rotation.x = Math.PI / 1.8;
  halo2.rotation.y = 0.4;
  group.add(halo2);

  group.rotation.x = 0.15;
  let theta = 0;
  return {
    group,
    update(t, dt, { crankSpeed }) {
      theta += crankSpeed * dt;
      crank.rotation.z = -theta;
      const px = r * Math.sin(theta), py = r * Math.cos(theta);
      const yp = py + Math.sqrt(L * L - px * px);
      rod.position.set(px, py, 0);
      rod.rotation.z = Math.atan2(px, yp - py);
      piston.position.y = yp;
      // spark near top dead centre
      const tdc = Math.cos(theta);
      flame.intensity = tdc > 0.92 ? (tdc - 0.92) * 400 : flame.intensity * 0.85;
      halo.rotation.z = t * 0.2;
      halo2.rotation.z = -t * 0.15;
    },
  };
}

// 02 · ABOUT — "engineer meets code" core
function buildCore(M) {
  const group = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(2.1, 1), M.wire);
  const core = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 0), M.steel);
  const inner = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), M.pink);
  group.add(shell, core, inner);
  const orbits = [];
  [[0.3, 0], [1.2, 0.8], [-0.9, 1.9]].forEach(([rx, rz], i) => {
    const pivot = new THREE.Group();
    pivot.rotation.set(rx, 0, rz);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.7 + i * 0.25, 0.012, 8, 160), [M.cyan, M.violet, M.amber][i]);
    ring.rotation.x = Math.PI / 2;
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), [M.cyan, M.violet, M.amber][i]);
    pivot.add(ring, e);
    group.add(pivot);
    orbits.push({ e, r: 2.7 + i * 0.25, s: 0.8 + i * 0.35 });
  });
  // floating code-ish label
  const tag = makeLabel('{ mech + code }', { color: '#a5f3fc', size: 44 });
  tag.position.set(0, -3.1, 0);
  tag.scale.multiplyScalar(0.9);
  group.add(tag);
  return {
    group,
    update(t) {
      shell.rotation.y = t * 0.15;
      shell.rotation.x = t * 0.1;
      core.rotation.y = -t * 0.4;
      core.rotation.z = t * 0.2;
      inner.rotation.y = t * 1.5;
      orbits.forEach((o, i) => o.e.position.set(Math.cos(t * o.s + i) * o.r, 0, Math.sin(t * o.s + i) * o.r));
    },
  };
}

// 03 · SKILLS — meshing gears with orbiting skill labels
function buildGears(M) {
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
  group.add(ring);
  group.rotation.x = 0.1;
  let a = 0;
  return {
    group,
    update(t, dt, { crankSpeed }) {
      a += dt * (0.4 + crankSpeed * 0.1);
      big.rotation.z = a;
      smallG.rotation.z = -a * (18 / 12) + 0.13;
      tiny.rotation.z = -a * (18 / 9) + 0.2;
      labels.forEach((l, i) => {
        const ang = t * 0.25 + (i / labels.length) * Math.PI * 2;
        l.position.set(Math.cos(ang) * 3.6, Math.sin(ang) * 3.6 * Math.sin(0.35), Math.sin(ang) * 3.6 * Math.cos(0.35));
        l.material.opacity = 0.55 + 0.45 * ((Math.sin(ang) + 1) / 2);
      });
    },
  };
}

// 04 · ELECTRIC GO-KART
function buildKart(M) {
  const group = new THREE.Group();
  const kart = new THREE.Group();
  group.add(kart);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const fr = 0.045;
  // chassis rails (symmetric)
  [1, -1].forEach((s) => {
    const pts = [V(-1.45, 0.32, 0.72 * s), V(-0.2, 0.3, 0.75 * s), V(0.9, 0.3, 0.55 * s), V(1.55, 0.36, 0.38 * s)];
    for (let i = 0; i < pts.length - 1; i++) kart.add(tube(pts[i], pts[i + 1], fr, M.cyan));
    kart.add(tube(V(1.55, 0.36, 0.38 * s), V(1.75, 0.3, 0.2 * s), fr, M.cyan)); // bumper
    kart.add(tube(V(-1.45, 0.32, 0.72 * s), V(-1.62, 0.4, 0.4 * s), fr, M.cyan)); // rear bumper
  });
  kart.add(tube(V(1.75, 0.3, 0.2), V(1.75, 0.3, -0.2), fr, M.cyan));
  kart.add(tube(V(-1.62, 0.4, 0.4), V(-1.62, 0.4, -0.4), fr, M.cyan));
  [-1.45, -0.2, 0.9].forEach((x, i) => {
    const z = [0.72, 0.75, 0.55][i];
    kart.add(tube(V(x, 0.31, z), V(x, 0.31, -z), fr, M.cyan));
  });
  // floor tray
  const tray = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.02, 1.1), M.darkSteel);
  tray.position.set(-0.1, 0.28, 0);
  kart.add(tray);
  // axles
  kart.add(tube(V(-1.2, 0.36, -0.95), V(-1.2, 0.36, 0.95), 0.05, M.steel));
  kart.add(tube(V(1.2, 0.33, -0.85), V(1.2, 0.33, 0.85), 0.04, M.steel));

  // wheels
  const wheels = [];
  function wheel(x, z, r, w) {
    const g = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 32).rotateX(Math.PI / 2), M.rubber);
    const tread = new THREE.Mesh(new THREE.TorusGeometry(r - 0.02, 0.035, 8, 32), M.rubber);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, w + 0.02, 24).rotateX(Math.PI / 2), M.steel);
    g.add(tire, tread, rim);
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

  // seat
  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.62), M.red);
  seatBase.position.set(-0.55, 0.45, 0);
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.6), M.red);
  seatBack.position.set(-0.92, 0.75, 0);
  seatBack.rotation.z = 0.35;
  kart.add(seatBase, seatBack);
  // steering
  kart.add(tube(V(0.95, 0.32, 0), V(0.45, 0.85, 0), 0.03, M.steel));
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 10, 32), M.rubber);
  sw.position.set(0.45, 0.86, 0);
  sw.rotation.y = Math.PI / 2;
  sw.rotation.x = 0;
  sw.rotateX(0.7);
  kart.add(sw);
  // EV battery packs + motor
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
  // nose cone + number plate
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.9), M.violet);
  nose.position.set(1.45, 0.45, 0);
  nose.rotation.z = -0.25;
  kart.add(nose);
  const plate = makeLabel('#19', { color: '#fff', size: 64, bg: 'rgba(225,29,72,.9)' });
  plate.position.set(1.72, 0.62, 0);
  plate.scale.multiplyScalar(0.45);
  kart.add(plate);

  // turntable + label
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
  return {
    group,
    update(t, dt, { crankSpeed }) {
      kart.rotation.y = t * 0.3;
      wheels.forEach((w) => (w.rotation.z -= dt * (2 + crankSpeed * 0.8)));
      kart.position.y = Math.abs(Math.sin(t * 6)) * 0.015; // engine vibration
    },
  };
}

// 05 · ROBORIDER — Arduino RC car
function buildRobo(M) {
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
  // ultrasonic "eyes"
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.25, 0.55), M.arduino);
  plate.position.set(1.02, 0.7, 0);
  bot.add(plate);
  [-0.14, 0.14].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 24).rotateZ(Math.PI / 2), M.steel);
    eye.position.set(1.1, 0.7, z);
    bot.add(eye);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24).rotateY(Math.PI / 2), M.cyan);
    lens.position.set(1.165, 0.7, z);
    bot.add(lens);
  });
  // antenna + blinking LED
  bot.add(tube(new THREE.Vector3(-0.75, 1.0, 0.4), new THREE.Vector3(-0.85, 1.9, 0.4), 0.015, M.steel));
  const ledMat = new THREE.MeshStandardMaterial({ color: 0xff3355, emissive: 0xff1133, emissiveIntensity: 2 });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), ledMat);
  led.position.set(-0.85, 1.92, 0.4);
  bot.add(led);
  // wheels with yellow TT motors
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
  // signal waves from the antenna
  const waves = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 6, 48), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true }));
    m.rotation.x = Math.PI / 2;
    m.position.set(-0.85, 1.92, 0.4);
    bot.add(m);
    return m;
  });
  const trophy = makeLabel('🥉 3rd place', { color: '#fde68a', size: 42 });
  trophy.position.set(0, 2.9, 0);
  group.add(trophy);
  // track ring
  const track = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.03, 8, 128), M.violet);
  track.rotation.x = Math.PI / 2;
  group.add(track);
  bot.scale.setScalar(1.15);
  group.position.y = -1;
  group.rotation.x = 0.3;
  return {
    group,
    update(t, dt) {
      // drive around the track
      const a = t * 0.6;
      bot.position.set(Math.cos(a) * 1.0, 0, Math.sin(a) * 1.0);
      bot.rotation.y = -a - Math.PI / 2;
      wheels.forEach((w) => (w.rotation.z -= dt * 6));
      ledMat.emissiveIntensity = Math.sin(t * 8) > 0 ? 3 : 0.2;
      waves.forEach((w, i) => {
        const k = (t * 0.8 + i / 3) % 1;
        w.scale.setScalar(0.5 + k * 3);
        w.material.opacity = 1 - k;
      });
    },
  };
}

// 06 · THESIS — connecting rod with FEA-style stress colouring
function buildRod(M) {
  const group = new THREE.Group();
  const rod = new THREE.Group();
  group.add(rod);
  const L = 3.4;
  const jet = (s) => {
    const stops = [[0, 0x1e3a8a], [0.25, 0x06b6d4], [0.5, 0x22c55e], [0.75, 0xfacc15], [1, 0xef4444]];
    for (let i = 0; i < stops.length - 1; i++) {
      const [a, ca] = stops[i], [b, cb] = stops[i + 1];
      if (s <= b) return new THREE.Color(ca).lerp(new THREE.Color(cb), (s - a) / (b - a));
    }
    return new THREE.Color(0xef4444);
  };
  const gauss = (x, m, w) => Math.exp(-((x - m) ** 2) / (2 * w * w));
  const stress = (x, y) => Math.min(1, 0.12 + 0.85 * Math.max(gauss(y, L - 0.62, 0.28), 0.8 * gauss(y, 0.78, 0.3)) + 0.18 * Math.abs(x));
  function colorize(geo) {
    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const c = jet(stress(pos.getX(i), pos.getY(i)));
      cols.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return geo;
  }
  const fea = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 60, specular: 0x444444 });
  const mesh = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true, opacity: 0.18 });
  const parts = [
    new THREE.TorusGeometry(0.62, 0.22, 20, 56),
    new THREE.TorusGeometry(0.32, 0.14, 16, 40).translate(0, L, 0),
    new THREE.BoxGeometry(0.34, L - 0.9, 0.22, 2, 28, 2).translate(0, L / 2 + 0.02, 0),
    new THREE.BoxGeometry(0.08, L - 1.0, 0.46, 1, 28, 2).translate(0.17, L / 2, 0),
    new THREE.BoxGeometry(0.08, L - 1.0, 0.46, 1, 28, 2).translate(-0.17, L / 2, 0),
    new THREE.BoxGeometry(1.7, 0.22, 0.42, 12, 2, 2).translate(0, -0.62, 0), // cap
  ];
  parts.forEach((g) => {
    colorize(g);
    rod.add(new THREE.Mesh(g, fea));
    rod.add(new THREE.Mesh(g, mesh));
  });
  [-0.68, 0.68].forEach((x) => {
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.75, 12), M.steel);
    bolt.position.set(x, -0.45, 0);
    rod.add(bolt);
  });
  rod.position.y = -L / 2 + 0.2;

  // load arrows
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
  // fixed support hatch at big end
  const support = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.0), M.darkSteel);
  support.position.y = -L / 2 - 0.75;
  group.add(support);

  group.rotation.z = 0.12;
  return {
    group,
    update(t) {
      rod.rotation.y = t * 0.35;
      arrows.forEach((a, i) => (a.position.y = L / 2 + 0.75 + Math.sin(t * 3 + i) * 0.08));
    },
  };
}

// 07 · EDUCATION — graduation cap with milestones
function buildCap(M) {
  const group = new THREE.Group();
  const cap = new THREE.Group();
  group.add(cap);
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 2.4), M.navy);
  board.rotation.y = Math.PI / 4;
  const skull = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.7, 48, 1, true), M.navy);
  skull.position.y = -0.4;
  skull.material.side = THREE.DoubleSide;
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
  group.add(ring);
  // books
  const bookCols = [M.cyan, M.violet, M.pink];
  bookCols.forEach((m, i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.6 - i * 0.15, 0.22, 1.1 - i * 0.1), m);
    b.position.y = -1.8 + i * 0.23;
    b.rotation.y = i * 0.25;
    group.add(b);
  });
  return {
    group,
    update(t) {
      cap.rotation.y = t * 0.4;
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
function buildGlobe(M) {
  const group = new THREE.Group();
  const R = 2;
  const globe = new THREE.Group();
  group.add(globe);
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.98, 48, 48), new THREE.MeshStandardMaterial({ color: 0x0b1224, metalness: 0.6, roughness: 0.6 })));
  globe.add(new THREE.Mesh(new THREE.IcosahedronGeometry(R, 4), new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.12 })));
  // dotted latitude bands
  const dots = [];
  for (let lat = -80; lat <= 80; lat += 10) {
    const n = Math.round(36 * Math.cos(THREE.MathUtils.degToRad(lat)));
    for (let k = 0; k < n; k++) dots.push(...latLon(lat, (k / n) * 360, R * 1.005).toArray());
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute(dots, 3));
  globe.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xa78bfa, size: 0.035 })));
  // Odisha, India beacon
  const home = latLon(20.3, 84.5, R);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), M.pink);
  beacon.position.copy(home);
  globe.add(beacon);
  const pulses = [0, 1].map(() => {
    const p = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.11, 32), new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, side: THREE.DoubleSide }));
    p.position.copy(home).multiplyScalar(1.01);
    p.lookAt(home.clone().multiplyScalar(2));
    globe.add(p);
    return p;
  });
  const beam = tube(home, home.clone().multiplyScalar(1.35), 0.012, M.pink);
  globe.add(beam);
  // face India toward the viewer initially
  globe.rotation.y = -THREE.MathUtils.degToRad(84.5) - Math.PI / 2;

  // paper plane
  const planeGeo = new THREE.BufferGeometry();
  const v = [
    0.5, 0, 0, -0.4, 0, 0.35, -0.3, 0, 0,
    0.5, 0, 0, -0.3, 0, 0, -0.4, 0, -0.35,
    0.5, 0, 0, -0.3, 0, 0, -0.4, -0.13, 0,
  ];
  planeGeo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  planeGeo.computeVertexNormals();
  const plane = new THREE.Mesh(planeGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.5 }));
  const orbit = new THREE.Group();
  orbit.rotation.set(0.4, 0, 0.3);
  orbit.add(plane);
  group.add(orbit);
  const lbl = makeLabel("let's talk →", { color: '#a5f3fc', size: 44 });
  lbl.position.set(0, -2.9, 0);
  group.add(lbl);
  return {
    group,
    update(t) {
      globe.rotation.y += 0.002;
      const a = t * 0.7;
      plane.position.set(Math.cos(a) * 2.8, Math.sin(a * 2) * 0.2, Math.sin(a) * 2.8);
      plane.rotation.y = -a - Math.PI / 2 + Math.PI;
      plane.rotation.z = Math.sin(a * 2) * 0.2;
      pulses.forEach((p, i) => {
        const k = (t * 0.6 + i * 0.5) % 1;
        p.scale.setScalar(1 + k * 5);
        p.material.opacity = 1 - k;
      });
    },
  };
}

/* =================================================================
   Helpers
================================================================= */
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
  // lightening holes
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
  const r = h / 2 - 2;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(2, 2, w - 4, h - 4, r);
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
  const scale = 0.0085;
  sp.scale.set(w * scale, h * scale, 1);
  return sp;
}

function makeStars(n, depth) {
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const palette = [new THREE.Color(0xffffff), new THREE.Color(0x22d3ee), new THREE.Color(0xa78bfa), new THREE.Color(0xf472b6)];
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 80;
    pos[i * 3 + 1] = 20 - Math.random() * (depth + 40);
    pos[i * 3 + 2] = -Math.random() * 40 - 4;
    const c = palette[Math.random() < 0.7 ? 0 : 1 + Math.floor(Math.random() * 3)];
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true }));
}

function makeEnvScene() {
  const env = new THREE.Scene();
  const geo = new THREE.SphereGeometry(10, 32, 16);
  const mat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true });
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const top = new THREE.Color(0x8ab4ff), mid = new THREE.Color(0x1b1f3a), bottom = new THREE.Color(0x3b0d3a);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 10;
    const c = y > 0 ? mid.clone().lerp(top, y) : mid.clone().lerp(bottom, -y);
    cols.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  env.add(new THREE.Mesh(geo, mat));
  // a couple of bright "softbox" panels for metal highlights
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
