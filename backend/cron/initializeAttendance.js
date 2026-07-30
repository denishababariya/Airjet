const mongoose = require('mongoose');
const Employee = require('../model/Empl.model');
const Attendance = require('../model/Attendance.model');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/airjet')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const generateId = (prefix, count) => {
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
};

async function initializeDailyAttendance() {
  try {
    // Wait for MongoDB connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Starting daily attendance initialization...');
    const today = new Date().toISOString().split('T')[0];
    console.log(`Date: ${today}`);
    
    // Check if attendance already initialized for today
    const existingCount = await Attendance.countDocuments({ 
      recordType: 'attendance', 
      date: today 
    });
    
    if (existingCount > 0) {
      console.log(`Attendance already initialized for today. Found ${existingCount} existing records.`);
      process.exit(0);
    }
    
    // Get all active employees
    const employees = await Employee.find({ status: 'Active' });
    console.log(`Found ${employees.length} active employees`);
    
    if (employees.length === 0) {
      console.log('No active employees found. Exiting.');
      process.exit(0);
    }
    
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
      overtimeMinutes: 0,
      isHoliday: false,
      isWeekOff: false,
      earlyCheckout: false,
    }));
    
    const inserted = await Attendance.insertMany(attendanceRecords);
    
    console.log(`✓ Successfully initialized daily attendance for ${inserted.length} employees`);
    console.log(`✓ All employees marked as Absent until they check in`);
    process.exit(0);
  } catch (error) {
    console.error('Error initializing daily attendance:', error);
    process.exit(1);
  }
}

initializeDailyAttendance();
