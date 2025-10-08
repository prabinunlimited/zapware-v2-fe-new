import React from "react";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "transparent",
    border: state.isFocused ? "1px solid #0284c7" : "1px solid #d1d5db",
    borderRadius: "0.5rem",
    padding: "0px",
    fontSize: "0.875rem",
    color: "#111827",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(2, 132, 199, 0.1)" : "none",
    minHeight: "44px",
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
};

const SelectField = ({
  id,
  label,
  options,
  onChange,
  value,
  touched,
  error,
  required = false,
  getOptionLabel,
  selectProps = {},
}) => {
  return (
    <div className="relative">
      <Select
        id={id}
        options={options}
        onChange={onChange}
        value={value}
        className="react-select-container"
        classNamePrefix="react-select"
        placeholder=" "
        styles={{
          ...customStyles,
          control: (provided) => ({
            ...provided,
            paddingTop: "0.2rem",
            paddingBottom: "0.2rem",
            minHeight: "50px",
            backgroundColor: "#f9fafb",
            borderRadius: ".5rem",
          }),
        }}
        getOptionLabel={getOptionLabel}
        {...selectProps}
      />
      <label
        htmlFor={id}
        className={`absolute text-sm ${
          value ? "text-blue-600" : "text-gray-500"
        } duration-300 transform -translate-y-4 scale-75 top-2 left-2 z-10 bg-white px-1 peer-focus:px-1 peer-focus:text-blue-600`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {touched && error && (
        <p className="mt-1 text-xs text-red-600 flex items-center">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

export default SelectField;