import Product from "../models/Product.js";
import Category from "../models/Category.js";

export async function getDashboardStats(req, res, next) {
  try {
    const [totalProducts, activeProducts, inactiveProducts, totalCategories, recentProducts] =
      await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ active: true }),
        Product.countDocuments({ active: false }),
        Category.countDocuments(),
        Product.find().sort({ createdAt: -1 }).limit(5).populate("category", "name"),
      ]);

    res.json({
      totalProducts,
      activeProducts,
      inactiveProducts,
      totalCategories,
      recentProducts,
    });
  } catch (err) {
    next(err);
  }
}
