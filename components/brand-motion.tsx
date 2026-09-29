'use client';

import {useEffect, useRef, useState} from 'react';
import {usePathname} from 'next/navigation';
import {BrandArt} from './brand-identity';
import type {Lang} from '@/lib/types';
import {mountPointerTrail} from '@/lib/pointer-trail';
import {useMotion,motionConditions} from '@/lib/motion';

export function BrandMotion({lang}:{lang:Lang}) {
 const chessArrival=usePathname()?.endsWith('/projects/luanshi-zhiqi');
 const [departing, setDeparting] = useState(false);
 const arrival = useRef<HTMLDivElement>(null);
 const sparks = useRef<HTMLDivElement>(null);
 const trail = useRef<HTMLCanvasElement>(null);

 useEffect(() => {
  if (trail.current) return mountPointerTrail(trail.current);
 }, []);

 useMotion(({gsap}) => {
  // The server-rendered intro is hidden. A returning visit never flashes it.
  let seen = false;
  try {seen = sessionStorage.getItem('t1ar-intro-v1') === 'seen'; sessionStorage.setItem('t1ar-intro-v1','seen');} catch { /* Storage is optional. */ }
  if (seen) return;
  let played=false;
  const mm = gsap.matchMedia();
  mm.add(motionConditions, context => {
   if (context.conditions?.reduce || played) return;
   played=true;
   const select=gsap.utils.selector(arrival);
   const tl = gsap.timeline({defaults:{ease:'power2.out'}});
   // A cancelled or failed intro must never visually cover the content indefinitely.
   const fallback=window.setTimeout(()=>{tl.progress(1);},1500);
   tl.eventCallback('onComplete',()=>clearTimeout(fallback));
   tl.set(arrival.current,{autoAlpha:1})
    .from('.brand-arrival-emblem .brand-art, .chess-arrival-stone',{opacity:0,y:10,scale:.88,duration:.3},0)
    .from('.brand-arrival-word, .brand-arrival-caption',{opacity:0,y:5,stagger:.05,duration:.25},.12)
    .fromTo('.brand-loading-line span',{scaleX:0},{scaleX:1,transformOrigin:'left',duration:.38},.05)
    .to('.brand-arrival-center',{y:-14,scale:.98,duration:.28},.45)
    .to(arrival.current,{autoAlpha:0,duration:.3},.45);
   if(select('.brand-orbit').length)tl.from('.brand-orbit',{scaleX:.35,opacity:0,duration:.38},.02);
   if(select('.brand-arrival-flare').length)tl.from('.brand-arrival-flare',{scale:0,opacity:0,duration:.25},.1);
   return()=>clearTimeout(fallback);
  });
  return () => mm.revert();
 },{scope:arrival});

 useEffect(() => {
  let navigationTimer: ReturnType<typeof setTimeout>;
  const restore = () => { clearTimeout(navigationTimer); setDeparting(false); };
  const onNavigate = (event:MouseEvent) => {
   if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
   const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
   if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
   const url = new URL(anchor.href, location.href);
   if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
   setDeparting(true);
   clearTimeout(navigationTimer);
   navigationTimer = setTimeout(() => setDeparting(false), 8000);
  };
  const onPointer = (event:PointerEvent) => {
   if (event.pointerType !== 'mouse' || event.button !== 0 || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
   const host = sparks.current;
   if (!host) return;
   // A small, bounded burst; no frame loop or persistent pointer tracking.
   if (host.children.length >= 6) host.firstElementChild?.remove();
   const spark = document.createElement('span');
   spark.className = 'brand-click-star';
   spark.style.left = `${event.clientX}px`;
   spark.style.top = `${event.clientY}px`;
   spark.addEventListener('animationend', () => spark.remove(), {once:true});
   host.appendChild(spark);
  };
  document.addEventListener('click', onNavigate);
  document.addEventListener('pointerdown', onPointer, {passive:true});
  window.addEventListener('pageshow', restore);
  return () => {
   clearTimeout(navigationTimer);
   window.removeEventListener('pageshow', restore);
   document.removeEventListener('click', onNavigate);
   document.removeEventListener('pointerdown', onPointer);
  };
 }, []);

 return <>
  <div ref={arrival} className={`brand-arrival motion-arrival${chessArrival?' chess-arrival':''}`} aria-hidden="true">
   <div className="brand-arrival-center">
    {chessArrival?<div className="chess-arrival-board"><span className="chess-arrival-ring"/><span className="chess-arrival-stone">执</span></div>:<div className="brand-arrival-emblem"><i className="brand-orbit"/><BrandArt kind="symbol" priority/><i className="brand-arrival-flare"/></div>}
    <span className="brand-arrival-word">{chessArrival?(lang==='zh'?'落子之痕':'A MOVE, A TRACE'):'T1AR'} <small>{chessArrival?(lang==='zh'?'昔泪 · 乱世执棋':'T1AR · LUANSHI ZHIQI'):'昔泪'}</small></span>
    <div className="brand-loading-line"><span/></div>
    <span className="brand-arrival-caption">TRACE THE PAST · CREATE THE NEXT</span>
   </div>
  </div>
  <div className={`brand-navigation-progress${departing?' is-active':''}`} role="status" aria-live="polite">{departing&&<span className="sr-only">{lang==='zh'?'正在打开页面':'Opening page'}</span>}</div>
  <canvas ref={trail} className="brand-pointer-trail" aria-hidden="true"/>
  <div ref={sparks} className="brand-click-effects" aria-hidden="true"/>
  <noscript><style>{'.brand-arrival{display:none!important}'}</style></noscript>
 </>;
}
