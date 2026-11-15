# Undrift

Undrift is a home page that pulls you back when you drift.

You sat down for one quick task. Now it’s two hours later.

Undrift tells you the time every half hour, so you notice and come back. A focus timer keeps you in blocks. Your key sites are one click away. One box asks AI anything.

No account. No tracking. Just your day, back on track.

A static home page: Pomodoro timer, spoken time chime, bookmark launcher, Ask box and settings.
No build step. Upload this folder as it is.

## Deploy
- **Cloudflare Pages**: Workers & Pages > Create > Pages > Upload assets, then drop this folder in.
- **GitHub Pages**: push these files to a repository, then Settings > Pages > Deploy from branch (root).

## Use in Chrome
- Settings > On startup > Open a specific page: your site address.
- Settings > Appearance > Show home button: your site address.
- Pin the tab, or install it as an app from the address bar.

## Updating
After changing any file, bump `VERSION` at the top of `sw.js` so browsers pick up the new copy.

Settings are stored in the browser's localStorage. Use Settings > Backup to export or import them.
