// CurrencySelectAccount.jsx (Redux Version)
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faTimes,
  faCheckCircle,
  faInfoCircle,
  faChevronDown,
  faChevronUp,
  faMoneyBillWave,
  faGlobe,
  faBuilding,
  faHandshake,
  faExclamationTriangle,
  faSyncAlt,
  faFileAlt,
  faPoundSign,
  faEuroSign,
  faDollarSign,
  faSearch,
  faUser,
  faUsers,
  faPercent,
  faClock,
  faShieldAlt,
  faExchangeAlt,
  faFilter,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { RingLoader } from "react-spinners";
import PropTypes from "prop-types";

import RegistrationLayout from "../../../../components/ProgressBar/RegistrationLayout";
import ProgressBar from "../../../../components/ProgressBar/ProgressBar";
import useCurrentStep from "../../../../components/ProgressBar/useCurrentStep";

// Import Redux actions and selectors
import {
  fetchAccountOptions,
  fetchTermsContent,
  setReferralCode,
  setTermsAccepted,
  setSearchTerm,
  setActiveTab,
  setRemittanceOnlyAccepted,
  setTermsModalOpen,
  toggleAccountSelection,
  clearError,
  setSelectedAccounts,
} from "./currencyAccountsSlice";
import {
  selectAccountOptions,
  selectNamedAccounts,
  selectPooledAccounts,
  selectUcaDescription,
  selectSelectedAccounts,
  selectReferralCode,
  selectReferralError,
  selectLoading,
  selectTermsText,
  selectTermsAccepted,
  selectApiError,
  selectTermsContent,
  selectSearchTerm,
  selectFilteredNamedAccounts,
  selectFilteredPooledAccounts,
  selectActiveTab,
  selectRemittanceOnlyAccepted,
  selectTermsModalOpen,
} from "./currencyAccountsSelectors";

const CurrencySelectAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { accountType } = location.state || {};

  // Select state from Redux store
  const accountOptions = useSelector(selectAccountOptions);
  const namedAccounts = useSelector(selectNamedAccounts);
  const pooledAccounts = useSelector(selectPooledAccounts);
  const ucaDescription = useSelector(selectUcaDescription);
  const selectedAccounts = useSelector(selectSelectedAccounts);
  const referralCode = useSelector(selectReferralCode);
  const referralError = useSelector(selectReferralError);
  const loading = useSelector(selectLoading);
  const termsText = useSelector(selectTermsText);
  const termsAccepted = useSelector(selectTermsAccepted);
  const apiError = useSelector(selectApiError);
  const termsContent = useSelector(selectTermsContent);
  const searchTerm = useSelector(selectSearchTerm);
  const filteredNamedAccounts = useSelector(selectFilteredNamedAccounts);
  const filteredPooledAccounts = useSelector(selectFilteredPooledAccounts);
  const activeTab = useSelector(selectActiveTab);
  const remittanceOnlyAccepted = useSelector(selectRemittanceOnlyAccepted);
  const termsModalOpen = useSelector(selectTermsModalOpen);

  // Local component state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    named: true,
    pooled: true,
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoType, setInfoType] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const API_URL = `${API_BASE_URL}`;
  // 🎉 NO MORE bearertoken variable needed!
  const currentStep = useCurrentStep();

  // Handle missing accountType on component mount
  useEffect(() => {
    if (!accountType) {
      setModalMessage(
        "Account type is not defined. Please go back and select an account type."
      );
      setIsModalOpen(true);
      setIsInitialLoading(false);
    }
  }, [accountType]);

  // ✅ SIMPLIFIED: Fetch data when accountType is available
  useEffect(() => {
    if (accountType && accountOptions.length === 0) {
      dispatch(fetchAccountOptions({ accountType, API_URL }))
        .unwrap()
        .then(() => {
          setIsInitialLoading(false);
        })
        .catch((error) => {
          setIsInitialLoading(false);
        });
    } else {
      // Data already exists, just stop loading
      setIsInitialLoading(false);
    }
  }, [accountType, API_URL, dispatch, accountOptions.length]); // ✅ Simplified dependencies

  // Handle API errors
  useEffect(() => {
    if (apiError) {
      setModalMessage(`Failed to load account options: ${apiError}`);
      setIsModalOpen(true);
    }
  }, [apiError]);

  // Handle account selection
  const handleAccountSelect = (accountId) => {
    if (remittanceOnlyAccepted) {
      // Auto-switch to currency accounts mode
      dispatch(setRemittanceOnlyAccepted(false));
    }
    dispatch(toggleAccountSelection(accountId));
  };

  // Handle remittance only selection
  const handleRemittanceOnlySelect = (checked) => {
    if (checked && selectedAccounts.length > 0) {
      // Auto-clear currency selections and switch to remittance mode
      dispatch(setSelectedAccounts([]));
    }
    dispatch(setRemittanceOnlyAccepted(checked));
  };

  // Handle direct service type selection
  const handleServiceTypeSelect = (type) => {
    if (type === "currency") {
      dispatch(setRemittanceOnlyAccepted(false));
      // Keep existing currency selections if any
    } else if (type === "remittance") {
      dispatch(setRemittanceOnlyAccepted(true));
      dispatch(setSelectedAccounts([])); // Clear any currency selections
    }
  };

  // ✅ SIMPLIFIED: Remove bearertoken from retry
  const handleRetry = () => {
    dispatch(clearError());
    if (accountType) {
      dispatch(fetchAccountOptions({ accountType, API_URL }));
    }
  };

  const handleReferral = (event) => {
    dispatch(setReferralCode(event.target.value));
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleShowInfo = (type) => {
    setInfoType(type);
    setShowInfoModal(true);
  };

  const handleSubmit = async () => {
    if (selectedAccounts.length === 0 && !remittanceOnlyAccepted) {
      setModalMessage(
        "Please select at least one currency account or choose Remittance Services Only to proceed"
      );
      setIsModalOpen(true);
      return;
    }

    if (!termsAccepted) {
      setModalMessage("Please confirm that you agree on the Charges and Fees");
      setIsModalOpen(true);
      return;
    }

    const stateData = {
      service_provide_ids: selectedAccounts,
      accountOptions: accountOptions,
      referral_code: referralCode,
      is_remit: remittanceOnlyAccepted ? 1 : 0,
    };

    if (accountType === "individual") {
      navigate("/signupindividual", { state: stateData });
    } else if (accountType === "institution") {
      navigate("/signupinstitution", { state: stateData });
    }
  };

  const handleCancel = () => {
    navigate("/selectaccounttype");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMessage("");
    dispatch(clearError());
  };

  const handleViewTerms = (url) => {
    dispatch(fetchTermsContent(url));
  };

  const getAccountTypeIcon = (type) => {
    switch (type) {
      case "individual":
        return faUser;
      case "institution":
        return faBuilding;
      case "partner":
        return faHandshake;
      default:
        return faGlobe;
    }
  };

  const getAccountTypeTitle = () => {
    switch (accountType) {
      case "individual":
        return "Individual Account";
      case "institution":
        return "Business Account";
      case "partner":
        return "Partner Account";
      default:
        return "Universal Currency Account";
    }
  };

  const getCurrencyIcon = (currency) => {
    if (!currency) return faDollarSign;

    const curr = currency.toUpperCase();
    if (curr === "GBP") return faPoundSign;
    if (curr === "EUR") return faEuroSign;
    if (curr === "USD") return faDollarSign;
    return faDollarSign;
  };

  const currencyTabs = [
    { id: "all", name: "All Currencies" },
    { id: "USD", name: "US Dollar" },
    { id: "EUR", name: "Euro" },
    { id: "GBP", name: "British Pound" },
  ];

  if (isInitialLoading && !accountType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <RingLoader color="#3B82F6" size={60} />
            <div className="absolute inset-0 animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading account options...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            This will just take a moment
          </p>
        </div>
      </div>
    );
  }

  return (
    <RegistrationLayout>
      <div className="min-h-screen bg-transparent flex justify-center items-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-blue-400/5 rounded-full blur-3xl"></div>

        {/* API Error Banner */}
        {apiError && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center">
                <div className="bg-red-100 p-2 rounded-full mr-3">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="text-red-600"
                  />
                </div>
                <div>
                  <span className="text-red-800 font-medium block">
                    Connection Error
                  </span>
                  <span className="text-red-700 text-sm">{apiError}</span>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="ml-4 flex items-center text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow-md"
              >
                <FontAwesomeIcon icon={faSyncAlt} className="mr-2" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden relative z-10 border border-gray-100">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full -translate-x-12 translate-y-12"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white/20 p-4 rounded-2xl mr-4 backdrop-blur-sm">
                  <FontAwesomeIcon
                    icon={getAccountTypeIcon(accountType)}
                    className="text-2xl"
                  />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {getAccountTypeTitle()}
                </h1>
              </div>
              <p className="text-center text-blue-100 text-sm opacity-90">
                {ucaDescription}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={handleCancel}
              className="absolute top-6 right-6 z-10 p-3 rounded-xl bg-white/10 backdrop-blur-sm shadow-md hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 group"
              aria-label="Close"
            >
              <FontAwesomeIcon
                icon={faTimes}
                className="text-lg text-white group-hover:text-gray-200 transition-colors"
              />
            </button>
          </div>

          <div className="p-6">
            {/* Service Type Selection */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                Choose Your Service Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Currency Accounts Option */}
                <div
                  className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300 ${
                    !remittanceOnlyAccepted
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100 shadow-lg"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                  }`}
                  onClick={() => handleServiceTypeSelect("currency")}
                >
                  <div className="flex items-start">
                    <div
                      className={`flex items-center justify-center h-6 w-6 rounded-full border mr-4 mt-1 ${
                        !remittanceOnlyAccepted
                          ? "bg-blue-600 border-blue-700"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {!remittanceOnlyAccepted && (
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="text-white text-sm"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className="bg-blue-100 p-3 rounded-xl mr-3">
                          <FontAwesomeIcon
                            icon={faMoneyBillWave}
                            className="text-blue-600 text-lg"
                          />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Multi-Currency Accounts
                        </h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        Open foreign currency accounts to hold, send, and
                        receive multiple currencies with competitive exchange
                        rates.
                      </p>
                      <div className="flex items-center text-sm text-blue-600">
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="mr-2"
                        />
                        <span>Hold multiple currencies</span>
                      </div>
                      <div className="flex items-center text-sm text-blue-600 mt-1">
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="mr-2"
                        />
                        <span>Better exchange rates</span>
                      </div>
                      <div className="flex items-center text-sm text-blue-600 mt-1">
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="mr-2"
                        />
                        <span>Send & receive internationally</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remittance Only Option */}
                <div
                  className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300 ${
                    remittanceOnlyAccepted
                      ? "border-green-500 bg-green-50 ring-2 ring-green-100 shadow-lg"
                      : "border-gray-200 bg-white hover:border-green-300 hover:shadow-md"
                  }`}
                  onClick={() => handleServiceTypeSelect("remittance")}
                >
                  <div className="flex items-start">
                    <div
                      className={`flex items-center justify-center h-6 w-6 rounded-full border mr-4 mt-1 ${
                        remittanceOnlyAccepted
                          ? "bg-green-600 border-green-700"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {remittanceOnlyAccepted && (
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="text-white text-sm"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className="bg-green-100 p-3 rounded-xl mr-3">
                          <FontAwesomeIcon
                            icon={faExchangeAlt}
                            className="text-green-600 text-lg"
                          />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Remittance Services Only
                        </h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        Only need money transfer services without opening
                        currency accounts. Perfect for occasional international
                        transfers.
                      </p>
                      <div className="flex items-center text-sm text-green-600">
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="mr-2"
                        />
                        <span>No account maintenance</span>
                      </div>
                      <div className="flex items-center text-sm text-green-600 mt-1">
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="mr-2"
                        />
                        <span>Fast international transfers</span>
                      </div>
                      <div className="flex items-center text-sm text-green-600 mt-1">
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="mr-2"
                        />
                        <span>Simple and straightforward</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selection Status */}
              <div className="mt-4 text-center">
                {!remittanceOnlyAccepted && selectedAccounts.length > 0 && (
                  <div className="inline-flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                    {selectedAccounts.length} currency account(s) selected
                  </div>
                )}
                {!remittanceOnlyAccepted && selectedAccounts.length === 0 && (
                  <div className="inline-flex items-center bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                    Select currency accounts above
                  </div>
                )}
                {remittanceOnlyAccepted && (
                  <div className="inline-flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                    Remittance Services Only selected
                  </div>
                )}
              </div>
            </div>

            {/* Currency Accounts Section (Only show if not remittance only) */}
            {!remittanceOnlyAccepted && (
              <>
                {/* Search and Filter Section */}
                <div className="mb-8">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FontAwesomeIcon
                          icon={faSearch}
                          className="text-gray-400"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Search currency accounts..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-gray-50 focus:bg-white"
                        value={searchTerm}
                        onChange={(e) =>
                          dispatch(setSearchTerm(e.target.value))
                        }
                      />
                    </div>

                    <div className="flex md:justify-end">
                      <div className="flex bg-gray-100 p-1 rounded-xl">
                        {currencyTabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => {
                              dispatch(setActiveTab(tab.id));
                            }}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                              activeTab === tab.id
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            {tab.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Active Filter Display */}
                  {activeTab !== "all" && (
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center text-sm text-blue-600">
                        <FontAwesomeIcon icon={faFilter} className="mr-2" />
                        Showing only {activeTab} accounts
                        <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {filteredNamedAccounts.length +
                            filteredPooledAccounts.length}{" "}
                          accounts
                        </span>
                      </div>
                      <button
                        onClick={() => dispatch(setActiveTab("all"))}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                      >
                        <FontAwesomeIcon icon={faTimes} className="mr-1" />
                        Clear filter
                      </button>
                    </div>
                  )}
                </div>

                {/* Account Benefits Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center">
                    <div className="bg-blue-100 p-3 rounded-xl mr-4">
                      <FontAwesomeIcon
                        icon={faShieldAlt}
                        className="text-blue-600"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Secure & Regulated
                      </h3>
                      <p className="text-sm text-gray-600">
                        Fully protected funds
                      </p>
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center">
                    <div className="bg-indigo-100 p-3 rounded-xl mr-4">
                      <FontAwesomeIcon
                        icon={faPercent}
                        className="text-indigo-600"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Competitive Rates
                      </h3>
                      <p className="text-sm text-gray-600">Better than banks</p>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center">
                    <div className="bg-purple-100 p-3 rounded-xl mr-4">
                      <FontAwesomeIcon
                        icon={faClock}
                        className="text-purple-600"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Fast Transfers
                      </h3>
                      <p className="text-sm text-gray-600">
                        24-48 hours typically
                      </p>
                    </div>
                  </div>
                </div>

                {/* Named Accounts Section */}
                {filteredNamedAccounts.length > 0 && (
                  <div className="mb-8">
                    <div
                      className="flex justify-between items-center cursor-pointer p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-md hover:shadow-lg transition-all"
                      onClick={() => toggleSection("named")}
                      aria-expanded={expandedSections.named}
                    >
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                        <div className="bg-blue-500 p-2.5 rounded-xl mr-3 text-white shadow">
                          <FontAwesomeIcon icon={faUser} />
                        </div>
                        Named Accounts
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowInfo("named");
                          }}
                          className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
                          aria-label="What are Named Accounts?"
                        >
                          {" "}
                          <FontAwesomeIcon
                            icon={faCircleInfo}
                            className="text-sm"
                          />
                        </button>
                        <span className="ml-3 text-xs font-medium text-blue-800 bg-blue-100 border border-blue-200 px-3 py-0.5 rounded-full">
                          {filteredNamedAccounts.length} options
                        </span>
                      </h2>
                      <FontAwesomeIcon
                        icon={
                          expandedSections.named ? faChevronUp : faChevronDown
                        }
                        className={`text-gray-600 transition-transform duration-300 ${
                          expandedSections.named ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    <div
                      className={`transition-all duration-500 ease-in-out overflow-hidden ${
                        expandedSections.named
                          ? "max-h-screen opacity-100 mt-4"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="grid grid-cols-1 text-sm gap-4">
                        {filteredNamedAccounts.map((account, index) => (
                          <AccountOptionCard
                            key={index}
                            account={account}
                            isSelected={selectedAccounts.includes(
                              account.service_provide_id_type ||
                                account.service_provide_id ||
                                account.id
                            )}
                            onSelect={() =>
                              handleAccountSelect(
                                account.service_provide_id_type ||
                                  account.service_provide_id ||
                                  account.id
                              )
                            }
                            onViewTerms={handleViewTerms}
                            getCurrencyIcon={getCurrencyIcon}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pooled Accounts Section */}
                {filteredPooledAccounts.length > 0 && (
                  <div className="mb-8">
                    <div
                      className="flex justify-between items-center cursor-pointer p-5 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-2xl border border-indigo-200 shadow-md hover:shadow-lg transition-all"
                      onClick={() => toggleSection("pooled")}
                      aria-expanded={expandedSections.pooled}
                    >
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                        <div className="bg-indigo-500 p-2.5 rounded-xl mr-3 text-white shadow">
                          <FontAwesomeIcon icon={faUsers} />
                        </div>
                        Pooled Accounts
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowInfo("pooled");
                          }}
                          className="ml-2 text-indigo-500 hover:text-indigo-700 transition-colors"
                          aria-label="What are Pooled Accounts?"
                        >
                          <FontAwesomeIcon
                            icon={faCircleInfo}
                            className="text-sm"
                          />
                        </button>
                        <span className="ml-3 text-xs font-medium text-indigo-800 bg-indigo-100 border border-indigo-200 px-3 py-0.5 rounded-full">
                          {filteredPooledAccounts.length} options
                        </span>
                      </h2>
                      <FontAwesomeIcon
                        icon={
                          expandedSections.pooled ? faChevronUp : faChevronDown
                        }
                        className={`text-gray-600 transition-transform duration-300 ${
                          expandedSections.pooled ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    <div
                      className={`transition-all duration-500 ease-in-out overflow-hidden ${
                        expandedSections.pooled
                          ? "max-h-screen opacity-100 mt-4"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="grid grid-cols-1 gap-4">
                        {filteredPooledAccounts.map((account, index) => (
                          <AccountOptionCard
                            key={index}
                            account={account}
                            isSelected={selectedAccounts.includes(
                              account.service_provide_id_type ||
                                account.service_provide_id ||
                                account.id
                            )}
                            onSelect={() =>
                              handleAccountSelect(
                                account.service_provide_id_type ||
                                  account.service_provide_id ||
                                  account.id
                              )
                            }
                            onViewTerms={handleViewTerms}
                            getCurrencyIcon={getCurrencyIcon}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* No Accounts Available Message */}
                {namedAccounts.length === 0 &&
                  pooledAccounts.length === 0 &&
                  !isInitialLoading && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                      <div className="flex items-center">
                        <div className="bg-yellow-100 p-3 rounded-xl mr-4">
                          <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            className="text-yellow-600 text-xl"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-yellow-800">
                            No Accounts Available
                          </h3>
                          <p className="mt-1 text-yellow-700">
                            There are currently no account options available for
                            your selected account type. Please contact support
                            for assistance.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {/* No Search Results Message */}
                {searchTerm &&
                  filteredNamedAccounts.length === 0 &&
                  filteredPooledAccounts.length === 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                      <div className="flex items-center">
                        <div className="bg-gray-100 p-3 rounded-xl mr-4">
                          <FontAwesomeIcon
                            icon={faSearch}
                            className="text-gray-500 text-xl"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-800">
                            No matching accounts found
                          </h3>
                          <p className="mt-1 text-gray-700">
                            No accounts match your search for "{searchTerm}".
                            Try a different search term or filter.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </>
            )}

            {/* Terms Acceptance */}
            <div className="flex items-start p-4 bg-gray-50 rounded-xl mb-6 border border-gray-200">
              <div>
                <input
                  type="checkbox"
                  id="termsAcceptance"
                  checked={termsAccepted}
                  onChange={(e) => dispatch(setTermsAccepted(e.target.checked))}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
              <label
                htmlFor="termsAcceptance"
                className="ml-3 text-gray-700 text-sm flex flex-col"
              >
                <div className="flex items-center">
                  <span className="mr-1">I agree to the</span>
                  <button
                    type="button"
                    onClick={() => {
                      setModalMessage(
                        "Terms and conditions would be displayed here. In a real implementation, this would show the actual terms content."
                      );
                      setIsModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 transition-colors flex items-center hover:underline underline-offset-1"
                  >
                    Charges and Fees
                  </button>
                </div>
              </label>
            </div>

            {/* Referral Code Input */}
            <div className="mb-6">
              <label
                htmlFor="referralCode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Referral Code (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="referralCode"
                  value={referralCode}
                  onChange={handleReferral}
                  placeholder="Enter referral code if you have one"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-gray-50 focus:bg-white"
                />
                {referralError && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                    {referralError}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSubmit}
                disabled={
                  loading ||
                  (selectedAccounts.length === 0 && !remittanceOnlyAccepted)
                }
                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RingLoader color="#ffffff" size={20} className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span>Continue to Register</span>
                    <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                  </>
                )}
              </button>

              <button
                onClick={handleCancel}
                className="py-3 px-6 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium shadow-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Error Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center justify-center text-blue-500 mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <FontAwesomeIcon icon={faInfoCircle} size="lg" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                {modalMessage}
              </h3>
              <div className="flex gap-3">
                {modalMessage.includes("Account type is not defined") && (
                  <button
                    onClick={() => navigate("/selectaccount")}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                  >
                    Go Back
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Terms Modal */}
        {termsModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Terms and Conditions
                </h3>
                <button
                  onClick={() => dispatch(setTermsModalOpen(false))}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: termsContent }}
              />
              <button
                onClick={() => dispatch(setTermsModalOpen(false))}
                className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Info Modal */}
        {showInfoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  {infoType === "named" ? (
                    <>
                      <FontAwesomeIcon
                        icon={faUser}
                        className="mr-2 text-blue-500"
                      />
                      Named Accounts
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon
                        icon={faUsers}
                        className="mr-2 text-indigo-500"
                      />
                      Pooled Accounts
                    </>
                  )}
                </h3>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="space-y-4">
                {infoType === "named" ? (
                  <>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-700">
                        A Named Account is a dedicated bank account issued in the customer’s name. All transactions are processed directly through this account, allowing funds to be received and sent in the customer's own identity. This provides higher transparency, better reconciliation, and improved trust for business and high-volume customers.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-gray-700">
                        A Pooled Account is a shared account operated by the platform on behalf of multiple customers. Individual customer balances are maintained virtually within the system, while actual transactions are settled through the pooled account. This allows faster onboarding and efficient handling for customers who do not require a dedicated bank account.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RegistrationLayout>
  );
};

const AccountOptionCard = ({
  account,
  isSelected,
  onSelect,
  onViewTerms,
  getCurrencyIcon,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatAccountDetails = (text, currency) => {
    if (!text) return "No details available";
    if (!currency) return text;

    const cleanedText = text.replace(/\([A-Z]{3}\)\s*/g, "");
    return `${cleanedText}`;
  };

  const accountDetails =
    account.account_opening_details ||
    account.account_opening_detail ||
    account.description ||
    account.name ||
    "Currency Account";

  const accountCurrency =
    account.currency || account.currency_code || account.currency_type || "";

  const accountUrl =
    account.url ||
    account.charges_url ||
    account.fees_url ||
    account.terms_url ||
    "";

  const formattedText = formatAccountDetails(accountDetails, accountCurrency);

  return (
    <div
      className={`border rounded-xl p-4 cursor-pointer transition-all duration-300 ${
        isSelected
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100 shadow-md"
          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start">
        <div
          className={`flex items-center justify-center h-5 w-5 mt-1 rounded border ${
            isSelected
              ? "bg-blue-600 border-blue-700"
              : "bg-white border-gray-300"
          }`}
        >
          {isSelected && (
            <FontAwesomeIcon
              icon={faCheckCircle}
              className="text-white text-xs"
            />
          )}
        </div>

        <div className="ml-3 flex-1">
          <div className="flex items-center mb-2">
            {accountCurrency && (
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <FontAwesomeIcon
                  icon={getCurrencyIcon(accountCurrency)}
                  className="text-blue-600"
                />
              </div>
            )}
            <div>
              <h3 className="font-medium text-gray-900">
                {accountCurrency && `(${accountCurrency}) `}
                {formattedText.length > 50 && !isExpanded
                  ? `${formattedText.substring(0, 50)}...`
                  : formattedText}
              </h3>
              {accountCurrency && (
                <p className="text-sm text-gray-500 mt-1">
                  {accountCurrency} Account
                </p>
              )}
            </div>
          </div>

          {(formattedText.length > 50 || accountUrl) && (
            <div className="flex justify-between items-center mt-2 w-full">
              {formattedText.length > 50 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center transition-colors"
                >
                  {isExpanded ? "Show less" : "Read more"}
                  <FontAwesomeIcon
                    icon={isExpanded ? faChevronUp : faChevronDown}
                    className="ml-1"
                  />
                </button>
              )}

              {accountUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewTerms(accountUrl);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center transition-colors"
                >
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                  View Charges and Fees
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

CurrencySelectAccount.propTypes = {
  location: PropTypes.shape({
    state: PropTypes.shape({
      accountType: PropTypes.string,
    }),
  }),
};

export default CurrencySelectAccount;
