import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import customerRoutes from "./routes/customer.js";
import productRoutes from "./routes/product.js";
import authRoutes from "./routes/auth.js";
import orderRoutes from "./routes/order.js";
import farmerRoutes from "./routes/farmer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Force load env from server/.env
dotenv.config({ path: path.resolve(__dirname, ".env"), override: true });

// ✅ CHECK ENV LOADED OR NOT
console.log("✅ ENV FILE LOADED FROM:", path.resolve(__dirname, ".env"));
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Loaded" : "❌ Missing");

const app = express();

/* Middleware */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/customers", customerRoutes);

/* ✅ Static uploads */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* Routes */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/farmers", farmerRoutes);

/* Test */
app.get("/", (req, res) => {
  res.send("Shetkari Setu Backend Running 🚜");
});

/* ✅ DB + Server */
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));




