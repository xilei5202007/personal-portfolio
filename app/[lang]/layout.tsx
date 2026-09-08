import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {SiteHeader,SiteFooter} from '@/components/site-chrome';
import '../globals.css';
export const metadata:Metadata={title:{default:'t1ar / 章锦霖 · 游戏策划作品集',template:'%s · t1ar'},description:'原创游戏、系统设计与游戏机制研究。敢想、能推、做得出。',icons:{icon:'/favicon.svg'},robots:{index:false,follow:false}};
export default async function Layout({children,params}:{children:React.ReactNode;params:Promise<{lang:string}>}){const {lang}=await params;if(lang!=='zh'&&lang!=='en')notFound();return <html lang={lang==='zh'?'zh-CN':'en'}><body id="top"><a className="skip-link" href="#main">{lang==='zh'?'跳转到正文':'Skip to content'}</a><SiteHeader lang={lang}/>{children}<SiteFooter lang={lang}/></body></html>}
