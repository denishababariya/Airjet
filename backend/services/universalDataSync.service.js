const Employee = require('../model/Empl.model');
const Customer = require('../model/Customer.model');
const Supplier = require('../model/Supplier.model');
const Stock = require('../model/Stock.model');
const SpareParts = require('../model/SpareParts.model');
const ErpRecord = require('../model/ErpRecord.model');

/**
 * Universal Data Sync Service
 * Syncs data from all modules (Employee, Customer, Supplier, Stock, SpareParts) to ERP records
 * Creates 1-to-1 relationships using same ID across all modules
 */

const ENTITY_MODULES = {
  employee: ['payroll', 'sales', 'warehouse', 'service', 'accounts'],
  customer: ['sales', 'accounts', 'warehouse'],
  supplier: ['purchase', 'warehouse', 'accounts'],
  stock: ['warehouse', 'purchase', 'sales'],
  spareparts: ['warehouse', 'sales', 'service']
};

/**
 * Sync entity data across relevant modules
 */
const syncEntityAcrossModules = async (entityData, entityType, operation = 'create') => {
  const { _id, id, name, status } = entityData;
  const modules = ENTITY_MODULES[entityType] || [];
  const syncPromises = [];

  for (const module of modules) {
    const recordData = await generateRecordData(entityData, entityType, module);
    
    if (operation === 'create') {
      syncPromises.push(
        ErpRecord.findOneAndUpdate(
          { id: id, module: module, entityType: entityType },
          recordData,
          { upsert: true, new: true }
        )
      );
    } else if (operation === 'update') {
      syncPromises.push(
        ErpRecord.findOneAndUpdate(
          { id: id, module: module, entityType: entityType },
          { $set: recordData },
          { upsert: true, new: true }
        )
      );
    }
  }

  try {
    await Promise.all(syncPromises);
    console.log(`${entityType} ${id} synced across modules: ${modules.join(', ')}`);
  } catch (error) {
    console.error(`Error syncing ${entityType} across modules:`, error);
    throw error;
  }
};

/**
 * Generate record data based on entity type and module
 */
const generateRecordData = async (entityData, entityType, module) => {
  const { _id, id, name, email, phone, phoneNo, contact, status } = entityData;
  const baseData = {
    id: id,
    module: module,
    entityType: entityType,
    status: status || 'Active'
  };

  // Add entity reference
  if (entityType === 'employee') {
    baseData.employeeId = _id;
    baseData.empId = id;
  } else if (entityType === 'customer') {
    baseData.customerId = _id;
    baseData.customerId_str = id;
  } else if (entityType === 'supplier') {
    baseData.supplierId = _id;
    baseData.supplierId_str = id;
  } else if (entityType === 'stock') {
    baseData.stockId = _id;
    baseData.stockId_str = id;
  } else if (entityType === 'spareparts') {
    baseData.sparePartId = _id;
    baseData.sparePartId_str = id;
  }

  // Module-specific data
  switch (entityType) {
    case 'employee':
      return generateEmployeeRecordData(entityData, module, baseData);
    case 'customer':
      return generateCustomerRecordData(entityData, module, baseData);
    case 'supplier':
      return generateSupplierRecordData(entityData, module, baseData);
    case 'stock':
      return generateStockRecordData(entityData, module, baseData);
    case 'spareparts':
      return generateSparePartsRecordData(entityData, module, baseData);
    default:
      return baseData;
  }
};

/**
 * Generate employee record data for different modules
 */
const generateEmployeeRecordData = (data, module, baseData) => {
  const { name, email, phoneNo, salary, department, designation } = data;
  
  switch (module) {
    case 'payroll':
      return {
        ...baseData,
        recordType: 'salary',
        emp: name,
        basic: salary || 0,
        allowances: 0,
        deductions: 0,
        net: salary || 0,
        month: new Date().toISOString().slice(0, 7)
      };
    case 'sales':
      return {
        ...baseData,
        recordType: 'customer',
        name: name,
        contact: phoneNo?.toString() || '',
        phone: phoneNo?.toString() || '',
        type: 'Employee'
      };
    case 'warehouse':
      return {
        ...baseData,
        recordType: 'assignment',
        emp: name,
        assigned: 0,
        inProgress: 0,
        resolved: 0,
        expertise: '',
        available: data.status === 'Active' ? 'Yes' : 'No'
      };
    case 'service':
      return {
        ...baseData,
        recordType: 'ticket',
        emp: name,
        engineer: name,
        machine: '',
        issue: '',
        priority: 'Medium',
        ticket: `SRV-${id}`
      };
    case 'accounts':
      return {
        ...baseData,
        recordType: 'ledger',
        name: name,
        debit: 0,
        credit: 0,
        balance: 0,
        period: new Date().toISOString().slice(0, 7)
      };
    default:
      return baseData;
  }
};

/**
 * Generate customer record data for different modules
 */
const generateCustomerRecordData = (data, module, baseData) => {
  const { name, email, phone, city, gstNumber, companyName, customerType } = data;
  
  switch (module) {
    case 'sales':
      return {
        ...baseData,
        recordType: 'customer',
        name: name,
        contact: phone || '',
        phone: phone || '',
        city: city || '',
        gst: gstNumber || '',
        type: customerType || 'Individual',
        party: companyName || name
      };
    case 'accounts':
      return {
        ...baseData,
        recordType: 'receivable',
        name: name,
        debit: data.totalAmountSpent || 0,
        credit: 0,
        balance: data.currentBalance || 0,
        period: new Date().toISOString().slice(0, 7)
      };
    case 'warehouse':
      return {
        ...baseData,
        recordType: 'delivery',
        name: name,
        contact: phone || '',
        city: city || '',
        delivery: 'Pending',
        dueDate: ''
      };
    default:
      return baseData;
  }
};

