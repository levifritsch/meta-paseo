import type { PluginServerContext } from "@getpaseo/plugin/server";
import { BOARD_SETTINGS, SESSION_SETTINGS } from "./shared/settings";

// The rename/interrupt RPC joins these in stage 4b.6.
export default function contribute(server: PluginServerContext) {
  server.registerSettings(BOARD_SETTINGS);
  server.registerSettings(SESSION_SETTINGS);
  return () => {};
}
