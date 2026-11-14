import Product from "../models/Product.js";
import { uploadImageBuffer, deleteImage } from "../config/cloudinary.js";
import Category from "../models/Category.js";

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

/* =========================================================
   SEARCH HELPERS
========================================================= */

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFlexibleWordRegex(word) {
  let cleaned = word.trim().replace(/['’.\-]/g, "");

  // Normalize common English plurals ("washes" -> "wash", "soaps" -> "soap", "berries" -> "berri")
  if (cleaned.length > 4 && /ies$/i.test(cleaned)) {
    cleaned = cleaned.slice(0, -3);
  } else if (cleaned.length > 4 && /(sh|ch|x|z|ss)es$/i.test(cleaned)) {
    cleaned = cleaned.slice(0, -2);
  } else if (
    cleaned.length > 3 &&
    !/ss$/i.test(cleaned) &&
    /s$/i.test(cleaned)
  ) {
    cleaned = cleaned.slice(0, -1);
  }

  if (!cleaned) {
    return new RegExp(escapeRegex(word.trim()), "i");
  }

  // Allow optional spaces, hyphens, or apostrophes between letters
  // so "facewash" matches "Face Wash" and "ponds" matches "Pond's"
  const pattern = cleaned
    .split("")
    .map((ch) => escapeRegex(ch))
    .join("[\\s\\-'’.]*");

  return new RegExp(pattern, "i");
}

const DEPARTMENTS = [
  "grocery-kitchen",
  "snacks-drinks",
  "beauty-personal-care",
  "household-essentials",
  "stationery",
];

const ALLOWED_UNITS = ["g", "kg", "ml", "l", "pcs", ""];

/* =========================================================
   HELPERS
========================================================= */

function parseNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function parseVariants(raw) {
  if (raw === undefined || raw === null || raw === "") {
    return [];
  }

  let parsed;

  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw Object.assign(new Error("Variants must be valid JSON."), {
      status: 400,
    });
  }

  if (!Array.isArray(parsed)) {
    throw Object.assign(new Error("Variants must be an array."), {
      status: 400,
    });
  }

  return parsed.map((v, i) => {
    const hasAmount =
      v.amount !== undefined &&
      v.amount !== null &&
      String(v.amount).trim() !== "";

    const amount = hasAmount ? Number(v.amount) : null;
    const unit = hasAmount
      ? String(v.unit || "")
          .trim()
          .toLowerCase()
      : "";
    const price = Number(v.price);

    const mrp =
      v.mrp === undefined || v.mrp === null || v.mrp === ""
        ? null
        : Number(v.mrp);

    /* AMOUNT & UNIT (Only required when an amount is entered) */
    if (hasAmount) {
      if (!Number.isFinite(amount) || amount <= 0) {
        throw Object.assign(
          new Error(`Variant ${i + 1}: amount must be a positive number.`),
          { status: 400 },
        );
      }

      if (!ALLOWED_UNITS.includes(unit)) {
        throw Object.assign(
          new Error(`Variant ${i + 1}: unit must be g, kg, ml, l, or pcs.`),
          { status: 400 },
        );
      }
    }

    /* SELLING PRICE */
    if (
      v.price === undefined ||
      v.price === null ||
      v.price === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      throw Object.assign(
        new Error(`Variant ${i + 1}: price must be a valid number.`),
        { status: 400 },
      );
    }

    /* MRP */
    if (mrp !== null && (!Number.isFinite(mrp) || mrp < 0)) {
      throw Object.assign(
        new Error(`Variant ${i + 1}: MRP must be a valid number.`),
        { status: 400 },
      );
    }

    /* MRP CANNOT BE LOWER THAN SELLING PRICE */
    if (mrp !== null && mrp < price) {
      throw Object.assign(
        new Error(`Variant ${i + 1}: MRP cannot be lower than selling price.`),
        { status: 400 },
      );
    }

    return {
      unit,
      amount,
      price,
      mrp,
    };
  });
}

function parseProductTypes(raw) {
  if (raw === undefined || raw === null || raw === "") {
    return [];
  }

  let parsed;

  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw Object.assign(new Error("Product types must be valid JSON."), {
      status: 400,
    });
  }

  if (!Array.isArray(parsed)) {
    throw Object.assign(new Error("Product types must be an array."), {
      status: 400,
    });
  }

  return parsed.map((type, typeIndex) => {
    const name = String(type.name || "").trim();

    if (!name) {
      throw Object.assign(
        new Error(`Product type ${typeIndex + 1}: name is required.`),
        { status: 400 },
      );
    }

    if (!Array.isArray(type.sizes) || type.sizes.length === 0) {
      throw Object.assign(
        new Error(
          `Product type ${typeIndex + 1}: at least one price option is required.`,
        ),
        { status: 400 },
      );
    }

    const sizes = type.sizes.map((size, sizeIndex) => {
      const hasAmount =
        size.amount !== undefined &&
        size.amount !== null &&
        String(size.amount).trim() !== "";

      const amount = hasAmount ? Number(size.amount) : null;
      const unit = hasAmount
        ? String(size.unit || "")
            .trim()
            .toLowerCase()
        : "";
      const price = Number(size.price);

      const mrp =
        size.mrp === undefined || size.mrp === null || size.mrp === ""
          ? null
          : Number(size.mrp);

      // AMOUNT & UNIT (Optional — only validate if amount is entered)
      if (hasAmount) {
        if (!Number.isFinite(amount) || amount <= 0) {
          throw Object.assign(
            new Error(
              `${name} - Option ${sizeIndex + 1}: amount must be positive.`,
            ),
            { status: 400 },
          );
        }

        if (!ALLOWED_UNITS.includes(unit)) {
          throw Object.assign(
            new Error(`${name} - Option ${sizeIndex + 1}: invalid unit.`),
            { status: 400 },
          );
        }
      }

      // PRICE
      if (
        size.price === undefined ||
        size.price === null ||
        size.price === "" ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        throw Object.assign(
          new Error(`${name} - Option ${sizeIndex + 1}: price must be valid.`),
          { status: 400 },
        );
      }

      // MRP
      if (mrp !== null && (!Number.isFinite(mrp) || mrp < 0)) {
        throw Object.assign(
          new Error(`${name} - Option ${sizeIndex + 1}: MRP must be valid.`),
          { status: 400 },
        );
      }

      // MRP cannot be lower than selling price
      if (mrp !== null && mrp < price) {
        throw Object.assign(
          new Error(
            `${name} - Option ${sizeIndex + 1}: MRP cannot be lower than selling price.`,
          ),
          { status: 400 },
        );
      }

      return {
        unit,
        amount,
        price,
        mrp,
      };
    });

    return {
      name,
      sizes,
    };
  });
}

