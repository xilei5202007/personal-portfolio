'use client';
import {ResponsiveImage} from './responsive-image';
import {useRef,useState} from 'react';
import {Expand,ZoomIn,Minimize2,X,ArrowUpRight} from 'lucide-react';
import {Dialog,DialogTrigger,DialogContent,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';
import type {Lang} from '@/lib/types';
export function ImageLightbox({src,alt,caption,long=false,lang='zh'}:{src:string;alt:string;caption:string;long?:boolean;lang?:Lang}){
 const [zoomed,setZoomed]=useState(false),[loading,setLoading]=useState(true),[failed,setFailed]=useState(false);
 const viewport=useRef<HTMLDivElement>(null);
 const text=(zh:string,en:string)=>lang==='zh'?zh:en;
 return <figure className={`article-figure${long?' sequence-figure':''}`}><Dialog onOpenChange={open=>{if(open){setZoomed(false);setLoading(true);setFailed(false)}}}>
  <DialogTrigger className="image-zoom" aria-label={`${text('放大图片','Enlarge')}: ${alt}`}><ResponsiveImage src={src} alt={alt} loading="lazy" sizes="(max-width: 850px) 92vw, 65vw"/><span><Expand size={17}/></span></DialogTrigger>
  <DialogContent className="lightbox image-viewer" showCloseButton={false}>
   <div className="viewer-toolbar"><DialogTitle>{text('图片预览','Image preview')}</DialogTitle><div><button type="button" onClick={()=>{setZoomed(value=>!value);viewport.current?.scrollTo(0,0)}} aria-pressed={zoomed} aria-label={text(zoomed?'适应窗口':'查看原始尺寸',zoomed?'Fit to window':'View actual size')}>{zoomed?<Minimize2 size={18}/>:<ZoomIn size={18}/>}<span>{zoomed?text('适应窗口','Fit'): '100%'}</span></button><a href={src} target="_blank" rel="noreferrer" aria-label={text('打开原图','Open original')}><ArrowUpRight size={18}/><span>{text('原图','Original')}</span></a><DialogClose aria-label={text('关闭图片','Close image')}><X size={20}/></DialogClose></div></div>
   <div ref={viewport} className={`viewer-canvas${zoomed?' is-zoomed':''}${long?' is-long':''}`} tabIndex={0} role="region" aria-label={text('图片区域，可滚动查看','Image area, scroll to explore')}>
    {loading&&<p role="status">{text('正在加载高清图片…','Loading full-resolution image…')}</p>}
    {failed&&<p role="status">{text('图片暂时无法显示，请尝试打开原图。','The image could not load. Try opening the original.')}</p>}
    <img src={src} alt={alt} onLoad={()=>setLoading(false)} onError={()=>{setLoading(false);setFailed(true)}}/>
   </div>
   <DialogDescription className="viewer-caption">{caption}</DialogDescription>
  </DialogContent>
 </Dialog><figcaption>{caption}</figcaption></figure>
}
