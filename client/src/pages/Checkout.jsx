import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useStoreConfig } from "../hooks/useStoreConfig";

import {
  formatCurrency,
  buildWhatsAppMessage,
  buildWhatsAppLink,
} from "../utils/format";

import api from "../services/api";
import { EmptyState } from "../components/States";

import "./Checkout.css";

/* =========================================================
   VALIDATION
========================================================= */

function validateCheckoutForm(form) {
  const errors = {};

  const customerName = form.customerName.trim();
  const mobile = form.mobile.trim();
  const address = form.address.trim();

  if (!customerName) {
    errors.customerName = "Name is required.";
  }

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    errors.mobile = "Enter a valid 10-digit mobile number.";
  }

  if (!address || address.length < 8) {
    errors.address = "Enter your full delivery address.";
  }

  return errors;
}

/* =========================================================
   CHECKOUT
========================================================= */

export default function Checkout() {
  const { items, totalAmount, totalSavingsAmount, clearCart } = useCart();
  const { config } = useStoreConfig();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerName: "",
    mobile: "",
    address: "",
  });

  const [errors, setErrors] = useState({});

  /* =========================================================
     EMPTY CART
  ========================================================= */

  if (items.length === 0) {
    return (
      <div className="container section">
        <EmptyState
          title="Your cart is empty"
          description="Add products before checking out."
        />

        <div style={{ textAlign: "center" }}>
          <Link to="/products" className="btn btn-primary">
            Shop now
          </Link>
        </div>
      </div>
    );
  }

  /* =========================================================
   ORDER TOTALS
========================================================= */

  const subtotal = totalAmount;

  const totalMrpAmount = items.reduce((sum, item) => {
    const mrp = Number(item.mrp || 0);
    const price = Number(item.price || 0);
    const quantity = Number(item.quantity || 0);

    return sum + mrp * quantity;
  }, 0);

  const totalSavingAmount = Math.max(0, totalMrpAmount - subtotal);

 const deliverySettings = config.delivery || {};

 const deliveryEnabled = deliverySettings.enabled ?? true;

 const minimumOrderAmount = Number(deliverySettings.minimumOrderAmount ?? 500);

 const firstDeliveryBandAmount = Number(
   deliverySettings.firstDeliveryBandAmount ?? 750,
 );

 const chargePerAmount = Number(deliverySettings.chargePerAmount ?? 500);

 const chargePerAmountValue = Number(
   deliverySettings.chargePerAmountValue ?? 20,
 );

 let deliveryCharge = 0;

 if (deliveryEnabled) {
   // First band
   if (subtotal <= firstDeliveryBandAmount) {
     deliveryCharge = chargePerAmountValue;
   }

   // Subsequent bands
   else {
     const additionalBands = Math.ceil(
       (subtotal - firstDeliveryBandAmount) / chargePerAmount,
     );

     deliveryCharge = (additionalBands + 1) * chargePerAmountValue;
   }
 }

