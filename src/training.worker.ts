import { generateSession, generateSimilar, type Task } from "./tasks";
import type { Skill } from "./content";
self.onmessage = (
  event: MessageEvent<{ skills: Skill[]; count: number; similarTo?: Task }>,
) => {
  try {
    const { skills, count, similarTo } = event.data;
    self.postMessage({
      tasks: similarTo
        ? [generateSimilar(similarTo)]
        : generateSession(skills, count),
    });
  } catch (e) {
    self.postMessage({ error: String(e) });
  }
};
