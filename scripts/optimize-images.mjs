import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

// Originals stay untouched; committed derivatives need no image service at runtime.
const require = createRequire(import.meta.url);
const sharp = require(process.argv[2] || 'sharp');
const root = process.cwd();
const publicDir = path.join(root, 'public');
const manifest = {};
let originalBytes = 0, desktopBytes = 0, mobileBytes = 0;
async function scan(dir) {
  const entries = await fs.readdir(dir, { withFileTypes:true });
  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { await scan(file); continue; }
    if (!/\.(png|jpe?g)$/i.test(entry.name)) continue;
    const relative = path.relative(publicDir, file).replaceAll('\\', '/');
    const metadata = await sharp(file).metadata();
    const widths = [...new Set([480, 960, 1600].map(w => Math.min(w, metadata.width)))];
    const variants = [];
    for (const width of widths) {
      const url = `/optimized/${relative.replace(/\.[^.]+$/, '')}-${width}.webp`;
      const output = path.join(publicDir, url);
      await fs.mkdir(path.dirname(output), { recursive:true });
      await sharp(file).resize({ width, withoutEnlargement:true }).webp({ quality:88, effort:5 }).toFile(output);
      variants.push({ src:url, width, bytes:(await fs.stat(output)).size });
    }
    manifest[`/${relative}`] = { width:metadata.width, height:metadata.height, variants };
    originalBytes += (await fs.stat(file)).size;
    desktopBytes += variants.at(-1).bytes;
    mobileBytes += variants[Math.min(1,variants.length-1)].bytes;
  }
}
await scan(path.join(publicDir, 'images'));
await scan(path.join(publicDir, 'analysis'));
await fs.writeFile(path.join(root, 'content/image-variants.json'), JSON.stringify(manifest, null, 2)+'\n');
console.log(JSON.stringify({images:Object.keys(manifest).length,originalBytes,desktopBytes,mobileBytes}));
