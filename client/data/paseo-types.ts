// Paseo's client types, derived from `usePaseo`. Importing `@getpaseo/client` or
// `@getpaseo/protocol` directly fails the host's build: it resolves type imports from the
// checkout's own node_modules, and a git install has none.
import type { usePaseo } from "@getpaseo/plugin/client";

export type Paseo = ReturnType<typeof usePaseo>;
export type AgentHandle = ReturnType<Paseo["agents"]["ref"]>;
export type PaseoAgent = NonNullable<ReturnType<AgentHandle["current"]>>;
export type TimelinePage = Awaited<ReturnType<AgentHandle["timeline"]["refetch"]>>;
export type TimelineItem = TimelinePage["entries"][number]["item"];
export type ToolCallDetail = Extract<TimelineItem, { type: "tool_call" }>["detail"];
export type PermissionRequest = NonNullable<AgentHandle["pendingPermissions"]>[number];
export type PermissionResponse = Parameters<AgentHandle["respondToPermission"]>[0]["response"];
export type PaseoWorkspace = Awaited<ReturnType<Paseo["workspaces"]["list"]>>["entries"][number];
export type AgentUpdate = Parameters<Parameters<Paseo["agents"]["subscribe"]>[0]>[0];
export type WorkspaceUpdate = Parameters<Parameters<Paseo["workspaces"]["subscribe"]>[0]>[0];
