import {PdfPreview} from './pdf-preview';
import {ArrowUpRight,Download} from 'lucide-react';
import files from '@/content/downloads.json';
import {t,type Lang,type Bilingual} from '@/lib/types';
export type DownloadFile={id:string;group:string;title:Bilingual;url:string;size:string;version:string;updatedAt:string;format?:string};
export const downloads=files as DownloadFile[];
export function Downloads({group,lang,preview=false}:{group:string;lang:Lang;preview?:boolean}){const items=downloads.filter(f=>f.group===group);if(!items.length)return null;return <section className="downloads" id="downloads"><div className="section-top"><span className="eyebrow">DOCUMENTS</span><h2>{lang==='zh'?'把设计带走。':'Take a closer look.'}</h2></div>{items.map(f=><div className="download-row" key={f.id}><div><strong>{t(f.title,lang)}</strong><p>{f.format??'PDF'} · {f.version} · {f.size} · {f.updatedAt}</p></div><div className="download-actions"><a href={f.url} target="_blank" rel="noreferrer">{lang==='zh'?'打开':'Open'}<ArrowUpRight size={17}/></a><a className="button secondary" href={f.url} download>{lang==='zh'?'下载':'Download'}<Download size={17}/></a></div></div>)}{preview&&items.some(f=>!f.format||f.format==='PDF')&&<PdfPreview url={items.find(f=>!f.format||f.format==='PDF')!.url} title={t(items.find(f=>!f.format||f.format==='PDF')!.title,lang)} lang={lang}/>}</section>}
