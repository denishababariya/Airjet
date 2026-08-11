# Raw Materials Purchasing System

## Overview
A complete raw materials purchasing system with proper supplier connections for managing raw material inventory, purchases, and supplier relationships.

## Backend Implementation

### Models Created

#### 1. RawMaterial Model (`backend/model/RawMaterial.model.js`)
- **Fields:**
  - `id`: Unique identifier (auto-generated: RM0001, RM0002, etc.)
  - `name`: Material name
  - `code`: Unique material code
  - `category`: Material category (Metal, Plastic, Chemical, Fabric, Electronics, Packaging, Other)
  - `subCategory`: Sub-category for detailed classification
  - `unit`: Unit of measurement (kg, g, litre, ml, meter, cm, piece, box, roll, bag)
  - `quantity`: Current stock quantity
  - `minimumStock`: Minimum stock threshold for alerts
  - `unitPrice`: Price per unit
  - `totalPrice`: Auto-calculated (quantity × unitPrice)
  - `supplier`: Reference to Supplier model
  - `supplierName`: Supplier name for quick reference
  - `location`: Storage location
  - `warehouse`: Reference to warehouse
  - `status`: Auto-calculated (In Stock, Low Stock, Out of Stock)
  - `lastPurchaseDate`: Last purchase date
  - `lastPurchasePrice`: Last purchase price
  - `specifications`: Material specifications (grade, color, size, weight, dimensions)
  - `qualityCheck`: Quality check requirements and status

#### 2. RawMaterialPurchase Model (`backend/model/RawMaterialPurchase.model.js`)
- **Fields:**
  - `id`: Unique identifier (auto-generated: RMP0001, RMP0002, etc.)
  - `supplier`: Supplier name
  - `supplierId`: Reference to Supplier model
  - `purchaseDate`: Purchase order date
  - `expectedDelivery`: Expected delivery date
  - `actualDelivery`: Actual delivery date
  - `status`: Purchase status (Pending, Confirmed, In Transit, Delivered, Partial, Cancelled)
  - `items`: Array of purchased items with:
    - `rawMaterialId`: Reference to RawMaterial
    - `materialCode`: Material code
    - `materialName`: Material name
    - `category`: Material category
    - `quantity`: Ordered quantity
    - `unit`: Unit of measurement
    - `unitPrice`: Price per unit
    - `totalPrice`: Total price for this item
    - `receivedQuantity`: Quantity actually received
    - `qualityCheck`: Quality check status for this item
  - `totalAmount`: Subtotal before GST
  - `gstRate`: GST rate (default 18%)
  - `gstAmount`: GST amount
  - `grandTotal`: Total including GST
  - `paymentTerms`: Payment terms
  - `paymentStatus`: Payment status (Pending, Partial, Paid, Overdue)
  - `paymentAmount`: Amount paid
  - `invoiceNumber`: Invoice number
  - `invoiceDate`: Invoice date
  - `notes`: Additional notes

### Controller Functions (`backend/controller/rawMaterial.controller.js`)

#### Raw Material CRUD Operations
- `createRawMaterial`: Create new raw material with supplier connection
- `getAllRawMaterials`: Get all raw materials with filtering (category, supplier, status)
- `getRawMaterialById`: Get single raw material with supplier and warehouse details
- `updateRawMaterial`: Update raw material details
- `deleteRawMaterial`: Delete raw material

#### Raw Material Purchase Operations
- `createRawMaterialPurchase`: Create new purchase order with items
- `getAllRawMaterialPurchases`: Get all purchases with filtering
- `getRawMaterialPurchaseById`: Get single purchase with full details
- `updateRawMaterialPurchase`: Update purchase (auto-updates stock when marked as Delivered)
- `deleteRawMaterialPurchase`: Delete purchase order

#### Quality Check Operations
- `updateQualityCheck`: Update quality check status for purchase items

#### Supplier Operations
- `getSupplierRawMaterials`: Get all raw materials for a specific supplier
- `getLowStockMaterials`: Get all materials below minimum stock threshold

### API Routes (`backend/routes/index.js`)
```
POST   /raw-materials                    - Create raw material
GET    /raw-materials                    - Get all raw materials
GET    /raw-materials/low-stock          - Get low stock materials
GET    /raw-materials/:id                - Get raw material by ID
PUT    /raw-materials/:id                - Update raw material
DELETE /raw-materials/:id                - Delete raw material
GET    /suppliers/:supplierId/raw-materials - Get supplier's raw materials

POST   /raw-material-purchases           - Create purchase
GET    /raw-material-purchases           - Get all purchases
GET    /raw-material-purchases/:id       - Get purchase by ID
PUT    /raw-material-purchases/:id       - Update purchase
DELETE /raw-material-purchases/:id       - Delete purchase
PATCH  /raw-material-purchases/:purchaseId/items/:itemId/quality-check - Update quality check
```

### Supplier Model Updates
Updated `backend/model/Supplier.model.js`:
- Added `rawMaterial` to `productType` enum in products array

### Supplier Controller Updates
Updated `backend/controller/supplier.controller.js`:
- Added RawMaterial import
- Updated `syncSupplierProducts` to handle rawMaterial product type
- Syncs supplier name to raw materials when added to supplier

