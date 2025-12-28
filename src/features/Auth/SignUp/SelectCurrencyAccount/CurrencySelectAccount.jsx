import React, { useState, useEffect, useCallback, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  CgDanger, 
  CgSearch, 
  CgChevronDown, 
  CgChevronUp,
  CgInfo,
  CgCheckO,
  CgClose
} from "react-icons/cg";
import { FiGlobe, FiShield, FiCreditCard, FiPercent } from "react-icons/fi";
import { HiOutlineCurrencyDollar, HiOutlineQuestionMarkCircle } from "react-icons/hi";
import { RiMoneyDollarCircleLine, RiBankLine } from "react-icons/ri";
import { ClipLoader } from "react-spinners";

// Import all actions and selectors
import {
  fetchAccountOptions,
  fetchPackageOptions,
  validateReferralCode,
  validateAgentCode,
  validatePackageCurrencies,
  toggleAccountSelection,
  togglePackageCurrencySelection,
  setReferralCode,
  setAgentCode,
  setTermsAccepted,
  setRemittanceOnlyAccepted,
  setSearchTerm,
  setActiveTab,
  setTermsModalOpen,
  fetchTermsContent,
  clearAllSelections,
  setReferralError,
  setAgentError,
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
  selectAgentCode,
  selectAgentError,
  selectIsReferralValidating,
  selectIsAgentValidating,
  selectValidationMessage,
  selectIsPartnerPackageModule,
  selectPackageOptions,
  selectSelectedPackageCurrencies,
  selectPackageFeesUrl,
  selectPackageLoading,
  selectPackageError,
  selectIsPackageValidating,
  selectPackageValidationMessage,
  selectIsSubmitDisabled,
  selectIsFormValid,
  selectReferralSuccessMessage,
  selectAgentSuccessMessage,
} from "./currencyAccountsSelectors";

