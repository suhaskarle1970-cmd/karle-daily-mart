import { useEffect, useState } from "react";
import api from "../../services/api.js";
import "./AdminSettings.css";

const DEFAULT_SETTINGS = {
  enabled: true,
  minimumOrderAmount: 500,
  firstDeliveryBandAmount: 500,
  firstDeliveryCharge: 20,
  chargePerAmount: 500,
  chargePerAmountValue: 20,
};

function normalizeSettings(delivery = {}) {
  const stepCharge =
    delivery.chargePerAmountValue ?? DEFAULT_SETTINGS.chargePerAmountValue;

  return {
    enabled: delivery.enabled ?? DEFAULT_SETTINGS.enabled,

    minimumOrderAmount:
      delivery.minimumOrderAmount ?? DEFAULT_SETTINGS.minimumOrderAmount,

    firstDeliveryBandAmount:
      delivery.firstDeliveryBandAmount ??
      DEFAULT_SETTINGS.firstDeliveryBandAmount,

    firstDeliveryCharge: delivery.firstDeliveryCharge ?? stepCharge,

    chargePerAmount:
      delivery.chargePerAmount ?? DEFAULT_SETTINGS.chargePerAmount,

    chargePerAmountValue: stepCharge,
  };
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

const quickChipBarStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  marginTop: "6px",
};

const quickChipStyle = {
  padding: "4px 10px",
  fontSize: "12px",
  fontWeight: 500,
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  background: "#f9fafb",
  color: "#374151",
  cursor: "pointer",
};

const quickChipActiveStyle = {
  ...quickChipStyle,
  background: "#eff6ff",
  borderColor: "#3b82f6",
  color: "#1d4ed8",
  fontWeight: 600,
};

