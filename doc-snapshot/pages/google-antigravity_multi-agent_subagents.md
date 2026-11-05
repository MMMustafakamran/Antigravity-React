# Sub-Agents

> Decompose work across multiple specialized agents with a visible delegation log.


<!-- interactive demo: subagents -->


## What is this?

Sub-agents are the canonical multi-agent pattern: a top-level
**supervisor** LLM orchestrates one or more specialized **sub-agents**
by exposing each of them as a tool. The supervisor decides what to
delegate, the sub-agents do their narrow job, and their results flow
back up to the supervisor's next step.

This is fundamentally the same shape as tool-calling, but each "tool"
is itself a full-blown agent with its own system prompt and (often) its
own tools, memory, and model.

## When should I use this?

Reach for sub-agents when a task has distinct specialized sub-tasks
that each benefit from their own focus:

- **Research → Write → Critique** pipelines, where each stage needs a
  different system prompt and temperature.
- **Router + specialists**, where one agent classifies the request and
  dispatches to the right expert.
- **Divide-and-conquer** — any problem that fits cleanly into parallel
  or sequential sub-problems.

The example below uses the Research → Write → Critique shape as the
canonical example.

## Setting up sub-agents

<Steps>
  <Step>
    ### Install the Antigravity AG-UI adapter

    ```bash
    pip install ag-ui-antigravity google-antigravity
    ```

  </Step>
  <Step>
    ### Give the supervisor one tool per sub-agent

    Sub-agents are plain server-side tools on the supervisor agent. Each one
    runs a single chat completion with its own role prompt and returns the
    prose it produced; the supervisor's instructions decide the order. Pass
    them as `tools=[...]` and the adapter derives each schema from the Python
    signature and docstring, dispatches the call in this process, and streams
    the `TOOL_CALL_*` events the UI renders its per-delegation cards from.

    
~~~~python title="subagents.py"
import uuid

import httpx
from ag_ui_antigravity import experimental_get_state, experimental_set_state

from agents._common import MODEL, aimock_headers, api_key, gemini_base_url

SUPERVISOR_PROMPT = (
    "You are a supervisor. For research tasks call `research_agent`, for "
    "drafting call `writing_agent`, for review call `critique_agent`. "
    "Delegate step by step: research first, then write, then critique once, "
    "then answer the user with the final draft."
)

_ROLE_PROMPTS = {
    "research_agent": "You are a research sub-agent. Given a topic, produce a concise bulleted list of 3-5 key facts. No preamble, no closing.",
    "writing_agent": "You are a writing sub-agent. Given a brief and optional source facts, produce a polished 1-paragraph draft. Be clear and concrete. No preamble.",
    "critique_agent": "You are an editorial critique sub-agent. Given a draft, give 2-3 crisp, actionable critiques. No preamble.",
}

SUB_AGENT_EMPTY_SENTINEL = "<sub-agent produced no output>"

# One connection pool for the whole process, created lazily on the first
# sub-agent call so importing this module never touches the network stack.
_HTTP_CLIENT: httpx.AsyncClient | None = None


def _http_client() -> httpx.AsyncClient:
    global _HTTP_CLIENT
    if _HTTP_CLIENT is None:
        _HTTP_CLIENT = httpx.AsyncClient(timeout=120.0)
    return _HTTP_CLIENT


async def close_http_client() -> None:
    """Closes the shared client. Called from agent_server's shutdown hook."""
    global _HTTP_CLIENT
    client, _HTTP_CLIENT = _HTTP_CLIENT, None
    if client is not None:
        await client.aclose()


async def _run(role: str, task: str) -> str:
    base = gemini_base_url() or "https://generativelanguage.googleapis.com"
    headers = aimock_headers()
    key = api_key()
    if key:
        headers["x-goog-api-key"] = key
    response = await _http_client().post(
        f"{base}/v1beta/models/{MODEL}:generateContent",
        json={
            "systemInstruction": {"parts": [{"text": _ROLE_PROMPTS[role]}]},
            "contents": [{"role": "user", "parts": [{"text": task}]}],
        },
        headers=headers,
    )
    response.raise_for_status()
    candidates = response.json().get("candidates") or [{}]
    parts = (candidates[0].get("content") or {}).get("parts") or []
    # Thinking models return their thought summary as parts flagged `thought`.
    content = "".join(part.get("text", "") for part in parts if not part.get("thought"))
    result = content.strip() or SUB_AGENT_EMPTY_SENTINEL
    _record_delegation(role, task, result)
    return result


