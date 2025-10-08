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
  activeField,
  autoComplete,
  maxLength,
  ...props
}) => {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        className={`block px-4 pb-2 pt-5 w-full text-sm text-gray-900 bg-gray-50 border ${
          touched && error ? "border-red-500" : "border-gray-300"
        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent peer transition-colors`}
        placeholder=" "
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        value={value}
        name={name}
        autoComplete={autoComplete}
        maxLength={maxLength}
        {...props}
      />
      <label
        htmlFor={id}
        className={`absolute text-sm ${
          activeField === id || value
            ? touched && error
              ? "text-red-600"
              : "text-blue-600"
            : "text-gray-500"
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

export default FormField;