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
  const rnd = seeded(name.length * 977 + (color ? color.length * 13 : 0));
  const speck = (col, n, w = 2, h = 2) => { g.fillStyle = col; for (let i = 0; i < n; i++) g.fillRect(Math.floor(rnd() * TILE), Math.floor(rnd() * TILE), w, h); };
  const blades = (col, n) => { g.fillStyle = col; for (let i = 0; i < n; i++) { const x = Math.floor(rnd() * TILE), y = Math.floor(rnd() * TILE); g.fillRect(x, y, 1, 3); g.fillRect(x + 2, y + 1, 1, 2); } };
  switch (name) {
    case 'grass': g.fillStyle = '#79c26b'; g.fillRect(0, 0, TILE, TILE); speck('#86cc78', 14, 3, 2); blades('#5fae55', 7); blades('#95d887', 5); break;
    case 'grass2': g.fillStyle = '#82c973'; g.fillRect(0, 0, TILE, TILE); speck('#8fd281', 12, 3, 2); blades('#66b55c', 6); if (rnd() < .5) { g.fillStyle = '#fff'; g.fillRect(20, 8, 2, 2); g.fillRect(8, 22, 2, 2); g.fillStyle = '#ffd166'; g.fillRect(21, 9, 1, 1); } break;
    case 'grass3': g.fillStyle = '#79c26b'; g.fillRect(0, 0, TILE, TILE); speck('#86cc78', 10, 3, 2); blades('#5fae55', 6); g.fillStyle = '#4f9c48'; [[6, 10], [8, 8], [10, 10], [8, 12]].forEach(([x, y]) => g.fillRect(x, y, 2, 2)); g.fillRect(8, 14, 1, 4); break;
    case 'path': g.fillStyle = '#e4d1a0'; g.fillRect(0, 0, TILE, TILE); speck('#d6c28c', 10, 2, 2); speck('#efe0bb', 8, 2, 1); speck('#c9b27e', 3, 3, 2); break;
    case 'plaza': g.fillStyle = '#d9cfb8'; g.fillRect(0, 0, TILE, TILE); [[0, 0], [16, 0], [0, 16], [16, 16]].forEach(([x, y]) => { g.fillStyle = (x + y) % 32 ? '#d3c8b0' : '#ddd3bd'; g.fillRect(x + 1, y + 1, 14, 14); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 1, y + 1, 14, 1); g.fillRect(x + 1, y + 1, 1, 14); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + 1, y + 14, 14, 1); g.fillRect(x + 14, y + 1, 1, 14); }); break;
    case 'water': g.fillStyle = '#5aa6e3'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = '#6fb4ea'; speck('#6fb4ea', 6, 4, 2); g.fillStyle = '#9dd0f3'; for (let i = 0; i < 2; i++) { const x = Math.floor(rnd() * 18), y = 6 + Math.floor(rnd() * 20); g.fillRect(x, y, 8, 1); g.fillRect(x + 2, y + 1, 5, 1); } break;
    case 'water2': { const w = tile('water'); g.drawImage(w, 0, 0); g.fillStyle = '#3f9b4f'; g.beginPath(); g.arc(18, 16, 7, .4, Math.PI * 2 - .4); g.lineTo(18, 16); g.fill(); g.fillStyle = '#f7a8c4'; g.fillRect(9, 8, 3, 3); g.fillStyle = '#ffe36b'; g.fillRect(10, 9, 1, 1); break; }
    case 'wallTop': g.fillStyle = color || '#5a4a3f'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(0, 0, TILE, 3); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, TILE - 4, TILE, 4); g.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 6; y < TILE - 4; y += 8) g.fillRect(0, y, TILE, 1); break;
    case 'wall': g.fillStyle = color || '#f3e7d2'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = 'rgba(0,0,0,.07)'; g.fillRect(0, 20, TILE, 12); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(0, 19, TILE, 1); g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(0, 21, TILE, 1); g.fillRect(0, TILE - 3, TILE, 3); g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(0, 0, TILE, 2); for (let x = 4; x < TILE; x += 8) g.fillRect(x, 24, 1, 6); break;
    case 'brick': g.fillStyle = color || '#e9c9a0'; g.fillRect(0, 0, TILE, TILE); g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 1; for (let y = 0; y < TILE; y += 8) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(TILE, y + .5); g.stroke(); const off = (y / 8) % 2 ? 8 : 0; for (let x = off; x < TILE; x += 16) { g.beginPath(); g.moveTo(x + .5, y); g.lineTo(x + .5, y + 8); g.stroke(); } } break;
    case 'roof': g.fillStyle = color || '#e8743b'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < TILE; y += 8) g.fillRect(0, y + 6, TILE, 2); g.fillStyle = 'rgba(255,255,255,.12)'; for (let y = 0; y < TILE; y += 8) g.fillRect(0, y, TILE, 2); break;
    case 'wood': g.fillStyle = color || '#d9b07c'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = 'rgba(0,0,0,.09)'; g.fillRect(0, 10, TILE, 1); g.fillRect(0, 21, TILE, 1); g.fillRect(12, 0, 1, 10); g.fillRect(24, 11, 1, 10); g.fillRect(6, 22, 1, 10); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, 0, TILE, 1); g.fillRect(0, 11, TILE, 1); g.fillRect(0, 22, TILE, 1); g.fillStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < 4; i++) g.fillRect(Math.floor(rnd() * 28), Math.floor(rnd() * 30), 6, 1); break;
    case 'tilefloor': g.fillStyle = color || '#e9e7f3'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(16, 0, 16, 16); g.fillRect(0, 16, 16, 16); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(0, 0, TILE, 1); g.fillRect(0, 0, 1, TILE); g.fillRect(16, 16, 16, 1); g.fillRect(16, 0, 1, 16); g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(0, 31, TILE, 1); g.fillRect(31, 0, 1, TILE); break;
    case 'carpet': g.fillStyle = color || '#e0b56b'; g.fillRect(0, 0, TILE, TILE); for (let y = 0; y < TILE; y += 2) for (let x = (y / 2) % 2; x < TILE; x += 2) { g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(x, y, 1, 1); } speck('rgba(255,255,255,.14)', 8, 2, 1); break;
    case 'door': g.fillStyle = '#6b4320'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = '#9a6a3c'; g.fillRect(3, 2, TILE - 6, TILE - 2); g.fillStyle = '#7a4f2a'; g.fillRect(6, 5, 8, 10); g.fillRect(18, 5, 8, 10); g.fillRect(6, 18, 8, 12); g.fillRect(18, 18, 8, 12); g.fillStyle = '#f2d35b'; g.fillRect(TILE - 11, 16, 3, 3); break;
    case 'doormat': g.fillStyle = '#c9a56a'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = '#b48f55'; for (let i = 2; i < TILE; i += 6) g.fillRect(i, 4, 2, TILE - 8); g.fillStyle = '#8a5a2b'; g.fillRect(1, 3, TILE - 2, 1); g.fillRect(1, TILE - 4, TILE - 2, 1); break;
    case 'exit': g.fillStyle = '#6fbf8a'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = '#fff'; g.fillRect(6, 10, 20, 12); g.fillStyle = '#2f7d53'; g.fillRect(9, 13, 14, 6); g.fillStyle = '#fff'; g.fillRect(14, 15, 6, 2); g.fillRect(18, 14, 2, 4); break;
    case 'rug': g.fillStyle = color || '#c9524a'; g.fillRect(0, 0, TILE, TILE); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, TILE, 2); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, TILE - 2, TILE, 2); for (let y = 4; y < TILE; y += 4) for (let x = (y / 4) % 2 * 2; x < TILE; x += 4) { g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x, y, 2, 1); } break;
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

