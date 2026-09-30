const Payroll = require('../model/Payroll.model');
const Employee = require('../model/Empl.model');
const Attendance = require('../model/Attendance.model');
const Department = require('../model/Depart.model');
const Designation = require('../model/Designation.model');

// Helper: Parse month string to number
const getMonthNumber = (monthStr) => {
  const months = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 
                   'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
  const monthPart = monthStr.split(' ')[0];
  return months[monthPart] || 0;
};

// Helper: Get working days in a month
const getWorkingDays = (year, month) => {
  const date = new Date(year, month + 1, 0);
  const totalDays = date.getDate();
  let workingDays = 0;
  for (let i = 1; i <= totalDays; i++) {
    const day = new Date(year, month, i).getDay();
    if (day !== 0) workingDays++; // Exclude Sundays
  }
  return workingDays;
};

// Helper: Calculate salary components
const calculateSalary = (employee, attendanceData, overtimeRate = 150) => {
  const basicSalary = employee.salary || 0;
  const workingDays = getWorkingDays(new Date().getFullYear(), new Date().getMonth());
  
  // Attendance calculations
  const presentDays = attendanceData.filter(a => a.status === 'Present').length;
  const absentDays = attendanceData.filter(a => a.status === 'Absent').length;
  const paidLeave = attendanceData.filter(a => a.recordType === 'leave' && a.status === 'Approved').length;
  const unpaidLeave = attendanceData.filter(a => a.recordType === 'leave' && a.status === 'Rejected').length;
  const lateEntries = attendanceData.filter(a => a.lateMinutes > 0).length;
  const halfDays = attendanceData.filter(a => a.status === 'Half Day').length;
  
  // Overtime calculation
  const overtimeHours = attendanceData.reduce((sum, a) => sum + (parseFloat(a.overtimeHours) || 0), 0);
  const overtimeAmount = overtimeHours * overtimeRate;
  
  // Leave deduction calculation
  const dailySalary = workingDays > 0 ? basicSalary / workingDays : 0;
  const leaveDeduction = unpaidLeave * dailySalary;
  
  // Default allowances (can be overridden)
  const hra = Math.round(basicSalary * 0.40);
  const travelAllowance = 2000;
  const foodAllowance = 1500;
  const totalAllowance = hra + travelAllowance + foodAllowance;
  
  // Default deductions (can be overridden)
  const pf = Math.round(basicSalary * 0.12);
  const professionalTax = 200;
  const totalDeduction = pf + professionalTax + leaveDeduction;
  
  // Gross and Net salary
  const grossSalary = basicSalary + totalAllowance + overtimeAmount;
  const netSalary = grossSalary - totalDeduction;
  
  return {
    basicSalary,
    workingDays,
    presentDays,
    absentDays,
    paidLeave,
    unpaidLeave,
    lateEntries,
    halfDays,
    overtimeHours,
    overtimeRate,
    overtimeAmount,
    allowances: [
      { name: 'HRA', amount: hra, description: 'House Rent Allowance' },
      { name: 'Travel Allowance', amount: travelAllowance, description: 'Travel Allowance' },
      { name: 'Food Allowance', amount: foodAllowance, description: 'Food Allowance' }
    ],
    totalAllowance,
    deductions: [
      { name: 'PF', amount: pf, reason: 'Provident Fund' },
      { name: 'Professional Tax', amount: professionalTax, reason: 'Professional Tax' },
      { name: 'Leave Deduction', amount: leaveDeduction, reason: `Unpaid leave deduction: ${unpaidLeave} days` }
    ],
    totalDeduction,
    leaveDeduction,
    grossSalary,
    netSalary
  };
};

