# Headless Interrupts

> Resolve agent interrupts from any UI, without a useInterrupt render slot.


<!-- interactive demo: interrupt-headless -->


## What is this?

`useInterrupt`'s `render` callback is the 80% path: it keeps the UI
glued to a `<CopilotChat>` transcript and handles "when to show the
picker" logic for you. This page covers the escape hatch: a
**render-less** interrupt resolver you assemble from the same
primitives `useInterrupt` uses internally — a pattern that lives
anywhere in your React tree, takes any shape you like (button grid,
form, modal, keyboard shortcut), and resolves the interrupt without
mounting a chat at all.



The underlying primitive is the framework's own interrupt call. How it
reaches the client depends on the bridge, and there are two headless shapes
to match:

- A bridge that surfaces the pause as an `on_interrupt` custom event
  (LangGraph): subscribe to that event and resume the run by calling
  `copilotkit.runAgent({...})` with the matching `resume` payload.
- A bridge that finishes the run with a standard AG-UI interrupt outcome
  (AWS Strands): the run's final `RUN_FINISHED` carries
  `outcome: { type: "interrupt", interrupts: [...] }`. Call `useInterrupt` with
  `renderInChat: false` and place the element it returns wherever you like;
  `resolve(...)` resumes the run.

Either way, no chat surface is required.







## When should I use this?

- **Testing / Playwright fixtures** — a deterministic, chat-less button
  grid is easier to drive than a chat surface where the picker only
  appears after an LLM call.
- **Non-chat UIs** — dashboards, side panels, inspector surfaces, or
  any place where you want the _agent's interrupt_ without the _chat
  transcript_.
- **Custom flow control** — when you need to know exactly when the
  interrupt arrived (e.g. to gate other UI) and when it was resolved.
- **Research / debugging** — when you want to observe the raw AG-UI
  custom events without the abstraction layer.

If you just want "a picker in chat", just use
[`useInterrupt`](./useInterrupt).



## The primitives

<Steps>
  <Step>
    ### Install the Antigravity AG-UI adapter

    ```bash
    pip install ag-ui-antigravity google-antigravity
    ```

  </Step>
  <Step>
    ### Wire the agent once — chat and code share it

    `copilotkit.runAgent`, `agent.subscribe` and `agent.addMessage` drive runs
    against the same AG-UI endpoint your chat UI posts to, so there is no
    second backend to set up: build the `AntigravityAgent` the way any chat
    demo does and every entry point sees the same model, tools and session.

    
~~~~python title="_common.py"
def api_key() -> str | None:
    """The Gemini API key.

    ``GEMINI_API_KEY`` is the only name the Antigravity SDK reads. The showcase
    fleet exports ``GOOGLE_API_KEY`` for its Gemini integrations, so accept
    that too rather than fail on the first model call.
    """
    return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")


def gemini_base_url() -> str | None:
    """The Gemini-compatible server to call instead of Google's API.

    Showcase compose sets ``GOOGLE_GEMINI_BASE_URL=http://aimock:4010``, the
    same variable the google-adk integration reads.
    """
    return os.environ.get("GOOGLE_GEMINI_BASE_URL", "").rstrip("/") or None


def aimock_headers() -> dict[str, str]:
    """Headers for a model call: the package's fixture context plus the
    current request's mock and diagnostic headers.

    ``X-AIMock-Context`` is fixed: it selects this package's fixtures whatever
    the request says. The rest comes from the inbound request (captured by
    ``HeaderForwardingHTTPMiddleware``) and is forwarded only when present, so
    ordinary demo traffic is never forced into strict mode.
    """
    forwarded = {
        k: v
        for k, v in get_forwarded_headers().items()
        if k.startswith(_FORWARDED_PREFIXES)
    }
    return {**forwarded, "x-aimock-context": SLUG}


