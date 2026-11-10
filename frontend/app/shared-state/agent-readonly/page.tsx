"use client"; // HARNESS: needed in the App Router; the doc file omits it.
// --- Doc (verbatim): src/app/demos/readonly-state-agent-context/page.tsx ---
import React, { useState } from "react";
import {
  CopilotKit,
  CopilotPopup,
  useAgentContext,
} from "@copilotkit/react-core/v2";

import { ACTIVITIES, DemoLayout } from "./demo-layout";
import { useReadonlyStateAgentContextSuggestions } from "./suggestions";

export default function ReadonlyStateAgentContextDemo() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent="readonly-state-agent-context"
    >
      <DemoContent />
      <CopilotPopup
        agentId="readonly-state-agent-context"
        defaultOpen={true}
        labels={{ chatInputPlaceholder: "Ask about your context..." }}
      />
    </CopilotKit>
  );
}

function DemoContent() {
  const [userName, setUserName] = useState("Atai");
  const [userTimezone, setUserTimezone] = useState("America/Los_Angeles");
  const [recentActivity, setRecentActivity] = useState<string[]>([
    ACTIVITIES[0],
    ACTIVITIES[2],
  ]);
  // --- end doc (the doc's DemoContent stops here) ---
  // --- Doc (verbatim, second snippet) ---
  useAgentContext({
    description: "The currently logged-in user's display name",
    value: userName,
  });
  useAgentContext({
    description: "The user's IANA timezone (used when mentioning times)",
    value: userTimezone,
  });
  useAgentContext({
    description: "The user's recent activity in the app, newest first",
    value: recentActivity,
  });
  // --- end doc ---
  // HARNESS: the rest of DemoContent is never shown.
  useReadonlyStateAgentContextSuggestions();
  return <DemoLayout userName={userName} userTimezone={userTimezone} recentActivity={recentActivity} />;
}
