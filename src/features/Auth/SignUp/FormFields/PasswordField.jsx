import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle, faEye, faEyeSlash, faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

const PasswordField = ({
  id,
  label,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  touched,
  error,
  required = false,
  visible,
  onToggleVisibility,
  validationRules,
  disabled = false,
  placeholder = "",
  // New props for password matching
  showPasswordMatch = false,
  passwordsMatch = false,
  ...props
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={`w-full px-4 py-3 pr-12 text-sm text-gray-900 bg-white border ${
            touched && error 
              ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500" 
              : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          } rounded-lg focus:outline-none transition-colors ${
            disabled ? "bg-gray-100 opacity-60 cursor-not-allowed" : ""
          }`}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          value={value}
          name={name}
          disabled={disabled}
          {...props}
        />
        
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onToggleVisibility}
          disabled={disabled}
        >
          <FontAwesomeIcon 
            icon={visible ? faEyeSlash : faEye} 
            className="w-4 h-4" 
          />
        </button>
      </div>

      {/* Password match validation */}
      {showPasswordMatch && (
        <div className={`text-xs flex items-center mt-1 ${
          passwordsMatch ? 'text-green-600' : 'text-red-500'
        }`}>
          <FontAwesomeIcon 
            icon={passwordsMatch ? faCheckCircle : faTimesCircle} 
            className="mr-1 w-3 h-3" 
          />
          {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
        </div>
      )}

      {touched && error && !showPasswordMatch && (
        <p className="text-red-500 text-xs flex items-center mt-1">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-1 w-3 h-3" />
          {error}
        </p>
      )}

      {/* Password validation rules (only for password field, not confirm password) */}
      {validationRules && value && name === 'password' && (
        <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h4 className="text-xs font-medium text-blue-800 mb-2">
            Password Requirements:
          </h4>
          <ul className="space-y-1 text-xs">
            {validationRules.map((rule, index) => (
              <li
                key={index}
                className={`flex items-center ${
                  rule.regex.test(value)
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    rule.regex.test(value)
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                ></span>
                {rule.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordField;