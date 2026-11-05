// 그림 모드: GPT로 생성한 이미지(마을 배경·소품·카펫)를 사용. 코드로 그린 기본 모드와 비교용.
const ART = (() => {
  let on = false;
  try {
    const q = new URLSearchParams(location.search).get('art');
    if (q) localStorage.setItem('sj-art', q === 'gen' || q === '1' ? 'gen' : 'drawn');
    on = localStorage.getItem('sj-art') === 'gen';
  } catch (e) {}
  const images = {};
  const FILES = {village:'images/art/village.webp', carpet:'images/art/carpet-character.webp',
    'floor-poster':'images/art/floor-poster.webp', 'floor-writing':'images/art/floor-writing.webp',
    'wall-character':'images/art/wall-character.webp', 'wall-poster':'images/art/wall-poster.webp', 'wall-writing':'images/art/wall-writing.webp',
    'frame-character':'images/art/frame-character.png', 'frame-poster':'images/art/frame-poster.png', 'frame-writing':'images/art/frame-writing.png',
    'char-robot':'images/art/char-robot.png'};
  // 액자 이미지 안의 열린 부분(작품이 들어가는 곳)과 캐릭터 시트 셀 크기
  const FRAME_OPEN = {x:7, y:17, w:45, h:33};
  const CHAR_CELL = {w:30, h:38};
  const charCache = new Map();
  // 생성 캐릭터 시트에서 한 칸을 캔버스로 (없으면 null)
  function charSprite(kind, dir, frame) {
    const im = images['char-' + kind];
    if (!im) return null;
    const key = kind + dir + frame;
    if (charCache.has(key)) return charCache.get(key);
    const row = {down:0, up:1, left:2, right:3}[dir] || 0;
    const [c, g] = offscreen(CHAR_CELL.w, CHAR_CELL.h);
    g.imageSmoothingEnabled = true;
    g.drawImage(im, frame * CHAR_CELL.w, row * CHAR_CELL.h, CHAR_CELL.w, CHAR_CELL.h, 0, 0, CHAR_CELL.w, CHAR_CELL.h);
    charCache.set(key, c);
    return c;
  }
  const PROPS_IMG = ['tree', 'pine', 'bush', 'flower-pink', 'flower-yellow', 'flower-white', 'rock', 'bench', 'picnic', 'lamp', 'fence', 'fountain', 'sign', 'flowerbed', 'plant', 'desk'];
  for (const p of PROPS_IMG) FILES['prop-' + p] = 'images/art/prop-' + p + '.png';
  function load() {
    if (!on) return Promise.resolve();
    return Promise.all(Object.entries(FILES).map(([k, src]) => new Promise(res => { const im = new Image(); im.onload = () => { images[k] = im; res(); }; im.onerror = () => res(); im.src = src; })));
  }
  // 소품 그리기: 바닥 중앙 기준
  function drawProp(g, type, x, y, color) {
    const key = {flower:'prop-flower-' + ({'#f25c8a':'pink', '#ffd166':'yellow', '#ffffff':'white'}[color] || 'pink')}[type] || 'prop-' + type;
    const im = images[key];
    if (type === 'spot') return true;                     // 액자 이미지에 조명이 포함됨
    if (!im) return false;
    const cells = {bench:2, picnic:2, desk:2, flowerbed:2, fountain:2}[type] || 1;
    g.drawImage(im, Math.round(x + (cells * TILE - im.width) / 2), Math.round(y + TILE - im.height + (type === 'fountain' ? 24 : 2)));
    return true;
  }
  return {get on() { return on; }, images, load, drawProp, charSprite, FRAME_OPEN,
    toggle() { try { localStorage.setItem('sj-art', on ? 'drawn' : 'gen'); } catch (e) {} location.reload(); }};
})();
