import { Router } from "express";
import { DEPARTMENTS, DEPARTMENT_LABELS } from "../models/Category.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    storeName: process.env.STORE_NAME || "Karke Daily Mart",
    storePhone: process.env.STORE_PHONE || "",
    storeAddress: process.env.STORE_ADDRESS || "",
    storeEmail: process.env.STORE_EMAIL || "",
    whatsappNumber: process.env.WHATSAPP_NUMBER || "",
    departments: DEPARTMENTS.map((id) => ({ id, label: DEPARTMENT_LABELS[id] })),
  });
});

export default router;
