// 월드 엔진: 입력, 이동, 카메라, 그리기, NPC
const Game = (() => {
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d');
  const SPEED = 150;             // px/s
  const maps = {};
  const images = new Map();      // 작품 썸네일
  let map, layer, player, npcs = [], camera = {x:0, y:0}, scale = 2, dpr = 1, viewW = 0, viewH = 0;
  let keys = new Set(), heldDir = null, path = [], pending = null, fade = 0, fadeDir = 0, fadeMid = null, lastTime = 0, running = false;
  let nearExhibit = null, onNear = () => {}, onEnter = () => {}, onInteract = () => {}, avatarKind = 'robot', bubbleTimer = 0;
  const DIRS = {up:[0, -1], down:[0, 1], left:[-1, 0], right:[1, 0]};
  const FONT = '"Galmuri11 Bold", "Galmuri11", "Galmuri9", "DungGeunMo", "Noto Sans KR", system-ui, sans-serif';
  const mini = document.getElementById('minimap');
  const mctx = mini ? mini.getContext('2d') : null;
  let clock = 0;

  function parseTile(key) { const m = key.match(/^([a-zA-Z0-9]+)(.*)$/); return tile(m[1], m[2] || undefined); }

  function buildLayer(m) {
    const [c, g] = offscreen(m.w * TILE, m.h * TILE);
    if (m.bg && ART.images[m.bg]) { g.imageSmoothingEnabled = true; g.drawImage(ART.images[m.bg], 0, 0, m.w * TILE, m.h * TILE); return c; }
    const at = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h) ? '' : m.ground[y * m.w + x];
    const kind = k => k.replace(/[#\d].*$/, '').replace(/\d$/, '');
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) g.drawImage(parseTile(m.ground[y * m.w + x]), x * TILE, y * TILE);
    if (m.floorImage && ART.images[m.floorImage]) {           // 생성 바닥 이미지로 바닥 덮기
      g.save(); g.fillStyle = g.createPattern(ART.images[m.floorImage], 'repeat');
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (['carpet', 'tilefloor', 'wood'].includes(kind(at(x, y)))) g.fillRect(x * TILE, y * TILE, TILE, TILE);
      g.restore();
    }
    if (m.wallImage && ART.images[m.wallImage]) {             // 생성 벽 띠: 갓돌 한 칸 + 벽 한 칸
      const wi = ART.images[m.wallImage], capColor = m.capColor || '#5a4a3f';
      const pat = g.createPattern(wi, 'repeat');
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const k = kind(at(x, y));
        if (k === 'wall' && kind(at(x, y - 1)) === 'wallTop') { g.save(); g.translate(0, (y - 1) * TILE); g.fillStyle = pat; g.fillRect(x * TILE, 0, TILE, TILE * 2); g.restore(); }
        else if (k === 'wallTop' && kind(at(x, y + 1)) !== 'wall') { g.fillStyle = capColor; g.fillRect(x * TILE, y * TILE, TILE, TILE); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x * TILE, y * TILE, TILE, 3); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x * TILE, y * TILE + TILE - 4, TILE, 4); }
      }
    }
    // 길·광장·물 가장자리와 벽 아래 그림자
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const k = kind(at(x, y)), px = x * TILE, py = y * TILE;
      if (k === 'path' || k === 'plaza') {
        g.fillStyle = 'rgba(90,70,30,.22)';
        if (kind(at(x, y - 1)).startsWith('grass')) g.fillRect(px, py, TILE, 2);
        if (kind(at(x, y + 1)).startsWith('grass')) g.fillRect(px, py + TILE - 2, TILE, 2);
        if (kind(at(x - 1, y)).startsWith('grass')) g.fillRect(px, py, 2, TILE);
        if (kind(at(x + 1, y)).startsWith('grass')) g.fillRect(px + TILE - 2, py, 2, TILE);
      }
      if (k === 'water') {
        g.fillStyle = '#c9b27e';
        if (!kind(at(x, y - 1)).startsWith('water')) g.fillRect(px, py, TILE, 3);
        if (!kind(at(x, y + 1)).startsWith('water')) g.fillRect(px, py + TILE - 3, TILE, 3);
        if (!kind(at(x - 1, y)).startsWith('water')) g.fillRect(px, py, 3, TILE);
        if (!kind(at(x + 1, y)).startsWith('water')) g.fillRect(px + TILE - 3, py, 3, TILE);
      }
      if ((k === 'wall' || k === 'wallTop') && !['wall', 'wallTop', ''].includes(kind(at(x, y + 1)))) {
        const grad = g.createLinearGradient(0, py + TILE, 0, py + TILE + 10); grad.addColorStop(0, 'rgba(0,0,0,.28)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad; g.fillRect(px, py + TILE, TILE, 10);
      }
    }
    const frameImg = m.frameImage && ART.images[m.frameImage];
    for (const e of m.exhibits) {
      if (frameImg) g.drawImage(frameImg, e.x * TILE + 2, e.y * TILE + 28 - frameImg.height);
      else PROPS.frame(g, e.x * TILE + 2, e.y * TILE - 14, e.w * TILE - 4, TILE + 10, e.color);
    }
    [...m.props].sort((a, b) => (a.sortY ?? a.y) - (b.sortY ?? b.y)).forEach(p => {
      if (p.type === 'placard') PROPS.placard(g, p.x + p.offX, p.y + p.offY, p.w, p.h);
      else if (p.type === 'building') PROPS.building(g, p.x, p.y, p.w, p.h, p.color, p.wall);
      else if (p.n !== undefined) PROPS[p.type](g, p.x, p.y, p.n);
      else if (ART.on && ART.drawProp(g, p.type, p.x, p.y, p.color)) {}
      else PROPS[p.type](g, p.x, p.y, p.color);
    });
    return c;
  }

  function getMap(id) {
    if (!maps[id]) maps[id] = id === 'village' ? (ART.on && ART.images.village ? buildVillageArt() : buildVillage()) : buildRoom(ROOMS.find(r => r.id === id), WORKS.filter(w => w.category === id));
    if (!maps[id].layer) maps[id].layer = buildLayer(maps[id]);
    return maps[id];
  }

  function thumb(work) {
    const page = work.pages.find(p => p.image);
    const src = work.thumb || (page && page.image);
    if (!src) return null;
    if (!images.has(src)) { const img = new Image(); img.src = src; images.set(src, img); }
    const img = images.get(src);
    return img.complete && img.naturalWidth ? img : null;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewW = rect.width; viewH = rect.height;
    canvas.width = Math.round(viewW * dpr); canvas.height = Math.round(viewH * dpr);
    scale = (map && map.bg) ? Math.max(1.05, Math.min(1.25, viewW / 900)) : Math.max(1.35, Math.min(1.5, viewW / 640));
  }

  function makeEntity(kind, x, y, dir) { return {kind, x, y, px:x * TILE, py:y * TILE, dir:dir || 'down', moving:false, tx:x, ty:y, frame:0, anim:0}; }

  function enter(id, spawn, dir) {
    map = getMap(id);
    layer = map.layer;
    resize();
    const s = spawn || map.spawn;
    player = makeEntity(avatarKind, s.x, s.y, dir || s.dir || 'down');
    npcs = map.npcs.map(n => ({...makeEntity(n.kind, n.x, n.y, 'down'), lines:n.lines, say:'', sayUntil:0, wait:1 + Math.random() * 2}));
    path = []; pending = null; nearExhibit = null; heldDir = null;
    snapCamera();
    onEnter(map);
    findNear();
  }

  function snapCamera() { camera.x = player.px + TILE / 2 - viewW / scale / 2; camera.y = player.py + TILE / 2 - viewH / scale / 2 - TILE * 1.2; clampCamera(); }
  function clampCamera() {
    const vw = viewW / scale, vh = viewH / scale;
    camera.x = map.w * TILE <= vw ? (map.w * TILE - vw) / 2 : Math.max(0, Math.min(map.w * TILE - vw, camera.x));
    camera.y = map.h * TILE <= vh ? (map.h * TILE - vh) / 2 : Math.max(0, Math.min(map.h * TILE - vh, camera.y));
  }

  function occupied(x, y, self) { return npcs.some(n => n !== self && ((n.x === x && n.y === y) || (n.tx === x && n.ty === y))) || (self !== player && player.tx === x && player.ty === y); }
  function step(ent, dir) {
    ent.dir = dir;
    const [dx, dy] = DIRS[dir];
    const nx = ent.x + dx, ny = ent.y + dy;
    if (!map.walkable(nx, ny) || occupied(nx, ny, ent)) return false;
    ent.tx = nx; ent.ty = ny; ent.moving = true;
    return true;
  }

  function bfs(from, to) {
    if (!map.walkable(to.x, to.y)) return null;
    const prev = new Map(), key = (x, y) => y * map.w + x, queue = [from];
    prev.set(key(from.x, from.y), null);
    while (queue.length) {
      const cur = queue.shift();
      if (cur.x === to.x && cur.y === to.y) {
        const out = []; let k = key(cur.x, cur.y);
        while (prev.get(k) !== null) { const p = prev.get(k); out.unshift(p.dir); k = p.k; }
        return out;
      }
      for (const [dir, [dx, dy]] of Object.entries(DIRS)) {
        const nx = cur.x + dx, ny = cur.y + dy, nk = key(nx, ny);
        if (map.walkable(nx, ny) && !prev.has(nk)) { prev.set(nk, {k:key(cur.x, cur.y), dir}); queue.push({x:nx, y:ny}); }
      }
    }
    return null;
  }

  function walkTo(x, y, then) {
    const start = {x:player.tx, y:player.ty};
    const p = bfs(start, {x, y});
    if (!p) return false;
    path = p; pending = then || null;
    return true;
  }

  function exhibitAt(x, y) { return map.exhibits.find(e => y === e.y && x >= e.x && x < e.x + e.w); }
  function findNear() {
    const e = map.exhibits.find(e => (player.y === e.y + 1 || player.y === e.y + 2) && player.x >= e.x - 1 && player.x <= e.x + e.w);
    if (e !== nearExhibit) { nearExhibit = e || null; onNear(nearExhibit); }
  }

  function arrive(ent) {
    ent.x = ent.tx; ent.y = ent.ty; ent.px = ent.x * TILE; ent.py = ent.y * TILE; ent.moving = false;
    if (ent !== player) return;
    const portal = map.portals.find(p => p.x === ent.x && p.y === ent.y);
    if (portal) { path = []; pending = null; transition(() => portalGo(portal)); return; }
    findNear();
    if (!path.length && pending) { const f = pending; pending = null; f(); }
  }

  function portalGo(portal) {
    if (portal.to === 'village') {
      const v = getMap('village'), src = v.portals.find(p => p.to === map.id);
      enter('village', {x:src.x, y:src.y + 1}, 'down');
    } else enter(portal.to, null, 'up');
  }

  function transition(mid) { fadeDir = 1; fadeMid = mid; }

  function moveEntity(ent, dt) {
    if (!ent.moving) return;
    const d = SPEED * dt, gx = ent.tx * TILE, gy = ent.ty * TILE;
    ent.px += Math.sign(gx - ent.px) * Math.min(d, Math.abs(gx - ent.px));
    ent.py += Math.sign(gy - ent.py) * Math.min(d, Math.abs(gy - ent.py));
    ent.anim += dt;
    ent.frame = 1 + Math.floor(ent.anim * 8) % 2;
    if (ent.px === gx && ent.py === gy) { ent.frame = 0; ent.anim = 0; arrive(ent); }
  }

  function update(dt) {
    if (fadeDir) {
      fade = Math.max(0, Math.min(1, fade + fadeDir * dt * 4));
      if (fadeDir > 0 && fade >= 1) { const f = fadeMid; fadeMid = null; fadeDir = -1; if (f) f(); fade = 1; }
      if (fadeDir < 0 && fade <= 0) fadeDir = 0;
    }
    if (!player.moving && !fadeDir) {
      const dir = heldDir || [...keys].reverse().find(k => DIRS[k]);
      if (dir) { path = []; pending = null; if (!step(player, dir)) { player.dir = dir; findNear(); } }
      else if (path.length) { const next = path.shift(); if (!step(player, next)) { path = []; pending = null; } }
    }
    moveEntity(player, dt);
    for (const n of npcs) {
      moveEntity(n, dt);
      if (!n.moving) {
        n.wait -= dt;
        if (n.wait <= 0) { n.wait = 1.5 + Math.random() * 3; const dirs = Object.keys(DIRS); const d = dirs[Math.floor(Math.random() * 4)]; const [dx, dy] = DIRS[d]; if (!map.portals.some(p => p.x === n.x + dx && p.y === n.y + dy) && !exhibitAt(n.x + dx, n.y + dy - 1)) step(n, d); }
      }
      const near = Math.abs(n.x - player.x) + Math.abs(n.y - player.y) <= 2;
      if (near && !n.say) { n.say = n.lines[Math.floor(Math.random() * n.lines.length)]; n.sayUntil = performance.now() + 4000; }
      if (n.say && performance.now() > n.sayUntil) { n.say = ''; }
    }
    const tx = player.px + TILE / 2 - viewW / scale / 2, ty = player.py + TILE / 2 - viewH / scale / 2 - TILE * 1.2;
    camera.x += (tx - camera.x) * Math.min(1, dt * 8); camera.y += (ty - camera.y) * Math.min(1, dt * 8);
    clampCamera();
  }

  function drawEntity(ent) {
    const s = (ART.on && ART.charSprite(ent.kind, ent.dir, ent.frame)) || sprite(ent.kind, ent.dir, ent.frame);
    const idle = ent.moving ? 0 : (Math.floor(clock * 2 + (ent.x + ent.y)) % 2);
    const x = Math.round(ent.px + (TILE - s.width) / 2 - camera.x), y = Math.round(ent.py + TILE - s.height - 6 - camera.y) + idle;
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x + 12, y + 31, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(s, x, y);
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function bubble(text, wx, wy) {
    ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '13px ' + FONT;
    const tw = ctx.measureText(text).width + 16, sx = (wx - camera.x) * scale, sy = (wy - camera.y) * scale;
    const bx = Math.max(4, Math.min(viewW - tw - 4, sx - tw / 2)), by = sy - 34;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#18332b'; ctx.lineWidth = 1.5;
    roundRect(bx, by, tw, 24, 8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx - 5, by + 24); ctx.lineTo(sx + 5, by + 24); ctx.lineTo(sx, by + 30); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#18332b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, bx + tw / 2, by + 12);
    ctx.restore();
  }
  function labelStyle(kind) {
    return {building:{font:'16px', fill:'#fff', bg:null, stroke:'#18332b'}, small:{font:'12px', fill:'#fff'}, sign:{font:'12px', fill:'#6b4e12'}, zone:{font:'14px', fill:'#18332b'}, award:{font:'12px', fill:'#5a3a00'}, board:{font:'28px', fill:'#7a4a14'}, title:{font:'12px', fill:'#fff'}}[kind];
  }
  function drawLabels(which) {
    ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const vx0 = camera.x - 64, vy0 = camera.y - 64, vx1 = camera.x + viewW / scale + 64, vy1 = camera.y + viewH / scale + 64;
    for (const l of map.labels) {
      if ((l.kind === 'title' || l.kind === 'award') !== (which === 'title')) continue;
      if (l.x < vx0 || l.x > vx1 || l.y < vy0 || l.y > vy1) continue;
      const st = labelStyle(l.kind), sx = (l.x - camera.x) * scale, sy = (l.y - camera.y) * scale;
      ctx.font = st.font + ' ' + FONT;
      if (l.kind === 'building') { const tw = ctx.measureText(l.text).width + 18; ctx.fillStyle = l.color; roundRect(sx - tw / 2, sy - 12, tw, 24, 12); ctx.fill(); }
      if (l.kind === 'award') {                                  // 수상 메달 배지
        const tw = ctx.measureText(l.text).width + 14, th = 20;
        ctx.fillStyle = l.top ? '#ffd54a' : '#fff0b3'; roundRect(sx - tw / 2, sy - th / 2, tw, th, 10); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#8a5a00'; ctx.stroke();
        ctx.fillStyle = st.fill; ctx.fillText(l.text, sx, sy + 1); continue;
      }
      if (l.kind === 'small' || l.kind === 'title') {           // 둥근 배지
        const tw = ctx.measureText(l.text).width + 14, th = l.kind === 'title' ? 20 : 18;
        ctx.fillStyle = 'rgba(24,51,43,.78)'; roundRect(sx - tw / 2, sy - th / 2, tw, th, th / 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText(l.text, sx, sy + 1); continue;
      }
      if (l.kind === 'board') {                                  // 간판: 바탕 영역 안에 잉크 기준으로 정확히 가운데
        const bw = l.w * scale, bh = l.h * scale;
        let size = Math.min(28, Math.floor(bw / (l.text.length + 0.6)), Math.floor(bh * 0.72));
        ctx.font = size + 'px ' + FONT; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        const mt = ctx.measureText(l.text);
        const tx = sx - (mt.actualBoundingBoxRight - mt.actualBoundingBoxLeft) / 2, ty = sy + (mt.actualBoundingBoxAscent - mt.actualBoundingBoxDescent) / 2;
        ctx.lineJoin = 'round';
        ctx.lineWidth = 5; ctx.strokeStyle = '#fff8e8'; ctx.strokeText(l.text, tx, ty);       // 밝은 테두리
        ctx.fillStyle = 'rgba(80,45,10,.35)'; ctx.fillText(l.text, tx + 2, ty + 2);          // 그림자
        ctx.lineWidth = 2; ctx.strokeStyle = '#3a2208'; ctx.strokeText(l.text, tx, ty);       // 진한 외곽선
        ctx.fillStyle = st.fill; ctx.fillText(l.text, tx, ty);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; continue;
      }
      if (st.stroke) { ctx.lineWidth = 3; ctx.strokeStyle = st.stroke; ctx.strokeText(l.text, sx, sy); }
      ctx.fillStyle = l.kind === 'zone' ? l.color : st.fill;
      ctx.fillText(l.text, sx, sy);
    }
    ctx.restore();
  }
  function drawExhibits() {
    const fi = map.frameImage && ART.images[map.frameImage], fo = ART.FRAME_OPEN;
    for (const e of map.exhibits) {
      const x = (fi ? e.x * TILE + 2 + fo.x : e.x * TILE + 6) - camera.x, y = (fi ? e.y * TILE + 28 - fi.height + fo.y : e.y * TILE - 10) - camera.y, w = fi ? fo.w : e.w * TILE - 12, h = fi ? fo.h : TILE + 2;
      if (x + w < -8 || x > viewW / scale + 8 || y + h < -8 || y > viewH / scale + 8) continue;
      const img = thumb(e.work);
      ctx.save(); ctx.imageSmoothingEnabled = true;
      if (img) { const r = Math.min(w / img.naturalWidth, h / img.naturalHeight), dw = img.naturalWidth * r, dh = img.naturalHeight * r; ctx.fillStyle = '#f6f6f3'; ctx.fillRect(x, y, w, h); ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); }
      else { ctx.fillStyle = '#fff8e8'; ctx.fillRect(x, y, w, h); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.font = '12px ' + FONT; ctx.fillStyle = e.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const sx = (x + w / 2) * scale, sy = (y + h / 2) * scale; const t = e.work.title; ctx.fillText(t.length > 7 ? t.slice(0, 7) + '…' : t, sx, sy); }
      ctx.restore();
      if (e.award) { ctx.strokeStyle = e.award.rank <= 3 ? '#ffc400' : '#ffe08a'; ctx.lineWidth = 2; ctx.strokeRect(x - 7, y - 7, w + 14, h + 14); }
      if (e === nearExhibit) { ctx.strokeStyle = '#ffe36b'; ctx.lineWidth = 3; ctx.strokeRect(x - 5, y - 5, w + 10, h + 10); }
    }
  }

  function drawEffects() {
    const t = clock, vx0 = Math.floor(camera.x / TILE), vy0 = Math.floor(camera.y / TILE), vx1 = Math.ceil((camera.x + viewW / scale) / TILE), vy1 = Math.ceil((camera.y + viewH / scale) / TILE);
    for (let y = Math.max(0, vy0); y <= Math.min(map.h - 1, vy1); y++) for (let x = Math.max(0, vx0); x <= Math.min(map.w - 1, vx1); x++) {
      const k = map.ground[y * map.w + x];
      if (k.startsWith('water')) {
        const ph = (t * 1.5 + x * .7 + y * 1.3) % 3;
        ctx.fillStyle = 'rgba(255,255,255,' + (ph < 1 ? .55 : ph < 2 ? .25 : 0) + ')';
        ctx.fillRect(x * TILE + 6 + ((x * 5 + y * 3) % 14) - camera.x, y * TILE + 10 + ((x * 3 + y * 7) % 12) - camera.y, 6, 2);
      }
    }
    if (map.id === 'village') {                                   // 분수 물방울
      const fx = map.fountain ? map.fountain.x : 22 * TILE, fy = map.fountain ? map.fountain.y : 21 * TILE + 8;
      for (let i = 0; i < 6; i++) { const a = (t * 2 + i) % 1, dx = Math.cos(i * 1.05) * 14 * a, dy = -18 * Math.sin(a * Math.PI) + a * 10; ctx.fillStyle = 'rgba(220,245,255,' + (1 - a) + ')'; ctx.fillRect(fx + dx - camera.x, fy + dy - camera.y, 2, 2); }
    }
    for (const e of map.exhibits) {                               // 액자 스포트라이트
      const x = (e.x + 1) * TILE - camera.x, y = e.y * TILE - 8 - camera.y;
      if (x < -80 || x > viewW / scale + 80 || y < -60 || y > viewH / scale + 60) continue;
      const grad = ctx.createRadialGradient(x, y, 4, x, y, 52); grad.addColorStop(0, 'rgba(255,240,180,.28)'); grad.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = grad; ctx.fillRect(x - 52, y - 30, 104, 90);
    }
  }
  function drawVignette() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const grad = ctx.createRadialGradient(viewW / 2, viewH / 2, Math.min(viewW, viewH) * .45, viewW / 2, viewH / 2, Math.max(viewW, viewH) * .75);
    grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(10,30,20,.35)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, viewW, viewH);
  }
  function drawMinimap() {
    if (!mctx) return;
    const mw = mini.width, mh = mini.height, s = Math.min(mw / (map.w * TILE), mh / (map.h * TILE));
    const ox = (mw - map.w * TILE * s) / 2, oy = (mh - map.h * TILE * s) / 2;
    mctx.imageSmoothingEnabled = true;
    mctx.fillStyle = '#10211b'; mctx.fillRect(0, 0, mw, mh);
    mctx.drawImage(layer, ox, oy, map.w * TILE * s, map.h * TILE * s);
    mctx.strokeStyle = 'rgba(255,255,255,.7)'; mctx.lineWidth = 1;
    mctx.strokeRect(ox + camera.x * s, oy + camera.y * s, viewW / scale * s, viewH / scale * s);
    for (const n of npcs) { mctx.fillStyle = '#fff'; mctx.fillRect(ox + (n.px + 12) * s - 1.5, oy + (n.py + 16) * s - 1.5, 3, 3); }
    mctx.fillStyle = '#ffe36b'; mctx.beginPath(); mctx.arc(ox + (player.px + 16) * s, oy + (player.py + 16) * s, 3, 0, Math.PI * 2); mctx.fill();
    mctx.strokeStyle = '#18332b'; mctx.stroke();
  }

  function render() {
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1f3d2e'; ctx.fillRect(0, 0, viewW / scale, viewH / scale);
    ctx.drawImage(layer, -camera.x, -camera.y);
    drawEffects();
    drawExhibits();
    drawLabels('title');
    [...npcs, player].sort((a, b) => a.py - b.py).forEach(drawEntity);
    if (path.length) { const last = path.length ? pathEnd() : null; if (last) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.strokeRect(last.x * TILE + 4 - camera.x, last.y * TILE + 4 - camera.y, TILE - 8, TILE - 8); } }
    drawLabels('other');
    for (const n of npcs) if (n.say) bubble(n.say, n.px + TILE / 2, n.py - 8);
    drawVignette();
    drawMinimap();
    if (fade > 0) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = 'rgba(16,30,25,' + fade + ')'; ctx.fillRect(0, 0, viewW, viewH); }
  }
  function pathEnd() { let x = player.tx, y = player.ty; for (const d of path) { x += DIRS[d][0]; y += DIRS[d][1]; } return {x, y}; }

  function loop(t) {
    if (!running) return;
    const dt = Math.min(.05, (t - lastTime) / 1000 || 0); lastTime = t; clock += dt;
    update(dt); render();
    requestAnimationFrame(loop);
  }

  function screenToTile(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    return {x:Math.floor(((cx - rect.left) / scale + camera.x) / TILE), y:Math.floor(((cy - rect.top) / scale + camera.y) / TILE)};
  }
  function tapAt(cx, cy) {
    const t = screenToTile(cx, cy);
    const e = exhibitAt(t.x, t.y) || exhibitAt(t.x, t.y + 1);
    if (e) { goToExhibit(e); return; }
    const npc = npcs.find(n => n.x === t.x && n.y === t.y);
    if (npc) { npc.say = npc.lines[Math.floor(Math.random() * npc.lines.length)]; npc.sayUntil = performance.now() + 4000; return; }
    if (map.walkable(t.x, t.y)) walkTo(t.x, t.y);
    else { for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if (map.walkable(t.x + dx, t.y + dy)) { walkTo(t.x + dx, t.y + dy); break; } }
  }
  function goToExhibit(e, instant, silent) {
    const target = map.walkable(e.interact.x, e.interact.y) ? e.interact : e.interact2;
    if (instant) { player.x = player.tx = target.x; player.y = player.ty = target.y; player.px = target.x * TILE; player.py = target.y * TILE; player.dir = 'up'; player.moving = false; path = []; pending = null; snapCamera(); findNear(); if (!silent) onInteract(e); return; }
    if (player.x === target.x && player.y === target.y) { player.dir = 'up'; onInteract(e); return; }
    walkTo(target.x, target.y, () => { player.dir = 'up'; findNear(); onInteract(e); });
  }

  function interact() { if (nearExhibit) { player.dir = 'up'; onInteract(nearExhibit); return true; } return false; }

  function start(kind) {
    avatarKind = kind;
    resize();
    if (!map) enter('village');
    else { player.kind = kind; }
    if (!running) { running = true; lastTime = performance.now(); requestAnimationFrame(loop); }
  }

  window.addEventListener('resize', () => { if (map) { resize(); clampCamera(); } });
  canvas.addEventListener('pointerdown', ev => { if (!map) return; canvas.focus({preventScroll:true}); tapAt(ev.clientX, ev.clientY); ev.preventDefault(); });

  return {
    start, enter, interact, goToExhibit, resize,
    setHeld(dir) { heldDir = dir; },
    keyDown(k) { keys.add(k); }, keyUp(k) { keys.delete(k); }, clearKeys() { keys.clear(); heldDir = null; },
    on(evt, fn) { if (evt === 'near') onNear = fn; if (evt === 'enter') onEnter = fn; if (evt === 'interact') onInteract = fn; },
    get map() { return map; }, get player() { return player; }, get avatar() { return avatarKind; },
    set avatar(k) { avatarKind = k; if (player) player.kind = k; },
    thumbLoaded() {}
  };
})();
