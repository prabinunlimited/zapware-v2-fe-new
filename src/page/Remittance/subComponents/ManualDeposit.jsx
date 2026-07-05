import React, { useState, useEffect, useCallback, useMemo } from "react";
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
    backgroundColor: isSelected ? "#f3f4f6" : "white",
    color: isSelected ? "#111827" : "#4b5563",
    padding: isMobile ? "8px 12px" : "12px 16px",
    fontSize: isMobile ? "0.875rem" : "0.95rem",
    whiteSpace: "normal",
    wordBreak: "break-word",
    "&:hover": { backgroundColor: "#f3f4f6" },
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

const ManualDeposit = ({
  formData,
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
  onSaveRemittanceState,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { customerId: paramCustomerId } = useParams();

  const allBeneficiaries = useSelector(selectBeneficiaries);
  const beneficiariesLoading = useSelector(selectBeneficiariesLoading);
  const banksLoading = useSelector(selectBanksLoading);

  const API_URL = import.meta.env.VITE_API_URL;

  // Detect mobile viewport
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add local state to track if beneficiaries have been loaded
  const [beneficiariesFetched, setBeneficiariesFetched] = useState(false);

  // Transform for dropdown
  const beneficiaries = useMemo(() => {
    return (allBeneficiaries || [])
      .filter((benef) => benef?.status === 1 && benef?.active_status === 1)
      .map((benef) => ({
        ...benef,
        value: benef?.id,
        label: `${benef?.name} (${benef?.full_phone_number || benef?.phone_number || benef?.benef_uuid
          })`,
        formattedName: `${benef?.name} (${benef?.phone_number || benef?.email || benef?.benef_uuid
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
        "🔄 ManualDeposit: Fetching beneficiaries for customer:",
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
  }, [
    dispatch,
    paramCustomerId,
    beneficiariesFetched,
    beneficiariesLoading,
  ]);

  const beneficiaryBanks = useSelector(selectBeneficiaryBanks);

  // Debug logs
  console.log("All beneficiaries from Redux:", allBeneficiaries);
  console.log("Remittance ready beneficiaries:", beneficiaries);
  console.log("Number of all beneficiaries:", allBeneficiaries?.length || 0);
  console.log(
    "Number of remittance ready beneficiaries:",
    beneficiaries.length
  );
  console.log("Beneficiaries loading state:", beneficiariesLoading);
  console.log("Beneficiaries fetched state:", beneficiariesFetched);

  // Local state
  const [beneficiaryCode, setBeneficiaryCode] = useState("");
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [occupations, setOccupations] = useState([]);
  const [isLoadingOccupations, setIsLoadingOccupations] = useState(false);

  const [isNavigatingToAdd, setIsNavigatingToAdd] = useState(false);

  // Default payout options
  const defaultPayoutOptions = useMemo(
    () => [
      { value: "bank_deposit", label: "Bank Deposit" },
      { value: "fdr_npr", label: "Fixed Deposit (NPR)" },
      { value: "fcy_deposit", label: "FCY Deposit" },
    ],
    []
  );

  const payoutMethodOptions =
    paymentOptions.length > 0 ? paymentOptions : defaultPayoutOptions;

  // Set default Payout Method to "Bank Deposit" / "Bank Transfer"
  useEffect(() => {
    if (payoutMethodOptions.length > 0 && !formData?.payout_method) {
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
        console.log("✅ Default payout method set to:", defaultPayoutMethod);
      } else {
        console.log(
          "⚠️ Could not find 'Bank Transfer/Deposit' in payout options:",
          payoutMethodOptions
        );
      }
    }
  }, [payoutMethodOptions, formData?.payout_method, onFieldChange]);

  // Custom select styles with mobile responsiveness
  const selectStyles = useMemo(() => getSelectStyles(isMobile), [isMobile]);

  // Helper function to find matching option
  const findMatchingOption = useCallback((options, value) => {
    if (!value || !options || options.length === 0) return null;

    const valueStr = String(value).toLowerCase();
    return (
      options.find(
        (option) =>
          String(option.value).toLowerCase() === valueStr ||
          String(option.label).toLowerCase() === valueStr ||
          String(option.originalName || "").toLowerCase() === valueStr
      ) || null
    );
  }, []);

  // Fetch occupations on component mount
  useEffect(() => {
    const fetchOccupations = async () => {
      setIsLoadingOccupations(true);
      try {
        const bearertoken = localStorage.getItem("bearertoken");
        const response = await axios.get(`${API_URL}/customers/fetch-occupation`, {
          headers: { Authorization: `Bearer ${bearertoken}` },
        });

        if (response.data.success) {
          const transformedOccupations = response.data.data.map(
            (occupation) => ({
              value: occupation.name,
              label: occupation.name,
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
    if (purposeOptions.length > 0 && !formData?.purpose) {
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
        console.log("✅ Default purpose set to:", defaultPurpose);
      } else {
        console.log("⚠️ Could not find 'Trade' in purpose options:", purposeOptions);
      }
    }

    // Set default Source of Income to "Savings" (note: Savings with 's')
    if (incomeSourceOptions.length > 0 && !formData?.incomeSource) {
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
        console.log("✅ Default income source set to:", defaultIncomeSource);
      } else {
        console.log("⚠️ Could not find 'Savings' in income source options:", incomeSourceOptions);
      }
    }

    // Set default Occupation to "Engineer"
    if (occupations.length > 0 && !formData?.occupation) {
      // Try multiple matching strategies
      let defaultOccupation = occupations.find(
        (opt) => opt.value === "Engineer" || opt.label === "Engineer"
      );

      // If not found, try case-insensitive match
      if (!defaultOccupation) {
        defaultOccupation = occupations.find(
          (opt) => opt.value?.toLowerCase() === "engineer" || opt.label?.toLowerCase() === "engineer"
        );
      }

      if (defaultOccupation && onFieldChange) {
        onFieldChange("occupation", defaultOccupation.value);
        console.log("✅ Default occupation set to:", defaultOccupation);
      } else {
        console.log("⚠️ Could not find 'Engineer' in occupation options:", occupations);
      }
    }
  }, [purposeOptions, incomeSourceOptions, occupations, formData?.purpose, formData?.incomeSource, formData?.occupation, onFieldChange]);

  // Auto-select first beneficiary if none selected
  useEffect(() => {
    if (beneficiaries.length > 0 && !selectedBeneficiary && !showCodeInput) {
      const firstBeneficiary = beneficiaries[0];
      handleBeneficiarySelect(firstBeneficiary);
    }
  }, [beneficiaries, selectedBeneficiary, showCodeInput]);

  // Auto-select first bank when banks are loaded
  useEffect(() => {
    if (beneficiaryBanks.length > 0 && selectedBeneficiary && !selectedBank) {
      const firstBank = beneficiaryBanks[0];
      if (firstBank) {
        onBankSelect(firstBank);
      }
    }
  }, [beneficiaryBanks, selectedBeneficiary, selectedBank, onBankSelect]);

  // Handle beneficiary selection
  const handleBeneficiarySelect = useCallback(
    async (selectedOption) => {
      console.log("ManualDeposit: Beneficiary selected:", selectedOption);

      if (!selectedOption) {
        onBeneficiarySelect(null);
        onBankSelect(null);
        onFieldChange("purpose", null);
        onFieldChange("incomeSource", null);
        onFieldChange("relation", null);
        onFieldChange("occupation", "");
        onFieldChange("payout_method", null);
        setShowCodeInput(false);
        return;
      }

      setShowCodeInput(false);
      onBeneficiarySelect(selectedOption);

      // Clear any existing selected bank
      onBankSelect(null);

      // Fetch beneficiary banks
      try {
        console.log("📋 Fetching banks for beneficiary ID:", selectedOption.id);

        // Wait for the bank fetch to complete
        const result = await dispatch(
          fetchBeneficiaryBanks(selectedOption.id)
        ).unwrap();

        console.log("📋 Banks fetched successfully:", result);

        // Find matching options
        const matchedPurpose = findMatchingOption(
          purposeOptions,
          selectedOption.transfer_purpose
        );

        const matchedIncomeSource = findMatchingOption(
          incomeSourceOptions,
          selectedOption.income_source
        );

        const matchedRelation = findMatchingOption(
          relationOptions,
          selectedOption.relationtobenef
        );

        const payoutMethodValue =
          selectedOption.payout_method || selectedOption.payment_method;
        const matchedPayoutMethod = findMatchingOption(
          payoutMethodOptions,
          payoutMethodValue
        );

        // Update all form fields
        if (matchedPurpose) onFieldChange("purpose", matchedPurpose);
        if (matchedIncomeSource)
          onFieldChange("incomeSource", matchedIncomeSource);
        if (matchedRelation) onFieldChange("relation", matchedRelation);
        if (matchedPayoutMethod)
          onFieldChange("payout_method", matchedPayoutMethod);

        // Set occupation
        if (selectedOption.occupation) {
          onFieldChange("occupation", selectedOption.occupation);
        }

       // Auto-select first bank if available (use fetched `result`, not stale selector state)
       if (result.length > 0) {
        const firstBank = result[0];
        if (firstBank) {
          onBankSelect(firstBank);
          toast.success("Beneficiary details loaded successfully!");
        }
      } else {
        toast.warning("No bank accounts found for this beneficiary");
      }
      } catch (error) {
        console.error("Error fetching beneficiary banks:", error);
        console.error("Error details:", error.message, error.response?.data);
        toast.error("Failed to load beneficiary bank details");
      }
    },
    [
      dispatch,
      onBeneficiarySelect,
      onBankSelect,
      onFieldChange,
      purposeOptions,
      incomeSourceOptions,
      relationOptions,
      payoutMethodOptions,
      findMatchingOption,
      beneficiaryBanks,
    ]
  );

  // Handle file upload
  const handleFileUploadInternal = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file);
      toast.success("Document uploaded successfully");
    }
  };

  // Handle occupation change
  const handleOccupationChange = (selectedOption) => {
    onFieldChange("occupation", selectedOption?.value || "");
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

  // Bank Detail Item component - Mobile Responsive
  const BankDetailItem = ({ icon, label, value }) => (
    <div className="flex items-start gap-1.5 sm:gap-2">
      <div className="text-gray-500 mt-0.5 text-xs sm:text-sm flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
          <p className="text-[10px] sm:text-xs text-gray-500 font-medium">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs sm:text-sm font-medium text-gray-800 break-all">
            {value || "Not available"}
          </p>
        </div>
      </div>
    </div>
  );

  // Add New Beneficiary button
  const handleAddNewBeneficiary = () => {
    const customerId = paramCustomerId || localStorage.getItem("authcustomer_id") || localStorage.getItem("customerId");
    console.log("➕ Navigating to add beneficiary from ManualDeposit");

    setIsNavigatingToAdd(true);

    // Save state before navigating
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main container - Mobile padding */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
          Manual Deposit Details
        </h3>

        <div className="space-y-3 sm:space-y-4">
          {/* Beneficiary Selection - SINGLE SOURCE */}
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
              value={selectedBeneficiary}
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
                option.formattedName ||
                `${option.name} (${option.phone_number || option.benef_uuid})`
              }
              getOptionValue={(option) => option.id}
            />
          </div>

          {/* OR Separator - Commented out */}
          {/* <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="mx-4 text-sm text-gray-500 font-medium">or</div>
            <div className="flex-1 border-t border-gray-300"></div>
          </div> */}

          {/* Enter Beneficiary Code Field - Commented out */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Beneficiary Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={beneficiaryCode}
                onChange={handleBeneficiaryCodeInputChange}
                placeholder="Enter beneficiary code"
                className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoadingCode}
              />
              <button
                type="button"
                onClick={handleBeneficiaryCodeLookupInternal}
                disabled={isLoadingCode || !beneficiaryCode.trim()}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <FaSearch className="mr-2" />
                {isLoadingCode ? "Loading..." : "Search"}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Enter the beneficiary code to load their details automatically
            </p>
          </div> */}

          {/* Payout Method */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Select Payout Method
            </label>
            <Select
              options={payoutMethodOptions}
              value={formData.payout_method}
              onChange={(value) => onFieldChange("payout_method", value)}
              classNamePrefix="select"
              styles={selectStyles}
              placeholder="Select payout method..."
            />
          </div>

          {/* Purpose of Transfer */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Purpose of Transfer *
            </label>
            <Select
              options={purposeOptions}
              value={formData.purpose}
              onChange={(value) => onFieldChange("purpose", value)}
              classNamePrefix="select"
              styles={selectStyles}
              placeholder="Select purpose..."
            />
          </div>

          {/* Source of Income */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Source of Income *
            </label>
            <Select
              options={incomeSourceOptions}
              value={formData.incomeSource}
              onChange={(value) => onFieldChange("incomeSource", value)}
              classNamePrefix="select"
              styles={selectStyles}
              placeholder="Select income source..."
            />
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
                  value={
                    occupations.find(
                      (opt) => opt.value === formData.occupation
                    ) || null
                  }
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
                      backgroundColor: isSelected ? "#f3f4f6" : "white",
                      color: isSelected ? "#111827" : "#4b5563",
                      padding: isMobile ? "8px 12px" : "12px 16px",
                      fontSize: isMobile ? "0.875rem" : "0.95rem",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      "&:hover": { backgroundColor: "#f3f4f6" },
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
                  value={formData.occupation || ""}
                  onChange={(e) => onFieldChange("occupation", e.target.value)}
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

          {/* Beneficiary Bank - Mobile Responsive */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Beneficiary Bank
            </label>
            <Select
              options={beneficiaryBanks}
              value={selectedBank}
              onChange={onBankSelect}
              isLoading={banksLoading}
              isDisabled={
                !selectedBeneficiary ||
                banksLoading ||
                beneficiaryBanks.length === 0
              }
              classNamePrefix="select"
              styles={selectStyles}
              placeholder={
                banksLoading
                  ? "Loading banks..."
                  : !selectedBeneficiary
                    ? "Select a beneficiary first"
                    : beneficiaryBanks.length === 0
                      ? "No bank accounts found for this beneficiary"
                      : "Select beneficiary bank..."
              }
              getOptionLabel={(option) => {
                const bankName = option.bank_name || "Unknown Bank";
                const accountNumber =
                  option.bank_acc_no ||
                  option.account_number ||
                  option.bank_acc_no ||
                  "No Account";
                const accountHolder =
                  option.nameInBankAc || option.account_name || "";
                const rails = option.rails || "";
                const accountType = option.account_type || "";

                let label = `${bankName} - ${accountNumber}`;
                if (accountHolder) label += ` (${accountHolder})`;
                if (rails) label += ` [${rails}]`;
                if (accountType) label += ` - ${accountType}`;

                return label;
              }}
              getOptionValue={(option) => option.id || option.benef_banks_uuid}
            />
            {selectedBeneficiary &&
              !banksLoading &&
              beneficiaryBanks.length > 0 && (
                <p className="mt-1 text-[10px] sm:text-sm text-gray-500">
                  {beneficiaryBanks.length} bank account(s) available
                </p>
              )}
          </div>

          {/* Compliance Note - Mobile Responsive */}
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
            <p className="text-xs sm:text-sm text-gray-700">
              <span className="font-semibold">Note:</span> For compliance
              purposes, we require information about the purpose of your
              transfer and source of funds. All information is kept confidential
              and secure.
            </p>
          </div>

          {/* Bank Details Display Section - Mobile Responsive */}
          <div className="mt-3 sm:mt-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
              <FaUniversity className="text-blue-500 text-xs sm:text-sm" />
              Bank account for deposit
            </h3>

            {manualDetailsLoading ? (
              <div className="flex justify-center py-2 sm:py-3">
                <RingLoader color="#2563eb" size={isMobile ? 14 : 16} />
                <span className="ml-2 text-xs sm:text-sm text-gray-600">
                  Loading bank details...
                </span>
              </div>
            ) : manualAccountDetails ? (
              <div className="bg-gray-50 p-2 sm:p-3 rounded border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <BankDetailItem
                    icon={<FaUniversity className="text-gray-400 text-xs sm:text-sm" />}
                    label="Bank Name"
                    value={manualAccountDetails.bank_name}
                  />
                  <BankDetailItem
                    icon={<FaUser className="text-gray-400 text-xs sm:text-sm" />}
                    label="Account Name"
                    value={manualAccountDetails.account_name}
                  />
                  <BankDetailItem
                    icon={<FaInfoCircle className="text-gray-400 text-xs sm:text-sm" />}
                    label="Account Number"
                    value={manualAccountDetails.account_number}
                  />
                  <BankDetailItem
                    icon={<FaInfoCircle className="text-gray-400 text-xs sm:text-sm" />}
                    label="Routing Number"
                    value={manualAccountDetails.routing_number}
                  />
                </div>
              </div>
            ) : manualAccountError || manualAccountDetails?.status === 404 ? (
              <div className="bg-red-50 p-2 sm:p-3 rounded border border-red-200">
                <div className="flex items-start gap-2">
                  <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0 text-xs sm:text-sm" />
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-medium text-red-800 mb-0.5 sm:mb-1">
                      Bank Details Not Found
                    </h4>
                    <p className="text-[10px] sm:text-xs text-red-700">
                      {typeof manualAccountError === "string"
                        ? manualAccountError
                        : "Unable to load bank details"}
                    </p>
                    <p className="text-[10px] sm:text-xs text-red-600 mt-1 sm:mt-2">
                      Please select a different payment method or contact
                      support.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 p-2 sm:p-3 rounded border border-yellow-200">
                <div className="flex items-start gap-2">
                  <FaExclamationTriangle className="text-yellow-500 mt-0.5 flex-shrink-0 text-xs sm:text-sm" />
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-medium text-yellow-800 mb-0.5 sm:mb-1">
                      Bank Details Not Available
                    </h4>
                    <p className="text-[10px] sm:text-xs text-yellow-700">
                      Unable to load bank details for manual deposit with{" "}
                      {formData.sendCurrency?.value || "USD"}. Please select a
                      different payment method or contact support.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Document Upload Section - Mobile Responsive */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Upload Bank Deposit Proof *
            </label>
            <div className="flex items-center">
              <label className="flex flex-col items-center justify-center w-full p-3 sm:p-4 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center">
                  <FaUpload className="w-6 h-6 sm:w-8 sm:h-8 mb-1.5 sm:mb-2 text-gray-500" />
                  <p className="text-xs sm:text-sm text-gray-500 text-center">
                    {formData.document
                      ? formData.document.name || "Document uploaded"
                      : "Click to upload document (PDF, JPG, PNG)"}
                  </p>
                </div>
                <input
                  type="file"
                  id="manual-deposit-document"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUploadInternal}
                  required
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
        </div>
      </div>

      {/* Toast Container - Mobile Responsive */}
      <ToastContainer
        position={isMobile ? "bottom-center" : "bottom-right"}
        autoClose={5000}
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

export default ManualDeposit;