/* ========================================================= 
   LIST PRODUCTS 
========================================================= */

export async function listProducts(req, res, next) {
  try {
    const rawSearch = req.query.search ? String(req.query.search).trim() : "";
    const isSearching = Boolean(rawSearch);

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      PAGE_SIZE_MAX,
      Math.max(
        1,
        parseInt(req.query.limit, 10) || (isSearching ? 60 : PAGE_SIZE_DEFAULT),
      ),
    );

    const { category, includeInactive } = req.query;
    const filter = includeInactive === "true" ? {} : { active: true };

    if (category) {
      filter.category = category;
    }

    if (isSearching) {
      const words = rawSearch.split(/\s+/).filter(Boolean);

      // Also build a combined regex across all words so "face wash" matches "Facewash"
      const combinedRx = buildFlexibleWordRegex(words.join(""));
      const combinedCategoryIds = await Category.find({
        $or: [
          { name: combinedRx },
          { slug: combinedRx },
          { department: combinedRx },
        ],
      }).distinct("_id");

      const perWordConditions = await Promise.all(
        words.map(async (word) => {
          const rx = buildFlexibleWordRegex(word);

          // Match categories whose name/slug/department matches this word (e.g. "Face Wash")
          const matchingCategoryIds = await Category.find({
            $or: [{ name: rx }, { slug: rx }, { department: rx }],
          }).distinct("_id");

          const orRules = [
            { name: rx },
            { description: rx },
            { barcode: rx },
            { "types.name": rx },
          ];

          if (matchingCategoryIds.length > 0) {
            orRules.push({ category: { $in: matchingCategoryIds } });
          }

          return { $or: orRules };
        }),
      );

      const combinedOrRules = [
        { name: combinedRx },
        { description: combinedRx },
        { barcode: combinedRx },
        { "types.name": combinedRx },
      ];

      if (combinedCategoryIds.length > 0) {
        combinedOrRules.push({ category: { $in: combinedCategoryIds } });
      }

      // Match either every word (across product + category + types) OR the combined compound word
      filter.$or = [{ $and: perWordConditions }, ...combinedOrRules];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug department")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
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

/* =========================================================
   GET SINGLE PRODUCT
========================================================= */

export async function getProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name slug department",
    );

    if (!product || (!product.active && !req.admin)) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.json({ product });
  } catch (err) {
    next(err);
  }
}

