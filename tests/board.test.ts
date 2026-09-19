import { describe, it, expect } from "vitest";
import solver from "pokersolver";
import { boardTask, boardFamilies, drawCases, riverGroups, targetedEquityTask } from "../src/boardTasks";
import { deck, validate } from "../src/poker";
import { check, generateSession } from "../src/tasks";
import { fresh, record, validProgress } from "../src/progress";
describe("Доска и целевое эквити",()=>{
 it("каждый ривер контрольных рук сверяется другим оценщиком",()=>{
  for(const c of drawCases){const g=riverGroups([...c.hero],[...c.villain],[...c.board]);
   for(const r of deck.filter(x=>![...c.hero,...c.villain,...c.board].includes(x as never))){const a=solver.Hand.solve([...c.hero,...c.board,r]),b=solver.Hand.solve([...c.villain,...c.board,r]);const w=solver.Hand.winners([a,b]);expect(g[w.length===2?"tie":w[0]===a?"win":"loss"]).toContain(r);}
  }
 });
 it("чистые ауты и пересечения",()=>{
  for(const [i,n] of [[0,7],[1,15]]){const c=drawCases[i];expect(riverGroups([...c.hero],[...c.villain],[...c.board]).win).toHaveLength(n);}
 });
 it("все семейства сохраняются и проверяются",()=>{
  for(const f of boardFamilies){const t=boardTask(f);validate([...(t.cards??[]),...(t.board??[]),...(t.opponent??[])]);expect(check(t,t.answer)).toBe(true);expect(validProgress(record(fresh(),t,false,false))).toBe(true);}
  for(const c of drawCases){const t=targetedEquityTask(c.id);expect(t.choices).toContain(t.answer);expect(new Set(t.choices).size).toBe(t.choices.length);}
 });
 it("подборки не повторяют один и тот же случай",()=>{for(const skill of ["texture","equity"] as const){const t=generateSession([skill],5);expect(new Set(t.map(t=>t.scenario)).size).toBe(5);}});
});
