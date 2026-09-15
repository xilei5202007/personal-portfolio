import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const [home,lost,sharpPath]=process.argv.slice(2);
if(!home||!lost) throw new Error('Pass the selected homepage and 404 PNG paths, plus optional Sharp module path.');
const sharp=require(sharpPath||'sharp');
await fs.mkdir('public/images/character',{recursive:true});
for(const [name,source] of [['home-scene',home],['lost-scene',lost]]){
 const metadata=await sharp(source).metadata();
 await fs.copyFile(source,`public/images/character/${name}.png`);
 await sharp(source).resize({width:1920,withoutEnlargement:true}).webp({quality:88,effort:5}).toFile(`public/images/character/${name}.webp`);
 await sharp(source).resize({width:960,withoutEnlargement:true}).webp({quality:85,effort:5}).toFile(`public/images/character/${name}-small.webp`);
 console.log(`${name}: ${metadata.width}x${metadata.height}; original and two WebP sizes saved`);
}
