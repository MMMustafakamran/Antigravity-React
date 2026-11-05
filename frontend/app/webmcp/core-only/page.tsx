"use client";
// HARNESS: loads the doc's webmcp.ts (CopilotKitCore, no provider, no agent) in the browser.
import { useEffect, useState } from "react";

export default function CoreOnlyPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    import("./webmcp").then(({ copilotkit }) => {
      (window as unknown as { __cpk: unknown }).__cpk = copilotkit; // keep the core instance alive
      setReady(true);
    });
  }, []);
  return <p data-testid="core-ready">{ready ? "core loaded" : "loading"}</p>;
}
