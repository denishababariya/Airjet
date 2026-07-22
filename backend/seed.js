const mongoose = require('mongoose');
const Department = require('./model/Depart.model');
const Designation = require('./model/Designation.model');
const Employee = require('./model/Empl.model');
const User = require('./model/User.model');
const Customer = require('./model/Customer.model');
const Stock = require('./model/Stock.model');
const SpareParts = require('./model/SpareParts.model');
const Income = require('./model/Income.model');
const Supplier = require('./model/Supplier.model');
const ErpRecord = require('./model/ErpRecord.model');
const Attendance = require('./model/Attendance.model');
const bcrypt = require('bcrypt');
require('dotenv').config();

const erp = (module, recordType, data) => ({ module, recordType, ...data });

async function seedDatabase() {
  // Check if data already exists
  const existingRecords = await ErpRecord.countDocuments();
  if (existingRecords > 0) {
    console.log('[Seed] Data already exists, skipping seed.');
    return;
  }
  
  // Clear existing data only if no data exists
  console.log('[Seed] Clearing existing data...');
  await Promise.all([
    Department.deleteMany({}),
    Designation.deleteMany({}),
    Employee.deleteMany({}),
    User.deleteMany({}),
    Customer.deleteMany({}),
    Stock.deleteMany({}),
    SpareParts.deleteMany({}),
    Income.deleteMany({}),
    Supplier.deleteMany({}),
    ErpRecord.deleteMany({}),
    Attendance.deleteMany({}),
  ]);
  console.log('[Seed] Existing data cleared.');

  console.log('[Seed] Populating initial data...');

  // Get dates
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  // Departments
  const depts = await Department.insertMany([
    { id: 'DEPT001', title: 'Sales', isActive: true },
    { id: 'DEPT002', title: 'Purchase', isActive: true },
    { id: 'DEPT003', title: 'HR', isActive: true },
    { id: 'DEPT004', title: 'Inventory', isActive: true },
    { id: 'DEPT005', title: 'Service', isActive: true },
    { id: 'DEPT006', title: 'Accounts', isActive: true },
  ]);

  const desigs = await Designation.insertMany([
    { id: 'DES001', title: 'Sales Manager', department: depts[0]._id, isActive: true },
    { id: 'DES002', title: 'Sales Executive', department: depts[0]._id, isActive: true },
    { id: 'DES003', title: 'Purchase Manager', department: depts[1]._id, isActive: true },
    { id: 'DES004', title: 'Purchase Executive', department: depts[1]._id, isActive: true },
    { id: 'DES005', title: 'HR Manager', department: depts[2]._id, isActive: true },
    { id: 'DES006', title: 'HR Executive', department: depts[2]._id, isActive: true },
    { id: 'DES007', title: 'Inventory Manager', department: depts[3]._id, isActive: true },
    { id: 'DES008', title: 'Storekeeper', department: depts[3]._id, isActive: true },
    { id: 'DES009', title: 'Service Manager', department: depts[4]._id, isActive: true },
    { id: 'DES010', title: 'Service Engineer', department: depts[4]._id, isActive: true },
    { id: 'DES011', title: 'Accountant', department: depts[5]._id, isActive: true },
  ]);

  const employees = await Employee.insertMany([
    { 
      id: 'EMP001', name: 'Rajesh Kumar', email: 'rajesh@airjet.in', phoneNo: 9876501001, 
      address: '123, Main Road, Surat', gender: 'Male', salary: 35000, workShift: 'Day', 
      cast: 'General', bod: new Date('1990-05-15'), age: 36, joiningDate: new Date('2020-01-10'),
      department: depts[0]._id, designation: desigs[0]._id, status: 'Active' 
    },
    { 
      id: 'EMP002', name: 'Priya Sharma', email: 'priya@airjet.in', phoneNo: 9876501002, 
      address: '456, Park Street, Ahmedabad', gender: 'Female', salary: 30000, workShift: 'Day', 
      cast: 'OBC', bod: new Date('1995-08-22'), age: 31, joiningDate: new Date('2021-03-15'),
      department: depts[0]._id, designation: desigs[1]._id, status: 'Active' 
    },
    { 
      id: 'EMP003', name: 'Amit Patel', email: 'amit@airjet.in', phoneNo: 9876501003, 
      address: '789, Market Yard, Mumbai', gender: 'Male', salary: 32000, workShift: 'Day', 
      cast: 'SC', bod: new Date('1988-11-30'), age: 38, joiningDate: new Date('2019-07-01'),
      department: depts[1]._id, designation: desigs[2]._id, status: 'Active' 
    },
    { 
      id: 'EMP004', name: 'Sunita Singh', email: 'sunita@airjet.in', phoneNo: 9876501004, 
      address: '101, Green Colony, Vadodara', gender: 'Female', salary: 25000, workShift: 'Day', 
      cast: 'ST', bod: new Date('1997-02-18'), age: 29, joiningDate: new Date('2022-09-05'),
      department: depts[1]._id, designation: desigs[3]._id, status: 'Active' 
    },
    { 
      id: 'EMP005', name: 'Karan Mehta', email: 'karan@airjet.in', phoneNo: 9876501005, 
      address: '202, River View, Rajkot', gender: 'Male', salary: 28000, workShift: 'Rotational', 
      cast: 'General', bod: new Date('1993-04-25'), age: 33, joiningDate: new Date('2020-11-20'),
      department: depts[3]._id, designation: desigs[7]._id, status: 'Active' 
    },
    { 
      id: 'EMP006', name: 'Divya Verma', email: 'divya@airjet.in', phoneNo: 9876501006, 
      address: '303, Skyline, Surat', gender: 'Female', salary: 29000, workShift: 'Day', 
      cast: 'OBC', bod: new Date('1996-09-10'), age: 30, joiningDate: new Date('2021-06-12'),
      department: depts[4]._id, designation: desigs[9]._id, status: 'Active' 
    },
    { 
      id: 'EMP007', name: 'Nikhil Rao', email: 'nikhil@airjet.in', phoneNo: 9876501007, 
      address: '404, Lake Road, Ahmedabad', gender: 'Male', salary: 31000, workShift: 'Day', 
      cast: 'General', bod: new Date('1991-12-05'), age: 35, joiningDate: new Date('2019-02-28'),
      department: depts[4]._id, designation: desigs[9]._id, status: 'Active' 
    },
    { 
      id: 'EMP008', name: 'Meera Joshi', email: 'meera@airjet.in', phoneNo: 9876501008, 
      address: '505, Hill View, Surat', gender: 'Female', salary: 27000, workShift: 'Day', 
      cast: 'SC', bod: new Date('1994-07-07'), age: 32, joiningDate: new Date('2022-01-10'),
      department: depts[5]._id, designation: desigs[10]._id, status: 'Active' 
    },
  ]);

  const hashed = await bcrypt.hash('admin123', 10);
  await User.insertMany([
    { id: 'USR001', employeeId: employees[0]._id, role: 'Admin', password: hashed, confirmPassword: hashed, isVerified: true, status: 'Active' },
    { id: 'USR002', employeeId: employees[2]._id, role: 'Manager', password: hashed, confirmPassword: hashed, isVerified: true, status: 'Active' },
    { id: 'USR003', employeeId: employees[4]._id, role: 'HR', password: hashed, confirmPassword: hashed, isVerified: true, status: 'Active' },
  ]);

  // Departments with employee heads
  const deptsWithHeads = await Promise.all(depts.map(async (dept, index) => {
    const headEmployeeIndex = [0, 2, 4, 5, 6, 7][index];
    dept.head = employees[headEmployeeIndex]._id;
    await dept.save();
    return dept;
  }));

  await Customer.insertMany([
    { id: 'CUS001', name: 'Shree Textile Mills', email: 'shree@textile.com', phone: '9876510001', city: 'Surat', gstNumber: '24AABCS1234A1Z5', customerType: 'Business', status: 'Active' },
    { id: 'CUS002', name: 'National Weaving Works', email: 'national@weaving.com', phone: '9876510002', city: 'Ahmedabad', gstNumber: '24AABCN5678B1Z2', customerType: 'Business', status: 'Active' },
    { id: 'CUS003', name: 'Modi Fabric Industries', email: 'modi@fabric.com', phone: '9876510003', city: 'Mumbai', gstNumber: '27AABCM9012C1Z9', customerType: 'Business', status: 'Active' },
    { id: 'CUS004', name: 'Jai Hind Textiles', email: 'jaihind@textiles.com', phone: '9876510004', city: 'Vadodara', gstNumber: '24AABCJ1234D1Z3', customerType: 'Business', status: 'Active' },
    { id: 'CUS005', name: 'Reliable Looms Pvt Ltd', email: 'reliable@looms.com', phone: '9876510005', city: 'Rajkot', gstNumber: '24AABCK5678E1Z8', customerType: 'Business', status: 'Active' },
  ]);

  await Supplier.insertMany([
    { id: 'SUP001', name: 'Techno Parts Pvt Ltd', contact: 'Suresh Shah', phone: '9876500001', city: 'Surat', gst: '24AAACT2727Q1ZX', status: 'Active' },
    { id: 'SUP002', name: 'Global Machinery Co.', contact: 'Rekha Patel', phone: '9876500002', city: 'Ahmedabad', gst: '24AABCG1234A1Z5', status: 'Active' },
    { id: 'SUP003', name: 'Airjet Components Ltd', contact: 'Manoj Kumar', phone: '9876500003', city: 'Mumbai', gst: '27AABCA5678B1Z2', status: 'Active' },
    { id: 'SUP004', name: 'Precision Bearings Inc.', contact: 'Arjun Desai', phone: '9876500004', city: 'Vadodara', gst: '24AABCC9012F1Z7', status: 'Active' },
    { id: 'SUP005', name: 'Industrial Sensors & Co.', contact: 'Neha Singh', phone: '9876500005', city: 'Rajkot', gst: '24AABCH3456G1Z4', status: 'Active' },
  ]);

  await Stock.insertMany([
    { id: 'STK001', itemName: 'Reed Valve Assembly', itemCode: 'AJ-RV-001', category: 'Valve', quantity: 142, unit: 'pcs', unitPrice: 500, totalPrice: 71000, location: 'WH-001', minimumStock: 20, status: 'In Stock' },
    { id: 'STK002', itemName: 'Air Jet Nozzle Set', itemCode: 'AJ-NZ-012', category: 'Nozzle', quantity: 8, unit: 'sets', unitPrice: 850, totalPrice: 6800, location: 'WH-001', minimumStock: 15, status: 'Low Stock' },
    { id: 'STK003', itemName: 'Main Shaft Bearing', itemCode: 'AJ-SB-007', category: 'Bearing', quantity: 84, unit: 'pcs', unitPrice: 2500, totalPrice: 210000, location: 'WH-002', minimumStock: 25, status: 'In Stock' },
    { id: 'STK004', itemName: 'Camshaft Assembly', itemCode: 'AJ-CA-005', category: 'Shaft', quantity: 35, unit: 'pcs', unitPrice: 4500, totalPrice: 157500, location: 'WH-001', minimumStock: 10, status: 'In Stock' },
    { id: 'STK005', itemName: 'Pressure Gauge', itemCode: 'AJ-PG-022', category: 'Gauge', quantity: 12, unit: 'pcs', unitPrice: 1200, totalPrice: 14400, location: 'WH-002', minimumStock: 5, status: 'Low Stock' },
    { id: 'STK006', itemName: 'Motor Starter', itemCode: 'AJ-MS-018', category: 'Electrical', quantity: 22, unit: 'pcs', unitPrice: 8900, totalPrice: 195800, location: 'WH-003', minimumStock: 8, status: 'In Stock' },
  ]);

  await SpareParts.insertMany([
    { id: 'SP001', partName: 'Reed Valve Assembly', partNumber: 'AJ-RV-001', category: 'Valve', brand: 'AirTex', model: 'AT-200', compatibility: ['AT-200', 'AT-300'], quantity: 142, unitPrice: 500, sellingPrice: 650, minimumStock: 20, status: 'Available' },
    { id: 'SP002', partName: 'Air Jet Nozzle Set', partNumber: 'AJ-NZ-012', category: 'Nozzle', brand: 'JetPro', model: 'JP-150', compatibility: ['JP-150'], quantity: 8, unitPrice: 700, sellingPrice: 850, minimumStock: 15, status: 'Low Stock' },
    { id: 'SP003', partName: 'Weft Detector Sensor', partNumber: 'AJ-WD-034', category: 'Sensor', brand: 'SenseTech', model: 'ST-400', compatibility: ['ST-400'], quantity: 97, unitPrice: 400, sellingPrice: 550, minimumStock: 10, status: 'Available' },
    { id: 'SP004', partName: 'Camshaft Assembly', partNumber: 'AJ-CA-005', category: 'Shaft', brand: 'Precision', model: 'PR-500', compatibility: ['PR-500', 'PR-600'], quantity: 35, unitPrice: 4500, sellingPrice: 5800, minimumStock: 10, status: 'Available' },
    { id: 'SP005', partName: 'Pressure Gauge', partNumber: 'AJ-PG-022', category: 'Gauge', brand: 'MeterMax', model: 'MM-100', compatibility: ['MM-100', 'MM-200'], quantity: 12, unitPrice: 1200, sellingPrice: 1600, minimumStock: 5, status: 'Low Stock' },
    { id: 'SP006', partName: 'Motor Starter', partNumber: 'AJ-MS-018', category: 'Electrical', brand: 'ElectroPro', model: 'EP-2000', compatibility: ['EP-2000', 'EP-3000'], quantity: 22, unitPrice: 8900, sellingPrice: 11500, minimumStock: 8, status: 'Available' },
  ]);

  // Format dates for ErpRecord
  const formatDate = (date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  const formatDateISO = (date) => date.toISOString().split('T')[0];

  await Income.insertMany([
    { id: 'INC001', incomeType: 'Purchase', amount: 124500, date: yesterday, description: 'Techno Parts Pvt Ltd', paymentStatus: 'Pending', paymentMethod: 'Bank Transfer', invoiceNumber: 'INC-001' },
    { id: 'INC002', incomeType: 'Purchase', amount: 210000, date: twoDaysAgo, description: 'Airjet Components Ltd', paymentStatus: 'Partial', paymentMethod: 'Bank Transfer', invoiceNumber: 'INC-002' },
    { id: 'INC003', incomeType: 'Sales', amount: 24500, date: today, description: 'Shree Textile Mills', paymentStatus: 'Pending', paymentMethod: 'Bank Transfer', invoiceNumber: 'INV-001' },
    { id: 'INC004', incomeType: 'Sales', amount: 18000, date: yesterday, description: 'National Weaving Works', paymentStatus: 'Completed', paymentMethod: 'Cash', invoiceNumber: 'INV-002' },
    { id: 'INC005', incomeType: 'Purchase', amount: 87200, date: threeDaysAgo, description: 'Global Machinery Co.', paymentStatus: 'Completed', paymentMethod: 'Cheque', invoiceNumber: 'INC-003' },
  ]);

  await ErpRecord.insertMany([
    // Payroll
    erp('payroll', 'salary', { id: 'PAY-001', emp: 'Rajesh Kumar', empId: 'EMP001', month: 'July 2026', basic: 35000, allowances: 8000, deductions: 3500, net: 39500, status: 'Generated' }),
    erp('payroll', 'salary', { id: 'PAY-002', emp: 'Priya Sharma', empId: 'EMP002', month: 'July 2026', basic: 30000, allowances: 7000, deductions: 3000, net: 34000, status: 'Generated' }),
    erp('payroll', 'salary', { id: 'PAY-003', emp: 'Amit Patel', empId: 'EMP003', month: 'July 2026', basic: 32000, allowances: 7500, deductions: 3200, net: 36300, status: 'Paid' }),
    erp('payroll', 'salary', { id: 'PAY-004', emp: 'Sunita Singh', empId: 'EMP004', month: 'July 2026', basic: 25000, allowances: 5000, deductions: 2500, net: 27500, status: 'Generated' }),
    erp('payroll', 'allowance', { id: 'ALW-001', emp: 'Rajesh Kumar', empId: 'EMP001', type: 'HRA', amount: 5000, month: 'Jul 2026', status: 'Active' }),
    erp('payroll', 'allowance', { id: 'ALW-002', emp: 'Priya Sharma', empId: 'EMP002', type: 'Travel Allow.', amount: 2000, month: 'Jul 2026', status: 'Active' }),
    erp('payroll', 'allowance', { id: 'ALW-003', emp: 'Amit Patel', empId: 'EMP003', type: 'Medical Allow.', amount: 1500, month: 'Jul 2026', status: 'Active' }),
    erp('payroll', 'deduction', { id: 'DED-001', emp: 'Rajesh Kumar', empId: 'EMP001', type: 'PF', amount: 2100, month: 'Jul 2026', status: 'Applied' }),
    erp('payroll', 'deduction', { id: 'DED-002', emp: 'Priya Sharma', empId: 'EMP002', type: 'ESI', amount: 450, month: 'Jul 2026', status: 'Applied' }),
    erp('payroll', 'payslip', { id: 'SLP-001', emp: 'Rajesh Kumar', empId: 'EMP001', month: 'Jul 2026', net: 39500, generated: formatDate(yesterday), status: 'Sent' }),
    erp('payroll', 'payslip', { id: 'SLP-002', emp: 'Priya Sharma', empId: 'EMP002', month: 'Jul 2026', net: 34000, generated: formatDate(yesterday), status: 'Sent' }),
    erp('payroll', 'payslip', { id: 'SLP-003', emp: 'Amit Patel', empId: 'EMP003', month: 'Jul 2026', net: 36300, generated: formatDate(twoDaysAgo), status: 'Sent' }),
    // Purchase
    erp('purchase', 'order', { id: 'PO-001', supplier: 'Techno Parts Pvt Ltd', date: formatDate(threeDaysAgo), items: 15, amount: 124500, delivery: formatDate(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)), status: 'Pending' }),
    erp('purchase', 'order', { id: 'PO-002', supplier: 'Global Machinery Co.', date: formatDate(twoDaysAgo), items: 8, amount: 87200, delivery: formatDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)), status: 'Processing' }),
    erp('purchase', 'grn', { id: 'GRN-001', po: 'PO-002', supplier: 'Global Machinery Co.', date: formatDate(yesterday), items: 8, amount: 87200, receivedBy: 'Karan Mehta', status: 'Verified' }),
    erp('purchase', 'grn', { id: 'GRN-002', po: 'PO-003', supplier: 'Airjet Components Ltd', date: formatDate(twoDaysAgo), items: 18, amount: 198000, receivedBy: 'Nikhil Rao', status: 'Partial' }),
    erp('purchase', 'return', { id: 'RET-001', supplier: 'Techno Parts Pvt Ltd', part: 'Reed Valve Assembly', qty: 5, date: formatDate(twoDaysAgo), reason: 'Defective parts', amount: 2500, status: 'Approved' }),
    // Sales
    erp('sales', 'quotation', { id: 'QT-001', customer: 'Shree Textile Mills', date: formatDate(twoDaysAgo), items: 8, amount: 38400, validTill: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)), status: 'Sent' }),
    erp('sales', 'quotation', { id: 'QT-002', customer: 'Modi Fabric Industries', date: formatDate(twoDaysAgo), items: 5, amount: 22500, validTill: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)), status: 'Accepted' }),
    erp('sales', 'quotation', { id: 'QT-003', customer: 'Jai Hind Textiles', date: formatDate(threeDaysAgo), items: 12, amount: 55000, validTill: formatDate(new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000)), status: 'Draft' }),
    erp('sales', 'order', { id: 'SO-001', customer: 'Modi Fabric Industries', date: formatDate(yesterday), items: 5, amount: 22500, delivery: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)), status: 'Confirmed' }),
    erp('sales', 'order', { id: 'SO-002', customer: 'Shree Textile Mills', date: formatDate(yesterday), items: 8, amount: 38400, delivery: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)), status: 'Processing' }),
    erp('sales', 'invoice', { id: 'INV-001', customer: 'Shree Textile Mills', date: formatDate(today), items: 6, amount: 24500, due: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)), status: 'Unpaid' }),
    erp('sales', 'invoice', { id: 'INV-002', customer: 'National Weaving Works', date: formatDate(yesterday), items: 4, amount: 18000, due: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)), status: 'Paid' }),
    // Warehouse
    erp('warehouse', 'warehouse', { id: 'WH-001', name: 'Main Warehouse', location: 'Surat', capacity: 500, status: 'Active' }),
    erp('warehouse', 'warehouse', { id: 'WH-002', name: 'Ahmedabad Warehouse', location: 'Ahmedabad', capacity: 300, status: 'Active' }),
    erp('warehouse', 'warehouse', { id: 'WH-003', name: 'Rajkot Warehouse', location: 'Rajkot', capacity: 200, status: 'Active' }),
    erp('warehouse', 'transfer', { id: 'TRF-001', from: 'WH-001', to: 'WH-002', part: 'Reed Valve Assembly', qty: 50, date: formatDate(today), status: 'Completed' }),
    erp('warehouse', 'transfer', { id: 'TRF-002', from: 'WH-001', to: 'WH-003', part: 'Air Jet Nozzle Set', qty: 20, date: formatDate(yesterday), status: 'In Transit' }),
    erp('warehouse', 'transfer', { id: 'TRF-003', from: 'WH-002', to: 'WH-001', part: 'Main Shaft Bearing', qty: 10, date: formatDate(twoDaysAgo), status: 'Completed' }),
    erp('warehouse', 'audit', { id: 'AUD-001', location: 'WH-001', date: formatDate(yesterday), items: 45, status: 'Completed', notes: 'All items verified' }),
    erp('warehouse', 'audit', { id: 'AUD-002', location: 'WH-002', date: formatDate(threeDaysAgo), items: 30, status: 'Completed', notes: 'Minor discrepancies found' }),
    // Service
    erp('service', 'ticket', { id: 'SRV-001', customer: 'Shree Textile Mills', machine: 'AirJet AT-200', issue: 'Nozzle blockage', engineer: 'Divya Verma', date: formatDate(today), status: 'Open', priority: 'High' }),
    erp('service', 'ticket', { id: 'SRV-002', customer: 'National Weaving Works', machine: 'AirJet JP-150', issue: 'Weft sensor failure', engineer: 'Nikhil Rao', date: formatDate(yesterday), status: 'In Progress', priority: 'Medium' }),
    erp('service', 'ticket', { id: 'SRV-003', customer: 'Modi Fabric Industries', machine: 'AirJet PR-500', issue: 'Camshaft misalignment', engineer: 'Nikhil Rao', date: formatDate(twoDaysAgo), status: 'Resolved', priority: 'High' }),
    erp('service', 'ticket', { id: 'SRV-004', customer: 'Jai Hind Textiles', machine: 'AirJet MM-100', issue: 'Pressure gauge not working', engineer: 'Divya Verma', date: formatDate(threeDaysAgo), status: 'In Progress', priority: 'Low' }),
    erp('service', 'complaint', { id: 'CMP-001', customer: 'Shree Textile Mills', issue: 'Nozzle blockage repeated', date: formatDate(today), status: 'Open' }),
    erp('service', 'assignment', { id: 'ASG-001', engineer: 'Divya Verma', empId: 'EMP006', assigned: 2, inProgress: 1, resolved: 4, expertise: 'Nozzle, Valve Systems', available: 'Yes' }),
    erp('service', 'assignment', { id: 'ASG-002', engineer: 'Nikhil Rao', empId: 'EMP007', assigned: 2, inProgress: 1, resolved: 5, expertise: 'Sensors, Camshafts', available: 'Yes' }),
    erp('service', 'report', { id: 'SR-001', ticket: 'SRV-003', customer: 'Modi Fabric Industries', engineer: 'Nikhil Rao', date: formatDate(twoDaysAgo), parts: 'Camshaft Assembly x1', hours: '5h 15m', cost: '₹6,500', status: 'Completed' }),
    erp('service', 'report', { id: 'SR-002', ticket: 'SRV-002', customer: 'National Weaving Works', engineer: 'Nikhil Rao', date: formatDate(yesterday), parts: 'Weft Detector Sensor x1', hours: '3h 00m', cost: '₹1,800', status: 'In Progress' }),
    // Accounts
    erp('accounts', 'receivable', { id: 'RCV-001', party: 'Shree Textile Mills', type: 'Invoice', amount: 24500, dueDate: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)), status: 'Pending' }),
    erp('accounts', 'receivable', { id: 'RCV-002', party: 'Modi Fabric Industries', type: 'Invoice', amount: 42000, dueDate: formatDate(yesterday), status: 'Overdue' }),
    erp('accounts', 'receivable', { id: 'RCV-003', party: 'Jai Hind Textiles', type: 'Invoice', amount: 15000, dueDate: formatDate(new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)), status: 'Pending' }),
    erp('accounts', 'payable', { id: 'PAYB-001', party: 'Techno Parts Pvt Ltd', type: 'Purchase Order', amount: 124500, dueDate: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)), status: 'Pending' }),
    erp('accounts', 'payable', { id: 'PAYB-002', party: 'Global Machinery Co.', type: 'Purchase Order', amount: 87200, dueDate: formatDate(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)), status: 'Pending' }),
    erp('accounts', 'ledger', { id: 'LED-001', party: 'Shree Textile Mills', type: 'Sales', debit: 0, credit: 24500, balance: 24500, date: formatDate(today), status: 'Posted' }),
    erp('accounts', 'ledger', { id: 'LED-002', party: 'National Weaving Works', type: 'Sales', debit: 0, credit: 18000, balance: 18000, date: formatDate(yesterday), status: 'Posted' }),
    erp('accounts', 'ledger', { id: 'LED-003', party: 'Techno Parts Pvt Ltd', type: 'Purchase', debit: 124500, credit: 0, balance: -124500, date: formatDate(yesterday), status: 'Posted' }),
    erp('accounts', 'gst', { id: 'GST-001', period: 'Jul 2026', type: 'Output GST', gstAmount: 4410, amount: 24500, status: 'Filed' }),
    erp('accounts', 'gst', { id: 'GST-002', period: 'Jul 2026', type: 'Input GST', gstAmount: 22320, amount: 124000, status: 'Filed' }),
    erp('accounts', 'pl', { id: 'PL-001', period: 'Jul 2026', revenue: 324500, expenses: 211700, profit: 112800, status: 'Draft' }),
  ]);

  await Attendance.insertMany([
    { id: 'ATT-001', recordType: 'attendance', emp: 'Rajesh Kumar', empId: 'EMP001', date: formatDateISO(today), checkIn: '09:05', checkOut: '18:10', hours: '9h 05m', status: 'Present' },
    { id: 'ATT-002', recordType: 'attendance', emp: 'Priya Sharma', empId: 'EMP002', date: formatDateISO(today), checkIn: '09:30', checkOut: '18:00', hours: '8h 30m', status: 'Late' },
    { id: 'ATT-003', recordType: 'attendance', emp: 'Amit Patel', empId: 'EMP003', date: formatDateISO(today), checkIn: '08:55', checkOut: '18:15', hours: '9h 20m', status: 'Present' },
    { id: 'ATT-004', recordType: 'attendance', emp: 'Sunita Singh', empId: 'EMP004', date: formatDateISO(today), checkIn: '09:10', checkOut: '17:55', hours: '8h 45m', status: 'Present' },
    { id: 'ATT-005', recordType: 'attendance', emp: 'Karan Mehta', empId: 'EMP005', date: formatDateISO(today), checkIn: '07:00', checkOut: '16:00', hours: '9h 00m', status: 'Present' },
    { id: 'ATT-006', recordType: 'attendance', emp: 'Nikhil Rao', empId: 'EMP007', date: formatDateISO(today), checkIn: '09:00', checkOut: '18:05', hours: '9h 05m', status: 'Present' },
    { id: 'ATT-007', recordType: 'attendance', emp: 'Meera Joshi', empId: 'EMP008', date: formatDateISO(today), checkIn: '09:15', checkOut: '18:10', hours: '8h 55m', status: 'Late' },
    { id: 'LVE-001', recordType: 'leave', emp: 'Divya Verma', empId: 'EMP006', from: formatDateISO(today), to: formatDateISO(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)), days: 3, type: 'Sick Leave', reason: 'Fever and rest', status: 'Approved' },
    { id: 'OVE-001', recordType: 'overtime', emp: 'Karan Mehta', empId: 'EMP005', date: formatDateISO(yesterday), hours: '2h 00m', reason: 'Stock counting', status: 'Approved' },
  ]);

  console.log('[Seed] Initial data populated successfully.');
  console.log('[Seed] Admin login: rajesh@airjet.in / admin123');
}

module.exports = { seedDatabase };

// Run seed when file is executed directly
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/airjet', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('MongoDB connected for seeding');
    await seedDatabase();
    mongoose.connection.close();
    console.log('Seed complete, connection closed');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
}
