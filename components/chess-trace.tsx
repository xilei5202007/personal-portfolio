'use client';

import {useId,useRef,useState,type KeyboardEvent} from 'react';
import {ArrowDownRight} from 'lucide-react';
import {t,type Lang,type Section} from '@/lib/types';

const moves = [
 {id:'design',stone:'谋',label:{zh:'设计目标',en:'Design goal'},title:{zh:'让每次选择，都能读懂局势。',en:'Make the next decision legible.'},path:'M 16 78 H 26 V 34 H 48',x:26,y:34,steps:{zh:['观察城池与人物','安排指令优先级','回合结算与反馈'],en:['Read cities and relationships','Prioritize orders','Resolve the turn']}},
 {id:'npc',stone:'衡',label:{zh:'关键取舍',en:'Key decision'},title:{zh:'对话有自由，后果有规则。',en:'Free expression. Structured consequences.'},path:'M 16 78 H 26 V 34 H 52 V 62 H 76',x:52,y:62,steps:{zh:['AI NPC 承载表达','人物关系与状态流转','确定性系统承接行为'],en:['AI carries expression','Relationships and state','Rules structure actions']}},
 {id:'ownership',stone:'成',label:{zh:'我的贡献',en:'My contribution'},title:{zh:'从策划推演，到可以游玩。',en:'From a design idea to a playable game.'},path:'M 16 78 H 26 V 34 H 52 V 62 H 78 V 26 H 88',x:78,y:26,steps:{zh:['玩法与核心系统策划','大地图、指令与对话前端','协作推进与现场路演'],en:['Gameplay and core systems','Map, orders and dialogue UI','Team coordination and presentation']}}
] as const;

export function ChessTrace({lang,sections}:{lang:Lang;sections:Section[]}) {
 const zh=lang==='zh';
 const uid=useId();
 const [active,setActive]=useState(0);
 const buttons=useRef<(HTMLButtonElement|null)[]>([]);
 const move=moves[active];
 function onKey(event:KeyboardEvent<HTMLButtonElement>,index:number) {
  let next=index;
  if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%moves.length;
  else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index+moves.length-1)%moves.length;
  else if(event.key==='Home')next=0;
  else if(event.key==='End')next=moves.length-1;
  else return;
  event.preventDefault();setActive(next);buttons.current[next]?.focus();
 }
 return <section className="chess-trace" id="chess-trace" aria-labelledby={`${uid}-heading`}>
  <header className="chess-trace-heading">
   <div><span className="chess-trace-kicker">T1AR / TRACE 01</span><h2 id={`${uid}-heading`}>{zh?'落子之痕':'The trace of a move'}</h2><p>{zh?'我在这个世界留下一子，把设计的思考留在棋局里。':'I leave a stone in this world, and the thinking behind it on the board.'}</p></div>
   <span className="chess-trace-index" aria-hidden="true">01 — 03</span>
  </header>
  <div className="chess-trace-layout">
   <div className="chess-trace-surface">
    <div className="chess-trace-author"><img src="/images/character/home-scene-small.webp" alt="" width="960" height="540" loading="lazy"/><span><strong>{zh?'昔泪留下的棋子':'A stone left by T1ar'}</strong><small>{zh?'选择一枚，展开它承载的设计。':'Choose a stone to explore its design.'}</small></span></div>
    <div className="chess-trace-board" role="tablist" aria-label={zh?'落子之痕：选择设计主题':'Design traces: choose a topic'}>
     <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="chess-trace-lines">
      <path className="chess-trace-possible" d="M 16 78 H 26 V 34 H 52 V 62 H 78 V 26 H 88"/>
      <path key={move.id} className="chess-trace-route" d={move.path} pathLength="1"/>
      <circle cx="16" cy="78" r="1.1"/>
     </svg>
     {moves.map((item,i)=><button type="button" role="tab" id={`${uid}-tab-${i}`} aria-controls={`${uid}-panel-${i}`} aria-selected={active===i} tabIndex={active===i?0:-1} key={item.id} ref={el=>{buttons.current[i]=el}} onClick={()=>setActive(i)} onKeyDown={e=>onKey(e,i)} className={`chess-trace-node${active===i?' is-selected':''}`} style={{left:`${item.x}%`,top:`${item.y}%`}}>
      <span className="chess-trace-stone" aria-hidden="true">{item.stone}</span><span className="chess-trace-node-label">{t(item.label,lang)}</span>
     </button>)}
     <span className="chess-trace-origin" aria-hidden="true">{zh?'起念':'ORIGIN'}</span>
    </div>
    <p className="chess-trace-board-note">{zh?'设计思路示意 · 点击棋子或用方向键切换':'Design map · Select a stone or use arrow keys'}</p>
   </div>
   <div className="chess-trace-reading">
    {moves.map((item,i)=><div key={item.id} role="tabpanel" id={`${uid}-panel-${i}`} aria-labelledby={`${uid}-tab-${i}`} hidden={active!==i} tabIndex={0} className="chess-trace-panel">
     <span className="chess-trace-panel-index">0{i+1} / {t(item.label,lang)}</span>
     <h3>{t(item.title,lang)}</h3>
     <ol className="chess-trace-steps">{item.steps[lang].map((step,n)=><li key={step}><span aria-hidden="true">0{n+1}</span>{step}</li>)}</ol>
     <p>{t(sections.find(s=>s.id===item.id)?.paragraphs[0],lang)}</p>
     <a href={`#${item.id}`}>{zh?'阅读完整设计记录':'Read the full design notes'}<ArrowDownRight size={18}/></a>
    </div>)}
   </div>
  </div>
  <footer className="chess-trace-footer"><span>{zh?'角色留下痕迹，作品记录我的贡献。':'The character leaves a trace. The work records my contribution.'}</span><span aria-live="polite" aria-atomic="true">{zh?'当前落子：':'Current move: '}{t(move.label,lang)}</span></footer>
 </section>;
}
