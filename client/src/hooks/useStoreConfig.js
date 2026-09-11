import { useEffect, useState } from "react";
import api from "../services/api";

const FALLBACK = {
  storeName: "Daily Mart Super Market",
  storePhone: "+91 8668781633",
  storeAddress: "Khajipura, Basmat, Maharashtra 431512 Maharashtra, India",
  storeEmail: "suhaskarle1970@gmail.com",
  whatsappNumber: "+91 8668781633",

  departments: [
    {
      id: "grocery-kitchen",
      label: "Grocery & Kitchen",
    },
    {
      id: "snacks-drinks",
      label: "Snacks & Drinks",
    },
    {
      id: "beauty-personal-care",
      label: "Beauty & Personal Care",
    },
    {
      id: "household-essentials",
      label: "Household Essentials",
    },
    {
      id: "stationery",
      label: "Stationery",
    },
  ],

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
