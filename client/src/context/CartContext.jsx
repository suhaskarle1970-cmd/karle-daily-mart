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

/* ============================================================
   HELPERS
============================================================ */

function getVariantLabel(variant) {
  if (!variant) return "";

  return `${variant.amount} ${variant.unit}`;
}

function getTypeLabel(type) {
  if (!type) return "";

  return type.name || "";
}

function createLineKey(productId, variant, type) {
  const typePart = type?.name
    ? String(type.name).trim().toLowerCase()
    : "default";

  const variantPart =
    variant?.unit && variant?.amount !== undefined
      ? `${String(variant.unit).trim().toLowerCase()}:${Number(
          variant.amount,
        )}`
      : "default";

  return `${productId}::${typePart}::${variantPart}`;
}

/* ============================================================
   RESTORE CART
============================================================ */

function restoreCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item) => ({
      ...item,

      variant: item.variant || "",
      type: item.type || "",

      quantity: Math.max(
        1,
        Number(item.quantity || 1),
      ),

      price: Number(item.price || 0),
      mrp: Number(item.mrp || 0),

      lineKey:
        item.lineKey ||
        `${item.productId}::${
          item.type || "default"
        }::${
          item.variant || "default"
        }`,
    }));
  } catch (error) {
    console.error(
      "Failed to restore cart:",
      error,
    );

    return [];
  }
}

/* ============================================================
   CART PROVIDER
============================================================ */

export function CartProvider({ children }) {
  const [items, setItems] = useState(restoreCart);

  /* ==========================================================
     SAVE CART
  ========================================================== */

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items),
      );
    } catch (error) {
      console.error(
        "Failed to save cart:",
        error,
      );
    }
  }, [items]);

  /* ==========================================================
     ADD ITEM
  ========================================================== */

  const addItem = useCallback(
    (
      product,
      quantity = 1,
      variant = null,
      type = null,
    ) => {
      if (!product?._id) {
        console.error(
          "Cannot add product without product ID.",
        );

        return;
      }

      const safeQuantity = Math.max(
        1,
        Number(quantity) || 1,
      );

      /* --------------------------------------------------------
         CREATE UNIQUE LINE KEY
      -------------------------------------------------------- */

      const key = createLineKey(
        product._id,
        variant,
        type,
      );

      /* --------------------------------------------------------
         DETERMINE PRICE
      -------------------------------------------------------- */

      let price = Number(
        product.price || 0,
      );

      let mrp = Number(
        product.mrp || 0,
      );

      if (type && variant) {
        price = Number(
          variant.price || 0,
        );

        mrp = Number(
          variant.mrp || 0,
        );

        const selectedSize =
          Array.isArray(type.sizes)
            ? type.sizes.find(
                (size) =>
                  String(size.unit).toLowerCase() ===
                    String(
                      variant.unit,
                    ).toLowerCase() &&
                  Number(size.amount) ===
                    Number(
                      variant.amount,
                    ),
              )
            : null;

        if (selectedSize) {
          price = Number(
            selectedSize.price || 0,
          );

          mrp = Number(
            selectedSize.mrp || 0,
          );
        }
      }

      /* --------------------------------------------------------
         STANDARD PRODUCT WITH VARIANT
      -------------------------------------------------------- */

      else if (variant) {
        price = Number(
          variant.price || 0,
        );

        mrp = Number(
          variant.mrp || 0,
        );
      }

      /* --------------------------------------------------------
         DISPLAY LABELS
      -------------------------------------------------------- */

      const variantText =
        getVariantLabel(variant);

      const typeText =
        getTypeLabel(type);

      /* --------------------------------------------------------
         UPDATE CART
      -------------------------------------------------------- */

      setItems((prev) => {
        const existing = prev.find(
          (item) => item.lineKey === key,
        );

        if (existing) {
          return prev.map((item) =>
            item.lineKey === key
              ? {
                  ...item,
                  quantity:
                    item.quantity +
                    safeQuantity,
                }
              : item,
          );
        }

        /* ------------------------------------------------------
           NEW CART LINE
        ------------------------------------------------------ */

        return [
          ...prev,
          {
            lineKey: key,

            productId: product._id,

            name: product.name,

            type: typeText,
            variant: variantText,

            variantData: variant
              ? {
                  amount: Number(
                    variant.amount,
                  ),
                  unit: variant.unit,
                  price,
                  mrp,
                }
              : null,

            typeData: type
              ? {
                  name: type.name,
                }
              : null,

            price,
            mrp,

            imageUrl:
              product.imageUrl,

            quantity: safeQuantity,
          },
        ];
      });
    },
    [],
  );

  /* ==========================================================
     UPDATE QUANTITY
  ========================================================== */

  const updateQuantity = useCallback(
    (key, quantity) => {
      const nextQuantity =
        Number(quantity);

      setItems((prev) => {

        if (
          !Number.isFinite(
            nextQuantity,
          ) ||
          nextQuantity <= 0
        ) {
          return prev.filter(
            (item) =>
              item.lineKey !== key,
          );
        }

        return prev.map((item) =>
          item.lineKey === key
            ? {
                ...item,
                quantity:
                  nextQuantity,
              }
            : item,
        );
      });
    },
    [],
  );

  /* ==========================================================
     REMOVE ITEM
  ========================================================== */

  const removeItem = useCallback(
    (key) => {
      setItems((prev) =>
        prev.filter(
          (item) =>
            item.lineKey !== key,
        ),
      );
    },
    [],
  );

  /* ==========================================================
     CLEAR CART
  ========================================================== */

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  /* ==========================================================
     CART TOTALS
  ========================================================== */

const { totalItems, totalAmount, totalMrpAmount, totalSavingsAmount } =
  useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const quantity = Number(item.quantity || 0);

        const price = Number(item.price || 0);

        const mrp = Number(item.mrp || item.price || 0);

        acc.totalItems += quantity;

        acc.totalAmount += quantity * price;

        acc.totalMrpAmount += quantity * mrp;

        acc.totalSavingsAmount += quantity * Math.max(0, mrp - price);

        return acc;
      },
      {
        totalItems: 0,
        totalAmount: 0,
        totalMrpAmount: 0,
        totalSavingsAmount: 0,
      },
    );
  }, [items]);

  /* ==========================================================
     CONTEXT VALUE
  ========================================================== */

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      totalItems,
      totalAmount,
      totalMrpAmount,
      totalSavingsAmount,
    }),
    [
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      totalItems,
      totalAmount,
      totalMrpAmount,
      totalSavingsAmount,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

/* ============================================================
   USE CART
============================================================ */

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used within CartProvider",
    );
  }

  return context;
}