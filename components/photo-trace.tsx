'use client';

import {useRef,useState} from 'react';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {ResponsiveImage} from './responsive-image';
import {useMotion,motionConditions} from '@/lib/motion';
import {t,type Lang} from '@/lib/types';

const notes=[
 {id:'story',label:{zh:'故事片段',en:'Story'},title:{zh:'用一堂课，让成长有了日常的重量。',en:'An ordinary lesson, a moment of growing up.'},body:{zh:'课堂处在童年与求学的叙事段落中。相较于直接交代时间，课桌、书本和老师的话，让玩家先认识小伢所处的日常。',en:'The classroom belongs to the childhood and school chapter. A desk, books and the teacher’s words place the child in an everyday setting before the story moves forward.'}},
 {id:'frame',label:{zh:'画面取舍',en:'Framing'},title:{zh:'同一个场景，不必是同一帧。',en:'The same scene, not the same frame.'},body:{zh:'草稿先留下正面课桌与人物的关系；27 格方案第 15 格进一步细化课堂情境。右侧试玩页画面保留这一场景，人物表情和构图有所变化，因此采用并列观看。',en:'The draft establishes the child and desk from the front. Panel 15 of the scene plan develops the classroom setting. The playable-page image revisits that scene with a different expression and composition, so the images are shown side by side.'}},
 {id:'role',label:{zh:'我的工作',en:'My role'},title:{zh:'把故事，组织成可以制作的镜头。',en:'Organizing a story into scenes the team can make.'},body:{zh:'我主导全部分镜策划，参与故事设计、交互设计和关卡制作。这里展示分镜与场景的关联；成品中的程序和美术是团队共同制作的成果。',en:'I led the storyboarding and contributed to story design, interaction design and level production. This comparison shows how the scenes connect; the finished programming and artwork are team contributions.'}},
];

export function PhotoTrace({lang}:{lang:Lang}){
 const root=useRef<HTMLElement>(null);
 const [active,setActive]=useState('story');
 useMotion(({gsap})=>{
  const mm=gsap.matchMedia();
  mm.add(motionConditions,context=>{
   if(context.conditions?.reduce)return;
   const select=gsap.utils.selector(root);
   gsap.timeline({scrollTrigger:{trigger:root.current,start:'top 88%',once:true}})
    .from(select('.photo-trace-finished'),{y:14,opacity:.7,duration:.65,ease:'power2.out',clearProps:'transform,opacity'})
    .fromTo(select('.photo-memory-light'),{scaleX:0,opacity:.8},{scaleX:1,opacity:0,duration:.85,ease:'power2.out'},.12);
  });
  return()=>mm.revert();
 },{scope:root});
 useMotion(({gsap})=>{
  const mm=gsap.matchMedia();
  mm.add(motionConditions,context=>{
   if(context.conditions?.reduce)return;
   gsap.from(root.current?.querySelectorAll('.photo-trace-note:not([hidden]):not([inert]) > *')??[],{opacity:.65,y:5,duration:.3,stagger:.025,clearProps:'opacity,transform'});
  });
  return()=>mm.revert();
 },{scope:root,dependencies:[active]});
 return <section ref={root} id="photo-trace" className="photo-trace" aria-labelledby="photo-trace-title">
  <header className="trace-section-heading"><span className="eyebrow">T1AR / TRACE 02</span><h2 id="photo-trace-title">{lang==='zh'?'留一张照片，讲一段成长。':'A photograph. A moment of growing up.'}</h2><p>{lang==='zh'?'从课堂分镜到试玩页画面，看看一个日常片段如何被留下。':'From a classroom storyboard to the playable-page image: how an everyday moment takes shape.'}</p></header>
  <div className="photo-trace-pair">
   <figure className="photo-trace-draft"><span className="photo-trace-overline">01 / {lang==='zh'?'分镜草稿':'STORYBOARD'}</span><a className="photo-trace-crop" href="/images/xiaoya-de-jiang/emotion-storyboard.jpg" target="_blank" rel="noreferrer" aria-label={lang==='zh'?'查看完整情绪分镜草稿（新标签页）':'Open the complete storyboard (new tab)'}><img src="/images/xiaoya-de-jiang/emotion-storyboard.jpg" alt={lang==='zh'?'草稿第 09 格：小孩在课桌前的正面构图':'Draft panel 09: a front view of the child at a school desk'} width="854" height="638" loading="lazy"/></a><figcaption>{lang==='zh'?'课堂片段 · 草稿 09 格':'Classroom · Draft panel 09'}</figcaption><p>{lang==='zh'?'先确定人物、课桌和镜头的关系。':'First, establish the child, the desk and the camera.'}</p><a className="photo-trace-source" href="/images/xiaoya-de-jiang/emotion-storyboard.jpg" target="_blank" rel="noreferrer">{lang==='zh'?'查看完整草稿':'View the complete draft'}</a></figure>
   <figure className="photo-trace-finished"><span className="photo-trace-overline">02 / {lang==='zh'?'试玩页课堂画面':'CLASSROOM IMAGE'}</span><a href="/images/xiaoya-de-jiang/cover.png" target="_blank" rel="noreferrer" aria-label={lang==='zh'?'查看课堂画面原图（新标签页）':'Open the original classroom image (new tab)'}><ResponsiveImage src="/images/xiaoya-de-jiang/cover.png" alt={lang==='zh'?'小伢坐在课桌前，周围出现老师的话，右下角有“点一下”提示':'The child at a school desk, with the teacher’s words and a click prompt'} width="1875" height="1080" sizes="(max-width:850px) 88vw, 55vw" loading="lazy"/><i className="photo-memory-light" aria-hidden="true"/></a><figcaption>{lang==='zh'?'试玩页素材 · 点击画面查看原图':'Playable-page material · Select the image to view the original'}</figcaption></figure>
  </div>
  <Tabs className="photo-trace-notes" value={active} onValueChange={value=>setActive(String(value))}><TabsList className="photo-trace-note-tabs" aria-label={lang==='zh'?'留影：查看设计说明':'Photograph: explore the design notes'}>{notes.map(item=><TabsTrigger key={item.id} value={item.id}>{t(item.label,lang)}</TabsTrigger>)}</TabsList>{notes.map(item=><TabsContent key={item.id} value={item.id} keepMounted className="photo-trace-note"><h3>{t(item.title,lang)}</h3><p>{t(item.body,lang)}</p></TabsContent>)}</Tabs>
  <footer className="photo-trace-footer"><span>{lang==='zh'?'过程材料与团队成品并列呈现。':'Process material alongside the team’s finished scene.'}</span><a href="#interaction">{lang==='zh'?'继续阅读完整场景编排':'Continue to the full scene sequence'}</a></footer>
 </section>;
}
