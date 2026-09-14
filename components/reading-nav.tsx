'use client';
import {useEffect,useId,useState} from 'react';
import {ChevronDown} from 'lucide-react';
import type {Lang} from '@/lib/types';

export function ReadingNav({items,lang,label}:{items:{id:string;title:string}[];lang:Lang;label:string}) {
 const [active,setActive]=useState(items[0]?.id??'');
 const [expanded,setExpanded]=useState(false);
 const [progress,setProgress]=useState(0);
 const navId=useId();
 useEffect(()=>{
  const targets=items.map(item=>document.getElementById(item.id)).filter((el):el is HTMLElement=>Boolean(el));
  if(!targets.length)return;
  let frame=0;
  const update=()=>{frame=0;const offset=(document.querySelector('.site-header')?.getBoundingClientRect().height??80)+100;let current=targets[0];for(const target of targets){if(target.getBoundingClientRect().top<=offset)current=target;else break;}setActive(current.id);const container=targets[0].closest('.case-content,.article-body');if(container){const bounds=container.getBoundingClientRect();const distance=Math.max(1,bounds.height-window.innerHeight+offset);setProgress(Math.round(Math.max(0,Math.min(100,(offset-bounds.top)/distance*100))));}};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
  update();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  const observer=new ResizeObserver(schedule);const container=targets[0].closest('.case-content,.article-body');if(container)observer.observe(container);
  return()=>{window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);cancelAnimationFrame(frame);observer.disconnect()};
 },[items]);
 if(!items.length)return null;
 const current=items.find(item=>item.id===active)??items[0];
 return <aside className={`case-toc reading-nav${expanded?' is-expanded':''}`}>
  <span className="eyebrow toc-desktop-label">{label}</span>
  <button type="button" className="toc-toggle" aria-expanded={expanded} aria-controls={navId} onClick={()=>setExpanded(value=>!value)}><span>{label}<strong>{current.title}</strong></span><ChevronDown size={18}/></button>
  <div className="reading-progress" role="progressbar" aria-label={lang==='zh'?'阅读进度':'Reading progress'} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${progress}%`}}/></div>
  <nav id={navId} aria-label={label}>{items.map((item,i)=><a href={`#${item.id}`} key={item.id} aria-current={active===item.id?'location':undefined} onClick={()=>{setActive(item.id);setExpanded(false);const target=document.getElementById(item.id);if(target){target.tabIndex=-1;target.focus({preventScroll:true});}}}><span>{String(i+1).padStart(2,'0')}</span>{item.title}</a>)}</nav>
 </aside>;
}
