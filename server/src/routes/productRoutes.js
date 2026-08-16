import { Router } from "express";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { importProducts } from "../controllers/importController.js";
import { requireAdmin } from "../middleware/auth.js";
import { upload, csvUpload } from "../middleware/upload.js";

const router = Router();

router.get("/", listProducts);
router.post("/import", requireAdmin, csvUpload.single("file"), importProducts);
router.get("/:id", getProduct);
router.post("/", requireAdmin, upload.single("image"), createProduct);
router.put("/:id", requireAdmin, upload.single("image"), updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);

export default router;
