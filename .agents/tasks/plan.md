# Implementation Plan — Airjet ERP: User-Friendly Error Messages

## Goal
Replace every raw/technical error message shown to users in the frontend with clear, user-friendly English sentences. This covers the API interceptor, all catch blocks (toast.error / setError), and inline error spans across all pages and utility hooks.

---

## Architecture Decision
**Central errorMessages.js utility** — a single file (`src/utils/errorMessages.js`) exports:
- `ERROR_MAP`: an object mapping known raw server error substrings (lowercase) to friendly sentences.
- `getErrorMessage(err, fallback)`: a helper that extracts the raw message from an error object, tests it against `ERROR_MAP`, and returns the first matching friendly sentence, or `fallback`, or the default `'Something went wrong. Please try again.'`

**Why this approach:** The API interceptor already sets `error.displayMessage` from raw server text. A central map keeps friendly wording in one place; every catch block calls `getErrorMessage(err, 'context-specific fallback')` instead of duplicating logic. This is additive — the existing `error.displayMessage` chain in `api.js` is updated to run through the map, so pages that already use `err.displayMessage` immediately benefit without touching every file.

---

## Files to Create
| File | Purpose |
|------|---------|
| `src/utils/errorMessages.js` | ERROR_MAP + getErrorMessage() helper |

## Files to Modify

### Core utilities (depth 0 from src/utils/)
| File | What changes |
|------|-------------|
| `src/utils/api.js` | Interceptor: pass raw message through ERROR_MAP before setting `error.displayMessage` |
| `src/utils/useErpRecords.js` | Import & use `getErrorMessage` |
| `src/utils/useWarranties.js` | Import & use `getErrorMessage` |

### Context (import path: `../utils/errorMessages`)
| File | What changes |
|------|-------------|
| `src/context/SearchContext.js` | Use `getErrorMessage` |

### Pages at depth 1 — import `'../utils/errorMessages'`
| File | Error locations |
|------|----------------|
| `src/pages/Login.js` | catch block → setApiError |
| `src/pages/ForgotPassword.js` | 3 catch blocks → setApiError |
| `src/pages/ChangePassword.js` | catch block → setErrors |
| `src/pages/EmployeeMaster.js` | 3 catch blocks → setError + toast.error |
| `src/pages/Department.js` | 3 catch blocks → toast.error |
| `src/pages/Designation.js` | 3 catch blocks → toast.error |
| `src/pages/Attendance.js` | 2 catch blocks → setError |
| `src/pages/Profile.js` | 2 catch blocks → setError |
| `src/pages/Sales.js` | 5 catch blocks → toast.error |
| `src/pages/SpareParts.js` | 4 catch blocks → toast.error |
| `src/pages/Purchase.js` | 6 catch blocks → toast.error |
| `src/pages/Warehouse.js` | 6 catch blocks → toast.error |
| `src/pages/Reports.js` | 1 catch block → setError |
| `src/pages/Accounts.js` | 3 catch blocks → setError |
| `src/pages/RawMaterials.js` | 2 catch blocks → toast.error |
| `src/pages/RawMaterialPurchases.js` | 2 catch blocks → toast.error |
| `src/pages/RawMaterialReport.js` | 1 catch block → setError |
| `src/pages/QrScanner.js` | 1 catch block → setError |
| `src/pages/Settings.js` | 1 catch block → setPasswordErrors |

### Pages at depth 2 — import `'../../utils/errorMessages'`
| File | Error locations |
|------|----------------|
| `src/pages/accounts/GSTReports.js` | 3 catch blocks |
| `src/pages/attendance/AttendanceReport.js` | 1 API catch block |
| `src/pages/attendance/CheckInOut.js` | 1 catch block |
| `src/pages/attendance/EmployeeQRCode.js` | 2 API catch blocks |
| `src/pages/attendance/LeaveTracking.js` | 2 catch blocks |
| `src/pages/attendance/QRScanner.js` | 1 API catch block |
| `src/pages/attendance/TodayAttendance.js` | 1 catch block |
| `src/pages/payroll/SalaryEdit.js` | 1 catch block |
| `src/pages/payroll/SalaryGeneration.js` | 2-branch catch block |
| `src/pages/payroll/SalaryList.js` | 3 catch blocks |
| `src/pages/payroll/SalaryPayment.js` | 1 catch block |
| `src/pages/payroll/PayslipDownload.js` | 1 catch block |
| `src/pages/purchase/PurchaseOrders.js` | 3 catch blocks |
| `src/pages/sales/Customers.js` | 3 setError calls |
| `src/pages/sales/CustomerDetail.js` | 1 catch block |
| `src/pages/sales/Invoices.js` | 5 catch blocks |
| `src/pages/sales/Payments.js` | 3 catch blocks |
| `src/pages/sales/Quotations.js` | 4 catch blocks |
| `src/pages/sales/QuotationDetail.js` | 1 catch block |
| `src/pages/sales/SalesDashboard.js` | 1 catch block |
| `src/pages/sales/SalesOrders.js` | 6 catch blocks |
| `src/pages/sales/SalesReports.js` | 1 catch block |
| `src/pages/sales/SalesReturns.js` | 4 catch blocks |
| `src/pages/service/EngineerAssignment.js` | 2 catch blocks + 1 inline |
| `src/pages/service/EngineerVisit.js` | 2 catch blocks |
| `src/pages/service/ServiceReports.js` | 1 catch block |
| `src/pages/service/ServiceTickets.js` | 3 catch blocks |
| `src/pages/service/SparePartsRequired.js` | 2 catch blocks |

