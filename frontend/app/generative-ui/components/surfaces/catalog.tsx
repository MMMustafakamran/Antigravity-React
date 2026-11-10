// HARNESS: the Surfaces page imports "./catalog" (shopUI) but never shows it. Copied verbatim from the Catalogs page app/catalog.tsx.
import { z } from "zod";
import {
  createGenerativeUI,
  type GenerativeUIComponentProps,
} from "@copilotkit/react-core/v2/generative-ui";

function ProductGrid({ title, children }: GenerativeUIComponentProps<typeof shopUI, "ProductGrid">) {
  return (
    <section>
      {title ? <h3>{title}</h3> : null}
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function ProductCard({ name, price, imageUrl }: GenerativeUIComponentProps<typeof shopUI, "ProductCard">) {
  return (
    <article>
      <img src={imageUrl} alt={name} />
      <h4>{name}</h4>
      <p>${price}</p>
    </article>
  );
}

export const shopUI = createGenerativeUI({
  id: "acme/shop@1",
  components: {
    ProductGrid: {
      component: ProductGrid,
      description: "A grid of products. Put the ids of ProductCard components in children.",
      props: z.object({ title: z.string().optional() }),
      slots: { children: "multiple" },
    },
    ProductCard: {
      component: ProductCard,
      description: "One product. Copy every value from a product of a tool result.",
      props: z.object({ name: z.string(), price: z.number(), imageUrl: z.string() }),
    },
  },
});
