// SelectCountry.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  fetchCountries,
  selectCountriesOptions,
  setSelectedCountry,
} from "../slices/countrySlice";

function SelectCountry() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Get account type from navigation state (passed from AccountType)
  const accountType = location.state?.accountType || "individual";

  const countriesOptions = useSelector(selectCountriesOptions);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountryState] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    dispatch(fetchCountries());
  }, [dispatch]);

  // Auto-open dropdown when countries are loaded
  useEffect(() => {
    if (countriesOptions.length > 0 && !hasLoaded) {
      setHasLoaded(true);
      setIsDropdownOpen(true);
      // Focus the search input automatically
      if (searchInputRef.current) {
        setTimeout(() => searchInputRef.current.focus(), 100);
      }
    }
  }, [countriesOptions, hasLoaded]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredCountries = countriesOptions.filter(
    (country) =>
      country.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.country_code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCountrySelect = (country) => {
    // Only allow selection if it's a different country
    if (selectedCountry?.value !== country.value) {
      setSelectedCountryState(country);
      dispatch(setSelectedCountry(country));
    }
    // Close dropdown immediately after selection
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  const handleClearSelection = () => {
    setSelectedCountryState(null);
    dispatch(setSelectedCountry(null));
    setIsDropdownOpen(true);
    // Focus the search input after clearing
    if (searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100);
    }
  };

  const handleContinue = () => {
    if (selectedCountry) {
      const countryData = {
        value: selectedCountry.id,
        label: selectedCountry.label,
        country_id: selectedCountry.id,
        country_code: selectedCountry.country_code,
        flag_url: selectedCountry.flag_url,
        phoneCode: selectedCountry.phoneCode,
      };

      navigate("/opencurrencyaccount", {
        state: {
          selectedCountry: countryData,
          accountType: accountType,
        },
      });
    }
  };

  const handleCancel = () => {
    navigate("/selectaccounttype");
  };

  const handleSearchFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && filteredCountries.length > 0) {
      // Select the first country when Enter is pressed
      handleCountrySelect(filteredCountries[0]);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      {/* Minimal Header */}
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 p-2 -ml-2 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="text-sm text-gray-400">Step 2 of 4</div>
        </div>

        {/* Content */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Select your country
          </h1>
          <p className="text-gray-500">
            {accountType === "individual"
              ? "Choose where you reside"
              : accountType === "institution"
                ? "Choose where your institution is registered"
                : "Choose your country"}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search country..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              autoComplete="off"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg
                  className="h-5 w-5 text-gray-400 hover:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {countriesOptions.length > 0
              ? `${countriesOptions.length} countries available`
              : "Loading countries..."}
          </p>
        </div>

        {/* Selected Country (Minimal) */}
        {selectedCountry && (
          <div className="mb-6 animate-fadeIn">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedCountry.flag_url}
                  alt={selectedCountry.label}
                  className="w-8 h-6 rounded object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="24" viewBox="0 0 32 24"%3E%3Crect width="32" height="24" fill="%23f0f0f0"/%3E%3C/svg%3E';
                  }}
                />
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedCountry.label}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedCountry.country_code} • {selectedCountry.phoneCode}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClearSelection}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="Clear selection"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Countries List - Only visible when dropdown is open and no country selected */}
        {isDropdownOpen && !selectedCountry && (
          <div className="mb-8" ref={dropdownRef}>
            <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white shadow-sm">
              {countriesOptions.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="flex justify-center mb-3">
                    <svg
                      className="animate-spin h-8 w-8 text-blue-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                  <p className="text-gray-500">Loading countries...</p>
                </div>
              ) : filteredCountries.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">
                    No countries found matching "{searchTerm}"
                  </p>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-2 text-blue-500 hover:text-blue-600 text-sm transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                filteredCountries.map((country, index) => (
                  <button
                    key={country.value}
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-all duration-200 ${
                      selectedCountry?.value === country.value
                        ? "bg-blue-50"
                        : ""
                    }`}
                    style={{
                      animation: `fadeInUp 0.2s ease-out ${index * 0.02}s both`,
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={country.flag_url}
                        alt={country.label}
                        className="w-8 h-6 rounded object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="24" viewBox="0 0 32 24"%3E%3Crect width="32" height="24" fill="%23f0f0f0"/%3E%3C/svg%3E';
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {country.label}
                        </p>
                        <p className="text-sm text-gray-500">
                          {country.country_code} • {country.phoneCode}
                        </p>
                      </div>
                      {selectedCountry?.value === country.value && (
                        <svg
                          className="w-5 h-5 text-blue-500 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Continue Button - Only show when a country is selected */}
        {selectedCountry && (
          <button
            onClick={handleContinue}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Continue
          </button>
        )}

        {/* No country selected hint - Only show when no country is selected */}
        {!selectedCountry && countriesOptions.length > 0 && (
          <div className="text-center mt-6">
            <p className="text-sm text-gray-400">
              {searchTerm
                ? "Select a country from the list above to continue"
                : "Click on a country from the list above to continue"}
            </p>
          </div>
        )}
      </div>

      {/* Add CSS animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeInUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default SelectCountry;