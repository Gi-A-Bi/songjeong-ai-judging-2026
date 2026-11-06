// UI: 캐릭터 고르기, HUD, 작품 목록, 작품 보기
const byId = id => document.getElementById(id);
const viewer = byId('viewer'), vstage = byId('vstage'), listDialog = byId('list'), pick = byId('pick');
let currentRoom = null, works = [], workIndex = 0, pageIndex = 0, zoom = 1, chosen = 'robot';
try { chosen = localStorage.getItem('sj-avatar') in AVATARS ? localStorage.getItem('sj-avatar') : 'robot'; } catch (e) {}

function el(tag, props = {}, ...children) { const n = document.createElement(tag); Object.assign(n, props); n.append(...children); return n; }
function button(label, action, props = {}) { const n = el('button', {textContent:label, ...props}); n.addEventListener('click', action); return n; }
function toast(text) { const t = byId('toast'); t.textContent = text; t.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), 2600); }

/* ── 캐릭터 고르기 ───────────────────────── */
const avatarCanvases = [];
function drawAvatar(g, kind, frame) {
  const s = (ART.on && ART.charSprite(kind, 'down', frame)) || sprite(kind, 'down', frame);
  const k = Math.min(48 / s.width, 64 / s.height), w = Math.round(s.width * k), h = Math.round(s.height * k);
  g.clearRect(0, 0, 48, 64); g.drawImage(s, Math.round((48 - w) / 2), 64 - h, w, h);
}
function avatarCard(kind) {
  const c = document.createElement('canvas'); c.width = 48; c.height = 64; c.setAttribute('aria-hidden', 'true');
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; drawAvatar(g, kind, 0);
  avatarCanvases.push({c, g, kind});
  const b = button('', () => select(kind), {className:'avatar-card'});
  b.dataset.kind = kind; b.setAttribute('aria-pressed', String(kind === chosen));
  b.append(c, el('span', {}, AVATARS[kind].name));
  return b;
}
function select(kind) {
  chosen = kind;
  document.querySelectorAll('.avatar-card').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.kind === kind)));
}
byId('avatars').replaceChildren(...Object.keys(AVATARS).map(avatarCard));
ART.load().then(() => { for (const a of avatarCanvases) drawAvatar(a.g, a.kind, 0); });
let avatarFrame = 0;
setInterval(() => {                       // 선택 화면에서 캐릭터가 제자리걸음
  if (!pick.open) return;
  avatarFrame = (avatarFrame + 1) % 4;
  const f = [0, 1, 0, 2][avatarFrame];
  for (const a of avatarCanvases) drawAvatar(a.g, a.kind, a.kind === chosen ? f : 0);
}, 220);
// 생성 이미지와 픽셀 글꼴을 먼저 불러온 뒤 시작 (글꼴은 2초까지만 기다림)
const fontReady = document.fonts ? Promise.race([document.fonts.load('28px "Galmuri11 Bold"').catch(() => {}), new Promise(r => setTimeout(r, 2000))]) : Promise.resolve();
const artReady = Promise.all([ART.load(), fontReady]);
byId('pickGo').addEventListener('click', () => {
  try { localStorage.setItem('sj-avatar', chosen); } catch (e) {}
  pick.close();
  artReady.then(() => { Game.start(chosen); byId('world').focus({preventScroll:true}); });
});
byId('pickOpen').addEventListener('click', () => { Game.clearKeys(); pick.showModal(); });
pick.addEventListener('cancel', ev => { if (!Game.map) ev.preventDefault(); });

/* ── HUD ───────────────────────────────── */
Game.on('enter', map => {
  currentRoom = ROOMS.find(r => r.id === map.id) || null;
  byId('place').textContent = currentRoom ? currentRoom.icon + ' ' + currentRoom.label : '🏡 중앙 광장';
  document.querySelectorAll('#nav button').forEach(n => n.toggleAttribute('aria-current', (n.dataset.room || '') === (currentRoom ? currentRoom.id : '')));
  const hash = currentRoom ? '#' + currentRoom.id : '';
  if (location.hash !== hash) history.replaceState(null, '', location.pathname + location.search + hash);
  toast(currentRoom ? currentRoom.intro + ' 🏆 수상작은 입구 앞 금색 줄에 있어요.' : '방향키나 화면 터치로 걸어 전시관 문으로 들어가요.');
});
Game.on('near', e => {
  const p = byId('prompt');
  p.hidden = !e;
  if (e) p.textContent = '👀 ' + e.work.title + ' 보기';
});
byId('prompt').addEventListener('click', () => Game.interact());

byId('nav').append(button('🏡 중앙 광장', () => go('village')));
for (const room of ROOMS) { const b = button(room.icon + ' ' + room.label, () => go(room.id)); b.dataset.room = room.id; byId('nav').append(b); }
function go(id) {
  artReady.then(() => {
    if (!Game.map) { pick.close(); Game.start(chosen); }
    if (Game.map.id !== id) Game.enter(id);
    byId('world').focus({preventScroll:true});
  });
}

