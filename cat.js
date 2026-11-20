// Kedi: pozlar, davranışlar, sevme tepkileri ve çizim
(function () {
  const U = KS.U;

  // Dünya koordinatı: (0,0) battaniye üzerinde kedinin ortası, y aşağı pozitif.
  // Çocuk parçaların konumları gövde-yerel koordinatlarda tanımlıdır.
  const SIT = {
    bx: 0, by: -158, brot: 0, bsx: 1, bsy: 1,
    hLx: -98, hLy: 82, hLr: 0.08, hRx: 98, hRy: 82, hRr: -0.08, hhs: 1,
    lLx: -40, lLy: -22, lLr: 0.04, lLl: 1, lLa: 1, lRx: 40, lRy: -22, lRr: -0.04, lRl: 1, lRa: 1,
    hx: 0, hy: -236, hr: 0, hsc: 1,
    eLr: 0, eRr: 0, eLs: 1, eRs: 1,
    lid: 0.05, low: 0, pupil: 0.48, mouth: 0, whisk: 0, lookX: 0, lookY: 0,
    tx: 92, ty: 142, ta: 2.45, tc: 1.05, tcurl: 0.5, tfront: 1,
    shx: 0, shw: 175,
  };
  const POSES = {
    sit: SIT,
    loaf: Object.assign({}, SIT, {
      by: -122, bsx: 1.2, bsy: 0.74,
      hLx: -92, hLy: 74, hLr: 0.5, hRx: 92, hRy: 74, hRr: -0.5, hhs: 0.8,
      lLy: 30, lRy: 30, lLl: 0.35, lRl: 0.35, lLa: 0, lRa: 0,
      lid: 0.35, tx: 100, ty: 140, ta: 2.25, tc: 1.3, tcurl: 0.4, shw: 205,
    }),
    belly: Object.assign({}, SIT, {
      bx: 30, by: -118, brot: -1.5, bsx: 0.88,
      hLx: -70, hLy: 110, hLr: -0.5, hRx: 70, hRy: 110, hRr: -0.9,
      lLx: -40, lLy: -30, lLr: -2.18, lLl: 0.62, lRx: 40, lRy: -30, lRr: -1.88, lRl: 0.62,
      hr: 1.15, tx: -60, ty: 160, ta: 1.7, tc: -0.4, tcurl: 0.6, tfront: 0,
      lid: 0.2, pupil: 0.6, shx: 20, shw: 285,
    }),
  };
  const spr = (ctx, s) => ctx.drawImage(s.c, s.x0, s.y0, s.c.width / s.res, s.c.height / s.res);
  // Parçalar arasında yumuşak temas gölgesi (derinlik hissi)
  const shadowOn = (ctx, blur, a, oy) => {
    const m = ctx.getTransform(), k = Math.hypot(m.a, m.b);
    ctx.shadowColor = `rgba(25,15,8,${a})`;
    ctx.shadowBlur = blur * k;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = (oy || 0) * k;
  };
  const shadowOff = (ctx) => { ctx.shadowColor = 'rgba(0,0,0,0)'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };

  class Cat {
    constructor(look) {
      this.look = look;
      this.p = Object.assign({}, SIT);
      this.mode = 'sit';
      this.t = 0;
      this.pet = { head: 0, cheekL: 0, cheekR: 0, chin: 0, body: 0, belly: 0 };
      this.rub = 0; this.rubSide = 1; this.offerT = 0;
      this.purr = 0; this.purrBoost = 0; this.joy = 25;
      this.act = null; this.kneadAmt = 0; this.biteAmt = 0; this.press = [0, 0];
      this.blink = 0; this.blinkLid = 0; this.nextBlink = 2; this.slow = false;
      this.twL = 0; this.twR = 0; this.nextTw = 4;
      this.idle = 0; this.nextKnead = 14 + Math.random() * 10;
      this.bellyT = 0; this.bellyLimit = 4 + Math.random() * 3;
      this.events = []; this.status = '';
      this.headWorld = { x: 0, y: -394, r: 0, s: 1 };
      this._B = { x: 0, y: -158, r: 0, sx: 1, sy: 1 };
      this.paws = [[-40, -4], [40, -4]];
    }
    setLook(l) { this.look = l; }
    build(res) { this.sprites = KS.Fur.buildCat(this.look, res); }
    setMode(m) {
      if (this.mode !== m) { this.mode = m; this.bellyT = 0; }
      if (this.act && this.act.type === 'knead' && m !== 'sit') this.act = null;
    }
    trigger(type) {
      if (type === 'bite') {
        this.act = { type: 'bite', t: 0, dur: 2.1 };
        this.bellyT = 0; this.bellyLimit = 4 + Math.random() * 4;
      } else if (type === 'knead') {
        if (this.mode !== 'sit') this.setMode('sit');
        this.act = { type: 'knead', t: 0, dur: 7.5 };
      } else if (type === 'purr') {
        this.purrBoost = 6;
      }
    }
    bodyToWorld(lx, ly) {
      const B = this._B, c = Math.cos(B.r), s = Math.sin(B.r);
      const x = lx * B.sx, y = ly * B.sy;
      return [B.x + x * c - y * s, B.y + x * s + y * c];
    }
    headToWorld(lx, ly) {
      const H = this.headWorld, c = Math.cos(H.r), s = Math.sin(H.r);
      return [H.x + (lx * c - ly * s) * H.s, H.y + (lx * s + ly * c) * H.s];
    }
    toBodyLocal(x, y) {
      const B = this._B, dx = x - B.x, dy = y - B.y, c = Math.cos(-B.r), s = Math.sin(-B.r);
      return [(dx * c - dy * s) / B.sx, (dx * s + dy * c) / B.sy];
    }

    // ---------------- Davranış ----------------
    update(dt, hand) {
      this.t += dt;
      const t = this.t;

      // --- elin kediye neresine dokunduğu
      let region = null, offer = false, side = 1, hl = null;
      if (hand.visible) {
        const Hd = this.headWorld;
        const dx = hand.x - Hd.x, dy = hand.y - Hd.y, c = Math.cos(-Hd.r), s = Math.sin(-Hd.r);
        const lx = (dx * c - dy * s) / Hd.s, ly = (dx * s + dy * c) / Hd.s;
        hl = { x: lx, y: ly };
        const e = (lx / 128) ** 2 + (ly / 108) ** 2;
        if (e < 1.1) {
          if (ly < -28) region = 'head';
          else if (ly > 48 && Math.abs(lx) < 62) region = 'chin';
          else if (lx < -42) region = 'cheekL';
          else if (lx > 42) region = 'cheekR';
          else region = 'head';
        } else {
          const [ux, uy] = this.toBodyLocal(hand.x, hand.y);
          if ((ux / 140) ** 2 + (uy / 172) ** 2 < 1) region = this.mode === 'belly' ? 'belly' : 'body';
          if (!region && e < 3.4 && this.mode !== 'belly') { offer = true; side = lx < 0 ? -1 : 1; }
        }
      }
      const pressed = hand.visible && hand.pressed;
      const moving = hand.speed > 40;
      const A = this.act;
      const biting = A && A.type === 'bite';
      for (const k in this.pet) {
        let tg = 0;
        if (pressed && region === k && !biting) tg = moving ? 1 : 0.55;
        this.pet[k] = U.approach(this.pet[k], tg, tg > this.pet[k] ? 3.5 : 1.6, dt);
      }
      if (offer && !pressed && hand.speed < 120 && !biting) { this.offerT += dt; this.rubSide = side; }
      else this.offerT = Math.max(0, this.offerT - dt * 2.5);
      this.rub = U.approach(this.rub, this.offerT > 0.6 ? 1 : 0, 2.2, dt);

      // göbek tuzağı: fazla göbek sevgisi = sevgi ısırması
      if (this.mode === 'belly' && this.pet.belly > 0.45 && !biting) {
        this.bellyT += dt;
        if (this.bellyT > this.bellyLimit) this.trigger('bite');
      }

      // --- eylemler
      let knead = 0, bite = 0, biteOpen = 0;
      if (this.act) {
        const a = this.act;
        a.t += dt;
        if (a.t > a.dur) this.act = null;
        else if (a.type === 'knead') knead = U.smooth(0, 0.6, a.t) * U.smooth(a.dur, a.dur - 0.6, a.t);
        else if (a.type === 'bite') {
          bite = U.smooth(0, 0.25, a.t) * U.smooth(a.dur, a.dur - 0.4, a.t);
          const ht = a.t - 0.3;
          biteOpen = ht < 0 ? U.smooth(0, 0.3, a.t) * 0.8
            : (0.3 + 0.7 * Math.abs(Math.sin(ht * 5.5))) * U.smooth(a.dur - 0.2, a.dur - 0.6, a.t);
        }
      }
      this.kneadAmt = knead; this.biteAmt = bite;

      const P = this.pet;
      const engaged = Object.values(P).some((v) => v > 0.2) || this.rub > 0.2 || !!this.act;
      this.idle = engaged ? 0 : this.idle + dt;
      if (this.mode === 'sit' && !this.act && this.idle > this.nextKnead) {
        this.trigger('knead');
        this.nextKnead = 18 + Math.random() * 20;
        this.idle = 0;
      }

      // --- mırlama ve mutluluk
      const pm = Math.max(P.head, P.cheekL, P.cheekR, P.chin, P.body * 0.85, P.belly * 0.75);
      if (this.purrBoost > 0) this.purrBoost -= dt;
      let pt = Math.min(1, pm * 1.15 + this.rub * 0.95 + knead * 0.85 + (this.purrBoost > 0 ? 1 : 0));
      if (bite > 0.1) pt = 0;
      this.purr = U.approach(this.purr, pt, pt > this.purr ? 1.5 : 0.45, dt);
      this.joy = U.clamp(this.joy + (this.purr * 5 - 0.25) * dt, 0, 100);
      this.heartT = (this.heartT || 0) - dt;
      if (this.purr > 0.55 && this.heartT < 0) {
        this.heartT = 0.5 + Math.random() * 0.7;
        this.events.push({ type: 'heart', x: this.headWorld.x + (Math.random() - 0.5) * 180, y: this.headWorld.y - 80 });
      }
      this.mrrT = (this.mrrT || 0) - dt;
      if (this.purr > 0.5 && this.mrrT < 0) {
        this.mrrT = 2.2 + Math.random() * 1.5;
        const [cx, cy] = this.bodyToWorld(70 * (Math.random() < 0.5 ? -1 : 1), -60);
        this.events.push({ type: 'mrr', x: cx, y: cy });
      }

      // --- göz kırpma, kulak seğirmesi
      this.nextBlink -= dt;
      if (this.nextBlink < 0) {
        this.blink = 0.0001;
        this.slow = this.purr > 0.3 && Math.random() < 0.65;
        this.nextBlink = 2 + Math.random() * 4;
      }
      this.blinkLid = 0;
      if (this.blink > 0) {
        this.blink += dt;
        const d = this.slow ? 1.1 : 0.2, x = this.blink / d;
        if (x >= 1) this.blink = 0;
        else this.blinkLid = this.slow ? Math.min(1, Math.sin(Math.PI * x) * 1.5) : Math.sin(Math.PI * x);
      }
      this.nextTw -= dt;
      if (this.nextTw < 0) {
        this.nextTw = 3 + Math.random() * 6;
        if (Math.random() < 0.5) this.twL = 1; else this.twR = 1;
      }
      this.twL = Math.max(0, this.twL - dt * 5);
      this.twR = Math.max(0, this.twR - dt * 5);

      // --- hedef poz
      const q = Object.assign({}, POSES[this.mode]);
      let lkx = Math.sin(t * 0.4) * 0.3, lky = Math.sin(t * 0.27) * 0.2;
      if (hand.visible && hl) { lkx = U.clamp(hl.x / 220, -1, 1); lky = U.clamp(hl.y / 200, -1, 1); }
      q.lookX = lkx; q.lookY = lky;
      q.pupil += U.clamp((hand.speed - 300) / 900, 0, 0.5);

      const ph = P.head;
      q.hy -= 8 * ph; q.eLr -= 0.42 * ph; q.eRr += 0.42 * ph; q.eLs -= 0.15 * ph; q.eRs -= 0.15 * ph;
      q.hy -= 12 * P.chin; q.whisk += 0.6 * P.chin;
      q.hx -= 12 * P.cheekL; q.hr -= 0.24 * P.cheekL; q.eLr -= 0.2 * P.cheekL;
      q.hx += 12 * P.cheekR; q.hr += 0.24 * P.cheekR; q.eRr += 0.2 * P.cheekR;
      if (this.rub > 0.01) {
        const o = Math.sin(t * 3.0), r = this.rub, sd = this.rubSide;
        q.hx += sd * (18 + 12 * o) * r;
        q.hy += (-4 + 6 * Math.cos(t * 3.0)) * r;
        q.hr += sd * (0.16 + 0.16 * o) * r;
        if (sd < 0) q.eLr -= 0.35 * r; else q.eRr += 0.35 * r;
        q.whisk += 0.3 * r;
      }
      if (P.belly > 0.01) {
        const b = P.belly;
        q.hLr += 0.18 * Math.sin(t * 6) * b; q.hRr += 0.18 * Math.sin(t * 6 + 1.3) * b;
        q.lLr -= 0.15 * b; q.lRr += 0.1 * b; q.pupil += 0.2 * b; q.tcurl += 0.3 * Math.sin(t * 5) * b;
      }
      this.press = [0, 0];
      if (knead > 0) {
        const kp = (t * 2 * Math.PI) / 0.9;
        const a = Math.max(0, Math.sin(kp)) * knead, b = Math.max(0, Math.sin(kp + Math.PI)) * knead;
        q.lLy -= 22 * a; q.lLl -= 0.1 * a; q.lRy -= 22 * b; q.lRl -= 0.1 * b;
        q.by += 2 * Math.sin(kp * 2) * knead; q.hr += 0.035 * Math.sin(kp) * knead;
        this.press = [knead - a, knead - b];
      }
      if (bite > 0 && hand.visible) {
        const [ux, uy] = this.toBodyLocal(hand.x, hand.y);
        q.hx = U.lerp(q.hx, U.clamp(ux, q.hx - 60, q.hx + 60), 0.55 * bite);
        q.hy = U.lerp(q.hy, U.clamp(uy - 60, q.hy - 40, q.hy + 50), 0.5 * bite);
        q.eLr -= 0.5 * bite; q.eRr += 0.5 * bite; q.eLs -= 0.2 * bite; q.eRs -= 0.2 * bite;
        q.pupil = U.lerp(q.pupil, 1, bite); q.whisk += 0.5 * bite;
        for (const sd of ['L', 'R']) {
          const sx = q['l' + sd + 'x'], sy = q['l' + sd + 'y'];
          const dx = ux + (sd === 'L' ? -26 : 26) - sx, dy = uy - sy;
          const ang = Math.atan2(-dx, dy), len = U.clamp(Math.hypot(dx, dy) / 165, 0.55, 1.25);
          q['l' + sd + 'r'] = U.angLerp(q['l' + sd + 'r'], ang, bite * 0.9);
          q['l' + sd + 'l'] = U.lerp(q['l' + sd + 'l'], len, bite);
          q['l' + sd + 'a'] = Math.max(q['l' + sd + 'a'], bite);
        }
      }
      q.mouth = Math.max(q.mouth, biteOpen);

      const pleasure = Math.max(ph * 0.95, P.chin * 0.85, P.cheekL * 0.85, P.cheekR * 0.85, this.rub * 0.88,
        P.body * 0.55, P.belly * 0.45, knead * 0.6, this.purrBoost > 0 ? 0.4 : 0);
      q.lid = Math.max(q.lid, pleasure);
      q.low = Math.max(q.low, pleasure * 0.35);
      if (bite > 0.2) q.lid = 0;
      q.eLr -= 0.3 * Math.sin(this.twL * Math.PI);
      q.eRr += 0.3 * Math.sin(this.twR * Math.PI);
      q.tcurl += 0.18 * Math.sin(t * 1.1);
      q.tc += 0.05 * Math.sin(t * 0.7);

      const p = this.p;
      const fast = { lid: 12, low: 10, mouth: 18, lookX: 6, lookY: 6, pupil: 5 };
      for (const k in q) {
        if (p[k] === undefined) p[k] = q[k];
        const r = fast[k] || (k[0] === 'l' && bite > 0 ? 10 : k[0] === 'l' && knead > 0 ? 14 : 4.5);
        p[k] = U.approach(p[k], q[k], r, dt);
      }

      // --- durum yazısı
      let st = '';
      if (bite > 0.1) st = 'Sevgi ısırması! Hap hap…';
      else if (knead > 0.1) st = 'Yoğuruyor… battaniyeye masaj yapıyor';
      else if (this.rub > 0.4) st = 'Yanağını eline sürtüyor';
      else if (P.belly > 0.3) st = 'Göbeğini seviyorsun… dikkat, tuzak olabilir!';
      else if (P.head > 0.3) st = 'Kafasını seviyorsun';
      else if (P.cheekL > 0.3 || P.cheekR > 0.3) st = 'Yanaklarını kaşıyorsun';
      else if (P.chin > 0.3) st = 'Çenesinin altını kaşıyorsun';
      else if (P.body > 0.3) st = 'Sırtını okşuyorsun';
      else if (this.offerT > 0.15) st = 'Elini kokluyor…';
      else if (this.mode === 'loaf') st = 'Patilerini saklayıp ekmek pozunda';
      else if (this.mode === 'belly') st = 'Göbeğini açtı';
      if (this.purr > 0.35) st += (st ? ' · ' : '') + 'mırr mırr';
      this.status = st;
    }

    // ---------------- Çizim ----------------
    draw(ctx, skipLegs) {
      const p = this.p, S = this.sprites, t = this.t;
      const br = Math.sin((t * 2 * Math.PI) / 3.4);
      const vib = this.purr * Math.sin(t * 157) * 0.5;
      const B = { x: p.bx, y: p.by + vib, r: p.brot, sx: p.bsx * (1 + br * 0.012), sy: p.bsy * (1 + br * 0.007) };
      this._B = B;
      const c = Math.cos(B.r), s = Math.sin(B.r);
      const W = (lx, ly) => { const x = lx * B.sx, y = ly * B.sy; return [B.x + x * c - y * s, B.y + x * s + y * c]; };

      // battaniyede yoğurma çukurları
      for (let i = 0; i < 2; i++) {
        const pr = this.press[i];
        if (pr > 0.02) {
          const [x, y] = this.paws[i];
          ctx.save(); ctx.translate(x, 2); ctx.scale(1, 0.32);
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 52);
          g.addColorStop(0, `rgba(30,40,25,${0.3 * pr})`); g.addColorStop(1, 'rgba(30,40,25,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 52, 0, 7); ctx.fill(); ctx.restore();
        }
      }
      // gölge
      ctx.save(); ctx.translate(p.shx, 4); ctx.scale(1, 0.16);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.shw);
      g.addColorStop(0, 'rgba(30,25,20,0.5)'); g.addColorStop(0.6, 'rgba(30,25,20,0.22)'); g.addColorStop(1, 'rgba(30,25,20,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, p.shw, 0, 7); ctx.fill(); ctx.restore();

      if (p.tfront < 0.5) this.drawTail(ctx, W, B);
      ctx.save(); ctx.translate(B.x, B.y); ctx.rotate(B.r); ctx.scale(B.sx, B.sy);
      spr(ctx, S.body); this.drawCollar(ctx);
      ctx.restore();
      let [x, y] = W(p.hLx, p.hLy);
      ctx.save(); ctx.translate(x, y); ctx.rotate(B.r + p.hLr); ctx.scale(1, p.hhs); shadowOn(ctx, 14, 0.35, 0); spr(ctx, S.haunch); ctx.restore();
      [x, y] = W(p.hRx, p.hRy);
      ctx.save(); ctx.translate(x, y); ctx.rotate(B.r + p.hRr); ctx.scale(-1, p.hhs); shadowOn(ctx, 14, 0.35, 0); spr(ctx, S.haunch); ctx.restore();
      if (!skipLegs) this.drawLegs(ctx);
      if (p.tfront >= 0.5) this.drawTail(ctx, W, B);
      this.drawHead(ctx, W, B);
    }

    drawLegs(ctx) {
      const p = this.p, Lg = this.sprites.leg, B = this._B;
      const c = Math.cos(B.r), s = Math.sin(B.r);
      ['L', 'R'].forEach((k, i) => {
        const a = p['l' + k + 'a'];
        const lx = p['l' + k + 'x'] * B.sx, ly = p['l' + k + 'y'] * B.sy;
        const x = B.x + lx * c - ly * s, y = B.y + lx * s + ly * c;
        const r = B.r + p['l' + k + 'r'], l = p['l' + k + 'l'];
        this.paws[i] = [x - Math.sin(r) * 165 * l, y + Math.cos(r) * 165 * l];
        if (a < 0.02) return;
        ctx.save(); ctx.globalAlpha = Math.min(1, a);
        ctx.translate(x, y); ctx.rotate(r); ctx.scale(k === 'L' ? 1 : -1, l);
        shadowOn(ctx, 12, 0.45, 2); spr(ctx, Lg); ctx.restore();
      });
    }

    drawTail(ctx, W, B) {
      const p = this.p, S = this.sprites.tail, res = S.res;
      const [bx, by] = W(p.tx, p.ty);
      const step = 4, N = Math.ceil(310 / step);
      const ang = (u) => B.r + p.ta + p.tc * u + p.tcurl * u * u * u + 0.12 * Math.sin(this.t * 1.6 - u * 3) * u;
      const P = [[bx, by]];
      let x = bx, y = by;
      for (let i = 1; i <= N; i++) {
        const a = ang(((i - 0.5) * step) / 270);
        x += Math.cos(a) * step; y += Math.sin(a) * step; P.push([x, y]);
      }
      const at = (d) => {
        if (d <= 0) { const a = ang(0); return [bx + Math.cos(a) * d, by + Math.sin(a) * d]; }
        const f = d / step, i = Math.min(N - 1, Math.floor(f)), r = f - i;
        return [P[i][0] + (P[i + 1][0] - P[i][0]) * r, P[i][1] + (P[i + 1][1] - P[i][1]) * r];
      };
      const n = 34, x0 = S.x0, sw = S.c.width / res / n, hh = S.c.height / res;
      for (let i = 0; i < n; i++) {
        const lx = x0 + i * sw;
        const [px, py] = at(lx);
        const a = ang(Math.max(0, (lx + sw / 2) / 270));
        const sx = i * sw * res, sW = Math.min(S.c.width - sx, (sw + 1.5) * res);
        ctx.save(); ctx.translate(px, py); ctx.rotate(a);
        if (i === 0) shadowOff(ctx);
        ctx.drawImage(S.c, sx, 0, sW, S.c.height, 0, S.y0, sW / res, hh);
        ctx.restore();
      }
    }

    drawCollar(ctx) {
      const L = this.look.collar;
      const q = (t) => {
        const m = 1 - t;
        return [m * m * -84 + 2 * m * t * 0 + t * t * 84, m * m * -170 + 2 * m * t * -104 + t * t * -170];
      };
      const path = new Path2D(); path.moveTo(-84, -170); path.quadraticCurveTo(0, -104, 84, -170);
      ctx.lineCap = 'round';
      ctx.strokeStyle = U.rgba(U.shade(L.band, 0.55)); ctx.lineWidth = 15; ctx.stroke(path);
      ctx.strokeStyle = U.rgba(L.band); ctx.lineWidth = 11; ctx.stroke(path);
      ctx.fillStyle = U.rgba(L.dot, 0.9);
      for (let t = 0.08; t < 0.95; t += 0.07) { const [x, y] = q(t); ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 7); ctx.fill(); }
      const [tx, ty] = q(0.5);
      ctx.strokeStyle = 'rgba(160,160,160,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(tx, ty + 4, 3.5, 0, 7); ctx.stroke();
      const g = ctx.createRadialGradient(tx - 3, ty + 10, 1, tx, ty + 14, 11);
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, U.rgba(L.tag));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tx, ty + 15, 10, 0, 7); ctx.fill();
      ctx.strokeStyle = U.rgba(U.shade(L.tag, 0.6)); ctx.lineWidth = 1.5; ctx.stroke();
    }

    drawHead(ctx, W, B) {
      const p = this.p, S = this.sprites;
      const [hx, hy] = W(p.hx, p.hy);
      const r = B.r + p.hr;
      const jit = this.purr * Math.sin(this.t * 151) * 0.4;
      this.headWorld = { x: hx, y: hy, r, s: p.hsc };
      ctx.save(); ctx.translate(hx + jit, hy); ctx.rotate(r); ctx.scale(p.hsc, p.hsc);
      ctx.save(); ctx.translate(-60, -60); ctx.rotate(-0.3 + p.eLr); ctx.scale(1, p.eLs); spr(ctx, S.ear); ctx.restore();
      ctx.save(); ctx.translate(60, -60); ctx.rotate(0.3 + p.eRr); ctx.scale(-1, p.eRs); spr(ctx, S.ear); ctx.restore();
      shadowOn(ctx, 22, 0.4, 10); spr(ctx, S.head); shadowOff(ctx);
      this.drawEye(ctx, -42, -10, -1);
      this.drawEye(ctx, 42, -10, 1);
      this.drawNose(ctx);
      this.drawWhiskers(ctx);
      ctx.restore();
    }

    drawEye(ctx, ex, ey, sd) {
      const p = this.p, L = this.look, S = this.sprites;
      const rx = 24, ry = 19;
      const lid = U.clamp(Math.max(p.lid, this.blinkLid), 0, 1), low = U.clamp(p.low, 0, 1);
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(-sd * 0.13);
      const eye = new Path2D();
      eye.moveTo(-rx, 1);
      eye.bezierCurveTo(-rx * 0.7, -ry * 1.32, rx * 0.7, -ry * 1.32, rx, -1);
      eye.bezierCurveTo(rx * 0.72, ry * 1.25, -rx * 0.72, ry * 1.25, -rx, 1);
      ctx.lineWidth = 5; ctx.strokeStyle = U.rgba(L.eyeRim, 0.5); ctx.stroke(eye);
      ctx.save(); ctx.clip(eye);
      const ox = p.lookX * 5, oy = p.lookY * 4, I = L.iris;
      let g = ctx.createRadialGradient(ox, oy, 1, ox, oy, rx * 1.1);
      g.addColorStop(0, U.rgba(I[0])); g.addColorStop(0.45, U.rgba(I[1])); g.addColorStop(0.8, U.rgba(I[2])); g.addColorStop(1, U.rgba(I[3]));
      ctx.fillStyle = g; ctx.fillRect(-rx - 3, -ry * 1.6, rx * 2 + 6, ry * 3.2);
      ctx.lineWidth = 0.7;
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2 + (i % 3) * 0.05, r1 = rx * (0.8 + 0.2 * (((i * 7) % 5) / 5));
        ctx.strokeStyle = i % 2 ? 'rgba(255,255,200,0.13)' : 'rgba(30,50,20,0.16)';
        ctx.beginPath(); ctx.moveTo(ox + Math.cos(a) * 6, oy + Math.sin(a) * 6); ctx.lineTo(ox + Math.cos(a) * r1, oy + Math.sin(a) * r1); ctx.stroke();
      }
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,28,12,0.45)'; ctx.stroke(eye);
      const pw = U.lerp(2.6, 13, U.clamp(p.pupil, 0, 1)), phh = U.lerp(17, 15.5, U.clamp(p.pupil, 0, 1));
      ctx.fillStyle = '#060505'; ctx.beginPath(); ctx.ellipse(ox, oy, pw, phh, 0, 0, Math.PI * 2); ctx.fill();
      g = ctx.createLinearGradient(0, -ry * 1.2, 0, -ry * 0.05);
      g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(-rx - 3, -ry * 1.6, rx * 2 + 6, ry * 1.6);
      ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.ellipse(ox - 6, oy - 7, 4.2, 3.4, -0.4, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(ox + 6, oy + 6, 1.8, 0, 7); ctx.fill();
      const cl = U.lerp(ry * 1.02, ry * 0.42, low);
      const cu = U.lerp(-ry * 1.35, cl + 1, lid);
      ctx.fillStyle = U.rgba(S.lidLo);
      ctx.beginPath(); ctx.moveTo(-rx - 4, ry * 2); ctx.lineTo(rx + 4, ry * 2); ctx.lineTo(rx + 4, -1);
      ctx.quadraticCurveTo(0, 2 * cl, -rx - 4, 1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = U.rgba(S.lidUp);
      ctx.beginPath(); ctx.moveTo(-rx - 4, -ry * 2); ctx.lineTo(rx + 4, -ry * 2); ctx.lineTo(rx + 4, -1);
      ctx.quadraticCurveTo(0, 2 * cu, -rx - 4, 1); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.lineCap = 'round';
      ctx.strokeStyle = U.rgba(L.eyeRim, 0.95); ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(-rx, 1); ctx.quadraticCurveTo(0, 2 * Math.max(cu, -ry * 0.99), rx, -1); ctx.stroke();
      ctx.strokeStyle = U.rgba(L.eyeRim, 0.6); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-rx, 1); ctx.quadraticCurveTo(0, 2 * Math.min(cl, ry * 0.94), rx, -1); ctx.stroke();
      ctx.restore();
    }

    drawNose(ctx) {
      const L = this.look, p = this.p;
      if (p.mouth > 0.03) {
        const m = p.mouth;
        ctx.fillStyle = '#3a1012';
        ctx.beginPath(); ctx.ellipse(0, 56 + 7 * m, 15 + 5 * m, 3 + 15 * m, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#d9727a';
        ctx.beginPath(); ctx.ellipse(0, 62 + 11 * m, 10, 2 + 6 * m, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#fbf8f0';
        for (const sd of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(sd * 14, 51); ctx.lineTo(sd * 9, 51); ctx.lineTo(sd * 11.5, 53 + 4 + 8 * m); ctx.closePath(); ctx.fill();
        }
      }
      const n = new Path2D();
      n.moveTo(-13, 22);
      n.bezierCurveTo(-6, 18, 6, 18, 13, 22);
      n.bezierCurveTo(12, 28, 5, 34, 1.5, 38);
      n.quadraticCurveTo(0, 39.5, -1.5, 38);
      n.bezierCurveTo(-5, 34, -12, 28, -13, 22);
      const g = ctx.createLinearGradient(0, 18, 0, 40);
      g.addColorStop(0, U.rgba(U.shade(L.nose, 1.12))); g.addColorStop(1, U.rgba(U.shade(L.nose, 0.85)));
      ctx.fillStyle = g; ctx.fill(n);
      ctx.strokeStyle = U.rgba(L.noseLine, 0.9); ctx.lineWidth = 1.3; ctx.stroke(n);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-4, 23, 3.4, 1.6, -0.1, 0, 7); ctx.fill();
      ctx.strokeStyle = U.rgba(L.mouthLine, 0.85); ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 39); ctx.lineTo(0, 47);
      ctx.moveTo(0, 47); ctx.quadraticCurveTo(-7, 55, -17, 50);
      ctx.moveTo(0, 47); ctx.quadraticCurveTo(7, 55, 17, 50); ctx.stroke();
      ctx.fillStyle = 'rgba(40,30,25,0.35)';
      for (const sd of [-1, 1]) for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) {
        ctx.beginPath(); ctx.arc(sd * (20 + k * 7), 40 + r * 6 + k, 1.1, 0, 7); ctx.fill();
      }
    }

    drawWhiskers(ctx) {
      const p = this.p, t = this.t;
      ctx.strokeStyle = this.look.whisker; ctx.lineCap = 'round';
      for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) {
        const ox = sd * (22 + i * 2.5), oy = 41 + i * 3.4;
        const a = -0.3 + i * 0.14 - p.whisk * 0.3 + Math.sin(t * 0.9 + i) * 0.015;
        const A = sd > 0 ? a : Math.PI - a;
        const L = 92 - Math.abs(i - 2.5) * 7;
        const ex = ox + Math.cos(A) * L, ey = oy + Math.sin(A) * L;
        ctx.lineWidth = 1.5 - i * 0.08;
        ctx.beginPath(); ctx.moveTo(ox, oy);
        ctx.quadraticCurveTo((ox + ex) / 2, (oy + ey) / 2 - 6 + i * 1.5, ex, ey + 8);
        ctx.stroke();
      }
    }
  }
  KS.Cat = Cat;
})();
