import React from "react";
import Select from "react-select";

const CurrencySelect = ({ options, value, onChange, placeholder }) => {
  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: "56px",
      borderRadius: "12px",
      borderColor: "#e5e7eb",
      "&:hover": { borderColor: "#9ca3af" },
      boxShadow: "none",
      paddingLeft: "12px",
    }),
    option: (base, { isSelected }) => ({
      ...base,
      backgroundColor: isSelected ? "#3b82f6" : "white",
      color: isSelected ? "white" : "#374151",
      "&:hover": {
        backgroundColor: "#3b82f6",
        color: "white",
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: "#111827",
      fontWeight: "600",
      fontSize: "16px",
    }),
  };

  const formatOptionLabel = ({ label, symbol }) => (
    <div className="flex items-center gap-2">
      <span className="font-semibold">{symbol || label}</span>
      <span className="text-gray-600">{label}</span>
    </div>
  );

  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      styles={customStyles}
      formatOptionLabel={formatOptionLabel}
      isSearchable
      className="react-select-container"
      classNamePrefix="react-select"
    />
  );
};

export default CurrencySelect;
