import { useEffect, useState } from "react";
import api from "../../services/api.js";
import "./AdminSettings.css";

const DEFAULT_SETTINGS = {
  enabled: true,
  minimumOrderAmount: 500,
  chargePerAmount: 500,
  chargePerAmountValue: 20,
};

function normalizeSettings(delivery = {}) {
  return {
    enabled: delivery.enabled ?? DEFAULT_SETTINGS.enabled,
    minimumOrderAmount:
      delivery.minimumOrderAmount ?? DEFAULT_SETTINGS.minimumOrderAmount,
    chargePerAmount:
      delivery.chargePerAmount ?? DEFAULT_SETTINGS.chargePerAmount,
    chargePerAmountValue:
      delivery.chargePerAmountValue ??
      DEFAULT_SETTINGS.chargePerAmountValue,
  };
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

export default function AdminSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

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

        setSettings(normalizeSettings(data?.delivery));
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(
          err.response?.data?.message ||
            "Failed to load delivery settings.",
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
     CHANGE HANDLER
  ========================================================= */

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setMessage("");
    setError("");

    setSettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value === ""
            ? ""
            : Number(value),
    }));
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  function validateSettings() {
    const minimumOrderAmount = Number(settings.minimumOrderAmount);
    const chargePerAmount = Number(settings.chargePerAmount);
    const chargePerAmountValue = Number(settings.chargePerAmountValue);

    if (
      !Number.isFinite(minimumOrderAmount) ||
      minimumOrderAmount < 0
    ) {
      return "Minimum order amount must be a valid number.";
    }

    if (
      !Number.isFinite(chargePerAmount) ||
      chargePerAmount <= 0
    ) {
      return "Charge applies per amount must be greater than ₹0.";
    }

    if (
      !Number.isFinite(chargePerAmountValue) ||
      chargePerAmountValue < 0
    ) {
      return "Delivery charge must be a valid number.";
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
      chargePerAmount: Number(settings.chargePerAmount),
      chargePerAmountValue: Number(settings.chargePerAmountValue),
    };

    try {
      const { data } = await api.put("/config", {
        delivery: payload,
      });

      /*
       * Use server response when available.
       * This keeps the UI synchronized with backend-normalized values.
       */

      if (data?.delivery) {
        setSettings(normalizeSettings(data.delivery));
      } else {
        setSettings(payload);
      }

      setMessage("Delivery settings saved successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save delivery settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     CALCULATED EXAMPLES
  ========================================================= */

  const minimumOrder = Number(settings.minimumOrderAmount) || 0;
  const chargeStep = Number(settings.chargePerAmount) || 1;
  const chargeValue =
    Number(settings.chargePerAmountValue) || 0;

  /*
   * Show examples starting from the configured minimum.
   *
   * Example:
   * minimum = 500
   * step    = 500
   * charge  = 20
   *
   * → ₹500  = ₹20
   * → ₹1000 = ₹40
   * → ₹1500 = ₹60
   */

  const example1 = minimumOrder;
  const example2 = Math.max(
    minimumOrder + chargeStep,
    chargeStep,
  );
  const example3 = Math.max(
    minimumOrder + chargeStep * 2,
    chargeStep * 3,
  );

  function calculateDelivery(orderAmount) {
    if (orderAmount < minimumOrder) {
      return 0;
    }

    return (
      Math.ceil(orderAmount / chargeStep) *
      chargeValue
    );
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="admin-settings-page">
        <div className="admin-settings-header">
          <div>
            <h1>Store Settings</h1>
            <p>
              Manage your store and home delivery settings.
            </p>
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
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="admin-settings-header">
        <div>
          <h1>Store Settings</h1>

          <p>
            Manage your store and home delivery settings.
          </p>
        </div>
      </div>

      {/* =====================================================
          SETTINGS FORM
      ===================================================== */}

      <form
        className="settings-card"
        onSubmit={handleSave}
        noValidate
      >
        {/* ===================================================
            DELIVERY HEADER
        =================================================== */}

        <div className="settings-card-header">
          <div>
            <h2>Home Delivery</h2>

            <p>
              Control when delivery is available and how
              delivery charges are calculated.
            </p>
          </div>

          <label
            className="settings-switch"
            title={
              settings.enabled
                ? "Home delivery enabled"
                : "Home delivery disabled"
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
            SETTINGS
        =================================================== */}

        <div className="settings-grid">
          {/* MINIMUM ORDER */}

          <label className="setting-field">
            <span>Minimum order amount</span>

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

            <small>
              Customers must reach this amount to use
              home delivery.
            </small>
          </label>

          {/* CHARGE STEP */}

          <label className="setting-field">
            <span>Charge applies per amount</span>

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

            <small>
              Example: ₹500 means the charge is calculated
              for every ₹500 of order value.
            </small>
          </label>

          {/* DELIVERY CHARGE */}

          <label className="setting-field">
            <span>Delivery charge</span>

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

            <small>
              Delivery charge for each ₹
              {formatAmount(chargeStep)} of order value.
            </small>
          </label>
        </div>

        {/* ===================================================
            EXAMPLE
        =================================================== */}

        <div className="delivery-example">
          <strong>Example</strong>

          <div className="example-row">
            <span>
              ₹{formatAmount(example1)} order
            </span>

            <b>
              ₹{formatAmount(calculateDelivery(example1))}
              {" "}delivery
            </b>
          </div>

          <div className="example-row">
            <span>
              ₹{formatAmount(example2)} order
            </span>

            <b>
              ₹{formatAmount(calculateDelivery(example2))}
              {" "}delivery
            </b>
          </div>

          <div className="example-row">
            <span>
              ₹{formatAmount(example3)} order
            </span>

            <b>
              ₹{formatAmount(calculateDelivery(example3))}
              {" "}delivery
            </b>
          </div>
        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div
            className="settings-message"
            role="alert"
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
            }}
          >
            {error}
          </div>
        )}

        {/* ===================================================
            SUCCESS
        =================================================== */}

        {message && (
          <div
            className="settings-message"
            role="status"
          >
            {message}
          </div>
        )}

        {/* ===================================================
            ACTIONS
        =================================================== */}

        <div className="settings-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Delivery Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}