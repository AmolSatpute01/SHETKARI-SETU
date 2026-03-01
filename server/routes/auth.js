import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import Farmer from "../models/Farmer.js";
import Customer from "../models/Customer.js";

const router = express.Router();

/* =========================
   ✅ OTP STORE (IN MEMORY)
========================= */
const otpStore = {};

/* =========================
   ✅ SAFE TRANSPORTER CREATION
========================= */
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("❌ EMAIL_USER or EMAIL_PASS missing in ENV");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/* =========================
   ✅ SEND OTP MAIL (Safe)
========================= */
const sendOtpEmail = async (toEmail, otp) => {
  try {
    if (!toEmail) return false;

    const transporter = createTransporter();
    if (!transporter) return false;

    await transporter.verify();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: "Shetkari Setu OTP Verification",
      html: `
        <div style="font-family:Arial;padding:12px">
          <h2 style="color:#2e7d32;margin:0">Shetkari Setu OTP</h2>
          <p style="margin:8px 0;font-size:15px">
            Your OTP is:
            <b style="font-size:18px;color:#111">${otp}</b>
          </p>
          <p style="color:#666;font-size:13px">
            OTP is valid for 5 minutes.
          </p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("❌ OTP email send error:", error.message);
    return false;
  }
};

/* =========================
   ✅ Helper: Get Model by Role
========================= */
const getModelByRole = (role) => {
  return role === "customer" ? Customer : Farmer;
};

/* =========================
   ✅ 1) SEND OTP FOR REGISTER
========================= */
router.post("/send-otp-register", async (req, res) => {
  try {
    const { name, mobile, email, password, role } = req.body;

    const finalRole = role === "customer" ? "customer" : "farmer";
    const Model = getModelByRole(finalRole);

    if (!name || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, Mobile and Password required",
      });
    }

    const existingUser = await Model.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          finalRole === "customer"
            ? "Customer already registered with this mobile number"
            : "Farmer already registered with this mobile number",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required for OTP verification.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    const storeKey = `${finalRole}:${mobile}`;

    otpStore[storeKey] = {
      otp,
      expiresAt,
      data: { name, mobile, email, password, role: finalRole },
    };

    const sent = await sendOtpEmail(email, otp);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: "OTP could not be sent right now. Please try again later.",
      });
    }

    res.json({
      success: true,
      message: "OTP sent to email successfully ✅",
    });
  } catch (error) {
    console.error("Send register OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while sending OTP",
    });
  }
});

/* =========================
   ✅ 2) VERIFY OTP + REGISTER
========================= */
router.post("/verify-otp-register", async (req, res) => {
  try {
    const { mobile, otp, role } = req.body;

    const finalRole = role === "customer" ? "customer" : "farmer";
    const Model = getModelByRole(finalRole);

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile and OTP required",
      });
    }

    const storeKey = `${finalRole}:${mobile}`;
    const record = otpStore[storeKey];

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please resend OTP.",
      });
    }

    if (Date.now() > record.expiresAt) {
      delete otpStore[storeKey];
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please resend OTP.",
      });
    }

    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP ❌",
      });
    }

    const { name, email, password } = record.data;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new Model({
      name,
      mobile,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    delete otpStore[storeKey];

    res.status(201).json({
      success: true,
      message:
        finalRole === "customer"
          ? "Customer registered successfully ✅"
          : "Farmer registered successfully ✅",
    });
  } catch (error) {
    console.error("Verify register OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while registering user",
    });
  }
});

/* =========================
   ✅ 3) LOGIN API (FARMER + CUSTOMER)
========================= */
router.post("/login", async (req, res) => {
  try {
    const { loginId, password, role } = req.body;

    const finalRole = role === "customer" ? "customer" : "farmer";
    const Model = getModelByRole(finalRole);

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: "Login ID and password required",
      });
    }

    const user = await Model.findOne({
      $or: [{ mobile: loginId }, { email: loginId }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          finalRole === "customer" ? "Customer not found" : "Farmer not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: finalRole },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ CUSTOMER LOGIN RESPONSE (UPDATED: send photo also)
    if (finalRole === "customer") {
      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        role: "customer",
        user: {
          id: user._id,
          name: user.name,
          mobile: user.mobile,
          email: user.email || "",
          photo: user.photo || "", // ✅ IMPORTANT
        },
      });
    }

    // ✅ FARMER LOGIN RESPONSE
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      role: "farmer",
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email || "",
        taluka: user.taluka || "",
        district: user.district || "",
        state: user.state || "",
        photo: user.photo || "",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* =========================
   ✅ 4) SEND OTP FOR FORGOT PASSWORD
========================= */
router.post("/send-otp-forgot", async (req, res) => {
  try {
    const { loginId, role } = req.body;

    const finalRole = role === "customer" ? "customer" : "farmer";
    const Model = getModelByRole(finalRole);

    if (!loginId) {
      return res.status(400).json({
        success: false,
        message: "Mobile or Email required",
      });
    }

    const user = await Model.findOne({
      $or: [{ mobile: loginId }, { email: loginId }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          finalRole === "customer" ? "Customer not found" : "Farmer not found",
      });
    }

    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: "Email not found in your account.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore[user._id] = {
      otp,
      expiresAt,
      data: { userId: user._id, role: finalRole },
    };

    const sent = await sendOtpEmail(user.email, otp);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: "OTP could not be sent right now. Please try again later.",
      });
    }

    res.json({
      success: true,
      message: "OTP sent to your registered email ✅",
      userKey: user._id,
    });
  } catch (error) {
    console.error("Forgot OTP send error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while sending OTP",
    });
  }
});

/* =========================
   ✅ 5) VERIFY OTP + RESET PASSWORD
========================= */
router.post("/reset-password", async (req, res) => {
  try {
    const { userKey, otp, newPassword } = req.body;

    if (!userKey || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "userKey, OTP and new password required",
      });
    }

    const record = otpStore[userKey];

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please resend OTP.",
      });
    }

    if (Date.now() > record.expiresAt) {
      delete otpStore[userKey];
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please resend OTP.",
      });
    }

    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP ❌",
      });
    }

    const { userId, role } = record.data;
    const Model = getModelByRole(role);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await Model.findByIdAndUpdate(userId, { password: hashedPassword });

    delete otpStore[userKey];

    res.json({
      success: true,
      message: "Password reset successful ✅",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resetting password",
    });
  }
});

export default router;









