import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import api from "../../services/api";
import "./ChangePassword.css";

export default function ChangePassword() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setMessage("Please fill in all fields.");
      setStatus("error");
      return;
    }

    if (form.newPassword.length < 8) {
      setMessage("New password must be at least 8 characters.");
      setStatus("error");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMessage("New passwords do not match.");
      setStatus("error");
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setMessage("New password must be different from your current password.");
      setStatus("error");
      return;
    }

    try {
      setStatus("loading");

      await api.put("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setStatus("success");
      setMessage("Password changed successfully.");

      /*
       * Log the admin out after changing the password.
       * This ensures the old JWT session isn't left active.
       */
      setTimeout(() => {
        logout();
        navigate("/admin/login", {
          replace: true,
          state: {
            message: "Password changed successfully. Please log in again.",
          },
        });
      }, 1200);
    } catch (err) {
      setStatus("error");

      setMessage(
        err.response?.data?.message ||
          "Unable to change password. Please try again.",
      );
    }
  }

  return (
    <section className="change-password-page">
      <div className="change-password-card">
        <div className="change-password-header">
          <h1>Change Password</h1>
          <p>
            Update your admin account password. You will need to log in again
            after changing it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>

            <input
              id="currentPassword"
              name="currentPassword"
              type={showPasswords ? "text" : "password"}
              value={form.currentPassword}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Enter current password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>

            <input
              id="newPassword"
              name="newPassword"
              type={showPasswords ? "text" : "password"}
              value={form.newPassword}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="Enter new password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPasswords ? "text" : "password"}
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="Confirm new password"
            />
          </div>

          <label className="show-password">
            <input
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
            />
            Show passwords
          </label>

          {message && (
            <div
              className={`password-message ${
                status === "success" ? "success" : "error"
              }`}
              role="alert"
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary change-password-btn"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Changing Password..." : "Change Password"}
          </button>
        </form>
      </div>
    </section>
  );
}
