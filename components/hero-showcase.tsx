'use client';
import {useRef,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {ResponsiveImage} from './responsive-image';
import {MapDiagram} from './project-visual';
import {ChessTraceMark} from './chess-trace-mark';
import {ProjectLink,PhotoTraceMark} from './project-link';
import {useMotion,motionConditions} from '@/lib/motion';
import {t,genreLabels,type Lang,type Project} from '@/lib/types';

export function HeroShowcase({projects,lang}:{projects:Project[];lang:Lang}) {
 const [active,setActive]=useState(0);
 const tabs=useRef<(HTMLButtonElement|null)[]>([]);
 const root=useRef<HTMLDivElement>(null);
 const previous=useRef<number|null>(null);
 useMotion(({gsap})=>{
  if(previous.current===null)return;
  const mm=gsap.matchMedia();
  mm.add(motionConditions,context=>{
   if(context.conditions?.reduce)return;
   gsap.timeline({defaults:{duration:.3,ease:'power2.out'}})
    .set('.showcase-previous',{autoAlpha:1})
    .to('.showcase-previous',{autoAlpha:0,x:-10},0)
    .fromTo('.showcase-current',{opacity:.25,x:14},{opacity:1,x:0,clearProps:'opacity,transform'},.03);
  });
  return()=>mm.revert();
 },{scope:root,dependencies:[active]});
 if(!projects.length)return null;
 const current=projects[active];
 function select(index:number,focus=false){if(index!==active){previous.current=active;setActive(index);}if(focus)tabs.current[index]?.focus();}
 function artwork(project:Project){return <>
  <div className="showcase-image">{project.cover?<ResponsiveImage src={project.cover} alt={t(project.coverAlt??project.name,lang)} sizes="(max-width: 700px) 90vw, 45vw"/>:<MapDiagram lang={lang} small/>}<span className="project-frame" aria-hidden="true"/>{project.slug==='luanshi-zhiqi'&&<ChessTraceMark lang={lang}/>} {project.slug==='xiaoya-de-jiang'&&<PhotoTraceMark/>}</div>
  <div className="showcase-caption"><div><span>{t(genreLabels[project.genre],lang)}</span><h2>{t(project.name,lang)}</h2><span className="showcase-entry-label">{lang==='zh'?'探索项目':'Explore project'}</span></div><span className="showcase-arrow" aria-hidden="true"><ArrowUpRight/></span></div>
 </>;}
 return <div ref={root} className="hero-showcase motion-showcase">
  <div className="showcase-top"><span>SELECTED WORK / 2026</span><span>{String(active+1).padStart(2,'0')} — {String(projects.length).padStart(2,'0')}</span></div>
  <div role="tabpanel" id="showcase-panel" aria-labelledby={`showcase-tab-${active}`} className="showcase-panel">
   {previous.current!==null&&<div className="showcase-previous" aria-hidden="true" inert><div className={`showcase-project${projects[previous.current].slug==='luanshi-zhiqi'?' showcase-chess':''}`}>{artwork(projects[previous.current])}</div></div>}
   <ProjectLink key={current.slug} className={`showcase-project showcase-current${current.slug==='luanshi-zhiqi'?' showcase-chess':''}`} href={`/${lang}/projects/${current.slug}`} slug={current.slug}>{artwork(current)}</ProjectLink>
  </div>
  <div role="tablist" aria-label={lang==='zh'?'切换精选作品':'Choose a featured project'} className="showcase-tabs">
   {projects.map((project,i)=><button type="button" key={project.slug} ref={el=>{tabs.current[i]=el}} role="tab" id={`showcase-tab-${i}`} aria-controls="showcase-panel" aria-selected={active===i} tabIndex={active===i?0:-1} onClick={()=>select(i)} onKeyDown={event=>{let next=i;if(event.key==='ArrowRight')next=(i+1)%projects.length;else if(event.key==='ArrowLeft')next=(i+projects.length-1)%projects.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=projects.length-1;else return;event.preventDefault();select(next,true);}}><span>{String(i+1).padStart(2,'0')}</span><strong>{t(project.name,lang)}</strong></button>)}
  </div>
 </div>;
}