const finalTotal = subtotal + deliveryCharge;

  /* =========================================================
     FORM VALIDATION
  ========================================================= */

  function validate() {
    const nextErrors = validateCheckoutForm(form);

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  /* =========================================================
     FORM INPUT
  ========================================================= */

  function handleInputChange(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    /*
     * Remove the field's previous error once the customer
     * starts correcting it.
     */
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  }

  /* =========================================================
     PLACE ORDER
  ========================================================= */

  async function handlePlaceOrder(e) {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (!config.whatsappNumber) {
      setErrors({
        form: "Store WhatsApp number isn't configured. Please call the store directly.",
      });

      return;
    }

    /* =======================================================
       ORDER PAYLOAD
    ======================================================= */

    const orderPayload = {
      customerName: form.customerName.trim(),
      mobile: form.mobile.trim(),
      address: form.address.trim(),

      items: items.map((item) => {
        const price = Number(item.price);
        const quantity = Number(item.quantity);

        return {
          product: item.productId,
          name: item.name,
          type: item.type || "",
          variant: item.variant || "",
          price,
          quantity,
          subtotal: price * quantity,
        };
      }),

      subtotal,
      deliveryCharge,
      total: finalTotal,
    };

    api.post("/orders", orderPayload).catch(() => {});

    /* =======================================================
       WHATSAPP MESSAGE
    ======================================================= */

    const message = buildWhatsAppMessage({
      storeName: config.storeName,
      customerName: orderPayload.customerName,
      mobile: orderPayload.mobile,
      address: orderPayload.address,
      items,
      subtotal,
      deliveryCharge,
      total: finalTotal,
    });

    /* =======================================================
       OPEN WHATSAPP
    ======================================================= */

    const link = buildWhatsAppLink(config.whatsappNumber, message);

    window.open(link, "_blank");

    /* =======================================================
       COMPLETE CHECKOUT
    ======================================================= */

    clearCart();
    navigate("/");
  }

  /* =========================================================
     RENDER
========================================================= */

  return (
    <div className="container section checkout-page">
      <h1 className="cart-title">Review your order</h1>

      <div className="checkout-grid">
        {/* ===================================================
            CHECKOUT FORM
        =================================================== */}

        <form className="checkout-form" onSubmit={handlePlaceOrder} noValidate>
          <label>
            Name
            <input
              type="text"
              value={form.customerName}
              onChange={(e) =>
                handleInputChange("customerName", e.target.value)
              }
              placeholder="Your full name"
            />
            {errors.customerName && (
              <span className="field-error">{errors.customerName}</span>
            )}
          </label>

          <label>
            Mobile number
            <input
              type="tel"
              value={form.mobile}
              onChange={(e) => handleInputChange("mobile", e.target.value)}
              placeholder="10-digit mobile number"
            />
            {errors.mobile && (
              <span className="field-error">{errors.mobile}</span>
            )}
          </label>

          <label>
            Delivery address
            <textarea
              rows={4}
              value={form.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="House/flat no., street, area, landmark"
            />
            {errors.address && (
              <span className="field-error">{errors.address}</span>
            )}
          </label>

          {errors.form && <p className="field-error">{errors.form}</p>}

          <button type="submit" className="btn btn-accent checkout-submit">
            Place Order on WhatsApp
          </button>
        </form>

        {/* ===================================================
            ORDER SUMMARY
        =================================================== */}

        <aside className="checkout-summary">
          <h3>Order summary</h3>

          <div className="checkout-summary-list">
            {items.map((item) => (
              <div key={item.lineKey} className="checkout-summary-row">
                <span>
                  {item.name}

                  {item.type && (
                    <>
                      <br />
                      <small>Type: {item.type}</small>
                    </>
                  )}

                  {item.variant && (
                    <>
                      <br />
                      <small>Size: {item.variant}</small>
                    </>
                  )}

                  {" × "}
                  {item.quantity}
                </span>

                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* MRP TOTAL */}

          <div className="checkout-summary-row">
            <span>MRP Total</span>

            <span>{formatCurrency(totalMrpAmount)}</span>
          </div>

          {/* DISCOUNT */}

          {totalSavingAmount > 0 && (
            <div className="checkout-summary-row checkout-discount-row">
              <span>Discount</span>

              <span>-{formatCurrency(totalSavingAmount)}</span>
            </div>
          )}

          {/* YOUR PRICE */}

          <div className="checkout-summary-row">
            <span>Your Price</span>

            <span>{formatCurrency(subtotal)}</span>
          </div>

          {/* DELIVERY */}

          {deliveryCharge > 0 && (
            <div className="checkout-summary-row">
              <span className="delivery-charges">Delivery charges</span>

              <span>{formatCurrency(deliveryCharge)}</span>
            </div>
          )}

          {/* SAVINGS */}

          {totalSavingAmount > 0 && (
            <div className="checkout-saving">
              <span>You save</span>

              <strong>{formatCurrency(totalSavingAmount)}</strong>
            </div>
          )}
<hr />  
          {/* FINAL TOTAL */}

          <div className="checkout-summary-total">
            <span>Total to pay</span>

            <span>{formatCurrency(finalTotal)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
