import {loadProjectionGeometry} from './geometry-loader';

type Geometry = {
  positions: Float32Array; normals: Float32Array; tones: Float32Array;
  groups: Float32Array; seeds: Float32Array; parts?: Float32Array;
  count: number; bounds: {min: number[]; max: number[]};
  pitch?: number; storyOrigin?: number[];
};
type Engine = {draw: (options: Record<string, unknown>)=>void; resize:(w:number,h:number,dpr:number)=>void;dispose:()=>void};
type Motion = {running:boolean;paused:boolean;step:number};
type Callbacks = {onCommit:(slug:string)=>void;onReady:()=>void;onFailure:()=>void;onMotion:(state:Motion)=>void};
type Change = {phase:'dissolve'|'reveal';elapsed:number;next?:Geometry;slug:string};
type Entrance = {elapsed:number;from:number;to:number;autoStory:boolean};
const timing={dissolve:650,reveal:1800,entrance:8000,story:5400};
const geometryCache = new Map<string,Promise<Geometry>>();
const settings:Record<string,{yaw:number;pitch:number;accent:number[]}> = {
  'xiaoya-de-jiang':{yaw:-16,pitch:.25,accent:[.42,.81,.91]},
  'luanshi-zhiqi':{yaw:-18,pitch:.19,accent:[.96,.76,.39]},
  'wanchao-zhanyu':{yaw:-17,pitch:.5,accent:[.51,.79,.65]},
};
async function geometryFor(slug:string):Promise<Geometry> {
  if(!settings[slug])throw new Error('No projection preset');
  let pending=geometryCache.get(slug);
  if(!pending){
    pending=(async()=>{
      const geometry=await loadProjectionGeometry(slug);
      return {...geometry,pitch:settings[slug].pitch} as Geometry;
    })();
    geometryCache.set(slug,pending);
    pending.catch(()=>geometryCache.delete(slug));
  }
  return pending;
}
function qualityGeometry(source:Geometry):Geometry {
  const budget=window.innerWidth<600?22000:62000;
  if(source.count<=budget)return source;
  const count=budget, result={...source,count};
  for(const name of ['positions','normals','tones','groups','seeds','parts'] as const){
    const original=source[name];if(!original)continue;
    const size=name==='positions'||name==='normals'?3:1;
    const data=new Float32Array(count*size);
    for(let i=0;i<count;i++){
      const index=Math.floor(i*source.count/count);
      for(let j=0;j<size;j++)data[i*size+j]=original[index*size+j];
    }
    result[name]=data;
  }
  return result;
}

