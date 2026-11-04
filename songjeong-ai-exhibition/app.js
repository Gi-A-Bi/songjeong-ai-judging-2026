const byId = id => document.getElementById(id);
const rooms = [
  {id:'character', label:'캐릭터관', icon:'🤖', x:17},
  {id:'poster', label:'포스터관', icon:'🖼️', x:50},
  {id:'writing', label:'글짓기관', icon:'📚', x:83}
];
const viewer = byId('viewer');
let x = 50, y = 67, works = [], workIndex = 0, pageIndex = 0, opener;

function button(label, action) {
  const node = document.createElement('button');
  node.textContent = label;
  node.addEventListener('click', action);
  return node;
}

function showRoom(room) {
  byId('plaza').hidden = Boolean(room);
  byId('gallery').hidden = !room;
  if (!room) {
    x = 50;
    y = 67;
    drawAvatar();
    byId('nav').firstElementChild.focus();
    return;
  }
  works = WORKS.filter(work => work.category === room.id);
  byId('room').textContent = room.label;
  byId('cards').replaceChildren(...works.map((work, index) =>
    button(room.icon + ' ' + work.title, event => {
      opener = event.currentTarget;
      workIndex = index;
      pageIndex = 0;
      renderWork();
      viewer.showModal();
    })
  ));
  byId('room').focus();
}

function renderWork() {
  const work = works[workIndex];
  const page = work.pages[pageIndex];
  byId('title').textContent = work.title;
  const content = byId('content');
  content.textContent = page.text || '';
  if (page.image) {
    const image = document.createElement('img');
    image.src = page.image;
    image.alt = page.alt || work.title;
    content.prepend(image);
  }
  byId('page').textContent = (pageIndex + 1) + ' / ' + work.pages.length + '쪽';
  byId('prevPage').disabled = pageIndex === 0;
  byId('nextPage').disabled = pageIndex === work.pages.length - 1;
  byId('nextWork').disabled = workIndex === works.length - 1;
  viewer.scrollTop = 0;
}

function drawAvatar() {
  byId('avatar').style.left = x + '%';
  byId('avatar').style.top = y + '%';
}

function move(key) {
  const step = {ArrowLeft:[-4,0], ArrowRight:[4,0], ArrowUp:[0,-6], ArrowDown:[0,6]}[key];
  if (!step || byId('plaza').hidden || viewer.open) return false;
  x = Math.max(5, Math.min(95, x + step[0]));
  y = Math.max(15, Math.min(89, y + step[1]));
  drawAvatar();
  const entrance = rooms.find(room => y <= 31 && Math.abs(room.x - x) <= 10);
  if (entrance) showRoom(entrance);
  return true;
}

byId('nav').append(button('중앙 광장', () => showRoom(null)));
for (const room of rooms) {
  byId('nav').append(button(room.label, () => showRoom(room)));
  const entrance = button(room.icon + ' ' + room.label, () => showRoom(room));
  entrance.className = 'door';
  entrance.style.left = room.x + '%';
  byId('map').append(entrance);
}
document.addEventListener('keydown', event => {
  if (!event.altKey && !event.ctrlKey && !event.metaKey && move(event.key)) event.preventDefault();
});
document.querySelectorAll('[data-move]').forEach(node =>
  node.addEventListener('click', () => move(node.dataset.move))
);
byId('prevPage').onclick = () => { pageIndex--; renderWork(); };
byId('nextPage').onclick = () => { pageIndex++; renderWork(); };
byId('nextWork').onclick = () => { workIndex++; pageIndex = 0; renderWork(); };
viewer.addEventListener('close', () => opener?.focus());
drawAvatar();