const OpenCurrencyAccount = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const {
    accountType,
    selectedCountryId,
    show_remittance_only_on_registration,
  } = location.state || {};
  const API_URL = import.meta.env.REACT_APP_API_URL;

  // ========== STATE VARIABLES ==========
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isProcessingClick, setIsProcessingClick] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState({});
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Original state variables
  const [selectedCurrencyNumber, setSelectedCurrencyNumber] = useState(0);
  const [monthlyCharge, setMonthlyCharge] = useState("");
  const [documentUpload, setDocumentUpload] = useState("Y");
  const [kycVerify, setKycVerify] = useState("Y");
  const [ownerAdd, setOwnerAdd] = useState("Y");
  const [ssnRequired, setSsnRequired] = useState("Y");
  const [packageFeesUrlLocal, setPackageFeesUrlLocal] = useState("");
  const [selectedBankAccounts, setSelectedBankAccounts] = useState([]);

  // ========== REDUX STATE ==========
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
  const agentCode = useSelector(selectAgentCode);
  const agentError = useSelector(selectAgentError);
  const isReferralValidating = useSelector(selectIsReferralValidating);
  const isAgentValidating = useSelector(selectIsAgentValidating);
  const validationMessage = useSelector(selectValidationMessage);
  const isPartnerPackageModule = useSelector(selectIsPartnerPackageModule);
  const packageOptions = useSelector(selectPackageOptions);
  const selectedPackageCurrencies = useSelector(
    selectSelectedPackageCurrencies
  );
  const packageFeesUrl = useSelector(selectPackageFeesUrl);
  const packageLoading = useSelector(selectPackageLoading);
  const packageError = useSelector(selectPackageError);
  const isPackageValidating = useSelector(selectIsPackageValidating);
  const packageValidationMessage = useSelector(selectPackageValidationMessage);
  const isSubmitDisabled = useSelector(selectIsSubmitDisabled);
  const isFormValid = useSelector(selectIsFormValid);
  const referralSuccessMessage = useSelector(selectReferralSuccessMessage);
  const agentSuccessMessage = useSelector(selectAgentSuccessMessage);

  const bearertoken = localStorage.getItem("bearertoken");
  const iswhitelabelledpartner = localStorage.getItem("iswhitelabelledpartner");
  const whitelabelledpartnerid = localStorage.getItem("whitelabelledpartnerid");
  const showRemittanceOnlyOnRegistration = localStorage.getItem(
    "showRemittanceOnlyOnRegistration"
  );
  const hostName = window.location.hostname;
  const urlHostName = window.location.hostname;

  // ========== EFFECTS ==========

  // Effect 1: Fetch data on mount
  useEffect(() => {
    if (!accountType) {
      console.error("Account type is not defined");
      return;
    }

    if (isPartnerPackageModule === "Y") {
      // Fetch package options
      dispatch(
        fetchPackageOptions({
          accountType,
          partnerId: whitelabelledpartnerid,
          API_URL,
        })
      );
    } else {
      // Fetch regular account options
      dispatch(
        fetchAccountOptions({
          accountType,
          countryId: selectedCountryId,
          API_URL,
        })
      );
    }

    // Clear selections on mount
    dispatch(clearAllSelections());
    setSelectedBankAccounts([]);
    setSelectedCurrencyNumber(0);
    setMonthlyCharge("");
  }, [accountType, selectedCountryId, isPartnerPackageModule, dispatch]);

  // Effect 2: Update selected currency number and monthly charge
  useEffect(() => {
    const selectedCount =
      isPartnerPackageModule === "Y"
        ? selectedPackageCurrencies.length
        : selectedAccounts.length;

    setSelectedCurrencyNumber(selectedCount);

    // Original monthly charge logic for partner flow
    if (iswhitelabelledpartner === "1" && isPartnerPackageModule === "N") {
      const fetchMonthlyCharge = async () => {
        try {
          if (selectedCount === 0) {
            setMonthlyCharge("");
            return;
          }

          const response = await fetch(
            `${API_URL}/package/list/${whitelabelledpartnerid}/${accountType}`,
            {
              headers: { Authorization: `Bearer ${bearertoken}` },
            }
          );

          if (response.ok) {
            const data = await response.json();
            // Find appropriate package based on selection count
            const packageForCount = data.data?.find(
              (pkg) => pkg.package_accountCount === selectedCount
            );

            if (packageForCount) {
              setMonthlyCharge(packageForCount.package_name || "");
            } else {
              setMonthlyCharge("");
            }
          }
        } catch (error) {
          console.error("Failed to fetch monthly charge:", error);
          setMonthlyCharge("");
        }
      };

      fetchMonthlyCharge();
    } else {
      setMonthlyCharge("");
    }
  }, [
    selectedAccounts,
    selectedPackageCurrencies,
    isPartnerPackageModule,
    iswhitelabelledpartner,
    whitelabelledpartnerid,
    accountType,
    API_URL,
    bearertoken,
  ]);

  // Effect 3: Update package fees URL when package options change
  useEffect(() => {
    if (
      isPartnerPackageModule === "Y" &&
      packageOptions.length > 0 &&
      packageOptions[0].currencies
    ) {
      const firstCurrency = packageOptions[0].currencies[0];
      if (firstCurrency.fees_url) {
        setPackageFeesUrlLocal(firstCurrency.fees_url);
      }
    }
  }, [packageOptions, isPartnerPackageModule]);

  // ========== HANDLERS ==========

  // Handle account selection
  const handleAccountSelect = useCallback(
    (
      accountIndex,
      service_provide_id_type,
      documentUploadCheck = "Y",
      kycVerifyCheck = "Y",
      ownerAddCheck = "Y",
      ssnRequiredParam = "Y",
      feesUrl = ""
    ) => {
      // Update local state
      setDocumentUpload(documentUploadCheck);
      setKycVerify(kycVerifyCheck);
      setOwnerAdd(ownerAddCheck);
      setSsnRequired(ssnRequiredParam);

      if (feesUrl) {
        setPackageFeesUrlLocal(feesUrl);
      }

      // Dispatch to Redux
      dispatch(toggleAccountSelection(service_provide_id_type));

      // Update selected bank accounts
      setSelectedBankAccounts((prevSelectedBankAccounts) =>
        prevSelectedBankAccounts.includes(service_provide_id_type)
          ? prevSelectedBankAccounts.filter(
              (item) => item !== service_provide_id_type
            )
          : [...prevSelectedBankAccounts, service_provide_id_type]
      );
    },
    [dispatch]
  );

  // Handle package currency selection
  const handlePackageCurrencySelect = useCallback(
    (currencyId, packageOption) => {
      if (isProcessingClick) {
        return;
      }

      setIsProcessingClick(true);

      dispatch(
        togglePackageCurrencySelection({
          currencyId,
          packageOption,
        })
      );

      setTimeout(() => {
        setIsProcessingClick(false);
      }, 500);
    },
    [dispatch, isProcessingClick]
  );

  // Original referral code handler
  const handleReferral = useCallback(
    (event) => {
      const value = event.target.value;
      dispatch(setReferralCode(value));

      if (value && value.length > 10) {
        dispatch(setReferralError("The provided Referral code is Invalid"));
      } else {
        dispatch(setReferralError(""));
      }
    },
    [dispatch]
  );

  // Original agent code handler
  const handleAgent = useCallback(
    (event) => {
      const value = event.target.value;
      dispatch(setAgentCode(value));

      if (value && value.length > 10) {
        dispatch(setAgentError("The provided Agent Code is invalid"));
      } else {
        dispatch(setAgentError(""));
      }
    },
    [dispatch]
  );

  // Original referral validation
  const validateReferralCodeOriginal = useCallback(async () => {
    if (!referralCode || referralCode.trim() === "") {
      return true;
    }

    try {
      const result = await dispatch(
        validateReferralCode(referralCode)
      ).unwrap();
      return result.isValid !== false;
    } catch (error) {
      setModalMessage("Referral code is invalid!");
      setIsModalOpen(true);
      return false;
    }
  }, [dispatch, referralCode]);

  // Original agent validation
  const validateAgentCodeOriginal = useCallback(async () => {
    if (!agentCode || agentCode.trim() === "") {
      return true;
    }

    try {
      const result = await dispatch(validateAgentCode(agentCode)).unwrap();
      return result.isValid !== false;
    } catch (error) {
      setModalMessage("Agent Code Invalid");
      setIsModalOpen(true);
      return false;
    }
  }, [dispatch, agentCode]);

  // Toggle account details expansion
  const toggleAccountExpansion = useCallback((accountId) => {
    setExpandedAccounts((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  }, []);

  // Handle search term change
  const handleSearchChange = useCallback(
    (e) => {
      dispatch(setSearchTerm(e.target.value));
    },
    [dispatch]
  );

  // Handle tab change
  const handleTabChange = useCallback(
    (tab) => {
      dispatch(setActiveTab(tab));
    },
    [dispatch]
  );

  // Handle remittance only toggle
  const handleRemittanceOnlyToggle = useCallback(
    (e) => {
      dispatch(setRemittanceOnlyAccepted(e.target.checked));
    },
    [dispatch]
  );

  // Handle terms acceptance
  const handleTermsAccepted = useCallback(
    (e) => {
      dispatch(setTermsAccepted(e.target.checked));
    },
    [dispatch]
  );

  // Handle terms view
  const handleViewTerms = useCallback(
    (url) => {
      if (url) {
        dispatch(fetchTermsContent(url));
      }
    },
    [dispatch]
  );

  // Close terms modal
  const closeTermsModal = useCallback(() => {
    dispatch(setTermsModalOpen(false));
  }, [dispatch]);

  // Original submit handler
  const handleSubmit = useCallback(async () => {
    if (isSubmitDisabled) {
      console.log("Submit is disabled");
      return;
    }

    // Original validation for regular mode
    if (isPartnerPackageModule === "N") {
      if (selectedAccounts.length === 0 && !remittanceOnlyAccepted) {
        setModalMessage("Select at least one account to proceed");
        setIsModalOpen(true);
        return;
      }
    }

    // Original terms validation
    if (!termsAccepted) {
      if (hostName !== "tumatuma.unlimitedremit.com") {
        setModalMessage(
          "Please confirm that you agree on the Charges and Fees"
        );
        setIsModalOpen(true);
        return;
      }
    }

    // Original referral validation
    if (referralCode) {
      const isValidReferral = await validateReferralCodeOriginal();
      if (!isValidReferral) return;
    }

    // Original agent validation
    if (agentCode && urlHostName === "ourzap.unlimitedremit.com") {
      const isValidAgent = await validateAgentCodeOriginal();
      if (!isValidAgent) return;
    }

    // Package mode validation
    if (
      isPartnerPackageModule === "Y" &&
      selectedPackageCurrencies.length > 0
    ) {
      try {
        const validationResult = await dispatch(
          validatePackageCurrencies({
            selectedPackageCurrencies,
            partnerId: whitelabelledpartnerid,
          })
        ).unwrap();

        if (validationResult && validationResult.error) {
          setModalMessage(validationResult.error);
          setIsModalOpen(true);
          return;
        }
      } catch (error) {
        setModalMessage("Package validation failed");
        setIsModalOpen(true);
        return;
      }
    }

    // Prepare EXACT original data structure
    const stateData = {
      service_provide_ids:
        isPartnerPackageModule === "Y" ? [] : selectedAccounts,
      accountOptions: accountOptions,
      referral_code: referralCode,
      agent_code: agentCode,
      is_remit: remittanceOnlyAccepted ? 1 : 0,
      document_upload: documentUpload,
      kyc_verify: kycVerify,
      owner_add: ownerAdd,
      bank_accounts: selectedBankAccounts,
      package_currencies: selectedPackageCurrencies,
      ssn_required: ssnRequired,
      monthlyCharge: monthlyCharge,
      selectedCurrencyNumber: selectedCurrencyNumber,
    };

    // Navigate based on account type
    if (accountType === "individual") {
      navigate("/signupindividual", { state: stateData });
    } else if (accountType === "institution") {
      navigate("/institution", { state: stateData });
    }
  }, [
    isSubmitDisabled,
    isPartnerPackageModule,
    selectedAccounts,
    remittanceOnlyAccepted,
    termsAccepted,
    hostName,
    referralCode,
    agentCode,
    urlHostName,
    selectedPackageCurrencies,
    dispatch,
    whitelabelledpartnerid,
    accountOptions,
    documentUpload,
    kycVerify,
    ownerAdd,
    selectedBankAccounts,
    ssnRequired,
    monthlyCharge,
    selectedCurrencyNumber,
    accountType,
    navigate,
    validateReferralCodeOriginal,
    validateAgentCodeOriginal,
  ]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate("/selectaccounttype");
  }, [navigate]);

  // Handle charges and fees click
  const handleChargesAndFees = useCallback((url) => {
    if (url && url.trim() !== "" && url !== "No URL available") {
      window.open(url, "_blank");
    } else {
      alert("Charges and fees information not available");
    }
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalMessage("");
  }, []);

  // ========== UI COMPONENTS ==========

  // AccountOption component - Enhanced
  const AccountOption = useCallback(
    ({
      option,
      index,
      selectedAccounts,
      handleAccountSelect,
      handleChargesAndFees,
      type = "named",
    }) => {
      const isExpanded = expandedAccounts[option.service_provide_id_type];
      const isSelected = selectedAccounts.includes(option.service_provide_id_type);

      const formatAccountDetails = (text, currency) => {
        if (!currency) return text;
        const cleanedText = text?.replace(/\([A-Z]{3}\)\s*/g, "") || "";
        return `(${currency}) ${cleanedText}`;
      };

      const formattedText = formatAccountDetails(
        option.account_opening_details,
        option.currency
      );

      const getAccountIcon = () => {
        if (option.currency?.includes("USD")) return <RiMoneyDollarCircleLine className="h-5 w-5" />;
        if (option.currency?.includes("EUR")) return <FiCreditCard className="h-5 w-5" />;
        if (option.currency?.includes("GBP")) return <RiBankLine className="h-5 w-5" />;
        return <HiOutlineCurrencyDollar className="h-5 w-5" />;
      };

      return (
        <div
          className={`w-full rounded-xl p-4 cursor-pointer transition-all duration-300 border-2 ${
            isSelected
              ? type === "named"
                ? "border-green-500 bg-green-50 shadow-lg"
                : "border-blue-500 bg-blue-50 shadow-lg"
              : "border-gray-200 bg-white hover:shadow-md"
          }`}
          onClick={() =>
            handleAccountSelect(
              index,
              option.service_provide_id_type,
              option.document_upload,
              option.kyc_verify,
              option.owner_add,
              option.ssn_required,
              option.fees_url
            )
          }
        >
          <div className="flex items-start">
            {/* Custom Checkbox */}
            <div className={`flex-shrink-0 mr-3 mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              isSelected
                ? type === "named"
                  ? "border-green-500 bg-green-500"
                  : "border-blue-500 bg-blue-500"
                : "border-gray-300"
            }`}>
              {isSelected && (
                <CgCheckO className="h-4 w-4 text-white" />
              )}
            </div>

            {/* Content */}
            <div className="flex-grow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    type === "named" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                  }`}>
                    {getAccountIcon()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {option.currency} Account
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {isExpanded ? formattedText : formattedText.substring(0, 60) + (formattedText.length > 60 ? '...' : '')}
                    </p>
                  </div>
                </div>
                
                {hostName !== "tumatuma.unlimitedremit.com" && option.url && (
                  <button
                    type="button"
                    className="flex-shrink-0 ml-2 text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChargesAndFees(option.url);
                    }}
                  >
                    View Fees
                  </button>
                )}
              </div>

              {/* Account Details Toggle */}
              {formattedText.length > 60 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAccountExpansion(option.service_provide_id_type);
                  }}
                  className="mt-2 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  {isExpanded ? (
                    <>
                      Show Less <CgChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show More <CgChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}

              {/* Features */}
              <div className="mt-3 flex flex-wrap gap-2">
                {option.document_upload === "Y" && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                    <FiShield className="h-3 w-3" /> Document Upload
                  </span>
                )}
                {option.kyc_verify === "Y" && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                    <CgCheckO className="h-3 w-3" /> KYC Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    },
    [expandedAccounts, hostName, toggleAccountExpansion]
  );

  // Package Currency Component
  const PackageCurrencyOption = useCallback(
    ({ currency, packageOption, isSelected, index, currencyIndex }) => {
      const handleSelect = (e) => {
        e.stopPropagation();
        handlePackageCurrencySelect(currency.currency_id, packageOption);
      };

      const getPackageColor = (pkg) => {
        const name = pkg.package_name || "";
        const fee = pkg.package_fee || "";

        if (name.toLowerCase().includes("world")) return "purple";
        if (fee === "0" || fee.toLowerCase().includes("free")) return "green";
        if (name.toLowerCase().includes("uae")) return "amber";
        return "blue";
      };

      const colorClass = getPackageColor(packageOption);

      return (
        <div
          className={`rounded-xl p-4 cursor-pointer transition-all duration-300 border-2 ${
            isSelected
              ? `border-${colorClass}-500 bg-${colorClass}-50 shadow-lg`
              : "border-gray-200 bg-white hover:shadow-md"
          }`}
          onClick={handleSelect}
        >
          <div className="flex items-start">
            {/* Radio Button */}
            <div className={`flex-shrink-0 mr-3 mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              isSelected
                ? `border-${colorClass}-500 bg-${colorClass}-500`
                : "border-gray-300"
            }`}>
              {isSelected && (
                <div className="h-3 w-3 rounded-full bg-white"></div>
              )}
            </div>

            {/* Content */}
            <div className="flex-grow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${colorClass}-100 text-${colorClass}-600`}>
                    <HiOutlineCurrencyDollar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {currency.currency_code}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {currency.currency_name}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${colorClass}-100 text-${colorClass}-700`}>
                        {packageOption.package_name}
                      </span>
                      {packageOption.package_fee === "0" && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                          Free
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {currency.fees_url && (
                  <a
                    href={currency.fees_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 ml-2 text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Fees
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    },
    [handlePackageCurrencySelect]
  );

  // ========== RENDER ==========

  // Show loading with enhanced UI
  if (loading || packageLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto"></div>
            <FiGlobe className="h-10 w-10 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Loading Accounts
            </h2>
            <p className="text-gray-600">
              Preparing your currency account options...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const uniqueCurrencies = [...new Set(accountOptions.map(acc => acc.currency).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            <FiGlobe className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Open Universal Currency Account
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
            {ucaDescription || "Select your preferred currency accounts to get started with global banking."}
          </p>
        </div>

        {/* Error Display */}
        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <CgDanger className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Error Loading Accounts</p>
              <p className="text-red-600 text-sm mt-1">{apiError}</p>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Card Header */}
          <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Account Selection</h2>
                <p className="text-gray-300 text-sm mt-1">
                  Choose your currency accounts below
                </p>
              </div>
              
              {/* Selection Summary */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedCurrencyNumber}</div>
                  <div className="text-xs text-gray-300">Selected</div>
                </div>
                {monthlyCharge && (
                  <div className="text-center">
                    <div className="text-sm font-medium">{monthlyCharge}</div>
                    <div className="text-xs text-gray-300">Package</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6">
            {/* Search Bar - Regular Mode */}
            {isPartnerPackageModule === "N" && (
              <div className="mb-8">
                <div className={`relative ${isSearchFocused ? 'ring-2 ring-blue-500 ring-offset-2' : ''} rounded-xl transition-all duration-200`}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CgSearch className={`h-5 w-5 ${isSearchFocused ? 'text-blue-500' : 'text-gray-400'}`} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search accounts by currency or name..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            )}

            {/* Currency Filter Tabs */}
            {isPartnerPackageModule === "N" && uniqueCurrencies.length > 1 && (
              <div className="mb-8">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleTabChange("all")}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      activeTab === "all"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <FiGlobe className="h-4 w-4" />
                    All Currencies
                  </button>
                  {uniqueCurrencies.map((currency) => (
                    <button
                      key={currency}
                      onClick={() => handleTabChange(currency)}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                        activeTab === currency
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <HiOutlineCurrencyDollar className="h-4 w-4" />
                      {currency}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Content Area */}
            {isPartnerPackageModule === "N" ? (
              <>
                {/* Named Accounts Section */}
                {filteredNamedAccounts.length > 0 && (
                  <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-green-100 text-green-600">
                        <FiCreditCard className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Named Accounts
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {filteredNamedAccounts.length} accounts available
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {filteredNamedAccounts.map((option, index) => (
                        <AccountOption
                          key={`named-${index}`}
                          option={option}
                          index={index}
                          selectedAccounts={selectedAccounts}
                          handleAccountSelect={handleAccountSelect}
                          handleChargesAndFees={handleChargesAndFees}
                          type="named"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Pooled Accounts Section */}
                {filteredPooledAccounts.length > 0 && (
                  <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <RiBankLine className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Pooled Accounts
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {filteredPooledAccounts.length} accounts available
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {filteredPooledAccounts.map((option, index) => (
                        <AccountOption
                          key={`pooled-${index}`}
                          option={option}
                          index={index}
                          selectedAccounts={selectedAccounts}
                          handleAccountSelect={handleAccountSelect}
                          handleChargesAndFees={handleChargesAndFees}
                          type="pooled"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filteredNamedAccounts.length === 0 &&
                  filteredPooledAccounts.length === 0 &&
                  searchTerm && (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <CgSearch className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No accounts found
                      </h3>
                      <p className="text-gray-600">
                        No accounts match "{searchTerm}". Try a different search term.
                      </p>
                    </div>
                  )}
              </>
            ) : (
              /* Package Mode */
              <div className="space-y-8">
                {/* Important Notice */}
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600 flex-shrink-0">
                      <CgInfo className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-yellow-800 mb-2">
                        Selection Guidelines
                      </h4>
                      <ul className="text-yellow-700 space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                          Select exactly 1 currency across all packages
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                          Each package offers specific currency options
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                          View fees before making your selection
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Package Options */}
                {packageOptions.map((packageOption, index) => {
                  const colorClass = () => {
                    const name = packageOption.package_name || "";
                    const fee = packageOption.package_fee || "";

                    if (name.toLowerCase().includes("world")) return "purple";
                    if (fee === "0" || fee.toLowerCase().includes("free")) return "green";
                    if (name.toLowerCase().includes("uae")) return "amber";
                    return "blue";
                  };

                  const color = colorClass();

                  return (
                    <div key={`package-${index}`} className="space-y-4">
                      {/* Package Header */}
                      <div className={`bg-gradient-to-r from-${color}-50 to-${color}-100 border border-${color}-200 rounded-xl p-5`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-lg bg-white text-${color}-600 shadow-sm`}>
                              <HiOutlineCurrencyDollar className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {packageOption.package_name}
                              </h3>
                              <div className="flex items-center gap-3 mt-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${color}-100 text-${color}-700`}>
                                  {packageOption.package_fee} {packageOption.package_currency}
                                </span>
                                {packageOption.package_fee === "0" && (
                                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                    Free Account
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Includes</div>
                            <div className="text-lg font-bold text-gray-900">
                              {packageOption.package_accountCount} currency option{packageOption.package_accountCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Currency Options */}
                      <div className="space-y-3">
                        {packageOption.currencies?.map((currency, currencyIndex) => {
                          const isSelected = selectedPackageCurrencies.includes(currency.currency_id);
                          return (
                            <PackageCurrencyOption
                              key={`currency-${index}-${currencyIndex}`}
                              currency={currency}
                              packageOption={packageOption}
                              isSelected={isSelected}
                              index={index}
                              currencyIndex={currencyIndex}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Remittance Only Option */}
            {((iswhitelabelledpartner === "Y" &&
              showRemittanceOnlyOnRegistration === "Y" &&
              show_remittance_only_on_registration === "Y") ||
              iswhitelabelledpartner === "0") && (
              <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={remittanceOnlyAccepted}
                      onChange={handleRemittanceOnlyToggle}
                      className="sr-only peer"
                      value="1"
                    />
                    <div className={`h-6 w-6 rounded border-2 flex items-center justify-center transition-all duration-200 peer-checked:bg-red-500 peer-checked:border-red-500 ${
                      remittanceOnlyAccepted ? 'bg-red-500 border-red-500' : 'border-gray-300'
                    }`}>
                      {remittanceOnlyAccepted && (
                        <CgCheckO className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <span className="font-medium text-gray-900">Remittance Only Account</span>
                    <p className="text-sm text-gray-600 mt-1">
                      Select if you only need remittance services without a full currency account
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="mt-8 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white text-blue-600 flex-shrink-0">
                  <FiShield className="h-5 w-5" />
                </div>
                <div className="flex-grow">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative mt-1">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={handleTermsAccepted}
                        className="sr-only peer"
                      />
                      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all duration-200 peer-checked:bg-blue-600 peer-checked:border-blue-600 ${
                        termsAccepted ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      }`}>
                        {termsAccepted && (
                          <CgCheckO className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">
                        I agree to the Terms & Conditions
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        {termsText || "Please review and accept the charges and fees"}
                      </p>
                      {isPartnerPackageModule === "Y" && packageFeesUrlLocal && (
                        <a
                          href={packageFeesUrlLocal}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm mt-2"
                        >
                          <HiOutlineQuestionMarkCircle className="h-4 w-4" />
                          View detailed terms and fees
                        </a>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Referral and Agent Codes */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              {/* Referral Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referral Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={handleReferral}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Enter referral code (optional)"
                  />
                  {referralSuccessMessage && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CgCheckO className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
                {referralError && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <CgDanger className="h-4 w-4 flex-shrink-0" />
                    <span>{referralError}</span>
                  </div>
                )}
                {referralSuccessMessage && (
                  <div className="mt-2 text-sm text-green-600">
                    {referralSuccessMessage}
                  </div>
                )}
              </div>

              {/* Agent Code */}
              {urlHostName === "ourzap.unlimitedremit.com" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={agentCode}
                      onChange={handleAgent}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="Enter agent code (optional)"
                    />
                    {agentSuccessMessage && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CgCheckO className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {agentError && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                      <CgDanger className="h-4 w-4 flex-shrink-0" />
                      <span>{agentError}</span>
                    </div>
                  )}
                  {agentSuccessMessage && (
                    <div className="mt-2 text-sm text-green-600">
                      {agentSuccessMessage}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-10 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitDisabled}
                  className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                    isSubmitDisabled
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-200"
                  }`}
                >
                  {isPackageValidating || isReferralValidating || isAgentValidating ? (
                    <>
                      <ClipLoader color="#ffffff" size={20} />
                      <span>Validating...</span>
                    </>
                  ) : (
                    <>
                      <CgCheckO className="h-5 w-5" />
                      Continue to Register
                    </>
                  )}
                </button>

                <button
                  onClick={handleCancel}
                  className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <CgClose className="h-5 w-5" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Need help? Contact our support team for assistance with account selection.</p>
        </div>
      </div>

      {/* Modal for messages */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <CgDanger className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Attention Required
              </h3>
              <p className="text-gray-600 mb-6">
                {modalMessage}
              </p>
              <button
                onClick={closeModal}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 w-full"
              >
                Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {termsModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl max-h-[80vh] w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <FiShield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Terms and Conditions
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Please read carefully before proceeding
                  </p>
                </div>
              </div>
              <button
                onClick={closeTermsModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CgClose className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <div
              className="flex-grow overflow-y-auto prose max-w-none"
              dangerouslySetInnerHTML={{ __html: termsContent }}
            />
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={closeTermsModal}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default OpenCurrencyAccount;