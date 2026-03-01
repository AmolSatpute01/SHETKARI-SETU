import { useState } from "react";

function AddProduct({ onProductAdded }) {
  const farmer = JSON.parse(localStorage.getItem("farmer"));

  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    price: "",
    quantity: "",
    unit: "kg",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/products/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          farmerId: farmer.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFormData({
          productName: "",
          category: "",
          price: "",
          quantity: "",
          unit: "kg",
        });

        // ✅ safely call refresh
        if (onProductAdded) {
          onProductAdded();
        }
      } else {
        alert(data.message || "Failed to add product");
      }
    } catch (error) {
      alert("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: "30px" }}>
      <h2>Add Product</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          type="text"
          name="productName"
          placeholder="Product Name"
          value={formData.productName}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={formData.quantity}
          onChange={handleChange}
          required
        />

        <select name="unit" value={formData.unit} onChange={handleChange}>
          <option value="kg">kg</option>
          <option value="quintal">quintal</option>
          <option value="bag">bag</option>
          <option value="dozen">dozen</option>
          <option value="piece">piece</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}

export default AddProduct;