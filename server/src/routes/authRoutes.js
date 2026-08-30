import { Router } from "express";
import { login, me, changePassword } from "../controllers/authController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.get("/me", requireAdmin, me);
router.put("/change-password", requireAdmin, changePassword);

export default router;
