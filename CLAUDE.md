# Undrift

Static home page (no build step): `index.html`, `style.css`, `shared.js` (defaults, presets, pure logic), `app.js` (UI), `sw.js` (offline cache).

## Git
- Commit directly on `main` — no feature branches or pull requests.
- Push to `main` only when the user explicitly asks for it in that request. Never push on your own.

## Conventions
- Bump `VERSION` in `sw.js` whenever any app file changes, so browsers pick up the new copy.
- The page must fit one laptop screen with no page scroll; only inner panels (folders, day calendar) may scroll.
- New daily tips: append to `TIPS` in `shared.js` with a new, never-reused `id`.
- New apps: add them to `APP` in `shared.js` with a short `desc` (used as the tooltip), then list them in a persona's folders.
