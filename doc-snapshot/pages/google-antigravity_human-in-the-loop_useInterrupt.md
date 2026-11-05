# Pausing the Agent for Input

> Pause an agent run mid-tool, hand control to a custom React component, and resume with the user's answer.


<!-- interactive demo: gen-ui-interrupt -->


## What is this?

`useInterrupt` lets your agent pause mid-run, hand control to the user
through a custom React component, and resume with whatever the user
returns. How that pause is implemented depends on the framework's
runtime.



This framework ships a first-class interrupt primitive that lets running
work suspend itself and hand control to the client
([LangGraph](https://docs.langchain.com/oss/python/langgraph/interrupts),
[AWS Strands](https://strandsagents.com/docs/user-guide/concepts/interrupts/)).
The run is frozen server-side until the client resolves the interrupt with a
payload, at which point execution resumes as if the interrupt call had simply
returned that payload.

CopilotKit's `useInterrupt` is the frontend half of that contract: it
subscribes to the paused run, renders whatever component you give it,
and calls the agent back with the user's answer.







## When should I use this?

Reach for `useInterrupt` when the pause is a **graph-enforced
checkpoint** where the code path _must_ stop and wait for a human,
not an LLM-initiated tool call. Typical cases:

- A sensitive action (payments, irreversible writes) must be approved
- A required piece of state isn't known and can only be collected from the user
- The agent explicitly reaches an approval node in a longer workflow
- You want the server-side contract to be `interrupt(...)` and resume with a payload

For LLM-initiated pauses where the model decides on the fly to ask
the user, prefer [`useHumanInTheLoop`](../human-in-the-loop).



## The backend: `interrupt()` inside a tool

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

The example agent exposes a `schedule_meeting` tool. When the model
calls it, the tool interrupts itself with the meeting context. The run
freezes here until the client resolves; the resolution becomes the return
value of the interrupt call, which the tool then turns into a final string
for the model:

```python
# src/agents/interrupt_agent.py
from __future__ import annotations

from datetime import datetime, time, timedelta
from typing import Any, List, Optional
from zoneinfo import ZoneInfo

from langchain.agents import create_agent
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.types import interrupt
from copilotkit import CopilotKitMiddleware


SYSTEM_PROMPT = (
    "You are a scheduling assistant. Whenever the user asks you to book a "
    "call / schedule a meeting, you MUST call the `schedule_meeting` tool. "
    "Pass a short `topic` describing the purpose and `attendee` describing "
    "who the meeting is with. After the tool returns, confirm briefly "
    "whether the meeting was scheduled and at what time, or that the user "
    "cancelled."
)

# Demo-only fixed timezone. A real app would use the user's calendar +
# locale (e.g. zoneinfo.ZoneInfo(user.timezone) and Google Calendar /
# Outlook availability); we hardcode Pacific so screenshots are stable.
_DEMO_TZ = ZoneInfo("America/Los_Angeles")


def _candidate_slots() -> List[dict]:
    """Upcoming candidate slots, relative to "now" so the picker never
    shows stale dates."""
    now = datetime.now(_DEMO_TZ)
    tomorrow = (now + timedelta(days=1)).date()
    # Skip a week when the result would collide with `tomorrow` — i.e.
    # today is Mon (0 days away, picker would show two slots both
    # labelled "Monday") or Sun (1 day away, picker would show
    # "Tomorrow" and "Monday" both pointing at the same date).
    days_to_monday = (7 - now.weekday()) % 7
    if days_to_monday <= 1:
        days_to_monday += 7
    next_monday = (now + timedelta(days=days_to_monday)).date()
    candidates = [
        ("Tomorrow 10:00 AM", tomorrow, time(10, 0)),
        ("Tomorrow 2:00 PM", tomorrow, time(14, 0)),
        ("Monday 9:00 AM", next_monday, time(9, 0)),
        ("Monday 3:30 PM", next_monday, time(15, 30)),
    ]
    return [
        {"label": label, "iso": datetime.combine(d, t, _DEMO_TZ).isoformat()}
        for label, d, t in candidates
    ]


@tool
def schedule_meeting(topic: str, attendee: Optional[str] = None) -> str:
    """Ask the user to pick a time slot for a call, via an in-chat picker.

    Args:
        topic: Short human-readable description of the call's purpose.
        attendee: Who the call is with (optional).

    Returns:
        Human-readable result string describing the chosen slot or
        indicating the user cancelled.
    """
    # `interrupt()` pauses the LangGraph run and forwards a structured
    # payload to the client. The frontend v2 `useInterrupt` hook renders
    # the picker inline in the chat, then calls `resolve(...)` with the
    # user's selection — that value comes back here as `response`.
    response: Any = interrupt(
        {
            "topic": topic,
            "attendee": attendee,
            "slots": _candidate_slots(),
        }
    )

    if isinstance(response, dict):
        if response.get("cancelled"):
            return f"User cancelled. Meeting NOT scheduled: {topic}"
        chosen_label = response.get("chosen_label") or response.get("chosen_time")
        if chosen_label:
            return f"Meeting scheduled for {chosen_label}: {topic}"

    return f"User did not pick a time. Meeting NOT scheduled: {topic}"


```

Two things to note:

- The payload (`{"topic": topic, "attendee": attendee}`) is what the
  frontend reads off the interrupt. Keep it a plain, serializable object.
  It's the "pause-time context" the UI needs to render. Where it lands
  depends on the bridge: LangGraph hands it to `render` as `event.value`,
  while a standard AG-UI interrupt carries it on the interrupt itself, either
  under `metadata` or JSON-encoded into `message`. Read the channels your
  bridge uses rather than assuming one.
- The return-side contract (`{chosen_label, chosen_time}` or
  `{cancelled: true}`) is entirely yours. The client can send anything
  as the resolve payload; the tool is the one that gives it meaning.

## The frontend: `useInterrupt` render prop

On the client you register a `useInterrupt` hook per agent. When the
paused run arrives, `render` receives both the raw `event` and the
`interrupt` itself, and `resolve(...)` is how you resume the run. Where the
payload sits depends on how the framework pauses: a legacy custom-event
interrupt carries it on `event.value`, while a standard AG-UI interrupt
carries it on the `interrupt` (its `metadata`, or a JSON-encoded `message`,
depending on the bridge). Read the channel your framework uses:

```typescript
// src/app/demos/gen-ui-interrupt/page.tsx
import {
  CopilotKit,
  CopilotChat,
  useInterrupt,
} from "@copilotkit/react-core/v2";
import type { TimeSlot } from "./_components/time-picker-card";
import { TimePickerCard } from "./_components/time-picker-card";
import { generateFallbackSlots } from "../_shared/interrupt-fallback-slots";
import { useGenUiInterruptSuggestions } from "./suggestions";

export default function GenUiInterruptDemo() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="gen-ui-interrupt">
      <div className="flex justify-center items-center h-screen w-full">
        <div className="h-full w-full max-w-4xl">
          <Chat />
        </div>
      </div>
    </CopilotKit>
  );
}

function Chat() {
  useGenUiInterruptSuggestions();

  // `useInterrupt` is the low-level primitive for handling LangGraph
  // `interrupt(...)` events. The backend's `schedule_meeting` tool surfaces
  // a structured payload — `{ topic, attendee, slots }` — which we render
  // inline in the chat as a message bubble. Calling `resolve(...)` resumes
  // the LangGraph run with the user's selection.
  useInterrupt({
    agentId: "gen-ui-interrupt",
    renderInChat: true,
    render: ({ event, resolve }) => {
      // The AG-UI adapter JSON-stringifies interrupt values, so parse
      // when needed to extract the structured payload.
      const raw = event.value ?? {};
      const payload = (typeof raw === "string" ? JSON.parse(raw) : raw) as {
        topic?: string;
        attendee?: string;
        slots?: TimeSlot[];
      };
      const slots =
        payload.slots && payload.slots.length > 0
          ? payload.slots
          : generateFallbackSlots();
      return (
        <TimePickerCard
          topic={payload.topic ?? "a call"}
          attendee={payload.attendee}
          slots={slots}
          onSubmit={(result) => {
            // Defer resolve so React commits the picked/cancelled state
            // before useInterrupt clears the interrupt element. A single
            // requestAnimationFrame is not reliable — rAF fires before
            // React's commit in some scheduling scenarios. Using a short
            // setTimeout ensures the commit lands first and the user sees
            // the "Booked"/"Cancelled" badge before the card unmounts.
            setTimeout(() => resolve(result), 500);
          }}
        />
      );
    },
  });
```

Whatever you pass to `resolve` is round-tripped back to the agent as
the return value of the matching `interrupt(...)` call.







### Key props

- **`agentId`** — must match a runtime-registered agent. If omitted, the
  hook assumes `"default"`. A mismatch means the interrupt never fires.
- **`render`** — receives `{ event, interrupt, resolve }`. The payload you
  passed to `interrupt(...)` on the server arrives on `event.value` for a
  legacy custom-event interrupt and on the `interrupt` for a standard one.
- **`renderInChat`** — when `true` (as above), the picker appears inline
  in the chat transcript, between the paused assistant turn and the
  still-pending continuation.

## Multiple interrupts? Add a type and gate with `enabled`

If your graph issues more than one kind of interrupt (e.g. `"ask"` vs
`"approval"`), tag each with a `type` field on the payload and install
one `useInterrupt` per shape, each gated by an `enabled` predicate:

```tsx
useInterrupt({
  agentId: "gen-ui-interrupt",
  enabled: (event) => event.value.type === "ask",
  render: ({ event, resolve }) => (
    <AskCard question={event.value.content} onAnswer={resolve} />
  ),
});

useInterrupt({
  agentId: "gen-ui-interrupt",
  enabled: (event) => event.value.type === "approval",
  render: ({ event, resolve }) => (
    <ApproveCard content={event.value.content} onAnswer={resolve} />
  ),
});
```

## Preprocess with `handler`

For cases where the interrupt can sometimes be resolved _without_ user
input (e.g. the current user already has permission), pass a `handler`
that runs before `render`. The handler can call `resolve(...)` itself
to resume the agent early — the interrupt card unmounts when the resume
run starts. Or return a value that `render` receives as `result`:

```tsx
useInterrupt({
  agentId: "gen-ui-interrupt",
  handler: async ({ event, resolve }) => {
    const dept = await lookupUserDepartment();
    if (event.value.accessDepartment === dept || dept === "admin") {
      resolve({ code: "AUTH_BY_DEPARTMENT" });
      return; // agent will resume; card unmounts when the run starts
    }
    return { dept };
  },
  render: ({ result, event, resolve }) => (
    <RequestAccessCard
      dept={result?.dept}
      onRequest={() => resolve({ code: "REQUEST_AUTH" })}
      onCancel={() => resolve({ code: "CANCEL" })}
    />
  ),
});
```



## AG-UI standard interrupt flow vs. legacy

`useInterrupt` supports two interrupt transports. Understanding which one your
agent uses helps you write the right `render` code.

### Standard flow (`RUN_FINISHED` with `outcome.type === "interrupt"`)

When the agent backend conforms to the AG-UI protocol, it signals an interrupt
by emitting a `RUN_FINISHED` event whose outcome carries the interrupts array:

```
outcome.type === "interrupt"
outcome.interrupts  // Interrupt[]
```

The hook detects this on `onRunFinishedEvent` and exposes the interrupts on the
render props **after** `onRunFinalized` fires. Your `render` function receives:

- **`interrupt`** — the primary `Interrupt` (`interrupts[0]`), with shape
  `{ id, reason, message?, toolCallId?, responseSchema?, expiresAt?, metadata? }`.
- **`interrupts`** — the full open set (usually one, but multi-interrupt is
  supported — see below).
- **`resolve(payload?, interruptId?)`** — records `{ status: "resolved", payload }`
  for the targeted interrupt (defaults to the primary). The agent run resumes
  once every open interrupt has a response.
- **`cancel(interruptId?)`** — records `{ status: "cancelled" }` for the
  targeted interrupt. Same accumulate-then-submit logic applies.

### Legacy flow (`on_interrupt` custom event)

Older agents (or agents not yet migrated to the AG-UI interrupt spec) emit a
custom `on_interrupt` event. The hook detects this on `onCustomEvent` and sets
`interrupt` to `null` and `interrupts` to `[]`. The payload is in
`event.value`. Calling `resolve(payload)` resumes via `forwardedProps.command`
(the legacy resume mechanism). `cancel()` dismisses the interrupt without
resuming — the agent never receives a response.

### Priority

If both signals appear on the same run (unlikely but possible during migration),
the standard flow wins.

### Approve / Cancel example

```tsx
function ApprovalInterrupt() {
  useInterrupt({
    render: ({ interrupt, resolve, cancel }) => (
      <div className="p-3 border rounded">
        <p>{interrupt?.message ?? "Approve this action?"}</p>
        <div className="mt-2 flex gap-2">
          <button onClick={() => resolve({ approved: true })}>Approve</button>
          <button onClick={() => cancel()}>Cancel</button>
        </div>
      </div>
    ),
  });
  return null;
}
```

`resolve({ approved: true })` records a resolved entry and submits the `resume`
array to the agent. `cancel()` records a cancelled entry and does the same.
Both return the `RunAgentResult` once the run restarts.

### Multi-interrupt behavior

Some agents issue more than one interrupt in a single run (e.g. two independent
approvals). Each interrupt has its own `id`. Address them individually:

```tsx
useInterrupt({
  render: ({ interrupts, resolve, cancel }) => (
    <ul>
      {interrupts.map((i) => (
        <li key={i.id}>
          {i.message}
          <button onClick={() => resolve({ ok: true }, i.id)}>Approve</button>
          <button onClick={() => cancel(i.id)}>Cancel</button>
        </li>
      ))}
    </ul>
  ),
});
```

The agent run only resumes once **every** open interrupt has been addressed.
Calling `resolve` or `cancel` with a specific `interruptId` marks that interrupt
done; the hook auto-submits the accumulated responses when the last one is
addressed. If you omit `interruptId`, the primary interrupt (`interrupts[0]`)
is targeted.

### `responseSchema` — surface only, no client-side validation

The `Interrupt` type exposes a `responseSchema` field (a JSON Schema object)
that the agent can use to describe the expected payload shape. `useInterrupt`
surfaces this field on `interrupt.responseSchema` for your UI to read
(e.g. to drive a form), but it does **not** validate `resolve` payloads against
it. Validation is the agent's responsibility on resume.

## Going further

- [Tool-based HITL with `useHumanInTheLoop`](../human-in-the-loop) — for
  LLM-initiated pauses.
- [Headless interrupts](./headless) — compose the lower-level primitives
  (`useAgent`, `agent.subscribe`, `copilotkit.runAgent`) to resolve
  interrupts outside a chat surface.
