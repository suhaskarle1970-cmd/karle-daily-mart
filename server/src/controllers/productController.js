import Product from "../models/Product.js";
import { uploadImageBuffer, deleteImage } from "../config/cloudinary.js";

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 60;

// Public: paginated, searchable, filterable product list. Never loads the
// full catalogue — page size is capped regardless of what's requested.
export async function listProducts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(PAGE_SIZE_MAX, Math.max(1, parseInt(req.query.limit, 10) || PAGE_SIZE_DEFAULT));
    const { category, search, includeInactive } = req.query;

    const filter = includeInactive === "true" ? {} : { active: true };
    if (category) filter.category = category;
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort(search ? { score: { $meta: "textScore" } } : { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id).populate("category", "name slug");
    if (!product || (!product.active && !req.admin)) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

// variants arrives as a JSON string over multipart/form-data (e.g. from a
// FormData upload). Empty/absent input is valid — means "no variants".
function parseVariants(raw) {
  if (raw === undefined || raw === null || raw === "") return [];
  let parsed;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw Object.assign(new Error("Variants must be valid JSON."), { status: 400 });
  }
  if (!Array.isArray(parsed)) {
    throw Object.assign(new Error("Variants must be an array."), { status: 400 });
  }
  return parsed.map((v, i) => {
    const unit = String(v.unit || "").trim();
    const amount = Number(v.amount);
    const price = Number(v.price);
    if (!["g", "kg", "ml", "l", "pcs"].includes(unit)) {
      throw Object.assign(new Error(`Variant ${i + 1}: unit must be g, kg, ml, l, or pcs.`), { status: 400 });
    }
    if (!amount || amount <= 0) {
      throw Object.assign(new Error(`Variant ${i + 1}: amount must be a positive number.`), { status: 400 });
    }
    if (!price || price < 0) {
      throw Object.assign(new Error(`Variant ${i + 1}: price must be a valid number.`), { status: 400 });
    }
    return { unit, amount, price };
  });
}

export async function createProduct(req, res, next) {
  try {
    const { name, price, category, description, barcode, active } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ message: "Name, price, and category are required." });
    }

    const variants = parseVariants(req.body.variants);

    let imageUrl = "";
    let imagePublicId = "";
    if (req.file) {
      const uploaded = await uploadImageBuffer(req.file.buffer, { folder: "products" });
      imageUrl = uploaded.url;
      imagePublicId = uploaded.publicId;
    }

    const product = await Product.create({
      name,
      price,
      variants,
      category,
      description,
      barcode,
      active: active === undefined ? true : active === "true" || active === true,
      imageUrl,
      imagePublicId,
    });

    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    const { name, price, category, description, barcode, active } = req.body;
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (description !== undefined) product.description = description;
    if (barcode !== undefined) product.barcode = barcode;
    if (active !== undefined) product.active = active === "true" || active === true;
    if (req.body.variants !== undefined) product.variants = parseVariants(req.body.variants);

    if (req.file) {
      const oldPublicId = product.imagePublicId;
      const uploaded = await uploadImageBuffer(req.file.buffer, { folder: "products" });
      product.imageUrl = uploaded.url;
      product.imagePublicId = uploaded.publicId;
      if (oldPublicId) await deleteImage(oldPublicId);
    }

    await product.save();
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    if (product.imagePublicId) await deleteImage(product.imagePublicId);
    res.json({ message: "Product deleted." });
  } catch (err) {
    next(err);
  }
}
