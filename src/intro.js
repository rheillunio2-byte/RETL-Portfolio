/* =====================================================================
   RETL · CINEMATIC INTRO
   A robot eye glitches awake, scans the room, locks onto the visitor,
   delivers the welcome lines, then asks "Are you ready?". Clicking enter
   dives into the pupil and the portfolio takes over.

   ── Edit the words here ──────────────────────────────────────────────
   Every beat can set: tag (small mono line), title, sub (typed line),
   size ('' = huge · 'md' · 'lg'), grad (gradient fill), cta (show button).
   ===================================================================== */
import { createLogoForm } from "./boot-logo.js";

// Cold-boot terminal that types out before the eye wakes (project names come from the portfolio).
export const BOOT_LINES = [
  ["retl.os v2.4 — cold boot", ""],
  ["mounting /projects/apihub", "ok"],
  ["mounting /projects/saferoute-ph", "ok"],
  ["mounting /projects/promptpilot", "ok"],
  ["mounting /projects/codeguard-ai", "ok"],
  ["loading python.core", "ok"],
  ["waking optic-01", "…"]
];
const BOOT_MS = 1300;          // how long the terminal plays before the eye starts opening

export const INTRO_COPY = {
  ctaLabel: "Enter the portfolio",
  beats: [
    { tag: "Boot sequence complete", hold: 600 },
    { tag: "Visitor detected", title: "WELCOME", size: "", grad: true, hold: 1000 },
    { title: "to the world of RETL", size: "md", sub: "Software · Python · Research — built with intent.", hold: 800 },
    { tag: "Initialising portfolio", title: "ARE YOU READY?", size: "lg", grad: true, sub: "to see what I've been building.", cta: true }
  ]
};

// Crosshair look (props of src/components/Crosshair.jsx). Set `targetEffect: "glitch"` for a shaky-signal feel.
export const INTRO_CROSSHAIR = {
  color: "#c5a2ff", thickness: 1, opacity: 0.8, lineStyle: "solid", gap: 16, fade: 0.55, smoothing: 0.3,
  showCoordinates: true, targetEffect: "lock", clickPulse: true, hideCursor: true, className: "boot-xhair"
};

const NS = "http://www.w3.org/2000/svg";
const GLYPHS = "<>/\\|{}[]#$%&*+=-_01XZQWM";
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rand = (a, b) => a + Math.random() * (b - a);

// Eye openness over time (ms). Quick up/down pairs read as a glitching, stuttering power-on.
const OPEN = [
  [0, 0], [450, 0], [490, .14], [560, 0], [900, 0], [930, .38], [1010, .04], [1240, .04],
  [1270, .62], [1330, .18], [1380, .74], [1430, .3], [1520, .55], [2200, 1]
];
const OPEN_END = OPEN[OPEN.length - 1][0];
const FLICKERS = [490, 930, 1270, 1380, 1430];
const AWAKE_AT = 880;

// Scripted gaze while the eye "looks around" (ms, x, y)
const LOOK = [
  [2300, 0, 0], [2450, -72, -3], [3050, 74, -6], [3650, 0, -28], [4150, 0, 0]
];
const lookAt = t => {
  let cur = null;
  for (const k of LOOK) if (t >= k[0]) cur = k;
  return cur;
};
const interp = (keys, t) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
      const p = (t - t0) / (t1 - t0);
      const e = i === keys.length - 1 ? 1 - Math.pow(1 - p, 3) : p;
      return v0 + (v1 - v0) * e;
    }
  }
  return keys[keys.length - 1][1];
};

const svg = (tag, attrs = {}, parent) => {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  parent?.appendChild(el);
  return el;
};

