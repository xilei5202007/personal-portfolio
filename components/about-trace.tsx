'use client';

import {useRef,useState} from 'react';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {useMotion,motionConditions} from '@/lib/motion';
import {t,type Lang} from '@/lib/types';

const traces=[
 {id:'observe',label:{zh:'看见',en:'Observe'},tag:'FPS / TACTICAL',title:{zh:'信息、枪线与高压判断',en:'Information, angles and pressure'},body:{zh:'《无畏契约》PC Diamond。关注残局信息更新、反制空间与赛事观赏性，整理为 12 案例机制研究。',en:'VALORANT PC Diamond. Clutch information, counterplay and spectator experience, developed into a 12-case mechanism study.'},link:{zh:'阅读 12 案例研究',en:'Read the 12-case study'},href:'game-analysis/valorant/clutch-system'},
 {id:'question',label:{zh:'思考',en:'Question'},tag:'CHARACTER / PVP',title:{zh:'角色表达，需要反制成立',en:'Character expression needs counterplay'},body:{zh:'《火影忍者手游》《王者荣耀》等角色竞技经历，让我关注角色机制、操作反馈，以及对手如何回应一次高光。',en:'Naruto Mobile and Honor of Kings draw my attention to kits, feedback and how opponents respond to a strong play.'}},
 {id:'create',label:{zh:'创造',en:'Create'},tag:'STRATEGY / MULTIPLAYER',title:{zh:'让路线与利益推动冲突',en:'Conflict through routes and incentives'},body:{zh:'从策略体验走向《万朝战域》的原创推演，把地图控制、资源争夺与多人利益关系转成规则与验证问题。',en:'Strategy play led to Wanchao Zhanyu: map control, resources and conflicting interests become rules and test questions.'},link:{zh:'走进《万朝战域》',en:'Explore Wanchao Zhanyu'},href:'projects/wanchao-zhanyu'},
];

export function AboutTrace({lang}:{lang:Lang}){
 const root=useRef<HTMLElement>(null);
 const [active,setActive]=useState('observe');
 useMotion(({gsap})=>{
  const mm=gsap.matchMedia();
  mm.add(motionConditions,context=>{
   if(context.conditions?.reduce)return;
   const select=gsap.utils.selector(root);
   gsap.timeline({scrollTrigger:{trigger:root.current,start:'top 85%',once:true}})
    .fromTo(select('.about-star-path'),{strokeDashoffset:1},{strokeDashoffset:0,duration:.9,ease:'power2.inOut'})
    .fromTo(select('.about-star-dot'),{opacity:.35,scale:.65},{opacity:1,scale:1,duration:.35,stagger:.12,clearProps:'transform,opacity'},.15);
  });
  return()=>mm.revert();
 },{scope:root});
 useMotion(({gsap})=>{
  const mm=gsap.matchMedia();
  mm.add(motionConditions,context=>{
   if(context.conditions?.reduce)return;
   const select=gsap.utils.selector(root);
   gsap.fromTo(select('.about-star-node[data-active] .about-star-halo'),{scale:.6,opacity:.75},{scale:1.7,opacity:0,duration:.6,ease:'power2.out'});
   gsap.from(select('.about-star-panel:not([hidden]):not([inert]) > *'),{y:7,opacity:.6,duration:.3,stagger:.025,clearProps:'transform,opacity'});
  });
  return()=>mm.revert();
 },{scope:root,dependencies:[active]});
 return <section ref={root} className="about-trace" aria-labelledby="about-trace-title">
  <header className="trace-section-heading"><span className="eyebrow">T1AR / TRACE 03</span><h2 id="about-trace-title">{lang==='zh'?'兴趣会变，问题在积累。':'Different games. Connected questions.'}</h2><p>{lang==='zh'?'从玩家经历出发，把看见的问题带进创作。选择星点，看看这些联系。':'What I notice as a player informs what I make. Select a star to follow the connection.'}</p></header>
  <Tabs value={active} onValueChange={value=>setActive(String(value))} className="about-star-tabs">
   <div className="about-star-map">
    <svg className="about-star-lines" viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true"><path className="about-star-path-base" d="M 100 130 C 180 130 210 65 300 65 S 425 115 500 115"/><path className="about-star-path" pathLength="1" d="M 100 130 C 180 130 210 65 300 65 S 425 115 500 115"/></svg>
    <TabsList className="about-star-list" aria-label={lang==='zh'?'星轨：游戏经历与创作方向':'Star traces: play and design'}>
     {traces.map((item,index)=><TabsTrigger key={item.id} value={item.id} className="about-star-node"><span className="about-star-dot" aria-hidden="true"><i className="about-star-halo"/></span><span>{t(item.label,lang)}</span><small aria-hidden="true">0{index+1}</small></TabsTrigger>)}
    </TabsList>
    <span className="about-star-caption">SEE · THINK · CREATE</span>
   </div>
   <div className="about-star-reading">{traces.map(item=><TabsContent key={item.id} value={item.id} keepMounted className="about-star-panel"><span className="eyebrow">{item.tag}</span><h3>{t(item.title,lang)}</h3><p>{t(item.body,lang)}</p>{item.href&&<a href={`/${lang}/${item.href}`}>{t(item.link,lang)}</a>}</TabsContent>)}</div>
  </Tabs>
 </section>;
}
