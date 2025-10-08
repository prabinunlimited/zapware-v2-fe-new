import React from "react";
import FormField from "../../Auth/SignUp/FormFields/FormField";
import SelectField from "../../Auth/SignUp/FormFields/SelectField";

const BusinessInfo = ({
  values,
  setFieldValue,
  handleChange,
  handleBlur,
  errors,
  touched,
  activeField,
  setActiveField,
  showEINField,
  showNAICSField,
  showBusinessTypeField,
  showIndustryTypeField,
  naicsOptions,
  businessTypeOptions,
  industryTypeOptions,
}) => {
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Business Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          id="institution_name"
          label="Business Name"
          name="institution_name"
          value={values.institution_name}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setActiveField("institution_name")}
          touched={touched.institution_name}
          error={errors.institution_name}
          required
          activeField={activeField}
        />

        <FormField
          id="registration_number"
          label="Registration Number"
          name="registration_number"
          value={values.registration_number}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setActiveField("registration_number")}
          touched={touched.registration_number}
          error={errors.registration_number}
          required
          activeField={activeField}
        />

        {showEINField && (
          <FormField
            id="ein"
            label="EIN (Employer Identification Number)"
            name="ein"
            value={values.ein}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField("ein")}
            touched={touched.ein}
            error={errors.ein}
            required={showEINField}
            placeholder="XX-XXXXXXX"
            activeField={activeField}
          />
        )}

        {showNAICSField && (
          <SelectField
            id="naice_code"
            label="NAICS Code"
            options={naicsOptions}
            onChange={(option) => setFieldValue("naice_code", option?.value)}
            value={naicsOptions.find((opt) => opt.value === values.naice_code)}
            touched={touched.naice_code}
            error={errors.naice_code}
            required={showNAICSField}
          />
        )}

        {showBusinessTypeField && (
          <SelectField
            id="business_type"
            label="Business Type"
            options={businessTypeOptions}
            onChange={(option) => setFieldValue("business_type", option?.value)}
            value={businessTypeOptions.find(
              (opt) => opt.value === values.business_type
            )}
            touched={touched.business_type}
            error={errors.business_type}
            required={showBusinessTypeField}
          />
        )}

        {showIndustryTypeField && (
          <SelectField
            id="industry_type"
            label="Industry Type"
            options={industryTypeOptions}
            onChange={(option) => setFieldValue("industry_type", option?.value)}
            value={industryTypeOptions.find(
              (opt) => opt.value === values.industry_type
            )}
            touched={touched.industry_type}
            error={errors.industry_type}
            required={showIndustryTypeField}
          />
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-medium mb-3">Registered Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            id="registered_address_street_1"
            label="Street Address"
            name="registered_address_street_1"
            value={values.registered_address_street_1}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField("registered_address_street_1")}
            touched={touched.registered_address_street_1}
            error={errors.registered_address_street_1}
            required
            activeField={activeField}
          />

          <FormField
            id="registered_address_street_2"
            label="Street Address 2 (Optional)"
            name="registered_address_street_2"
            value={values.registered_address_street_2}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField("registered_address_street_2")}
            touched={touched.registered_address_street_2}
            error={errors.registered_address_street_2}
            activeField={activeField}
          />

          <FormField
            id="registered_address_street_city"
            label="City"
            name="registered_address_street_city"
            value={values.registered_address_street_city}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField("registered_address_street_city")}
            touched={touched.registered_address_street_city}
            error={errors.registered_address_street_city}
            required
            activeField={activeField}
          />

          <FormField
            id="registered_address_street_state"
            label="State/Province"
            name="registered_address_street_state"
            value={values.registered_address_street_state}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField("registered_address_street_state")}
            touched={touched.registered_address_street_state}
            error={errors.registered_address_street_state}
            required
            activeField={activeField}
          />

          <FormField
            id="registered_address_street_zip"
            label="ZIP/Postal Code"
            name="registered_address_street_zip"
            value={values.registered_address_street_zip}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField("registered_address_street_zip")}
            touched={touched.registered_address_street_zip}
            error={errors.registered_address_street_zip}
            required
            activeField={activeField}
          />

          <FormField
            id="registered_address_street_country"
            label="Country"
            name="registered_address_street_country"
            value={values.registered_address_street_country}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField("registered_address_street_country")}
            touched={touched.registered_address_street_country}
            error={errors.registered_address_street_country}
            required
            activeField={activeField}
          />
        </div>
      </div>

      <div className="mt-4">
        <FormField
          id="date_incorporation"
          label="Date of Incorporation"
          name="date_incorporation"
          type="date"
          value={values.date_incorporation}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setActiveField("date_incorporation")}
          touched={touched.date_incorporation}
          error={errors.date_incorporation}
          required
          activeField={activeField}
        />
      </div>
    </>
  );
};

export default BusinessInfo;
