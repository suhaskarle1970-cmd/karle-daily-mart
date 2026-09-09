import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

const SITE_URL = "https://www.dailymartsupermarket.in";

router.get("/sitemap.xml", async (req, res) => {
  try {
    const products = await Product.find({
      active: true,
    })
      .select("_id id updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    const urls = [
      {
        loc: `${SITE_URL}/`,
      },
      {
        loc: `${SITE_URL}/products`,
      },
      ...products.map((product) => ({
        loc: `${SITE_URL}/products/${product._id}`,
        lastmod: product.updatedAt,
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${urls
  .map(
    ({ loc, lastmod }) => `
  <url>
    <loc>${loc}</loc>
    ${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""}
  </url>`,
  )
  .join("")}
</urlset>`;

    res.type("application/xml").send(xml);
  } catch (error) {
    console.error("Failed to generate sitemap:", error);

    res
      .status(500)
      .type("application/xml")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
      );
  }
});

export default router;
