// VER-DÉ Spatial Cinema — hands-first independent-film discovery in WebXR.
// Seated: every control floats within arm's reach. Select by pinching (hand ray)
// or by touching a button with your index finger. Desktop preview: click.
import * as THREE from 'three';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';

// ── Catalog (published VER-DÉ works) ────────────────────────────────────────
const FILMS = {
  'bagsak': { title: 'BAGSAK', access: 'free', video: 'films/bagsak.mp4', yt: 'jYSCtwO8t_o',
    subject: 'A childhood report card and four family voices judging a man across his life.',
    synopsis: 'Thirty-nine years of being told what I am. This is year forty. One report card. Four voices. No reply.', themes: ['childhood', 'family', 'judgement'] },
  'sentensyador': { title: 'SENTENSYADOR', access: 'free', yt: '4eCo3NZvG14',
    subject: 'A man sentenced by everyone who knows him.',
    synopsis: 'A man is sentenced by everyone who knows him. He does not argue. He shrugs, and walks.', themes: ['judgement', 'endurance'] },
  'project-39-rebuild': { title: 'PROJECT 39: REBUILD', access: 'founding', yt: 'yBTwnDkEcOc',
    subject: 'A Filipino man returns to the land after losing his restaurant and his farm’s promise.',
    synopsis: 'He loses everything, mocked by his father, his relatives, his community. He returns to the only thing that still asks nothing of him: the land.', themes: ['loss', 'land', 'rebuilding'] },
  'the-wilderness-original': { title: 'THE WILDERNESS', access: 'founding', yt: 'WOD2cUUMFuQ',
    subject: 'The guardian walking beside a child through the dry years.',
    synopsis: 'Project 39, Chapter II. The guardian that walks beside a child through the dry years.', themes: ['childhood', 'guardian'] },
  'maraming-kamay': { title: 'MARAMING KAMAY', access: 'founding', yt: 'zdYKfAKUkPg',
    subject: 'The family hands that worked the ground before him.',
    synopsis: 'You will not inherit this land. You will only borrow it. Like me.', themes: ['land', 'inheritance'] },
  'the-storm-answers': { title: 'THE STORM ANSWERS', access: 'founding', yt: '55-tFh4IAzA',
    subject: 'A farmer speaks to God after a storm.',
    synopsis: 'A farmer loses everything to the storm and screams at God. The storm answers back in questions.', themes: ['storm', 'faith'] }
};

const MOODS = [
  { label: 'Being judged', query: 'Something about being judged.', films: ['bagsak', 'sentensyador', 'project-39-rebuild'] },
  { label: 'Something hopeful', query: 'Something emotional, but hopeful.', films: ['project-39-rebuild', 'the-wilderness-original', 'bagsak'] },
  { label: 'About the land', query: 'A film about the land.', films: ['project-39-rebuild', 'maraming-kamay', 'the-wilderness-original'] },
  { label: 'The storm and faith', query: 'A film about a storm and faith.', films: ['the-storm-answers', 'project-39-rebuild', 'bagsak'] },
  { label: 'Surprise me', query: 'Surprise me.', films: null }
];

// ── Memory ─────────────────────────────────────────────────────────────────
const STORE = 'verde.spatial.v1';
function loadMemory() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } }
function saveMemory(m) { try { localStorage.setItem(STORE, JSON.stringify(m)); } catch { /* optional */ } }
if (new URLSearchParams(location.search).has('reset')) saveMemory({});

// ── Renderer, scene, room ──────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060806);
scene.fog = new THREE.Fog(0x060806, 6, 16);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 50);
camera.position.set(0, 1.22, 0.35);
camera.lookAt(0, 1.3, -3);

scene.add(new THREE.HemisphereLight(0x9fd0ae, 0x080a08, 0.35));
const lamp = new THREE.PointLight(0xffb066, 6, 6, 1.6);  // warm lamp, like the bench at home
lamp.position.set(-1.6, 1.4, -0.4);
scene.add(lamp);

const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 48), new THREE.MeshStandardMaterial({ color: 0x0d100d, roughness: 1 }));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Rain-dark walls: a soft dome so the room feels enclosed but not empty.
const walls = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 7, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0x0a0d0a, side: THREE.BackSide, roughness: 1 }));
walls.position.y = 3.5;
scene.add(walls);

