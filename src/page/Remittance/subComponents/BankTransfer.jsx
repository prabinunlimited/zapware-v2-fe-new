import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaUniversity,
  FaFileUpload,
  FaExclamationTriangle,
  FaSearch,
  FaUpload,
  FaUser,
  FaInfoCircle,
  FaBriefcase,
  FaMoneyBillWave,
  FaPlus,
  FaBuilding,
  FaCreditCard,
  FaCheckCircle,
} from "react-icons/fa";
import { RingLoader } from "react-spinners";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

// Import Redux actions
import { setFormField } from "../slices/remittanceSlice";
import {
  selectBeneficiaries,
  setSelectedBeneficiary,
  setSelectedBank,
  fetchBeneficiaryBanks,
  fetchBeneficiaryByCode,
  selectRemittanceReadyBeneficiaries,
  selectRemittanceReadyBanks,
  selectBeneficiariesLoading,
  fetchBeneficiaries,
  selectBeneficiaryBanks,
  selectBanksLoading,
} from "../../Beneficiary/MyBeneficiaries/BeneficiariesSlice";

// Import deposit slice actions and selectors
import {
  checkSilaBankAccounts,
  selectSilaBankAccounts,
  selectHasSilaAccounts,
  selectSilaAccountsLoading,
  selectSilaAccountsError,
  setSelectedBankAccount
} from "../../Deposit/slices/depositSlice";

import PaymentInitiation from "../../Deposit/components/PaymentInitiation/PaymentInitiation";
import { setShowPaymentInitiation } from "../../Deposit/slices/depositSlice";

// ========== MOBILE RESPONSIVE SELECT STYLES ==========
const getSelectStyles = (isMobile) => ({
  control: (base) => ({
    ...base,
    minHeight: isMobile ? "44px" : "56px",
    borderRadius: "0.5rem",
    borderColor: "#e5e7eb",
    boxShadow: "none",
    "&:hover": { borderColor: "#9ca3af" },
    fontSize: isMobile ? "0.875rem" : "0.95rem",
  }),
  option: (base, { isSelected, isFocused }) => ({
    ...base,
    backgroundColor: isSelected
      ? "#eff6ff"
      : isFocused
        ? "#f8fafc"
        : "white",
    color: isSelected ? "#1e40af" : "#374151",
    fontWeight: isSelected ? "600" : "500",
    padding: isMobile ? "8px 12px" : "12px 16px",
    fontSize: isMobile ? "0.875rem" : "0.95rem",
    whiteSpace: "normal",
    wordBreak: "break-word",
    "&:hover": {
      backgroundColor: "#f8fafc",
    },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.5rem",
    fontSize: isMobile ? "0.875rem" : "0.95rem",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    zIndex: 9999,
    maxHeight: isMobile ? "300px" : "400px",
    overflowY: "auto",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#9ca3af",
    fontWeight: "500",
    fontSize: isMobile ? "0.875rem" : "0.95rem",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#1f2937",
    fontWeight: "600",
    fontSize: isMobile ? "0.875rem" : "0.95rem",
  }),
  input: (base) => ({
    ...base,
    fontSize: isMobile ? "0.875rem" : "0.95rem",
  }),
});

