const Employee = require('../model/Empl.model');
const Stock = require('../model/Stock.model');
const SpareParts = require('../model/SpareParts.model');
const Income = require('../model/Income.model');
const ErpRecord = require('../model/ErpRecord.model');
const Customer = require('../model/Customer.model');

const formatCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalEmployees,
      totalStockItems,
      lowStockItems,
      spareLowStock,
      todayIncome,
      openTickets,
      totalCustomers,
      recentSalesOrders,
      recentInvoices,
      recentServiceTickets,
      pendingPOs,
    ] = await Promise.all([
      Employee.countDocuments(),
      Promise.all([Stock.countDocuments(), SpareParts.countDocuments()]).then(([s, p]) => s + p),
      Stock.countDocuments({ status: { $in: ['Low Stock', 'Out of Stock'] } }),
      SpareParts.countDocuments({ status: { $in: ['Low Stock', 'Out of Stock'] } }),
      Income.aggregate([
        { $match: { incomeType: 'Sales', date: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      ErpRecord.countDocuments({ module: 'service', recordType: 'ticket', status: 'Open' }),
      Customer.countDocuments(),
      ErpRecord.find({ module: 'sales', recordType: 'order' }).sort({ createdAt: -1 }).limit(5),
      ErpRecord.find({ module: 'sales', recordType: 'invoice' }).sort({ createdAt: -1 }).limit(5),
      ErpRecord.find({ module: 'service', recordType: 'ticket' }).sort({ createdAt: -1 }).limit(5),
      ErpRecord.find({ module: 'purchase', recordType: 'grn' }).sort({ createdAt: -1 }).limit(5),
    ]);

    const salesTotal = todayIncome[0]?.total || 0;
    const lowStockTotal = lowStockItems + spareLowStock;

    const orders = [
      ...recentSalesOrders.map(o => ({ id: o.id, customer: o.customer, amount: formatCurrency(o.amount), date: o.date ? new Date(o.date).toLocaleDateString('en-IN') : '-', status: o.status })),
      ...recentInvoices.map(i => ({ id: i.id, customer: i.customer, amount: formatCurrency(i.amount), date: i.date ? new Date(i.date).toLocaleDateString('en-IN') : '-', status: i.status })),
    ].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);

    const tickets = recentServiceTickets.map(t => ({
      id: t.id,
      customer: t.customer,
      machine: t.machine,
      issue: t.issue,
      engineer: t.engineer || 'Unassigned',
      status: t.status,
    }));

    const pos = pendingPOs.map(p => ({
      id: p.id,
      supplier: p.supplier,
      amount: formatCurrency(p.amount),
      date: p.date ? new Date(p.date).toLocaleDateString('en-IN') : '-',
      delivery: p.delivery || '-',
      status: p.status,
    }));

    res.status(200).json({
      stats: {
        todaySales: formatCurrency(salesTotal),
        todayPurchases: formatCurrency(0),
        lowStockAlerts: `${lowStockTotal} Parts`,
        pendingPayments: formatCurrency(0),
        totalEmployees: totalEmployees,
        totalStockItems: totalStockItems,
        openTickets,
        totalCustomers,
      },
      recentOrders: orders,
      recentTickets: tickets,
      pendingPOs: pos,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const recentRecords = await ErpRecord.find().sort({ createdAt: -1 }).limit(10);
    const activities = recentRecords.map((r, i) => {
      let icon, color, text;
      if (r.module === 'sales') {
        icon = 'MdPointOfSale';
        color = '#28a745';
        text = `New ${r.recordType} ${r.id} created for ${r.customer || 'Customer'}`;
      } else if (r.module === 'service') {
        icon = 'MdBuildCircle';
        color = '#17a2b8';
        text = `Service ticket ${r.id} assigned to ${r.engineer || 'engineer'}`;
      } else if (r.module === 'purchase') {
        icon = 'MdShoppingCart';
        color = '#f4a124';
        text = `Purchase order ${r.id} status updated to ${r.status || 'Pending'}`;
      } else if (r.module === 'payroll') {
        icon = 'MdCheckCircle';
        color = '#28a745';
        text = `Salary generated for ${r.month || 'current month'} — ${r.emp || 'employee'}`;
      } else {
        icon = 'MdAccessTime';
        color = '#1a3c5e';
        text = `New ${r.module} record ${r.id} created`;
      }
      const timeAgo = getTimeAgo(r.createdAt);
      return { icon, color, text, time: timeAgo };
    });
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTimeAgo = (date) => {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
};
