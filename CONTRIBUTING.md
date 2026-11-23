# Contributing to RETL Portfolio

Thanks for taking the time to look at this project! 💜
This is a **personal portfolio**, so contributions work a little differently from a typical open-source library. This guide explains what's welcome, what isn't, and how to get a change merged smoothly.

## What's welcome

- 🐛 **Bug fixes**: layout glitches, broken interactions, console errors, anything that misbehaves
- ♿ **Accessibility improvements**: focus handling, contrast, screen-reader labels, keyboard support
- 📱 **Responsive fixes**: anything that breaks on a particular phone, tablet or browser
- ⚡ **Performance improvements**: smaller bundles, smoother animations, lazy-loading
- 📝 **Docs**: typos, clearer README sections, better setup instructions
- 💡 **Ideas**: new interactions or components that fit the visual style (open an issue first)

## What's not accepted

The portfolio's *content* is personal, so please **don't open PRs that change**:

- Bio text, project descriptions, timeline entries, certificates, awards or research details
- Photos, logos, brand art or any identity-related assets
- Social links or contact details
- Anything that adds tracking, analytics, ads or third-party scripts

If you're building **your own** portfolio from this, fork it and make it yours. That's what forks are for, and the [Make it yours](README.md#make-it-yours) section in the README tells you where to look.

## Ground rules

- Be kind and constructive. Assume good intent, give specific and respectful feedback, and keep discussions on-topic.
- Harassment, hate speech and personal attacks aren't tolerated and will get you blocked.
- Keep the site **silent**. The portfolio intentionally has no audio.

## Reporting a bug

Please [open an issue](https://github.com/rheillunio2-byte/RETL-Portfolio/issues/new) and include:

1. **What happened** and what you expected instead
2. **Steps to reproduce** (the exact interaction helps, e.g. "drag the second photo left quickly")
3. **Device, OS and browser** with versions (e.g. *Pixel 7, Android 14, Chrome 131*)
4. **Screenshots or a short screen recording**, if visual
5. Any **console errors** (DevTools → Console)

Search existing issues first to avoid duplicates.

## Suggesting an idea

Open an issue titled `Idea: …` describing the problem it solves or the experience it adds, and, if you can, a rough sketch of how it would look and behave. Please wait for a thumbs-up before spending time on a big PR.

## Development setup

Requires **Node.js 18+**.

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/RETL-Portfolio.git
cd RETL-Portfolio

# 2. Install and run
npm install
npm run dev          # http://localhost:5173

# 3. Before opening a PR
npm run build        # must pass with no errors
npm run preview      # sanity-check the production build
```

## Making a change

1. **Create a branch** from `main`, with a descriptive name:
   `fix/dock-focus-ring`, `a11y/palette-aria`, `perf/lazy-wall`, `docs/readme-deploy`
2. **Keep the PR focused.** One fix or feature per PR; unrelated cleanups go in their own.
3. **Test it** against the checklist below.
4. **Commit** with clear messages. [Conventional Commits](https://www.conventionalcommits.org) style is preferred:
   `fix: keep the photo deck from throwing while busy`
   `feat: add keyboard shortcut hint to the palette`
   `docs: clarify GitHub Pages deployment`
5. **Open a pull request** against `main`, describe *what* and *why*, link the issue (`Closes #12`) and attach before/after screenshots for visual changes.

## How the code is organised

- The page is **plain HTML + vanilla ES modules**. Content lives in `index.html`, global styling in `src/style.css`, behaviour in `src/main.js` and the feature modules next to it (`extras.js`, `frames.js`, `star.js`, `intro.js`).
- **React is used only for "islands"** in `src/components/`, mounted from `src/islands.jsx`. Don't turn the page into a React app.
- Each feature keeps its **own CSS file** and **namespaced class names** (`.boot-*` for the intro, `.cmdk-*` for the palette, `.frame*` for the photo deck, `.star-*` for the star CTA) so styles never collide.
- Heavy things (WebGL, canvas) should be **lazy-mounted** near the viewport, like the existing islands.
- Colours and fonts come from the CSS variables at the top of `src/style.css`. Reuse them instead of hard-coding new values.
- A full map of the repo is in the README's [Project structure](README.md#project-structure).

## Code style

- Match the surrounding code: 2-space indentation, double quotes in JS, `const`/`let` (no `var`), small focused functions.
- Prefer **no new dependencies**. If you truly need one, explain why in the PR (bundle size matters here).
- Write comments that explain *why*, not *what*.
- Don't leave `console.log` debugging behind.
- Keep images web-optimised (resize and compress before committing; big originals don't belong in `public/`).

## Pull request checklist

Before you request a review, please check:

- [ ] `npm run build` passes with no errors or new warnings
- [ ] Works in the latest **Chrome, Firefox and Safari** (or you've noted which you couldn't test)
- [ ] Checked on a **narrow mobile viewport** (~375px) and on desktop
- [ ] **`prefers-reduced-motion`** is respected (turn it on in your OS or DevTools and confirm)
- [ ] **Keyboard-only** use still works and focus is visible; interactive elements have accessible names
- [ ] No sound, tracking, analytics or new third-party requests were added
- [ ] No personal content (text, photos, links, certificates) was changed
- [ ] Screenshots or a screen recording are attached for visual changes
- [ ] Docs updated if behaviour or setup changed

## Security

If you find a security issue (for example, something that could expose visitor data or abuse the contact form), please **don't** open a public issue. Email **rheillunio2@gmail.com** with the details and give me a reasonable chance to fix it first.

## Questions?

Open a [discussion or issue](https://github.com/rheillunio2-byte/RETL-Portfolio/issues), or reach out through the links in the README. And if you just enjoyed the project, a ⭐ on the repo is the nicest contribution of all.

Thank you for helping make this better! 💜
