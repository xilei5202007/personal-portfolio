type TrailPoint = {x:number;y:number;time:number;dragging:boolean};

/** Decorative, viewport-local light trail. Never captures or cancels input. */
export function mountPointerTrail(canvas:HTMLCanvasElement) {
 const context = canvas.getContext('2d');
 if (!context) return () => {};
 const preference = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
 const lifetime = 340;
 let points:TrailPoint[] = [];
 let frame = 0;
 let width = 0, height = 0;
 let lastSample = -Infinity;

 const clear = () => {
  cancelAnimationFrame(frame); frame = 0; points = []; lastSample = -Infinity;
  context.clearRect(0,0,width,height);
 };
 const resize = () => {
  clear();
  // Limit backing-store cost on high-density screens; CSS keeps viewport size.
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  width = window.innerWidth; height = window.innerHeight;
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  context.setTransform(ratio,0,0,ratio,0,0);
 };
 const draw = (now:number) => {
  frame = 0;
  points = points.filter(point => now - point.time < lifetime);
  context.clearRect(0,0,width,height);
  context.lineCap = 'round'; context.lineJoin = 'round';
  for (let index = 1; index < points.length; index++) {
   const previous = points[index-1], point = points[index];
   const fade = (1 - (now - previous.time)/lifetime) ** 2;
   const strength = point.dragging ? 1 : .65;
   context.beginPath(); context.moveTo(previous.x,previous.y); context.lineTo(point.x,point.y);
   context.strokeStyle = `rgba(88,145,255,${fade * strength * .24})`;
   context.lineWidth = point.dragging ? 7 : 4;
   context.stroke();
   context.strokeStyle = `rgba(124,181,255,${fade * strength * .8})`;
   context.lineWidth = point.dragging ? 2.2 : 1.3;
   context.stroke();
   context.strokeStyle = `rgba(230,244,255,${fade * strength})`;
   context.lineWidth = .6;
   context.stroke();
   // Sparse pinpricks of starlight, anchored to the fading path.
   if (index % 6 === 0) {
    const radius = (point.dragging ? 3 : 1.8) * fade;
    context.beginPath(); context.moveTo(point.x-radius,point.y); context.lineTo(point.x+radius,point.y);
    context.moveTo(point.x,point.y-radius); context.lineTo(point.x,point.y+radius);
    context.strokeStyle = `rgba(207,232,255,${fade * .8})`; context.lineWidth = .8; context.stroke();
   }
  }
  if (points.length) frame = requestAnimationFrame(draw);
 };
 const move = (event:PointerEvent) => {
  if (event.pointerType !== 'mouse' || !preference.matches || document.hidden) return;
  const now = performance.now();
  if (now - lastSample < 8) return;
  const last = points.at(-1);
  const distance = last ? Math.hypot(event.clientX-last.x,event.clientY-last.y) : 0;
  // Discontinuities must not draw a line across the screen after re-entry.
  if (last && (distance > 220 || now-last.time > lifetime)) points = [];
  else if (last && distance < 2) return;
  lastSample = now;
  points.push({x:event.clientX,y:event.clientY,time:now,dragging:(event.buttons & 1) !== 0});
  if (points.length > 48) points.shift();
  if (!frame) frame = requestAnimationFrame(draw);
 };
 const leave = (event:PointerEvent) => {if (!event.relatedTarget) clear();};
 const visibility = () => {if (document.hidden) clear();};
 const changePreference = () => {clear(); if (preference.matches) resize();};
 resize();
 document.addEventListener('pointermove',move,{passive:true});
 document.addEventListener('pointerout',leave,{passive:true});
 document.addEventListener('pointercancel',clear);
 document.addEventListener('dragstart',clear);
 document.addEventListener('visibilitychange',visibility);
 window.addEventListener('blur',clear);
 window.addEventListener('pagehide',clear);
 window.addEventListener('resize',resize,{passive:true});
 preference.addEventListener('change',changePreference);
 return () => {
  clear();
  document.removeEventListener('pointermove',move);
  document.removeEventListener('pointerout',leave);
  document.removeEventListener('pointercancel',clear);
  document.removeEventListener('dragstart',clear);
  document.removeEventListener('visibilitychange',visibility);
  window.removeEventListener('blur',clear);
  window.removeEventListener('pagehide',clear);
  window.removeEventListener('resize',resize);
  preference.removeEventListener('change',changePreference);
 };
}
