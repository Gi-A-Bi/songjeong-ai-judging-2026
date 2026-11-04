// 픽셀 아트: 캐릭터 스프라이트, 타일 텍스처, 소품
const TILE = 32;

function seeded(seed) {
  let t = seed >>> 0;
  return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
}
function offscreen(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return [c, g];
}

/* ── 캐릭터 ─────────────────────────────── */
const AVATARS = {
  robot:  {name:'로봇',   head:'#b9cbd8', body:'#4f6d8f', accent:'#e8503f', eye:'#1b2a38', top:['.....AA.....','.....AA.....','......L.....','............']},
  cat:    {name:'고양이', head:'#f6c35f', body:'#ef8c2a', accent:'#f6c35f', eye:'#2b2b2b', top:['............','.A........A.','.AA......AA.','.AAA....AAA.']},
  rabbit: {name:'토끼',   head:'#fdfdfd', body:'#7fb8ec', accent:'#f7a8c4', eye:'#2b2b2b', top:['..AA....AA..','..AA....AA..','..AA....AA..','..AA....AA..']},
  bear:   {name:'곰',     head:'#b07a45', body:'#d9453b', accent:'#b07a45', eye:'#2b2b2b', top:['............','............','.AAA....AAA.','.AAA....AAA.']},
  alien:  {name:'외계인', head:'#8fe08f', body:'#5050a8', accent:'#8fe08f', eye:'#1b1b3a', top:['..A......A..','...L....L...','....L..L....','............']},
  dino:   {name:'공룡',   head:'#5fb879', body:'#2f7d53', accent:'#f2d35b', eye:'#1b2b1b', top:['............','............','..A...A..A..','..AA.AAA.AA.']},
  fox:    {name:'여우',   head:'#f28a3c', body:'#fdf2e4', accent:'#f28a3c', eye:'#2b2b2b', top:['............','.A........A.','.AA......AA.','.AAA....AAA.']},
  penguin:{name:'펭귄',   head:'#2d3b4f', body:'#2d3b4f', accent:'#f2c14e', eye:'#ffffff', top:['............','............','............','............']}
};
const BODY = {
  down:['.HHHHHHHHHH.','HHHHHHHHHHHH','HHHEEHHHHEEH','HHHEEHHHHEEH','HHHHHHHHHHHH','.HHHHHHHHHH.','..BBBBBBBB..','.BBBBBBBBBB.','.BBBBBBBBBB.','..BBBBBBBB..'],
  up:  ['.HHHHHHHHHH.','HHHHHHHHHHHH','HHHHHHHHHHHH','HHHHHHHHHHHH','HHHHHHHHHHHH','.HHHHHHHHHH.','..BBBBBBBB..','.BBBBBBBBBB.','.BBBBBBBBBB.','..BBBBBBBB..'],
  side:['..HHHHHHHH..','.HHHHHHHHHH.','.HHHHHHHEEH.','.HHHHHHHEEH.','.HHHHHHHHHH.','..HHHHHHHH..','...BBBBBB...','..BBBBBBBB..','..BBBBBBBB..','...BBBBBB...']
};
const LEGS = {
  stand:['..LL....LL..','..LL....LL..'],
  a:['..LL....LL..','..LL........'],
  b:['..LL....LL..','........LL..'],
  sideStand:['...LL..LL...','...LL..LL...'],
  sideA:['..LL....LL..','..LL........'],
  sideB:['....LLLL....','....LL......']
};
const spriteCache = new Map();
// dir: down|up|left|right, frame: 0 서기, 1·2 걷기
function sprite(kind, dir, frame) {
  const key = kind + dir + frame;
  if (spriteCache.has(key)) return spriteCache.get(key);
  const p = AVATARS[kind];
  const side = dir === 'left' || dir === 'right';
  const body = side ? BODY.side : BODY[dir];
  const legs = side ? [LEGS.sideStand, LEGS.sideA, LEGS.sideB][frame] : [LEGS.stand, LEGS.a, LEGS.b][frame];
  const rows = [...p.top, ...body, ...legs];
  const S = 2, [c, g] = offscreen(12 * S, 16 * S);
  const colors = {H:p.head, B:p.body, A:p.accent, E:p.eye, L:'#2a2a2a', W:'#fff'};
  if (dir === 'left') { g.translate(c.width, 0); g.scale(-1, 1); }
  const bob = frame ? 1 : 0;
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    g.fillStyle = colors[ch];
    const yy = y < 14 ? y + bob : y;
    g.fillRect(x * S, yy * S, S, S);
  }));
  // 눈 반짝임, 입
  if (dir === 'down') { g.fillStyle = '#fff'; g.fillRect(3 * S, 6 * S, 1, 1); g.fillRect(9 * S, 6 * S, 1, 1); g.fillStyle = colors.L; g.fillRect(5 * S, 8 * S + bob * S, 2 * S, S / 2); }
  spriteCache.set(key, c);
  return c;
}

