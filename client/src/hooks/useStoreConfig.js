import { useEffect, useState } from "react";
import api from "../services/api";

const FALLBACK = {
  storeName: "Daily Mart Super Market",
  storePhone: "+91 8668781633",
  storeAddress: "Behind Union Bank, Bank Colony, Basmat, Maharashtra",
  storeEmail: "suhaskarle1970@gmail.com",
  whatsappNumber: "+91 8668781633",

  departments: [],

  // ================================
  // DELIVERY SETTINGS
  // ================================
  delivery: {
    enabled: true,

    // Minimum subtotal required for home delivery
    minimumOrderAmount: 500,

    // Delivery charge calculation:
    // ₹20 for every ₹500 of order value
    chargePerAmount: 500,
    chargePerAmountValue: 20,
  },
};

export function useStoreConfig() {
  const [config, setConfig] = useState(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get("/config")
      .then(({ data }) => {
        if (cancelled) return;

        // IMPORTANT:
        // Keep fallback values but allow admin/API values to override them.
        setConfig({
          ...FALLBACK,
          ...data,

          storePhone: data.storePhone || FALLBACK.storePhone,
          storeAddress: data.storeAddress || FALLBACK.storeAddress,
          storeEmail: data.storeEmail || FALLBACK.storeEmail,
          whatsappNumber: data.whatsappNumber || FALLBACK.whatsappNumber,

          delivery: {
            ...FALLBACK.delivery,
            ...(data.delivery || {}),
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          setConfig(FALLBACK);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loaded };
}
