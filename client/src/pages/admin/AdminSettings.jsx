import { useEffect, useState } from "react";
import api from "../../services/api.js";
import "./AdminSettings.css";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    enabled: true,
    minimumOrderAmount: 500,
    chargePerAmount: 500,
    chargePerAmountValue: 20,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get("/config")
      .then(({ data }) => {
        if (data.delivery) {
          setSettings({
            enabled: data.delivery.enabled ?? true,
            minimumOrderAmount: data.delivery.minimumOrderAmount ?? 500,
            chargePerAmount: data.delivery.chargePerAmount ?? 500,
            chargePerAmountValue: data.delivery.chargePerAmountValue ?? 20,
          });
        }
      })
      .catch(() => {
        setMessage("Failed to load delivery settings.");
      });
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : Number(value),
    }));
  }

  async function handleSave(e) {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      await api.put("/config", {
        delivery: settings,
      });

      setMessage("Delivery settings saved successfully.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to save delivery settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-settings-page">
      <div className="admin-settings-header">
        <div>
          <h1>Store Settings</h1>
          <p>Manage your store and home delivery settings.</p>
        </div>
      </div>

      <form className="settings-card" onSubmit={handleSave}>
        <div className="settings-card-header">
          <div>
            <h2>Home Delivery</h2>
            <p>
              Control when delivery is available and how delivery charges are
              calculated.
            </p>
          </div>

          <label className="settings-switch">
            <input
              type="checkbox"
              name="enabled"
              checked={settings.enabled}
              onChange={handleChange}
            />
            <span />
          </label>
        </div>

        <div className="settings-divider" />

        <div className="settings-grid">
          <label className="setting-field">
            <span>Minimum order amount</span>

            <div className="input-with-symbol">
              <span>₹</span>
              <input
                type="number"
                name="minimumOrderAmount"
                min="0"
                value={settings.minimumOrderAmount}
                onChange={handleChange}
              />
            </div>

            <small>
              Customers must reach this amount to use home delivery.
            </small>
          </label>

          <label className="setting-field">
            <span>Charge applies per amount</span>

            <div className="input-with-symbol">
              <span>₹</span>
              <input
                type="number"
                name="chargePerAmount"
                min="1"
                value={settings.chargePerAmount}
                onChange={handleChange}
              />
            </div>

            <small>
              Example: ₹500 means the charge is calculated for every ₹500.
            </small>
          </label>

          <label className="setting-field">
            <span>Delivery charge</span>

            <div className="input-with-symbol">
              <span>₹</span>
              <input
                type="number"
                name="chargePerAmountValue"
                min="0"
                value={settings.chargePerAmountValue}
                onChange={handleChange}
              />
            </div>

            <small>
              Delivery charge for each ₹{settings.chargePerAmount || 500} of
              order value.
            </small>
          </label>
        </div>

        <div className="delivery-example">
          <strong>Example</strong>

          <div className="example-row">
            <span>₹500 order</span>
            <b>₹{settings.chargePerAmountValue || 0} delivery</b>
          </div>

          <div className="example-row">
            <span>₹1,000 order</span>
            <b>₹{(settings.chargePerAmountValue || 0) * 2} delivery</b>
          </div>

          <div className="example-row">
            <span>₹1,500 order</span>
            <b>₹{(settings.chargePerAmountValue || 0) * 3} delivery</b>
          </div>
        </div>

        {message && <div className="settings-message">{message}</div>}

        <div className="settings-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Delivery Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
