// BeneficiaryHomepage.js - FINAL OPTIMIZED VERSION
import React, { useCallback, useMemo } from "react";
import { useSelector, useDispatch, shallowEqual } from "react-redux";

// Components
import SharePopup from "../../../components/PopupModal/SharePopup";

// Hooks
import { useBeneficiaryHomepage } from "../Homepage/useBeneficiaryHomepage";

// Redux imports
import {
  // Selectors
  selectFormData,
  selectCurrencies,
  selectBeneficiaryData,
  selectTransactions,
  selectRequestStatus,
  selectSenders,
  selectSelectedSenders,
  selectIsLoading,
  selectCurrenciesLoading,
  selectTransactionsLoading,
  selectStatusLoading,
  selectSendersLoading,
  selectIsSubmitting,
  selectStats,
  selectTransactionStats,
  selectRequestRemitLink,
  selectCopySuccess,
  selectEmailForm,
  selectShowSharePopup,
  selectMessage,
  selectErrors,
  selectHasFetchedBeneficiary,
  selectUserEmail,
  selectBenefCode,

  // Actions
  setFormField,
  toggleSenderSelection,
  selectAllSenders,
  clearAllSenders,
  setBeneficiaryData,
  setMessage,
  clearMessage,
  setErrors,
  setCopySuccess,
  setEmailFormField,
  toggleSharePopup,
  resetForm,
  setUserEmail,

  // Async Thunks
  submitRemittanceRequest,
  fetchBeneficiaryHomepageData,
} from "./beneficiaryHomepageSlice";

// Utils
import { beneficiaryApi } from "../Homepage/beneficiaryApi";

