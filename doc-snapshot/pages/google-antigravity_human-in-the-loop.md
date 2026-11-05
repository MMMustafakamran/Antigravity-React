# HITL Overview

> Allow your agent and users to collaborate on complex tasks.



<!-- interactive demo: hitl-in-chat -->


<Callout type="info" title="See this in Inspector">
  Open Inspector on localhost. Go to **Agents**, then **Frontend Tools**.
  Your tool and its schema are listed.

  More detail: [Inspector](/google-antigravity/inspector).
</Callout>


## What is this?

Human-in-the-loop (HITL) lets an agent pause mid-run to collect input,
confirmation, or a choice from the user, then resume with that answer
folded back into its reasoning. It's what turns an autonomous workflow
into a collaborative one: the agent keeps its context, the user keeps
the steering wheel.

<video
  src="https://cdn.copilotkit.ai/docs/copilotkit/images/coagents/human-in-the-loop-example.mp4"
  className="rounded-lg shadow-xl"
  loop
  playsInline
  controls
  autoPlay
  muted
/>

## When should I use this?

Use HITL when you need:

- **Quality control** — a human gate at high-stakes decision points
- **Edge cases** — graceful fallbacks when the agent's confidence is low
- **Expert input** — lean on the user for domain knowledge the model lacks
- **Reliability** — a more robust loop for real-world, production traffic

## Two patterns for HITL in CopilotKit

<Steps>
  <Step>
    ### Install the Antigravity AG-UI adapter

    ```bash
    pip install ag-ui-antigravity google-antigravity
    ```

  </Step>
  <Step>
    ### Ask for the human with a frontend tool

    The simplest route is an ordinary frontend tool. Register it in the
    browser with `useHumanInTheLoop`, or with `useFrontendTool` and an `async`
    handler that resolves once the user has answered. Each run carries that
    tool definition to the agent, the adapter rebuilds it as a custom
    Antigravity tool, and when the model calls it the call parks as an awaited
    coroutine — the SSE response for that run closes, and the adapter resolves
    the parked call from a later HTTP run with whatever the handler returned.
    The model receives that value as the tool's real return value, so there is
    no proxy tool and no fire-and-forget long-running-tool workaround.

  </Step>
  <Step>
    ### Or pause a server tool with `experimental_interrupt()`

    When the backend decides it needs the user, a Python server tool can pause
    itself on an AG-UI interrupt with the adapter's experimental
    `experimental_interrupt()` and carry on with the answer:

    ```python
    from ag_ui_antigravity import experimental_interrupt

    async def schedule_meeting(topic: str, attendee: str) -> str:
        """Books a meeting once the user picks a time."""
        answer = await experimental_interrupt(
            "schedule_meeting",
            message=f"Pick a time for {topic}",
            metadata={"topic": topic, "attendee": attendee},
        )
        if not answer.resolved:
            return f"Not scheduled ({answer.status})."
        return f"Scheduled for {answer.payload['chosen_label']}."
    ```

    The run ends with `RUN_FINISHED` carrying an interrupt outcome, which
    `useInterrupt` renders; the payload the user resolves it with comes back
    unchanged in `answer.payload`. `answer.status` is `"resolved"`,
    `"cancelled"` or `"abandoned"` (the user sent a new message instead).

  </Step>
  <Step>
    ### Name the tool in the agent's instructions

    That leaves the agent with one job: knowing the tool exists and when to
    call it. A model that is never told about `book_call` will answer in prose
    and the picker will never mount.

    
~~~~python title="hitl.py"
from agents._common import build

HITL_IN_CHAT_PROMPT = (
    "You help users book an onboarding call with the sales team. "
    "When they ask to book a call, call the frontend-provided "
    "`book_call` tool with a short topic and the user's name. "
    "Keep any chat reply to one short sentence."
)


def hitl_in_chat_agent():
    return build(system_instructions=HITL_IN_CHAT_PROMPT)


~~~~


    The frontend tool is dispatched to the browser at most once per turn
    (`deduplicate_tool_calls`, on by default), so a model that re-issues the
    same call after the harness backgrounds it does not ask the user twice.

  </Step>
</Steps>

<Callout type="info" title="ask_question is off in this showcase">
  Antigravity's own `ask_question` built-in tool — the one primitive that would
  park on a real AG-UI interrupt — is disabled here with
  `CapabilitiesConfig(enabled_tools=[BuiltinTools.FINISH])`. The CopilotKit
  demos answer a tool call with a `ToolMessage`, not an interrupt `resume`, so
  a turn that parked on `ask_question` would wait forever. `FINISH` has to stay
  enabled: it is how the harness ends a turn.
</Callout>

CopilotKit ships two complementary ways to pause an agent turn and ask
the human something. They look similar from the outside (the chat
pauses, a custom component appears, the user answers, the run resumes)
but they're wired differently on the backend, and each has its own niche.

