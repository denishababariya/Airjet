import React, { useState, useEffect } from "react";
import {
  MdAccountBalance,
  MdAdd,
  MdEdit,
  MdDelete,
} from "react-icons/md";
import Modal from "../components/Modal";
import { accountsApi, erpApi } from "../utils/api";
import { V, validate as validateFields } from '../utils/validators';

const statusClass = {
  Pending: "d_warning",
  Overdue: "d_danger",
  Received: "d_success",
  Paid: "d_success",
  Filed: "d_success",
};

const tabConfig = {
  receivables: {
    label: "Receivables",
    menuLabel: "Receivables",
    apiType: "receivable",
    apiModule: "accounts",
    fields: [
      { key: "party", label: "Party Name", type: "text", required: true, placeholder: "Customer / Supplier name" },
      { key: "type", label: "Transaction Type", type: "select", options: ["Invoice", "Purchase Order", "Advance", "Credit Note", "Debit Note"], default: "Invoice" },
      { key: "amount", label: "Amount (₹)", type: "number", required: true, placeholder: "e.g. 25000" },
      { key: "dueDate", label: "Due Date", type: "date", required: true },
      { key: "status", label: "Status", type: "select", options: ["Pending", "Received", "Overdue"], default: "Pending" },
      { key: "notes", label: "Notes", type: "text", placeholder: "Optional notes" },
    ],
    tableColumns: [
      { key: "id", label: "ID", render: (val) => <code>{val}</code> },
      { key: "party", label: "Party", render: (val) => <strong>{val}</strong> },
      { key: "type", label: "Type" },
      { key: "amount", label: "Amount (₹)", render: (val) => <strong>₹{(val ?? 0).toLocaleString()}</strong> },
      { key: "dueDate", label: "Due Date", render: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '-' },
      { key: "status", label: "Status", render: (val) => <span className={`d_badge ${statusClass[val]}`}>{val}</span> },
    ],
    getBlank: () => ({ party: "", type: "Invoice", amount: "", dueDate: "", status: "Pending", notes: "" }),
    validate: (form) => validateFields({
      party: V.required(form.party, 'Party name'),
      amount: V.amount(form.amount, 'Amount'),
      dueDate: V.date(form.dueDate, 'Due date'),
    }),
    preparePayload: (form) => ({ ...form, amount: parseFloat(String(form.amount).replace(/[^\d.]/g, "")) || 0 }),
  },
  payables: {
    label: "Payables",
    menuLabel: "Payables",
    apiType: "payable",
    apiModule: "accounts",
    fields: [
      { key: "party", label: "Party Name", type: "text", required: true, placeholder: "Customer / Supplier name" },
      { key: "type", label: "Transaction Type", type: "select", options: ["Invoice", "Purchase Order", "Advance", "Credit Note", "Debit Note"], default: "Purchase Order" },
      { key: "amount", label: "Amount (₹)", type: "number", required: true, placeholder: "e.g. 25000" },
      { key: "dueDate", label: "Due Date", type: "date", required: true },
      { key: "status", label: "Status", type: "select", options: ["Pending", "Paid", "Overdue"], default: "Pending" },
      { key: "notes", label: "Notes", type: "text", placeholder: "Optional notes" },
    ],
    tableColumns: [
      { key: "id", label: "ID", render: (val) => <code>{val}</code> },
      { key: "party", label: "Party", render: (val) => <strong>{val}</strong> },
      { key: "type", label: "Type" },
      { key: "amount", label: "Amount (₹)", render: (val) => <strong>₹{(val ?? 0).toLocaleString()}</strong> },
      { key: "dueDate", label: "Due Date", render: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '-' },
      { key: "status", label: "Status", render: (val) => <span className={`d_badge ${statusClass[val]}`}>{val}</span> },
    ],
    getBlank: () => ({ party: "", type: "Purchase Order", amount: "", dueDate: "", status: "Pending", notes: "" }),
    validate: (form) => validateFields({
      party: V.required(form.party, 'Party name'),
      amount: V.amount(form.amount, 'Amount'),
      dueDate: V.date(form.dueDate, 'Due date'),
    }),
    preparePayload: (form) => ({ ...form, amount: parseFloat(String(form.amount).replace(/[^\d.]/g, "")) || 0 }),
  },
  ledger: {
    label: "Ledger",
    menuLabel: "Ledger",
    apiType: "ledger",
    apiModule: "erp",
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "party", label: "Party", type: "text" },
      { key: "type", label: "Type", type: "select", options: ["Sales Invoice", "Purchase Payment", "Cash Receipt", "Bank Transfer"], default: "Sales Invoice" },
      { key: "notes", label: "Narration", type: "text" },
      { key: "debit", label: "Debit (₹)", type: "number" },
      { key: "credit", label: "Credit (₹)", type: "number" },
    ],
    tableColumns: [
      { key: "id", label: "ID", render: (val) => <code>{val}</code> },
      { key: "date", label: "Date", render: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '-' },
      { key: "party", label: "Party", render: (val) => <strong>{val}</strong> },
      { key: "type", label: "Type" },
      { key: "debit", label: "Debit (₹)", render: (val) => val > 0 ? <span style={{ color: "var(--d-danger)" }}>{val.toLocaleString()}</span> : "--" },
      { key: "credit", label: "Credit (₹)", render: (val) => val > 0 ? <span style={{ color: "var(--d-success)" }}>{val.toLocaleString()}</span> : "--" },
      { key: "balance", label: "Balance (₹)", render: (val) => <strong style={{ color: val >= 0 ? "var(--d-success)" : "var(--d-danger)" }}>{Math.abs(val || 0).toLocaleString()}</strong> },
      { key: "notes", label: "Narration", render: (val) => val || '-' },
    ],
    getBlank: () => ({ date: "", party: "", type: "Sales Invoice", debit: "", credit: "", notes: "" }),
    validate: (form) => validateFields({
      date: V.date(form.date, 'Date'),
      party: V.required(form.party, 'Party'),
      debit: form.debit !== '' ? V.optionalAmount(form.debit, 'Debit') : '',
      credit: form.credit !== '' ? V.optionalAmount(form.credit, 'Credit') : '',
    }),
    preparePayload: (form) => {
      const debit = parseFloat(String(form.debit).replace(/[^\d.]/g, "")) || 0;
      const credit = parseFloat(String(form.credit).replace(/[^\d.]/g, "")) || 0;
      return { ...form, debit, credit, balance: credit - debit };
    },
  },
  gst: {
    label: "GST Reports",
    menuLabel: "GST Reports",
    apiType: "gst",
    apiModule: "erp",
    fields: [
      { key: "month", label: "Month", type: "text", placeholder: "e.g. Jun 2026" },
      { key: "taxable", label: "Taxable Amount", type: "text" },
      { key: "cgst", label: "CGST", type: "text" },
      { key: "sgst", label: "SGST", type: "text" },
      { key: "igst", label: "IGST", type: "text" },
      { key: "gstAmount", label: "Total Tax", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["Pending", "Filed"], default: "Pending" },
    ],
    tableColumns: [
      { key: "id", label: "ID", render: (val) => <code>{val}</code> },
      { key: "month", label: "Month", render: (val) => <strong>{val}</strong> },
      { key: "taxable", label: "Taxable Amount" },
      { key: "cgst", label: "CGST" },
      { key: "sgst", label: "SGST" },
      { key: "igst", label: "IGST" },
      { key: "gstAmount", label: "Total Tax", render: (val) => <strong>{val ?? 0}</strong> },
      { key: "status", label: "Status", render: (val) => <span className={`d_badge ${val === "Filed" ? "d_success" : "d_warning"}`}>{val}</span> },
    ],
    getBlank: () => ({ month: "", taxable: "", cgst: "", sgst: "", igst: "", gstAmount: "", status: "Pending" }),
    validate: (form) => validateFields({
      month: V.required(form.month, 'Month'),
      taxable: V.amount(form.taxable, 'Taxable amount'),
      cgst: V.amount(form.cgst, 'CGST'),
      sgst: V.amount(form.sgst, 'SGST'),
      igst: V.amount(form.igst, 'IGST'),
      gstAmount: V.amount(form.gstAmount, 'Total tax'),
    }),
    preparePayload: (form) => form,
  },
  pl: {
    label: "Profit & Loss",
    menuLabel: "Profit & Loss",
    apiType: "pl",
    apiModule: "erp",
    fields: [
      { key: "entityType", label: "Type", type: "select", options: ["Revenue", "Expense", "Profit"], default: "Revenue" },
      { key: "period", label: "Period", type: "text", placeholder: "e.g. Jun 2026" },
      { key: "notes", label: "Notes", type: "text", placeholder: "Optional entry details" },
      { key: "revenue", label: "Revenue", type: "number" },
      { key: "expenses", label: "Expenses", type: "number" },
      { key: "profit", label: "Profit", type: "number" },
    ],
    formLayout: "cols-3", // Special layout for PL tab
    formFieldGroups: [
      ["entityType", "period"],
      ["notes"],
      ["revenue", "expenses", "profit"],
    ],
    tableColumns: [
      { key: "id", label: "ID", render: (val) => <code>{val}</code> },
      { key: "period", label: "Period", render: (val) => val || '-' },
      { key: "entityType", label: "Type", render: (val) => <span className={`d_badge ${val === "Revenue" ? "d_success" : val === "Profit" ? "d_info" : "d_danger"}`}>{val}</span> },
      { key: "notes", label: "Notes", render: (val) => <strong>{val || '-'}</strong> },
      { key: "revenue", label: "Revenue", render: (val) => val ?? 0 },
      { key: "expenses", label: "Expenses", render: (val) => val ?? 0 },
      { key: "profit", label: "Profit", render: (val) => val ?? 0 },
    ],
    getBlank: () => ({ period: "", entityType: "Revenue", notes: "", revenue: "", expenses: "", profit: "" }),
    validate: (form) => validateFields({ period: V.required(form.period, 'Period') }),
    preparePayload: (form) => ({ ...form, revenue: Number(form.revenue) || 0, expenses: Number(form.expenses) || 0, profit: Number(form.profit) || 0 }),
  },
};

