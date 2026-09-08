export type Lang = 'zh' | 'en';
export type Bilingual = {zh:string;en:string};
export type Section = {id:string;title:Bilingual;paragraphs:Bilingual[]};
export type Project = {slug:string;visibility:'draft'|'public';featured:number|null;status:string;genre:string;updatedAt:string;name:Bilingual;subtitle:Bilingual;summary:Bilingual;role:Bilingual;period:Bilingual;team:Bilingual;cover:string|null;diagram?:'three-faction-map';coverAlt?:Bilingual;tags:string[];results:Bilingual[];links:{label:Bilingual;url:string}[];sections:Section[];gallery:{src:string;caption:Bilingual}[];next:Bilingual;devlog:{date:string;title:Bilingual;description:Bilingual;evidence?:string;next?:Bilingual}[]};
export type Analysis = {slug:string;visibility:string;game:Bilingual;title:Bilingual;fullTitle:Bilingual;summary:Bilingual;genre:string;topics:Bilingual[];version:string;updatedAt:string;readMinutes:number;cover:string;body:string;englishBody?:string;assetBase?:string;imageCredits?:Record<string,string>;evidence?:string;tablesFile?:string;sourcesFile?:string;coverAlt?:Bilingual;contentStatus?:Bilingual;languageStatus?:Bilingual;downloadGroup?:string;cases:{own:number;creator:number;esports:number}};
export const t=(value:Bilingual|undefined,lang:Lang)=>value?.[lang]||value?.zh||'';
export const statusLabels:Record<string,Bilingual>={idea:{zh:'构思中',en:'Concept'},design:{zh:'策划阶段',en:'Design'},prototype:{zh:'原型阶段',en:'Prototype'},development:{zh:'制作中',en:'In development'},playable:{zh:'可试玩',en:'Playable'},released:{zh:'已发布',en:'Released'},paused:{zh:'暂停',en:'Paused'}};
export const genreLabels:Record<string,string>={'strategy-rpg':'Strategy RPG','rts-slg':'RTS / SLG'};

export type TableSet={tables:{id:string;caption:Bilingual;headers:Bilingual[];rows:Bilingual[][]}[]};
export type SourceSet={note:Bilingual;disclaimer:Bilingual;sources:{id:string;title:Bilingual;url?:string;scope:Bilingual}[]};
