// Prosedürel mırlama sesi (Web Audio) — dosya gerekmez
(function () {
  const U = KS.U;
  let ctx = null, gain = null, muted = false;

  function makePurr(ac) {
    const sr = ac.sampleRate, cycle = 2.5, dur = cycle * 2, n = Math.floor(sr * dur);
    const buf = ac.createBuffer(1, n, sr);
    const d = buf.getChannelData(0);
    let ph = 0, b = 0, lp = 0, lp2 = 0, max = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr, ct = t % cycle, inh = ct < 1.1;
      const f = inh ? 27 : 23.5;
      ph += f / sr;
      const fr = ph % 1;
      let env;
      if (inh) env = 0.55 * Math.pow(Math.sin(Math.PI * U.clamp(ct / 1.1, 0, 1)), 0.5);
      else {
        const tt = (ct - 1.15) / (cycle - 1.15);
        env = tt < 0 ? 0 : Math.pow(Math.sin(Math.PI * U.clamp(tt, 0, 1)), 0.4);
      }
      const pulse = Math.exp(-Math.pow((fr - 0.35) / 0.12, 2)) + 0.12;
      const w = Math.random() * 2 - 1;
      b = b * 0.985 + w * 0.15;
      const s = (b * 0.8 + w * 0.2) * pulse * env;
      lp += (s - lp) * 0.08;
      lp2 += (lp - lp2) * 0.12;
      d[i] = lp2;
      if (Math.abs(lp2) > max) max = Math.abs(lp2);
    }
    for (let i = 0; i < n; i++) d[i] = (d[i] / max) * 0.9;
    return buf;
  }

  KS.Audio = {
    init() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      const src = ctx.createBufferSource();
      src.buffer = makePurr(ctx);
      src.loop = true;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 650;
      gain = ctx.createGain(); gain.gain.value = 0;
      src.connect(filt).connect(gain).connect(ctx.destination);
      src.start();
    },
    setLevel(l) {
      if (!ctx || !gain) return;
      gain.gain.setTargetAtTime(muted ? 0 : Math.min(1, l) * 1.1, ctx.currentTime, 0.2);
    },
    setMuted(m) { muted = m; },
    get muted() { return muted; },
  };
})();
