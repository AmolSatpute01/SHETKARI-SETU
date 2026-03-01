import { useState } from "react";

function Profile({ onClose, onLogout }) {
  const farmer = JSON.parse(localStorage.getItem("farmer"));

  const [isEdit, setIsEdit] = useState(false);

  // ✅ editable fields (show old data)
  const [formData, setFormData] = useState({
    taluka: farmer?.taluka || "",
    district: farmer?.district || "",
    state: farmer?.state || "",
  });

  // ✅ Save (local only)
  const handleSave = () => {
    const updatedFarmer = { ...farmer, ...formData };
    localStorage.setItem("farmer", JSON.stringify(updatedFarmer));
    setIsEdit(false);
    window.location.reload(); // ✅ refresh UI instantly
  };

  return (
    <div style={wrap}>
      {/* ✅ Close Button */}
      <button style={closeBtn} onClick={onClose}>
        ✖
      </button>

      {/* ✅ Header */}
      <div style={header}>
        <div style={avatarCircle}>👤</div>
        <div>
          <h2 style={name}>{farmer?.name || "Farmer"}</h2>
          <p style={phone}>📞 {farmer?.mobile}</p>
        </div>
      </div>

      <div style={divider}></div>

      {/* ✅ Info (VIEW MODE) */}
      {!isEdit ? (
        <div style={infoBox}>
          <div style={infoRow}>
            <span style={label}>Taluka</span>
            <span style={value}>{farmer?.taluka || "-"}</span>
          </div>

          <div style={infoRow}>
            <span style={label}>District</span>
            <span style={value}>{farmer?.district || "-"}</span>
          </div>

          <div style={infoRow}>
            <span style={label}>State</span>
            <span style={value}>{farmer?.state || "-"}</span>
          </div>

          {/* ✅ Edit Profile button */}
          <button style={editBtn} onClick={() => setIsEdit(true)}>
            ✏️ Edit Profile
          </button>

          {/* ✅ Logout 바로 아래 */}
          <button style={logoutBtn} onClick={onLogout}>
            Logout
          </button>
        </div>
      ) : (
        /* ✅ EDIT MODE */
        <div style={infoBox}>
          <div style={editBlock}>
            <label style={editLabel}>Taluka</label>
            <input
              style={input}
              value={formData.taluka}
              onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
            />
          </div>

          <div style={editBlock}>
            <label style={editLabel}>District</label>
            <input
              style={input}
              value={formData.district}
              onChange={(e) =>
                setFormData({ ...formData, district: e.target.value })
              }
            />
          </div>

          <div style={editBlock}>
            <label style={editLabel}>State</label>
            <input
              style={input}
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>

          <button style={saveBtn} onClick={handleSave}>
            ✅ Save
          </button>

          <button style={cancelBtn} onClick={() => setIsEdit(false)}>
            ✖ Cancel
          </button>
        </div>
      )}
    </div>
  );
}

/* ===================== STYLES ===================== */

const wrap = {
  width: "360px",
  background: "#fff",
  padding: "20px",
  borderRadius: "0px",
  position: "relative",

  // ✅ IMPORTANT: remove full height so blank white goes away
  height: "fit-content",
  minHeight: "unset",
};

const closeBtn = {
  position: "absolute",
  top: "12px",
  right: "12px",
  border: "none",
  background: "#f1f1f1",
  borderRadius: "50%",
  width: "36px",
  height: "36px",
  cursor: "pointer",
  fontSize: "16px",
};

const header = {
  display: "flex",
  gap: "12px",
  alignItems: "center",
};

const avatarCircle = {
  width: "62px",
  height: "62px",
  borderRadius: "50%",
  background: "#e8f5e9",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "28px",
  border: "2px solid #2e7d32",
};

const name = {
  margin: 0,
  fontSize: "22px",
  fontWeight: "800",
  color: "#222",
};

const phone = {
  margin: "6px 0 0",
  color: "#444",
  fontSize: "15px",
};

const divider = {
  margin: "16px 0",
  height: "1px",
  background: "#eee",
};

const infoBox = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const infoRow = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const label = {
  fontSize: "14px",
  color: "#666",
  fontWeight: "700",
};

const value = {
  fontSize: "16px",
  color: "#222",
  fontWeight: "700",
  textTransform: "capitalize",
};

const editBtn = {
  marginTop: "8px",
  background: "#2e7d32",
  color: "#fff",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  fontWeight: "800",
  fontSize: "15px",
};

const logoutBtn = {
  background: "#ffffff",
  border: "1px solid #ddd",
  padding: "12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "800",
  fontSize: "15px",
  marginTop: "0px",
};

const editBlock = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const editLabel = {
  fontSize: "14px",
  color: "#555",
  fontWeight: "700",
};

const input = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  outline: "none",
  fontSize: "14px",
};

const saveBtn = {
  background: "#2e7d32",
  color: "#fff",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  fontWeight: "800",
  fontSize: "15px",
};

const cancelBtn = {
  background: "#f1f1f1",
  color: "#333",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  fontWeight: "800",
  fontSize: "15px",
};

export default Profile;








