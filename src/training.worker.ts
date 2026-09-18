import {generate} from './tasks';
import type {Skill} from './content';
self.onmessage=(event:MessageEvent<{skills:Skill[];count:number}>)=>{try{const {skills,count}=event.data;self.postMessage({tasks:Array.from({length:count},(_,i)=>generate(skills[i%skills.length]))});}catch(e){self.postMessage({error:String(e)});}};