| Pattern | Who decides to pause? | Backend surface |
| --- | --- | --- |
| `useHumanInTheLoop` | The **LLM**, by calling a registered client-side tool | A frontend-only tool description (Zod schema + `render`) |
| `useInterrupt` | The **graph**, by calling `interrupt(...)` during a node | A server-side `interrupt()` call in your LangGraph agent |

**Pick `useHumanInTheLoop`** when the pause is an _agent-initiated_
decision — the model chose to ask the user — and you want the picker UI
inlined into the normal tool-call flow.

**Pick `useInterrupt`** when the pause is a _graph-enforced_ checkpoint —
the code path deterministically requires a human answer — and you want
`langgraph.interrupt()` as the server-side contract.

## Pattern 1 — `useHumanInTheLoop` (tool-based)

The agent registers a HITL tool on the client with `useHumanInTheLoop`.
When the LLM calls that tool, CopilotKit routes the call through your
`render` function, which shows a custom component and calls `respond`
with the user's answer. The agent sees the answer as the tool result and
continues from there.

```typescript
// src/app/demos/hitl-in-chat/page.tsx
import React from "react";
import {
  CopilotKit,
  CopilotChat,
  useHumanInTheLoop,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import type { TimeSlot } from "./time-picker-card";
import { TimePickerCard } from "./time-picker-card";

const DEFAULT_SLOTS: TimeSlot[] = [
  { label: "Tomorrow 10:00 AM", iso: "2026-04-19T10:00:00-07:00" },
  { label: "Tomorrow 2:00 PM", iso: "2026-04-19T14:00:00-07:00" },
  { label: "Monday 9:00 AM", iso: "2026-04-21T09:00:00-07:00" },
  { label: "Monday 3:30 PM", iso: "2026-04-21T15:30:00-07:00" },
];

export default function HitlInChatDemo() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="hitl-in-chat">
      <div className="flex justify-center items-center h-screen w-full">
        <div className="h-full w-full max-w-4xl">
          <Chat />
        </div>
      </div>
    </CopilotKit>
  );
}

function Chat() {
  useConfigureSuggestions({
    suggestions: [
      {
        title: "Book a call with sales",
        message:
          "Please book an intro call with the sales team to discuss pricing.",
      },
      {
        title: "Schedule a 1:1 with Alice",
        message: "Schedule a 1:1 with Alice next week to review Q2 goals.",
      },
    ],
    available: "always",
  });

  useHumanInTheLoop({
    agentId: "hitl-in-chat",
    name: "book_call",
    description:
      "Ask the user to pick a time slot for a call. The picker UI presents fixed candidate slots; the user's choice is returned to the agent.",
    parameters: z.object({
      topic: z
        .string()
        .describe("What the call is about (e.g. 'Intro with sales')"),
      attendee: z
        .string()
        .describe("Who the call is with (e.g. 'Alice from Sales')"),
    }),
    render: ({ args, status, respond }: any) => (
      <TimePickerCard
        topic={args?.topic ?? "a call"}
        attendee={args?.attendee}
        slots={DEFAULT_SLOTS}
        status={status}
        onSubmit={(result) => respond?.(result)}
      />
    ),
  });
```

The picker UI is fed a static list of candidate slots — this is just
data the demo page owns, so you can swap in real availability, a
calendar API, or anything else:

```typescript
// src/app/demos/hitl-in-chat/page.tsx
import React from "react";
import {
  CopilotKit,
  CopilotChat,
  useHumanInTheLoop,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import type { TimeSlot } from "./time-picker-card";
import { TimePickerCard } from "./time-picker-card";

const DEFAULT_SLOTS: TimeSlot[] = [
  { label: "Tomorrow 10:00 AM", iso: "2026-04-19T10:00:00-07:00" },
  { label: "Tomorrow 2:00 PM", iso: "2026-04-19T14:00:00-07:00" },
  { label: "Monday 9:00 AM", iso: "2026-04-21T09:00:00-07:00" },
  { label: "Monday 3:30 PM", iso: "2026-04-21T15:30:00-07:00" },
];
```

## Pattern 2 — `useInterrupt` (graph-paused)

With LangGraph's `interrupt()` the pause is enforced by the graph
itself: a node calls `interrupt({...})`, the run suspends, the client
receives the payload, renders a UI, and resumes the run with the user's
answer. CopilotKit's `useInterrupt` hook is the render contract.

See the [`useInterrupt` deep dive](/google-antigravity/human-in-the-loop/useInterrupt) for
the full walkthrough, including the backend tool and render-prop wiring.


<!-- interactive demo: gen-ui-interrupt -->


## Going headless

Both patterns above ship with a `render` prop — CopilotKit handles the
"when to show the picker" logic for you. If you want to drive
interrupt resolution from a custom UI that lives anywhere in the tree
(not necessarily inside a chat), see the
[headless interrupts guide](/google-antigravity/human-in-the-loop/headless) — it shows
how to compose `useAgent`, `agent.subscribe`, and `copilotkit.runAgent`
to build your own `useInterrupt` equivalent.

<IntegrationGrid path="human-in-the-loop" />
