'use client';
import {useRef,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {ResponsiveImage} from './responsive-image';
import {MapDiagram} from './project-visual';
import {t,genreLabels,type Lang,type Project} from '@/lib/types';

export function HeroShowcase({projects,lang}:{projects:Project[];lang:Lang}) {
 const [active,setActive]=useState(0);
 const tabs=useRef<(HTMLButtonElement|null)[]>([]);
 if(!projects.length)return null;
 const current=projects[active];
 function select(index:number){setActive(index);tabs.current[index]?.focus();}
 return <div className="hero-showcase">
  <div className="showcase-top"><span>SELECTED WORK / 2026</span><span>{String(active+1).padStart(2,'0')} — {String(projects.length).padStart(2,'0')}</span></div>
  <div role="tabpanel" id="showcase-panel" aria-labelledby={`showcase-tab-${active}`} className="showcase-panel">
   <a key={current.slug} className="showcase-project" href={`/${lang}/projects/${current.slug}`}>
    <div className="showcase-image">{current.cover?<ResponsiveImage src={current.cover} alt={t(current.coverAlt??current.name,lang)} sizes="(max-width: 700px) 90vw, 45vw" fetchPriority={active===0?'high':'auto'}/>:<MapDiagram lang={lang} small/>}</div>
    <div className="showcase-caption"><div><span>{t(genreLabels[current.genre],lang)}</span><h2>{t(current.name,lang)}</h2></div><span className="showcase-arrow" aria-label={lang==='zh'?'查看项目':'View project'}><ArrowUpRight/></span></div>
   </a>
  </div>
  <div role="tablist" aria-label={lang==='zh'?'切换精选作品':'Choose a featured project'} className="showcase-tabs">
   {projects.map((project,i)=><button type="button" key={project.slug} ref={el=>{tabs.current[i]=el}} role="tab" id={`showcase-tab-${i}`} aria-controls="showcase-panel" aria-selected={active===i} tabIndex={active===i?0:-1} onClick={()=>setActive(i)} onKeyDown={event=>{let next=i;if(event.key==='ArrowRight')next=(i+1)%projects.length;else if(event.key==='ArrowLeft')next=(i+projects.length-1)%projects.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=projects.length-1;else return;event.preventDefault();select(next);}}><span>{String(i+1).padStart(2,'0')}</span><strong>{t(project.name,lang)}</strong></button>)}
  </div>
 </div>;
}
