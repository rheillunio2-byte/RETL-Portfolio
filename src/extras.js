/* =====================================================================
   RETL · v2.6 EXTRAS
   · Command palette  (Ctrl/⌘ + K, or "/")  — jump anywhere, open any repo
   · Hero spotlight   — the grid lights up under your cursor
   · Live Cagayan de Oro clock in the hero
   · Scroll-reactive marquee (speed, direction and skew follow the scroll)
   · Konami code → debug-mode rain
   · "Come back" tab title
   ===================================================================== */
import "./extras.css";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer:fine)").matches;
const isMac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
const typing = t => !!t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
const isReady = () => document.body.classList.contains("is-ready");

/* ---------------------------------------------------------------- */
/* Toast                                                            */
/* ---------------------------------------------------------------- */
const toastEl = document.createElement("div");
toastEl.className = "retl-toast";
toastEl.setAttribute("role", "status");
toastEl.setAttribute("aria-live", "polite");
document.body.appendChild(toastEl);
let toastTimer = 0;
const toast = msg => {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
};

/* ---------------------------------------------------------------- */
/* Command palette                                                  */
/* ---------------------------------------------------------------- */
const EMAIL = "rheillunio2@gmail.com";

function gatherItems() {
  const items = [];
  const sectionIcons = { home: "⌂", about: "◈", projects: "▦", stack: "◎", journey: "↗", achievements: "★", research: "∑", contact: "✉" };
  const sectionNames = { home: "Home", about: "About", projects: "Selected work", stack: "Toolkit", journey: "Journey", achievements: "Achievements", research: "Research", contact: "Contact" };
  $$("main section[id]").forEach(sec => {
    if (!sectionNames[sec.id]) return;
    items.push({ group: "NAVIGATE", icon: sectionIcons[sec.id] || "•", label: sectionNames[sec.id], hint: "SECTION", keys: sec.id, run: () => sec.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }) });
  });
  $$(".project-card").forEach(card => {
    const name = $("h3", card)?.textContent.trim(), link = $(".project-link", card)?.href, type = $(".project-type", card)?.textContent.trim();
    if (name && link) items.push({ group: "PROJECTS", icon: "▸", label: name, hint: type ? type.split("·")[0].trim() : "REPO", keys: `${name} ${type} project repo`, run: () => window.open(link, "_blank", "noopener") });
  });
  $$(".extra-card").forEach(a => {
    const name = $("strong", a)?.textContent.trim();
    if (name) items.push({ group: "PROJECTS", icon: "▸", label: name, hint: "GITHUB", keys: `${name} github repo`, run: () => window.open(a.href, "_blank", "noopener") });
  });
  $$(".social-links a").forEach(a => {
    const name = a.textContent.replace("↗", "").trim();
    items.push({ group: "ELSEWHERE", icon: "↗", label: name.charAt(0) + name.slice(1).toLowerCase(), hint: "OPENS IN NEW TAB", keys: `${name} social`, run: () => window.open(a.href, "_blank", "noopener") });
  });
  const pub = $(".research-card a.button");
  if (pub) items.push({ group: "ELSEWHERE", icon: "∑", label: "Read the research publication", hint: "RESEARCHGATE", keys: "paper publication blood pressure markov", run: () => window.open(pub.href, "_blank", "noopener") });
  items.push({
    group: "ACTIONS", icon: "⧉", label: "Copy email address", hint: EMAIL, keys: "copy email mail contact",
    run: async () => { try { await navigator.clipboard.writeText(EMAIL); toast("EMAIL COPIED"); } catch { window.location.href = `mailto:${EMAIL}`; } }
  });
  items.push({ group: "ACTIONS", icon: "★", label: "Star this portfolio on GitHub", hint: "GITHUB", keys: "star github repo source like support", run: () => window.open("https://github.com/rheillunio2-byte/RETL-Portfolio", "_blank", "noopener") });
  items.push({ group: "ACTIONS", icon: "↑", label: "Back to top", hint: "SCROLL", keys: "top start up", run: () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }) });
  items.push({ group: "ACTIONS", icon: "▓", label: "Run debug mode", hint: "EASTER EGG", keys: "debug matrix rain konami secret", run: () => setTimeout(debugRain, 250) });
  return items;
}

// Subsequence fuzzy score: lower is better, -1 = no match
function score(query, text) {
  const q = query.toLowerCase(), t = text.toLowerCase();
  const at = t.indexOf(q);
  if (at >= 0) return at === 0 ? 0 : 1 + at * .01;
  let qi = 0, gaps = 0, last = -1;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) { if (last >= 0) gaps += i - last - 1; last = i; qi++; }
  }
  return qi === q.length ? 10 + gaps * .1 : -1;
}

