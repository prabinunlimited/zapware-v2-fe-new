import React from "react";
import FormField from "../../Auth/SignUp/FormFields/FormField";
import SelectField from "../../Auth/SignUp/FormFields/SelectField";

const ContactInfo = ({
  values,
  setFieldValue,
  handleChange,
  handleBlur,
  errors,
  touched,
  activeField,
  setActiveField,
  showBusinessEmailField,
  showBusinessWebsiteField,
}) => {
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Contact Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {showBusinessEmailField && (
          <FormField
            id="business_email"
            label="Business Email"
            name="business_email"
            type="email"
            value={values.business_email}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField("business_email")}
            touched={touched.business_email}
            error={errors.business_email}
            required={showBusinessEmailField}
            activeField={activeField}
          />
        )}

        {showBusinessWebsiteField && (
          <FormField
            id="business_website"
            label="Business Website"
            name="business_website"
            type="url"
            value={values.business_website}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField("business_website")}
            touched={touched.business_website}
            error={errors.business_website}
            activeField={activeField}
          />
        )}

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <SelectField
              id="mobilenumber_countrycode"
              label="Country Code"
              options={[
                { value: "+1", label: "+1 (US)" },
                { value: "+44", label: "+44 (UK)" },
                { value: "+91", label: "+91 (India)" },
              ]}
              onChange={(option) =>
                setFieldValue("mobilenumber_countrycode", option?.value)
              }
              value={values.mobilenumber_countrycode}
              touched={touched.mobilenumber_countrycode}
              error={errors.mobilenumber_countrycode}
              required
            />
          </div>
          <div className="md:col-span-2">
            <FormField
              id="mobile_number"
              label="Mobile Number"
              name="mobile_number"
              value={values.mobile_number}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={() => setActiveField("mobile_number")}
              touched={touched.mobile_number}
              error={errors.mobile_number}
              required
              activeField={activeField}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactInfo;
