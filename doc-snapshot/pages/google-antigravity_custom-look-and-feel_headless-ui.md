# Headless UI

> Build any UI — chat or not — on top of the CopilotKit primitives with zero UI opinions.


<!-- interactive demo: headless-complete -->


## What is this?

A headless UI gives you **full control** over the chat experience. You bring your own components, layout, and styling while CopilotKit handles agent communication, message management, tool-call rendering, and streaming. No `<CopilotChat>`, no slot overrides, just your components composed on top of the low-level hooks.

## When should I use this?

Use headless UI when:

- The [slot system](/google-antigravity/custom-look-and-feel/slots) isn't enough: you need a completely different layout.
- You're embedding chat into an existing UI with its own patterns.
- You're building a **non-chat surface** that still talks to an agent (a dashboard, a canvas, an inspector) and want `useRenderToolCall` / `useRenderActivityMessage` on their own.
- You want to render generative UI primitives outside of a chat entirely.

## The core hooks

Three hooks power it, and they're the same ones `<CopilotChat>` uses internally.

- `useAgent({ agentId })` — exposes the current conversation (`messages`, `isRunning`) and the run-state object.
- `useCopilotKit()` — returns the runtime handle you call `runAgent({ agent })` on.
- `useRenderToolCall()` — returns a function that paints any registered tool call inline.

## Minimal example

Start with a hand-rolled message list and composer built from `useAgent` + `useCopilotKit`:

```typescript
// src/app/demos/headless-simple/chat.tsx
  const { agent } = useAgent({ agentId: "headless-simple" });
  const { copilotkit } = useCopilotKit();
  const [input, setInput] = useState("");

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || agent.isRunning) return;
    agent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    });
    setInput("");
    void copilotkit.runAgent({ agent }).catch((err) => {
      // The Headless Simple demo is the canonical "two hooks, your
      // design system" example users copy-paste as a starting point.
      // Silently swallowing errors here would model broken practice;
      // log so a network failure / runtime error / transport disconnect
      // surfaces in the console for the developer.
      console.error("[langgraph-python:headless-simple] runAgent failed", err);
    });
  };
```

The message list is a plain `.map()` over `agent.messages`: user messages render as right-aligned bubbles, assistant messages render streamed text plus inline tool calls via `renderToolCall({ toolCall })`:

```typescript
// src/app/demos/headless-simple/chat.tsx
                {visible.map((m) =>
                  m.role === "user" ? (
                    <UserBubble key={m.id} content={m.content} />
                  ) : (
                    <AssistantBubble key={m.id} content={m.content} />
                  ),
                )}
```

No `<CopilotChat />`, no slots. The trade-off: you only get text and tool calls. Reasoning messages, activity messages, and custom before/after slots won't show up unless you wire them in yourself, which is exactly what the complete example covers.

## Complete example

The `headless-complete` cell rebuilds the **full** generative-UI composition from the low-level hooks directly, without importing `<CopilotChatMessageView>`: text, tool calls, reasoning cards, A2UI + MCP Apps activity messages, and custom before/after message slots.

### The `useRenderedMessages` hook

The cell's central piece is a hand-rolled `useRenderedMessages(messages, isRunning)` that returns the same flat list of messages, each augmented with a `renderedContent: ReactNode` field. This hook is a **manual recreation of what `<CopilotChatMessageView>` does**:

```typescript
// src/app/demos/headless-complete/chat/message-list.tsx
  const renderToolCall = useRenderToolCall();
  const { renderActivityMessage } = useRenderActivityMessage();

  // Index tool results by their originating tool-call id so each tool-call
  // card can hand the matching ToolMessage to `useRenderToolCall`.
  // Without this the renderer can't see a result and the card stays in the
  // "in-progress" state forever.
  const toolMessagesByCallId = useMemo(() => {
    const map = new Map<string, ToolMessage>();
    for (const m of messages) {
      if (m.role === "tool" && "toolCallId" in m && m.toolCallId) {
        map.set(m.toolCallId, m as ToolMessage);
      }
    }
    return map;
  }, [messages]);
```

Three low-level hooks feed it:

- `useRenderToolCall()` — returns the renderer for any registered tool call (per-tool via `useRenderTool` / `useComponent`, plus the wildcard from `useDefaultRenderTool`).
- `useRenderActivityMessage()` — renders A2UI + MCP Apps activity messages for the current agent scope.
- `useRenderCustomMessages()` — invokes `renderCustomMessage` hooks registered against the active `CopilotChatConfigurationProvider`, emitting `"before"` and `"after"` slots around every message.

### Per-role dispatch

The role-switch mirrors `CopilotChatMessageView`'s `renderMessageBlock` exactly: assistant bodies get text and tool calls, user bodies get their text content, reasoning messages go through the `<CopilotChatReasoningMessage>` leaf, and activity messages route through `renderActivityMessage`:

