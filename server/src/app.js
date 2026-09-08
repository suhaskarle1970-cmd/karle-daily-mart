import dns from "node:dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import sliderRoutes from "./routes/sliderRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import configRoutes from "./routes/configRoutes.js";

import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

/* ============================================================
   CORS
============================================================ */

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",

    credentials: true,
  }),
);

/* ============================================================
   BODY PARSER
============================================================ */

app.use(
  express.json({
    limit: "2mb",
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 20,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    message: "Too many login attempts. Please try again later.",
  },
});

/* ============================================================
   HEALTH CHECK
============================================================ */

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

/* ============================================================
   AUTH ROUTES
============================================================ */

app.use("/api/auth", authRoutes);

/* ============================================================
   CUSTOMER / PRODUCT ROUTES
============================================================ */

app.use("/api/categories", categoryRoutes);

app.use("/api/products", productRoutes);

app.use("/api/sliders", sliderRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/config", configRoutes);

/* ============================================================
   404
============================================================ */

app.use(notFound);

/* ============================================================
   GLOBAL ERROR HANDLER
============================================================ */

app.use(errorHandler);

export default app;
