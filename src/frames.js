/* RETL · photo deck — drag, flick, click or use the arrows to cycle the photos */
import "./frames.css";

const deck = document.querySelector(".frames-deck");
if (deck) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer:fine)").matches;
  const cards = [...deck.querySelectorAll(".frame")];
  const nowEl = document.getElementById("frames-now");
  let order = cards.slice();          // order[0] is the front card
  let busy = false;

  const paint = () => {
    order.forEach((c, i) => c.setAttribute("data-pos", String(i)));
    if (nowEl) nowEl.textContent = String(cards.indexOf(order[0]) + 1).padStart(2, "0");
  };
  const sweep = c => { if (reduce) return; c.classList.remove("enter"); void c.offsetWidth; c.classList.add("enter"); };

  const go = (dir, fromX = 0) => {
    if (busy || order.length < 2) return;
    busy = true;
    if (dir > 0) {
      const top = order[0], side = fromX < 0 ? -1 : 1;
      top.classList.remove("dragging");
      if (reduce) { order.push(order.shift()); paint(); busy = false; return; }
      top.classList.add("throw");
      top.style.setProperty("--dx", `${side * 130}%`);
      top.style.setProperty("--rot", `${side * 18}deg`);
      setTimeout(() => {
        top.classList.remove("throw");
        top.style.removeProperty("--dx"); top.style.removeProperty("--rot");
        order.push(order.shift()); paint(); sweep(order[0]);
        busy = false;
      }, 520);
    } else {
      order.unshift(order.pop()); paint(); sweep(order[0]); setTimeout(() => { busy = false; }, 300);
    }
  };

  deck.closest(".frames").querySelectorAll(".frames-btn").forEach(b => b.addEventListener("click", () => go(Number(b.dataset.dir))));

  // drag / flick / click on the front card
  let drag = null;
  deck.addEventListener("pointerdown", e => {
    const card = e.target.closest(".frame");
    if (!card || card !== order[0] || busy) return;
    drag = { card, x: e.clientX, y: e.clientY, moved: false, t: performance.now() };
    card.classList.add("dragging");
    card.setPointerCapture?.(e.pointerId);
  });
  deck.addEventListener("pointermove", e => {
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
      drag.card.style.setProperty("--dx", `${dx}px`);
      drag.card.style.setProperty("--dy", `${dy * .35}px`);
      drag.card.style.setProperty("--rot", `${dx / 18}deg`);
      return;
    }
    // hover tilt + glare (desktop)
    const top = order[0];
    if (!fine || reduce || !top) return;
    const t = top.querySelector(".frame-tilt"), r = top.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    if (px < 0 || px > 1 || py < 0 || py > 1) return;
    t.style.setProperty("--ry", `${((px - .5) * 10).toFixed(2)}deg`);
    t.style.setProperty("--rx", `${((.5 - py) * 8).toFixed(2)}deg`);
    t.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    t.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
  });
  const end = e => {
    if (!drag) return;
    const { card, moved, x, t } = drag; drag = null;
    const dx = e.clientX - x, fast = Math.abs(dx) / Math.max(1, performance.now() - t) > .6;
    card.classList.remove("dragging");
    if (!moved || Math.abs(dx) > 90 || (fast && Math.abs(dx) > 30)) {
      // keep the drag offset as the start of the throw so it flies out from where it was released
      go(1, moved ? dx : 1);
    } else {
      card.style.removeProperty("--dx"); card.style.removeProperty("--dy"); card.style.removeProperty("--rot");
    }
  };
  deck.addEventListener("pointerup", end);
  deck.addEventListener("pointercancel", end);
  deck.addEventListener("pointerleave", () => {
    const t = order[0]?.querySelector(".frame-tilt");
    if (t) { t.style.removeProperty("--rx"); t.style.removeProperty("--ry"); }
  });

  // keyboard: arrows while the deck area has focus within the section
  deck.closest(".frames").addEventListener("keydown", e => {
    if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1);
  });

  paint();
  // scan sweep the first time the deck scrolls into view
  new IntersectionObserver((en, ob) => { if (en[0].isIntersecting) { sweep(order[0]); ob.disconnect(); } }, { threshold: .5 }).observe(deck);
}
