import { playIntro } from "./intro.js";
import "./extras.js";
import "./frames.js";
import "./star.js";
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
$("#year").textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Reveal on scroll — staggered per section, started once the intro is done
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12, rootMargin: "0px 0px -6% 0px" });
$$("main > section, main > div").forEach(block => {
  $$(".reveal", block).forEach((el, i) => el.style.setProperty("--rd", `${Math.min(i, 4) * 90}ms`));
  if (block.classList.contains("reveal")) block.style.setProperty("--rd", "0ms");
});
const startReveals = () => $$(".reveal").forEach(el => revealObserver.observe(el));

// Cinematic intro (src/intro.js) — robot eye wakes up, welcomes the visitor, then the page flows in.
// ready() fires when the visitor hits "Enter" (or skips), so the hero animates in as the intro lifts.
let started = false;
const ready = () => {
  if (started) return;
  started = true;
  document.body.classList.remove("is-loading");
  document.body.classList.add("is-ready");
  startReveals();
};
if (!location.hash) { try { history.scrollRestoration = "manual"; } catch {} window.scrollTo(0, 0); }
playIntro({ onEnter: ready }).catch(err => { console.error("[intro]", err); document.getElementById("boot")?.remove(); ready(); });
setTimeout(() => { if (!started && !document.getElementById("boot")) ready(); }, 1500); // safety: intro element missing/removed

// Section tracking — feeds the React Dock (see islands.jsx)
const sections = $$("main section[id]");
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) window.dispatchEvent(new CustomEvent("retl:section", { detail: entry.target.id }));
  });
}, { rootMargin: "-35% 0px -55% 0px" });
sections.forEach(section => sectionObserver.observe(section));