def endpoint() -> GeminiAPIEndpoint | None:
    """Where every model call goes: aimock under compose, Google's API otherwise.

    Passed to the adapter as a callable, so it runs each time a session is
    built, inside that conversation's first request. The harness makes the
    model calls itself, so headers can only reach them on the endpoint: the
    request's ``X-AIMock-Strict`` and ``x-test-id``/``x-diag-*`` ride along
    from here (PNI-576). They are fixed per conversation, because the SDK
    sets a conversation's model configuration when it starts.
    """
    base_url = gemini_base_url()
    if base_url is None:
        return None
    return GeminiAPIEndpoint(
        base_url=base_url,
        api_key=api_key(),
        http_headers=aimock_headers(),
    )


def chat_only_capabilities() -> CapabilitiesConfig:
    """Only ``finish`` stays enabled.

    ``search_web`` returns an empty summary without Google credentials and the
    model retries it forever; ``ask_question`` would park on an interrupt the
    CopilotKit demos never answer. ``finish`` is how the harness ends a turn.
    """
    return CapabilitiesConfig(
        enabled_tools=[BuiltinTools.FINISH], enable_subagents=False
    )


_DIRS_READY = False


def _ensure_dirs() -> None:
    """Creates the workspace / save_dir once, on first agent construction.

    Deliberately NOT done at import time: the defaults live under ``/data``,
    which only exists inside the container image, so an import-time
    ``os.makedirs`` blows up on a developer machine (read-only ``/`` on macOS)
    and takes every ``import agent_server`` — including the package's pytest
    suite — down with it.
    """
    global _DIRS_READY
    if _DIRS_READY:
        return
    os.makedirs(WORKSPACE, exist_ok=True)
    os.makedirs(SAVE_DIR, exist_ok=True)
    _DIRS_READY = True


_POOL = None


def shared_pool():
    """One HarnessPool for the whole server: one Go process, not one per agent."""
    global _POOL
    if _POOL is None:
        from ag_ui_antigravity.harness_pool import HarnessPool

        _POOL = HarnessPool()
    return _POOL


def build(**kwargs):
    """Creates an AntigravityAgent with the package defaults applied."""
    from ag_ui_antigravity import AntigravityAgent

    _ensure_dirs()

    defaults = dict(
        model=MODEL,
        api_key=api_key(),
        endpoint=endpoint,
        workspaces=[WORKSPACE],
        save_dir=SAVE_DIR,
        harness_pool=shared_pool(),
        capabilities=chat_only_capabilities(),
        session_timeout_seconds=SESSION_TIMEOUT_SECONDS,
        max_sessions=MAX_SESSIONS,
        max_tool_calls_per_turn=MAX_TOOL_CALLS_PER_TURN,
    )
    defaults.update(kwargs)
    return AntigravityAgent(**defaults)


~~~~


    Sessions are keyed by `thread_id` inside the agent, so a headless run that
    reuses a thread continues that conversation, and a fresh `thread_id`
    starts a new one.

  </Step>
</Steps>

<Callout type="info" title="Headless interrupts come from server tools">
  The headless interrupt-resolver pattern — read the interrupt off the agent,
  answer it with a `resume` — works when a Python server tool pauses with the
  adapter's `experimental_interrupt()` (see the human-in-the-loop setup). The harness's
  own `ask_question` built-in, which would also park on an interrupt, is
  disabled in this showcase. For asking the user from code without a backend
  tool, use the frontend-tool Promise pattern: register the tool with
  `useFrontendTool` and an `async` handler, and resolve its promise when your
  own UI has the answer.
</Callout>

The simplest headless pattern uses `useInterrupt` with `renderInChat: false`.
Instead of publishing the element into `<CopilotChat>`, the hook returns the
interrupt element directly so you can place it anywhere in your tree:

```tsx
function ApprovalPanel() {
  const element = useInterrupt({
    renderInChat: false,
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

  // `element` is null while no interrupt is active; render it wherever you like.
  return <div className="approval-panel">{element}</div>;
}
```

