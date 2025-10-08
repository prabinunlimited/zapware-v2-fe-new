import React from "react";
import FormField from "./FormField";

const PasswordField = ({
  visible,
  onToggleVisibility,
  validationRules,
  ...props
}) => {
  return (
    <div>
      <div className="relative">
        <FormField
          type={visible ? "text" : "password"}
          {...props}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 text-xs"
          onClick={onToggleVisibility}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>

      {validationRules && (
        <div className="mt-3 bg-blue-50 p-3 rounded-lg">
          <h4 className="text-xs font-medium text-blue-800 mb-2">
            Password Requirements:
          </h4>
          <ul className="space-y-1 text-xs text-gray-700">
            {validationRules.map((rule, index) => (
              <li
                key={index}
                className={`flex items-center ${
                  rule.regex.test(props.value)
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                <span
                  className={`inline-block w-3 h-3 rounded-full mr-2 ${
                    rule.regex.test(props.value)
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