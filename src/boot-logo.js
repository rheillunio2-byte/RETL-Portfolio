/* =====================================================================
   RETL · logo formation — samples the emblem PNG's alpha into points,
   scatters them from the pupil and spirals them in until they lock into
   the real logo, which then resolves to the solid image.
   ===================================================================== */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const MAX_POINTS = 4200;

export function createLogoForm(canvas, src = "/brand/retl-emblem-tight.png") {
  const ctx = canvas.getContext("2d");
  const img = new Image();
  let loaded = false, failed = false;
  img.onload = () => { loaded = true; };
  img.onerror = () => { failed = true; };
  img.src = src;

  let raf = 0, running = false;
  const FORM_MS = 900, DELAY_MS = 260, SOLID_AT = 1050, SOLID_MS = 380;
  const TOTAL_MS = SOLID_AT + SOLID_MS + 200;

  const build = (cx, cy) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = innerWidth, H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";

    let lw = Math.min(W * 0.78, 560);
    let lh = lw * img.naturalHeight / img.naturalWidth;
    if (lh > H * 0.55) { lh = H * 0.55; lw = lh * img.naturalWidth / img.naturalHeight; }
    const x0 = Math.round((W - lw) / 2), y0 = Math.round((H - lh) / 2);

    const off = document.createElement("canvas");
    off.width = Math.max(1, Math.round(lw)); off.height = Math.max(1, Math.round(lh));
    const octx = off.getContext("2d", { willReadFrequently: true });
    octx.drawImage(img, 0, 0, off.width, off.height);
    const data = octx.getImageData(0, 0, off.width, off.height).data;

    const pts = [];
    const step = Math.max(2, Math.round(lw / 190));
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        const a = data[(y * off.width + x) * 4 + 3];
        if (a > 140) pts.push({ tx: x0 + x + Math.random() * step, ty: y0 + y + Math.random() * step });
      }
    }
    while (pts.length > MAX_POINTS) pts.splice((Math.random() * pts.length) | 0, 1);

    const far = Math.max(W, H) * 0.8;
    pts.forEach(p => {
      const ang = Math.random() * Math.PI * 2, r = 120 + Math.random() * far;
      p.dx = Math.cos(ang) * r + (cx - p.tx);          // offset from target at start
      p.dy = Math.sin(ang) * r + (cy - p.ty);
      p.swirl = (Math.random() * 1.1 + 0.5) * (Math.random() < 0.5 ? -1 : 1);
      p.delay = Math.random() * DELAY_MS;
      p.size = 1 + Math.random() * 1.7;
      p.mix = Math.random();
    });
    return { pts, x0, y0, lw, lh, dpr, W, H };
  };

  return {
    totalMs: TOTAL_MS,
    solidEnd: SOLID_AT + SOLID_MS,
    formMs: FORM_MS + DELAY_MS,
    ready: () => loaded && !failed,
    start(cx, cy) {
      if (!loaded || failed || running) return false;
      const m = build(cx, cy);
      canvas.classList.add("on");
      running = true;
      const t0 = performance.now();
      const frame = now => {
        if (!running) return;
        const el = now - t0;
        ctx.setTransform(m.dpr, 0, 0, m.dpr, 0, 0);
        ctx.clearRect(0, 0, m.W, m.H);
        const solid = clamp((el - SOLID_AT) / SOLID_MS, 0, 1);

        ctx.globalCompositeOperation = "lighter";
        const pa = 1 - solid * 0.85;
        for (let i = 0; i < m.pts.length; i++) {
          const p = m.pts[i];
          const e = easeOut(clamp((el - p.delay) / FORM_MS, 0, 1));
          const k = 1 - e;
          const c = Math.cos(p.swirl * k), s = Math.sin(p.swirl * k);
          const x = p.tx + (p.dx * c - p.dy * s) * k;
          const y = p.ty + (p.dx * s + p.dy * c) * k;
          const shimmer = e >= 1 ? 0.65 + 0.35 * Math.sin(el / 90 + i) : 1;
          ctx.fillStyle = `rgba(${(168 + p.mix * 65) | 0},${(117 + p.mix * 99) | 0},255,${(pa * (0.35 + e * 0.65) * shimmer).toFixed(3)})`;
          ctx.fillRect(x, y, p.size, p.size);
        }
        ctx.globalCompositeOperation = "source-over";
        if (solid > 0) {
          ctx.save();
          ctx.globalAlpha = solid;
          ctx.shadowColor = "rgba(168,117,255,.9)";
          ctx.shadowBlur = 34 + 20 * Math.sin(el / 160);
          ctx.drawImage(img, m.x0, m.y0, m.lw, m.lh);
          ctx.restore();
        }
        if (el < TOTAL_MS) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      return true;
    },
    stop() { running = false; cancelAnimationFrame(raf); }
  };
}
