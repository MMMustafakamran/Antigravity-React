"use client";
// --- Doc: https://docs.copilotkit.ai/google-antigravity/generative-ui/components/standard-catalog "Replace a component" (verbatim) ---
import {
  createGenerativeUI,
  standardUI,
  type GenerativeUIComponentProps,
} from "@copilotkit/react-core/v2/generative-ui";

function MyCard({ children }: GenerativeUIComponentProps<typeof standardUI, "Card">) {
  return <div className="rounded-2xl border p-6 shadow-sm">{children}</div>;
}

export const appUI = createGenerativeUI({
  id: "acme/app@1",
  extends: [standardUI],
  overrides: { Card: { component: MyCard } },
  components: {},
});
// --- end doc ---

import { CopilotChat, CopilotKitProvider } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

export default function Page() {
  return (
    // HARNESS: doc's "Use it as it is" provider line, with appUI and agentId="antigravity_agent" on CopilotChat (never named on the page).
    <CopilotKitProvider runtimeUrl="/api/copilotkit-gui" /* HARNESS: doc says "/api/copilotkit"; the doc's own [[...slug]] runtime (GET+POST) is served at /api/copilotkit-gui, see app/api/copilotkit-gui */ generativeUI={{ ui: appUI }}>
      <CopilotChat agentId="antigravity_agent" />
    </CopilotKitProvider>
  );
}
