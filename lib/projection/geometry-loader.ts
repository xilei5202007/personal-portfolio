type ProjectionGeometry = {
  positions:Float32Array; normals:Float32Array; tones:Float32Array;
  groups:Float32Array; parts:Float32Array; seeds:Float32Array;
  count:number; bounds:{min:number[];max:number[]}; storyOrigin?:number[];
};

const validSlug=(slug:string)=>slug==='luanshi-zhiqi'||slug==='xiaoya-de-jiang'||slug==='wanchao-zhanyu';
const workerTimeout=12000;

function validGeometry(value:unknown):value is ProjectionGeometry {
  if(!value||typeof value!=='object')return false;
  const g=value as ProjectionGeometry;
  if(!Number.isInteger(g.count)||g.count<1||g.count>62000)return false;
  for(const name of ['positions','normals','tones','groups','parts','seeds'] as const){
    if(!(g[name] instanceof Float32Array)||g[name].length!==g.count*(name==='positions'||name==='normals'?3:1))return false;
  }
  return Array.isArray(g.bounds?.min)&&Array.isArray(g.bounds?.max)
    &&g.bounds.min.length===3&&g.bounds.max.length===3
    &&[...g.bounds.min,...g.bounds.max].every(Number.isFinite);
}

async function buildLocally(slug:string):Promise<ProjectionGeometry> {
  if(slug==='luanshi-zhiqi')return (await import('./command-geometry.js')).buildCommandProjection();
  if(slug==='xiaoya-de-jiang')return (await import('./memory-geometry.js')).buildMemoryProjection();
  return (await import('./terrain-geometry.js')).buildTerrainProjection();
}

/** The runtime owns the promise cache; each uncached scene uses one short-lived worker. */
export async function loadProjectionGeometry(slug:string):Promise<ProjectionGeometry> {
  if(!validSlug(slug))throw new Error('No projection preset');
  if(typeof Worker==='undefined')return buildLocally(slug);
  try{
    return await new Promise<ProjectionGeometry>((resolve,reject)=>{
      let worker:Worker|null=null,settled=false;
      let timer:ReturnType<typeof setTimeout>|undefined;
      const finish=(geometry?:ProjectionGeometry)=>{
        if(settled)return;
        settled=true;
        if(timer!==undefined)clearTimeout(timer);
        if(worker){worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;worker.terminate();}
        if(geometry)resolve(geometry);else reject(new Error('Projection worker unavailable'));
      };
      try{
        worker=new Worker(new URL('./geometry-worker.js',import.meta.url),{type:'module'});
        worker.onmessage=event=>finish(event.data?.slug===slug&&validGeometry(event.data?.geometry)?event.data.geometry:undefined);
        worker.onerror=event=>{event.preventDefault();finish();};
        worker.onmessageerror=()=>finish();
        timer=setTimeout(()=>finish(),workerTimeout);
        worker.postMessage({slug});
      }catch{finish();}
    });
  }catch{
    // Older browsers, restrictive policies, or an unavailable worker retain the scene.
    return buildLocally(slug);
  }
}
