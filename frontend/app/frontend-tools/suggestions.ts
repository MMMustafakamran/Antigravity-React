// HARNESS: copied from showcase/integrations/google-antigravity (CopilotKit 4f0e86d). The doc imports this file but never shows it. FINDINGS.md
import { useConfigureSuggestions } from "@copilotkit/react-core/v2";

export function useFrontendToolsSuggestions() {
  useConfigureSuggestions({
    suggestions: [
      {
        title: "Sunset theme",
        message: "Make the background a sunset gradient.",
      },
      {
        title: "Forest theme",
        message: "Switch to a deep green forest gradient.",
      },
      {
        title: "Cosmic theme",
        message: "Make it a navy → magenta cosmic gradient.",
      },
    ],
    available: "always",
  });
}