/* ── 타일 텍스처 ─────────────────────────────── */
const tileCache = new Map();
function tile(name, color) {
  const key = name + (color || '');
  if (tileCache.has(key)) return tileCache.get(key);
  const [c, g] = offscreen(TILE, TILE);
  const rnd = seeded(name.length * 977 + (color ? color.length : 0));
  const speck = (col, n, size = 2) => { g.fillStyle = col; for (let i = 0; i < n; i++) g.fillRect(Math.floor(rnd() * TILE), Math.floor(rnd() * TILE), size, size); };
  switch (name) {
    case 'grass': g.fillStyle = '#7cc46d'; g.fillRect(0, 0, TILE, TILE); speck('#8fd27e', 10); speck('#5fae55', 6); break;
    case 'grass2': g.fillStyle = '#86cb77'; g.fillRect(0, 0, TILE, TILE); speck('#9bd98c', 8); speck('#6cb95f', 5); break;
    case 'path': g.fillStyle = '#e6d3a3'; g.fillRect(0, 0, TILE, TILE); speck('#d9c38d', 8); speck('#f0e0b8', 6); break;
    case 'plaza': g.fillStyle = '#d8cdb5'; g.fillRect(0, 0, TILE, TILE); g.strokeStyle = '#c6b99c'; g.lineWidth = 1; g.strokeRect(.5, .5, 15, 15); g.strokeRect(16.5, 16.5, 15, 15); g.strokeRect(16.5, .5, 15, 15); g.strokeRect(.5, 16.5, 15, 15); break;
    case 'water': g.fillStyle = '#5fa9e6'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = '#8cc4f0'; for (let i = 0; i < 3; i++) g.fillRect(Math.floor(rnd() * 20), 6 + i * 9, 10, 2); break;
    case 'wallTop': g.fillStyle = color || '#5a4a3f'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, 0, TILE, 4); break;
    case 'wall': g.fillStyle = color || '#f3e7d2'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, TILE - 6, TILE, 6); g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(0, 0, TILE, 2); break;
    case 'brick': g.fillStyle = color || '#e9c9a0'; g.fillRect(0, 0, TILE, TILE); g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 1; for (let y = 0; y < TILE; y += 8) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(TILE, y + .5); g.stroke(); const off = (y / 8) % 2 ? 8 : 0; for (let x = off; x < TILE; x += 16) { g.beginPath(); g.moveTo(x + .5, y); g.lineTo(x + .5, y + 8); g.stroke(); } } break;
    case 'roof': g.fillStyle = color || '#e8743b'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < TILE; y += 8) g.fillRect(0, y + 6, TILE, 2); g.fillStyle = 'rgba(255,255,255,.12)'; for (let y = 0; y < TILE; y += 8) g.fillRect(0, y, TILE, 2); break;
    case 'wood': g.fillStyle = color || '#d9b07c'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 10, TILE, 1); g.fillRect(0, 21, TILE, 1); g.fillRect(12, 0, 1, 10); g.fillRect(24, 11, 1, 10); g.fillRect(6, 22, 1, 10); break;
    case 'tilefloor': g.fillStyle = color || '#e9e7f3'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(0, 0, TILE, 1); g.fillRect(0, 0, 1, TILE); g.fillRect(16, 16, 16, 16); break;
    case 'carpet': g.fillStyle = color || '#e0b56b'; g.fillRect(0, 0, TILE, TILE); speck('rgba(0,0,0,.07)', 14, 2); speck('rgba(255,255,255,.12)', 10, 2); break;
    case 'door': g.fillStyle = '#7a4f2a'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = '#9a6a3c'; g.fillRect(3, 2, TILE - 6, TILE - 2); g.fillStyle = '#f2d35b'; g.fillRect(TILE - 10, 16, 4, 4); break;
    case 'doormat': g.fillStyle = '#c9a56a'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = '#b48f55'; for (let i = 2; i < TILE; i += 6) g.fillRect(i, 4, 2, TILE - 8); break;
    case 'exit': g.fillStyle = '#6fbf8a'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = '#fff'; g.fillRect(6, 10, 20, 12); g.fillStyle = '#2f7d53'; g.fillRect(9, 13, 14, 6); break;
    default: g.fillStyle = '#f0f'; g.fillRect(0, 0, TILE, TILE);
  }
  tileCache.set(key, c);
  return c;
}

