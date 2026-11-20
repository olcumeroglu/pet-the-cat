// Arka plan: sıvalı duvar + yumuşak polar battaniye
(function () {
  const U = KS.U;
  KS.Scene = {
    build(W, H, dpr, gx, gy, sc) {
      const c = document.createElement('canvas');
      c.width = Math.ceil(W * dpr); c.height = Math.ceil(H * dpr);
      const g = c.getContext('2d');
      g.scale(dpr, dpr);
      const rnd = U.rng(99);

      // duvar
      let gr = g.createLinearGradient(0, 0, W, H);
      gr.addColorStop(0, '#f1ece3'); gr.addColorStop(1, '#dcd2c3');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      gr = g.createRadialGradient(W * 0.1, H * 0.1, 0, W * 0.1, H * 0.1, Math.max(W, H) * 0.9);
      gr.addColorStop(0, 'rgba(255,248,232,0.6)'); gr.addColorStop(1, 'rgba(255,248,232,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      // sıva dokusu
      const nw = Math.ceil(W / 2), nh = Math.ceil(H / 2);
      const nc = document.createElement('canvas'); nc.width = nw; nc.height = nh;
      const ng = nc.getContext('2d'); const id = ng.createImageData(nw, nh);
      for (let j = 0; j < nh; j++) for (let i = 0; i < nw; i++) {
        const k = (j * nw + i) * 4;
        const v = U.fbm(i * 0.11, j * 0.11, 3) * 0.7 + (rnd() - 0.5) * 0.3;
        const val = v > 0 ? 255 : 40;
        id.data[k] = id.data[k + 1] = id.data[k + 2] = val;
        id.data[k + 3] = Math.min(255, Math.abs(v) * 38);
      }
      ng.putImageData(id, 0, 0);
      g.drawImage(nc, 0, 0, W, H);

      // battaniye
      const top = gy - 85 * sc;
      const edge = (p) => {
        p.moveTo(-40, top + 50 * sc);
        p.bezierCurveTo(W * 0.25, top - 10 * sc, W * 0.55, top + 18 * sc, W * 0.78, top - 6 * sc);
        p.bezierCurveTo(W * 0.9, top - 14 * sc, W + 20, top + 20 * sc, W + 40, top + 40 * sc);
      };
      const bp = new Path2D();
      edge(bp); bp.lineTo(W + 40, H + 40); bp.lineTo(-40, H + 40); bp.closePath();
      g.save(); g.filter = 'blur(16px)'; g.fillStyle = 'rgba(60,50,40,0.28)'; g.translate(0, -8); g.fill(bp); g.restore();
      gr = g.createLinearGradient(0, top - 20 * sc, 0, H);
      gr.addColorStop(0, '#bcc8b3'); gr.addColorStop(0.3, '#a5b49d'); gr.addColorStop(1, '#7c8c75');
      g.fillStyle = gr; g.fill(bp);
      g.save(); g.clip(bp);
      // kıvrımlar
      for (let f = 0; f < 6; f++) {
        const y0 = top + (0.12 + f * 0.17) * (H - top);
        const wave = new Path2D();
        wave.moveTo(-40, y0);
        for (let x = 0; x <= W + 80; x += 80) wave.quadraticCurveTo(x - 40, y0 + Math.sin(x * 0.004 + f * 1.7) * 26 * sc, x, y0 + Math.sin(x * 0.006 + f) * 18 * sc);
        g.save(); g.filter = 'blur(9px)';
        g.strokeStyle = 'rgba(45,60,40,0.22)'; g.lineWidth = (14 + f * 5) * sc; g.stroke(wave);
        g.translate(0, -9 * sc); g.strokeStyle = 'rgba(255,255,245,0.16)'; g.lineWidth = (8 + f * 3) * sc; g.stroke(wave);
        g.restore();
      }
      // peluş doku
      const n = Math.floor((W * (H - top)) / 12);
      for (let i = 0; i < n; i++) {
        const x = rnd() * W, y = top - 20 + rnd() * (H - top + 40);
        const persp = 0.45 + 0.55 * U.clamp((y - top) / (H - top), 0, 1);
        const r = (1.5 + rnd() * 3.5) * persp * Math.max(0.6, sc);
        g.fillStyle = rnd() < 0.5 ? `rgba(255,255,245,${0.05 + rnd() * 0.08})` : `rgba(35,50,30,${0.05 + rnd() * 0.08})`;
        g.beginPath(); g.ellipse(x, y, r * 1.3, r, rnd() * 3, 0, 7); g.fill();
      }
      g.lineWidth = 1; g.lineCap = 'round';
      for (let i = 0; i < n * 0.5; i++) {
        const x = rnd() * W, y = top + rnd() * (H - top);
        const r = (2 + rnd() * 3) * Math.max(0.6, sc);
        g.strokeStyle = `rgba(255,255,250,${0.06 + rnd() * 0.08})`;
        g.beginPath(); g.arc(x, y, r, rnd() * 6, rnd() * 6 + 2.5); g.stroke();
      }
      g.restore();
      // ön kenar parlaklığı
      const ep = new Path2D(); edge(ep);
      g.save(); g.clip(bp); g.filter = 'blur(6px)';
      g.strokeStyle = 'rgba(255,255,248,0.4)'; g.lineWidth = 30 * sc; g.translate(0, 12 * sc); g.stroke(ep);
      g.restore();
      // vinyet
      gr = g.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.3, W / 2, H * 0.55, Math.max(W, H) * 0.85);
      gr.addColorStop(0, 'rgba(30,20,10,0)'); gr.addColorStop(1, 'rgba(30,20,10,0.32)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      return c;
    },
  };
})();
