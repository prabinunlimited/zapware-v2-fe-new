// src/features/Transfer/components/ReceiverSearchSection.jsx - SEARCHABLE BY CODE & NAME
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { ClipLoader } from "react-spinners";
import { motion } from "framer-motion";

import { searchReceiverByMobile } from "./transferThunks";
import {
  selectSearchLoading,
  selectFormErrors,
  selectIsFormReadyForSearch,
} from "./transferSelectors";
import { selectCountriesOptions } from "../../features/Auth/slices/countrySlice";

const ReceiverSearchSection = ({
  searchQuery,
  selectedCountryCode,
  onMobileChange,
  onCountryCodeChange,
  onReceiverFound,
  headerColorProps,
  textColorProps,
}) => {
  const dispatch = useDispatch();
  const searchLoading = useSelector(selectSearchLoading);
  const formErrors = useSelector(selectFormErrors);
  const isFormReady = useSelector(selectIsFormReadyForSearch);
  const countriesData = useSelector(selectCountriesOptions);

  const currentSelectedCountry = countriesData.find(
    (country) => country.phoneCode === selectedCountryCode
  );

  const handleSearchReceiver = async () => {
    if (!isFormReady) return;

    const result = await dispatch(
      searchReceiverByMobile({
        mobile: searchQuery,
        countryCode: selectedCountryCode,
      })
    );

    if (result?.success || result?.payload?.success) {
      onReceiverFound();
    }
  };

  // Custom filter option for searching by both code and name
  const filterOption = (option, inputValue) => {
    if (!inputValue) return true;
    
    const searchTerm = inputValue.toLowerCase().trim();
    const countryName = option.data.label?.toLowerCase() || "";
    const phoneCode = option.data.phoneCode?.toLowerCase() || "";
    const countryCode = option.data.country_code?.toLowerCase() || "";
    
    // Search by:
    // 1. Phone code (with or without +)
    // 2. Country name
    // 3. Country code (US, GB, etc.)
    return (
      phoneCode.includes(searchTerm) ||
      phoneCode.replace("+", "").includes(searchTerm) ||
      countryName.includes(searchTerm) ||
      countryCode.includes(searchTerm)
    );
  };

  // Custom styles for react-select
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: formErrors.mobile ? "#fef2f2" : "white",
      border: formErrors.mobile ? "1px solid #fca5a5" : "1px solid #d1d5db",
      borderRadius: "8px 0 0 8px",
      fontSize: "14px",
      color: "#111827",
      padding: "0 8px",
      minHeight: "48px",
      height: "48px",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.2)" : "none",
      "&:hover": {
        border: formErrors.mobile ? "1px solid #f87171" : "1px solid #9ca3af",
      },
      borderRight: "none",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
        ? "#f0f9ff"
        : "white",
      color: state.isSelected ? "white" : "#111827",
      fontSize: "14px",
      padding: "10px 12px",
      cursor: "pointer",
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "8px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
      zIndex: 50,
      marginTop: "4px",
    }),
    menuList: (provided) => ({
      ...provided,
      padding: "4px 0",
      maxHeight: "300px",
    }),
    singleValue: (provided) => ({
      ...provided,
      display: "flex",
      alignItems: "center",
      margin: 0,
      padding: 0,
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: "#6b7280",
      padding: "0 4px",
      "&:hover": {
        color: "#374151",
      },
    }),
    input: (provided) => ({
      ...provided,
      margin: 0,
      padding: 0,
      color: "#111827",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
      fontSize: "14px",
      margin: 0,
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "0 4px",
      display: "flex",
      alignItems: "center",
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      padding: "0 4px",
    }),
  };

  // Format option for dropdown - shows both code and name clearly
  const formatOptionLabel = ({ label, phoneCode, flag_url }, { context }) => {
    if (context === "value") {
      // When selected, show only flag + code
      return (
        <div className="flex items-center space-x-2">
          {flag_url && (
            <img
              src={flag_url}
              alt={label}
              className="w-5 h-4 rounded-sm object-cover"
            />
          )}
          <span className="font-medium">{phoneCode}</span>
        </div>
      );
    }
    
    // In dropdown menu, show full details
    return (
      <div className="flex items-center space-x-3 py-1">
        {flag_url && (
          <img
            src={flag_url}
            alt={label}
            className="w-6 h-4 rounded-sm object-cover flex-shrink-0"
          />
        )}
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-800">{phoneCode}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {label}
            </span>
          </div>
          <span className="text-xs text-gray-500 mt-1">
            Searchable by: "{phoneCode}", "{label}", "{phoneCode.replace('+', '')}"
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Receiver's Mobile Number *
        </label>

        {/* Country Code & Phone Input on SAME LINE */}
        <div className="flex items-stretch">
          {/* Country Code - Takes about 30% width */}
          <div className="w-1/3 flex-shrink-0">
            <Select
              options={countriesData}
              value={currentSelectedCountry || null}
              onChange={(option) =>
                onCountryCodeChange(option?.phoneCode || "")
              }
              placeholder={
                <div className="flex items-center text-gray-500">
                  <span>Search code or country...</span>
                </div>
              }
              formatOptionLabel={formatOptionLabel}
              styles={customStyles}
              isSearchable
              filterOption={filterOption}
              components={{
                SingleValue: ({ data }) => (
                  <div className="flex items-center space-x-2">
                    {data?.flag_url && (
                      <img
                        src={data.flag_url}
                        alt={data.label}
                        className="w-5 h-4 rounded-sm"
                      />
                    )}
                    <span className="font-medium text-gray-800">
                      {data?.phoneCode || ""}
                    </span>
                  </div>
                ),
                IndicatorSeparator: null,
                DropdownIndicator: () => (
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                ),
                NoOptionsMessage: () => (
                  <div className="py-2 px-3 text-sm text-gray-500">
                    No countries found. Try searching by:
                    <ul className="mt-1 text-xs text-gray-400">
                      <li>• Phone code (e.g., "+977" or "977")</li>
                      <li>• Country name (e.g., "Nepal")</li>
                      <li>• Country code (e.g., "NP" for Nepal)</li>
                    </ul>
                  </div>
                ),
              }}
              getOptionLabel={(option) => `${option.phoneCode} ${option.label}`}
              getOptionValue={(option) => option.phoneCode}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              classNamePrefix="country-select"
              noOptionsMessage={() => "No countries found. Try searching by code or name."}
              loadingMessage={() => "Loading countries..."}
            />
          </div>

          {/* Phone Number - Takes about 70% width */}
          <div className="flex-1">
            <input
              type="tel"
              value={searchQuery}
              onChange={(e) => onMobileChange(e.target.value)}
              placeholder="Enter phone number"
              className={`w-full h-full px-4 border border-l-0 rounded-r-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm ${
                formErrors.mobile
                  ? "border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400"
                  : "border-gray-300 hover:border-gray-400 focus:border-blue-500"
              }`}
              style={{ height: "48px" }}
              maxLength={15}
            />
          </div>
        </div>

        {/* Search examples - subtle hint */}
        <p className="text-xs text-gray-500 mt-1">
          Search country by: <span className="text-blue-600">+977</span>, 
          <span className="text-blue-600 ml-1">977</span>, 
          <span className="text-blue-600 ml-1">Nepal</span>, or 
          <span className="text-blue-600 ml-1">NP</span>
        </p>

        {/* Error Message Only */}
        {formErrors.mobile && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-xs mt-1"
          >
            {formErrors.mobile}
          </motion.p>
        )}
      </div>

      {/* Search Button */}
      <motion.button
        type="button"
        onClick={handleSearchReceiver}
        disabled={searchLoading || !isFormReady}
        className={`w-full flex justify-center items-center px-4 py-3 rounded-lg text-white font-medium transition-all ${
          headerColorProps?.className ||
          "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
        } ${
          searchLoading || !isFormReady
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
        whileHover={!searchLoading && isFormReady ? { scale: 1.01 } : {}}
        whileTap={!searchLoading && isFormReady ? { scale: 0.99 } : {}}
      >
        {searchLoading ? (
          <>
            <ClipLoader size={16} color="#fff" className="mr-2" />
            <span className="text-sm">Searching...</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-sm">Find Receiver</span>
          </>
        )}
      </motion.button>
    </div>
  );
};

export default ReceiverSearchSection;