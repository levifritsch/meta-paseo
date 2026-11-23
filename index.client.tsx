import type { PluginClientContext } from "@getpaseo/plugin/client";
import { BoardScreen } from "./src/ui/features/BoardScreen";

const SCREEN_ID = "board";

export default function contribute(client: PluginClientContext) {
  const disposers = [client.addScreen({ id: SCREEN_ID, title: "Sessions", Component: BoardScreen })];
  return () => {
    for (const dispose of disposers) dispose();
  };
}
