import dns from "node:dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

import "dotenv/config";
import mongoose from "mongoose";
import Admin from "../models/Admin.js";

// Development convenience only. Reads credentials from env — never hardcode
// a password here. Run with: npm run seed:admin
async function run() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your .env before seeding.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("SEED_ADMIN_PASSWORD should be at least 8 characters.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`Admin ${email} already exists. Nothing to do.`);
    process.exit(0);
  }

  const passwordHash = await Admin.hashPassword(password);
  await Admin.create({ email: email.toLowerCase(), passwordHash, name: "Admin" });

  console.log(`Admin account created for ${email}. Change this password after first login if it was shared insecurely.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