`interrupt` carries the primary AG-UI `Interrupt` object
(`{ id, reason, message?, responseSchema?, expiresAt?, ... }`).
`resolve(payload)` submits the user's response and resumes the agent.
`cancel()` cancels the interrupt and resumes. Both return a
`Promise<RunAgentResult | void>` — void while waiting on further interrupts
when more than one is open.

Under the hood, `useInterrupt` composes two public APIs:

1. **`agent.subscribe({ onCustomEvent, onRunStartedEvent, onRunFinishedEvent, onRunFinalized, onRunFailed })`**
   — every `AbstractAgent` exposes an AG-UI event subscription.
   Standard interrupts arrive on `onRunFinishedEvent` with
   `{ outcome: { type: "interrupt", interrupts: [...] } }`; legacy LangGraph
   interrupts arrive as a custom event named `on_interrupt`.
2. **`copilotkit.runAgent({ agent, resume })`** (standard) or
   **`copilotkit.runAgent({ agent, forwardedProps: { command: { resume, interruptEvent } } })`** (legacy)
   — the same call `useInterrupt`'s `resolve()` / `cancel()` makes to resume a paused run.

What that region shows depends on the framework. Where the framework pauses
with a legacy custom event, it is a hand-rolled hook over the raw
subscription; where it pauses with a standard AG-UI interrupt, the same
`useInterrupt` call with `renderInChat: false` is all that is needed, and the
snippet shows that instead. Either way, the raw primitives remain available
when you want full control (testing fixtures, custom accumulation logic):

```typescript
// src/app/demos/interrupt-headless/page.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CopilotKit,
  CopilotChat,
  useAgent,
  useConfigureSuggestions,
  useCopilotKit,
} from "@copilotkit/react-core/v2";
import { generateFallbackSlots } from "../_shared/interrupt-fallback-slots";
import type { TimeSlot } from "../_shared/interrupt-fallback-slots";

const INTERRUPT_EVENT_NAME = "on_interrupt";

type InterruptPayload = {
  topic?: string;
  attendee?: string;
  slots?: TimeSlot[];
};

type InterruptEvent = {
  name: string;
  value: InterruptPayload;
};

export default function InterruptHeadlessDemo() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="interrupt-headless">
      <Layout />
    </CopilotKit>
  );
}

function Layout() {
  const { pending, resolve } = useHeadlessInterrupt("interrupt-headless");

  useConfigureSuggestions({
    suggestions: [
      {
        title: "Book a call with sales",
        message: "Book an intro call with the sales team to discuss pricing.",
      },
      {
        title: "Schedule a 1:1 with Alice",
        message: "Schedule a 1:1 with Alice next week to review Q2 goals.",
      },
    ],
    available: "always",
  });

  return (
    <div className="grid h-screen grid-cols-[1fr_420px] bg-[#FAFAFC]">
      <AppSurface pending={pending} resolve={resolve} />
      <div className="border-l border-[#DBDBE5] bg-white">
        <CopilotChat agentId="interrupt-headless" className="h-full" />
      </div>
    </div>
  );
}

function useHeadlessInterrupt(agentId: string): {
  pending: InterruptEvent | null;
  resolve: (response: unknown) => Promise<unknown>;
} {
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId });
  const [pending, setPending] = useState<InterruptEvent | null>(null);
  const pendingRef = useRef<InterruptEvent | null>(null);
  pendingRef.current = pending;

  useEffect(() => {
    let local: InterruptEvent | null = null;
    const sub = agent.subscribe({
      onCustomEvent: ({ event }) => {
        if (event.name === INTERRUPT_EVENT_NAME) {
          // The AG-UI adapter JSON-stringifies interrupt values, so
          // parse when the value arrives as a string.
          const raw = event.value ?? {};
          local = {
            name: event.name,
            value: (typeof raw === "string"
              ? JSON.parse(raw)
              : raw) as InterruptPayload,
          };
        }
      },
      onRunStartedEvent: () => {
        local = null;
        setPending(null);
      },
      onRunFinalized: () => {
        if (local) {
          setPending(local);
          local = null;
        }
      },
      onRunFailed: () => {
        local = null;
        setPending(null);
      },
    });
    return () => sub.unsubscribe();
  }, [agent]);

  const resolve = useMemo(
    () => async (response: unknown) => {
      const snapshot = pendingRef.current;
      try {
        return await copilotkit.runAgent({
          agent,
          forwardedProps: {
            command: {
              resume: response,
              interruptEvent: snapshot?.value,
            },
          },
        });
      } catch (err) {
        // Catastrophic rejection (network error, auth failure, validation
        // reject) may fire before the run starts, so onRunFailed never runs.
        // Clear pending here so the popup unmounts. Symmetric with the
        // framework resolve catch + onRunFailed handler — all write null,
        // no race. Caller still sees the rethrow.
        console.error(
          "[interrupt-headless] resume runAgent rejected; clearing pending + rethrowing",
          err,
        );
        setPending(null);
        throw err;
      }
    },
    [agent, copilotkit],
  );

  return { pending, resolve };
}
```

