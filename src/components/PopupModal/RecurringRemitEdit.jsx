// RecurringRemitEdit.jsx - UPDATED WITH CURRENCY FETCHING

import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

// Import from BeneficiariesSlice
import {
  fetchBeneficiaries,
  selectBeneficiaries,
  selectBeneficiariesLoading,
  selectHasFetched,
} from "../../page/Beneficiary/MyBeneficiaries/BeneficiariesSlice";

// Import from RemittanceSlice for currencies
import {
  fetchBankAccounts,
  fetchPayoutCurrencies,
} from "../../page/Remittance/slices/remittanceSlice";

// --- SUB-COMPONENTS ---
const ReadOnlyField = ({
  label,
  value,
  prefix = "",
  suffix = "",
  className = "",
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-600 mb-1">
      {label}
    </label>
    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-700">
      {prefix && <span className="mr-1 text-gray-500">{prefix}</span>}
      <span className="font-medium">{value || "N/A"}</span>
      {suffix && <span className="ml-1 text-gray-500">{suffix}</span>}
    </div>
  </div>
);

const EditableField = ({
  label,
  name,
  value,
  type = "text",
  placeholder = "",
  prefix = "",
  children,
  required = false,
  className = "",
  inputClassName = "",
  showCustomDaysNote = false,
  onChange,
  errors,
  isLoading,
  isFetching,
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          {prefix}
        </span>
      )}
      {children || (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 transition-all duration-200 ${inputClassName} ${
            errors[name]
              ? "border-red-300 focus:ring-red-200"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
          } ${prefix ? "pl-10" : "pl-3"}`}
          placeholder={placeholder}
          disabled={isLoading || isFetching}
          autoComplete="off"
        />
      )}
    </div>
    {errors[name] && (
      <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
    )}
    {showCustomDaysNote && (
      <p className="text-xs text-gray-500 mt-1">
        For "specific_day": Day of month (1-31). For "custom": Number of days
        between executions.
      </p>
    )}
  </div>
);

const SuccessOverlay = ({ show, message, onClose }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-12 w-12 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="mb-3 text-2xl font-bold text-gray-900">Success!</h3>
        <p className="mb-6 text-gray-600 text-lg">{message}</p>
        <button
          onClick={onClose}
          className="rounded-xl bg-green-600 px-8 py-3 text-white font-medium hover:bg-green-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const ErrorOverlay = ({ show, error, onClose, onCancel }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-12 w-12 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h3 className="mb-3 text-2xl font-bold text-gray-900">Error</h3>
        <p className="mb-6 text-gray-600 text-lg">{error}</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onClose}
            className="rounded-xl bg-red-600 px-8 py-3 text-white font-medium hover:bg-red-700"
          >
            Try Again
          </button>
          <button
            onClick={onCancel}
            className="rounded-xl border bg-white px-8 py-3 text-gray-700 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const RecurringRemitEdit = ({
  isOpen,
  onClose,
  onSave,
  recurringRemittanceId,
  customerId,
}) => {
  const dispatch = useDispatch();

  // Redux selectors for beneficiaries
  const beneficiariesFromStore = useSelector(selectBeneficiaries);
  const beneficiariesLoading = useSelector(selectBeneficiariesLoading);
  const beneficiariesHasFetched = useSelector(selectHasFetched);

  // Redux selectors for currencies
  const sourceCurrencies = useSelector(
    (state) => state.remittance?.bankAccounts || [],
  );
  const destinationCurrencies = useSelector(
    (state) => state.remittance?.currencies?.receiveOptions || [],
  );

  const [formData, setFormData] = useState({
    source_amount: "",
    source_currency: "",
    destination_currency: "",
    recurring_frequency: "specific_day",
    custom_days: "5",
    author_type: "customer",
    author_id: "",
    author_source: "zap",
    amount: "",
    activeStatus: "Y",
    nextDate: "",
    frequency: "monthly",
    payment_method: "Bank",
    beneficiary_name: "",
    beneficiary_bank_account_number: "",
    notes: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // Get customer ID from multiple sources
  const getEffectiveCustomerId = useCallback(() => {
    // ✅ Priority: prop > customerUuid > authcustomer_id > currentCustomerId
    const id =
      customerId ||
      localStorage.getItem("customerUuid") ||
      localStorage.getItem("authcustomer_id") ||
      localStorage.getItem("currentCustomerId");

    if (!id || id === "undefined" || id === "null" || id.trim() === "") {
      console.warn("No valid customer ID found in RecurringRemitEdit");
      return null;
    }

    console.log("Using customer ID in EditModal:", id);
    return id;
  }, [customerId]);

  const effectiveCustomerId = getEffectiveCustomerId();

  // Fetch all required data when modal opens
  useEffect(() => {
    const fetchAllData = async () => {
      if (!isOpen || dataFetchAttempted) return;
      setDataFetchAttempted(true);

      try {
        // Fetch beneficiaries if needed
        if (!beneficiariesHasFetched || beneficiariesFromStore.length === 0) {
          await dispatch(fetchBeneficiaries(effectiveCustomerId));
        }

        // Fetch source currencies (bank accounts) if needed
        if (sourceCurrencies.length === 0) {
          await dispatch(fetchBankAccounts(effectiveCustomerId));
        }

        // Fetch destination currencies (payout currencies) if needed
        if (destinationCurrencies.length === 0) {
          await dispatch(fetchPayoutCurrencies());
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setApiError("Failed to load required data. Please try again.");
      }
    };

    if (isOpen && effectiveCustomerId) {
      fetchAllData();
    }
  }, [
    isOpen,
    dispatch,
    effectiveCustomerId,
    beneficiariesHasFetched,
    beneficiariesFromStore.length,
    sourceCurrencies.length,
    destinationCurrencies.length,
    dataFetchAttempted,
  ]);

  // Find beneficiary name from Redux store
  const findBeneficiaryName = useCallback(
    (beneficiaryName, accountNumber) => {
      if (!beneficiariesFromStore.length) return;

      const foundBeneficiary = beneficiariesFromStore.find(
        (b) =>
          b.benef_bank_account_number === accountNumber ||
          b.benef_name === beneficiaryName ||
          b.name === beneficiaryName,
      );

      if (foundBeneficiary) {
        setFormData((prev) => ({
          ...prev,
          beneficiary_name:
            foundBeneficiary.benef_name || foundBeneficiary.name,
          beneficiary_bank_account_number:
            foundBeneficiary.benef_bank_account_number || accountNumber,
        }));
      }
    },
    [beneficiariesFromStore],
  );

  // Fetch recurring remittance details
  const fetchDetails = useCallback(async () => {
    if (
      !isOpen ||
      !recurringRemittanceId ||
      recurringRemittanceId === "undefined"
    ) {
      console.warn("Cannot fetch details: No valid recurring remittance ID");
      return;
    }

    setIsFetching(true);
    setApiError("");
    try {
      const authToken =
        localStorage.getItem("bearertoken") ||
        localStorage.getItem("authtoken");
      if (!authToken) {
        throw new Error("No authentication token found");
      }

      const url = `${API_URL}/recurring-remittance/detail/${recurringRemittanceId}`;
      console.log("Fetching recurring remittance details:", url);

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 10000,
      });

      if (response.data.status === "success" && response.data.data?.[0]) {
        const item = response.data.data[0];
        setFormData((prev) => ({
          ...prev,
          source_amount: item.source_amount || "",
          source_currency: item.source_currency || "",
          destination_currency: item.destination_currency || "",
          recurring_frequency: item.frequency || "specific_day",
          custom_days: item.custom_days?.toString() || "5",
          author_id: effectiveCustomerId || "",
          amount: item.amount || "",
          activeStatus: item.activeStatus || "Y",
          nextDate: item.nextDate || "",
          frequency: item.frequency || "monthly",
          payment_method: item.payment_method || "Bank",
          beneficiary_name: item.beneficiary_name || "",
          beneficiary_bank_account_number:
            item.beneficiary_bank_account_number || "",
          notes: item.notes || "",
        }));

        findBeneficiaryName(
          item.beneficiary_name,
          item.beneficiary_bank_account_number,
        );
      } else {
        throw new Error(response.data.message || "Failed to fetch details");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setApiError(error.message || "Failed to fetch details.");
    } finally {
      setIsFetching(false);
    }
  }, [
    isOpen,
    recurringRemittanceId,
    API_URL,
    effectiveCustomerId,
    findBeneficiaryName,
  ]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormTouched(true);
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.source_amount || isNaN(parseFloat(formData.source_amount)))
      newErrors.source_amount = "Valid source amount is required";
    if (formData.recurring_frequency === "specific_day") {
      const dayNum = parseInt(formData.custom_days);
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 31)
        newErrors.custom_days = "Day must be between 1 and 31";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formTouched) {
      onClose();
      return;
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setApiError("");
    try {
      const authToken =
        localStorage.getItem("bearertoken") ||
        localStorage.getItem("authtoken");
      if (!authToken) {
        throw new Error("No authentication token found");
      }

      const payload = {
        recurring_remittance_id: recurringRemittanceId,
        source_amount: formData.source_amount,
        source_currency: formData.source_currency,
        destination_currency: formData.destination_currency,
        recurring_frequency: formData.recurring_frequency,
        custom_days: formData.custom_days,
        author_type: "customer",
        author_id: effectiveCustomerId,
        author_source: "zap",
      };

      console.log("Submitting update:", payload);

      const res = await axios.post(
        `${API_URL}/recurring-remittance/update-detail`,
        payload,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: 15000,
        },
      );

      if (res.data.status === "success") {
        setSuccessMessage(res.data.message || "Updated successfully!");
        setShowSuccessOverlay(true);
        if (onSave) onSave(payload);
      } else {
        throw new Error(res.data.message || "Update failed");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setApiError(
        err.response?.data?.message || err.message || "An error occurred",
      );
      setShowErrorOverlay(true);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  if (!recurringRemittanceId || recurringRemittanceId === "undefined") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-full max-w-md rounded-xl bg-white p-8 shadow-2xl text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="mb-3 text-xl font-bold text-gray-900">
            Invalid Remittance ID
          </h3>
          <p className="mb-6 text-gray-600">
            Cannot load recurring remittance details. Please try again.
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-8 py-3 text-white font-medium hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SuccessOverlay
        show={showSuccessOverlay}
        message={successMessage}
        onClose={() => {
          setShowSuccessOverlay(false);
          onClose();
        }}
      />
      <ErrorOverlay
        show={showErrorOverlay}
        error={apiError}
        onClose={() => setShowErrorOverlay(false)}
        onCancel={() => {
          setShowErrorOverlay(false);
          onClose();
        }}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50"
          onClick={!isLoading ? onClose : undefined}
        />
        <div
          className={`relative w-full max-w-2xl rounded-xl bg-white shadow-2xl ${showErrorOverlay || showSuccessOverlay ? "blur-sm" : ""}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isFetching ? "Loading..." : "Edit Recurring Remittance"}
              </h2>
              <p className="text-sm text-gray-500 font-mono">
                ID: {recurringRemittanceId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5">
            {isFetching ? (
              <div className="flex flex-col items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <span className="mt-4 text-gray-600">Loading details...</span>
              </div>
            ) : (
              <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
                {/* Transaction Info */}
                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4z" />
                    </svg>
                    Transaction Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <EditableField
                      label="Source Amount"
                      name="source_amount"
                      value={formData.source_amount}
                      onChange={handleChange}
                      errors={errors}
                      required
                      isLoading={isLoading}
                      isFetching={isFetching}
                    />
                    <ReadOnlyField
                      label="Destination Amount"
                      value={formData.amount}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                    {/* Source Currency - Dynamic from API */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Source Currency *
                      </label>
                      <select
                        name="source_currency"
                        value={formData.source_currency}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading || isFetching}
                      >
                        <option value="">Select Currency</option>
                        {sourceCurrencies.map((account) => (
                          <option
                            key={account.id}
                            value={account.currency_code}
                          >
                            {account.currency_code} -{" "}
                            {account.bank_name || account.currency_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Destination Currency - Dynamic from API */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Destination Currency *
                      </label>
                      <select
                        name="destination_currency"
                        value={formData.destination_currency}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading || isFetching}
                      >
                        <option value="">Select Currency</option>
                        {destinationCurrencies.map((currency) => (
                          <option
                            key={currency.payout_currency_id}
                            value={currency.currency_code}
                          >
                            {currency.currency_code} {currency.icon}
                            {currency.default_remittance === "Y" &&
                              " (Default)"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Schedule Info */}
                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Schedule Information
                  </h3>
                  <div className="grid grid-cols-2 gap-5">
                    <ReadOnlyField
                      label="Next Execution"
                      value={formatDateForDisplay(formData.nextDate)}
                    />
                    <ReadOnlyField
                      label="Current Frequency"
                      value={formData.frequency}
                    />
                  </div>
                  <div className="mt-4">
                    <EditableField
                      label="Recurring Frequency"
                      name="recurring_frequency"
                      errors={errors}
                    >
                      <select
                        name="recurring_frequency"
                        value={formData.recurring_frequency}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2.5 bg-white"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="specific_day">
                          Specific Day of Month
                        </option>
                        <option value="custom">Custom Interval</option>
                      </select>
                    </EditableField>
                  </div>
                  {(formData.recurring_frequency === "custom" ||
                    formData.recurring_frequency === "specific_day") && (
                    <div className="mt-4">
                      <EditableField
                        label="Day / Interval"
                        name="custom_days"
                        value={formData.custom_days}
                        onChange={handleChange}
                        errors={errors}
                        showCustomDaysNote
                      />
                    </div>
                  )}
                </div>

                {/* Beneficiary */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Beneficiary Information
                  </h3>
                  <div className="grid grid-cols-2 gap-5">
                    <ReadOnlyField
                      label="Name"
                      value={formData.beneficiary_name}
                    />
                    <ReadOnlyField
                      label="Account"
                      value={formData.beneficiary_bank_account_number}
                    />
                  </div>
                </div>

                {/* Author Information */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Author Information
                  </h3>
                  <div className="grid grid-cols-3 gap-5">
                    <ReadOnlyField label="Type" value={formData.author_type} />
                    <ReadOnlyField
                      label="ID"
                      value={effectiveCustomerId || "N/A"}
                    />
                    <ReadOnlyField
                      label="Source"
                      value={formData.author_source}
                    />
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Notes
                  </h3>
                  <div className="w-full bg-gray-50 border rounded-lg p-3 text-sm text-gray-500 italic min-h-[60px]">
                    {formData.notes || "No notes available"}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t mt-8 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                disabled={isLoading || isFetching}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
                disabled={isLoading || isFetching || !formTouched}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RecurringRemitEdit;
