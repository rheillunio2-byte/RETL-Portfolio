// React "islands" — each React Bits component is mounted into a placeholder in index.html.
// Heavy WebGL / canvas islands are code-split and only start once they approach the viewport.
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import ScrollExpand from "./components/ScrollExpand";
import PulseHeart from "./components/PulseHeart";
import Dock from "./components/Dock";
import Folder from "./components/Folder";
import LogoLoop from "./components/LogoLoop";
import { SiPython, SiJavascript, SiTypescript, SiHtml5, SiCss, SiReact, SiVite, SiGit, SiGithub } from "react-icons/si";
import { VscVscode } from "react-icons/vsc";
import { likes } from "./likes";

const compact = window.matchMedia("(max-width: 650px)").matches;
const REPOS = "https://github.com/rheillunio2-byte";

const lazyMount = (id, loader, render, rootMargin = "320px") => {
  const el = document.getElementById(id);
  if (!el) return;
  const io = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    const mod = await loader();
    createRoot(el).render(render(mod.default));
  }, { rootMargin });
  io.observe(el);
};

/* 1 · Hero — ElectricLogo traces the RETL emblem with live lightning */
lazyMount("island-electric", () => import("./components/ElectricLogo"), (ElectricLogo) => (
  <ElectricLogo
    src="/brand/retl-emblem-mask.png"
    color="#f1dcff"
    glowColor="#a875ff"
    scale={0.7}
    strands={4}
    bend={0.55}
    crackle={1.4}
    arcs={1}
    flicker={0.55}
    glow={0.95}
    speed={2.2}
    cursorRadius={120}
    interactive
  />
), "0px");

/* 2 · Manifesto — ScrollExpand opens a framed banner into a full-bleed stage */
const expand = document.getElementById("island-expand");
if (expand) {
  createRoot(expand).render(
    <ScrollExpand
      src="/art/expand-banner.jpg"
      alt="RETL emblem on a violet grid"
      scrollHint="SCROLL TO OPEN"
      startWidth={compact ? 64 : 42}
      startHeight={compact ? 46 : 58}
      mediaZoom={1.08}
      scrollDistance={1.1}
      holdDistance={0.3}
      overlayScrim={0.6}
      useWindowScroll
    >
      <div className="manifesto-copy">
        <span className="manifesto-kicker">— MANIFESTO</span>
        <h2>From curiosity to <span className="gradient-text">shipped software.</span></h2>
        <p>Python tools, web apps, AI workflows and research. Everything starts with a question worth answering, then gets built with intent.</p>
        <a className="button button-primary" href="#about">Meet RETL <span>↓</span></a>
      </div>
    </ScrollExpand>
  );
}

/* 3 · About — HoloCard developer card (click to flip) */
lazyMount("island-holo", () => import("./components/HoloCard"), (HoloCard) => (
  <HoloCard
    image="/art/holo-front.png"
    backImage="/art/holo-back.png"
    alt="RETL developer card — click to flip"
    preset="swirl"
    foilColor="#cdbbff"
    intensity={0.55}
    glare={0.45}
    edgeSparkle={0.6}
    frame={4.5}
    radius={16}
    width={compact ? 250 : 300}
  />
));

/* 4 · Reel — DriftWall of project tiles, each links to its repository */
const tiles = [
  ["promptpilot", "PromptPilot", "Prompt-Pilot"],
  ["smartfileorganizerpro", "SmartFileOrganizerPro", "SmartFileOrganizerPro"],
  ["commitquest", "CommitQuest", "Commit-Quest"],
  ["dayform", "DayForm", "DayForm"],
  ["codeguard-ai", "CodeGuard AI", "CodeGuard-AI"],
  ["saferoute-ph", "SafeRoute PH", "SafeRoutePH"],
  ["logic-lab", "Logic Lab", "Logic-Lab"],
  ["apihub", "APIHub", "APIHub"],
  ["calcora", "Calcora", "Calcora"],
  ["bug-hunter", "Bug Hunter Simulator", "Bug-Hunter-Simulator-GLITCHWILD"]
].map(([slug, title, repo]) => ({ image: `/art/tile-${slug}.jpg`, title, href: `${REPOS}/${repo}` }));

lazyMount("island-wall", () => import("./components/DriftWall"), (DriftWall) => (
  <DriftWall
    items={tiles}
    columns={compact ? 3 : 5}
    tileWidth={compact ? 150 : 240}
    tileHeight={compact ? 100 : 160}
    gap={compact ? 12 : 18}
    radius={12}
    tilt={14}
    turn={-12}
    perspective={1200}
    depth={110}
    speed={compact ? 30 : 38}
    variance={0.4}
    parallax={0.6}
    lift={60}
    fade={0.55}
    dim={0.62}
    overlayColor="#08070c"
  />
));

/* 5 · Sign-off — TechText wordmark you can drag, kick and inspect */
lazyMount("island-tech", () => import("./components/TechText"), (TechText) => (
  <TechText
    text="RETL"
    fontFamily="Manrope, sans-serif"
    fontWeight={800}
    fontSize={300}
    letterSpacing={-0.04}
    color="#efe6ff"
    accentColor="#a875ff"
    reveal="letter"
    intro="assemble"
    introDuration={2.2}
    specks={18}
    clickKick
    draggable
    guides={false}
  />
), "120px");

