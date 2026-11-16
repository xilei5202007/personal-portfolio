import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source=readFileSync(new URL('../lib/projection/runtime.ts',import.meta.url),'utf8');
const code=ts.transpile(source,{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS});
function harness({reduced=false,resizeError=false}={}){
 const frames=new Map(),engines=[],commits=[],motion=[];let sequence=0,ready=0,failures=0,clock=0;
 const preference=new EventTarget();preference.matches=reduced;
 const document=new EventTarget();document.hidden=false;
 const captured=new Set(),canvas=new EventTarget();canvas.getBoundingClientRect=()=>({width:760,height:460});
 canvas.setPointerCapture=id=>captured.add(id);canvas.hasPointerCapture=id=>captured.has(id);canvas.releasePointerCapture=id=>captured.delete(id);
 const geometry={positions:new Float32Array(6),normals:new Float32Array(6),tones:new Float32Array(2),groups:new Float32Array(2),seeds:new Float32Array(2),count:2,bounds:{min:[0,0,0],max:[1,1,1]}};
 const exports={};
 const context={exports,Float32Array,Map,Promise,Math,Error,JSON,window:{innerWidth:1000,devicePixelRatio:2,matchMedia:()=>preference},document,
  ResizeObserver:class{observe(){}disconnect(){}},
  requestAnimationFrame:fn=>{frames.set(++sequence,fn);return sequence;},cancelAnimationFrame:id=>frames.delete(id),
  require:name=>name.includes('renderer')?{createProjectionRenderer:()=>{const engine={draws:[],disposed:0,resize(){if(resizeError)throw Error('GPU resize failure');},draw(options){this.draws.push(options);},dispose(){this.disposed++;}};engines.push(engine);return engine;}}:{loadProjectionGeometry:async()=>geometry}
 };
 vm.runInNewContext(code,context);
 const stage=new exports.ProjectionStage(canvas,{onCommit:slug=>commits.push(slug),onReady:()=>ready++,onFailure:()=>failures++,onMotion:state=>motion.push(state)});
 return {stage,canvas,captured,document,preference,frames,engines,commits,motion,get ready(){return ready;},get failures(){return failures;},get last(){return engines.at(-1)?.draws.at(-1);},advance(count=180){for(let i=0;i<count;i++){clock+=50;const work=[...frames.values()];frames.clear();for(const fn of work)fn(clock);}}};
}
function input(canvas,type,properties){const event=new Event(type,{cancelable:true});Object.assign(event,properties);canvas.dispatchEvent(event);return event;}
{
 const h=harness();await Promise.all([h.stage.select('xiaoya-de-jiang'),h.stage.select('luanshi-zhiqi'),h.stage.select('wanchao-zhanyu')]);
 assert.deepEqual(h.commits,['wanchao-zhanyu'],'Only the latest asynchronous selection may commit');
 assert.equal(h.engines.length,1);assert.equal(h.frames.size,1,'First entry starts automatically');
 assert.equal(h.last.phase,'reveal');assert.equal(h.last.progress,0);const openingYaw=h.last.yaw;
 h.advance(20);assert.ok(h.last.progress>.4&&h.last.progress<.7,'Reveal is still in progress after one second');assert.ok(h.last.yaw>openingYaw,'The opening rotates while points appear');
 h.stage.togglePause();const paused=h.last;h.advance(200);assert.equal(h.last,paused,'Pause freezes reveal and rotation');assert.equal(h.frames.size,0);
 h.stage.togglePause();h.advance(30);assert.ok(h.last.storyProgress>0,'The first story starts without a play click');
 h.advance();assert.equal(h.frames.size,0,'The finite introduction must stop rendering');assert.equal(h.motion.at(-1).running,false);
 h.stage.play();assert.equal(h.frames.size,1);h.stage.togglePause();assert.equal(h.frames.size,0);assert.equal(h.motion.at(-1).paused,true);
 h.stage.togglePause();h.advance();assert.equal(h.frames.size,0);assert.equal(h.motion.at(-1).running,false);
 h.stage.play();h.document.hidden=true;h.document.dispatchEvent(new Event('visibilitychange'));assert.equal(h.frames.size,0);
 h.document.hidden=false;h.document.dispatchEvent(new Event('visibilitychange'));assert.equal(h.frames.size,1);
 h.stage.dispose();assert.equal(h.frames.size,0);assert.equal(h.engines[0].disposed,1);
}
{
 const h=harness();await h.stage.select('xiaoya-de-jiang');h.advance();await h.stage.select('luanshi-zhiqi');h.advance(200);
 await h.stage.select('xiaoya-de-jiang');h.advance(70);
 assert.equal(h.commits.at(-1),'xiaoya-de-jiang');assert.equal(h.frames.size,0,'A repeat visit only performs a slow reveal');
 assert.ok(h.engines.at(-1).draws.every(draw=>draw.storyProgress===0),'Repeat visits must not replay the automatic story');
 assert.ok(h.engines.at(-1).draws.every(draw=>draw.yaw===-16),'Repeat visits do not restart auto rotation');h.stage.dispose();
}
{
 const h=harness();await h.stage.select('xiaoya-de-jiang');h.advance(10);h.stage.turn(8);const yaw=h.last.yaw;h.advance(80);
 assert.equal(h.last.yaw,yaw);assert.equal(h.frames.size,0);assert.ok(h.engines[0].draws.every(draw=>draw.storyProgress===0),'Manual control cancels the pending automatic story');
 await h.stage.select('luanshi-zhiqi');h.stage.turn(-8);h.advance(80);
 assert.equal(h.frames.size,0,'Manual takeover during dissolve remains effective after replacement');assert.ok(h.engines.at(-1).draws.every(draw=>draw.storyProgress===0));h.stage.dispose();
}
{
 const h=harness();await h.stage.select('xiaoya-de-jiang');h.advance(50);assert.ok(h.last.storyProgress>0);
 h.stage.turn(8);assert.equal(h.motion.at(-1).paused,true);const progress=h.last.storyProgress,yaw=h.last.yaw;h.advance(50);
 assert.equal(h.last.storyProgress,progress);h.stage.togglePause();h.advance();assert.equal(h.last.yaw,yaw,'Resuming story does not revive cancelled rotation');assert.equal(h.frames.size,0);h.stage.dispose();
}
{
 const h=harness();h.stage.setEnabled(false);await h.stage.select('xiaoya-de-jiang');assert.equal(h.frames.size,0);
 h.stage.setEnabled(true);await h.stage.select('xiaoya-de-jiang');h.advance(50);assert.ok(h.last.storyProgress>0,'Opening artwork first does not consume the first projection demo');
 h.stage.setEnabled(false);assert.equal(h.frames.size,0);h.stage.setEnabled(true);h.advance(60);assert.equal(h.frames.size,0);assert.equal(h.last.storyProgress,0);h.stage.dispose();
}
{
 const h=harness({reduced:true});await h.stage.select('xiaoya-de-jiang');h.stage.play();assert.equal(h.frames.size,0);
 await h.stage.select('luanshi-zhiqi');assert.equal(h.commits.at(-1),'luanshi-zhiqi');assert.equal(h.frames.size,0);h.stage.dispose();
}
{
 const h=harness();await h.stage.select('xiaoya-de-jiang');h.advance(10);h.preference.matches=true;h.preference.dispatchEvent(new Event('change'));
 assert.equal(h.frames.size,0);assert.equal(h.last.phase,'static');assert.equal(h.last.storyProgress,0);
 h.preference.matches=false;h.preference.dispatchEvent(new Event('change'));assert.equal(h.frames.size,0,'Changing the preference back must not trigger a delayed autoplay');h.stage.dispose();
}
{
 const h=harness({resizeError:true});await h.stage.select('luanshi-zhiqi');assert.equal(h.ready,0,'A failed resize must never re-enable a blank canvas');assert.ok(h.failures>0);assert.equal(h.frames.size,0);h.stage.dispose();
}
{
 const h=harness();const loading=h.stage.select('xiaoya-de-jiang');h.canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));await loading;
 assert.equal(h.ready,0,'A pending selection must not revive a lost context');assert.equal(h.engines.length,0);
 h.canvas.dispatchEvent(new Event('webglcontextrestored'));await new Promise(resolve=>setImmediate(resolve));assert.equal(h.ready,1);h.stage.dispose();
}
{
 const h=harness();await h.stage.select('luanshi-zhiqi');await h.stage.select('wanchao-zhanyu');assert.equal(h.frames.size,1);
 h.advance(5);const progress=h.last.progress;h.stage.setVisible(false);assert.equal(h.frames.size,0);h.advance(100);
 assert.equal(h.commits.at(-1),'luanshi-zhiqi','Leaving the viewport pauses rather than commits the transition');assert.equal(h.last.progress,progress);
 h.stage.setVisible(true);h.advance(1);assert.equal(h.last.progress,progress,'Resuming does not count hidden time');h.advance(20);assert.equal(h.commits.at(-1),'wanchao-zhanyu');
 h.stage.dispose();assert.ok(h.engines.every(engine=>engine.disposed===1));
}
{
 const h=harness();await h.stage.select('luanshi-zhiqi');h.advance(50);
 input(h.canvas,'pointerdown',{pointerId:1,button:0,isPrimary:true,clientX:100,clientY:250});
 const start=h.last;input(h.canvas,'pointermove',{pointerId:1,clientX:500,clientY:100});
 assert.ok(h.last.yaw>50,'Horizontal orbit is not limited to the old 50 degree arc');assert.ok(h.last.pitch>start.pitch,'Vertical drag tilts the view');
 assert.equal(h.motion.at(-1).paused,true,'Dragging takes over the automatic story');
 const dragged=h.last;h.advance();assert.equal(h.last,dragged,'The introduction cannot fight a manually chosen view');
 input(h.canvas,'pointerdown',{pointerId:2,button:0,isPrimary:false,clientX:20,clientY:20});
 input(h.canvas,'pointercancel',{pointerId:2});input(h.canvas,'pointermove',{pointerId:1,clientX:600,clientY:80});
 assert.notEqual(h.last.yaw,dragged.yaw,'An unrelated pointer cannot cancel the active drag');
 input(h.canvas,'pointerup',{pointerId:1});assert.equal(h.captured.size,0);
 const released=h.last;input(h.canvas,'pointermove',{pointerId:1,clientX:650,clientY:40});assert.equal(h.last,released);
 input(h.canvas,'keydown',{key:'Home'});assert.equal(h.last.yaw,-18);assert.equal(h.last.pitch,.19,'Home resets both axes');
 h.stage.turn(360);assert.equal(h.last.yaw,-18,'A complete orbit returns to the same orientation');
 const before=h.last.pitch;assert.equal(input(h.canvas,'keydown',{key:'ArrowUp'}).defaultPrevented,true);assert.ok(h.last.pitch>before);
 input(h.canvas,'keydown',{key:'ArrowDown'});assert.ok(Math.abs(h.last.pitch-before)<1e-12);
 h.stage.turn(0,1000);assert.ok(Math.abs(h.last.pitch-70*Math.PI/180)<1e-12);h.stage.turn(0,-1000);assert.ok(Math.abs(h.last.pitch+10*Math.PI/180)<1e-12);
 h.stage.resetView();assert.equal(h.last.pitch,.19);assert.equal(h.last.yaw,-18);
 input(h.canvas,'pointerdown',{pointerId:3,button:0,clientX:0,clientY:0});await h.stage.select('wanchao-zhanyu');assert.equal(h.captured.size,0,'Scene changes release pointer capture');
 h.advance();assert.equal(h.last.pitch,.5,'New scenes restore their own intended pitch');h.stage.dispose();
}
{
 const h=harness({reduced:true});await h.stage.select('xiaoya-de-jiang');
 input(h.canvas,'pointerdown',{pointerId:1,button:0,clientX:200,clientY:200});input(h.canvas,'pointermove',{pointerId:1,clientX:400,clientY:100});
 assert.ok(h.last.pitch>.25,'Reduced motion still permits deliberate 3D inspection');assert.equal(h.frames.size,0);
 h.stage.setEnabled(false);assert.equal(h.captured.size,0);h.stage.setEnabled(true);const last=h.last;
 input(h.canvas,'pointermove',{pointerId:1,clientX:600,clientY:0});assert.equal(h.last,last,'Artwork mode must not retain a stale drag');
 input(h.canvas,'pointerdown',{pointerId:2,button:0,clientX:200,clientY:200});h.stage.setVisible(false);assert.equal(h.captured.size,0);
 h.stage.setVisible(true);input(h.canvas,'pointerdown',{pointerId:3,button:0,clientX:200,clientY:200});h.stage.dispose();assert.equal(h.captured.size,0);
}
console.log('Projection lifecycle checks passed: 3D pointer orbit, four arrow keys, dual-axis reset, capture cleanup, slow reveal, finite auto rotation, one-time autoplay, unified pause, manual takeover, artwork mode, latest selection, hidden-time preservation, reduced motion, context restoration, resize fallback and disposal.');
