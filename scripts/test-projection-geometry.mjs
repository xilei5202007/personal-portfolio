import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildCommandProjection} from '../lib/projection/command-geometry.js';
import {buildMemoryProjection,buildTerrainProjection} from '../lib/projection/world-geometries.js';

const fields={positions:3,normals:3,tones:1,groups:1,parts:1,seeds:1};
const hash=g=>{
 const digest=createHash('sha256');
 for(const name of Object.keys(fields))digest.update(new Uint8Array(g[name].buffer,g[name].byteOffset,g[name].byteLength));
 return digest.digest('hex');
};
for(const [name,build] of [['city',buildCommandProjection],['memory',buildMemoryProjection],['terrain',buildTerrainProjection]]){
 const started=performance.now(),g=build(),elapsed=Math.round(performance.now()-started);
 assert(Number.isInteger(g.count)&&g.count>0&&g.count<=62000,`${name}: bounded point allocation`);
 for(const [field,width] of Object.entries(fields)){
  assert(g[field] instanceof Float32Array&&g[field].length===g.count*width,`${name}: complete ${field}`);
  assert(g[field].every(Number.isFinite),`${name}: finite ${field}`);
 }
 const parts={};let normalError=0;
 for(let i=0;i<g.count;i++){
  const length=Math.hypot(...g.normals.subarray(i*3,i*3+3));normalError=Math.max(normalError,Math.abs(length-1));
  assert(Math.abs(length-1)<1e-5,`${name}: normalized surface normal ${i}`);
  assert(g.tones[i]>=0&&g.tones[i]<=1&&g.seeds[i]>=0&&g.seeds[i]<=1,`${name}: bounded shading attributes`);
  assert(Number.isInteger(g.parts[i])&&g.parts[i]>=0&&g.parts[i]<=4,`${name}: known surface role`);
  assert(Number.isInteger(g.groups[i])&&g.groups[i]>=0&&g.groups[i]<=2,`${name}: known narrative group`);
  parts[g.parts[i]]=(parts[g.parts[i]]||0)+1;
  for(let axis=0;axis<3;axis++)assert(g.positions[i*3+axis]>=g.bounds.min[axis]-1e-6&&g.positions[i*3+axis]<=g.bounds.max[axis]+1e-6,`${name}: bounds include all points`);
 }
 assert(g.storyOrigin?.length===3&&g.storyOrigin.every(Number.isFinite),`${name}: valid narrative origin`);
 assert.equal(hash(g),hash(build()),`${name}: fixed-seed rebuilds must be identical`);
 console.log(JSON.stringify({scene:name,count:g.count,buildMs:elapsed,maxNormalError:normalError,parts,bounds:g.bounds}));
}
console.log('Projection geometry checks passed: finite complete buffers, normalized normals, valid bounds and shading roles, deterministic generation.');
