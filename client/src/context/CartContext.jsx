import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "kdm_cart";

function variantLabel(variant) {
  return variant ? `${variant.amount} ${variant.unit}` : "";
}

// A cart line is keyed by product + variant, so "Atta 1kg" and "Atta 5kg"
// sit as separate rows even though they're the same product.
function lineKey(productId, variant) {
  return variant ? `${productId}::${variant.unit}:${variant.amount}` : productId;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      // Migrate carts saved before per-variant line items existed.
      return parsed.map((i) => ({ variant: "", ...i, lineKey: i.lineKey || i.productId }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, quantity = 1, variant = null) => {
    const key = lineKey(product._id, variant);
    const price = variant ? variant.price : product.price;
    const label = variantLabel(variant);

    setItems((prev) => {
      const existing = prev.find((i) => i.lineKey === key);
      if (existing) {
        return prev.map((i) => (i.lineKey === key ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [
        ...prev,
        {
          lineKey: key,
          productId: product._id,
          name: product.name,
          variant: label,
          price,
          imageUrl: product.imageUrl,
          quantity,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((key, quantity) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.lineKey !== key);
      return prev.map((i) => (i.lineKey === key ? { ...i, quantity } : i));
    });
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((i) => i.lineKey !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const { totalItems, totalAmount } = useMemo(() => {
    return items.reduce(
      (acc, i) => ({
        totalItems: acc.totalItems + i.quantity,
        totalAmount: acc.totalAmount + i.quantity * i.price,
      }),
      { totalItems: 0, totalAmount: 0 }
    );
  }, [items]);

  const value = { items, addItem, updateQuantity, removeItem, clearCart, totalItems, totalAmount };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
