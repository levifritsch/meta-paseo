import type { PluginServerContext } from "@getpaseo/plugin/server";

// Settings and the rename/interrupt RPC land here (docs/architecture.md, build order 1 and 4).
export default function contribute(_server: PluginServerContext) {
  return () => {};
}
