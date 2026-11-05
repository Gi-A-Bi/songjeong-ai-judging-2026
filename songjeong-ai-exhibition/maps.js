// 지도 생성: 마을(중앙 광장)과 세 전시관
const ROOMS = [
  {id:'character', label:'캐릭터관', icon:'🤖', hint:'AI 캐릭터', intro:'친구들이 상상한 AI 캐릭터를 만나 보세요.', color:'#e8743b', wall:'#ffe9d6', wallTop:'#b9552a', floor:'carpet', floorColor:'#f3c98b', brick:'#fff1e4', rug:'#f0b27a'},
  {id:'poster',    label:'포스터관', icon:'🖼️', hint:'AI 활용 포스터', intro:'AI를 바르게 쓰는 방법을 담은 포스터예요.', color:'#5c4bb3', wall:'#f3f1fa', wallTop:'#4a3b96', floor:'tilefloor', floorColor:'#e9e7f3', brick:'#f1eefc', rug:'#c9c0ee'},
  {id:'writing',   label:'글짓기관', icon:'📚', hint:'AI 글짓기', intro:'AI와 함께하는 미래를 상상한 글이에요.', color:'#9a6b2c', wall:'#fbf1dc', wallTop:'#6e4b1f', floor:'wood', floorColor:'#d9b07c', brick:'#fbf0da', rug:'#e0a07a'}
];
const ZONE_SIZE = 8;
const PER_ROW = 10;

function makeGrid(id, name, w, h, fill) {
  const map = {id, name, w, h, ground:new Array(w * h).fill(fill), solid:new Uint8Array(w * h), props:[], portals:[], exhibits:[], labels:[], npcs:[], spawn:{x:1, y:1, dir:'down'}};
  map.at = (x, y) => map.ground[y * w + x];
  map.set = (x, y, t, solid) => { if (x < 0 || y < 0 || x >= w || y >= h) return; map.ground[y * w + x] = t; if (solid !== undefined) map.solid[y * w + x] = solid ? 1 : 0; };
  map.block = (x, y, v = 1) => { if (x >= 0 && y >= 0 && x < w && y < h) map.solid[y * w + x] = v; };
  map.walkable = (x, y) => x >= 0 && y >= 0 && x < w && y < h && !map.solid[y * w + x];
  map.prop = (type, x, y, extra) => map.props.push({type, x:x * TILE, y:y * TILE, ...extra});
  return map;
}

function groupZones(list) {
  const zones = new Map();
  list.forEach((work, i) => {
    const name = work.zone || Math.floor(i / ZONE_SIZE) + 1 + '구역';
    if (!zones.has(name)) zones.set(name, []);
    zones.get(name).push(work);
  });
  return zones;
}

