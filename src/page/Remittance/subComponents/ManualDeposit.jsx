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
  FaCheckCircle,
  FaTimesCircle,
  FaBuilding,
  FaCreditCard,
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
  selectHasFetched,
} from "../../Beneficiary/MyBeneficiaries/BeneficiariesSlice";

const ManualDeposit = ({
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
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { customerId: paramCustomerId } = useParams();

  const allBeneficiaries = useSelector(selectBeneficiaries);
  const beneficiariesLoading = useSelector(selectBeneficiariesLoading);
  const beneficiaryBanks = useSelector(selectBeneficiaryBanks);
  const banksLoading = useSelector(selectBanksLoading);
  const hasFetched = useSelector(selectHasFetched);

  const API_URL = import.meta.env.VITE_API_URL;

  // State for beneficiary code search
  const [beneficiaryCode, setBeneficiaryCode] = useState("");
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [foundBeneficiaryByCode, setFoundBeneficiaryByCode] = useState(null);
  const [showFoundBeneficiary, setShowFoundBeneficiary] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Local state for beneficiary banks
  const [localBeneficiaryBanks, setLocalBeneficiaryBanks] = useState([]);
  const [isLoadingLocalBanks, setIsLoadingLocalBanks] = useState(false);

  // State for occupations
  const [occupations, setOccupations] = useState([]);
  const [isLoadingOccupations, setIsLoadingOccupations] = useState(false);

  // Transform for dropdown
  const beneficiaries = useMemo(() => {
    if (!Array.isArray(allBeneficiaries)) {
      return [];
    }

    return allBeneficiaries
      .filter(
        (benef) => benef && benef.status === 1 && benef.active_status === 1,
      )
      .map((benef) => ({
        ...benef,
        value: benef?.id,
        label: `${benef?.name || "Unknown"} (${
          benef?.full_phone_number ||
          benef?.phone_number ||
          benef?.benef_uuid ||
          "No Phone"
        })`,
        formattedName: `${benef?.name || "Unknown"} (${
          benef?.phone_number ||
          benef?.email ||
          benef?.benef_uuid ||
          "No Contact"
        })`,
      }));
  }, [allBeneficiaries]);

  // Default payout options - fallback if paymentOptions is empty
  const defaultPayoutOptions = useMemo(
    () => [
      { value: "bank_deposit", label: "Bank Deposit" },
      { value: "fdr_npr", label: "Fixed Deposit (NPR)" },
      { value: "fcy_deposit", label: "FCY Deposit" },
    ],
    [],
  );

  // Use provided paymentOptions or fallback to defaults
  const payoutMethodOptions = useMemo(() => {
    return paymentOptions && paymentOptions.length > 0
      ? paymentOptions
      : defaultPayoutOptions;
  }, [paymentOptions, defaultPayoutOptions]);

  // Custom select styles - responsive
  const selectStyles = useMemo(
    () => ({
      control: (base) => ({
        ...base,
        minHeight: "48px",
        borderRadius: "0.5rem",
        borderColor: "#e5e7eb",
        boxShadow: "none",
        "&:hover": { borderColor: "#9ca3af" },
        fontSize: "0.875rem",
        "@media (min-width: 640px)": {
          minHeight: "56px",
          fontSize: "0.95rem",
        },
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
        padding: "10px 12px",
        fontSize: "0.875rem",
        "&:hover": {
          backgroundColor: "#f8fafc",
        },
        "@media (min-width: 640px)": {
          padding: "12px 16px",
          fontSize: "0.95rem",
        },
      }),
      menu: (base) => ({
        ...base,
        borderRadius: "0.5rem",
        fontSize: "0.875rem",
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        zIndex: 9999,
        "@media (min-width: 640px)": {
          fontSize: "0.95rem",
        },
      }),
      placeholder: (base) => ({
        ...base,
        color: "#9ca3af",
        fontWeight: "500",
        fontSize: "0.875rem",
        "@media (min-width: 640px)": {
          fontSize: "0.95rem",
        },
      }),
      singleValue: (base) => ({
        ...base,
        color: "#1f2937",
        fontWeight: "600",
        fontSize: "0.875rem",
        "@media (min-width: 640px)": {
          fontSize: "0.95rem",
        },
      }),
    }),
    [],
  );

  // Fetch occupations on component mount
  useEffect(() => {
    const fetchOccupations = async () => {
      setIsLoadingOccupations(true);
      try {
        const bearertoken = localStorage.getItem("bearertoken");
        const response = await axios.get(`${API_URL}/fetch-occupation`, {
          headers: { Authorization: `Bearer ${bearertoken}` },
        });

        if (response.data?.success) {
          const transformedOccupations = (response.data.data || []).map(
            (occupation) => ({
              value: occupation?.name,
              label: occupation?.name,
            }),
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

  // Fetch beneficiaries on mount
  useEffect(() => {
    const customerId =
      paramCustomerId || localStorage.getItem("customerId") || "1720";

    if (customerId && !hasFetched && !beneficiariesLoading) {
      console.log(
        "🔄 ManualDeposit: Fetching beneficiaries for customer:",
        customerId,
      );
      dispatch(fetchBeneficiaries(customerId));
    }
  }, [dispatch, paramCustomerId, hasFetched, beneficiariesLoading]);

  // Auto-select first beneficiary if none selected and not in search mode
  useEffect(() => {
    if (
      beneficiaries.length > 0 &&
      !selectedBeneficiary &&
      !showCodeInput &&
      !showFoundBeneficiary
    ) {
      const firstBeneficiary = beneficiaries[0];
      if (firstBeneficiary && onBeneficiarySelect) {
        handleBeneficiarySelect(firstBeneficiary);
      }
    }
  }, [beneficiaries, selectedBeneficiary, showCodeInput, showFoundBeneficiary]);

  // Auto-select first bank when local banks are loaded
  useEffect(() => {
    if (
      localBeneficiaryBanks?.length > 0 &&
      selectedBeneficiary &&
      !selectedBank &&
      onBankSelect
    ) {
      const firstBank = localBeneficiaryBanks[0];
      if (firstBank) {
        const timer = setTimeout(() => {
          onBankSelect(firstBank);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [localBeneficiaryBanks, selectedBeneficiary, selectedBank, onBankSelect]);

  // Handle beneficiary selection - UPDATED with skipStateUpdate parameter
  const handleBeneficiarySelect = useCallback(
    async (selectedOption, skipStateUpdate = false) => {
      console.log("ManualDeposit: Beneficiary selected:", selectedOption);

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
        if (!skipStateUpdate) {
          setShowFoundBeneficiary(false);
          setFoundBeneficiaryByCode(null);
        }
        setLocalBeneficiaryBanks([]);
        return;
      }

      setShowCodeInput(false);
      // Only hide found card if not called from code search
      if (!skipStateUpdate) {
        setShowFoundBeneficiary(false);
      }

      if (onBeneficiarySelect) onBeneficiarySelect(selectedOption);

      // Clear any existing selected bank
      if (onBankSelect) onBankSelect(null);
      setLocalBeneficiaryBanks([]);
      setIsLoadingLocalBanks(true);

      // Fetch beneficiary banks
      try {
        console.log("📋 Fetching banks for beneficiary ID:", selectedOption.id);
        const result = await dispatch(
          fetchBeneficiaryBanks(selectedOption.id),
        ).unwrap();

        console.log("📋 Banks fetched successfully:", result);

        // Store banks locally
        if (result && Array.isArray(result)) {
          setLocalBeneficiaryBanks(result);
        } else if (result?.data && Array.isArray(result.data)) {
          setLocalBeneficiaryBanks(result.data);
        }

        // Find matching options from beneficiary data
        if (onFieldChange) {
          // Purpose
          if (selectedOption?.transfer_purpose) {
            const matchedPurpose = purposeOptions.find(
              (opt) => opt.value === selectedOption.transfer_purpose,
            );
            if (matchedPurpose) {
              onFieldChange("purpose", matchedPurpose);
            }
          }

          // Income Source
          if (selectedOption?.income_source) {
            const matchedIncomeSource = incomeSourceOptions.find(
              (opt) => opt.value === selectedOption.income_source,
            );
            if (matchedIncomeSource) {
              onFieldChange("incomeSource", matchedIncomeSource);
            }
          }

          // Relation
          if (selectedOption?.relationtobenef) {
            const matchedRelation = relationOptions.find(
              (opt) => opt.value === selectedOption.relationtobenef,
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
              (opt) => opt.value === payoutMethodValue,
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

        // Auto-select first bank if available
        if (result?.length > 0) {
          setTimeout(() => {
            const firstBank = result[0];
            if (firstBank && onBankSelect) {
              onBankSelect(firstBank);
              if (!skipStateUpdate) {
                toast.success("Beneficiary details loaded successfully!");
              }
            }
          }, 100);
        } else {
          toast.warning("No bank accounts found for this beneficiary");
        }
      } catch (error) {
        console.error("Error fetching beneficiary banks:", error);
        toast.error("Failed to load beneficiary bank details");
        setLocalBeneficiaryBanks([]);
      } finally {
        setIsLoadingLocalBanks(false);
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
    ],
  );

  // Handle beneficiary code lookup - FIXED to keep showFoundBeneficiary true
  const handleBeneficiaryCodeLookupInternal = async () => {
    if (!beneficiaryCode.trim()) {
      toast.error("Please enter a beneficiary code");
      return;
    }

    try {
      setIsLoadingCode(true);
      setSearchError("");
      setFoundBeneficiaryByCode(null);
      setShowFoundBeneficiary(false);

      const result = await dispatch(
        fetchBeneficiaryByCode(beneficiaryCode),
      ).unwrap();

      if (result?.data) {
        const beneficiaryData = result.data;

        const transformedBeneficiary = {
          value: beneficiaryData?.id,
          id: beneficiaryData?.id,
          label: `${beneficiaryData?.name || "Unknown"} (${
            beneficiaryData?.phone_number || "No Phone"
          })`,
          name: beneficiaryData?.name,
          benef_uuid: beneficiaryData?.benef_uuid,
          occupation: beneficiaryData?.occupation,
          relationtobenef: beneficiaryData?.relationtobenef,
          transfer_purpose: beneficiaryData?.transfer_purpose,
          income_source: beneficiaryData?.income_source,
          payout_method:
            beneficiaryData?.payout_method || beneficiaryData?.payment_method,
          phone_number: beneficiaryData?.phone_number,
          email: beneficiaryData?.email,
          benef_banks: beneficiaryData?.benef_banks,
          ...beneficiaryData,
        };

        // Set the found beneficiary and show the details card FIRST
        setFoundBeneficiaryByCode(transformedBeneficiary);
        setShowFoundBeneficiary(true);

        // Load banks but DON'T auto-select or hide the found card
        // Pass true to skip state update
        await handleBeneficiarySelect(transformedBeneficiary, true);

        toast.success("Beneficiary details loaded successfully!");
      }
    } catch (error) {
      console.error("Error fetching beneficiary by code:", error);
      if (error.response?.status === 404) {
        setSearchError("No beneficiary found with this code");
        toast.error("No beneficiary found with this code");
      } else {
        setSearchError(
          "Failed to fetch beneficiary details. Please try again.",
        );
        toast.error("Failed to fetch beneficiary details");
      }
      setFoundBeneficiaryByCode(null);
      setShowFoundBeneficiary(false);
    } finally {
      setIsLoadingCode(false);
    }
  };

  // Clear found beneficiary
  const clearFoundBeneficiary = () => {
    setFoundBeneficiaryByCode(null);
    setShowFoundBeneficiary(false);
    setBeneficiaryCode("");
    setSearchError("");
    setShowCodeInput(false);
    if (onBeneficiarySelect) onBeneficiarySelect(null);
    if (onBankSelect) onBankSelect(null);
  };

  // Use found beneficiary - FIXED to pass false for skipStateUpdate
  const useFoundBeneficiary = () => {
    if (foundBeneficiaryByCode && onBeneficiarySelect) {
      handleBeneficiarySelect(foundBeneficiaryByCode, false);
      setShowFoundBeneficiary(false);
      toast.success("Beneficiary selected successfully!");
    }
  };

  // Handle beneficiary code input change
  const handleBeneficiaryCodeInputChange = (e) => {
    const value = e.target.value;
    setBeneficiaryCode(value);
    setShowCodeInput(value.trim().length > 0);

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
    if (onFieldChange) {
      onFieldChange("occupation", selectedOption?.value || "");
    }
  };

  // Current occupation value
  const currentOccupationValue = useMemo(() => {
    if (!formData?.occupation) return null;
    return occupations.find((opt) => opt.value === formData.occupation) || null;
  }, [formData?.occupation, occupations]);

  // Handle add new beneficiary
  const handleAddNewBeneficiary = () => {
    const customerId =
      paramCustomerId || localStorage.getItem("authcustomer_id");
    navigate(`/addbeneficiary/${customerId}`);
  };

  // Bank Detail Item component
  const BankDetailItem = ({ icon, label, value }) => (
    <div className="flex items-start gap-2">
      <div className="text-gray-500 mt-0.5 text-sm flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
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

  // Render beneficiary found card - FIXED to properly display bank details from the API response
  const renderBeneficiaryFoundCard = () => {
    // Get the first bank from benef_banks array
    const firstBank = foundBeneficiaryByCode?.benef_banks?.[0];

    return (
      <div className="bg-white p-4 sm:p-5 rounded-lg border border-green-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
              <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                Beneficiary Found!
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 break-all">
                Code: <span className="font-mono">{beneficiaryCode}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearFoundBeneficiary}
            className="text-gray-400 hover:text-gray-600 transition-colors self-end sm:self-start"
          >
            <FaTimesCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Beneficiary Details Grid - Mobile: 1 column, Tablet: 2 columns */}
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Full Name</p>
            <p className="text-sm font-medium text-gray-900 break-words">
              {foundBeneficiaryByCode?.name || "N/A"}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Bank Account</p>
            <p className="text-sm font-medium text-gray-900 font-mono break-all">
              {firstBank?.bank_acc_no ||
                firstBank?.account_number ||
                foundBeneficiaryByCode?.bank_acc_no ||
                "N/A"}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Phone Number</p>
            <p className="text-sm font-medium text-gray-900 break-words">
              {foundBeneficiaryByCode?.phone_number ||
                foundBeneficiaryByCode?.full_phone_number ||
                "N/A"}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Email Address</p>
            <p className="text-sm font-medium text-gray-900 break-words">
              {foundBeneficiaryByCode?.email || "N/A"}
            </p>
          </div>
        </div>

        {/* Bank Additional Details - Responsive */}
        {firstBank && (
          <div className="mb-4 p-3 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <FaBuilding className="text-blue-600 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-800">
                Bank Details
              </span>
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-500">Bank Name</p>
                <p className="text-sm font-medium text-gray-900 break-words">
                  {firstBank.bank_name || firstBank.bank_branch_name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Account Number</p>
                <p className="text-sm font-medium text-gray-900 font-mono break-all">
                  {firstBank.bank_acc_no || firstBank.account_number || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">IFSC Code</p>
                <p className="text-sm font-medium text-gray-900 font-mono break-all">
                  {firstBank.ifsc || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Method</p>
                <p className="text-sm font-medium text-gray-900 break-words">
                  {firstBank.payment_method || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Currency</p>
                <p className="text-sm font-medium text-gray-900">
                  {firstBank.currency_code || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Rails</p>
                <p className="text-sm font-medium text-gray-900">
                  {firstBank.rails || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Stack on mobile, side by side on tablet/desktop */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={useFoundBeneficiary}
            className="w-full sm:flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
          >
            <FaCheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Use This Beneficiary</span>
          </button>
          <button
            type="button"
            onClick={clearFoundBeneficiary}
            className="w-full sm:flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
          >
            <FaTimesCircle className="w-4 h-4 flex-shrink-0" />
            <span>Clear Search</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main container */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
          Manual Deposit Details
        </h3>

        <div className="space-y-4 sm:space-y-4">
          {/* BENEFICIARY SELECTION SECTION */}
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Beneficiary
              </label>
              <button
                type="button"
                onClick={handleAddNewBeneficiary}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto"
              >
                <FaPlus className="w-3 h-3 flex-shrink-0" />
                Add New Beneficiary
              </button>
            </div>

            {beneficiariesLoading ? (
              <div className="flex items-center justify-center py-4">
                <RingLoader size={20} color="#3b82f6" />
                <span className="ml-2 text-sm text-gray-600">
                  Loading beneficiaries...
                </span>
              </div>
            ) : hasFetched && beneficiaries.length === 0 ? (
              /* CASE 1: NO BENEFICIARIES - Show empty state with integrated search */
              <div className="space-y-4">
                {showFoundBeneficiary && foundBeneficiaryByCode ? (
                  renderBeneficiaryFoundCard()
                ) : (
                  <div className="text-center py-6 sm:py-8 px-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="bg-gray-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <FaUser className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      No Beneficiaries Found
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto px-2">
                      You haven't added any beneficiaries yet. Add a new
                      beneficiary or search using an existing beneficiary code.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4 sm:mb-6 px-4">
                      <button
                        type="button"
                        onClick={handleAddNewBeneficiary}
                        className="w-full sm:w-auto px-5 sm:px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <FaPlus className="w-4 h-4 flex-shrink-0" />
                        <span>Add New Beneficiary</span>
                      </button>
                    </div>

                    {/* Search Section in Empty State */}
                    <div className="max-w-md mx-auto pt-4 border-t border-gray-200 px-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Or search by beneficiary code:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={beneficiaryCode}
                          onChange={handleBeneficiaryCodeInputChange}
                          placeholder="Enter beneficiary code"
                          className="w-full sm:flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          disabled={isLoadingCode}
                        />
                        <button
                          type="button"
                          onClick={handleBeneficiaryCodeLookupInternal}
                          disabled={isLoadingCode || !beneficiaryCode.trim()}
                          className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          {isLoadingCode ? (
                            <>
                              <RingLoader size={16} color="#ffffff" />
                              <span>Searching...</span>
                            </>
                          ) : (
                            <>
                              <FaSearch className="w-4 h-4 flex-shrink-0" />
                              <span>Search</span>
                            </>
                          )}
                        </button>
                      </div>
                      {searchError && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs sm:text-sm text-red-600 flex items-center gap-2">
                            <FaExclamationTriangle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-left">{searchError}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* CASE 2: HAS BENEFICIARIES - Show dropdown selector */
              <Select
                options={beneficiaries}
                value={selectedBeneficiary || null}
                onChange={handleBeneficiarySelect}
                isLoading={beneficiariesLoading}
                isDisabled={
                  beneficiariesLoading || showCodeInput || showFoundBeneficiary
                }
                classNamePrefix="select"
                styles={selectStyles}
                placeholder={
                  showFoundBeneficiary
                    ? "Disabled - Beneficiary found via code"
                    : beneficiariesLoading
                      ? "Loading beneficiaries..."
                      : showCodeInput
                        ? "Disabled - Using beneficiary code"
                        : "Select beneficiary..."
                }
                isSearchable
                getOptionLabel={(option) =>
                  option?.formattedName ||
                  `${option?.name || "Unknown"} (${
                    option?.phone_number || option?.benef_uuid || "No Contact"
                  })`
                }
                getOptionValue={(option) => option?.id}
              />
            )}
          </div>

          {/* OR SEPARATOR - Only show when beneficiaries exist AND not showing found beneficiary card */}
          {beneficiaries.length > 0 && !showFoundBeneficiary && (
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <div className="mx-4 text-sm text-gray-500 font-medium">OR</div>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
          )}

          {/* ENTER BENEFICIARY CODE FIELD - Only show when beneficiaries exist AND not showing found beneficiary card */}
          {beneficiaries.length > 0 && !showFoundBeneficiary && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Beneficiary Code
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={beneficiaryCode}
                  onChange={handleBeneficiaryCodeInputChange}
                  placeholder="Enter beneficiary code"
                  className="w-full sm:flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={isLoadingCode}
                />
                <button
                  type="button"
                  onClick={handleBeneficiaryCodeLookupInternal}
                  disabled={isLoadingCode || !beneficiaryCode.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {isLoadingCode ? (
                    <>
                      <RingLoader size={16} color="#ffffff" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <FaSearch className="w-4 h-4 flex-shrink-0" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter the beneficiary code to load their details automatically
              </p>
              {searchError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-red-600 flex items-center gap-2">
                    <FaExclamationTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-left">{searchError}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* BENEFICIARY FOUND CARD - Show when search is successful */}
          {/* {showFoundBeneficiary && foundBeneficiaryByCode && (
            <div className="mt-4">{renderBeneficiaryFoundCard()}</div>
          )} */}

          {/* Payout Method - Responsive */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <p className="mt-1 text-xs text-yellow-600">
                No payout methods available. Using default options.
              </p>
            )}
          </div>

          {/* Purpose of Transfer - Responsive */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <p className="mt-1 text-xs text-yellow-600">
                No purpose options loaded. Please check API connection.
              </p>
            )}
          </div>

          {/* Source of Income - Responsive */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <p className="mt-1 text-xs text-yellow-600">
                No income source options loaded. Please check API connection.
              </p>
            )}
          </div>

          {/* Occupation Field - Responsive */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Occupation
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                options={occupations}
                value={currentOccupationValue}
                onChange={handleOccupationChange}
                isLoading={isLoadingOccupations}
                classNamePrefix="select"
                styles={selectStyles}
                placeholder={
                  isLoadingOccupations
                    ? "Loading occupations..."
                    : "Select occupation..."
                }
                className="w-full sm:flex-1"
                isSearchable
                isClearable
              />
              <input
                type="text"
                value={formData?.occupation || ""}
                onChange={(e) => onFieldChange("occupation", e.target.value)}
                placeholder="Or enter custom occupation"
                className="w-full sm:flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Beneficiary Bank - Responsive */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beneficiary Bank
            </label>
            <Select
              options={localBeneficiaryBanks || []}
              value={selectedBank || null}
              onChange={onBankSelect}
              isLoading={banksLoading || isLoadingLocalBanks}
              isDisabled={
                !selectedBeneficiary ||
                banksLoading ||
                isLoadingLocalBanks ||
                !localBeneficiaryBanks ||
                localBeneficiaryBanks.length === 0
              }
              classNamePrefix="select"
              styles={selectStyles}
              placeholder={
                isLoadingLocalBanks
                  ? "Loading banks..."
                  : banksLoading
                    ? "Loading banks..."
                    : !selectedBeneficiary
                      ? "Select a beneficiary first"
                      : !localBeneficiaryBanks ||
                          localBeneficiaryBanks.length === 0
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
              !isLoadingLocalBanks &&
              !banksLoading &&
              localBeneficiaryBanks &&
              localBeneficiaryBanks.length > 0 && (
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  {localBeneficiaryBanks.length} bank account(s) available
                </p>
              )}
          </div>

          {/* Compliance Note - Responsive */}
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
            <p className="text-xs sm:text-sm text-gray-700">
              <span className="font-semibold">Note:</span> For compliance
              purposes, we require information about the purpose of your
              transfer and source of funds. All information is kept confidential
              and secure.
            </p>
          </div>

          {/* Bank Details Display Section */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
              <FaUniversity className="text-blue-500 flex-shrink-0" />
              Bank account for deposit
            </h3>

            {manualDetailsLoading ? (
              <div className="flex justify-center py-3">
                <RingLoader color="#2563eb" size={16} />
                <span className="ml-2 text-sm text-gray-600">
                  Loading bank details...
                </span>
              </div>
            ) : manualAccountDetails ? (
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <BankDetailItem
                    icon={<FaUniversity className="text-gray-400" />}
                    label="Bank Name"
                    value={manualAccountDetails.bank_name}
                  />
                  <BankDetailItem
                    icon={<FaUser className="text-gray-400" />}
                    label="Account Name"
                    value={manualAccountDetails.account_name}
                  />
                  <BankDetailItem
                    icon={<FaInfoCircle className="text-gray-400" />}
                    label="Account Number"
                    value={manualAccountDetails.account_number}
                  />
                  <BankDetailItem
                    icon={<FaInfoCircle className="text-gray-400" />}
                    label="Routing Number"
                    value={manualAccountDetails.routing_number}
                  />
                </div>
              </div>
            ) : manualAccountError || manualAccountDetails?.status === 404 ? (
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <div className="flex items-start gap-2">
                  <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800 mb-1">
                      Bank Details Not Found
                    </h4>
                    <p className="text-xs text-red-700">
                      {typeof manualAccountError === "string"
                        ? manualAccountError
                        : "Unable to load bank details"}
                    </p>
                    <p className="text-xs text-red-600 mt-2">
                      Please select a different payment method or contact
                      support.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <div className="flex items-start gap-2">
                  <FaExclamationTriangle className="text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">
                      Bank Details Not Available
                    </h4>
                    <p className="text-xs text-yellow-700">
                      Unable to load bank details for manual deposit. Please
                      select a different payment method or contact support.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Document Upload Section - Responsive */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Bank Deposit Proof *
            </label>
            <div className="flex items-center">
              <label className="flex flex-col items-center justify-center w-full p-4 sm:p-6 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center">
                  <FaUpload className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-gray-500" />
                  <p className="text-xs sm:text-sm text-gray-500 text-center px-2">
                    {formData?.document
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
                  className="h-full max-h-32 sm:max-h-48 object-contain border rounded"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success/Error Messages - Responsive */}
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        limit={3}
        className="text-sm sm:text-base"
        toastClassName="p-3 sm:p-4"
        bodyClassName="text-xs sm:text-sm"
        closeButton={false}
      />
    </div>
  );
};

export default ManualDeposit;
