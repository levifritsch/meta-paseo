import type { Answer, Question } from "./types";

export const emptyAnswer = (): Answer => ({ picked: [], text: "", custom: false });

/** Pick or unpick an option. A pick takes over from the free text, which is kept. */
export function togglePick(q: Question, answer: Answer, label: string): Answer {
  const base = answer.custom ? [] : answer.picked;
  const has = base.includes(label);
  const picked = q.multiSelect ? (has ? base.filter((l) => l !== label) : [...base, label]) : has ? [] : [label];
  return { ...answer, custom: false, picked };
}

/** Selecting the free-text box drops any picks. */
export const selectCustom = (answer: Answer): Answer => ({ ...answer, custom: true, picked: [] });

/** Typing selects the box too. */
export const setCustomText = (answer: Answer, text: string): Answer => ({ ...selectCustom(answer), text });

/** Answered by picks, or by text when the box is the selected one. */
export const isAnswered = (a: Answer | undefined) => !!a && (a.custom ? a.text.trim().length > 0 : a.picked.length > 0);

/** Send is enabled only once every question has an answer. */
export const isComplete = (questions: Question[], answers: Answer[]) =>
  questions.length > 0 && questions.every((_, i) => isAnswered(answers[i]));

/** Move to the next question after a single-select pick, unless it was an unpick or the last one. */
export function shouldAdvance(q: Question, before: Answer, after: Answer, isLast: boolean): boolean {
  if (isLast || q.multiSelect || after.custom || after.picked.length !== 1) return false;
  return before.custom || before.picked[0] !== after.picked[0];
}

/** Answer text per question, in question order: the picks joined, or the free text. */
export function answerTexts(questions: Question[], answers: Answer[]): Record<string, string> {
  return Object.fromEntries(
    questions.map((q, i) => {
      const a = answers[i] ?? emptyAnswer();
      return [q.prompt, a.custom ? a.text.trim() : a.picked.join(", ")];
    }),
  );
}