### Leave unchanged (already clear user messages)
- `src/pages/attendance/AttendanceReport.js` date validation setError calls
- `src/pages/attendance/QRScanner.js` cool-down message
- `src/pages/attendance/EmployeeQRCode.js` "Please select an employee" and popup message
- `src/pages/payroll/Allowances.js` and `Deductions.js` validation toasts
- `src/pages/payroll/SalaryEdit.js` allowance/deduction validation toasts
- `src/pages/Sales.js` "Please add at least one item"
- `src/pages/RawMaterials.js` "Please enter a valid quantity"

---

## Implementation Steps

- [ ] 1. Create `src/utils/errorMessages.js` with ERROR_MAP and getErrorMessage() helper.
      The file must export: `ERROR_MAP` (object) and `getErrorMessage(err, fallback)` (function).
      ERROR_MAP keys to cover (lowercase substrings): 'invalid token', 'authentication required', 'user not found', 'duplicate key', 'already exists', 'validation failed', 'network error', 'econnrefused', 'timeout', 'unauthorized', '401', 'forbidden', '403', 'not found', '404', 'internal server error', '500'.
      getErrorMessage logic: try `err.displayMessage`, then `err.response?.data?.error`, then `err.response?.data?.message`, then `err.message`; lowercase it; match first key in ERROR_MAP; return friendly value; else return `fallback || 'Something went wrong. Please try again.'`
      File: `src/utils/errorMessages.js`
      Verify: `npm run build -- --no-progress` exits 0

- [ ] 2. Update `src/utils/api.js` response interceptor to map raw messages through ERROR_MAP.
      Import `ERROR_MAP` from `./errorMessages` (or inline the mapping); after extracting the raw message, run it through the map before assigning `error.displayMessage`.
      Change fallback from `'Something went wrong'` to `'Something went wrong. Please try again.'`
      File: `src/utils/api.js`
      Verify: `npm run build -- --no-progress` exits 0

- [ ] 3. Update `src/utils/useErpRecords.js` and `src/utils/useWarranties.js` to use `getErrorMessage`.
      Import `getErrorMessage` from `'./errorMessages'`.
      Replace fallback strings with context-specific messages (see FEAT-002 steps B, C).
      Files: `src/utils/useErpRecords.js`, `src/utils/useWarranties.js`
      Verify: build passes

- [ ] 4. Update `src/context/SearchContext.js` to use `getErrorMessage`.
      Import path: `'../utils/errorMessages'`.
      File: `src/context/SearchContext.js`
      Verify: build passes

- [ ] 5. Update all pages at src/pages/ (depth-1) to use getErrorMessage.
      Process in this order: Login.js, ForgotPassword.js, ChangePassword.js, EmployeeMaster.js, Department.js, Designation.js, Attendance.js, Profile.js, Sales.js, SpareParts.js, Purchase.js, Warehouse.js, Reports.js, Accounts.js, RawMaterials.js, RawMaterialPurchases.js, RawMaterialReport.js, QrScanner.js, Settings.js.
      Each file: add `import { getErrorMessage } from '../utils/errorMessages';`, replace error fallbacks per the table above.
      Files: 19 files listed above under "Pages at depth 1"
      Verify: `npm run build -- --no-progress` exits 0

- [ ] 6. Update all pages at src/pages/subdirectory/ (depth-2) to use getErrorMessage.
      Process: accounts/, attendance/, payroll/, purchase/, sales/, service/ subdirectories.
      Each file: add `import { getErrorMessage } from '../../utils/errorMessages';`, replace error fallbacks.
      Files: 26 files listed above under "Pages at depth 2"
      Verify: `npm run build -- --no-progress` exits 0

---

## New errorMessages.js — Exact Content

```js
/**
 * errorMessages.js — Central friendly error message registry for Airjet ERP.
 *
 * getErrorMessage(err, fallback) extracts the raw message from an Axios/fetch
 * error, maps it to a friendly sentence via ERROR_MAP, and returns the fallback
 * (or a generic string) when no match is found.
 */

export const ERROR_MAP = {
  'invalid token':           'Your session has expired. Please log in again.',
  'authentication required': 'You need to log in to access this page.',
  'user not found':          'No account found with that email address.',
  'duplicate key':           'A record with this information already exists.',
  'already exists':          'A record with this information already exists.',
  'validation failed':       'Some required fields are missing or invalid. Please check your input.',
  'econnrefused':            'Unable to connect to the server. Please check your internet connection.',
  'network error':           'Unable to connect to the server. Please check your internet connection.',
  'timeout':                 'The request took too long. Please try again.',
  'unauthorized':            'You are not authorised to perform this action.',
  'forbidden':               'You do not have permission to access this resource.',
  'not found':               'The requested item could not be found.',
  'internal server error':   'Something went wrong on the server. Please try again later.',
};

/**
 * Extract the raw message from an error and return a user-friendly version.
 *
 * @param {Error|Object} err      - The caught error object.
 * @param {string}       fallback - Context-specific fallback shown when no map entry matches.
 * @returns {string}
 */
export function getErrorMessage(err, fallback) {
  const raw =
    err?.displayMessage ||
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    '';

  const lower = raw.toLowerCase();

  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (lower.includes(key)) return friendly;
  }

  return fallback || 'Something went wrong. Please try again.';
}
```

---

## Build Verification Command
```
cd d:\Hasti\Airjet\frontend && npm run build -- --no-progress
```
Expected: exit 0, no red "Failed to compile" lines.

---

## Import Path Quick Reference
| File location | Import statement |
|---------------|-----------------|
| `src/utils/*.js` | `import { getErrorMessage } from './errorMessages';` |
| `src/context/*.js` | `import { getErrorMessage } from '../utils/errorMessages';` |
| `src/pages/*.js` (depth 1) | `import { getErrorMessage } from '../utils/errorMessages';` |
| `src/pages/subdir/*.js` (depth 2) | `import { getErrorMessage } from '../../utils/errorMessages';` |
