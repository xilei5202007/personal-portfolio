import type {Project,Analysis,TableSet,SourceSet} from './types';
export * from './types';
const projectFiles=import.meta.glob('../content/projects/*.json',{eager:true,import:'default'}) as Record<string,Project>;
const analysisFiles=import.meta.glob('../content/analysis/*.json',{eager:true,import:'default'}) as Record<string,Analysis>;
const articleFiles=import.meta.glob('../content/articles/*.md',{eager:true,query:'?raw',import:'default'}) as Record<string,string>;
export const projects=Object.values(projectFiles).filter(p=>p.visibility==='public').sort((a,b)=>(a.featured??99)-(b.featured??99)||a.slug.localeCompare(b.slug));
export const analyses=Object.values(analysisFiles).filter(p=>p.visibility==='public');
export const article=(name:string)=>articleFiles[`../content/articles/${name}`]??'';
export const origin='https://t1ar-portfolio.mossy-bay-3544.chatgpt.site';

const tableFiles=import.meta.glob('../content/tables/*.json',{eager:true,import:'default'}) as Record<string,TableSet>;
const sourceFiles=import.meta.glob('../content/sources/*.json',{eager:true,import:'default'}) as Record<string,SourceSet>;
export const tableData=(file?:string)=>file?tableFiles[`../content/tables/${file}`]:undefined;
export const sourceData=(file?:string)=>file?sourceFiles[`../content/sources/${file}`]:undefined;
