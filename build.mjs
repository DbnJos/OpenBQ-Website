// openbq.io build: creates ./dist ready to deploy
// Usage: npm install   (once)   then   npm run build
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { transform } from "esbuild";
import { minify as minifyHtml } from "html-minifier-terser";

const SRC = process.cwd();
const DIST = path.join(SRC, "dist");

// Pages you do NOT want deployed (e.g. retired pages)
const EXCLUDE_PAGES = ["open-source.html"];
// Source-only files that should never ship
const SKIP_EXT = new Set([".eps", ".ai", ".psd", ".sketch", ".fig", ".md"]);
const SKIP_NAMES = new Set([".DS_Store", "Thumbs.db"]);
// Extra root files to copy if they exist
const ROOT_EXTRAS = ["CNAME", "robots.txt", "sitemap.xml", "favicon.ico", "404.html"];

const hash = (buf) => crypto.createHash("sha256").update(buf).digest("hex").slice(0, 8);
const kb = (n) => (n / 1024).toFixed(1) + " KB";

async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const e of await fs.readdir(from, { withFileTypes: true })) {
    if (SKIP_NAMES.has(e.name) || SKIP_EXT.has(path.extname(e.name).toLowerCase())) continue;
    const s = path.join(from, e.name), d = path.join(to, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

async function main() {
  await fs.rm(DIST, { recursive: true, force: true });
  await copyDir(path.join(SRC, "assets"), path.join(DIST, "assets"));

  // Minify CSS + JS in place and record a content hash for cache-busting
  const versions = {};
  for (const [rel, loader] of [["assets/css/styles.css", "css"], ["assets/js/main.js", "js"]]) {
    const src = await fs.readFile(path.join(SRC, rel), "utf8");
    const out = await transform(src, { loader, minify: true, target: ["es2019", "chrome90", "safari14", "firefox90"] });
    await fs.writeFile(path.join(DIST, rel), out.code);
    versions[rel] = hash(out.code);
    console.log(`  ${rel}: ${kb(src.length)} -> ${kb(out.code.length)}`);
  }

  // HTML pages
  const pages = (await fs.readdir(SRC)).filter((f) => f.endsWith(".html") && !EXCLUDE_PAGES.includes(f));
  for (const page of pages) {
    let html = await fs.readFile(path.join(SRC, page), "utf8");
    for (const [rel, v] of Object.entries(versions)) {
      // matches styles.css, styles.css?v=3 etc. and replaces with the content hash
      const re = new RegExp(`(["'])${rel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\?v=[^"']*)?\\1`, "g");
      html = html.replace(re, `$1${rel}?v=${v}$1`);
    }
    const out = await minifyHtml(html, {
      collapseWhitespace: true, conservativeCollapse: true,
      removeComments: true,            // also drops commented-out sections
      minifyCSS: true, minifyJS: true,
      removeRedundantAttributes: true, useShortDoctype: true,
    });
    await fs.writeFile(path.join(DIST, page), out);
    console.log(`  ${page}: ${kb(html.length)} -> ${kb(out.length)}`);
  }

  for (const f of ROOT_EXTRAS) {
    try { await fs.copyFile(path.join(SRC, f), path.join(DIST, f)); } catch {}
  }
  await fs.writeFile(path.join(DIST, ".nojekyll"), ""); // GitHub Pages: serve files as-is

  // Warn about links to pages that are not in dist
  const shipped = new Set(pages);
  for (const page of pages) {
    const html = await fs.readFile(path.join(DIST, page), "utf8");
    const missing = new Set([...html.matchAll(/href="?([a-z0-9-]+\.html)/gi)].map((m) => m[1]).filter((f) => !shipped.has(f)));
    for (const f of missing) console.warn(`  ! ${page} links to ${f}, which is not in dist`);
  }
  console.log(`\nBuilt ${pages.length} pages into dist/`);
}

main().catch((e) => { console.error(e); process.exit(1); });
