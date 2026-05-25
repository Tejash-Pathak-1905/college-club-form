/**
 * submission.test.js
 * Property-based and unit tests for the submission service.
 * Uses fast-check for property tests and vitest for assertions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { mapFormDataToSheetRow, submitToSheet } from '../js/submission.js';

// ── Arbitraries ───────────────────────────────────────────────────────────────

const validUSN   = fc.stringMatching(/^[A-Z0-9]{10}$/);
const validPhone = fc.stringMatching(/^[0-9]{10}$/);
const validEmail = fc.emailAddress();
const nonEmptyStr = (maxLen = 100) =>
  fc.string({ minLength: 1, maxLength: maxLen }).map(s => s.trim()).filter(s => s.length > 0);

const validFormData = fc.record({
  clubName:               nonEmptyStr(100),
  presidentDesignation:   fc.constantFrom('President', 'POC'),
  presidentFullName:      nonEmptyStr(100),
  presidentUSN:           validUSN,
  presidentPhone:         validPhone,
  presidentEmail:         validEmail,
  vpDesignation:          fc.constantFrom('Vice President', 'POC'),
  vpFullName:             nonEmptyStr(100),
  vpUSN:                  validUSN,
  vpPhone:                validPhone,
  vpEmail:                validEmail,
  additionalDetails:      fc.oneof(fc.constant(''), nonEmptyStr(500)),
});

/** All required sheet column header keys */
const REQUIRED_KEYS = [
  'Club Name',
  'President Designation',
  'President Full Name',
  'President USN',
  'President Phone',
  'President Email',
  'VP Designation',
  'VP Full Name',
  'VP USN',
  'VP Phone',
  'VP Email',
  'Additional Details',
];

// ── Property 6: mapFormDataToSheetRow is a pure function ─────────────────────

describe('Property 6: mapFormDataToSheetRow is a pure function', () => {
  it('returns deeply equal output for the same input called twice', () => {
    fc.assert(
      fc.property(validFormData, (data) => {
        const result1 = mapFormDataToSheetRow(data);
        const result2 = mapFormDataToSheetRow(data);
        expect(result1).toEqual(result2);
      }),
      { numRuns: 200 }
    );
  });

  it('does not mutate the input FormData', () => {
    fc.assert(
      fc.property(validFormData, (data) => {
        const clone = JSON.parse(JSON.stringify(data));
        mapFormDataToSheetRow(data);
        expect(data).toEqual(clone);
      }),
      { numRuns: 200 }
    );
  });
});

// ── Property 7: mapFormDataToSheetRow output contains all required keys ───────

describe('Property 7: mapFormDataToSheetRow output contains all required keys', () => {
  it('output contains a key for every required field', () => {
    fc.assert(
      fc.property(validFormData, (data) => {
        const row = mapFormDataToSheetRow(data);
        for (const key of REQUIRED_KEYS) {
          expect(row).toHaveProperty(key);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('Additional Details is empty string when additionalDetails is absent', () => {
    fc.assert(
      fc.property(validFormData, (data) => {
        const dataWithoutAdditional = { ...data, additionalDetails: '' };
        const row = mapFormDataToSheetRow(dataWithoutAdditional);
        expect(row['Additional Details']).toBe('');
      }),
      { numRuns: 100 }
    );
  });

  it('Additional Details is empty string when additionalDetails is undefined', () => {
    fc.assert(
      fc.property(validFormData, (data) => {
        const { additionalDetails: _removed, ...dataWithoutField } = data;
        const row = mapFormDataToSheetRow(dataWithoutField);
        expect(row['Additional Details']).toBe('');
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 8: submitToSheet does not mutate FormData ────────────────────────

describe('Property 8: SubmissionService does not mutate FormData', () => {
  beforeEach(() => {
    // Mock fetch to return a successful response
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('submitToSheet does not mutate its input', async () => {
    await fc.assert(
      fc.asyncProperty(validFormData, async (data) => {
        const clone = JSON.parse(JSON.stringify(data));
        await submitToSheet(data);
        expect(data).toEqual(clone);
      }),
      { numRuns: 50 }
    );
  });
});

// ── Unit Tests ────────────────────────────────────────────────────────────────

describe('Unit: mapFormDataToSheetRow', () => {
  const sampleData = {
    clubName: 'IEEE Student Branch',
    presidentDesignation: 'President',
    presidentFullName: 'Arjun Sharma',
    presidentUSN: '1rv21cs042',   // lowercase — should be uppercased in output
    presidentPhone: '9876543210',
    presidentEmail: 'arjun@rvce.edu.in',
    vpDesignation: 'Vice President',
    vpFullName: 'Priya Nair',
    vpUSN: '1rv21cs078',          // lowercase — should be uppercased in output
    vpPhone: '9123456780',
    vpEmail: 'priya@rvce.edu.in',
    additionalDetails: 'Meets every Friday',
  };

  it('maps all fields to correct column headers', () => {
    const row = mapFormDataToSheetRow(sampleData);
    expect(row['Club Name']).toBe('IEEE Student Branch');
    expect(row['President Designation']).toBe('President');
    expect(row['President Full Name']).toBe('Arjun Sharma');
    expect(row['President USN']).toBe('1RV21CS042');  // uppercased
    expect(row['President Phone']).toBe('9876543210');
    expect(row['President Email']).toBe('arjun@rvce.edu.in');
    expect(row['VP Designation']).toBe('Vice President');
    expect(row['VP Full Name']).toBe('Priya Nair');
    expect(row['VP USN']).toBe('1RV21CS078');          // uppercased
    expect(row['VP Phone']).toBe('9123456780');
    expect(row['VP Email']).toBe('priya@rvce.edu.in');
    expect(row['Additional Details']).toBe('Meets every Friday');
  });

  it('has exactly 12 keys', () => {
    const row = mapFormDataToSheetRow(sampleData);
    expect(Object.keys(row)).toHaveLength(12);
  });
});

describe('Unit: submitToSheet', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const validData = {
    clubName: 'Test Club',
    presidentDesignation: 'President',
    presidentFullName: 'Test Person',
    presidentUSN: '1RV21CS001',
    presidentPhone: '9876543210',
    presidentEmail: 'test@test.com',
    vpDesignation: 'Vice President',
    vpFullName: 'Test VP',
    vpUSN: '1RV21CS002',
    vpPhone: '9876543211',
    vpEmail: 'vp@test.com',
    additionalDetails: '',
  };

  it('returns { success: true } on HTTP 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    const result = await submitToSheet(validData);
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
  });

  it('returns { success: false } on HTTP 500', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const result = await submitToSheet(validData);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns { success: false } on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));
    const result = await submitToSheet(validData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('sends POST with correct Content-Type and JSON body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', mockFetch);

    await submitToSheet(validData);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(options.body);
    expect(body).toHaveProperty('data');
    expect(body.data['Club Name']).toBe('Test Club');
  });
});
