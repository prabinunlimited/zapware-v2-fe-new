// src/features/Transfer/components/ReceiverSearchSection.jsx - COMPLETE
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { ClipLoader } from "react-spinners";
import { motion } from "framer-motion";

import { searchReceiverByMobile } from "./transferThunks";
import { selectSearchLoading, selectFormErrors, selectIsFormReadyForSearch } from "./transferSelectors";

const ReceiverSearchSection = ({
  searchQuery,
  selectedCountryCode,
  countryOptions,
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

  const handleSearchReceiver = async () => {
    if (!isFormReady) return;

    console.log("🔍 Starting receiver search...", { searchQuery, selectedCountryCode });

    const result = await dispatch(
      searchReceiverByMobile({
        mobile: searchQuery,
        countryCode: selectedCountryCode,
      })
    );

    console.log("🔍 Search result:", result);

    if (result?.success || result?.payload?.success) {
      console.log("✅ Receiver found, calling onReceiverFound");
      onReceiverFound();
    } else {
      console.log("❌ Receiver not found or error:", result?.error || result?.payload?.error);
    }
  };

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: formErrors.mobile ? "#fef2f2" : "white",
      border: formErrors.mobile ? "1px solid #fca5a5" : "1px solid #d1d5db",
      borderRadius: "0.75rem",
      fontSize: "0.875rem",
      color: "#111827",
      padding: "4px 8px",
      minHeight: "48px",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.1)" : "none",
      "&:hover": {
        border: formErrors.mobile ? "1px solid #fca5a5" : "1px solid #9ca3af",
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
      color: state.isSelected ? 'white' : '#111827',
      fontSize: '0.875rem',
      padding: '8px 12px',
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '0.75rem',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    }),
  };

  return (
    <div className="space-y-6">
      <div className={`p-4 border rounded-xl transition-all ${
        formErrors.mobile ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
      }`}>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Receiver's Mobile Number *
        </label>
        
        <div className="flex gap-3">
          {/* Country Code - Increased width */}
          <div className="w-1/3 min-w-[140px]">
            <Select
              options={countryOptions}
              value={countryOptions.find(
                (opt) => opt.value === selectedCountryCode
              )}
              onChange={(option) => onCountryCodeChange(option?.value || "")}
              placeholder="Code"
              styles={customStyles}
              isSearchable
            />
          </div>
          
          {/* Phone Number - Increased width */}
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onMobileChange(e.target.value)}
              placeholder="Enter phone number"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                formErrors.mobile ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              maxLength={15}
            />
          </div>
        </div>
        
        {formErrors.mobile && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {formErrors.mobile}
          </motion.p>
        )}
      </div>

      <motion.button
        type="button"
        onClick={handleSearchReceiver}
        disabled={searchLoading || !isFormReady}
        className={`w-full flex justify-center items-center px-6 py-4 rounded-xl text-white font-semibold transition-all duration-200 ${
          headerColorProps.className || "bg-gradient-to-r from-blue-600 to-blue-700"
        } ${
          searchLoading || !isFormReady 
            ? "opacity-50 cursor-not-allowed" 
            : "hover:scale-[1.02] transform shadow-lg"
        }`}
        style={{
          ...headerColorProps.style,
          boxShadow: searchLoading || !isFormReady 
            ? "none" 
            : "0 4px 14px 0 rgba(0, 118, 255, 0.39)",
        }}
        whileHover={!searchLoading && isFormReady ? { scale: 1.02 } : {}}
        whileTap={!searchLoading && isFormReady ? { scale: 0.98 } : {}}
      >
        {searchLoading ? (
          <>
            <ClipLoader size={20} color="#fff" className="mr-3" />
            <span>Searching Receiver...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Find Receiver</span>
          </>
        )}
      </motion.button>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Enter the receiver's mobile number to find their account
        </p>
        {!isFormReady && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-400 mt-1"
          >
            Complete transfer details above to enable search
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default ReceiverSearchSection;