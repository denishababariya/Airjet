/**
 * validators.js — Shared validation rules for all Airjet ERP forms
 *
 * Usage:
 *   import { V, validate } from '../utils/validators';
 *   const errors = validate({ name: V.name(form.name), phone: V.phone(form.phone) });
 */

/* ─── Individual rule functions ────────────────────────────────
   Each returns either '' (valid) or an error string.
─────────────────────────────────────────────────────────────── */

// Supports names in Indian and other languages while rejecting all digits/symbols.
const ONLY_LETTERS  = /^[\p{L}\p{M}\s\-'.]+$/u;
const ONLY_ALPHA_NUM = /^[A-Za-z0-9\s\-_./]+$/;
const AMOUNT_RE     = /^\d+(?:\.\d{1,2})?$/;
const EMAIL_RE      = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE      = /^\d{10}$/;
const GST_RE        = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const MONTH_RE      = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/i;
const PIN_RE        = /^\d{6}$/;

export const V = {

  /* Required plain text — no digit-only check */
  required: (val, label = 'This field') => {
    if (!val || !String(val).trim()) return `${label} is required`;
    return '';
  },

  /* Names: letters, spaces, hyphens, apostrophes, dots only */
  name: (val, label = 'Name', opts = {}) => {
    const s = String(val ?? '').trim();
    if (!s) return `${label} is required`;
    if (s.length < (opts.min ?? 2)) return `${label} must be at least ${opts.min ?? 2} characters`;
    if (s.length > (opts.max ?? 80)) return `${label} must not exceed ${opts.max ?? 80} characters`;
    if (!ONLY_LETTERS.test(s)) return `${label} must contain only letters, spaces, hyphens or apostrophes`;
    return '';
  },

  /* Title / designation / department — letters + digits allowed */
  title: (val, label = 'Title') => {
    const s = String(val || '').trim();
    if (!s) return `${label} is required`;
    if (s.length < 2) return `${label} must be at least 2 characters`;
    if (s.length > 80) return `${label} must not exceed 80 characters`;
    return '';
  },

  /* Company / supplier / customer name — letters, digits, &, -, . allowed */
  companyName: (val, label = 'Name') => {
    const s = String(val || '').trim();
    if (!s) return `${label} is required`;
    if (s.length < 3) return `${label} must be at least 3 characters`;
    if (s.length > 100) return `${label} must not exceed 100 characters`;
    return '';
  },

  /* Phone: exactly 10 digits */
  phone: (val, label = 'Phone number') => {
    const s = String(val || '').trim();
    if (!s) return `${label} is required`;
    if (!/^\d+$/.test(s)) return `${label} must contain only digits`;
    if (!PHONE_RE.test(s)) return `${label} must be exactly 10 digits`;
    return '';
  },

  /* Email */
  email: (val, label = 'Email', required = true) => {
    const s = String(val || '').trim();
    if (!s) return required ? `${label} is required` : '';
    if (!EMAIL_RE.test(s)) return `Invalid ${label.toLowerCase()} format`;
    return '';
  },

  /* GST — optional but if filled must be valid 15-char format */
  gst: (val, label = 'GST number') => {
    const s = String(val || '').trim().toUpperCase();
    if (!s) return '';
    if (s.length !== 15) return `${label} must be exactly 15 characters`;
    if (!GST_RE.test(s)) return `Invalid ${label} format (e.g. 24ABCDE1234F1Z5)`;
    return '';
  },

  /* Positive integer */
  positiveInt: (val, label = 'Value') => {
    const s = String(val || '').trim();
    if (!s) return `${label} is required`;
    if (!/^\d+$/.test(s) || parseInt(s) <= 0) return `${label} must be a positive whole number`;
    return '';
  },

  /* Non-negative integer (0 allowed) */
  nonNegInt: (val, label = 'Value') => {
    const s = String(val ?? '').trim();
    if (s === '') return `${label} is required`;
    if (!/^\d+$/.test(s)) return `${label} must be a whole number (no decimals)`;
    return '';
  },

  /* Positive amount / decimal */
  amount: (val, label = 'Amount', required = true) => {
    const s = String(val ?? '').replace(/[₹,\s]/g, '').trim();
    if (!s) return required ? `${label} is required` : '';
    if (!AMOUNT_RE.test(s)) return `${label} must contain only numbers and up to 2 decimal places`;
    return '';
  },

  /* Optional amount */
  optionalAmount: (val, label = 'Amount') => V.amount(val, label, false),

  /* Date string YYYY-MM-DD */
  date: (val, label = 'Date', required = true) => {
    const s = String(val || '').trim();
    if (!s) return required ? `${label} is required` : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${label} must be a valid date`;
    return '';
  },

  /* End date must be >= start date */
  dateRange: (from, to, fromLabel = 'From date', toLabel = 'To date') => {
    if (from && to && to < from) return `${toLabel} must be on or after ${fromLabel}`;
    return '';
  },

  /* GST period like "Jun 2026" */
  gstPeriod: (val) => {
    const s = String(val || '').trim();
    if (!s) return 'Period / month is required';
    if (!MONTH_RE.test(s)) return 'Period must be like "Jun 2026"';
    return '';
  },

  /* Reason / description — min length, no number-only check */
  reason: (val, label = 'Reason', min = 5) => {
    const s = String(val || '').trim();
    if (!s) return `${label} is required`;
    if (s.length < min) return `${label} must be at least ${min} characters`;
    return '';
  },

  /* Part name / item name — alphanumeric allowed */
  partName: (val, label = 'Part name') => {
    const s = String(val || '').trim();
    if (!s) return `${label} is required`;
    if (s.length < 2) return `${label} must be at least 2 characters`;
    if (s.length > 100) return `${label} must not exceed 100 characters`;
    return '';
  },

  /* Alphanumeric — letters, digits, spaces, common punctuation */
  alphaNum: (val, label = 'Field') => {
    const s = String(val || '').trim();
    if (!s) return `${label} is required`;
    if (!ONLY_ALPHA_NUM.test(s)) return `${label} must contain only letters, numbers or basic punctuation`;
    return '';
  },
};

/**
 * Collect all errors into one object.
 * Pass an object of { fieldName: errorString } — falsy strings are ignored.
 * Returns { fieldName: errorString } for all fields with errors.
 *
 * Example:
 *   const errors = validate({
 *     name:  V.name(form.name, 'Supplier Name'),
 *     phone: V.phone(form.phone),
 *     email: V.email(form.email, 'Email', false),
 *   });
 */
export const validate = (rules) =>
  Object.fromEntries(Object.entries(rules).filter(([, v]) => !!v));