Object.assign(PROPS, {
  // 건물: x,y 픽셀, w,h 타일 수, color 지붕색, wall 벽색
  building(g, x, y, w, h, color, wall) {
    const W = w * TILE, H = h * TILE, roofH = Math.round(H * .36);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 6, y + 10, W, H);               // 그림자
    g.fillStyle = wall || '#fff6e6'; g.fillRect(x, y + roofH, W, H - roofH);        // 벽
    g.fillStyle = 'rgba(0,0,0,.06)'; for (let yy = y + roofH + 8; yy < y + H; yy += 8) { g.fillRect(x, yy, W, 1); const off = ((yy - y) / 8) % 2 ? 8 : 0; for (let xx = x + off; xx < x + W; xx += 16) g.fillRect(xx, yy - 8, 1, 8); }
    g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x, y + H - 6, W, 6);                // 기단
    g.fillStyle = color; g.fillRect(x - 8, y, W + 16, roofH);                       // 지붕
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x - 8, y, W + 16, 4);
    g.fillStyle = 'rgba(0,0,0,.14)'; for (let yy = y + 10; yy < y + roofH; yy += 10) { g.fillRect(x - 8, yy, W + 16, 2); const off = ((yy - y) / 10) % 2 ? 6 : 0; for (let xx = x - 8 + off; xx < x + W + 8; xx += 12) g.fillRect(xx, yy - 10, 1, 10); }
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x - 8, y + roofH, W + 16, 5);       // 처마 그림자
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x - 8, y + roofH - 3, W + 16, 3);
    g.fillStyle = '#6b4320'; g.fillRect(x + W - 40, y - 14, 10, 16); g.fillStyle = '#8a5a2b'; g.fillRect(x + W - 40, y - 16, 10, 3); // 굴뚝
    const cx = x + W / 2;
    const wins = W >= 256 ? [x + 22, x + 22 + 60, x + W - 46 - 60, x + W - 46] : [x + 22, x + W - 46];
    for (const wx of wins) {                                                        // 창문
      g.fillStyle = '#8a5a2b'; g.fillRect(wx - 2, y + roofH + 14, 28, 26);
      g.fillStyle = '#bfe6ff'; g.fillRect(wx, y + roofH + 16, 24, 22);
      g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(wx + 2, y + roofH + 18, 6, 10);
      g.fillStyle = '#fff'; g.fillRect(wx + 11, y + roofH + 16, 2, 22); g.fillRect(wx, y + roofH + 26, 24, 2);
      g.fillStyle = '#e8503f'; g.fillRect(wx - 3, y + roofH + 40, 30, 4); g.fillStyle = '#f25c8a'; g.fillRect(wx + 2, y + roofH + 36, 4, 4); g.fillRect(wx + 12, y + roofH + 36, 4, 4); g.fillRect(wx + 20, y + roofH + 36, 4, 4); g.fillStyle = '#3f9450'; g.fillRect(wx, y + roofH + 38, 24, 2);
    }
    g.fillStyle = '#5a3a1a'; g.fillRect(cx - 20, y + H - 44, 40, 44);                // 문틀
    g.fillStyle = '#9a6a3c'; g.fillRect(cx - 16, y + H - 40, 32, 40);
    g.fillStyle = '#7a4f2a'; g.fillRect(cx - 12, y + H - 36, 10, 14); g.fillRect(cx + 2, y + H - 36, 10, 14); g.fillRect(cx - 12, y + H - 18, 10, 16); g.fillRect(cx + 2, y + H - 18, 10, 16);
    g.fillStyle = '#f2d35b'; g.fillRect(cx + 6, y + H - 22, 3, 3);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, y + H - 44, 20, Math.PI, 0); g.fill(); g.fillStyle = '#bfe6ff'; g.beginPath(); g.arc(cx, y + H - 44, 16, Math.PI, 0); g.fill(); // 아치 창
    g.fillStyle = '#fff8e8'; g.fillRect(cx - 44, y + roofH - 30, 88, 22); g.fillStyle = color; g.fillRect(cx - 44, y + roofH - 30, 88, 3); g.fillRect(cx - 44, y + roofH - 11, 88, 3); // 간판 바탕
    g.fillStyle = '#6b4320'; g.fillRect(cx - 46, y + roofH - 8, 4, 10); g.fillRect(cx + 42, y + roofH - 8, 4, 10);
  },
  fence(g, x, y, n) { for (let i = 0; i < n; i++) { const fx = x + i * TILE; g.fillStyle = '#c9a56a'; g.fillRect(fx + 2, y + 10, 5, 18); g.fillRect(fx + 25, y + 10, 5, 18); g.fillStyle = '#e3c98c'; g.fillRect(fx + 2, y + 10, 5, 2); g.fillRect(fx + 25, y + 10, 5, 2); g.fillStyle = '#d4b377'; g.fillRect(fx, y + 14, TILE, 3); g.fillRect(fx, y + 22, TILE, 3); } },
  flowerbed(g, x, y, n) { g.fillStyle = '#8a5a2b'; g.fillRect(x, y + 8, n * TILE, 22); g.fillStyle = '#6b4320'; g.fillRect(x, y + 26, n * TILE, 4); const rnd = seeded(x * 7 + y); const cols = ['#f25c8a', '#ffd166', '#ffffff', '#c58cf5', '#ff8c42']; for (let i = 0; i < n * 4; i++) { const fx = x + 3 + i * 8 + Math.floor(rnd() * 3), fy = y + 10 + Math.floor(rnd() * 8); g.fillStyle = '#3f9450'; g.fillRect(fx + 1, fy + 3, 1, 6); g.fillStyle = cols[Math.floor(rnd() * cols.length)]; g.fillRect(fx, fy, 3, 3); g.fillStyle = '#fff'; g.fillRect(fx + 1, fy + 1, 1, 1); } },
  bunting(g, x, y, n) { const cols = ['#e8503f', '#f2c14e', '#5fb879', '#5a7bd6', '#f25c8a']; g.strokeStyle = '#6b4320'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + n * TILE, y); g.stroke(); for (let i = 0; i < n * 2; i++) { g.fillStyle = cols[i % cols.length]; const fx = x + i * 16 + 2; g.beginPath(); g.moveTo(fx, y); g.lineTo(fx + 12, y); g.lineTo(fx + 6, y + 10); g.fill(); } },
  desk(g, x, y) { g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x + 4, y + 10, 62, 24); g.fillStyle = '#8a5a2b'; g.fillRect(x + 2, y + 6, 60, 22); g.fillStyle = '#a5713c'; g.fillRect(x + 2, y + 6, 60, 4); g.fillStyle = '#fff'; g.fillRect(x + 8, y + 12, 16, 10); g.fillStyle = '#5fb879'; g.fillRect(x + 36, y + 10, 10, 8); g.fillStyle = '#3f9450'; g.fillRect(x + 40, y + 8, 2, 4); g.fillStyle = '#e8503f'; g.fillRect(x + 50, y + 12, 6, 8); },
  bench(g, x, y) { g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x + 6, y + 14, 56, 14); g.fillStyle = '#a5713c'; g.fillRect(x + 4, y + 12, 56, 8); g.fillRect(x + 4, y + 3, 56, 6); g.fillStyle = '#d9b07c'; g.fillRect(x + 4, y + 12, 56, 2); g.fillRect(x + 4, y + 3, 56, 2); g.fillStyle = '#6b4320'; g.fillRect(x + 8, y + 20, 4, 8); g.fillRect(x + 52, y + 20, 4, 8); g.fillRect(x + 8, y + 9, 4, 3); g.fillRect(x + 52, y + 9, 4, 3); },
  picnic(g, x, y) { g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x + 6, y + 12, 58, 20); g.fillStyle = '#d9b07c'; g.fillRect(x + 4, y + 8, 56, 14); g.fillStyle = '#b48f55'; g.fillRect(x + 4, y + 20, 56, 3); g.fillRect(x + 4, y + 26, 56, 3); g.fillStyle = '#e8503f'; g.fillRect(x + 20, y + 4, 10, 8); g.fillStyle = '#fff'; g.fillRect(x + 36, y + 6, 8, 6); },
  lilypad(g, x, y) { g.fillStyle = '#3f9b4f'; g.beginPath(); g.arc(x + 14, y + 16, 8, .5, Math.PI * 2 - .5); g.lineTo(x + 14, y + 16); g.fill(); g.fillStyle = '#5fbf6f'; g.fillRect(x + 10, y + 12, 3, 2); },
  arch(g, x, y, color) { g.fillStyle = '#8a5a2b'; g.fillRect(x + 2, y - 30, 6, 62); g.fillRect(x + TILE * 2 - 8, y - 30, 6, 62); g.fillStyle = '#fff8e8'; g.fillRect(x - 2, y - 34, TILE * 2 + 4, 22); g.fillStyle = color || '#237258'; g.fillRect(x - 2, y - 34, TILE * 2 + 4, 3); g.fillRect(x - 2, y - 15, TILE * 2 + 4, 3); },
  spot(g, x, y) { g.fillStyle = '#3a3f44'; g.fillRect(x + 12, y + 2, 8, 6); g.fillStyle = '#ffe36b'; g.fillRect(x + 13, y + 7, 6, 2); }
});
