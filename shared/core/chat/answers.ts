import type { Answer, Question } from "./types";

export const emptyAnswer = (): Answer => ({ picked: [], text: "" });

/** Pick or unpick an option. A single-select question holds one pick. */
export function togglePick(q: Question, answer: Answer, label: string): Answer {
  const has = answer.picked.includes(label);
  if (q.multiSelect) return { ...answer, picked: has ? answer.picked.filter((l) => l !== label) : [...answer.picked, label] };
  return { ...answer, picked: has ? [] : [label] };
}

/** A question counts as answered by a pick or by text. */
export const isAnswered = (a: Answer | undefined) => !!a && (a.picked.length > 0 || a.text.trim().length > 0);

/** Send is enabled only once every question has an answer. */
export const isComplete = (questions: Question[], answers: Answer[]) =>
  questions.length > 0 && questions.every((_, i) => isAnswered(answers[i]));

/** Prompt to answer text: picks joined by comma, then free text. Order of questions is kept. */
export function answerTexts(questions: Question[], answers: Answer[]): Record<string, string> {
  return Object.fromEntries(
    questions.map((q, i) => {
      const a = answers[i] ?? emptyAnswer();
      return [q.prompt, [...a.picked, a.text.trim()].filter(Boolean).join(", ")];
    }),
  );
}