def _record_delegation(role: str, task: str, result: str) -> None:
    """Appends a completed delegation to shared state, shape as in the reference.

    Read and write happen with no ``await`` between them, so tools the SDK
    runs concurrently cannot interleave here and drop each other's entry.
    """
    state = experimental_get_state()
    delegations = list(state.get("delegations") or [])
    delegations.append(
        {
            "id": str(uuid.uuid4()),
            "sub_agent": role,
            "task": task,
            "status": "completed",
            "result": result,
        }
    )
    experimental_set_state({**state, "delegations": delegations})


async def research_agent(task: str) -> str:
    """Delegate a research task; returns 3-5 key facts."""
    return await _run("research_agent", task)


async def writing_agent(task: str) -> str:
    """Delegate a drafting task; returns a one-paragraph draft."""
    return await _run("writing_agent", task)


async def critique_agent(task: str) -> str:
    """Delegate a review task; returns 2-3 critiques."""
    return await _run("critique_agent", task)




def subagents_agent():
    from agents._common import build

    return build(
        system_instructions=SUPERVISOR_PROMPT,
        tools=[research_agent, writing_agent, critique_agent],
    )


~~~~


    Write the tools as `async def`. The adapter awaits every server tool
    inline, and the SDK only offloads non-coroutine callables to a worker
    thread, so a synchronous HTTP call here would block the event loop for the
    whole sub-agent call and stall every other stream in the process.

  </Step>
</Steps>

<Callout type="info" title="How the delegation log fills in">
  Each tool also appends an entry to the `delegations` slot of shared state
  with the adapter's `experimental_get_state()` / `experimental_set_state()`. `experimental_set_state()` streams a
  `STATE_SNAPSHOT` as the tool finishes, so the UI's delegation log updates
  while the supervisor is still running. The two helpers only work inside a
  server tool, where the adapter knows which session the call belongs to.
</Callout>

<Callout type="info" title="Antigravity's native sub-agents are off">
  The Antigravity SDK has a sub-agent capability of its own, which the adapter
  maps onto AG-UI `STEP_STARTED` / `STEP_FINISHED` events. The showcase leaves
  it off (`CapabilitiesConfig(enable_subagents=False)`, alongside the rest of
  the built-in toolset) and models delegation as tools instead, so the shared
  probes and per-tool renderers written for the reference integration apply
  unchanged. Enable it on your own agent to get bracketed steps for free.
</Callout>

Each sub-agent is an isolated agent call with its own model, system
prompt, and optional tools. They don't share memory or tools with the
supervisor; the supervisor only ever sees what the sub-agent returns.

