# CopilotChat

> Inline chat component you can place anywhere and size as needed.


<!-- interactive demo: agentic-chat -->


## What is this?

`<CopilotChat>` is the base prebuilt chat surface. Drop it in wherever you
want the chat to render and size it to fit your layout. `<CopilotSidebar>`
and `<CopilotPopup>` are both thin wrappers over the same primitives; if you
need a dedicated chat page or an inline pane alongside other content, this
is the component you want.

## When should I use this?

Use `<CopilotChat>` when you want:

- A full-bleed chat that fills its container
- An inline chat pane as part of a larger page
- A dedicated `/chat` route
- Maximum layout freedom (no docked chrome or launcher)

For a collapsible docked chat, use [CopilotSidebar](/google-antigravity/prebuilt-components/sidebar).
For a floating bubble that overlays content, use [CopilotPopup](/google-antigravity/prebuilt-components/popup).
For saved conversations and switching between prior conversations, drop in the [Threads Drawer](/google-antigravity/prebuilt-components/copilot-threads-drawer) (or go headless with [Headless Threads](/google-antigravity/headless-threads)).

## Basic setup

Wrap your app in `<CopilotKit>` once (the provider wires the runtime, session,
and agent registry) and render `<CopilotChat>` inside the layout of your
choosing:

```tsx
import { CopilotKit, CopilotChat } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
```

<Callout type="warn">
  `@copilotkit/react-ui` also exports a component named `CopilotChat`. That one
  is the [deprecated v1 chat](/google-antigravity/migrate/v2). This page documents the v2 chat,
  which you import from `@copilotkit/react-core/v2`.
</Callout>

```typescript
// src/app/demos/agentic-chat/page.tsx
    <CopilotKit runtimeUrl="/api/copilotkit" agent="agentic_chat">
      <Chat />
    </CopilotKit>
```

## Code example

A self-contained component that renders the chat and wires in starter suggestions:

```typescript
// src/app/demos/agentic-chat/page.tsx
function Chat() {
  useAgenticChatSuggestions();
  return <CopilotChat agentId="agentic_chat" />;
}
```

## Common props

`<CopilotChat>` is the root primitive. `<CopilotSidebar>` and `<CopilotPopup>`
accept the same slots and labels, plus a few wrapper-specific props.

| Prop | Description |
|------|-------------|
| `agentId` | Agent slug the chat should talk to (must match an agent configured on the runtime). |
| `labels` | User-facing copy — header title, placeholder, welcome, disclaimer. |
| `messageView` | Slot for the message list — see [slots](/google-antigravity/custom-look-and-feel/slots). |
| `input` | Slot for the composer area (text area, send button, disclaimer). |
| `scrollView` | Slot for the scroll container (e.g. custom feather/gradient). |
| `suggestionView` | Slot for the suggestion pills shown below messages. |
| `welcomeScreen` | Slot for the empty-state. Pass `false` to disable. |

## Styling

`<CopilotChat>` is fully themable:

- **CSS variables / class overrides** — see [CSS customization](/google-antigravity/custom-look-and-feel/css)
- **Slots (subcomponents)** — see [slots](/google-antigravity/custom-look-and-feel/slots)
- **Fully headless** — see [headless UI](/google-antigravity/custom-look-and-feel/headless-ui)
