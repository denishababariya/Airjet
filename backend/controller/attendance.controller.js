 const Attendance = require('../model/Attendance.model');
const Employee = require('../model/Empl.model');
const User = require('../model/User.model');

const generateId = (prefix, count) =>
  `${prefix}${String(count + 1).padStart(3, '0')}`;
const DUPLICATE_SCAN_WINDOW_MS = 30 * 1000;
const generateAbsentId = (empId, date) => `ABS_${date.replace(/-/g, '')}_${empId}`;

let dailyAttendanceInitialized = null;

const ensureDailyAttendance = async (today, employees) => {
  if (dailyAttendanceInitialized === today) return null;

  const attendanceRecords = await Attendance.find({
    date: today,
    recordType: 'attendance'
  });

  const approvedLeaves = await Attendance.find({
    date: today,
    recordType: 'leave',
    status: 'Approved'
  });

  const attendanceMap = {};
  attendanceRecords.forEach(r => {
    attendanceMap[r.employeeId.toString()] = r;
  });

  const leaveMap = {};
  approvedLeaves.forEach(l => {
    leaveMap[l.employeeId.toString()] = l;
  });

  const missingEmployees = employees.filter(emp => {
    const empId = emp._id.toString();
    return !attendanceMap[empId] && !leaveMap[empId];
  });

  if (missingEmployees.length > 0) {
    const bulkOps = missingEmployees.map(emp => ({
      updateOne: {
        filter: {
          employeeId: emp._id,
          date: today,
          recordType: 'attendance'
        },
        update: {
          $setOnInsert: {
            id: generateAbsentId(emp.id, today),
            recordType: 'attendance',
            employeeId: emp._id,
            emp: emp.name,
            empId: emp.id,
            date: today,
            checkIn: '--',
            checkOut: '--',
            hours: '--',
            status: 'Absent',
            lateMinutes: 0,
            workingHours: 0,
            earlyCheckout: false,
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(bulkOps);
  }

  dailyAttendanceInitialized = today;
  return { attendanceMap, leaveMap };
};

const checkIn = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId).populate('employeeId');
    if (!user || !user.employeeId) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee = user.employeeId;
    const today = new Date().toISOString().split('T')[0];

    const existingRecord = await Attendance.findOne({
      employeeId: employee._id,
      date: today,
      recordType: 'attendance'
    });

    const now = new Date();
    const checkInTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const hour = now.getHours();
    const minute = now.getMinutes();
    let status = 'Present';
    let lateMinutes = 0;

    if (hour > 9 || (hour === 9 && minute > 15)) {
      status = 'Late';
      lateMinutes = (hour * 60 + minute) - (9 * 60 + 15);
    }

    if (existingRecord) {
      if (existingRecord.checkIn !== '--') {
        return res.status(400).json({ error: 'Already checked in today' });
      }
      
      existingRecord.checkIn = checkInTime;
      existingRecord.status = status;
      existingRecord.lateMinutes = lateMinutes;
      existingRecord.updatedBy = userId;
      await existingRecord.save();
      
      return res.status(200).json(existingRecord);
    }

    const count = await Attendance.countDocuments({ recordType: 'attendance' });
    const record = await Attendance.create({
      id: generateId('ATT', count),
      recordType: 'attendance',
      employeeId: employee._id,
      emp: employee.name,
      empId: employee.id,
      date: today,
      checkIn: checkInTime,
      checkOut: '--',
      hours: '--',
      status: status,
      lateMinutes: lateMinutes,
      createdBy: userId,
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const checkOut = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId).populate('employeeId');
    if (!user || !user.employeeId) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee = user.employeeId;
    const today = new Date().toISOString().split('T')[0];

    const record = await Attendance.findOne({
      employeeId: employee._id,
      date: today,
      recordType: 'attendance'
    });

    if (!record) {
      return res.status(404).json({ error: 'No check-in record found for today' });
    }

    if (record.checkOut !== '--') {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    const now = new Date();
    const checkOutTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const checkInParts = record.checkIn.split(':');
    const checkInDate = new Date();
    checkInDate.setHours(parseInt(checkInParts[0]), parseInt(checkInParts[1]), 0);

    const diffMs = now - checkInDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const hoursWorked = `${diffHours}h ${diffMins}m`;

    const checkoutHour = now.getHours();
    const checkoutMinute = now.getMinutes();
    let earlyCheckoutWarning = null;

    if (checkoutHour < 17 || (checkoutHour === 17 && checkoutMinute < 45)) {
      earlyCheckoutWarning = 'Early check-out detected. Regular hours are 9:00 AM to 6:00 PM.';
    }

    record.checkOut = checkOutTime;
    record.hours = hoursWorked;
    record.earlyCheckout = earlyCheckoutWarning ? true : false;
    await record.save();

    res.status(200).json({
      record,
      warning: earlyCheckoutWarning,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId).populate('employeeId');
    if (!user || !user.employeeId) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee = user.employeeId;
    const { month, year } = req.query;
    
    let filter = { employeeId: employee._id };
    
    // Filter by month if provided
    if (month && year) {
      filter.date = { $regex: `^${year}-${month.padStart(2, '0')}` };
    }

    const records = await Attendance.find(filter)
      .populate({
        path: 'employeeId',
        populate: [
          { path: 'department' },
          { path: 'designation' }
        ]
      })
      .sort({ date: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createRecord = async (req, res) => {
  try {
    const count = await Attendance.countDocuments({ recordType: req.body.recordType || 'attendance' });
    const prefix = req.body.recordType === 'leave' ? 'LVE' : 'ATT';
    const record = await Attendance.create({
      ...req.body,
      id: req.body.id || generateId(prefix, count),
    });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRecords = async (req, res) => {
  try {
    const filter = {};
    if (req.query.recordType) filter.recordType = req.query.recordType;
    const records = await Attendance.find(filter).sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Attendance.findByIdAndUpdate(id, req.body, { new: true });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Attendance.findByIdAndDelete(id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const scanAttendance = async (req, res) => {
  try {
    const { qrToken } = req.body;
    const userId = req.user?._id;

    if (!qrToken) {
      return res.status(400).json({ error: 'QR Token is required' });
    }

    // Find employee by QR token
    const employee = await Employee.findOne({ qrToken });
    if (!employee) {
      return res.status(404).json({ error: 'Invalid QR Token - Employee not found' });
    }

    if (employee.status !== 'Active') {
      return res.status(403).json({ error: 'Employee is not active' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Check if already scanned within 30 seconds
    const recentScan = await Attendance.findOne({
      employeeId: employee._id,
      date: today,
      lastScannedAt: { $gte: new Date(Date.now() - 30000) }
    });

    if (recentScan) {
      return res.status(429).json({ error: 'Please wait 30 seconds before scanning again' });
    }

    // Check today's attendance
    const existingRecord = await Attendance.findOne({
      employeeId: employee._id,
      date: today,
      recordType: 'attendance'
    });

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const hour = now.getHours();
    const minute = now.getMinutes();
    let status = 'Present';
    let lateMinutes = 0;

    if (hour > 9 || (hour === 9 && minute > 15)) {
      status = 'Late';
      lateMinutes = (hour * 60 + minute) - (9 * 60 + 15);
    }

    // Case 1: No attendance exists - Create check-in
    if (!existingRecord) {
      const count = await Attendance.countDocuments({ recordType: 'attendance' });
      const record = await Attendance.create({
        id: generateId('ATT', count),
        recordType: 'attendance',
        employeeId: employee._id,
        emp: employee.name,
        empId: employee.id,
        date: today,
        checkIn: currentTime,
        checkOut: '--',
        hours: '--',
        workingHours: 0,
        status: status,
        lateMinutes: lateMinutes,
        qrToken: qrToken,
        createdBy: userId,
        lastScannedAt: now
      });

      return res.status(201).json({
        message: 'Check-in successful',
        record,
        employee: {
          name: employee.name,
          id: employee.id,
          image: employee.image,
          department: employee.department,
          designation: employee.designation
        }
      });
    }

    // Case 1.5: Attendance exists but no check-in - Update check-in
    if (existingRecord.checkIn === '--') {
      existingRecord.checkIn = currentTime;
      existingRecord.status = status;
      existingRecord.lateMinutes = lateMinutes;
      existingRecord.updatedBy = userId;
      existingRecord.lastScannedAt = now;
      await existingRecord.save();

      return res.status(200).json({
        message: 'Check-in successful',
        record: existingRecord,
        employee: {
          name: employee.name,
          id: employee.id,
          image: employee.image,
          department: employee.department,
          designation: employee.designation
        }
      });
    }

    // Case 2: Attendance exists but no check-out - Update check-out
    if (existingRecord.checkOut === '--') {
      const checkInParts = existingRecord.checkIn.split(':');
      const checkInDate = new Date();
      checkInDate.setHours(parseInt(checkInParts[0]), parseInt(checkInParts[1]), 0);

      const diffMs = now - checkInDate;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const workingHours = diffHours + (diffMins / 60);

      const checkoutHour = now.getHours();
      const checkoutMinute = now.getMinutes();
      let earlyCheckoutWarning = null;

      if (checkoutHour < 17 || (checkoutHour === 17 && checkoutMinute < 45)) {
        earlyCheckoutWarning = 'Early check-out detected. Regular hours are 9:00 AM to 6:00 PM.';
      }

      existingRecord.checkOut = currentTime;
      existingRecord.hours = `${diffHours}h ${diffMins}m`;
      existingRecord.workingHours = workingHours;
      existingRecord.earlyCheckout = earlyCheckoutWarning ? true : false;
      existingRecord.updatedBy = userId;
      existingRecord.lastScannedAt = now;
      await existingRecord.save();

      return res.status(200).json({
        message: 'Check-out successful',
        record: existingRecord,
        warning: earlyCheckoutWarning,
        employee: {
          name: employee.name,
          id: employee.id,
          image: employee.image,
          department: employee.department,
          designation: employee.designation
        }
      });
    }

    // Case 3: Attendance already completed
    return res.status(400).json({ 
      error: 'Attendance already completed for today',
      record: existingRecord
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const employees = await Employee.find({ status: 'Active' })
      .populate('department')
      .populate('designation')
      .sort({ name: 1 });

    const maps = await ensureDailyAttendance(today, employees);
    const attendanceMap = maps?.attendanceMap || {};
    const leaveMap = maps?.leaveMap || {};

    if (!maps) {
      const attendanceRecords = await Attendance.find({ 
        date: today,
        recordType: 'attendance'
      });
      const approvedLeaves = await Attendance.find({
        date: today,
        recordType: 'leave',
        status: 'Approved'
      });
      attendanceRecords.forEach(r => {
        attendanceMap[r.employeeId.toString()] = r;
      });
      approvedLeaves.forEach(l => {
        leaveMap[l.employeeId.toString()] = l;
      });
    }

    const result = employees.map(emp => {
      const empId = emp._id.toString();
      const attendance = attendanceMap[empId];
      const leave = leaveMap[empId];
      
      if (leave) {
        return {
          ...leave.toObject(),
          employeeId: emp._id,
          emp: emp.name,
          empId: emp.id,
          department: emp.department,
          designation: emp.designation,
          status: 'Leave',
          checkIn: '--',
          checkOut: '--',
          hours: '--',
          lateMinutes: 0,
        };
      }
      
      if (attendance) {
        return {
          ...attendance.toObject(),
          employeeId: emp._id,
          emp: emp.name,
          empId: emp.id,
          department: emp.department,
          designation: emp.designation,
        };
      }
      
      return {
        _id: `temp_${empId}`,
        recordType: 'attendance',
        employeeId: emp._id,
        emp: emp.name,
        empId: emp.id,
        date: today,
        checkIn: '--',
        checkOut: '--',
        hours: '--',
        status: 'Absent',
        lateMinutes: 0,
        workingHours: 0,
        earlyCheckout: false,
        department: emp.department,
        designation: emp.designation,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    const filter = { recordType: 'attendance' };

    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (employeeId) {
      filter.employeeId = employeeId;
    }

    const records = await Attendance.find(filter)
      .populate({
        path: 'employeeId',
        populate: [
          { path: 'department' },
          { path: 'designation' }
        ]
      })
      .populate('createdBy')
      .populate('updatedBy')
      .sort({ date: -1 });

    // Calculate statistics
    const stats = {
      total: records.length,
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      late: records.filter(r => r.status === 'Late').length,
      earlyCheckout: records.filter(r => r.earlyCheckout === true).length,
      totalWorkingHours: records.reduce((sum, r) => sum + (r.workingHours || 0), 0),
      totalLateMinutes: records.reduce((sum, r) => sum + (r.lateMinutes || 0), 0),
    };

    res.status(200).json({ records, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generateQrToken = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Generate unique QR token if not exists
    if (!employee.qrToken) {
      const crypto = require('crypto');
      employee.qrToken = `AJ_${crypto.randomBytes(20).toString('hex').toUpperCase()}`;
      await employee.save();
    }

    res.status(200).json({ 
      qrToken: employee.qrToken,
      employeeId: employee._id,
      employeeName: employee.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLateEntryReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, department } = req.query;
    const filter = {
      recordType: 'attendance',
      lateMinutes: { $gt: 0 },
    };

    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.date = startDate;
    }

    if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (department) {
      filter.department = department;
    }

    const records = await Attendance.find(filter)
      .populate({
        path: 'employeeId',
        populate: [
          { path: 'department' },
          { path: 'designation' }
        ]
      })
      .sort({ date: -1, checkIn: 1 });

    const lateEntries = records.map(r => ({
      _id: r._id,
      emp: r.emp,
      empId: r.empId,
      date: r.date,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      hours: r.hours,
      lateMinutes: r.lateMinutes,
      status: r.status,
      department: r.employeeId?.department?.title || 'N/A',
      designation: r.employeeId?.designation?.title || 'N/A',
    }));

    const stats = {
      totalLate: lateEntries.length,
      totalLateMinutes: lateEntries.reduce((sum, e) => sum + (e.lateMinutes || 0), 0),
      avgLateMinutes: lateEntries.length > 0
        ? Math.round(lateEntries.reduce((sum, e) => sum + (e.lateMinutes || 0), 0) / lateEntries.length)
        : 0,
    };

    res.status(200).json({ lateEntries, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLeaveRecords = async (req, res) => {
  try {
    const { month, year, employeeId, status } = req.query;
    const filter = { recordType: 'leave' };

    if (month && year) {
      filter.date = { $regex: `^${year}-${String(month).padStart(2, '0')}` };
    }

    if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (status) {
      filter.status = status;
    }

    const records = await Attendance.find(filter)
      .populate('employeeId')
      .sort({ createdAt: -1 });

    const stats = {
      total: records.length,
      approved: records.filter(r => r.status === 'Approved').length,
      pending: records.filter(r => r.status === 'Pending').length,
      rejected: records.filter(r => r.status === 'Rejected').length,
      totalDays: records.reduce((sum, r) => sum + (r.days || 0), 0),
    };

    res.status(200).json({ records, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateLeaveRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, from, to, fromTime, toTime, type, reason, status } = req.body;
    const record = await Attendance.findById(id);

    if (!record) {
      return res.status(404).json({ error: 'Leave record not found' });
    }

    if (record.recordType !== 'leave') {
      return res.status(400).json({ error: 'Record is not a leave record' });
    }

    if (employeeId) record.employeeId = employeeId;
    if (from) record.from = from;
    if (to) record.to = to;
    if (fromTime !== undefined) record.fromTime = fromTime;
    if (toTime !== undefined) record.toTime = toTime;
    if (type) record.type = type;
    if (reason) record.reason = reason;
    if (status) record.status = status;
    
    await record.save();

    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const applyLeave = async (req, res) => {
  try {
    const { employeeId, from, to, fromTime, toTime, type, reason } = req.body;
    const userId = req.user?._id;

    if (!employeeId || !from || !to || !type) {
      return res.status(400).json({ error: 'Employee, dates, and leave type are required' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const startDate = new Date(from);
    const endDate = new Date(to);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return res.status(400).json({ error: 'Cannot apply leave for past dates' });
    }

    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current).toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    const createdRecords = [];
    const updatedRecords = [];

    for (const dateStr of days) {
      const existingAttendance = await Attendance.findOne({
        employeeId: employee._id,
        date: dateStr,
        recordType: 'attendance'
      });

      const existingLeave = await Attendance.findOne({
        employeeId: employee._id,
        date: dateStr,
        recordType: 'leave'
      });

      if (existingLeave) {
        continue;
      }

      if (existingAttendance) {
        existingAttendance.status = 'Leave';
        existingAttendance.updatedBy = userId;
        await existingAttendance.save();
        updatedRecords.push(existingAttendance);
      } else {
        const count = await Attendance.countDocuments({ recordType: 'leave' });
        const leaveRecord = await Attendance.create({
          id: generateId('LVE', count),
          recordType: 'leave',
          employeeId: employee._id,
          emp: employee.name,
          empId: employee.id,
          date: dateStr,
          from,
          to,
          fromTime: fromTime || null,
          toTime: toTime || null,
          type,
          reason,
          status: 'Pending',
          days: 1,
          createdBy: userId,
        });
        createdRecords.push(leaveRecord);
      }
    }

    res.status(201).json({
      message: 'Leave applied successfully',
      createdRecords,
      updatedRecords,
      totalDays: days.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const initializeDailyAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if attendance already initialized for today
    const existingCount = await Attendance.countDocuments({ 
      recordType: 'attendance', 
      date: today 
    });
    
    if (existingCount > 0) {
      return res.status(200).json({ 
        message: 'Attendance already initialized for today',
        existingRecords: existingCount
      });
    }
    
    // Get all active employees
    const employees = await Employee.find({ status: 'Active' });
    
    // Get current count for ID generation
    const count = await Attendance.countDocuments({ recordType: 'attendance' });
    
    const attendanceRecords = employees.map((employee, index) => ({
      id: generateId('ATT', count + index),
      recordType: 'attendance',
      employeeId: employee._id,
      emp: employee.name,
      empId: employee.id,
      date: today,
      checkIn: '--',
      checkOut: '--',
      hours: '--',
      workingHours: 0,
      status: 'Absent',
      lateMinutes: 0,
      isHoliday: false,
      isWeekOff: false,
      earlyCheckout: false,
      createdBy: req.user?._id || null,
    }));
    
    const inserted = await Attendance.insertMany(attendanceRecords);
    
    res.status(201).json({ 
      message: 'Daily attendance initialized successfully',
      recordsCreated: inserted.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  createAttendanceRecord: createRecord,
  getAllAttendanceRecords: getAllRecords,
  updateAttendanceRecord: updateRecord,
  deleteAttendanceRecord: deleteRecord,
  scanAttendance,
  getTodayAttendance,
  getAttendanceReport,
  generateQrToken,
  getLateEntryReport,
  getLeaveRecords,
  updateLeaveRecord,
  applyLeave,
  initializeDailyAttendance,
};
