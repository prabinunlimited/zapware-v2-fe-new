import React from "react";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#f9fafb",
    border: state.isFocused ? "1px solid #0284c7" : "1px solid #d1d5db",
    borderRadius: "0.5rem",
    padding: "0px",
    fontSize: "0.875rem",
    color: "#111827",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(2, 132, 199, 0.1)" : "none",
    minHeight: "50px",
    "&:hover": {
      borderColor: "#0284c7",
    },
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
    backgroundColor: state.isSelected ? "#f0f9ff" : "white",
    color: state.isSelected ? "#0284c7" : "#111827",
    "&:hover": {
      backgroundColor: "#f0f9ff",
      color: "#0284c7",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#9ca3af",
  }),
  // ADD THESE NEW STYLES TO FIX INVISIBLE TEXT:
  singleValue: (provided) => ({
    ...provided,
    color: "#111827", // Ensure selected value text is visible
  }),
  input: (provided) => ({
    ...provided,
    color: "#111827", // Ensure input text is visible
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#f0f9ff",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#0284c7",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#0284c7",
    "&:hover": {
      backgroundColor: "#dc2626",
      color: "white",
    },
  }),
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
  isLoading = false, // Add this prop
  ...props
}) => {
  const handleBlur = () => {
    if (onBlur) {
      onBlur({
        target: { name: id },
      });
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {isLoading ? (
        <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      ) : options.length === 0 ? (
        <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
          <p className="text-sm text-gray-500">No options available</p>
        </div>
      ) : (
        <Select
          id={id}
          name={id}
          options={options}
          onChange={onChange}
          onBlur={handleBlur}
          value={value}
          className="react-select-container"
          classNamePrefix="react-select"
          placeholder={`Select ${label}`}
          styles={customStyles}
          {...props}
        />
      )}
      
      {touched && error && (
        <p className="text-red-500 text-xs mt-1 flex items-center">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};


export default SelectField;