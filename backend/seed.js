const Department = require('../model/Depart.model');
const Designation = require('../model/Designation.model');
const Employee = require('../model/Empl.model');
const User = require('../model/User.model');
const Customer = require('../model/Customer.model');
const Stock = require('../model/Stock.model');
const SpareParts = require('../model/SpareParts.model');
const Income = require('../model/Income.model');
const Supplier = require('../model/Supplier.model');
const ErpRecord = require('../model/ErpRecord.model');
const Attendance = require('../model/Attendance.model');
const bcrypt = require('bcrypt');

const erp = (module, recordType, data) => ({ module, recordType, ...data });

async function seedDatabase() {
  const existing = await ErpRecord.countDocuments();
  if (existing > 0) {
    console.log('[Seed] Data already exists, skipping seed.');
    return;
  }

  console.log('[Seed] Populating initial data...');

  // Departments
  const depts = await Department.insertMany([
    { id: 'DEPT001', title: 'Sales', isActive: true },
    { id: 'DEPT002', title: 'Purchase', isActive: true },
    { id: 'DEPT003', title: 'HR', isActive: true },
    { id: 'DEPT004', title: 'Inventory', isActive: true },
    { id: 'DEPT005', title: 'Service', isActive: true },
  ]);

  const desigs = await Designation.insertMany([
    { id: 'DES001', title: 'Sales Manager', department: depts[0]._id, isActive: true },
    { id: 'DES002', title: 'Purchase Executive', department: depts[1]._id, isActive: true },
    { id: 'DES003', title: 'HR Manager', department: depts[2]._id, isActive: true },
    { id: 'DES004', title: 'Service Engineer', department: depts[4]._id, isActive: true },
  ]);

  const employees = await Employee.insertMany([
    { id: 'EMP001', name: 'Rajesh Kumar', email: 'rajesh@airjet.in', phoneNo: 9876501001, department: depts[0]._id, designation: desigs[0]._id, salary: 35000, gender: 'Male', workShift: 'Day', status: 'Active' },
    { id: 'EMP002', name: 'Priya Sharma', email: 'priya@airjet.in', phoneNo: 9876501002, department: depts[0]._id, designation: desigs[0]._id, salary: 30000, gender: 'Female', workShift: 'Day', status: 'Active' },
    { id: 'EMP003', name: 'Amit Patel', email: 'amit@airjet.in', phoneNo: 9876501003, department: depts[1]._id, designation: desigs[1]._id, salary: 32000, gender: 'Male', workShift: 'Day', status: 'Active' },
    { id: 'EMP005', name: 'Karan Mehta', email: 'karan@airjet.in', phoneNo: 9876501005, department: depts[3]._id, designation: desigs[1]._id, salary: 28000, gender: 'Male', workShift: 'Rotational', status: 'Active' },
    { id: 'EMP006', name: 'Divya Verma', email: 'divya@airjet.in', phoneNo: 9876501006, department: depts[4]._id, designation: desigs[3]._id, salary: 29000, gender: 'Female', workShift: 'Day', status: 'Active' },
    { id: 'EMP007', name: 'Nikhil Rao', email: 'nikhil@airjet.in', phoneNo: 9876501007, department: depts[4]._id, designation: desigs[3]._id, salary: 31000, gender: 'Male', workShift: 'Day', status: 'Active' },
  ]);

  const hashed = await bcrypt.hash('admin123', 10);
  await User.create({
    id: 'USR001',
    employeeId: employees[0]._id,
    role: 'Admin',
    password: hashed,
    confirmPassword: hashed,
    isVerified: true,
    status: 'Active',
  });

  await Customer.insertMany([
    { id: 'CUS001', name: 'Shree Textile Mills', email: 'shree@textile.com', phone: '9876510001', city: 'Surat', gstNumber: '24AABCS1234A1Z5', customerType: 'Business', status: 'Active' },
    { id: 'CUS002', name: 'National Weaving Works', email: 'national@weaving.com', phone: '9876510002', city: 'Ahmedabad', gstNumber: '24AABCN5678B1Z2', customerType: 'Business', status: 'Active' },
    { id: 'CUS003', name: 'Modi Fabric Industries', email: 'modi@fabric.com', phone: '9876510003', city: 'Mumbai', gstNumber: '27AABCM9012C1Z9', customerType: 'Business', status: 'Active' },
  ]);

  await Supplier.insertMany([
    { id: 'SUP001', name: 'Techno Parts Pvt Ltd', contact: 'Suresh Shah', phone: '9876500001', city: 'Surat', gst: '24AAACT2727Q1ZX', status: 'Active' },
    { id: 'SUP002', name: 'Global Machinery Co.', contact: 'Rekha Patel', phone: '9876500002', city: 'Ahmedabad', gst: '24AABCG1234A1Z5', status: 'Active' },
    { id: 'SUP003', name: 'Airjet Components Ltd', contact: 'Manoj Kumar', phone: '9876500003', city: 'Mumbai', gst: '27AABCA5678B1Z2', status: 'Active' },
  ]);

  await Stock.insertMany([
    { id: 'STK001', itemName: 'Reed Valve Assembly', itemCode: 'AJ-RV-001', category: 'Valve', quantity: 142, unit: 'pcs', unitPrice: 500, totalPrice: 71000, location: 'WH-001', minimumStock: 20, status: 'In Stock' },
    { id: 'STK002', itemName: 'Air Jet Nozzle Set', itemCode: 'AJ-NZ-012', category: 'Nozzle', quantity: 8, unit: 'sets', unitPrice: 850, totalPrice: 6800, location: 'WH-001', minimumStock: 15, status: 'Low Stock' },
    { id: 'STK003', itemName: 'Main Shaft Bearing', itemCode: 'AJ-SB-007', category: 'Bearing', quantity: 84, unit: 'pcs', unitPrice: 2500, totalPrice: 210000, location: 'WH-002', minimumStock: 25, status: 'In Stock' },
  ]);

  await SpareParts.insertMany([
    { id: 'SP001', partName: 'Reed Valve Assembly', partNumber: 'AJ-RV-001', category: 'Valve', brand: 'AirTex', model: 'AT-200', compatibility: ['AT-200', 'AT-300'], quantity: 142, unitPrice: 500, sellingPrice: 650, minimumStock: 20, status: 'Available' },
    { id: 'SP002', partName: 'Air Jet Nozzle Set', partNumber: 'AJ-NZ-012', category: 'Nozzle', brand: 'JetPro', model: 'JP-150', compatibility: ['JP-150'], quantity: 8, unitPrice: 700, sellingPrice: 850, minimumStock: 15, status: 'Low Stock' },
    { id: 'SP003', partName: 'Weft Detector Sensor', partNumber: 'AJ-WD-034', category: 'Sensor', brand: 'SenseTech', model: 'ST-400', compatibility: ['ST-400'], quantity: 97, unitPrice: 400, sellingPrice: 550, minimumStock: 10, status: 'Available' },
  ]);

  await Income.insertMany([
    { id: 'INC001', incomeType: 'Purchase', amount: 124500, date: new Date('2026-06-20'), description: 'Techno Parts Pvt Ltd', paymentStatus: 'Pending', paymentMethod: 'Bank Transfer' },
    { id: 'INC002', incomeType: 'Purchase', amount: 210000, date: new Date('2026-06-15'), description: 'Airjet Components Ltd', paymentStatus: 'Partial', paymentMethod: 'Bank Transfer' },
    { id: 'INC003', incomeType: 'Sales', amount: 24500, date: new Date('2026-06-20'), description: 'Shree Textile Mills', paymentStatus: 'Pending', paymentMethod: 'Bank Transfer', invoiceNumber: 'INV-001' },
  ]);

  await ErpRecord.insertMany([
    // Payroll
    erp('payroll', 'salary', { id: 'PAY-001', emp: 'Rajesh Kumar', empId: 'EMP001', month: 'June 2026', basic: 35000, allowances: 8000, deductions: 3500, net: 39500, status: 'Generated' }),
    erp('payroll', 'salary', { id: 'PAY-002', emp: 'Priya Sharma', empId: 'EMP002', month: 'June 2026', basic: 30000, allowances: 7000, deductions: 3000, net: 34000, status: 'Generated' }),
    erp('payroll', 'salary', { id: 'PAY-003', emp: 'Amit Patel', empId: 'EMP003', month: 'June 2026', basic: 32000, allowances: 7500, deductions: 3200, net: 36300, status: 'Paid' }),
    erp('payroll', 'allowance', { id: 'ALW-001', emp: 'Rajesh Kumar', empId: 'EMP001', type: 'HRA', amount: 5000, month: 'Jun 2026', status: 'Active' }),
    erp('payroll', 'allowance', { id: 'ALW-002', emp: 'Priya Sharma', empId: 'EMP002', type: 'Travel Allow.', amount: 2000, month: 'Jun 2026', status: 'Active' }),
    erp('payroll', 'deduction', { id: 'DED-001', emp: 'Rajesh Kumar', empId: 'EMP001', type: 'PF', amount: 2100, month: 'Jun 2026', status: 'Applied' }),
    erp('payroll', 'deduction', { id: 'DED-002', emp: 'Priya Sharma', empId: 'EMP002', type: 'ESI', amount: 450, month: 'Jun 2026', status: 'Applied' }),
    erp('payroll', 'payslip', { id: 'SLP-001', emp: 'Rajesh Kumar', empId: 'EMP001', month: 'Jun 2026', net: 39500, generated: '25-Jun-2026', status: 'Sent' }),
    erp('payroll', 'payslip', { id: 'SLP-002', emp: 'Priya Sharma', empId: 'EMP002', month: 'Jun 2026', net: 34000, generated: '25-Jun-2026', status: 'Sent' }),
    // Purchase
    erp('purchase', 'grn', { id: 'GRN-001', po: 'PO-002', supplier: 'Global Machinery Co.', date: '25-Jun-2026', items: 8, amount: 87200, receivedBy: 'Karan Mehta', status: 'Verified' }),
    erp('purchase', 'grn', { id: 'GRN-002', po: 'PO-003', supplier: 'Airjet Components Ltd', date: '22-Jun-2026', items: 18, amount: 198000, receivedBy: 'Nikhil Rao', status: 'Partial' }),
    erp('purchase', 'return', { id: 'RET-001', supplier: 'Techno Parts Pvt Ltd', part: 'Reed Valve Assembly', qty: 5, date: '21-Jun-2026', reason: 'Defective parts', amount: 2500, status: 'Approved' }),
    // Sales
    erp('sales', 'quotation', { id: 'QT-001', customer: 'Shree Textile Mills', date: '18-Jun-2026', items: 8, amount: 38400, validTill: '28-Jun-2026', status: 'Sent' }),
    erp('sales', 'quotation', { id: 'QT-002', customer: 'Modi Fabric Industries', date: '16-Jun-2026', items: 5, amount: 22500, validTill: '26-Jun-2026', status: 'Accepted' }),
    erp('sales', 'order', { id: 'SO-001', customer: 'Modi Fabric Industries', date: '17-Jun-2026', items: 5, amount: 22500, delivery: '27-Jun-2026', status: 'Confirmed' }),
    erp('sales', 'order', { id: 'SO-002', customer: 'Shree Textile Mills', date: '19-Jun-2026', items: 8, amount: 38400, delivery: '29-Jun-2026', status: 'Processing' }),
    erp('sales', 'invoice', { id: 'INV-001', customer: 'Shree Textile Mills', date: '20-Jun-2026', items: 6, amount: 24500, due: '30-Jun-2026', status: 'Unpaid' }),
    erp('sales', 'invoice', { id: 'INV-002', customer: 'National Weaving Works', date: '18-Jun-2026', items: 4, amount: 18000, due: '28-Jun-2026', status: 'Paid' }),
    // Warehouse
    erp('warehouse', 'transfer', { id: 'TRF-001', from: 'WH-001', to: 'WH-002', part: 'Reed Valve Assembly', qty: 50, date: '20-Jun-2026', status: 'Completed' }),
    erp('warehouse', 'transfer', { id: 'TRF-002', from: 'WH-001', to: 'WH-003', part: 'Air Jet Nozzle Set', qty: 20, date: '21-Jun-2026', status: 'In Transit' }),
    erp('warehouse', 'audit', { id: 'AUD-001', location: 'WH-001', date: '20-Jun-2026', items: 45, status: 'Completed', notes: 'All items verified' }),
    // Service
    erp('service', 'ticket', { id: 'SRV-001', customer: 'Shree Textile Mills', machine: 'AirJet AT-200', issue: 'Nozzle blockage', engineer: 'Divya Verma', date: '20-Jun-2026', status: 'Open', priority: 'High' }),
    erp('service', 'ticket', { id: 'SRV-002', customer: 'National Weaving Works', machine: 'AirJet JP-150', issue: 'Weft sensor failure', engineer: 'Nikhil Rao', date: '19-Jun-2026', status: 'In Progress', priority: 'Medium' }),
    erp('service', 'assignment', { id: 'ASG-001', engineer: 'Divya Verma', empId: 'EMP006', assigned: 2, inProgress: 1, resolved: 4, expertise: 'Nozzle, Valve Systems', available: 'Yes' }),
    erp('service', 'report', { id: 'SR-001', ticket: 'SRV-003', customer: 'Modi Fabric Industries', engineer: 'Divya Verma', date: '18-Jun-2026', parts: 'Nozzle Set x2', hours: '4h 30m', cost: '₹3,200', status: 'Completed' }),
    // Accounts
    erp('accounts', 'receivable', { id: 'RCV-001', party: 'Shree Textile Mills', type: 'Invoice', amount: 24500, dueDate: '30-Jun-2026', status: 'Pending' }),
    erp('accounts', 'receivable', { id: 'RCV-002', party: 'Modi Fabric Industries', type: 'Invoice', amount: 42000, dueDate: '25-Jun-2026', status: 'Overdue' }),
    erp('accounts', 'payable', { id: 'PAYB-001', party: 'Techno Parts Pvt Ltd', type: 'Purchase Order', amount: 124500, dueDate: '28-Jun-2026', status: 'Pending' }),
    erp('accounts', 'ledger', { id: 'LED-001', party: 'Shree Textile Mills', type: 'Sales', debit: 0, credit: 24500, balance: 24500, date: '20-Jun-2026', status: 'Posted' }),
    erp('accounts', 'gst', { id: 'GST-001', period: 'Jun 2026', type: 'Output GST', gstAmount: 4410, amount: 24500, status: 'Filed' }),
    erp('accounts', 'pl', { id: 'PL-001', period: 'Jun 2026', revenue: 324500, expenses: 211700, profit: 112800, status: 'Draft' }),
  ]);

  await Attendance.insertMany([
    { id: 'ATT-001', recordType: 'attendance', emp: 'Rajesh Kumar', empId: 'EMP001', date: '2026-06-23', checkIn: '09:05', checkOut: '18:10', hours: '9h 05m', status: 'Present' },
    { id: 'ATT-002', recordType: 'attendance', emp: 'Priya Sharma', empId: 'EMP002', date: '2026-06-23', checkIn: '09:30', checkOut: '18:00', hours: '8h 30m', status: 'Late' },
    { id: 'LVE-001', recordType: 'leave', emp: 'Divya Verma', empId: 'EMP006', from: '2026-06-23', to: '2026-06-25', days: 3, type: 'Sick Leave', reason: 'Fever and rest', status: 'Approved' },
  ]);

  console.log('[Seed] Initial data populated successfully.');
  console.log('[Seed] Admin login: rajesh@airjet.in / admin123');
}

module.exports = { seedDatabase };
