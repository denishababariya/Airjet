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

const blankReceivable = {
  party: "",
  type: "Invoice",
  amount: "",
  dueDate: "",
  status: "Pending",
  notes: "",
};

const blankPayable = {
  party: "",
  type: "Purchase Order",
  amount: "",
  dueDate: "",
  status: "Pending",
  notes: "",
};

const blankLedger = {
  date: "",
  party: "",
  type: "Sales Invoice",
  debit: "",
  credit: "",
  notes: "",
};

const blankGst = {
  month: "",
  taxable: "",
  cgst: "",
  sgst: "",
  igst: "",
  gstAmount: "",
  status: "Pending",
};

const blankPL = {
  period: "",
  entityType: "Revenue",
  notes: "",
  revenue: "",
  expenses: "",
  profit: "",
};

const Accounts = ({ defaultTab = "receivables", setActiveMenu }) => {
  const [tab, setTab] = useState(defaultTab);

  // Map tab keys to sidebar menu labels
  const tabToMenuMap = {
    'receivables': 'Receivables',
    'payables': 'Payables',
    'ledger': 'Ledger',
    'gst': 'GST Reports',
    'pl': 'Profit & Loss',
  };
  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [gst, setGst] = useState([]);
  const [pl, setPL] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blankReceivable);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const isRcv = tab === "receivables";
  const isPay = tab === "payables";

  const fetchReceivables = async () => {
    try {
      const { data } = await accountsApi.getAll("accounts", "receivable");
      setReceivables(data);
    } catch (err) {
      setError(err.displayMessage || "Failed to load receivables");
    }
  };

  const fetchPayables = async () => {
    try {
      const { data } = await accountsApi.getAll("accounts", "payable");
      setPayables(data);
    } catch (err) {
      setError(err.displayMessage || "Failed to load payables");
    }
  };

  const fetchLedger = async () => {
    try {
      const { data } = await erpApi.getAll("accounts", "ledger");
      setLedger(data);
    } catch (err) {
      setError(err.displayMessage || "Failed to load ledger");
    }
  };

  const fetchGst = async () => {
    try {
      const { data } = await erpApi.getAll("accounts", "gst");
      setGst(data);
    } catch (err) {
      setError(err.displayMessage || "Failed to load GST reports");
    }
  };

  const fetchPL = async () => {
    try {
      const { data } = await erpApi.getAll("accounts", "pl");
      setPL(data);
    } catch (err) {
      setError(err.displayMessage || "Failed to load profit & loss");
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      await Promise.all([fetchReceivables(), fetchPayables(), fetchLedger(), fetchGst(), fetchPL()]);
      setLoading(false);
    };
    load();
  }, []);

  const getBlank = () => {
    if (isRcv) return blankReceivable;
    if (isPay) return blankPayable;
    if (tab === "ledger") return blankLedger;
    if (tab === "gst") return blankGst;
    return blankPL;
  };

  const openAdd = () => {
    setForm(getBlank());
    setEditId(null);
    setErrors({});
    setModal(true);
  };

  const openEdit = (row) => {
    if (isRcv || isPay) {
      setForm({
        party: row.party || "",
        type: row.type || "Invoice",
        amount: row.amount || "",
        dueDate: row.dueDate || "",
        status: row.status || "Pending",
        notes: row.notes || "",
      });
    } else if (tab === "ledger") {
      setForm({
        date: row.date ? row.date.split("T")[0] : "",
        party: row.party || "",
        type: row.type || "Sales Invoice",
        debit: row.debit || "",
        credit: row.credit || "",
        notes: row.notes || "",
      });
    } else if (tab === "gst") {
      setForm({
        month: row.month || "",
        taxable: row.taxable || "",
        cgst: row.cgst || "",
        sgst: row.sgst || "",
        igst: row.igst || "",
        gstAmount: row.gstAmount || "",
        status: row.status || "Pending",
      });
    } else {
      setForm({
        period: row.period || "",
        entityType: row.entityType || "Revenue",
        notes: row.notes || "",
        revenue: row.revenue || "",
        expenses: row.expenses || "",
        profit: row.profit || "",
      });
    }
    setEditId(row._id);
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    if (isRcv || isPay) return validateFields({
      party: V.required(form.party, 'Party name'),
      amount: V.amount(form.amount, 'Amount'),
      dueDate: V.date(form.dueDate, 'Due date'),
    });
    if (tab === 'ledger') return validateFields({
      date: V.date(form.date, 'Date'),
      party: V.required(form.party, 'Party'),
      debit: form.debit !== '' ? V.optionalAmount(form.debit, 'Debit') : '',
      credit: form.credit !== '' ? V.optionalAmount(form.credit, 'Credit') : '',
    });
    if (tab === 'gst') return validateFields({
      month: V.required(form.month, 'Month'),
      taxable: V.amount(form.taxable, 'Taxable amount'),
      cgst: V.amount(form.cgst, 'CGST'), sgst: V.amount(form.sgst, 'SGST'),
      igst: V.amount(form.igst, 'IGST'), gstAmount: V.amount(form.gstAmount, 'Total tax'),
    });
    return validateFields({ period: V.required(form.period, 'Period') });
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    try {
      const amount = parseFloat(String(form.amount).replace(/[^\d.]/g, "")) || 0;
      if (isRcv) {
        const payload = { module: "accounts", recordType: "receivable", ...form, amount };
        if (editId) await erpApi.update(editId, payload);
        else await erpApi.create(payload);
        fetchReceivables();
      } else if (isPay) {
        const payload = { module: "accounts", recordType: "payable", ...form, amount };
        if (editId) await erpApi.update(editId, payload);
        else await erpApi.create(payload);
        fetchPayables();
      } else if (tab === "ledger") {
        const debit = parseFloat(String(form.debit).replace(/[^\d.]/g, "")) || 0;
        const credit = parseFloat(String(form.credit).replace(/[^\d.]/g, "")) || 0;
        const payload = {
          module: "accounts",
          recordType: "ledger",
          date: form.date,
          party: form.party,
          type: form.type,
          debit,
          credit,
          balance: credit - debit,
          notes: form.notes,
        };
        if (editId) await erpApi.update(editId, payload);
        else await erpApi.create(payload);
        fetchLedger();
      } else if (tab === "gst") {
        const payload = {
          module: "accounts",
          recordType: "gst",
          month: form.month,
          taxable: form.taxable,
          cgst: form.cgst,
          sgst: form.sgst,
          igst: form.igst,
          gstAmount: form.gstAmount,
          status: form.status,
        };
        if (editId) await erpApi.update(editId, payload);
        else await erpApi.create(payload);
        fetchGst();
      } else {
        const payload = {
          module: "accounts",
          recordType: "pl",
          period: form.period,
          entityType: form.entityType,
          notes: form.notes,
          revenue: Number(form.revenue) || 0,
          expenses: Number(form.expenses) || 0,
          profit: Number(form.profit) || 0,
        };
        if (editId) await erpApi.update(editId, payload);
        else await erpApi.create(payload);
        fetchPL();
      }
      setModal(false);
    } catch (err) {
      setError(err.displayMessage || "Failed to save");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await erpApi.remove(id);
      if (isRcv) fetchReceivables();
      else if (isPay) fetchPayables();
      else if (tab === "ledger") fetchLedger();
      else if (tab === "gst") fetchGst();
      else fetchPL();
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

  const totalRcv = receivables.reduce((s, r) => s + (r.amount || 0), 0);
  const totalPay = payables.reduce((s, p) => s + (p.amount || 0), 0);

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
        {[
          ["receivables", "Receivables"],
          ["payables", "Payables"],
          ["ledger", "Ledger"],
          ["gst", "GST Reports"],
          ["pl", "Profit & Loss"],
        ].map(([k, v]) => (
          <button
            key={k}
            className={`d_tab_btn ${tab === k ? "d_active" : ""}`}
            onClick={() => {
              setTab(k);
              if (setActiveMenu) {
                setActiveMenu(tabToMenuMap[k]);
              }
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {tab === "receivables" && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title">
              <MdAccountBalance className="d_card_icon" /> Receivables (
              {receivables.length})
            </h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Party</th>
                    <th>Type</th>
                    <th>Amount (₹)</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.length === 0 && (
                    <tr className="d_empty">
                      <td colSpan={7} className="text-center py-4">
                        No receivables found.
                      </td>
                    </tr>
                  )}
                  {receivables.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <code>{r.id}</code>
                      </td>
                      <td>
                        <strong>{r.party}</strong>
                      </td>
                      <td>{r.type}</td>
                      <td>
                        <strong>₹{(r.amount ?? 0).toLocaleString()}</strong>
                      </td>
                      <td>{r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN') : '-'}</td>
                      <td>
                        <span className={`d_badge ${statusClass[r.status]}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <div className="d_action_btns">
                          <button
                            className="d_icon_btn d_edit"
                            onClick={() => openEdit(r)}
                          >
                            <MdEdit />
                          </button>
                          <button
                            className="d_icon_btn d_del"
                            onClick={() => handleDelete(r._id)}
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

      {tab === "payables" && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title">
              <MdAccountBalance className="d_card_icon" /> Payables (
              {payables.length})
            </h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Party</th>
                    <th>Type</th>
                    <th>Amount (₹)</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payables.length === 0 && (
                    <tr className="d_empty">
                      <td colSpan={7} className="text-center py-4">
                        No payables found.
                      </td>
                    </tr>
                  )}
                  {payables.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <code>{p.id}</code>
                      </td>
                      <td>
                        <strong>{p.party}</strong>
                      </td>
                      <td>{p.type}</td>
                      <td>
                        <strong>₹{(p.amount ?? 0).toLocaleString()}</strong>
                      </td>
                      <td>{p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-IN') : '-'}</td>
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
          </div>
        </div>
      )}

      {tab === "ledger" && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title">
              <MdAccountBalance className="d_card_icon" /> Ledger ({ledger.length})
            </h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}>
              <MdAdd /> Add Entry
            </button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Party</th>
                    <th>Type</th>
                    <th>Debit (₹)</th>
                    <th>Credit (₹)</th>
                    <th>Balance (₹)</th>
                    <th>Narration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.length === 0 && (
                    <tr className="d_empty">
                      <td colSpan={9} className="text-center py-4">
                        No ledger entries found.
                      </td>
                    </tr>
                  )}
                  {ledger.map((l) => (
                    <tr key={l._id}>
                      <td>
                        <code>{l.id}</code>
                      </td>
                      <td>{l.date ? new Date(l.date).toLocaleDateString('en-IN') : '-'}</td>
                      <td>
                        <strong>{l.party}</strong>
                      </td>
                      <td>{l.type}</td>
                      <td>
                        {l.debit > 0 ? (
                          <span style={{ color: "var(--d-danger)" }}>
                            {l.debit.toLocaleString()}
                          </span>
                        ) : (
                          "--"
                        )}
                      </td>
                      <td>
                        {l.credit > 0 ? (
                          <span style={{ color: "var(--d-success)" }}>
                            {l.credit.toLocaleString()}
                          </span>
                        ) : (
                          "--"
                        )}
                      </td>
                      <td>
                        <strong
                          style={{
                            color:
                              l.balance >= 0
                                ? "var(--d-success)"
                                : "var(--d-danger)",
                          }}
                        >
                          {Math.abs(l.balance || 0).toLocaleString()}
                        </strong>
                      </td>
                      <td>{l.notes || '-'}</td>
                      <td>
                        <div className="d_action_btns">
                          <button
                            className="d_icon_btn d_edit"
                            onClick={() => openEdit(l)}
                          >
                            <MdEdit />
                          </button>
                          <button
                            className="d_icon_btn d_del"
                            onClick={() => handleDelete(l._id)}
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

      {tab === "gst" && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title">
              <MdAccountBalance className="d_card_icon" /> GST Reports (
              {gst.length})
            </h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Month</th>
                    <th>Taxable Amount</th>
                    <th>CGST</th>
                    <th>SGST</th>
                    <th>IGST</th>
                    <th>Total Tax</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {gst.length === 0 && (
                    <tr className="d_empty">
                      <td colSpan={9} className="text-center py-4">
                        No GST reports found.
                      </td>
                    </tr>
                  )}
                  {gst.map((g) => (
                    <tr key={g._id}>
                      <td>
                        <code>{g.id}</code>
                      </td>
                      <td>
                        <strong>{g.month}</strong>
                      </td>
                      <td>{g.taxable}</td>
                      <td>{g.cgst}</td>
                      <td>{g.sgst}</td>
                      <td>{g.igst}</td>
                      <td>
                        <strong>{g.gstAmount ?? 0}</strong>
                      </td>
                      <td>
                        <span
                          className={`d_badge ${g.status === "Filed" ? "d_success" : "d_warning"}`}
                        >
                          {g.status}
                        </span>
                      </td>
                      <td>
                        <div className="d_action_btns">
                          <button
                            className="d_icon_btn d_edit"
                            onClick={() => openEdit(g)}
                          >
                            <MdEdit />
                          </button>
                          <button
                            className="d_icon_btn d_del"
                            onClick={() => handleDelete(g._id)}
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

      {tab === "pl" && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title">
              <MdAccountBalance className="d_card_icon" /> Profit & Loss
              Statement
            </h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}>
              <MdAdd /> Add Entry
            </button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Period</th>
                    <th>Type</th>
                    <th>Notes</th>
                    <th>Revenue</th>
                    <th>Expenses</th>
                    <th>Profit</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pl.length === 0 && (
                    <tr className="d_empty">
                      <td colSpan={8} className="text-center py-4">
                        No profit & loss entries found.
                      </td>
                    </tr>
                  )}
                  {pl.map((p) => (
                    <tr
                      key={p._id}
                      style={
                        p.entityType === "Profit"
                          ? { fontWeight: 700, background: "#f0f9ff" }
                          : {}
                      }
                    >
                      <td>
                        <code>{p.id}</code>
                      </td>
                      <td>{p.period || '-'}</td>
                      <td>
                        <span
                          className={`d_badge ${p.entityType === "Revenue" ? "d_success" : p.entityType === "Profit" ? "d_info" : "d_danger"}`}
                        >
                          {p.entityType}
                        </span>
                      </td>
                      <td>
                        <strong>{p.notes || '-'}</strong>
                      </td>
                      <td>{p.revenue ?? 0}</td>
                      <td>{p.expenses ?? 0}</td>
                      <td>{p.profit ?? 0}</td>
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
          </div>
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={
          editId
            ? "Edit Entry"
            : `Add ${isRcv ? "Receivable" : isPay ? "Payable" : tab === "ledger" ? "Ledger Entry" : tab === "gst" ? "GST Report" : "P&L Entry"}`
        }
        size="md"
      >
        {isRcv || isPay ? (
          <>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">
                  Party Name <span className="d_req">*</span>
                </label>
                <input
                  className="d_form_control"
                  placeholder="Customer / Supplier name"
                  {...f("party")}
                />
                {errors.party && (
                  <span style={{ color: "var(--d-danger)", fontSize: 12 }}>
                    {errors.party}
                  </span>
                )}
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Transaction Type</label>
                <select className="d_form_control" {...f("type")}>
                  <option>Invoice</option>
                  <option>Purchase Order</option>
                  <option>Advance</option>
                  <option>Credit Note</option>
                  <option>Debit Note</option>
                </select>
              </div>
            </div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">
                  Amount (₹) <span className="d_req">*</span>
                </label>
                <input
                  type="number"
                  className="d_form_control"
                  placeholder="e.g. 25000"
                  {...f("amount")}
                />
                {errors.amount && (
                  <span style={{ color: "var(--d-danger)", fontSize: 12 }}>
                    {errors.amount}
                  </span>
                )}
              </div>
              <div className="d_form_group">
                <label className="d_form_label">
                  Due Date <span className="d_req">*</span>
                </label>
                <input type="date" className="d_form_control" {...f("dueDate")} />
                {errors.dueDate && (
                  <span style={{ color: "var(--d-danger)", fontSize: 12 }}>
                    {errors.dueDate}
                  </span>
                )}
              </div>
            </div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Status</label>
                <select className="d_form_control" {...f("status")}>
                  <option>Pending</option>
                  <option>{isRcv ? "Received" : "Paid"}</option>
                  <option>Overdue</option>
                </select>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Notes</label>
                <input
                  className="d_form_control"
                  placeholder="Optional notes"
                  {...f("notes")}
                />
              </div>
            </div>
          </>
        ) : tab === "ledger" ? (
          <>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Date</label>
                <input type="date" className="d_form_control" {...f("date")} />
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Party</label>
                <input className="d_form_control" {...f("party")} />
              </div>
            </div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Type</label>
                <select className="d_form_control" {...f("type")}>
                  <option>Sales Invoice</option>
                  <option>Purchase Payment</option>
                  <option>Cash Receipt</option>
                  <option>Bank Transfer</option>
                </select>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Narration</label>
                <input className="d_form_control" {...f("notes")} />
              </div>
            </div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Debit (₹)</label>
                <input type="number" className="d_form_control" {...f("debit")} />
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Credit (₹)</label>
                <input type="number" className="d_form_control" {...f("credit")} />
              </div>
            </div>
          </>
        ) : tab === "gst" ? (
          <>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Month</label>
                <input className="d_form_control" placeholder="e.g. Jun 2026" {...f("month")} />
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Taxable Amount</label>
                <input className="d_form_control" {...f("taxable")} />
              </div>
            </div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">CGST</label>
                <input className="d_form_control" {...f("cgst")} />
              </div>
              <div className="d_form_group">
                <label className="d_form_label">SGST</label>
                <input className="d_form_control" {...f("sgst")} />
              </div>
            </div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">IGST</label>
                <input className="d_form_control" {...f("igst")} />
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Total Tax</label>
                <input className="d_form_control" {...f("gstAmount")} />
              </div>
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f("status")}>
                <option>Pending</option>
                <option>Filed</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Type</label>
                <select className="d_form_control" {...f("entityType")}>
                  <option>Revenue</option>
                  <option>Expense</option>
                  <option>Profit</option>
                </select>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Period</label>
                <input className="d_form_control" placeholder="e.g. Jun 2026" {...f("period")} />
              </div>
            </div>
            <div className="d_form_group mb-3">
              <label className="d_form_label">Notes</label>
              <input className="d_form_control" placeholder="Optional entry details" {...f("notes")} />
            </div>
            <div className="d_form_row cols-3">
              <div className="d_form_group">
                <label className="d_form_label">Revenue</label>
                <input type="number" className="d_form_control" {...f("revenue")} />
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Expenses</label>
                <input type="number" className="d_form_control" {...f("expenses")} />
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Profit</label>
                <input type="number" className="d_form_control" {...f("profit")} />
              </div>
            </div>
          </>
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