/* =========================================================
   CREATE PRODUCT
========================================================= */

export async function createProduct(req, res, next) {
  try {
    const {
      name,
      price,
      mrp,
      category,
      description,
      barcode,
      active,
      featured,
      pricingType,
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        message: "Name and category are required.",
      });
    }

    const finalPricingType =
      pricingType === "type-based" ? "type-based" : "standard";

    const productTypes = parseProductTypes(req.body.types);
    const variants = parseVariants(req.body.variants);

    let parsedPrice = null;

    if (finalPricingType === "standard") {
      if ((price === undefined || price === "") && variants.length === 0) {
        return res.status(400).json({
          message: "Price is required for standard products.",
        });
      }

      if (price !== undefined && price !== "") {
        parsedPrice = parseNumber(price);

        if (parsedPrice === null || parsedPrice < 0) {
          return res.status(400).json({
            message: "Price must be a valid number.",
          });
        }
      } else if (variants.length > 0) {
        parsedPrice = variants[0].price;
      }
    }

    let parsedMrp = null;

    if (mrp !== undefined && mrp !== null && mrp !== "") {
      parsedMrp = parseNumber(mrp);

      if (parsedMrp === null || parsedMrp < 0) {
        return res.status(400).json({
          message: "MRP must be a valid number.",
        });
      }

      if (
        finalPricingType === "standard" &&
        parsedPrice !== null &&
        parsedMrp < parsedPrice
      ) {
        return res.status(400).json({
          message: "MRP cannot be lower than selling price.",
        });
      }
    }

    if (finalPricingType === "type-based") {
      if (!Array.isArray(productTypes) || productTypes.length === 0) {
        return res.status(400).json({
          message: "At least one product type is required.",
        });
      }

      for (const type of productTypes) {
        if (!type.name) {
          return res.status(400).json({
            message: "Every product type must have a name.",
          });
        }

        if (!Array.isArray(type.sizes) || type.sizes.length === 0) {
          return res.status(400).json({
            message: `At least one price option is required for ${type.name}.`,
          });
        }
      }
    }

    let imageUrl = "";
    let imagePublicId = "";

    if (req.file) {
      const uploaded = await uploadImageBuffer(req.file.buffer, {
        folder: "products",
      });

      imageUrl = uploaded.url;
      imagePublicId = uploaded.publicId;
    }

    const product = await Product.create({
      name: name.trim(),
      price: parsedPrice ?? 0,
      mrp: finalPricingType === "standard" ? parsedMrp : null,
      variants: finalPricingType === "standard" ? variants : [],
      pricingType: finalPricingType,
      types: finalPricingType === "type-based" ? productTypes : [],
      category,
      description: description || "",
      barcode: barcode || "",
      active:
        active === undefined ? true : active === "true" || active === true,
      imageUrl,
      featured: featured === "true" || featured === true,
      imagePublicId,
    });

    return res.status(201).json({
      product,
    });
  } catch (err) {
    next(err);
  }
}

/* =========================================================
   UPDATE PRODUCT
========================================================= */

