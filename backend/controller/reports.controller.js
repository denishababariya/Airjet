const Income = require('../model/Income.model');
const Customer = require('../model/Customer.model');
const Stock = require('../model/Stock.model');
const SpareParts = require('../model/SpareParts.model');
const ErpRecord = require('../model/ErpRecord.model');
const Employee = require('../model/Empl.model');

const formatCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

const getSalesReport = async (req, res) => {
  try {
    const salesOrders = await ErpRecord.find({ module: 'sales', recordType: 'order' });
    const invoices = await ErpRecord.find({ module: 'sales', recordType: 'invoice' });
    const customers = await Customer.countDocuments();
    const incomeSales = await Income.find({ incomeType: 'Sales' });

    const totalRevenue = [...salesOrders, ...invoices].reduce((s, r) => s + (r.amount || 0), 0)
      + incomeSales.reduce((s, i) => s + (i.amount || 0), 0);

    const months = {};
    [...salesOrders, ...invoices, ...incomeSales.map(i => ({ amount: i.amount, date: i.date?.toISOString?.()?.slice(0, 7) }))].forEach(r => {
      const period = r.month || (r.date ? String(r.date).slice(0, 7) : 'Current');
      if (!months[period]) months[period] = { period, revenue: 0, orders: 0, customers };
      months[period].revenue += r.amount || 0;
      months[period].orders += 1;
    });

    const report = Object.values(months).length
      ? Object.values(months).map(m => ({
          ...m,
          revenue: formatCurrency(m.revenue),
          growth: '+0%',
        }))
      : [{ period: 'Current', revenue: formatCurrency(totalRevenue), orders: salesOrders.length + invoices.length, customers, growth: '+0%' }];

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPurchaseReport = async (req, res) => {
  try {
    const purchases = await Income.find({ incomeType: 'Purchase' });
    const grns = await ErpRecord.find({ module: 'purchase', recordType: 'grn' });
    const suppliers = await require('../model/Supplier.model').countDocuments();

    const total = purchases.reduce((s, p) => s + (p.amount || 0), 0)
      + grns.reduce((s, g) => s + (g.amount || 0), 0);

    res.status(200).json([{
      period: 'Current',
      spend: formatCurrency(total),
      orders: purchases.length,
      suppliers,
      savings: formatCurrency(total * 0.04),
    }]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getInventoryReport = async (req, res) => {
  try {
    const [stock, parts] = await Promise.all([
      Stock.find().sort({ quantity: 1 }),
      SpareParts.find().sort({ quantity: 1 }),
    ]);
    const report = [
      ...stock.map(s => ({
        part: s.itemName,
        stock: s.quantity,
        minStock: s.minimumStock,
        value: formatCurrency(s.totalPrice || s.quantity * s.unitPrice),
        status: s.status,
      })),
      ...parts.map(p => ({
        part: p.partName,
        stock: p.quantity,
        minStock: p.minimumStock,
        value: formatCurrency(p.quantity * p.sellingPrice),
        status: p.status,
      })),
    ];
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPayrollReport = async (req, res) => {
  try {
    const salaries = await ErpRecord.find({ module: 'payroll', recordType: 'salary' });
    const employees = await Employee.countDocuments();
    const gross = salaries.reduce((s, r) => s + (r.basic || 0) + (r.allowances || 0), 0);
    const deductions = salaries.reduce((s, r) => s + (r.deductions || 0), 0);
    const net = salaries.reduce((s, r) => s + (r.net || 0), 0);

    const months = {};
    salaries.forEach(s => {
      const m = s.month || 'Current';
      if (!months[m]) months[m] = { month: m, employees: 0, gross: 0, deductions: 0, net: 0, status: s.status || 'Generated' };
      months[m].employees += 1;
      months[m].gross += (s.basic || 0) + (s.allowances || 0);
      months[m].deductions += s.deductions || 0;
      months[m].net += s.net || 0;
    });

    const report = Object.values(months).length
      ? Object.values(months).map(m => ({
          ...m,
          gross: formatCurrency(m.gross),
          deductions: formatCurrency(m.deductions),
          net: formatCurrency(m.net),
        }))
      : [{
          month: 'Current',
          employees: employees || salaries.length,
          gross: formatCurrency(gross),
          deductions: formatCurrency(deductions),
          net: formatCurrency(net),
          status: 'Generated',
        }];

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSalesReport,
  getPurchaseReport,
  getInventoryReport,
  getPayrollReport,
};
