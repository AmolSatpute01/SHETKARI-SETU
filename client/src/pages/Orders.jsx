import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Orders() {
  const navigate = useNavigate();
  const farmer = JSON.parse(localStorage.getItem("farmer"));

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ filter tabs
  const [filter, setFilter] = useState("all"); // all | pending | accepted | delivered | rejected

  // ✅ INVOICE MODAL STATE
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  // ✅ fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:5000/api/orders/farmer/${farmer.id}`
      );
      const data = await res.json();

      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!farmer) {
      navigate("/login");
      return;
    }
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  // ✅ update status (Accept / Reject / Delivered)
  const updateStatus = async (orderId, status) => {
    try {
      const confirmAction = window.confirm(
        `Are you sure you want to mark as "${status}"?`
      );
      if (!confirmAction) return;

      const res = await fetch(
        `http://localhost:5000/api/orders/update-status/${orderId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      const data = await res.json();

      if (data.success) {
        // ✅ instantly update UI
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status } : o))
        );
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      alert("Server error while updating status");
    }
  };

  // ✅ filter orders
  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((o) => o.status?.toLowerCase() === filter);

  /* ✅ INVOICE HELPERS */
  const openInvoice = (order) => {
    setInvoiceOrder(order);
    setShowInvoice(true);
  };

  const closeInvoice = () => {
    setShowInvoice(false);
    setInvoiceOrder(null);
  };

  const printInvoice = () => {
    window.print();
  };

  const generateInvoiceNumber = (orderId) => {
    return `INV-${orderId.slice(-6).toUpperCase()}`;
  };

  return (
    <div style={{ padding: "40px", background: "#f4f6f3", minHeight: "80vh" }}>
      {/* ✅ INVOICE MODAL */}
      {showInvoice && invoiceOrder && (
        <div style={invoiceOverlay} onClick={closeInvoice}>
          <div style={invoiceBox} onClick={(e) => e.stopPropagation()}>
            <div style={invoiceHeader}>
              <h2 style={{ margin: 0, color: "#2e7d32", fontWeight: "900" }}>
                🧾 Invoice
              </h2>
              <button style={invoiceCloseBtn} onClick={closeInvoice}>
                ✖
              </button>
            </div>

            <div style={invoiceBody}>
              <div style={invoiceTopRow}>
                <div>
                  <p style={invLine}>
                    <b>Invoice No:</b>{" "}
                    {generateInvoiceNumber(invoiceOrder._id)}
                  </p>
                  <p style={invLine}>
                    <b>Date:</b>{" "}
                    {new Date(invoiceOrder.createdAt).toLocaleString()}
                  </p>
                </div>

                <div style={statusBadge(invoiceOrder.status)}>
                  {invoiceOrder.status}
                </div>
              </div>

              <div style={invoiceDivider}></div>

              {/* Farmer */}
              <h3 style={sectionTitle}>🌾 Farmer Details</h3>
              <p style={invLine}>
                <b>Name:</b> {farmer.name}
              </p>
              <p style={invLine}>
                <b>Mobile:</b> {farmer.mobile}
              </p>

              <div style={invoiceDivider}></div>

              {/* Customer */}
              <h3 style={sectionTitle}>👤 Customer Details</h3>
              <p style={invLine}>
                <b>Name:</b> {invoiceOrder.customerName || "Unknown"}
              </p>
              <p style={invLine}>
                <b>Address:</b> {invoiceOrder.address || "Not provided"}
              </p>

              <div style={invoiceDivider}></div>

              {/* Product */}
              <h3 style={sectionTitle}>📦 Product Details</h3>
              <div style={productTable}>
                <div style={tableRowHead}>
                  <span style={th}>Product</span>
                  <span style={th}>Qty</span>
                  <span style={th}>Price</span>
                </div>

                <div style={tableRow}>
                  <span style={td}>{invoiceOrder.productName}</span>
                  <span style={td}>
                    {invoiceOrder.quantity} {invoiceOrder.unit}
                  </span>
                  <span style={td}>₹{invoiceOrder.totalPrice}</span>
                </div>
              </div>

              <div style={invoiceDivider}></div>

              {/* Total */}
              <div style={totalBox}>
                <p style={{ margin: 0, fontWeight: "900", fontSize: "16px" }}>
                  💰 Total Payable: ₹{invoiceOrder.totalPrice}
                </p>
                <p style={{ marginTop: "6px", fontSize: "13px", color: "#666" }}>
                  Payment will be collected on delivery / as per system rules.
                </p>
              </div>
            </div>

            {/* Invoice Buttons */}
            <div style={invoiceBtnRow}>
              <button style={invoicePrintBtn} onClick={printInvoice}>
                🖨 Print Invoice
              </button>
              <button style={invoiceDownloadBtn} onClick={printInvoice}>
                ⬇ Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div style={headerBar}>
        <h2 style={{ margin: 0, color: "#2e7d32", fontWeight: "900" }}>
          📦 Orders Management
        </h2>

        <button style={backBtn} onClick={() => navigate("/dashboard")}>
          ⬅ Back
        </button>
      </div>

      <p style={{ color: "#666", marginTop: "8px" }}>
        Track and manage customer orders in one place.
      </p>

      {/* Filter Tabs */}
      <div style={tabsRow}>
        <button
          style={filter === "all" ? tabActive : tabBtn}
          onClick={() => setFilter("all")}
        >
          ✅ All
        </button>

        <button
          style={filter === "pending" ? tabActive : tabBtn}
          onClick={() => setFilter("pending")}
        >
          ⏳ Pending
        </button>

        <button
          style={filter === "accepted" ? tabActive : tabBtn}
          onClick={() => setFilter("accepted")}
        >
          👍 Accepted
        </button>

        <button
          style={filter === "delivered" ? tabActive : tabBtn}
          onClick={() => setFilter("delivered")}
        >
          🚚 Delivered
        </button>

        <button
          style={filter === "rejected" ? tabActive : tabBtn}
          onClick={() => setFilter("rejected")}
        >
          ❌ Rejected
        </button>
      </div>

      {/* Orders */}
      {loading ? (
        <p style={{ marginTop: "20px" }}>Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
        <div style={emptyBox}>
          <h3 style={{ margin: 0 }}>No orders found</h3>
          <p style={{ margin: "6px 0", color: "#666" }}>
            Orders will appear here when customers place them.
          </p>
        </div>
      ) : (
        <div style={ordersGrid}>
          {filteredOrders.map((o) => (
            <div key={o._id} style={orderCard}>
              {/* top row */}
              <div style={orderTop}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: "900" }}>
                    🧾 Order #{o._id.slice(-6)}
                  </h3>
                  <p style={{ margin: "6px 0", color: "#666", fontSize: "13px" }}>
                    📅 {new Date(o.createdAt).toLocaleString()}
                  </p>
                </div>

                <span style={statusBadge(o.status)}>{o.status}</span>
              </div>

              <div style={divider}></div>

              {/* customer */}
              <p style={infoText}>
                👤 <b>Customer:</b> {o.customerName || "Unknown"}
              </p>
              <p style={infoText}>
                📍 <b>Address:</b> {o.address || "Not provided"}
              </p>

              <div style={divider}></div>

              {/* product */}
              <p style={infoText}>
                🌽 <b>Product:</b> {o.productName}
              </p>
              <p style={infoText}>
                ⚖ <b>Qty:</b> {o.quantity} {o.unit}
              </p>
              <p style={infoText}>
                💰 <b>Total:</b> ₹{o.totalPrice}
              </p>

              {/* ✅ SMALL PROFESSIONAL BUTTON ROW */}
              <div style={actionRow}>
                <button style={invoiceSmallBtn} onClick={() => openInvoice(o)}>
                  🧾 Invoice
                </button>

                {o.status === "pending" && (
                  <>
                    <button
                      style={acceptBtn}
                      onClick={() => updateStatus(o._id, "accepted")}
                    >
                      ✅ Accept
                    </button>
                    <button
                      style={rejectBtn}
                      onClick={() => updateStatus(o._id, "rejected")}
                    >
                      ❌ Reject
                    </button>
                  </>
                )}

                {o.status === "accepted" && (
                  <button
                    style={deliverBtn}
                    onClick={() => updateStatus(o._id, "delivered")}
                  >
                    🚚 Delivered
                  </button>
                )}

                {o.status === "delivered" && (
                  <button style={doneBtn} disabled>
                    ✅ Delivered
                  </button>
                )}

                {o.status === "rejected" && (
                  <button style={rejectedBtn} disabled>
                    ❌ Rejected
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const headerBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const backBtn = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "700",
};

const tabsRow = {
  display: "flex",
  gap: "10px",
  marginTop: "18px",
  flexWrap: "wrap",
};

const tabBtn = {
  padding: "8px 14px",
  borderRadius: "20px",
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "700",
};

const tabActive = {
  padding: "8px 14px",
  borderRadius: "20px",
  border: "1px solid #2e7d32",
  background: "#2e7d32",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "800",
};

const emptyBox = {
  marginTop: "20px",
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #e0e0e0",
};

const ordersGrid = {
  marginTop: "20px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "16px",
};

const orderCard = {
  background: "#fff",
  padding: "18px",
  borderRadius: "14px",
  boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
  border: "1px solid #eee",
};

const orderTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
};

const divider = {
  height: "1px",
  background: "#eee",
  margin: "12px 0",
};

const infoText = {
  margin: "8px 0",
  color: "#333",
  fontSize: "14px",
};

const actionRow = {
  marginTop: "14px",
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const invoiceSmallBtn = {
  background: "#fff",
  border: "1px solid #2e7d32",
  color: "#2e7d32",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "900",
};

const acceptBtn = {
  background: "#2e7d32",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "800",
};

const rejectBtn = {
  background: "#c62828",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "800",
};

const deliverBtn = {
  background: "#1976d2",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "800",
};

const doneBtn = {
  background: "#e8f5e9",
  color: "#2e7d32",
  border: "1px solid #2e7d32",
  padding: "10px 14px",
  borderRadius: "10px",
  fontWeight: "900",
};

const rejectedBtn = {
  background: "#ffebee",
  color: "#c62828",
  border: "1px solid #c62828",
  padding: "10px 14px",
  borderRadius: "10px",
  fontWeight: "900",
};

const statusBadge = (status) => {
  const s = (status || "").toLowerCase();

  if (s === "pending") return badge("#fff8e1", "#ff9800");
  if (s === "accepted") return badge("#e3f2fd", "#1976d2");
  if (s === "delivered") return badge("#e8f5e9", "#2e7d32");
  if (s === "rejected") return badge("#ffebee", "#c62828");

  return badge("#eee", "#333");
};

const badge = (bg, color) => ({
  background: bg,
  color,
  padding: "6px 12px",
  borderRadius: "20px",
  fontWeight: "900",
  fontSize: "13px",
  border: `1px solid ${color}`,
});

/* ================= INVOICE MODAL ================= */

const invoiceOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  padding: "16px",
};

const invoiceBox = {
  background: "#fff",
  width: "100%",
  maxWidth: "700px",
  borderRadius: "14px",
  padding: "18px",
  boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
};

const invoiceHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
};

const invoiceCloseBtn = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  border: "none",
  cursor: "pointer",
  fontWeight: "900",
  background: "#f2f2f2",
};

const invoiceBody = {
  marginTop: "14px",
};

const invoiceTopRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const invoiceDivider = {
  height: "1px",
  background: "#eee",
  margin: "14px 0",
};

const invLine = {
  margin: "6px 0",
  fontSize: "14px",
  color: "#333",
};

const sectionTitle = {
  margin: "0 0 8px",
  fontWeight: "900",
  fontSize: "15px",
  color: "#2e7d32",
};

const productTable = {
  background: "#fafafa",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid #eee",
};

const tableRowHead = {
  display: "grid",
  gridTemplateColumns: "1fr 120px 120px",
  fontWeight: "900",
  color: "#333",
  marginBottom: "8px",
};

const tableRow = {
  display: "grid",
  gridTemplateColumns: "1fr 120px 120px",
  color: "#444",
  fontWeight: "700",
};

const th = {
  fontSize: "13px",
};

const td = {
  fontSize: "14px",
};

const totalBox = {
  background: "#e8f5e9",
  border: "1px solid #2e7d32",
  padding: "14px",
  borderRadius: "12px",
};

const invoiceBtnRow = {
  marginTop: "16px",
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const invoicePrintBtn = {
  flex: 1,
  background: "#1976d2",
  color: "#fff",
  border: "none",
  padding: "12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "900",
};

const invoiceDownloadBtn = {
  flex: 1,
  background: "#2e7d32",
  color: "#fff",
  border: "none",
  padding: "12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "900",
};

export default Orders;


