import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";

import api from "../services/api";

const AdminAuthContext = createContext(null);

const TOKEN_KEY = "kdm_admin_token";

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY),
  );
  const [loading, setLoading] = useState(true);

  // ============================================================
  // VERIFY EXISTING SESSION
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        if (!mounted) return;

        setToken(null);
        setAdmin(null);
        setLoading(false);

        return;
      }

      try {
        const { data } = await api.get("/auth/me");

        if (!mounted) return;

        setAdmin(data.admin);
        setToken(storedToken);
      } catch {
        localStorage.removeItem(TOKEN_KEY);

        if (!mounted) return;

        setToken(null);
        setAdmin(null);
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
      email: email.trim().toLowerCase(),
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

  // ============================================================
  // AUTH STATE
  // ============================================================

  const isAuthenticated = Boolean(admin && token);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const contextValue = useMemo(
    () => ({
      admin,
      token,
      loading,
      isAuthenticated,
      login,
      logout,
    }),
    [
      admin,
      token,
      loading,
      isAuthenticated,
      login,
      logout,
    ],
  );

  return (
    <AdminAuthContext.Provider value={contextValue}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);

  if (!ctx) {
    throw new Error(
      "useAdminAuth must be used within AdminAuthProvider",
    );
  }

  return ctx;
};