/* ── 마을 ─────────────────────────────── */
function buildVillage() {
  const W = 44, H = 30, m = makeGrid('village', '중앙 광장', W, H, 'grass');
  const rnd = seeded(2026);
  for (let i = 0; i < W * H; i++) { const r = rnd(); if (r < .28) m.ground[i] = 'grass2'; else if (r < .34) m.ground[i] = 'grass3'; }
  const centers = [9, 22, 35];
  // 길
  for (let x = 3; x <= 40; x++) for (let y = 17; y <= 18; y++) m.set(x, y, 'path');
  centers.forEach(cx => { for (let y = 12; y <= 16; y++) m.set(cx, y, 'path'); });
  for (let x = 16; x <= 28; x++) for (let y = 19; y <= 26; y++) m.set(x, y, 'plaza');
  for (let y = 27; y <= 29; y++) m.set(22, y, 'path');
  // 건물
  ROOMS.forEach((room, i) => {
    const cx = centers[i];
    for (let x = cx - 4; x <= cx + 4; x++) for (let y = 5; y <= 10; y++) m.block(x, y);
    m.prop('building', cx - 4, 5, {w:9, h:6, color:room.color, wall:room.brick, sortY:(10.5) * TILE});
    m.set(cx, 10, 'door', false);
    m.set(cx, 11, 'doormat', false);
    m.prop('flowerbed', cx - 4, 11, {n:3}); m.prop('flowerbed', cx + 2, 11, {n:3});
    for (let x = cx - 4; x <= cx + 4; x++) if (x !== cx) m.block(x, 11);
    m.prop('lamp', cx - 2, 13); m.block(cx - 2, 13); m.prop('lamp', cx + 2, 13); m.block(cx + 2, 13);
    m.portals.push({x:cx, y:10, to:room.id, spawn:null});
    m.labels.push({x:(cx + .5) * TILE, y:6.6 * TILE, text:room.icon + ' ' + room.label, kind:'building', color:room.color});
    m.labels.push({x:(cx + .5) * TILE, y:11.5 * TILE, text:room.hint, kind:'small'});
  });
  m.prop('bunting', 5, 15, {n:34, sortY:0});
  // 분수와 광장 소품
  m.prop('fountain', 21, 21); for (let x = 21; x <= 22; x++) for (let y = 21; y <= 22; y++) m.block(x, y);
  m.prop('bench', 17, 20); m.block(17, 20); m.block(18, 20);
  m.prop('bench', 25, 20); m.block(25, 20); m.block(26, 20);
  m.prop('lamp', 16, 25); m.block(16, 25); m.prop('lamp', 28, 25); m.block(28, 25);
  m.prop('picnic', 31, 23); m.block(31, 23); m.block(32, 23);
  m.prop('picnic', 34, 26); m.block(34, 26); m.block(35, 26);
  m.prop('arch', 21, 28, {color:'#237258', sortY:0});
  m.labels.push({x:22 * TILE, y:27.3 * TILE, text:'송정 AI 작품마을', kind:'sign'});
  // 연못
  for (let x = 3; x <= 9; x++) for (let y = 22; y <= 27; y++) if (!((x === 3 || x === 9) && (y === 22 || y === 27))) m.set(x, y, (x + y) % 5 === 0 ? 'water2' : 'water', true);
  m.prop('fence', 3, 21, {n:7, sortY:0}); for (let x = 3; x <= 9; x++) m.block(x, 21);
  m.prop('rock', 10, 23); m.block(10, 23); m.prop('rock', 2, 26); m.block(2, 26); m.prop('rock', 10, 26); m.block(10, 26);
  m.prop('flowerbed', 11, 24, {n:2}); m.block(11, 24); m.block(12, 24);
  // 나무 테두리
  for (let x = 0; x < W; x += 2) { m.prop(x % 4 ? 'tree' : 'pine', x, 0); m.block(x, 0); m.block(x + 1, 0); m.prop(x % 4 ? 'pine' : 'tree', x, H - 1); m.block(x, H - 1); m.block(x + 1, H - 1); }
  for (let y = 2; y < H - 2; y += 2) { m.prop('tree', 0, y); m.block(0, y); m.block(0, y + 1); m.prop('tree', W - 1, y); m.block(W - 1, y); m.block(W - 1, y + 1); }
  // 흩어진 나무·꽃·바위
  const free = (x, y) => m.at(x, y).startsWith('grass') && !m.solid[y * W + x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => (m.at(x + dx, y + dy) || 'grass').startsWith('grass'));
  let placed = 0, tries = 0;
  while (placed < 26 && tries++ < 2000) { const x = 2 + Math.floor(rnd() * (W - 4)), y = 2 + Math.floor(rnd() * (H - 4)); if (y >= 3 && y <= 14 && x >= 3 && x <= 41) continue; if (free(x, y)) { m.prop(rnd() < .5 ? 'tree' : rnd() < .5 ? 'pine' : 'bush', x, y); m.block(x, y); placed++; } }
  const flowerColors = ['#f25c8a', '#ffd166', '#ffffff', '#c58cf5'];
  placed = 0; tries = 0;
  while (placed < 40 && tries++ < 2000) { const x = 1 + Math.floor(rnd() * (W - 2)), y = 1 + Math.floor(rnd() * (H - 2)); if (free(x, y)) { m.prop('flower', x, y, {color:flowerColors[Math.floor(rnd() * 4)]}); placed++; } }
  m.spawn = {x:22, y:14, dir:'up'};
  m.npcs = [
    {kind:'cat', x:19, y:23, lines:['안녕! 송정 AI 작품마을에 온 걸 환영해.', '위쪽 건물이 전시관이야. 문으로 들어가 봐!']},
    {kind:'penguin', x:27, y:24, lines:['포스터관에 멋진 포스터가 많아.', '작품 앞에 서면 크게 볼 수 있어.']},
    {kind:'fox', x:12, y:17, lines:['왼쪽은 캐릭터관, 오른쪽은 글짓기관!', '화면을 톡 누르면 그곳으로 걸어가.']}
  ];
  return m;
}

