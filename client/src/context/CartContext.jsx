import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
const CartContext = createContext(null);
const STORAGE_KEY = "kdm_cart";
/* * ========================================================= * HELPERS * ========================================================= */ function getVariantLabel(
  variant,
) {
  if (!variant) return "";
  return `${variant.amount} ${variant.unit}`;
}
function getTypeLabel(type) {
  if (!type) return "";
  return type.name || "";
}
/* * Cart line must be unique for: * * Product + Type + Size * * Examples: * * Rice + Kolam + 500g * Rice + Kolam + 1kg * Rice + Basmati + 500g * * These must all be separate cart items. */ function createLineKey(
  productId,
  variant,
  type,
) {
  const typePart = type?.name
    ? String(type.name).trim().toLowerCase()
    : "default";
  const variantPart =
    variant?.unit && variant?.amount !== undefined
      ? `${String(variant.unit).trim().toLowerCase()}:${Number(variant.amount)}`
      : "default";
  return `${productId}::${typePart}::${variantPart}`;
}
/* * ========================================================= * CART PROVIDER * ========================================================= */ export function CartProvider({
  children,
}) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      /* * Keep old cart items usable. * * Old items may already contain a lineKey. * We preserve them rather than breaking the user's cart. */ return parsed.map(
        (item) => ({
          ...item,
          variant: item.variant || "",
          type: item.type || "",
          quantity: Math.max(1, Number(item.quantity || 1)),
          price: Number(item.price || 0),
          mrp: Number(item.mrp || 0),
          lineKey:
            item.lineKey ||
            `${item.productId}::${item.type || "default"}::${item.variant || "default"}`,
        }),
      );
    } catch (error) {
      console.error("Failed to restore cart:", error);
      return [];
    }
  });
  /* * ========================================================= * SAVE CART * ========================================================= */ useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  }, [items]);
  /* * ========================================================= * ADD ITEM * ========================================================= */ const addItem =
    useCallback((product, quantity = 1, variant = null, type = null) => {
      if (!product?._id) {
        console.error("Cannot add product without product ID.");
        return;
      }
      const safeQuantity = Math.max(1, Number(quantity) || 1);
      /* * ----------------------------------------------------- * CREATE UNIQUE LINE KEY * ----------------------------------------------------- */ const key =
        createLineKey(product._id, variant, type);
      /* * ----------------------------------------------------- * DETERMINE PRICE * ----------------------------------------------------- */ let price =
        Number(product.price || 0);
      let mrp = Number(product.mrp || 0);
      /* * TYPE-BASED PRODUCT * * Example: * * Kolam * 500g ₹35 * 1kg ₹60 * * Basmati * 500g ₹60 * 1kg ₹120 */ if (
        type &&
        variant
      ) {
        /* * Prefer the selected variant's own price. * * ProductDetail already passes the selected size. */ price =
          Number(variant.price || 0);
        mrp = Number(variant.mrp || 0);
        /* * If necessary, verify against the selected * type's sizes. */ const selectedSize =
          Array.isArray(type.sizes)
            ? type.sizes.find(
                (size) =>
                  String(size.unit).toLowerCase() ===
                    String(variant.unit).toLowerCase() &&
                  Number(size.amount) === Number(variant.amount),
              )
            : null;
        if (selectedSize) {
          price = Number(selectedSize.price || 0);
          mrp = Number(selectedSize.mrp || 0);
        }
      } /* * ----------------------------------------------------- * STANDARD PRODUCT WITH VARIANT * ----------------------------------------------------- */ else if (
        variant
      ) {
        price = Number(variant.price || 0);
        mrp = Number(variant.mrp || 0);
      }
      /* * ----------------------------------------------------- * DISPLAY LABELS * ----------------------------------------------------- */ const variantText =
        getVariantLabel(variant);
      const typeText = getTypeLabel(type);
      /* * ----------------------------------------------------- * UPDATE CART * ----------------------------------------------------- */ setItems(
        (prev) => {
          const existing = prev.find((item) => item.lineKey === key);
          /* * SAME PRODUCT + SAME TYPE + SAME SIZE * * Increase quantity instead of creating * another cart line. */ if (
            existing
          ) {
            return prev.map((item) =>
              item.lineKey === key
                ? { ...item, quantity: item.quantity + safeQuantity }
                : item,
            );
          }
          /* * NEW CART LINE */ return [
            ...prev,
            {
              lineKey: key,
              productId: product._id,
              name: product.name,
              /* * Keep these as strings for * display / WhatsApp. */ type: typeText,
              variant: variantText,
              /* * Keep the raw selection too. * * This is useful later if checkout, * order history, or admin needs * the exact size/type. */ variantData:
                variant
                  ? {
                      amount: Number(variant.amount),
                      unit: variant.unit,
                      price,
                      mrp,
                    }
                  : null,
              typeData: type ? { name: type.name } : null,
              price,
              mrp,
              imageUrl: product.imageUrl,
              quantity: safeQuantity,
            },
          ];
        },
      );
    }, []);
  /* * ========================================================= * UPDATE QUANTITY * ========================================================= */ const updateQuantity =
    useCallback((key, quantity) => {
      const nextQuantity = Number(quantity);
      setItems((prev) => {
        /* * Quantity 0 or invalid * = remove item */ if (
          !Number.isFinite(nextQuantity) ||
          nextQuantity <= 0
        ) {
          return prev.filter((item) => item.lineKey !== key);
        }
        return prev.map((item) =>
          item.lineKey === key ? { ...item, quantity: nextQuantity } : item,
        );
      });
    }, []);
  /* * ========================================================= * REMOVE ITEM * ========================================================= */ const removeItem =
    useCallback((key) => {
      setItems((prev) => prev.filter((item) => item.lineKey !== key));
    }, []);
  /* * ========================================================= * CLEAR CART * ========================================================= */ const clearCart =
    useCallback(() => {
      setItems([]);
    }, []);
  /* * ========================================================= * CART TOTALS * ========================================================= */ const {
    totalItems,
    totalAmount,
  } = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        acc.totalItems += quantity;
        acc.totalAmount += quantity * price;
        return acc;
      },
      { totalItems: 0, totalAmount: 0 },
    );
  }, [items]);
  /* * ========================================================= * CONTEXT VALUE * ========================================================= */ const value =
    {
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      totalItems,
      totalAmount,
    };
  return (
    <CartContext.Provider value={value}> {children} </CartContext.Provider>
  );
}
/* * ========================================================= * USE CART * ========================================================= */ export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
