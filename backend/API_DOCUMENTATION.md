# Airjet Machinery ERP System - API Documentation

## Overview
This backend API provides role-based access control for the Airjet Machinery ERP system with features for stock management, income tracking, spare parts management, customer management, and employee password generation.

## Authentication
All protected routes require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Role Hierarchy
- **Admin** (Level 4) - Full access to all features
- **Manager** (Level 3) - Can manage stock, income, spare parts, customers
- **Head** (Level 2) - Can create and view stock, income, spare parts, customers
- **HR** (Level 1) - Can generate passwords for employees
- **User** (Level 0) - Read-only access

---

## Authentication Endpoints

### Login
**POST** `/api/users/login`

Request Body:
```json
{
  "email": "employee@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "role": "Admin",
    "employee": { ... }
  }
}
```

### Check Role for Password Reset
**POST** `/api/users/check-role`

Request Body:
```json
{
  "email": "employee@example.com"
}
```

### Verify OTP
**POST** `/api/users/verify-otp`

Request Body:
```json
{
  "email": "employee@example.com",
  "otp": "123456"
}
```

---

## Stock Management Endpoints

### Create Stock Item
**POST** `/api/stock`  
**Auth Required**: Admin, Manager, Head  
**Headers**: `Authorization: Bearer <token>`

Request Body:
```json
{
  "id": "STK001",
  "itemName": "Industrial Pump",
  "itemCode": "IP-001",
  "category": "Machinery",
  "quantity": 50,
  "unit": "pieces",
  "unitPrice": 5000,
  "location": "Warehouse A",
  "supplier": "ABC Suppliers",
  "minimumStock": 10,
  "description": "Heavy duty industrial pump"
}
```

### Get All Stock Items
**GET** `/api/stock`  
**Auth Required**: All authenticated users

### Get Low Stock Items
**GET** `/api/stock/low-stock`  
**Auth Required**: All authenticated users

### Get Stock Item by ID
**GET** `/api/stock/:id`  
**Auth Required**: All authenticated users

### Update Stock Item
**PUT** `/api/stock/:id`  
**Auth Required**: Admin, Manager, Head

### Delete Stock Item
**DELETE** `/api/stock/:id`  
**Auth Required**: Admin only

### Update Stock Quantity
**PATCH** `/api/stock/:id/quantity`  
**Auth Required**: Admin, Manager, Head

Request Body:
```json
{
  "quantity": 10,
  "operation": "add"
}
```

---

## Income Management Endpoints

### Create Income Record
**POST** `/api/income`  
**Auth Required**: Admin, Manager, Head

Request Body:
```json
{
  "id": "INC001",
  "incomeType": "Sales",
  "amount": 50000,
  "date": "2024-01-15",
  "description": "Machinery sale",
  "customerId": "customer-id",
  "invoiceNumber": "INV-001",
  "paymentMethod": "Bank Transfer",
  "paymentStatus": "Completed",
  "taxAmount": 5000,
  "discountAmount": 2000
}
```

### Get All Income Records
**GET** `/api/income`  
**Auth Required**: All authenticated users

Query Parameters:
- `startDate` - Filter by start date
- `endDate` - Filter by end date
- `incomeType` - Filter by income type

### Get Total Income Summary
**GET** `/api/income/total`  
**Auth Required**: All authenticated users

### Get Income by Type
**GET** `/api/income/by-type`  
**Auth Required**: All authenticated users

### Get Income Record by ID
**GET** `/api/income/:id`  
**Auth Required**: All authenticated users

### Update Income Record
**PUT** `/api/income/:id`  
**Auth Required**: Admin, Manager

### Delete Income Record
**DELETE** `/api/income/:id`  
**Auth Required**: Admin only

---

## Spare Parts Management Endpoints

### Create Spare Part
**POST** `/api/spare-parts`  
**Auth Required**: Admin, Manager, Head

Request Body:
```json
{
  "id": "SP001",
  "partName": "Hydraulic Cylinder",
  "partNumber": "HC-123",
  "category": "Hydraulics",
  "brand": "BrandX",
  "model": "Model-A",
  "compatibility": ["Machine-1", "Machine-2"],
  "quantity": 25,
  "unitPrice": 3000,
  "sellingPrice": 4500,
  "supplier": "Parts Supplier",
  "location": "Shelf B",
  "minimumStock": 5,
  "warrantyPeriod": 12,
  "warrantyUnit": "Months"
}
```

