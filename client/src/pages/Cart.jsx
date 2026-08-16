import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/format";
import { EmptyState } from "../components/States";
import "./Cart.css";

export default function Cart() {
  const { items, updateQuantity, removeItem, totalAmount } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container section">
        <EmptyState title="Your cart is empty" description="Add a few essentials to get started." />
        <div style={{ textAlign: "center" }}>
          <Link to="/products" className="btn btn-primary">Continue shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container section cart-page">
      <h1 className="cart-title">Your cart</h1>

      <div className="cart-list">
        {items.map((item) => (
          <div key={item.lineKey} className="cart-row">
            <div className="cart-row-image">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} />
              ) : (
                <div className="product-card-image-placeholder">No image</div>
              )}
            </div>
            <div className="cart-row-info">
              <p className="cart-row-name">{item.name}{item.variant && <span className="cart-row-variant"> · {item.variant}</span>}</p>
              <p className="cart-row-price">{formatCurrency(item.price)} each</p>
            </div>
            <div className="pd-quantity-control cart-row-qty">
              <button onClick={() => updateQuantity(item.lineKey, item.quantity - 1)} aria-label="Decrease quantity">−</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.lineKey, item.quantity + 1)} aria-label="Increase quantity">+</button>
            </div>
            <p className="cart-row-subtotal">{formatCurrency(item.price * item.quantity)}</p>
            <button className="cart-row-remove" onClick={() => removeItem(item.lineKey)} aria-label={`Remove ${item.name}`}>
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-summary-row">
          <span>Total</span>
          <span className="cart-summary-total">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="cart-summary-actions">
          <Link to="/products" className="btn btn-outline">Continue shopping</Link>
          <button className="btn btn-primary" onClick={() => navigate("/checkout")}>
            Proceed to order
          </button>
        </div>
      </div>
    </div>
  );
}
