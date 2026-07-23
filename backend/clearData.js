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
const Role = require('./model/Role.model');
const Permission = require('./model/Permission.model');
const RolePermission = require('./model/RolePermission.model');
require('dotenv').config();

async function clearAllData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/airjet', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');

    console.log('Clearing all data...');
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
      RolePermission.deleteMany({}),
      Permission.deleteMany({}),
      Role.deleteMany({}),
    ]);
    console.log('All data cleared!');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

clearAllData();