/**
 * Generate supplier record data for different modules
 */
const generateSupplierRecordData = (data, module, baseData) => {
  const { name, contact, phone, city, gst, email, address } = data;
  
  switch (module) {
    case 'purchase':
      return {
        ...baseData,
        recordType: 'supplier',
        name: name,
        contact: contact || phone || '',
        phone: phone || '',
        city: city || '',
        gst: gst || '',
        supplier: name
      };
    case 'warehouse':
      return {
        ...baseData,
        recordType: 'grn',
        supplier: name,
        contact: contact || phone || '',
        receivedBy: '',
        generated: ''
      };
    case 'accounts':
      return {
        ...baseData,
        recordType: 'payable',
        name: name,
        debit: 0,
        credit: 0,
        balance: 0,
        period: new Date().toISOString().slice(0, 7)
      };
    default:
      return baseData;
  }
};

/**
 * Generate stock record data for different modules
 */
const generateStockRecordData = (data, module, baseData) => {
  const { itemName, itemCode, category, quantity, unitPrice, supplier, location } = data;
  
  switch (module) {
    case 'warehouse':
      return {
        ...baseData,
        recordType: 'stock',
        part: itemName,
        qty: quantity,
        location: location || '',
        from: supplier || '',
        to: '',
        status: data.status || 'In Stock'
      };
    case 'purchase':
      return {
        ...baseData,
        recordType: 'order',
        part: itemName,
        qty: quantity,
        supplier: supplier || '',
        po: '',
        due: ''
      };
    case 'sales':
      return {
        ...baseData,
        recordType: 'invoice',
        part: itemName,
        qty: quantity,
        amount: quantity * unitPrice,
        date: new Date().toISOString().slice(0, 10)
      };
    default:
      return baseData;
  }
};

/**
 * Generate spare parts record data for different modules
 */
const generateSparePartsRecordData = (data, module, baseData) => {
  const { partName, partNumber, category, brand, model, quantity, unitPrice, sellingPrice, supplier, location } = data;
  
  switch (module) {
    case 'warehouse':
      return {
        ...baseData,
        recordType: 'parts',
        part: partName,
        qty: quantity,
        location: location || '',
        from: supplier || '',
        status: data.status || 'Available'
      };
    case 'sales':
      return {
        ...baseData,
        recordType: 'quotation',
        part: partName,
        qty: quantity,
        amount: quantity * sellingPrice,
        validTill: ''
      };
    case 'service':
      return {
        ...baseData,
        recordType: 'report',
        part: partName,
        parts: partNumber,
        hours: '',
        cost: unitPrice?.toString() || ''
      };
    default:
      return baseData;
  }
};

/**
 * Delete entity data from all modules
 */
const deleteEntityFromModules = async (entityId, entityType) => {
  try {
    const deleteQuery = {};
    
    if (entityType === 'employee') {
      deleteQuery.employeeId = entityId;
    } else if (entityType === 'customer') {
      deleteQuery.customerId = entityId;
    } else if (entityType === 'supplier') {
      deleteQuery.supplierId = entityId;
    } else if (entityType === 'stock') {
      deleteQuery.stockId = entityId;
    } else if (entityType === 'spareparts') {
      deleteQuery.sparePartId = entityId;
    }
    
    await ErpRecord.deleteMany(deleteQuery);
    console.log(`${entityType} ${entityId} deleted from all modules`);
  } catch (error) {
    console.error(`Error deleting ${entityType} from modules:`, error);
    throw error;
  }
};

/**
 * Get entity data from all modules
 */
const getEntityFromAllModules = async (entityId, entityType) => {
  try {
    const query = {};
    
    if (entityType === 'employee') {
      query.employeeId = entityId;
    } else if (entityType === 'customer') {
      query.customerId = entityId;
    } else if (entityType === 'supplier') {
      query.supplierId = entityId;
    } else if (entityType === 'stock') {
      query.stockId = entityId;
    } else if (entityType === 'spareparts') {
      query.sparePartId = entityId;
    }
    
    const records = await ErpRecord.find(query).sort({ module: 1, recordType: 1 });
    
    const groupedData = {};
    records.forEach(record => {
      if (!groupedData[record.module]) {
        groupedData[record.module] = [];
      }
      groupedData[record.module].push(record);
    });

    return groupedData;
  } catch (error) {
    console.error(`Error fetching ${entityType} from modules:`, error);
    throw error;
  }
};

/**
 * Get all data from all modules for dashboard
 */
const getAllModuleData = async () => {
  try {
    const records = await ErpRecord.find({}).sort({ module: 1, recordType: 1 });
    
    const groupedData = {
      payroll: [],
      sales: [],
      warehouse: [],
      service: [],
      accounts: [],
      purchase: []
    };
    
    records.forEach(record => {
      if (groupedData[record.module]) {
        groupedData[record.module].push(record);
      }
    });

    return groupedData;
  } catch (error) {
    console.error('Error fetching all module data:', error);
    throw error;
  }
};

module.exports = {
  syncEntityAcrossModules,
  deleteEntityFromModules,
  getEntityFromAllModules,
  getAllModuleData,
  ENTITY_MODULES
};
