import { Children, isValidElement, useEffect, useRef, type ReactNode } from "react";
import { Animated, type LayoutChangeEvent } from "react-native";
import { motion } from "../tokens/tokens";
import { glideOffset, shouldEnter } from "./glide-math";
import { useReducedMotion } from "./useReducedMotion";

/**
 * Wraps keyed children. When one moves, it slides from where it was. A child that joins after
 * load fades in. Children present at load, and everything under reduced motion, do not animate.
 * Children must be direct, keyed members of one column.
 */
export function Glide({ children }: { children: ReactNode }) {
  const loaded = useRef(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    loaded.current = true;
  }, []);
  return (
    <>
      {Children.toArray(children).map((child) =>
        isValidElement(child) ? (
          <GlideItem key={child.key} presentAtLoad={!loaded.current} reduced={reduced}>
            {child}
          </GlideItem>
        ) : (
          child
        ),
      )}
    </>
  );
}

function GlideItem(props: { presentAtLoad: boolean; reduced: boolean; children: ReactNode }) {
  const born = useRef(props.presentAtLoad);
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(shouldEnter(born.current, props.reduced) ? 0 : 1)).current;
  const shown = useRef(0);
  const lastY = useRef<number | undefined>(undefined);

  useEffect(() => {
    const id = slide.addListener(({ value }) => (shown.current = value));
    if (shouldEnter(born.current, props.reduced)) {
      Animated.timing(fade, { toValue: 1, duration: motion.base, useNativeDriver: false }).start();
    }
    return () => slide.removeListener(id);
  }, [slide, fade, props.reduced]);

  const onLayout = (e: LayoutChangeEvent) => {
    const y = e.nativeEvent.layout.y;
    const from = glideOffset(lastY.current, y, !props.reduced, shown.current);
    lastY.current = y;
    if (from === null) return;
    slide.setValue(from);
    Animated.timing(slide, { toValue: 0, duration: motion.base, useNativeDriver: false }).start();
  };

  return (
    <Animated.View onLayout={onLayout} style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      {props.children}
    </Animated.View>
  );
}
