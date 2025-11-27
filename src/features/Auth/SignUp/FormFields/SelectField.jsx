import React from "react";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: state.isDisabled ? "#f9fafb" : "#ffffff",
    border: state.isFocused
      ? "1px solid #3b82f6"
      : state.selectProps.hasError
      ? "1px solid #ef4444"
      : "1px solid #d1d5db",
    borderRadius: "0.5rem",
    padding: "0px 4px",
    fontSize: "0.875rem",
    color: "#111827",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.1)" : "none",
    minHeight: "50px",
    opacity: state.isDisabled ? 0.6 : 1,
    "&:hover": {
      borderColor: state.isFocused
        ? "#3b82f6"
        : state.selectProps.hasError
        ? "#ef4444"
        : "#9ca3af",
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "8px 12px",
  }),
  input: (provided) => ({
    ...provided,
    margin: "0px",
    padding: "0px",
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0.5rem",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    zIndex: 20,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#dbeafe"
      : state.isFocused
      ? "#f0f9ff"
      : "white",
    color: state.isSelected ? "#1e40af" : "#111827",
    fontSize: "0.875rem",
    padding: "10px 12px",
    "&:hover": {
      backgroundColor: "#f0f9ff",
      color: "#1e40af",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#9ca3af",
    fontSize: "0.875rem",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#111827",
    fontSize: "0.875rem",
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: "#6b7280",
    "&:hover": {
      color: "#374151",
    },
  }),
  indicatorSeparator: (provided) => ({
    ...provided,
    backgroundColor: "#d1d5db",
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#dbeafe",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#1e40af",
    fontSize: "0.875rem",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#1e40af",
    "&:hover": {
      backgroundColor: "#ef4444",
      color: "white",
    },
  }),
};

// Flag formatting function for country options - UPDATED to hide phone code for regular country fields
const formatCountryOptionLabel = (option, { context }) => {
  const flagUrl = option.flag || option.flag_url || option.originalData?.flag_url;
  const phoneCode = option.phoneCode || option.phone_code || "";
  const countryCode = option.country_code || option.countryCode || "";
  const countryName = option.label || option.name || "";

  const displayPhoneCode = phoneCode ? `+${phoneCode.replace(/^\+/, "")}` : "";

  // Show phone code only for phone number fields, hide for regular country fields
  const showPhoneCode = context === "phone";

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
        {countryCode && (
          <span className="text-gray-500 text-xs">({countryCode})</span>
        )}
      </div>
      {showPhoneCode && displayPhoneCode && (
        <span className="text-gray-500 text-sm font-medium bg-gray-100 px-2 py-1 rounded">
          {displayPhoneCode}
        </span>
      )}
    </div>
  );
};

// Filter function for country search
const countryFilterOption = (option, inputValue) => {
  const searchTerm = inputValue.toLowerCase().trim();
  if (!searchTerm || searchTerm === "+") return true;

  const countryName = (option.label || option.name || "").toLowerCase();
  const countryCode = (option.country_code || option.countryCode || "").toLowerCase();
  const rawPhoneCode = option.phoneCode || option.phone_code || "";
  const phoneCode = rawPhoneCode.toString().toLowerCase();

  const cleanSearchTerm = searchTerm.replace(/^\+/, "");
  const cleanPhoneCode = phoneCode.replace(/^\+/, "");

  return (
    countryName.includes(searchTerm) ||
    countryCode.includes(searchTerm) ||
    phoneCode.includes(searchTerm) ||
    cleanPhoneCode.includes(cleanSearchTerm)
  );
};

const SelectField = ({
  id,
  label,
  options = [],
  onChange,
  onBlur,
  value,
  touched,
  error,
  required = false,
  isLoading = false,
  disabled = false,
  placeholder,
  isCountryField = false,
  showPhoneCode = false, // New prop to control phone code display
  ...props
}) => {
  const handleBlur = () => {
    if (onBlur) {
      onBlur({
        target: { name: id },
      });
    }
  };

  // Custom format function that passes context
  const customFormatOptionLabel = (option, { context }) => {
    return formatCountryOptionLabel(option, { 
      context: showPhoneCode ? "phone" : "country" 
    });
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {isLoading ? (
        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      ) : options.length === 0 ? (
        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-500">
          No options available
        </div>
      ) : (
        <Select
          id={id}
          name={id}
          options={options}
          onChange={onChange}
          onBlur={handleBlur}
          value={value}
          isDisabled={disabled}
          hasError={touched && error}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder={placeholder || `Select ${label}`}
          styles={customStyles}
          formatOptionLabel={isCountryField ? customFormatOptionLabel : undefined}
          filterOption={isCountryField ? countryFilterOption : undefined}
          {...props}
        />
      )}

      {touched && error && (
        <p className="text-red-500 text-xs flex items-center mt-1">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-1 w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

export default SelectField;