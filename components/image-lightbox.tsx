'use client';
import {Expand} from 'lucide-react';
import {Dialog,DialogTrigger,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
export function ImageLightbox({src,alt,caption}:{src:string;alt:string;caption:string}){return <figure className="article-figure"><Dialog><DialogTrigger className="image-zoom" aria-label={`放大图片 / Enlarge: ${alt}`}><img src={src} alt={alt} loading="lazy" width="1280" height="720"/><span><Expand size={17}/></span></DialogTrigger><DialogContent className="lightbox"><DialogTitle>{alt}</DialogTitle><img src={src} alt={alt}/><DialogDescription>{caption}</DialogDescription></DialogContent></Dialog><figcaption>{caption}</figcaption></figure>}
