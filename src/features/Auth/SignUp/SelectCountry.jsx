// SelectCountry.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import {
  fetchCountries,
  selectCountriesOptions,
  setSelectedCountry,
} from "../slices/countrySlice";

const API_URL = import.meta.env.VITE_API_URL;

function SelectCountry() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Get account type from navigation state (passed from AccountType)
  const accountType = location.state?.accountType || "individual";

  // Get email from navigation state (passed from previous step)
  const userEmail = location.state?.email || "";

  const countriesOptions = useSelector(selectCountriesOptions);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountryState] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Email states
  const [email, setEmail] = useState(userEmail);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailChecked, setEmailChecked] = useState(false);
  const [showEmailExistsPopup, setShowEmailExistsPopup] = useState(false);
  const [existingAccountType, setExistingAccountType] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSuccessMessage, setEmailSuccessMessage] = useState("");

  // Mobile number states
  const [phoneCode, setPhoneCode] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [isMobileValid, setIsMobileValid] = useState(false);
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [mobileChecked, setMobileChecked] = useState(false);
  const [showMobileExistsPopup, setShowMobileExistsPopup] = useState(false);
  const [mobileMessage, setMobileMessage] = useState("");
  const [mobileSuccessMessage, setMobileSuccessMessage] = useState("");

  const [showEmailSection, setShowEmailSection] = useState(true);
  const [showMobileSection, setShowMobileSection] = useState(false);

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Convert countries to react-select format
  const countryOptions = useMemo(() => {
    if (Array.isArray(countriesOptions) && countriesOptions.length > 0) {
      return countriesOptions.map((country) => ({
        value: country.id || country.value,
        label: `${country.label} (${country.phoneCode})`,
        countryName: country.label,
        phoneCode: country.phoneCode,
        flagUrl: country.flag_url,
        countryId: country.id || country.value,
        country_code: country.country_code,
      }));
    }
    return [];
  }, [countriesOptions]);

  // Get current country option for phone code dropdown
  const currentCountryOption = useMemo(() => {
    if (!selectedCountryId) return null;
    return countryOptions.find((option) => option.value === selectedCountryId) || null;
  }, [countryOptions, selectedCountryId]);

  useEffect(() => {
    dispatch(fetchCountries());
  }, [dispatch]);

  // Auto-open dropdown when countries are loaded
  useEffect(() => {
    if (countriesOptions.length > 0 && !hasLoaded) {
      setHasLoaded(true);
      setIsDropdownOpen(true);
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

  // Store registration data in session storage (persists across page refresh)
  const saveRegistrationData = (data) => {
    const existingData = JSON.parse(sessionStorage.getItem('registrationData') || '{}');
    const updatedData = { ...existingData, ...data };
    sessionStorage.setItem('registrationData', JSON.stringify(updatedData));
    console.log('✅ Registration data saved:', updatedData);
  };

  // Check Email API call
  const handleCheckEmail = async () => {
    if (!email) {
      setEmailError("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsCheckingEmail(true);
    setEmailError("");
    setEmailSuccessMessage("");

    try {
      const bearertoken = localStorage.getItem("bearertoken");
      const response = await fetch(`${API_URL}/customers/account-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(bearertoken && { Authorization: `Bearer ${bearertoken}` }),
        },
        body: JSON.stringify({
          email: email,
          customer_type: accountType
        }),
      });

      const data = await response.json();
      console.log("Email verification response:", data);

      if (data.status === "success") {
        const hasAccount = data.data?.has_account === "Y";

        if (hasAccount) {
          // Email EXISTS
          const customerType = data.message?.match(/customer type (\w+)/)?.[1] || "unknown";
          setExistingAccountType(customerType);
          setShowEmailExistsPopup(true);
          setIsEmailValid(false);
          setEmailChecked(true);
          setEmailMessage(data.message);
          setEmailSuccessMessage("");
        } else {
          // Email is NEW - Store in session storage
          setIsEmailValid(true);
          setEmailChecked(true);
          setEmailError("");
          setShowEmailExistsPopup(false);
          setEmailSuccessMessage(data.message || "Email verified successfully");
          setEmailMessage("");

          // 🔥 STORE EMAIL DATA
          saveRegistrationData({
            email: email,
            emailVerified: true,
            accountType: accountType
          });
          setShowEmailSection(false);
          setShowMobileSection(true);
        }
      } else {
        // Handle other status
        setIsEmailValid(true);
        setEmailChecked(true);
        setEmailError("");
        setShowEmailExistsPopup(false);
        setEmailSuccessMessage(data.message || "Email verified");
        setEmailMessage("");

        // 🔥 STORE EMAIL DATA
        saveRegistrationData({
          email: email,
          emailVerified: true,
          accountType: accountType
        });
        setShowEmailSection(false);
        setShowMobileSection(true);
      }
    } catch (error) {
      console.error("Email check error:", error);
      if (error.message?.includes("404")) {
        setIsEmailValid(true);
        setEmailChecked(true);
        setEmailError("");
        setShowEmailExistsPopup(false);
        setEmailSuccessMessage("Email is available for registration");

        // 🔥 STORE EMAIL DATA
        saveRegistrationData({
          email: email,
          emailVerified: true,
          accountType: accountType
        });
        setShowEmailSection(false);
        setShowMobileSection(true);
      } else {
        console.log("verify email error", error);
        setEmailError("Failed to verify email. Please try again next time.");
        setIsEmailValid(false);
        setEmailChecked(false);
        setShowEmailExistsPopup(false);
      }
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Check Mobile API call
  const handleCheckMobile = async () => {
    if (!phoneCode) {
      setMobileError("Please select a country code");
      return;
    }

    if (!mobileNumber) {
      setMobileError("Please enter your mobile number");
      return;
    }

    if (!/^[0-9]+$/.test(mobileNumber)) {
      setMobileError("Mobile number must contain only digits");
      return;
    }

    if (mobileNumber.length < 8 || mobileNumber.length > 15) {
      setMobileError("Mobile number must be between 8 and 15 digits");
      return;
    }

    setIsCheckingMobile(true);
    setMobileError("");
    setMobileSuccessMessage("");

    try {
      const bearertoken = localStorage.getItem("bearertoken");

      const response = await fetch(`${API_URL}/customers/account-mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(bearertoken && { Authorization: `Bearer ${bearertoken}` }),
        },
        body: JSON.stringify({
          mobile_number_country_code: phoneCode,
          mobile_number: mobileNumber,
          customer_type: accountType
        }),
      });

      const data = await response.json();
      console.log("Mobile verification response:", data);

      if (data.status === "success") {
        const hasAccount = data.data?.has_account === "Y";

        if (hasAccount) {
          // Mobile EXISTS
          const customerType = data.message?.match(/customer type (\w+)/)?.[1] || "unknown";
          setExistingAccountType(customerType);
          setShowMobileExistsPopup(true);
          setIsMobileValid(false);
          setMobileChecked(true);
          setMobileMessage(data.message);
          setMobileSuccessMessage("");
        } else {
          // Mobile is NEW - Store in session storage
          setIsMobileValid(true);
          setMobileChecked(true);
          setMobileError("");
          setShowMobileExistsPopup(false);
          setMobileSuccessMessage(data.message || "Mobile number verified successfully");
          setMobileMessage("");

          // 🔥 STORE MOBILE DATA
          saveRegistrationData({
            mobileNumber: mobileNumber,
            phoneCode: phoneCode,
            mobileVerified: true,
            selectedCountryId: selectedCountryId
          });
          setShowMobileSection(false);
        }
      } else {
        // Handle other status
        setIsMobileValid(true);
        setMobileChecked(true);
        setMobileError("");
        setShowMobileExistsPopup(false);
        setMobileSuccessMessage(data.message || "Mobile number verified");
        setMobileMessage("");

        // 🔥 STORE MOBILE DATA
        saveRegistrationData({
          mobileNumber: mobileNumber,
          phoneCode: phoneCode,
          mobileVerified: true,
          selectedCountryId: selectedCountryId
        });
        setShowMobileSection(false);
      }
    } catch (error) {
      console.error("Mobile verification error:", error);
      if (error.message?.includes("404")) {
        setIsMobileValid(true);
        setMobileChecked(true);
        setMobileError("");
        setShowMobileExistsPopup(false);
        setMobileSuccessMessage("Mobile number is available for registration");

        // 🔥 STORE MOBILE DATA
        saveRegistrationData({
          mobileNumber: mobileNumber,
          phoneCode: phoneCode,
          mobileVerified: true,
          selectedCountryId: selectedCountryId
        });
        setShowMobileSection(false);
      } else {
        setMobileError("Failed to verify mobile number. Please try again.");
        setIsMobileValid(false);
        setMobileChecked(false);
        setShowMobileExistsPopup(false);
      }
    } finally {
      setIsCheckingMobile(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailChecked) {
      setEmailChecked(false);
      setIsEmailValid(false);
      setEmailError("");
      setShowEmailExistsPopup(false);
      setExistingAccountType("");
      setEmailMessage("");
      setEmailSuccessMessage("");
      setShowEmailSection(true);
      setShowMobileSection(false);
    }
  };

  const handleMobileNumberChange = (e) => {
    setMobileNumber(e.target.value);
    if (mobileChecked) {
      setMobileChecked(false);
      setIsMobileValid(false);
      setMobileError("");
      setShowMobileExistsPopup(false);
      setMobileMessage("");
      setMobileSuccessMessage("");
      setMobileSuccessMessage("");
      setShowMobileSection(true);
    }
  };

  const handleCountrySelect = (countryOption) => {
    const country = {
      id: countryOption.value,
      label: countryOption.countryName,
      country_code: countryOption.country_code,
      flag_url: countryOption.flagUrl,
      phoneCode: countryOption.phoneCode,
    };

    if (selectedCountry?.id !== country.id) {
      setSelectedCountryState(country);
      dispatch(setSelectedCountry(country));

      // 🔥 STORE COUNTRY DATA
      saveRegistrationData({
        selectedCountry: country,
        selectedCountryId: country.id,
        phoneCode: country.phoneCode
      });

      // Also update the phone code for mobile verification if not already set
      if (!phoneCode) {
        setPhoneCode(country.phoneCode);
        setSelectedCountryId(country.id);
      }
    }
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  const handleClearSelection = () => {
    setSelectedCountryState(null);
    dispatch(setSelectedCountry(null));
    setIsDropdownOpen(true);

    // Clear stored country data
    const existingData = JSON.parse(sessionStorage.getItem('registrationData') || '{}');
    delete existingData.selectedCountry;
    delete existingData.selectedCountryId;
    sessionStorage.setItem('registrationData', JSON.stringify(existingData));
  };

  const handleContinue = () => {
    if (selectedCountry && isEmailValid && isMobileValid) {
      const countryData = {
        value: selectedCountry.id,
        label: selectedCountry.label,
        country_id: selectedCountry.id,
        country_code: selectedCountry.country_code,
        flag_url: selectedCountry.flag_url,
        phoneCode: selectedCountry.phoneCode,
      };

      // Get all stored data
      const storedData = JSON.parse(sessionStorage.getItem('registrationData') || '{}');

      const registrationData = {
        selectedCountry: countryData,
        accountType: accountType,
        email: email,
        emailVerified: isEmailValid,
        phone_code: phoneCode,
        mobile_number: mobileNumber,
        mobileVerified: isMobileValid,
        ...storedData // Include any other stored data
      };

      delete registrationData.mobile_number; // Remove if it's in storedData
      registrationData.mobile_number = mobileNumber; // Add the current one

      delete registrationData.phone_code;
      registrationData.phone_code = phoneCode;

      delete registrationData.mobileVerified;
      registrationData.mobileVerified = isMobileValid;

      // Final save before navigation
      saveRegistrationData(registrationData);

      navigate("/opencurrencyaccount", {
        state: registrationData,
      });
    }
  };

  const handleCancel = () => {
    navigate("/selectaccounttype");
  };

  const handleCloseEmailPopup = () => {
    setShowEmailExistsPopup(false);
  };

  const handleCloseMobilePopup = () => {
    setShowMobileExistsPopup(false);
  };

  // Filter countries for the dropdown
  const filteredCountries = countryOptions.filter((country) =>
    country.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if both verifications are complete
  const isVerificationComplete = isEmailValid && isMobileValid;

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-md mx-auto px-4 py-4 md:py-6 md:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 p-2 -ml-2 transition-colors active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-xs sm:text-sm text-gray-400">Step 2 of 4</div>
        </div>

        {/* Email Check Section */}
        {showEmailSection && (
          <div className="mb-6 md:mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Check your email</h3>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="you@example.com"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  disabled={isEmailValid}
                />
                <button
                  onClick={handleCheckEmail}
                  disabled={isCheckingEmail || isEmailValid}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap text-sm sm:text-base"
                >
                  {isCheckingEmail ? "Checking..." : "Check Email"}
                </button>
              </div>
            </div>

            {/* Show success message below input */}
            {emailSuccessMessage && (
              <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                ✓ {emailSuccessMessage}
              </div>
            )}

            {emailError && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                {emailError}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-3">
              Enter your email address to check if you have an existing account.
            </p>
          </div>
        )}

        {/* Email Verified Message - Show above mobile section */}
        {showMobileSection && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              ✅ Email checked! Now check your mobile number below.
            </p>
          </div>
        )}

        {/* Mobile Number Section */}
        {showMobileSection && (
          <div className="mb-6 md:mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Check your mobile number</h3>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Country Selector */}
                  <div className="w-full sm:w-1/2">
                    <Select
                      options={countryOptions}
                      value={currentCountryOption}
                      onChange={(option) => {
                        setSelectedCountryId(option.value);
                        setPhoneCode(option.phoneCode);
                      }}
                      placeholder="Select country"
                      isSearchable
                      classNamePrefix="react-select"
                      isDisabled={isMobileValid}
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          minHeight: "42px",
                          borderColor: mobileError ? "#f87171" : "#d1d5db",
                          "&:hover": {
                            borderColor: mobileError ? "#f87171" : "#9ca3af",
                          },
                        }),
                      }}
                      formatOptionLabel={(option) => (
                        <div className="flex items-center">
                          {option.flagUrl && (
                            <img
                              src={option.flagUrl}
                              alt={option.label}
                              className="w-5 h-4 object-cover mr-2"
                            />
                          )}
                          <span>{option.label}</span>
                        </div>
                      )}
                    />
                  </div>

                  {/* Mobile Number Input */}
                  <div className="w-full sm:w-1/2">
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={handleMobileNumberChange}
                      placeholder="Phone Number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      disabled={isMobileValid}
                    />
                  </div>
                </div>
                <button
                  onClick={handleCheckMobile}
                  disabled={isCheckingMobile || isMobileValid}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {isCheckingMobile ? "Checking..." : "Check Mobile No."}
                </button>
              </div>
            </div>

            {/* Show success message below input */}
            {mobileSuccessMessage && (
              <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                ✓ {mobileSuccessMessage}
              </div>
            )}

            {mobileError && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                {mobileError}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-3">
              Enter your mobile number to check if you have an existing account.
            </p>
          </div>
        )}

        {/* Email Exists Popup Modal */}
        {showEmailExistsPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 text-center mb-2">Email Already Exists</h3>
              <p className="text-sm sm:text-base text-gray-600 text-center mb-4">
                {emailMessage || `The email address ${email} is already registered.`}
              </p>

              {existingAccountType && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-center text-blue-800">
                    <span className="font-medium">Account Type:</span> {existingAccountType.charAt(0).toUpperCase() + existingAccountType.slice(1)}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowEmailExistsPopup(false);
                    setEmail("");
                    setIsEmailValid(false);
                    setEmailChecked(false);
                    setExistingAccountType("");
                    setEmailMessage("");
                    setEmailSuccessMessage("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Try Different Email
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Login
                </button>
              </div>
              <button onClick={handleCloseEmailPopup} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Exists Popup Modal */}
        {showMobileExistsPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 text-center mb-2">Mobile Number Already Exists</h3>
              <p className="text-sm sm:text-base text-gray-600 text-center mb-4">
                {mobileMessage || `The mobile number ${phoneCode} ${mobileNumber} is already registered.`}
              </p>

              {existingAccountType && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-center text-blue-800">
                    <span className="font-medium">Account Type:</span> {existingAccountType.charAt(0).toUpperCase() + existingAccountType.slice(1)}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowMobileExistsPopup(false);
                    setMobileNumber("");
                    setPhoneCode("");
                    setSelectedCountryId(null);
                    setIsMobileValid(false);
                    setMobileChecked(false);
                    setExistingAccountType("");
                    setMobileMessage("");
                    setMobileSuccessMessage("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Try Different Mobile
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Login
                </button>
              </div>
              <button onClick={handleCloseMobilePopup} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Country Selection Section - Only shown when both verifications are complete */}
        {isVerificationComplete && (
          <>
            {/* Success message */}
            <div className="text-center mb-4">
              <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                ✅ Email and mobile number checked successfully! Now select your country.
              </p>
            </div>

            {/* Content Header */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                Select your country
              </h1>
              <p className="text-sm sm:text-base text-gray-500">
                {accountType === "individual"
                  ? "Choose where you reside"
                  : accountType === "institution"
                    ? "Choose where your institution is registered"
                    : "Choose your country"}
              </p>
            </div>
            {/* Country Search Input */}
            <div className="mb-4">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>

            {/* Countries List */}
            {isDropdownOpen && !selectedCountry && (
              <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm" ref={dropdownRef}>
                <div className="max-h-[400px] overflow-y-auto">
                  {filteredCountries.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-gray-500">No countries found matching "{searchTerm}"</p>
                      <button onClick={() => setSearchTerm("")} className="mt-2 text-blue-500 hover:text-blue-600 text-sm">
                        Clear search
                      </button>
                    </div>
                  ) : (
                    filteredCountries.map((country, index) => (
                      <button
                        key={country.value}
                        onClick={() => handleCountrySelect(country)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-all duration-200 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          {country.flagUrl && (
                            <img
                              src={country.flagUrl}
                              alt={country.countryName}
                              className="w-8 h-6 rounded object-cover flex-shrink-0"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="24" viewBox="0 0 32 24"%3E%3Crect width="32" height="24" fill="%23f0f0f0"/%3E%3C/svg%3E';
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{country.countryName}</p>
                            <p className="text-sm text-gray-500">
                              {country.country_code} • {country.phoneCode}
                            </p>
                          </div>
                          {selectedCountry?.id === country.value && (
                            <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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

            {/* Selected Country Display */}
            {selectedCountry && (
              <div className="mb-6 animate-fadeIn">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={selectedCountry.flag_url}
                      alt={selectedCountry.label}
                      className="w-8 h-6 rounded object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="24" viewBox="0 0 32 24"%3E%3Crect width="32" height="24" fill="%23f0f0f0"/%3E%3C/svg%3E';
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{selectedCountry.label}</p>
                      <p className="text-sm text-gray-500">{selectedCountry.country_code} • {selectedCountry.phoneCode}</p>
                    </div>
                  </div>
                  <button onClick={handleClearSelection} className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Continue Button */}
            {selectedCountry && (
              <button
                onClick={handleContinue}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
              >
                Continue
              </button>
            )}

            {/* Hint */}
            {!selectedCountry && (
              <div className="text-center mt-6">
                <p className="text-xs sm:text-sm text-gray-400">
                  {searchTerm ? "Select a country from the list above to continue" : "Click on a country from the list above to continue"}
                </p>
              </div>
            )}
          </>
        )}

        {/* Verification Required Message */}
        {!isVerificationComplete && !showEmailExistsPopup && !showMobileExistsPopup && (
          <div className="text-center mt-6">
            <p className="text-xs sm:text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Please check both your email and mobile number to continue
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeInUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}

export default SelectCountry;