import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
export default async function Entry(){ const c=await cookies(); redirect(c.get('t1ar-language')?.value==='en'?'/en':'/zh'); }
