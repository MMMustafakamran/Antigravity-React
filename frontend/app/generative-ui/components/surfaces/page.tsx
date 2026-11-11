"use client";
// --- Doc: https://docs.copilotkit.ai/google-antigravity/generative-ui/components/surfaces "Add a page target" app/page.tsx (verbatim) ---
import { GenerativeUISurface } from "@copilotkit/react-core/v2/generative-ui";
import { shopUI } from "./catalog";

export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <GenerativeUISurface
      id="featured"
      ui={shopUI}
      description="The Featured Products row of the home page. When the customer asks to see products here, show them as a ProductGrid with one ProductCard for each product. When they ask for the featured products again, delete this surface."
      components={["ProductGrid", "ProductCard"]}
      fallback={<ProductRow products={products} />}
    />
  );
}
// --- end doc ---

// HARNESS: Product and ProductRow are used by the doc but never defined. Minimal stand-ins.
import { CopilotChat, CopilotKitProvider } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
type Product = { id: string; name: string; price: number };
function ProductRow({ products }: { products: Product[] }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {products.map((p) => (
        <div key={p.id} style={{ border: "1px solid #ccc", padding: 8 }}>
          {p.name} ${p.price}
        </div>
      ))}
    </div>
  );
}
const PRODUCTS: Product[] = [
  { id: "1", name: "Classic Tee", price: 19 },
  { id: "2", name: "Canvas Tote", price: 25 },
];

export default function Page() {
  return (
    // HARNESS: provider from the doc's "When a component fails" snippet + agentId="antigravity_agent" on CopilotChat (never named on the page).
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit-gui" /* HARNESS: doc says "/api/copilotkit"; the doc's own [[...slug]] runtime (GET+POST) is served at /api/copilotkit-gui, see app/api/copilotkit-gui */
      generativeUI={{
        ui: shopUI,
        errorBoundary: {
          onError: (info) => console.warn(info.kind, info.surfaceId, info.error.message),
          fallback: ({ retry }) => <button onClick={retry}>Try again</button>,
        },
      }}
    >
      <div style={{ display: "flex", height: "100vh" }}>
        <main style={{ flex: 1, padding: 16 }}>
          <h2>Featured Products</h2>
          <FeaturedProducts products={PRODUCTS} />
        </main>
        <div style={{ width: 420 }}>
          <CopilotChat agentId="antigravity_agent" />
        </div>
      </div>
    </CopilotKitProvider>
  );
}
