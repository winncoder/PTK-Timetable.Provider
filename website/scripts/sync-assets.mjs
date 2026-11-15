import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const publicDir = resolve(root, "public");
mkdirSync(publicDir, { recursive: true });
copyFileSync(resolve(root, "site.css"), resolve(publicDir, "site.css"));
copyFileSync(resolve(root, "motion.js"), resolve(publicDir, "motion.js"));
copyFileSync(resolve(root, "promo-index.html"), resolve(publicDir, "index.html"));
copyFileSync(resolve(root, "index.html"), resolve(publicDir, "download.html"));
copyFileSync(resolve(root, "ptk-icon.jpg"), resolve(publicDir, "ptk-icon.jpg"));
copyFileSync(resolve(root, "app-icon.jpg"), resolve(publicDir, "app-icon.jpg"));
console.log("Synced promo, download, and icon assets into the unified PTK website.");
