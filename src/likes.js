// Tiny like store shared by every heart on the page (same id = same state).
// Default: remembered in this browser only. To get GLOBAL counts, set VITE_LIKES_ENDPOINT
// to a URL that supports:  GET  ?id=<id>            -> { "count": 12 }
//                          POST {id, delta: 1|-1}    -> { "count": 13 }
const KEY = "retl-likes-v1";
const ENDPOINT = import.meta.env?.VITE_LIKES_ENDPOINT;

const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const mine = read();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mine)); } catch { /* private mode */ } };

const states = new Map();
const listeners = new Set();
const emit = () => listeners.forEach(fn => fn());

const ensure = id => {
  if (!states.has(id)) {
    const liked = !!mine[id];
    states.set(id, { liked, count: liked ? 1 : 0 });
    if (ENDPOINT) {
      fetch(`${ENDPOINT}?id=${encodeURIComponent(id)}`)
        .then(r => (r.ok ? r.json() : null))
        .then(data => { if (data && Number.isFinite(data.count)) { states.set(id, { ...states.get(id), count: data.count }); emit(); } })
        .catch(() => {});
    }
  }
  return states.get(id);
};

export const likes = {
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  get: ensure,
  toggle(id, liked) {
    const cur = ensure(id);
    if (cur.liked === liked) return;
    states.set(id, { liked, count: Math.max(0, cur.count + (liked ? 1 : -1)) });
    if (liked) mine[id] = true; else delete mine[id];
    save(); emit();
    if (ENDPOINT) {
      fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, delta: liked ? 1 : -1 }) }).catch(() => {});
    }
  }
};
