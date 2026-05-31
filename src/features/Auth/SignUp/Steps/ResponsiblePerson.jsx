import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faExclamationCircle, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { RingLoader } from "react-spinners";
import FormField from "../../Auth/SignUp/FormFields/FormField";
import PasswordField from "../../Auth/SignUp/FormFields/PasswordField";
import SelectField from "../../Auth/SignUp/FormFields/SelectField";

const ResponsiblePerson = ({
  values,
  setFieldValue,
  handleChange,
  handleBlur,
  errors,
  touched,
  activeField,
  setActiveField,
  genderOptions,
  nationalityOptions,
  showPassword,
  showConfirmPassword,
  passwordValidationRules,
  dispatch,
  // Email verification props
  emailVerification,
  isEmailVerified,
  showVerificationInput,
  isSendingCode,
  isVerifying,
  handleSendVerificationCode,
  handleVerifyEmailCode,
  handleVerificationCodeChange,
  handleResendCode,
  resetEmailVerification,
}) => {
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">
        Responsible Person Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          id="first_name"
          label="First Name"
          name="first_name"
          value={values.first_name}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setActiveField("first_name")}
          touched={touched.first_name}
          error={errors.first_name}
          required
          activeField={activeField}
        />

        <FormField
          id="last_name"
          label="Last Name"
          name="last_name"
          value={values.last_name}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setActiveField("last_name")}
          touched={touched.last_name}
          error={errors.last_name}
          required
          activeField={activeField}
        />

        {/* Email Field with Verification */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                id="email"
                name="email"
                type="email"
                value={values.email || ""}
                onChange={(e) => {
                  handleChange(e);
                  // Reset verification when email changes
                  if (isEmailVerified) {
                    resetEmailVerification();
                    setFieldValue("email_verified", false);
                  }
                }}
                onBlur={handleBlur}
                onFocus={() => setActiveField("email")}
                disabled={isEmailVerified}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 
                  ${isEmailVerified ? 'bg-green-50 border-green-300' : ''}
                  ${touched.email && errors.email && !isEmailVerified
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                  }`}
                placeholder="your.email@example.com"
              />
            </div>
            
            {/* Verify Button - Only show when not verified */}
            {!isEmailVerified && (
              <button
                type="button"
                onClick={() => handleSendVerificationCode(values.email, setFieldValue)}
                disabled={isSendingCode || !values.email || errors.email}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 whitespace-nowrap"
              >
                {isSendingCode ? (
                  <div className="flex items-center gap-2">
                    <RingLoader size={16} color="#ffffff" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  'Verify'
                )}
              </button>
            )}
            
            {/* Verified Badge - Show when verified instead of button */}
            {isEmailVerified && (
              <div className="px-4 py-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2 whitespace-nowrap">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                <span className="font-medium">Verified</span>
              </div>
            )}
          </div>
          
          {/* Email field error */}
          {touched.email && errors.email && !isEmailVerified && (
            <div className="text-red-500 text-xs mt-1 flex items-center">
              <FontAwesomeIcon icon={faInfoCircle} className="mr-1 w-3 h-3" />
              {errors.email}
            </div>
          )}
        </div>

        {/* Verification Code Input (shown after clicking Verify) */}
        {showVerificationInput && !isEmailVerified && (
          <div className="md:col-span-2 mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Verification Code
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={emailVerification?.verificationCode || ""}
                  onChange={handleVerificationCodeChange}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm text-center text-lg tracking-wider"
                />
              </div>
              <button
                type="button"
                onClick={() => handleVerifyEmailCode(values.email, setFieldValue)}
                disabled={isVerifying || !emailVerification?.verificationCode || emailVerification?.verificationCode?.length !== 6}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 whitespace-nowrap"
              >
                {isVerifying ? (
                  <div className="flex items-center gap-2">
                    <RingLoader size={16} color="#ffffff" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
            
            {/* Resend link */}
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => handleResendCode(values.email)}
                disabled={isSendingCode}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingCode ? 'Sending...' : "Didn't receive code? Resend"}
              </button>
            </div>
            
            {/* Error message */}
            {emailVerification?.error && (
              <p className="text-red-500 text-xs mt-3 flex items-center">
                <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
                {emailVerification.error}
              </p>
            )}
            
            {/* Success message */}
            {emailVerification?.success && !isEmailVerified && (
              <p className="text-green-600 text-xs mt-3 flex items-center">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                {emailVerification.success}
              </p>
            )}
          </div>
        )}

        <FormField
          id="designation"
          label="Designation"
          name="designation"
          value={values.designation}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setActiveField("designation")}
          touched={touched.designation}
          error={errors.designation}
          required
          activeField={activeField}
        />

        <PasswordField
          id="password"
          label="Password"
          name="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setActiveField("password")}
          touched={touched.password}
          error={errors.password}
          required
          activeField={activeField}
          visible={showPassword}
          onToggleVisibility={() => dispatch(togglePasswordVisibility())}
          validationRules={passwordValidationRules}
        />

        <PasswordField
          id="confirm_password"
          label="Confirm Password"
          name="confirm_password"
          value={values.confirm_password}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setActiveField("confirm_password")}
          touched={touched.confirm_password}
          error={errors.confirm_password}
          required
          activeField={activeField}
          visible={showConfirmPassword}
          onToggleVisibility={() => dispatch(toggleConfirmPasswordVisibility())}
        />

        <SelectField
          id="gender"
          label="Gender"
          options={genderOptions}
          onChange={(option) => setFieldValue("gender", option?.value)}
          value={genderOptions.find((opt) => opt.value === values.gender)}
          touched={touched.gender}
          error={errors.gender}
          required
        />

        <FormField
          id="dob"
          label="Date of Birth"
          name="dob"
          type="date"
          value={values.dob}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setActiveField("dob")}
          touched={touched.dob}
          error={errors.dob}
          required
          activeField={activeField}
        />

        <SelectField
          id="nationality"
          label="Nationality"
          options={nationalityOptions}
          onChange={(option) => setFieldValue("nationality", option?.value)}
          value={nationalityOptions.find(
            (opt) => opt.value === values.nationality
          )}
          touched={touched.nationality}
          error={errors.nationality}
          required
        />

        <SelectField
          id="resident_country"
          label="Country of Residence"
          options={nationalityOptions}
          onChange={(option) =>
            setFieldValue("resident_country", option?.value)
          }
          value={nationalityOptions.find(
            (opt) => opt.value === values.resident_country
          )}
          touched={touched.resident_country}
          error={errors.resident_country}
          required
        />

        {values.resident_country === "United States" && (
          <FormField
            id="ssn"
            label="SSN (Social Security Number)"
            name="ssn"
            value={values.ssn}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField("ssn")}
            touched={touched.ssn}
            error={errors.ssn}
            required={values.resident_country === "United States"}
            placeholder="XXX-XX-XXXX"
            activeField={activeField}
          />
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-medium mb-3">Address Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            id="street_address_1"
            label="Street Address"
            name="street_address_1"
            value={values.street_address_1}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField("street_address_1")}
            touched={touched.street_address_1}
            error={errors.street_address_1}
            required
            activeField={activeField}
          />

          <FormField
            id="street_address_2"
            label="Street Address 2 (Optional)"
            name="street_address_2"
            value={values.street_address_2}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField("street_address_2")}
            touched={touched.street_address_2}
            error={errors.street_address_2}
            activeField={activeField}
          />

          <FormField
            id="city"
            label="City"
            name="city"
            value={values.city}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField("city")}
            touched={touched.city}
            error={errors.city}
            required
            activeField={activeField}
          />

          <FormField
            id="state"
            label="State/Province"
            name="state"
            value={values.state}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField("state")}
            touched={touched.state}
            error={errors.state}
            required
            activeField={activeField}
          />

          <FormField
            id="zip_code"
            label="ZIP/Postal Code"
            name="zip_code"
            value={values.zip_code}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField("zip_code")}
            touched={touched.zip_code}
            error={errors.zip_code}
            required
            activeField={activeField}
          />

          <FormField
            id="country"
            label="Country"
            name="country"
            value={values.country}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField("country")}
            touched={touched.country}
            error={errors.country}
            required
            activeField={activeField}
          />
        </div>
      </div>
    </>
  );
};

export default ResponsiblePerson;