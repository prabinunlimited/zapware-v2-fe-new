import React from "react";
import { FieldArray } from "formik";
import FormField from "../FormFields/FormField";
import SelectField from "../FormFields/SelectField";
import Select from "react-select";

// ----------------------------------------------------------------------
// 1. Sub-Component: OwnerItem
// ----------------------------------------------------------------------
const OwnerItem = ({
  owner,
  index,
  isFirstOwner,
  isOwnerYes,
  isUSOwner,
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  setFieldValue,
  onRemove,
  onOwnerIfChange,
  onOwnershipChange,
  countryOptions,
  nationalityOptions,
  genderOptions,
  roleOptions,
  idDocumentTypeOptions,
  countriesLoading,
  selectedCurrency,
  isNamedAccount,
  activeField,
  setActiveField,
  isFieldMandatory,
}) => {
  const formatOptionLabel = (option) => {
    const flagUrl = option.flag || option.flag_url || option.originalData?.flag_url;
    const phoneCode = option.phoneCode || option.phone_code || "";
    const countryCode = option.country_code || option.countryCode || "";
    const countryName = option.label || option.name || "";

    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2">
          {flagUrl && flagUrl.startsWith("http") ? (
            <img
              src={flagUrl}
              alt={`${countryName} flag`}
              className="w-6 h-4 object-cover rounded"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <span className="text-base">🏳️</span>
          )}
          <span className="font-medium text-gray-900 text-sm">{countryName}</span>
          {countryCode && <span className="text-gray-500 text-xs">({countryCode})</span>}
        </div>
        <span className="text-gray-500 text-sm font-medium bg-gray-100 px-2 py-1 rounded">
          {phoneCode}
        </span>
      </div>
    );
  };

  const filterOption = (option, inputValue) => {
    const searchTerm = inputValue.toLowerCase();
    const countryName = (option.label || "").toLowerCase();
    const countryCode = (option.country_code || option.countryCode || "").toLowerCase();
    const phoneCode = (option.phoneCode || option.phone_code || "").toLowerCase();

    return (
      countryName.includes(searchTerm) ||
      countryCode.includes(searchTerm) ||
      phoneCode.includes(searchTerm) ||
      `+${phoneCode}`.includes(searchTerm)
    );
  };

  const isMandatory = (fieldKey) => {
    if (typeof isFieldMandatory !== "function") return false;
    return isFieldMandatory(fieldKey, values, owner);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-blue-600">Owner {index + 1}</h3>
        {values.owner_details.length > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            <i className="fas fa-trash mr-1"></i> Remove Owner
          </button>
        )}
      </div>

      {/* "Are you the owner?" Dropdown */}
      {isFirstOwner && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="relative">
            <select
              id="owner_if"
              name={`owner_details[${index}].owner_if`}
              className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              onChange={(e) => onOwnerIfChange(e.target.value)}
              value={owner.owner_if || ""}
            >
              <option value="">Are you the owner?</option>
              <option value="yes">Yes, I am the owner</option>
              <option value="no">No, I am not the owner</option>
            </select>
            <label
              htmlFor="owner_if"
              className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 left-3 z-0 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:bg-white peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2"
            >
              Are you the owner? <span className="text-red-500">*</span>
            </label>
          </div>
          {touched.owner_details?.[index]?.owner_if && errors.owner_details?.[index]?.owner_if && (
            <div className="text-red-500 text-xs mt-2">
              {errors.owner_details?.[index]?.owner_if}
            </div>
          )}
          {isOwnerYes && (
            <p className="text-green-600 text-sm mt-2">
              ✓ Primary contact details auto-filled. You can edit any field if required.
            </p>
          )}
        </div>
      )}

      {/* Owner Type & Owner Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <SelectField
            id={`owner_details[${index}].owner_type`}
            label="Owner Type"
            options={[
              { value: "individual", label: "Individual" },
              { value: "institution", label: "Institution" },
            ]}
            onChange={(option) => {
              const newOwners = [...values.owner_details];
              newOwners[index] = {
                ...newOwners[index],
                owner_type: option?.value || "",
              };
              setFieldValue("owner_details", newOwners);
            }}
            value={
              [
                { value: "individual", label: "Individual" },
                { value: "institution", label: "Institution" },
              ].find((opt) => opt.value === owner.owner_type) || null
            }
            touched={touched.owner_details?.[index]?.owner_type}
            error={errors.owner_details?.[index]?.owner_type}
            required={true}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Owner Role {isMandatory("owner_role_id") && <span className="text-red-500">*</span>}
          </label>
          <Select
            id={`owner_details[${index}].owner_role_id`}
            name={`owner_details[${index}].owner_role_id`}
            options={roleOptions}
            onChange={(option) => {
              const newOwners = [...values.owner_details];
              newOwners[index] = {
                ...newOwners[index],
                owner_role_id: option?.value || "",
              };
              setFieldValue("owner_details", newOwners);
            }}
            value={roleOptions?.find((opt) => opt.value === owner.owner_role_id) || null}
            placeholder="Select owner role..."
            isClearable={true}
            styles={{
              control: (base) => ({
                ...base,
                minHeight: "50px",
                borderColor:
                  touched.owner_details?.[index]?.owner_role_id &&
                  errors.owner_details?.[index]?.owner_role_id
                    ? "#ef4444"
                    : "#d1d5db",
                borderRadius: "0.5rem",
              }),
            }}
          />
          {touched.owner_details?.[index]?.owner_role_id &&
            errors.owner_details?.[index]?.owner_role_id && (
              <div className="text-red-500 text-xs mt-1">
                {errors.owner_details?.[index]?.owner_role_id}
              </div>
            )}
        </div>
      </div>

      {/* Ownership Percentage */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="number"
            id={`ownership_percentage_${index}`}
            name={`owner_details[${index}].ownership_percentage`}
            className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder=" "
            min="0"
            max="100"
            step="0.01"
            value={owner.ownership_percentage || ""}
            onChange={(e) => onOwnershipChange(e.target.value)}
          />
          <label
            htmlFor={`ownership_percentage_${index}`}
            className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 left-3 z-0 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:bg-white peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2"
          >
            Ownership Percentage {isMandatory("ownership_percentage") && <span className="text-red-500">*</span>}
          </label>
        </div>
        {touched.owner_details?.[index]?.ownership_percentage &&
          errors.owner_details?.[index]?.ownership_percentage && (
            <div className="text-red-500 text-xs mt-1">
              {errors.owner_details?.[index]?.ownership_percentage}
            </div>
          )}
      </div>

      {/* Primary Owner Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {owner.owner_type === "institution" ? (
          <div className="md:col-span-2">
            <FormField
              id={`owner_details[${index}].owner_name`}
              label="Institution Name"
              name={`owner_details[${index}].owner_name`}
              value={owner.owner_name || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={() => setActiveField(`owner_details[${index}].owner_name`)}
              touched={touched.owner_details?.[index]?.owner_name}
              error={errors.owner_details?.[index]?.owner_name}
              required={true}
              activeField={activeField}
            />
          </div>
        ) : (
          <>
            <FormField
              id={`owner_details[${index}].owner_first_name`}
              label="First Name"
              name={`owner_details[${index}].owner_first_name`}
              value={owner.owner_first_name || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={() => setActiveField(`owner_details[${index}].owner_first_name`)}
              touched={touched.owner_details?.[index]?.owner_first_name}
              error={errors.owner_details?.[index]?.owner_first_name}
              required={isMandatory("owner_first_name")}
              activeField={activeField}
            />

            <FormField
              id={`owner_details[${index}].owner_middle_name`}
              label="Middle Name (Optional)"
              name={`owner_details[${index}].owner_middle_name`}
              value={owner.owner_middle_name || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={() => setActiveField(`owner_details[${index}].owner_middle_name`)}
              touched={touched.owner_details?.[index]?.owner_middle_name}
              error={errors.owner_details?.[index]?.owner_middle_name}
              activeField={activeField}
            />

            <FormField
              id={`owner_details[${index}].owner_last_name`}
              label="Last Name"
              name={`owner_details[${index}].owner_last_name`}
              value={owner.owner_last_name || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={() => setActiveField(`owner_details[${index}].owner_last_name`)}
              touched={touched.owner_details?.[index]?.owner_last_name}
              error={errors.owner_details?.[index]?.owner_last_name}
              required={isMandatory("owner_last_name")}
              activeField={activeField}
            />

            {/* Owner Nationality */}
            <SelectField
              id={`owner_details[${index}].owner_nationality_id`}
              label="Nationality"
              options={nationalityOptions}
              onChange={(option) => {
                const newOwners = [...values.owner_details];
                newOwners[index] = {
                  ...newOwners[index],
                  owner_nationality_id: option?.value || "",
                };
                setFieldValue("owner_details", newOwners);
              }}
              value={nationalityOptions.find((opt) => opt.value === owner.owner_nationality_id)}
              touched={touched.owner_details?.[index]?.owner_nationality_id}
              error={errors.owner_details?.[index]?.owner_nationality_id}
              required={isMandatory("owner_nationality_id")}
            />
          </>
        )}

        {/* Resident Country & Gender (Row 1) */}
        <SelectField
          id={`owner_details[${index}].owner_resident_country_id`}
          label="Resident Country"
          options={countryOptions}
          onChange={(option) => {
            const newOwners = [...values.owner_details];
            newOwners[index] = {
              ...newOwners[index],
              owner_resident_country_id: option?.value || "",
            };
            setFieldValue("owner_details", newOwners);
          }}
          value={countryOptions.find(
            (opt) => opt.value === owner.owner_resident_country_id
          )}
          touched={touched.owner_details?.[index]?.owner_resident_country_id}
          error={errors.owner_details?.[index]?.owner_resident_country_id}
          required={isMandatory("owner_resident_country_id")}
          isLoading={countriesLoading}
        />

        {owner.owner_type !== "institution" ? (
          <SelectField
            id={`owner_details[${index}].owner_gender_id`}
            label="Gender"
            options={genderOptions}
            onChange={(option) => {
              const newOwners = [...values.owner_details];
              newOwners[index] = {
                ...newOwners[index],
                owner_gender_id: option?.value || "",
              };
              setFieldValue("owner_details", newOwners);
            }}
            value={genderOptions?.find((opt) => opt.value === owner.owner_gender_id)}
            touched={touched.owner_details?.[index]?.owner_gender_id}
            error={errors.owner_details?.[index]?.owner_gender_id}
            required={isMandatory("owner_gender_id")}
          />
        ) : (
          <div />
        )}

        {/* Address Country & Email (Row 2) */}
        <SelectField
          id={`owner_details[${index}].owner_country_id`}
          label="Country"
          options={countryOptions}
          onChange={(option) => {
            const newOwners = [...values.owner_details];
            newOwners[index] = {
              ...newOwners[index],
              owner_country_id: option?.value || "",
            };
            setFieldValue("owner_details", newOwners);
          }}
          value={countryOptions.find((opt) => opt.value === owner.owner_country_id)}
          touched={touched.owner_details?.[index]?.owner_country_id}
          error={errors.owner_details?.[index]?.owner_country_id}
          required={isMandatory("owner_country_id")}
          isLoading={countriesLoading}
        />

        <FormField
          id={`owner_details[${index}].owner_email`}
          label="Email"
          name={`owner_details[${index}].owner_email`}
          type="email"
          value={owner.owner_email || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setActiveField(`owner_details[${index}].owner_email`)}
          touched={touched.owner_details?.[index]?.owner_email}
          error={errors.owner_details?.[index]?.owner_email}
          required={isMandatory("owner_email")}
          activeField={activeField}
        />

        {/* Phone Number with Country Code */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number {isMandatory("owner_phone_number") && <span className="text-red-500">*</span>}
          </label>
          <div className="flex space-x-3">
            <div className="w-1/2 min-w-[180px]">
              <Select
                options={countryOptions}
                value={countryOptions.find(
                  (opt) =>
                    opt.phoneCode === owner.owner_phone_number_country_code ||
                    opt.phone_code === owner.owner_phone_number_country_code
                )}
                onChange={(option) => {
                  if (option) {
                    const updatedOwners = [...values.owner_details];
                    updatedOwners[index] = {
                      ...updatedOwners[index],
                      owner_phone_number_country_code: option.phoneCode || option.phone_code || "",
                    };
                    setFieldValue("owner_details", updatedOwners);
                  }
                }}
                onBlur={handleBlur}
                placeholder="Select Country Code"
                formatOptionLabel={formatOptionLabel}
                filterOption={filterOption}
                isSearchable
                isLoading={countriesLoading}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "50px",
                    borderColor: "#d1d5db",
                    borderRadius: "0.5rem",
                  }),
                }}
              />
            </div>
            <div className="w-1/2">
              <input
                type="tel"
                name={`owner_details[${index}].owner_phone_number`}
                value={owner.owner_phone_number || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 h-[50px]"
                placeholder="e.g., 1234567890"
              />
            </div>
          </div>
          {touched.owner_details?.[index]?.owner_phone_number &&
            errors.owner_details?.[index]?.owner_phone_number && (
              <div className="text-red-500 text-xs mt-1">
                {errors.owner_details?.[index]?.owner_phone_number}
              </div>
            )}
        </div>

        {/* State / Province */}
        <FormField
          id={`owner_details[${index}].owner_state`}
          label="State / Province"
          name={`owner_details[${index}].owner_state`}
          value={owner.owner_state || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setActiveField(`owner_details[${index}].owner_state`)}
          touched={touched.owner_details?.[index]?.owner_state}
          error={errors.owner_details?.[index]?.owner_state}
          required={isMandatory("owner_state")}
          activeField={activeField}
          placeholder="e.g., California / Bagmati"
        />

        {/* Apartment / Unit */}
        <FormField
          id={`owner_details[${index}].apartment_unit`}
          label="Apartment / Unit Number"
          name={`owner_details[${index}].apartment_unit`}
          value={owner.apartment_unit || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setActiveField(`owner_details[${index}].apartment_unit`)}
          touched={touched.owner_details?.[index]?.apartment_unit}
          error={errors.owner_details?.[index]?.apartment_unit}
          required={isMandatory("apartment_unit")}
          activeField={activeField}
          placeholder="e.g., Apt 4B, Unit 12"
        />

        {/* ZIP / Postal Code */}
        <FormField
          id={`owner_details[${index}].owner_zip_code`}
          label="ZIP / Postal Code"
          name={`owner_details[${index}].owner_zip_code`}
          value={owner.owner_zip_code || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setActiveField(`owner_details[${index}].owner_zip_code`)}
          touched={touched.owner_details?.[index]?.owner_zip_code}
          error={errors.owner_details?.[index]?.owner_zip_code}
          required={isMandatory("owner_zip_code")}
          activeField={activeField}
          placeholder="e.g., 90210"
        />

        {/* Date of Birth */}
        {owner.owner_type !== "institution" && (
          <FormField
            id={`owner_details[${index}].owner_dob`}
            label="Date of Birth"
            name={`owner_details[${index}].owner_dob`}
            type="date"
            value={owner.owner_dob || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setActiveField(`owner_details[${index}].owner_dob`)}
            touched={touched.owner_details?.[index]?.owner_dob}
            error={errors.owner_details?.[index]?.owner_dob}
            required={isMandatory("owner_dob")}
            activeField={activeField}
          />
        )}

        {/* Document Details */}
        <SelectField
          id={`owner_details[${index}].doc_country`}
          label="ID Issuing Country"
          options={countryOptions}
          onChange={(option) => {
            const newOwners = [...values.owner_details];
            newOwners[index] = {
              ...newOwners[index],
              doc_country: option?.value || "",
            };
            setFieldValue("owner_details", newOwners);
          }}
          value={countryOptions.find((opt) => opt.value === owner.doc_country)}
          touched={touched.owner_details?.[index]?.doc_country}
          error={errors.owner_details?.[index]?.doc_country}
          required={isMandatory("doc_country")}
          isLoading={countriesLoading}
        />

        <FormField
          id={`owner_details[${index}].doc_id`}
          label="Document ID"
          name={`owner_details[${index}].doc_id`}
          value={owner.doc_id || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          touched={touched.owner_details?.[index]?.doc_id}
          error={errors.owner_details?.[index]?.doc_id}
          required={isMandatory("doc_id")}
          placeholder="Enter document number"
        />

        {selectedCurrency === "USD" && isUSOwner && isNamedAccount && (
          <div className="md:col-span-2">
            <FormField
              id={`owner_details[${index}].ssn`}
              label="SSN"
              name={`owner_details[${index}].ssn`}
              value={owner.ssn || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                let formattedValue = value;
                if (value.length > 3)
                  formattedValue = `${value.substring(0, 3)}-${value.substring(3)}`;
                if (value.length > 5)
                  formattedValue = `${value.substring(0, 3)}-${value.substring(3, 5)}-${value.substring(5, 9)}`;
                const newOwners = [...values.owner_details];
                newOwners[index].ssn = formattedValue;
                setFieldValue("owner_details", newOwners);
              }}
              onBlur={handleBlur}
              touched={touched.owner_details?.[index]?.ssn}
              error={errors.owner_details?.[index]?.ssn}
              required={true}
              placeholder="XXX-XX-XXXX"
              maxLength={11}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 2. Main Parent Component
// ----------------------------------------------------------------------
const OwnerInfo = ({
  values,
  setFieldValue,
  handleChange,
  handleBlur,
  errors,
  touched,
  activeField,
  setActiveField,
  nationalityOptions,
  genderOptions,
  roleOptions,
  idDocumentTypeOptions,
  countryOptions,
  countriesLoading,
  ownerAdd,
  isNamedAccount,
  selectedCurrency,
  isFieldMandatory,
}) => {
  const handleOwnerIfChange = (index, value) => {
    const newOwners = [...values.owner_details];
    newOwners[index].owner_if = value;

    if (value === "yes") {
      newOwners[index] = {
        ...newOwners[index],
        owner_type: "individual",
        owner_first_name: values.first_name || "",
        owner_middle_name: values.middle_name || "",
        owner_last_name: values.last_name || "",
        owner_email: values.email || "",
        owner_dob: values.dob || "",
        owner_phone_number: values.mobile_number || "",
        owner_phone_number_country_code: values.mobilenumber_countrycode || "",
        owner_resident_country_id: values.resident_country || values.country || "",
        owner_country_id: values.country || "",
        owner_nationality_id: values.nationality || "",
        owner_gender_id: values.gender || "",
        owner_state: values.state || "",
        owner_zip_code: values.zip_code || "",
        apartment_unit: values.controllerHouseNumber || values.registered_business_address_apartment_unit_no || "",
        doc_country: values.doc_country || "",
        doc_id: values.doc_id || "",
        owner_role_id: "",
      };
    } else {
      newOwners[index] = {
        ...newOwners[index],
        owner_type: "",
        owner_first_name: "",
        owner_middle_name: "",
        owner_last_name: "",
        owner_email: "",
        owner_dob: "",
        owner_phone_number: "",
        owner_phone_number_country_code: "",
        owner_resident_country_id: "",
        owner_country_id: "",
        owner_nationality_id: "",
        owner_gender_id: "",
        owner_state: "",
        owner_zip_code: "",
        apartment_unit: "",
        doc_country: "",
        doc_id: "",
        owner_role_id: "",
      };
    }

    setFieldValue("owner_details", newOwners);
  };

  const handleOwnershipPercentageChange = (index, value) => {
    const newValue = parseFloat(value) || 0;
    const currentTotal = values.owner_details.reduce((total, o, i) => {
      if (i !== index) {
        return total + (parseFloat(o.ownership_percentage) || 0);
      }
      return total;
    }, 0);

    const newTotal = currentTotal + newValue;

    if (newTotal > 100) {
      const maxAllowed = 100 - currentTotal;
      const newOwners = [...values.owner_details];
      newOwners[index].ownership_percentage = maxAllowed;
      setFieldValue("owner_details", newOwners);
    } else {
      const newOwners = [...values.owner_details];
      newOwners[index].ownership_percentage = newValue;
      setFieldValue("owner_details", newOwners);
    }
  };

  const isOwnerFromUS = (owner) => {
    return owner.owner_country_id === "United States" || owner.owner_country_id === 186;
  };

  const calculateTotalOwnership = (ownerDetails) => {
    return ownerDetails.reduce((total, owner) => total + (parseFloat(owner.ownership_percentage) || 0), 0);
  };

  const handleAddOwner = () => {
    const newOwner = {
      id: Date.now(),
      owner_type: "",
      owner_role_id: "",
      owner_first_name: "",
      owner_middle_name: "",
      owner_last_name: "",
      owner_email: "",
      owner_phone_number: "",
      owner_phone_number_country_code: "",
      owner_resident_country_id: "",
      owner_country_id: "",
      owner_nationality_id: "",
      owner_gender_id: "",
      owner_state: "",
      owner_zip_code: "",
      apartment_unit: "",
      ownership_percentage: 0,
      owner_dob: "",
      ssn: "",
      doc_type: "",
      doc_id: "",
      doc_country: "",
      owner_if: "",
    };

    setFieldValue("owner_details", [...values.owner_details, newOwner]);
  };

  const handleRemoveOwner = (index) => {
    if (values.owner_details.length > 1) {
      setFieldValue(
        "owner_details",
        values.owner_details.filter((_, i) => i !== index)
      );
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Owner Details</h2>

      <FieldArray name="owner_details">
        {() => {
          const currentTotalOwnership = calculateTotalOwnership(values.owner_details);

          return (
            <div className="space-y-6">
              {values.owner_details.map((owner, index) => {
                const isUSOwner = isOwnerFromUS(owner);
                const isFirstOwner = index === 0;
                const isOwnerYes = owner.owner_if === "yes";

                return (
                  <OwnerItem
                    key={index}
                    index={index}
                    owner={owner}
                    isFirstOwner={isFirstOwner}
                    isOwnerYes={isOwnerYes}
                    isUSOwner={isUSOwner}
                    values={values}
                    errors={errors}
                    touched={touched}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    setFieldValue={setFieldValue}
                    countryOptions={countryOptions}
                    nationalityOptions={nationalityOptions}
                    genderOptions={genderOptions}
                    roleOptions={roleOptions}
                    idDocumentTypeOptions={idDocumentTypeOptions}
                    countriesLoading={countriesLoading}
                    selectedCurrency={selectedCurrency}
                    isNamedAccount={isNamedAccount}
                    activeField={activeField}
                    setActiveField={setActiveField}
                    isFieldMandatory={isFieldMandatory}
                    onRemove={() => handleRemoveOwner(index)}
                    onOwnerIfChange={(val) => handleOwnerIfChange(index, val)}
                    onOwnershipChange={(val) => handleOwnershipPercentageChange(index, val)}
                  />
                );
              })}

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleAddOwner}
                  disabled={!ownerAdd || calculateTotalOwnership(values.owner_details) >= 100}
                  className="w-full md:w-auto py-3 px-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-plus mr-2"></i>
                  {values.owner_details.length === 0 ? "Add Owner" : "Add Another Owner"}
                </button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Total Ownership:</span>
                  <span
                    className={`text-lg font-bold ${
                      Math.abs(currentTotalOwnership - 100) < 0.01 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {currentTotalOwnership.toFixed(2)}%
                  </span>
                </div>

                {Math.abs(currentTotalOwnership - 100) > 0.01 ? (
                  <div className="space-y-2">
                    <p className="text-red-600 text-sm">❌ Total ownership must equal exactly 100%</p>
                    <p className="text-red-600 text-sm">
                      Current difference: {(100 - currentTotalOwnership).toFixed(2)}%
                    </p>
                  </div>
                ) : (
                  <p className="text-green-600 text-sm">
                    ✅ Ownership percentages are correctly balanced
                  </p>
                )}
              </div>
            </div>
          );
        }}
      </FieldArray>
    </>
  );
};

export default OwnerInfo;