// ── The cinema screen ──────────────────────────────────────────────────────
const SCREEN_W = 5.2, SCREEN_H = SCREEN_W * 9 / 16;
const screenCanvas = document.createElement('canvas');
screenCanvas.width = 1920; screenCanvas.height = 1080;
const screenCtx = screenCanvas.getContext('2d');
const screenCanvasTex = new THREE.CanvasTexture(screenCanvas);
screenCanvasTex.colorSpace = THREE.SRGBColorSpace;
const screenMat = new THREE.MeshBasicMaterial({ map: screenCanvasTex, toneMapped: false });
const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
screen.position.set(0, 1.75, -4.6);
scene.add(screen);
const glow = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W + 0.16, SCREEN_H + 0.16), new THREE.MeshBasicMaterial({ color: 0x4e8c63, transparent: true, opacity: 0.35 }));
glow.position.copy(screen.position).add(new THREE.Vector3(0, 0, -0.01));
scene.add(glow);
const screenLight = new THREE.PointLight(0x6fb683, 2.5, 7, 1.5);
screenLight.position.set(0, 1.6, -3.8);
scene.add(screenLight);

const video = document.createElement('video');
video.playsInline = true;
video.crossOrigin = 'anonymous';
video.preload = 'auto';
const videoTex = new THREE.VideoTexture(video);
videoTex.colorSpace = THREE.SRGBColorSpace;

function wrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/); const lines = []; let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function paintScreenTitle(kicker, title, body) {
  const c = screenCtx; c.fillStyle = '#080A08'; c.fillRect(0, 0, 1920, 1080);
  const g = c.createRadialGradient(960, 540, 50, 960, 540, 900);
  g.addColorStop(0, 'rgba(78,140,99,0.18)'); g.addColorStop(1, 'rgba(8,10,8,0)');
  c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
  c.textAlign = 'center';
  c.fillStyle = '#6FB683'; c.font = '600 34px monospace'; c.fillText(kicker, 960, 360);
  c.fillStyle = '#E9E7DE'; c.font = '700 150px Georgia, serif'; c.fillText(title, 960, 540);
  c.fillStyle = '#B9BDB4'; c.font = 'italic 46px Georgia, serif';
  wrap(c, body, 1400).slice(0, 4).forEach((l, i) => c.fillText(l, 960, 660 + i * 64));
  screenMat.map = screenCanvasTex; screenCanvasTex.needsUpdate = true; screenMat.needsUpdate = true;
}
function idleScreen() { paintScreenTitle('INDEPENDENT CINEMA · NABUA, CAMARINES SUR', 'VER-DÉ', 'Tell the cinema how you feel.'); }

// ── Floating hand-reach UI ─────────────────────────────────────────────────
const ui = new THREE.Group();
ui.position.set(0, 1.0, -0.62);    // chest height, inside arm's reach when seated
ui.rotation.x = -0.32;             // tilted toward the viewer's eyes
scene.add(ui);

const buttons = [];  // interactive meshes

