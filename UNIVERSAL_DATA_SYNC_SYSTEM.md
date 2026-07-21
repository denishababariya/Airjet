# Universal Data Synchronization System

## Overview
This system implements comprehensive cross-module data synchronization where data added in any module (Employee, Customer, Supplier, Stock, Spare Parts) is automatically available across all relevant ERP modules with 1-to-1 relationships based on unique IDs.

## Supported Entities and Their Module Mappings

### 1. Employee
**Syncs to:** Payroll, Sales, Warehouse, Service, Accounts
- **Payroll**: Salary record with basic, allowances, deductions
- **Sales**: Customer record with contact info
- **Warehouse**: Assignment record with task tracking
- **Service**: Ticket record with service info
- **Accounts**: Ledger record with financial data

### 2. Customer
**Syncs to:** Sales, Accounts, Warehouse
- **Sales**: Customer record with purchase history
- **Accounts**: Receivable record with balance
- **Warehouse**: Delivery record with shipping info

### 3. Supplier
**Syncs to:** Purchase, Warehouse, Accounts
- **Purchase**: Supplier record with order info
- **Warehouse**: GRN record with receiving info
- **Accounts**: Payable record with balance

### 4. Stock
**Syncs to:** Warehouse, Purchase, Sales
- **Warehouse**: Stock record with inventory info
- **Purchase**: Order record with procurement info
- **Sales**: Invoice record with pricing info

### 5. Spare Parts
**Syncs to:** Warehouse, Sales, Service
- **Warehouse**: Parts record with inventory info
- **Sales**: Quotation record with pricing info
- **Service**: Report record with usage info

## How It Works

### Data Flow
1. **Create Entity**: When you create an entity (e.g., Employee), the system automatically creates corresponding records in all relevant modules
2. **Update Entity**: When you update an entity, all related module records are updated automatically
3. **Delete Entity**: When you delete an entity, all related module records are deleted automatically
4. **View Data**: You can view all module data for any entity using the new API endpoints

### ID System
- Each entity has a unique ID (e.g., "EMP001", "CUST001", "SUP001")
- This same ID is used across all modules to maintain 1-to-1 relationships
- MongoDB ObjectId references are also stored for proper database relationships

## Backend Implementation

### New Service File
**`backend/services/universalDataSync.service.js`**
- `syncEntityAcrossModules()` - Syncs entity data to relevant modules
- `deleteEntityFromModules()` - Removes entity data from all modules
- `getEntityFromAllModules()` - Retrieves entity data from all modules
- `getAllModuleData()` - Gets all data from all modules for dashboard

### Modified Controllers
All entity controllers now include:
- Import of universal data sync service
- Sync calls in create, update, and delete operations
- New `getModuleData()` function to retrieve all module data

**Modified Controllers:**
- `backend/controller/empl.controller.js`
- `backend/controller/customer.controller.js`
- `backend/controller/supplier.controller.js`
- `backend/controller/stock.controller.js`
- `backend/controller/spareParts.controller.js`
- `backend/controller/dashboard.controller.js`

### New API Routes
- `GET /api/employees/:id/modules` - Get employee data from all modules
- `GET /api/customers/:id/modules` - Get customer data from all modules
- `GET /api/suppliers/:id/modules` - Get supplier data from all modules
- `GET /api/stock/:id/modules` - Get stock data from all modules
- `GET /api/spare-parts/:id/modules` - Get spare parts data from all modules
- `GET /api/dashboard/all-modules` - Get all data from all modules

## Frontend Implementation

### Modified API File
**`frontend/src/utils/api.js`**
Added new methods to all entity APIs:
- `employeesApi.getModuleData(id)`
- `customersApi.getModuleData(id)`
- `suppliersApi.getModuleData(id)`
- `stockApi.getModuleData(id)`
- `sparePartsApi.getModuleData(id)`
- `dashboardApi.getAllModuleData()`

## MongoDB Storage

All synchronized data is stored in the `erprecord` collection with the following structure:

