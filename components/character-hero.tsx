import {ArrowDown,ArrowUpRight,Download} from 'lucide-react';
import {BrandArt} from './brand-identity';
import type {Lang} from '@/lib/types';

export function CharacterHero({lang,resumeUrl}:{lang:Lang;resumeUrl?:string}) {
 const zh=lang==='zh';
 return <section className="character-hero" aria-labelledby="character-home-title">
  <picture className="character-hero-scene" aria-hidden="true"><source media="(max-width:700px)" srcSet="/images/character/home-scene-small.webp" type="image/webp"/><source srcSet="/images/character/home-scene.webp" type="image/webp"/><img src="/images/character/home-scene.png" alt="" width="1920" height="1080" fetchPriority="high" decoding="async"/></picture>
  <div className="character-hero-top"><span>PERSONAL WORLD / T1AR</span><span>GAME DESIGN · 2026</span></div>
  <div className="character-hero-content">
   <p className="character-hero-prelude">{zh?'将过去留下的痕迹，化作继续向前的光。':'Trace the past. Create the next.'}</p>
   <h1 id="character-home-title"><span className="sr-only">{zh?'昔泪 T1ar · 章锦霖的游戏策划作品集':'T1ar · Jinlin Zhang’s Game Design Portfolio'}</span><span aria-hidden="true"><BrandArt kind="calligraphy" priority/></span></h1>
   <p className="character-hero-motto">{zh?'以游戏为界，以创意为光。':'More than a player. A creator.'}</p>
   <p className="character-hero-description">{zh?'我是章锦霖，武汉理工大学在读，寻求游戏策划实习。\n关注玩法、系统与叙事交互，把构想推进到可玩作品。':'I’m Jinlin Zhang, a game design student at Wuhan University of Technology seeking an internship. I turn gameplay, systems and narrative ideas into playable work.'}</p>
   <div className="character-hero-actions"><a className="button" href={`/${lang}/projects`}>{zh?'进入我的作品':'Explore my work'}<ArrowUpRight size={18}/></a><a className="button secondary" href={resumeUrl??`/${lang}/resume`} download={resumeUrl?true:undefined}>{zh?(resumeUrl?'下载简历':'查看简历'):(resumeUrl?'Download resume':'View resume')}<Download size={16}/></a></div>
  </div>
  <div className="character-hero-bottom"><span>{zh?'看见 · 思考 · 创造':'SEE · THINK · CREATE'}</span><a href="#selected">{zh?'向下探索':'Explore below'}<ArrowDown size={15}/></a><span>{zh?'世界很大，而我仍在向前。':'The world is vast. I’m moving forward.'}</span></div>
 </section>;
}
