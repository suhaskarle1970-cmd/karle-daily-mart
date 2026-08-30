import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

import api from "../services/api";

const AdminAuthContext = createContext(null);

const TOKEN_KEY = "kdm_admin_token";

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);

  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const [loading, setLoading] = useState(true);

  // ============================================================
  // VERIFY EXISTING SESSION
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        if (mounted) {
          setToken(null);
          setAdmin(null);
          setLoading(false);
        }
        return;
      }

      try {
        const { data } = await api.get("/auth/me");

        if (mounted) {
          setAdmin(data.admin);
          setToken(storedToken);
        }
      } catch (error) {
        // Token is invalid / expired
        localStorage.removeItem(TOKEN_KEY);

        if (mounted) {
          setToken(null);
          setAdmin(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================
  // LOGIN
  // ============================================================

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    localStorage.setItem(TOKEN_KEY, data.token);

    setToken(data.token);
    setAdmin(data.admin);

    return data.admin;
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);

    setToken(null);
    setAdmin(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        loading,
        isAuthenticated: !!admin && !!token,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);

  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }

  return ctx;
}
