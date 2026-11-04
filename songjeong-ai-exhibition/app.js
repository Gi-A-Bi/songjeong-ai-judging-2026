// 송정 AI 작품마을 — 광장 이동, 전시관, 작품 감상
const byId = id => document.getElementById(id);
const rooms = [
  {id:'character', label:'캐릭터관', icon:'🤖', x:18, hint:'AI 캐릭터', intro:'친구들이 상상한 AI 캐릭터를 만나 보세요. 카드를 누르면 크게 볼 수 있어요.'},
  {id:'poster',    label:'포스터관', icon:'🖼️', x:50, hint:'AI 활용 포스터', intro:'AI를 바르게 쓰는 방법을 담은 포스터예요. 확대해서 자세히 살펴보세요.'},
  {id:'writing',   label:'글짓기관', icon:'📚', x:82, hint:'AI 글짓기', intro:'AI와 함께하는 미래를 상상한 글이에요. 쪽을 넘기며 읽어 보세요.'}
];
const ZONE_SIZE = 8;
const viewer = byId('viewer');
const stage = byId('stage');
let x = 50, y = 80, currentRoom = null, works = [], workIndex = 0, pageIndex = 0, zoom = 1, opener;

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  node.append(...children);
  return node;
}
function button(label, action, props = {}) {
  const node = el('button', {textContent:label, ...props});
  node.addEventListener('click', action);
  return node;
}

/* ── 광장 ─────────────────────────────────── */
function drawAvatar() {
  byId('avatar').style.left = x + '%';
  byId('avatar').style.top = y + '%';
}
function move(key) {
  const step = {ArrowLeft:[-4,0], ArrowRight:[4,0], ArrowUp:[0,-5], ArrowDown:[0,5]}[key];
  if (!step || byId('plaza').hidden || viewer.open) return false;
  x = Math.max(4, Math.min(96, x + step[0]));
  y = Math.max(50, Math.min(94, y + step[1]));
  drawAvatar();
  const near = rooms.find(room => Math.abs(room.x - x) <= 9);
  if (near && y <= 56) {
    showRoom(near);
  } else {
    byId('plazaStatus').textContent = near && y <= 66 ? near.label + ' 입구 앞이에요. 위로 한 번 더 가면 들어가요.' : '';
  }
  return true;
}

/* ── 전시관 ─────────────────────────────── */
function groupByZone(list) {
  const zones = new Map();
  list.forEach((work, index) => {
    const name = work.zone || (Math.floor(index / ZONE_SIZE) + 1) + '구역';
    if (!zones.has(name)) zones.set(name, []);
    zones.get(name).push(work);
  });
  return zones;
}
function firstImage(work) {
  return work.pages.find(page => page.image);
}
function makeCard(room, work) {
  const image = firstImage(work);
  const thumb = el('span', {className:'thumb'});
  if (image) {
    thumb.append(el('img', {src:image.image, alt:'', loading:'lazy', decoding:'async'}));
  } else {
    thumb.textContent = room.icon;
    thumb.setAttribute('aria-hidden', 'true');
  }
  const pages = work.pages.length;
  const note = work.note || (pages > 1 ? pages + '쪽' : '');
  const card = button('', event => openWork(work, event.currentTarget), {className:'card'});
  card.append(thumb, el('span', {className:'card-body'},
    el('span', {className:'card-title'}, work.title),
    note ? el('span', {className:'card-note'}, note) : ''));
  card.setAttribute('aria-label', work.title + (pages > 1 ? ', ' + pages + '쪽' : '') + ', 크게 보기');
  card.dataset.id = work.id;
  return card;
}
function renderRoom(room) {
  const query = byId('search').value.trim().toLowerCase();
  const all = WORKS.filter(work => work.category === room.id);
  works = query ? all.filter(work => (work.title + ' ' + (work.zone || '') + ' ' + (work.note || '')).toLowerCase().includes(query)) : all;
  const zones = groupByZone(works);
  const sections = [...zones].map(([name, list]) => {
    const id = 'zone-' + encodeURIComponent(name).replace(/%/g, '');
    const title = el('h3', {className:'zone-title', id, tabIndex:-1}, name, ' ', el('small', {}, list.length + '편'));
    const grid = el('div', {className:'cards'}, ...list.map(work => makeCard(room, work)));
    return el('section', {className:'zone'}, title, grid);
  });
  byId('sections').replaceChildren(...(sections.length ? sections : [el('p', {className:'empty'}, '찾는 작품이 없어요. 다른 제목으로 찾아보세요.')]));
  byId('zones').replaceChildren(...[...zones].map(([name, list]) => {
    const node = button(name, () => {
      const target = byId('zone-' + encodeURIComponent(name).replace(/%/g, ''));
      target.scrollIntoView({block:'start'});
      target.focus({preventScroll:true});
    });
    node.dataset.count = list.length;
    return node;
  }));
  byId('count').textContent = query ? all.length + '편 중 ' + works.length + '편' : '모두 ' + works.length + '편 · ' + zones.size + '개 구역';
}
function showRoom(room, {focus = true} = {}) {
  currentRoom = room;
  byId('plaza').hidden = Boolean(room);
  byId('gallery').hidden = !room;
  document.querySelectorAll('#nav button').forEach(node => {
    if ((node.dataset.room || '') === (room ? room.id : '')) node.setAttribute('aria-current', 'page');
    else node.removeAttribute('aria-current');
  });
  const hash = room ? '#' + room.id : '';
  if (location.hash !== hash) history.replaceState(null, '', location.pathname + location.search + hash);
  if (!room) {
    x = 50; y = 80;
    drawAvatar();
    byId('plazaStatus').textContent = '';
    if (focus) byId('nav').firstElementChild.focus();
    return;
  }
  byId('gallery').dataset.room = room.id;
  byId('room').textContent = room.icon + ' ' + room.label;
  byId('roomIntro').textContent = room.intro;
  byId('search').value = '';
  renderRoom(room);
  window.scrollTo({top:0});
  if (focus) byId('room').focus();
}

