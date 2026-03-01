import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/getCroppedImg";

function CustomerDashboard() {
  const navigate = useNavigate();
  const customer = JSON.parse(localStorage.getItem("customer"));

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  const [showProducts, setShowProducts] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showTrack, setShowTrack] = useState(false);

  // ✅ Farmer profile modal
  const [showFarmerProfile, setShowFarmerProfile] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem("cart")) || []
  );

  // ✅ Customer Photo
  const [profilePhoto, setProfilePhoto] = useState(
    customer?.photo
      ? `http://localhost:5000${customer.photo}?t=${Date.now()}`
      : ""
  );

  // ✅ Crop States
  const [cropModal, setCropModal] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.2);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // ✅ Image Viewer (for multiple images)
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  // ✅ Track Orders States
  const [myOrders, setMyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ✅ Invoice Modal (Customer)
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  useEffect(() => {
    if (!customer) {
      navigate("/login");
      return;
    }
    fetchAllProducts();
    // eslint-disable-next-line
  }, []);

  const fetchAllProducts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/products/all");
      const data = await res.json();

      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Fetch products error:", error);
      alert("Server error while fetching products");
    }
  };

  // ✅ FETCH CUSTOMER ORDERS
  const fetchMyOrders = async () => {
    try {
      if (!customer?.mobile) return;
      setOrdersLoading(true);

      const res = await fetch(
        `http://localhost:5000/api/orders/customer/${customer.mobile}`
      );
      const data = await res.json();

      if (data.success) {
        setMyOrders(data.orders || []);
      } else {
        setMyOrders([]);
      }
    } catch (err) {
      console.error(err);
      alert("Server error while fetching orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  // ✅ CANCEL ORDER (ONLY PENDING)
  const cancelOrder = async (orderId) => {
    const ok = window.confirm("Cancel this order?");
    if (!ok) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/orders/cancel/${orderId}`,
        { method: "PUT" }
      );
      const data = await res.json();

      if (data.success) {
        alert("✅ Order cancelled!");
        fetchMyOrders();
        fetchAllProducts();
      } else {
        alert(data.message || "Cancel failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while cancelling order");
    }
  };

  // ✅ Categories from products
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category.toLowerCase());
    });
    return ["all", ...Array.from(set)];
  }, [products]);

  // ✅ Filter + sort products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const name = (p.productName || "").toLowerCase();
        const cat = (p.category || "").toLowerCase();
        return name.includes(q) || cat.includes(q);
      });
    }

    if (category !== "all") {
      list = list.filter((p) => (p.category || "").toLowerCase() === category);
    }

    if (sortBy === "latest") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "price_low") {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price_high") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return list;
  }, [products, search, category, sortBy]);

  // ✅ Cart helpers
  const saveCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const addToCart = (product) => {
    const existing = cart.find((c) => c._id === product._id);

    let updatedCart = [];
    if (existing) {
      updatedCart = cart.map((c) =>
        c._id === product._id ? { ...c, qty: c.qty + 1 } : c
      );
    } else {
      updatedCart = [...cart, { ...product, qty: 1 }];
    }

    saveCart(updatedCart);
    alert("✅ Added to cart!");
  };

  const increaseQty = (id) => {
    const updated = cart.map((c) => (c._id === id ? { ...c, qty: c.qty + 1 } : c));
    saveCart(updated);
  };

  const decreaseQty = (id) => {
    const updated = cart
      .map((c) => (c._id === id ? { ...c, qty: c.qty - 1 } : c))
      .filter((c) => c.qty > 0);
    saveCart(updated);
  };

  const removeFromCart = (id) => {
    const updatedCart = cart.filter((c) => c._id !== id);
    saveCart(updatedCart);
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  }, [cart]);

  // ✅ Place order (UPDATED: sends customerMobile also)
  const placeOrder = async () => {
    if (cart.length === 0) {
      alert("❌ Cart is empty");
      return;
    }

    const address = prompt("Enter Delivery Address (Required):");
    if (!address || !address.trim()) {
      alert("❌ Address is required");
      return;
    }

    try {
      for (let item of cart) {
        const res = await fetch("http://localhost:5000/api/orders/place", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item._id,
            quantity: item.qty,
            customerName: customer?.name || "Customer",
            customerMobile: customer?.mobile || "",
            address: address.trim(),
          }),
        });

        const data = await res.json();
        if (!data.success) {
          alert(data.message || "Order failed");
          return;
        }
      }

      alert("✅ Order placed successfully!");
      saveCart([]);
      localStorage.removeItem("cart");

      fetchAllProducts();

      setShowTrack(true);
      setShowProducts(false);
      setShowCart(false);
      setShowProfile(false);

      // ✅ load orders instantly
      fetchMyOrders();
    } catch (error) {
      console.error(error);
      alert("❌ Server error while placing order");
    }
  };

  // ✅ Logout
  const handleLogout = () => {
    const confirmLogout = window.confirm("Do you want to logout?");
    if (!confirmLogout) return;

    localStorage.removeItem("customer");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("cart");
    navigate("/login");
  };

  /* ✅ PROFILE PHOTO FLOW */
  const handlePickPhoto = (file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setSelectedImg(previewUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1.2);
    setCropModal(true);
  };

  const onCropComplete = (croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleCropDone = async () => {
    try {
      if (!selectedImg || !croppedAreaPixels) return;

      const croppedBlob = await getCroppedImg(selectedImg, croppedAreaPixels);

      const formData = new FormData();
      formData.append("photo", croppedBlob, "profile.jpg");

      const res = await fetch(
        `http://localhost:5000/api/customers/upload-photo/${customer.id}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (data.success) {
        const fullUrl = `http://localhost:5000${data.photo}?t=${Date.now()}`;
        setProfilePhoto(fullUrl);

        const updatedCustomer = { ...customer, photo: data.photo };
        localStorage.setItem("customer", JSON.stringify(updatedCustomer));

        setCropModal(false);
        setSelectedImg(null);

        alert("✅ Profile photo updated!");
        window.location.reload();
      } else {
        alert(data.message || "Photo upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while uploading photo");
    }
  };

  /* ✅ IMAGE VIEWER */
  const openImageViewer = (imgs, idx = 0) => {
    const fullImgs = (imgs || []).map((x) => `http://localhost:5000${x}`);
    if (fullImgs.length === 0) return;
    setViewerImages(fullImgs);
    setViewerIndex(idx);
    setImageViewerOpen(true);
  };

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

  const statusBadge = (status) => {
    const s = (status || "").toLowerCase();

    if (s === "pending") return badge("#fff8e1", "#ff9800");
    if (s === "accepted") return badge("#e3f2fd", "#1976d2");
    if (s === "delivered") return badge("#e8f5e9", "#2e7d32");
    if (s === "rejected") return badge("#ffebee", "#c62828");
    if (s === "cancelled") return badge("#f3e5f5", "#6a1b9a");

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

  return (
    <div style={{ padding: "40px", background: "#f4f6f3", minHeight: "85vh" }}>
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
                    <b>Invoice ID:</b> {invoiceOrder.invoiceId || "-"}
                  </p>
                  <p style={invLine}>
                    <b>Date:</b> {new Date(invoiceOrder.createdAt).toLocaleString()}
                  </p>
                </div>

                <div style={statusBadge(invoiceOrder.status)}>
                  {invoiceOrder.status}
                </div>
              </div>

              <div style={invoiceDivider}></div>

              {/* Customer */}
              <h3 style={sectionTitle}>👤 Customer Details</h3>
              <p style={invLine}>
                <b>Name:</b> {invoiceOrder.customerName || customer?.name || "Customer"}
              </p>
              <p style={invLine}>
                <b>Mobile:</b> {customer?.mobile || "-"}
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

              {/* Delivery */}
              <div style={totalBox}>
                <p style={{ margin: 0, fontWeight: "900", fontSize: "16px" }}>
                  💰 Total Payable: ₹{invoiceOrder.totalPrice}
                </p>
                <p style={{ marginTop: "6px", fontSize: "13px", color: "#666" }}>
                  Expected Delivery:{" "}
                  <b>
                    {invoiceOrder.expectedDelivery
                      ? new Date(invoiceOrder.expectedDelivery).toLocaleDateString()
                      : "-"}
                  </b>
                </p>
              </div>
            </div>

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

      {/* ✅ TOP BAR */}
      <div style={topBar}>
        <button style={logoutSmallBtn} onClick={handleLogout}>
          Logout
        </button>

        <div
          style={profileIcon}
          onClick={() => {
            setShowProfile(true);
            setShowProducts(false);
            setShowCart(false);
            setShowTrack(false);
          }}
        >
          👤
        </div>
      </div>

      <h1 style={{ color: "#2e7d32" }}>Welcome, {customer?.name} 🛒</h1>
      <p style={{ color: "#555", marginBottom: "30px" }}>
        You are logged in as <strong>{customer?.mobile || "-"}</strong>
      </p>

      {/* ✅ DASHBOARD CARDS */}
      <div style={gridStyle}>
        <div
          style={{ ...cardStyle, cursor: "pointer" }}
          onClick={() => {
            setShowProfile(true);
            setShowProducts(false);
            setShowCart(false);
            setShowTrack(false);
          }}
        >
          <h3>👤 Profile</h3>
          <p>View your customer profile details.</p>
        </div>

        <div
          style={{ ...cardStyle, cursor: "pointer" }}
          onClick={() => {
            setShowProducts(true);
            setShowCart(false);
            setShowProfile(false);
            setShowTrack(false);
          }}
        >
          <h3>🌽 Products</h3>
          <p>Search & explore available farmer products.</p>
        </div>

        <div
          style={{ ...cardStyle, cursor: "pointer" }}
          onClick={() => {
            setShowCart(true);
            setShowProducts(false);
            setShowProfile(false);
            setShowTrack(false);
          }}
        >
          <h3>
            🛒 Cart {cart.length > 0 && <span style={badgeCount}>{cart.length}</span>}
          </h3>
          <p>Manage cart & place orders.</p>
        </div>

        <div
          style={{ ...cardStyle, cursor: "pointer" }}
          onClick={() => {
            setShowTrack(true);
            setShowProducts(false);
            setShowCart(false);
            setShowProfile(false);
            fetchMyOrders(); // ✅ IMPORTANT
          }}
        >
          <h3>📦 Track Orders</h3>
          <p>Track order status & expected delivery.</p>
        </div>
      </div>

      {/* ✅ PRODUCTS PANEL */}
      {showProducts && (
        <div style={panelBox}>
          <div style={panelHeaderRow}>
            <h2 style={{ margin: 0 }}>🌽 Available Products</h2>

            <div style={filterRow}>
              <div style={searchWrap}>
                🔍
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product..."
                  style={searchInput2}
                />
              </div>

              <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectBox}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "All Categories" : c}
                  </option>
                ))}
              </select>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectBox}>
                <option value="latest">Latest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <p style={{ color: "#777", marginTop: "14px" }}>No products found.</p>
          ) : (
            <div style={productGrid}>
              {filteredProducts.map((p) => (
                <div key={p._id} style={productCard}>
                  <div
                    style={imgBox}
                    onClick={() => openImageViewer(p.images || [], 0)}
                    title="Click to view images"
                  >
                    <img
                      src={
                        p.images?.length > 0
                          ? `http://localhost:5000${p.images[0]}`
                          : "https://via.placeholder.com/400x200?text=No+Image"
                      }
                      alt="product"
                      style={imgStyle}
                    />
                  </div>

                  <h3 style={{ margin: "10px 0 4px" }}>{p.productName}</h3>

                  <p style={{ margin: 0, color: "#555" }}>
                    ₹{p.price} / {p.unit}
                  </p>

                  <p style={{ margin: "6px 0 0", color: "#777", fontSize: "13px" }}>
                    Category: <b>{p.category}</b>
                  </p>

                  {/* ✅ Farmer Trust Box */}
                  {p.farmerId && (
                    <div
                      onClick={() => {
                        setSelectedFarmer(p.farmerId);
                        setShowFarmerProfile(true);
                      }}
                      style={farmerTrustBox}
                      title="Click to view farmer profile"
                    >
                      <div style={farmerAvatar}>
                        {p.farmerId.photo ? (
                          <img
                            src={`http://localhost:5000${p.farmerId.photo}?t=${Date.now()}`}
                            alt="farmer"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          "👨‍🌾"
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ fontWeight: "900", fontSize: "14px", color: "#222" }}>
                          {p.farmerId.name || "Farmer"}
                        </div>

                        <div style={{ fontSize: "12px", color: "#666" }}>
                          Click to view farmer details
                        </div>
                      </div>
                    </div>
                  )}

                  <button style={addCartBtn} onClick={() => addToCart(p)}>
                    ➕ Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✅ CART PANEL */}
      {showCart && (
        <div style={panelBox}>
          <div style={panelHeader}>
            <h2 style={{ margin: 0 }}>🛒 Your Cart</h2>
            <div style={{ fontWeight: "900", color: "#2e7d32" }}>Total: ₹{cartTotal}</div>
          </div>

          {cart.length === 0 ? (
            <p style={{ color: "#777", marginTop: "14px" }}>
              Cart is empty. Add products first.
            </p>
          ) : (
            <div style={{ marginTop: "14px" }}>
              {cart.map((c) => (
                <div key={c._id} style={cartRow}>
                  <div>
                    <b style={{ fontSize: "15px" }}>{c.productName}</b>
                    <div style={{ color: "#555", fontSize: "13px", marginTop: "4px" }}>
                      ₹{c.price} / {c.unit}
                    </div>
                    <div style={{ color: "#222", fontWeight: "900", marginTop: "6px" }}>
                      Item Total: ₹{c.qty * c.price}
                    </div>
                  </div>

                  <div style={qtyBox}>
                    <button style={qtyBtn} onClick={() => decreaseQty(c._id)}>
                      -
                    </button>
                    <span style={{ fontWeight: "900", minWidth: "20px", textAlign: "center" }}>
                      {c.qty}
                    </span>
                    <button style={qtyBtn} onClick={() => increaseQty(c._id)}>
                      +
                    </button>

                    <button style={removeBtn} onClick={() => removeFromCart(c._id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <button style={placeOrderBtn} onClick={placeOrder}>
                ✅ Place Order
              </button>
            </div>
          )}
        </div>
      )}

      {/* ✅ TRACK ORDERS PANEL (WORKING ✅) */}
      {showTrack && (
        <div style={panelBox}>
          <div style={panelHeader}>
            <h2 style={{ margin: 0 }}>📦 Track Orders</h2>

            <button
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
                fontWeight: "900",
              }}
              onClick={fetchMyOrders}
            >
              🔄 Refresh
            </button>
          </div>

          {ordersLoading ? (
            <p style={{ marginTop: "14px", color: "#555" }}>Loading orders...</p>
          ) : myOrders.length === 0 ? (
            <p style={{ marginTop: "14px", color: "#777" }}>
              No orders found. Place your first order ✅
            </p>
          ) : (
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {myOrders.map((o) => (
                <div
                  key={o._id}
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "14px",
                    border: "1px solid #eee",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: "900", fontSize: "16px" }}>
                        {o.productName}
                      </div>

                      <div style={{ marginTop: "4px", color: "#555", fontSize: "13px" }}>
                        Qty: <b>{o.quantity}</b> {o.unit} | Total: <b>₹{o.totalPrice}</b>
                      </div>

                      <div style={{ marginTop: "6px" }}>
                        <span style={statusBadge(o.status)}>{o.status}</span>
                      </div>

                      <div style={{ marginTop: "6px", color: "#666", fontSize: "13px" }}>
                        Expected Delivery:{" "}
                        <b>
                          {o.expectedDelivery
                            ? new Date(o.expectedDelivery).toLocaleDateString()
                            : "-"}
                        </b>
                      </div>

                      <div style={{ marginTop: "4px", color: "#777", fontSize: "12px" }}>
                        Invoice ID: <b>{o.invoiceId || "-"}</b>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <button style={invoiceSmallBtn} onClick={() => openInvoice(o)}>
                        🧾 View Invoice
                      </button>

                      {o.status === "pending" && (
                        <button style={cancelBtn} onClick={() => cancelOrder(o._id)}>
                          ❌ Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✅ RIGHT PROFILE SLIDER (CUSTOMER) */}
      {showProfile && (
        <div style={overlay} onClick={() => setShowProfile(false)}>
          <div style={profilePanel} onClick={(e) => e.stopPropagation()}>
            <button style={closeXBtn} onClick={() => setShowProfile(false)}>
              ✖
            </button>

            <div style={profileHeaderBox}>
              <div style={avatarWrap}>
                <div style={avatarCircle}>
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="profile" style={profileImg} />
                  ) : (
                    "👤"
                  )}
                </div>

                <label style={cameraBtn} title="Change Photo">
                  📷
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handlePickPhoto(e.target.files[0])}
                  />
                </label>
              </div>

              <div>
                <h3 style={nameText}>{customer?.name}</h3>
                <p style={mobileText}>📞 {customer?.mobile}</p>
              </div>
            </div>

            <div style={divider}></div>

            <div style={profileInfoBox}>
              <div style={infoRow}>
                <span style={infoLabel}>Email</span>
                <span style={infoValue}>{customer?.email || "-"}</span>
              </div>
            </div>

            <button style={logoutBtn} onClick={handleLogout}>
              Logout
            </button>

            {/* ✅ Crop Modal */}
            {cropModal && (
              <div style={cropOverlay}>
                <div style={cropBox}>
                  <h3 style={{ margin: "0 0 12px" }}>Crop your profile photo</h3>

                  <div style={cropArea}>
                    <Cropper
                      image={selectedImg}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    style={{ width: "100%", marginTop: "12px" }}
                  />

                  <div style={cropBtns}>
                    <button style={cropCancelBtn} onClick={() => setCropModal(false)}>
                      Cancel
                    </button>
                    <button style={cropDoneBtn} onClick={handleCropDone}>
                      ✅ Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ FARMER PROFILE MODAL */}
      {showFarmerProfile && selectedFarmer && (
        <div style={viewerOverlay} onClick={() => setShowFarmerProfile(false)}>
          <div style={farmerModal} onClick={(e) => e.stopPropagation()}>
            <button style={viewerClose} onClick={() => setShowFarmerProfile(false)}>
              ✖
            </button>

            <h2 style={{ margin: "0 0 14px", color: "#2e7d32" }}>
              👨‍🌾 Farmer Profile
            </h2>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={farmerAvatarBig}>
                {selectedFarmer.photo ? (
                  <img
                    src={`http://localhost:5000${selectedFarmer.photo}?t=${Date.now()}`}
                    alt="farmer"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  "👨‍🌾"
                )}
              </div>

              <div>
                <div style={{ fontWeight: "900", fontSize: "18px" }}>
                  {selectedFarmer.name || "Farmer"}
                </div>
                <div style={{ color: "#666", marginTop: "4px" }}>Trusted Seller ✅</div>
              </div>
            </div>

            <div style={{ height: "1px", background: "#eee", margin: "16px 0" }} />

            <div style={infoRow}>
              <span style={infoLabel}>Taluka</span>
              <span style={infoValue}>{selectedFarmer.taluka || "-"}</span>
            </div>

            <div style={{ height: "10px" }} />

            <div style={infoRow}>
              <span style={infoLabel}>District</span>
              <span style={infoValue}>{selectedFarmer.district || "-"}</span>
            </div>

            <div style={{ height: "10px" }} />

            <div style={infoRow}>
              <span style={infoLabel}>State</span>
              <span style={infoValue}>{selectedFarmer.state || "-"}</span>
            </div>
          </div>
        </div>
      )}

      {/* ✅ IMAGE VIEWER MODAL */}
      {imageViewerOpen && (
        <div style={viewerOverlay} onClick={() => setImageViewerOpen(false)}>
          <div style={viewerBox} onClick={(e) => e.stopPropagation()}>
            <button style={viewerClose} onClick={() => setImageViewerOpen(false)}>
              ✖
            </button>

            <img src={viewerImages[viewerIndex]} alt="preview" style={viewerImg} />

            <div style={viewerControls}>
              <button
                style={viewerBtn}
                onClick={() =>
                  setViewerIndex((p) => (p - 1 + viewerImages.length) % viewerImages.length)
                }
              >
                ◀ Prev
              </button>

              <div style={{ fontWeight: "900" }}>
                {viewerIndex + 1} / {viewerImages.length}
              </div>

              <button
                style={viewerBtn}
                onClick={() => setViewerIndex((p) => (p + 1) % viewerImages.length)}
              >
                Next ▶
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const topBar = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "12px",
  marginBottom: "10px",
};

const logoutSmallBtn = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "900",
};

const profileIcon = {
  width: "38px",
  height: "38px",
  background: "#2e7d32",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: "16px",
};

const badgeCount = {
  marginLeft: "8px",
  background: "#c62828",
  color: "#fff",
  padding: "2px 8px",
  borderRadius: "12px",
  fontWeight: "900",
  fontSize: "12px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
};

const cardStyle = {
  background: "#ffffff",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
};

const panelBox = {
  marginTop: "35px",
  background: "#ffffff",
  padding: "22px",
  borderRadius: "12px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
};

const panelHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "center",
  flexWrap: "wrap",
};

const panelHeaderRow = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const filterRow = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  flexWrap: "wrap",
};

const searchWrap = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "10px 12px",
  width: "520px",
  maxWidth: "100%",
};

const searchInput2 = {
  border: "none",
  outline: "none",
  width: "100%",
  fontSize: "14px",
};

const selectBox = {
  padding: "10px 12px",
  borderRadius: "12px",
  border: "1px solid #ddd",
  outline: "none",
  fontWeight: "800",
};

/* ✅ FIX: NO ZOOM ON SEARCH */
const productGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 260px))",
  gap: "18px",
  marginTop: "16px",
  justifyContent: "start",
};

const productCard = {
  background: "#fff",
  padding: "16px",
  borderRadius: "12px",
  boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
};

const imgBox = {
  width: "100%",
  height: "140px",
  borderRadius: "10px",
  overflow: "hidden",
  background: "#eee",
  cursor: "pointer",
};

const imgStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const farmerTrustBox = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginTop: "12px",
  padding: "10px",
  borderRadius: "10px",
  background: "#f4f6f3",
  cursor: "pointer",
  border: "1px solid #e6e6e6",
};

const farmerAvatar = {
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  overflow: "hidden",
  border: "2px solid #2e7d32",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
};

const farmerAvatarBig = {
  width: "65px",
  height: "65px",
  borderRadius: "50%",
  overflow: "hidden",
  border: "2px solid #2e7d32",
  background: "#e8f5e9",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900",
  fontSize: "30px",
};

const addCartBtn = {
  width: "100%",
  marginTop: "12px",
  padding: "10px",
  borderRadius: "10px",
  border: "none",
  background: "#2e7d32",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "900",
};

const cartRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #eee",
  padding: "12px 0",
  gap: "12px",
  flexWrap: "wrap",
};

const qtyBox = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const qtyBtn = {
  width: "34px",
  height: "34px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "900",
  fontSize: "16px",
};

const removeBtn = {
  background: "#c62828",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "900",
};

const placeOrderBtn = {
  width: "100%",
  marginTop: "14px",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "#1976d2",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "900",
  fontSize: "15px",
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

const cancelBtn = {
  background: "#c62828",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "900",
};

/* ✅ RIGHT PROFILE SLIDER */
const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.45)",
  zIndex: 9999,
  display: "flex",
  justifyContent: "flex-end",
};

const profilePanel = {
  width: "360px",
  background: "#fff",
  padding: "22px 22px 18px",
  boxShadow: "-6px 0 20px rgba(0,0,0,0.18)",
  borderTopLeftRadius: "18px",
  borderBottomLeftRadius: "18px",
  height: "fit-content",
  marginTop: "55px",
  marginRight: "18px",
  position: "relative",
};

const closeXBtn = {
  position: "absolute",
  top: "14px",
  right: "14px",
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  border: "none",
  background: "#f1f1f1",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "800",
};

const profileHeaderBox = {
  display: "flex",
  gap: "12px",
  alignItems: "center",
};

const avatarCircle = {
  width: "65px",
  height: "65px",
  borderRadius: "50%",
  background: "#e8f5e9",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "30px",
  border: "2px solid #2e7d32",
  overflow: "hidden",
};

const profileImg = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  objectPosition: "center",
  display: "block",
};

const avatarWrap = {
  position: "relative",
  width: "65px",
  height: "65px",
};

const cameraBtn = {
  position: "absolute",
  bottom: "-4px",
  right: "-4px",
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  background: "#2e7d32",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "2px solid #fff",
  fontSize: "14px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
};

const nameText = {
  margin: 0,
  fontWeight: "900",
  fontSize: "20px",
  color: "#1f1f1f",
};

const mobileText = {
  margin: "6px 0 0",
  fontSize: "14px",
  color: "#555",
};

const divider = {
  margin: "18px 0",
  height: "1px",
  background: "#eee",
};

const profileInfoBox = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  marginBottom: "18px",
};

const infoRow = {
  display: "flex",
  flexDirection: "column",
  gap: "3px",
};

const infoLabel = {
  fontSize: "13px",
  color: "#666",
  fontWeight: "700",
};

const infoValue = {
  fontSize: "15px",
  color: "#222",
  fontWeight: "800",
};

const logoutBtn = {
  width: "100%",
  padding: "12px",
  background: "#fff",
  color: "#111",
  border: "1px solid #ddd",
  borderRadius: "10px",
  fontWeight: "800",
  cursor: "pointer",
};

/* ✅ CROP MODAL */
const cropOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 99999,
};

