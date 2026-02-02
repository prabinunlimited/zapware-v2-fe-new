import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  faExchangeAlt,
  faFilter,
  faCircleInfo,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import { ClipLoader, RingLoader } from "react-spinners";

// 1. SELECTORS
import * as selectors from "./currencyAccountsSelectors";

// 2. ACTIONS
import * as actions from "./currencyAccountsSlice";

const OpenCurrencyAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { accountType, selectedCountryId } = location.state || {};
  const API_URL = import.meta.env.VITE_API_URL;

  // Local UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [monthlyCharge, setMonthlyCharge] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    named: true,
    pooled: true,
  });
  const [expandedDetails, setExpandedDetails] = useState({});
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoType, setInfoType] = useState("");

  // Storage variables
  const bearertoken = localStorage.getItem("bearertoken");
  const partnerId = localStorage.getItem("whitelabelledpartnerid");
  const isPartner = localStorage.getItem("iswhitelabelledpartner");
  const showRemitOnly = localStorage.getItem(
    "showRemittanceOnlyOnRegistration",
  );
  const hostName = window.location.hostname;

  // Redux Selectors
  const accountOptions = useSelector(selectors.selectAccountOptions) || [];
  const ucaDescription = useSelector(selectors.selectUcaDescription);
  const selectedAccounts = useSelector(selectors.selectSelectedAccounts) || [];
  const referralCode = useSelector(selectors.selectReferralCode);
  const referralError = useSelector(selectors.selectReferralError);
  const loading = useSelector(selectors.selectLoading);
  const termsAccepted = useSelector(selectors.selectTermsAccepted);
  const searchTerm = useSelector(selectors.selectSearchTerm);
  const filteredNamedAccounts =
    useSelector(selectors.selectFilteredNamedAccounts) || [];
  const filteredPooledAccounts =
    useSelector(selectors.selectFilteredPooledAccounts) || [];
  const activeTab = useSelector(selectors.selectActiveTab);
  const remittanceOnlyAccepted = useSelector(
    selectors.selectRemittanceOnlyAccepted,
  );
  const isReferralValidating = useSelector(
    selectors.selectIsReferralValidating,
  );
  const isPartnerPackageModule = useSelector(
    selectors.selectIsPartnerPackageModule,
  );
  const packageOptions = useSelector(selectors.selectPackageOptions) || [];
  const selectedPackageCurrencies =
    useSelector(selectors.selectSelectedPackageCurrencies) || [];
  const packageLoading = useSelector(selectors.selectPackageLoading);
  const isPackageValidating = useSelector(selectors.selectIsPackageValidating);
  const isSubmitDisabled = useSelector(selectors.selectIsSubmitDisabled);
  const referralSuccessMessage = useSelector(
    selectors.selectReferralSuccessMessage,
  );

  // Validate environment
  useEffect(() => {
    if (!API_URL) {
      console.error("❌ VITE_API_URL is not defined!");
      setModalMessage("Configuration error: API URL is missing");
      setIsModalOpen(true);
    }
  }, [API_URL]);

  // 1. INITIALIZATION
  useEffect(() => {
    if (!accountType) {
      navigate("/selectaccounttype");
      return;
    }

    dispatch(actions.clearAllSelections());

    // ⚠️ FIX: Force USA country ID (186) for partner flows
    const forceCountryId = 186; // USA

    console.log("🌐 Forcing country ID for partner flow:", {
      originalCountryId: selectedCountryId,
      forcedCountryId: forceCountryId,
      accountType,
      isPartnerPackageModule,
    });

    if (isPartnerPackageModule === "Y") {
      dispatch(
        actions.fetchPackageOptions({ accountType, partnerId, API_URL }),
      );
    } else {
      dispatch(
        actions.fetchAccountOptions({
          accountType,
          countryId: forceCountryId, // Use forced country ID
          API_URL,
        }),
      );
    }
  }, [
    accountType,
    // Remove selectedCountryId from dependencies
    isPartnerPackageModule,
    dispatch,
    navigate,
    partnerId,
    API_URL,
  ]);

  // 2. PRICE FETCHING
  useEffect(() => {
    const count =
      isPartnerPackageModule === "Y"
        ? selectedPackageCurrencies.length
        : selectedAccounts.length;
    if (
      (isPartner === "Y" || isPartner === "1") &&
      isPartnerPackageModule === "N" &&
      count > 0
    ) {
      fetch(`${API_URL}/package/list/${partnerId}/${accountType}`, {
        headers: { Authorization: `Bearer ${bearertoken}` },
      })
        .then((res) => res.json())
        .then((res) => {
          const pkgs = res.data || res.packages || res.result || [];
          const match = pkgs.find((p) => p.package_accountCount === count);
          setMonthlyCharge(match?.package_name || "");
        })
        .catch(() => setMonthlyCharge(""));
    } else {
      setMonthlyCharge("");
    }
  }, [
    selectedAccounts,
    selectedPackageCurrencies,
    isPartnerPackageModule,
    isPartner,
    partnerId,
    accountType,
    API_URL,
    bearertoken,
  ]);

  // 3. ACTION HANDLERS
  const handleToggleStandard = (id) => {
    if (remittanceOnlyAccepted) {
      dispatch(actions.setRemittanceOnlyAccepted(false));
    }
    if (id && typeof actions.toggleAccountSelection === "function") {
      dispatch(actions.toggleAccountSelection(id));
    } else {
      console.error("❌ toggleAccountSelection is not a function!");
      setModalMessage("System error: Action not available");
      setIsModalOpen(true);
    }
  };

  const handleTogglePackage = (id) => {
    if (id)
      dispatch(actions.togglePackageCurrencySelection({ currencyId: id }));
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

  const handleServiceTypeSelect = (type) => {
    if (type === "currency") {
      dispatch(actions.setRemittanceOnlyAccepted(false));
    } else if (type === "remittance") {
      dispatch(actions.setRemittanceOnlyAccepted(true));
      dispatch(actions.setSelectedAccounts([]));
    }
  };

  // 4. SUBMIT HANDLER (ORIGINAL LOGIC)
  const onFinalSubmit = useCallback(async () => {
    if (isSubmitDisabled) return;

    if (
      isPartnerPackageModule === "N" &&
      selectedAccounts.length === 0 &&
      !remittanceOnlyAccepted
    ) {
      setModalMessage("Please select at least one account to proceed.");
      setIsModalOpen(true);
      return;
    }

    if (!termsAccepted && hostName !== "tumatuma.unlimitedremit.com") {
      setModalMessage("Please confirm that you agree on the Charges and Fees.");
      setIsModalOpen(true);
      return;
    }

    if (referralCode) {
      try {
        await dispatch(actions.validateReferralCode(referralCode)).unwrap();
      } catch {
        setModalMessage("Invalid Referral Code");
        setIsModalOpen(true);
        return;
      }
    }

    if (
      isPartnerPackageModule === "Y" &&
      selectedPackageCurrencies.length > 0
    ) {
      try {
        await dispatch(
          actions.validatePackageCurrencies({
            selectedPackageCurrencies,
            partnerId,
          }),
        ).unwrap();
      } catch (err) {
        setModalMessage(
          typeof err === "string" ? err : err?.message || "Validation failed",
        );
        setIsModalOpen(true);
        return;
      }
    }

    const navState = {
      service_provide_ids:
        isPartnerPackageModule === "Y" ? [] : selectedAccounts,
      accountOptions,
      referral_code: referralCode,
      remit_customer: remittanceOnlyAccepted,
      document_upload: "Y",
      kyc_verify: "Y",
      owner_add: "Y",
      ssn_required: "Y",
      package_currencies: selectedPackageCurrencies,
    };

    navigate(
      accountType === "individual" ? "/signupindividual" : "/signupinstitution",
      {
        state: navState,
      },
    );
  }, [
    isSubmitDisabled,
    isPartnerPackageModule,
    selectedAccounts,
    remittanceOnlyAccepted,
    termsAccepted,
    hostName,
    referralCode,
    selectedPackageCurrencies,
    dispatch,
    partnerId,
    accountOptions,
    accountType,
    navigate,
  ]);

  const currenciesList = useMemo(
    () => [...new Set(accountOptions.map((a) => a.currency).filter(Boolean))],
    [accountOptions],
  );

  const getAccountTypeIcon = () => {
    switch (accountType) {
      case "individual":
        return faUser;
      case "institution":
        return faBuilding;
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

  if (loading || packageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex justify-center items-center">
        <div className="text-center flex flex-col items-center">
          <RingLoader color="#3B82F6" size={60} />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex justify-center items-center relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
      <div className="absolute bottom-0 right-0 w-full h-full bg-blue-400/5 rounded-full blur-3xl"></div>

      {/* Main Content */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden relative z-10 border border-gray-100 my-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full -translate-x-12 translate-y-12"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 p-4 rounded-2xl mr-4 backdrop-blur-sm">
                <FontAwesomeIcon
                  icon={getAccountTypeIcon()}
                  className="text-2xl"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {getAccountTypeTitle()}
              </h1>
            </div>
            <p className="text-center text-blue-100 text-sm opacity-90">
              {ucaDescription ||
                "Select your currency accounts for international transactions"}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={() => navigate(-1)}
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
                      Open foreign currency accounts to hold, send, and receive
                      multiple currencies with competitive exchange rates.
                    </p>
                    <div className="flex items-center text-sm text-blue-600">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                      <span>Hold multiple currencies</span>
                    </div>
                    <div className="flex items-center text-sm text-blue-600 mt-1">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                      <span>Better exchange rates</span>
                    </div>
                    <div className="flex items-center text-sm text-blue-600 mt-1">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
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
                      Only need money transfer services without opening currency
                      accounts. Perfect for occasional international transfers.
                    </p>
                    <div className="flex items-center text-sm text-green-600">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                      <span>No account maintenance</span>
                    </div>
                    <div className="flex items-center text-sm text-green-600 mt-1">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                      <span>Fast international transfers</span>
                    </div>
                    <div className="flex items-center text-sm text-green-600 mt-1">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
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

          {/* ========== CURRENCY ACCOUNTS SELECTION ========== */}
          {!remittanceOnlyAccepted && isPartnerPackageModule === "N" && (
            <div className="mb-8">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Select Currency Accounts
                </h2>
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search currencies..."
                    value={searchTerm}
                    onChange={(e) =>
                      dispatch(actions.setSearchTerm(e.target.value))
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Currency Tabs */}
              <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                <button
                  onClick={() => dispatch(actions.setActiveTab("all"))}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeTab === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Currencies
                </button>
                <button
                  onClick={() => dispatch(actions.setActiveTab("USD"))}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeTab === "USD"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  US Dollar
                </button>
                <button
                  onClick={() => dispatch(actions.setActiveTab("EUR"))}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeTab === "EUR"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Euro
                </button>
                <button
                  onClick={() => dispatch(actions.setActiveTab("GBP"))}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeTab === "GBP"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  British Pound
                </button>
              </div>

              {/* Named Accounts Section */}
              {filteredNamedAccounts.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleSection("named")}
                        className="mr-3 text-gray-600 hover:text-gray-800"
                      >
                        <FontAwesomeIcon
                          icon={
                            expandedSections.named ? faChevronUp : faChevronDown
                          }
                        />
                      </button>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FontAwesomeIcon
                          icon={faUser}
                          className="mr-2 text-blue-500"
                        />
                        Named Accounts
                        <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {filteredNamedAccounts.length}
                        </span>
                      </h3>
                      <button
                        onClick={() => handleShowInfo("named")}
                        className="ml-2 text-gray-400 hover:text-blue-600"
                        title="What are Named Accounts?"
                      >
                        <FontAwesomeIcon icon={faCircleInfo} />
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">
                      Dedicated accounts in your name
                    </div>
                  </div>

                  {expandedSections.named && (
                    <div className="grid grid-cols-1 gap-3">
                      {filteredNamedAccounts.map((account) => {
                        const accountId = `${account.service_provide_id}-${account.accountType?.toLowerCase() || "named"}`;
                        const isSelected = selectedAccounts.includes(accountId);

                        return (
                          <AccountOptionCard
                            key={accountId}
                            account={account}
                            isSelected={isSelected}
                            onSelect={() => handleToggleStandard(accountId)}
                            getCurrencyIcon={getCurrencyIcon}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Pooled Accounts Section */}
              {filteredPooledAccounts.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleSection("pooled")}
                        className="mr-3 text-gray-600 hover:text-gray-800"
                      >
                        <FontAwesomeIcon
                          icon={
                            expandedSections.pooled
                              ? faChevronUp
                              : faChevronDown
                          }
                        />
                      </button>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FontAwesomeIcon
                          icon={faUsers}
                          className="mr-2 text-indigo-500"
                        />
                        Pooled Accounts
                        <span className="ml-2 text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                          {filteredPooledAccounts.length}
                        </span>
                      </h3>
                      <button
                        onClick={() => handleShowInfo("pooled")}
                        className="ml-2 text-gray-400 hover:text-indigo-600"
                        title="What are Pooled Accounts?"
                      >
                        <FontAwesomeIcon icon={faCircleInfo} />
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">
                      Shared accounts with virtual IBANs
                    </div>
                  </div>

                  {expandedSections.pooled && (
                    <div className="grid grid-cols-1 gap-3">
                      {filteredPooledAccounts.map((account) => {
                        const accountId = `${account.service_provide_id}-${account.accountType?.toLowerCase() || "pooled"}`;
                        const isSelected = selectedAccounts.includes(accountId);

                        return (
                          <AccountOptionCard
                            key={accountId}
                            account={account}
                            isSelected={isSelected}
                            onSelect={() => handleToggleStandard(accountId)}
                            getCurrencyIcon={getCurrencyIcon}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* No Accounts Message */}
              {filteredNamedAccounts.length === 0 &&
                filteredPooledAccounts.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <FontAwesomeIcon
                      icon={faExclamationTriangle}
                      className="text-gray-400 text-3xl mb-3"
                    />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No currency accounts available
                    </h3>
                    <p className="text-gray-600">
                      {activeTab !== "all"
                        ? `No ${activeTab} accounts available for your selected country.`
                        : "No currency accounts are available for your selected country."}
                    </p>
                    <button
                      onClick={() => {
                        dispatch(actions.setActiveTab("all"));
                        dispatch(actions.setSearchTerm(""));
                      }}
                      className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Show all currencies
                    </button>
                  </div>
                )}

              {/* Selection Summary */}
              {selectedAccounts.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">
                        Your Selection
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedAccounts.length} account
                        {selectedAccounts.length !== 1 ? "s" : ""} selected
                      </p>
                    </div>
                    <button
                      onClick={() => dispatch(actions.clearSelectedAccounts())}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Selected Account Details */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedAccounts.map((accountId) => {
                      const account = accountOptions.find(
                        (acc) =>
                          `${acc.service_provide_id}-${acc.accountType?.toLowerCase()}` ===
                          accountId,
                      );
                      if (!account) return null;

                      return (
                        <div
                          key={accountId}
                          className="flex items-center p-2 bg-white rounded-lg"
                        >
                          <div className="bg-blue-100 p-2 rounded-lg mr-3">
                            <FontAwesomeIcon
                              icon={getCurrencyIcon(account.currency)}
                              className="text-blue-600"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">
                              {account.currency} - {account.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {account.accountType === "named"
                                ? "Named Account"
                                : "Pooled Account"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Package View (if enabled) */}
          {isPartnerPackageModule === "Y" && !remittanceOnlyAccepted ? (
            <div className="mb-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Premium Currency Packages
                </h3>
                <p className="text-gray-600">
                  Choose a package that fits your international needs
                </p>
              </div>

              <div className="space-y-6">
                {packageOptions.map((pkg) => {
                  const isActivePackage = monthlyCharge === pkg.package_name;
                  const selectedCount = selectedPackageCurrencies.length;
                  const isPackageCompatible =
                    selectedCount <= pkg.package_accountCount;
                  const remainingAccounts =
                    pkg.package_accountCount - selectedCount;

                  return (
                    <div
                      key={pkg.package_id}
                      className={`bg-gradient-to-b from-white to-slate-50 rounded-2xl border-2 p-6 transition-all hover:shadow-md ${
                        isActivePackage
                          ? "border-blue-500 ring-2 ring-blue-100 shadow-sm"
                          : "border-slate-200"
                      } ${
                        !isPackageCompatible && selectedCount > 0
                          ? "opacity-60 cursor-not-allowed"
                          : "cursor-pointer hover:border-blue-300"
                      }`}
                      onClick={() => {
                        if (isPackageCompatible || selectedCount === 0) {
                          // Allow interaction if compatible or no selections
                        }
                      }}
                    >
                      {/* Package Header */}
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-xl font-bold text-gray-900">
                              {pkg.package_name}
                            </h4>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                pkg.account_type === "named"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-indigo-100 text-indigo-800"
                              }`}
                            >
                              {pkg.account_type === "named"
                                ? "Named Account"
                                : "Pooled Account"}
                            </span>
                          </div>

                          {pkg.package_services && (
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Services:</span>{" "}
                              {pkg.package_services}
                            </p>
                          )}

                          {/* Account Count Indicator */}
                          <div className="flex items-center gap-2 mt-3">
                            <div className="flex items-center text-sm text-gray-600">
                              <FontAwesomeIcon
                                icon={faUsers}
                                className="mr-1"
                              />
                              <span className="font-medium">
                                {pkg.package_accountCount}
                              </span>
                              <span className="ml-1">
                                {pkg.package_accountCount === 1
                                  ? "Account"
                                  : "Accounts"}{" "}
                                included
                              </span>
                            </div>

                            {selectedCount > 0 && (
                              <div
                                className={`text-sm px-3 py-1 rounded-full ${
                                  isPackageCompatible
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {isPackageCompatible
                                  ? `${remainingAccounts} account${remainingAccounts !== 1 ? "s" : ""} remaining`
                                  : `Exceeds package limit by ${selectedCount - pkg.package_accountCount}`}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price Section */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {pkg.package_fee} {pkg.package_currency}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pkg.package_fee === "0.00"
                              ? "Free forever"
                              : "Monthly fee"}
                          </div>
                          {isActivePackage && (
                            <div className="mt-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                              Your current selection
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Currencies Grid */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-700">
                            Available Currencies ({pkg.currencies?.length || 0})
                          </h5>
                          <div className="text-sm text-gray-500">
                            Select up to {pkg.package_accountCount} currency
                            {pkg.package_accountCount !== 1 ? "s" : ""}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {pkg.currencies?.map((curr) => {
                            const isSel = selectedPackageCurrencies.includes(
                              curr.currency_id,
                            );
                            const isDisabled = !isPackageCompatible && !isSel;

                            return (
                              <div
                                key={curr.currency_id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isDisabled) {
                                    handleTogglePackage(curr.currency_id);
                                  }
                                }}
                                className={`p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${
                                  isSel
                                    ? "border-blue-500 bg-blue-50 shadow-sm"
                                    : isDisabled
                                      ? "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                                      : "border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer"
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                                    isSel
                                      ? "bg-blue-500 border-blue-500"
                                      : "bg-white border-gray-300"
                                  } ${isDisabled ? "opacity-50" : ""}`}
                                >
                                  {isSel && (
                                    <FontAwesomeIcon
                                      icon={faCheckCircle}
                                      className="text-white text-xs"
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-800 truncate">
                                    {curr.currency_code}
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    {curr.ssn_required === "Y" && (
                                      <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                                        SSN
                                      </span>
                                    )}
                                    {curr.document_upload === "Y" && (
                                      <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                                        Docs
                                      </span>
                                    )}
                                    {curr.kyc_verify === "Y" && (
                                      <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                        KYC
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Fees Link */}
                        {pkg.currencies?.[0]?.fees_url && (
                          <div className="mt-3 text-center">
                            <a
                              href={pkg.currencies[0].fees_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <FontAwesomeIcon
                                icon={faInfoCircle}
                                className="mr-1"
                              />
                              View fees and charges for this package
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Package Features Summary */}
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                            <span>
                              {pkg.package_accountCount} currency account
                              {pkg.package_accountCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                            <span>
                              {pkg.account_type === "named"
                                ? "Dedicated IBAN"
                                : "Shared IBAN"}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                            <span>
                              {pkg.package_services?.split(",").length || 0}{" "}
                              services
                            </span>
                          </div>
                          {pkg.package_fee !== "0.00" && (
                            <div className="flex items-center text-sm text-gray-600">
                              <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                              <span>Monthly billing</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Package Selection Summary */}
              {selectedPackageCurrencies.length > 0 && (
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">
                        Your Package Selection
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Selected {selectedPackageCurrencies.length} currency
                        account
                        {selectedPackageCurrencies.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      {monthlyCharge ? (
                        <>
                          <div className="text-lg font-bold text-blue-600">
                            {monthlyCharge}
                          </div>
                          <div className="text-sm text-gray-500">
                            Recommended package
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Select a compatible package
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : isPartnerPackageModule === "Y" && remittanceOnlyAccepted ? (
            // Remittance Only View for Package Module
            <div className="mb-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  International Payments Account
                </h3>
                <p className="text-gray-600">
                  Send and receive money internationally without maintaining
                  currency accounts
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <FontAwesomeIcon
                      icon={faExchangeAlt}
                      className="text-green-600 text-2xl"
                    />
                  </div>

                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    Remittance Services Only
                  </h4>

                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    You've selected the remittance-only service. This allows you
                    to send and receive international payments without the need
                    to maintain multiple currency accounts. Perfect for
                    occasional transfers or when you don't need to hold foreign
                    currencies.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-green-100">
                      <div className="flex items-center mb-2">
                        <div className="bg-green-100 p-2 rounded-lg mr-3">
                          <FontAwesomeIcon
                            icon={faClock}
                            className="text-green-600"
                          />
                        </div>
                        <h5 className="font-semibold text-gray-900">
                          Fast Transfers
                        </h5>
                      </div>
                      <p className="text-sm text-gray-600">
                        Send money internationally in 1-2 business days
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-green-100">
                      <div className="flex items-center mb-2">
                        <div className="bg-green-100 p-2 rounded-lg mr-3">
                          <FontAwesomeIcon
                            icon={faPercent}
                            className="text-green-600"
                          />
                        </div>
                        <h5 className="font-semibold text-gray-900">
                          Competitive Rates
                        </h5>
                      </div>
                      <p className="text-sm text-gray-600">
                        Better exchange rates than traditional banks
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-green-100">
                      <div className="flex items-center mb-2">
                        <div className="bg-green-100 p-2 rounded-lg mr-3">
                          <FontAwesomeIcon
                            icon={faShieldAlt}
                            className="text-green-600"
                          />
                        </div>
                        <h5 className="font-semibold text-gray-900">Secure</h5>
                      </div>
                      <p className="text-sm text-gray-600">
                        Bank-level security for all your transactions
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-3 bg-green-100 text-green-800 px-4 py-3 rounded-xl">
                    <FontAwesomeIcon icon={faInfoCircle} />
                    <span className="font-medium">
                      No monthly fees - Pay only for transactions you make
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Terms and Remittance Checkbox */}
          <div className="mb-6 space-y-3">
            <div className="flex items-start p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <input
                  type="checkbox"
                  id="termsAcceptance"
                  checked={termsAccepted}
                  onChange={(e) =>
                    dispatch(actions.setTermsAccepted(e.target.checked))
                  }
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
                        "Terms and conditions would be displayed here. In a real implementation, this would show the actual terms content.",
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

            {((isPartner === "Y" && showRemitOnly === "Y") ||
              isPartner === "0") && (
              <div className="flex items-start p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <input
                    type="checkbox"
                    id="remittanceOnly"
                    checked={remittanceOnlyAccepted}
                    onChange={(e) =>
                      dispatch(
                        actions.setRemittanceOnlyAccepted(e.target.checked),
                      )
                    }
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
                <label
                  htmlFor="remittanceOnly"
                  className="ml-3 text-gray-700 text-sm flex flex-col"
                >
                  <div className="flex items-center">
                    <span className="mr-1">Activate</span>
                    <span className="text-blue-600 font-medium mr-1">
                      Remittance Only
                    </span>
                    <span>mode (for money transfers only)</span>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Referral Code */}
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
                onChange={(e) =>
                  dispatch(actions.setReferralCode(e.target.value))
                }
                placeholder="Enter referral code"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-gray-50 focus:bg-white"
              />
              {isReferralValidating && (
                <div className="absolute right-3 top-3 flex items-center justify-center">
                  <RingLoader color="#3B82F6" size={20} />
                </div>
              )}
              {referralError && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                  {referralError}
                </p>
              )}
              {referralSuccessMessage && (
                <p className="text-green-600 text-sm mt-1 flex items-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                  {referralSuccessMessage}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onFinalSubmit}
              disabled={isSubmitDisabled}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPackageValidating || isReferralValidating ? (
                <div className="flex items-center justify-center">
                  <RingLoader color="#ffffff" size={20} className="mr-2" />
                  Validating...
                </div>
              ) : (
                <>
                  <span>Continue to Verification</span>
                  <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                </>
              )}
            </button>

            <button
              onClick={() => navigate(-1)}
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
                  onClick={() => navigate("/selectaccounttype")}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Go Back
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                OK
              </button>
            </div>
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
                      A Named Account is a dedicated bank account issued in the
                      customer's name. All transactions are processed directly
                      through this account, allowing funds to be received and
                      sent in the customer's own identity. This provides higher
                      transparency, better reconciliation, and improved trust
                      for business and high-volume customers.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-gray-700">
                      A Pooled Account is a shared account operated by the
                      platform on behalf of multiple customers. Individual
                      customer balances are maintained virtually within the
                      system, while actual transactions are settled through the
                      pooled account. This allows faster onboarding and
                      efficient handling for customers who do not require a
                      dedicated bank account.
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
  );
};

const AccountOptionCard = ({
  account,
  isSelected,
  onSelect,
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

          {formattedText.length > 50 && (
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpenCurrencyAccount;