function makePanel(w, h, draw, onSelect) {
  const cw = Math.round(w * 4096), ch = Math.round(h * 4096);
  const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  mesh.userData = { w, h, canvas, tex, draw, onSelect, hover: false };
  mesh.userData.repaint = () => { const c = canvas.getContext('2d'); c.clearRect(0, 0, cw, ch); draw(c, cw, ch, mesh.userData.hover); tex.needsUpdate = true; };
  mesh.userData.repaint();
  if (onSelect) buttons.push(mesh);
  return mesh;
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

function chip(label, onSelect, w = 0.2, accent = false) {
  return makePanel(w, 0.06, (c, cw, ch, hover) => {
    roundRect(c, 4, 4, cw - 8, ch - 8, ch / 2 - 4);
    c.fillStyle = hover ? '#E9E7DE' : '#0F1310'; c.fill();
    c.lineWidth = 6; c.strokeStyle = hover ? '#E9E7DE' : (accent ? '#6FB683' : '#3A423C'); c.stroke();
    c.fillStyle = hover ? '#080A08' : (accent ? '#6FB683' : '#E9E7DE');
    c.font = `600 ${Math.round(ch * 0.36)}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(label, cw / 2, ch / 2 + 2);
  }, onSelect);
}

function textLine(text, w, h, size = 0.4, color = '#E9E7DE', italic = false) {
  return makePanel(w, h, (c, cw, ch) => {
    c.fillStyle = color; c.font = `${italic ? 'italic ' : ''}${Math.round(ch * size)}px Georgia, serif`;
    c.textAlign = 'center'; c.textBaseline = 'top';
    wrap(c, text, cw * 0.94).slice(0, 3).forEach((l, i) => c.fillText(l, cw / 2, i * ch * size * 1.18 + 6));
  });
}

const posters = {};
function posterFor(id) {
  if (posters[id] !== undefined) return posters[id];
  posters[id] = null;
  const f = FILMS[id]; if (!f.yt) return null;
  const img = new Image(); img.crossOrigin = 'anonymous';
  img.onload = () => { posters[id] = img; buttons.forEach(b => b.userData.filmId === id && b.userData.repaint()); };
  img.src = `https://i.ytimg.com/vi/${f.yt}/hqdefault.jpg`;
  return null;
}

function filmCard(id, reason, note) {
  const f = FILMS[id];
  const card = makePanel(0.19, 0.27, (c, fullW, fullH, hover) => {
    c.save(); c.scale(2, 2); const cw = fullW / 2, ch = fullH / 2;
    roundRect(c, 6, 6, cw - 12, ch - 12, 28);
    c.fillStyle = hover ? '#161C18' : '#0F1310'; c.fill();
    c.lineWidth = hover ? 12 : 6; c.strokeStyle = hover ? '#6FB683' : '#3A423C'; c.stroke();
    const artH = ch * 0.4;
    c.save(); roundRect(c, 16, 16, cw - 32, artH, 20); c.clip();
    const img = posters[id] || posterFor(id);
    if (img) c.drawImage(img, 0, 45, 480, 270, 16, 16, cw - 32, artH);
    else { const g = c.createLinearGradient(0, 0, cw, artH); g.addColorStop(0, '#1d2a21'); g.addColorStop(1, '#0b0f0c'); c.fillStyle = g; c.fillRect(16, 16, cw - 32, artH); }
    c.restore();
    c.fillStyle = f.access === 'free' ? '#4E8C63' : '#2a302b'; roundRect(c, 32, artH - 40, 200, 56, 12); c.fill();
    c.fillStyle = f.access === 'free' ? '#080A08' : '#E9E7DE'; c.font = '700 30px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(f.access === 'free' ? 'FREE' : 'FOUNDING', 132, artH - 12);
    c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillStyle = '#E9E7DE'; let ts = 52; do { c.font = `700 ${ts}px Georgia, serif`; ts -= 2; } while (f.title.split(' ').some(w => c.measureText(w).width > cw - 64) && ts > 28);
    wrap(c, f.title, cw - 64).slice(0, 2).forEach((l, i) => c.fillText(l, 32, artH + 40 + i * 58));
    const titleLines = Math.min(2, wrap(c, f.title, cw - 64).length);
    c.fillStyle = '#C9CCC2'; c.font = '34px Georgia, serif';
    wrap(c, reason, cw - 64).slice(0, titleLines > 1 ? 3 : 4).forEach((l, i) => c.fillText(l, 32, artH + 60 + titleLines * 58 + i * 42));
    if (note) { c.fillStyle = '#6FB683'; c.font = 'italic 30px Georgia, serif'; wrap(c, note, cw - 64).slice(0, 2).forEach((l, i) => c.fillText(l, 32, ch - 110 + i * 36)); }
    if (hover) { c.fillStyle = '#E9E7DE'; c.font = '700 32px monospace'; c.fillText(f.access === 'free' ? '▶ PINCH TO WATCH' : '◆ PINCH TO OPEN', 32, ch - 60); }
    c.restore();
  }, () => openFilm(id));
  card.userData.filmId = id;
  return card;
}

function clearUI() {
  for (const child of [...ui.children]) {
    ui.remove(child);
    const i = buttons.indexOf(child); if (i >= 0) buttons.splice(i, 1);
    child.material.map?.dispose(); child.material.dispose(); child.geometry.dispose();
  }
}

function place(mesh, x, y, z = 0) { mesh.position.set(x, y, z); ui.add(mesh); return mesh; }

// ── Screens of the experience ──────────────────────────────────────────────
let session = { mood: null, shown: [] };

function showHome() {
  clearUI(); stopVideo(); idleScreen();
  const mem = loadMemory();
  const last = mem.lastWatched && FILMS[mem.lastWatched];
  place(textLine(last ? `Welcome back. Last time, you watched ${last.title}.` : 'What does the moment call for?', 0.62, 0.07, 0.42), 0, 0.2);
  if (last) {
    place(chip(`Something like ${last.title}`, () => recommend({ label: `Something like ${last.title}`, query: `Something like ${last.title}.`, films: likeFilms(mem.lastWatched) }), 0.3, true), -0.16, 0.11);
    place(chip('Something new', () => recommend(MOODS[4]), 0.2), 0.12, 0.11);
  }
  const top = last ? 0.02 : 0.1;
  MOODS.slice(0, 4).forEach((m, i) => place(chip(m.label, () => recommend(m), 0.22), (i % 2 ? 0.12 : -0.12), top - Math.floor(i / 2) * 0.075));
  if (!last) place(chip('Surprise me', () => recommend(MOODS[4]), 0.22, true), 0, top - 0.15);
}

function likeFilms(id) {
  const themes = new Set(FILMS[id].themes);
  return Object.keys(FILMS).filter(k => k !== id)
    .map(k => ({ k, s: FILMS[k].themes.filter(t => themes.has(t)).length }))
    .sort((a, b) => b.s - a.s).slice(0, 3).map(x => x.k);
}

function surprise() {
  const mem = loadMemory();
  const pool = Object.keys(FILMS).filter(k => k !== mem.lastWatched);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, 3);
}

async function askEngine(ids, query) {
  const films = ids.map(id => ({ id, title: FILMS[id].title, subject: FILMS[id].subject, synopsis: FILMS[id].synopsis, themes: FILMS[id].themes, runtime: '', language: [], format: '', access: FILMS[id].access, award: '' }));
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch('/api/engine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
      body: JSON.stringify({ action: 'enrich', userMessage: query, films, context: { household: 'watching alone', isOpenDiscovery: /surprise/i.test(query), conceptNames: [] } }) });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    return data && Array.isArray(data.reasons) ? data : null;
  } catch { return null; }
}

