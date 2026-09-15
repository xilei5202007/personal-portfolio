import type {CSSProperties} from 'react';
import type {Lang} from '@/lib/types';

// Display windows on the approved boards. No redraw or alteration of the artwork.
const crops={
 symbol:{src:'logo-board',width:1536,height:1024,x:804,y:80,w:144,h:150},
 seal:{src:'logo-board',width:1536,height:1024,x:55,y:66,w:394,h:365},
 primary:{src:'logo-board',width:1536,height:1024,x:522,y:95,w:246,h:138},
 signature:{src:'logo-board',width:1536,height:1024,x:752,y:278,w:181,h:83},
 wordmark:{src:'logo-board',width:1536,height:1024,x:532,y:293,w:174,h:65},
 horizontal:{src:'logo-board',width:1536,height:1024,x:521,y:426,w:222,h:87},
 vertical:{src:'logo-board',width:1536,height:1024,x:797,y:416,w:129,h:129},
} as const;
export function BrandArt({kind,className='',alt='',priority=false}:{kind:keyof typeof crops;className?:string;alt?:string;priority?:boolean}){
 const c=crops[kind];
 const style:CSSProperties={aspectRatio:`${c.w}/${c.h}`};
 const imageStyle:CSSProperties={width:`${c.width/c.w*100}%`,height:`${c.height/c.h*100}%`,left:`${-c.x/c.w*100}%`,top:`${-c.y/c.h*100}%`};
 return <span className={`brand-art brand-art-${kind} ${className}`} style={style}><img src={`/brand/${c.src}.webp`} alt={alt} style={imageStyle} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'} decoding="async" width={c.width} height={c.height}/></span>;
}
export function BrandMark(){return <span className="brand-lockup brand-lockup-approved"><BrandArt kind="horizontal"/></span>}
export function BrandPageMark(){return <div className="brand-page-mark" aria-hidden="true"><BrandArt kind="wordmark"/><span/><small>TRACE THE PAST · CREATE THE NEXT</small></div>}
export function BrandSignature(){return <span className="brand-footer-signature"><BrandArt kind="signature"/><small>SEE · THINK · CREATE</small></span>}
export function IdentityEmblem({lang}:{lang:Lang}){return <div className="identity-emblem"><BrandArt kind="seal" priority alt={lang==='zh'?'昔泪 T1ar 星光标志':'T1ar starlight emblem'}/><span className="emblem-caption">{lang==='zh'?'看见 · 思考 · 创造':'SEE · THINK · CREATE'}</span></div>}
export function IdentitySection({lang}:{lang:Lang}){const zh=lang==='zh';const variants=[['primary','主标志','PRIMARY'],['symbol','星光符号','SYMBOL'],['wordmark','文字标志','WORDMARK'],['signature','签名标志','SIGNATURE'],['horizontal','横版组合','HORIZONTAL'],['vertical','竖版组合','VERTICAL']] as const;return <section className="identity-section"><div className="identity-extensions identity-family">{variants.map(([kind,cn,en])=><div key={kind}><BrandArt kind={kind} alt={`T1ar ${zh?cn:en.toLowerCase()}`}/><span>{zh?cn:en}</span></div>)}</div><div className="identity-story"><span className="eyebrow">TRACE THE PAST. CREATE THE NEXT.</span><h2>{zh?'将过去留下的痕迹，\n化作继续向前的光。':'Carry the past.\nCreate what comes next.'}</h2><p>{zh?'「昔泪 T1ar」是我的个人创作标识。数字 1、星光、轨迹与斩线，连接起独特的起点、探索的方向与行动的锋芒。':'T1ar is my creative identity. The number 1, starlight, an orbit and a sharp stroke bring together a distinct starting point, exploration and action.'}</p></div></section>}
