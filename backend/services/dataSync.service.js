const Employee = require('../model/Empl.model');
const ErpRecord = require('../model/ErpRecord.model');

/**
 * Sync employee data across all ERP modules
 * Creates 1-to-1 relationship using the same employee ID across modules
 */
const syncEmployeeAcrossModules = async (employeeData, operation = 'create') => {
  const { id, name, email, phoneNo, department, designation, salary, status } = employeeData;
  
  const modules = ['payroll', 'sales', 'warehouse', 'service', 'accounts'];
  const syncPromises = [];

  for (const module of modules) {
    let recordType;
    let recordData;

    switch (module) {
      case 'payroll':
        recordType = 'salary';
        recordData = {
          id: id,
          module: module,
          recordType: recordType,
          employeeId: employeeData._id,
          empId: id,
          emp: name,
          basic: salary || 0,
          allowances: 0,
          deductions: 0,
          net: salary || 0,
          month: new Date().toISOString().slice(0, 7),
          status: status || 'Active'
        };
        break;

      case 'sales':
        recordType = 'customer';
        recordData = {
          id: id,
          module: module,
          recordType: recordType,
          employeeId: employeeData._id,
          empId: id,
          name: name,
          contact: phoneNo?.toString() || '',
          phone: phoneNo?.toString() || '',
          city: '',
          type: 'Employee',
          status: status || 'Active'
        };
        break;

      case 'warehouse':
        recordType = 'assignment';
        recordData = {
          id: id,
          module: module,
          recordType: recordType,
          employeeId: employeeData._id,
          empId: id,
          emp: name,
          assigned: 0,
          inProgress: 0,
          resolved: 0,
          expertise: '',
          available: status === 'Active' ? 'Yes' : 'No',
          status: status || 'Active'
        };
        break;

      case 'service':
        recordType = 'ticket';
        recordData = {
          id: id,
          module: module,
          recordType: recordType,
          employeeId: employeeData._id,
          empId: id,
          emp: name,
          engineer: name,
          machine: '',
          issue: '',
          priority: 'Medium',
          ticket: `SRV-${id}`,
          status: status || 'Active'
        };
        break;

      case 'accounts':
        recordType = 'ledger';
        recordData = {
          id: id,
          module: module,
          recordType: recordType,
          employeeId: employeeData._id,
          empId: id,
          name: name,
          debit: 0,
          credit: 0,
          balance: 0,
          period: new Date().toISOString().slice(0, 7),
          status: status || 'Active'
        };
        break;
    }

    if (operation === 'create') {
      syncPromises.push(
        ErpRecord.findOneAndUpdate(
          { id: id, module: module, recordType: recordType },
          recordData,
          { upsert: true, new: true }
        )
      );
    } else if (operation === 'update') {
      syncPromises.push(
        ErpRecord.findOneAndUpdate(
          { id: id, module: module, recordType: recordType },
          { $set: recordData },
          { upsert: true, new: true }
        )
      );
    }
  }

  try {
    await Promise.all(syncPromises);
    console.log(`Employee ${id} synced across all modules`);
  } catch (error) {
    console.error('Error syncing employee across modules:', error);
    throw error;
  }
};

/**
 * Delete employee data from all modules
 */
const deleteEmployeeFromModules = async (employeeId) => {
  try {
    await ErpRecord.deleteMany({ employeeId: employeeId });
    console.log(`Employee ${employeeId} deleted from all modules`);
  } catch (error) {
    console.error('Error deleting employee from modules:', error);
    throw error;
  }
};

/**
 * Get employee data from all modules by ID
 */
const getEmployeeFromAllModules = async (employeeId) => {
  try {
    const records = await ErpRecord.find({ employeeId: employeeId })
      .sort({ module: 1, recordType: 1 });
    
    const groupedData = {};
    records.forEach(record => {
      if (!groupedData[record.module]) {
        groupedData[record.module] = [];
      }
      groupedData[record.module].push(record);
    });

    return groupedData;
  } catch (error) {
    console.error('Error fetching employee from modules:', error);
    throw error;
  }
};

module.exports = {
  syncEmployeeAcrossModules,
  deleteEmployeeFromModules,
  getEmployeeFromAllModules
};
