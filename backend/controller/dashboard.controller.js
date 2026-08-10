const Employee = require('../model/Empl.model');
const Attendance = require('../model/Attendance.model');
const Stock = require('../model/Stock.model');
const SpareParts = require('../model/SpareParts.model');
const Income = require('../model/Income.model');
const ErpRecord = require('../model/ErpRecord.model');
const Customer = require('../model/Customer.model');
const Supplier = require('../model/Supplier.model');
const { getAllModuleData } = require('../services/universalDataSync.service');

const formatCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
const formatDisplayDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-IN');
  }
  return value;
};

const isPendingStatus = (status = '') =>
  !['Received', 'Delivered', 'Paid', 'Collected', 'Completed', 'Cancelled', 'Resolved', 'Closed'].includes(status);

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
      todayPurchaseIncome,
      openTickets,
      totalCustomers,
      recentSalesOrders,
      recentInvoices,
      recentServiceTickets,
      pendingPOs,
      receivables,
      payables,
    ] = await Promise.all([
      Employee.countDocuments(),
      Promise.all([Stock.countDocuments(), SpareParts.countDocuments()]).then(([s, p]) => s + p),
      Stock.countDocuments({
        $expr: {
          $lte: ['$quantity', '$minimumStock'],
        },
      }),
      SpareParts.countDocuments({
        $expr: {
          $lte: ['$quantity', '$minimumStock'],
        },
      }),
      Income.aggregate([
        { $match: { incomeType: 'Sales', date: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Income.aggregate([
        { $match: { incomeType: 'Purchase', date: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      ErpRecord.countDocuments({ module: 'service', recordType: 'ticket', status: 'Open' }),
      Customer.countDocuments(),
      ErpRecord.find({ module: 'sales', recordType: 'order' }).sort({ createdAt: -1 }).limit(5),
      ErpRecord.find({ module: 'sales', recordType: 'invoice' }).sort({ createdAt: -1 }).limit(5),
      ErpRecord.find({ module: 'service', recordType: 'ticket' }).sort({ createdAt: -1 }).limit(5),
      ErpRecord.find({ module: 'purchase', recordType: 'order' }).sort({ createdAt: -1 }).limit(5),
      ErpRecord.aggregate([
        {
          $match: {
            module: 'accounts',
            recordType: 'receivable',
            status: { $nin: ['Collected', 'Paid', 'Received'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      ErpRecord.aggregate([
        {
          $match: {
            module: 'accounts',
            recordType: 'payable',
            status: { $nin: ['Paid', 'Collected', 'Received'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const salesTotal = todayIncome[0]?.total || 0;
    const purchaseTotal = todayPurchaseIncome[0]?.total || 0;
    const lowStockTotal = lowStockItems + spareLowStock;
    const totalReceivables = receivables[0]?.total || 0;
    const totalPayables = payables[0]?.total || 0;

    const orders = [
      ...recentSalesOrders.map((o) => ({
        id: o.id,
        customer: o.customer,
        amount: formatCurrency(o.amount),
        date: formatDisplayDate(o.date),
        status: o.status,
        createdAt: o.createdAt,
      })),
      ...recentInvoices.map((i) => ({
        id: i.id,
        customer: i.customer,
        amount: formatCurrency(i.amount),
        date: formatDisplayDate(i.date),
        status: i.status,
        createdAt: i.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(({ createdAt, ...row }) => row);

    const tickets = recentServiceTickets.map((t) => ({
      id: t.id,
      customer: t.customer,
      machine: t.machine,
      issue: t.issue,
      engineer: t.engineer || 'Unassigned',
      status: t.status,
    }));

    const pos = pendingPOs
      .filter((p) => isPendingStatus(p.status))
      .map((p) => ({
        id: p.id,
        supplier: p.supplier,
        amount: formatCurrency(p.amount),
        date: formatDisplayDate(p.date),
        delivery: formatDisplayDate(p.delivery),
        status: p.status,
      }));

    res.status(200).json({
      stats: {
        todaySales: formatCurrency(salesTotal),
        todayPurchases: formatCurrency(purchaseTotal),
        lowStockAlerts: `${lowStockTotal} Parts`,
        lowStockCount: lowStockTotal,
        pendingPayments: formatCurrency(totalPayables),
        totalReceivables: formatCurrency(totalReceivables),
        totalReceivablesRaw: totalReceivables,
        totalPayables: formatCurrency(totalPayables),
        totalPayablesRaw: totalPayables,
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

const getAllModuleDataController = async (req, res) => {
  try {
    const allData = await getAllModuleData();
    res.status(200).json(allData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const globalSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') {
      return res.status(200).json({ results: [], total: 0 });
    }

    const searchTerm = query.trim().toLowerCase();
    const results = [];

    // Search Employees
    const employees = await Employee.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
      ]
    }).limit(10);
    employees.forEach(emp => {
      results.push({
        type: 'Employee',
        id: emp.id,
        name: emp.name,
        description: `${emp.department?.name || 'N/A'} - ${emp.designation?.name || 'N/A'}`,
        link: 'employee',
      });
    });

    // Search Customers
    const customers = await Customer.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { companyName: { $regex: searchTerm, $options: 'i' } },
      ]
    }).limit(10);
    customers.forEach(cust => {
      results.push({
        type: 'Customer',
        id: cust.id,
        name: cust.name,
        description: cust.companyName || cust.city || 'Customer',
        link: 'sales',
      });
    });

    // Search Suppliers
    const suppliers = await Supplier.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { contact: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { city: { $regex: searchTerm, $options: 'i' } },
      ]
    }).limit(10);
    suppliers.forEach(sup => {
      results.push({
        type: 'Supplier',
        id: sup.id,
        name: sup.name,
        description: sup.city || 'Supplier',
        link: 'purchase',
      });
    });

    // Search Stock
    const stockItems = await Stock.find({
      $or: [
        { itemName: { $regex: searchTerm, $options: 'i' } },
        { itemCode: { $regex: searchTerm, $options: 'i' } },
        { category: { $regex: searchTerm, $options: 'i' } },
      ]
    }).limit(10);
    stockItems.forEach(item => {
      results.push({
        type: 'Stock',
        id: item.id,
        name: item.itemName,
        description: `${item.category} - Qty: ${item.quantity}`,
        link: 'warehouse',
      });
    });

    // Search Spare Parts
    const spareParts = await SpareParts.find({
      $or: [
        { partName: { $regex: searchTerm, $options: 'i' } },
        { partNumber: { $regex: searchTerm, $options: 'i' } },
        { category: { $regex: searchTerm, $options: 'i' } },
        { brand: { $regex: searchTerm, $options: 'i' } },
      ]
    }).limit(10);
    spareParts.forEach(part => {
      results.push({
        type: 'Spare Part',
        id: part.id,
        name: part.partName,
        description: `${part.partNumber} - ${part.brand}`,
        link: 'spareparts',
      });
    });

    // Search ERP Records
    const erpRecords = await ErpRecord.find({
      $or: [
        { customer: { $regex: searchTerm, $options: 'i' } },
        { supplier: { $regex: searchTerm, $options: 'i' } },
        { emp: { $regex: searchTerm, $options: 'i' } },
        { part: { $regex: searchTerm, $options: 'i' } },
        { id: { $regex: searchTerm, $options: 'i' } },
      ]
    }).limit(15);
    erpRecords.forEach(record => {
      results.push({
        type: record.module.toUpperCase(),
        id: record.id,
        name: record.customer || record.supplier || record.emp || record.part || record.id,
        description: `${record.recordType} - ${record.status || 'Active'}`,
        link: record.module,
      });
    });

    res.status(200).json({ results, total: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAttendanceStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [activeEmployees, todayRecords, leaveRecords] = await Promise.all([
      Employee.find({ status: 'Active' }, { _id: 1, id: 1 }),
      Attendance.find({ date: today, recordType: 'attendance' }),
      Attendance.find({
        recordType: 'leave',
        status: 'Approved',
        $or: [
          { date: today },
          {
            from: { $lte: today },
            to: { $gte: today },
          },
        ],
      }),
    ]);

    const employeeKey = (record) => String(record.employeeId || record.empId || '').trim();
    const activeIds = new Set(activeEmployees.map((employee) => String(employee._id)));
    const activeEmpCodes = new Set(activeEmployees.map((employee) => String(employee.id)));
    const isActiveRecord = (record) => {
      const key = employeeKey(record);
      return activeIds.has(key) || activeEmpCodes.has(key);
    };

    const filteredTodayRecords = todayRecords.filter(isActiveRecord);
    const filteredLeaveRecords = leaveRecords.filter(isActiveRecord);
    const presentRecords = filteredTodayRecords.filter((r) => r.status === 'Present');
    const lateRecords = filteredTodayRecords.filter((r) => r.status === 'Late');
    const coveredEmployees = new Set(
      [...presentRecords, ...lateRecords, ...filteredLeaveRecords]
        .map(employeeKey)
        .filter(Boolean)
    );

    const present = presentRecords.length;
    const late = lateRecords.length;
    const leave = filteredLeaveRecords.length;
    const absent = Math.max(0, activeEmployees.length - coveredEmployees.size);

    res.status(200).json({
      todayPresent: present,
      todayLate: late,
      todayLeave: leave,
      todayAbsent: absent,
      totalActive: activeEmployees.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getAllModuleData: getAllModuleDataController,
  globalSearch,
  getAttendanceStats,
};
