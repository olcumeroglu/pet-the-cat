// İnsan eli (elin üstü görünümü) — fareyi / dokunmayı takip eder
(function () {
  const U = KS.U;
  const SKIN = [238, 198, 172], SKIN_D = [200, 150, 124], SKIN_L = [252, 222, 202], NAIL = [246, 214, 204];
  const FING = [
    { x: -44, len: 74, w: 21, a: -0.16 },
    { x: -15, len: 92, w: 24, a: -0.05 },
    { x: 15, len: 88, w: 24, a: 0.04 },
    { x: 43, len: 70, w: 20, a: 0.14 },
  ];
  function capsule(path, bx, by, a, len, w0, w1) {
    const dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx;
    const tx = bx + dx * len, ty = by + dy * len, phi = Math.atan2(ny, nx);
    path.moveTo(bx + (nx * w0) / 2, by + (ny * w0) / 2);
    path.lineTo(tx + (nx * w1) / 2, ty + (ny * w1) / 2);
    path.arc(tx, ty, w1 / 2, phi, phi - Math.PI, true);
    path.lineTo(bx - (nx * w0) / 2, by - (ny * w0) / 2);
    path.closePath();
    return { dx, dy, nx, ny, tx, ty };
  }
  function geom(h, t) {
    const fingers = FING.map((f, i) => {
      const wig = h.scratch * Math.sin(t * 22 + i * 1.7) * 0.14;
      return {
        bx: f.x * (0.92 + 0.12 * h.spread), by: 30,
        a: f.a * (0.7 + h.spread * 0.8) + wig,
        len: f.len * (1 - 0.32 * h.curl), w: f.w,
      };
    });
    return fingers;
  }
  function backPath() {
    const b = new Path2D();
    b.moveTo(-62, 36);
    b.bezierCurveTo(-58, 14, 58, 12, 62, 32);
    b.bezierCurveTo(68, 70, 60, 110, 48, 138);
    b.lineTo(-46, 138);
    b.bezierCurveTo(-62, 108, -70, 68, -62, 36);
    return b;
  }
  function silhouette(h, t) {
    const s = new Path2D();
    geom(h, t).forEach((f) => capsule(s, f.bx, f.by, f.a, f.len, f.w, f.w * 0.88));
    capsule(s, -56, 98, -0.8, 60, 30, 25);
    s.addPath(backPath());
    s.rect(-50, 130, 100, 900);
    return s;
  }

  function draw(ctx, h, t) {
    const lift = h.pressed ? 0.4 : 1;
    // gölge
    ctx.save();
    ctx.translate(h.x + h.shx + 10 * lift, h.y + h.shy + 18 * lift);
    ctx.rotate(h.rot); ctx.scale(h.s, h.s);
    ctx.globalAlpha = h.alpha * 0.22;
    try { ctx.filter = 'blur(10px)'; } catch (e) { /* desteklenmiyor */ }
    ctx.fillStyle = '#2a1a10';
    ctx.fill(silhouette(h, t));
    ctx.restore();

    ctx.save();
    ctx.translate(h.x + h.shx, h.y + h.shy); ctx.rotate(h.rot); ctx.scale(h.s, h.s);
    ctx.globalAlpha = h.alpha;
    // ön kol + kazak kolu
    let g = ctx.createLinearGradient(-50, 0, 50, 0);
    g.addColorStop(0, U.rgba(SKIN_D)); g.addColorStop(0.4, U.rgba(SKIN_L)); g.addColorStop(1, U.rgba(SKIN_D));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-47, 128); ctx.lineTo(47, 128); ctx.lineTo(54, 360); ctx.lineTo(-54, 360); ctx.fill();
    g = ctx.createLinearGradient(-70, 0, 70, 0);
    g.addColorStop(0, '#8a6431'); g.addColorStop(0.45, '#d6a85a'); g.addColorStop(1, '#8a6431');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-68, 320, 136, 1200, 26) : ctx.rect(-68, 320, 136, 1200); ctx.fill();
    ctx.strokeStyle = 'rgba(90,60,25,0.35)'; ctx.lineWidth = 3;
    for (let x = -60; x <= 60; x += 10) { ctx.beginPath(); ctx.moveTo(x, 326); ctx.lineTo(x, 380); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(90,60,25,0.25)'; ctx.beginPath(); ctx.moveTo(-68, 382); ctx.lineTo(68, 382); ctx.stroke();

    // parmaklar
    const F = geom(h, t);
    F.forEach((f) => {
      const p = new Path2D();
      const k = capsule(p, f.bx, f.by, f.a, f.len, f.w, f.w * 0.88);
      const gr = ctx.createLinearGradient(f.bx + (k.nx * f.w) / 2, f.by + (k.ny * f.w) / 2, f.bx - (k.nx * f.w) / 2, f.by - (k.ny * f.w) / 2);
      gr.addColorStop(0, U.rgba(SKIN_D)); gr.addColorStop(0.4, U.rgba(SKIN_L)); gr.addColorStop(0.7, U.rgba(SKIN)); gr.addColorStop(1, U.rgba(SKIN_D));
      ctx.fillStyle = gr; ctx.fill(p);
      ctx.strokeStyle = 'rgba(150,95,70,0.35)'; ctx.lineWidth = 1.2; ctx.stroke(p);
      if (h.curl > 0.25) {
        const tg = ctx.createLinearGradient(k.tx - k.dx * 20, k.ty - k.dy * 20, k.tx + k.dx * 10, k.ty + k.dy * 10);
        tg.addColorStop(0, 'rgba(120,70,50,0)'); tg.addColorStop(1, `rgba(120,70,50,${(h.curl - 0.25) * 0.6})`);
        ctx.fillStyle = tg; ctx.fill(p);
      }
      // tırnak
      const nx = k.tx - k.dx * f.len * 0.1, ny = k.ty - k.dy * f.len * 0.1;
      ctx.save(); ctx.translate(nx, ny); ctx.rotate(f.a);
      ctx.fillStyle = U.rgba(NAIL); ctx.beginPath(); ctx.ellipse(0, 0, f.w * 0.3, f.len * 0.12, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(0, 0, f.w * 0.3, f.len * 0.12, 0, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.restore();
      // eklem kıvrımları
      ctx.strokeStyle = 'rgba(150,95,70,0.3)'; ctx.lineWidth = 1;
      for (const fr of [0.38, 0.66]) {
        const cx = f.bx + k.dx * f.len * fr, cy = f.by + k.dy * f.len * fr;
        ctx.beginPath(); ctx.moveTo(cx + (k.nx * f.w) * 0.3, cy + (k.ny * f.w) * 0.3);
        ctx.quadraticCurveTo(cx + k.dx * 2, cy + k.dy * 2, cx - (k.nx * f.w) * 0.3, cy - (k.ny * f.w) * 0.3); ctx.stroke();
      }
    });
    // başparmak
    const tp = new Path2D();
    capsule(tp, -56, 98, -0.8, 60, 30, 25);
    g = ctx.createLinearGradient(-90, 40, -40, 100);
    g.addColorStop(0, U.rgba(SKIN)); g.addColorStop(1, U.rgba(SKIN_D));
    ctx.fillStyle = g; ctx.fill(tp); ctx.strokeStyle = 'rgba(150,95,70,0.35)'; ctx.stroke(tp);
    // elin üstü
    const bp = backPath();
    g = ctx.createRadialGradient(-6, 70, 5, 0, 76, 80);
    g.addColorStop(0, U.rgba(SKIN_L)); g.addColorStop(0.7, U.rgba(SKIN)); g.addColorStop(1, U.rgba(SKIN_D));
    ctx.fillStyle = g; ctx.fill(bp);
    ctx.fillStyle = 'rgba(255,240,230,0.35)';
    F.forEach((f) => { ctx.beginPath(); ctx.ellipse(f.bx, f.by + 6, f.w * 0.42, 6, 0, 0, 7); ctx.fill(); });
    ctx.strokeStyle = 'rgba(160,110,90,0.15)'; ctx.lineWidth = 2;
    for (const f of F) { ctx.beginPath(); ctx.moveTo(f.bx * 0.9, f.by + 16); ctx.quadraticCurveTo(f.bx * 0.6, 90, f.bx * 0.3, 128); ctx.stroke(); }
    ctx.restore();
  }
  KS.Hand = { draw };
})();
