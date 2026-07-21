import React, { useState, useEffect, useMemo } from "react";
import {
  MdInventory2,
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
} from "react-icons/md";
import Modal from "../components/Modal";
import { sparePartsApi } from "../utils/api";

const statusClass = {
  "In Stock": "d_success",
  "Low Stock": "d_warning",
  "Out of Stock": "d_danger",
};
const blank = {
  name: "",
  cat: "",
  brand: "",
  model: "",
  stock: "",
  minStock: "",
  price: "",
  status: "In Stock",
};

const SpareParts = ({ defaultTab = "parts" }) => {
  const [tab, setTab] = useState(defaultTab);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const fetchParts = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: list } = await sparePartsApi.getAll();
      setData(list);
    } catch (err) {
      setError(err.displayMessage || "Failed to load spare parts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParts(); }, []);

  const derivedCategories = useMemo(() => {
    const map = {};
    data.forEach(p => {
      if (!p.category) return;
      if (!map[p.category]) map[p.category] = { id: `CAT-${p.category}`, name: p.category, parts: 0, description: `Parts in ${p.category}`, status: 'Active' };
      map[p.category].parts++;
    });
    return Object.values(map);
  }, [data]);

  const derivedBrands = useMemo(() => {
    const map = {};
    data.forEach(p => {
      if (!p.brand) return;
      if (!map[p.brand]) map[p.brand] = { id: `BRD-${p.brand}`, name: p.brand, country: '-', parts: 0, contact: '-', status: 'Active' };
      map[p.brand].parts++;
    });
    return Object.values(map);
  }, [data]);

  const derivedModels = useMemo(() => {
    const map = {};
    data.forEach(p => {
      (p.compatibility || []).forEach(m => {
        if (!map[m]) map[m] = { id: `MDL-${m}`, model: m, brand: p.brand || '-', type: p.category || '-', parts: 0, year: '-', status: 'Active' };
        map[m].parts++;
      });
      if (p.model && !map[p.model]) {
        map[p.model] = { id: `MDL-${p.model}`, model: p.model, brand: p.brand || '-', type: p.category || '-', parts: 1, year: '-', status: 'Active' };
      }
    });
    return Object.values(map);
  }, [data]);

  const filtered = data.filter(
    (p) =>
      (p.partName || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.partNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setForm(blank);
    setEditId(null);
    setErrors({});
    setModal(true);
  };
  const openEdit = (part) => {
    setForm({
      name: part.partName,
      cat: part.category,
      brand: part.brand || "",
      model: (part.compatibility || []).join(", "),
      stock: part.quantity,
      minStock: part.minimumStock,
      price: part.unitPrice,
      status: part.status,
    });
    setEditId(part._id);
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Part name is required";
    if (!form.cat.trim()) e.cat = "Category is required";
    if (!form.brand.trim()) e.brand = "Brand is required";
    if (!form.price) e.price = "Unit price is required";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    const stock = parseInt(form.stock) || 0;
    const minStock = parseInt(form.minStock) || 0;
    const price = parseFloat(form.price) || 0;
    const payload = {
      partName: form.name,
      category: form.cat,
      brand: form.brand,
      compatibility: form.model ? form.model.split(",").map((s) => s.trim()) : [],
      quantity: stock,
      minimumStock: minStock,
      unitPrice: price,
      sellingPrice: price,
    };
    try {
      if (editId) {
        await sparePartsApi.update(editId, payload);
      } else {
        payload.partNumber = `AJ-${form.cat.toUpperCase().slice(0, 2)}-${String(data.length + 1).padStart(3, "0")}`;
        await sparePartsApi.create(payload);
      }
      setModal(false);
      fetchParts();
    } catch (err) {
      setError(err.displayMessage || "Failed to save spare part");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this part?")) return;
    try {
      await sparePartsApi.remove(id);
      fetchParts();
    } catch (err) {
      setError(err.displayMessage || "Failed to delete spare part");
    }
  };

  const f = (field) => ({
    value: form[field],
    onChange: (e) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      setErrors((p) => ({ ...p, [field]: "" }));
    },
  });

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Spare Parts Inventory</h1>
          <p className="d_page_subtitle">
            Manage parts, categories, brands and compatibility
          </p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}>
          <MdAdd /> Add Part
        </button>
      </div>

      <div className="d_tabs mb-3">
        {[
          ["parts", "Part Number"],
          ["category", "Category"],
          ["brand", "Brand"],
          ["models", "Compatible Models"],
        ].map(([k, v]) => (
          <button
            key={k}
            className={`d_tab_btn ${tab === k ? "d_active" : ""}`}
            onClick={() => setTab(k)}
          >
            {v}
          </button>
        ))}
      </div>

      {tab === "parts" && (
        <div className="d_card">
          <div className="d_card_header flex-wrap gap-2">
            <h2 className="d_card_title">
              <MdInventory2 className="d_card_icon" /> Spare Parts (
              {filtered.length})
            </h2>
            <div className="d_search_box">
              <MdSearch className="d_search_icon" />
              <input
                className="d_search_input"
                placeholder="Search parts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="d_card_body p-0">
            {error && <div className="alert alert-danger m-3">{error}</div>}
            {loading ? (
              <div className="text-center py-4">Loading spare parts…</div>
            ) : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Part No.</th>
                    <th>Part Name</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Models</th>
                    <th>Stock</th>
                    <th>Min</th>
                    <th>Price (₹)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr className="d_empty">
                      <td colSpan={10} className="text-center py-4">
                        <svg
                          width="120"
                          height="120"
                          viewBox="0 0 200 200"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect
                            x="20"
                            y="40"
                            width="160"
                            height="120"
                            rx="16"
                            fill="#F5F7FB"
                          />
                          <rect
                            x="50"
                            y="70"
                            width="100"
                            height="60"
                            rx="12"
                            fill="#ffffff"
                            stroke="#D3D8E6"
                            strokeWidth="2"
                          />
                          <path
                            d="M70 95h60"
                            stroke="#D3D8E6"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M70 110h40"
                            stroke="#D3D8E6"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <circle cx="135" cy="115" r="12" fill="#4F8DFD" />
                          <line
                            x1="143"
                            y1="123"
                            x2="152"
                            y2="132"
                            stroke="#4F8DFD"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>

                        <div className="mt-2">No parts found.</div>
                      </td>
                    </tr>
                  )}
                  {filtered.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <code>{p.partNumber}</code>
                      </td>
                      <td>
                        <strong>{p.partName}</strong>
                      </td>
                      <td>{p.category}</td>
                      <td>{p.brand}</td>
                      <td
                        style={{
                          maxWidth: 140,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {(p.compatibility || []).join(", ")}
                      </td>
                      <td>
                        <strong>{p.quantity}</strong>
                      </td>
                      <td>{p.minimumStock}</td>
                      <td>{(p.unitPrice || 0).toLocaleString()}</td>
                      <td>
                        <span className={`d_badge ${statusClass[p.status] || 'd_info'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <div className="d_action_btns">
                          <button
                            className="d_icon_btn d_edit"
                            onClick={() => openEdit(p)}
                          >
                            <MdEdit />
                          </button>
                          <button
                            className="d_icon_btn d_del"
                            onClick={() => handleDelete(p._id)}
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>
      )}

      {tab === "category" && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title">
              <MdInventory2 className="d_card_icon" /> Categories (
              {derivedCategories.length})
            </h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Cat ID</th>
                    <th>Category Name</th>
                    <th>No. of Parts</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {derivedCategories.length === 0 && <tr className="d_empty"><td colSpan={5}>No categories yet. Add spare parts to see categories.</td></tr>}
                  {derivedCategories.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <code>{c.id}</code>
                      </td>
                      <td>
                        <strong>{c.name}</strong>
                      </td>
                      <td>
                        <span className="d_badge d_info">{c.parts}</span>
                      </td>
                      <td>{c.description}</td>
                      <td>
                        <span className="d_badge d_success">{c.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "brand" && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title">
              <MdInventory2 className="d_card_icon" /> Brands (
              {derivedBrands.length})
            </h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Brand ID</th>
                    <th>Brand Name</th>
                    <th>Country</th>
                    <th>Parts</th>
                    <th>Contact</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {derivedBrands.length === 0 && <tr className="d_empty"><td colSpan={6}>No brands yet.</td></tr>}
                  {derivedBrands.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <code>{b.id}</code>
                      </td>
                      <td>
                        <strong>{b.name}</strong>
                      </td>
                      <td>{b.country}</td>
                      <td>
                        <span className="d_badge d_info">{b.parts}</span>
                      </td>
                      <td>{b.contact}</td>
                      <td>
                        <span className="d_badge d_success">{b.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "models" && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title">
              <MdInventory2 className="d_card_icon" /> Compatible Machine Models
              ({derivedModels.length})
            </h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Model ID</th>
                    <th>Model</th>
                    <th>Brand</th>
                    <th>Type</th>
                    <th>Compatible Parts</th>
                    <th>Year Range</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {derivedModels.length === 0 && <tr className="d_empty"><td colSpan={7}>No models yet.</td></tr>}
                  {derivedModels.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <code>{m.id}</code>
                      </td>
                      <td>
                        <strong>{m.model}</strong>
                      </td>
                      <td>{m.brand}</td>
                      <td>{m.type}</td>
                      <td>
                        <span className="d_badge d_info">{m.parts}</span>
                      </td>
                      <td>{m.year}</td>
                      <td>
                        <span className="d_badge d_success">{m.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? "Edit Spare Part" : "Add Spare Part"}
        size="lg"
      >
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">
              Part Name <span className="d_req">*</span>
            </label>
            <input
              className="d_form_control"
              placeholder="e.g. Reed Valve Assembly"
              {...f("name")}
            />
            {errors.name && (
              <span style={{ color: "var(--d-danger)", fontSize: 12 }}>
                {errors.name}
              </span>
            )}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">
              Category <span className="d_req">*</span>
            </label>
            <input
              className="d_form_control"
              placeholder="e.g. Valve, Nozzle, Sensor"
              {...f("cat")}
            />
            {errors.cat && (
              <span style={{ color: "var(--d-danger)", fontSize: 12 }}>
                {errors.cat}
              </span>
            )}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">
              Brand <span className="d_req">*</span>
            </label>
            <input
              className="d_form_control"
              placeholder="e.g. SKF, AirTex"
              {...f("brand")}
            />
            {errors.brand && (
              <span style={{ color: "var(--d-danger)", fontSize: 12 }}>
                {errors.brand}
              </span>
            )}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Compatible Models</label>
            <input
              className="d_form_control"
              placeholder="e.g. AT-200, AT-300"
              {...f("model")}
            />
          </div>
        </div>
        <div className="d_form_row cols-3">
          <div className="d_form_group">
            <label className="d_form_label">Current Stock</label>
            <input
              type="number"
              className="d_form_control"
              placeholder="0"
              {...f("stock")}
            />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Min. Stock</label>
            <input
              type="number"
              className="d_form_control"
              placeholder="0"
              {...f("minStock")}
            />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">
              Unit Price (₹) <span className="d_req">*</span>
            </label>
            <input
              type="number"
              className="d_form_control"
              placeholder="e.g. 500"
              {...f("price")}
            />
            {errors.price && (
              <span style={{ color: "var(--d-danger)", fontSize: 12 }}>
                {errors.price}
              </span>
            )}
          </div>
        </div>
        <div className="d_form_actions">
          <button
            className="d_btn d_btn_outline"
            onClick={() => setModal(false)}
          >
            Cancel
          </button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>
            {editId ? "Update Part" : "Save Part"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SpareParts;
