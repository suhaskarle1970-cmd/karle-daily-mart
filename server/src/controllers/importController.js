import { parse } from "csv-parse/sync";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// CSV columns expected:
// name, barcode, price, category, description,
// variantUnit, variantAmount, variantPrice
//
// Example:
// Tata Salt,8901030,28,Grocery,Iodised salt 1kg,kg,1,28
//
// One bad row never aborts the whole import — it's collected and reported.

export async function importProducts(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "CSV file is required.",
      });
    }

    let rows;

    try {
      rows = parse(req.file.buffer.toString("utf-8"), {
        columns: (headers) => headers.map((h) => h.trim().toLowerCase()),
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseErr) {
      return res.status(400).json({
        message: `Could not parse CSV: ${parseErr.message}`,
      });
    }

    const categoryCache = new Map();

    const results = {
      total: rows.length,
      imported: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const row = rows[i];

      try {
        // -----------------------------------------
        // Basic product fields
        // -----------------------------------------

        const name = (row.name || "").trim();
        const priceRaw = (row.price || "").trim();
        const categoryName = (row.category || "").trim();
        const barcode = (row.barcode || "").trim();
        const description = (row.description || "").trim();

        // -----------------------------------------
        // Variant fields
        // CSV headers become lowercase automatically
        // -----------------------------------------

        const variantUnit = (row.variantunit || "").trim().toLowerCase();

        const variantAmountRaw = (row.variantamount || "").trim();

        const variantPriceRaw = (row.variantprice || "").trim();

        // -----------------------------------------
        // Basic validation
        // -----------------------------------------

        if (!name) {
          throw new Error("Missing product name");
        }

        if (!priceRaw || isNaN(Number(priceRaw))) {
          throw new Error("Missing or invalid price");
        }

        if (!categoryName) {
          throw new Error("Missing category");
        }

        const price = Number(priceRaw);

        if (price < 0) {
          throw new Error("Price cannot be negative");
        }

        // -----------------------------------------
        // Variant validation
        // -----------------------------------------

        let variants = [];

        const hasVariantData =
          variantUnit || variantAmountRaw || variantPriceRaw;

        if (hasVariantData) {
          if (!["g", "kg", "ml", "l", "pcs"].includes(variantUnit)) {
            throw new Error("Invalid variant unit. Use g, kg, ml, or pcs");
          }

          if (
            !variantAmountRaw ||
            isNaN(Number(variantAmountRaw)) ||
            Number(variantAmountRaw) <= 0
          ) {
            throw new Error("Invalid variant amount");
          }

          if (
            variantPriceRaw &&
            (isNaN(Number(variantPriceRaw)) || Number(variantPriceRaw) < 0)
          ) {
            throw new Error("Invalid variant price");
          }

          variants = [
            {
              unit: variantUnit,
              amount: Number(variantAmountRaw),
              price: variantPriceRaw ? Number(variantPriceRaw) : price,
            },
          ];
        }

        // -----------------------------------------
        // Find / create category
        // -----------------------------------------

        const categoryCacheKey = categoryName.toLowerCase();

        let categoryId = categoryCache.get(categoryCacheKey);

        if (!categoryId) {
          let category = await Category.findOne({
            name: new RegExp(`^${categoryName}$`, "i"),
          });

          if (!category) {
            category = await Category.create({
              name: categoryName,
              slug: slugify(categoryName),
            });
          }

          categoryId = category._id;

          categoryCache.set(categoryCacheKey, categoryId);
        }

        // -----------------------------------------
        // Check existing product by barcode
        // -----------------------------------------

        const existing = barcode ? await Product.findOne({ barcode }) : null;

        // -----------------------------------------
        // Update existing product
        // -----------------------------------------

        if (existing) {
          existing.name = name;
          existing.price = price;
          existing.category = categoryId;

          if (description) {
            existing.description = description;
          }

          existing.variants = variants;

          await existing.save();

          results.updated++;
        }

        // -----------------------------------------
        // Create new product
        // -----------------------------------------
        else {
          await Product.create({
            name,
            price,
            category: categoryId,
            barcode,
            description,
            variants,
          });

          results.imported++;
        }
      } catch (rowErr) {
        results.failed++;

        results.errors.push({
          row: rowNum,
          message: rowErr.message,
        });
      }
    }

    // -----------------------------------------
    // Final response
    // -----------------------------------------

    res.json(results);
  } catch (err) {
    next(err);
  }
}
