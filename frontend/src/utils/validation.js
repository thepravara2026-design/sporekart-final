/**
 * Strict Indian Address & Contact Validation Utilities
 * Enforces strict validation for Indian phone numbers, emails, PIN codes, city, state, and names.
 */

// Strict 10-digit Indian Mobile Number (Starts with 6, 7, 8, or 9; optional +91 or 0 prefix)
export const validateIndianPhone = (phone) => {
  if (!phone || !phone.trim()) {
    return 'Mobile phone number is required';
  }
  const cleaned = phone.trim().replace(/[\s\-()]/g, '');
  const mobile10 = cleaned.replace(/^(?:\+91|91|0)/, '');
  if (!/^[6-9]\d{9}$/.test(mobile10)) {
    return 'Enter a valid 10-digit Indian mobile number (must start with 6, 7, 8, or 9)';
  }
  return null;
};

// Strict RFC 5322 Email Validation
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return 'Email address is required';
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return 'Enter a valid email address (e.g. name@domain.com)';
  }
  return null;
};

// Strict 6-Digit Indian PIN Code Validation (Range 100000 to 999999)
export const validateIndianPincode = (pincode) => {
  if (!pincode || !pincode.trim()) {
    return 'Postal PIN code is required';
  }
  const cleanPin = pincode.trim();
  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return 'Enter a valid 6-digit Indian PIN code (100000-999999)';
  }
  return null;
};

// Strict City / District Validation (Letters, spaces, periods, hyphens only, min 2 chars)
export const validateCity = (city) => {
  if (!city || !city.trim()) {
    return 'City / District is required';
  }
  const cleanCity = city.trim();
  if (cleanCity.length < 2) {
    return 'City / District must be at least 2 characters long';
  }
  if (!/^[a-zA-Z\s.-]{2,50}$/.test(cleanCity)) {
    return 'City / District must contain only letters and spaces';
  }
  return null;
};

// Strict State Validation (Letters, spaces, periods, hyphens only, min 2 chars)
export const validateState = (state) => {
  if (!state || !state.trim()) {
    return 'State is required';
  }
  const cleanState = state.trim();
  if (cleanState.length < 2) {
    return 'State must be at least 2 characters long';
  }
  if (!/^[a-zA-Z\s.-]{2,50}$/.test(cleanState)) {
    return 'State must contain only letters and spaces';
  }
  return null;
};

// Strict Name Validation (Letters, spaces, periods, hyphens only, min 2 chars)
export const validateName = (name, fieldName = 'Full Name') => {
  if (!name || !name.trim()) {
    return `${fieldName} is required`;
  }
  const cleanName = name.trim();
  if (cleanName.length < 2) {
    return `${fieldName} must be at least 2 characters long`;
  }
  if (!/^[a-zA-Z\s.-]{2,60}$/.test(cleanName)) {
    return `${fieldName} must contain only letters and spaces`;
  }
  return null;
};

// Strict Address Line 1 Validation (Min 5 chars)
export const validateAddressLine1 = (line1) => {
  if (!line1 || !line1.trim()) {
    return 'Address Line 1 is required';
  }
  if (line1.trim().length < 5) {
    return 'Address Line 1 must be at least 5 characters long';
  }
  return null;
};

// Optional Alternative Phone Number Validation (If provided, must be valid 10-digit Indian mobile)
export const validateAlternatePhone = (alternatePhone, primaryPhone) => {
  if (!alternatePhone || !alternatePhone.trim()) {
    return null;
  }
  const cleanedAlt = alternatePhone.trim().replace(/[\s\-()]/g, '');
  const mobile10Alt = cleanedAlt.replace(/^(?:\+91|91|0)/, '');
  if (!/^[6-9]\d{9}$/.test(mobile10Alt)) {
    return 'Enter a valid 10-digit Indian mobile number for alternative contact';
  }
  if (primaryPhone) {
    const cleanedPri = primaryPhone.trim().replace(/[\s\-()]/g, '').replace(/^(?:\+91|91|0)/, '');
    if (mobile10Alt === cleanedPri) {
      return 'Alternative phone number should be different from your primary phone number';
    }
  }
  return null;
};

// Master Address Form Validator
export const validateAddressForm = (form, options = {}) => {
  const errors = {};

  const nameErr = validateName(form.recipientName || form.fullName, options.nameLabel || (form.recipientName ? 'Recipient Name' : 'Full Name'));
  if (nameErr) errors.recipientName = nameErr;

  const phoneErr = validateIndianPhone(form.phone);
  if (phoneErr) errors.phone = phoneErr;

  if (form.alternatePhone) {
    const altPhoneErr = validateAlternatePhone(form.alternatePhone, form.phone);
    if (altPhoneErr) errors.alternatePhone = altPhoneErr;
  }

  if (options.checkEmail && (form.email !== undefined || options.requireEmail)) {
    const emailErr = validateEmail(form.email);
    if (emailErr) errors.email = emailErr;
  }

  const line1Err = validateAddressLine1(form.line1);
  if (line1Err) errors.line1 = line1Err;

  const cityErr = validateCity(form.city);
  if (cityErr) errors.city = cityErr;

  const stateErr = validateState(form.state);
  if (stateErr) errors.state = stateErr;

  const pinErr = validateIndianPincode(form.pincode);
  if (pinErr) errors.pincode = pinErr;

  return errors;
};
