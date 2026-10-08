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
