import type {Lang} from '@/lib/types';

export function ChessTraceMark({lang}:{lang:Lang}) {
 return <span className="chess-trace-mark" aria-hidden="true">
  <span className="chess-mark-grid"/>
  <span className="chess-mark-stone">执</span>
  <span className="chess-mark-caption">{lang==='zh'?'落下一子 · 看见设计':'ONE MOVE · A DESIGN TRACE'}</span>
 </span>;
}
