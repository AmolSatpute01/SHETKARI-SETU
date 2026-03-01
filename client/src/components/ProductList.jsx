import { useEffect, useState } from "react";

function ProductList() {
  const farmer = JSON.parse(localStorage.getItem("farmer"));
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ edit state
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    productName: "",
    category: "",
    price: "",
    quantity: "",
    unit: "kg",
  });

  // ✅ modal view image
  const [viewImage, setViewImage] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/products/${farmer.id}`);
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (error) {
      console.error("Error fetching products", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (farmer?.id) fetchProducts();
  }, [farmer?.id]);

  // ❌ DELETE PRODUCT
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    const res = await fetch(`http://localhost:5000/api/products/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (data.success) fetchProducts();
  };

  // ✏️ EDIT
  const handleEdit = (p) => {
    setEditId(p._id);
    setEditData({
      productName: p.productName,
      category: p.category,
      price: p.price,
      quantity: p.quantity,
      unit: p.unit || "kg",
    });
  };

  // 💾 UPDATE
  const handleUpdate = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/products/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      const data = await res.json();
      if (data.success) {
        setEditId(null);
        fetchProducts();
      } else {
        alert("Update failed");
      }
    } catch (err) {
      alert("Server error while updating");
    }
  };

  // ✅ TOGGLE AVAILABLE / OUT OF STOCK
  const handleToggle = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/products/toggle/${id}`, {
        method: "PUT",
      });

      const data = await res.json();

      if (data.success) {
        // ✅ update UI instantly
        setProducts((prev) =>
          prev.map((p) =>
            p._id === id ? { ...p, available: data.product.available } : p
          )
        );
      } else {
        alert(data.message || "Toggle failed");
      }
    } catch (error) {
      alert("Server error while toggling status");
    }
  };

  // ✅ UPLOAD IMAGE (ADD MORE)
  const handleImageUpload = async (productId, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(
        `http://localhost:5000/api/products/upload/${productId}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (data.success) {
        // ✅ update UI instantly
        setProducts((prev) =>
          prev.map((p) =>
            p._id === productId ? { ...p, images: data.images } : p
          )
        );
      } else {
        alert(data.message || "Image upload failed");
      }
    } catch (err) {
      alert("Server error while uploading image");
    }
  };

  // ✅ DELETE SINGLE IMAGE
  const handleDeleteImage = async (productId, imageUrl) => {
    const confirmDelete = window.confirm("Remove this photo?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/products/delete-image/${productId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p._id === productId ? { ...p, images: data.images } : p
          )
        );
        setViewImage(null);
      } else {
        alert(data.message || "Failed to delete image");
      }
    } catch (err) {
      alert("Server error while deleting image");
    }
  };

  if (loading) return <p>Loading products...</p>;
  if (products.length === 0) return <p>No products added yet.</p>;

  // ✅ GROUP BY CATEGORY
  const grouped = products.reduce((acc, p) => {
    const cat = p.category || "Other";
    acc[cat] = acc[cat] || [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div>
      {/* ✅ IMAGE VIEW MODAL */}
      {viewImage && (
        <div style={modalOverlay} onClick={() => setViewImage(null)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <img
              src={viewImage}
              alt="Full View"
              style={{
                width: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: "10px",
              }}
            />
            <button style={closeBtn} onClick={() => setViewImage(null)}>
              ✖ Close
            </button>
          </div>
        </div>
      )}

      {Object.keys(grouped).map((category) => (
        <div key={category} style={categoryBlock}>
          <h3 style={categoryHeader}>📦 {category.toUpperCase()}</h3>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Qty</th>
                <th style={{ ...thStyle, width: "320px", textAlign: "center" }}>
                  Images
                </th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>

            <tbody>
              {grouped[category].map((p) => (
                <tr key={p._id}>
                  {editId === p._id ? (
                    <>
                      <td style={tdStyle}>
                        <input
                          value={editData.productName}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              productName: e.target.value,
                            })
                          }
                          style={inputStyle}
                        />
                      </td>

                      <td style={tdStyle}>
                        <input
                          type="number"
                          value={editData.price}
                          onChange={(e) =>
                            setEditData({ ...editData, price: e.target.value })
                          }
                          style={inputStyle}
                        />
                      </td>

                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="number"
                            value={editData.quantity}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                quantity: e.target.value,
                              })
                            }
                            style={{ ...inputStyle, width: "80px" }}
                          />
                          <select
                            value={editData.unit}
                            onChange={(e) =>
                              setEditData({ ...editData, unit: e.target.value })
                            }
                            style={inputStyle}
                          >
                            <option value="kg">kg</option>
                            <option value="quintal">quintal</option>
                            <option value="bag">bag</option>
                            <option value="dozen">dozen</option>
                            <option value="piece">piece</option>
                          </select>
                        </div>
                      </td>

                      <td style={{ ...tdStyle, textAlign: "center" }}>—</td>

                      <td style={tdStyle}>
                        <button style={saveBtn} onClick={handleUpdate}>
                          💾 Save
                        </button>{" "}
                        <button
                          style={cancelBtn}
                          onClick={() => setEditId(null)}
                        >
                          ✖ Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={tdStyle}>{p.productName}</td>
                      <td style={tdStyle}>₹{p.price}</td>
                      <td style={tdStyle}>
                        {p.quantity} {p.unit}
                      </td>

                      {/* ✅ MULTI IMAGE UI */}
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <div style={imageBox}>
                          <div style={thumbRow}>
                            {(p.images || []).map((img, index) => {
                              const fullUrl = `http://localhost:5000${img}`;
                              return (
                                <div key={index} style={thumbWrap}>
                                  <img
                                    src={fullUrl}
                                    alt="product"
                                    style={thumbImg}
                                    onClick={() => setViewImage(fullUrl)}
                                  />
                                  <button
                                    style={thumbDeleteBtn}
                                    onClick={() =>
                                      handleDeleteImage(p._id, img)
                                    }
                                    title="Delete photo"
                                  >
                                    ✖
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* ✅ Add more images */}
                          <label style={addPhotoBtn}>
                            ➕ Add Photo
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={(e) =>
                                handleImageUpload(p._id, e.target.files[0])
                              }
                            />
                          </label>
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <button
                          style={statusBtn(p.available)}
                          onClick={() => handleToggle(p._id)}
                        >
                          {p.available ? "✅ Available" : "❌ Out"}
                        </button>

                        <button style={editBtn} onClick={() => handleEdit(p)}>
                          ✏️ Edit
                        </button>{" "}
                        <button
                          style={deleteBtn}
                          onClick={() => handleDelete(p._id)}
                        >
                          ❌ Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

/* ================= STYLES ================= */

const categoryBlock = {
  marginBottom: "30px",
  background: "#ffffff",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
};

const categoryHeader = {
  background: "#eef7ed",
  padding: "10px 15px",
  borderRadius: "6px",
  color: "#2e7d32",
  marginBottom: "15px",
  fontWeight: "700",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "2px solid #ddd",
  background: "#fafafa",
  fontWeight: "700",
};

const tdStyle = {
  padding: "14px 12px",
  borderBottom: "1px solid #e0e0e0",
  verticalAlign: "middle",
};

const inputStyle = {
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  outline: "none",
};

const statusBtn = (available) => ({
  background: available ? "#2e7d32" : "#9e9e9e",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "700",
  marginRight: "8px",
});

const editBtn = {
  background: "#ff9800",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
};

const deleteBtn = {
  background: "#c62828",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
};

const saveBtn = {
  background: "#2e7d32",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
};

const cancelBtn = {
  background: "#9e9e9e",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
};

const imageBox = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "10px",
  padding: "12px",
  borderRadius: "10px",
  background: "#f7faf7",
  border: "1px solid #e6efe5",
};

const thumbRow = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  justifyContent: "center",
};

const thumbWrap = {
  position: "relative",
};

const thumbImg = {
  width: "85px",
  height: "65px",
  objectFit: "cover",
  borderRadius: "10px",
  cursor: "pointer",
  border: "1px solid #ddd",
};

const thumbDeleteBtn = {
  position: "absolute",
  top: "-8px",
  right: "-8px",
  background: "#c62828",
  color: "#fff",
  border: "none",
  borderRadius: "50%",
  width: "22px",
  height: "22px",
  cursor: "pointer",
  fontSize: "12px",
};

const addPhotoBtn = {
  background: "#2e7d32",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "700",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  height: "100vh",
  width: "100vw",
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  padding: "20px",
};

const modalBox = {
  background: "#fff",
  padding: "16px",
  borderRadius: "12px",
  width: "100%",
  maxWidth: "700px",
  textAlign: "center",
};

const closeBtn = {
  marginTop: "12px",
  background: "#2e7d32",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "700",
};

export default ProductList;














