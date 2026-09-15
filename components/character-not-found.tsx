'use client';

import {usePathname} from 'next/navigation';
import {ArrowLeft,ArrowUpRight} from 'lucide-react';
import {BrandArt} from './brand-identity';

export function CharacterNotFound() {
 const path=usePathname();
 const lang=path?.startsWith('/en')?'en':'zh',zh=lang==='zh';
 return <main id="main" className="character-lost">
  <picture className="character-lost-scene" aria-hidden="true"><source media="(max-width:700px)" srcSet="/images/character/lost-scene-small.webp" type="image/webp"/><source srcSet="/images/character/lost-scene.webp" type="image/webp"/><img src="/images/character/lost-scene.png" alt="" width="1920" height="1080" fetchPriority="high" decoding="async"/></picture>
  <div className="character-lost-content"><span className="eyebrow">OFF THE MAP / A MOMENT OF REST</span><span className="character-lost-number" aria-hidden="true">404</span><h1>{zh?'迷路了吗？':'Lost your way?'}</h1><p>{zh?'没关系，前方依然有光。':'It’s all right. There’s still light ahead.'}</p><p className="character-lost-description">{zh?'这一页暂时没有找到。陪我歇一会儿，再一起出发。':'This page wasn’t found. Rest here a moment, then let’s keep going.'}</p><div className="character-lost-actions"><a href={`/${lang}`} className="button"><ArrowLeft size={17}/>{zh?'返回首页':'Back home'}</a><a href={`/${lang}/projects`} className="text-link">{zh?'去看看作品':'Explore the work'}<ArrowUpRight size={17}/></a></div></div>
  <div className="character-lost-note"><BrandArt kind="signature"/><p>{zh?'或许只是一道微小的光，\n但也足以照亮自己前行的路。':'Maybe it’s just a small light.\nBut it’s enough to illuminate my own way forward.'}</p></div>
 </main>;
}
