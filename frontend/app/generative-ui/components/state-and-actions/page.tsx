"use client";
import { useState } from "react";
import { CopilotChat, CopilotKitProvider } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
// --- Doc: state-and-actions CartState + CartActions (verbatim) ---
import { useGenerativeUIState } from "@copilotkit/react-core/v2/generative-ui";
import { useGenerativeUIFunction } from "@copilotkit/react-core/v2/generative-ui";
import { shopUI } from "./catalog";

function CartState({ cart }: { cart: Cart }) {
  useGenerativeUIState(shopUI, "cart", { items: cart.items });
  return null;
}

function CartActions({ cart }: { cart: Cart }) {
  useGenerativeUIFunction(shopUI, "addToCart", ({ productId, quantity }) => {
    cart.addItem(productId, quantity);
    return { added: productId };
  });
  return null;
}
// --- end doc ---

// HARNESS: the Cart type and store are never shown on the page. Minimal stand-in.
type Cart = { items: { productId: string; quantity: number }[]; addItem: (id: string, q: number) => void };
function useCart(): Cart {
  const [items, setItems] = useState<Cart["items"]>([]);
  return {
    items,
    addItem: (productId, quantity) =>
      setItems((cur) => {
        const f = cur.find((i) => i.productId === productId);
        return f
          ? cur.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i))
          : [...cur, { productId, quantity }];
      }),
  };
}

function Inner() {
  const cart = useCart();
  return (
    <>
      <CartState cart={cart} />
      <CartActions cart={cart} />
      <div style={{ padding: 8 }}>Cart: {cart.items.map((i) => `${i.productId} x${i.quantity}`).join(", ") || "empty"}</div>
      <CopilotChat agentId="antigravity_agent" />
    </>
  );
}

export default function Page() {
  return (
    // HARNESS: provider + agentId="antigravity_agent" on CopilotChat (never shown on this page).
    <CopilotKitProvider runtimeUrl="/api/copilotkit" generativeUI={{ ui: shopUI }}>
      <Inner />
    </CopilotKitProvider>
  );
}
