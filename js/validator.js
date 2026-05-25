/**
 * validator.js
 * Client-side validation for the College Club Registration Form.
 * All functions are pure — they do NOT mutate their inputs.
 *
 * Works as both an ES module (for tests and modern browsers) and
 * exposes globals on window for the plain <script> tag fallback.
 */

// ── Validation Patterns ──────────────────────────────────────────────────────

/** Exactly 10 uppercase alphanumeric characters (e.g. 1RV21CS001) */
export const USN_PATTERN = /^[A-Z0-9]{10}$/;

/** Exactly 10 digits (Indian mobile number) */
export const PHONE_PATTERN = /^[0-9]{10}$/;

/** Simplified RFC 5322 email check */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if the value is a non-empty string after trimming.
 * @param {string} value
 * @returns {boolean}
 */
function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Returns true if the value is a valid email address.
 * @param {string} value
 * @returns {boolean}
 */
function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_PATTERN.test(value.trim());
}

// ── Core Validators ──────────────────────────────────────────────────────────

/**
 * Validates the fields for one person (President/POC or Vice President).
 * Returns a partial errors object — empty means all fields are valid.
 *
 * @param {'president'|'vp'} prefix
 * @param {Object} data  — the full FormData object (not mutated)
 * @returns {Object}     — partial ValidationErrors
 */
export function validatePersonFields(prefix, data) {
  const errors = {};

  const fullName = data[prefix + 'FullName'] || '';
  const usn      = data[prefix + 'USN']      || '';
  const phone    = data[prefix + 'Phone']    || '';
  const email    = data[prefix + 'Email']    || '';

  if (!isNonEmpty(fullName)) {
    errors[prefix + 'FullName'] = 'Full name is required';
  }

  // USN: test the uppercased value so users who type lowercase still pass
  if (!USN_PATTERN.test(usn.trim().toUpperCase())) {
    errors[prefix + 'USN'] = 'Enter a valid 10-character USN (e.g. 1RV21CS001)';
  }

  if (!PHONE_PATTERN.test(phone.trim())) {
    errors[prefix + 'Phone'] = 'Enter a valid 10-digit phone number';
  }

  if (!isValidEmail(email)) {
    errors[prefix + 'Email'] = 'Enter a valid email address';
  }

  return errors;
}

/**
 * Validates the entire form data object.
 * Returns a ValidationErrors object — empty `{}` means all fields are valid.
 *
 * @param {Object} data  — FormData object (not mutated)
 * @returns {Object}     — ValidationErrors (empty = valid)
 */
export function validateForm(data) {
  const errors = {};

  // Club name
  if (!isNonEmpty(data.clubName || '')) {
    errors.clubName = 'Club name is required';
  } else if ((data.clubName || '').trim().length > 100) {
    errors.clubName = 'Club name must be 100 characters or fewer';
  }

  // President / POC fields
  Object.assign(errors, validatePersonFields('president', data));

  // Vice President fields
  Object.assign(errors, validatePersonFields('vp', data));

  // Additional details (optional, but max 500 chars if provided)
  const additional = data.additionalDetails || '';
  if (additional.length > 500) {
    errors.additionalDetails = 'Additional details must be 500 characters or fewer';
  }

  return errors;
}

// ── Browser global fallback (when loaded as a plain <script>) ────────────────
// When loaded as type="module" in the browser, named exports are used directly.
// This block is a no-op in module environments.
if (typeof window !== 'undefined') {
  window.validateForm = validateForm;
  window.validatePersonFields = validatePersonFields;
}