const cropBox = {
  width: "420px",
  background: "#fff",
  padding: "18px",
  borderRadius: "14px",
  textAlign: "center",
};

const cropArea = {
  position: "relative",
  width: "100%",
  height: "260px",
  background: "#000",
  borderRadius: "12px",
  overflow: "hidden",
};

const cropBtns = {
  marginTop: "14px",
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
};

const cropCancelBtn = {
  flex: 1,
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "800",
};

const cropDoneBtn = {
  flex: 1,
  padding: "10px",
  borderRadius: "10px",
  border: "none",
  background: "#2e7d32",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "900",
};

/* ✅ IMAGE VIEWER */
const viewerOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.7)",
  zIndex: 999999,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "16px",
};

const viewerBox = {
  width: "100%",
  maxWidth: "780px",
  background: "#fff",
  borderRadius: "14px",
  overflow: "hidden",
  position: "relative",
};

const viewerClose = {
  position: "absolute",
  top: "10px",
  right: "10px",
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  border: "none",
  cursor: "pointer",
  background: "#f1f1f1",
  fontWeight: "900",
};

const viewerImg = {
  width: "100%",
  maxHeight: "420px",
  objectFit: "contain",
  background: "#000",
  display: "block",
};

const viewerControls = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 14px",
};

const viewerBtn = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "900",
};

const farmerModal = {
  width: "100%",
  maxWidth: "420px",
  background: "#fff",
  borderRadius: "14px",
  padding: "18px",
  position: "relative",
};

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

export default CustomerDashboard;





