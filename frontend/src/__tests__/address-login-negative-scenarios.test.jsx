import { describe, it, expect } from 'vitest';
import {
  validateIndianPhone,
  validateEmail,
  validateIndianPincode,
  validateCity,
  validateState,
  validateName,
  validateAddressLine1,
  validateAddressForm,
} from '../utils/validation';

describe('Address & Login Validation — Negative Scenario Testing Suite', () => {

  // -------------------------------------------------------------
  // 1. RECIPIENT NAME / FULL NAME NEGATIVE SCENARIOS
  // -------------------------------------------------------------
  describe('Full Name / Recipient Name Field Validation', () => {
    it('should REJECT empty or whitespace-only name', () => {
      expect(validateName('')).toBe('Full Name is required');
      expect(validateName('   ')).toBe('Full Name is required');
    });

    it('should REJECT single character names', () => {
      expect(validateName('A')).toBe('Full Name must be at least 2 characters long');
    });

    it('should REJECT names containing digits or numbers', () => {
      expect(validateName('Suresh123')).toBe('Full Name must contain only letters and spaces');
      expect(validateName('Ramesh 99')).toBe('Full Name must contain only letters and spaces');
    });

    it('should REJECT names containing special characters or symbols', () => {
      expect(validateName('Ramesh@#$')).toBe('Full Name must contain only letters and spaces');
      expect(validateName('Suresh! Kumar')).toBe('Full Name must contain only letters and spaces');
    });

    it('should ACCEPT valid names with letters, spaces, dots, and hyphens', () => {
      expect(validateName('Suresh Kumar')).toBeNull();
      expect(validateName('R. K. Sharma')).toBeNull();
      expect(validateName('Anne-Marie')).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 2. INDIAN PHONE NUMBER NEGATIVE SCENARIOS
  // -------------------------------------------------------------
  describe('Indian Mobile Phone Number Field Validation', () => {
    it('should REJECT empty or blank phone number', () => {
      expect(validateIndianPhone('')).toBe('Mobile phone number is required');
      expect(validateIndianPhone('  ')).toBe('Mobile phone number is required');
    });

    it('should REJECT non-Indian 10-digit mobile numbers starting with 1, 2, 3, 4, or 5', () => {
      expect(validateIndianPhone('1234567890')).toContain('must start with 6, 7, 8, or 9');
      expect(validateIndianPhone('5876543210')).toContain('must start with 6, 7, 8, or 9');
      expect(validateIndianPhone('2987654321')).toContain('must start with 6, 7, 8, or 9');
    });

    it('should REJECT phone numbers with less than 10 digits', () => {
      expect(validateIndianPhone('987654321')).toContain('must start with 6, 7, 8, or 9');
      expect(validateIndianPhone('999')).toContain('must start with 6, 7, 8, or 9');
    });

    it('should REJECT phone numbers with more than 10 digits without prefix', () => {
      expect(validateIndianPhone('9876543210123')).toContain('must start with 6, 7, 8, or 9');
    });

    it('should REJECT phone numbers containing letters or symbols', () => {
      expect(validateIndianPhone('987654321a')).toContain('must start with 6, 7, 8, or 9');
      expect(validateIndianPhone('phone12345')).toContain('must start with 6, 7, 8, or 9');
    });

    it('should ACCEPT valid 10-digit Indian numbers starting with 6, 7, 8, or 9 (with or without +91 / 0 prefix)', () => {
      expect(validateIndianPhone('9876543210')).toBeNull();
      expect(validateIndianPhone('+919876543210')).toBeNull();
      expect(validateIndianPhone('09876543210')).toBeNull();
      expect(validateIndianPhone('8123456789')).toBeNull();
      expect(validateIndianPhone('7012345678')).toBeNull();
      expect(validateIndianPhone('6301234567')).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 3. EMAIL ADDRESS NEGATIVE SCENARIOS
  // -------------------------------------------------------------
  describe('Email Address Field Validation', () => {
    it('should REJECT empty or blank email', () => {
      expect(validateEmail('')).toBe('Email address is required');
      expect(validateEmail('   ')).toBe('Email address is required');
    });

    it('should REJECT emails missing @ symbol', () => {
      expect(validateEmail('grower.domain.com')).toBe('Enter a valid email address (e.g. name@domain.com)');
    });

    it('should REJECT emails missing top-level domain extension', () => {
      expect(validateEmail('grower@domain')).toBe('Enter a valid email address (e.g. name@domain.com)');
    });

    it('should REJECT emails with multiple @ symbols', () => {
      expect(validateEmail('grower@@sporekart.in')).toBe('Enter a valid email address (e.g. name@domain.com)');
    });

    it('should REJECT emails containing spaces', () => {
      expect(validateEmail('grower name@sporekart.in')).toBe('Enter a valid email address (e.g. name@domain.com)');
    });

    it('should ACCEPT valid RFC 5322 emails', () => {
      expect(validateEmail('praveen.grower@sporekart.in')).toBeNull();
      expect(validateEmail('test.user+agro@gmail.com')).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 4. ADDRESS LINE 1 NEGATIVE SCENARIOS
  // -------------------------------------------------------------
  describe('Address Line 1 Field Validation', () => {
    it('should REJECT empty or whitespace-only address line 1', () => {
      expect(validateAddressLine1('')).toBe('Address Line 1 is required');
      expect(validateAddressLine1('    ')).toBe('Address Line 1 is required');
    });

    it('should REJECT address line 1 shorter than 5 characters', () => {
      expect(validateAddressLine1('Plot')).toBe('Address Line 1 must be at least 5 characters long');
      expect(validateAddressLine1('No 1')).toBe('Address Line 1 must be at least 5 characters long');
    });

    it('should ACCEPT valid address line 1 with 5 or more characters', () => {
      expect(validateAddressLine1('Plot 12, Green Agro Farm')).toBeNull();
      expect(validateAddressLine1('Door 45, Main St')).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 5. CITY / DISTRICT NEGATIVE SCENARIOS
  // -------------------------------------------------------------
  describe('City / District Field Validation', () => {
    it('should REJECT empty or whitespace-only city', () => {
      expect(validateCity('')).toBe('City / District is required');
      expect(validateCity('   ')).toBe('City / District is required');
    });

    it('should REJECT single character city names', () => {
      expect(validateCity('C')).toBe('City / District must be at least 2 characters long');
    });

    it('should REJECT city names containing numbers or digits', () => {
      expect(validateCity('City123')).toBe('City / District must contain only letters and spaces');
      expect(validateCity('Delhi 11')).toBe('City / District must contain only letters and spaces');
    });

    it('should REJECT city names with special symbols', () => {
      expect(validateCity('Bengaluru#1')).toBe('City / District must contain only letters and spaces');
    });

    it('should ACCEPT valid city names', () => {
      expect(validateCity('Davangere')).toBeNull();
      expect(validateCity('New Delhi')).toBeNull();
      expect(validateCity('Bengaluru')).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 6. STATE NEGATIVE SCENARIOS
  // -------------------------------------------------------------
  describe('State Field Validation', () => {
    it('should REJECT empty or whitespace-only state', () => {
      expect(validateState('')).toBe('State is required');
      expect(validateState('   ')).toBe('State is required');
    });

    it('should REJECT single character state names', () => {
      expect(validateState('K')).toBe('State must be at least 2 characters long');
    });

    it('should REJECT state names containing numbers or symbols', () => {
      expect(validateState('Karnataka99')).toBe('State must contain only letters and spaces');
      expect(validateState('Maharashtra!')).toBe('State must contain only letters and spaces');
    });

    it('should ACCEPT valid state names', () => {
      expect(validateState('Karnataka')).toBeNull();
      expect(validateState('Maharashtra')).toBeNull();
      expect(validateState('Tamil Nadu')).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 7. INDIAN POSTAL PIN CODE NEGATIVE SCENARIOS
  // -------------------------------------------------------------
  describe('Indian Postal PIN Code Field Validation', () => {
    it('should REJECT empty or whitespace-only PIN code', () => {
      expect(validateIndianPincode('')).toBe('Postal PIN code is required');
      expect(validateIndianPincode('   ')).toBe('Postal PIN code is required');
    });

    it('should REJECT PIN code starting with 0', () => {
      expect(validateIndianPincode('012345')).toBe('Enter a valid 6-digit Indian PIN code (100000-999999)');
    });

    it('should REJECT PIN codes with less than 6 digits', () => {
      expect(validateIndianPincode('57700')).toBe('Enter a valid 6-digit Indian PIN code (100000-999999)');
      expect(validateIndianPincode('123')).toBe('Enter a valid 6-digit Indian PIN code (100000-999999)');
    });

    it('should REJECT PIN codes with more than 6 digits', () => {
      expect(validateIndianPincode('5770011')).toBe('Enter a valid 6-digit Indian PIN code (100000-999999)');
    });

    it('should REJECT PIN codes containing letters or special characters', () => {
      expect(validateIndianPincode('57700a')).toBe('Enter a valid 6-digit Indian PIN code (100000-999999)');
      expect(validateIndianPincode('577-01')).toBe('Enter a valid 6-digit Indian PIN code (100000-999999)');
    });

    it('should ACCEPT valid 6-digit Indian PIN codes', () => {
      expect(validateIndianPincode('577001')).toBeNull();
      expect(validateIndianPincode('110001')).toBeNull();
      expect(validateIndianPincode('560001')).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 8. MASTER FORM VALIDATOR NEGATIVE COMBINATIONS
  // -------------------------------------------------------------
  describe('Master Address Form Validation Function', () => {
    it('should detect multiple invalid fields simultaneously in negative form submit', () => {
      const invalidForm = {
        recipientName: '123Invalid',
        phone: '12345',
        email: 'invalid-email',
        line1: 'Plot',
        city: 'City#99',
        state: 'S',
        pincode: '099999',
      };

      const errors = validateAddressForm(invalidForm, { checkEmail: true });
      expect(errors.recipientName).toBeDefined();
      expect(errors.phone).toBeDefined();
      expect(errors.email).toBeDefined();
      expect(errors.line1).toBeDefined();
      expect(errors.city).toBeDefined();
      expect(errors.state).toBeDefined();
      expect(errors.pincode).toBeDefined();
    });

    it('should return NO errors for completely valid form data', () => {
      const validForm = {
        recipientName: 'Praveen Kumar',
        phone: '9876543210',
        email: 'praveen@sporekart.in',
        line1: 'Plot 12, Green Agro Farm Road',
        city: 'Davangere',
        state: 'Karnataka',
        pincode: '577001',
      };

      const errors = validateAddressForm(validForm, { checkEmail: true });
      expect(Object.keys(errors).length).toBe(0);
    });

    it('should REJECT invalid alternative delivery phone format or matching primary phone', () => {
      const invalidAltForm = {
        recipientName: 'Praveen Kumar',
        phone: '9876543210',
        alternatePhone: '12345',
        line1: 'Plot 12, Green Agro Farm Road',
        city: 'Davangere',
        state: 'Karnataka',
        pincode: '577001',
      };
      const errors = validateAddressForm(invalidAltForm);
      expect(errors.alternatePhone).toContain('Enter a valid 10-digit Indian mobile number');

      const duplicateSamePhoneForm = {
        ...invalidAltForm,
        alternatePhone: '9876543210',
      };
      const dupErrors = validateAddressForm(duplicateSamePhoneForm);
      expect(dupErrors.alternatePhone).toContain('Alternative phone number should be different');
    });

    it('should ACCEPT valid fresh alternative phone number', () => {
      const validAltForm = {
        recipientName: 'Praveen Kumar',
        phone: '9876543210',
        alternatePhone: '8765432109',
        line1: 'Plot 12, Green Agro Farm Road',
        city: 'Davangere',
        state: 'Karnataka',
        pincode: '577001',
      };
      const errors = validateAddressForm(validAltForm);
      expect(errors.alternatePhone).toBeUndefined();
    });
  });
});
