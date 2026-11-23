import type { PluginServerContext } from "@getpaseo/plugin/server";
import { SESSION_SETTINGS } from "./shared/settings";

// Only host-scope settings register here: the host refuses device-scope ones ("Device settings
// belong to the client"). BOARD_SETTINGS is device-scope and is read and written from the client.
// The rename/interrupt RPC joins this in stage 4b.6.
export default function contribute(server: PluginServerContext) {
  server.registerSettings(SESSION_SETTINGS);
  return () => {};
}