const Accounts = ({ defaultTab = "receivables", setActiveMenu }) => {
  const [tab, setTab] = useState(defaultTab);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const currentConfig = tabConfig[tab];

  const fetchData = async () => {
    const promises = Object.entries(tabConfig).map(async ([key, config]) => {
      try {
        const api = config.apiModule === "accounts" ? accountsApi : erpApi;
        const { data: result } = await api.getAll(config.apiModule, config.apiType);
        return { key, data: result };
      } catch (err) {
        return { key, error: err.displayMessage || `Failed to load ${config.label}` };
      }
    });

    const results = await Promise.all(promises);
    const newData = {};
    results.forEach(({ key, data: result, error: err }) => {
      if (err) setError(err);
      else newData[key] = result;
    });
    setData(newData);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      await fetchData();
      setLoading(false);
    };
    load();
  }, []);

  const openAdd = () => {
    setForm(currentConfig.getBlank());
    setEditId(null);
    setErrors({});
    setModal(true);
  };

  const openEdit = (row) => {
    const editedForm = {};
    currentConfig.fields.forEach(field => {
      if (field.key === "date" && row[field.key]) {
        editedForm[field.key] = row[field.key].split("T")[0];
      } else {
        editedForm[field.key] = row[field.key] ?? field.default ?? "";
      }
    });
    setForm(editedForm);
    setEditId(row._id);
    setErrors({});
    setModal(true);
  };

  const handleSave = async () => {
    const validationErrors = currentConfig.validate(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    try {
      const payload = {
        module: currentConfig.apiModule,
        recordType: currentConfig.apiType,
        ...currentConfig.preparePayload(form),
      };
      if (editId) await erpApi.update(editId, payload);
      else await erpApi.create(payload);
      await fetchData();
      setModal(false);
    } catch (err) {
      setError(err.displayMessage || "Failed to save");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await erpApi.remove(id);
      await fetchData();
    } catch (err) {
      setError(err.displayMessage || "Failed to delete");
    }
  };

  const f = (field) => ({
    value: form[field] ?? "",
    onChange: (e) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      setErrors((p) => ({ ...p, [field]: "" }));
    },
  });

  const totalRcv = (data.receivables || []).reduce((s, r) => s + (r.amount || 0), 0);
  const totalPay = (data.payables || []).reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Accounts & GST</h1>
          <p className="d_page_subtitle">
            Manage receivables, payables, ledger and GST reports
          </p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}>
          <MdAdd /> Add Entry
        </button>
      </div>

      {error && <div className="alert alert-danger m-3">{error}</div>}
      {loading && <div className="text-center py-3">Loading accounts…</div>}

      {/* Summary */}
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3">
          <div
            className="d_stat_card"
            style={{ borderLeftColor: "var(--d-success)" }}
          >
            <div className="d_stat_value">₹{totalRcv.toLocaleString()}</div>
            <div className="d_stat_label">Total Receivables</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="d_stat_card"
            style={{ borderLeftColor: "var(--d-danger)" }}
          >
            <div className="d_stat_value">₹{totalPay.toLocaleString()}</div>
            <div className="d_stat_label">Total Payables</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="d_stat_card"
            style={{ borderLeftColor: "var(--d-accent)" }}
          >
            <div className="d_stat_value">
              ₹{Math.abs(totalRcv - totalPay).toLocaleString()}
            </div>
            <div className="d_stat_label">
              Net {totalRcv >= totalPay ? "Receivable" : "Payable"}
            </div>
          </div>
        </div>
      </div>

      <div className="d_tabs mb-3">
        {Object.entries(tabConfig).map(([key, config]) => (
          <button
            key={key}
            className={`d_tab_btn ${tab === key ? "d_active" : ""}`}
            onClick={() => {
              setTab(key);
              if (setActiveMenu) {
                setActiveMenu(config.menuLabel);
              }
            }}
          >
            {config.label}
          </button>
        ))}
      </div>

      {currentConfig && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title">
              <MdAccountBalance className="d_card_icon" /> {currentConfig.label} (
              {(data[tab] || []).length})
            </h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    {currentConfig.tableColumns.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data[tab] || []).length === 0 && (
                    <tr className="d_empty">
                      <td colSpan={currentConfig.tableColumns.length + 1} className="text-center py-4">
                        No {currentConfig.label.toLowerCase()} found.
                      </td>
                    </tr>
                  )}
                  {(data[tab] || []).map((row) => (
                    <tr 
                      key={row._id}
                      style={
                        tab === "pl" && row.entityType === "Profit"
                          ? { fontWeight: 700, background: "#f0f9ff" }
                          : {}
                      }
                    >
                      {currentConfig.tableColumns.map((col) => (
                        <td key={col.key}>
                          {col.render ? col.render(row[col.key]) : row[col.key]}
                        </td>
                      ))}
                      <td>
                        <div className="d_action_btns">
                          <button
                            className="d_icon_btn d_edit"
                            onClick={() => openEdit(row)}
                          >
                            <MdEdit />
                          </button>
                          <button
                            className="d_icon_btn d_del"
                            onClick={() => handleDelete(row._id)}
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

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? "Edit Entry" : `Add ${tab === "pl" ? "P&L Entry" : currentConfig.label.slice(0, -1)}`}
        size="md"
      >
        {currentConfig.formFieldGroups ? (
          currentConfig.formFieldGroups.map((group, groupIndex) => (
            <div key={groupIndex} className={`d_form_row ${currentConfig.formLayout || "cols-2"}`}>
              {group.map((fieldKey) => {
                const field = currentConfig.fields.find(f => f.key === fieldKey);
                if (!field) return null;
                return (
                  <div key={field.key} className="d_form_group">
                    <label className="d_form_label">
                      {field.label}
                      {field.required && <span className="d_req">*</span>}
                    </label>
                    {field.type === "select" ? (
                      <select className="d_form_control" {...f(field.key)}>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        className="d_form_control"
                        placeholder={field.placeholder || ""}
                        {...f(field.key)}
                      />
                    )}
                    {errors[field.key] && (
                      <span style={{ color: "var(--d-danger)", fontSize: 12 }}>
                        {errors[field.key]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          currentConfig.fields.map((field, index) => {
            if (index % 2 === 0) {
              const nextField = currentConfig.fields[index + 1];
              return (
                <div key={field.key} className="d_form_row cols-2">
                  <div className="d_form_group">
                    <label className="d_form_label">
                      {field.label}
                      {field.required && <span className="d_req">*</span>}
                    </label>
                    {field.type === "select" ? (
                      <select className="d_form_control" {...f(field.key)}>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        className="d_form_control"
                        placeholder={field.placeholder || ""}
                        {...f(field.key)}
                      />
                    )}
                    {errors[field.key] && (
                      <span style={{ color: "var(--d-danger)", fontSize: 12 }}>
                        {errors[field.key]}
                      </span>
                    )}
                  </div>
                  {nextField && (
                    <div className="d_form_group">
                      <label className="d_form_label">
                        {nextField.label}
                        {nextField.required && <span className="d_req">*</span>}
                      </label>
                      {nextField.type === "select" ? (
                        <select className="d_form_control" {...f(nextField.key)}>
                          {nextField.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={nextField.type}
                          className="d_form_control"
                          placeholder={nextField.placeholder || ""}
                          {...f(nextField.key)}
                        />
                      )}
                      {errors[nextField.key] && (
                        <span style={{ color: "var(--d-danger)", fontSize: 12 }}>
                          {errors[nextField.key]}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })
        )}
        <div className="d_form_actions">
          <button
            className="d_btn d_btn_outline"
            onClick={() => setModal(false)}
          >
            Cancel
          </button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>
            {editId ? "Update" : "Save Entry"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Accounts;
