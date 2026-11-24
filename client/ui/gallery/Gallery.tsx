// Every atom in every state, for eyeballing. Uses atoms only, so it needs no Paseo data.
import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { useState, type ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { Badge, Btn, Chip, Dot, IconButton, LabeledRule, Segmented, Stepper, Switch } from "../atoms";
import { SESSION_COLORS, STATE_SHAPE, TokensProvider, font, space, stateColor, usePalette } from "../tokens";
import { CARD_STATES, VIEW_LIMITS } from "../../../shared/core";

const FONT_SCALE = VIEW_LIMITS.fontScale;

function Row({ title, children }: { title: string; children: ReactNode }) {
  const p = usePalette();
  return (
    <View style={{ gap: space.md, paddingVertical: space.lg }}>
      <Text style={{ color: p.muted, fontSize: font.sm }}>{title}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.lg }}>{children}</View>
    </View>
  );
}

function Atoms() {
  const p = usePalette();
  const [on, setOn] = useState(false);
  const [scale, setScale] = useState(1);
  const [seg, setSeg] = useState<"workspace" | "status">("workspace");
  const [sort, setSort] = useState<"activity" | "title" | "color">("activity");
  const noop = () => {};
  return (
    <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={{ padding: space.xl }}>
      <Row title="State dot: one symbol and color per card state (question, permission, running, done, failed)">
        {CARD_STATES.map((s) => (
          <View key={s} style={{ alignItems: "center", gap: space.sm, minWidth: 64 }}>
            <Dot color={stateColor(p, s)} shape={STATE_SHAPE[s]} />
            <Text style={{ color: p.muted, fontSize: font.xs }}>{s}</Text>
          </View>
        ))}
      </Row>
      <Row title="Dot: plain shapes at a larger size">
        <Dot color={p.accent} shape="circle" diameter={16} />
        <Dot color={p.accent} shape="square" diameter={16} />
      </Row>
      <Row title="Dot: session colors (white and gray are manual only)">
        {SESSION_COLORS.map((c) => (
          <Dot key={c.id} color={c.hex} diameter={16} />
        ))}
      </Row>
      <Row title="Btn: solid, cancel (plain), ghost, danger, disabled">
        <Btn label="Send" onPress={noop} />
        <Btn label="Cancel" variant="plain" onPress={noop} />
        <Btn label="Show earlier" variant="ghost" onPress={noop} />
        <Btn label="Interrupt" variant="danger" onPress={noop} />
        <Btn label="Disabled" disabled onPress={noop} />
      </Row>
      <Row title="Btn: small, with icon, in a color">
        <Btn small label="Send" onPress={noop} />
        <Btn small label="Cancel" variant="plain" onPress={noop} />
        <Btn small label="Delete" variant="danger" icon="Trash2" onPress={noop} />
        <Btn label="Open" icon="ExternalLink" onPress={noop} />
        <Btn label="Teal" color={SESSION_COLORS[5]!.hex} onPress={noop} />
      </Row>
      <Row title="IconButton: rest, active, disabled">
        <IconButton icon="Plus" label="Add" onPress={noop} />
        <IconButton icon="Minimize2" label="Collapse" active onPress={noop} />
        <IconButton icon="Plus" label="Add" disabled onPress={noop} />
      </Row>
      <Row title="Chip: plain, count, selected, by tone">
        <Chip label="Permissions" count={2} tone="warning" onPress={noop} />
        <Chip label="Questions" count={1} tone="info" selected onPress={noop} />
        <Chip label="Failed" count={0} tone="danger" onPress={noop} />
        <Chip label="Model" onPress={noop} />
      </Row>
      <Row title="Badge: danger, warning, info, neutral, zero (hidden)">
        <Badge count={3} tone="danger" />
        <Badge count={12} tone="warning" />
        <Badge count={1} tone="info" />
        <Badge count={7} />
        <Badge count={0} tone="info" />
      </Row>
      <Row title="Toggle button: off, on (live)">
        <Switch label="Wrap lines" value={false} onValueChange={noop} />
        <Switch label="Wrap lines" value={on} onValueChange={setOn} />
        <Switch label="Wrap lines" value onValueChange={noop} />
      </Row>
      <Row title="Stepper: at min, mid (live), at max">
        <Stepper label="Scale" value={FONT_SCALE.min} min={FONT_SCALE.min} max={FONT_SCALE.max} step={FONT_SCALE.step} onChange={noop} format={pct} />
        <Stepper label="Scale" value={scale} min={FONT_SCALE.min} max={FONT_SCALE.max} step={FONT_SCALE.step} onChange={setScale} format={pct} />
        <Stepper label="Scale" value={FONT_SCALE.max} min={FONT_SCALE.min} max={FONT_SCALE.max} step={FONT_SCALE.step} onChange={noop} format={pct} />
      </Row>
      <Row title="Segmented: two options, three options with a label (live)">
        <Segmented
          value={seg}
          onChange={setSeg}
          options={[
            { value: "workspace", label: "Workspace" },
            { value: "status", label: "Status" },
          ]}
        />
        <Segmented
          label="Sort by"
          value={sort}
          onChange={setSort}
          options={[
            { value: "activity", label: "Activity" },
            { value: "title", label: "Title" },
            { value: "color", label: "Color" },
          ]}
        />
      </Row>
      <Row title="LabeledRule">
        <View style={{ width: 320 }}>
          <LabeledRule label="LATEST REPLY" />
        </View>
      </Row>
    </ScrollView>
  );
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

export function Gallery({ theme }: PluginScreenProps) {
  return (
    <TokensProvider theme={theme}>
      <Atoms />
    </TokensProvider>
  );
}