async function recommend(mood) {
  const ids = mood.films || surprise();
  session = { mood, shown: ids };
  clearUI();
  place(textLine(`“${mood.label}”`, 0.6, 0.05, 0.5, '#B9BDB4', true), 0, 0.2);
  const thinking = place(textLine('Listening to the moment…', 0.6, 0.06, 0.45), 0, 0.12);
  const ai = await askEngine(ids, mood.query);
  if (session.mood !== mood) return;   // viewer moved on
  ui.remove(thinking);
  const reasons = {}; if (ai) ai.reasons.forEach(r => { reasons[r.filmId] = r.reason; });
  place(textLine(ai?.chatMessage || 'These are the closest films for the moment.', 0.62, 0.06, 0.42), 0, 0.14);
  const mem = loadMemory();
  ids.forEach((id, i) => {
    const note = mem.lastWatched && FILMS[mem.lastWatched] && id !== mem.lastWatched && FILMS[id].themes.some(t => FILMS[mem.lastWatched].themes.includes(t)) ? `Close to ${FILMS[mem.lastWatched].title}, which you watched.` : '';
    place(filmCard(id, reasons[id] || FILMS[id].subject, note), (i - 1) * 0.205, -0.04);
  });
  place(chip('Change the mood', showHome, 0.22), -0.12, -0.215);
  place(chip('Another three', () => recommend(MOODS[4]), 0.22), 0.12, -0.215);
}

function openFilm(id) {
  const f = FILMS[id];
  if (f.video) return playFilm(id);
  clearUI();
  if (f.access === 'founding') paintScreenTitle('FOUNDING ACCESS · ONE PAYMENT · LIFETIME ACCESS', f.title, f.synopsis + '  Unlock at ver-de.com');
  else paintScreenTitle('FREE ON VER-DÉ · COMING TO SPATIAL CINEMA', f.title, f.synopsis + '  Watch now at ver-de.com');
  place(textLine(f.access === 'founding' ? 'This film supports the filmmaker directly. Unlock it at ver-de.com.' : 'This film is free at ver-de.com and comes here next.', 0.62, 0.06, 0.42), 0, 0.1);
  place(chip('Back to the films', () => session.mood ? recommend(session.mood) : showHome(), 0.26, true), 0, 0);
}

function playFilm(id) {
  const f = FILMS[id];
  const mem = loadMemory(); mem.lastWatched = id; mem.at = Date.now(); saveMemory(mem);
  clearUI();
  video.src = f.video; video.currentTime = 0;
  screenMat.map = videoTex; screenMat.needsUpdate = true;
  video.play().catch(() => paintScreenTitle('PLAYBACK', f.title, 'Pinch Play to start the film.'));
  ui.position.y = 0.82;   // controls drop low so the screen is unobstructed
  place(textLine(`Now playing · ${f.title}`, 0.5, 0.05, 0.45, '#6FB683'), 0, 0.09);
  place(chip('Pause / Play', () => (video.paused ? video.play() : video.pause()), 0.2), -0.11, 0);
  place(chip('Back', () => { ui.position.y = 1.0; session.mood ? recommend(session.mood) : showHome(); }, 0.2, true), 0.11, 0);
}

