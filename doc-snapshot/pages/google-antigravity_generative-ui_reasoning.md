# Reasoning

> Surface the agent's thinking chain in the chat — default or fully custom.


<!-- interactive demo: reasoning-custom -->


## What is this?

Some models (`gpt-6-luna`, Anthropic's thinking
variants) emit **reasoning tokens**, internal chain-of-thought traces that
explain how the model is working toward its answer. CopilotKit surfaces
these as first-class messages: when a `REASONING_MESSAGE_*` event arrives
from the agent, the chat renders it inline so the user can follow the
agent's thinking.

Reasoning isn't a custom-renderer plumb-in; it's a dedicated message type
on the chat view. You can either accept the built-in rendering or override
the `reasoningMessage` slot with your own component.

## When should I use this?

Expose reasoning in the UI when you want to:

- Give users real-time insight into the agent's thought process
- Show progress on long or multi-step problems
- Debug prompt behavior during development
- Brand the reasoning card to match the rest of your product

## Default reasoning rendering (zero-config)

Out of the box, reasoning events render inside CopilotKit's built-in
`CopilotChatReasoningMessage` card:

- A **"Thinking…"** label with a pulsing indicator while the model reasons.
- Auto-expanded content so users can follow the chain of thought live.
- Collapses to **"Thought for X seconds"** once reasoning finishes, with a
  chevron to re-expand.
- Reasoning text rendered as Markdown.

No configuration is needed; if your model emits reasoning tokens, the card
appears automatically:

```typescript
// src/app/demos/reasoning-default/page.tsx
const AGENT_ID = "reasoning-default";

export default function ReasoningDefaultDemo() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent={AGENT_ID}>
      <div className="flex justify-center items-center h-screen w-full">
        <div className="h-full w-full max-w-4xl">
          <Chat />
        </div>
      </div>
    </CopilotKit>
  );
}

function Chat() {
  useReasoningDefaultSuggestions();
  return <CopilotChat agentId={AGENT_ID} className="h-full rounded-2xl" />;
}
```

Here's what the built-in card looks like while the model thinks through a multi-step problem:


<!-- interactive demo: reasoning-default -->


## Custom reasoning rendering

For full control over the reasoning card, pass a component to the
`reasoningMessage` slot on `messageView`. Your component receives the
`ReasoningMessage` object (`.content` holds the streaming text), the full
`messages` list, and `isRunning`, enough to decide whether this block is
still streaming and whether it's the active trailing message:

<Tabs items={['page.tsx', 'reasoning-block.tsx']}>
  <Tab value="page.tsx">
    ```typescript
// src/app/demos/reasoning-custom/page.tsx
const AGENT_ID = "reasoning-custom";

export default function ReasoningCustomDemo() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent={AGENT_ID}>
      <div className="flex justify-center items-center h-screen w-full">
        <div className="h-full w-full max-w-4xl">
          <Chat />
        </div>
      </div>
    </CopilotKit>
  );
}

function Chat() {
  useReasoningCustomSuggestions();
  return (
    <CopilotChat
      agentId={AGENT_ID}
      className="h-full rounded-2xl"
      messageView={{
        reasoningMessage:
          ReasoningBlock as unknown as typeof CopilotChatReasoningMessage,
      }}
    />
  );
}
```
  </Tab>
  <Tab value="reasoning-block.tsx">
    ```typescript
// src/app/demos/reasoning-custom/reasoning-block.tsx
"use client";

// Custom `reasoningMessage` slot renderer.
//
// Receives the `ReasoningMessage` plus (optionally) the full message list and
// the running state from the slot system. Renders the content inline with a
// visibly tagged amber banner so the user can always see the agent's thinking
// chain — this is the focal UI of the demo.

import React from "react";
import type { ReasoningMessage, Message } from "@ag-ui/core";

export function ReasoningBlock({
  message,
  messages,
  isRunning,
}: {
  message: ReasoningMessage;
  messages?: Message[];
  isRunning?: boolean;
}) {
  const isLatest = messages?.[messages.length - 1]?.id === message.id;
  const isStreaming = !!(isRunning && isLatest);
  const hasContent = !!(message.content && message.content.length > 0);

  return (
    <div
      data-testid="reasoning-block"
      className="my-2 rounded-xl border border-[#DBDBE5] bg-[#BEC2FF1A] px-3.5 py-2.5 text-sm"
    >
      <div className="flex items-center gap-2 font-medium text-[#010507]">
        <span className="inline-block rounded-full border border-[#BEC2FF] bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#57575B]">
          Reasoning
        </span>
        <span className="text-[#57575B]">
          {isStreaming ? "Thinking…" : hasContent ? "Agent reasoning" : "…"}
        </span>
      </div>
      {hasContent && (
        <div className="mt-1.5 whitespace-pre-wrap italic text-[#57575B]">
          {message.content}
        </div>
      )}
    </div>
  );
}
```
  </Tab>
</Tabs>

The `ReasoningBlock` (imported above) renders the reasoning as an
amber-tagged inline banner, intentionally louder than the default card
so the thinking chain is the focal UI of the demo. Swap in your own
component to match your product's tone.

<Callout type="info">
  The `messageView.reasoningMessage` slot accepts either a full component
  (as shown) or a sub-slot object like
  `{ header, contentView, toggle }` if you just want to tweak parts of the
  default card. See the reference docs for sub-slot props.
</Callout>

<IntegrationGrid path="generative-ui/reasoning" />
