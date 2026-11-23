import type { PluginClientContext } from "@getpaseo/plugin/client";
import { BoardScreen } from "./src/ui/features/BoardScreen";
import { Gallery } from "./src/ui/gallery/Gallery";

const SCREEN_ID = "board";
const GALLERY_ID = "gallery";

export default function contribute(client: PluginClientContext) {
  const disposers = [
    client.addScreen({ id: SCREEN_ID, title: "Sessions", Component: BoardScreen }),
    client.addScreen({ id: GALLERY_ID, title: "UI gallery", Component: Gallery }),
    client.addCommandCenterItem({
      id: "open-gallery",
      title: "Open Session Board UI gallery",
      icon: "Palette",
      keywords: ["gallery", "atoms", "ui", "sessions"],
      context: "global",
      onSelect: (context) => context.openScreen({ screenId: GALLERY_ID }),
    }),
  ];
  return () => {
    for (const dispose of disposers) dispose();
  };
}
