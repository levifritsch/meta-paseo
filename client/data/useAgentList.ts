import { usePaseo } from "@getpaseo/plugin/client";
import { useEffect, useState } from "react";
import type { PaseoAgent } from "./paseo-types";

const POLL_MS = 3000;

/** Top-level sessions, most recently updated first. Polled; fine for a dev picker. */
export function useAgentList(): PaseoAgent[] {
  const paseo = usePaseo();
  const [agents, setAgents] = useState<PaseoAgent[]>([]);
  useEffect(() => {
    let live = true;
    const load = () =>
      paseo.agents.list().then(
        (r) => {
          if (!live) return;
          const top = r.entries.map((e) => e.agent).filter((a) => !a.background);
          setAgents(top.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)));
        },
        () => {},
      );
    void load();
    const t = setInterval(load, POLL_MS);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [paseo]);
  return agents;
}
