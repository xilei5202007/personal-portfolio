'use client';
import {ResponsiveImage} from './responsive-image';
import {Expand} from 'lucide-react';
import {Dialog,DialogTrigger,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
export function ImageLightbox({src,alt,caption,long=false}:{src:string;alt:string;caption:string;long?:boolean}){return <figure className={`article-figure${long?' sequence-figure':''}`}><Dialog><DialogTrigger className="image-zoom" aria-label={`放大图片 / Enlarge: ${alt}`}><ResponsiveImage src={src} alt={alt} loading="lazy" sizes="(max-width: 850px) 92vw, 65vw"/><span><Expand size={17}/></span></DialogTrigger><DialogContent className={`lightbox${long?' lightbox-long':''}`}><DialogTitle>{alt}</DialogTitle><img src={src} alt={alt}/><DialogDescription>{caption}</DialogDescription><a className="text-link" href={src} target="_blank" rel="noreferrer">打开原图 / Open original ↗</a></DialogContent></Dialog><figcaption>{caption}</figcaption></figure>}