/* ---------------------------------------------------------------- */
/* Build DOM                                                        */
/* ---------------------------------------------------------------- */
function buildEye(host) {
  const CX = 200, CY = 130, HW = 182;
  const eyePath = o => {
    const c = 112 * o;
    return `M${CX - HW} ${CY} C${CX - 92} ${CY - c} ${CX + 92} ${CY - c} ${CX + HW} ${CY} C${CX + 92} ${CY + c} ${CX - 92} ${CY + c} ${CX - HW} ${CY}Z`;
  };

  // Outer HUD rings (behind the eye)
  const ringWrap = document.createElement("div");
  ringWrap.className = "hud-ring";
  const rs = svg("svg", { viewBox: "0 0 600 600", "aria-hidden": "true" }, ringWrap);
  const r1 = svg("g", { class: "r1" }, rs);
  svg("circle", { cx: 300, cy: 300, r: 282, fill: "none", stroke: "rgba(197,162,255,.28)", "stroke-width": 1, "stroke-dasharray": "2 8" }, r1);
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2, long = i % 5 === 0;
    const r0 = 290, r2 = long ? 304 : 297;
    svg("line", {
      x1: 300 + Math.cos(a) * r0, y1: 300 + Math.sin(a) * r0, x2: 300 + Math.cos(a) * r2, y2: 300 + Math.sin(a) * r2,
      stroke: long ? "rgba(216,193,255,.6)" : "rgba(197,162,255,.28)", "stroke-width": 1
    }, r1);
  }
  const r2 = svg("g", { class: "r2" }, rs);
  svg("circle", { cx: 300, cy: 300, r: 258, fill: "none", stroke: "rgba(168,117,255,.34)", "stroke-width": 1.4, "stroke-dasharray": "70 24 8 24" }, r2);
  const r3 = svg("g", { class: "r3" }, rs);
  svg("circle", { cx: 300, cy: 300, r: 236, fill: "none", stroke: "rgba(216,193,255,.18)", "stroke-width": 6, "stroke-dasharray": "1 14" }, r3);
  host.appendChild(ringWrap);

  // The eye
  const s = svg("svg", { viewBox: "0 0 400 260", role: "img", "aria-label": "A robotic eye" }, host);
  const defs = svg("defs", {}, s);
  const clip = svg("clipPath", { id: "introEyeClip" }, defs);
  const clipPathEl = svg("path", { d: eyePath(0) }, clip);

  const sclera = svg("radialGradient", { id: "introSclera", cx: "50%", cy: "50%", r: "60%" }, defs);
  svg("stop", { offset: "0%", "stop-color": "#1d1233" }, sclera);
  svg("stop", { offset: "100%", "stop-color": "#05030a" }, sclera);
  const iris = svg("radialGradient", { id: "introIris", cx: "50%", cy: "50%", r: "50%" }, defs);
  [["0%", "#f3e8ff"], ["28%", "#c9a4ff"], ["58%", "#7a44d0"], ["84%", "#341566"], ["100%", "#13072a"]]
    .forEach(([o, c]) => svg("stop", { offset: o, "stop-color": c }, iris));
  const shade = svg("linearGradient", { id: "introShade", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  [["0%", "rgba(3,2,7,.92)"], ["22%", "rgba(3,2,7,0)"], ["78%", "rgba(3,2,7,0)"], ["100%", "rgba(3,2,7,.85)"]]
    .forEach(([o, c]) => svg("stop", { offset: o, "stop-color": c }, shade));
  const scanG = svg("linearGradient", { id: "introScan", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  [["0%", "rgba(216,193,255,0)"], ["50%", "rgba(216,193,255,.55)"], ["100%", "rgba(216,193,255,0)"]]
    .forEach(([o, c]) => svg("stop", { offset: o, "stop-color": c }, scanG));

  // inner = clipped eyeball (no filter: it changes every frame). glow = lid outline only (cheap to keep filtered)
  const inner = svg("g", { "clip-path": "url(#introEyeClip)" }, s);
  const glow = svg("g", { class: "eye-glow" }, s);
  svg("rect", { x: 0, y: 0, width: 400, height: 260, fill: "url(#introSclera)" }, inner);
  // tech grid inside the sclera
  const gridG = svg("g", { stroke: "rgba(168,117,255,.12)", "stroke-width": 1 }, inner);
  for (let x = 20; x < 400; x += 20) svg("line", { x1: x, y1: 0, x2: x, y2: 260 }, gridG);
  for (let y = 10; y < 260; y += 20) svg("line", { x1: 0, y1: y, x2: 400, y2: y }, gridG);

  const gaze = svg("g", { transform: `translate(${CX} ${CY})` }, inner);
  svg("circle", { r: 70, fill: "rgba(139,86,224,.35)", filter: "none" }, gaze);
  svg("circle", { r: 64, fill: "url(#introIris)" }, gaze);
  const fibers = svg("g", { stroke: "rgba(255,255,255,.2)", "stroke-width": 1 }, gaze);
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2, r0 = 24 + rand(0, 8), r1v = 56 + rand(0, 6);
    svg("line", { x1: Math.cos(a) * r0, y1: Math.sin(a) * r0, x2: Math.cos(a) * r1v, y2: Math.sin(a) * r1v, opacity: rand(.35, 1).toFixed(2) }, fibers);
  }
  const ringA = svg("g", {}, gaze);
  svg("circle", { r: 57, fill: "none", stroke: "rgba(233,216,255,.7)", "stroke-width": 2, "stroke-dasharray": "16 7" }, ringA);
  svg("animateTransform", { attributeName: "transform", type: "rotate", from: "0", to: "360", dur: "16s", repeatCount: "indefinite" }, ringA);
  const ringB = svg("g", {}, gaze);
  svg("circle", { r: 47, fill: "none", stroke: "rgba(255,255,255,.45)", "stroke-width": 1, "stroke-dasharray": "2 6" }, ringB);
  svg("animateTransform", { attributeName: "transform", type: "rotate", from: "360", to: "0", dur: "10s", repeatCount: "indefinite" }, ringB);
  svg("circle", { r: 64, fill: "none", stroke: "rgba(233,216,255,.9)", "stroke-width": 1.5 }, gaze);
  const pupilGlow = svg("circle", { r: 26, fill: "none", stroke: "#e9d8ff", "stroke-width": 2, opacity: .9 }, gaze);
  const pupil = svg("circle", { r: 22, fill: "#04010a" }, gaze);
  // reticle
  const ret = svg("g", { stroke: "rgba(233,216,255,.75)", "stroke-width": 1 }, gaze);
  [[-40, 0, -29, 0], [29, 0, 40, 0], [0, -40, 0, -29], [0, 29, 0, 40]].forEach(([x1, y1, x2, y2]) => svg("line", { x1, y1, x2, y2 }, ret));
  svg("circle", { r: 34, fill: "none", stroke: "rgba(233,216,255,.4)", "stroke-dasharray": "3 5" }, ret);
  svg("circle", { cx: -15, cy: -17, r: 5.5, fill: "#fff", opacity: .92 }, gaze);
  svg("circle", { cx: 12, cy: 15, r: 2.2, fill: "#fff", opacity: .6 }, gaze);

  const scan = svg("rect", { x: 0, y: 0, width: 400, height: 26, fill: "url(#introScan)", opacity: .6 }, inner);
  svg("rect", { x: 0, y: 0, width: 400, height: 260, fill: "url(#introShade)" }, inner);

  // lid outline (a glowing hairline when closed)
  const lidWide = svg("path", { d: eyePath(0), fill: "none", stroke: "rgba(168,117,255,.5)", "stroke-width": 7, "stroke-linejoin": "round" }, glow);
  const lid = svg("path", { d: eyePath(0), fill: "none", stroke: "#e2d0ff", "stroke-width": 2.2, "stroke-linejoin": "round" }, glow);
  // eyelid latch ticks (left/right)
  const latch = svg("g", { stroke: "#c5a2ff", "stroke-width": 1.6, opacity: .9 }, glow);
  svg("line", { x1: 0, y1: CY, x2: 14, y2: CY }, latch);
  svg("line", { x1: 386, y1: CY, x2: 400, y2: CY }, latch);
  svg("circle", { cx: 6, cy: CY, r: 2.4, fill: "#c5a2ff", stroke: "none" }, latch);
  svg("circle", { cx: 394, cy: CY, r: 2.4, fill: "#c5a2ff", stroke: "none" }, latch);

  // targeting brackets + live readouts
  const br = svg("g", { fill: "none", stroke: "rgba(197,162,255,.5)", "stroke-width": 1.2 }, s);
  [[-6, 8, 1, 1], [406, 8, -1, 1], [-6, 252, 1, -1], [406, 252, -1, -1]].forEach(([x, y, sx, sy]) =>
    svg("path", { d: `M${x} ${y + 14 * sy} L${x} ${y} L${x + 14 * sx} ${y}` }, br));
  const txt = (x, y, anchor, str) => {
    const t = svg("text", { x, y, class: "eye-readout", "text-anchor": anchor }, s);
    t.textContent = str;
    return t;
  };
  txt(0, -6, "start", "OPTIC-01 // RETL CORE");
  const rdGaze = txt(0, 274, "start", "GAZE +000 / +000");
  const rdPupil = txt(400, 274, "end", "PUPIL 22.0");
  const rdLock = txt(400, -6, "end", "LOCK ○ SEARCHING");

  return { clipPathEl, lid, lidWide, gaze, pupil, pupilGlow, scan, rdGaze, rdPupil, rdLock, eyePath, CX, CY };
}

function buildDOM(root) {
  root.innerHTML = `
    <div class="boot-bg"></div><div class="boot-grid"></div>
    <div class="boot-term" id="boot-term" aria-hidden="true"></div>
    <canvas class="boot-logo" id="boot-logo" aria-hidden="true"></canvas>
    <div class="boot-hud" aria-hidden="true">
      <i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>
      <div class="boot-id"><span class="boot-rec"></span>REC · LIVE<br><b>RETL // PORTFOLIO</b> · 2026</div>
      <div class="boot-status" id="boot-status"></div>
    </div>
    <div class="boot-stage">
      <div class="boot-eye" id="boot-eye"></div>
      <div class="boot-copy">
        <p class="boot-tag" id="boot-tag" aria-hidden="true"></p>
        <h2 class="boot-title" id="boot-title" aria-hidden="true" data-text=""></h2>
        <p class="boot-sub" id="boot-sub" aria-hidden="true"></p>
        <span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Welcome to the world of RETL. Are you ready to see what I've been building? Press Enter to open the portfolio.</span>
        <div class="boot-cta" id="boot-cta">
          <button class="boot-enter" id="boot-enter" type="button" disabled>${INTRO_COPY.ctaLabel} <span>↗</span></button>
          <div class="boot-hint">or press <kbd>Enter</kbd></div>
        </div>
      </div>
    </div>
    <button class="boot-skip" id="boot-skip" type="button" aria-label="Skip intro">SKIP ›</button>
    <div class="boot-scan"></div><div class="boot-roll"></div><div class="boot-vignette"></div>
    <div class="boot-tear"></div><div class="boot-flash"></div>`;
}

/* ---------------------------------------------------------------- */
/* Public API                                                       */
/* ---------------------------------------------------------------- */
export function playIntro({ onEnter } = {}) {
  const root = document.getElementById("boot");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!root || reduce) {
    root?.remove();
    onEnter?.();
    return Promise.resolve();
  }

  return new Promise(resolve => {
    buildDOM(root);

    // React Bits <Crosshair /> — a targeting reticle that follows the pointer across the whole intro,
    // locks onto the buttons with corner brackets, and pings on click. Code-split + mounted lazily.
    let xhairRoot = null;
    (async () => {
      try {
        const [dom, react, xh] = await Promise.all([
          import("react-dom/client"), import("react"), import("./components/Crosshair.jsx")
        ]);
        const createRoot = dom.createRoot ?? dom.default?.createRoot;   // named or CJS-interop default
        const createElement = react.createElement ?? react.default?.createElement;
        const Crosshair = xh.default;
        if (!root.isConnected) return;
        const mount = document.createElement("div");
        mount.style.display = "contents";
        root.appendChild(mount);
        xhairRoot = createRoot(mount);
        xhairRoot.render(createElement(Crosshair, { containerRef: { current: root }, ...INTRO_CROSSHAIR }));
      } catch (err) { console.warn("[intro] crosshair unavailable", err); }
    })();
    const $ = s => root.querySelector(s);
    const eyeHost = $("#boot-eye");
    const eye = buildEye(eyeHost);
    const tagEl = $("#boot-tag"), titleEl = $("#boot-title"), subEl = $("#boot-sub");
    const ctaEl = $("#boot-cta"), enterBtn = $("#boot-enter"), skipBtn = $("#boot-skip");
    const statusEl = $("#boot-status");
    const logo = createLogoForm($("#boot-logo"));
    const termEl = $("#boot-term");
    root.classList.add("is-booting");

    let dead = false, entered = false, ctaShown = false;
    let assetsReady = document.readyState === "complete";
    let pct = 0;
    const t0 = performance.now();
    const AT = ms => ms + BOOT_MS;
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms); timers.add(id); return id; };
    const sleep = ms => new Promise(r => later(r, ms));

    /* ----- status readout (bottom-left) ----- */
    const barLine = document.createElement("div");
    barLine.innerHTML = `<span id="boot-load-label">LOADING PORTFOLIO</span> <b id="boot-pct">00%</b><span class="boot-bar"><i id="boot-bar-i"></i></span>`;
    statusEl.appendChild(barLine);
    const pctEl = barLine.querySelector("#boot-pct"), barI = barLine.querySelector("#boot-bar-i"), loadLabel = barLine.querySelector("#boot-load-label");
    const addStatus = (label, value, ok) => {
      const d = document.createElement("div");
      d.innerHTML = `${label} <b${ok ? ' class="ok"' : ""}>${value}</b>`;
      statusEl.insertBefore(d, barLine);
    };

    window.addEventListener("load", () => { assetsReady = true; }, { once: true });
    document.fonts?.ready?.then(() => {});

    /* ----- gaze / pupil state ----- */
    const g = { x: 0, y: 0, tx: 0, ty: 0 };
    const pointer = { x: null, y: null, moved: false };
    let pupilR = 22, pupilTarget = 22;
    let tracking = false;
    let blinkAt = Infinity, blinkStart = -1;
    let lastPath = -1;

    const onPointer = e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.moved = true; };
    window.addEventListener("pointermove", onPointer, { passive: true });

    /* ----- glitch helpers ----- */
    const glitchEye = (ms = 170) => {
      eyeHost.classList.remove("glitch");
      void eyeHost.offsetWidth;
      eyeHost.classList.add("glitch");
      later(() => eyeHost.classList.remove("glitch"), ms);
    };
    const burst = () => {
      root.classList.remove("burst"); void root.offsetWidth; root.classList.add("burst");
      later(() => root.classList.remove("burst"), 180);
    };
    FLICKERS.forEach(t => later(() => glitchEye(120), AT(t)));

    /* ----- boot terminal ----- */
    BOOT_LINES.forEach(([text, status], i) => later(() => {
      const d = document.createElement("div");
      d.innerHTML = `<span>${text}</span><i></i><b class="${status === "ok" ? "ok" : ""}">${status}</b>`;
      termEl.appendChild(d);
    }, 90 + i * 150));
    later(() => root.classList.remove("is-booting"), BOOT_MS - 120);

    /* ----- text engine ----- */
    const setTitle = s => { titleEl.textContent = s; titleEl.dataset.text = s; };
    let lastScr = 0;
    const scramble = (el, text, duration, mirror) => new Promise(res => {
      const start = performance.now(), n = text.length;
      let shown = "";
      const step = now => {
        if (dead) return res();
        const p = clamp((now - start) / duration, 0, 1);
        if (now - lastScr > 38 || p === 1) {
          lastScr = now;
          const reveal = Math.floor(p * n);
          let out = "";
          for (let i = 0; i < n; i++) {
            const ch = text[i];
            out += ch === " " ? " " : i < reveal ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
          shown = p === 1 ? text : out;
          el.textContent = shown;
          if (mirror) el.dataset.text = shown;
        }
        if (p < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
    const typeLine = (el, text, cps = 62) => new Promise(res => {
      el.textContent = "";
      const caret = document.createElement("span");
      caret.className = "boot-caret";
      let i = 0;
      const tick = () => {
        if (dead) return res();
        el.textContent = text.slice(0, ++i);
        el.appendChild(caret);
        if (i < text.length) later(tick, 1000 / cps + rand(-8, 14));
        else { later(() => caret.remove(), 900); res(); }
      };
      tick();
    });

    const glitchOutTitle = async () => {
      if (!titleEl.textContent) return;
      titleEl.classList.remove("glitching");
      titleEl.classList.add("out");
      glitchEye(140);
      await sleep(270);
      titleEl.classList.remove("out");
      setTitle("");
    };

    async function runBeat(b, i) {
      if (b.title !== undefined) {
        await glitchOutTitle();
        subEl.textContent = "";
        titleEl.className = "boot-title" + (b.size ? " " + b.size : "") + (b.grad ? " grad" : "");
      }
      if (b.tag) { scramble(tagEl, b.tag.toUpperCase(), 520); addStatusFor(i); }
      if (b.title !== undefined) {
        titleEl.classList.add("glitching");
        burst();
        await scramble(titleEl, b.title, 620, true);
        later(() => titleEl.classList.remove("glitching"), 650);
      }
      if (b.cta) showCTA();
      if (b.sub) await typeLine(subEl, b.sub);
    }
    function addStatusFor(i) {
      if (i === 0) { addStatus("OPTIC CORE ·····", "ONLINE", true); }
      if (i === 1) { addStatus("VISITOR ·········", "DETECTED", true); }
      if (i === 3) { addStatus("GREETING ········", "DELIVERED", true); }
    }
    function showCTA() {
      ctaShown = true;
      ctaEl.classList.add("show");
      tracking = true;
      pupilTarget = 20;
      eye.rdLock.textContent = "LOCK ● VISITOR";
      refreshCTA();
    }
    function refreshCTA() {
      if (!ctaShown) return;
      if (assetsReady && pct >= 99.5) {
        enterBtn.disabled = false;
        if (document.activeElement !== enterBtn) enterBtn.focus({ preventScroll: true });
      }
    }

    /* ----- main timeline ----- */
    (async () => {
      await sleep(AT(AWAKE_AT));
      root.classList.add("is-awake");
      await sleep(1900 - AWAKE_AT);
      const beats = INTRO_COPY.beats;
      for (let i = 0; i < beats.length; i++) {
        await runBeat(beats[i], i);
        if (dead) return;
        if (beats[i].hold) await sleep(beats[i].hold);
      }
    })();

    // random micro-glitches once awake
    const microGlitch = () => {
      if (dead || entered) return;
      if (performance.now() - t0 > AT(2400) && Math.random() < .8) glitchEye(110);
      later(microGlitch, rand(2600, 5200));
    };
    later(microGlitch, AT(3200));

    /* ----- render loop ----- */
    let last = t0, raf = 0, scanY = 0;
    const frame = now => {
      if (dead && !entered) return;
      const dt = Math.min(64, now - last); last = now;
      const t = now - t0 - BOOT_MS;

      // loading %: eases toward 92 while loading, snaps to 100 when the page has really loaded
      const target = assetsReady ? 100 : Math.min(92, 18 + (Math.max(0, t + BOOT_MS) / 6000) * 74);
      pct += (target - pct) * (1 - Math.exp(-dt / (assetsReady ? 120 : 400)));
      if (assetsReady && pct > 99.4) pct = 100;
      const shownPct = Math.floor(clamp(pct, 0, 100));
      pctEl.textContent = String(shownPct).padStart(2, "0") + "%";
      barI.style.transform = `scaleX(${clamp(pct / 100, 0, 1)})`;
      if (pct >= 100 && loadLabel.textContent !== "PORTFOLIO READY") { loadLabel.textContent = "PORTFOLIO READY"; refreshCTA(); }

      // openness (with blinks once fully open)
      let o = (t >= OPEN_END || entered) ? 1 : interp(OPEN, t);
      if (t > OPEN_END + 1500 && !entered) {
        if (blinkAt === Infinity) blinkAt = t + rand(1400, 3000);
        if (t >= blinkAt && blinkStart < 0) blinkStart = t;
        if (blinkStart >= 0) {
          const p = (t - blinkStart) / 260;
          if (p >= 1) { blinkStart = -1; blinkAt = t + rand(2600, 5600); }
          else o *= 1 - Math.sin(p * Math.PI) * .96;
        }
      }
      const key = Math.round(o * 400);
      if (key !== lastPath) {
        lastPath = key;
        const d = eye.eyePath(o);
        eye.clipPathEl.setAttribute("d", d);
        eye.lid.setAttribute("d", d);
        eye.lidWide.setAttribute("d", d);
        eye.lidWide.setAttribute("opacity", Math.max(.35, o).toFixed(2));
      }

      // gaze
      if (!entered) {
        const look = lookAt(t);
        if (t > 4300 && pointer.moved) {
          const r = eyeHost.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          g.tx = clamp((pointer.x - cx) / (innerWidth * .5), -1, 1) * 76;
          g.ty = clamp((pointer.y - cy) / (innerHeight * .5), -1, 1) * 34;
        } else if (look && t < LOOK[LOOK.length - 1][0] + 200) {
          g.tx = look[1]; g.ty = look[2];
        } else if (tracking || t > 4300) {
          g.tx = Math.sin(t / 1400) * 26; g.ty = Math.cos(t / 1900) * 9;   // idle wander (touch devices)
        }
        // CTA hover / focus → pupil narrows & eye locks forward
        const hot = ctaShown && (enterBtn.matches(":hover") || document.activeElement === enterBtn);
        if (hot && !enterBtn.disabled) { g.tx *= .25; g.ty *= .25; pupilTarget = 13; }
        else if (ctaShown) pupilTarget = 20 + Math.sin(t / 500) * 1.5;
        else if (t > 4150 && t < 4500) pupilTarget = 15;                    // focus snap
        else if (t > 4500) pupilTarget = 22 + Math.sin(t / 700) * 1.6;
        else if (t > 2300) pupilTarget = 22 + Math.sin(t / 260) * 3;        // scanning shimmer
      }
      const k = 1 - Math.exp(-dt / 85);
      g.x += (g.tx - g.x) * k; g.y += (g.ty - g.y) * k;
      pupilR += (pupilTarget - pupilR) * (1 - Math.exp(-dt / 110));
      eye.gaze.setAttribute("transform", `translate(${(eye.CX + g.x).toFixed(2)} ${(eye.CY + g.y).toFixed(2)})`);
      eye.pupil.setAttribute("r", pupilR.toFixed(2));
      eye.pupilGlow.setAttribute("r", (pupilR + 4).toFixed(2));

      // scan line sweeping through the eye
      scanY = (scanY + dt * .09) % 330;
      eye.scan.setAttribute("y", (scanY - 40).toFixed(1));

      // readouts (cheap, ~12fps)
      if (((now / 80) | 0) !== (((now - dt) / 80) | 0)) {
        const f = n => (n >= 0 ? "+" : "−") + String(Math.abs(Math.round(n))).padStart(3, "0");
        eye.rdGaze.textContent = `GAZE ${f(g.x)} / ${f(g.y)}`;
        eye.rdPupil.textContent = `PUPIL ${pupilR.toFixed(1)}`;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    /* ----- exit: dive into the pupil → particles form the RETL logo → flash → reveal ----- */
    const enter = (fast = false) => {
      if (entered) return;
      entered = true;
      tracking = false;
      ctaEl.classList.remove("show");
      enterBtn.disabled = true;
      root.classList.add("exiting");
      root.classList.remove("burst", "is-booting");
      glitchEye(200);
      g.tx = 0; g.ty = 0;
      pupilTarget = 70;              // dilate while we fall in
      eye.rdLock.textContent = "LOCK ● ENGAGED";
      // keep timers alive (dead stays false) but stop beat progression
      timers.forEach(clearTimeout); timers.clear();
      const T = (fn, ms) => setTimeout(fn, ms);

      let flashAt = 780;
      if (!fast && logo.ready()) {
        const r = eyeHost.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        T(() => { logo.start(cx, cy); }, 600);
        flashAt = 600 + logo.solidEnd + 160;
      }
      T(() => { root.querySelector(".boot-flash").classList.add("go"); }, flashAt);
      T(() => { try { onEnter?.(); } catch (e) { console.error(e); } }, flashAt + 120);   // hero starts animating under the veil
      T(() => { root.classList.add("is-gone"); }, flashAt + 270);
      T(() => {
        dead = true; cancelAnimationFrame(raf);
        logo.stop();
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("keydown", onKey);
        try { xhairRoot?.unmount(); } catch {}
        root.remove();
        resolve();
      }, flashAt + 1270);
    };

    const onKey = e => {
      if (e.key === "Escape") { e.preventDefault(); dead = true; timers.forEach(clearTimeout); enter(true); return; }
      if ((e.key === "Enter" || e.key === " ") && ctaShown && !enterBtn.disabled) { e.preventDefault(); enter(); }
    };
    window.addEventListener("keydown", onKey);
    enterBtn.addEventListener("click", () => enter(false));
    skipBtn.addEventListener("click", () => { dead = true; timers.forEach(clearTimeout); enter(true); });
  });
}
