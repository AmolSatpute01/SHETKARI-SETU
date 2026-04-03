import express from "express";
import Product from "../models/Product.js";
import uploadLocal from "../middleware/uploadLocal.js";

const router = express.Router();
router.get("/all", async (req, res) => {
  try {
    const products = await Product.find({
      available: true,
      quantity: { $gt: 0 }, // ✅ hide out of stock
    })
      .populate("farmerId", "name photo taluka district state")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching products",
    });
  }
});

/* =========================
   ADD PRODUCT
========================= */
router.post("/add", async (req, res) => {
  try {
    const { productName, category, price, quantity, unit, farmerId } = req.body;

    if (!productName || !category || !price || !quantity || !unit || !farmerId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const product = new Product({
      productName,
      category,
      price,
      quantity,
      unit,
      farmerId,
      images: [],
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* =========================
   UPLOAD IMAGE (MULTI)
   POST /api/products/upload/:id
========================= */
router.post("/upload/:id", uploadLocal.single("image"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image uploaded" });
    }

    const imgPath = `/uploads/products/${req.file.filename}`;
    product.images.push(imgPath);
    await product.save();

    res.json({
      success: true,
      message: "Image uploaded successfully",
      images: product.images,
      product,
    });
  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({
      success: false,
      message: "Image upload failed",
    });
  }
});

/* =========================
   DELETE SINGLE IMAGE
========================= */
router.delete("/delete-image/:id", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (!imageUrl) {
      return res
        .status(400)
        .json({ success: false, message: "Image URL required" });
    }

    product.images = product.images.filter((img) => img !== imageUrl);
    await product.save();

    res.json({
      success: true,
      message: "Image deleted successfully",
      images: product.images,
      product,
    });
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({ success: false, message: "Failed to delete image" });
  }
});

/* =========================
   GET PRODUCTS BY FARMER ID
========================= */
router.get("/:farmerId", async (req, res) => {
  try {
    const products = await Product.find({ farmerId: req.params.farmerId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* =========================
   DELETE PRODUCT
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* =========================
   UPDATE PRODUCT
========================= */
router.put("/:id", async (req, res) => {
  try {
    const { productName, category, price, quantity, unit } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { productName, category, price, quantity, unit },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* =========================
   TOGGLE AVAILABLE (OUT/IN STOCK BUTTON)
========================= */
router.put("/toggle/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    product.available = !product.available;
    await product.save();

    res.json({
      success: true,
      message: "Product status updated",
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;











