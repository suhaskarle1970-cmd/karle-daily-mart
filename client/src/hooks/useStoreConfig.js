import { useEffect, useState } from "react";
import api from "../services/api";

const FALLBACK = {
  storeName: "Karke Daily Mart",
  storePhone: "",
  storeAddress: "",
  storeEmail: "",
  whatsappNumber: "",
  departments: [],
};

export function useStoreConfig() {
  const [config, setConfig] = useState(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/config")
      .then(({ data }) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {
        // Keep fallback silently — this is non-critical config, not worth an error state.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loaded };
}
