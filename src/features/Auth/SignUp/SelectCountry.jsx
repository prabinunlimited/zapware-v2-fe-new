// SelectCountry.jsx
import React, { useEffect, useState } from "react";
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchCountries());
  }, [dispatch]);

  const filteredCountries = countriesOptions.filter(
    (country) =>
      country.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.country_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountrySelect = (country) => {
    setSelectedCountryState(country);
    dispatch(setSelectedCountry(country));
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  const handleClearSelection = () => {
    setSelectedCountryState(null);
    dispatch(setSelectedCountry(null));
  };

  const handleContinue = () => {
    if (selectedCountry) {
      const countryData = {
        value: selectedCountry.id,
        label: selectedCountry.label,
        country_id: selectedCountry.id,
        country_code: selectedCountry.country_code,
        flag_url: selectedCountry.flag_url,
        phoneCode: selectedCountry.phoneCode
      };

      navigate("/opencurrencyaccount", { 
        state: { 
          selectedCountry: countryData,
          accountType: accountType 
        } 
      });
    }
  };

  const handleCancel = () => {
    navigate("/selectaccounttype");
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      {/* Minimal Header */}
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 p-2 -ml-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-sm text-gray-400">
            Step 2 of 4
          </div>
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
              type="text"
              placeholder="Search country..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!isDropdownOpen) setIsDropdownOpen(true);
              }}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Selected Country (Minimal) */}
        {selectedCountry && (
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedCountry.flag_url}
                  alt=""
                  className="w-8 h-6 rounded object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900">{selectedCountry.label}</p>
                  <p className="text-sm text-gray-500">{selectedCountry.country_code} • {selectedCountry.phoneCode}</p>
                </div>
              </div>
              <button
                onClick={handleClearSelection}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Countries List */}
        {isDropdownOpen && (
          <div className="mb-8">
            <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {filteredCountries.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No countries found</p>
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.value}
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      selectedCountry?.value === country.value ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={country.flag_url}
                        alt=""
                        className="w-8 h-6 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{country.label}</p>
                        <p className="text-sm text-gray-500">{country.country_code} • {country.phoneCode}</p>
                      </div>
                      {selectedCountry?.value === country.value && (
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Continue Button */}
        {selectedCountry && (
          <button
            onClick={handleContinue}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

export default SelectCountry;