import React from "react";
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

        <FormField
          id="email"
          label="Email Address"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setActiveField("email")}
          touched={touched.email}
          error={errors.email}
          required
          activeField={activeField}
        />

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
            value={values.stear_address_2}
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
