import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Loader2, CheckCircle2, Building, AlertCircle } from 'lucide-react';
import {
  INDIAN_STATES,
  getCitiesForState,
  lookupPincode,
} from '../utils/indianLocations';

/**
 * FAANG-Grade Indian Address Form Component
 * - Auto-fills City & State upon typing 6-digit PIN code.
 * - State dropdown dynamically populates City dropdown (spelling mismatch prevention).
 * - Rearranged fields for optimal ergonomic alignment and user experience.
 */
export default function IndianAddressForm({
  formData = {},
  onChange,
  errors = {},
  nameLabel = 'Recipient Name',
  namePlaceholder = 'e.g. Suresh Kumar',
  showEmail = false,
  emailRequired = false,
  showDefaultCheckbox = true,
  disabled = false,
  primaryPhoneImmutable = false,
  primaryEmailImmutable = false,
  onRequireLoginWithPhone,
}) {
  const [lookupState, setLookupState] = useState({ loading: false, successMessage: null });
  const [isCustomCity, setIsCustomCity] = useState(false);

  const availableCities = getCitiesForState(formData.state);

  // Sync custom city mode when props or available cities change
  useEffect(() => {
    if (formData.city && availableCities.length > 0) {
      const isKnownCity = availableCities.some(
        (c) => c.toLowerCase() === formData.city.toLowerCase()
      );
      if (!isKnownCity) {
        setIsCustomCity(true);
      } else {
        setIsCustomCity(false);
      }
    }
  }, [formData.state, formData.city]);

  // Handle PIN Code change & auto-lookup
  const handlePincodeChange = async (e) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 6);
    onChange({ ...formData, pincode: rawVal });

    if (rawVal.length === 6) {
      setLookupState({ loading: true, successMessage: null });
      const result = await lookupPincode(rawVal);
      setLookupState({ loading: false, successMessage: null });

      if (result.success) {
        const newState = result.state;
        const newCity = result.city;
        const stateCities = getCitiesForState(newState);

        // Check if city matches any in the dropdown list
        const matchedCityInDropdown = stateCities.find(
          (c) => c.toLowerCase() === newCity.toLowerCase()
        ) || (stateCities.length > 0 ? stateCities[0] : newCity);

        onChange({
          ...formData,
          pincode: rawVal,
          state: newState,
          city: matchedCityInDropdown,
        });

        setIsCustomCity(false);
        setLookupState({
          loading: false,
          successMessage: `Auto-filled: ${newState}, ${matchedCityInDropdown}`,
        });

        setTimeout(() => {
          setLookupState((prev) => ({ ...prev, successMessage: null }));
        }, 4000);
      }
    } else {
      setLookupState({ loading: false, successMessage: null });
    }
  };

  // Handle State selection change
  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    const citiesForNewState = getCitiesForState(selectedState);
    const defaultCity = citiesForNewState.length > 0 ? citiesForNewState[0] : '';

    setIsCustomCity(false);
    onChange({
      ...formData,
      state: selectedState,
      city: defaultCity,
    });
  };

  // Handle City dropdown or custom input change
  const handleCityChange = (e) => {
    const val = e.target.value;
    if (val === '__OTHER_CITY__') {
      setIsCustomCity(true);
      onChange({ ...formData, city: '' });
    } else {
      setIsCustomCity(false);
      onChange({ ...formData, city: val });
    }
  };

  const isAltPhoneConflict =
    errors.alternatePhone &&
    (errors.alternatePhone.includes('already registered') ||
      errors.alternatePhone.includes('registered to another'));

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* ROW 1: Name, Primary Phone (Immutable if registered), Alternative Phone & Optional Email */}
      <div className={`grid grid-cols-1 ${showEmail ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3`}>
        {/* Full / Recipient Name */}
        <div>
          <label className="block text-typography-primary mb-1 font-semibold">
            {nameLabel} <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            disabled={disabled}
            placeholder={namePlaceholder}
            value={formData.recipientName || formData.fullName || ''}
            onChange={(e) =>
              onChange({
                ...formData,
                recipientName: e.target.value,
                fullName: e.target.value,
              })
            }
            className={`w-full bg-surface-white border rounded-xl px-3.5 py-2.5 text-typography-primary text-xs focus:outline-none transition-all ${
              errors.recipientName || errors.fullName
                ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                : 'border-surface-border focus:border-forest-700 focus:ring-2 focus:ring-forest-700/10'
            }`}
          />
          {(errors.recipientName || errors.fullName) && (
            <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 inline" /> {errors.recipientName || errors.fullName}
            </p>
          )}
        </div>

        {/* Primary Phone Number (Immutable if registered) */}
        <div>
          <label className="block text-typography-primary mb-1 font-semibold flex items-center justify-between">
            <span>Primary Phone <span className="text-rose-500">*</span></span>
            {primaryPhoneImmutable && (
              <span className="text-[10px] text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded font-medium">
                🔒 Registered Primary
              </span>
            )}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-typography-muted font-medium text-xs">
              🇮🇳 +91
            </span>
            <input
              type="tel"
              required
              readOnly={primaryPhoneImmutable}
              disabled={disabled || primaryPhoneImmutable}
              placeholder="9876543210"
              maxLength={13}
              value={formData.phone || ''}
              onChange={(e) => onChange({ ...formData, phone: e.target.value })}
              className={`w-full border rounded-xl pl-16 pr-3.5 py-2.5 text-xs focus:outline-none transition-all font-mono ${
                primaryPhoneImmutable
                  ? 'bg-slate-100 text-slate-700 border-slate-300 font-bold cursor-not-allowed'
                  : errors.phone
                  ? 'bg-surface-white border-rose-500 bg-rose-50/20 focus:border-rose-600'
                  : 'bg-surface-white border-surface-border focus:border-forest-700 focus:ring-2 focus:ring-forest-700/10'
              }`}
            />
          </div>
          {errors.phone && (
            <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 inline" /> {errors.phone}
            </p>
          )}
        </div>

        {/* Alternative Phone Number (Contact for Secondary / Different Delivery Address) */}
        <div>
          <label className="block text-typography-primary mb-1 font-semibold flex items-center justify-between">
            <span>Alt Delivery Phone</span>
            <span className="text-[10px] text-typography-muted font-normal">
              {!formData.isDefault ? '(Delivery Contact)' : '(Optional)'}
            </span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-typography-muted font-medium text-xs">
              🇮🇳 +91
            </span>
            <input
              type="tel"
              disabled={disabled}
              placeholder={!formData.isDefault ? "Receiver mobile" : "Alternative mobile"}
              maxLength={13}
              value={formData.alternatePhone || ''}
              onChange={(e) => onChange({ ...formData, alternatePhone: e.target.value })}
              className={`w-full bg-surface-white border rounded-xl pl-16 pr-3.5 py-2.5 text-typography-primary text-xs focus:outline-none transition-all font-mono ${
                errors.alternatePhone
                  ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                  : !formData.isDefault && !formData.alternatePhone
                  ? 'border-blue-400 bg-blue-50/10 focus:border-forest-700'
                  : 'border-surface-border focus:border-forest-700 focus:ring-2 focus:ring-forest-700/10'
              }`}
            />
          </div>
          {errors.alternatePhone && (
            <div className="mt-1 space-y-1">
              <p className="text-[11px] text-rose-600 flex items-start gap-1">
                <AlertCircle className="w-3 h-3 inline shrink-0 mt-0.5" />
                <span>{errors.alternatePhone}</span>
              </p>
              {isAltPhoneConflict && onRequireLoginWithPhone && (
                <button
                  type="button"
                  onClick={() => onRequireLoginWithPhone(formData.alternatePhone)}
                  className="text-[11px] text-forest-700 font-bold hover:underline flex items-center gap-1 bg-amber-50 px-2 py-1 rounded border border-amber-200 w-full justify-center"
                >
                  🔑 Login with this phone number instead
                </button>
              )}
            </div>
          )}
        </div>

        {/* Email Address (if showEmail is true) */}
        {showEmail && (
          <div>
            <label className="block text-typography-primary mb-1 font-semibold flex items-center justify-between">
              <span>Email Address {emailRequired && <span className="text-rose-500">*</span>}</span>
              {primaryEmailImmutable && (
                <span className="text-[10px] text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded font-medium">
                  🔒 Registered Email
                </span>
              )}
            </label>
            <input
              type="email"
              required={emailRequired}
              readOnly={primaryEmailImmutable}
              disabled={disabled || primaryEmailImmutable}
              placeholder="e.g. suresh@example.com"
              value={formData.email || ''}
              onChange={(e) => onChange({ ...formData, email: e.target.value })}
              className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-all ${
                primaryEmailImmutable
                  ? 'bg-slate-100 text-slate-700 border-slate-300 font-bold cursor-not-allowed'
                  : errors.email
                  ? 'bg-surface-white border-rose-500 bg-rose-50/20 focus:border-rose-600'
                  : 'bg-surface-white border-surface-border focus:border-forest-700 focus:ring-2 focus:ring-forest-700/10'
              }`}
            />
            {errors.email && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 inline" /> {errors.email}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Non-Primary Delivery Site Callout Banner */}
      {!formData.isDefault && (
        <div className="p-3 bg-blue-50/70 border border-blue-200/90 rounded-2xl space-y-1.5 animate-fade-in shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
              🚚 Secondary / Non-Primary Delivery Site Contact
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
              Different Address Delivery
            </span>
          </div>
          <p className="text-[11px] text-blue-900/80 leading-relaxed">
            Since this product is being delivered to a different (non-primary) address, the <strong className="text-blue-950">Alt Delivery Phone</strong> will be used as the receiver's contact for this shipment and courier tracking.
          </p>
        </div>
      )}

      {/* ROW 2: Smart Location Engine (PIN Code -> State -> City Dropdowns) */}
      <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/70 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-forest-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            Location &amp; Delivery Region
          </span>
          {lookupState.loading && (
            <span className="text-[11px] text-forest-700 flex items-center gap-1 font-medium animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" /> Auto-detecting state &amp; city...
            </span>
          )}
          {lookupState.successMessage && (
            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-md animate-fade-in">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {lookupState.successMessage}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* PIN Code */}
          <div>
            <label className="block text-typography-primary mb-1 font-semibold">
              PIN Code <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                disabled={disabled}
                maxLength={6}
                placeholder="e.g. 560001"
                value={formData.pincode || ''}
                onChange={handlePincodeChange}
                className={`w-full bg-surface-white border rounded-xl px-3 py-2 text-typography-primary text-xs focus:outline-none font-mono tracking-wider transition-all ${
                  errors.pincode
                    ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                    : 'border-surface-border focus:border-forest-700 focus:ring-2 focus:ring-forest-700/10'
                }`}
              />
              <MapPin className="w-3.5 h-3.5 text-typography-muted absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            {errors.pincode && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 inline" /> {errors.pincode}
              </p>
            )}
          </div>

          {/* State Dropdown (All 28 States & 8 UTs) */}
          <div>
            <label className="block text-typography-primary mb-1 font-semibold">
              State <span className="text-rose-500">*</span>
            </label>
            <select
              required
              disabled={disabled}
              value={formData.state || ''}
              onChange={handleStateChange}
              className={`w-full bg-surface-white border rounded-xl px-3 py-2 text-typography-primary text-xs focus:outline-none transition-all cursor-pointer ${
                errors.state
                  ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                  : 'border-surface-border focus:border-forest-700 focus:ring-2 focus:ring-forest-700/10'
              }`}
            >
              <option value="">-- Select State --</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {errors.state && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 inline" /> {errors.state}
              </p>
            )}
          </div>

          {/* City / District Cascading Dropdown */}
          <div>
            <label className="block text-typography-primary mb-1 font-semibold">
              City / District <span className="text-rose-500">*</span>
            </label>

            {!isCustomCity && availableCities.length > 0 ? (
              <select
                required
                disabled={disabled || !formData.state}
                value={formData.city || ''}
                onChange={handleCityChange}
                className={`w-full bg-surface-white border rounded-xl px-3 py-2 text-typography-primary text-xs focus:outline-none transition-all cursor-pointer ${
                  errors.city
                    ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                    : 'border-surface-border focus:border-forest-700 focus:ring-2 focus:ring-forest-700/10'
                }`}
              >
                <option value="">-- Select City --</option>
                {availableCities.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
                <option value="__OTHER_CITY__">✏️ Other City (Type manually)</option>
              </select>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={disabled}
                  placeholder="Enter city or district name"
                  value={formData.city || ''}
                  onChange={(e) => onChange({ ...formData, city: e.target.value })}
                  className={`w-full bg-surface-white border rounded-xl px-3 py-2 text-typography-primary text-xs focus:outline-none transition-all ${
                    errors.city
                      ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                      : 'border-surface-border focus:border-forest-700 focus:ring-2 focus:ring-forest-700/10'
                  }`}
                />
                {availableCities.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCustomCity(false)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-forest-700 hover:underline bg-emerald-50 px-1.5 py-0.5 rounded"
                  >
                    Select List
                  </button>
                )}
              </div>
            )}
            {errors.city && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 inline" /> {errors.city}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ROW 3: Address Line 1 */}
      <div>
        <label className="block text-typography-primary mb-1 font-semibold">
          Address Line 1 (House/Plot No, Street, Building) <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          disabled={disabled}
          placeholder="e.g. Plot 12, Green Agro Farm, Main Road"
          value={formData.line1 || ''}
          onChange={(e) => onChange({ ...formData, line1: e.target.value })}
          className={`w-full bg-surface-white border rounded-xl px-3.5 py-2.5 text-typography-primary text-xs focus:outline-none transition-all ${
            errors.line1
              ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
              : 'border-surface-border focus:border-forest-700 focus:ring-2 focus:ring-forest-700/10'
          }`}
        />
        {errors.line1 && (
          <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 inline" /> {errors.line1}
          </p>
        )}
      </div>

      {/* ROW 4: Address Line 2 (Optional Landmark) */}
      <div>
        <label className="block text-typography-primary mb-1 font-semibold">
          Address Line 2 <span className="text-typography-muted font-normal">(Optional Landmark / Area)</span>
        </label>
        <input
          type="text"
          disabled={disabled}
          placeholder="e.g. Near Government School / Opposite Temple"
          value={formData.line2 || ''}
          onChange={(e) => onChange({ ...formData, line2: e.target.value })}
          className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary text-xs focus:outline-none focus:border-forest-700 focus:ring-2 focus:ring-forest-700/10 transition-all"
        />
      </div>

      {/* Default Checkbox (if enabled) */}
      {showDefaultCheckbox && (
        <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
          <input
            type="checkbox"
            disabled={disabled}
            checked={formData.isDefault || false}
            onChange={(e) => onChange({ ...formData, isDefault: e.target.checked })}
            className="rounded text-forest-700 focus:ring-forest-700/20 w-4 h-4 cursor-pointer"
          />
          <span className="text-typography-secondary font-medium text-xs">
            Set as default shipping address
          </span>
        </label>
      )}
    </div>
  );
}
