// Every atom in every state, for eyeballing. Uses atoms only, so it needs no Paseo data.
import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { useState, type ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { Badge, Btn, Chip, Dot, Segmented, Stepper, Switch } from "../atoms";
import { FONT_SCALE, SESSION_COLORS, TokensProvider, font, space, stateColor, usePalette } from "../tokens";
import { CARD_STATES } from "../../../shared/core";

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
  const noop = () => {};
  return (
    <ScrollView style={{ backgroundColor: p.bg }} contentContainerStyle={{ padding: space.xl }}>
      <Row title="Dot: one per card state">
        {CARD_STATES.map((s) => (
          <Dot key={s} color={stateColor(p, s)} />
        ))}
      </Row>
      <Row title="Dot: session colors (white and gray are manual only)">
        {SESSION_COLORS.map((c) => (
          <Dot key={c.id} color={c.hex} diameter={16} />
        ))}
      </Row>
      <Row title="Btn: solid, ghost, danger, disabled">
        <Btn label="Send" onPress={noop} />
        <Btn label="Cancel" variant="ghost" onPress={noop} />
        <Btn label="Interrupt" variant="danger" onPress={noop} />
        <Btn label="Disabled" disabled onPress={noop} />
      </Row>
      <Row title="Chip: plain, count, selected, by tone">
        <Chip label="Permissions" count={2} tone="warning" onPress={noop} />
        <Chip label="Questions" count={1} tone="info" selected onPress={noop} />
        <Chip label="Failed" count={0} tone="danger" onPress={noop} />
        <Chip label="Model" onPress={noop} />
      </Row>
      <Row title="Badge: danger, warning, info, zero (hidden)">
        <Badge count={3} tone="danger" />
        <Badge count={12} tone="warning" />
        <Badge count={1} tone="info" />
        <Badge count={0} tone="info" />
      </Row>
      <Row title="Switch: off, on (live)">
        <Switch label="Wrap lines" value={false} onValueChange={noop} />
        <Switch label="Wrap lines" value={on} onValueChange={setOn} />
      </Row>
      <Row title="Stepper: at min, mid (live), at max">
        <Stepper label="Scale" value={FONT_SCALE.min} min={FONT_SCALE.min} max={FONT_SCALE.max} step={FONT_SCALE.step} onChange={noop} format={pct} />
        <Stepper label="Scale" value={scale} min={FONT_SCALE.min} max={FONT_SCALE.max} step={FONT_SCALE.step} onChange={setScale} format={pct} />
        <Stepper label="Scale" value={FONT_SCALE.max} min={FONT_SCALE.min} max={FONT_SCALE.max} step={FONT_SCALE.step} onChange={noop} format={pct} />
      </Row>
      <Row title="Segmented (live)">
        <Segmented
          value={seg}
          onChange={setSeg}
          options={[
            { value: "workspace", label: "Workspace" },
            { value: "status", label: "Status" },
          ]}
        />
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
