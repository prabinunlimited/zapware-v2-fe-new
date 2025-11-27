import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { ClipLoader } from "react-spinners";

import { searchReceiverByMobile } from "./transferThunks";
import { selectSearchLoading, selectFormErrors } from "./transferSelectors";

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

  const handleSearchReceiver = async () => {
    if (!searchQuery || !selectedCountryCode) return;

    

    const result = await dispatch(
      searchReceiverByMobile({
        mobile: searchQuery,
        countryCode: selectedCountryCode,
      })
    );

    
    
    
    );

    // FIX: Check the actual structure returned by the thunk
    if (result?.success) {
      , calling onReceiverFound");
      onReceiverFound();
    } else if (result?.payload?.success) {
      , calling onReceiverFound");
      onReceiverFound();
    } else {
      
    }
  };

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "white",
      border: "1px solid #d1d5db",
      borderRadius: "0.5rem",
      fontSize: "0.875rem",
      color: "#111827",
    }),
  };

  return (
    <div className="space-y-4 mt-6">
      <label className="block text-sm font-medium text-gray-700">
        Receiver's Mobile
      </label>
      <div className="flex gap-2">
        <div className="w-1/3">
          <Select
            options={countryOptions}
            value={countryOptions.find(
              (opt) => opt.value === selectedCountryCode
            )}
            onChange={(option) => onCountryCodeChange(option?.value || "")}
            placeholder="Code"
            styles={customStyles}
          />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onMobileChange(e.target.value)}
          placeholder="Phone number"
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      {formErrors.mobile && (
        <p className="text-red-500 text-sm">{formErrors.mobile}</p>
      )}

      <button
        type="button"
        onClick={handleSearchReceiver}
        disabled={searchLoading || !searchQuery || !selectedCountryCode}
        className={`w-full flex justify-center items-center px-4 py-2 rounded-lg text-white font-medium transition ${
          headerColorProps.className || ""
        }`}
        style={{
          ...headerColorProps.style,
          opacity: searchLoading || !searchQuery || !selectedCountryCode ? 0.7 : 1,
          cursor: searchLoading || !searchQuery || !selectedCountryCode ? "not-allowed" : "pointer",
        }}
      >
        {searchLoading ? (
          <>
            <ClipLoader size={16} color="#fff" className="mr-2" />
            Searching...
          </>
        ) : (
          "Find Receiver"
        )}
      </button>
    </div>
  );
};

export default ReceiverSearchSection;