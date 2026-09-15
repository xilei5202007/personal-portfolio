import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(process.argv[2]||'sharp');
// Format-only copies: board artwork and approved geometry remain intact.
for(const name of ['logo-board']){
 await sharp(`public/brand/${name}.png`).webp({quality:94,effort:5}).toFile(`public/brand/${name}.webp`);
}
// A smaller full board embedded in an SVG viewport preserves the chosen symbol.
const bytes=await sharp('public/brand/logo-board.png').resize({width:768}).webp({quality:88}).toBuffer();
await fs.writeFile('public/brand/favicon.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="804 80 144 150"><title>T1ar</title><image width="1536" height="1024" href="data:image/webp;base64,${bytes.toString('base64')}"/></svg>`);
console.log('Approved brand board web copies and favicon prepared.');
