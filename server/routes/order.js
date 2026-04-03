import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

const router = express.Router();

/* ✅ helper: expected delivery +2/+3 days */
const getExpectedDeliveryDate = () => {
  const days = Math.random() < 0.5 ? 2 : 3;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

/* ✅ helper: invoice id */
const generateInvoiceId = () => {
  return "INV-" + Date.now().toString().slice(-8);
};

/* =========================
   ✅ PLACE ORDER (CUSTOMER)
   POST /api/orders/place
========================= */
router.post("/place", async (req, res) => {
  try {
    const { items, customerName, customerMobile, address } = req.body;
    console.log("🔥 ORDER BODY:", req.body);

if (!items || items.length === 0) {
  return res.status(400).json({
    success: false,
    message: "No items provided",
  });
}

let totalPrice = 0;
let orderItems = [];
let farmerId = null;

for (let item of items) {
  console.log("👉 ITEM:", item);

  const id = item.productId || item._id;

  if (!id) {
    console.log("❌ Missing ID:", item);
    continue;
  }

  const product = await Product.findById(id);

  if (!product || product.available === false) continue;

  const qty = Number(item.quantity || item.qty);

  if (!qty || isNaN(qty)) {
  console.log("❌ Invalid quantity:", item);
  continue;
}

  if (qty > product.quantity) {
    return res.status(400).json({
      success: false,
      message: `Only ${product.quantity} ${product.unit} available`,
    });
  }

  totalPrice += product.price * qty;

  orderItems.push({
    productId: product._id,
    productName: product.productName,
    quantity: qty,
    unit: product.unit,
    price: product.price,
  });

  if (!farmerId) farmerId = product.farmerId;

  product.quantity -= qty;
  if (product.quantity <= 0) product.available = false;

  await product.save();
}

if (orderItems.length === 0) {
  return res.status(400).json({
    success: false,
    message: "No valid products in cart",
  });
}

console.log("✅ FINAL ORDER ITEMS:", orderItems);
console.log("💰 TOTAL:", totalPrice);

// ✅ CREATE SINGLE ORDER
const order = new Order({
  farmerId,
  items: orderItems,
  totalPrice,
  customerName: customerName || "Customer",
  customerMobile: customerMobile || "",
  address: address || "Not provided",
  expectedDelivery: getExpectedDeliveryDate(),
  invoiceId: generateInvoiceId(),
});

await order.save();
    res.status(201).json({
      success: true,
      message: "Order placed successfully ✅",
      order,
    });
  } catch (error) {
    console.error("Place order error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while placing order",
    });   
  }
});

/* =========================
   ✅ CREATE ORDER (ALIAS)
   POST /api/orders/create
========================= */
router.post("/create", async (req, res) => {
  try {
    const {
      farmerId,
      productId,
      productName,
      quantity,
      unit,
      totalPrice,
      customerName,
      customerMobile,
      address,
    } = req.body;

    if (!farmerId || !productId || !quantity || !unit || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: "Required order fields missing",
      });
    }

    const order = new Order({
      farmerId,
      productId,
      productName: productName || "Product",
      quantity,
      unit,
      totalPrice,
      customerName: customerName || "Customer",
      customerMobile: customerMobile || "",
      address: address || "Not provided",
      expectedDelivery: getExpectedDeliveryDate(),
      invoiceId: generateInvoiceId(),
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully ✅",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating order",
    });
  }
});

/* =========================
   ✅ CUSTOMER: GET MY ORDERS
   GET /api/orders/customer/:mobile
========================= */
router.get("/customer/:mobile", async (req, res) => {
  try {
    const mobile = req.params.mobile;

    const orders = await Order.find({ customerMobile: mobile })
      .populate("items.productId", "productName price unit images")
      .populate("farmerId", "name photo taluka district state")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Fetch customer orders error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching customer orders",
    });
  }
});

/* =========================
   ✅ CANCEL ORDER (ONLY PENDING)
   PUT /api/orders/cancel/:orderId
========================= */
router.put("/cancel/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled",
      });
    }

    order.status = "cancelled";
    await order.save();

    // ✅ restore product stock
    for (let item of order.items) {
  const product = await Product.findById(item.productId);

  if (product) {
    product.quantity += item.quantity;
    product.available = true;
    await product.save();
  }
}

    res.json({
      success: true,
      message: "Order cancelled successfully ✅",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while cancelling order",
    });
  }
});

/* =========================
   ✅ FARMER: GET ORDERS
   GET /api/orders/farmer/:farmerId
========================= */
router.get("/farmer/:farmerId", async (req, res) => {
  try {
    const orders = await Order.find({ farmerId: req.params.farmerId }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Fetch farmer orders error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching orders",
    });
  }
});

/* =========================
   ✅ UPDATE ORDER STATUS
   PUT /api/orders/update-status/:orderId
========================= */
router.put("/update-status/:orderId", async (req, res) => {
  try {
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating order",
    });
  }
});

export default router;