/* ── 작품 뷰어 ─────────────────────────────── */
function openWork(work, trigger) {
  opener = trigger;
  workIndex = works.indexOf(work);
  pageIndex = 0;
  renderWork();
  viewer.showModal();
}
function setZoom(level) {
  zoom = Math.max(1, Math.min(4, level));
  stage.classList.toggle('zoomed', zoom > 1);
  stage.style.setProperty('--zoom', zoom);
  byId('zoomIn').disabled = zoom >= 4;
  byId('zoomOut').disabled = zoom <= 1;
  if (zoom === 1) stage.scrollTo(0, 0);
}
function renderWork() {
  const work = works[workIndex];
  const page = work.pages[pageIndex];
  const total = work.pages.length;
  byId('chip').textContent = currentRoom.label + (work.zone ? ' · ' + work.zone : '');
  byId('title').textContent = work.title;
  setZoom(1);
  if (page.image) {
    const image = el('img', {src:page.image, alt:page.alt || work.title, decoding:'async'});
    image.addEventListener('click', () => setZoom(zoom > 1 ? 1 : 2));
    stage.replaceChildren(el('figure', {}, image));
    byId('caption').textContent = page.alt || '';
    byId('caption').hidden = !page.alt;
  } else {
    stage.replaceChildren(el('div', {className:'text'}, page.text || ''));
    byId('caption').hidden = true;
  }
  byId('zoomTools').hidden = !page.image;
  byId('pageTools').hidden = total === 1;
  byId('page').textContent = total > 1 ? (pageIndex + 1) + ' / ' + total + '쪽' : '작품 ' + (workIndex + 1) + ' / ' + works.length;
  byId('prevPage').disabled = pageIndex === 0;
  byId('nextPage').disabled = pageIndex === total - 1;
  byId('prevWork').disabled = workIndex === 0;
  byId('nextWork').disabled = workIndex === works.length - 1;
  stage.scrollTo(0, 0);
}
function goPage(delta) {
  const work = works[workIndex];
  const next = pageIndex + delta;
  if (next < 0 || next >= work.pages.length) return false;
  pageIndex = next;
  renderWork();
  return true;
}
function goWork(delta) {
  const next = workIndex + delta;
  if (next < 0 || next >= works.length) return false;
  workIndex = next;
  pageIndex = 0;
  renderWork();
  opener = byId('sections').querySelector('[data-id="' + CSS.escape(works[workIndex].id) + '"]') || opener;
  return true;
}

/* ── 초기화 ─────────────────────────────── */
byId('nav').append(button('🏠 중앙 광장', () => showRoom(null), {}));
for (const room of rooms) {
  const navButton = button(room.icon + ' ' + room.label, () => showRoom(room));
  navButton.dataset.room = room.id;
  byId('nav').append(navButton);

  const building = el('div', {className:'building ' + room.id});
  building.style.left = room.x + '%';
  const door = button('', () => showRoom(room), {className:'door'});
  door.append(room.icon + ' ' + room.label, el('small', {}, room.hint));
  door.setAttribute('aria-label', room.label + ' 입구: ' + room.hint);
  building.append(el('div', {className:'roof'}),
    el('div', {className:'wall'}, el('div', {className:'windows'}, el('span'), el('span')), door));
  byId('map').append(building);
}
byId('backPlaza').addEventListener('click', () => showRoom(null));
byId('search').addEventListener('input', () => currentRoom && renderRoom(currentRoom));
document.querySelectorAll('[data-move]').forEach(node => node.addEventListener('click', () => move(node.dataset.move)));
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (viewer.open) {
    const handled = {ArrowLeft:() => goPage(-1) || goWork(-1), ArrowRight:() => goPage(1) || goWork(1), '+':() => setZoom(zoom + 1), '-':() => setZoom(zoom - 1)}[event.key];
    if (handled && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) { handled(); event.preventDefault(); }
    return;
  }
  if (/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) return;
  if (move(event.key)) event.preventDefault();
});
byId('prevPage').onclick = () => goPage(-1);
byId('nextPage').onclick = () => goPage(1);
byId('prevWork').onclick = () => goWork(-1);
byId('nextWork').onclick = () => goWork(1);
byId('zoomIn').onclick = () => setZoom(zoom + 1);
byId('zoomOut').onclick = () => setZoom(zoom - 1);
viewer.addEventListener('close', () => { opener?.focus(); setTimeout(() => opener?.focus(), 50); });

// 손가락으로 밀어서 쪽·작품 넘기기 (확대 상태가 아닐 때)
let touchStart = null;
stage.addEventListener('touchstart', event => { touchStart = zoom === 1 && event.touches.length === 1 ? {x:event.touches[0].clientX, y:event.touches[0].clientY} : null; }, {passive:true});
stage.addEventListener('touchend', event => {
  if (!touchStart) return;
  const dx = event.changedTouches[0].clientX - touchStart.x, dy = event.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? goPage(1) || goWork(1) : goPage(-1) || goWork(-1));
}, {passive:true});

window.addEventListener('hashchange', () => {
  const room = rooms.find(room => '#' + room.id === location.hash) || null;
  if (room !== currentRoom) showRoom(room);
});
drawAvatar();
const startRoom = rooms.find(room => '#' + room.id === location.hash);
if (startRoom) showRoom(startRoom, {focus:false});
