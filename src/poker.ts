export const ranks = '23456789TJQKA';
export const suits = 'cdhs';
export const deck = [...ranks].flatMap(r => [...suits].map(s => r+s));
export const names = ['Старшая карта','Пара','Две пары','Тройка','Стрит','Флеш','Фулл-хаус','Каре','Стрит-флеш'];
export function validate(cards: string[], min=0, max=52) {
  if(cards.length<min || cards.length>max || new Set(cards).size!==cards.length || cards.some(c=>!deck.includes(c))) throw new Error('Недопустимый набор карт');
}
export function combinations<T>(items:T[], n:number):T[][] {
  const out:T[][]=[];
  function visit(start:number, picked:T[]) { if(picked.length===n){out.push(picked);return;} for(let i=start;i<=items.length-(n-picked.length);i++)visit(i+1,[...picked,items[i]]); }
  visit(0,[]);return out;
}
export function compare(a:number[],b:number[]) {for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]??0)-(b[i]??0);if(d)return Math.sign(d);}return 0;}
function five(cards:string[]) {
  const values=cards.map(c=>ranks.indexOf(c[0])+2).sort((a,b)=>b-a);
  const groups=[...new Set(values)].map(v=>({v,n:values.filter(x=>x===v).length})).sort((a,b)=>b.n-a.n||b.v-a.v);
  const flush=cards.every(c=>c[1]===cards[0][1]);const unique=[...new Set(values)];
  const straight=unique.length===5?(unique[0]-unique[4]===4?unique[0]:unique.join(',')==='14,5,4,3,2'?5:0):0;
  if(flush&&straight)return [8,straight];
  if(groups[0].n===4)return [7,groups[0].v,groups[1].v];
  if(groups[0].n===3&&groups[1].n===2)return [6,groups[0].v,groups[1].v];
  if(flush)return [5,...values];if(straight)return [4,straight];
  if(groups[0].n===3)return [3,...groups.map(g=>g.v)];
  if(groups[0].n===2&&groups[1].n===2)return [2,...groups.map(g=>g.v)];
  if(groups[0].n===2)return [1,...groups.map(g=>g.v)];return [0,...values];
}
export function evaluate(cards:string[]) {
  validate(cards,5,7);let score:number[]=[];let best:string[]=[];
  for(const c of combinations(cards,5)){const s=five(c);if(compare(s,score)>0){score=s;best=c;}}
  return {score,best,name:names[score[0]]};
}
export function equity(hero:string[],villain:string[],board:string[]) {
  if(hero.length!==2||villain.length!==2||board.length<3||board.length>5)throw new Error('Нужны две руки и флоп, тёрн или ривер');
  validate([...hero,...villain,...board]);const remaining=deck.filter(c=>![...hero,...villain,...board].includes(c));
  let wins=0,ties=0,total=0;
  for(const runout of combinations(remaining,5-board.length)){const result=compare(evaluate([...hero,...board,...runout]).score,evaluate([...villain,...board,...runout]).score);total++;if(result>0)wins++;if(result===0)ties++;}
  return {wins,ties,total,percent:100*(wins+ties/2)/total,method:'Полный перебор' as const};
}
export function potOdds(potBeforeCall:number,call:number){if(!Number.isFinite(potBeforeCall)||!Number.isFinite(call)||potBeforeCall<0||call<=0)throw new Error('Неверные суммы');return call/(potBeforeCall+call)*100;}
export function spr(a:number,b:number,pot:number){if(![a,b,pot].every(Number.isFinite)||a<0||b<0||pot<=0)throw new Error('Неверные суммы');return Math.min(a,b)/pot;}
export const preflopOrder=['UTG','HJ','CO','BTN','SB','BB'];
export const postflopOrder=['SB','BB','UTG','HJ','CO','BTN'];
export function handLabel(cards:string[]) {validate(cards,2,2);const sorted=[...cards].sort((a,b)=>ranks.indexOf(b[0])-ranks.indexOf(a[0]));return sorted[0][0]+sorted[1][0]+(sorted[0][0]===sorted[1][0]?'':sorted[0][1]===sorted[1][1]?'s':'o');}
