"use client";
// HARNESS: the doc wraps app/layout.tsx in <Providers>. Here it wraps only this route, so the
// root layout's quickstart provider is left alone. The CopilotChat is the doc's app/page.tsx.
import { CopilotChat } from "@copilotkit/react-core/v2";
import { Providers } from "./providers";

export default function Page() {
  return (
    <Providers>
      <CopilotChat />
    </Providers>
  );
}
