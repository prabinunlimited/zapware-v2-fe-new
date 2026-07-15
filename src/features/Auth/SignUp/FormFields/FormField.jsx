import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

const FormField = ({
  id,
  label,
  type = "text",
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  touched,
  error,
  required = false,
  disabled = false,
  placeholder = "",
  autoComplete,
  maxLength,
  rows = 4,
  as = "input", // Add 'as' prop to determine if it's input or textarea
  activeField,  
  fieldStyles, 
  ...props
}) => {
  const baseClassName = `w-full px-4 py-3 text-sm text-gray-900 bg-white border ${
    touched && error
      ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
      : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  } rounded-lg focus:outline-none transition-colors ${
    disabled ? "bg-gray-100 opacity-60 cursor-not-allowed" : ""
  }`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        {as === "textarea" ? (
          <textarea
            id={id}
            className={baseClassName}
            placeholder={placeholder}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            value={value}
            name={name}
            rows={rows}
            disabled={disabled}
            {...props}
          />
        ) : (
          <input
            id={id}
            type={type}
            className={baseClassName}
            placeholder={placeholder}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            value={value}
            name={name}
            autoComplete={autoComplete}
            maxLength={maxLength}
            disabled={disabled}
            {...props}
          />
        )}
      </div>

      {touched && error && (
        <p className="text-red-500 text-xs flex items-center mt-1">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-1 w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
