'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,ChevronLeft,ChevronRight,Pause,Play,RotateCcw} from 'lucide-react';
import {ResponsiveImage} from './responsive-image';
import {MapDiagram} from './project-visual';
import {t,genreLabels,statusLabels,type Lang,type Project} from '@/lib/types';
import type {ProjectionStage} from '@/lib/projection/runtime';

const worlds:Record<string,{name:string;tag:{zh:string;en:string};steps:{zh:string[];en:string[]}}>={
 'xiaoya-de-jiang':{name:'RIVER / MEMORY',tag:{zh:'一座江城，一段长大的记忆。',en:'A river city. A childhood remembered.'},steps:{zh:['童年起点','沿江寻迹','江城回响'],en:['A childhood begins','Follow the river','The city remembers']}},
 'luanshi-zhiqi':{name:'CITY / COMMAND',tag:{zh:'一令落下，城局随之改变。',en:'One command. A city responds.'},steps:{zh:['令印发令','关系传递','城局响应'],en:['Issue a command','Carry its influence','The city responds']}},
 'wanchao-zhanyu':{name:'LAND / STRATEGY',tag:{zh:'山川划分路径，选择改变战局。',en:'Terrain shapes the route. Choices shape the battle.'},steps:{zh:['中央据点','路径扩散','资源响应'],en:['Central stronghold','Branching routes','Resources respond']}},
};
export function HeroShowcase({projects,lang}:{projects:Project[];lang:Lang}) {
 const games=projects.filter(project=>worlds[project.slug]);
 const [active,setActive]=useState(0),[requested,setRequested]=useState(0);
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[cover,setCover]=useState(false);
 const [reduced,setReduced]=useState(false),[motion,setMotion]=useState({running:false,paused:false,step:-1});
 const root=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const stage=useRef<ProjectionStage|null>(null),tabs=useRef<(HTMLButtonElement|null)[]>([]);
 const latest=useRef(games[0]?.slug),coverRef=useRef(false);
 useEffect(()=>{
  if(!root.current||!canvas.current||!latest.current)return;
  let disposed=false,starting=false,visible=false;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const readPreference=()=>setReduced(preference.matches);readPreference();
  preference.addEventListener('change',readPreference);
  async function start(){
   if(starting||disposed)return;starting=true;
   try{
    const {ProjectionStage}=await import('@/lib/projection/runtime');
    if(disposed||!canvas.current)return;
    stage.current=new ProjectionStage(canvas.current,{
     onCommit:slug=>{if(disposed||slug!==latest.current)return;const i=games.findIndex(p=>p.slug===slug);if(i>=0)setActive(i);},
     onReady:()=>{if(!disposed){setReady(true);setFailed(false);}},
     onFailure:()=>{if(!disposed){setReady(false);setFailed(true);}},
     onMotion:state=>{if(!disposed)setMotion(state);},
    });
    stage.current.setVisible(visible);stage.current.setEnabled(!coverRef.current);
    if(latest.current)void stage.current.select(latest.current);
   }catch{if(!disposed){setFailed(true);setReady(false);}}
  }
  const observer=new IntersectionObserver(entries=>{
   visible=entries[0].isIntersecting;
   if(visible)void start();stage.current?.setVisible(visible);
  },{rootMargin:'160px'});observer.observe(root.current);
  return()=>{disposed=true;observer.disconnect();preference.removeEventListener('change',readPreference);stage.current?.dispose();stage.current=null;};
 // The homepage supplies a fixed, ordered project collection for each locale.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 if(!games.length)return null;
 const current=games[active],world=worlds[current.slug],pending=active!==requested;
 const showArtwork=cover||failed||!ready;
 const copy=(zh:string,en:string)=>lang==='zh'?zh:en;
 function select(index:number,focus=false){
  latest.current=games[index].slug;setRequested(index);
  if(coverRef.current||!stage.current)setActive(index);
  if(stage.current)void stage.current.select(games[index].slug);
  if(focus)tabs.current[index]?.focus();
 }
 function toggleCover(){
  const next=!coverRef.current;coverRef.current=next;setCover(next);stage.current?.setEnabled(!next);
  if(next)setActive(requested);else if(latest.current)void stage.current?.select(latest.current);
 }
 return <div ref={root} className="world-showcase" data-world={current.slug} data-pending={pending||undefined}>
  <div className="world-heading"><span>SELECTED WORLDS <i>/</i> 2026</span><span>{copy('从一个想法，到可探索的世界','From an idea to an explorable world')}</span></div>
  <div id="world-panel" role="tabpanel" aria-labelledby={`world-tab-${active}`} aria-busy={pending} className="world-panel">
   <div className="world-copy" key={current.slug}>
    <p className="world-kicker"><span>{String(active+1).padStart(2,'0')}</span>{t(genreLabels[current.genre],lang)}</p>
    <h3>{t(current.name,lang)}</h3>
    <p className="world-tagline">{t(world.tag,lang)}</p>
    <p className="world-summary">{t(current.summary,lang)}</p>
    <dl className="world-meta"><div><dt>{copy('我的职责','MY ROLE')}</dt><dd>{t(current.role,lang)}</dd></div><div><dt>{copy('项目状态','STATUS')}</dt><dd><i/>{t(statusLabels[current.status],lang)||current.status}</dd></div></dl>
    <a className="world-project-link" href={`/${lang}/projects/${current.slug}`}>{copy('探索项目','Explore project')}<ArrowUpRight size={17}/></a>
   </div>
   <div className="world-art">
    <div className="world-art-top"><span>{world.name}</span><button type="button" aria-pressed={cover} onClick={toggleCover}>{cover?copy('主题投影','View projection'):copy('查看项目原图','View project artwork')}</button></div>
    <div className="world-projection">
     <canvas ref={canvas} className="world-canvas" style={{visibility:showArtwork?'hidden':'visible'}} tabIndex={showArtwork?-1:0} aria-label={copy(`${t(current.name,lang)}主题投影。左右拖动环绕，上下拖动俯仰；也可使用四方向键，Home 键复位。`,`${t(current.name,lang)} thematic projection. Drag horizontally to orbit and vertically to tilt, or use all four arrow keys. Home resets the view.`)}/>
     {showArtwork&&<div className="world-fallback">{current.cover?<ResponsiveImage src={current.cover} alt={t(current.coverAlt??current.name,lang)} sizes="(max-width: 760px) 90vw, 60vw"/>:<MapDiagram lang={lang}/>}<span>{cover?copy('项目原图','Project artwork'):failed?copy('当前设备使用静态预览','Static preview on this device'):copy('正在呈现主题场景','Preparing the scene')}</span></div>}
     <div className="world-art-coordinate" aria-hidden="true"><span>0{active+1}</span><span>W / {String(games.length).padStart(2,'0')}</span></div>
    </div>
    <div className="world-art-bottom"><span>{cover?copy('作品资料','Project materials'):copy('主题场景 · 展示设计','Thematic scene · Portfolio interpretation')}</span>{!showArtwork&&<span>{copy('三维拖动 / ← → ↑ ↓','Drag to orbit / ← → ↑ ↓')}</span>}</div>
   </div>
  </div>
  <div className="world-sequence">
   <div className="world-steps" aria-label={copy('场景动效阶段','Scene animation stages')}>{world.steps[lang].map((step,i)=><span key={step} data-active={motion.step===i&&!showArtwork||undefined}><b>0{i+1}</b>{step}</span>)}</div>
   <div className="world-actions">
    {!showArtwork&&!reduced&&<button type="button" className="world-play" onClick={()=>motion.running?stage.current?.togglePause():stage.current?.play()}>{motion.running&&!motion.paused?<Pause size={13}/>:<Play size={13}/>} {motion.running?(motion.paused?copy('继续演示','Resume'):copy('暂停演示','Pause')):copy('播放场景演示','Play scene')}</button>}
    {!showArtwork&&<button type="button" className="world-reset" aria-label={copy('重置场景视角','Reset scene view')} onClick={()=>stage.current?.resetView()}><RotateCcw size={14}/></button>}
    {reduced&&!showArtwork&&<span className="world-static-label">{copy('静态浏览模式','Reduced motion')}</span>}
   </div>
  </div>
  <div className="world-navigation">
   <div className="world-tabs" role="tablist" aria-label={copy('选择游戏项目','Choose a game project')}>
    {games.map((project,i)=><button key={project.slug} ref={el=>{tabs.current[i]=el;}} type="button" role="tab" id={`world-tab-${i}`} aria-controls="world-panel" aria-selected={requested===i} tabIndex={requested===i?0:-1} onClick={()=>select(i)} onKeyDown={event=>{let next=i;if(event.key==='ArrowRight')next=(i+1)%games.length;else if(event.key==='ArrowLeft')next=(i+games.length-1)%games.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=games.length-1;else return;event.preventDefault();select(next,true);}}><span>0{i+1}</span><strong>{t(project.name,lang)}</strong><small>{worlds[project.slug].name}</small></button>)}
   </div>
   <div className="world-arrows"><button type="button" aria-label={copy('上一个游戏','Previous game')} onClick={()=>select((requested+games.length-1)%games.length)}><ChevronLeft size={18}/></button><button type="button" aria-label={copy('下一个游戏','Next game')} onClick={()=>select((requested+1)%games.length)}><ChevronRight size={18}/></button></div>
  </div>
 </div>;
}
