"use client";
// HARNESS: zod import never shown on the page.
import { z } from "zod";
// --- Doc: https://docs.copilotkit.ai/google-antigravity/generative-ui/components/from-a2ui "Convert a custom catalog" After (verbatim) ---
import {
  createGenerativeUI,
  standardUI,
} from "@copilotkit/react-core/v2/generative-ui";

export const appUI = createGenerativeUI({
  id: "acme/flights@1",
  extends: [standardUI],
  components: {
    Airport: {
      component: Airport,
      description: "An airport by IATA code, with its city under it.",
      props: z.object({ code: z.string(), city: z.string() }),
    },
    Arrow: { component: Arrow, description: "An arrow between two airports." },
  },
});
// --- end doc ---

// HARNESS: the doc never shows the Airport / Arrow renderers ("Your renderers stay as they are"). Minimal stand-ins.
function Airport({ code, city }: { code: string; city: string }) {
  return (
    <div style={{ border: "1px solid #888", padding: 8, display: "inline-block" }}>
      <b>{code}</b>
      <div>{city}</div>
    </div>
  );
}
function Arrow() {
  return <span style={{ fontSize: 24, padding: "0 8px" }}>→</span>;
}

import { CopilotChat, CopilotKitProvider } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

export default function Page() {
  return (
    // Doc "After" provider line. HARNESS: agentId="antigravity_agent" on CopilotChat added (never named on the page).
    <CopilotKitProvider runtimeUrl="/api/copilotkit" generativeUI={{ ui: appUI }}>
      <CopilotChat agentId="antigravity_agent" />
    </CopilotKitProvider>
  );
}
