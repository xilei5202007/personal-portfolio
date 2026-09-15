'use client';

import {useEffect, useRef, useState} from 'react';
import {BrandArt} from './brand-identity';
import type {Lang} from '@/lib/types';
import {mountPointerTrail} from '@/lib/pointer-trail';

export function BrandMotion({lang}:{lang:Lang}) {
 const [ready, setReady] = useState(false);
 const [departing, setDeparting] = useState(false);
 const sparks = useRef<HTMLDivElement>(null);
 const trail = useRef<HTMLCanvasElement>(null);

 useEffect(() => {
  if (trail.current) return mountPointerTrail(trail.current);
 }, []);

 useEffect(() => {
  // Visual introduction only: neither the overlay nor its timer blocks the page.
  const start = performance.now();
  let introTimer: ReturnType<typeof setTimeout>;
  let navigationTimer: ReturnType<typeof setTimeout>;
  const finish = () => { introTimer = setTimeout(() => setReady(true), Math.max(0, 650 - (performance.now() - start))); };
  if (document.readyState === 'complete') finish();
  else window.addEventListener('load', finish, {once:true});
  const fallback = setTimeout(() => setReady(true), 2500);
  const restore = () => { setDeparting(false); setReady(true); };
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
   clearTimeout(introTimer); clearTimeout(navigationTimer); clearTimeout(fallback);
   window.removeEventListener('load', finish);
   window.removeEventListener('pageshow', restore);
   document.removeEventListener('click', onNavigate);
   document.removeEventListener('pointerdown', onPointer);
  };
 }, []);

 return <>
  <div className={`brand-arrival${ready?' is-ready':''}`} aria-hidden="true">
   <div className="brand-arrival-center">
    <div className="brand-arrival-emblem"><i className="brand-orbit"/><BrandArt kind="symbol" priority/><i className="brand-arrival-flare"/></div>
    <span className="brand-arrival-word">T1AR <small>昔泪</small></span>
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
