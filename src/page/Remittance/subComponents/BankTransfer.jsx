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
  fetchUSDBankAccounts,
  selectUSDBankAccounts,
  selectHasSilaAccounts,
  selectUSDAccountsLoading,
  selectUSDAccountsError,
  setUSDBankAccounts,
} from "../../Deposit/slices/bankAccountSlice";

import PaymentInitiation from "../../Deposit/components/PaymentInitiation/PaymentInitiation";
import {
  setShowPaymentInitiation,
  setSelectedBankAccount,
} from "../../Deposit/slices/depositSlice";

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
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { customerId: paramCustomerId } = useParams();

  const reduxSilaBankAccounts = useSelector(selectUSDBankAccounts); // Changed
  const reduxHasSilaAccounts = useSelector(selectHasSilaAccounts);
  const reduxSilaAccountsLoading = useSelector(selectUSDAccountsLoading); // Changed
  const reduxSilaAccountsError = useSelector(selectUSDAccountsError); // Changed

  // Use props if provided, otherwise use Redux store
  const displayedSilaAccounts =
    silaBankAccounts.length > 0 ? silaBankAccounts : reduxSilaBankAccounts;
  const displayedHasSilaAccounts = hasSilaAccounts || reduxHasSilaAccounts;
  const displayedSilaAccountsLoading =
    silaAccountsLoading || reduxSilaAccountsLoading;
  const displayedSilaAccountsError =
    silaAccountsError || reduxSilaAccountsError;

  const allBeneficiaries = useSelector(selectBeneficiaries);
  const beneficiariesLoading = useSelector(selectBeneficiariesLoading);
  const banksLoading = useSelector(selectBanksLoading);

  const API_URL = import.meta.env.VITE_API_URL;

  // Transform for dropdown
  const beneficiaries = useMemo(() => {
    return (allBeneficiaries || [])
      .filter((benef) => benef?.status === 1 && benef?.active_status === 1)
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

  // FETCH BENEFICIARIES ON MOUNT
  useEffect(() => {
    const customerId =
      paramCustomerId || localStorage.getItem("customerId") || "1720";

    if (
      customerId &&
      (!allBeneficiaries || allBeneficiaries.length === 0) &&
      !beneficiariesLoading
    ) {
      console.log(
        "🔄 BankTransfer: Fetching beneficiaries for customer:",
        customerId,
      );
      dispatch(fetchBeneficiaries(customerId));
    }
  }, [dispatch, paramCustomerId, allBeneficiaries, beneficiariesLoading]);

  const beneficiaryBanks = useSelector(selectBeneficiaryBanks);

  // Local state
  const [beneficiaryCode, setBeneficiaryCode] = useState("");
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [occupations, setOccupations] = useState([]);
  const [isLoadingOccupations, setIsLoadingOccupations] = useState(false);
  const [showBankAccountInfo, setShowBankAccountInfo] = useState(false);

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

  // Custom select styles
  const selectStyles = useMemo(
    () => ({
      control: (base) => ({
        ...base,
        minHeight: "56px",
        borderRadius: "0.5rem",
        borderColor: "#e5e7eb",
        boxShadow: "none",
        "&:hover": { borderColor: "#9ca3af" },
        fontSize: "0.95rem",
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
        padding: "12px 16px",
        "&:hover": {
          backgroundColor: "#f8fafc",
        },
      }),
      menu: (base) => ({
        ...base,
        borderRadius: "0.5rem",
        fontSize: "0.95rem",
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        zIndex: 9999,
      }),
      placeholder: (base) => ({
        ...base,
        color: "#9ca3af",
        fontWeight: "500",
      }),
      singleValue: (base) => ({
        ...base,
        color: "#1f2937",
        fontWeight: "600",
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
        fetchBeneficiaryBanks(selectedOption.id),
      ).unwrap();

      console.log("📋 Banks fetched successfully:", result);

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
          const firstBank = beneficiaryBanks?.[0];
          if (firstBank && onBankSelect) {
            onBankSelect(firstBank);
            toast.success("Beneficiary details loaded successfully!");
          }
        }, 100);
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

    toast.success(`Selected ${selectedOption?.account_name || "bank account"}`);
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
    const customerId =
      paramCustomerId || localStorage.getItem("authcustomer_id");
    navigate(`/addbeneficiary/${customerId}`);
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

  // Bank Account Info Modal
  const renderBankAccountInfo = () => {
    if (!selectedBankAccount) return null;

    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-md font-semibold text-blue-800">
            Selected Bank Account Details
          </h4>
          <button
            type="button"
            onClick={() => setShowBankAccountInfo(!showBankAccountInfo)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showBankAccountInfo ? "Hide Details" : "Show Details"}
          </button>
        </div>

        {showBankAccountInfo && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Account Name</p>
                <p className="text-sm font-medium">
                  {selectedBankAccount.account_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Provider</p>
                <p className="text-sm font-medium">
                  {selectedBankAccount.provider || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Account Type</p>
                <p className="text-sm font-medium">
                  {selectedBankAccount.account_type || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Account Number</p>
                <p className="text-sm font-medium">
                  {selectedBankAccount.accountNumberHash || "****"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Routing Number</p>
                <p className="text-sm font-medium">
                  {selectedBankAccount.routing_number || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium">
                  {selectedBankAccount.web_debit_verified ? (
                    <span className="flex items-center text-green-600">
                      <FaCheckCircle className="mr-1" /> Verified
                    </span>
                  ) : (
                    <span className="text-yellow-600">
                      Pending Verification
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-blue-200">
              <p className="text-xs text-gray-500 mb-1">Additional Info</p>
              <p className="text-xs text-gray-700">
                This account will be used as the source for your bank transfer.
                {selectedBankAccount.fednow_credit_enabled &&
                  " Supports FedNow transfers."}
                {selectedBankAccount.rtp_credit_enabled &&
                  " Supports RTP transfers."}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Transform Sila bank accounts for dropdown
  const silaAccountOptions = useMemo(() => {
    return (displayedSilaAccounts || []).map((account) => {
      const accountName =
        account.account_name || account.accountName || "Unknown Account";
      const accountNumber =
        account.accountNumberHash || account.account_number || "****";
      const provider = account.provider || account.bank || "Unknown Bank";
      const accountType =
        account.account_type || account.accountType || "Checking";

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
  }, [displayedSilaAccounts]);

  // Auto-select first Sila account if available and none selected
  useEffect(() => {
    if (
      silaAccountOptions.length > 0 &&
      !selectedBankAccount &&
      onBankAccountSelect
    ) {
      const firstAccount = silaAccountOptions[0];
      console.log("🔄 Auto-selecting first Sila account:", firstAccount);
      onBankAccountSelect(firstAccount);
    }
  }, [silaAccountOptions, selectedBankAccount, onBankAccountSelect]);

  // Debug logging
  useEffect(() => {
    console.log("BankTransfer Props Debug:", {
      formDataPaymentMethod: formData?.paymentMethod,
      hasOnFieldChange: !!onFieldChange,
      purposeOptionsCount: purposeOptions?.length || 0,
      incomeSourceOptionsCount: incomeSourceOptions?.length || 0,
      paymentOptionsCount: paymentOptions?.length || 0,
      relationOptionsCount: relationOptions?.length || 0,
      formDataPurpose: formData?.purpose,
      formDataIncomeSource: formData?.incomeSource,
      formDataPayoutMethod: formData?.payout_method,
      silaAccountsCount: displayedSilaAccounts?.length || 0,
      hasSilaAccounts: displayedHasSilaAccounts,
      selectedBankAccount: selectedBankAccount,
    });
  }, [
    onFieldChange,
    purposeOptions,
    incomeSourceOptions,
    paymentOptions,
    relationOptions,
    formData,
    displayedSilaAccounts,
    displayedHasSilaAccounts,
    selectedBankAccount,
    formData?.paymentMethod,
  ]);

  useEffect(() => {
    console.log("🔍 BankTransfer - Sila Accounts Debug:", {
      displayedSilaAccounts: displayedSilaAccounts?.length || 0,
      displayedHasSilaAccounts,
      displayedSilaAccountsLoading,
      displayedSilaAccountsError,
      selectedCurrency,
      paymentMethod: formData?.paymentMethod,
      shouldShowDropdown:
        displayedHasSilaAccounts &&
        selectedCurrency === "USD" &&
        formData?.paymentMethod === "bank",
    });
  }, [
    displayedSilaAccounts,
    displayedHasSilaAccounts,
    displayedSilaAccountsLoading,
    displayedSilaAccountsError,
    selectedCurrency,
    formData?.paymentMethod,
  ]);

  useEffect(() => {
    const customerId = paramCustomerId || localStorage.getItem("customerId");

    if (customerId && !displayedSilaAccountsLoading) {
      console.log(
        "🔄 BankTransfer: Fetching Sila bank accounts via /sila/sila-bank-details",
      );
      dispatch(fetchUSDBankAccounts()) // ✅ Changed to fetchUSDBankAccounts
        .unwrap()
        .then((result) => {
          console.log("✅ Sila bank accounts loaded:", result);
        })
        .catch((error) => {
          console.error("❌ Failed to load Sila bank accounts:", error);
        });
    }
  }, [dispatch, paramCustomerId]);

  useEffect(() => {
    if (beneficiaries.length > 0 && !selectedBeneficiary && !showCodeInput) {
      const firstBeneficiary = beneficiaries[0];
      if (firstBeneficiary && onBeneficiarySelect) {
        handleBeneficiarySelect(firstBeneficiary);
      }
    }
  }, [beneficiaries, selectedBeneficiary, showCodeInput]);

  return (
    <div className="space-y-6">
      {/* Main container */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Bank Transfer Details
        </h3>

        <div className="space-y-4">
          {/* Select Your Bank Account (Sila Accounts) */}
          {displayedHasSilaAccounts &&
            selectedCurrency === "USD" &&
            formData.paymentMethod === "bank" && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Your Bank Account *
                  </label>
                  {displayedSilaAccountsLoading ? (
                    <div className="flex items-center">
                      <RingLoader size={20} color="#3b82f6" />
                      <span className="ml-2 text-xs text-gray-500">
                        Loading accounts...
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {silaAccountOptions.length} account(s) available
                    </span>
                  )}
                </div>

                {displayedSilaAccountsError ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">
                      {displayedSilaAccountsError}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const customerId =
                          paramCustomerId ||
                          localStorage.getItem("customerId") ||
                          "1720";
                        dispatch(fetchUSDBankAccounts());
                      }}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
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
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {option.account_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {option.provider} • {option.account_type}
                              {option.web_debit_verified && (
                                <span className="ml-2 text-green-600">
                                  <FaCheckCircle className="inline mr-1" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {option.accountNumberHash}
                          </div>
                        </div>
                      )}
                      getOptionValue={(option) => option.value}
                    />

                    {selectedBankAccount && renderBankAccountInfo()}

                    {silaAccountOptions.length === 0 &&
                      !displayedSilaAccountsLoading && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start">
                            <FaExclamationTriangle className="text-yellow-600 mt-0.5 mr-2" />
                            <div>
                              <p className="text-sm text-yellow-800">
                                No bank accounts found. Please link a bank
                                account to proceed.
                              </p>
                              <button
                                type="button"
                                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                                onClick={() => {
                                  // You can add navigation to bank linking page here
                                  toast.info("Redirecting to bank linking...");
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

          {/* Beneficiary Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Beneficiary
              </label>
              <button
                type="button"
                onClick={handleAddNewBeneficiary}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <FaPlus className="w-3 h-3" />
                Add New Beneficiary
              </button>
            </div>
            <Select
              options={beneficiaries}
              value={selectedBeneficiary || null}
              onChange={handleBeneficiarySelect}
              isLoading={beneficiariesLoading}
              isDisabled={beneficiariesLoading || showCodeInput}
              classNamePrefix="select"
              styles={selectStyles}
              placeholder={
                beneficiariesLoading
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
          </div>

          {/* OR Separator */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="mx-4 text-sm text-gray-500 font-medium">or</div>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Enter Beneficiary Code Field */}
          <div>
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
          </div>

          {/* Payout Method */}
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

          {/* Purpose of Transfer */}
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

          {/* Source of Income */}
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

          {/* Occupation Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Occupation
            </label>
            <div className="flex gap-2">
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
                className="flex-1"
                isSearchable
                isClearable
              />
              <input
                type="text"
                value={formData?.occupation || ""}
                onChange={(e) => onFieldChange("occupation", e.target.value)}
                placeholder="Or enter custom occupation"
                className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Beneficiary Bank */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <p className="mt-1 text-sm text-gray-500">
                  {beneficiaryBanks.length} bank account(s) available
                </p>
              )}
          </div>

          {(selectedCurrency === "EUR" ||
            selectedCurrency === "GBP" ||
            selectedCurrency === "DKK") &&
          selectedBank &&
          selectedBeneficiary &&
          formData?.amount &&
          parseFloat(formData.amount) > 0 ? (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    Open Banking
                  </h4>
                  <p className="text-sm text-gray-600">
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
                        toast.error(error),
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
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all"
                >
                  <FaUniversity className="mr-2" />
                  Initiate Open Banking
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FaInfoCircle className="text-green-600 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-green-800">
                      <strong>Open Banking</strong> allows you to securely
                      connect your bank account and initiate transfers
                      instantly. No manual bank details required.
                    </p>
                    <ul className="mt-2 text-xs text-green-700 space-y-1">
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

          {/* Compliance Note */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Note:</span> For compliance
              purposes, we require information about the purpose of your
              transfer and source of funds. All information is kept confidential
              and secure.
            </p>
          </div>

          {/* Document Upload Section - Only show if onFileUpload prop is provided */}
          {onFileUpload && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Supporting Document (Optional)
              </label>
              <div className="flex items-center">
                <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center">
                    <FaUpload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="text-sm text-gray-500">
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
                    className="h-full object-contain border rounded"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default BankTransfer;
