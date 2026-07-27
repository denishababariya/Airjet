 const Attendance = require('../model/Attendance.model');
const Employee = require('../model/Empl.model');
const User = require('../model/User.model');

const generateId = (prefix, count) =>
  `${prefix}${String(count + 1).padStart(3, '0')}`;

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

    // Case 1: No attendance exists - Create check-in
    if (!existingRecord) {
      const hour = now.getHours();
      const minute = now.getMinutes();
      let status = 'Present';
      let lateMinutes = 0;

      // Calculate late minutes if after 8:15
      if (hour > 8 || (hour === 8 && minute > 15)) {
        status = 'Absent';
        lateMinutes = (hour * 60 + minute) - (8 * 60 + 15);
      } else if (hour === 8 && minute > 0) {
        status = 'Late';
        lateMinutes = minute;
      }

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
        overtimeMinutes: 0,
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

    // Case 2: Attendance exists but no check-out - Update check-out
    if (existingRecord.checkOut === '--') {
      const checkInParts = existingRecord.checkIn.split(':');
      const checkInDate = new Date();
      checkInDate.setHours(parseInt(checkInParts[0]), parseInt(checkInParts[1]), 0);
      
      const diffMs = now - checkInDate;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const workingHours = diffHours + (diffMins / 60);

      // Calculate overtime if worked more than 8 hours
      let overtimeMinutes = 0;
      if (workingHours > 8) {
        overtimeMinutes = Math.round((workingHours - 8) * 60);
      }

      existingRecord.checkOut = currentTime;
      existingRecord.hours = `${diffHours}h ${diffMins}m`;
      existingRecord.workingHours = workingHours;
      existingRecord.overtimeMinutes = overtimeMinutes;
      existingRecord.updatedBy = userId;
      existingRecord.lastScannedAt = now;
      await existingRecord.save();

      return res.status(200).json({
        message: 'Check-out successful',
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
    const records = await Attendance.find({ 
      date: today,
      recordType: 'attendance'
    }).populate('employeeId').sort({ checkIn: 1 });
    
    res.status(200).json(records);
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
      .populate('employeeId')
      .populate('createdBy')
      .populate('updatedBy')
      .sort({ date: -1 });

    // Calculate statistics
    const stats = {
      total: records.length,
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      late: records.filter(r => r.status === 'Late').length,
      totalWorkingHours: records.reduce((sum, r) => sum + (r.workingHours || 0), 0),
      totalOvertime: records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0)
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
};