### Purchase Controller Updates
Updated `backend/controller/purchase.controller.js`:
- Added RawMaterial import
- Updated `getSupplierProducts` to include rawMaterials
- Updated `addSupplierProduct` to handle rawMaterial
- Updated `removeSupplierProduct` to handle rawMaterial

## Frontend Implementation

### Pages Created

#### 1. RawMaterials.js (`frontend/src/pages/RawMaterials.js`)
- **Features:**
  - View all raw materials in a table
  - Search by name or code
  - Filter by category and status
  - Add new raw material with supplier connection
  - Edit existing raw materials
  - Delete raw materials
  - Auto-calculate total value
  - Status badges (In Stock, Low Stock, Out of Stock)
  - Supplier dropdown populated from existing suppliers

- **Form Fields:**
  - Material Name (required)
  - Material Code (required)
  - Category (required)
  - Sub Category
  - Unit (required)
  - Quantity
  - Minimum Stock
  - Unit Price (required)
  - Supplier (dropdown)
  - Location
  - Description

#### 2. RawMaterialPurchases.js (`frontend/src/pages/RawMaterialPurchases.js`)
- **Features:**
  - View all raw material purchases
  - Create new purchase orders
  - Add multiple items to a purchase
  - Auto-calculate totals with GST
  - View purchase details
  - Edit purchase orders
  - Mark purchases as Delivered (auto-updates stock)
  - Delete purchases
  - Status tracking (Pending, Confirmed, In Transit, Delivered, etc.)
  - Payment status tracking

- **Form Fields:**
  - Supplier (required)
  - Purchase Date (required)
  - Expected Delivery
  - Payment Terms
  - Items (dynamic list):
    - Material (dropdown)
    - Quantity
    - Unit Price
  - Notes

## Supplier Connection Flow

1. **Creating Raw Material:**
   - User selects a supplier from dropdown
   - Supplier ID and name are stored in raw material
   - Material is linked to supplier

2. **Creating Purchase Order:**
   - User selects supplier
   - User adds raw materials to purchase
   - System validates materials exist
   - Purchase is created with supplier connection

3. **Marking Purchase as Delivered:**
   - When status changes to "Delivered"
   - System automatically updates raw material quantities
   - Updates lastPurchaseDate and lastPurchasePrice
   - Maintains supplier connection

4. **Supplier Product Management:**
   - Suppliers can have raw materials in their products array
   - Product type: 'rawMaterial'
   - Syncs supplier name to materials

## Usage Instructions

### Backend Setup
1. Ensure all models are created in `backend/model/`
2. Ensure controller is added to `backend/controller/index.js`
3. Routes are already added to `backend/routes/index.js`
4. Restart backend server

### Frontend Setup
1. Add routes to your routing configuration:
   ```javascript
   {
     path: '/raw-materials',
     component: RawMaterials
   },
   {
     path: '/raw-material-purchases',
     component: RawMaterialPurchases
   }
   ```

2. Add navigation links to your menu/sidebar

### Workflow
1. **Step 1:** Create suppliers first (if not already created)
2. **Step 2:** Add raw materials and link them to suppliers
3. **Step 3:** Create purchase orders from suppliers
4. **Step 4:** Mark purchases as Delivered to update stock
5. **Step 5:** Monitor low stock alerts

## Key Features

- **Supplier Integration:** Full supplier connection in both raw materials and purchases
- **Auto Stock Updates:** Stock quantities update automatically when purchases are delivered
- **Quality Tracking:** Quality check system for purchased materials
- **Low Stock Alerts:** Easy identification of materials below minimum stock
- **GST Calculation:** Automatic GST calculation (18% default)
- **Status Tracking:** Comprehensive status tracking for purchases and payments
- **Search & Filter:** Powerful search and filtering capabilities
- **Responsive UI:** Clean, modern interface with proper error handling

## Database Schema Changes

### New Collections
- `rawmaterials` - Stores raw material inventory
- `rawmaterialpurchases` - Stores purchase orders

### Modified Collections
- `suppliers` - Added 'rawMaterial' to productType enum

## API Examples

### Create Raw Material
```javascript
POST /raw-materials
{
  "name": "Steel Sheet",
  "code": "RM-001",
  "category": "Metal",
  "subCategory": "Stainless Steel",
  "unit": "kg",
  "quantity": 100,
  "minimumStock": 50,
  "unitPrice": 150,
  "supplierId": "supplier_id_here",
  "supplier": "Supplier Name",
  "location": "Warehouse A"
}
```

### Create Purchase Order
```javascript
POST /raw-material-purchases
{
  "supplierId": "supplier_id_here",
  "supplier": "Supplier Name",
  "purchaseDate": "2024-01-15",
  "expectedDelivery": "2024-01-20",
  "items": [
    {
      "rawMaterialId": "material_id_here",
      "quantity": 50,
      "unitPrice": 150
    }
  ],
  "paymentTerms": "Net 30"
}
```

### Update Purchase Status (Delivered)
```javascript
PUT /raw-material-purchases/:id
{
  "status": "Delivered"
}
```

This will automatically:
- Update raw material quantities
- Set lastPurchaseDate
- Set lastPurchasePrice
- Maintain supplier connection

## Notes
- All IDs are auto-generated with prefixes (RM for materials, RMP for purchases)
- Status is auto-calculated based on quantity vs minimum stock
- Total prices are auto-calculated
- GST is calculated at 18% by default
- Supplier connections are maintained throughout the system
- Quality checks can be tracked per item in purchases
