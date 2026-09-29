import type {Lang} from '@/lib/types';

export function ChessTraceMark({lang}:{lang:Lang}) {
 return <span className="chess-trace-mark" aria-hidden="true">
  <span className="chess-mark-grid"/>
  <svg className="project-trace-line" viewBox="0 0 100 100" preserveAspectRatio="none"><path className="project-trace-route" pathLength="1" d="M 50 50 V 76 H 90 V 94"/></svg>
  <span className="chess-mark-stone">执</span>
  <span className="chess-mark-caption">{lang==='zh'?'落下一子 · 看见设计':'ONE MOVE · A DESIGN TRACE'}</span>
 </span>;
}
