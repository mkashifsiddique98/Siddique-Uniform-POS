// Next.js "standalone" output doesn't auto-copy static assets; do it after every build
// so .next/standalone can run/be copied to another offline Windows machine on its own.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

if (!fs.existsSync(standalone)) {
  console.log("No .next/standalone folder found; skipping asset copy.");
  process.exit(0);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true });
}

copyDir(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"));

// Link (not copy) public/ so uploads saved at runtime (process.cwd() === standalone/
// after Next's chdir) land in the real public/uploads folder instead of a stale copy.
const publicSrc = path.join(root, "public");
const publicLink = path.join(standalone, "public");
const linkStat = fs.existsSync(publicLink) ? fs.lstatSync(publicLink) : null;
if (!linkStat || !linkStat.isSymbolicLink()) {
  if (linkStat) fs.rmSync(publicLink, { recursive: true, force: true });
  fs.symlinkSync(publicSrc, publicLink, "junction");
}

console.log("Copied static assets and linked public/ into .next/standalone.");
