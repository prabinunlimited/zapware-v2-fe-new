import React from "react";

const CurrencyInput = ({ value, onChange, placeholder, className = "" }) => {
  const handleChange = (e) => {
    const input = e.target.value;
    // Allow only numbers and one decimal point
    const sanitized = input.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");

    if (parts.length > 2) {
      return; // Multiple decimal points not allowed
    }

    if (parts[1] && parts[1].length > 2) {
      return; // Max 2 decimal places
    }

    onChange(sanitized);
  };

  const formatDisplay = (val) => {
    if (!val) return "";
    const num = parseFloat(val);
    if (isNaN(num)) return "";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={formatDisplay(value)}
        onChange={handleChange}
        placeholder={placeholder}
        className={`
          w-full px-4 py-3 text-2xl font-bold bg-transparent
          border-none focus:outline-none focus:ring-0
          placeholder-gray-400 text-gray-900
          ${className}
        `}
        inputMode="decimal"
      />
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
        <svg
          className="w-6 h-6 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      </div>
    </div>
  );
};

export default CurrencyInput;
