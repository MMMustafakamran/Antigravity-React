// --- Doc: https://docs.copilotkit.ai/google-antigravity/generative-ui/components/state-and-actions ---
// The page shows two different app/catalog.tsx versions (state + bind, then functions + events).
// HARNESS: merged into one createGenerativeUI call (the page never shows them together) plus the imports it never shows.
import { useState } from "react";
import { z } from "zod";
import { createGenerativeUI } from "@copilotkit/react-core/v2/generative-ui";
import type { GenerativeUIComponentProps } from "@copilotkit/react-core/v2/generative-ui";

const cartSchema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number() })),
});

// Doc: "In the component, the event is a typed prop" (verbatim)
function ProductCard({ productId, name, onAddToCart }: GenerativeUIComponentProps<typeof shopUI, "ProductCard">) {
  const [error, setError] = useState<string>();
  return (
    <article>
      <h4>{name}</h4>
      <button
        onClick={async () => {
          const result = await onAddToCart?.({ productId });
          if (result) setError(result.ok ? undefined : result.error.message);
        }}
      >
        Add to cart
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </article>
  );
}

export const shopUI = createGenerativeUI({
  id: "acme/shop@1",
  state: { cart: cartSchema },
  functions: {
    addToCart: {
      description: "Add a product to the cart",
      parameters: z.object({ productId: z.string(), quantity: z.number().default(1) }),
    },
  },
  components: {
    ProductCard: {
      component: ProductCard,
      props: z.object({ productId: z.string(), name: z.string(), inCart: z.number() }),
      bind: {
        inCart: (state, { productId }) =>
          state.cart.items.find((item) => item.productId === productId)?.quantity ?? 0,
      },
      events: { onAddToCart: {} },
    },
  },
});
