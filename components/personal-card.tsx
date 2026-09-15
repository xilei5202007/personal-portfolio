'use client';

import {useState} from 'react';
import {ArrowUpRight,RotateCw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {BrandArt} from './brand-identity';
import profile from '@/content/profile.json';
import type {Lang} from '@/lib/types';

export function PersonalCard({lang}:{lang:Lang}) {
 const [back,setBack]=useState(false);
 const zh=lang==='zh';
 return <section className="personal-card-section" aria-labelledby="personal-card-title">
  <div className="personal-card-copy">
   <span className="eyebrow">A SMALL INTRODUCTION</span>
   <h2 id="personal-card-title">{zh?'一张名片，\n认识昔泪。':'A card.\nAn introduction.'}</h2>
   <p>{zh?'以游戏为界，以创意为光。':'More than a player. A creator.'}</p>
   <Button variant="outline" className="personal-card-toggle" onClick={()=>setBack(!back)} aria-pressed={back} aria-controls="personal-card-faces"><RotateCw size={16}/>{zh?(back?'查看正面':'翻到背面'):(back?'Show front':'Show reverse')}</Button>
  </div>
  <div className={`personal-card-stage${back?' is-reversed':''}`}>
   <div id="personal-card-faces" className="personal-card-faces">
    <div className="personal-card-face personal-card-front" aria-hidden={back} inert={back}>
     <span className="personal-card-edition">PERSONAL IDENTITY / 2026</span>
     <div className="personal-card-orbit" aria-hidden="true"/>
     <BrandArt kind="vertical" alt="昔泪 T1ar"/>
     <span className="personal-card-motto">TRACE THE PAST<br/>CREATE THE NEXT</span>
     <span className="personal-card-corner" aria-hidden="true">01 / T1AR</span>
    </div>
    <div className="personal-card-face personal-card-back" aria-hidden={!back} inert={!back}>
     <div className="personal-card-heading"><div><h3>{profile.name[lang]}</h3><p>{profile.role[lang]} / T1ar</p></div><BrandArt kind="symbol"/></div>
     <div className="personal-card-contact"><span>{zh?'武汉理工大学 · 武汉':'Wuhan University of Technology'}</span><a href={`mailto:${profile.email}`}>{profile.email}<ArrowUpRight size={15}/></a><a href={`/${lang}/contact`}>{zh?'联系与合作':'Get in touch'}<ArrowUpRight size={15}/></a></div>
     <div className="personal-card-signoff"><BrandArt kind="signature"/><span>SEE · THINK · CREATE</span></div>
    </div>
   </div>
  </div>
 </section>;
}