/* ── 소품 (정적 레이어에 직접 그림) ───────────── */
const PROPS = {
  tree(g, x, y) { g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x + 16, y + 30, 13, 5, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#7a4f2a'; g.fillRect(x + 13, y + 14, 6, 16); g.fillStyle = '#3f9450'; g.beginPath(); g.arc(x + 16, y + 2, 14, 0, Math.PI * 2); g.fill(); g.fillStyle = '#58b36a'; g.beginPath(); g.arc(x + 12, y - 2, 9, 0, Math.PI * 2); g.fill(); g.fillStyle = '#2f7d3f'; g.beginPath(); g.arc(x + 22, y + 6, 8, 0, Math.PI * 2); g.fill(); },
  pine(g, x, y) { g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x + 16, y + 30, 11, 4, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#7a4f2a'; g.fillRect(x + 14, y + 20, 4, 10); g.fillStyle = '#2f7d53'; [[-14, 22, 0], [-11, 12, -10], [-8, 2, -20]].forEach(([dx, by, dy]) => { g.beginPath(); g.moveTo(x + 16, y + dy - 6); g.lineTo(x + 16 + dx, y + by); g.lineTo(x + 16 - dx, y + by); g.fill(); }); },
  bush(g, x, y) { g.fillStyle = '#4fa35c'; g.beginPath(); g.arc(x + 10, y + 22, 8, 0, 7); g.arc(x + 22, y + 22, 8, 0, 7); g.arc(x + 16, y + 16, 9, 0, 7); g.fill(); },
  flower(g, x, y, col) { g.fillStyle = '#3f9450'; g.fillRect(x + 15, y + 18, 2, 10); g.fillStyle = col || '#f25c8a'; [[0, -5], [5, 0], [0, 5], [-5, 0]].forEach(([dx, dy]) => { g.beginPath(); g.arc(x + 16 + dx, y + 16 + dy, 3.5, 0, 7); g.fill(); }); g.fillStyle = '#ffe36b'; g.beginPath(); g.arc(x + 16, y + 16, 3, 0, 7); g.fill(); },
  rock(g, x, y) { g.fillStyle = '#9aa0a6'; g.beginPath(); g.ellipse(x + 16, y + 22, 10, 7, 0, 0, 7); g.fill(); g.fillStyle = '#c3c8cc'; g.beginPath(); g.ellipse(x + 13, y + 19, 5, 3, 0, 0, 7); g.fill(); },
  fountain(g, x, y) { g.fillStyle = '#bfcad2'; g.beginPath(); g.ellipse(x + 32, y + 40, 30, 18, 0, 0, 7); g.fill(); g.fillStyle = '#5fa9e6'; g.beginPath(); g.ellipse(x + 32, y + 40, 24, 13, 0, 0, 7); g.fill(); g.fillStyle = '#9fd3f5'; g.beginPath(); g.ellipse(x + 26, y + 36, 8, 3, 0, 0, 7); g.fill(); g.fillStyle = '#bfcad2'; g.fillRect(x + 28, y + 14, 8, 26); g.beginPath(); g.ellipse(x + 32, y + 14, 12, 5, 0, 0, 7); g.fill(); g.fillStyle = '#dff1fb'; g.beginPath(); g.arc(x + 32, y + 6, 5, 0, 7); g.fill(); },
  bench(g, x, y) { g.fillStyle = '#8a5a2b'; g.fillRect(x + 4, y + 12, 56, 8); g.fillRect(x + 4, y + 4, 56, 5); g.fillStyle = '#6b4320'; g.fillRect(x + 8, y + 20, 4, 8); g.fillRect(x + 52, y + 20, 4, 8); },
  lamp(g, x, y) { g.fillStyle = '#3a3f44'; g.fillRect(x + 14, y + 4, 4, 26); g.fillStyle = '#ffe36b'; g.fillRect(x + 10, y - 2, 12, 8); g.fillStyle = '#3a3f44'; g.fillRect(x + 8, y - 4, 16, 2); },
  sign(g, x, y) { g.fillStyle = '#8a5a2b'; g.fillRect(x + 14, y + 10, 4, 20); g.fillStyle = '#f6e4b8'; g.fillRect(x + 2, y + 2, 28, 12); g.strokeStyle = '#8a5a2b'; g.lineWidth = 2; g.strokeRect(x + 3, y + 3, 26, 10); },
  plant(g, x, y) { g.fillStyle = '#b86b3c'; g.fillRect(x + 10, y + 18, 12, 12); g.fillStyle = '#3f9450'; g.beginPath(); g.arc(x + 16, y + 12, 9, 0, 7); g.fill(); g.fillStyle = '#58b36a'; g.beginPath(); g.arc(x + 11, y + 10, 5, 0, 7); g.arc(x + 21, y + 9, 5, 0, 7); g.fill(); },
  shelf(g, x, y) { g.fillStyle = '#8a5a2b'; g.fillRect(x, y, 32, 32); g.fillStyle = '#6b4320'; g.fillRect(x, y + 10, 32, 2); g.fillRect(x, y + 21, 32, 2); const cols = ['#e8503f', '#4f6d8f', '#f2c14e', '#5fb879', '#5050a8', '#f28a3c']; const rnd = seeded(x * 31 + y); for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) { g.fillStyle = cols[Math.floor(rnd() * cols.length)]; g.fillRect(x + 2 + i * 6, y + 2 + r * 11, 4, 8); } },
  desk(g, x, y) { g.fillStyle = '#d9b07c'; g.fillRect(x + 2, y + 8, 60, 16); g.fillStyle = '#b48f55'; g.fillRect(x + 4, y + 24, 6, 6); g.fillRect(x + 54, y + 24, 6, 6); g.fillStyle = '#fff'; g.fillRect(x + 10, y + 10, 14, 10); g.fillRect(x + 40, y + 10, 14, 10); },
  sofa(g, x, y, col) { g.fillStyle = col || '#e8743b'; g.fillRect(x + 2, y + 6, 60, 22); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x + 2, y + 6, 60, 6); g.fillRect(x + 2, y + 6, 6, 22); g.fillRect(x + 56, y + 6, 6, 22); },
  frame(g, x, y, w, h, col) { g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x + 3, y + 3, w, h); g.fillStyle = col || '#8a5a2b'; g.fillRect(x, y, w, h); g.fillStyle = '#fff'; g.fillRect(x + 4, y + 4, w - 8, h - 8); },
  placard(g, x, y, w, h) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + 2, y + 2, w, h); g.fillStyle = '#fff8e8'; g.fillRect(x, y, w, h); g.strokeStyle = '#d9b86b'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, h - 2); },
  windowBox(g, x, y) { g.fillStyle = '#bfe6ff'; g.fillRect(x + 6, y + 6, 20, 20); g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(x + 6, y + 6, 20, 20); g.beginPath(); g.moveTo(x + 16, y + 6); g.lineTo(x + 16, y + 26); g.moveTo(x + 6, y + 16); g.lineTo(x + 26, y + 16); g.stroke(); },
  banner(g, x, y, col) { g.fillStyle = col; g.beginPath(); g.moveTo(x + 6, y); g.lineTo(x + 26, y); g.lineTo(x + 26, y + 22); g.lineTo(x + 16, y + 30); g.lineTo(x + 6, y + 22); g.fill(); }
};