function stopVideo() { video.pause(); video.removeAttribute('src'); video.load(); ui.position.y = 1.0; }
video.addEventListener('playing', () => { screenMat.map = videoTex; screenMat.needsUpdate = true; });
video.addEventListener('ended', () => { ui.position.y = 1.0; showHome(); });

// ── Input: hand rays (pinch), fingertip touch, desktop mouse ───────────────
const raycaster = new THREE.Raycaster();
const tmpM = new THREE.Matrix4();
const handFactory = new XRHandModelFactory();
const rays = [];

for (let i = 0; i < 2; i++) {
  const ctrl = renderer.xr.getController(i);
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: 0x6fb683, transparent: true, opacity: 0.6 }));
  line.scale.z = 1.2; ctrl.add(line);
  ctrl.addEventListener('select', () => { const hit = hitFrom(ctrl); if (hit) select(hit); });
  scene.add(ctrl);
  rays.push(ctrl);
  const hand = renderer.xr.getHand(i);
  hand.add(handFactory.createHandModel(hand, 'mesh'));
  hand.userData.touching = null;
  scene.add(hand);
}

function hitFrom(ctrl) {
  tmpM.identity().extractRotation(ctrl.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(ctrl.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tmpM);
  const hit = raycaster.intersectObjects(buttons, false)[0];
  return hit ? hit.object : null;
}

let selectLock = 0;
function select(mesh) {
  const now = performance.now(); if (now - selectLock < 350) return; selectLock = now;
  mesh.userData.onSelect();
}

function setHover(set) {
  for (const b of buttons) {
    const on = set.has(b);
    if (on !== b.userData.hover) { b.userData.hover = on; b.scale.setScalar(on ? 1.06 : 1); b.userData.repaint(); }
  }
}

const tipLocal = new THREE.Vector3();
function fingertipTouches(hovered) {
  for (let i = 0; i < 2; i++) {
    const hand = renderer.xr.getHand(i);
    const tip = hand.joints && hand.joints['index-finger-tip'];
    if (!tip || !tip.visible) continue;
    let touching = null;
    for (const b of buttons) {
      tipLocal.setFromMatrixPosition(tip.matrixWorld); b.worldToLocal(tipLocal);
      if (Math.abs(tipLocal.x) < b.userData.w / 2 && Math.abs(tipLocal.y) < b.userData.h / 2) {
        if (tipLocal.z < 0.04 && tipLocal.z > -0.03) hovered.add(b);
        if (tipLocal.z < 0.012 && tipLocal.z > -0.03) touching = b;
      }
    }
    if (touching && hand.userData.touching !== touching) select(touching);
    hand.userData.touching = touching;
  }
}

// Desktop preview: mouse hover and click.
const mouse = new THREE.Vector2(); let mouseHit = null;
renderer.domElement.addEventListener('pointermove', e => {
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(mouse, camera);
  mouseHit = raycaster.intersectObjects(buttons, false)[0]?.object || null;
});
renderer.domElement.addEventListener('click', () => { if (mouseHit && !renderer.xr.isPresenting) select(mouseHit); });

// ── Enter VR ───────────────────────────────────────────────────────────────
const enterBtn = document.getElementById('enter');
async function setupEnter() {
  const ok = navigator.xr && await navigator.xr.isSessionSupported('immersive-vr').catch(() => false);
  if (!ok) { enterBtn.textContent = 'NO HEADSET — DESKTOP PREVIEW'; return; }
  enterBtn.disabled = false; enterBtn.textContent = 'ENTER THE CINEMA';
  enterBtn.onclick = async () => {
    const xrSession = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'hand-tracking'] });
    await renderer.xr.setSession(xrSession);
    enterBtn.style.display = 'none';
    xrSession.addEventListener('end', () => { enterBtn.style.display = ''; });
  };
}
setupEnter();

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

renderer.setAnimationLoop(() => {
  const hovered = new Set();
  if (renderer.xr.isPresenting) {
    for (const ctrl of rays) { const h = hitFrom(ctrl); if (h) hovered.add(h); }
    fingertipTouches(hovered);
  } else if (mouseHit) hovered.add(mouseHit);
  setHover(hovered);
  lamp.intensity = 5.6 + Math.sin(performance.now() / 700) * 0.4;
  renderer.render(scene, camera);
});

showHome();
window.__verde = { recommend, MOODS, showHome, openFilm };  // used by automated tests
