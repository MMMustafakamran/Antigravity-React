"use client"; // HARNESS: the doc snippet omits it; without it useState fails in an App Router page.

// --- Doc: https://docs.copilotkit.ai/google-antigravity/frontend-tools (verbatim from here) ---
// src/app/demos/frontend-tools/page.tsx
import React, { useState } from "react";
import {
  CopilotKit,
  CopilotSidebar,
  useFrontendTool,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import { Background, DEFAULT_BACKGROUND } from "./background";
import { useFrontendToolsSuggestions } from "./suggestions";

function Chat() {
  const [background, setBackground] = useState<string>(DEFAULT_BACKGROUND);

  useFrontendTool({
    name: "change_background",
    description:
      "Change the page background. Accepts any valid CSS background value — colors, linear or radial gradients, etc.",
    parameters: z.object({
      background: z
        .string()
        .describe("The CSS background value. Prefer gradients."),
    }),
    handler: async ({ background }) => {
      setBackground(background);
      return { status: "success" };
    },
  });
// --- Doc snippet ends here, mid-function ---

  // HARNESS: the rest of Chat is not on the page. Minimal completion that uses the doc's own imports.
  useFrontendToolsSuggestions();
  return (
    <Background background={background}>
      <CopilotSidebar defaultOpen />
    </Background>
  );
}

// HARNESS: the page shows no export. Rendered under the root layout's <CopilotKit agent="antigravity_agent">.
export default function FrontendToolsPage() {
  return <Chat />;
}