// Get all payroll records
exports.getAllPayroll = async (req, res) => {
  try {
    const { month, year, department, status, paymentStatus, employee } = req.query;
    const filter = {};
    
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (employee) filter.employee = employee;
    
    const payroll = await Payroll.find(filter)
      .populate('employee', 'name email phone')
      .populate('department', 'title')
      .populate('designation', 'title')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ year: -1, month: -1, createdAt: -1 });
    
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single payroll record
exports.getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee', 'name email phone image joiningDate')
      .populate('department', 'title')
      .populate('designation', 'title')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');
    
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate salary for single employee
exports.generateSalary = async (req, res) => {
  try {
    const { employeeId, month, year, overtimeRate } = req.body;
    const currentUser = req.user;
    
    // Validate input
    if (!employeeId || !month || !year) {
      return res.status(400).json({ error: 'Employee ID, month, and year are required' });
    }
    
    // Check if payroll already exists for this employee in this month/year
    const existingPayroll = await Payroll.findOne({ employee: employeeId, month, year });
    if (existingPayroll) {
      return res.status(400).json({ error: 'Salary already generated for this employee in this month/year' });
    }
    
    // Get employee details
    const employee = await Employee.findById(employeeId).populate('department').populate('designation');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Get attendance data for the month
    const monthNum = getMonthNumber(month);
    const startDate = new Date(year, monthNum, 1);
    const endDate = new Date(year, monthNum + 1, 0);
    
    const attendanceData = await Attendance.find({
      employeeId: employeeId,
      date: { $gte: startDate.toISOString().split('T')[0], $lte: endDate.toISOString().split('T')[0] }
    });
    
    // Calculate salary
    const calculations = calculateSalary(employee, attendanceData, overtimeRate || 150);
    
    // Create payroll record
    const payroll = new Payroll({
      employee: employeeId,
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department?._id,
      departmentName: employee.department?.title || '',
      designation: employee.designation?._id,
      designationName: employee.designation?.title || '',
      month,
      year,
      joiningDate: employee.joiningDate,
      ...calculations,
      status: 'Generated',
      createdBy: currentUser._id
    });
    
    await payroll.save();
    await payroll.populate('employee department designation createdBy');
    
    res.status(201).json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate salary for all employees
exports.generateAllSalaries = async (req, res) => {
  try {
    const { month, year, department, overtimeRate } = req.body;
    const currentUser = req.user;
    
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }
    
    // Get employees to generate salary for
    const employeeFilter = { status: 'Active' };
    if (department) employeeFilter.department = department;
    
    const employees = await Employee.find(employeeFilter).populate('department').populate('designation');
    
    const results = [];
    const errors = [];
    
    for (const employee of employees) {
      try {
        // Check if payroll already exists
        const existingPayroll = await Payroll.findOne({ employee: employee._id, month, year });
        if (existingPayroll) {
          errors.push({ employee: employee.name, error: 'Salary already generated' });
          continue;
        }
        
        // Get attendance data
        const monthNum = getMonthNumber(month);
        const startDate = new Date(year, monthNum, 1);
        const endDate = new Date(year, monthNum + 1, 0);
        
        const attendanceData = await Attendance.find({
          employeeId: employee._id,
          date: { $gte: startDate.toISOString().split('T')[0], $lte: endDate.toISOString().split('T')[0] }
        });
        
        // Calculate salary
        const calculations = calculateSalary(employee, attendanceData, overtimeRate || 150);
        
        // Create payroll record
        const payroll = new Payroll({
          employee: employee._id,
          employeeId: employee.id,
          employeeName: employee.name,
          department: employee.department?._id,
          departmentName: employee.department?.title || '',
          designation: employee.designation?._id,
          designationName: employee.designation?.title || '',
          month,
          year,
          joiningDate: employee.joiningDate,
          ...calculations,
          status: 'Generated',
          createdBy: currentUser._id
        });
        
        await payroll.save();
        results.push({ employee: employee.name, payrollId: payroll._id });
      } catch (err) {
        errors.push({ employee: employee.name, error: err.message });
      }
    }
    
    // If all employees have "already generated" error, return proper error
    const allAlreadyGenerated = errors.length > 0 && 
      errors.length === employees.length && 
      errors.every(e => e.error === 'Salary already generated');
    
    if (allAlreadyGenerated) {
      return res.status(400).json({ 
        error: `Salaries for ${month} ${year} have already been generated for all employees. Please check existing records or select a different month.`,
        errors 
      });
    }
    
    res.status(201).json({ 
      message: `Generated ${results.length} salaries`,
      results,
      errors 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update payroll record
exports.updatePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    
    // Don't allow editing paid salaries
    if (payroll.status === 'Paid') {
      return res.status(400).json({ error: 'Cannot edit paid salary records' });
    }
    
    const updates = req.body;
    
    // Recalculate if salary components changed
    if (updates.basicSalary || updates.allowances || updates.deductions || updates.overtimeAmount) {
      const basicSalary = updates.basicSalary || payroll.basicSalary;
      const totalAllowance = updates.totalAllowance !== undefined ? updates.totalAllowance : payroll.totalAllowance;
      const totalDeduction = updates.totalDeduction !== undefined ? updates.totalDeduction : payroll.totalDeduction;
      const overtimeAmount = updates.overtimeAmount !== undefined ? updates.overtimeAmount : payroll.overtimeAmount;
      
      updates.grossSalary = basicSalary + totalAllowance + overtimeAmount;
      updates.netSalary = updates.grossSalary - totalDeduction;
    }
    
    Object.assign(payroll, updates);
    await payroll.save();
    await payroll.populate('employee department designation createdBy approvedBy');
    
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete payroll record
exports.deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    
    // Don't allow deleting paid salaries
    if (payroll.status === 'Paid') {
      return res.status(400).json({ error: 'Cannot delete paid salary records. Use cancellation instead.' });
    }
    
    await Payroll.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Payroll record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve salary
exports.approveSalary = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    
    if (payroll.status !== 'Generated') {
      return res.status(400).json({ error: 'Only Generated salaries can be approved' });
    }
    
    payroll.status = 'Approved';
    payroll.approvedBy = req.user._id;
    payroll.approvedAt = new Date();
    await payroll.save();
    await payroll.populate('approvedBy');
    
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Pay salary
exports.paySalary = async (req, res) => {
  try {
    const { paymentDate, paymentMode, transactionReference, paymentNotes } = req.body;
    const payroll = await Payroll.findById(req.params.id);
    
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    
    if (payroll.status !== 'Approved') {
      return res.status(400).json({ error: 'Only Approved salaries can be paid' });
    }
    
    if (payroll.paymentStatus === 'Paid') {
      return res.status(400).json({ error: 'Salary already paid' });
    }
    
    payroll.status = 'Paid';
    payroll.paymentStatus = 'Paid';
    payroll.paymentDate = paymentDate || new Date();
    payroll.paymentMode = paymentMode;
    payroll.transactionReference = transactionReference;
    payroll.paymentNotes = paymentNotes;
    
    await payroll.save();
    await payroll.populate('employee department designation');
    
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel salary
exports.cancelSalary = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    
    payroll.status = 'Cancelled';
    await payroll.save();
    
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get dashboard stats
exports.getPayrollDashboardStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);
    
    const totalEmployees = await Employee.countDocuments({ status: 'Active' });
    const activeEmployees = totalEmployees;
    
    const payrollRecords = await Payroll.find(filter);
    
    const grossSalary = payrollRecords.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
    const netSalary = payrollRecords.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const totalAllowances = payrollRecords.reduce((sum, p) => sum + (p.totalAllowance || 0), 0);
    const totalDeductions = payrollRecords.reduce((sum, p) => sum + (p.totalDeduction || 0), 0);
    const totalOvertime = payrollRecords.reduce((sum, p) => sum + (p.overtimeAmount || 0), 0);
    
    const pendingSalary = payrollRecords
      .filter(p => p.paymentStatus === 'Pending')
      .reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const paidSalary = payrollRecords
      .filter(p => p.paymentStatus === 'Paid')
      .reduce((sum, p) => sum + (p.netSalary || 0), 0);
    
    res.status(200).json({
      totalEmployees,
      activeEmployees,
      grossSalary,
      netSalary,
      totalAllowances,
      totalDeductions,
      totalOvertime,
      pendingSalary,
      paidSalary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get monthly payroll summary
exports.getMonthlyPayrollSummary = async (req, res) => {
  try {
    const { year } = req.query;
    const filter = year ? { year: parseInt(year) } : {};
    
    const summary = await Payroll.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          totalEmployees: { $sum: 1 },
          grossSalary: { $sum: '$grossSalary' },
          totalAllowance: { $sum: '$totalAllowance' },
          totalOvertime: { $sum: '$overtimeAmount' },
          totalDeduction: { $sum: '$totalDeduction' },
          netSalary: { $sum: '$netSalary' },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$netSalary', 0] }
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, '$netSalary', 0] }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);
    
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get department-wise salary summary
exports.getDepartmentSalarySummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);
    
    const summary = await Payroll.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$department',
          departmentName: { $first: '$departmentName' },
          employeeCount: { $sum: 1 },
          basicSalary: { $sum: '$basicSalary' },
          totalAllowance: { $sum: '$totalAllowance' },
          totalOvertime: { $sum: '$overtimeAmount' },
          totalDeduction: { $sum: '$totalDeduction' },
          netSalary: { $sum: '$netSalary' }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } }
    ]);
    
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reports
exports.getMonthlySalaryReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);
    
    const report = await Payroll.find(filter)
      .populate('employee', 'name id')
      .populate('department', 'title')
      .select('employeeName departmentName basicSalary totalAllowance overtimeAmount grossSalary totalDeduction netSalary');
    
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOvertimeReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { overtimeHours: { $gt: 0 } };
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);
    
    const report = await Payroll.find(filter)
      .populate('employee', 'name id')
      .populate('department', 'title')
      .select('employeeName departmentName overtimeHours overtimeRate overtimeAmount');
    
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDeductionReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);
    
    const report = await Payroll.find(filter)
      .populate('employee', 'name id')
      .select('employeeName deductions totalDeduction leaveDeduction');
    
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPaymentReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { paymentStatus: 'Paid' };
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);
    
    const report = await Payroll.find(filter)
      .populate('employee', 'name id')
      .select('employeeName month netSalary paymentDate paymentMode paymentStatus');
    
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