A few things the hand-rolled variant is careful about:

- It stages the incoming event in a local ref and only commits
  it to React state on `onRunFinalized`, mirroring `useInterrupt`,
  which doesn't surface the interrupt until the run has actually paused
  (not just when the event fires mid-stream).
- `onRunStartedEvent` clears any stale pending state, so kicking off a
  new turn always starts from a clean slate.
- `onRunFailed` drops the staged event so a transport hiccup doesn't
  leave the UI stuck showing a picker for a run that never paused.







## Driving it from plain UI

The preferred approach uses `useInterrupt` with `renderInChat: false` — no
hand-rolled subscription, no `<CopilotChat>`, no render prop:

```tsx
function HeadlessInterruptPanel() {
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: "interrupt-headless" });

  const kickOff = (prompt: string) => {
    agent.addMessage({ id: crypto.randomUUID(), role: "user", content: prompt });
    void copilotkit.runAgent({ agent });
  };

  const interruptElement = useInterrupt({
    renderInChat: false,
    render: ({ interrupt, resolve, cancel }) => (
      <div>
        <p>Pick a slot for {interrupt?.message ?? "a call"}:</p>
        {SLOTS.map((s) => (
          <button key={s.iso} onClick={() => resolve({ chosen_time: s.iso, chosen_label: s.label })}>
            {s.label}
          </button>
        ))}
        <button onClick={() => cancel()}>Cancel</button>
      </div>
    ),
  });

  if (interruptElement) {
    return interruptElement;
  }

  return <button onClick={() => kickOff("Book a call with sales.")}>Book call</button>;
}
```

If you need full control over the subscription (e.g. for a custom
`useHeadlessInterrupt` fixture used in Playwright tests), you can still
use the raw primitives from `useHeadlessInterrupt` defined above:

```tsx
function HeadlessInterruptPanelRaw() {
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId: "interrupt-headless" });
  const { pending, resolve } = useHeadlessInterrupt("interrupt-headless");

  const kickOff = (prompt: string) => {
    agent.addMessage({ id: crypto.randomUUID(), role: "user", content: prompt });
    void copilotkit.runAgent({ agent });
  };

  if (pending) {
    return (
      <div>
        <p>Pick a slot for {pending.value.topic ?? "a call"}:</p>
        {SLOTS.map((s) => (
          <button key={s.iso} onClick={() => resolve({ chosen_time: s.iso, chosen_label: s.label })}>
            {s.label}
          </button>
        ))}
        <button onClick={() => resolve({ cancelled: true })}>Cancel</button>
      </div>
    );
  }

  return <button onClick={() => kickOff("Book a call with sales.")}>Book call</button>;
}
```



## Going further

- [Tool-based HITL with `useHumanInTheLoop`](../human-in-the-loop) — for
  LLM-initiated pauses where the model decides on the fly to ask the
  user, rather than the runtime forcing the pause itself.
- [`useInterrupt`](./useInterrupt) — the render-prop version of this
  page, with `enabled` gating and `handler` preprocessing.