```python
# src/agents/subagents.py
import uuid

import httpx
from ag_ui_antigravity import experimental_get_state, experimental_set_state

from agents._common import MODEL, aimock_headers, api_key, gemini_base_url

SUPERVISOR_PROMPT = (
    "You are a supervisor. For research tasks call `research_agent`, for "
    "drafting call `writing_agent`, for review call `critique_agent`. "
    "Delegate step by step: research first, then write, then critique once, "
    "then answer the user with the final draft."
)

_ROLE_PROMPTS = {
    "research_agent": "You are a research sub-agent. Given a topic, produce a concise bulleted list of 3-5 key facts. No preamble, no closing.",
    "writing_agent": "You are a writing sub-agent. Given a brief and optional source facts, produce a polished 1-paragraph draft. Be clear and concrete. No preamble.",
    "critique_agent": "You are an editorial critique sub-agent. Given a draft, give 2-3 crisp, actionable critiques. No preamble.",
}

SUB_AGENT_EMPTY_SENTINEL = "<sub-agent produced no output>"

# One connection pool for the whole process, created lazily on the first
# sub-agent call so importing this module never touches the network stack.
_HTTP_CLIENT: httpx.AsyncClient | None = None


def _http_client() -> httpx.AsyncClient:
    global _HTTP_CLIENT
    if _HTTP_CLIENT is None:
        _HTTP_CLIENT = httpx.AsyncClient(timeout=120.0)
    return _HTTP_CLIENT


async def close_http_client() -> None:
    """Closes the shared client. Called from agent_server's shutdown hook."""
    global _HTTP_CLIENT
    client, _HTTP_CLIENT = _HTTP_CLIENT, None
    if client is not None:
        await client.aclose()


async def _run(role: str, task: str) -> str:
    base = gemini_base_url() or "https://generativelanguage.googleapis.com"
    headers = aimock_headers()
    key = api_key()
    if key:
        headers["x-goog-api-key"] = key
    response = await _http_client().post(
        f"{base}/v1beta/models/{MODEL}:generateContent",
        json={
            "systemInstruction": {"parts": [{"text": _ROLE_PROMPTS[role]}]},
            "contents": [{"role": "user", "parts": [{"text": task}]}],
        },
        headers=headers,
    )
    response.raise_for_status()
    candidates = response.json().get("candidates") or [{}]
    parts = (candidates[0].get("content") or {}).get("parts") or []
    # Thinking models return their thought summary as parts flagged `thought`.
    content = "".join(part.get("text", "") for part in parts if not part.get("thought"))
    result = content.strip() or SUB_AGENT_EMPTY_SENTINEL
    _record_delegation(role, task, result)
    return result


def _record_delegation(role: str, task: str, result: str) -> None:
    """Appends a completed delegation to shared state, shape as in the reference.

    Read and write happen with no ``await`` between them, so tools the SDK
    runs concurrently cannot interleave here and drop each other's entry.
    """
    state = experimental_get_state()
    delegations = list(state.get("delegations") or [])
    delegations.append(
        {
            "id": str(uuid.uuid4()),
            "sub_agent": role,
            "task": task,
            "status": "completed",
            "result": result,
        }
    )
    experimental_set_state({**state, "delegations": delegations})


async def research_agent(task: str) -> str:
    """Delegate a research task; returns 3-5 key facts."""
    return await _run("research_agent", task)


async def writing_agent(task: str) -> str:
    """Delegate a drafting task; returns a one-paragraph draft."""
    return await _run("writing_agent", task)


async def critique_agent(task: str) -> str:
    """Delegate a review task; returns 2-3 critiques."""
    return await _run("critique_agent", task)




def subagents_agent():
    from agents._common import build

    return build(
        system_instructions=SUPERVISOR_PROMPT,
        tools=[research_agent, writing_agent, critique_agent],
    )


```

Keep sub-agent system prompts narrow and focused. The point of this pattern
is that each one does one thing well. If a sub-agent needs to know
the whole user context to do its job, that's a signal the boundary is
wrong.

## Exposing sub-agents as tools

The supervisor delegates by calling tools. Each delegation tool is a thin
wrapper around a specialized agent call that:

1. Runs the sub-agent on the supplied `task` string.
2. Records the delegation into a `delegations` slot in shared agent
   state (so the UI can render a live log).
3. Returns the sub-agent's final message as the tool result, which the
   supervisor sees on its next turn.

```python
# src/agents/subagents.py
async def research_agent(task: str) -> str:
    """Delegate a research task; returns 3-5 key facts."""
    return await _run("research_agent", task)


async def writing_agent(task: str) -> str:
    """Delegate a drafting task; returns a one-paragraph draft."""
    return await _run("writing_agent", task)


async def critique_agent(task: str) -> str:
    """Delegate a review task; returns 2-3 critiques."""
    return await _run("critique_agent", task)


```

This is where CopilotKit's shared-state channel earns its keep: the
supervisor's tool calls mutate `delegations` as they happen, and the
frontend renders every new entry live.

<Callout type="warn">
  Give every delegation a stable `id` and merge new entries by that `id`. The
  client sends its copy of shared state back as run input on every run, so a
  slot that blindly appends whatever it receives — a LangGraph
  `Annotated[list, operator.add]` reducer, for example — concatenates the
  entries the client just echoed onto the ones the agent already has, and the
  log doubles when a thread is continued.
</Callout>

## Rendering a live delegation log

