/**
 * main.js
 * Form controller — wires up DOM events, validation, and submission.
 * Imports validator and submission modules as ES modules.
 */

import { validateForm } from './validator.js';
import { submitToSheet } from './submission.js';

// ── Field Registry ────────────────────────────────────────────────────────────
// All form field IDs and their corresponding formData keys.
const FIELDS = [
  { id: 'clubName',              key: 'clubName' },
  { id: 'presidentDesignation',  key: 'presidentDesignation' },
  { id: 'presidentFullName',     key: 'presidentFullName' },
  { id: 'presidentUSN',          key: 'presidentUSN' },
  { id: 'presidentPhone',        key: 'presidentPhone' },
  { id: 'presidentEmail',        key: 'presidentEmail' },
  { id: 'vpDesignation',         key: 'vpDesignation' },
  { id: 'vpFullName',            key: 'vpFullName' },
  { id: 'vpUSN',                 key: 'vpUSN' },
  { id: 'vpPhone',               key: 'vpPhone' },
  { id: 'vpEmail',               key: 'vpEmail' },
  { id: 'additionalDetails',     key: 'additionalDetails' },
];

// ── State ─────────────────────────────────────────────────────────────────────

/** In-memory form data object — updated on every field change */
let formData = buildEmptyFormData();

function buildEmptyFormData() {
  return {
    clubName:              '',
    presidentDesignation:  'President',
    presidentFullName:     '',
    presidentUSN:          '',
    presidentPhone:        '',
    presidentEmail:        '',
    vpDesignation:         'Vice President',
    vpFullName:            '',
    vpUSN:                 '',
    vpPhone:               '',
    vpEmail:               '',
    additionalDetails:     '',
  };
}

// ── DOM Helpers ───────────────────────────────────────────────────────────────

function getField(id) {
  return document.getElementById(id);
}

function getErrorSpan(id) {
  return document.getElementById(id + '-error');
}

function clearFieldError(id) {
  const el = getField(id);
  const span = getErrorSpan(id);
  if (el)   el.classList.remove('field-error');
  if (span) span.textContent = '';
}

function setFieldError(id, message) {
  const el = getField(id);
  const span = getErrorSpan(id);
  if (el)   el.classList.add('field-error');
  if (span) span.textContent = message;
}

// ── handleChange ─────────────────────────────────────────────────────────────

/**
 * Updates formData for the given field key and clears its error state.
 * @param {string} key   — formData key
 * @param {string} id    — DOM element id
 * @param {string} value — new field value
 */
function handleChange(key, id, value) {
  formData[key] = value;
  clearFieldError(id);
}

// ── showErrors ────────────────────────────────────────────────────────────────

/**
 * Renders validation errors onto the form fields.
 * @param {Object} errors — ValidationErrors object
 */
function showErrors(errors) {
  for (const field of FIELDS) {
    if (errors[field.key]) {
      setFieldError(field.id, errors[field.key]);
    }
  }
}

// ── scrollToFirstError ────────────────────────────────────────────────────────

/**
 * Smoothly scrolls to the first field that has an error (in DOM order).
 * @param {Object} errors — ValidationErrors object
 */
function scrollToFirstError(errors) {
  for (const field of FIELDS) {
    if (errors[field.key]) {
      const el = getField(field.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
        return;
      }
    }
  }
}

// ── resetForm ─────────────────────────────────────────────────────────────────

/**
 * Resets all form fields, errors, and in-memory state to their defaults.
 */
function resetForm() {
  formData = buildEmptyFormData();

  for (const field of FIELDS) {
    const el = getField(field.id);
    if (!el) continue;

    // Reset value
    if (el.tagName === 'SELECT') {
      el.selectedIndex = 0;
    } else {
      el.value = '';
    }

    clearFieldError(field.id);
  }

  // Reset char counter
  const charCount = document.getElementById('additionalDetails-count');
  if (charCount) charCount.textContent = '0 / 500';

  // Reset submit button
  setSubmitIdle();
}

// ── Submit Button State ───────────────────────────────────────────────────────

function setSubmitLoading() {
  const btn = document.getElementById('submitBtn');
  if (!btn) return;
  btn.disabled = true;
  btn.classList.add('loading');
  btn.classList.remove('success');
  btn.textContent = 'Submitting…';
}

function setSubmitIdle() {
  const btn = document.getElementById('submitBtn');
  if (!btn) return;
  btn.disabled = false;
  btn.classList.remove('loading', 'success');
  btn.textContent = 'Submit Registration';
}

function setSubmitSuccess() {
  const btn = document.getElementById('submitBtn');
  if (!btn) return;
  btn.disabled = true;
  btn.classList.remove('loading');
  btn.classList.add('success');
  btn.textContent = 'Submitted ✓';
}

// ── Banner Helpers ────────────────────────────────────────────────────────────

function showSuccessBanner(message) {
  const banner = document.getElementById('success-banner');
  const msg    = document.getElementById('success-message');
  const errBanner = document.getElementById('error-banner');

  if (errBanner) errBanner.hidden = true;
  if (msg)    msg.textContent = message;
  if (banner) {
    banner.hidden = false;
    banner.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function showErrorBanner(message) {
  const banner = document.getElementById('error-banner');
  const msg    = document.getElementById('error-message');
  const successBanner = document.getElementById('success-banner');

  if (successBanner) successBanner.hidden = true;
  if (msg)    msg.textContent = message;
  if (banner) {
    banner.hidden = false;
    banner.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function hideBanners() {
  const successBanner = document.getElementById('success-banner');
  const errorBanner   = document.getElementById('error-banner');
  if (successBanner) successBanner.hidden = true;
  if (errorBanner)   errorBanner.hidden   = true;
}

// ── handleSubmit ──────────────────────────────────────────────────────────────

/**
 * Handles form submission:
 *  1. Prevents default browser submit
 *  2. Validates all fields
 *  3. On error: shows inline errors and scrolls to first
 *  4. On valid: sends to SheetDB, shows success or error banner
 *
 * @param {Event} event
 */
async function handleSubmit(event) {
  event.preventDefault();

  // Clear any previous banners
  hideBanners();

  // Validate
  const errors = validateForm(formData);

  if (Object.keys(errors).length > 0) {
    showErrors(errors);
    scrollToFirstError(errors);
    return;
  }

  // Submit
  setSubmitLoading();

  const result = await submitToSheet(formData);

  if (result.success) {
    setSubmitSuccess();
    showSuccessBanner('Registration submitted successfully! We\'ll be in touch soon.');
    // Small delay so the user sees the success state before the form resets
    setTimeout(() => {
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1800);
  } else {
    setSubmitIdle();
    const message = result.error && result.error.includes('Network')
      ? 'Network error. Please check your connection and try again.'
      : 'Submission failed. Please try again.';
    showErrorBanner(message);
  }
}

// ── Initialisation ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registrationForm');
  if (!form) return;

  // Attach change listeners to all fields
  for (const field of FIELDS) {
    const el = getField(field.id);
    if (!el) continue;

    const eventType = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(eventType, (e) => {
      handleChange(field.key, field.id, e.target.value);
    });
  }

  // Character counter for additionalDetails
  const additionalEl   = getField('additionalDetails');
  const charCountEl    = document.getElementById('additionalDetails-count');
  if (additionalEl && charCountEl) {
    additionalEl.addEventListener('input', () => {
      const len = additionalEl.value.length;
      charCountEl.textContent = `${len} / 500`;
      charCountEl.style.color = len > 450 ? '#f87171' : '';
    });
  }

  // Wire up form submit
  form.addEventListener('submit', handleSubmit);
});
