import express from "express";
import Customer from "../models/Customer.js";
import uploadLocal from "../middleware/uploadLocal.js";

const router = express.Router();

/* =========================
   ✅ UPLOAD CUSTOMER PROFILE PHOTO
   POST /api/customers/upload-photo/:id
========================= */
router.post(
  "/upload-photo/:id",
  uploadLocal.single("photo"),
  async (req, res) => {
    try {
      const customer = await Customer.findById(req.params.id);

      if (!customer) {
        return res
          .status(404)
          .json({ success: false, message: "Customer not found" });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No photo uploaded" });
      }

      // ✅ Save URL in DB
      customer.photo = `/uploads/customers/${req.file.filename}`;
      await customer.save();

      res.json({
        success: true,
        message: "Customer profile photo uploaded successfully",
        photo: customer.photo,
      });
    } catch (error) {
      console.error("Upload customer photo error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

/* =========================
   ✅ UPDATE CUSTOMER PROFILE
   PUT /api/customers/update/:id
========================= */
router.put("/update/:id", async (req, res) => {
  try {
    const { name, email } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (name !== undefined) customer.name = name;
    if (email !== undefined) customer.email = email;

    await customer.save();

    res.json({
      success: true,
      message: "Customer profile updated successfully",
      customer: {
        id: customer._id,
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        photo: customer.photo,
      },
    });
  } catch (error) {
    console.error("Update customer profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating customer profile",
    });
  }
});

export default router;

