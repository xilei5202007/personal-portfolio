import {ArrowUpRight} from 'lucide-react';
import {MapDiagram} from './project-visual';
import {ResponsiveImage} from './responsive-image';
import {ChessTraceMark} from './chess-trace-mark';
import {t,statusLabels,genreLabels,type Lang,type Project} from '@/lib/types';

export function WorkCard({project:p,lang,index=0,enhanced=false}:{project:Project;lang:Lang;index?:number;enhanced?:boolean}) {
 const href=`/${lang}/projects/${p.slug}`;
 const primary=p.links[0];
 return <article className={`work-card work-${p.slug}`}>
  <a href={href} className="work-image" aria-label={`${t(p.name,lang)} — ${lang==='zh'?'查看项目':'View project'}`}>
   {p.cover?<ResponsiveImage src={p.cover} alt={t(p.coverAlt??p.name,lang)} sizes="(max-width: 700px) 92vw, (max-width: 1100px) 45vw, 42vw" loading="lazy"/>:p.diagram==='three-faction-map'?<MapDiagram lang={lang} small/>:<div className="typographic-cover"><span>{p.tags.join(' / ')}</span><strong>{t(p.name,lang)}</strong></div>}
   <span className={`status-badge ${p.status}`}>{t(statusLabels[p.status]??{zh:p.status,en:p.status},lang)}</span>
   {enhanced&&<span className="project-frame" aria-hidden="true"/>}
   {p.slug==='luanshi-zhiqi'&&<ChessTraceMark lang={lang}/>}
   <span className={`image-link${enhanced?' project-entry':''}`} aria-hidden="true">{enhanced&&<span className="project-entry-label">{lang==='zh'?'进入项目':'View project'}</span>}<ArrowUpRight size={22}/></span>
  </a>
  <div className="work-info"><div className="work-number">{String(index+1).padStart(2,'0')} /</div><div className="work-copy">
   <div className="eyebrow">{t(genreLabels[p.genre]??{zh:p.genre,en:p.genre},lang)}</div>
   <h3><a href={href}>{t(p.name,lang)}</a></h3>
   <p>{t(p.summary,lang)}</p>
   <dl className="work-facts"><div><dt>{lang==='zh'?'我的职责':'My role'}</dt><dd>{t(p.role,lang)}</dd></div><div><dt>{lang==='zh'?'核心成果':'Key outcome'}</dt><dd>{t(p.cardHighlight??p.results[0],lang)}</dd></div></dl>
   <div className="work-actions"><a className="text-link" href={href}>{lang==='zh'?'查看项目详情':'View case study'}<ArrowUpRight size={16}/></a>{primary&&<a className="text-link work-external" href={primary.url} target="_blank" rel="noreferrer">{t(primary.label,lang)}<ArrowUpRight size={16}/></a>}</div>
  </div></div>
 </article>;
}
