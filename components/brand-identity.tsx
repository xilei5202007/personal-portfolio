import type {CSSProperties} from 'react';
import type {Lang} from '@/lib/types';

// Display windows on the approved boards. No redraw or alteration of the artwork.
const crops={
 calligraphy:{src:'identity-board',width:1312,height:1199,x:324,y:490,w:222,h:157},
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
// Render the supplied marks as silver ink, removing the board's dark paper.
// Source images remain intact; this shared SVG filter supplies transparent edges.
export function BrandInkFilter(){return <svg width="0" height="0" className="brand-ink-definitions" aria-hidden="true" focusable="false"><defs><filter id="t1ar-brand-ink" colorInterpolationFilters="sRGB"><feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="luminance"/><feComponentTransfer in="luminance" result="inkAlpha"><feFuncA type="linear" slope="1.25" intercept="-0.11"/></feComponentTransfer><feFlood floodColor="#e0eaff" result="silver"/><feComposite in="silver" in2="inkAlpha" operator="in"/></filter></defs></svg>}
export function BrandMark(){return <span className="brand-lockup brand-lockup-integrated"><BrandArt kind="symbol"/><span className="brand-word"><strong>T1ar</strong><small>昔泪</small></span></span>}
export function BrandSignature(){return <span className="brand-footer-signature"><BrandArt kind="signature"/></span>}
export function IdentityEmblem({lang}:{lang:Lang}){return <div className="identity-emblem"><BrandArt kind="seal" priority alt={lang==='zh'?'昔泪 T1ar 星光标志':'T1ar starlight emblem'}/><span className="emblem-caption">{lang==='zh'?'看见 · 思考 · 创造':'SEE · THINK · CREATE'}</span></div>}