const palette = (() => {
  const root = document.createElement("div");
  root.className = "cmdk";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Command palette");
  root.innerHTML = `
    <div class="cmdk__panel">
      <div class="cmdk__bar"><span aria-hidden="true">›</span>
        <input type="text" placeholder="Jump to a section, open a project…" aria-label="Search commands" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="cmdk-list">
        <kbd>ESC</kbd></div>
      <ul class="cmdk__list" id="cmdk-list" role="listbox"></ul>
      <div class="cmdk__foot"><span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> select</span><span><kbd>esc</kbd> close</span></div>
    </div>`;
  document.body.appendChild(root);
  const input = $("input", root), list = $(".cmdk__list", root);
  let all = [], shown = [], active = 0, opener = null, open = false;

  const render = () => {
    list.innerHTML = "";
    if (!shown.length) { list.innerHTML = `<li class="cmdk__empty" role="presentation">NO MATCHES — TRY “PROJECTS” OR “EMAIL”</li>`; input.removeAttribute("aria-activedescendant"); return; }
    let group = "";
    shown.forEach((it, i) => {
      if (it.group !== group) {
        group = it.group;
        const g = document.createElement("li"); g.className = "cmdk__group"; g.setAttribute("role", "presentation"); g.textContent = group; list.appendChild(g);
      }
      const li = document.createElement("li");
      li.className = "cmdk__item"; li.id = `cmdk-opt-${i}`; li.setAttribute("role", "option"); li.setAttribute("aria-selected", String(i === active));
      const ic = document.createElement("i"); ic.textContent = it.icon; ic.setAttribute("aria-hidden", "true");
      const b = document.createElement("b"); b.textContent = it.label;
      const s = document.createElement("small"); s.textContent = it.hint;
      li.append(ic, b, s);
      li.addEventListener("pointermove", () => { if (active !== i) { active = i; paintActive(false); } });
      li.addEventListener("click", () => choose(i));
      list.appendChild(li);
    });
    input.setAttribute("aria-activedescendant", `cmdk-opt-${active}`);
  };
  const paintActive = scroll => {
    $$(".cmdk__item", list).forEach((el, i) => el.setAttribute("aria-selected", String(i === active)));
    const el = $(`#cmdk-opt-${active}`, list);
    input.setAttribute("aria-activedescendant", `cmdk-opt-${active}`);
    if (scroll && el) el.scrollIntoView({ block: "nearest" });
  };
  const filter = () => {
    const q = input.value.trim();
    if (!q) shown = all;
    else shown = all
      .map(it => ({ it, s: Math.min(...[score(q, it.label), score(q, it.keys || "")].map(v => (v < 0 ? 1e9 : v))) }))
      .filter(x => x.s < 1e9).sort((a, b) => a.s - b.s).map(x => x.it);
    active = 0;
    render();
  };
  const choose = i => { const it = shown[i]; if (!it) return; close(true); Promise.resolve().then(() => it.run()); };

  function show() {
    if (open || !isReady()) return;
    open = true; opener = document.activeElement;
    all = gatherItems(); input.value = ""; shown = all; active = 0; render();
    root.hidden = false; document.body.style.overflow = "hidden";
    requestAnimationFrame(() => { root.classList.add("is-open"); input.focus(); });
  }
  function close(skipFocus) {
    if (!open) return;
    open = false; root.classList.remove("is-open"); document.body.style.overflow = "";
    setTimeout(() => { if (!open) root.hidden = true; }, reduceMotion ? 0 : 240);
    if (!skipFocus) opener?.focus?.();
  }
  input.addEventListener("input", filter);
  root.addEventListener("pointerdown", e => { if (e.target === root) close(); });
  root.addEventListener("keydown", e => {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); if (shown.length) { active = (active + 1) % shown.length; paintActive(true); } }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (shown.length) { active = (active - 1 + shown.length) % shown.length; paintActive(true); } }
    else if (e.key === "Enter") { e.preventDefault(); choose(active); }
    else if (e.key === "Tab") { e.preventDefault(); input.focus(); }
  });
  return { show, close, toggle: () => (open ? close() : show()), get isOpen() { return open; } };
})();

// Topbar trigger
const topRight = $(".top-right");
if (topRight) {
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "cmdk-btn"; btn.setAttribute("aria-label", "Open command palette");
  btn.innerHTML = `<span>JUMP TO</span><kbd>${isMac ? "⌘" : "Ctrl"} K</kbd>`;
  btn.addEventListener("click", () => palette.show());
  topRight.insertBefore(btn, topRight.firstChild);
}

window.addEventListener("keydown", e => {
  if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); palette.toggle(); return; }
  if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !typing(e.target) && !palette.isOpen) { e.preventDefault(); palette.show(); }
});

