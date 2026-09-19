import {describe,it,expect} from 'vitest';
import solver from 'pokersolver';
import {evaluate,compare,equity,potOdds,spr,validate,deck,preflopOrder,postflopOrder,handLabel} from '../src/poker';
import {allSkills,generate,check} from '../src/tasks';
import {fresh,record,mastery,validProgress} from '../src/progress';
const cards=(s:string)=>s.split(' ');
describe('Правила и формулы',()=>{
 it('младший стрит и отсутствие кругового стрита',()=>{expect(evaluate(cards('As 2d 3h 4c 5s Kd Qh')).score).toEqual([4,5]);expect(evaluate(cards('Ks Ad 2h 3c 4s')).score[0]).toBe(0);});
 it('кикеры, две пары и фулл-хаус',()=>{expect(compare(evaluate(cards('As Ah Kc Qc 9c')).score,evaluate(cards('Ad Ac Qh Jc 9h')).score)).toBe(1);expect(evaluate(cards('As Ah Kc Kd Qh Qs 2s')).score).toEqual([2,14,13,12]);expect(evaluate(cards('As Ah Ac Kc Kd Kh 2s')).score).toEqual([6,14,13]);});
 it('общая доска и ничья',()=>{const b=cards('As Ks Qs Js Ts');expect(compare(evaluate([...b,'2c','2h']).score,evaluate([...b,'3c','3h']).score)).toBe(0);expect(equity(['2c','2h'],['3c','3h'],b).percent).toBe(50);});
 it('повторяющиеся и несуществующие карты запрещены',()=>{expect(()=>validate(['As','As'])).toThrow();expect(()=>evaluate(cards('As Ah Ac Ad Ax'))).toThrow();expect(()=>equity(['As','Kd'],['As','Kh'],['2h','3h','4h'])).toThrow();});
 it('порядок действий за 6-max',()=>{expect(preflopOrder).toEqual(['UTG','HJ','CO','BTN','SB','BB']);expect(postflopOrder).toEqual(['SB','BB','UTG','HJ','CO','BTN']);});
 it('банк уже содержит ставку соперника',()=>{expect(potOdds(60,20)).toBe(25);expect(potOdds(30,10)).toBe(25);expect(()=>potOdds(-1,10)).toThrow();expect(()=>potOdds(20,0)).toThrow();});
 it('SPR по оставшимся стекам',()=>{expect(spr(60,80,20)).toBe(3);expect(spr(0,80,20)).toBe(0);expect(()=>spr(10,20,0)).toThrow();});
 it('s, o и пары',()=>{expect(handLabel(['Ks','As'])).toBe('AKs');expect(handLabel(['Kh','As'])).toBe('AKo');expect(handLabel(['Kh','Ks'])).toBe('KK');});
});
// Независимая библиотека pokersolver использует собственную реализацию ранжирования.
describe('Независимая сверка с pokersolver',()=>{
 let seed=98271;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
 function sample(n:number){const a=[...deck];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,n);}
 function winner(a:string[],b:string[]){const x=solver.Hand.solve(a),y=solver.Hand.solve(b),w=solver.Hand.winners([x,y]);return w.length===2?0:w[0]===x?1:-1;}
 it('1000 независимых пар семикарточных рук',()=>{for(let i=0;i<1000;i++){const c=sample(14),a=c.slice(0,7),b=c.slice(7);expect(compare(evaluate(a).score,evaluate(b).score)).toBe(winner(a,b));}},20000);
 it('эквити: каждый ривер сверяется независимо, включая половину ничьих',()=>{for(let i=0;i<25;i++){const c=sample(8),h=c.slice(0,2),v=c.slice(2,4),b=c.slice(4);let points=0;for(const river of deck.filter(x=>!c.includes(x))){const w=winner([...h,...b,river],[...v,...b,river]);points+=w>0?1:w===0?.5:0;}expect(equity(h,v,b).percent).toBeCloseTo(points/44*100,12);}},20000);
 it('флеш-дро против сета: ровно семь чистых аутов из 44',()=>{const e=equity(['Ah','Kh'],['Qs','Qd'],['2h','7h','Qc','9s']);expect(e).toMatchObject({total:44,wins:7,ties:0});/* Qh даёт каре, 9h — фулл-хаус. Из 9 червей только 7 дают победу. */});
});
describe('Генераторы и сохранение',()=>{
 it('все типы дают допустимые карты и проверяемые ответы',()=>{for(const s of allSkills)for(let i=0;i<25;i++){const t=generate(s);validate([...(t.cards??[]),...(t.board??[]),...(t.opponent??[])]);expect(new Set(t.choices).size).toBe(t.choices.length);expect(t.choices).toContain(t.answer);expect(check(t,t.answer,t.selection?evaluate([...t.cards!,...(t.board??[])]).best:[])).toBe(true);}},20000);
 it('принимает альтернативную лучшую пятёрку, не принимает чужие карты',()=>{const t={...generate('best'),board:undefined,cards:cards('As Ah Kc Qc Jc Tc 2d')};expect(check(t,'',cards('Ah Kc Qc Jc Tc'))).toBe(true);expect(check(t,'',cards('Ad Kc Qc Jc Tc'))).toBe(false);});
 it('ошибка сохраняется, верное повторение удаляет её',()=>{const t=generate('stack');const p=record(fresh(),t,false,false);expect(p.mistakes).toHaveLength(1);expect(validProgress(p)).toBe(true);expect(record(p,t,true,false).mistakes).toHaveLength(0);});
 it('освоение отдельно от урока, подсказка не даёт освоение',()=>{let p=fresh();const t=generate('stack');for(let i=0;i<10;i++)p=record(p,t,true,true);expect(mastery(p,'stack').mastered).toBe(false);for(let i=0;i<10;i++)p=record(p,t,i>1,false);expect(mastery(p,'stack').mastered).toBe(true);expect(p.lessons).toHaveLength(0);});
 it('отклоняет повреждённые сохранения',()=>{expect(validProgress({version:1})).toBe(false);expect(validProgress({...fresh(),mistakes:[{}]})).toBe(false);});
});
