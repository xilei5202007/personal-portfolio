'use client';

import {useRef,type ReactNode} from 'react';
import type {gsap} from 'gsap';
import {useMotion,motionConditions} from '@/lib/motion';

export function ProjectLink({href,className,slug,children,label}:{href:string;className:string;slug:string;children:ReactNode;label?:string}) {
 const root=useRef<HTMLAnchorElement>(null);
 const trace=slug==='luanshi-zhiqi'?'chess':slug==='xiaoya-de-jiang'?'photo':'study';
 useMotion(({gsap})=>{
  const mm=gsap.matchMedia();
  mm.add(motionConditions,context=>{
   const anchor=root.current;
   if(!anchor||context.conditions?.reduce||!context.conditions?.fine)return;
   const select=gsap.utils.selector(anchor);
   anchor.classList.add('is-motion-managed');
   const tl=gsap.timeline({paused:true,defaults:{duration:.28,ease:'power2.out'}});
   const add=(selector:string,from:gsap.TweenVars,to:gsap.TweenVars,at=0)=>{
    const nodes=select(selector);if(nodes.length)tl.fromTo(nodes,from,to,at);
   };
   add('.project-frame',{opacity:0,scale:.985},{opacity:1,scale:1});
   add('.project-entry-label',{opacity:.7,x:-3},{opacity:1,x:0});
   add('.project-entry svg, .showcase-arrow svg',{x:0,y:0},{x:2,y:-2});
   add('.chess-mark-grid',{opacity:0},{opacity:.65});
   add('.chess-mark-stone',{opacity:0,y:-16,scale:1.05},{opacity:1,y:0,scale:1,duration:.3});
   add('.chess-mark-caption',{opacity:0,y:5},{opacity:1,y:0},.06);
   add('.project-trace-route',{opacity:0,strokeDashoffset:1},{opacity:1,strokeDashoffset:0,duration:.32},.08);
   add('.photo-trace-frame',{opacity:0,scale:.975},{opacity:1,scale:1,duration:.32});
   add('.photo-trace-light',{opacity:0,xPercent:-105},{opacity:.55,xPercent:105,duration:.4},0);
   const enter=()=>{tl.timeScale(1).play();};
   const leave=()=>{if(!anchor.matches(':focus-visible'))tl.timeScale(1.4).reverse();};
   const blur=()=>{if(!anchor.matches(':hover'))tl.timeScale(1.4).reverse();};
   anchor.addEventListener('pointerenter',enter);anchor.addEventListener('pointerleave',leave);
   anchor.addEventListener('focus',enter);anchor.addEventListener('blur',blur);
   if(anchor.matches(':hover, :focus-visible'))enter();
   return()=>{
    anchor.classList.remove('is-motion-managed');
    anchor.removeEventListener('pointerenter',enter);anchor.removeEventListener('pointerleave',leave);
    anchor.removeEventListener('focus',enter);anchor.removeEventListener('blur',blur);
   };
  });
  return()=>mm.revert();
 },{scope:root,dependencies:[slug]});
 return <a ref={root} href={href} className={`${className} motion-project`} data-trace={trace} aria-label={label}>{children}</a>;
}

export function PhotoTraceMark(){return <span className="photo-trace-mark" aria-hidden="true"><span className="photo-trace-frame"/><span className="photo-trace-light"/></span>;}
