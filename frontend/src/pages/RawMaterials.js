import React, { useState, useEffect } from 'react';
import {
  MdInventory,
  MdSearch,
  MdRemove,
  MdTrendingUp,
  MdWarning,
  MdAttachMoney
} from 'react-icons/md';
import Modal from '../components/Modal';
import ToastContainer from '../components/Toast';
import useToast from '../hooks/useToast';
import { rawMaterialsApi } from '../utils/api';
import { RiSearchAi2Line } from 'react-icons/ri';

const statusClass = {
  'In Stock': 'd_success',
  'Low Stock': 'd_warning',
  'Out of Stock': 'd_danger'
};

const categoryOptions = [
  'Metal',
  'Plastic',
  'Chemical',
  'Fabric',
  'Electronics',
  'Packaging',
  'Other'
];

const RawMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [report, setReport] = useState({
    summary: {},
    transactions: []
  });

  const [loading, setLoading] = useState(true);

  const [stockModal, setStockModal] = useState(false);

  const [stockForm, setStockForm] = useState({
    materialId: '',
    quantity: 0,
    reason: ''
  });

  // Raw Materials filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Raw Material Stock filters
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [stockTypeFilter, setStockTypeFilter] = useState('');

  const { toasts, toast, removeToast } = useToast();

  useEffect(() => {
    fetchMaterials();
    fetchReport();
  }, []);

  // ============================================
  // FETCH RAW MATERIALS
  // ============================================
  const fetchMaterials = async () => {
    setLoading(true);

    try {
      const res = await rawMaterialsApi.getAll();
      setMaterials(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch raw materials');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FETCH STOCK REPORT
  // ============================================
  const fetchReport = async () => {
    try {
      const res = await rawMaterialsApi.getReport();

      setReport(
        res.data || {
          summary: {},
          transactions: []
        }
      );
    } catch (err) {
      console.error('Failed to fetch raw material report:', err);
    }
  };

  // ============================================
  // OPEN STOCK MODAL
  // ============================================
  const openStockModal = (material) => {
    setStockForm({
      materialId: material._id,
      quantity: 0,
      reason: ''
    });

    setStockModal(true);
  };

  // ============================================
  // HANDLE STOCK UPDATE
  // ============================================
  const handleStockUpdate = async () => {
    if (!stockForm.quantity || stockForm.quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      await rawMaterialsApi.deductStock(stockForm);

      toast.success('Stock deducted successfully');

      await fetchMaterials();
      await fetchReport();

      setStockModal(false);

      setStockForm({
        materialId: '',
        quantity: 0,
        reason: ''
      });
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          'Failed to deduct stock'
      );
    }
  };

  // ============================================
  // MONEY FORMAT
  // ============================================
  const money = (value) => {
    const num = Number(value) || 0;

    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  };

  // ============================================
  // FILTER RAW MATERIALS
  // ============================================
  const filteredMaterials = materials.filter((m) => {
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !search ||
      String(m.name || '')
        .toLowerCase()
        .includes(search) ||
      String(m.code || '')
        .toLowerCase()
        .includes(search);

    const matchesCategory =
      !filterCategory ||
      m.category === filterCategory;

    const matchesStatus =
      !filterStatus ||
      m.status === filterStatus;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus
    );
  });

  // ============================================
  // FILTER RAW MATERIAL STOCK TRANSACTIONS
  // ============================================
  const filteredTransactions = (
    report.transactions || []
  ).filter((txn) => {
    const search = stockSearchTerm
      .toLowerCase()
      .trim();

    const materialCode = String(
      txn.materialCode ||
        txn.rawMaterialId?.code ||
        ''
    ).toLowerCase();

    const materialName = String(
      txn.materialName ||
        txn.rawMaterialId?.name ||
        ''
    ).toLowerCase();

    const reason = String(
      txn.reason || ''
    ).toLowerCase();

    const matchesSearch =
      !search ||
      materialCode.includes(search) ||
      materialName.includes(search) ||
      reason.includes(search);

    const matchesType =
      !stockTypeFilter ||
      txn.type === stockTypeFilter;

    return (
      matchesSearch &&
      matchesType
    );
  });

  // ============================================
  // GET UNIQUE TRANSACTION TYPES
  // ============================================
  const uniqueTransactionTypes = [
    ...new Set(
      (report.transactions || []).map((txn) => txn.type).filter(Boolean)
    )
  ];

  // ============================================
  // CLEAR RAW MATERIAL FILTERS
  // ============================================
  const clearMaterialFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterStatus('');
  };

  // ============================================
  // CLEAR STOCK FILTERS
  // ============================================
  const clearStockFilters = () => {
    setStockSearchTerm('');
    setStockTypeFilter('');
  };

  return (
    <div>
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />

      {/* ============================================
          PAGE HEADER
      ============================================ */}
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">
            Raw Materials
          </h1>

          <p className="d_page_subtitle">
            View raw materials inventory and deduct
            stock when used
          </p>
        </div>
      </div>

      {/* ============================================
          RAW MATERIAL FILTERS
      ============================================ */}
      <div className="d_card mb-3">
        <div className="d_card_body">
          <div className="d-flex flex-wrap gap-2 align-items-center">

            {/* Search */}
            <div className="d_search_box flex-grow-1">
              <RiSearchAi2Line className="d_search_icon" />

              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                className="d_form_control"
              />
            </div>

            {/* Category */}
            <select
              className="d_form_control"
              value={filterCategory}
              onChange={(e) =>
                setFilterCategory(e.target.value)
              }
              style={{ width: 'auto' }}
            >
              <option value="">
                All Categories
              </option>

              {categoryOptions.map((cat) => (
                <option
                  key={cat}
                  value={cat}
                >
                  {cat}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              className="d_form_control"
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value)
              }
              style={{ width: 'auto' }}
            >
              <option value="">
                All Status
              </option>

              <option value="In Stock">
                In Stock
              </option>

              <option value="Low Stock">
                Low Stock
              </option>

              <option value="Out of Stock">
                Out of Stock
              </option>
            </select>

            {/* Clear */}
            {(searchTerm ||
              filterCategory ||
              filterStatus) && (
              <button
                type="button"
                className="d_btn d_btn_outline"
                onClick={clearMaterialFilters}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================
          STAT CARDS
      ============================================ */}
      <div className="row mb-4">

        {/* Total Materials */}
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="d_stat_card d_stat_card_primary">
            <div className="d_stat_icon">
              <MdInventory />
            </div>

            <div className="d_stat_content">
              <div className="d_stat_label">
                Total Materials
              </div>

              <div className="d_stat_value">
                {report.summary?.totalMaterials ||
                  materials.length}
              </div>
            </div>
          </div>
        </div>

        {/* Current Quantity */}
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="d_stat_card d_stat_card_success">
            <div className="d_stat_icon">
              <MdTrendingUp />
            </div>

            <div className="d_stat_content">
              <div className="d_stat_label">
                Current Qty
              </div>

              <div className="d_stat_value">
                {report.summary?.currentQuantity || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="d_stat_card d_stat_card_warning">
            <div className="d_stat_icon">
              <MdWarning />
            </div>

            <div className="d_stat_content">
              <div className="d_stat_label">
                Low Stock
              </div>

              <div className="d_stat_value">
                {report.summary?.lowStock || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Current Stock Value */}
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="d_stat_card d_stat_card_accent">
            <div className="d_stat_icon">
              <MdAttachMoney />
            </div>

            <div className="d_stat_content">
              <div className="d_stat_label">
                Current Stock Value
              </div>

              <div className="d_stat_value">
                {money(
                  report.summary?.currentStockValue
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          RAW MATERIALS TABLE
      ============================================ */}
      <div className="d_card">
        <div className="d_card_header">
          <h2 className="d_card_title">
            <MdInventory className="d_card_icon" />
            Raw Materials ({filteredMaterials.length})
          </h2>
        </div>

        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">
              Loading…
            </div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table">

                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Quantity</th>
                    <th>Min Stock</th>
                    <th>Unit Price (₹)</th>
                    <th>Purchase Value (₹)</th>
                    <th>Current Stock Value (₹)</th>
                    <th>Supplier</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {/* Empty */}
                  {filteredMaterials.length === 0 && (
                    <tr className="d_empty">
                      <td colSpan={12}>
                        No raw materials found.
                      </td>
                    </tr>
                  )}

                  {/* Data */}
                  {filteredMaterials.map((m) => (
                    <tr key={m._id}>

                      <td>
                        <code>
                          {String(m.code)}
                        </code>
                      </td>

                      <td>
                        <strong>
                          {String(m.name)}
                        </strong>
                      </td>

                      <td>
                        {String(m.category)}
                      </td>

                      <td>
                        {String(m.unit)}
                      </td>

                      <td>
                        <strong>
                          {String(m.quantity)}
                        </strong>
                      </td>

                      <td>
                        {String(m.minimumStock)}
                      </td>

                      <td>
                        {money(m.unitPrice)}
                      </td>

                      <td>
                        <strong>
                          {money(m.totalPrice)}
                        </strong>
                      </td>

                      <td>
                        {money(
                          (m.quantity || 0) *
                            (m.unitPrice || 0)
                        )}
                      </td>

                      <td>
                        {String(
                          m.supplierName || '-'
                        )}
                      </td>

                      <td>
                        <span
                          className={`d_badge ${
                            statusClass[m.status] ||
                            'd_info'
                          }`}
                        >
                          {String(m.status)}
                        </span>
                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          RAW MATERIAL STOCK
      ============================================ */}
      <div className="d_card mt-3">

        <div className="d_card_header">
          <h2 className="d_card_title">
            <MdInventory className="d_card_icon" />
            Raw Material Stock ({filteredTransactions.length})
          </h2>
        </div>

        <div className="d_card_body">

          {/* STOCK SEARCH & FILTER */}
          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">

            {/* Stock Search */}
            <div className="d_search_box flex-grow-1">
              <RiSearchAi2Line className="d_search_icon" />

              <input
                type="text"
                className="d_form_control"
                placeholder="Search by material, code or reason..."
                value={stockSearchTerm}
                onChange={(e) =>
                  setStockSearchTerm(
                    e.target.value
                  )
                }
              />
            </div>

            {/* Stock Type Filter */}
            <select
              className="d_form_control"
              value={stockTypeFilter}
              onChange={(e) =>
                setStockTypeFilter(
                  e.target.value
                )
              }
              style={{ width: 'auto' }}
            >
              <option value="">
                All Types
              </option>

              {uniqueTransactionTypes.map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              ))}
            </select>

            {/* Clear Stock Filters */}
            {(stockSearchTerm ||
              stockTypeFilter) && (
              <button
                type="button"
                className="d_btn d_btn_outline"
                onClick={clearStockFilters}
              >
                Clear
              </button>
            )}

          </div>

          {/* STOCK TABLE */}
          <div className="d_table_wrap">
            <table className="d_table">

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Material</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Unit Price (₹)</th>
                  <th>Row Value (₹)</th>
                  <th>Balance After</th>
                  <th>Reason</th>
                </tr>
              </thead>

              <tbody>

                {/* Empty */}
                {filteredTransactions.length === 0 && (
                  <tr className="d_empty">
                    <td colSpan={9}>
                      No stock movement found.
                    </td>
                  </tr>
                )}

                {/* Filtered Transactions */}
                {filteredTransactions.map((txn) => (
                  <tr key={txn._id}>

                    <td>
                      {txn.transactionDate
                        ? new Date(
                            txn.transactionDate
                          ).toLocaleDateString(
                            'en-IN'
                          )
                        : '-'}
                    </td>

                    <td>
                      <strong>
                        {String(
                          txn.materialCode ||
                            txn.rawMaterialId
                              ?.code ||
                            ''
                        )}
                      </strong>

                      {' - '}

                      {String(
                        txn.materialName ||
                          txn.rawMaterialId
                            ?.name ||
                          ''
                      )}
                    </td>

                    <td>
                      <span
                        className={`d_badge ${
                          txn.type === 'Deduct'
                            ? 'd_warning'
                            : 'd_success'
                        }`}
                      >
                        {String(txn.type)}
                      </span>
                    </td>

                    <td>
                      {String(
                        txn.quantity || 0
                      )}
                    </td>

                    <td>
                      {String(
                        txn.unit ||
                          txn.rawMaterialId
                            ?.unit ||
                          ''
                      )}
                    </td>

                    <td>
                      {money(txn.unitPrice)}
                    </td>

                    <td>
                      <strong>
                        {money(
                          txn.totalAmount
                        )}
                      </strong>
                    </td>

                    <td>
                      {String(
                        txn.balanceAfter || 0
                      )}
                    </td>

                    <td>
                      {String(
                        txn.reason || '-'
                      )}
                    </td>

                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================
          DEDUCT STOCK MODAL
      ============================================ */}
      <Modal
        open={stockModal}
        onClose={() =>
          setStockModal(false)
        }
        title="Deduct Stock"
        size="sm"
      >

        <div className="d_form_row cols-1">
          <div className="d_form_group">

            <label className="d_form_label">
              Quantity{' '}
              <span className="d_req">
                *
              </span>
            </label>

            <input
              type="number"
              className="d_form_control"
              placeholder="0"
              min={1}
              value={stockForm.quantity}
              onChange={(e) =>
                setStockForm((p) => ({
                  ...p,
                  quantity: Number(
                    e.target.value
                  )
                }))
              }
            />

          </div>
        </div>

        <div className="d_form_row cols-1">
          <div className="d_form_group">

            <label className="d_form_label">
              Reason (Optional)
            </label>

            <textarea
              className="d_form_control"
              rows={2}
              placeholder="Reason for stock deduction..."
              value={stockForm.reason}
              onChange={(e) =>
                setStockForm((p) => ({
                  ...p,
                  reason: e.target.value
                }))
              }
            />

          </div>
        </div>

        <div className="d_form_actions">

          <button
            type="button"
            className="d_btn d_btn_outline"
            onClick={() =>
              setStockModal(false)
            }
          >
            Cancel
          </button>

          <button
            type="button"
            className="d_btn d_btn_primary"
            onClick={handleStockUpdate}
          >
            Deduct Stock
          </button>

        </div>
      </Modal>
    </div>
  );
};

export default RawMaterials;