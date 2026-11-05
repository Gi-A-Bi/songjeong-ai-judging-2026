// 그림 모드: GPT로 생성한 이미지(마을 배경·소품·카펫)를 사용. 코드로 그린 기본 모드와 비교용.
const ART = (() => {
  let on = false;
  try {
    const q = new URLSearchParams(location.search).get('art');
    if (q) localStorage.setItem('sj-art', q === 'gen' || q === '1' ? 'gen' : 'drawn');
    on = localStorage.getItem('sj-art') === 'gen';
  } catch (e) {}
  const images = {};
  const FILES = {village:'images/art/village.webp', carpet:'images/art/carpet-character.webp'};
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
    if (!im) return false;
    const cells = {bench:2, picnic:2, desk:2, flowerbed:2, fountain:2}[type] || 1;
    g.drawImage(im, Math.round(x + (cells * TILE - im.width) / 2), Math.round(y + TILE - im.height + (type === 'fountain' ? 24 : 2)));
    return true;
  }
  return {get on() { return on; }, images, load, drawProp,
    toggle() { try { localStorage.setItem('sj-art', on ? 'drawn' : 'gen'); } catch (e) {} location.reload(); }};
})();
