/**
 * validator.test.js
 * Property-based and unit tests for the validation module.
 * Uses fast-check for property tests and vitest for assertions.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateForm, validatePersonFields, USN_PATTERN, PHONE_PATTERN } from '../js/validator.js';

// ── Arbitraries ───────────────────────────────────────────────────────────────

/** Generates a valid USN: exactly 10 uppercase alphanumeric chars */
const validUSN = fc.stringMatching(/^[A-Z0-9]{10}$/);

/** Generates a valid phone: exactly 10 digits */
const validPhone = fc.stringMatching(/^[0-9]{10}$/);

/** Generates a valid email */
const validEmail = fc.emailAddress();

/** Generates a non-empty string up to maxLen chars (no leading/trailing whitespace) */
const nonEmptyStr = (maxLen = 100) =>
  fc.string({ minLength: 1, maxLength: maxLen }).map(s => s.trim()).filter(s => s.length > 0);

/** Generates a complete valid FormData object */
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

// ── Property 1: Valid FormData passes validation ──────────────────────────────

describe('Property 1: Valid FormData passes validation', () => {
  it('validateForm returns {} for any fully valid FormData', () => {
    fc.assert(
      fc.property(validFormData, (data) => {
        const errors = validateForm(data);
        expect(Object.keys(errors)).toHaveLength(0);
      }),
      { numRuns: 200 }
    );
  });
});

// ── Property 2: Invalid FormData fails with errors per bad field ──────────────

describe('Property 2: Invalid FormData fails validation with errors for each bad field', () => {
  it('returns clubName error when it is empty', () => {
    fc.assert(
      fc.property(validFormData, (data) => {
        const invalid = { ...data, clubName: '' };
        const errors = validateForm(invalid);
        expect(errors).toHaveProperty('clubName');
      }),
      { numRuns: 100 }
    );
  });

  it('returns an error for presidentFullName when it is empty', () => {
    fc.assert(
      fc.property(validFormData, (data) => {
        const invalid = { ...data, presidentFullName: '' };
        const errors = validateForm(invalid);
        expect(errors).toHaveProperty('presidentFullName');
      }),
      { numRuns: 100 }
    );
  });

  it('returns an error for vpFullName when it is empty', () => {
    fc.assert(
      fc.property(validFormData, (data) => {
        const invalid = { ...data, vpFullName: '' };
        const errors = validateForm(invalid);
        expect(errors).toHaveProperty('vpFullName');
      }),
      { numRuns: 100 }
    );
  });

  it('returns an error for presidentUSN when it is invalid', () => {
    // Use strings that are clearly not valid USNs (wrong length)
    fc.assert(
      fc.property(
        validFormData,
        fc.oneof(
          fc.constant(''),
          fc.string({ minLength: 1, maxLength: 9 }),
          fc.string({ minLength: 11, maxLength: 20 })
        ).filter(s => !USN_PATTERN.test(s.toUpperCase())),
        (data, badUSN) => {
          const invalid = { ...data, presidentUSN: badUSN };
          const errors = validateForm(invalid);
          expect(errors).toHaveProperty('presidentUSN');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns an error for presidentPhone when it is invalid', () => {
    fc.assert(
      fc.property(
        validFormData,
        fc.oneof(
          fc.constant(''),
          fc.string({ minLength: 1, maxLength: 9 }),
          fc.string({ minLength: 11, maxLength: 20 })
        ).filter(s => !PHONE_PATTERN.test(s)),
        (data, badPhone) => {
          const invalid = { ...data, presidentPhone: badPhone };
          const errors = validateForm(invalid);
          expect(errors).toHaveProperty('presidentPhone');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 3: Validator does not mutate FormData ────────────────────────────

describe('Property 3: Validator does not mutate FormData', () => {
  it('validateForm does not mutate its input', () => {
    fc.assert(
      fc.property(validFormData, (data) => {
        const clone = JSON.parse(JSON.stringify(data));
        validateForm(data);
        expect(data).toEqual(clone);
      }),
      { numRuns: 200 }
    );
  });
});

// ── Property 4: USN pattern validation is exhaustive ─────────────────────────

describe('Property 4: USN pattern validation is exhaustive', () => {
  it('accepts a string as valid USN if and only if it matches /^[A-Z0-9]{10}$/', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 15 }), (s) => {
        const isValid = USN_PATTERN.test(s);
        const data = {
          collegeName: 'Test College',
          clubName: 'Test Club',
          presidentDesignation: 'President',
          presidentFullName: 'Test Person',
          presidentUSN: s,
          presidentPhone: '9876543210',
          presidentEmail: 'test@test.com',
          vpDesignation: 'Vice President',
          vpFullName: 'Test VP',
          vpUSN: '1RV21CS001',
          vpPhone: '9876543211',
          vpEmail: 'vp@test.com',
          additionalDetails: '',
        };
        const errors = validateForm(data);
        // Note: validator uppercases USN before testing, so we check against uppercased value
        const isValidAfterUppercase = USN_PATTERN.test(s.toUpperCase());
        if (isValidAfterUppercase) {
          expect(errors).not.toHaveProperty('presidentUSN');
        } else {
          expect(errors).toHaveProperty('presidentUSN');
        }
      }),
      { numRuns: 300 }
    );
  });
});

// ── Property 5: Phone pattern validation is exhaustive ────────────────────────

describe('Property 5: Phone pattern validation is exhaustive', () => {
  it('accepts a string as valid phone if and only if it matches /^[0-9]{10}$/', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 15 }), (s) => {
        const isValid = PHONE_PATTERN.test(s);
        const data = {
          collegeName: 'Test College',
          clubName: 'Test Club',
          presidentDesignation: 'President',
          presidentFullName: 'Test Person',
          presidentUSN: '1RV21CS001',
          presidentPhone: s,
          presidentEmail: 'test@test.com',
          vpDesignation: 'Vice President',
          vpFullName: 'Test VP',
          vpUSN: '1RV21CS002',
          vpPhone: '9876543211',
          vpEmail: 'vp@test.com',
          additionalDetails: '',
        };
        const errors = validateForm(data);
        if (isValid) {
          expect(errors).not.toHaveProperty('presidentPhone');
        } else {
          expect(errors).toHaveProperty('presidentPhone');
        }
      }),
      { numRuns: 300 }
    );
  });
});