// Project filters with animated reflow
$$(".filter").forEach(button => button.addEventListener("click", () => {
  $$(".filter").forEach(b => { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
  button.classList.add("active");
  button.setAttribute("aria-selected", "true");
  const filter = button.dataset.filter;
  $$(".project-card").forEach((card, i) => {
    const show = filter === "all" || card.dataset.category === filter;
    if (show) {
      card.classList.remove("filtered-out");
      card.style.animation = "none";
      card.offsetHeight;
      card.style.animation = `cardIn .45s ${i * .045}s both`;
    } else card.classList.add("filtered-out");
  });
}));

// Pointer effects (desktop only) — eased follow + event delegation
const glow = $(".cursor-glow"), dot = $(".cursor-dot");
if (window.matchMedia("(pointer:fine)").matches && !reduceMotion) {
  const mouse = { x: -500, y: -500 }, g = { x: -500, y: -500 }, d = { x: -500, y: -500 };
  window.addEventListener("pointermove", e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  const follow = () => {
    g.x += (mouse.x - g.x) * .12; g.y += (mouse.y - g.y) * .12;
    d.x += (mouse.x - d.x) * .42; d.y += (mouse.y - d.y) * .42;
    glow.style.transform = `translate(${g.x}px,${g.y}px) translate(-50%,-50%)`;
    dot.style.transform = `translate(${d.x}px,${d.y}px) translate(-50%,-50%)`;
    requestAnimationFrame(follow);
  };
  glow.style.left = glow.style.top = dot.style.left = dot.style.top = "0px";
  follow();
  const interactive = "a,button,[role=button],.holo-card,.tech-text";
  document.addEventListener("pointerover", e => document.body.classList.toggle("cursor-hover", !!e.target.closest?.(interactive)), { passive: true });

  // Magnetic pull on primary controls
  $$(".button,.project-link,.contact-email").forEach(el => {
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      el.style.translate = `${(e.clientX - r.left - r.width / 2) * .14}px ${(e.clientY - r.top - r.height / 2) * .22}px`;
    });
    el.addEventListener("pointerleave", () => { el.style.translate = ""; });
  });
}

// Scroll flow — progress bar + hero parallax (single rAF-throttled handler)
const progressBar = $(".scroll-progress i"), heroEl = $(".hero");
let scrollTick = false;
const onScrollFlow = () => {
  if (scrollTick) return;
  scrollTick = true;
  requestAnimationFrame(() => {
    scrollTick = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    progressBar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    if (heroEl) heroEl.style.setProperty("--hp", Math.min(1, scrollY / Math.max(1, heroEl.offsetHeight)).toFixed(3));
  });
};
window.addEventListener("scroll", onScrollFlow, { passive: true });
onScrollFlow();

// Ambient particle field
const canvas = $("#ambient"), ctx = canvas.getContext("2d");
let w, h, particles = [], raf;
const pm = { x: -999, y: -999 };   // pointer position — particles shy away from it and web up around it
window.addEventListener("pointermove", e => { pm.x = e.clientX; pm.y = e.clientY; }, { passive: true });
document.addEventListener("pointerleave", () => { pm.x = pm.y = -999; });
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  w = canvas.width = innerWidth * dpr; h = canvas.height = innerHeight * dpr;
  canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  particles = Array.from({length: Math.min(70, Math.floor(innerWidth / 19))}, () => ({
    x: Math.random()*innerWidth, y: Math.random()*innerHeight,
    vx: (Math.random()-.5)*.18, vy: (Math.random()-.5)*.18,
    r: Math.random()*1.3+.3, a: Math.random()*.32+.08
  }));
}
function draw() {
  ctx.clearRect(0,0,innerWidth,innerHeight);
  particles.forEach((p,i) => {
    p.x += p.vx; p.y += p.vy;
    if(p.x<0||p.x>innerWidth) p.vx *= -1;
    if(p.y<0||p.y>innerHeight) p.vy *= -1;
    const mdx = p.x - pm.x, mdy = p.y - pm.y, md = Math.hypot(mdx, mdy);
    if (md < 150 && md > 0.1) {
      const f = (1 - md / 150) * .55;
      p.x += mdx / md * f; p.y += mdy / md * f;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(pm.x, pm.y);
      ctx.strokeStyle = `rgba(197,162,255,${.2 * (1 - md / 150)})`; ctx.lineWidth = .7; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle = `rgba(180,139,255,${p.a})`; ctx.fill();
    for(let j=i+1;j<particles.length;j++){
      const q=particles[j], dx=p.x-q.x, dy=p.y-q.y, dist=Math.hypot(dx,dy);
      if(dist<115){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=`rgba(151,104,224,${.075*(1-dist/115)})`;ctx.lineWidth=.6;ctx.stroke();}
    }
  });
  raf = requestAnimationFrame(draw);
}
resize(); draw();
window.addEventListener("resize", () => { cancelAnimationFrame(raf); resize(); draw(); });

// Subtle card tilt
if (window.matchMedia("(pointer:fine)").matches) {
  $$(".project-card").forEach(card => {
    card.addEventListener("pointermove", e => {
      const r=card.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      card.style.setProperty('--mx',`${e.clientX-r.left}px`);card.style.setProperty('--my',`${e.clientY-r.top}px`);card.style.transform=`perspective(900px) rotateX(${-y*2.5}deg) rotateY(${x*2.5}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave",()=>card.style.transform="");
  });
}

// Back to top
const backTop = $(".back-top");
window.addEventListener("scroll",()=>backTop.classList.toggle("show",window.scrollY>650),{passive:true});
backTop.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));

// Fetch public repositories live; curated work remains visible if the API is unavailable.
const known = new Set(["Prompt-Pilot","SmartFileOrganizerPro","Commit-Quest","DayForm","CodeGuard-AI","SafeRoutePH","Logic-Lab","APIHub","Calcora","Bug-Hunter-Simulator-GLITCHWILD"]);
const extra = $("#extra-repos"), status = $("#github-status");
const escapeHTML = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
fetch("https://api.github.com/users/rheillunio2-byte/repos?per_page=100&sort=updated")
  .then(r=>{if(!r.ok)throw new Error("GitHub API unavailable");return r.json();})
  .then(repos=>{
    const publicRepos=repos.filter(r=>!r.fork);
    $("#repo-count").innerHTML=`${publicRepos.length}<span>+</span>`;
    const items=publicRepos.filter(r=>!known.has(r.name)).slice(0,6);
    status.textContent=`${publicRepos.length} public repositories found · synced from GitHub`;
    if(!items.length)return;
    extra.innerHTML=`<div class="extra-heading"><span>MORE FROM THE REPOSITORY</span><span>LIVE SYNC ↗</span></div><div class="extra-grid">${items.map(r=>`
      <a class="extra-card" href="${escapeHTML(r.html_url)}" target="_blank" rel="noreferrer">
        <span class="extra-language">${escapeHTML(r.language || "PROJECT")}</span>
        <strong>${escapeHTML(r.name.replaceAll("-"," "))}</strong>
        <p>${escapeHTML(r.description || "An experiment, tool, or project in the RETL workspace.")}</p>
        <span class="extra-meta">★ ${r.stargazers_count} <span>↗</span></span>
      </a>`).join("")}</div>`;
  })
  .catch(()=>{status.textContent="Showing selected projects · visit GitHub for the complete and latest repository list.";});


// ---------- v2.1 motion layer ----------
// Typed role line
const roleEl = $("#role-text");
if (roleEl) {
  const words = ["AI-assisted workflows", "web applications", "data & research", "clean interfaces", "cybersecurity"];
  if (reduceMotion) roleEl.textContent = words[0];
  else {
    let w = 0, c = 0, dir = 1, wait = 0;
    setInterval(() => {
      if (wait > 0) { wait--; return; }
      c += dir;
      roleEl.textContent = words[w].slice(0, c);
      if (dir === 1 && c === words[w].length) { dir = -1; wait = 22; }
      else if (dir === -1 && c === 0) { dir = 1; w = (w + 1) % words.length; wait = 5; }
    }, 70);
  }
}

// Section label "decode" + number count-up, triggered on first view
const glyphs = "01<>/{}_#$%&";
const decode = el => {
  const text = el.textContent; let frame = 0;
  const timer = setInterval(() => {
    frame++;
    el.textContent = [...text].map((ch, i) => ch === " " || ch === "—" || i < frame / 2 ? ch : glyphs[(Math.random() * glyphs.length) | 0]).join("");
    if (frame / 2 >= text.length) { el.textContent = text; clearInterval(timer); }
  }, 32);
};
const countUp = el => {
  const target = Number(el.dataset.count); const start = performance.now(), dur = 1400;
  const step = now => {
    const t = Math.min(1, (now - start) / dur), v = Math.round(target * (1 - Math.pow(1 - t, 3)));
    const node = el.firstChild; if (node && node.nodeType === 3) node.nodeValue = String(v);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
const motionObserver = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  motionObserver.unobserve(e.target);
  if (reduceMotion) return;
  if (e.target.classList.contains("section-number")) decode(e.target);
  if (e.target.dataset.count) countUp(e.target);
}), { threshold: .6 });
$$(".section-number,[data-count]").forEach(el => motionObserver.observe(el));

// Tech chips stagger index
$$(".tech-list").forEach(list => $$("span", list).forEach((el, i) => el.style.setProperty("--n", i)));

// Project cards enter in a wave when the grid scrolls into view
const gridObserver = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  gridObserver.disconnect();
  $$(".project-card").forEach((card, i) => { card.style.setProperty("--cd", `${i * 70}ms`); card.style.opacity = ""; card.classList.add("in-view"); });
}), { threshold: .08 });
const grid = $("#project-grid"); if (grid) { $$(".project-card").forEach(c => c.style.opacity = reduceMotion ? 1 : 0); gridObserver.observe(grid); }

// Timeline: line draws with scroll, dots light up as it passes
const timeline = $("#timeline");
if (timeline) {
  const items = $$(".tl-item", timeline);
  const updateTimeline = () => {
    const r = timeline.getBoundingClientRect(), mid = innerHeight * .62;
    timeline.style.setProperty("--tp", Math.min(1, Math.max(0, (mid - r.top) / r.height)).toFixed(3));
    items.forEach(it => it.classList.toggle("passed", it.getBoundingClientRect().top < mid));
  };
  window.addEventListener("scroll", updateTimeline, { passive: true });
  window.addEventListener("resize", updateTimeline);
  updateTimeline();
}

// ---------- v2.2: certificates lightbox + functional contact form ----------
const lightbox = $("#lightbox");
if (lightbox) {
  const lbImg = $("img", lightbox), lbCap = $("figcaption", lightbox);
  let opener = null;
  const closeLb = () => { lightbox.classList.remove("is-open"); setTimeout(() => { lightbox.hidden = true; lbImg.removeAttribute("src"); }, 260); opener?.focus(); document.body.style.overflow = ""; };
  const openLb = (src, title, from) => {
    opener = from; lbImg.src = src; lbImg.alt = title; lbCap.textContent = title;
    lightbox.hidden = false; requestAnimationFrame(() => lightbox.classList.add("is-open")); document.body.style.overflow = "hidden"; $(".lb-close", lightbox).focus();
  };
  $$("[data-cert]").forEach(btn => btn.addEventListener("click", () => openLb(btn.dataset.cert, btn.dataset.title, btn)));
  lightbox.addEventListener("click", e => { if (e.target === lightbox || e.target.closest(".lb-close")) closeLb(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !lightbox.hidden) closeLb(); });
}

const contactForm = $("#contact-form");
if (contactForm) {
  const EMAIL = "rheillunio2@gmail.com";
  const ENDPOINT = `https://formsubmit.co/ajax/${EMAIL}`;   // delivers to the inbox above (see README)
  const status = $("#cf-status"), counter = $("#cf-count"), sendBtn = $(".cf-send", contactForm), box = contactForm.elements.message;
  const COOLDOWN = 45000, KEY = "retl-contact-last";
  const say = (text, kind = "") => { status.replaceChildren(text instanceof Node ? text : document.createTextNode(text)); status.dataset.kind = kind; };
  const mark = (field, bad) => field.closest(".cf-field").classList.toggle("invalid", bad);
  box.addEventListener("input", () => { counter.textContent = `${box.value.length} / 1000`; mark(box, false); });
  ["name", "email"].forEach(n => contactForm.elements[n].addEventListener("input", e => mark(e.target, false)));

  contactForm.addEventListener("submit", async event => {
    event.preventDefault();
    const f = contactForm.elements;
    if (f._honey.value) return;                       // honeypot: bots fill this
    const name = f.name.value.trim(), email = f.email.value.trim(), topic = f.topic.value, message = f.message.value.trim();
    const okName = name.length >= 2, okMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email), okMsg = message.length >= 10;
    mark(f.name, !okName); mark(f.email, !okMail); mark(box, !okMsg);
    if (!(okName && okMail && okMsg)) { say("Please fill in your name, a valid email and a message (10+ characters).", "error"); return; }
    const wait = COOLDOWN - (Date.now() - Number(localStorage.getItem(KEY) || 0));
    if (wait > 0) { say(`Message already sent. You can send another in ${Math.ceil(wait / 1000)}s.`, "error"); return; }

    sendBtn.disabled = true; contactForm.classList.add("is-sending"); say("Sending…", "pending");
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, topic, message, _subject: `Portfolio · ${topic} from ${name}`, _template: "table", _captcha: "false" })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) === "false") throw new Error(data.message || "Request failed");
      try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ignore */ }
      contactForm.reset(); counter.textContent = "0 / 1000";
      contactForm.classList.add("is-sent");
      say("Message sent. Thank you — I'll get back to you soon.", "success");
      setTimeout(() => contactForm.classList.remove("is-sent"), 6000);
    } catch {
      const link = document.createElement("a");
      link.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Portfolio · ${topic} from ${name}`)}&body=${encodeURIComponent(`${message}\n\n— ${name} (${email})`)}`;
      link.textContent = "open your email app instead →";
      const wrap = document.createElement("span");
      wrap.append("Couldn't send automatically — ", link);
      say(wrap, "error");
    } finally {
      sendBtn.disabled = false; contactForm.classList.remove("is-sending");
    }
  });
}