/* 6 · Hearts — PulseHeart everywhere visitors might want to say "nice" */
function Heart({ id, label, size }) {
  const state = useSyncExternalStore(likes.subscribe, () => likes.get(id));
  return (
    <PulseHeart
      liked={state.liked}
      count={state.count}
      onChange={(liked) => likes.toggle(id, liked)}
      size={size}
      corner={size}
      icon="heart"
      likedColor="#ff4d8d"
      idleColor="#9a8fb0"
      pillColor="#17111f"
      textColor="#f4f0fa"
      label={label}
    />
  );
}
document.querySelectorAll(".heart-slot").forEach((slot) => {
  createRoot(slot).render(
    <Heart id={slot.dataset.likeId} label={slot.dataset.likeLabel || "Like"} size={Number(slot.dataset.likeSize) || 22} />
  );
});

/* 7 · Dock — navigation with magnification, scroll-spy and a contact menu */
const EMAIL = "rheillunio2@gmail.com";
const ico = (children) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const ICONS = {
  home: ico(<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>),
  about: ico(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>),
  projects: ico(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  stack: ico(<><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></>),
  journey: ico(<><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h5a3 3 0 000-6h-2a3 3 0 010-6h5" /></>),
  achievements: ico(<><circle cx="12" cy="9" r="5" /><path d="M9 13.5L7.5 21l4.5-2.5 4.5 2.5L15 13.5" /></>),
  research: ico(<><path d="M9 3h6M10 3v6l-5 9a2 2 0 001.8 3h10.4A2 2 0 0019 18l-5-9V3" /><path d="M7.5 15h9" /></>),
  contact: ico(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>)
};
const NAV = [
  ["home", "Home"], ["about", "About"], ["projects", "Projects"], ["stack", "Toolkit"],
  ["journey", "Journey"], ["achievements", "Achievements"], ["research", "Research"], ["contact", "Contact"]
];
const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

function SiteDock() {
  const [active, setActive] = useState("home");
  useEffect(() => {
    const on = (e) => setActive(e.detail);
    window.addEventListener("retl:section", on);
    return () => window.removeEventListener("retl:section", on);
  }, []);
  const items = useMemo(() => NAV.map(([id, label]) => {
    const item = { icon: ICONS[id], label, active: active === id, onClick: () => go(id) };
    if (id === "achievements") item.badge = 2;
    if (id === "contact") item.menu = [
      { label: "Send an email", onClick: () => { window.location.href = `mailto:${EMAIL}`; } },
      { label: "Copy email address", onClick: () => navigator.clipboard?.writeText(EMAIL) },
      { separator: true },
      { label: "GitHub", onClick: () => window.open("https://github.com/rheillunio2-byte", "_blank", "noopener") },
      { label: "LinkedIn", onClick: () => window.open("https://www.linkedin.com/in/rheil-evans-lunio-039560423/", "_blank", "noopener") }
    ];
    return item;
  }), [active]);
  return (
    <Dock
      items={items}
      baseItemSize={compact ? 40 : 48}
      magnification={compact ? 52 : 70}
      panelHeight={compact ? 56 : 64}
      distance={170}
      gap={compact ? 6 : 9}
      accentColor="#8c52d7"
      badgeColor="#a875ff"
    />
  );
}
const dockHost = document.getElementById("dock-host");
if (dockHost) createRoot(dockHost).render(<SiteDock />);

/* 8 · Achievements — Folder with the certificates inside */
lazyMount("island-folder", () => Promise.resolve({ default: Folder }), (FolderC) => (
  <FolderC
    label="Certificates"
    color="#7b45d6"
    paperColor="#fbf9ff"
    size={compact ? 1 : 1.2}
    layout="spread"
    tabPosition="left"
    theme="dark"
    items={[
      { image: "/certs/card-devfest-2026.jpg", title: "DevFest 2026" },
      { image: "/certs/card-google-io-extended-2026.jpg", title: "Google I/O Extended 2026" },
      { title: "TESDA NC II", description: "Computer Systems Servicing" }
    ]}
  />
));

/* 9 · Tech stack — LogoLoop, two counter-moving rows */
const logo = (Icon, title, hoverColor) => ({ node: <Icon />, title, hoverColor });
const rowA = [
  logo(SiPython, "Python", "#4b8bbe"), logo(SiJavascript, "JavaScript", "#f7df1e"), logo(SiTypescript, "TypeScript", "#3b82f6"),
  logo(SiHtml5, "HTML", "#e34f26"), logo(SiCss, "CSS", "#7c4dff")
];
const rowB = [
  logo(SiReact, "React", "#61dafb"), logo(SiVite, "Vite", "#8c7bff"), logo(SiGit, "Git", "#f05032"),
  logo(SiGithub, "GitHub", "#ffffff"), logo(VscVscode, "VS Code", "#3aa0ff")
];
lazyMount("island-logos", () => Promise.resolve({ default: LogoLoop }), (Loop) => (
  <>
    <Loop logos={rowA} speed={compact ? 55 : 70} direction="left" logoHeight={compact ? 26 : 34} gap={compact ? 40 : 64}
      labels="inline" muted={0.45} scaleOnHover hoverSpeed={12} fadeOutWidth={0.14} ariaLabel="Languages" />
    <Loop logos={rowB} speed={compact ? 48 : 60} direction="right" logoHeight={compact ? 26 : 34} gap={compact ? 40 : 64}
      labels="inline" muted={0.45} scaleOnHover hoverSpeed={12} fadeOutWidth={0.14} ariaLabel="Frameworks and tools" />
  </>
));