// ── Unit Tests ────────────────────────────────────────────────────────────────

describe('Unit: validateForm — specific cases', () => {
  const validData = {
    clubName: 'IEEE Student Branch',
    presidentDesignation: 'President',
    presidentFullName: 'Arjun Sharma',
    presidentUSN: '1RV21CS042',
    presidentPhone: '9876543210',
    presidentEmail: 'arjun@rvce.edu.in',
    vpDesignation: 'Vice President',
    vpFullName: 'Priya Nair',
    vpUSN: '1RV21CS078',
    vpPhone: '9123456780',
    vpEmail: 'priya@rvce.edu.in',
    additionalDetails: '',
  };

  it('returns {} for a fully valid submission', () => {
    expect(validateForm(validData)).toEqual({});
  });

  it('returns clubName error when whitespace-only', () => {
    const errors = validateForm({ ...validData, clubName: '   ' });
    expect(errors.clubName).toBeTruthy();
  });

  it('accepts lowercase USN (validator uppercases before checking)', () => {
    const errors = validateForm({ ...validData, presidentUSN: '1rv21cs042' });
    expect(errors.presidentUSN).toBeUndefined();
  });

  it('returns presidentUSN error for too-short USN', () => {
    const errors = validateForm({ ...validData, presidentUSN: '1RV21CS' });
    expect(errors.presidentUSN).toBeTruthy();
  });

  it('returns presidentPhone error for non-numeric phone', () => {
    const errors = validateForm({ ...validData, presidentPhone: 'abcdefghij' });
    expect(errors.presidentPhone).toBeTruthy();
  });

  it('returns presidentEmail error for invalid email', () => {
    const errors = validateForm({ ...validData, presidentEmail: 'not-an-email' });
    expect(errors.presidentEmail).toBeTruthy();
  });

  it('returns additionalDetails error when over 500 chars', () => {
    const errors = validateForm({ ...validData, additionalDetails: 'x'.repeat(501) });
    expect(errors.additionalDetails).toBeTruthy();
  });

  it('accepts empty additionalDetails without error', () => {
    const errors = validateForm({ ...validData, additionalDetails: '' });
    expect(errors.additionalDetails).toBeUndefined();
  });
});
