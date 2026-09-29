'use client';

import {useEffect,type DependencyList,type RefObject} from 'react';
import type {gsap as Gsap} from 'gsap';

type MotionRuntime={gsap:typeof Gsap;ScrollTrigger:typeof import('gsap/ScrollTrigger').ScrollTrigger};
let runtime:Promise<MotionRuntime>|undefined;

function loadMotion(){
 // Workers forbid GSAP's module-level ticker during SSR. Load it only in an
 // effect; the server and a failed import both leave fully readable HTML.
 return runtime??=Promise.all([import('gsap'),import('gsap/ScrollTrigger')]).then(([{gsap},{ScrollTrigger}])=>{
  gsap.registerPlugin(ScrollTrigger);return {gsap,ScrollTrigger};
 });
}

export function useMotion(callback:(runtime:MotionRuntime)=>void|(()=>void),{scope,dependencies=[]}:{scope:RefObject<HTMLElement|null>;dependencies?:DependencyList}){
 useEffect(()=>{
  let disposed=false;
  let context:ReturnType<typeof Gsap.context>|undefined;
  loadMotion().then(api=>{
   if(disposed||!scope.current)return;
   context=api.gsap.context(()=>{},scope.current);
   let failed=false;
   let failure:unknown;
   context.add(()=>{
    try{return callback(api);}
    catch(error){failed=true;failure=error;}
   });
   if(failed){context.revert();throw failure;}
  }).catch(error=>console.error('Portfolio motion could not initialize.',error));
  return()=>{disposed=true;context?.revert();};
 },dependencies);
}
export const motionConditions = {
 all: 'all',
 reduce: '(prefers-reduced-motion: reduce)',
 desktop: '(min-width: 851px)',
 fine: '(hover: hover) and (pointer: fine)',
};