export default function AdminSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState(DEFAULT_SETTINGS);

  const [testOrderAmount, setTestOrderAmount] = useState(850);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /* =========================================================
     LOAD SETTINGS
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/config");

        if (!mounted) {
          return;
        }

        const loaded = normalizeSettings(data?.delivery);
        setSettings(loaded);
        setSavedSettings(loaded);
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(
          err.response?.data?.message || "Failed to load delivery settings.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     CHANGE HANDLERS
  ========================================================= */

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setMessage("");
    setError("");

    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value === "" ? "" : Number(value),
    }));
  }

  function setFieldValue(field, numValue) {
    if (saving) return;
    setMessage("");
    setError("");

    setSettings((prev) => {
      const next = {
        ...prev,
        [field]: Math.max(0, Number(numValue) || 0),
      };

      if (
        field === "minimumOrderAmount" &&
        Number(next.firstDeliveryBandAmount) < Number(next.minimumOrderAmount)
      ) {
        next.firstDeliveryBandAmount = Number(next.minimumOrderAmount);
      }

      return next;
    });
  }

  function handleResetToSaved() {
    setSettings(savedSettings);
    setError("");
    setMessage("Changes reverted to last saved settings.");
  }

  function handleRestoreDefaults() {
    setSettings(DEFAULT_SETTINGS);
    setError("");
    setMessage(
      "Default values loaded into form. Click 'Save Delivery Settings' to apply.",
    );
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  function validateSettings() {
    if (
      settings.minimumOrderAmount === "" ||
      settings.firstDeliveryBandAmount === "" ||
      settings.firstDeliveryCharge === "" ||
      settings.chargePerAmount === "" ||
      settings.chargePerAmountValue === ""
    ) {
      return "Please fill in all delivery amount fields before saving.";
    }

    const minimumOrderAmount = Number(settings.minimumOrderAmount);
    const firstDeliveryBandAmount = Number(settings.firstDeliveryBandAmount);
    const firstDeliveryCharge = Number(settings.firstDeliveryCharge);
    const chargePerAmount = Number(settings.chargePerAmount);
    const chargePerAmountValue = Number(settings.chargePerAmountValue);

    if (!Number.isFinite(minimumOrderAmount) || minimumOrderAmount < 0) {
      return "Minimum order amount must be ₹0 or more.";
    }

    if (
      !Number.isFinite(firstDeliveryBandAmount) ||
      firstDeliveryBandAmount < minimumOrderAmount
    ) {
      return `First slab maximum (₹${formatAmount(firstDeliveryBandAmount)}) cannot be less than the minimum order amount (₹${formatAmount(minimumOrderAmount)}).`;
    }

    if (!Number.isFinite(firstDeliveryCharge) || firstDeliveryCharge < 0) {
      return "First range delivery charge must be ₹0 or more.";
    }

    if (!Number.isFinite(chargePerAmount) || chargePerAmount <= 0) {
      return "Purchase step amount must be greater than ₹0.";
    }

    if (!Number.isFinite(chargePerAmountValue) || chargePerAmountValue < 0) {
      return "Delivery charge per step must be ₹0 or more.";
    }

    return null;
  }

  /* =========================================================
     SAVE
  ========================================================= */

  async function handleSave(e) {
    e.preventDefault();

    const validationError = validateSettings();

    if (validationError) {
      setError(validationError);
      setMessage("");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      enabled: Boolean(settings.enabled),
      minimumOrderAmount: Number(settings.minimumOrderAmount),
      firstDeliveryBandAmount: Number(settings.firstDeliveryBandAmount),
      firstDeliveryCharge: Number(settings.firstDeliveryCharge),
      chargePerAmount: Number(settings.chargePerAmount),
      chargePerAmountValue: Number(settings.chargePerAmountValue),
    };

    try {
      const { data } = await api.put("/config", {
        delivery: payload,
      });

      const updated = data?.delivery
        ? normalizeSettings(data.delivery)
        : payload;

      setSettings(updated);
      setSavedSettings(updated);
      setMessage("Delivery settings saved and updated on store.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save delivery settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     SLAB & EXAMPLE CALCULATIONS
  ========================================================= */

  const minimumOrder = Number(settings.minimumOrderAmount) || 0;
  const firstDeliveryBand = Number(settings.firstDeliveryBandAmount) || 0;
  const firstCharge = Number(settings.firstDeliveryCharge) || 0;
  const chargeStep = Math.max(1, Number(settings.chargePerAmount) || 1);
  const chargeValue = Number(settings.chargePerAmountValue) || 0;

  function calculateDelivery(orderAmount) {
    if (!settings.enabled) {
      return 0;
    }

    if (orderAmount <= firstDeliveryBand) {
      return firstCharge;
    }

    const additionalBands = Math.ceil(
      (orderAmount - firstDeliveryBand) / chargeStep,
    );

    return firstCharge + additionalBands * chargeValue;
  }

  const firstSlabLabel =
    minimumOrder === firstDeliveryBand
      ? `Orders up to ₹${formatAmount(firstDeliveryBand)}`
      : `₹${formatAmount(minimumOrder)} to ₹${formatAmount(firstDeliveryBand)}`;

  const slabRanges = [
    {
      slabNumber: 1,
      label: firstSlabLabel,
      note: "Base 1st Slab",
      charge: calculateDelivery(firstDeliveryBand),
    },
    ...[1, 2, 3, 4].map((extraBand) => {
      const fromAmount = firstDeliveryBand + (extraBand - 1) * chargeStep + 1;
      const toAmount = firstDeliveryBand + extraBand * chargeStep;
      return {
        slabNumber: extraBand + 1,
        label: `₹${formatAmount(fromAmount)} to ₹${formatAmount(toAmount)}`,
        note: `Base ₹${formatAmount(firstCharge)} + (${extraBand} × ₹${formatAmount(chargeValue)})`,
        charge: calculateDelivery(toAmount),
      };
    }),
  ];

  const numericTestOrder = Number(testOrderAmount) || 0;
  const testDeliveryFee = calculateDelivery(numericTestOrder);
  const testGrandTotal = numericTestOrder + testDeliveryFee;

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="admin-settings-page">
        <div className="admin-settings-header">
          <div>
            <h1>Store Settings</h1>
            <p>Manage your store and home delivery charges.</p>
          </div>
        </div>

        <div className="settings-card">
          <p>Loading delivery settings…</p>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="admin-settings-page">
      <div className="admin-settings-header">
        <div>
          <h1>Store Settings</h1>
          <p>
            Easily set your minimum order, bill range slabs, and delivery
            charges.
          </p>
        </div>
      </div>

      <form className="settings-card" onSubmit={handleSave} noValidate>
        {/* ===================================================
            1. ENABLE / DISABLE TOGGLE
        =================================================== */}

        <div className="settings-card-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ margin: 0 }}>Home Delivery Charges</h2>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: settings.enabled ? "#dcfce7" : "#fee2e2",
                  color: settings.enabled ? "#15803d" : "#b91c1c",
                }}
              >
                {settings.enabled
                  ? "ACTIVE (Charges Applied)"
                  : "OFF (₹0 Free Delivery)"}
              </span>
            </div>

            <p style={{ marginTop: "6px" }}>
              Turn this switch ON to apply slab-based delivery fees at checkout,
              or turn it OFF to make delivery ₹0 for all orders.
            </p>
          </div>

          <label
            className="settings-switch"
            title={
              settings.enabled
                ? "Home delivery charges enabled"
                : "Home delivery charges disabled"
            }
          >
            <input
              type="checkbox"
              name="enabled"
              checked={Boolean(settings.enabled)}
              onChange={handleChange}
              aria-label="Enable home delivery"
            />
            <span aria-hidden="true" />
          </label>
        </div>

        <div className="settings-divider" />

        {/* ===================================================
            PLAIN-LANGUAGE RULE SUMMARY BANNER
        =================================================== */}

        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "20px",
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#1e293b",
          }}
        >
          <strong>Current Rule in Plain Words: </strong>
          {settings.enabled ? (
            <>
              Orders up to <strong>₹{formatAmount(firstDeliveryBand)}</strong>{" "}
              (starting from <strong>₹{formatAmount(minimumOrder)}</strong>{" "}
              minimum) will be charged{" "}
              <strong>₹{formatAmount(firstCharge)}</strong> for delivery. Above{" "}
              <strong>₹{formatAmount(firstDeliveryBand)}</strong>, for every{" "}
              <strong>₹{formatAmount(chargeStep)}</strong> of purchase,{" "}
              <strong>₹{formatAmount(chargeValue)}</strong> delivery charge will
              be applied.
            </>
          ) : (
            <span>
              Delivery charges are currently turned <strong>OFF</strong>. No
              delivery fee (₹0) will be added to customer bills.
            </span>
          )}
        </div>

        {/* ===================================================
            2. CONTROLLABLE DELIVERY FIELDS WITH QUICK PRESETS
        =================================================== */}

        <div className="settings-grid">
          {/* STEP 1: MINIMUM ORDER */}
          <label className="setting-field">
            <span>1. Minimum Order Amount (किमान ऑर्डर)</span>

            <div className="input-with-symbol">
              <span aria-hidden="true">₹</span>
              <input
                type="number"
                name="minimumOrderAmount"
                min="0"
                step="1"
                inputMode="numeric"
                value={settings.minimumOrderAmount}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div style={quickChipBarStyle}>
              {[0, 300, 500, 750, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  style={
                    Number(settings.minimumOrderAmount) === val
                      ? quickChipActiveStyle
                      : quickChipStyle
                  }
                  onClick={() => setFieldValue("minimumOrderAmount", val)}
                >
                  ₹{val}
                </button>
              ))}
            </div>

            <small>
              Starting order amount required for home delivery (e.g. ₹
              {formatAmount(minimumOrder)}).
            </small>
          </label>

          {/* STEP 2: FIRST SLAB UP TO */}
          <label className="setting-field">
            <span>2. Orders Up To Amount (पहिला ऑर्डर टप्पा)</span>

            <div className="input-with-symbol">
              <span aria-hidden="true">₹</span>
              <input
                id="firstDeliveryBandAmount"
                type="number"
                name="firstDeliveryBandAmount"
                min="0"
                step="1"
                inputMode="numeric"
                value={settings.firstDeliveryBandAmount}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div style={quickChipBarStyle}>
              {[500, 750, 1000, 1500, 2000].map((val) => (
                <button
                  key={val}
                  type="button"
                  style={
                    Number(settings.firstDeliveryBandAmount) === val
                      ? quickChipActiveStyle
                      : quickChipStyle
                  }
                  onClick={() => setFieldValue("firstDeliveryBandAmount", val)}
                >
                  Up to ₹{val}
                </button>
              ))}
            </div>

            <small>
              Orders up to ₹{formatAmount(firstDeliveryBand)} use the First
              Range Delivery Charge below.
            </small>
          </label>

          {/* STEP 3: FIRST RANGE DELIVERY CHARGE */}
          <label className="setting-field">
            <span>
              3. Delivery Charge Up To ₹{formatAmount(firstDeliveryBand)}{" "}
              (पहिल्या टप्प्याचा चार्ज)
            </span>

            <div className="input-with-symbol">
              <span aria-hidden="true">₹</span>
              <input
                type="number"
                name="firstDeliveryCharge"
                min="0"
                step="1"
                inputMode="numeric"
                value={settings.firstDeliveryCharge}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div style={quickChipBarStyle}>
              {[0, 10, 20, 30, 40, 50].map((val) => (
                <button
                  key={val}
                  type="button"
                  style={
                    Number(settings.firstDeliveryCharge) === val
                      ? quickChipActiveStyle
                      : quickChipStyle
                  }
                  onClick={() => setFieldValue("firstDeliveryCharge", val)}
                >
                  {val === 0 ? "₹0 (Free)" : `₹${val}`}
                </button>
              ))}
            </div>

            <small>
              Delivery charge applied for orders up to ₹
              {formatAmount(firstDeliveryBand)}.
            </small>
          </label>

          {/* STEP 4: EVERY PURCHASE STEP AMOUNT */}
          <label className="setting-field">
            <span>4. Next Slab Every Purchase Of (प्रत्येक खरेदी टप्पा)</span>

            <div className="input-with-symbol">
              <span aria-hidden="true">₹</span>
              <input
                type="number"
                name="chargePerAmount"
                min="1"
                step="1"
                inputMode="numeric"
                value={settings.chargePerAmount}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div style={quickChipBarStyle}>
              {[250, 500, 750, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  style={
                    Number(settings.chargePerAmount) === val
                      ? quickChipActiveStyle
                      : quickChipStyle
                  }
                  onClick={() => setFieldValue("chargePerAmount", val)}
                >
                  Every ₹{val}
                </button>
              ))}
            </div>

            <small>
              Above ₹{formatAmount(firstDeliveryBand)}, a new charge step
              applies every ₹{formatAmount(chargeStep)} of purchase.
            </small>
          </label>

          {/* STEP 5: DELIVERY CHARGE PER PURCHASE STEP */}
          <label className="setting-field">
            <span>
              5. Charge Per ₹{formatAmount(chargeStep)} Purchase (पुढील प्रत्येक
              टप्प्याचा चार्ज)
            </span>

            <div className="input-with-symbol">
              <span aria-hidden="true">₹</span>
              <input
                type="number"
                name="chargePerAmountValue"
                min="0"
                step="1"
                inputMode="numeric"
                value={settings.chargePerAmountValue}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div style={quickChipBarStyle}>
              {[0, 10, 20, 30, 40, 50].map((val) => (
                <button
                  key={val}
                  type="button"
                  style={
                    Number(settings.chargePerAmountValue) === val
                      ? quickChipActiveStyle
                      : quickChipStyle
                  }
                  onClick={() => setFieldValue("chargePerAmountValue", val)}
                >
                  {val === 0 ? "₹0 (Free)" : `₹${val}`}
                </button>
              ))}
            </div>

            <small>
              ₹{formatAmount(chargeValue)} delivery charge will be added for
              every ₹{formatAmount(chargeStep)} purchase.
            </small>
          </label>
        </div>

        {/* ===================================================
            3. LIVE SLAB RANGE PREVIEW TABLE
        =================================================== */}

        <div className="delivery-example" style={{ marginTop: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            <strong>Live Order Range Slabs (Auto-Calculated Preview)</strong>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              Updates automatically as you change numbers above
            </span>
          </div>

          {slabRanges.map((slab) => (
            <div className="example-row" key={slab.slabNumber}>
              <span>
                <strong>Slab {slab.slabNumber}:</strong> {slab.label}{" "}
                <small style={{ color: "#6b7280" }}>({slab.note})</small>
              </span>
              <b>₹{formatAmount(slab.charge)} delivery</b>
            </div>
          ))}
        </div>

        {/* ===================================================
            4. INTERACTIVE BILL TESTER FOR STORE OWNER
        =================================================== */}

        <div
          className="delivery-example"
          style={{
            marginTop: "16px",
            background: "#f0fdf4",
            borderColor: "#bbf7d0",
          }}
        >
          <strong>Test Any Customer Bill Amount</strong>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginTop: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>If customer order bill is ₹</span>
              <input
                type="number"
                min="0"
                step="50"
                value={testOrderAmount}
                onChange={(e) => setTestOrderAmount(e.target.value)}
                style={{
                  width: "110px",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #86efac",
                  fontWeight: 600,
                }}
              />
            </div>

            <div style={{ fontSize: "14px" }}>
              Delivery Charge:{" "}
              <strong style={{ color: "#15803d" }}>
                ₹{formatAmount(testDeliveryFee)}
              </strong>{" "}
              | Final Bill to Pay:{" "}
              <strong>₹{formatAmount(testGrandTotal)}</strong>
            </div>
          </div>
        </div>

        {/* ===================================================
            ERROR & SUCCESS MESSAGES
        =================================================== */}

        {error && (
          <div
            className="settings-message"
            role="alert"
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              marginTop: "16px",
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            className="settings-message"
            role="status"
            style={{ marginTop: "16px" }}
          >
            {message}
          </div>
        )}

        {/* ===================================================
            ACTIONS
        =================================================== */}

        <div
          className="settings-actions"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleResetToSaved}
            disabled={saving}
            style={{
              flex: "1 1 140px",
              minHeight: "44px",
              padding: "10px 12px",
              textAlign: "center",
              justifyContent: "center",
            }}
          >
            Undo
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={handleRestoreDefaults}
            disabled={saving}
            style={{
              flex: "1 1 140px",
              minHeight: "44px",
              padding: "10px 12px",
              textAlign: "center",
              justifyContent: "center",
            }}
          >
            Restore Defaults
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{
              flex: "2 1 220px",
              minHeight: "44px",
              padding: "10px 16px",
              textAlign: "center",
              justifyContent: "center",
            }}
          >
            {saving ? "Saving..." : "Save Delivery Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
