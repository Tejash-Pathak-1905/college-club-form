/**
 * submission.js
 * Handles mapping form data to Google Sheet columns and submitting via SheetDB.
 *
 * ⚠️  SETUP REQUIRED:
 * Replace 'YOUR_SHEETDB_ENDPOINT_HERE' below with your actual SheetDB API URL.
 * See README.md → "Step 2: Connect SheetDB" for instructions.
 */

// ── Configuration ─────────────────────────────────────────────────────────────

/**
 * Your SheetDB API endpoint URL.
 * Example: 'https://sheetdb.io/api/v1/abc123xyz'
 *
 * To get this URL:
 *  1. Sign up at https://sheetdb.io (free)
 *  2. Create a new API and connect your Google Sheet
 *  3. Copy the generated endpoint URL and paste it here
 */
export const SHEETDB_ENDPOINT = 'https://sheetdb.io/api/v1/qeeooq8x51mkd';

// ── Column Header Mapping ─────────────────────────────────────────────────────

/**
 * Maps a FormData object to a flat row object whose keys match the
 * Google Sheet column headers exactly.
 *
 * This is a pure function — it does NOT mutate the input.
 *
 * Google Sheet column headers (in order):
 *   College Name | Club Name |
 *   President Designation | President Full Name | President USN | President Phone | President Email |
 *   VP Designation | VP Full Name | VP USN | VP Phone | VP Email |
 *   Additional Details
 *
 * @param {Object} data — validated FormData object
 * @returns {Object}    — flat key-value object matching sheet column headers
 */
export function mapFormDataToSheetRow(data) {
  return {
    'Club Name':                (data.clubName             || '').trim(),
    'President Designation':    (data.presidentDesignation || '').trim(),
    'President Full Name':      (data.presidentFullName    || '').trim(),
    'President USN':            (data.presidentUSN         || '').trim().toUpperCase(),
    'President Phone':          (data.presidentPhone       || '').trim(),
    'President Email':          (data.presidentEmail       || '').trim(),
    'VP Designation':           (data.vpDesignation        || '').trim(),
    'VP Full Name':             (data.vpFullName           || '').trim(),
    'VP USN':                   (data.vpUSN                || '').trim().toUpperCase(),
    'VP Phone':                 (data.vpPhone              || '').trim(),
    'VP Email':                 (data.vpEmail              || '').trim(),
    'Additional Details':       (data.additionalDetails    || '').trim(),
  };
}

// ── Submission ────────────────────────────────────────────────────────────────

/**
 * Submits validated form data to the configured SheetDB endpoint.
 * Returns a SubmitResult — never throws.
 *
 * This function does NOT mutate the input data.
 *
 * @param {Object} data — validated FormData object
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function submitToSheet(data) {
  const payload = mapFormDataToSheetRow(data);

  try {
    const response = await fetch(SHEETDB_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: payload }),
    });

    if (response.ok) {
      return { success: true, error: null };
    }

    return {
      success: false,
      error: `Server returned ${response.status}. Please try again.`,
    };
  } catch (networkError) {
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
}

// ── Browser global fallback ───────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.mapFormDataToSheetRow = mapFormDataToSheetRow;
  window.submitToSheet = submitToSheet;
  window.SHEETDB_ENDPOINT = SHEETDB_ENDPOINT;
}
