import Category from "../models/Category.js";
import Product from "../models/Product.js";

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function listCategories(req, res, next) {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === "true" ? {} : { active: true };
    const categories = await Category.find(filter).sort({ name: 1 });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name, active = true, department = null } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required." });
    }
    const category = await Category.create({
      name: name.trim(),
      slug: slugify(name),
      active,
      department: department || null,
    });
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const { name, active, department } = req.body;
    const update = {};
    if (name !== undefined) {
      update.name = name.trim();
      update.slug = slugify(name);
    }
    if (active !== undefined) update.active = active;
    if (department !== undefined) update.department = department || null;

    const category = await Category.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ message: "Category not found." });
    res.json({ category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(409).json({
        message: `Cannot delete: ${productCount} product(s) still reference this category. Reassign or disable them first.`,
      });
    }
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found." });
    res.json({ message: "Category deleted." });
  } catch (err) {
    next(err);
  }
}
