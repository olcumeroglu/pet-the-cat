// Ortak yardımcılar: matematik, renk, gürültü (noise)
(function () {
  const KS = (window.KS = window.KS || {});
  const U = (KS.U = {});

  U.clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.smooth = (a, b, x) => {
    const t = U.clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  U.mixc = (c1, c2, t) => [
    c1[0] + (c2[0] - c1[0]) * t,
    c1[1] + (c2[1] - c1[1]) * t,
    c1[2] + (c2[2] - c1[2]) * t,
  ];
  U.hex = (h) => {
    h = h.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  U.rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  U.shade = (c, f) => [Math.min(255, c[0] * f), Math.min(255, c[1] * f), Math.min(255, c[2] * f)];
  U.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  // Kare-zaman bağımsız yumuşak yaklaşım
  U.approach = (cur, tgt, rate, dt) => cur + (tgt - cur) * (1 - Math.exp(-rate * dt));
  U.angDiff = (a, b) => {
    let d = (b - a) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  };
  U.angLerp = (a, b, t) => a + U.angDiff(a, b) * t;
  U.angApproach = (a, b, rate, dt) => a + U.angDiff(a, b) * (1 - Math.exp(-rate * dt));

  // Perlin gürültüsü
  const r = U.rng(7);
  const p = new Uint8Array(512);
  const base = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = base[i];
    base[i] = base[j];
    base[j] = t;
  }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255];
  function grad(h, x, y) {
    switch (h & 7) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      case 3: return -x - y;
      case 4: return x;
      case 5: return -x;
      case 6: return y;
      default: return -y;
    }
  }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  U.noise = (x, y) => {
    let X = Math.floor(x), Y = Math.floor(y);
    const xf = x - X, yf = y - Y;
    X &= 255; Y &= 255;
    const u = fade(xf), v = fade(yf);
    const aa = p[p[X] + Y], ab = p[p[X] + Y + 1], ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
    return U.lerp(
      U.lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
      U.lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
      v
    ) * 0.7;
  };
  U.fbm = (x, y, o = 4) => {
    let s = 0, a = 0.5, f = 1;
    for (let i = 0; i < o; i++) {
      s += a * U.noise(x * f, y * f);
      a *= 0.5;
      f *= 2.03;
    }
    return s;
  };
  // Çokgen noktalarından yumuşak kapalı yol
  U.smoothPath = (path, pts) => {
    const n = pts.length;
    const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const s = m(pts[n - 1], pts[0]);
    path.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) {
      const c = pts[i], nx = m(c, pts[(i + 1) % n]);
      path.quadraticCurveTo(c[0], c[1], nx[0], nx[1]);
    }
    path.closePath();
  };
})();
