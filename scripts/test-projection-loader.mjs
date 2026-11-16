import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {Worker as NodeWorker} from 'node:worker_threads';

const source=readFileSync(new URL('../lib/projection/geometry-loader.ts',import.meta.url),'utf8');
const code=ts.transpile(source.replaceAll('import.meta.url',JSON.stringify(import.meta.url)),{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS});
const geometry={count:1,bounds:{min:[0,0,0],max:[1,1,1]},...Object.fromEntries(['positions','normals','tones','groups','parts','seeds'].map(k=>[k,new Float32Array(k==='positions'||k==='normals'?3:1)]))};
function harness(mode='success'){
 const timers=new Map(),instances=[];let fallback=0;
 class Worker {
  constructor(){if(mode==='constructor')throw Error('blocked');instances.push(this);}
  postMessage({slug}){
   if(mode==='post')throw Error('unavailable');
   if(mode==='timeout')return;
   queueMicrotask(()=>{
    if(mode==='error')this.onerror?.({preventDefault(){}});
    else if(mode==='messageerror')this.onmessageerror?.({});
    else this.onmessage?.({data:{slug:mode==='wrong-slug'?'wrong':slug,geometry:mode==='malformed'?{}:geometry}});
   });
  }
  terminate(){this.terminated=(this.terminated||0)+1;}
 }
 const build=()=>{fallback++;return geometry;},exports={};
 vm.runInNewContext(code,{exports,Worker:mode==='unsupported'?undefined:Worker,Float32Array,URL,queueMicrotask,
  setTimeout:fn=>{timers.set(1,fn);return 1;},clearTimeout:id=>timers.delete(id),
  require:()=>({buildCommandProjection:build,buildMemoryProjection:build,buildTerrainProjection:build})});
 return {load:exports.loadProjectionGeometry,instances,timers,get fallback(){return fallback;}};
}
for(const mode of ['success','unsupported','constructor','post','error','messageerror','wrong-slug','malformed','timeout']){
 const h=harness(mode),pending=h.load('luanshi-zhiqi');
 if(mode==='timeout')h.timers.get(1)();
 assert.equal(await pending,geometry,`${mode}: scene remains available`);
 assert.equal(h.fallback,mode==='success'?0:1,`${mode}: exactly one appropriate fallback`);
 assert.equal(h.timers.size,0,`${mode}: no timer leak`);
 for(const worker of h.instances){assert.equal(worker.terminated,1);assert.equal(worker.onmessage,null);assert.equal(worker.onerror,null);}
}
{const h=harness();await assert.rejects(h.load('unknown'));assert.equal(h.instances.length,0);assert.equal(h.fallback,0);}

// Execute the production worker and builders in an actual background thread.
const workerUrl=new URL('../lib/projection/geometry-worker.js',import.meta.url).href;
for(const [slug,count] of [['luanshi-zhiqi',60000],['xiaoya-de-jiang',56000],['wanchao-zhanyu',62000]]){
 const worker=new NodeWorker(`const {parentPort}=require('node:worker_threads');
 global.self={postMessage:(message,transfer)=>{parentPort.postMessage(message,transfer);parentPort.postMessage({detached:transfer.every(b=>b.byteLength===0)});},close:()=>parentPort.close()};
 parentPort.on('message',data=>self.onmessage({data}));
 import(${JSON.stringify(workerUrl)}).then(()=>parentPort.postMessage({ready:true}));`,{eval:true});
 let result,detached=false;
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{void worker.terminate();reject(Error('worker timeout'));},15000);
  worker.on('message',data=>{if(data.ready)worker.postMessage({slug});else if('detached' in data)detached=data.detached;else result=data;});
  worker.on('error',reject);
  worker.on('exit',exitCode=>{clearTimeout(timer);exitCode?reject(Error(`worker exit ${exitCode}`)):resolve();});
 });
 assert.equal(result.slug,slug);assert.equal(result.geometry.count,count);assert.equal(detached,true,'Buffers move across threads instead of copying');
 assert.ok(result.geometry.positions instanceof Float32Array);
 assert.equal(result.geometry.positions.length,count*3);
 console.log(`${slug}: background generation and six transferred buffers passed (${count} points)`);
}
console.log('Projection loader checks passed: background success, cleanup, timeout, unsupported/failed Worker fallback, malformed messages and invalid presets.');
