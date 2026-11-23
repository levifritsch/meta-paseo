import type { PluginClientContext } from "@getpaseo/plugin/client";
import { BoardScreen } from "./client/ui/features/BoardScreen";
import { createBoardStore } from "./client/state/store";
import { withStore } from "./client/state/StoreContext";
import { Chats } from "./client/ui/gallery/Chats";
import { Gallery } from "./client/ui/gallery/Gallery";
import { Spikes } from "./client/ui/gallery/Spikes";

const SCREEN_ID = "board";
const GALLERY_ID = "gallery";
const SPIKES_ID = "spikes";
const CHATS_ID = "chats";

export default function contribute(client: PluginClientContext) {
  const store = createBoardStore(); // one per install; screens read it through a provider
  const disposers = [
    client.addScreen({ id: SCREEN_ID, title: "Sessions", Component: BoardScreen }),
    client.addScreen({ id: GALLERY_ID, title: "UI gallery", Component: Gallery }),
    client.addScreen({ id: SPIKES_ID, title: "Spikes", Component: Spikes }),
    client.addScreen({ id: CHATS_ID, title: "Chats", Component: withStore(store, Chats) }),
    client.addCommandCenterItem({
      id: "open-chats",
      title: "Open MetaPaseo chat view",
      icon: "MessageSquare",
      keywords: ["chat", "sessions", "messages"],
      context: "global",
      onSelect: (context) => context.openScreen({ screenId: CHATS_ID }),
    }),
    client.addCommandCenterItem({
      id: "open-spikes",
      title: "Open MetaPaseo spikes (follow-scroll, Glide)",
      icon: "Palette",
      keywords: ["spikes", "scroll", "glide", "sessions"],
      context: "global",
      onSelect: (context) => context.openScreen({ screenId: SPIKES_ID }),
    }),
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
