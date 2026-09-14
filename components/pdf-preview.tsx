'use client';
import {useState} from 'react';
import type {Lang} from '@/lib/types';

export function PdfPreview({url,title,lang}:{url:string;title:string;lang:Lang}) {
 const [open,setOpen]=useState(false);
 return <details className="pdf-preview" onToggle={event=>setOpen(event.currentTarget.open)}>
  <summary>{lang==='zh'?'在线预览 PDF':'Preview PDF'}</summary>
  {open&&<object data={url} type="application/pdf" title={title}><p>{lang==='zh'?'可在新窗口打开或下载此 PDF。':'Open or download this PDF in a new tab.'} <a href={url} target="_blank" rel="noreferrer">{lang==='zh'?'打开 PDF':'Open PDF'}</a></p></object>}
 </details>;
}
