 const Attendance = require('../model/Attendance.model');
const Employee = require('../model/Empl.model');
const User = require('../model/User.model');

const generateId = (prefix, count) =>
  `${prefix}${String(count + 1).padStart(3, '0')}`;
const DUPLICATE_SCAN_WINDOW_MS = 30 * 1000;

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
    
    // Check if already checked in today
    const existingRecord = await Attendance.findOne({
      employeeId: employee._id,
      date: today,
      recordType: 'attendance'
    });

    if (existingRecord && existingRecord.checkIn !== '--') {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const now = new Date();
    const checkInTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Determine status based on check-in time
    const hour = now.getHours();
    const minute = now.getMinutes();
    let status = 'Present';
    let checkOutTime = '--';
    let hoursWorked = '--';
    
    if (hour > 8 || (hour === 8 && minute > 15)) {
      status = 'Absent';
    } else if (hour === 8 && minute > 0) {
      status = 'Late';
    } else if (hour === 7 && minute >= 45) {
      // Early check-in (7:45-8:00) - auto check-out at 8:00
      status = 'Present';
      checkOutTime = '08:00';
      const checkInDate = new Date();
      checkInDate.setHours(hour, minute, 0);
      const checkOutDate = new Date();
      checkOutDate.setHours(8, 0, 0);
      const diffMs = checkOutDate - checkInDate;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      hoursWorked = `${diffMins}m`;
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
      checkOut: checkOutTime,
      hours: hoursWorked,
      status: status
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
    
    // Calculate hours worked
    const checkInParts = record.checkIn.split(':');
    const checkInDate = new Date();
    checkInDate.setHours(parseInt(checkInParts[0]), parseInt(checkInParts[1]), 0);
    
    const diffMs = now - checkInDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const hoursWorked = `${diffHours}h ${diffMins}m`;

    record.checkOut = checkOutTime;
    record.hours = hoursWorked;
    await record.save();

    res.status(200).json(record);
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

    const records = await Attendance.find(filter).sort({ date: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createRecord = async (req, res) => {
  try {
    const count = await Attendance.countDocuments({ recordType: req.body.recordType || 'attendance' });
    const prefix = req.body.recordType === 'leave' ? 'LVE' : req.body.recordType === 'overtime' ? 'OT' : 'ATT';
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

// ──────────────────────────────────────────────────────────────
// QR-based Attendance Scanning
// ──────────────────────────────────────────────────────────────

const scanAttendance = async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required' });
    }

    // Find employee by ID or qrToken
    let employee = await Employee.findOne({ id: employeeId });
    if (!employee) {
      employee = await Employee.findOne({ qrToken: employeeId });
    }
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Check if already checked in today
    const existingRecord = await Attendance.findOne({
      employeeId: employee._id,
      date: today,
      recordType: 'attendance'
    });

    if (existingRecord) {
      const lastUpdatedAt = existingRecord.updatedAt ? new Date(existingRecord.updatedAt).getTime() : 0;
      const isScannedTooSoon = Date.now() - lastUpdatedAt < DUPLICATE_SCAN_WINDOW_MS;
      if (isScannedTooSoon) {
        return res.status(429).json({
          error: 'Already scanned. Please wait 30 seconds before scanning again.',
          type: 'duplicate_scan',
          employee: {
            id: employee.id,
            name: employee.name
          },
          attendance: existingRecord
        });
      }

      // If already checked in but not checked out, auto check-out
      if (existingRecord.checkOut === '--' || !existingRecord.checkOut) {
        const checkOutTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // Calculate hours worked
        const checkInParts = existingRecord.checkIn.split(':');
        const checkInDate = new Date();
        checkInDate.setHours(parseInt(checkInParts[0]), parseInt(checkInParts[1]), 0);
        const diffMs = now - checkInDate;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const hoursWorked = `${diffHours}h ${diffMins}m`;

        existingRecord.checkOut = checkOutTime;
        existingRecord.hours = hoursWorked;
        existingRecord.status = 'Present';
        await existingRecord.save();

        return res.status(200).json({
          message: 'Check-out recorded successfully',
          type: 'checkout',
          employee: {
            id: employee.id,
            name: employee.name,
            department: employee.department,
            designation: employee.designation,
            image: employee.image || ''
          },
          attendance: existingRecord
        });
      }

      // Already fully checked in and out
      return res.status(400).json({
        error: 'Already checked in and out today',
        type: 'already_complete',
        employee: {
          id: employee.id,
          name: employee.name
        },
        attendance: existingRecord
      });
    }

    // No record found → Check In
    const checkInTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Determine status based on check-in time
    const hour = now.getHours();
    const minute = now.getMinutes();
    let status = 'Present';
    if (hour > 8 || (hour === 8 && minute > 15)) {
      status = 'Late';
    } else if (hour === 8 && minute > 0) {
      status = 'Late';
    }

    const count = await Attendance.countDocuments({ recordType: 'attendance' });
    const record = await Attendance.create({
      id: `ATT${String(count + 1).padStart(3, '0')}`,
      recordType: 'attendance',
      employeeId: employee._id,
      emp: employee.name,
      empId: employee.id,
      date: today,
      checkIn: checkInTime,
      checkOut: '--',
      hours: '--',
      status: status
    });

    return res.status(200).json({
      message: 'Check-in recorded successfully',
      type: 'checkin',
      employee: {
        id: employee.id,
        name: employee.name,
        department: employee.department,
        designation: employee.designation,
        email: employee.email,
        phoneNo: employee.phoneNo,
        image: employee.image || ''
      },
      attendance: record
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const records = await Attendance.find({
      date: today,
      recordType: 'attendance'
    }).sort({ checkIn: 1 });

    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'Present').length,
      late: records.filter(r => r.status === 'Late').length,
      absent: records.filter(r => r.status === 'Absent').length,
      onLeave: records.filter(r => r.status === 'Leave').length,
    };

    res.status(200).json({ date: today, records, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    const filter = { recordType: 'attendance' };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    if (employeeId) {
      filter.empId = employeeId;
    }

    const records = await Attendance.find(filter).sort({ date: -1, checkIn: 1 });

    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'Present').length,
      late: records.filter(r => r.status === 'Late').length,
      absent: records.filter(r => r.status === 'Absent').length,
      onLeave: records.filter(r => r.status === 'Leave').length,
    };

    res.status(200).json({ records, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getEmployeeAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOne({ id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const records = await Attendance.find({
      employeeId: employee._id,
      recordType: 'attendance'
    }).sort({ date: -1 }).limit(30);

    res.status(200).json({ employee, records });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const manualAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status } = req.body;

    if (!employeeId || !date) {
      return res.status(400).json({ error: 'employeeId and date are required' });
    }

    const employee = await Employee.findOne({ id: employeeId });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const count = await Attendance.countDocuments({ recordType: 'attendance' });
    const record = await Attendance.create({
      id: `ATT${String(count + 1).padStart(3, '0')}`,
      recordType: 'attendance',
      employeeId: employee._id,
      emp: employee.name,
      empId: employee.id,
      date: date,
      checkIn: checkIn || '--',
      checkOut: checkOut || '--',
      hours: '--',
      status: status || 'Present'
    });

    res.status(201).json(record);
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
  getEmployeeAttendance,
  manualAttendance,
};