/* ---------------------------------------------------------------- */
/* Hero: spotlight grid + live clock                                */
/* ---------------------------------------------------------------- */
const hero = $(".hero"), heroGrid = $(".hero-grid");
if (hero && heroGrid && finePointer && !reduceMotion) {
  const spot = document.createElement("div");
  spot.className = "hero-spot"; spot.setAttribute("aria-hidden", "true");
  const size = getComputedStyle(heroGrid).backgroundSize;
  if (size && size !== "auto") spot.style.backgroundSize = size;
  heroGrid.after(spot);
  let sx = 0, sy = 0, tick = false;
  hero.addEventListener("pointermove", e => {
    sx = e.clientX; sy = e.clientY; hero.classList.add("is-spot");
    if (tick) return; tick = true;
    requestAnimationFrame(() => {
      tick = false; const r = hero.getBoundingClientRect();
      spot.style.setProperty("--sx", `${sx - r.left}px`); spot.style.setProperty("--sy", `${sy - r.top}px`);
    });
  }, { passive: true });
  hero.addEventListener("pointerleave", () => hero.classList.remove("is-spot"));
}

const heroMeta = $(".hero-meta");
if (heroMeta) {
  const cell = document.createElement("div");
  cell.innerHTML = `<span class="meta-label">LOCAL TIME</span><span class="meta-value meta-live" id="hero-clock">—</span>`;
  heroMeta.appendChild(cell);
  const clock = $("#hero-clock", cell);
  let fmt;
  try { fmt = new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }); } catch { fmt = null; }
  const upd = () => { clock.textContent = fmt ? `${fmt.format(new Date())} PHT` : "Cagayan de Oro"; };
  upd(); setInterval(upd, 15000);
}

/* ---------------------------------------------------------------- */
/* Marquee reacts to scroll velocity                                */
/* ---------------------------------------------------------------- */
const marquee = $(".marquee"), track = $(".marquee-track");
if (marquee && track && !reduceMotion) {
  let lastY = scrollY, vel = 0, skew = 0, dir = 1, running = false, anim = null;
  const loop = () => {
    const y = scrollY, dy = y - lastY; lastY = y;
    vel += (dy - vel) * .14;
    skew += (clamp(-vel * .3, -9, 9) - skew) * .16;
    marquee.style.transform = Math.abs(skew) < .02 ? "" : `skewX(${skew.toFixed(2)}deg)`;
    if (!anim) {
      anim = track.getAnimations?.()[0] || null;
      if (anim) anim.currentTime = 38000 * 200;      // headroom so reverse playback never runs out
    }
    if (anim) {
      if (Math.abs(vel) > 2) dir = vel > 0 ? 1 : -1;
      anim.playbackRate = dir * (1 + Math.min(Math.abs(vel), 70) * .22);
    }
    if (Math.abs(vel) > .05 || Math.abs(skew) > .02 || Math.abs((anim?.playbackRate ?? 1) - dir) > .02) requestAnimationFrame(loop);
    else { running = false; marquee.style.transform = ""; if (anim) anim.playbackRate = dir; }
  };
  window.addEventListener("scroll", () => { if (!running) { running = true; lastY = scrollY - 0; requestAnimationFrame(loop); } }, { passive: true });
}

/* ---------------------------------------------------------------- */
/* Konami → debug rain                                              */
/* ---------------------------------------------------------------- */
function debugRain() {
  toast("DEBUG MODE UNLOCKED · 0 BUGS FOUND");
  if (reduceMotion || $(".debug-rain")) return;
  const cv = document.createElement("canvas");
  cv.className = "debug-rain"; cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const FS = 16, cols = Math.ceil(innerWidth / FS);
  const drops = Array.from({ length: cols }, () => Math.random() * -40);
  const chars = "01<>/{}[]RETL#$%=+;".split("");
  const end = performance.now() + 4600;
  let last = 0;
  const step = now => {
    if (now > end) { cv.style.opacity = "0"; setTimeout(() => cv.remove(), 950); return; }
    if (now - last > 48) {
      last = now;
      ctx.fillStyle = "rgba(8,7,12,.14)"; ctx.fillRect(0, 0, innerWidth, innerHeight);
      ctx.font = `${FS}px "DM Mono", monospace`;
      drops.forEach((y, i) => {
        const ch = chars[(Math.random() * chars.length) | 0];
        ctx.fillStyle = Math.random() > .96 ? "#ffffff" : Math.random() > .5 ? "#a875ff" : "#7541c7";
        ctx.fillText(ch, i * FS, y * FS);
        drops[i] = y * FS > innerHeight && Math.random() > .96 ? 0 : y + 1;
      });
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let kIdx = 0;
window.addEventListener("keydown", e => {
  if (typing(e.target) || palette.isOpen) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  kIdx = k === KONAMI[kIdx] ? kIdx + 1 : (k === KONAMI[0] ? 1 : 0);
  if (kIdx === KONAMI.length) { kIdx = 0; debugRain(); }
});

/* ---------------------------------------------------------------- */
/* Tab title when the visitor wanders off                           */
/* ---------------------------------------------------------------- */
const baseTitle = document.title;
document.addEventListener("visibilitychange", () => {
  document.title = document.hidden ? "👀 Come back — RETL" : baseTitle;
});