/* ── 마을 (생성 이미지 배경) ─────────────── */
function buildVillageArt() {
  const W = 48, H = 32, m = makeGrid('village', '중앙 광장', W, H, 'grass');
  m.bg = 'village';
  const block = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m.block(x, y); };
  block(0, 0, W - 1, 3); block(0, 0, 1, H - 1); block(46, 0, 47, H - 1); block(0, 28, W - 1, 31);
  for (let y = 28; y <= 30; y++) for (let x = 22; x <= 25; x++) m.block(x, y, 0);   // 아래쪽 길
  const doors = [[4, 15, 9], [18, 30, 23], [33, 45, 38]];
  ROOMS.forEach((room, i) => {
    const [x0, x1, dx] = doors[i];
    block(x0, 4, x1, 12);
    m.block(dx, 12, 0); m.block(dx + 1, 12, 0);
    m.portals.push({x:dx, y:12, to:room.id}, {x:dx + 1, y:12, to:room.id});
    m.labels.push({x:(x0 + x1 + 1) / 2 * TILE + (i === 0 ? 12 : i === 1 ? 10 : 8), y:7.75 * TILE, text:room.icon + ' ' + room.label, kind:'board'});
    m.labels.push({x:(dx + 1) * TILE, y:13.5 * TILE, text:room.hint, kind:'small'});
  });
  block(3, 10, 3, 12); block(16, 10, 17, 11); block(30, 11, 32, 12); block(44, 10, 45, 12);   // 건물 옆 덤불
  block(2, 19, 11, 27);                       // 연못
  block(14, 18, 15, 19); block(32, 18, 33, 19); // 가로등
  block(21, 19, 26, 26);                      // 분수
  block(16, 22, 19, 24); block(29, 22, 32, 24); // 벤치
  block(38, 19, 43, 21); block(38, 24, 43, 26); // 피크닉 테이블
  block(14, 26, 15, 27); block(32, 26, 33, 27); block(12, 18, 13, 19); block(34, 18, 35, 19); // 덤불
  m.fountain = {x:24 * TILE, y:21 * TILE};
  m.spawn = {x:23, y:17, dir:'up'};
  m.npcs = [
    {kind:'cat', x:17, y:20, lines:['안녕! 송정 AI 작품마을에 온 걸 환영해.', '위쪽 건물이 전시관이야. 문으로 들어가 봐!']},
    {kind:'penguin', x:30, y:26, lines:['포스터관에 멋진 포스터가 많아.', '작품 앞에 서면 크게 볼 수 있어.']},
    {kind:'fox', x:12, y:15, lines:['왼쪽은 캐릭터관, 오른쪽은 글짓기관!', '화면을 톡 누르면 그곳으로 걸어가.']}
  ];
  return m;
}

