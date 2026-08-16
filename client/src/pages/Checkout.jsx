import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useStoreConfig } from "../hooks/useStoreConfig";
import { formatCurrency, buildWhatsAppMessage, buildWhatsAppLink } from "../utils/format";
import api from "../services/api";
import { EmptyState } from "../components/States";
import "./Checkout.css";

export default function Checkout() {
  const { items, totalAmount, clearCart } = useCart();
  const { config } = useStoreConfig();
  const navigate = useNavigate();

  const [form, setForm] = useState({ customerName: "", mobile: "", address: "" });
  const [errors, setErrors] = useState({});

  if (items.length === 0) {
    return (
      <div className="container section">
        <EmptyState title="Your cart is empty" description="Add products before checking out." />
        <div style={{ textAlign: "center" }}>
          <Link to="/products" className="btn btn-primary">Shop now</Link>
        </div>
      </div>
    );
  }

  function validate() {
    const next = {};
    if (!form.customerName.trim()) next.customerName = "Name is required.";
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) next.mobile = "Enter a valid 10-digit mobile number.";
    if (!form.address.trim() || form.address.trim().length < 8) next.address = "Enter your full delivery address.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    if (!validate()) return;
    if (!config.whatsappNumber) {
      setErrors({ form: "Store WhatsApp number isn't configured. Please call the store directly." });
      return;
    }

    const orderPayload = {
      customerName: form.customerName.trim(),
      mobile: form.mobile.trim(),
      address: form.address.trim(),
      items: items.map((i) => ({ product: i.productId, name: i.name, variant: i.variant || "", price: i.price, quantity: i.quantity })),
      total: totalAmount,
    };

    // Best-effort order log — the WhatsApp flow proceeds regardless of this succeeding.
    api.post("/orders", orderPayload).catch(() => {});

    const message = buildWhatsAppMessage({
      storeName: config.storeName,
      customerName: orderPayload.customerName,
      mobile: orderPayload.mobile,
      address: orderPayload.address,
      items,
      total: totalAmount,
    });

    const link = buildWhatsAppLink(config.whatsappNumber, message);
    window.open(link, "_blank");
    clearCart();
    navigate("/");
  }

  return (
    <div className="container section checkout-page">
      <h1 className="cart-title">Review your order</h1>

      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={handlePlaceOrder} noValidate>
          <label>
            Name
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              placeholder="Your full name"
            />
            {errors.customerName && <span className="field-error">{errors.customerName}</span>}
          </label>

          <label>
            Mobile number
            <input
              type="tel"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              placeholder="10-digit mobile number"
            />
            {errors.mobile && <span className="field-error">{errors.mobile}</span>}
          </label>

          <label>
            Delivery address
            <textarea
              rows={4}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="House/flat no., street, area, landmark"
            />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </label>

          {errors.form && <p className="field-error">{errors.form}</p>}

          <button type="submit" className="btn btn-accent checkout-submit">
            Place Order on WhatsApp
          </button>
        </form>

        <aside className="checkout-summary">
          <h3>Order summary</h3>
          <div className="checkout-summary-list">
            {items.map((i) => (
              <div key={i.lineKey} className="checkout-summary-row">
                <span>{i.name}{i.variant && ` (${i.variant})`} × {i.quantity}</span>
                <span>{formatCurrency(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="checkout-summary-total">
            <span>Total</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
