import type {ComponentProps} from 'react';
import variants from '@/content/image-variants.json';

type Variant = {width:number;height:number;variants:{src:string;width:number;bytes:number}[]};
export function ResponsiveImage({src,alt='',sizes='(max-width: 850px) 100vw, 75vw',...props}:ComponentProps<'img'> & {src:string}) {
  const image = (variants as Record<string,Variant>)[src];
  if (!image) return <img src={src} alt={alt} decoding="async" sizes={sizes} {...props}/>;
  return <img {...props} alt={alt} src={image.variants.at(-1)!.src}
    srcSet={image.variants.map(v=>`${v.src} ${v.width}w`).join(', ')} sizes={sizes}
    width={image.width} height={image.height} decoding="async"/>;
}
