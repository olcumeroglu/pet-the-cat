// Tüy dokusu üretici + kedi görünümleri (Tekir ve Smokin)
// Her vücut parçası bir kez, binlerce tek tek çizilmiş tüy teliyle offscreen canvas'a işlenir.
(function () {
  const U = KS.U;
  const H = U.hex;

  function poly(fn, n) {
    const p = [];
    for (let i = 0; i < n; i++) p.push(fn((i / n) * Math.PI * 2));
    return p;
  }
  function quadPts(P, a, b, c, n) {
    for (let i = 0; i < n; i++) {
      const t = i / n, m = 1 - t;
      P.push([m * m * a[0] + 2 * m * t * b[0] + t * t * c[0], m * m * a[1] + 2 * m * t * b[1] + t * t * c[1]]);
    }
  }

  // ---------- Parça şekilleri (yerel birimler) ----------
  const SH = {};
  SH.body = () => [
    poly((a) => {
      const c = Math.cos(a), s = Math.sin(a);
      const x = c * (s < 0 ? 132 - 42 * Math.pow(-s, 1.6) : 134 + 6 * s);
      const y = s < 0 ? s * 166 : 160 * Math.pow(s, 0.7);
      return [x, y];
    }, 72),
  ];
  SH.haunch = () => [
    poly((a) => {
      const c = Math.cos(a), s = Math.sin(a);
      return [c * (64 + 5 * s), s * (s < 0 ? 80 : 86)];
    }, 48),
    poly((a) => [18 + Math.cos(a) * 34, 80 + Math.sin(a) * 19], 28),
  ];
  SH.leg = () => {
    const P = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; P.push([-29 + 5 * t - 3 * Math.sin(t * Math.PI), t * 128]); }
    for (let i = 0; i <= 16; i++) { const a = Math.PI - (i / 16) * Math.PI; P.push([Math.cos(a) * 32, 148 + Math.sin(a) * 28]); }
    for (let i = 10; i >= 0; i--) { const t = i / 10; P.push([29 - 5 * t + 3 * Math.sin(t * Math.PI), t * 128]); }
    for (let i = 1; i < 8; i++) { const t = i / 8; P.push([29 - 58 * t, -8 * Math.sin(t * Math.PI)]); }
    return [P];
  };
  SH.head = () => [
    poly((a) => {
      const c = Math.cos(a), s = Math.sin(a);
      const ch = Math.exp(-Math.pow((s - 0.28) / 0.4, 2));
      let x = c * (106 + 20 * ch), y = s * (s < 0 ? 98 : 90);
      if (s > 0.5) x *= 1 - (s - 0.5) * 0.55;
      return [x, y];
    }, 90),
  ];
  SH.ear = () => {
    const P = [];
    quadPts(P, [-42, 4], [-34, -50], [-8, -92], 14);
    quadPts(P, [-8, -92], [-2, -100], [6, -90], 5);
    quadPts(P, [6, -90], [32, -48], [42, 4], 14);
    quadPts(P, [42, 4], [0, 14], [-42, 4], 8);
    return [P];
  };
  SH.tail = () => {
    const L = 270, h = (x) => 22 - (6 * x) / L, P = [], xe = L - 17;
    for (let i = 0; i <= 20; i++) { const x = (i / 20) * xe; P.push([x, -h(x)]); }
    const r = h(xe);
    for (let i = 1; i < 12; i++) { const a = -Math.PI / 2 + (i / 12) * Math.PI; P.push([xe + Math.cos(a) * r, Math.sin(a) * r]); }
    for (let i = 20; i >= 0; i--) { const x = (i / 20) * xe; P.push([x, h(x)]); }
    P.push([-6, 0]);
    return [P];
  };

  function bounds(polys) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of polys) for (const [x, y] of p) {
      if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
    }
    return [x0, y0, x1, y1];
  }
  const c255 = (v) => (v > 255 ? 255 : v < 0 ? 0 : v | 0);

  // ---------- Tüylü sprite üretimi ----------
  function build(spec, res, seed) {
    const rnd = U.rng(seed);
    const polys = spec.polys, pad = spec.pad || 16;
    const [bx0, by0, bx1, by1] = bounds(polys);
    const x0 = bx0 - pad, y0 = by0 - pad, w = bx1 - bx0 + 2 * pad, h = by1 - by0 + 2 * pad;
    const cw = Math.ceil(w * res), ch = Math.ceil(h * res);
    const c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    const g = c.getContext('2d');
    g.setTransform(res, 0, 0, res, -x0 * res, -y0 * res);
    const path = new Path2D();
    polys.forEach((p) => U.smoothPath(path, p));

    // maske
    const m = document.createElement('canvas');
    m.width = cw; m.height = ch;
    const mg = m.getContext('2d');
    mg.setTransform(res, 0, 0, res, -x0 * res, -y0 * res);
    mg.fill(path);
    const md = mg.getImageData(0, 0, cw, ch).data;
    const inside = (x, y) => {
      const px = ((x - x0) * res) | 0, py = ((y - y0) * res) | 0;
      if (px < 0 || py < 0 || px >= cw || py >= ch) return false;
      return md[(py * cw + px) * 4 + 3] > 127;
    };

    // alt renk katmanı (desen)
    const lr = Math.min(res, Math.max(0.35, res * 0.5));
    const lw = Math.ceil(w * lr), lh = Math.ceil(h * lr);
    const lc = document.createElement('canvas');
    lc.width = lw; lc.height = lh;
    const lg = lc.getContext('2d');
    const id = lg.createImageData(lw, lh);
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
      const col = spec.color(x0 + (i + 0.5) / lr, y0 + (j + 0.5) / lr);
      const k = (j * lw + i) * 4;
      id.data[k] = col[0]; id.data[k + 1] = col[1]; id.data[k + 2] = col[2]; id.data[k + 3] = 255;
    }
    lg.putImageData(id, 0, 0);
    g.save(); g.clip(path); g.drawImage(lc, x0, y0, w, h); g.restore();

    // iç tüy telleri
    let cnt = 0;
    for (let i = 3; i < md.length; i += 4) if (md[i] > 127) cnt++;
    const n = Math.floor(cnt * (spec.density || 0.085));
    const len = spec.len || 9;
    g.lineCap = 'round';
    const strand = (x, y, a, L, col, alpha, lwPx) => {
      const j = 0.76 + rnd() * 0.46;
      const ca = Math.cos(a), sa = Math.sin(a), bend = (rnd() - 0.5) * L * 0.5;
      g.strokeStyle = `rgb(${c255(col[0] * j)},${c255(col[1] * j)},${c255(col[2] * j)})`;
      g.globalAlpha = alpha;
      g.lineWidth = lwPx / res;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + ca * L * 0.5 - sa * bend, y + sa * L * 0.5 + ca * bend, x + ca * L, y + sa * L);
      g.stroke();
    };
    for (let k = 0; k < n; k++) {
      let x, y, tries = 0;
      do { x = bx0 + rnd() * (bx1 - bx0); y = by0 + rnd() * (by1 - by0); tries++; } while (!inside(x, y) && tries < 8);
      if (tries >= 8) continue;
      const a = spec.flow(x, y) + (rnd() - 0.5) * 0.6;
      const L = len * (0.5 + rnd() * 0.9) * (spec.lenMul ? spec.lenMul(x, y) : 1);
      const col = spec.color(x + (rnd() - 0.5) * 2, y + (rnd() - 0.5) * 2);
      strand(x - Math.cos(a) * L * 0.3, y - Math.sin(a) * L * 0.3, a, L, col, 0.5 + rnd() * 0.5, 0.8 + rnd() * 1.1);
    }

    // kenar tüyleri (kabarık silüet)
    for (const P of polys) {
      const N = P.length;
      let area = 0;
      for (let i = 0; i < N; i++) { const a = P[i], b = P[(i + 1) % N]; area += a[0] * b[1] - b[0] * a[1]; }
      const sgn = area > 0 ? 1 : -1;
      let per = 0; const seg = [];
      for (let i = 0; i < N; i++) { const a = P[i], b = P[(i + 1) % N]; const l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push(l); per += l; }
      const ne = Math.floor(per * res * (spec.edgeDensity || 1.3));
      for (let k = 0; k < ne; k++) {
        let d = rnd() * per, i = 0;
        while (i < N - 1 && d > seg[i]) { d -= seg[i]; i++; }
        if (seg[i] < 1e-6) continue;
        const a = P[i], b = P[(i + 1) % N], t = d / seg[i];
        const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
        const tx = (b[0] - a[0]) / seg[i], ty = (b[1] - a[1]) / seg[i];
        const nx = sgn * ty, ny = -sgn * tx;
        if (spec.edgeSkip && spec.edgeSkip(x, y)) continue;
        const fa = spec.flow(x, y);
        let dx = nx * 0.7 + Math.cos(fa) * 0.6, dy = ny * 0.7 + Math.sin(fa) * 0.6;
        const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
        const L = len * (spec.edgeLen || 1) * (0.4 + rnd() * 0.9) * (spec.lenMul ? spec.lenMul(x, y) : 1);
        const col = spec.color(x - nx * 3, y - ny * 3);
        strand(x - nx * L * 0.35, y - ny * L * 0.35, Math.atan2(dy, dx), L, col, 0.5 + rnd() * 0.45, 0.7 + rnd() * 0.8);
      }
    }
    g.globalAlpha = 1;
    if (spec.extra) spec.extra(g, rnd, res);

    // gölgelendirme (ışık sol üstten)
    g.globalCompositeOperation = 'source-atop';
    const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2, rw = (bx1 - bx0) / 2, rh = (by1 - by0) / 2;
    const sh = spec.shade || {};
    let gr = g.createRadialGradient(cx - rw * 0.35, cy - rh * 0.45, 0, cx - rw * 0.35, cy - rh * 0.45, Math.max(rw, rh) * 1.1);
    gr.addColorStop(0, `rgba(255,242,222,${sh.hi ?? 0.16})`);
    gr.addColorStop(1, 'rgba(255,242,222,0)');
    g.fillStyle = gr; g.fillRect(x0, y0, w, h);
    g.save(); g.translate(cx, cy); g.scale(rw, rh);
    gr = g.createRadialGradient(0, 0, 0.45, 0, 0, 1.15);
    gr.addColorStop(0, 'rgba(15,10,5,0)');
    gr.addColorStop(1, `rgba(15,10,5,${sh.rim ?? 0.4})`);
    g.fillStyle = gr; g.fillRect(-2, -2, 4, 4);
    g.restore();
    if (sh.ao) {
      gr = g.createLinearGradient(0, cy, 0, by1);
      gr.addColorStop(0, 'rgba(10,6,3,0)');
      gr.addColorStop(1, `rgba(10,6,3,${sh.ao})`);
      g.fillStyle = gr; g.fillRect(x0, y0, w, h);
    }
    if (spec.fade) {
      g.globalCompositeOperation = 'destination-out';
      spec.fade(g, x0, y0, w, h);
    }
    g.globalCompositeOperation = 'source-over';
    return { c, x0, y0, res };
  }

  // ---------- ek çizimler ----------
  function toes(cx, cy, sp) {
    return (g) => {
      g.lineCap = 'round';
      g.strokeStyle = 'rgba(25,18,14,0.4)';
      g.lineWidth = 1.7;
      for (const dx of [-sp, sp]) {
        g.beginPath();
        g.moveTo(cx + dx, cy - 13);
        g.quadraticCurveTo(cx + dx * 1.1, cy, cx + dx * 1.15, cy + 10);
        g.stroke();
      }
    };
  }
  function earInner(look) {
    return (g, rnd, res) => {
      const P = [];
      quadPts(P, [-31, -1], [-25, -44], [-7, -78], 10);
      quadPts(P, [-7, -78], [-2, -84], [4, -77], 4);
      quadPts(P, [4, -77], [23, -42], [30, -1], 10);
      quadPts(P, [30, -1], [0, 6], [-31, -1], 6);
      const ip = new Path2D();
      U.smoothPath(ip, P);
      const gr = g.createLinearGradient(0, 0, 0, -80);
      gr.addColorStop(0, U.rgba(look.earIn[1]));
      gr.addColorStop(0.45, U.rgba(look.earIn[0]));
      gr.addColorStop(1, U.rgba(look.earIn[1]));
      g.fillStyle = gr; g.fill(ip);
      g.save(); g.clip(ip);
      const r = g.createRadialGradient(0, -4, 0, 0, -4, 36);
      r.addColorStop(0, 'rgba(40,20,20,0.5)');
      r.addColorStop(1, 'rgba(40,20,20,0)');
      g.fillStyle = r; g.fillRect(-40, -90, 80, 100);
      g.restore();
      g.lineCap = 'round';
      for (let i = 0; i < 110; i++) {
        const x = (rnd() - 0.5) * 52, y = -2 - rnd() * 28;
        const a = -Math.PI / 2 + (rnd() - 0.5) * 0.9 + x * 0.012, L = 12 + rnd() * 28;
        g.strokeStyle = `rgba(240,232,220,${0.25 + rnd() * 0.45})`;
        g.lineWidth = (0.7 + rnd() * 0.6) / res;
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + Math.cos(a) * L * 0.5 + 3, y + Math.sin(a) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L);
        g.stroke();
      }
    };
  }

  // ---------- Görünümler ----------
  const S = U.smooth, M = U.mixc, N = U.noise;

  const T = {
    base: H('#857462'), base2: H('#a08e76'), dark: H('#2a241e'), pale: H('#cdbfa6'),
    cream: H('#e6dcc8'), white: H('#f1ede6'), warm: H('#b08560'), bridge: H('#a8784e'),
  };
  function tabbyColor(part, x, y) {
    let c = M(T.base, T.base2, U.clamp(0.5 + U.fbm(x * 0.02, y * 0.02, 3) * 1.4, 0, 1));
    switch (part) {
      case 'body': {
        const u = x / 134, v = y / 166, au = Math.abs(u);
        const chest = S(0.6, 0.1, au) * S(-0.85, -0.2, v);
        c = M(c, T.pale, chest * 0.55);
        const s = Math.sin(y * 0.075 - au * au * 2.2 + N(x * 0.025, y * 0.025) * 1.8);
        const stripe = S(0.35, 0.8, s) * S(0.2, 0.6, au);
        const neck = S(0.4, 0.85, Math.sin(y * 0.1 + N(x * 0.04, y * 0.03) * 1.5)) * S(-1, -0.8, v) * S(-0.3, -0.5, v) * S(0.8, 0.4, au) * 0.8;
        const spots = S(0.25, 0.5, N(x * 0.07, y * 0.05)) * chest * 0.6;
        c = M(c, T.dark, Math.max(stripe * 0.9, neck, spots));
        c = M(c, T.warm, S(0.6, 0.95, au) * S(0.3, 0.9, v) * 0.35);
        break;
      }
      case 'haunch': {
        const u = x / 64;
        const s = Math.sin(x * 0.06 + y * 0.07 + N(x * 0.03, y * 0.03) * 1.6);
        c = M(c, T.warm, S(0.1, -0.7, u) * 0.45 * S(60, 0, y));
        c = M(c, T.dark, S(0.35, 0.8, s) * S(70, 40, y) * 0.85);
        c = M(c, T.pale, S(58, 72, y) * 0.7);
        break;
      }
      case 'leg': {
        c = M(c, T.pale, 0.35);
        const s = Math.sin(y * 0.13 + N(x * 0.05, y * 0.05) * 1.2);
        c = M(c, T.dark, S(0.45, 0.85, s) * S(140, 90, y) * S(10, 30, y) * 0.8);
        c = M(c, T.cream, S(130, 150, y) * 0.75);
        break;
      }
      case 'head': {
        const u = x / 118, v = y / 94, au = Math.abs(u);
        const fo = S(-0.2, -0.45, v) * S(0.55, 0.35, au);
        const ms = S(0.55, 0.85, Math.cos(u * 22 + N(x * 0.05, y * 0.05) * 0.8));
        c = M(c, T.dark, fo * ms * 0.9);
        const de = Math.hypot((au - 0.36) / 0.3, (v + 0.1) / 0.24);
        c = M(c, T.cream, S(1.1, 0.7, de) * 0.8);
        const l1 = S(0.06, 0.02, Math.abs(v - (-0.02 + 0.35 * (au - 0.6)))) * S(0.58, 0.68, au);
        const l2 = S(0.05, 0.015, Math.abs(v - (0.22 + 0.15 * (au - 0.55)))) * S(0.55, 0.66, au) * S(1.05, 0.9, au);
        c = M(c, T.dark, Math.max(l1, l2) * 0.85);
        const ss = S(0.5, 0.85, Math.sin(v * 14 + N(x * 0.04, y * 0.04))) * S(0.78, 0.92, au) * S(0.5, 0.1, v);
        c = M(c, T.dark, ss * 0.6);
        c = M(c, T.bridge, S(0.14, 0.06, au) * S(-0.5, -0.3, v) * S(0.25, 0.1, v) * 0.7);
        const dm = Math.hypot(u / 0.46, (v - 0.4) / 0.3);
        c = M(c, T.white, S(1.05, 0.72, dm) * 0.92);
        c = M(c, T.white, S(0.55, 0.75, v) * S(0.45, 0.25, au));
        break;
      }
      case 'ear':
        c = M(c, T.dark, S(-50, -90, y) * 0.5);
        break;
      case 'tail': {
        const s = Math.sin(x * 0.085 + N(x * 0.03, y * 0.03) * 0.9);
        c = M(c, T.dark, S(0.3, 0.75, s) * 0.88);
        c = M(c, T.dark, S(225, 250, x));
        break;
      }
    }
    return c;
  }

  const X = { black: H('#19171a'), black2: H('#3a332f'), white: H('#f3f1ed'), white2: H('#d6d2cc') };
  function tuxColor(part, x, y) {
    const blk = M(X.black, X.black2, U.clamp(0.25 + U.fbm(x * 0.02, y * 0.02, 3) * 1.1, 0, 1));
    const wht = M(X.white, X.white2, U.clamp(0.3 + U.fbm(x * 0.03, y * 0.03, 3), 0, 1) * 0.5);
    let w = 0;
    switch (part) {
      case 'body': {
        const u = x / 134, v = y / 166;
        const wid = 0.32 + (0.32 * (v + 1)) / 2;
        const e = Math.abs(u) + N(x * 0.03, y * 0.03) * 0.08;
        w = S(wid + 0.04, wid - 0.04, e);
        if (v < -0.75) w = Math.max(w, S(0.5, 0.4, Math.abs(u)));
        break;
      }
      case 'haunch':
        w = Math.max(S(56, 70, y), S(0.9, 0.6, Math.hypot((x - 25) / 40, (y - 60) / 30)));
        break;
      case 'leg': w = 1; break;
      case 'head': {
        const u = x / 118, v = y / 94, au = Math.abs(u) + N(x * 0.04, y * 0.04) * 0.06;
        const wid = v < -0.42 ? 0 : Math.min(0.95, 0.03 + (v + 0.42) * 0.95);
        w = S(wid + 0.03, wid - 0.03, au);
        w = Math.max(w, S(0.5, 0.62, v));
        break;
      }
    }
    return M(blk, wht, w);
  }

  KS.Looks = {
    tabby: {
      key: 'tabby', name: 'Tekir',
      iris: [H('#d8d47e'), H('#9cba62'), H('#6c9447'), H('#3b5228')],
      nose: H('#c4847a'), noseLine: H('#5a3a34'), mouthLine: H('#4a3a33'),
      eyeRim: H('#2a221c'), earIn: [H('#d4a59a'), H('#8c6a60')],
      whisker: 'rgba(250,248,240,0.9)',
      collar: { band: H('#3a2e24'), dot: H('#e2b33c'), tag: H('#d9d6cf') },
      color: tabbyColor,
    },
    tuxedo: {
      key: 'tuxedo', name: 'Smokin',
      iris: [H('#e6da86'), H('#c9c46a'), H('#9ea452'), H('#5c5a2a')],
      nose: H('#f2a4b0'), noseLine: H('#c7808c'), mouthLine: H('#9a7a7a'),
      eyeRim: H('#141214'), earIn: [H('#e0aaaa'), H('#6a5254')],
      whisker: 'rgba(252,252,250,0.92)',
      collar: { band: H('#d8393c'), dot: H('#ffffff'), tag: H('#b9b4e0') },
      color: tuxColor,
    },
  };

  KS.Fur = {
    buildCat(look, res) {
      const col = (part) => (x, y) => look.color(part, x, y);
      const o = {};
      o.body = build({
        polys: SH.body(), color: col('body'), flow: (x) => Math.PI / 2 - (x / 134) * 0.55,
        len: 12, edgeLen: 1.4, shade: { hi: 0.14, rim: 0.42, ao: 0.25 },
      }, res, 11);
      o.haunch = build({
        polys: SH.haunch(), color: col('haunch'), flow: (x) => Math.PI / 2 - (x / 64) * 0.5,
        len: 10, edgeLen: 1.3, shade: { rim: 0.45 }, extra: toes(18, 88, 8),
      }, res, 12);
      o.leg = build({
        polys: SH.leg(), color: col('leg'), flow: () => Math.PI / 2, len: 7, edgeLen: 1,
        shade: { rim: 0.36, hi: 0.18 }, extra: toes(0, 163, 10), edgeSkip: (x, y) => y < 18,
        fade: (g, x0, y0, w) => {
          const gr = g.createLinearGradient(0, -12, 0, 26);
          gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = gr; g.fillRect(x0, -30, w, 60);
        },
      }, res, 13);
      o.head = build({
        polys: SH.head(), color: col('head'), flow: (x, y) => Math.atan2(y - 25, x),
        len: 6.5, edgeLen: 1.25, density: 0.1,
        lenMul: (x, y) => 1 + 0.9 * U.smooth(70, 118, Math.abs(x)) * U.smooth(-30, 20, y),
        shade: { rim: 0.3, hi: 0.12 },
      }, res, 14);
      o.ear = build({
        polys: SH.ear(), color: col('ear'), flow: (x) => -Math.PI / 2 + x * 0.006, len: 5, edgeLen: 0.8,
        shade: { rim: 0.3 }, extra: earInner(look),
      }, res, 15);
      o.tail = build({
        polys: SH.tail(), color: col('tail'), flow: (x, y) => y * 0.01, len: 11, edgeLen: 1.5,
        shade: { rim: 0.4 }, pad: 18,
        fade: (g, x0, y0, w, h) => {
          const gr = g.createLinearGradient(-18, 0, 24, 0);
          gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = gr; g.fillRect(x0, y0, 50, h);
        },
      }, res, 16);
      o.lidUp = look.color('head', 42, -36);
      o.lidLo = look.color('head', 42, 14);
      return o;
    },
  };
})();
