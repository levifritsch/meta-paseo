// The two persisted records. Both share one loose schema on purpose: the real validation, with
// migrate and a fallback that keeps the original, lives in shared/core (invariant 8). A strict host
// schema here would reject a newer-version record outright and hide it from us.
import { defineSettings } from "@getpaseo/plugin";
import { z } from "zod";

const document = z.looseObject({});

/** Columns, sections, sort, view, fold state. One per client install. */
export const BOARD_SETTINGS = defineSettings({ id: "board", scope: "device", version: 1, schema: document });

/** Session colors and hand-collapsed cards. One per host, shared by every client. */
export const SESSION_SETTINGS = defineSettings({ id: "sessions", scope: "host", version: 1, schema: document });
