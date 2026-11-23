import { Children, isValidElement, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Animated, View, type LayoutChangeEvent } from "react-native";
import { motion } from "../tokens/tokens";
import { glideOffset, layoutPositions, shouldEnter } from "./glide-math";
import { useReducedMotion } from "./useReducedMotion";

type Motion = { slide: Animated.Value; fade: Animated.Value; shown: number; joined: boolean };

/**
 * A column of keyed children. When one moves, it slides from where it was. One that joins after
 * load fades in. Children present at load, and everything under reduced motion, do not animate.
 * Positions are computed from order, height and `gap`, since a card that only moves fires no
 * layout event on the web. Children must be keyed, and the column must be laid out in flow.
 */
export function Glide({ children, gap = 0 }: { children: ReactNode; gap?: number }) {
  const reduced = useReducedMotion();
  const [heights, setHeights] = useState<Record<string, number>>({});
  const loaded = useRef(false);
  const motions = useRef(new Map<string, Motion>());
  const lastTops = useRef(new Map<string, number>());

  const kids = Children.toArray(children).filter(isValidElement);
  const keys = kids.map((k) => String(k.key));
  const tops = layoutPositions(keys.map((k) => heights[k]), gap);

  const motionFor = (key: string): Motion => {
    let m = motions.current.get(key);
    if (!m) {
      m = { slide: new Animated.Value(0), fade: new Animated.Value(shouldEnter(!loaded.current, reduced) ? 0 : 1), shown: 0, joined: loaded.current };
      const made = m;
      made.slide.addListener(({ value }) => (made.shown = value));
      motions.current.set(key, m);
    }
    return m;
  };
  const items = kids.map((k) => ({ key: String(k.key), node: k, motion: motionFor(String(k.key)) }));

  useLayoutEffect(() => {
    keys.forEach((key, i) => {
      const m = motions.current.get(key);
      const top = tops[i];
      if (!m || top === undefined) return;
      const from = glideOffset(lastTops.current.get(key), top, !reduced, m.shown);
      lastTops.current.set(key, top);
      if (from !== null) {
        m.slide.setValue(from);
        Animated.timing(m.slide, { toValue: 0, duration: motion.base, useNativeDriver: false }).start();
      }
    });
    for (const key of [...motions.current.keys()]) {
      if (!keys.includes(key)) {
        motions.current.delete(key);
        lastTops.current.delete(key);
      }
    }
  });

  useEffect(() => {
    // Joiners start transparent (see motionFor); fade them in once they exist.
    for (const m of motions.current.values()) {
      if (m.fade) Animated.timing(m.fade, { toValue: 1, duration: motion.base, useNativeDriver: false }).start();
    }
    loaded.current = true;
  }, [keys.join("|")]);

  const report = (key: string) => (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setHeights((prev) => (prev[key] === h ? prev : { ...prev, [key]: h }));
  };

  return (
    <View style={{ gap }}>
      {items.map(({ key, node, motion: m }) => {
        // A joiner stays out of the flow until measured, so the cards below hold their places
        // until we know how far to slide them.
        const unmeasured = m.joined && heights[key] === undefined;
        return (
          <Animated.View
            key={key}
            onLayout={report(key)}
            style={[
              { opacity: m.fade, transform: [{ translateY: m.slide }] },
              unmeasured && { position: "absolute", left: 0, right: 0, top: 0 },
            ]}
          >
            {node}
          </Animated.View>
        );
      })}
    </View>
  );
}
