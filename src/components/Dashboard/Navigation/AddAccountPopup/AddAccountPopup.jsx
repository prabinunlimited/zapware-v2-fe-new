// src/components/Dashboard/Navigation/AddAccountPopup/AddAccountPopup.jsx

import React, { useState, useEffect, useRef } from "react";
import { X, Loader, ChevronDown, Check } from "lucide-react";
import PropTypes from "prop-types";
import api from "../../../../services/api";
import { useSelector } from "react-redux";
import { selectAuthToken } from "../../../../store/selectors";

const AddAccountPopup = ({ isOpen, onClose, customerId, partnerId, onSuccess }) => {
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);

  const authToken = useSelector(selectAuthToken);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch currencies when popup opens
  useEffect(() => {
    if (isOpen && customerId) {
      fetchCurrencies();
      setSelectedCurrencies([]);
      setIsDropdownOpen(true);
      setSuccess(false);
      setSuccessMessage("");
      setFetchError(null);
      setSubmitError(null);
    }
  }, [isOpen, customerId]);

  const fetchCurrencies = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const partnerUuid = localStorage.getItem("partner_uuid");
      const customerUuid = localStorage.getItem("customer_uuid");
      const customerType = localStorage.getItem("customer_type");

      const response = await api.get(
        `/partners/add-bank-account-currencies/${partnerUuid}/${customerType}/${customerUuid}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.data && response.data.data) {
        const currencyData = response.data.data.map((item) => ({
          id: item.currency_id,
          code: item.currency_code,
          accountType: item.account_type,
          serviceProviderId: item.service_provider_id,
          chargesAndFeesUrl: item.chargesAndFeesUrl,
          displayText: `${item.currency_code} - ${item.account_type}`
        }));
        setCurrencies(currencyData);
      } else {
        setFetchError("No currencies available");
      }
    } catch (err) {
      console.error("Error fetching currencies:", err);
      setFetchError(err.response?.data?.message || "Failed to load currencies");
    } finally {
      setLoading(false);
    }
  };

  const toggleCurrency = (currencyId) => {
    setSelectedCurrencies((prev) => {
      if (prev.includes(currencyId)) {
        return prev.filter((id) => id !== currencyId);
      } else {
        return [...prev, currencyId];
      }
    });
  };

  const removeCurrency = (currencyId) => {
    setSelectedCurrencies((prev) => prev.filter((id) => id !== currencyId));
  };

  const handleSubmit = async () => {
    if (selectedCurrencies.length === 0) {
      setSubmitError("Please select at least one currency");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSuccess(false);
    setSuccessMessage("");

    try {
      const customerUuid = localStorage.getItem("customer_uuid");

      const bankAccounts = selectedCurrencies.map((id) => {
        const currency = currencies.find((c) => c.id === id);
        return `${currency.code}-${currency.accountType}`;
      });

      const payload = {
        bank_accounts: bankAccounts,
        updated_source: "zap",
        updated_user_type: "customer",
        updated_user_uuid: customerUuid
      };

      const response = await api.post(
        `/customers/add-bank-accounts/${customerUuid}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.data && response.data.status === "success") {
        setSuccess(true);
        setSuccessMessage(response.data.message || "Bank Accounts added successfully!");

        setTimeout(() => {
          onClose();
          setSelectedCurrencies([]);
          setSuccess(false);
          setSuccessMessage("");
          if (onSuccess) {
            onSuccess();
          }
        }, 2000);
      } else {
        setSubmitError(response.data?.message || "Failed to add accounts");
      }
    } catch (err) {
      console.error("Error adding accounts:", err);
      if (err.response && err.response.data) {
        setSubmitError(err.response.data.message || "Failed to add accounts");
      } else {
        setSubmitError("Network error. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setSelectedCurrencies([]);
      setFetchError(null);
      setSubmitError(null);
      setSuccess(false);
      setSuccessMessage("");
      setIsDropdownOpen(false);
      onClose();
    }
  };

  const getSelectedCurrency = (id) => {
    return currencies.find((c) => c.id === id);
  };

  const getSelectedDisplayText = () => {
    if (selectedCurrencies.length === 0) return "Select currencies...";

    const selectedNames = selectedCurrencies.map((id) => {
      const currency = getSelectedCurrency(id);
      return currency ? currency.code : null;
    }).filter(Boolean);

    return selectedNames.join(", ");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[600px] h-[70vh]">
        {/* Header - Fixed height */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Add More Accounts
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Select currencies to add bank accounts
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body - Takes remaining space */}
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="mt-4 text-gray-600">Loading currencies...</p>
            </div>
          ) : fetchError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 h-full flex flex-col items-center justify-center">
              <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
              <p className="text-red-600 text-center text-base">{fetchError}</p>
              <button
                onClick={fetchCurrencies}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Retry
              </button>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600 text-center">{successMessage}</p>
            </div>
          ) : (
            <div className="space-y-4 h-full flex flex-col">
              {/* Inline submit error banner */}
              {submitError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 flex-shrink-0">
                  <p className="text-red-600 text-sm flex-1">{submitError}</p>
                  <button
                    onClick={() => setSubmitError(null)}
                    className="text-red-400 hover:text-red-600 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Dropdown Selector */}
              <div className="relative flex-shrink-0" ref={dropdownRef}>
                <div
                  className="flex items-center justify-between p-4 border-2 border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 transition-colors bg-white min-h-[56px]"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={`text-base font-medium ${selectedCurrencies.length > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                    {getSelectedDisplayText()}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* Dropdown Options */}
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-[200px] overflow-y-auto">
                    {currencies.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        No currencies available
                      </div>
                    ) : (
                      <div className="py-1">
                        {currencies.map((currency) => {
                          const isSelected = selectedCurrencies.includes(currency.id);
                          return (
                            <div
                              key={currency.id}
                              onClick={() => toggleCurrency(currency.id)}
                              className={`
                                flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors
                                ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}
                                border-b border-gray-100 last:border-b-0
                              `}
                            >
                              <div>
                                <p className={`font-medium text-base ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                  {currency.displayText}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Currencies Tags */}
              {selectedCurrencies.length > 0 && (
                <div className="space-y-2 flex-shrink-0">
                  <p className="text-sm font-medium text-gray-700">Selected Currencies:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCurrencies.map((id) => {
                      const currency = getSelectedCurrency(id);
                      return currency ? (
                        <div
                          key={id}
                          className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                        >
                          <span className="text-sm font-medium text-blue-700">
                            {currency.displayText}
                          </span>
                          <button
                            onClick={() => removeCurrency(id)}
                            className="text-blue-500 hover:text-blue-700 transition-colors ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Spacer to push content up */}
              <div className="flex-1"></div>
            </div>
          )}
        </div>

        {/* Footer - Fixed height at bottom */}
        {!success && !fetchError && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-5 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="text-sm text-gray-500 order-2 sm:order-1">
              {selectedCurrencies.length > 0 && (
                <span>{selectedCurrencies.length} currency{selectedCurrencies.length > 1 ? 's' : ''} selected</span>
              )}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
              <button
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 sm:flex-none px-4 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || submitting || selectedCurrencies.length === 0}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  `Add Accounts`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

AddAccountPopup.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customerId: PropTypes.string.isRequired,
  partnerId: PropTypes.string,
  onSuccess: PropTypes.func,
};

export default AddAccountPopup;