/* ── 전시관 ─────────────────────────────── */
function buildRoom(room, works) {
  const zones = groupZones(works);
  const rows = [];
  for (const [zone, list] of zones) for (let i = 0; i < list.length; i += PER_ROW) rows.push({zone, works:list.slice(i, i + PER_ROW), first:i === 0});
  if (!rows.length) rows.push({zone:'준비 중', works:[], first:true});
  const maxRow = Math.max(...rows.map(r => r.works.length));
  const W = Math.max(18, maxRow * 3 + 8), H = rows.length * 5 + 2;
  const m = makeGrid(room.id, room.label, W, H, room.floor + room.floorColor);
  if (typeof ART !== 'undefined' && ART.on) { m.floorImage = {character:'carpet', poster:'floor-poster', writing:'floor-writing'}[room.id]; m.wallImage = 'wall-' + room.id; m.frameImage = 'frame-' + room.id; m.capColor = {character:'#c7663a', poster:'#5a48a8', writing:'#7a4f2a'}[room.id]; }
  const wallTop = 'wallTop' + room.wallTop, wall = 'wall' + room.wall;
  // 테두리
  for (let x = 0; x < W; x++) { m.set(x, 0, wallTop, true); m.set(x, H - 1, wallTop, true); }
  for (let y = 0; y < H; y++) { m.set(0, y, wallTop, true); m.set(W - 1, y, wallTop, true); }
  rows.forEach((row, b) => {
    const top = b * 5, face = top + 1;
    if (b > 0) for (let x = 3; x < W - 3; x++) m.set(x, top, wallTop, true);       // 칸막이 (양 끝 통로 남김)
    for (let x = b > 0 ? 3 : 1; x < (b > 0 ? W - 3 : W - 1); x++) m.set(x, face, wall, true);
    // 구역 표지판
    m.prop('placard', 3, face, {w:TILE * 3 - 4, h:TILE - 6, offX:2, offY:4});
    const zoneName = row.zone + (row.first ? '' : ' (계속)');
    m.labels.push({x:4.5 * TILE, y:(face + .45) * TILE, text:zoneName.length > 10 ? zoneName.slice(0, 10) + '…' : zoneName, kind:'zone', color:room.color});
    // 작품 액자
    row.works.forEach((work, i) => {
      const x = 7 + i * 3;
      m.exhibits.push({x, y:face, w:2, work, zone:row.zone, color:room.color, interact:{x:x, y:face + 1}, interact2:{x:x + 1, y:face + 1}});
      m.labels.push({x:(x + 1) * TILE, y:(face + 1.08) * TILE, text:work.title.length > 9 ? work.title.slice(0, 9) + '…' : work.title, kind:'title'});
    });
    // 복도 소품: 러그, 화분, 벤치, 조명
    const cy = top + 3;
    for (let x = 7; x < W - 7; x++) m.set(x, cy, 'rug' + room.rug);
    m.prop('plant', 1, cy); m.block(1, cy); m.prop('plant', W - 2, cy); m.block(W - 2, cy);
    row.works.forEach((work, i) => m.prop('spot', 7 + i * 3 + 1, face - 1, {sortY:0}));
    if (W >= 24 && row.works.length >= 4) { const sx = Math.floor(W / 2) - 1; m.prop('bench', sx, top + 4); m.block(sx, top + 4); m.block(sx + 1, top + 4); }
  });
  // 출구
  const ex = Math.floor(W / 2);
  m.set(ex, H - 1, 'exit', false);
  m.prop('desk', ex + 3, H - 3); m.block(ex + 3, H - 3); m.block(ex + 4, H - 3);
  m.prop('bunting', 3, 0.55, {n:W - 6, sortY:0});
  m.portals.push({x:ex, y:H - 1, to:'village', spawn:null});
  m.labels.push({x:(ex + .5) * TILE, y:(H - 1.55) * TILE, text:'🚪 광장으로', kind:'small'});
  m.spawn = {x:ex, y:H - 2, dir:'up'};
  m.npcs = [{kind:['bear', 'rabbit', 'alien'][ROOMS.indexOf(room)], x:ex - 3, y:H - 3, lines:['작품 앞에 서서 보기 버튼을 눌러 봐.', '칸막이 양 끝으로 돌아가면 다음 구역이야.', room.intro]}];
  return m;
}