### Get All Spare Parts
**GET** `/api/spare-parts`  
**Auth Required**: All authenticated users

Query Parameters:
- `category` - Filter by category
- `brand` - Filter by brand
- `status` - Filter by status

### Search Spare Parts
**GET** `/api/spare-parts/search`  
**Auth Required**: All authenticated users

Query Parameters:
- `query` - Search term for part name, number, brand, or category

### Get Low Stock Spare Parts
**GET** `/api/spare-parts/low-stock`  
**Auth Required**: All authenticated users

### Get Spare Part by ID
**GET** `/api/spare-parts/:id`  
**Auth Required**: All authenticated users

### Update Spare Part
**PUT** `/api/spare-parts/:id`  
**Auth Required**: Admin, Manager, Head

### Delete Spare Part
**DELETE** `/api/spare-parts/:id`  
**Auth Required**: Admin only

### Update Spare Part Quantity
**PATCH** `/api/spare-parts/:id/quantity`  
**Auth Required**: Admin, Manager, Head

Request Body:
```json
{
  "quantity": 5,
  "operation": "add"
}
```

---

## Customer Management Endpoints

### Create Customer
**POST** `/api/customers`  
**Auth Required**: Admin, Manager, Head

Request Body:
```json
{
  "id": "CUST001",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "companyName": "ABC Industries",
  "gstNumber": "27ABCDE1234F1Z5",
  "customerType": "Business",
  "creditLimit": 100000
}
```

### Get All Customers
**GET** `/api/customers`  
**Auth Required**: All authenticated users

Query Parameters:
- `status` - Filter by status (Active, Inactive, Blacklisted)
- `customerType` - Filter by customer type
- `city` - Filter by city

### Search Customers
**GET** `/api/customers/search`  
**Auth Required**: All authenticated users

Query Parameters:
- `query` - Search term for name, email, phone, or company

### Get Customer by ID
**GET** `/api/customers/:id`  
**Auth Required**: All authenticated users

### Update Customer
**PUT** `/api/customers/:id`  
**Auth Required**: Admin, Manager, Head

### Delete Customer
**DELETE** `/api/customers/:id`  
**Auth Required**: Admin only

### Update Customer Purchase
**PATCH** `/api/customers/:id/purchase`  
**Auth Required**: All authenticated users

Request Body:
```json
{
  "amount": 50000,
  "purchaseCount": 1
}
```

---

## HR & Password Management Endpoints

### Create User with Role
**POST** `/api/hr/users/create`  
**Auth Required**: Admin only

Request Body:
```json
{
  "employeeId": "employee-id",
  "role": "Manager"
}
```

Response includes generated password.

### Generate Password for Employee
**POST** `/api/hr/employees/:employeeId/generate-password`  
**Auth Required**: HR, Admin, Manager

Response:
```json
{
  "message": "Password generated successfully",
  "password": "generated-password-here",
  "employee": {
    "id": "employee-id",
    "name": "Employee Name",
    "email": "employee@example.com"
  },
  "user": {
    "id": "user-id",
    "role": "User"
  }
}
```

### Reset User Password
**POST** `/api/hr/users/:userId/reset-password`  
**Auth Required**: HR, Admin, Manager

Response:
```json
{
  "message": "Password reset successfully",
  "password": "new-generated-password",
  "user": {
    "id": "user-id",
    "role": "Manager",
    "employee": { ... }
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error message details"
}
```

---

## Environment Variables

Create a `.env` file in the backend directory:

```env
MONGODB_URI=mongodb://localhost:27017/airjet
JWT_SECRET=your-secret-key-here
PORT=5000
```

---

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env` file

3. Start the server:
```bash
npm run dev
```

4. Server will run on `http://localhost:5000`

---

## Notes

- All dates should be in ISO format (YYYY-MM-DD)
- Passwords are automatically hashed using bcrypt
- JWT tokens expire after 24 hours
- Stock and spare part statuses are automatically updated based on quantity
- OTP for password reset expires after 10 minutes