export async function updateProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    const {
      name,
      price,
      mrp,
      category,
      description,
      barcode,
      active,
      featured,
      pricingType,
    } = req.body;

    const nextPricingType =
      pricingType !== undefined
        ? pricingType === "type-based"
          ? "type-based"
          : "standard"
        : product.pricingType;

    if (name !== undefined) {
      product.name = name.trim();
    }

    let newPrice = Number(product.price);

    if (price !== undefined && price !== "") {
      const parsedPrice = parseNumber(price);

      if (parsedPrice === null || parsedPrice < 0) {
        return res.status(400).json({
          message: "Price must be a valid number.",
        });
      }

      newPrice = parsedPrice;
      product.price = parsedPrice;
    } else if (nextPricingType === "type-based") {
      newPrice = 0;
      product.price = 0;
    }

    let newMrp = product.mrp;

    if (mrp !== undefined) {
      newMrp = mrp === null || mrp === "" ? null : parseNumber(mrp);

      if (mrp !== null && mrp !== "" && newMrp === null) {
        return res.status(400).json({
          message: "MRP must be a valid number.",
        });
      }

      if (
        nextPricingType === "standard" &&
        newMrp !== null &&
        newMrp < newPrice
      ) {
        return res.status(400).json({
          message: "MRP cannot be lower than selling price.",
        });
      }

      product.mrp = nextPricingType === "standard" ? newMrp : null;
    } else if (nextPricingType === "standard") {
      if (newMrp !== null && newMrp !== undefined && newMrp < newPrice) {
        return res.status(400).json({
          message:
            "Selling price cannot be higher than the current MRP. Update the MRP first.",
        });
      }
    }

    if (category !== undefined) {
      product.category = category;
    }

    if (description !== undefined) {
      product.description = description;
    }

    if (barcode !== undefined) {
      product.barcode = barcode;
    }

    if (active !== undefined) {
      product.active = active === "true" || active === true;
    }

    if (featured !== undefined) {
      product.featured = featured === "true" || featured === true;
    }

    if (req.body.variants !== undefined) {
      product.variants = parseVariants(req.body.variants);
    }

    if (req.body.types !== undefined) {
      product.types = parseProductTypes(req.body.types);
    }

    if (pricingType !== undefined) {
      product.pricingType = nextPricingType;
    }

    if (req.file) {
      const oldPublicId = product.imagePublicId;

      const uploaded = await uploadImageBuffer(req.file.buffer, {
        folder: "products",
      });

      product.imageUrl = uploaded.url;
      product.imagePublicId = uploaded.publicId;

      if (oldPublicId) {
        await deleteImage(oldPublicId);
      }
    }

    await product.save();

    res.json({
      product,
    });
  } catch (err) {
    next(err);
  }
}

/* =========================================================
   DELETE PRODUCT
========================================================= */

export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    if (product.imagePublicId) {
      await deleteImage(product.imagePublicId);
    }

    res.json({
      message: "Product deleted.",
    });
  } catch (err) {
    next(err);
  }
}

/* =========================================================
   HOMEPAGE PRODUCTS
========================================================= */

export async function getHomepageProducts(req, res, next) {
  try {
    const result = await Product.aggregate([
      {
        $match: {
          active: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      {
        $unwind: "$categoryData",
      },
      {
        $match: {
          "categoryData.active": true,
          "categoryData.department": {
            $in: DEPARTMENTS,
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $facet: {
          featured: [
            { $match: { featured: true } },
            {
              $limit: 6,
            },
          ],
          departments: [
            {
              $group: {
                _id: "$categoryData.department",
                products: {
                  $push: {
                    _id: "$_id",
                    name: "$name",
                    barcode: "$barcode",
                    price: "$price",
                    mrp: "$mrp",
                    variants: "$variants",
                    pricingType: "$pricingType",
                    types: "$types",
                    description: "$description",
                    imageUrl: "$imageUrl",
                    imagePublicId: "$imagePublicId",
                    active: "$active",
                    createdAt: "$createdAt",
                    category: {
                      _id: "$categoryData._id",
                      name: "$categoryData.name",
                      slug: "$categoryData.slug",
                      department: "$categoryData.department",
                    },
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                products: {
                  $slice: ["$products", 6],
                },
              },
            },
          ],
        },
      },
    ]);

    const aggregationResult = result[0] || {};
    const featured = aggregationResult.featured || [];
    const departmentProducts = {};

    for (const department of DEPARTMENTS) {
      departmentProducts[department] = [];
    }

    for (const department of aggregationResult.departments || []) {
      departmentProducts[department._id] = department.products || [];
    }

    res.json({
      featured,
      departments: departmentProducts,
    });
  } catch (err) {
    next(err);
  }
}