/** Owns one canvas. Async selections are versioned; only the latest may commit. */
export class ProjectionStage {
  private engine:Engine|null=null;
  private factory:((canvas:HTMLCanvasElement,geometry:Geometry)=>Engine)|null=null;
  private disposed=false;private failed=false;private restoreCount=0;private revision=0;
  private active='';private requested='';private yaw=-18;private pitch=.19;
  private enabled=true;private visible=true;private raf=0;private last=0;private time=0;
  private change:Change|null=null;private story:number|null=null;private paused=false;
  private entrance:Entrance|null=null;private seen=new Set<string>();private suppressEntrance=false;
  private motionKey='';private drag:{id:number;x:number;y:number;yaw:number;pitch:number}|null=null;
  private reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  private resizeObserver:ResizeObserver;
  private cleanup:(()=>void)[]=[];
  constructor(private canvas:HTMLCanvasElement,private callbacks:Callbacks){
    const listen=(target:EventTarget,type:string,fn:EventListener)=>{
      target.addEventListener(type,fn);this.cleanup.push(()=>target.removeEventListener(type,fn));
    };
    this.resizeObserver=new ResizeObserver(()=>{this.resize();this.draw();});
    this.resizeObserver.observe(canvas);
    listen(document,'visibilitychange',()=>{
      if(document.hidden){this.endDrag();this.stop();}else{this.draw();this.schedule();}
    });
    listen(this.reduced,'change',()=>{
      if(this.reduced.matches){this.entrance=null;this.story=null;this.paused=false;this.stop();this.settleChange();this.seen.add(this.active);}
      this.notify();this.draw();this.schedule();
    });
    listen(canvas,'pointerdown',(event)=>{
      const e=event as PointerEvent;if(e.button!==0||e.isPrimary===false||this.drag||!this.enabled||this.failed||!this.engine)return;
      this.takeOver();
      this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:this.yaw,pitch:this.pitch};
      canvas.setPointerCapture(e.pointerId);
    });
    listen(canvas,'pointermove',(event)=>{
      const e=event as PointerEvent;
      if(this.drag?.id===e.pointerId){
        this.yaw=this.wrapYaw(this.drag.yaw+(e.clientX-this.drag.x)*.24);
        this.pitch=this.clampPitch(this.drag.pitch-(e.clientY-this.drag.y)*.004);
        this.draw();
      }
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(canvas,type,event=>{
      if(this.drag?.id===(event as PointerEvent).pointerId)this.endDrag();
    });
    listen(canvas,'keydown',(event)=>{
      const e=event as KeyboardEvent;
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();this.turn(e.key==='ArrowLeft'?-8:8);}
      else if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();this.turn(0,e.key==='ArrowUp'?6:-6);}
      else if(e.key==='Home'){e.preventDefault();this.resetView();}
    });
    listen(canvas,'webglcontextlost',(event)=>{event.preventDefault();this.fail();});
    listen(canvas,'webglcontextrestored',()=>{
      if(this.disposed||this.restoreCount++>=1)return;
      this.failed=false;this.engine?.dispose();this.engine=null;void this.select(this.requested);
    });
  }
  private wrapYaw(value:number){return ((value+180)%360+360)%360-180;}
  private clampPitch(value:number){return Math.max(-Math.PI/18,Math.min(7*Math.PI/18,value));}
  private endDrag(){
    const drag=this.drag;this.drag=null;
    if(drag&&this.canvas.hasPointerCapture(drag.id))this.canvas.releasePointerCapture(drag.id);
  }
  async select(slug:string){
    if(this.disposed)return;
    if(slug===this.requested&&slug===this.active&&this.engine&&!this.change?.next){this.callbacks.onCommit(slug);return;}
    const revision=++this.revision;this.requested=slug;this.endDrag();
    this.change=null;this.entrance=null;this.story=null;this.paused=false;this.suppressEntrance=false;this.stop();this.notify();this.draw();
    if(this.failed&&slug===this.active){this.callbacks.onCommit(slug);return;}
    this.failed=false;
    if(slug===this.active&&this.engine){this.callbacks.onCommit(slug);return;}
    try{
      const [geometry,module]=await Promise.all([geometryFor(slug),import('./projection-renderer.js')]);
      if(this.disposed||this.failed||revision!==this.revision)return;
      this.factory=module.createProjectionRenderer as unknown as typeof this.factory;
      if(this.engine&&this.enabled&&!this.reduced.matches){
        this.change={phase:'dissolve',elapsed:0,next:geometry,slug};this.notify();this.schedule();
      }else{this.replace(geometry,slug);this.beginEntrance(slug);this.draw();this.schedule();}
    }catch{if(!this.disposed&&revision===this.revision)this.fail();}
  }
  private replace(geometry:Geometry,slug:string){
    this.engine?.dispose();this.engine=null;
    if(!this.factory)throw new Error('Renderer unavailable');
    this.engine=this.factory(this.canvas,qualityGeometry(geometry));
    this.endDrag();this.active=slug;this.yaw=settings[slug].yaw;this.pitch=settings[slug].pitch;
    if(!this.resize())throw new Error('Projection resize failed');
    this.callbacks.onCommit(slug);this.callbacks.onReady();
  }
  private beginEntrance(slug:string){
    if(!this.enabled)return;
    if(this.reduced.matches){this.seen.add(slug);return;}
    this.change={phase:'reveal',elapsed:0,slug};
    if(!this.seen.has(slug)&&!this.suppressEntrance){
      const base=settings[slug].yaw;
      this.entrance={elapsed:0,from:base-14,to:base+10,autoStory:true};this.yaw=base-14;
    }
    this.seen.add(slug);this.notify();
  }
  private takeOver(){
    this.entrance=null;this.suppressEntrance=true;
    if(this.story!==null)this.paused=true;
    this.stop();this.notify();this.schedule();
  }
  private settleChange(){
    const change=this.change;this.change=null;
    if(change?.next){try{this.replace(change.next,change.slug);}catch{this.fail();}}
    this.draw();
  }
  private resize(){
    if(!this.engine||this.disposed||this.failed)return false;
    const rect=this.canvas.getBoundingClientRect();
    if(rect.width<2||rect.height<2)return true;
    try{this.engine.resize(rect.width,rect.height,Math.min(window.devicePixelRatio||1,1.6));return true;}catch{this.fail();return false;}
  }
  private draw(){
    if(!this.engine||this.disposed||this.failed||!this.enabled)return;
    const duration=this.change?.phase==='dissolve'?timing.dissolve:timing.reveal;
    try{this.engine.draw({yaw:this.yaw,pitch:this.pitch,phase:this.change?.phase??'static',
      progress:this.change?Math.min(1,this.change.elapsed/duration):1,time:this.time,
      storyProgress:this.story===null?0:Math.min(1,this.story/timing.story),
      glitch:!!this.change&&!this.reduced.matches,
      foreground:[.87,.92,.96],background:[.035,.051,.075],accent:settings[this.active]?.accent??[.42,.81,.91]});
    }catch{this.fail();}
  }
  private stop(){if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.last=0;}
  private schedule(){
    if(!this.raf&&!this.disposed&&!this.failed&&this.enabled&&this.visible&&!document.hidden&&
       !this.paused&&(this.change||this.entrance||this.story!==null))this.raf=requestAnimationFrame(this.tick);
  }
  private tick=(now:number)=>{
    this.raf=0;if(this.disposed||this.failed||!this.enabled||!this.visible||document.hidden||this.paused){this.last=0;return;}
    const delta=this.last?Math.min(80,now-this.last):0;this.last=now;this.time+=delta/1000;
    if(this.change){
      this.change.elapsed+=delta;
      if(this.change.elapsed>=(this.change.phase==='dissolve'?timing.dissolve:timing.reveal)){
        const old=this.change;
        if(old.phase==='dissolve'&&old.next){
          try{this.replace(old.next,old.slug);this.beginEntrance(old.slug);}catch{this.fail();return;}
        }else{
          this.change=null;
          if(this.entrance?.autoStory){this.entrance.autoStory=false;this.story=0;}
        }
      }
    }
    if(this.entrance){
      this.entrance.elapsed+=delta;
      const progress=Math.min(1,this.entrance.elapsed/timing.entrance),ease=(1-Math.cos(progress*Math.PI))/2;
      this.yaw=this.entrance.from+(this.entrance.to-this.entrance.from)*ease;
      if(progress>=1)this.entrance=null;
    }
    if(this.story!==null){this.story+=delta;if(this.story>=timing.story)this.story=null;}
    this.notify();this.draw();this.schedule();if(!this.raf)this.last=0;
  };
  private notify(){
    const state={running:!!this.change||!!this.entrance||this.story!==null,paused:this.paused,step:this.story===null?-1:Math.min(2,Math.floor(this.story/(timing.story/3)))};
    const key=JSON.stringify(state);if(key!==this.motionKey){this.motionKey=key;this.callbacks.onMotion(state);}
  }
  private fail(){
    if(this.disposed)return;this.failed=true;this.endDrag();this.change=null;this.entrance=null;this.story=null;this.paused=false;
    this.stop();this.engine?.dispose();this.engine=null;
    if(this.requested){this.active=this.requested;this.callbacks.onCommit(this.requested);}
    this.notify();this.callbacks.onFailure();
  }
  play(){
    if(this.failed||this.disposed||!this.engine||!this.enabled||this.reduced.matches)return;
    this.entrance=null;this.suppressEntrance=true;this.settleChange();if(this.failed||!this.engine)return;
    this.stop();this.story=0;this.paused=false;this.notify();this.draw();this.schedule();
  }
  togglePause(){if(this.story===null&&!this.entrance&&!this.change)return;this.paused=!this.paused;this.stop();this.notify();this.draw();this.schedule();}
  turn(degrees:number,pitchDegrees=0){
    if(this.disposed||this.failed||!this.enabled||!this.engine)return;
    this.takeOver();
    this.yaw=this.wrapYaw(this.yaw+degrees);this.pitch=this.clampPitch(this.pitch+pitchDegrees*Math.PI/180);
    this.draw();
  }
  resetView(){
    if(this.disposed||this.failed||!this.enabled||!this.engine)return;
    this.endDrag();this.takeOver();
    this.yaw=settings[this.active].yaw;this.pitch=settings[this.active].pitch;this.draw();
  }
  setVisible(value:boolean){this.visible=value;if(!value){this.endDrag();this.stop();}else{this.resize();this.draw();this.schedule();}}
  setEnabled(value:boolean){
    this.enabled=value;
    if(!value){this.endDrag();this.entrance=null;this.story=null;this.paused=false;this.suppressEntrance=true;this.stop();this.settleChange();this.notify();}
    else{this.suppressEntrance=false;if(this.engine&&!this.failed)this.beginEntrance(this.active);this.resize();this.draw();this.schedule();}
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;++this.revision;this.endDrag();this.stop();
    this.resizeObserver.disconnect();this.cleanup.forEach(fn=>fn());this.engine?.dispose();this.engine=null;
  }
}
