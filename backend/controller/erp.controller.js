const ErpRecord = require('../model/ErpRecord.model');

const ID_PREFIX = {
  'payroll:salary': 'PAY',
  'payroll:allowance': 'ALW',
  'payroll:deduction': 'DED',
  'payroll:payslip': 'SLP',
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
};
