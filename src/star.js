/* RETL · "Star the repo" CTA — live star count + a little burst of stars on click */
import "./star.css";

const REPO = "rheillunio2-byte/RETL-Portfolio";
const btn = document.getElementById("star-btn");
const countEl = document.getElementById("star-count");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (btn && countEl) {
  /* live count (cached for 10 min; silently hidden if the repo is private / not yet public / rate-limited) */
  const KEY = "retl-star-count";
  const show = n => {
    countEl.hidden = false;
    if (reduce) { countEl.textContent = n.toLocaleString(); return; }
    const t0 = performance.now(), dur = 900;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      countEl.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const load = async () => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (cached && Date.now() - cached.t < 600000) return show(cached.n);
    } catch { /* storage unavailable */ }
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}`, { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) return;
      const n = Number((await res.json()).stargazers_count);
      if (!Number.isFinite(n)) return;
      try { sessionStorage.setItem(KEY, JSON.stringify({ n, t: Date.now() })); } catch { /* ignore */ }
      show(n);
    } catch { /* offline — the button still works */ }
  };
  new IntersectionObserver((en, ob) => { if (en[0].isIntersecting) { ob.disconnect(); load(); } }, { rootMargin: "300px" }).observe(btn);

  /* burst of stars from the button; the link itself opens GitHub in a new tab as normal */
  btn.addEventListener("click", () => {
    if (reduce) return;
    const r = btn.getBoundingClientRect(), ox = r.left + r.width * .2, oy = r.top + r.height / 2;
    for (let i = 0; i < 16; i++) {
      const el = document.createElement("span");
      el.className = "star-bit"; el.textContent = Math.random() > .35 ? "★" : "✦";
      el.style.setProperty("--s", `${10 + Math.random() * 14}px`);
      document.body.appendChild(el);
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.4, d = 70 + Math.random() * 130;
      const dx = Math.cos(a) * d, dy = Math.sin(a) * d - 20, rot = (Math.random() - .5) * 540;
      const anim = el.animate([
        { transform: `translate(${ox}px,${oy}px) scale(.4) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${ox + dx}px,${oy + dy}px) scale(1.1) rotate(${rot}deg)`, opacity: 1, offset: .6 },
        { transform: `translate(${ox + dx * 1.15}px,${oy + dy + 70}px) scale(.6) rotate(${rot * 1.3}deg)`, opacity: 0 }
      ], { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards" });
      anim.onfinish = () => el.remove();
    }
  });
}
