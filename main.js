// Oyun döngüsü, giriş (fare / dokunma / klavye), otomatik el hareketleri
(function () {
  const U = KS.U;
  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d');
  const $ = (s) => document.querySelector(s);
  let W = 0, H = 0, dpr = 1, scale = 1, gx = 0, gy = 0, bg = null, buildTimer = 0;

  let lookKey = 'tabby';
  try { lookKey = localStorage.getItem('kedi-sev-cat') || 'tabby'; } catch (e) { /* yok */ }
  if (!KS.Looks[lookKey]) lookKey = 'tabby';
  const cat = new KS.Cat(KS.Looks[lookKey]);

  const hand = { x: 0, y: -300, tx: 0, ty: -300, rot: -0.3, s: 0.95, alpha: 0, visible: false, pressed: false,
    speed: 0, curl: 0.15, spread: 0.1, scratch: 0, shx: 0, shy: 0, auto: false };
  const mouse = { x: 0, y: 0, in: false, down: false };
  const keys = {};
  const particles = [];

  const toWorld = (sx, sy) => [(sx - gx) / scale, (sy - gy) / scale];

  function resize() {
    if (!innerWidth || !innerHeight) { setTimeout(resize, 100); return; }
    W = innerWidth; H = innerHeight;
    dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    gy = H * (W < 700 ? 0.74 : 0.8);
    scale = Math.min((gy - 80) / 580, (W * 0.94) / 720);
    gx = W / 2;
    bg = KS.Scene.build(W, H, dpr, gx, gy, scale);
    scheduleBuild();
  }
  function scheduleBuild() {
    clearTimeout(buildTimer);
    $('#loading').classList.add('on');
    buildTimer = setTimeout(() => {
      cat.build(Math.min(2.4, Math.max(0.6, scale * dpr)));
      $('#loading').classList.remove('on');
    }, 40);
  }
  function setCat(k) {
    if (!KS.Looks[k] || (k === lookKey && cat.sprites)) return;
    lookKey = k;
    try { localStorage.setItem('kedi-sev-cat', k); } catch (e) { /* yok */ }
    cat.setLook(KS.Looks[k]);
    document.querySelectorAll('[data-cat]').forEach((b) => b.classList.toggle('on', b.dataset.cat === k));
    scheduleBuild();
  }

  // ---------- Otomatik el hareketleri (tuşlar) ----------
  const Dir = { a: null, t: 0, fixed: null };
  function startAction(k) {
    KS.Audio.init();
    $('#hint').classList.add('gone');
    Dir.t = 0; Dir.a = null;
    switch (k) {
      case 'head': if (cat.mode === 'belly') cat.setMode('sit'); Dir.a = { k, dur: 6 }; break;
      case 'cheek': if (cat.mode === 'belly') cat.setMode('sit'); Dir.a = { k, dur: 6.5 }; break;
      case 'rub': {
        if (cat.mode === 'belly') cat.setMode('sit');
        Dir.a = { k, dur: 8 };
        const H0 = cat.headWorld;
        Dir.fixed = [H0.x + 175, H0.y + 20];
        break;
      }
      case 'belly': cat.setMode('belly'); Dir.a = { k, dur: 7 }; break;
      case 'bite': cat.trigger('bite'); Dir.a = { k, dur: 2.3 }; break;
      case 'loaf': cat.setMode('loaf'); break;
      case 'knead': cat.trigger('knead'); break;
      case 'purr': cat.trigger('purr'); break;
      case 'sit': cat.setMode('sit'); break;
    }
    document.querySelectorAll('[data-act]').forEach((b) => b.classList.toggle('on', b.dataset.act === k));
    setTimeout(() => document.querySelectorAll('[data-act]').forEach((b) => b.classList.remove('on')), 400);
  }
  function directorHand(dt) {
    const a = Dir.a;
    if (!a) return null;
    Dir.t += dt;
    const t = Dir.t;
    if (t > a.dur) { Dir.a = null; return null; }
    const hp = (lx, ly) => cat.headToWorld(lx, ly);
    switch (a.k) {
      case 'head':
        return { pos: hp(0, -60 + 32 * Math.sin(t * 2.4)), pressed: t > 0.5, arm: toWorld(W * 0.7, -300), curl: 0.3 };
      case 'cheek': {
        const sd = t < a.dur / 2 ? -1 : 1;
        const [x, y] = hp(sd * 98, 22);
        return { pos: [x + 7 * Math.sin(t * 15), y + 5 * Math.cos(t * 15)], pressed: t > 0.4, scratch: 1, curl: 0.55,
          arm: toWorld(sd < 0 ? W * 0.08 : W * 0.92, H + 250) };
      }
      case 'rub':
        return { pos: [Dir.fixed[0] + Math.sin(t * 0.8) * 3, Dir.fixed[1]], pressed: false, curl: 0.15,
          arm: toWorld(W + 300, H * 0.8) };
      case 'belly': {
        const [x, y] = cat.bodyToWorld(0, 20 + 55 * Math.sin(t * 2.2));
        return { pos: t < 1.3 ? cat.bodyToWorld(0, 20) : [x, y], pressed: t > 1.4, curl: 0.2, arm: toWorld(W * 0.7, H + 300) };
      }
      case 'bite':
        return { pos: hp(40, 85), pressed: false, curl: 0.2, arm: toWorld(W * 0.9, H + 250) };
    }
    return null;
  }

  // ---------- Giriş ----------
  cv.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.in = true; });
  cv.addEventListener('pointerdown', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.in = true; mouse.down = true;
    KS.Audio.init();
    $('#hint').classList.add('gone');
    if (Dir.a) Dir.a = null;
    try { cv.setPointerCapture(e.pointerId); } catch (er) { /* yok */ }
  });
  const up = (e) => { mouse.down = false; if (e.pointerType !== 'mouse') mouse.in = false; };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', (e) => { if (!mouse.down && e.pointerType === 'mouse') mouse.in = false; });

  const KEYMAP = { '1': 'head', q: 'head', '2': 'cheek', w: 'cheek', '3': 'rub', e: 'rub', '4': 'belly', r: 'belly',
    '5': 'loaf', t: 'loaf', '6': 'bite', y: 'bite', '7': 'purr', p: 'purr', '8': 'knead', k: 'knead', ' ': 'sit' };
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (e.target && e.target.tagName === 'INPUT') return;
    keys[k] = true;
    if (KEYMAP[k] && !e.repeat) { startAction(KEYMAP[k]); e.preventDefault(); }
    else if (k === 'c' && !e.repeat) setCat(lookKey === 'tabby' ? 'tuxedo' : 'tabby');
    else if (k === 'm' && !e.repeat) toggleSound();
    if (k.startsWith('arrow')) {
      e.preventDefault();
      if (!mouse.in) { mouse.in = true; mouse.x = gx + 220 * scale; mouse.y = gy - 300 * scale; }
      KS.Audio.init();
    }
    if (k === 'enter' || k === 'z') { mouse.down = true; KS.Audio.init(); }
  });
  addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    keys[k] = false;
    if (k === 'enter' || k === 'z') mouse.down = false;
  });

  document.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => { startAction(b.dataset.act); b.blur(); }));
  document.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { setCat(b.dataset.cat); b.blur(); }));
  function toggleSound() {
    KS.Audio.init();
    KS.Audio.setMuted(!KS.Audio.muted);
    $('#sound').textContent = KS.Audio.muted ? 'Ses: Kapalı' : 'Ses: Açık';
  }
  $('#sound').addEventListener('click', (e) => { toggleSound(); e.currentTarget.blur(); });
  document.querySelectorAll('[data-cat]').forEach((b) => b.classList.toggle('on', b.dataset.cat === lookKey));

  // ---------- Parçacıklar ----------
  function heart(ctx2, s) {
    ctx2.beginPath();
    ctx2.moveTo(0, s * 0.35);
    ctx2.bezierCurveTo(-s, -s * 0.3, -s * 0.5, -s, 0, -s * 0.45);
    ctx2.bezierCurveTo(s * 0.5, -s, s, -s * 0.3, 0, s * 0.35);
    ctx2.fill();
  }
  function drawParticles(dt) {
    for (const ev of cat.events) {
      particles.push({ ...ev, vx: (Math.random() - 0.5) * 30, vy: -60 - Math.random() * 40, life: 0, max: ev.type === 'mrr' ? 2.2 : 1.8 });
    }
    cat.events.length = 0;
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life += dt; q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.life > q.max) { particles.splice(i, 1); continue; }
      const a = Math.sin((q.life / q.max) * Math.PI);
      ctx.save(); ctx.translate(q.x + Math.sin(q.life * 4) * 8, q.y); ctx.globalAlpha = a * 0.9;
      if (q.type === 'heart') { ctx.fillStyle = '#e8657a'; heart(ctx, 16 + q.life * 4); }
      else { ctx.fillStyle = 'rgba(80,70,60,0.8)'; ctx.font = 'italic 600 26px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('mrrr', 0, 0); }
      ctx.restore();
    }
  }

  // ---------- Döngü ----------
  let last = performance.now(), lastStatus = '', statusEl = $('#status'), joyEl = $('#joy');
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const kv = 520 * dt * scale;
    if (keys.arrowleft) mouse.x -= kv;
    if (keys.arrowright) mouse.x += kv;
    if (keys.arrowup) mouse.y -= kv;
    if (keys.arrowdown) mouse.y += kv;

    const d = directorHand(dt);
    let arm;
    if (d) {
      hand.auto = true; hand.visible = true;
      hand.tx = d.pos[0]; hand.ty = d.pos[1]; hand.pressed = d.pressed;
      hand.curl = U.approach(hand.curl, d.curl, 6, dt);
      hand.scratch = U.approach(hand.scratch, d.scratch || 0, 6, dt);
      arm = d.arm;
    } else {
      hand.auto = false; hand.visible = mouse.in;
      const w = toWorld(mouse.x, mouse.y);
      hand.tx = w[0]; hand.ty = w[1]; hand.pressed = mouse.down;
      hand.curl = U.approach(hand.curl, mouse.down ? 0.32 : 0.12, 6, dt);
      hand.scratch = U.approach(hand.scratch, 0, 6, dt);
      arm = toWorld(W * 0.82, H + 260);
    }
    if (hand.alpha < 0.05) { hand.x = hand.tx; hand.y = hand.ty; }
    const px = hand.x, py = hand.y;
    const rate = hand.auto ? 7 : 30;
    hand.x = U.approach(hand.x, hand.tx, rate, dt);
    hand.y = U.approach(hand.y, hand.ty, rate, dt);
    hand.speed = U.approach(hand.speed, Math.hypot(hand.x - px, hand.y - py) / Math.max(dt, 1e-3), 10, dt);
    hand.alpha = U.approach(hand.alpha, hand.visible ? 1 : 0, 8, dt);
    hand.rot = U.angApproach(hand.rot, Math.atan2(hand.x - arm[0], -(hand.y - arm[1])), 8, dt);
    if (cat.biteAmt > 0.3) {
      hand.shx = Math.sin(now * 0.045) * 4 * cat.biteAmt;
      hand.shy = Math.cos(now * 0.06) * 3 * cat.biteAmt;
    } else { hand.shx = hand.shy = 0; }

    if (cat.sprites) {
      cat.update(dt, { x: hand.x, y: hand.y, visible: hand.visible && hand.alpha > 0.5, pressed: hand.pressed, speed: hand.speed });
      KS.Audio.setLevel(cat.purr);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (bg) ctx.drawImage(bg, 0, 0);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * gx, dpr * gy);
    if (cat.sprites) {
      // duvara düşen yumuşak gölge
      ctx.save(); ctx.translate(cat.p.bx + 70, -320); ctx.scale(1, 1.15);
      const g = ctx.createRadialGradient(0, 0, 20, 0, 0, 260);
      g.addColorStop(0, 'rgba(60,45,30,0.10)'); g.addColorStop(1, 'rgba(60,45,30,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 260, 0, 7); ctx.fill(); ctx.restore();

      const grab = cat.biteAmt > 0.3;
      cat.draw(ctx, grab);
      if (hand.alpha > 0.01) KS.Hand.draw(ctx, hand, now / 1000);
      if (grab) cat.drawLegs(ctx);
      drawParticles(dt);
    }
    if (cat.status !== lastStatus) {
      lastStatus = cat.status;
      statusEl.textContent = cat.status;
      statusEl.classList.toggle('show', !!cat.status);
    }
    joyEl.style.width = cat.joy.toFixed(1) + '%';
    cv.style.cursor = hand.visible && !hand.auto ? 'none' : 'default';
    requestAnimationFrame(frame);
  }

  addEventListener('resize', () => { clearTimeout(resize._t); resize._t = setTimeout(resize, 120); });
  resize();
  requestAnimationFrame(frame);
  KS.debug = { cat, hand, startAction, mouse };
})();
