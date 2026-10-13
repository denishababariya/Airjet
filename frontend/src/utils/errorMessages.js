/** User-facing messages for common authentication, network, and server errors. */
export const ERROR_MAP = {
  'invalid token': 'Your session has expired. Please log in again.',
  'authentication required': 'You need to log in to access this page.',
  'user not found': 'No account found with that email address.',
  'duplicate key': 'A record with this information already exists.',
  'already exists': 'A record with this information already exists.',
  'validation failed': 'Some required fields are missing or invalid. Please check your input.',
  'econnrefused': 'Unable to connect to the server. Please check your internet connection.',
  'network error': 'Unable to connect to the server. Please check your internet connection.',
  'timeout': 'The request took too long. Please try again.',
  'unauthorized': 'You are not authorised to perform this action.',
  'forbidden': 'You do not have permission to access this resource.',
  'not found': 'The requested item could not be found.',
  'internal server error': 'Something went wrong on the server. Please try again later.',
};

const firstMessage = (value) => {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(firstMessage).filter(Boolean).join(' ');
  if (value && typeof value === 'object') {
    if (typeof value.message === 'string') return value.message.trim();
    if (typeof value.msg === 'string') return value.msg.trim();
    return Object.entries(value)
      .map(([field, message]) => {
        const detail = firstMessage(message);
        return detail ? `${field.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}: ${detail}` : '';
      })
      .filter(Boolean)
      .join(' ');
  }
  return '';
};

const extractRawMessage = (err) => {
  const data = err?.response?.data;
  return firstMessage(
    err?.displayMessage || data?.error || data?.message || data?.errors ||
    data?.details || data?.validationErrors || err?.message || '',
  );
};

/** Extract and present an API error without replacing useful server validation details. */
export function getErrorMessage(err, fallback) {
  let raw = extractRawMessage(err);
  // Mongoose validation errors include useful field details after this prefix.
  const validationDetails = raw.match(/validation failed:\s*(.+)/i);
  if (validationDetails?.[1]) {
    raw = validationDetails[1]
      .replace(/Path `([^`]+)` is required\.?/gi, '$1 is required.')
      .replace(/Path `([^`]+)` ([^.]+)\./gi, '$1 $2.')
      .replace(/`([^`]+)`/g, '$1');
  }
  const lower = raw.toLowerCase();

  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (key === 'validation failed' && validationDetails?.[1]) continue;
    if (lower.includes(key)) return friendly;
  }

  const status = err?.response?.status;
  // Do not expose database/stack details from unexpected server failures.
  if (status >= 500) return fallback || 'Something went wrong on the server. Please try again later.';

  // A client's validation message (usually a 400 or 409 response) gives the
  // user the actionable reason the request was rejected.
  if (raw && !/^(request failed with status code|error:\s*|exception:)/i.test(raw)) {
    return raw;
  }

  if (status === 400 || status === 422) {
    return 'Please check the required fields and correct any invalid values.';
  }
  if (status === 409) return 'A record with this information already exists.';
  if (!err?.response && (err?.code === 'ERR_NETWORK' || lower.includes('network'))) {
    return ERROR_MAP['network error'];
  }
  return fallback || 'Something went wrong. Please try again.';
}
