import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/format";
import { EmptyState } from "../components/States";
import "./Cart.css";

// ============================================================
// HELPERS
// ============================================================

function getDiscountInfo(price, mrp) {
  const itemPrice = Number(price || 0);
  const itemMrp = Number(mrp || 0);

  const hasDiscount =
    itemMrp > itemPrice && itemMrp > 0;

  const discountPct = hasDiscount
    ? Math.round(
        ((itemMrp - itemPrice) / itemMrp) * 100,
      )
    : 0;

  return {
    itemPrice,
    itemMrp,
    hasDiscount,
    discountPct,
  };
}

// ============================================================
// CART PAGE
// ============================================================

export default function Cart() {
  const {
    items,
    updateQuantity,
    removeItem,
    totalAmount,
  } = useCart();

  const navigate = useNavigate();

  // ==========================================================
  // EMPTY CART
  // ==========================================================

  if (items.length === 0) {
    return (
      <div className="container section">
        <EmptyState
          title="Your cart is empty"
          description="Add a few essentials to get started."
        />

        <div style={{ textAlign: "center" }}>
          <Link
            to="/products"
            className="btn btn-primary"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="container section cart-page">
      {/* =====================================================
          TITLE
      ===================================================== */}

      <h1 className="cart-title">
        Your cart
      </h1>

      {/* =====================================================
          CART ITEMS
      ===================================================== */}

      <div className="cart-list">
        {items.map((item) => {
          const {
            itemPrice,
            itemMrp,
            hasDiscount,
            discountPct,
          } = getDiscountInfo(
            item.price,
            item.mrp,
          );

          return (
            <div
              key={item.lineKey}
              className="cart-row"
            >
              {/* =================================================
                  IMAGE
              ================================================= */}

              <div className="cart-row-image">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="product-card-image-placeholder">
                    No image
                  </div>
                )}
              </div>

              {/* =================================================
                  PRODUCT INFORMATION
              ================================================= */}

              <div className="cart-row-info">
                <div className="cart-row-name">
                  <div>{item.name}</div>

                  {item.type && (
                    <div className="cart-row-variant">
                      Type: {item.type}
                    </div>
                  )}

                  {item.variant && (
                    <div className="cart-row-variant">
                      Size: {item.variant}
                    </div>
                  )}
                </div>

                {/* PRICE */}

                <div className="cart-row-price-wrapper">
                  <span className="cart-row-price">
                    {formatCurrency(itemPrice)}
                  </span>

                  {hasDiscount && (
                    <>
                      <span className="cart-row-mrp">
                        {formatCurrency(itemMrp)}
                      </span>

                      <span className="cart-row-discount">
                        {discountPct}% off
                      </span>
                    </>
                  )}
                </div>

                <span className="cart-row-each">
                  each
                </span>
              </div>

              {/* =================================================
                  QUANTITY
              ================================================= */}

              <div className="pd-quantity-control cart-row-qty">
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(
                      item.lineKey,
                      item.quantity - 1,
                    )
                  }
                  aria-label="Decrease quantity"
                >
                  −
                </button>

                <span>{item.quantity}</span>

                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(
                      item.lineKey,
                      item.quantity + 1,
                    )
                  }
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* =================================================
                  SUBTOTAL
              ================================================= */}

              <p className="cart-row-subtotal">
                {formatCurrency(
                  itemPrice * item.quantity,
                )}
              </p>

              {/* =================================================
                  REMOVE
              ================================================= */}

              <button
                type="button"
                className="cart-row-remove"
                onClick={() =>
                  removeItem(item.lineKey)
                }
                aria-label={`Remove ${item.name}`}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="cart-summary">
        <div className="cart-summary-row">
          <span>Total</span>

          <span className="cart-summary-total">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        <div className="cart-summary-actions">
          <Link
            to="/products"
            className="btn btn-outline"
          >
            Continue shopping
          </Link>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              navigate("/checkout")
            }
          >
            Proceed to order
          </button>
        </div>
      </div>
    </div>
  );
}