function BeneficiaryHomepage() {
  const { urlBeneficiaryId, handleRefreshData } = useBeneficiaryHomepage();
  const dispatch = useDispatch();

  // Consolidate all Redux state with shallow equality check
  const {
    formData,
    currencies,
    beneficiaryData,
    transactions,
    requestStatus,
    senders,
    selectedSenders,
    isLoading,
    currenciesLoading,
    transactionsLoading,
    statusLoading,
    sendersLoading,
    isSubmitting,
    stats,
    transactionStats,
    requestRemitLink,
    copySuccess,
    emailForm,
    showSharePopup,
    message,
    errors,
    hasFetchedBeneficiary,
    userEmail,
    benefCode,
  } = useSelector(
    (state) => ({
      formData: state.beneficiaryHomepage.formData,
      currencies: state.beneficiaryHomepage.currencies,
      beneficiaryData: state.beneficiaryHomepage.beneficiaryData,
      transactions: state.beneficiaryHomepage.transactions,
      requestStatus: state.beneficiaryHomepage.requestStatus,
      senders: state.beneficiaryHomepage.senders,
      selectedSenders: state.beneficiaryHomepage.selectedSenders,
      isLoading: state.beneficiaryHomepage.isLoading,
      currenciesLoading: state.beneficiaryHomepage.currenciesLoading,
      transactionsLoading: state.beneficiaryHomepage.transactionsLoading,
      statusLoading: state.beneficiaryHomepage.statusLoading,
      sendersLoading: state.beneficiaryHomepage.sendersLoading,
      isSubmitting: state.beneficiaryHomepage.isSubmitting,
      stats: state.beneficiaryHomepage.stats,
      transactionStats: state.beneficiaryHomepage.transactionStats,
      requestRemitLink: state.beneficiaryHomepage.requestRemitLink,
      copySuccess: state.beneficiaryHomepage.copySuccess,
      emailForm: state.beneficiaryHomepage.emailForm,
      showSharePopup: state.beneficiaryHomepage.showSharePopup,
      message: state.beneficiaryHomepage.message,
      errors: state.beneficiaryHomepage.errors,
      hasFetchedBeneficiary: state.beneficiaryHomepage.hasFetchedBeneficiary,
      userEmail: state.beneficiaryHomepage.userEmail,
      benefCode: state.beneficiaryHomepage.benefCode,
    }),
    shallowEqual
  );

  // Memoize getAuthToken to prevent recreation
  const getAuthToken = useCallback(() => {
    const authtoken =
      localStorage.getItem("authtoken") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("bearerToken") ||
      sessionStorage.getItem("authtoken") ||
      sessionStorage.getItem("authToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("bearerToken");

    return authtoken;
  }, []);

  // Handler functions with useCallback to prevent recreation
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      dispatch(setFormField({ field: name, value }));

      if (errors[name]) {
        dispatch(setErrors({ ...errors, [name]: "" }));
      }
    },
    [dispatch, errors]
  );

  const handleEmailFormChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      dispatch(setEmailFormField({ field: name, value }));
    },
    [dispatch]
  );

  const handleSenderSelection = useCallback(
    (senderId) => {
      dispatch(toggleSenderSelection(senderId));
    },
    [dispatch]
  );

  const handleSelectAllSenders = useCallback(() => {
    dispatch(selectAllSenders());
  }, [dispatch]);

  const handleClearAllSenders = useCallback(() => {
    dispatch(clearAllSenders());
  }, [dispatch]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    if (!formData.currency) {
      newErrors.currency = "Currency is required";
    }

    if (!formData.beneficiary_bank_id) {
      newErrors.beneficiary_bank_id = "Bank account selection is required";
    }

    dispatch(setErrors(newErrors));
    return Object.keys(newErrors).length === 0;
  }, [formData, dispatch]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      try {
        const result = await dispatch(
          submitRemittanceRequest(formData)
        ).unwrap();

        if (result.success) {
          dispatch(
            setEmailFormField({
              field: "to",
              value: userEmail || "",
            })
          );
        }
      } catch (error) {
        console.error("Form submission error:", error);
      }
    },
    [dispatch, formData, validateForm, userEmail]
  );

  const handleSendAnother = useCallback(() => {
    dispatch(resetForm());
  }, [dispatch]);

  const copyToClipboard = useCallback(
    async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        dispatch(setCopySuccess(true));
        dispatch(
          setMessage({
            type: "success",
            text: "Copied to clipboard!",
          })
        );

        setTimeout(() => dispatch(setCopySuccess(false)), 3000);
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        dispatch(setCopySuccess(true));
        dispatch(
          setMessage({
            type: "success",
            text: "Copied to clipboard!",
          })
        );
        setTimeout(() => dispatch(setCopySuccess(false)), 3000);
      }
    },
    [dispatch]
  );

  const handleCopyLink = useCallback(() => {
    if (requestRemitLink) {
      copyToClipboard(requestRemitLink);
    }
  }, [requestRemitLink, copyToClipboard]);

  const sendEmailDirectly = useCallback(() => {
    if (!emailForm.to) {
      dispatch(
        setMessage({
          type: "error",
          text: "Please enter recipient email address",
        })
      );
      return;
    }

    const subject = encodeURIComponent(emailForm.subject);
    const body = encodeURIComponent(emailForm.message);
    const to = encodeURIComponent(emailForm.to);

    const mailtoLink = `mailto:${to}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;

    dispatch(
      setMessage({
        type: "success",
        text: "Email client opened with pre-filled message!",
      })
    );

    setTimeout(() => {
      dispatch(toggleSharePopup(false));
    }, 2000);
  }, [dispatch, emailForm]);

  // Memoize helper functions
  const getCurrencyDisplayText = useCallback((currency) => {
    if (!currency) return "Unknown";

    if (typeof currency === "string") return currency;

    if (currency.code && currency.name) {
      return `${currency.code} - ${currency.name}`;
    }

    if (currency.code) return currency.code;
    if (currency.currency) return currency.currency;

    if (typeof currency === "object") {
      const stringProps = Object.values(currency).filter(
        (val) => typeof val === "string"
      );
      return stringProps[0] || "Unknown Currency";
    }

    return String(currency);
  }, []);

  const getCurrencyValue = useCallback((currency) => {
    if (!currency) return "";

    if (typeof currency === "string") return currency;
    if (currency.code) return currency.code;
    if (currency.currency) return currency.currency;

    if (typeof currency === "object") {
      const stringProps = Object.values(currency).filter(
        (val) => typeof val === "string"
      );
      return stringProps[0] || "";
    }

    return String(currency);
  }, []);

  const getBankDisplayText = useCallback((bank) => {
    if (!bank) return "Unknown Bank";

    const bankName = bank.bank_name || bank.name || "Unknown Bank";
    const accountNo = bank.bank_acc_no || bank.account_number;

    if (accountNo) {
      return `${bankName} - ****${accountNo.slice(-4)}`;
    }

    return bankName;
  }, []);

  const getStatusDisplay = useCallback((status) => {
    const statusConfig = {
      completed: {
        text: "Completed",
        className: "bg-green-100 text-green-800 border border-green-200",
        icon: "check",
      },
      pending: {
        text: "Pending",
        className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        icon: "clock",
      },
      "processing-payout": {
        text: "Processing Payout",
        className: "bg-blue-100 text-blue-800 border border-blue-200",
        icon: "refresh",
      },
      processing: {
        text: "Processing",
        className: "bg-blue-100 text-blue-800 border border-blue-200",
        icon: "refresh",
      },
      failed: {
        text: "Failed",
        className: "bg-red-100 text-red-800 border border-red-200",
        icon: "x",
      },
      cancelled: {
        text: "Cancelled",
        className: "bg-gray-100 text-gray-800 border border-gray-200",
        icon: "ban",
      },
    };

    const normalizedStatus = status?.toLowerCase();
    const config = statusConfig[normalizedStatus] || {
      text: status || "Unknown",
      className: "bg-gray-100 text-gray-800 border border-gray-200",
      icon: "help",
    };

    const getStatusIcon = (iconName) => {
      const icons = {
        check: (
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ),
        clock: (
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        refresh: (
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        ),
        x: (
          <svg
            className="w-3 h-3 mr-1"
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
        ),
        ban: (
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        ),
        help: (
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      };
      return icons[iconName] || icons.help;
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
      >
        {getStatusIcon(config.icon)}
        {config.text}
      </span>
    );
  }, []);

  // Calculate loading state
  const showLoadingOverlay = !hasFetchedBeneficiary || isLoading;

  // Optimized refresh handler
  const handleOptimizedRefresh = useCallback(() => {
    if (urlBeneficiaryId) {
      // Clear cache for this beneficiary
      beneficiaryApi.clearCache(urlBeneficiaryId);

      // Refresh data
      dispatch(fetchBeneficiaryHomepageData(urlBeneficiaryId));
    }
  }, [urlBeneficiaryId, dispatch]);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Global Loading Overlay - Only show when data is not loaded */}
      {showLoadingOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Loading Dashboard
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Loading beneficiary information, transactions, and account data...
            </p>
            <div className="mt-4 flex justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Only show when data is loaded */}
      {hasFetchedBeneficiary && (
        <div className="flex-1 overflow-auto min-w-0">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-30">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    {localStorage.getItem("beneficiary_portal_title") ||
                      "Remittance Portal"}
                  </h1>
                </div>
                {urlBeneficiaryId && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      Beneficiary Code
                    </div>
                    <div className="text-sm font-mono font-semibold text-gray-900 truncate max-w-[120px]">
                      {benefCode || urlBeneficiaryId}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block w-full bg-red/80 backdrop-blur-sm border-b border-gray-200/60">
            <div className="hidden lg:block w-full bg-red/80 backdrop-blur-sm border-b border-gray-200/60">
              <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">
                    {localStorage.getItem("beneficiary_portal_title") ||
                      "Global Remittance Portal"}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          <div className="py-4 lg:py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {/* Authentication Warning */}
              {!getAuthToken() && (
                <div className="mb-6 lg:mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 lg:p-6 backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 lg:h-6 lg:w-6 text-amber-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 lg:ml-4">
                      <h3 className="text-sm font-semibold text-amber-800">
                        Authentication Required
                      </h3>
                      <div className="mt-1 text-sm text-amber-700">
                        <p>Please log in to access all enterprise features.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Grid - Only show when beneficiary data is loaded */}
              {hasFetchedBeneficiary && (
                <div className="mb-6 lg:mb-8">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4 lg:mb-6">
                    <div>
                      <h2 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center">
                        Performance Dashboard
                        <span className="ml-3 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium rounded-full shadow-lg">
                          Real-time
                        </span>
                      </h2>
                      <p className="text-gray-600 text-sm lg:text-base mt-1">
                        Overview of your remittance activities and performance
                        metrics
                      </p>
                    </div>
                    <button
                      onClick={handleOptimizedRefresh}
                      className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-gray-700 font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 group"
                    >
                      <svg
                        className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${
                          statusLoading || transactionsLoading
                            ? "animate-spin"
                            : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span className="text-sm">Refresh Data</span>
                    </button>
                  </div>

                  {/* Enhanced Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                    {/* Total Requests Card */}
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                      <div className="relative bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm rounded-2xl p-5 lg:p-6 border border-gray-200/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-blue-200/60">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <p className="text-gray-600 text-sm lg:text-base font-medium mb-1">
                              Total Requests
                            </p>
                            <p className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                              {stats.totalRequests}
                            </p>
                            <div className="flex items-center text-gray-500 text-xs">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              All requests
                            </div>
                          </div>
                          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                            <svg
                              className="w-6 h-6 lg:w-7 lg:h-7 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Trend Indicator */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-1 text-green-600 text-xs font-medium">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>Active</span>
                          </div>
                          <div className="text-gray-400 text-xs">
                            Since last month
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pending Review Card */}
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                      <div className="relative bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm rounded-2xl p-5 lg:p-6 border border-gray-200/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-amber-200/60">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <p className="text-gray-600 text-sm lg:text-base font-medium mb-1">
                              Pending Review
                            </p>
                            <p className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                              {stats.pendingRequests}
                            </p>
                            <div className="flex items-center text-gray-500 text-xs">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Needs attention
                            </div>
                          </div>
                          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                            <svg
                              className="w-6 h-6 lg:w-7 lg:h-7 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Alert Badge for Pending Items */}
                        {stats.pendingRequests > 0 && (
                          <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs font-medium border border-amber-200">
                              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                              <span>Action required</span>
                            </div>
                            <div className="text-amber-600 text-xs font-medium">
                              {stats.pendingRequests} items
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Completed Card */}
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                      <div className="relative bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm rounded-2xl p-5 lg:p-6 border border-gray-200/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-emerald-200/60">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <p className="text-gray-600 text-sm lg:text-base font-medium mb-1">
                              Completed
                            </p>
                            <p className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                              {stats.completedTransactions}
                            </p>
                            <div className="flex items-center text-gray-500 text-xs">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Successfully processed
                            </div>
                          </div>
                          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                            <svg
                              className="w-6 h-6 lg:w-7 lg:h-7 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Success Rate */}
                        {stats.totalRequests > 0 && (
                          <div className="pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-600 text-xs font-medium">
                                Success Rate
                              </span>
                              <span className="text-emerald-600 text-xs font-bold">
                                {Math.round(
                                  (stats.completedTransactions /
                                    stats.totalRequests) *
                                    100
                                )}
                                %
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-emerald-400 to-green-400 h-2 rounded-full transition-all duration-1000 ease-out"
                                style={{
                                  width: `${Math.round(
                                    (stats.completedTransactions /
                                      stats.totalRequests) *
                                      100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Total Processed Card */}
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                      <div className="relative bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm rounded-2xl p-5 lg:p-6 border border-gray-200/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-purple-200/60">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <p className="text-gray-600 text-sm lg:text-base font-medium mb-1">
                              Total Processed
                            </p>
                            <p className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                              ${stats.totalAmount.toLocaleString()}
                            </p>
                            <div className="flex items-center text-gray-500 text-xs">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                />
                              </svg>
                              Total volume
                            </div>
                          </div>
                          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                            <svg
                              className="w-6 h-6 lg:w-7 lg:h-7 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Growth Indicator */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-1 text-green-600 text-xs font-medium">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>Growing</span>
                          </div>
                          <div className="text-gray-400 text-xs">
                            All currencies
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Loading State */}
                  {(statusLoading || transactionsLoading) && (
                    <div className="mt-4 flex items-center justify-center space-x-2 text-gray-500 text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Updating dashboard data...</span>
                    </div>
                  )}
                </div>
              )}

              {/* TRANSACTIONS SECTION */}
              {hasFetchedBeneficiary && (
                <div className="bg-white rounded-2xl lg:rounded-3xl shadow-lg border border-gray-200 mb-6 lg:mb-8 overflow-hidden">
                  <div className="px-6 lg:px-8 py-6 lg:py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 lg:mb-8">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                          <svg
                            className="w-6 h-6 lg:w-7 lg:h-7 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center">
                            Transaction Analytics
                            <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-200">
                              Live
                            </span>
                          </h2>
                          <p className="text-gray-600 text-sm lg:text-base mt-1">
                            Real-time overview of your payment activities
                          </p>
                        </div>
                      </div>

                      {/* Refresh Button */}
                      <button
                        onClick={handleOptimizedRefresh}
                        className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-gray-700 font-medium transition-all duration-200 hover:shadow-md group"
                      >
                        <svg
                          className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${
                            transactionsLoading ? "animate-spin" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <span className="text-sm">Refresh</span>
                      </button>
                    </div>

                    {/* Stats Grid - 4 Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
                      {/* Total Transactions Card */}
                      <div className="bg-gray-50 rounded-2xl p-6 lg:p-8 border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-gray-700 text-base lg:text-lg font-semibold">
                            Total Transactions
                          </div>
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                          {transactionStats.totalTransactions}
                        </div>
                        <div className="flex items-center text-gray-600 text-sm mb-4">
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
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          All-time volume
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Progress</span>
                            <span className="font-medium">
                              {Math.round(
                                (transactionStats.totalTransactions /
                                  (transactionStats.totalTransactions || 1)) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: `${Math.round(
                                  (transactionStats.totalTransactions /
                                    (transactionStats.totalTransactions || 1)) *
                                    100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* In Progress Card */}
                      <div className="bg-gray-50 rounded-2xl p-6 lg:p-8 border border-gray-200 hover:border-amber-300 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-gray-700 text-base lg:text-lg font-semibold">
                            In Progress
                          </div>
                          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-amber-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                          {transactionStats.transactionsPending}
                        </div>
                        <div className="flex items-center text-gray-600 text-sm mb-4">
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
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Processing & Pending
                        </div>

                        {/* Detailed Status Breakdown */}
                        {transactions.length > 0 && (
                          <div className="space-y-3">
                            {(() => {
                              const statusCounts = transactions.reduce(
                                (acc, trans) => {
                                  const status = trans.status?.toLowerCase();
                                  acc[status] = (acc[status] || 0) + 1;
                                  return acc;
                                },
                                {}
                              );

                              const processingCount =
                                statusCounts["processing-payout"] ||
                                statusCounts["processing"] ||
                                0;
                              const pendingCount = statusCounts["pending"] || 0;

                              return (
                                <>
                                  {processingCount > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                      <div className="flex items-center space-x-2 text-blue-700">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>Processing Payout</span>
                                      </div>
                                      <span className="text-gray-900 font-semibold">
                                        {processingCount}
                                      </span>
                                    </div>
                                  )}
                                  {pendingCount > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                      <div className="flex items-center space-x-2 text-amber-700">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                        <span>Pending Review</span>
                                      </div>
                                      <span className="text-gray-900 font-semibold">
                                        {pendingCount}
                                      </span>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {/* Alert for Pending */}
                        {transactionStats.transactionsPending > 0 && (
                          <div className="mt-4 flex items-center space-x-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                            <span className="text-amber-800 text-sm font-medium">
                              {transactionStats.transactionsPending}{" "}
                              transaction(s) in progress
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Completed Transactions Card */}
                      <div className="bg-gray-50 rounded-2xl p-6 lg:p-8 border border-gray-200 hover:border-green-300 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-gray-700 text-base lg:text-lg font-semibold">
                            Completed
                          </div>
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                          {transactionStats.transactionsPaid}
                        </div>
                        <div className="flex items-center text-gray-600 text-sm mb-4">
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
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Successfully processed
                        </div>
                      </div>

                      {/* Failed Transactions Card */}
                      <div className="bg-gray-50 rounded-2xl p-6 lg:p-8 border border-gray-200 hover:border-red-300 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-gray-700 text-base lg:text-lg font-semibold">
                            Failed
                          </div>
                          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-red-600"
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
                          </div>
                        </div>
                        <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                          {transactionStats.transactionsFailed || 0}
                        </div>
                        <div className="flex items-center text-gray-600 text-sm mb-4">
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
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          Unsuccessful transactions
                        </div>

                        {/* Alert for Failed Transactions */}
                        {(transactionStats.transactionsFailed || 0) > 0 && (
                          <div className="mt-4 flex items-center space-x-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-red-800 text-sm font-medium">
                              {transactionStats.transactionsFailed || 0}{" "}
                              transaction(s) failed
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Legend */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-gray-600 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Completed</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Processing Payout</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                        <span>Pending</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Failed</span>
                      </div>
                    </div>

                    {/* Quick Actions Footer */}
                    <div className="mt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                      <div className="flex items-center space-x-6 text-gray-600 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span>Live updates</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span>Real-time data</span>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-gray-700 text-sm font-medium transition-all duration-200 hover:shadow-md">
                          Export Report
                        </button>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Loading Overlay */}
                  {transactionsLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <p className="text-gray-700 font-medium">
                          Updating transactions...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Column - Quick Transfer */}
                <div className="xl:col-span-1">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                    <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-200/60 bg-gradient-to-r from-gray-50 to-white">
                      <h3 className="text-base lg:text-lg font-semibold text-gray-900">
                        REQUEST PAYMENTS
                      </h3>
                      <p className="text-xs lg:text-sm text-gray-600 mt-1">
                        Create new remittance request
                      </p>
                    </div>
                    <div className="p-4 lg:p-6">
                      {/* Status Message */}
                      {message.text && (
                        <div
                          className={`rounded-xl p-3 lg:p-4 mb-4 lg:mb-6 backdrop-blur-sm ${
                            message.type === "error"
                              ? "bg-red-50/80 border border-red-200"
                              : "bg-emerald-50/80 border border-emerald-200"
                          }`}
                        >
                          <div
                            className={`text-sm font-medium ${
                              message.type === "error"
                                ? "text-red-800"
                                : "text-emerald-800"
                            }`}
                          >
                            {message.text}
                          </div>
                        </div>
                      )}

                      {/* Reset Beneficiary Button */}
                      {hasFetchedBeneficiary && (
                        <div className="mb-4 lg:mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-blue-900">
                                Beneficiary Information
                              </p>
                              {benefCode && (
                                <p className="text-lg font-bold text-blue-800 mt-1">
                                  Beneficiary Code: {benefCode}
                                </p>
                              )}
                              <p className="text-xs text-blue-600 mt-1">
                                Bank accounts loaded successfully
                              </p>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}

                      {senders.length > 0 && (
                        <div className="mb-4 lg:mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              Senders
                            </label>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={handleSelectAllSenders}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Select All
                              </button>
                              <button
                                type="button"
                                onClick={handleClearAllSenders}
                                className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                              >
                                Clear All
                              </button>
                            </div>
                          </div>

                          <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm">
                            {sendersLoading ? (
                              <div className="p-3 text-center text-gray-600 text-sm">
                                Loading senders...
                              </div>
                            ) : (
                              senders.map((sender) => (
                                <div
                                  key={sender.id}
                                  className={`flex items-center p-3 border-b border-gray-200 last:border-b-0 cursor-pointer transition-colors ${
                                    selectedSenders.includes(sender.id)
                                      ? "bg-blue-50 border-blue-200"
                                      : "hover:bg-gray-50"
                                  }`}
                                  onClick={() =>
                                    handleSenderSelection(sender.id)
                                  }
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedSenders.includes(
                                      sender.id
                                    )}
                                    onChange={() =>
                                      handleSenderSelection(sender.id)
                                    }
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <div className="ml-3 flex-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-gray-900">
                                        {sender.full_name}
                                      </span>
                                      {selectedSenders.includes(sender.id) && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                          Selected
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {sender.email} • {sender.phone}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {selectedSenders.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600">
                                {selectedSenders.length} sender(s) selected
                              </p>
                            </div>
                          )}

                          {senders.length === 0 && !sendersLoading && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              No senders available for this beneficiary
                            </div>
                          )}
                        </div>
                      )}

                      <form
                        onSubmit={handleSubmit}
                        className="space-y-4 lg:space-y-5"
                      >
                        {/* Bank Account Selection - Only show when beneficiary data is loaded */}
                        {hasFetchedBeneficiary && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Destination Account
                            </label>
                            <select
                              name="beneficiary_bank_id"
                              value={formData.beneficiary_bank_id}
                              onChange={handleChange}
                              className={`block w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl border bg-white/50 backdrop-blur-sm ${
                                errors.beneficiary_bank_id
                                  ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                                  : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              } focus:outline-none transition-all duration-200`}
                            >
                              <option value="">Select bank account</option>
                              {beneficiaryData?.benef_banks?.map((bank) => (
                                <option key={bank.id} value={bank.id}>
                                  {getBankDisplayText(bank)}
                                </option>
                              ))}
                            </select>
                            {errors.beneficiary_bank_id && (
                              <p className="mt-2 text-sm text-red-600 flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {errors.beneficiary_bank_id}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Amount and Currency - Only show when beneficiary data is loaded */}
                        {hasFetchedBeneficiary && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Amount
                              </label>
                              <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                min="1"
                                step="0.01"
                                className={`block w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl border bg-white/50 backdrop-blur-sm ${
                                  errors.amount
                                    ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                } focus:outline-none transition-all duration-200`}
                                placeholder="0.00"
                              />
                              {errors.amount && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {errors.amount}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Currency
                              </label>
                              <select
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                disabled={currenciesLoading}
                                className={`block w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl border bg-white/50 backdrop-blur-sm ${
                                  errors.currency
                                    ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                } focus:outline-none transition-all duration-200 disabled:bg-gray-100/50`}
                              >
                                <option value="">Select currency</option>
                                {currencies.map((currency, index) => (
                                  <option
                                    key={getCurrencyValue(currency) || index}
                                    value={getCurrencyValue(currency)}
                                  >
                                    {getCurrencyDisplayText(currency)}
                                  </option>
                                ))}
                              </select>
                              {errors.currency && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {errors.currency}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {hasFetchedBeneficiary && (
                          <button
                            type="submit"
                            disabled={
                              isSubmitting ||
                              !formData.beneficiary_bank_id ||
                              !getAuthToken()
                            }
                            className={`w-full py-3 lg:py-4 px-4 lg:px-6 rounded-lg lg:rounded-xl font-semibold text-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                              isSubmitting ||
                              !formData.beneficiary_bank_id ||
                              !getAuthToken()
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            }`}
                          >
                            {isSubmitting ? (
                              <div className="flex items-center justify-center text-sm lg:text-base">
                                <svg
                                  className="animate-spin -ml-1 mr-2 lg:mr-3 h-4 lg:h-5 w-4 lg:w-5 text-white"
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
                                Processing Request...
                              </div>
                            ) : !getAuthToken() ? (
                              "Authentication Required"
                            ) : (
                              <div className="flex items-center justify-center text-sm lg:text-base">
                                <svg
                                  className="w-4 lg:w-5 h-4 lg:h-5 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                  />
                                </svg>
                                Initiate Transfer
                              </div>
                            )}
                          </button>
                        )}
                      </form>

                      {/* Success Section with Enhanced Link Sharing */}
                      {requestRemitLink && (
                        <div className="mt-4 lg:mt-6 p-4 lg:p-6 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                          <div className="text-center">
                            <div className="mx-auto h-12 w-12 lg:h-16 lg:w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3 lg:mb-4 border border-emerald-200">
                              <svg
                                className="h-6 lg:h-8 w-6 lg:w-8 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                            <h4 className="text-base lg:text-lg font-semibold text-emerald-900 mb-2">
                              Transfer Initiated
                            </h4>
                            <p className="text-emerald-700 mb-3 lg:mb-4 text-xs lg:text-sm">
                              Your remittance request has been queued for
                              processing.
                            </p>

                            {/* Enhanced Link Section with Copy and Share */}
                            <div className="bg-white/80 rounded-lg lg:rounded-xl p-3 lg:p-4 mb-3 lg:mb-4 border border-emerald-200">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                  TRACKING LINK
                                </p>
                                <div className="flex items-center space-x-2">
                                  {/* Copy Button */}
                                  <button
                                    onClick={handleCopyLink}
                                    className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 p-1 rounded"
                                    title="Copy to clipboard"
                                  >
                                    {copySuccess ? (
                                      <>
                                        <svg
                                          className="w-3 h-3 lg:w-4 lg:h-4 mr-1 text-green-600"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                        <span className="text-green-600">
                                          Copied!
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <svg
                                          className="w-3 h-3 lg:w-4 lg:h-4 mr-1"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                          />
                                        </svg>
                                        Copy
                                      </>
                                    )}
                                  </button>

                                  {/* Share Button */}
                                  <button
                                    onClick={() =>
                                      dispatch(toggleSharePopup(true))
                                    }
                                    className="flex items-center text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors duration-200 p-1 rounded"
                                    title="Share via email"
                                  >
                                    <svg
                                      className="w-3 h-3 lg:w-4 lg:h-4 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                      />
                                    </svg>
                                    Email
                                  </button>
                                </div>
                              </div>
                              <a
                                href={requestRemitLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 break-all text-xs lg:text-sm font-mono font-medium underline block text-left"
                              >
                                {requestRemitLink}
                              </a>
                            </div>

                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                              <a
                                href={requestRemitLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex justify-center items-center px-3 lg:px-4 py-2 lg:py-3 border border-transparent text-xs lg:text-sm font-medium rounded-lg lg:rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                              >
                                <svg
                                  className="w-3 h-3 lg:w-4 lg:h-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                                Open Link
                              </a>
                              <button
                                onClick={handleSendAnother}
                                className="flex-1 inline-flex justify-center items-center px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 text-xs lg:text-sm font-medium rounded-lg lg:rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                              >
                                <svg
                                  className="w-3 h-3 lg:w-4 lg:h-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                                New Request
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Status and Transactions - Only show when beneficiary data is loaded */}
                {hasFetchedBeneficiary && (
                  <div className="xl:col-span-2 space-y-6 lg:space-y-8">
                    {/* Request Status Section */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                      <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-200/60 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                        <div>
                          <h3 className="text-base lg:text-lg font-semibold text-gray-900">
                            Request Status
                          </h3>
                          <p className="text-xs lg:text-sm text-gray-600 mt-1">
                            Recent remittance requests
                          </p>
                        </div>
                        <button
                          onClick={handleOptimizedRefresh}
                          className="flex items-center text-xs lg:text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                        >
                          <svg
                            className="w-3 h-3 lg:w-4 lg:h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Refresh
                        </button>
                      </div>
                      <div className="p-4 lg:p-6">
                        {statusLoading ? (
                          <div className="text-center py-6 lg:py-8">
                            <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-2 text-sm lg:text-base font-medium">
                              Loading requests...
                            </p>
                          </div>
                        ) : requestStatus.length > 0 ? (
                          <div className="space-y-3 lg:space-y-4">
                            {requestStatus.map((request) => (
                              <div
                                key={request.id}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 lg:p-4 border border-gray-200/60 rounded-lg lg:rounded-xl bg-white/50 backdrop-blur-sm hover:shadow-md transition-all duration-200"
                              >
                                <div className="flex items-center space-x-3 lg:space-x-4 mb-2 sm:mb-0">
                                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                                    <svg
                                      className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 text-sm lg:text-base">
                                      {request.id}
                                    </p>
                                    <p className="text-xs lg:text-sm text-gray-600">
                                      {request.amount} {request.currency}
                                    </p>
                                  </div>
                                </div>
                                <div className="sm:text-right">
                                  {getStatusDisplay(request.status)}
                                  <p className="text-xs text-gray-500 mt-1 lg:mt-2 font-medium">
                                    {request.created_at
                                      ? new Date(
                                          request.created_at
                                        ).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })
                                      : "N/A"}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 lg:py-8">
                            <div className="mx-auto h-12 w-12 lg:h-16 lg:w-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 lg:mb-4">
                              <svg
                                className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
                              No requests found
                            </h3>
                            <p className="text-gray-600 mb-4 text-sm lg:text-base">
                              Create your first remittance request to get
                              started.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Transactions Section */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                      <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-200/60 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                        <div>
                          <h3 className="text-base lg:text-lg font-semibold text-gray-900">
                            Transaction History
                          </h3>
                          <p className="text-xs lg:text-sm text-gray-600 mt-1">
                            Recent completed transactions
                          </p>
                        </div>
                        <button
                          onClick={handleOptimizedRefresh}
                          className="flex items-center text-xs lg:text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                        >
                          <svg
                            className="w-3 h-3 lg:w-4 lg:h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Refresh
                        </button>
                      </div>
                      <div className="p-4 lg:p-6">
                        {transactionsLoading ? (
                          <div className="text-center py-6 lg:py-8">
                            <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-2 text-sm lg:text-base font-medium">
                              Loading transactions...
                            </p>
                          </div>
                        ) : transactions.length > 0 ? (
                          <div className="space-y-3 lg:space-y-4">
                            {transactions.map((transaction) => (
                              <div
                                key={transaction.id}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 lg:p-4 border border-gray-200/60 rounded-lg lg:rounded-xl bg-white/50 backdrop-blur-sm hover:shadow-md transition-all duration-200"
                              >
                                <div className="flex items-center space-x-3 lg:space-x-4 mb-2 sm:mb-0">
                                  <div
                                    className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center ${
                                      transaction.direction === "Inbound"
                                        ? "bg-gradient-to-br from-green-100 to-green-200"
                                        : "bg-gradient-to-br from-blue-100 to-blue-200"
                                    }`}
                                  >
                                    <svg
                                      className={`w-4 h-4 lg:w-5 lg:h-5 ${
                                        transaction.direction === "Inbound"
                                          ? "text-green-600"
                                          : "text-blue-600"
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      {transaction.direction === "Inbound" ? (
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      ) : (
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                        />
                                      )}
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 text-sm lg:text-base">
                                      {transaction.id}
                                    </p>
                                    <p className="text-xs lg:text-sm text-gray-600">
                                      {transaction.amount}{" "}
                                      {transaction.currency}
                                    </p>
                                    {transaction.fee_amount &&
                                      parseFloat(transaction.fee_amount) >
                                        0 && (
                                        <p className="text-xs text-gray-500">
                                          Fee: {transaction.fee_amount}
                                        </p>
                                      )}
                                  </div>
                                </div>
                                <div className="sm:text-right">
                                  {getStatusDisplay(transaction.status)}
                                  <p className="text-xs text-gray-500 mt-1 lg:mt-2 font-medium">
                                    {transaction.created_at
                                      ? new Date(
                                          transaction.created_at
                                        ).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })
                                      : "N/A"}
                                  </p>
                                  {transaction.direction && (
                                    <p className="text-xs text-gray-500 mt-1 font-medium">
                                      {transaction.direction}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 lg:py-8">
                            <div className="mx-auto h-12 w-12 lg:h-16 lg:w-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 lg:mb-4">
                              <svg
                                className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                />
                              </svg>
                            </div>
                            <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
                              No transactions yet
                            </h3>
                            <p className="text-gray-600 text-sm lg:text-base">
                              Completed transactions will appear here.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Popup */}
      <SharePopup
        isOpen={showSharePopup}
        onClose={() => dispatch(toggleSharePopup(false))}
        requestRemitLink={requestRemitLink}
        emailForm={emailForm}
        onEmailFormChange={handleEmailFormChange}
        onEmailSend={sendEmailDirectly}
        onCopyLink={handleCopyLink}
      />
    </div>
  );
}

export default BeneficiaryHomepage;