```javascript
{
  id: "EMP001",                    // Same ID as source entity
  module: "payroll",               // Target module
  recordType: "salary",            // Record type within module
  entityType: "employee",          // Source entity type
  employeeId: ObjectId("..."),     // Reference to employee
  empId: "EMP001",                // Employee ID string
  emp: "Rajesh Kumar",            // Employee name
  basic: 35000,                   // Module-specific fields
  allowances: 0,
  deductions: 0,
  net: 35000,
  month: "2026-07",
  status: "Active",
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

## Usage Examples

### Create Employee (Auto-syncs to 5 modules)
```javascript
import { employeesApi } from './utils/api';

const newEmployee = await employeesApi.create({
  name: 'Rajesh Kumar',
  email: 'rajesh@airjet.in',
  phoneNo: 9876501001,
  department: deptId,
  designation: desigId,
  salary: 35000
});
// Automatically creates records in: payroll, sales, warehouse, service, accounts
```

### Create Customer (Auto-syncs to 3 modules)
```javascript
import { customersApi } from './utils/api';

const newCustomer = await customersApi.create({
  name: 'ABC Company',
  email: 'abc@company.com',
  phone: '9876501001',
  city: 'Ahmedabad',
  customerType: 'Business'
});
// Automatically creates records in: sales, accounts, warehouse
```

### Get Employee Data from All Modules
```javascript
import { employeesApi } from './utils/api';

const moduleData = await employeesApi.getModuleData(employeeId);
console.log(moduleData.moduleData.payroll);   // Payroll records
console.log(moduleData.moduleData.sales);     // Sales records
console.log(moduleData.moduleData.warehouse); // Warehouse records
console.log(moduleData.moduleData.service);   // Service records
console.log(moduleData.moduleData.accounts);  // Accounts records
```

### Get All Module Data for Dashboard
```javascript
import { dashboardApi } from './utils/api';

const allData = await dashboardApi.getAllModuleData();
console.log(allData.payroll);    // All payroll records
console.log(allData.sales);      // All sales records
console.log(allData.warehouse);  // All warehouse records
console.log(allData.service);    // All service records
console.log(allData.accounts);   // All accounts records
console.log(allData.purchase);   // All purchase records
```

## Benefits

1. **Data Consistency**: Entity data is consistent across all modules
2. **1-to-1 Relationships**: Same ID used across all modules for easy tracking
3. **Automatic Sync**: No manual intervention needed when creating/updating/deleting
4. **Easy Maintenance**: Update once, reflects everywhere
5. **Data Integrity**: Centralized entity management
6. **Comprehensive Coverage**: All major entities supported
7. **MongoDB Storage**: All synced data properly stored and indexed

## Testing the System

### Test Employee Sync
1. Create an employee via Employee Master page
2. Check MongoDB `erprecord` collection - you should see 5 new records
3. Update the employee - all 5 records should update
4. Delete the employee - all 5 records should delete
5. Use `/api/employees/:id/modules` to verify data

### Test Customer Sync
1. Create a customer via Sales page
2. Check MongoDB `erprecord` collection - you should see 3 new records
3. Update the customer - all 3 records should update
4. Delete the customer - all 3 records should delete
5. Use `/api/customers/:id/modules` to verify data

### Test All Entities
Repeat similar tests for:
- Supplier (syncs to 3 modules)
- Stock (syncs to 3 modules)
- Spare Parts (syncs to 3 modules)

## Database Queries

### View All Synced Records for an Entity
```javascript
// Employee
db.erprecord.find({ entityType: "employee", empId: "EMP001" })

// Customer
db.erprecord.find({ entityType: "customer", customerId_str: "CUST001" })

// Supplier
db.erprecord.find({ entityType: "supplier", supplierId_str: "SUP001" })

// Stock
db.erprecord.find({ entityType: "stock", stockId_str: "STK001" })

// Spare Parts
db.erprecord.find({ entityType: "spareparts", sparePartId_str: "SPR001" })
```

### View All Records for a Module
```javascript
db.erprecord.find({ module: "payroll" })
db.erprecord.find({ module: "sales" })
db.erprecord.find({ module: "warehouse" })
db.erprecord.find({ module: "service" })
db.erprecord.find({ module: "accounts" })
db.erprecord.find({ module: "purchase" })
```

## Future Enhancements

- Add support for additional entities (Departments, Designations, etc.)
- Implement real-time sync using websockets
- Add sync status tracking and error handling
- Implement conflict resolution for concurrent updates
- Add audit trail for sync operations
- Implement bulk sync operations
- Add sync retry mechanism for failed operations
