import type {CSSProperties} from 'react';
import type {Lang} from '@/lib/types';

// Display windows on the approved boards. No redraw or alteration of the artwork.
const crops={
 symbol:{src:'logo-board',width:1536,height:1024,x:804,y:80,w:144,h:150},
 seal:{src:'logo-board',width:1536,height:1024,x:55,y:66,w:394,h:365},
 primary:{src:'logo-board',width:1536,height:1024,x:522,y:95,w:246,h:138},
 signature:{src:'logo-board',width:1536,height:1024,x:752,y:278,w:181,h:83},
} as const;
export function BrandArt({kind,className='',alt='',priority=false}:{kind:keyof typeof crops;className?:string;alt?:string;priority?:boolean}){
 const c=crops[kind];
 const style:CSSProperties={aspectRatio:`${c.w}/${c.h}`};
 const imageStyle:CSSProperties={width:`${c.width/c.w*100}%`,height:`${c.height/c.h*100}%`,left:`${-c.x/c.w*100}%`,top:`${-c.y/c.h*100}%`};
 return <span className={`brand-art brand-art-${kind} ${className}`} style={style}><img src={`/brand/${c.src}.webp`} alt={alt} style={imageStyle} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'} decoding="async" width={c.width} height={c.height}/></span>;
}
export function BrandMark(){return <span className="brand-lockup"><BrandArt kind="symbol"/><span className="brand-word"><strong>T1AR</strong><small>昔泪</small></span></span>}
export function IdentityEmblem({lang}:{lang:Lang}){return <div className="identity-emblem"><BrandArt kind="seal" priority alt={lang==='zh'?'昔泪 T1ar 星光标志':'T1ar starlight emblem'}/><span className="emblem-caption">{lang==='zh'?'看见 · 思考 · 创造':'SEE · THINK · CREATE'}</span></div>}
export function IdentitySection({lang}:{lang:Lang}){const zh=lang==='zh';return <section className="identity-section"><div className="identity-extensions"><div><BrandArt kind="primary" alt="T1ar primary logo"/><span>{zh?'主标志':'PRIMARY'}</span></div><div><BrandArt kind="symbol" alt="T1ar symbol"/><span>{zh?'星光符号':'SYMBOL'}</span></div><div><BrandArt kind="signature" alt="T1ar signature"/><span>{zh?'签名标志':'SIGNATURE'}</span></div></div><div className="identity-story"><span className="eyebrow">TRACE THE PAST. CREATE THE NEXT.</span><h2>{zh?'将过去留下的痕迹，\n化作继续向前的光。':'Carry the past.\nCreate what comes next.'}</h2><p>{zh?'「昔泪 T1ar」是我的个人创作标识。数字 1、星光、轨迹与斩线，连接起独特的起点、探索的方向与行动的锋芒。':'T1ar is my creative identity. The number 1, starlight, an orbit and a sharp stroke bring together a distinct starting point, exploration and action.'}</p></div></section>}
