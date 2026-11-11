# openbq.io website

The public website for **openbq**, the open-source biometric quality framework.
Plain HTML, CSS and JavaScript, with no framework. A small build step minifies the files into `dist/` for deployment.

## Project structure

```
openbq-website/
├── index.html          Home
├── platform.html       How it works
├── solutions.html      Solutions + Open source & DPG
├── contact.html        Contact + newsletter
├── assets/
│   ├── css/styles.css  All site styles
│   ├── js/main.js      Menu, tabs, reveal-on-scroll, etc.
│   ├── fonts/          Self-hosted Quicksand, Roboto, Host Grotesk
│   ├── img/            Brand, icons, photos, social logos
│   └── video/          Overview video + poster
├── build.mjs           Build script (creates dist/)
├── package.json
└── .gitignore
```

## Requirements

- [Node.js](https://nodejs.org) 18 or later
- [pnpm](https://pnpm.io)

## 1. Run locally (while editing)

Serve the project folder over HTTP. Opening the `.html` files directly (`file://`) breaks the YouTube and LinkedIn embeds.

```bash
python3 -m http.server 8080
```

Open http://localhost:8080 in your browser. Refresh it after each change. If styles look stale, hard refresh with **Cmd + Shift + R**.

> Use `http://localhost:8080`, not `https://`. The simple server only speaks HTTP.

## 2. Install build tools (first time only)

```bash
pnpm install
pnpm approve-builds   # select esbuild, press Enter
```

## 3. Build the site

```bash
pnpm run build
```

This creates `dist/`, which contains:
- minified HTML, CSS and JS
- cache-busted CSS and JS links (`styles.css?v=<hash>`), so visitors always get the latest styles
- no HTML comments, source files (`.eps` etc.) or retired pages (`open-source.html`)
- a `.nojekyll` file for GitHub Pages

The build also warns if a page links to an `.html` file that isn't in `dist/`.

## 4. Preview the build

```bash
pnpm run preview
```

Open http://localhost:8080 and check the pages before deploying.

The same check without extra packages:

```bash
python3 -m http.server 8080 --directory dist
```