const BankTransfer = ({
  formData = {},
  manualAccountDetails,
  manualAccountError,
  manualDetailsLoading,
  onFileUpload,
  filePreview,
  selectedBeneficiary,
  selectedBank,
  onBeneficiarySelect,
  onBankSelect,
  onFieldChange,
  purposeOptions = [],
  incomeSourceOptions = [],
  relationOptions = [],
  paymentOptions = [],
  selectedCurrency,
  showPaymentInitiation,
  onSuccessCallback,
  // New props for Sila bank accounts
  silaBankAccounts = [],
  hasSilaAccounts = false,
  silaAccountsLoading = false,
  silaAccountsError = null,
  selectedBankAccount = null,
  onBankAccountSelect,
  customerId: propCustomerId,
  onSaveRemittanceState,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { customerId: paramCustomerId } = useParams();

  // Get customer ID from props or params or localStorage
  const customerId = propCustomerId || paramCustomerId || localStorage.getItem("customerId") || localStorage.getItem("authcustomer_id")

  // Get Sila bank accounts from Redux store
  const reduxSilaBankAccounts = useSelector(selectSilaBankAccounts);
  const reduxHasSilaAccounts = useSelector(selectHasSilaAccounts);
  const reduxSilaAccountsLoading = useSelector(selectSilaAccountsLoading);
  const reduxSilaAccountsError = useSelector(selectSilaAccountsError);

  // Use props if provided, otherwise use Redux store
  const displayedSilaAccounts = silaBankAccounts.length > 0 ? silaBankAccounts : reduxSilaBankAccounts;
  const displayedSilaBankAccounts = silaBankAccounts.length > 0 ? silaBankAccounts : reduxSilaBankAccounts;
  const displayedHasSilaAccounts = hasSilaAccounts || reduxHasSilaAccounts;
  const displayedSilaAccountsLoading = silaAccountsLoading || reduxSilaAccountsLoading;
  const displayedSilaAccountsError = silaAccountsError || reduxSilaAccountsError;

  const allBeneficiaries = useSelector(selectBeneficiaries);
  const beneficiariesLoading = useSelector(selectBeneficiariesLoading);
  const banksLoading = useSelector(selectBanksLoading);

  const API_URL = import.meta.env.VITE_API_URL;

  // Add local state to track if beneficiaries have been loaded
  const [beneficiariesFetched, setBeneficiariesFetched] = useState(false);

  // Transform for dropdown
  const beneficiaries = useMemo(() => {
    return (allBeneficiaries || [])
      .filter((benef) => benef?.status === 1 && benef?.active_status === 1)
      .map((benef) => ({
        ...benef,
        value: benef?.id,
        label: `${benef?.name || "Unknown"} (${benef?.full_phone_number ||
          benef?.phone_number ||
          benef?.benef_uuid ||
          "No Phone"
          })`,
        formattedName: `${benef?.name || "Unknown"} (${benef?.phone_number ||
          benef?.email ||
          benef?.benef_uuid ||
          "No Contact"
          })`,
      }));
  }, [allBeneficiaries]);

  // FETCH BENEFICIARIES ON MOUNT
  useEffect(() => {
    const customerId =
      paramCustomerId || localStorage.getItem("customerId") || "1720";

    if (
      customerId &&
      !beneficiariesFetched &&
      !beneficiariesLoading
    ) {
      console.log(
        "🔄 BankTransfer: Fetching beneficiaries for customer:",
        customerId
      );
      dispatch(fetchBeneficiaries(customerId))
        .unwrap()
        .then(() => {
          setBeneficiariesFetched(true);
        })
        .catch((error) => {
          console.error("Failed to fetch beneficiaries:", error);
          setBeneficiariesFetched(true); // Mark as fetched even on error to stop loading
        });
    }
  }, [dispatch, paramCustomerId, beneficiariesFetched, beneficiariesLoading]);

  // FETCH SILA BANK ACCOUNTS ON MOUNT
  useEffect(() => {
    const customerId = paramCustomerId || localStorage.getItem("customerId") || "1720";

    if (customerId && !displayedSilaAccountsLoading) {
      console.log("🔄 BankTransfer: Fetching Sila bank accounts for customer:", customerId);
      dispatch(checkSilaBankAccounts(customerId))
        .unwrap()
        .then(result => {
          console.log("✅ Sila bank accounts loaded:", result);
        })
        .catch(error => {
          console.error("❌ Failed to load Sila bank accounts:", error);
        });
    }
  }, [dispatch, paramCustomerId]);

  const beneficiaryBanks = useSelector(selectBeneficiaryBanks);

  // Transform Sila bank accounts for dropdown
  const silaAccountOptions = useMemo(() => {
    return (displayedSilaBankAccounts || []).map(account => {
      const accountName = account.account_name || account.accountName || 'Unknown Account';
      const accountNumber = account.accountNumberHash || account.account_number || '****';
      const provider = account.provider || account.bank || 'Unknown Bank';
      const accountType = account.account_type || account.accountType || 'Checking';

      return {
        ...account,
        value: account.id || account.account_id,
        label: `${accountName} - ${provider}`,
        fullLabel: `${accountName} - ${provider}`,
        description: `${accountType} • ${accountNumber}`,
        isDefault: account.is_default || false,
        isVerified: account.web_debit_verified || false,
        displayText: `${accountName} (${provider} - ${accountType})`,
      };
    });
  }, [displayedSilaBankAccounts]);

  // Auto-select first Sila account if available and none selected
  useEffect(() => {
    if (silaAccountOptions.length > 0 && !selectedBankAccount && onBankAccountSelect) {
      const firstAccount = silaAccountOptions[0];
      console.log("🔄 Auto-selecting first Sila account:", firstAccount);
      onBankAccountSelect(firstAccount);
    }
  }, [silaAccountOptions, selectedBankAccount, onBankAccountSelect]);

  // Local state
  const [beneficiaryCode, setBeneficiaryCode] = useState("");
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [occupations, setOccupations] = useState([]);
  const [isLoadingOccupations, setIsLoadingOccupations] = useState(false);
  const [showBankAccountInfo, setShowBankAccountInfo] = useState(false);

  const [isNavigatingToAdd, setIsNavigatingToAdd] = useState(false);

  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const [customOccupation, setCustomOccupation] = useState("");

  const [purposeInitialized, setPurposeInitialized] = useState(false);
  const [incomeInitialized, setIncomeInitialized] = useState(false);
  const [occupationInitialized, setOccupationInitialized] = useState(false);
  const [payoutInitialized, setPayoutInitialized] = useState(false);


  // Debug logging
  useEffect(() => {
    console.log("BankTransfer Props Debug:", {
      hasOnFieldChange: !!onFieldChange,
      purposeOptionsCount: purposeOptions?.length || 0,
      incomeSourceOptionsCount: incomeSourceOptions?.length || 0,
      paymentOptionsCount: paymentOptions?.length || 0,
      relationOptionsCount: relationOptions?.length || 0,
      formDataPurpose: formData?.purpose,
      formDataIncomeSource: formData?.incomeSource,
      formDataPayoutMethod: formData?.payout_method,
      silaAccountsCount: displayedSilaBankAccounts?.length || 0,
      hasSilaAccounts: displayedHasSilaAccounts,
      selectedBankAccount: selectedBankAccount,
      beneficiariesCount: beneficiaries.length,
      beneficiariesLoading: beneficiariesLoading,
      beneficiariesFetched: beneficiariesFetched,
    });
  }, [
    onFieldChange,
    purposeOptions,
    incomeSourceOptions,
    paymentOptions,
    relationOptions,
    selectedOccupation,
    formData,
    displayedSilaBankAccounts,
    displayedHasSilaAccounts,
    selectedBankAccount,
    beneficiaries.length,
    beneficiariesLoading,
    beneficiariesFetched,
  ]);

  // Default payout options - fallback if paymentOptions is empty
  const defaultPayoutOptions = useMemo(
    () => [
      { value: "bank_deposit", label: "Bank Deposit" },
      { value: "fdr_npr", label: "Fixed Deposit (NPR)" },
      { value: "fcy_deposit", label: "FCY Deposit" },
    ],
    []
  );

  // Use provided paymentOptions or fallback to defaults
  const payoutMethodOptions = useMemo(() => {
    return paymentOptions && paymentOptions.length > 0
      ? paymentOptions
      : defaultPayoutOptions;
  }, [paymentOptions, defaultPayoutOptions]);

  // Set default Payout Method to "Bank Transfer" / "Bank Deposit"
  useEffect(() => {
    if (
      payoutMethodOptions.length > 0 &&
      !payoutInitialized &&
      !formData?.payout_method
    ) {
      let defaultPayoutMethod = payoutMethodOptions.find(
        (opt) =>
          opt.value === "bank_deposit" ||
          opt.label === "Bank Deposit" ||
          opt.value === "bank_transfer" ||
          opt.label === "Bank Transfer"
      );

      if (!defaultPayoutMethod) {
        defaultPayoutMethod = payoutMethodOptions.find(
          (opt) =>
            opt.value?.toLowerCase().includes("bank") ||
            opt.label?.toLowerCase().includes("bank")
        );
      }

      if (defaultPayoutMethod && onFieldChange) {
        onFieldChange("payout_method", defaultPayoutMethod);
        setPayoutInitialized(true);
        console.log("✅ Default payout method set to:", defaultPayoutMethod);
      } else {
        console.log(
          "⚠️ Could not find 'Bank Transfer/Deposit' in payout options:",
          payoutMethodOptions
        );
      }
    }
  }, [payoutMethodOptions, formData?.payout_method, onFieldChange]);

  // Detect mobile viewport
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Custom select styles with mobile responsiveness
  const selectStyles = useMemo(() => getSelectStyles(isMobile), [isMobile]);

  // Fetch occupations on component mount
  useEffect(() => {
    const fetchOccupations = async () => {
      setIsLoadingOccupations(true);
      try {
        const bearertoken = localStorage.getItem("bearertoken");
        const response = await axios.get(`${API_URL}/customers/fetch-occupation`, {
          headers: { Authorization: `Bearer ${bearertoken}` },
        });

        if (response.data?.success) {
          const transformedOccupations = (response.data.data || []).map(
            (occupation) => ({
              value: occupation?.name,
              label: occupation?.name,
            })
          );
          setOccupations(transformedOccupations);
        }
      } catch (error) {
        console.error("Error fetching occupations:", error);
        // Set default occupations
        setOccupations([
          { value: "Business", label: "Business" },
          { value: "Employee", label: "Employee" },
          { value: "Student", label: "Student" },
          { value: "Retired", label: "Retired" },
          { value: "Unemployed", label: "Unemployed" },
        ]);
      } finally {
        setIsLoadingOccupations(false);
      }
    };

    fetchOccupations();
  }, [API_URL]);

  // Set default values for Purpose, Income Source, and Occupation
  useEffect(() => {
    // Set default Purpose of Transfer to "Trade"
    if (
      purposeOptions.length > 0 &&
      !purposeInitialized &&
      !formData?.purpose
    ) {
      // Try multiple matching strategies
      let defaultPurpose = purposeOptions.find(
        (opt) => opt.value === "Trade" || opt.label === "Trade"
      );

      // If not found, try case-insensitive match
      if (!defaultPurpose) {
        defaultPurpose = purposeOptions.find(
          (opt) => opt.value?.toLowerCase() === "trade" || opt.label?.toLowerCase() === "trade"
        );
      }

      if (defaultPurpose && onFieldChange) {
        onFieldChange("purpose", defaultPurpose);
        setPurposeInitialized(true);
        console.log("✅ Default purpose set to:", defaultPurpose);
      } else {
        console.log("⚠️ Could not find 'Trade' in purpose options:", purposeOptions);
      }
    }

    // Set default Source of Income to "Savings" (note: Savings with 's')
    if (
      incomeSourceOptions.length > 0 &&
      !incomeInitialized &&
      !formData?.incomeSource
    ) {
      // Try multiple matching strategies
      let defaultIncomeSource = incomeSourceOptions.find(
        (opt) => opt.value === "Savings" || opt.label === "Savings" ||
          opt.value === "Saving" || opt.label === "Saving"
      );

      // If not found, try case-insensitive match
      if (!defaultIncomeSource) {
        defaultIncomeSource = incomeSourceOptions.find(
          (opt) => opt.value?.toLowerCase() === "savings" || opt.label?.toLowerCase() === "savings" ||
            opt.value?.toLowerCase() === "saving" || opt.label?.toLowerCase() === "saving"
        );
      }

      if (defaultIncomeSource && onFieldChange) {
        onFieldChange("incomeSource", defaultIncomeSource);
        setIncomeInitialized(true);
        console.log("✅ Default income source set to:", defaultIncomeSource);
      } else {
        console.log("⚠️ Could not find 'Savings' in income source options:", incomeSourceOptions);
      }
    }

    // Set default Occupation to "Engineer"
    if (
      occupations.length > 0 &&
      !occupationInitialized &&
      !selectedOccupation
    ) {
      let defaultOccupation = occupations.find(
        (opt) => opt.value === "Engineer" || opt.label === "Engineer"
      );

      if (!defaultOccupation) {
        defaultOccupation = occupations.find(
          (opt) =>
            opt.value?.toLowerCase() === "engineer" ||
            opt.label?.toLowerCase() === "engineer"
        );
      }

      if (defaultOccupation) {
        setSelectedOccupation(defaultOccupation);

        if (onFieldChange) {
          onFieldChange("occupation", defaultOccupation.value);
        }
        setOccupationInitialized(true);
      }
    }
  }, [purposeOptions, incomeSourceOptions, occupations, formData?.purpose, formData?.incomeSource, formData?.occupation, onFieldChange]);


  // Auto-select first beneficiary if none selected
  useEffect(() => {
    if (beneficiaries.length > 0 && !selectedBeneficiary && !showCodeInput) {
      const firstBeneficiary = beneficiaries[0];
      if (firstBeneficiary && onBeneficiarySelect) {
        handleBeneficiarySelect(firstBeneficiary);
      }
    }
  }, [beneficiaries, selectedBeneficiary, showCodeInput]);

  // Auto-select first bank when banks are loaded
  useEffect(() => {
    if (
      beneficiaryBanks?.length > 0 &&
      selectedBeneficiary &&
      !selectedBank &&
      onBankSelect
    ) {
      const firstBank = beneficiaryBanks[0];
      if (firstBank) {
        onBankSelect(firstBank);
      }
    }
  }, [beneficiaryBanks, selectedBeneficiary, selectedBank, onBankSelect]);

  // Handle beneficiary selection
  const handleBeneficiarySelect = async (selectedOption) => {
    console.log("BankTransfer: Beneficiary selected:", selectedOption);

    if (!selectedOption) {
      if (onBeneficiarySelect) onBeneficiarySelect(null);
      if (onBankSelect) onBankSelect(null);
      if (onFieldChange) {
        onFieldChange("purpose", null);
        onFieldChange("incomeSource", null);
        onFieldChange("relation", null);
        onFieldChange("occupation", "");
        onFieldChange("payout_method", null);
      }
      setShowCodeInput(false);
      return;
    }

    setShowCodeInput(false);
    if (onBeneficiarySelect) onBeneficiarySelect(selectedOption);

    // Clear any existing selected bank
    if (onBankSelect) onBankSelect(null);

    // Fetch beneficiary banks
    try {
      console.log("📋 Fetching banks for beneficiary ID:", selectedOption.id);
      const result = await dispatch(
        fetchBeneficiaryBanks(selectedOption.id)
      ).unwrap();

      console.log("📋 Banks fetched successfully:", result);

      // Find matching options from beneficiary data
      if (onFieldChange) {
        // Purpose
        if (selectedOption?.transfer_purpose) {
          const matchedPurpose = purposeOptions.find(
            (opt) => opt.value === selectedOption.transfer_purpose
          );
          if (matchedPurpose) {
            onFieldChange("purpose", matchedPurpose);
          }
        }

        // Income Source
        if (selectedOption?.income_source) {
          const matchedIncomeSource = incomeSourceOptions.find(
            (opt) => opt.value === selectedOption.income_source
          );
          if (matchedIncomeSource) {
            onFieldChange("incomeSource", matchedIncomeSource);
          }
        }

        // Relation
        if (selectedOption?.relationtobenef) {
          const matchedRelation = relationOptions.find(
            (opt) => opt.value === selectedOption.relationtobenef
          );
          if (matchedRelation) {
            onFieldChange("relation", matchedRelation);
          }
        }

        // Payout Method
        const payoutMethodValue =
          selectedOption?.payout_method || selectedOption?.payment_method;
        if (payoutMethodValue) {
          const matchedPayoutMethod = payoutMethodOptions.find(
            (opt) => opt.value === payoutMethodValue
          );
          if (matchedPayoutMethod) {
            onFieldChange("payout_method", matchedPayoutMethod);
          }
        }

        // Occupation
        if (selectedOption?.occupation) {
          onFieldChange("occupation", selectedOption.occupation);
        }
      }

      // Auto-select first bank if available (use fetched `result`, not stale selector state)
      if (result?.length > 0) {
        const firstBank = result[0];
        if (firstBank && onBankSelect) {
          onBankSelect(firstBank);
          toast.success("Beneficiary details loaded successfully!");
        }
      } else {
        toast.warning("No bank accounts found for this beneficiary");
      }
    } catch (error) {
      console.error("Error fetching beneficiary banks:", error);
      toast.error("Failed to load beneficiary bank details");
    }
  };

  // Handle bank account selection
  const handleBankAccountSelect = (selectedOption) => {
    console.log("BankTransfer: Sila bank account selected:", selectedOption);

    if (onBankAccountSelect) {
      onBankAccountSelect(selectedOption);
    }

    // Also update Redux store if needed
    if (selectedOption) {
      dispatch(setSelectedBankAccount(selectedOption));
    }

    toast.success(`Selected ${selectedOption?.account_name || 'bank account'}`);
  };

  // Handle beneficiary code lookup
  const handleBeneficiaryCodeLookupInternal = async () => {
    if (!beneficiaryCode.trim()) {
      toast.error("Please enter a beneficiary code");
      return;
    }

    try {
      setIsLoadingCode(true);
      const result = await dispatch(
        fetchBeneficiaryByCode(beneficiaryCode)
      ).unwrap();

      if (result?.data) {
        const beneficiaryData = result.data;

        const transformedBeneficiary = {
          value: beneficiaryData?.id,
          id: beneficiaryData?.id,
          label: `${beneficiaryData?.name || "Unknown"} (${beneficiaryData?.phone_number || "No Phone"
            })`,
          name: beneficiaryData?.name,
          benef_uuid: beneficiaryData?.benef_uuid,
          occupation: beneficiaryData?.occupation,
          relationtobenef: beneficiaryData?.relationtobenef,
          transfer_purpose: beneficiaryData?.transfer_purpose,
          income_source: beneficiaryData?.income_source,
          payout_method:
            beneficiaryData?.payout_method || beneficiaryData?.payment_method,
          ...beneficiaryData,
        };

        await handleBeneficiarySelect(transformedBeneficiary);
        toast.success("Beneficiary details loaded successfully!");
      }
    } catch (error) {
      console.error("Error fetching beneficiary by code:", error);
      if (error.response?.status === 404) {
        toast.error("No beneficiary found with this code");
      } else {
        toast.error("Failed to fetch beneficiary details");
      }
    } finally {
      setIsLoadingCode(false);
    }
  };

  // Handle beneficiary code input change
  const handleBeneficiaryCodeInputChange = (e) => {
    const value = e.target.value;
    setBeneficiaryCode(value);
    setShowCodeInput(value.trim().length > 0);

    // If clearing the code input, enable dropdown
    if (!value.trim() && selectedBeneficiary) {
      handleBeneficiarySelect(selectedBeneficiary);
    }
  };

  // Handle file upload
  const handleFileUploadInternal = (e) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
      toast.success("Document uploaded successfully");
    }
  };

  // Handle occupation change
  const handleOccupationChange = (selectedOption) => {
    setSelectedOccupation(selectedOption);
    setCustomOccupation("");

    if (onFieldChange) {
      onFieldChange("occupation", selectedOption?.value || "");
    }
  };

  // Find current occupation value for dropdown
  const currentOccupationValue = useMemo(() => {
    if (!formData?.occupation) return null;
    return occupations.find((opt) => opt.value === formData.occupation) || null;
  }, [formData?.occupation, occupations]);

  // Add New Beneficiary button
  const handleAddNewBeneficiary = () => {
    const customerId = paramCustomerId || localStorage.getItem("authcustomer_id") || localStorage.getItem("customerId");
    console.log("➕ Navigating to add beneficiary from ManualDeposit");

    setIsNavigatingToAdd(true);

    //State before navigating
    if (onSaveRemittanceState) {
      onSaveRemittanceState();
    }

    navigate(`/addbeneficiary/${customerId}`, {
      state: {
        returnTo: `/remittance/${customerId}`,
        returnStep: 2,
        returnToStep: 2,
        preserveRemittanceState: true,
        from: "remittance"
      }
    });
  };

  // Get placeholder text for beneficiary select
  const getBeneficiaryPlaceholder = () => {
    // If still loading and haven't fetched yet
    if (beneficiariesLoading || (!beneficiariesFetched && beneficiaries.length === 0)) {
      return "Loading beneficiaries...";
    }
    // If fetch is complete and no beneficiaries
    if (beneficiariesFetched && beneficiaries.length === 0) {
      return "No beneficiaries found. Click 'Add New Beneficiary' to create one.";
    }
    // If using beneficiary code
    if (showCodeInput) {
      return "Disabled - Using beneficiary code";
    }
    // Normal state
    return "Select beneficiary...";
  };

  // Bank Detail Item component (for consistency with ManualDeposit)
  const BankDetailItem = ({ icon, label, value }) => (
    <div className="flex items-start gap-2">
      <div className="text-gray-500 mt-0.5 text-sm">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-1 mb-1">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-800 break-all">
            {value || "Not available"}
          </p>
        </div>
      </div>
    </div>
  );

  // Bank Account Info Modal - Mobile Responsive
  const renderBankAccountInfo = () => {
    if (!selectedBankAccount) return null;

    return (
      <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <h4 className="text-sm sm:text-md font-semibold text-blue-800">Selected Bank Account Details</h4>
          <button
            type="button"
            onClick={() => setShowBankAccountInfo(!showBankAccountInfo)}
            className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
          >
            {showBankAccountInfo ? "Hide Details" : "Show Details"}
          </button>
        </div>

        {showBankAccountInfo && (
          <div className="space-y-2 sm:space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Account Name</p>
                <p className="text-xs sm:text-sm font-medium break-all">{selectedBankAccount.account_name}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Provider</p>
                <p className="text-xs sm:text-sm font-medium">{selectedBankAccount.provider || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Account Type</p>
                <p className="text-xs sm:text-sm font-medium">{selectedBankAccount.account_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Account Number</p>
                <p className="text-xs sm:text-sm font-medium">{selectedBankAccount.accountNumberHash || '****'}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Routing Number</p>
                <p className="text-xs sm:text-sm font-medium">{selectedBankAccount.routing_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Status</p>
                <p className="text-xs sm:text-sm font-medium">
                  {selectedBankAccount.web_debit_verified ? (
                    <span className="flex items-center text-green-600">
                      <FaCheckCircle className="mr-1 text-xs sm:text-sm" /> Verified
                    </span>
                  ) : (
                    <span className="text-yellow-600">Pending Verification</span>
                  )}
                </p>
              </div>
            </div>

            <div className="pt-2 sm:pt-3 border-t border-blue-200">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Additional Info</p>
              <p className="text-[10px] sm:text-xs text-gray-700">
                This account will be used as the source for your bank transfer.
                {selectedBankAccount.fednow_credit_enabled && " Supports FedNow transfers."}
                {selectedBankAccount.rtp_credit_enabled && " Supports RTP transfers."}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main container - Mobile padding */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
          Bank Transfer Details
        </h3>

        <div className="space-y-3 sm:space-y-4">
          {/* Select Your Bank Account (Sila Accounts) - Mobile Responsive */}
          {displayedHasSilaAccounts && selectedCurrency === "USD" && (
            <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  Select Your Bank Account *
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {displayedSilaAccountsLoading ? (
                    <div className="flex items-center">
                      <RingLoader size={isMobile ? 16 : 20} color="#3b82f6" />
                      <span className="ml-2 text-[10px] sm:text-xs text-gray-500">Loading accounts...</span>
                    </div>
                  ) : (
                    <span className="text-[10px] sm:text-xs text-gray-500">
                      {silaAccountOptions.length} account(s) available
                    </span>
                  )}

                  {/* Add/Remove Bank Button - Mobile responsive */}
                  <button
                    type="button"
                    onClick={() => {
                      const customerId = paramCustomerId || localStorage.getItem("authcustomer_id") || localStorage.getItem("customerId");
                      console.log("➕ Navigating to manage bank accounts via BankLink");

                      if (onSaveRemittanceState) {
                        onSaveRemittanceState();
                      }

                      navigate(`/linkbank/${customerId}`, {
                        state: {
                          returnTo: `/remittance/${customerId}`,
                          returnStep: 2,
                          preserveRemittanceState: true,
                          from: "remittance"
                        }
                      });
                    }}
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 whitespace-nowrap"
                  >
                    <FaPlus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    Add/Remove Bank
                  </button>
                </div>
              </div>

              {displayedSilaAccountsError ? (
                <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-red-600">{displayedSilaAccountsError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const customerId = paramCustomerId || localStorage.getItem("customerId") || "1720";
                      dispatch(checkSilaBankAccounts(customerId));
                    }}
                    className="mt-1 sm:mt-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <Select
                    options={silaAccountOptions}
                    value={selectedBankAccount || null}
                    onChange={handleBankAccountSelect}
                    isLoading={displayedSilaAccountsLoading}
                    classNamePrefix="select"
                    styles={selectStyles}
                    placeholder={
                      displayedSilaAccountsLoading
                        ? "Loading your bank accounts..."
                        : silaAccountOptions.length === 0
                          ? "No bank accounts found. Please link a bank account."
                          : "Select your bank account..."
                    }
                    isSearchable
                    getOptionLabel={(option) => (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <div className="font-medium text-xs sm:text-sm">{option.account_name}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500 flex flex-wrap items-center gap-1">
                            {option.provider} • {option.account_type}
                            {option.web_debit_verified && (
                              <span className="ml-1 text-green-600">
                                <FaCheckCircle className="inline mr-0.5 text-[10px] sm:text-xs" />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-400">
                          {option.accountNumberHash}
                        </div>
                      </div>
                    )}
                    getOptionValue={(option) => option.value}
                  />

                  {selectedBankAccount && renderBankAccountInfo()}

                  {silaAccountOptions.length === 0 && !displayedSilaAccountsLoading && (
                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <FaExclamationTriangle className="text-yellow-600 mt-0.5 mr-2 text-xs sm:text-sm flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm text-yellow-800">
                            No bank accounts found. Please link a bank account to proceed.
                          </p>
                          <button
                            type="button"
                            className="mt-1 sm:mt-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800"
                            onClick={() => {
                              const customerId = paramCustomerId || localStorage.getItem("authcustomer_id") || localStorage.getItem("customerId");
                              navigate(`/linkbank/${customerId}`, {
                                state: {
                                  returnTo: `/remittance/${customerId}`,
                                  returnStep: 2,
                                  preserveRemittanceState: true,
                                  from: "remittance"
                                }
                              });
                            }}
                          >
                            Link a Bank Account
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Beneficiary Selection - Mobile Responsive */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-1 sm:mb-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Select Beneficiary
              </label>
              <button
                type="button"
                onClick={handleAddNewBeneficiary}
                disabled={isNavigatingToAdd}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isNavigatingToAdd ? (
                  <>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <FaPlus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    Add New Beneficiary
                  </>
                )}
              </button>
            </div>
            <Select
              options={beneficiaries}
              value={selectedBeneficiary || null}
              onChange={handleBeneficiarySelect}
              isLoading={beneficiariesLoading && !beneficiariesFetched}
              isDisabled={showCodeInput}
              classNamePrefix="select"
              styles={selectStyles}
              placeholder={getBeneficiaryPlaceholder()}
              isSearchable
              noOptionsMessage={() => {
                if (beneficiariesFetched && beneficiaries.length === 0) {
                  return "No beneficiaries found. Click 'Add New Beneficiary' to create one.";
                }
                if (beneficiariesLoading) {
                  return "Loading beneficiaries...";
                }
                return "No options available";
              }}
              getOptionLabel={(option) =>
                option?.formattedName ||
                `${option?.name || "Unknown"} (${option?.phone_number || option?.benef_uuid || "No Contact"
                })`
              }
              getOptionValue={(option) => option?.id}
            />
          </div>

          {/* OR Separator - Mobile Responsive */}
          <div className="flex items-center my-3 sm:my-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="mx-3 sm:mx-4 text-xs sm:text-sm text-gray-500 font-medium">or</div>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Enter Beneficiary Code Field - Mobile Responsive */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Enter Beneficiary Code
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={beneficiaryCode}
                onChange={handleBeneficiaryCodeInputChange}
                placeholder="Enter beneficiary code"
                className="flex-1 px-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                disabled={isLoadingCode}
              />
              <button
                type="button"
                onClick={handleBeneficiaryCodeLookupInternal}
                disabled={isLoadingCode || !beneficiaryCode.trim()}
                className="px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm sm:text-base"
              >
                <FaSearch className="mr-1.5 sm:mr-2 text-xs sm:text-sm" />
                {isLoadingCode ? "Loading..." : "Search"}
              </button>
            </div>
            <p className="mt-1 text-[10px] sm:text-sm text-gray-500">
              Enter the beneficiary code to load their details automatically
            </p>
          </div>

          {/* Payout Method */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Select Payout Method
            </label>
            <Select
              options={payoutMethodOptions}
              value={formData?.payout_method || null}
              onChange={(selectedOption) =>
                onFieldChange("payout_method", selectedOption)
              }
              classNamePrefix="select"
              styles={selectStyles}
              placeholder="Select payout method..."
              isSearchable
              isClearable
            />
            {payoutMethodOptions.length === 0 && (
              <p className="mt-1 text-[10px] sm:text-xs text-yellow-600">
                No payout methods available. Using default options.
              </p>
            )}
          </div>

          {/* Purpose of Transfer */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Purpose of Transfer *
            </label>
            <Select
              options={purposeOptions}
              value={formData?.purpose || null}
              onChange={(selectedOption) =>
                onFieldChange("purpose", selectedOption)
              }
              classNamePrefix="select"
              styles={selectStyles}
              placeholder="Select purpose..."
              isSearchable
              isClearable
            />
            {purposeOptions.length === 0 && (
              <p className="mt-1 text-[10px] sm:text-xs text-yellow-600">
                No purpose options loaded. Please check API connection.
              </p>
            )}
          </div>

          {/* Source of Income */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Source of Income *
            </label>
            <Select
              options={incomeSourceOptions}
              value={formData?.incomeSource || null}
              onChange={(selectedOption) =>
                onFieldChange("incomeSource", selectedOption)
              }
              classNamePrefix="select"
              styles={selectStyles}
              placeholder="Select income source..."
              isSearchable
              isClearable
            />
            {incomeSourceOptions.length === 0 && (
              <p className="mt-1 text-[10px] sm:text-xs text-yellow-600">
                No income source options loaded. Please check API connection.
              </p>
            )}
          </div>

          {/* Occupation Field - Mobile Responsive */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Occupation
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 w-full">
                <Select
                  options={occupations}
                  value={selectedOccupation}
                  onChange={handleOccupationChange}
                  isLoading={isLoadingOccupations}
                  classNamePrefix="select"
                  styles={{
                    ...selectStyles,
                    control: (base) => ({
                      ...base,
                      minHeight: isMobile ? "44px" : "48px",
                      borderRadius: "0.5rem",
                      borderColor: "#e5e7eb",
                      boxShadow: "none",
                      "&:hover": { borderColor: "#9ca3af" },
                      fontSize: isMobile ? "0.875rem" : "0.95rem",
                    }),
                    menu: (base) => ({
                      ...base,
                      borderRadius: "0.5rem",
                      fontSize: isMobile ? "0.875rem" : "0.95rem",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      zIndex: 9999,
                      maxHeight: isMobile ? "300px" : "400px",
                      overflowY: "auto",
                    }),
                    option: (base, { isSelected, isFocused }) => ({
                      ...base,
                      backgroundColor: isSelected
                        ? "#eff6ff"
                        : isFocused
                          ? "#f8fafc"
                          : "white",
                      color: isSelected ? "#1e40af" : "#374151",
                      fontWeight: isSelected ? "600" : "500",
                      padding: isMobile ? "8px 12px" : "12px 16px",
                      fontSize: isMobile ? "0.875rem" : "0.95rem",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      "&:hover": {
                        backgroundColor: "#f8fafc",
                      },
                    }),
                  }}
                  placeholder={
                    isLoadingOccupations
                      ? "Loading occupations..."
                      : "Select occupation..."
                  }
                  className="w-full"
                  isSearchable
                  isClearable
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
              <div className="flex-1 w-full">
                <input
                  type="text"
                  value={customOccupation}
                  onChange={(e) => {
                    setCustomOccupation(e.target.value);
                    onFieldChange("occupation", e.target.value);
                  }}
                  placeholder="Or enter custom occupation"
                  className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  style={{
                    minHeight: isMobile ? "44px" : "48px",
                  }}
                />
              </div>
            </div>
            <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
              Select from dropdown or type custom occupation
            </p>
          </div>

          {/* Beneficiary Bank */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Beneficiary Bank
            </label>
            <Select
              options={beneficiaryBanks || []}
              value={selectedBank || null}
              onChange={onBankSelect}
              isLoading={banksLoading}
              isDisabled={
                !selectedBeneficiary ||
                banksLoading ||
                !beneficiaryBanks ||
                beneficiaryBanks.length === 0
              }
              classNamePrefix="select"
              styles={selectStyles}
              placeholder={
                banksLoading
                  ? "Loading banks..."
                  : !selectedBeneficiary
                    ? "Select a beneficiary first"
                    : !beneficiaryBanks || beneficiaryBanks.length === 0
                      ? "No bank accounts found for this beneficiary"
                      : "Select beneficiary bank..."
              }
              getOptionLabel={(option) => {
                const bankName = option?.bank_name || "Unknown Bank";
                const accountNumber =
                  option?.bank_acc_no || option?.account_number || "No Account";
                const accountHolder =
                  option?.nameInBankAc || option?.account_name || "";
                const rails = option?.rails || "";
                const accountType = option?.account_type || "";

                let label = `${bankName} - ${accountNumber}`;
                if (accountHolder) label += ` (${accountHolder})`;
                if (rails) label += ` [${rails}]`;
                if (accountType) label += ` - ${accountType}`;

                return label;
              }}
              getOptionValue={(option) =>
                option?.id || option?.benef_banks_uuid
              }
              isSearchable
            />
            {selectedBeneficiary &&
              !banksLoading &&
              beneficiaryBanks &&
              beneficiaryBanks.length > 0 && (
                <p className="mt-1 text-[10px] sm:text-sm text-gray-500">
                  {beneficiaryBanks.length} bank account(s) available
                </p>
              )}
          </div>

          {/* Open Banking Section - Mobile Responsive */}
          {(selectedCurrency === "EUR" ||
            selectedCurrency === "GBP" ||
            selectedCurrency === "DKK") &&
            selectedBank &&
            selectedBeneficiary &&
            formData?.amount &&
            parseFloat(formData.amount) > 0 ? (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div>
                  <h4 className="text-base sm:text-lg font-medium text-gray-900">
                    Open Banking
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Initiate secure bank transfer via Open Banking
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Validate required fields
                    const errors = {};

                    if (!formData?.amount || parseFloat(formData.amount) <= 0) {
                      errors.amount = "Please enter a valid amount";
                    }
                    if (!formData?.purpose?.value) {
                      errors.purpose = "Please select a purpose";
                    }
                    if (!formData?.incomeSource?.value) {
                      errors.incomeSource = "Please select income source";
                    }
                    if (!selectedBeneficiary) {
                      errors.beneficiary = "Please select a beneficiary";
                    }
                    if (!selectedBank) {
                      errors.bank = "Please select beneficiary bank";
                    }

                    if (Object.keys(errors).length > 0) {
                      // Show validation errors
                      Object.values(errors).forEach((error) =>
                        toast.error(error)
                      );
                      return;
                    }

                    console.log("🎯 Initiating Open Banking remittance:", {
                      currency: selectedCurrency,
                      amount: formData.amount,
                      beneficiary: selectedBeneficiary.name,
                      bank: selectedBank.bank_name,
                    });

                    // Dispatch to show PaymentInitiation modal
                    dispatch(setShowPaymentInitiation(true));
                  }}
                  className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all text-sm sm:text-base w-full sm:w-auto"
                >
                  <FaUniversity className="mr-1.5 sm:mr-2 text-sm sm:text-base" />
                  Initiate Open Banking
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start">
                  <FaInfoCircle className="text-green-600 mt-0.5 mr-2 sm:mr-3 text-xs sm:text-sm flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-green-800">
                      <strong>Open Banking</strong> allows you to securely
                      connect your bank account and initiate transfers
                      instantly. No manual bank details required.
                    </p>
                    <ul className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-green-700 space-y-0.5 sm:space-y-1">
                      <li>• Instant bank account verification</li>
                      <li>• Secure connection via Plaid</li>
                      <li>• Real-time transfer initiation</li>
                      <li>• No need to enter bank details manually</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Compliance Note - Mobile Responsive */}
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
            <p className="text-xs sm:text-sm text-gray-700">
              <span className="font-semibold">Note:</span> For compliance
              purposes, we require information about the purpose of your
              transfer and source of funds. All information is kept confidential
              and secure.
            </p>
          </div>

          {/* Document Upload Section - Mobile Responsive */}
          {onFileUpload && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Upload Supporting Document (Optional)
              </label>
              <div className="flex items-center">
                <label className="flex flex-col items-center justify-center w-full p-3 sm:p-4 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center">
                    <FaUpload className="w-6 h-6 sm:w-8 sm:h-8 mb-1.5 sm:mb-2 text-gray-500" />
                    <p className="text-xs sm:text-sm text-gray-500 text-center">
                      {formData?.document
                        ? formData.document.name || "Document uploaded"
                        : "Click to upload document (PDF, JPG, PNG)"}
                    </p>
                  </div>
                  <input
                    type="file"
                    id="bank-transfer-document"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUploadInternal}
                  />
                </label>
              </div>
              {filePreview && (
                <div className="mt-2">
                  <img
                    src={filePreview}
                    alt="Document preview"
                    className="h-full object-contain border rounded max-h-48 sm:max-h-64"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      <ToastContainer
        position={isMobile ? "bottom-center" : "bottom-right"}
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{
          width: isMobile ? "90%" : "auto",
          maxWidth: isMobile ? "90vw" : "420px",
        }}
        toastClassName={() =>
          `relative flex p-3 sm:p-4 min-h-10 sm:min-h-12 rounded-lg justify-between overflow-hidden cursor-pointer ${isMobile ? "text-sm" : "text-base"
          }`
        }
      />
    </div>
  );
};

export default BankTransfer;