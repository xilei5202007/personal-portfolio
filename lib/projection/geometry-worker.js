// Build away from the UI thread. Buffers are moved, not copied, back to the stage.
self.onmessage=async event=>{
  const slug=event.data?.slug;
  try{
    let geometry;
    if(slug==='luanshi-zhiqi')geometry=(await import('./command-geometry.js')).buildCommandProjection();
    else if(slug==='xiaoya-de-jiang')geometry=(await import('./memory-geometry.js')).buildMemoryProjection();
    else if(slug==='wanchao-zhanyu')geometry=(await import('./terrain-geometry.js')).buildTerrainProjection();
    else throw new Error('No projection preset');
    const transfer=['positions','normals','tones','groups','parts','seeds'].map(name=>geometry[name].buffer);
    self.postMessage({slug,geometry},transfer);
  }catch{
    self.postMessage({slug,error:'Geometry generation failed'});
  }finally{
    self.close();
  }
};
