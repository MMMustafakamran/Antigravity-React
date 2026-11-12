"use client"; // HARNESS: the doc snippet omits it.
// --- Doc: https://docs.copilotkit.ai/google-antigravity/human-in-the-loop/headless (verbatim below) ---
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
    <div className="grid h-screen grid-cols-[1fr_420px] bg-[#FAFAFC] dark:bg-background">
      <AppSurface pending={pending} resolve={resolve} />
      <div className="border-l border-[#DBDBE5] bg-white dark:border-border dark:bg-background">
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


// HARNESS: AppSurface is used above but defined nowhere on the page (or in the showcase).
// Minimal stand-in that shows whether the headless hook ever receives an interrupt.
function AppSurface({ pending, resolve }: { pending: InterruptEvent | null; resolve: (v: unknown) => void }) {
  return (
    <div data-testid="app-surface" style={{ margin: 24, padding: 24, border: "2px dashed #999", borderRadius: 12, fontSize: 20, maxWidth: 520, color: "#111", background: "#fff" }}>
      <strong>AppSurface (harness)</strong>{" "}
      {pending ? (
        <button onClick={() => resolve({ chosen_label: "Tomorrow 2:00 PM", chosen_time: "" })}>Tomorrow 2:00 PM</button>
      ) : (
        <span data-testid="no-pending">— no pending interrupt</span>
      )}
    </div>
  );
}