document.querySelectorAll('.dpad [data-dir]').forEach(b => {
  const hold = ev => { ev.preventDefault(); Game.setHeld(b.dataset.dir); b.setPointerCapture?.(ev.pointerId); };
  const release = () => Game.setHeld(null);
  b.addEventListener('pointerdown', hold); b.addEventListener('pointerup', release); b.addEventListener('pointercancel', release); b.addEventListener('lostpointercapture', release);
  b.addEventListener('contextmenu', ev => ev.preventDefault());
});
const KEYMAP = {ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', w:'up', s:'down', a:'left', d:'right', W:'up', S:'down', A:'left', D:'right'};
document.addEventListener('keydown', ev => {
  if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
  if (viewer.open) {
    const h = {ArrowLeft:() => goPage(-1) || goWork(-1), ArrowRight:() => goPage(1) || goWork(1), '+':() => setZoom(zoom + 1), '-':() => setZoom(zoom - 1)}[ev.key];
    if (h && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) { h(); ev.preventDefault(); }
    return;
  }
  if (listDialog.open || pick.open || /INPUT|TEXTAREA/.test(document.activeElement?.tagName)) return;
  if (KEYMAP[ev.key]) { Game.keyDown(KEYMAP[ev.key]); ev.preventDefault(); }
  else if (ev.key === ' ' || ev.key === 'Enter') { if (document.activeElement === byId('world') || document.activeElement === document.body) { if (Game.interact()) ev.preventDefault(); } }
});
document.addEventListener('keyup', ev => { if (KEYMAP[ev.key]) Game.keyUp(KEYMAP[ev.key]); });
window.addEventListener('blur', () => Game.clearKeys());

/* ── 작품 목록 ─────────────────────────── */
function listWorks() { return Game.map.exhibits.map(e => e.work); }
function renderList() {
  const map = Game.map, room = currentRoom;
  const query = byId('search').value.trim().toLowerCase();
  const all = map.exhibits;
  const shown = query ? all.filter(e => (e.work.title + ' ' + e.zone + ' ' + (e.work.note || '')).toLowerCase().includes(query)) : all;
  const zones = new Map();
  for (const e of shown.filter(e => e.zone === AWARD_ZONE).concat(shown.filter(e => e.zone !== AWARD_ZONE))) { if (!zones.has(e.zone)) zones.set(e.zone, []); zones.get(e.zone).push(e); }
  const zoneId = name => 'zone-' + encodeURIComponent(name).replace(/%/g, '');
  byId('sections').replaceChildren(...([...zones].map(([name, list]) => el('section', {className:'zone'},
    el('h3', {className:'zone-title', id:zoneId(name), tabIndex:-1}, name, ' ', el('small', {}, list.length + '편')),
    el('div', {className:'cards'}, ...list.map(e => card(room, e))))).concat(zones.size ? [] : [el('p', {className:'empty'}, '찾는 작품이 없어요.')])));
  byId('zones').replaceChildren(...[...zones].map(([name, list]) => { const b = button(name, () => { const t = byId(zoneId(name)); t.scrollIntoView({block:'start'}); t.focus({preventScroll:true}); }); b.dataset.count = list.length; return b; }));
  byId('count').textContent = query ? all.length + '편 중 ' + shown.length + '편' : '모두 ' + all.length + '편 · ' + zones.size + '개 구역';
}
function card(room, e) {
  const work = e.work, image = work.pages.find(p => p.image);
  const thumb = el('span', {className:'thumb'});
  if (image || work.thumb) thumb.append(el('img', {src:work.thumb || image.image, alt:'', loading:'lazy'})); else { thumb.textContent = room.icon; thumb.setAttribute('aria-hidden', 'true'); }
  const award = awardOf(work);
  const note = (award ? awardIcon(award) + ' ' + awardLabel(award) + (award.student ? ' · ' + award.student : '') + (work.note ? ' · ' : '') : '') + (work.note || (!award && work.pages.length > 1 ? work.pages.length + '쪽' : ''));
  const b = button('', () => { listDialog.close(); Game.goToExhibit(e, true); }, {className:'card' + (award ? ' award' : '')});
  b.append(thumb, el('span', {className:'card-body'}, el('span', {className:'card-title'}, work.title), note ? el('span', {className:'card-note'}, note) : ''));
  b.setAttribute('aria-label', work.title + ', 작품 앞으로 가서 보기');
  return b;
}
byId('listOpen').innerHTML = '📋<span class="hud-label"> 작품 목록</span>';
byId('listOpen').addEventListener('click', () => {
  if (!Game.map) return;
  Game.clearKeys();
  if (!currentRoom) {
    // 광장에서는 전시관을 고르게 한다
    byId('listTitle').textContent = '어느 전시관으로 갈까요?';
    byId('zones').replaceChildren(); byId('count').textContent = ''; byId('search').value = '';
    byId('sections').replaceChildren(el('div', {className:'cards rooms'}, ...ROOMS.map(r => { const b = button('', () => { listDialog.close(); go(r.id); }, {className:'card'}); b.append(el('span', {className:'thumb', ariaHidden:'true'}, r.icon), el('span', {className:'card-body'}, el('span', {className:'card-title'}, r.label), el('span', {className:'card-note'}, WORKS.filter(w => w.category === r.id).length + '편 · ' + r.hint))); return b; })));
  } else {
    byId('listTitle').textContent = currentRoom.icon + ' ' + currentRoom.label + ' 작품 목록';
    byId('search').value = '';
    renderList();
  }
  listDialog.showModal();
});
byId('search').addEventListener('input', () => currentRoom && renderList());
listDialog.addEventListener('close', () => byId('world').focus({preventScroll:true}));

/* ── 작품 보기 ─────────────────────────── */
function openWork(work, trigger) {
  works = listWorks();
  workIndex = works.indexOf(work); pageIndex = 0;
  Game.clearKeys();
  renderWork();
  viewer.showModal();
}
function setZoom(level) {
  zoom = Math.max(1, Math.min(4, level));
  vstage.classList.toggle('zoomed', zoom > 1);
  vstage.style.setProperty('--zoom', zoom);
  byId('zoomIn').disabled = zoom >= 4; byId('zoomOut').disabled = zoom <= 1;
  if (zoom === 1) vstage.scrollTo(0, 0);
}
function renderWork() {
  const work = works[workIndex], page = work.pages[pageIndex], total = work.pages.length;
  const aw = awardOf(work);
  byId('chip').textContent = currentRoom.label + (aw ? ' · ' + awardIcon(aw) + ' ' + awardLabel(aw) : work.zone ? ' · ' + work.zone : '');
  byId('title').textContent = work.title;
  byId('byline').textContent = aw && aw.student ? aw.student : '';
  byId('byline').hidden = !(aw && aw.student);
  setZoom(1);
  if (page.image) {
    const img = el('img', {src:page.image, alt:page.alt || work.title, decoding:'async'});
    img.addEventListener('click', () => setZoom(zoom > 1 ? 1 : 2));
    vstage.replaceChildren(el('figure', {}, img));
    byId('caption').textContent = page.alt || ''; byId('caption').hidden = !page.alt;
  } else { vstage.replaceChildren(el('div', {className:'text'}, page.text || '')); byId('caption').hidden = true; }
  byId('zoomTools').hidden = !page.image;
  byId('pageTools').hidden = total === 1;
  byId('page').textContent = total > 1 ? (pageIndex + 1) + ' / ' + total + '쪽' : '작품 ' + (workIndex + 1) + ' / ' + works.length;
  byId('prevPage').disabled = pageIndex === 0; byId('nextPage').disabled = pageIndex === total - 1;
  byId('prevWork').disabled = workIndex === 0; byId('nextWork').disabled = workIndex === works.length - 1;
  vstage.scrollTo(0, 0);
}
function goPage(d) { const n = pageIndex + d; if (n < 0 || n >= works[workIndex].pages.length) return false; pageIndex = n; renderWork(); return true; }
function goWork(d) { const n = workIndex + d; if (n < 0 || n >= works.length) return false; workIndex = n; pageIndex = 0; renderWork(); return true; }
byId('prevPage').onclick = () => goPage(-1); byId('nextPage').onclick = () => goPage(1);
byId('prevWork').onclick = () => goWork(-1); byId('nextWork').onclick = () => goWork(1);
byId('zoomIn').onclick = () => setZoom(zoom + 1); byId('zoomOut').onclick = () => setZoom(zoom - 1);
viewer.addEventListener('close', () => {
  // 마지막으로 본 작품 앞으로 이동
  const e = Game.map.exhibits.find(e => e.work === works[workIndex]);
  if (e && !(Game.player.x >= e.x - 1 && Game.player.x <= e.x + e.w && (Game.player.y === e.y + 1 || Game.player.y === e.y + 2))) Game.goToExhibit(e, true, true);
  byId('world').focus({preventScroll:true});
});
Game.on('interact', e => openWork(e.work));
let touchStart = null;
vstage.addEventListener('touchstart', ev => { touchStart = zoom === 1 && ev.touches.length === 1 ? {x:ev.touches[0].clientX, y:ev.touches[0].clientY} : null; }, {passive:true});
vstage.addEventListener('touchend', ev => { if (!touchStart) return; const dx = ev.changedTouches[0].clientX - touchStart.x, dy = ev.changedTouches[0].clientY - touchStart.y; touchStart = null; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? goPage(1) || goWork(1) : goPage(-1) || goWork(-1)); }, {passive:true});

/* ── 시작 ─────────────────────────────── */
window.addEventListener('hashchange', () => { const r = ROOMS.find(r => '#' + r.id === location.hash); const id = r ? r.id : 'village'; if (Game.map && Game.map.id !== id) Game.enter(id); });
const startRoom = ROOMS.find(r => '#' + r.id === location.hash);
pick.showModal();
pick.addEventListener('close', () => { if (startRoom && Game.map && Game.map.id === 'village' && !pick.dataset.started) { pick.dataset.started = '1'; Game.enter(startRoom.id); } }, {once:true});
