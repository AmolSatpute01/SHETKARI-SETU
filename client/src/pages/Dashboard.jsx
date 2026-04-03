import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import languageText from "../data/languageText";
import AddProduct from "./AddProduct";
import ProductList from "../components/ProductList";

import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/getCroppedImg";

function Dashboard() {
  const navigate = useNavigate();
  
const farmerData = localStorage.getItem("farmer");

let farmer = null;

try {
  if (farmerData && farmerData !== "undefined") {
    farmer = JSON.parse(farmerData);
  }
} catch (err) {
  console.error("Invalid farmer data in localStorage");
  localStorage.removeItem("farmer");
  farmer = null;
}

const farmerId = farmer?._id || farmer?.id;

  const [showPayments, setShowPayments] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentType, setPaymentType] = useState("upi");

  const [upiId, setUpiId] = useState("");

const [bankDetails, setBankDetails] = useState({
  name: "",
  account: "",
  ifsc: "",
  bank: "",
  branch: "",
});

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "en"
  );
  const text = languageText[language];

  const [showProducts, setShowProducts] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // ✅ profile slider state
  const [showProfile, setShowProfile] = useState(false);

  // ✅ refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  const [pendingCount, setPendingCount] = useState(0);

  // ✅ profile photo state
  const [profilePhoto, setProfilePhoto] = useState(
    farmer?.photo ? `http://localhost:5000${farmer.photo}?t=${Date.now()}` : ""
  );

  // ✅ Edit Profile Toggle
  const [editMode, setEditMode] = useState(false);

  // ✅ edit form state
  const [editForm, setEditForm] = useState({
    name: farmer?.name || "",
    taluka: farmer?.taluka || "",
    district: farmer?.district || "",
    state: farmer?.state || "",
    email: farmer?.email || "",
  });

  // ✅ CROP STATES
  const [cropModal, setCropModal] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.2);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);


const fetchPayment = async () => {
  try {
    if (!farmer || !farmerId) return;

    const res = await fetch(
      `http://localhost:5000/api/farmers/payment/${farmerId}`
    ); // ✅ GET request

    const data = await res.json();

    if (data.success) {
      setPaymentData(data.payment);
    }
  } catch (err) {
    console.error("Payment fetch error:", err);
  }
};

useEffect(() => {
  if (!farmer || !farmerId) {
    console.log("Redirecting to login...");
    navigate("/login");
    return;
  }

  fetchPendingOrdersCount();
  fetchPayment();
}, []);

  if (!farmer) return null;

  // ✅ logout
  const handleLogout = () => {
    const confirmLogout = window.confirm("Do you want to logout?");
    if (!confirmLogout) return;

    localStorage.removeItem("farmer");
    localStorage.removeItem("token");
    navigate("/login");
  };