```typescript
// src/app/demos/headless-complete/chat/message-list.tsx
      {messages.map((m) => {
        if (m.role === "user") {
          // Cast through the local input shape — UserBubble accepts a
          // simplified version of the ag-ui content union.
          return (
            <UserBubble
              key={m.id}
              content={m.content as Parameters<typeof UserBubble>[0]["content"]}
            />
          );
        }

        if (m.role === "assistant") {
          const toolCalls =
            "toolCalls" in m && Array.isArray(m.toolCalls) ? m.toolCalls : [];
          return (
            <AssistantBubble
              key={m.id}
              content={typeof m.content === "string" ? m.content : undefined}
            >
              {toolCalls.map((tc) => {
                const toolMessage = toolMessagesByCallId.get(tc.id);
                const node = renderToolCall({
                  toolCall: tc,
                  toolMessage,
                });
                return node ? <div key={tc.id}>{node}</div> : null;
              })}
            </AssistantBubble>
          );
        }

        if (m.role === "activity") {
          const node = renderActivityMessage(m);
          if (!node) return null;
          return <ActivityWrapper key={m.id}>{node}</ActivityWrapper>;
        }

        return null;
      })}
```

### Tool-call composition

For each `toolCall` on an assistant message, we look up the sibling `tool`-role message (keyed by `toolCallId`) and hand both to `renderToolCall`:

```typescript
// src/app/demos/headless-complete/chat/message-list.tsx
              {toolCalls.map((tc) => {
                const toolMessage = toolMessagesByCallId.get(tc.id);
                const node = renderToolCall({
                  toolCall: tc,
                  toolMessage,
                });
                return node ? <div key={tc.id}>{node}</div> : null;
              })}
```

### Bubble chrome

The `UserBubble` and `AssistantBubble` components are **pure chrome**: they receive the pre-rendered node from `useRenderedMessages` and drop it into a styled container. No chat primitives are imported here:

```typescript
// src/app/demos/headless-complete/chat/message-assistant.tsx
export function AssistantBubble({
  content,
  children,
}: {
  content?: string;
  children?: React.ReactNode;
}) {
  const hasText = typeof content === "string" && content.trim().length > 0;
  const hasChildren = React.Children.count(children) > 0;
  if (!hasText && !hasChildren) return null;

  return (
    <div
      data-testid="headless-message-assistant"
      data-message-role="assistant"
      className="flex w-full items-start gap-3"
    >
      <Avatar className="h-8 w-8 shrink-0 border bg-muted text-muted-foreground">
        <AvatarFallback className="bg-muted text-muted-foreground">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex max-w-[calc(100%-2.75rem)] flex-1 flex-col items-start gap-2">
        {hasText && (
          <div
            className={cn(
              "max-w-[90%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm",
              "bg-muted text-foreground",
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="my-1 first:mt-0 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="my-1 list-disc pl-5">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-1 list-decimal pl-5">{children}</ol>
                ),
                li: ({ children }) => <li className="my-0.5">{children}</li>,
                code: ({ children, className }) => {
                  const isBlock = (className ?? "").includes("language-");
                  if (isBlock) {
                    return <code className={className}>{children}</code>;
                  }
                  return (
                    <code className="rounded bg-background px-1 py-0.5 font-mono text-[0.85em]">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="my-2 overflow-x-auto rounded-md bg-background p-3 font-mono text-xs">
                    {children}
                  </pre>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-primary underline underline-offset-2 hover:opacity-80"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                h1: ({ children }) => (
                  <h1 className="my-2 text-base font-semibold">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="my-2 text-base font-semibold">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="my-2 text-sm font-semibold">{children}</h3>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-2 border-l-2 border-border pl-3 italic text-muted-foreground">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {content as string}
            </ReactMarkdown>
          </div>
        )}
        {hasChildren && (
          <div className="flex w-full max-w-full flex-col gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export function UserBubble({
  content,
}: {
  content: string | MultimodalPart[];
}) {
  const { text, attachments } = splitContent(content);
  const hasText = text.trim().length > 0;
  const hasAttachments = attachments.length > 0;
  if (!hasText && !hasAttachments) return null;

  return (
    <div
      data-testid="headless-message-user"
      data-message-role="user"
      className="flex w-full items-start gap-3 flex-row-reverse"
    >
      <Avatar className="h-8 w-8 shrink-0 border bg-primary text-primary-foreground">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex max-w-[80%] flex-col items-end gap-2">
        {hasAttachments && (
          <div className="flex flex-wrap justify-end gap-2">
            {attachments.map((a) => (
              <AttachmentChip key={a.id} attachment={a} />
            ))}
          </div>
        )}
        {hasText && (
          <div
            className={cn(
              "rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm",
              "bg-primary text-primary-foreground",
            )}
          >
            <p className="whitespace-pre-wrap break-words">{text}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function splitContent(content: string | MultimodalPart[]): {
  text: string;
  attachments: Attachment[];
} {
  if (typeof content === "string") {
    return { text: content, attachments: [] };
  }
  let text = "";
  const attachments: Attachment[] = [];
  let i = 0;
  for (const part of content) {
    if (part.type === "text") {
      text += part.text;
      continue;
    }
    const meta = (part.metadata ?? {}) as {
      filename?: string;
      size?: number;
    };
    attachments.push({
      id: `${part.type}-${i++}`,
      type: part.type,
      source: part.source,
      filename: meta.filename,
      size: meta.size,
      status: "ready",
    });
  }
  return { text, attachments };
}
```

## Next steps

- [Slots](/google-antigravity/custom-look-and-feel/slots) — less work than going fully headless, often enough.
- [CSS customization](/google-antigravity/custom-look-and-feel/css) — when you just need to re-skin the defaults.
