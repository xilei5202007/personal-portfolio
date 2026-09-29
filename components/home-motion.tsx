'use client';

import {useRef,type ReactNode} from 'react';
import {useMotion,motionConditions} from '@/lib/motion';

/** Keep the original main/section grid; only animate its internal layers. */
export function HomeMotion({children}:{children:ReactNode}) {
 const root=useRef<HTMLElement>(null);
 useMotion(({gsap,ScrollTrigger}) => {
  const mm=gsap.matchMedia();
  mm.add(motionConditions, context => {
   if(context.conditions?.reduce)return;
   const select=gsap.utils.selector(root);
   const hero=select('.character-hero')[0];
   const selected=select('#selected')[0];
   if(!hero||!selected)return;
   // Do not replay the opening when the visitor arrives at a deep anchor.
   if(window.scrollY<100&&!location.hash)gsap.from(select('.character-hero-content > *'),{
    y:18,opacity:.3,duration:.55,stagger:.075,ease:'power2.out',clearProps:'transform,opacity',
   });
   gsap.fromTo(select('.home-trace-path'),{strokeDashoffset:1},{strokeDashoffset:0,ease:'none',
    scrollTrigger:{trigger:hero,start:'bottom 95%',endTrigger:selected,end:'top 32%',scrub:.35,invalidateOnRefresh:true},
   });
   gsap.fromTo(select('.home-trace-tip'),{opacity:.15},{opacity:.8,ease:'none',
    scrollTrigger:{trigger:hero,start:'bottom 85%',endTrigger:selected,end:'top 45%',scrub:.35},
   });
   const targets=select('#selected > .section-top, #selected > .featured-viewer, #selected .work-card');
   targets.forEach(target=>{
    gsap.from(target,{y:context.conditions?.desktop?24:14,opacity:.85,duration:.65,ease:'power2.out',
     clearProps:'transform,opacity',scrollTrigger:{trigger:target,start:'top 94%',once:true},
    });
   });
  });
  // Asset completion can affect document flow. Coalesce refreshes and stop after unmount.
  let disposed=false,frame=0;
  const refresh=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(!disposed)ScrollTrigger.refresh();});};
  const pending=Array.from(root.current?.querySelectorAll('img')??[]).filter(img=>!img.complete);
  pending.forEach(img=>img.addEventListener('load',refresh,{once:true}));
  document.fonts?.ready.then(()=>{if(!disposed)refresh();});
  return()=>{disposed=true;cancelAnimationFrame(frame);pending.forEach(img=>img.removeEventListener('load',refresh));mm.revert();};
 },{scope:root});
 return <main ref={root} id="main" className="home-page motion-home">{children}</main>;
}