const fetchPendingOrdersCount = async () => {
  try {
    if (!farmer || !farmerId) return;

    const res = await fetch(
      `http://localhost:5000/api/orders/farmer/${farmerId}`
    );

    const data = await res.json();

    if (data.success) {
      const pendingOrders = data.orders.filter((o) => o.status === "pending");
      setPendingCount(pendingOrders.length);
    }
  } catch (error) {
    console.error("Pending orders count error:", error);
  }
};

  // ✅ ORDERS ROUTE
  const goToOrders = () => {
    navigate("/orders");
  };

  // ✅ Pick image → open crop modal
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

  // ✅ Done Cropping → upload
  const handleCropDone = async () => {
    try {
      if (!selectedImg || !croppedAreaPixels) return;

      // ✅ blob from crop
      const croppedBlob = await getCroppedImg(selectedImg, croppedAreaPixels);

      const formData = new FormData();
      formData.append("photo", croppedBlob, "profile.jpg");

      const res = await fetch(
        `http://localhost:5000/api/farmers/upload-photo/${farmerId}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (data.success) {
        // ✅ FORCE REFRESH always using timestamp (fix cache)
        const fullUrl = `http://localhost:5000${data.photo}?t=${Date.now()}`;
        setProfilePhoto(fullUrl);

        // ✅ update localStorage farmer
        const updatedFarmer = { ...farmer, photo: data.photo };
        localStorage.setItem("farmer", JSON.stringify(updatedFarmer));

        setCropModal(false);
        setSelectedImg(null);

        alert("✅ Profile photo updated!");
      } else {
        alert(data.message || "Photo upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while uploading photo");
    }
  };

  // ✅ SAVE PROFILE
  const handleSaveProfile = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/farmers/update/${farmerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("farmer", JSON.stringify(data.farmer));
        setEditForm({
          name: data.farmer.name || "",
          taluka: data.farmer.taluka || "",
          district: data.farmer.district || "",
          state: data.farmer.state || "",
          email: data.farmer.email || "",
        });

        setEditMode(false);
        alert("✅ Profile Updated Successfully!");
        window.location.reload();
      } else {
        alert(data.message || "Update failed");
      }
    } catch (error) {
      alert("Server error while updating profile");
    }
  };

  return (
    <div style={{ padding: "40px", background: "#f4f6f3", minHeight: "80vh" }}>
      {/* 🌍 Language + Profile Icon */}
      <div style={topBar}>
        <select
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            localStorage.setItem("language", e.target.value);
          }}
          style={langSelect}
        >
          <option value="en">English</option>
          <option value="mr">मराठी</option>
          <option value="hi">हिंदी</option>
        </select>

        <div
          style={profileIcon}
          onClick={() => {
            setShowProfile(true);
            setEditMode(false);
          }}
        >
          👤
        </div>
      </div>

      <h1 style={{ color: "#2e7d32" }}>
        {text.dashboardWelcome}, {farmer.name} 🌾
      </h1>
      <p style={{ color: "#555", marginBottom: "30px" }}>
        {text.loggedInAs} <strong>{farmer.mobile}</strong>
      </p>

            {/* Cards */}
      <div style={gridStyle}>
        <div
          style={{ ...cardStyle, cursor: "pointer" }}
          onClick={() => setShowProfile(true)}
        >
          <h3>👤 {text.profile}</h3>
          <p>{text.profileDesc}</p>
        </div>

        <div
          style={{ ...cardStyle, cursor: "pointer" }}
          onClick={() => {
            setShowProducts(!showProducts);
            setShowAddForm(false);
            setShowPayments(false);
          }}
        >
          <h3>🌽 {text.products}</h3>
          <p>{text.productsDesc}</p>
        </div>

        <div style={{ ...cardStyle, cursor: "pointer" }} onClick={goToOrders}>
          <h3>
            📦 {text.orders}{" "}
            {pendingCount > 0 && <span style={badgeCount}>{pendingCount}</span>}
          </h3>
          <p>{text.ordersDesc}</p>
        </div>

        <div
          style={{ ...cardStyle, cursor: "pointer" }}
          onClick={() => {
            setShowPayments(!showPayments);
            setShowProducts(false);
            setShowAddForm(false);
          }}
        >
          <h3>💰 {text.payments}</h3>
          <p>Manage your payment details</p>
        </div>
      </div>
      {/* ✅ GRID CLOSED PROPERLY */}

      {/* PRODUCT MANAGEMENT */}
      {showProducts && (
        <div style={productPanel}>
          <div style={productHeader}>
            <h2>🌽 Product Management</h2>

            <button onClick={() => setShowAddForm(!showAddForm)} style={addBtn}>
              {showAddForm ? "✖ Close" : "➕ Add Product"}
            </button>
          </div>

          {showAddForm && (
            <AddProduct
              onProductAdded={() => {
                setRefreshKey((prev) => prev + 1);
                setShowAddForm(false);
              }}
            />
          )}

          {!showAddForm && <ProductList refreshKey={refreshKey} />}
        </div>
      )}

       {/* 💰 PAYMENT MANAGEMENT (SEPARATE & SAFE) */}
       {showPayments && (
       <div style={paymentWrapper}>
         <div style={paymentCard}>
           <h2 style={paymentTitle}>💰 Payment Details</h2>
       
           <p style={paymentSubtitle}>
             Add your bank or UPI details so customers can pay you directly.
           </p>
       


           {!paymentData ? (
  <div style={alertBox}>
    <p style={alertTitle}>❌ Payment details not added</p>
    <p style={alertDesc}>
      Customers will not be able to pay until you add payment information.
    </p>

    <button
      onClick={() => setShowPaymentForm(true)}
      style={primaryBtn}
    >
      ➕ Add Payment Details
    </button>
  </div>
) : (
  <div style={successBox}>
    <p style={{ fontWeight: "900", color: "#2e7d32" }}>
      ✅ Payment Details Added
    </p>

    {paymentData.type === "upi" && (
      <p><strong>UPI:</strong> {paymentData.upi}</p>
    )}

    {paymentData.type === "bank" && (
      <>
        <p><strong>Name:</strong> {paymentData.name}</p>
        <p><strong>Account:</strong> {paymentData.account}</p>
        <p><strong>IFSC:</strong> {paymentData.ifsc}</p>
        <p><strong>Bank:</strong> {paymentData.bank}</p>
        <p><strong>Branch:</strong> {paymentData.branch}</p>
      </>
    )}

    <button
      onClick={() => setShowPaymentForm(true)}
      style={primaryBtn}
    >
      ✏️ Edit Details
    </button>
  </div>
)}

           {/* FORM */}
           {showPaymentForm && (
             <div style={formCard}>
               <label style={label}>Payment Method</label>
               <select
                 style={input}
                 value={paymentType}
                 onChange={(e) => setPaymentType(e.target.value)}
               >
                 <option value="upi">UPI</option>
                 <option value="bank">Bank Account</option>
               </select>
       
               {paymentType === "upi" && (
                 <>
                   <label style={label}>UPI ID</label>
                  <input
                   style={input}
                   placeholder="example@upi"
                   value={upiId}
                   onChange={(e) => setUpiId(e.target.value)}
                  />
                 </>
               )}
       
               {paymentType === "bank" && (
  <div style={gridForm}>
    <div>
      <label style={label}>Account Holder Name</label>
      <input
        style={input}
        value={bankDetails.name}
        onChange={(e) =>
          setBankDetails({ ...bankDetails, name: e.target.value })
        }
      />
    </div>

    <div>
      <label style={label}>Account Number</label>
      <input
        style={input}
        value={bankDetails.account}
        onChange={(e) =>
          setBankDetails({ ...bankDetails, account: e.target.value })
        }
      />
    </div>

    <div>
      <label style={label}>IFSC Code</label>
      <input
        style={input}
        value={bankDetails.ifsc}
        onChange={(e) =>
          setBankDetails({ ...bankDetails, ifsc: e.target.value })
        }
      />
    </div>

    <div>
      <label style={label}>Bank Name</label>
      <input
        style={input}
        value={bankDetails.bank}
        onChange={(e) =>
          setBankDetails({ ...bankDetails, bank: e.target.value })
        }
      />
    </div>

    <div>
      <label style={label}>Branch</label>
      <input
        style={input}
        value={bankDetails.branch}
        onChange={(e) =>
          setBankDetails({ ...bankDetails, branch: e.target.value })
        }
      />
    </div>
  </div>
)}
       
<button
  onClick={async () => {
    if (!(farmerId)) {
      alert("❌ Farmer not loaded properly. Please login again.");
      return;
    }

    let data;

    if (paymentType === "upi") {
      data = { type: "upi", upi: upiId };
    } else {
      data = {
        type: "bank",
        ...bankDetails,
      };
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/farmers/payment/${farmerId }`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      const result = await res.json();
      console.log("PAYMENT RESPONSE:", result);

      if (result.success) {
        setPaymentData(result.payment);
        setShowPaymentForm(false);
        alert("✅ Payment saved permanently!");
      } else {
        alert("❌ Save failed");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Server error");
    }
  }}
  style={saveBtn}
>
  💾 Save Payment Details
</button>
       
               <button
                 onClick={() => setShowPaymentForm(false)}
                 style={cancelBtn}
               >
                 ✖ Cancel
               </button>
             </div>
           )}
         </div>
      </div>
      )}

      {/* ✅ PROFILE RIGHT SLIDER */}
      {showProfile && (
        <div style={overlay} onClick={() => setShowProfile(false)}>
          <div style={profilePanel} onClick={(e) => e.stopPropagation()}>
            <button style={closeXBtn} onClick={() => setShowProfile(false)}>
              ✖
            </button>

            {/* ✅ Profile Header */}
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
                <h3 style={nameText}>{farmer.name}</h3>
                <p style={mobileText}>📞 {farmer.mobile}</p>
              </div>
            </div>

            <div style={divider}></div>

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

            {/* ✅ Edit Mode */}
            {editMode ? (
              <div style={editBox}>
                <label style={label}>Name</label>
                <input
                  style={input}
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />

                <label style={label}>Taluka</label>
                <input
                  style={input}
                  value={editForm.taluka}
                  onChange={(e) =>
                    setEditForm({ ...editForm, taluka: e.target.value })
                  }
                />

                <label style={label}>District</label>
                <input
                  style={input}
                  value={editForm.district}
                  onChange={(e) =>
                    setEditForm({ ...editForm, district: e.target.value })
                  }
                />

                <label style={label}>State</label>
                <input
                  style={input}
                  value={editForm.state}
                  onChange={(e) =>
                    setEditForm({ ...editForm, state: e.target.value })
                  }
                />

                <button style={saveProfileBtn} onClick={handleSaveProfile}>
                  ✅ Save Changes
                </button>

                <button
                  style={cancelEditBtn}
                  onClick={() => setEditMode(false)}
                >
                  ✖ Cancel
                </button>
              </div>
            ) : (
              <>
                {/* ✅ Farmer Info */}
                <div style={profileInfoBox}>
                  <div style={infoRow}>
                    <span style={infoLabel}>Taluka</span>
                    <span style={infoValue}>{farmer.taluka || "-"}</span>
                  </div>

                  <div style={infoRow}>
                    <span style={infoLabel}>District</span>
                    <span style={infoValue}>{farmer.district || "-"}</span>
                  </div>

                  <div style={infoRow}>
                    <span style={infoLabel}>State</span>
                    <span style={infoValue}>{farmer.state || "-"}</span>
                  </div>
                </div>

                <button
                  style={editProfileBtn}
                  onClick={() => {
                    setEditMode(true);
                    setEditForm({
                      name: farmer.name || "",
                      taluka: farmer.taluka || "",
                      district: farmer.district || "",
                      state: farmer.state || "",
                      email: farmer.email || "",
                    });
                  }}
                >
                  ✏️ Edit Profile
                </button>

                <button style={logoutBtn} onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
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

const langSelect = {
  padding: "6px 10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
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

const productPanel = {
  marginTop: "40px",
  background: "#ffffff",
  padding: "30px",
  borderRadius: "12px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
};

const productHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const addBtn = {
  padding: "10px 16px",
  background: "#2e7d32",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "700",
};

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

const editProfileBtn = {
  width: "100%",
  padding: "12px",
  background: "#2e7d32",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontWeight: "800",
  cursor: "pointer",
  marginBottom: "12px",
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

const editBox = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const label = {
  fontSize: "13px",
  fontWeight: "800",
  color: "#555",
};

const input = {
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  outline: "none",
  fontSize: "14px",
};

const saveProfileBtn = {
  marginTop: "10px",
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "#2e7d32",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "900",
};

const cancelEditBtn = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "900",
};

/* ✅ CROP MODAL STYLES */
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

const paymentWrapper = {
  display: "flex",
  justifyContent: "center",
  marginTop: "40px",
};

const paymentCard = {
  width: "100%",
  maxWidth: "800px",
  background: "#fff",
  padding: "30px",
  borderRadius: "16px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
};

const paymentTitle = {
  marginBottom: "8px",
  color: "#2e7d32",
};

const paymentSubtitle = {
  color: "#666",
  marginBottom: "20px",
};

const alertBox = {
  background: "#fff5f5",
  padding: "16px",
  borderRadius: "10px",
  border: "1px solid #ffcdd2",
};

const alertTitle = {
  fontWeight: "900",
  color: "#c62828",
};

const alertDesc = {
  fontSize: "14px",
  color: "#555",
  marginBottom: "12px",
};

const primaryBtn = {
  padding: "10px 16px",
  background: "#2e7d32",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "800",
};

const formCard = {
  marginTop: "25px",
  background: "#fafafa",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #eee",
};

const gridForm = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const saveBtn = {
  width: "100%",
  marginTop: "16px",
  padding: "12px",
  background: "#2e7d32",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontWeight: "900",
  cursor: "pointer",
};

const cancelBtn = {
  width: "100%",
  marginTop: "10px",
  padding: "12px",
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: "10px",
  fontWeight: "800",
  cursor: "pointer",
};

const successBox = {
  background: "#e8f5e9",
  padding: "16px",
  borderRadius: "10px",
  border: "1px solid #a5d6a7",
};

export default Dashboard;



