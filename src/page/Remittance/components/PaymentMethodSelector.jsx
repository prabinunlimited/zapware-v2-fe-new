import React from "react";

const PaymentMethodSelector = ({ options, selected, onChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`
            p-6 rounded-2xl border-2 transition-all duration-300
            ${
              selected === option.value
                ? `border-${option.color}-500 bg-${option.color}-50 shadow-lg`
                : "border-gray-200 hover:border-gray-300 hover:shadow-md"
            }
            flex flex-col items-center justify-center gap-4
            relative overflow-hidden
          `}
        >
          {selected === option.value && (
            <div
              className={`absolute top-3 right-3 w-6 h-6 bg-${option.color}-500 rounded-full flex items-center justify-center`}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}

          <div
            className={`
            p-4 rounded-full
            ${
              selected === option.value
                ? `bg-${option.color}-100 text-${option.color}-600`
                : "bg-gray-100 text-gray-600"
            }
          `}
          >
            {option.icon}
          </div>

          <div className="text-center">
            <div
              className={`font-bold text-lg ${
                selected === option.value
                  ? `text-${option.color}-700`
                  : "text-gray-700"
              }`}
            >
              {option.label}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {option.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default PaymentMethodSelector;