On the frontend, the delegation log is a reactive render of the
`delegations` slot.


Subscribe with `useAgent({ updates:
[UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged] })`,
read `agent.state.delegations`, and render one card per entry.

```typescript
// src/app/demos/subagents/delegation-log.tsx
/**
 * Live delegation log — renders the `delegations` slot of agent state.
 *
 * Each entry corresponds to one invocation of a sub-agent. The list
 * grows in real time as the supervisor fans work out to its children.
 * The parent header shows how many sub-agents have been called and
 * whether the supervisor is still running.
 */
// Fixed list of the three sub-agent roles the supervisor can call.
// Rendered as always-visible indicator chips at the top of the log
// (regardless of whether the supervisor has delegated yet) so the user
// — and the e2e suite — can see at a glance which sub-agents exist and
// which are currently active.
const INDICATOR_ROLES: ReadonlyArray<{
  role: "researcher" | "writer" | "critic";
  subAgent: SubAgentName;
}> = [
  { role: "researcher", subAgent: "research_agent" },
  { role: "writer", subAgent: "writing_agent" },
  { role: "critic", subAgent: "critique_agent" },
];

export function DelegationLog({ delegations, isRunning }: DelegationLogProps) {
  const calledRoles = new Set<SubAgentName>(
    delegations.map((d) => d.sub_agent),
  );

  return (
    <div
      data-testid="delegation-log"
      className="w-full h-full flex flex-col bg-white rounded-2xl shadow-sm border border-[#DBDBE5] overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#E9E9EF] bg-[#FAFAFC]">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-[#010507]">
            Sub-agent delegations
          </span>
          {isRunning && (
            <span
              data-testid="supervisor-running"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[#BEC2FF] bg-[#BEC2FF1A] text-[#010507] text-[10px] font-semibold uppercase tracking-[0.12em]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#010507] animate-pulse" />
              Supervisor running
            </span>
          )}
        </div>
        <span
          data-testid="delegation-count"
          className="text-xs font-mono text-[#838389]"
        >
          {delegations.length} calls
        </span>
      </div>

      <div
        data-testid="subagent-indicators"
        className="flex items-center gap-2 border-b border-[#E9E9EF] bg-white px-6 py-2"
      >
        {INDICATOR_ROLES.map(({ role, subAgent }) => {
          const style = SUB_AGENT_STYLE[subAgent];
          const fired = calledRoles.has(subAgent);
          return (
            <span
              key={role}
              data-testid={`subagent-indicator-${role}`}
              data-role={role}
              data-fired={fired ? "true" : "false"}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] border ${style.color} ${
                fired ? "" : "opacity-60"
              }`}
            >
              <span aria-hidden>{style.emoji}</span>
              <span>{style.label}</span>
            </span>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {delegations.length === 0 ? (
          <p className="text-[#838389] italic text-sm">
            Ask the supervisor to complete a task. Every sub-agent it calls will
            appear here.
          </p>
        ) : (
          delegations.map((d, idx) => {
            const style = SUB_AGENT_STYLE[d.sub_agent];
            return (
              <div
                key={d.id}
                data-testid="delegation-entry"
                className="border border-[#E9E9EF] rounded-xl p-3 bg-[#FAFAFC]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#AFAFB7]">
                      #{idx + 1}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] border ${style.color}`}
                    >
                      <span>{style.emoji}</span>
                      <span>{style.label}</span>
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-[#189370]">
                    {d.status}
                  </span>
                </div>
                <div className="text-xs text-[#57575B] mb-2">
                  <span className="font-semibold text-[#010507]">Task: </span>
                  {d.task}
                </div>
                <div className="text-sm text-[#010507] whitespace-pre-wrap bg-white rounded-lg p-2.5 border border-[#E9E9EF]">
                  {d.result}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
```




The result: as the supervisor fans work out to its sub-agents, the log
grows in real time, giving the user visibility into a process that
would otherwise be a long opaque spinner.

## Related

- **[Shared State](/google-antigravity/shared-state)** — the channel that makes the
  delegation log live.
- **[State streaming](/google-antigravity/shared-state/streaming)** — stream
  *individual* sub-agent outputs token-by-token inside each log entry.
