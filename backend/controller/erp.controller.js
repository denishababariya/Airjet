const ErpRecord = require('../model/ErpRecord.model');
const Stock = require('../model/Stock.model');

const ID_PREFIX = {
  'payroll:salary': 'PAY',
  'payroll:allowance': 'ALW',
  'payroll:deduction': 'DED',
  'payroll:payslip': 'SLP',
  'purchase:order': 'PO',
  'purchase:grn': 'GRN',
  'purchase:return': 'RET',
  'sales:quotation': 'QT',
  'sales:order': 'SO',
  'sales:invoice': 'INV',
  'warehouse:transfer': 'TRF',
  'warehouse:audit': 'AUD',
  'service:ticket': 'SRV',
  'service:assignment': 'ASG',
  'service:report': 'SR',
  'accounts:receivable': 'RCV',
  'accounts:payable': 'PAYB',
  'accounts:ledger': 'LED',
  'accounts:gst': 'GST',
  'accounts:pl': 'PL',
};

const generateId = async (module, recordType) => {
  const key = `${module}:${recordType}`;
  const prefix = ID_PREFIX[key] || 'ERP';
  const count = await ErpRecord.countDocuments({ module, recordType });
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
};

const calculateWarrantyExpiry = (deliveryDate, warrantyMonths) => {
  if (!deliveryDate || !warrantyMonths) return null;
  const date = new Date(deliveryDate);
  date.setMonth(date.getMonth() + parseInt(warrantyMonths));
  return date.toISOString().split('T')[0];
};

const checkWarrantyStatus = (warrantyExpiryDate) => {
  if (!warrantyExpiryDate) return { status: 'N/A', isValid: false };
  const today = new Date();
  const expiry = new Date(warrantyExpiryDate);
  const isValid = today <= expiry;
  return { status: isValid ? 'Active' : 'Expired', isValid };
};

const createRecord = async (req, res) => {
  try {
    const { module, recordType } = req.body;
    if (!module || !recordType) {
      return res.status(400).json({ error: 'module and recordType are required' });
    }
    const payload = {
      ...req.body,
      id: req.body.id || await generateId(module, recordType),
    };

    // Calculate warranty expiry for sales orders
    if (module === 'sales' && recordType === 'order' && payload.delivery && payload.warrantyMonths) {
      payload.warrantyExpiryDate = calculateWarrantyExpiry(payload.delivery, payload.warrantyMonths);
      const warrantyCheck = checkWarrantyStatus(payload.warrantyExpiryDate);
      payload.warrantyStatus = warrantyCheck.status;
    }

    // Process sales order with items
    if (module === 'sales' && recordType === 'order' && payload.items && Array.isArray(payload.items)) {
      // Generate invoice number
      const invoiceCount = await ErpRecord.countDocuments({ module: 'sales', recordType: 'invoice' });
      payload.invoiceNo = `INV-${String(invoiceCount + 1).padStart(4, '0')}`;
      payload.invoiceDate = new Date().toISOString().split('T')[0];

      // Calculate totals
      let totalAmount = 0;
      payload.items = await Promise.all(payload.items.map(async (item) => {
        const stockItem = await Stock.findById(item.stockId);
        if (stockItem) {
          // Update stock quantity
          const newQuantity = stockItem.quantity - item.quantity;
          await Stock.findByIdAndUpdate(item.stockId, { quantity: newQuantity });
          item.unitPrice = stockItem.unitPrice;
          item.totalPrice = item.quantity * item.unitPrice;
        }
        totalAmount += item.totalPrice || 0;
        return item;
      }));

      payload.totalAmount = totalAmount;
      const gstAmount = totalAmount * (payload.gstRate || 18) / 100;
      payload.gstAmount = gstAmount;
      payload.cgstAmount = gstAmount / 2;
      payload.sgstAmount = gstAmount / 2;
      payload.grandTotal = totalAmount + gstAmount;

      // Create invoice record
      const invoicePayload = {
        ...payload,
        module: 'sales',
        recordType: 'invoice',
        id: payload.invoiceNo,
        so: payload.so
      };
      await ErpRecord.create(invoicePayload);
    }

    // Check warranty for service tickets linked to sales orders
    if (module === 'service' && recordType === 'ticket' && payload.salesOrderNo) {
      const salesOrder = await ErpRecord.findOne({ module: 'sales', recordType: 'order', so: payload.salesOrderNo });
      if (salesOrder) {
        const warrantyCheck = checkWarrantyStatus(salesOrder.warrantyExpiryDate);
        payload.warranty = warrantyCheck.isValid ? 'Yes' : 'No';
        payload.warrantyExpiryDate = salesOrder.warrantyExpiryDate;
        payload.warrantyStatus = warrantyCheck.status;
      }
    }

    if (payload.basic != null && payload.allowances != null && payload.deductions != null) {
      payload.net = Number(payload.basic) + Number(payload.allowances) - Number(payload.deductions);
    }
    const record = await ErpRecord.create(payload);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRecords = async (req, res) => {
  try {
    const filter = {};
    if (req.query.module) filter.module = req.query.module;
    if (req.query.recordType) filter.recordType = req.query.recordType;
    const records = await ErpRecord.find(filter).sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecordById = async (req, res) => {
  try {
    const record = await ErpRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRecord = async (req, res) => {
  try {
    const payload = { ...req.body };

    // Calculate warranty expiry for sales orders
    if (payload.module === 'sales' && payload.recordType === 'order' && payload.delivery && payload.warrantyMonths) {
      payload.warrantyExpiryDate = calculateWarrantyExpiry(payload.delivery, payload.warrantyMonths);
      const warrantyCheck = checkWarrantyStatus(payload.warrantyExpiryDate);
      payload.warrantyStatus = warrantyCheck.status;
    }

    // Process sales order with items on update
    if (payload.module === 'sales' && payload.recordType === 'order' && payload.items && Array.isArray(payload.items)) {
      // Calculate totals
      let totalAmount = 0;
      payload.items = await Promise.all(payload.items.map(async (item) => {
        const stockItem = await Stock.findById(item.stockId);
        if (stockItem) {
          item.unitPrice = stockItem.unitPrice;
          item.totalPrice = item.quantity * item.unitPrice;
        }
        totalAmount += item.totalPrice || 0;
        return item;
      }));

      payload.totalAmount = totalAmount;
      const gstAmount = totalAmount * (payload.gstRate || 18) / 100;
      payload.gstAmount = gstAmount;
      payload.cgstAmount = gstAmount / 2;
      payload.sgstAmount = gstAmount / 2;
      payload.grandTotal = totalAmount + gstAmount;
    }

    // Check warranty for service tickets linked to sales orders
    if (payload.module === 'service' && payload.recordType === 'ticket' && payload.salesOrderNo) {
      const salesOrder = await ErpRecord.findOne({ module: 'sales', recordType: 'order', so: payload.salesOrderNo });
      if (salesOrder) {
        const warrantyCheck = checkWarrantyStatus(salesOrder.warrantyExpiryDate);
        payload.warranty = warrantyCheck.isValid ? 'Yes' : 'No';
        payload.warrantyExpiryDate = salesOrder.warrantyExpiryDate;
        payload.warrantyStatus = warrantyCheck.status;
      }
    }

    if (payload.basic != null && payload.allowances != null && payload.deductions != null) {
      payload.net = Number(payload.basic) + Number(payload.allowances) - Number(payload.deductions);
    }
    const record = await ErpRecord.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRecord = async (req, res) => {
  try {
    const record = await ErpRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  calculateWarrantyExpiry,
  checkWarrantyStatus,
};
