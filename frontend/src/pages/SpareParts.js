import React, { useState } from "react";
import {
  MdInventory2,
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
} from "react-icons/md";
import Modal from "../components/Modal";

const initData = [
  {
    id: "AJ-RV-001",
    name: "Reed Valve Assembly",
    cat: "Valve",
    brand: "AirTex",
    model: "AT-200, AT-300",
    stock: 142,
    minStock: 20,
    price: 500,
    status: "In Stock",
  },
  {
    id: "AJ-NZ-012",
    name: "Air Jet Nozzle Set",
    cat: "Nozzle",
    brand: "JetPro",
    model: "JP-100, JP-150",
    stock: 8,
    minStock: 15,
    price: 850,
    status: "Low Stock",
  },
  {
    id: "AJ-WD-034",
    name: "Weft Detector Sensor",
    cat: "Sensor",
    brand: "SenseTech",
    model: "ST-400, ST-500",
    stock: 97,
    minStock: 10,
    price: 1200,
    status: "In Stock",
  },
  {
    id: "AJ-SB-007",
    name: "Main Shaft Bearing",
    cat: "Bearing",
    brand: "SKF",
    model: "All Models",
    stock: 84,
    minStock: 25,
    price: 2500,
    status: "In Stock",
  },
  {
    id: "AJ-SC-021",
    name: "Selvage Cutter Blade",
    cat: "Blade",
    brand: "CutMaster",
    model: "CM-200, CM-250",
    stock: 0,
    minStock: 30,
    price: 350,
    status: "Out of Stock",
  },
  {
    id: "AJ-LM-018",
    name: "Loom Motor 2.2kW",
    cat: "Motor",
    brand: "Siemens",
    model: "Universal",
    stock: 12,
    minStock: 5,
    price: 8500,
    status: "In Stock",
  },
];

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

const initCategories = [
  {
    id: "CAT001",
    name: "Valve",
    parts: 12,
    description: "Air and reed valves for loom machines",
    status: "Active",
  },
  {
    id: "CAT002",
    name: "Nozzle",
    parts: 8,
    description: "Air jet nozzles and nozzle sets",
    status: "Active",
  },
  {
    id: "CAT003",
    name: "Sensor",
    parts: 15,
    description: "Weft and warp detection sensors",
    status: "Active",
  },
  {
    id: "CAT004",
    name: "Bearing",
    parts: 20,
    description: "Main shaft and auxiliary bearings",
    status: "Active",
  },
  {
    id: "CAT005",
    name: "Motor",
    parts: 6,
    description: "Loom drive and auxiliary motors",
    status: "Active",
  },
];

const initBrands = [
  {
    id: "BRD001",
    name: "AirTex",
    country: "India",
    parts: 18,
    contact: "airtex@parts.com",
    status: "Active",
  },
  {
    id: "BRD002",
    name: "JetPro",
    country: "Germany",
    parts: 14,
    contact: "info@jetpro.de",
    status: "Active",
  },
  {
    id: "BRD003",
    name: "SenseTech",
    country: "Japan",
    parts: 22,
    contact: "sales@sensetech.jp",
    status: "Active",
  },
  {
    id: "BRD004",
    name: "SKF",
    country: "Sweden",
    parts: 30,
    contact: "skf@bearings.com",
    status: "Active",
  },
  {
    id: "BRD005",
    name: "Siemens",
    country: "Germany",
    parts: 10,
    contact: "motors@siemens.com",
    status: "Active",
  },
];

const initModels = [
  {
    id: "MDL001",
    model: "AT-200",
    brand: "AirTex",
    type: "Air Jet Loom",
    parts: 24,
    year: "2018-2022",
    status: "Active",
  },
  {
    id: "MDL002",
    model: "AT-300",
    brand: "AirTex",
    type: "Air Jet Loom",
    parts: 28,
    year: "2020-2026",
    status: "Active",
  },
  {
    id: "MDL003",
    model: "JP-100",
    brand: "JetPro",
    type: "Air Jet Loom",
    parts: 19,
    year: "2016-2020",
    status: "Active",
  },
  {
    id: "MDL004",
    model: "ST-400",
    brand: "SenseTech",
    type: "Rapier Loom",
    parts: 12,
    year: "2019-2024",
    status: "Active",
  },
];

const SpareParts = ({ defaultTab = "parts" }) => {
  const [tab, setTab] = useState(defaultTab);
  const [data, setData] = useState(initData);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const filtered = data.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.cat.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setForm(blank);
    setEditId(null);
    setErrors({});
    setModal(true);
  };
  const openEdit = (part) => {
    setForm({
      name: part.name,
      cat: part.cat,
      brand: part.brand,
      model: part.model,
      stock: part.stock,
      minStock: part.minStock,
      price: part.price,
      status: part.status,
    });
    setEditId(part.id);
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

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    const stock = parseInt(form.stock) || 0;
    const minStock = parseInt(form.minStock) || 0;
    const price = parseFloat(form.price) || 0;
    const status =
      stock === 0
        ? "Out of Stock"
        : stock < minStock
          ? "Low Stock"
          : "In Stock";
    if (editId) {
      setData((d) =>
        d.map((p) =>
          p.id === editId
            ? { ...p, ...form, stock, minStock, price, status }
            : p,
        ),
      );
    } else {
      const newId = `AJ-${form.cat.toUpperCase().slice(0, 2)}-${String(data.length + 1).padStart(3, "0")}`;
      setData((d) => [
        ...d,
        { id: newId, ...form, stock, minStock, price, status },
      ]);
    }
    setModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this part?"))
      setData((d) => d.filter((p) => p.id !== id));
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
                    <tr key={p.id}>
                      <td>
                        <code>{p.id}</code>
                      </td>
                      <td>
                        <strong>{p.name}</strong>
                      </td>
                      <td>{p.cat}</td>
                      <td>{p.brand}</td>
                      <td
                        style={{
                          maxWidth: 140,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.model}
                      </td>
                      <td>
                        <strong>{p.stock}</strong>
                      </td>
                      <td>{p.minStock}</td>
                      <td>{p.price.toLocaleString()}</td>
                      <td>
                        <span className={`d_badge ${statusClass[p.status]}`}>
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
                            onClick={() => handleDelete(p.id)}
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
          </div>
        </div>
      )}

      {tab === "category" && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title">
              <MdInventory2 className="d_card_icon" /> Categories (
              {initCategories.length})
            </h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}>
              <MdAdd /> Add Category
            </button>
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
                  {initCategories.map((c) => (
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
              {initBrands.length})
            </h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}>
              <MdAdd /> Add Brand
            </button>
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
                  {initBrands.map((b) => (
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
              ({initModels.length})
            </h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}>
              <MdAdd /> Add Model
            </button>
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
                  {initModels.map((m) => (
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
