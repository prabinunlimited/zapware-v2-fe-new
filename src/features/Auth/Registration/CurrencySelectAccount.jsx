import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
} from "@fortawesome/free-solid-svg-icons";
import { ClipLoader } from "react-spinners";
import PropTypes from 'prop-types';

import RegistrationLayout from "../../../components/ProgressBar/RegistrationLayout";
import ProgressBar from "../../../components/ProgressBar/ProgressBar";
import useCurrentStep from "../../../components/ProgressBar/useCurrentStep";

const CurrencySelectAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { accountType } = location.state || {};

  console.log('🔍 [CurrencySelectAccount] Component rendering');
  console.log('🔍 [CurrencySelectAccount] location.state:', location.state);
  console.log('🔍 [CurrencySelectAccount] accountType:', accountType);

  useEffect(() => {
    console.log('🔍 [CurrencySelectAccount] useEffect running');
    if (!accountType) {
      console.log('❌ [CurrencySelectAccount] No accountType, checking navigation state');

      // Try to get from sessionStorage as fallback
      const storedAccountType = sessionStorage.getItem('selectedAccountType');
      if (storedAccountType) {
        console.log('🔄 [CurrencySelectAccount] Using accountType from sessionStorage:', storedAccountType);
        // You might want to update your state here or force re-navigation
      } else {
        console.log('❌ [CurrencySelectAccount] No accountType found anywhere, showing modal');
        setModalMessage("Account type is not defined. Please go back and select an account type.");
        setIsModalOpen(true);
        setIsLoading(false);
      }
    }
  }, [accountType]);

  // Get API URL from environment
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const API_URL = `${API_BASE_URL}`;

  const [accountOptions, setAccountOptions] = useState([]);
  const [namedAccounts, setNamedAccounts] = useState([]);
  const [pooledAccounts, setPooledAccounts] = useState([]);
  const [ucaDescription, setUcaDescription] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [referralCode, setReferralCode] = useState("");
  const [referralError, setReferralError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [termsText, setTermsText] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    named: true,
    pooled: true,
  });
  const [remittanceOnlyAccepted, setRemittanceOnlyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsContent, setTermsContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredNamedAccounts, setFilteredNamedAccounts] = useState([]);
  const [filteredPooledAccounts, setFilteredPooledAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  const bearertoken = localStorage.getItem("bearertoken");
  const currentStep = useCurrentStep();

  // Handle missing accountType on component mount
  useEffect(() => {
    if (!accountType) {
      setModalMessage("Account type is not defined. Please go back and select an account type.");
      setIsModalOpen(true);
      setIsLoading(false);
    }
  }, [accountType]);

  const fetchWithTimeout = (url, options = {}, timeout = 10000) => {
    const controller = new AbortController();
    const { signal } = controller;

    return Promise.race([
      fetch(url, { ...options, signal }),
      new Promise((_, reject) =>
        setTimeout(() => {
          controller.abort();
          reject(new Error("Request timeout"));
        }, timeout)
      ),
    ]);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setApiError(null);

        if (!accountType) {
          throw new Error(
            "Account type is not defined. Please go back and try again."
          );
        }

        // Fetch account description
        const accountOptionsUrl = `${API_URL}/get-onboarding-description`;
        const accountOptionsResponse = await fetchWithTimeout(
          accountOptionsUrl,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!accountOptionsResponse.ok) {
          throw new Error(
            `Failed to fetch account options: ${accountOptionsResponse.status}`
          );
        }

        const accountOptionsData = await accountOptionsResponse.json();

        // Set description based on account type
        const descriptionKey =
          accountType === "individual"
            ? "individual_description"
            : "institution_description";

        setUcaDescription(
          accountOptionsData[descriptionKey] ||
          accountOptionsData.description ||
          "Select your preferred currency accounts to get started"
        );

        // Fetch account types
        const accountTypeEndpoint =
          accountType === "individual" ? "Individuals" : "Institutions";

        const termsUrl = `${API_URL}/get-bank-ac-type/${accountTypeEndpoint}`;
        const termsResponse = await fetchWithTimeout(termsUrl, {
          headers: {
            Authorization: `Bearer ${bearertoken}`,
            "Content-Type": "application/json",
          },
        });

        if (!termsResponse.ok) {
          throw new Error(`Server returned ${termsResponse.status} status`);
        }

        const termsData = await termsResponse.json();

        // Handle different response structures
        let accountsData = [];
        if (Array.isArray(termsData)) {
          accountsData = termsData;
        } else if (termsData.data && Array.isArray(termsData.data)) {
          accountsData = termsData.data;
        } else if (termsData.accounts && Array.isArray(termsData.accounts)) {
          accountsData = termsData.accounts;
        } else if (termsData.success && Array.isArray(termsData.result)) {
          accountsData = termsData.result;
        } else {
          throw new Error("Unexpected response format from server");
        }

        if (accountsData.length === 0) {
          throw new Error("No account options available for your account type");
        }

        // Separate accounts by type
        const named = accountsData.filter(
          (account) =>
            account.accountType === "named" ||
            account.account_type === "named" ||
            account.type === "named"
        );

        const pooled = accountsData.filter(
          (account) =>
            account.accountType === "pooled" ||
            account.account_type === "pooled" ||
            account.type === "pooled"
        );

        setAccountOptions(accountsData);
        setNamedAccounts(named);
        setPooledAccounts(pooled);
        setFilteredNamedAccounts(named);
        setFilteredPooledAccounts(pooled);

        // Set terms text if available in response
        if (termsData.termsText) {
          setTermsText("I agree to " + termsData.termsText);
        } else if (termsData.terms_text) {
          setTermsText("I agree to " + termsData.terms_text);
        } else if (termsData.terms) {
          setTermsText("I agree to " + termsData.terms);
        } else {
          setTermsText("Please confirm that you agree on the Charges and Fees");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setApiError(error.message);
        setModalMessage(`Failed to load account options: ${error.message}`);
        setIsModalOpen(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (accountType) {
      fetchData();
    }
  }, [accountType, bearertoken, API_URL]);

  // Filter accounts based on search term and active tab
  useEffect(() => {
    const filterAccounts = (accounts) => {
      let filtered = accounts;

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter((account) => {
          const accountDetails =
            account.account_opening_details ||
            account.account_opening_detail ||
            account.description ||
            account.name ||
            "";

          const currency =
            account.currency ||
            account.currency_code ||
            account.currency_type ||
            "";

          return (
            accountDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
            currency.toLowerCase().includes(searchTerm.toLowerCase())
          );
        });
      }

      // Filter by active tab
      if (activeTab !== "all") {
        filtered = filtered.filter((account) => {
          const currency =
            account.currency ||
            account.currency_code ||
            account.currency_type ||
            "";
          return currency.toLowerCase() === activeTab.toLowerCase();
        });
      }

      return filtered;
    };

    setFilteredNamedAccounts(filterAccounts(namedAccounts));
    setFilteredPooledAccounts(filterAccounts(pooledAccounts));
  }, [searchTerm, namedAccounts, pooledAccounts, activeTab]);

  const fetchTermsContent = async (url) => {
    try {
      setLoading(true);
      const response = await fetchWithTimeout(url, {
        headers: {
          "Content-Type": "text/html",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch terms: ${response.status}`);
      }

      const content = await response.text();
      setTermsContent(content);
      setTermsModalOpen(true);
    } catch (error) {
      setModalMessage("Could not load terms and conditions at this time.");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (accountId) => {
    setSelectedAccounts((prevSelectedAccounts) =>
      prevSelectedAccounts.includes(accountId)
        ? prevSelectedAccounts.filter((id) => id !== accountId)
        : [...prevSelectedAccounts, accountId]
    );
  };

  const handleRetry = () => {
    setIsLoading(true);
    setApiError(null);
    // Reload the component
    setTimeout(() => window.location.reload(), 500);
  };

  const handleReferral = (event) => {
    const value = event.target.value;
    setReferralCode(value);

    if (value && value.length < 3) {
      setReferralError("Referral code must be at least 3 characters");
    } else {
      setReferralError("");
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSubmit = async () => {
    if (selectedAccounts.length === 0 && !remittanceOnlyAccepted) {
      setModalMessage("Please select at least one account to proceed");
      setIsModalOpen(true);
      return;
    }

    if (!termsAccepted) {
      setModalMessage("Please confirm that you agree on the Charges and Fees");
      setIsModalOpen(true);
      return;
    }

    try {
      setLoading(true);

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
    } catch (error) {
      console.log("Error during submission:", error.message);
      setModalMessage("An error occurred during submission. Please try again.");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/selectaccounttype");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMessage("");
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

  if (isLoading && !accountType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <ClipLoader color="#3B82F6" size={60} />
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex md:justify-end">
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    {currencyTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
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
                  <p className="text-sm text-gray-600">Fully protected funds</p>
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
                  <FontAwesomeIcon icon={faClock} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Fast Transfers</h3>
                  <p className="text-sm text-gray-600">24-48 hours typically</p>
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
                    <span className="ml-3 text-xs font-medium text-blue-800 bg-blue-100 border border-blue-200 px-3 py-0.5 rounded-full">
                      {filteredNamedAccounts.length} options
                    </span>
                  </h2>
                  <FontAwesomeIcon
                    icon={expandedSections.named ? faChevronUp : faChevronDown}
                    className={`text-gray-600 transition-transform duration-300 ${expandedSections.named ? "rotate-180" : ""
                      }`}
                  />
                </div>

                <div
                  className={`transition-all duration-500 ease-in-out overflow-hidden ${expandedSections.named
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
                        onViewTerms={fetchTermsContent}
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
                    <span className="ml-3 text-xs font-medium text-indigo-800 bg-indigo-100 border border-indigo-200 px-3 py-0.5 rounded-full">
                      {filteredPooledAccounts.length} options
                    </span>
                  </h2>
                  <FontAwesomeIcon
                    icon={expandedSections.pooled ? faChevronUp : faChevronDown}
                    className={`text-gray-600 transition-transform duration-300 ${expandedSections.pooled ? "rotate-180" : ""
                      }`}
                  />
                </div>

                <div
                  className={`transition-all duration-500 ease-in-out overflow-hidden ${expandedSections.pooled
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
                        onViewTerms={fetchTermsContent}
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
              !isLoading && (
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
                        your selected account type. Please contact support for
                        assistance.
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
                        No accounts match your search for "{searchTerm}". Try a
                        different search term or filter.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Remittance Only Option */}
            <div className="flex items-start p-4 bg-gray-50 rounded-xl mb-6 border border-gray-200">
              <div className="flex items-center h-5 mt-1">
                <input
                  type="checkbox"
                  id="remittanceOnly"
                  checked={remittanceOnlyAccepted}
                  onChange={(e) => setRemittanceOnlyAccepted(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
              <label htmlFor="remittanceOnly" className="ml-3 text-gray-700">
                <span className="font-medium">Remittance Services Only</span>
                <p className="text-sm text-gray-600 mt-1">
                  I only need money transfer services without opening a currency
                  account
                </p>
              </label>
            </div>

            {/* Terms Acceptance */}
            <div className="flex items-start p-4 bg-gray-50 rounded-xl mb-6 border border-gray-200">
              {/* Checkbox */}
              <div>
                <input
                  type="checkbox"
                  id="termsAcceptance"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              {/* Label and Text */}
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
                    Terms and Conditions
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
                  (namedAccounts.length === 0 &&
                    pooledAccounts.length === 0 &&
                    !remittanceOnlyAccepted)
                }
                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <ClipLoader color="#ffffff" size={20} className="mr-2" />
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
                    onClick={() => navigate('/selectaccount')}
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
                  onClick={() => setTermsModalOpen(false)}
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
                onClick={() => setTermsModalOpen(false)}
                className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                Close
              </button>
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

  // Handle different possible property names from API
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
      className={`border rounded-xl p-4 cursor-pointer transition-all duration-300 ${isSelected
        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100 shadow-md"
        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md"
        }`}
      onClick={onSelect}
    >
      <div className="flex items-start">
        <div
          className={`flex items-center justify-center h-5 w-5 mt-1 rounded border ${isSelected
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
      accountType: PropTypes.string
    })
  })
};

export default CurrencySelectAccount;