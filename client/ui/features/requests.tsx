// What is waiting on the user, drawn by kind. Add a kind by adding a renderer to the registry.
import { Markdown, ScrollView, TextInput } from "@getpaseo/plugin/client/ui";
import { useState, type ComponentType } from "react";
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";
import { Pressable, Text, View } from "react-native";
import { emptyAnswer, isAnswered, isComplete, togglePick, type Action, type Answer, type Request, type RequestKind } from "../../../shared/core";
import { Btn, Chip } from "../atoms";
import { CodeBlock } from "../molecules";
import { usePalette } from "../tokens/context";
import { font, radius, space } from "../tokens/tokens";

export type RendererProps<K extends RequestKind> = {
  request: Extract<Request, { kind: K }>;
  /** A button on the request. */
  onAction: (actionId: string) => void;
  /** The finished answers to a question request. */
  onAnswer: (answers: Answer[]) => void;
};

function Actions({ actions, onAction }: { actions: Action[]; onAction: (id: string) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
      {actions.map((a) => (
        <Btn key={a.id} label={a.label} onPress={() => onAction(a.id)} variant={a.variant === "danger" ? "danger" : a.variant === "secondary" ? "ghost" : "solid"} />
      ))}
    </View>
  );
}

function Heading({ children }: { children: string }) {
  const p = usePalette();
  return <Text style={{ color: p.text, fontSize: font.md, fontWeight: "700" }}>{children}</Text>;
}

function PermissionRequest({ request, onAction }: RendererProps<"permission">) {
  const p = usePalette();
  return (
    <View style={{ gap: space.md }}>
      <Heading>{request.title}</Heading>
      {request.code !== undefined && <CodeBlock text={request.code} />}
      {request.description && <Text style={{ color: p.muted, fontSize: font.sm }}>{request.description}</Text>}
      <Actions actions={request.actions} onAction={onAction} />
    </View>
  );
}

function PlanRequest({ request, onAction }: RendererProps<"plan">) {
  return (
    <View style={{ gap: space.md }}>
      <Heading>{request.title ?? "Plan"}</Heading>
      <ScrollView style={{ maxHeight: 280 }}>
        <Markdown>{request.text}</Markdown>
      </ScrollView>
      <Actions actions={request.actions} onAction={onAction} />
    </View>
  );
}

function OtherRequest({ request, onAction }: RendererProps<"other">) {
  const p = usePalette();
  return (
    <View style={{ gap: space.md }}>
      <Heading>{request.title}</Heading>
      {request.description && <Text style={{ color: p.muted, fontSize: font.sm }}>{request.description}</Text>}
      <Actions actions={request.actions} onAction={onAction} />
    </View>
  );
}

/** Multiple-choice questions, one tab per question when there are several. Cmd/Ctrl+Enter sends. */
function QuestionForm({ request, onAnswer }: RendererProps<"question">) {
  const p = usePalette();
  const qs = request.questions;
  const [tab, setTab] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(() => qs.map(emptyAnswer));
  const q = qs[Math.min(tab, qs.length - 1)]!;
  const a = answers[tab] ?? emptyAnswer();
  const set = (next: Answer) => setAnswers((all) => all.map((x, i) => (i === tab ? next : x)));
  const complete = isComplete(qs, answers);
  const submit = () => complete && onAnswer(answers);
  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const k = e.nativeEvent as TextInputKeyPressEventData & { metaKey?: boolean; ctrlKey?: boolean };
    if (k.key === "Enter" && (k.metaKey || k.ctrlKey)) submit();
  };
  return (
    <View style={{ gap: space.md }}>
      {qs.length > 1 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
          {qs.map((x, i) => (
            <Chip key={i} label={`${isAnswered(answers[i]) ? "✓ " : ""}${x.header ?? `Question ${i + 1}`}`} selected={i === tab} onPress={() => setTab(i)} />
          ))}
        </View>
      )}
      <Heading>{q.prompt}</Heading>
      {q.options.map((o) => {
        const picked = a.picked.includes(o.label);
        return (
          <Pressable
            key={o.label}
            accessibilityRole={q.multiSelect ? "checkbox" : "radio"}
            accessibilityState={{ selected: picked }}
            onPress={() => set(togglePick(q, a, o.label))}
            style={{ padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: picked ? p.accent : p.border, gap: space.xs }}
          >
            <Text style={{ color: p.text, fontSize: font.md, fontWeight: "600" }}>
              {q.multiSelect ? (picked ? "☑ " : "☐ ") : picked ? "● " : "○ "}
              {o.label}
            </Text>
            {o.description && <Text style={{ color: p.muted, fontSize: font.sm }}>{o.description}</Text>}
          </Pressable>
        );
      })}
      <TextInput
        multiline
        numberOfLines={3}
        value={a.text}
        onChangeText={(text) => set({ ...a, text })}
        onKeyPress={onKeyPress}
        placeholder="Or type your own answer"
        placeholderTextColor={p.muted}
        style={{ minHeight: 3 * font.md * 1.4 + space.lg, color: p.text, fontSize: font.md, padding: space.md, borderWidth: 1, borderColor: p.border, borderRadius: radius.md }}
      />
      <Btn label="Send answers" onPress={submit} disabled={!complete} style={{ alignSelf: "flex-start" }} />
    </View>
  );
}

export const REQUEST_RENDERERS: { [K in RequestKind]: ComponentType<RendererProps<K>> } = {
  question: QuestionForm,
  plan: PlanRequest,
  permission: PermissionRequest,
  other: OtherRequest,
};

export function RequestPanel(props: { request: Request; onAction: (actionId: string) => void; onAnswer: (answers: Answer[]) => void }) {
  const Renderer = REQUEST_RENDERERS[props.request.kind] as ComponentType<RendererProps<RequestKind>>;
  return <Renderer {...props} />;
}
