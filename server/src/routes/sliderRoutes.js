import { Router } from "express";
import {
  listSliders,
  createSlider,
  updateSlider,
  deleteSlider,
} from "../controllers/sliderController.js";
import { requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", listSliders);
router.post("/", requireAdmin, upload.single("image"), createSlider);
router.put("/:id", requireAdmin, upload.single("image"), updateSlider);
router.delete("/:id", requireAdmin, deleteSlider);

export default router;
