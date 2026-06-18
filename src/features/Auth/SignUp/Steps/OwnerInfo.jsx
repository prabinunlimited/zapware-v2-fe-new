import React from "react";
import { FieldArray } from "formik";
import FormField from "../FormFields/FormField";
import SelectField from "../FormFields/SelectField";
import Select from "react-select";
import { getIn } from "formik";

// ----------------------------------------------------------------------
// 1. New Sub-Component: OwnerItem
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
  roleOptions,
  idDocumentTypeOptions,
  countriesLoading,
  selectedCurrency,
  isNamedAccount,
  activeField,
  setActiveField,
}) => {
  const formatOptionLabel = (option) => {
    // Get the flag URL from various possible properties
    const flagUrl =
      option.flag || option.flag_url || option.originalData?.flag_url;

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
                // If image fails to load, show emoji fallback
                e.target.style.display = "none";
              }}
            />
          ) : (
            <span className="text-base">🏳️</span>
          )}
          <span className="font-medium text-gray-900 text-sm">
            {countryName}
          </span>
          {countryCode && (
            <span className="text-gray-500 text-xs">({countryCode})</span>
          )}
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
    const countryCode = (
      option.country_code ||
      option.countryCode ||
      ""
    ).toLowerCase();
    const phoneCode = (
      option.phoneCode ||
      option.phone_code ||
      ""
    ).toLowerCase();

    return (
      countryName.includes(searchTerm) ||
      countryCode.includes(searchTerm) ||
      phoneCode.includes(searchTerm) ||
      `+${phoneCode}`.includes(searchTerm)
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {/* Debug Info */}
      {/* {process.env.NODE_ENV === "development" && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
          <strong>Owner {index + 1} State:</strong>
          <div className="grid grid-cols-2 gap-1 mt-1">
            <span>
              owner_if: <code>{owner.owner_if || "empty"}</code>
            </span>
            <span>
              isOwnerYes: <code>{isOwnerYes.toString()}</code>
            </span>
            <span>
              isFirstOwner: <code>{isFirstOwner.toString()}</code>
            </span>
            <span>
              Fields Disabled:{" "}
              <code>{(isOwnerYes && isFirstOwner).toString()}</code>
            </span>
          </div>
        </div>
      )} */}

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

      {/* "Are you the owner?" Dropdown - Only for first owner */}
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
              {/* ✅ Ensure the default option has an empty value */}
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
          {touched.owner_details?.[index]?.owner_if &&
            errors.owner_details?.[index]?.owner_if && (
              <div className="text-red-500 text-xs mt-2">
                {errors.owner_details?.[index]?.owner_if}
              </div>
            )}
          {isOwnerYes && (
            <div>
              <p className="text-green-600 text-sm mt-2">
                ✓ Your information will be automatically filled as the owner.
              </p>
            </div>
          )}
        </div>
      )}

      {isOwnerYes && isFirstOwner && (
        <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="relative">
            <input
              type="text"
              id={`owner_details[${index}].owner_type`}
              name={`owner_details[${index}].owner_type`}
              className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              value="Individual"
              readOnly
              disabled
            />
            <label
              htmlFor={`owner_details[${index}].owner_type`}
              className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 left-3 z-0 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:bg-white peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2"
            >
              Owner Type <span className="text-red-500">*</span>
            </label>
          </div>
          <p className="text-green-600 text-sm mt-2">
            ✓ Owner type is automatically set to "Individual" for the primary
            owner
          </p>
        </div>
      )}

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
            Ownership Percentage <span className="text-red-500">*</span>
          </label>
        </div>
        {touched.owner_details?.[index]?.ownership_percentage &&
          errors.owner_details?.[index]?.ownership_percentage && (
            <div className="text-red-500 text-xs mt-1">
              {errors.owner_details?.[index]?.ownership_percentage}
            </div>
          )}
      </div>

      {/* ALL OWNER FIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          id={`owner_details[${index}].owner_first_name`}
          label="First Name"
          name={`owner_details[${index}].owner_first_name`}
          value={owner.owner_first_name || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() =>
            setActiveField(`owner_details[${index}].owner_first_name`)
          }
          touched={touched.owner_details?.[index]?.owner_first_name}
          error={errors.owner_details?.[index]?.owner_first_name}
          required
          activeField={activeField}
          disabled={isOwnerYes && isFirstOwner}
        />

        <FormField
          id={`owner_details[${index}].owner_middle_name`}
          label="Middle Name (Optional)"
          name={`owner_details[${index}].owner_middle_name`}
          value={owner.owner_middle_name || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() =>
            setActiveField(`owner_details[${index}].owner_middle_name`)
          }
          touched={touched.owner_details?.[index]?.owner_middle_name}
          error={errors.owner_details?.[index]?.owner_middle_name}
          activeField={activeField}
          disabled={isOwnerYes && isFirstOwner}
        />

        <FormField
          id={`owner_details[${index}].owner_last_name`}
          label="Last Name"
          name={`owner_details[${index}].owner_last_name`}
          value={owner.owner_last_name || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() =>
            setActiveField(`owner_details[${index}].owner_last_name`)
          }
          touched={touched.owner_details?.[index]?.owner_last_name}
          error={errors.owner_details?.[index]?.owner_last_name}
          required
          activeField={activeField}
          disabled={isOwnerYes && isFirstOwner}
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
          required
          activeField={activeField}
          disabled={isOwnerYes && isFirstOwner}
        />

        <SelectField
          id={`owner_details[${index}].owner_country_id`}
          label="Country"
          options={countryOptions}
          onChange={(option) => {
            setFieldValue(
              `owner_details[${index}].owner_country_id`,
              option?.value || ""
            );
          }}
          value={countryOptions.find(
            (opt) => opt.value === owner.owner_country_id
          )}
          touched={touched.owner_details?.[index]?.owner_country_id}
          error={errors.owner_details?.[index]?.owner_country_id}
          required
          isLoading={countriesLoading}
          disabled={isOwnerYes && isFirstOwner}
        />

        {/* Phone Number with Country Code */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
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
                      owner_phone_number_country_code:
                        option.phoneCode || option.phone_code || "",
                      owner_country_id: option.value, // Also set the country ID
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
                isDisabled={isOwnerYes && isFirstOwner}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "50px",
                    borderColor: "#d1d5db",
                    borderRadius: "0.5rem",
                    "&:hover": {
                      borderColor: "#9ca3af",
                    },
                  }),
                }}
              />
              {touched.owner_details?.[index]
                ?.owner_phone_number_country_code &&
                errors.owner_details?.[index]
                  ?.owner_phone_number_country_code && (
                  <div className="text-red-500 text-xs mt-1">
                    {
                      errors.owner_details?.[index]
                        ?.owner_phone_number_country_code
                    }
                  </div>
                )}
            </div>
            <div className="w-1/2">
              <input
                type="tel"
                name={`owner_details[${index}].owner_phone_number`}
                value={owner.owner_phone_number || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isOwnerYes && isFirstOwner}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 h-[50px] ${
                  isOwnerYes && isFirstOwner
                    ? "bg-gray-100 opacity-60 cursor-not-allowed"
                    : ""
                } ${
                  touched.owner_details?.[index]?.owner_phone_number &&
                  errors.owner_details?.[index]?.owner_phone_number
                    ? "border-red-500 focus:ring-red-500"
                    : ""
                }`}
                placeholder="e.g., 1234567890"
              />
              {touched.owner_details?.[index]?.owner_phone_number &&
                errors.owner_details?.[index]?.owner_phone_number && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.owner_details?.[index]?.owner_phone_number}
                  </div>
                )}
            </div>
          </div>
        </div>

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
          required
          activeField={activeField}
          disabled={isOwnerYes && isFirstOwner}
        />

        {selectedCurrency === "USD" && isUSOwner && isNamedAccount && (
          <>
            <FormField
              id={`owner_details[${index}].ssn`}
              label="SSN"
              name={`owner_details[${index}].ssn`}
              value={owner.ssn || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                let formattedValue = value;
                if (value.length > 3)
                  formattedValue = `${value.substring(0, 3)}-${value.substring(
                    3
                  )}`;
                if (value.length > 5)
                  formattedValue = `${value.substring(0, 3)}-${value.substring(
                    3,
                    5
                  )}-${value.substring(5, 9)}`;
                const newOwners = [...values.owner_details];
                newOwners[index].ssn = formattedValue;
                setFieldValue("owner_details", newOwners);
              }}
              onBlur={handleBlur}
              touched={touched.owner_details?.[index]?.ssn}
              error={errors.owner_details?.[index]?.ssn}
              required
              placeholder="XXX-XX-XXXX"
              maxLength={11}
              disabled={isOwnerYes && isFirstOwner}
            />

            <SelectField
              id={`owner_details[${index}].doc_type`}
              label="Document Type"
              options={idDocumentTypeOptions}
              onChange={(option) => {
                setFieldValue(
                  `owner_details[${index}].doc_type`,
                  option?.value
                );
                setFieldValue(`owner_details[${index}].doc_id`, "");
              }}
              value={idDocumentTypeOptions.find(
                (opt) => opt.value === owner.doc_type
              )}
              touched={touched.owner_details?.[index]?.doc_type}
              error={errors.owner_details?.[index]?.doc_type}
              required
              disabled={isOwnerYes && isFirstOwner}
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
              required
              disabled={isOwnerYes && isFirstOwner}
            />
          </>
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
  roleOptions,
  idDocumentTypeOptions,
  totalOwnershipPercentage,
  dispatch,
  countryOptions,
  countriesLoading,
  ownerAdd,
  isNamedAccount,
  countries,
  selectedCurrency,
}) => {
  React.useEffect(() => {
    
  }, [values, isNamedAccount, selectedCurrency]);

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
        owner_country_id: values.country || "",
        owner_needs_access_to_system: "",
        owner_role_id: "",
      };
    } else {
      // ✅ Handle "no" OR empty selection by clearing data
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
        owner_country_id: "",
        owner_needs_access_to_system: "",
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
    return owner.owner_country_id === "United States";
  };

  const calculateTotalOwnership = (ownerDetails) => {
    return ownerDetails.reduce(
      (total, owner) => total + (owner.ownership_percentage || 0),
      0
    );
  };

  const handleAddOwner = () => {
    const currentTotal = calculateTotalOwnership(values.owner_details);

    if (currentTotal < 100) {
      const newOwner = {
        id: Date.now(),
        owner_type: "",
        owner_first_name: "",
        owner_middle_name: "",
        owner_last_name: "",
        owner_email: "",
        owner_phone_number: "",
        owner_phone_number_country_code: "",
        owner_country_id: "",
        ownership_percentage: 0,
        owner_dob: "",
        ssn: "",
        doc_type: "",
        doc_id: "",
        doc_country: "",
        doc_state: "",
        owner_if: "", // ✅ Updated: Initialize as empty string (forced choice) instead of "no"
        owner_needs_access_to_system: "",
        owner_role_id: "",
      };

      const newOwners = [...values.owner_details, newOwner];
      setFieldValue("owner_details", newOwners);
    } else {
      
    }
  };

  const handleRemoveOwner = (index) => {
    if (values.owner_details.length > 1) {
      const newOwners = values.owner_details.filter((_, i) => i !== index);
      setFieldValue("owner_details", newOwners);
    } else {
      
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Owner Details</h2>

      {/* {process.env.NODE_ENV === "development" && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <details>
            <summary className="cursor-pointer font-bold text-yellow-800">
              🔍 Debug Information - OwnerInfo
            </summary>
            <div className="mt-3 text-sm space-y-2">
              <div>
                <strong>Owner Details:</strong>
                <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-auto">
                  {JSON.stringify(values.owner_details, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </div>
      )} */}

      <FieldArray name="owner_details">
        {({ push, remove }) => {
          const currentTotalOwnership = calculateTotalOwnership(
            values.owner_details
          );

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
                    roleOptions={roleOptions}
                    idDocumentTypeOptions={idDocumentTypeOptions}
                    countriesLoading={countriesLoading}
                    selectedCurrency={selectedCurrency}
                    isNamedAccount={isNamedAccount}
                    activeField={activeField}
                    setActiveField={setActiveField}
                    onRemove={() => handleRemoveOwner(index)}
                    onOwnerIfChange={(val) => handleOwnerIfChange(index, val)}
                    onOwnershipChange={(val) =>
                      handleOwnershipPercentageChange(index, val)
                    }
                  />
                );
              })}

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleAddOwner}
                  disabled={
                    !ownerAdd ||
                    calculateTotalOwnership(values.owner_details) >= 100
                  }
                  className="w-full md:w-auto py-3 px-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-plus mr-2"></i>
                  {values.owner_details.length === 0
                    ? "Add Owner"
                    : "Add Another Owner"}
                </button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">
                    Total Ownership:
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      Math.abs(currentTotalOwnership - 100) < 0.01
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {currentTotalOwnership.toFixed(2)}%
                  </span>
                </div>

                {Math.abs(currentTotalOwnership - 100) > 0.01 ? (
                  <div className="space-y-2">
                    <p className="text-red-600 text-sm">
                      ❌ Total ownership must equal exactly 100%
                    </p>
                    <p className="text-red-600 text-sm">
                      Current difference:{" "}
                      {(100 - currentTotalOwnership).toFixed(2)}%
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
