import express from "express";
import Farmer from "../models/Farmer.js";
import uploadLocal from "../middleware/uploadLocal.js";

const router = express.Router();

/* =========================
   UPLOAD PROFILE PHOTO
   POST /api/farmers/upload-photo/:id
========================= */
router.post(
  "/upload-photo/:id",
  uploadLocal.single("photo"),
  async (req, res) => {
    try {
      const farmer = await Farmer.findById(req.params.id);

      if (!farmer) {
        return res
          .status(404)
          .json({ success: false, message: "Farmer not found" });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No photo uploaded" });
      }

      // ✅ Save URL in DB
      farmer.photo = `/uploads/farmers/${req.file.filename}`;
      await farmer.save();

      res.json({
        success: true,
        message: "Profile photo uploaded successfully",
        photo: farmer.photo,
      });
    } catch (error) {
      console.error("Upload farmer photo error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

/* =========================
   UPDATE FARMER PROFILE
   PUT /api/farmers/update/:id
========================= */
router.put("/update/:id", async (req, res) => {
  try {
    const { name, taluka, district, state, email } = req.body;

    const farmer = await Farmer.findById(req.params.id);

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found",
      });
    }

    // ✅ update only provided fields
    if (name !== undefined) farmer.name = name;
    if (email !== undefined) farmer.email = email;
    if (taluka !== undefined) farmer.taluka = taluka;
    if (district !== undefined) farmer.district = district;
    if (state !== undefined) farmer.state = state;

    await farmer.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      farmer: {
        id: farmer._id,
        name: farmer.name,
        mobile: farmer.mobile,
        email: farmer.email,
        taluka: farmer.taluka,
        district: farmer.district,
        state: farmer.state,
        photo: farmer.photo,
      },
    });
  } catch (error) {
    console.error("Update farmer profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
});

// ================= PAYMENT SAVE =================
router.put("/payment/:id", async (req, res) => {
  try {
    const farmerId = req.params.id;

    if (!farmerId) {
      return res.status(400).json({
        success: false,
        message: "Farmer ID missing",
      });
    }

    const farmer = await Farmer.findById(farmerId);

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found",
      });
    }

    farmer.payment = req.body;

    await farmer.save();

    res.json({
      success: true,
      payment: farmer.payment,
    });
  } catch (error) {
    console.error("Payment save error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ================= PAYMENT GET =================
router.get("/payment/:id", async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id);

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found",
      });
    }

    res.json({
      success: true,
      payment: farmer.payment || null,
    });
  } catch (error) {
    console.error("Fetch payment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;


