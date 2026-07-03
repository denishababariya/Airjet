const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./model/User.model');
const Employee = require('./model/Empl.model');
const Department = require('./model/Depart.model');
const Designation = require('./model/Designation.model');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/airjet', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    console.log('Existing data cleared');

    // Create Departments
    const departments = await Department.create([
      { id: 'DEPT001', title: 'Administration', isActive: true },
      { id: 'DEPT002', title: 'Human Resources', isActive: true },
      { id: 'DEPT003', title: 'Sales', isActive: true },
      { id: 'DEPT004', title: 'Purchase', isActive: true },
      { id: 'DEPT005', title: 'Service', isActive: true },
      { id: 'DEPT006', title: 'Warehouse', isActive: true },
      { id: 'DEPT007', title: 'Accounts', isActive: true },
    ]);
    console.log('Departments created');

    // Create Designations
    const designations = await Designation.create([
      { id: 'DESG001', title: 'Admin', department: departments[0]._id, isActive: true },
      { id: 'DESG002', title: 'HR Manager', department: departments[1]._id, isActive: true },
      { id: 'DESG003', title: 'Sales Manager', department: departments[2]._id, isActive: true },
      { id: 'DESG004', title: 'Purchase Manager', department: departments[3]._id, isActive: true },
      { id: 'DESG005', title: 'Service Engineer', department: departments[4]._id, isActive: true },
      { id: 'DESG006', title: 'Warehouse Manager', department: departments[5]._id, isActive: true },
      { id: 'DESG007', title: 'Accountant', department: departments[6]._id, isActive: true },
    ]);
    console.log('Designations created');

    // Create Employees
    const employees = await Employee.create([
      {
        id: 'EMP001',
        name: 'Default Admin',
        email: 'admin@airjet.com',
        address: '123 Main St, City',
        phoneNo: 9876543210,
        bod: new Date('1990-01-01'),
        age: 34,
        department: departments[0]._id,
        designation: designations[0]._id,
        salary: 50000,
        gender: 'Male',
        workShift: 'Day',
        cast: 'General',
        status: 'Active'
      },
      {
        id: 'EMP002',
        name: 'HR Manager',
        email: 'hr@airjet.com',
        address: '456 Park Ave, City',
        phoneNo: 9876543211,
        bod: new Date('1992-05-15'),
        age: 32,
        department: departments[1]._id,
        designation: designations[1]._id,
        salary: 45000,
        gender: 'Female',
        workShift: 'Day',
        cast: 'General',
        status: 'Active'
      },
    ]);
    console.log('Employees created');

    // Hash passwords
    const hashedAdminPassword = await bcrypt.hash('admin@123', 10);
    const hashedHRPassword = await bcrypt.hash('hr@123', 10);

    // Create Users
    await User.create([
      {
        id: 'USR001',
        employeeId: employees[0]._id,
        role: 'Admin',
        password: hashedAdminPassword,
        confirmPassword: hashedAdminPassword,
        isVerified: true,
        status: 'Active'
      },
      {
        id: 'USR002',
        employeeId: employees[1]._id,
        role: 'HR',
        password: hashedHRPassword,
        confirmPassword: hashedHRPassword,
        isVerified: true,
        status: 'Active'
      }
    ]);
    console.log('Users created');

    console.log('Seeding completed successfully!');
    console.log('Default Admin credentials:');
    console.log('Email: admin@airjet.com');
    console.log('Password: admin@123');
    console.log('HR credentials:');
    console.log('Email: hr@airjet.com');
    console.log('Password: hr@123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
