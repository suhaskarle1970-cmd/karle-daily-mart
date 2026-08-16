import { Router } from "express";
import { createOrder, listOrders } from "../controllers/orderController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/", createOrder);
router.get("/", requireAdmin, listOrders);

export default router;
