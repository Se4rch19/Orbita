export type LessonEvent = "next" | "out" | "in" | "collect" | "avoid" | "chain";
export const lessonActions: LessonEvent[] = [
  "next",
  "out",
  "in",
  "collect",
  "avoid",
  "next",
  "chain",
  "next",
];
export class Lesson {
  step = 0;
  finished = false;
  get running() {
    return [3, 4, 6].includes(this.step);
  }
  accept(event: LessonEvent) {
    if (this.finished || lessonActions[this.step] !== event) return false;
    this.step++;
    this.finished = this.step === lessonActions.length;
    return true;
  }
}
