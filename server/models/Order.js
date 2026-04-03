import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },

items: [
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
],

    totalPrice: {
      type: Number,
      required: true,
    },

    customerName: {
      type: String,
      default: "Customer",
    },

    // ✅ NEW (so we can fetch orders of customer properly)
    customerMobile: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "Not provided",
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "delivered", "rejected", "cancelled"],
      default: "pending",
    },

    // ✅ NEW: Expected delivery date (auto +2/+3 days)
    expectedDelivery: {
      type: Date,
      default: null,
    },

    // ✅ NEW: Invoice number
    invoiceId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;


