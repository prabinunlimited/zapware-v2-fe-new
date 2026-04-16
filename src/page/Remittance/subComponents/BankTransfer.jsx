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
  FaTimesCircle,
  FaLink,
} from "react-icons/fa";
import { RingLoader } from "react-spinners";
import Select from "react-select";
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
  customerId,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { customerId: paramCustomerId } = useParams();

  const reduxSilaBankAccounts = useSelector(selectUSDBankAccounts);
  const reduxHasSilaAccounts = useSelector(selectHasSilaAccounts);
  const reduxSilaAccountsLoading = useSelector(selectUSDAccountsLoading);
  const reduxSilaAccountsError = useSelector(selectUSDAccountsError);
  const hasFetched = useSelector(selectHasFetched);

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

    if (customerId && !hasFetched && !beneficiariesLoading) {
      console.log(
        "🔄 BankTransfer: Fetching beneficiaries for customer:",
        customerId,
      );
      dispatch(fetchBeneficiaries(customerId));
    }
  }, [dispatch, paramCustomerId, hasFetched, beneficiariesLoading]);

  const beneficiaryBanks = useSelector(selectBeneficiaryBanks);

  // Local state
  const [beneficiaryCode, setBeneficiaryCode] = useState("");
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [occupations, setOccupations] = useState([]);
  const [isLoadingOccupations, setIsLoadingOccupations] = useState(false);
  const [showBankAccountInfo, setShowBankAccountInfo] = useState(false);

  const [foundBeneficiaryByCode, setFoundBeneficiaryByCode] = useState(null);
  const [showFoundBeneficiary, setShowFoundBeneficiary] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [noSenderBank, setNoSenderBank] = useState("");

  // Default payout options - fallback if paymentOptions is empty
  const defaultPayoutOptions = useMemo(
    () => [
      { value: "bank", label: "Bank Transfer" },
      { value: "manual", label: "Cash Deposit" },
      { value: "card", label: "Card Payment" },
    ],
    [],
  );

  // Use provided paymentOptions or fallback to defaults
  const payoutMethodOptions = useMemo(() => {
    return paymentOptions && paymentOptions.length > 0
      ? paymentOptions
      : defaultPayoutOptions;
  }, [paymentOptions, defaultPayoutOptions]);

  // Add this useEffect to sync payment method with payout method
  useEffect(() => {
    if (formData?.paymentMethod && onFieldChange) {
      const matchedOption = payoutMethodOptions.find(
        (opt) => opt.value === formData.paymentMethod,
      );

      if (
        matchedOption &&
        (!formData.payout_method ||
          formData.payout_method.value !== matchedOption.value)
      ) {
        console.log("🔄 Setting payout method to:", matchedOption);
        onFieldChange("payout_method", matchedOption);
      }
    }
  }, [
    formData?.paymentMethod,
    onFieldChange,
    payoutMethodOptions,
    formData?.payout_method,
  ]);

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

    if (onBankSelect) onBankSelect(null);

    try {
      console.log("📋 Fetching banks for beneficiary ID:", selectedOption.id);
      const result = await dispatch(
        fetchBeneficiaryBanks(selectedOption.id),
      ).unwrap();

      console.log("📋 Banks fetched successfully:", result);

      if (onFieldChange) {
        if (selectedOption?.transfer_purpose) {
          const matchedPurpose = purposeOptions.find(
            (opt) => opt.value === selectedOption.transfer_purpose,
          );
          if (matchedPurpose) {
            onFieldChange("purpose", matchedPurpose);
          }
        }

        if (selectedOption?.income_source) {
          const matchedIncomeSource = incomeSourceOptions.find(
            (opt) => opt.value === selectedOption.income_source,
          );
          if (matchedIncomeSource) {
            onFieldChange("incomeSource", matchedIncomeSource);
          }
        }

        if (selectedOption?.relationtobenef) {
          const matchedRelation = relationOptions.find(
            (opt) => opt.value === selectedOption.relationtobenef,
          );
          if (matchedRelation) {
            onFieldChange("relation", matchedRelation);
          }
        }

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

        if (selectedOption?.occupation) {
          onFieldChange("occupation", selectedOption.occupation);
        }
      }

      if (result?.length > 0) {
        setTimeout(() => {
          const firstBank = beneficiaryBanks?.[0];
          if (firstBank && onBankSelect) {
            onBankSelect(firstBank);
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error fetching beneficiary banks:", error);
    }
  };

  // Handle bank account selection
  const handleBankAccountSelect = (selectedOption) => {
    console.log("BankTransfer: Sila bank account selected:", selectedOption);

    if (onBankAccountSelect) {
      onBankAccountSelect(selectedOption);
    }

    if (selectedOption) {
      dispatch(setSelectedBankAccount(selectedOption));
    }
  };

  // Handle beneficiary code lookup
  const handleBeneficiaryCodeLookupInternal = async () => {
    if (!beneficiaryCode.trim()) {
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

        setFoundBeneficiaryByCode(transformedBeneficiary);
        setShowFoundBeneficiary(true);
        await handleBeneficiarySelect(transformedBeneficiary);
      }
    } catch (error) {
      console.error("Error fetching beneficiary by code:", error);
      if (error.response?.status === 404) {
        setSearchError("No beneficiary found with this code");
      } else {
        setSearchError(
          "Failed to fetch beneficiary details. Please try again.",
        );
      }
      setFoundBeneficiaryByCode(null);
      setShowFoundBeneficiary(false);
    } finally {
      setIsLoadingCode(false);
    }
  };

  const clearFoundBeneficiary = () => {
    setFoundBeneficiaryByCode(null);
    setShowFoundBeneficiary(false);
    setBeneficiaryCode("");
    setSearchError("");
    if (onBeneficiarySelect) onBeneficiarySelect(null);
    if (onBankSelect) onBankSelect(null);
  };

  const useFoundBeneficiary = () => {
    if (foundBeneficiaryByCode && onBeneficiarySelect) {
      handleBeneficiarySelect(foundBeneficiaryByCode);
      setShowFoundBeneficiary(false);
    }
  };

  const handleBeneficiaryCodeInputChange = (e) => {
    const value = e.target.value;
    setBeneficiaryCode(value);
    setShowCodeInput(value.trim().length > 0);

    if (!value.trim() && selectedBeneficiary) {
      handleBeneficiarySelect(selectedBeneficiary);
    }
  };

  const handleFileUploadInternal = (e) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleOccupationChange = (selectedOption) => {
    if (onFieldChange) {
      onFieldChange("occupation", selectedOption?.value || "");
    }
  };

  const currentOccupationValue = useMemo(() => {
    if (!formData?.occupation) return null;
    return occupations.find((opt) => opt.value === formData.occupation) || null;
  }, [formData?.occupation, occupations]);

  const handleAddNewBeneficiary = () => {
    const customerId =
      paramCustomerId || localStorage.getItem("authcustomer_id");
    navigate(`/addbeneficiary/${customerId}`);
  };

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

  const renderBankAccountInfo = () => {
    if (!selectedBankAccount) return null;

    return (
      <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
          <h4 className="text-sm sm:text-md font-semibold text-blue-800">
            Selected Bank Account Details
          </h4>
          <button
            type="button"
            onClick={() => setShowBankAccountInfo(!showBankAccountInfo)}
            className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm self-start sm:self-auto"
          >
            {showBankAccountInfo ? "Hide Details" : "Show Details"}
          </button>
        </div>

        {showBankAccountInfo && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Account Name</p>
                <p className="text-sm font-medium break-words">
                  {selectedBankAccount.account_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Provider</p>
                <p className="text-sm font-medium break-words">
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
                <p className="text-sm font-medium font-mono">
                  {selectedBankAccount.accountNumberHash || "****"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Routing Number</p>
                <p className="text-sm font-medium font-mono">
                  {selectedBankAccount.routing_number || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium">
                  {selectedBankAccount.web_debit_verified ? (
                    <span className="flex items-center text-green-600">
                      <FaCheckCircle className="mr-1 flex-shrink-0" /> Verified
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

  useEffect(() => {
    const customerId = paramCustomerId || localStorage.getItem("customerId");

    if (customerId && !displayedSilaAccountsLoading) {
      console.log(
        "🔄 BankTransfer: Fetching Sila bank accounts via /sila/sila-bank-details",
      );
      dispatch(fetchUSDBankAccounts())
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
    const customerId = paramCustomerId || localStorage.getItem("customerId");

    if (customerId && !displayedSilaAccountsLoading) {
      console.log(
        "BankTransfer: Fetching SILA Bank Accounts via /sila/sila-bank-details",
      );
      dispatch(fetchUSDBankAccounts())
        .unwrap()
        .then((result) => {
          console.log("Sila bank accounts loaded:", result);
          if (!result || result.length === 0) {
            setNoSenderBank(true);
          } else {
            setNoSenderBank(false);
          }
        })
        .catch((error) => {
          console.error("Failed to load Sila Bank Accounts:", error);
          setNoSenderBank(true);
        });
    }
  }, [dispatch, paramCustomerId]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main container */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
          Bank Transfer Details
        </h3>

        <div className="space-y-4 sm:space-y-4">
          {/* Select Your Bank Account (Sila Accounts) */}
          {selectedCurrency === "USD" && formData?.paymentMethod === "bank" && (
            <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <label className="block text-sm font-medium text-gray-700">
                  Your Bank Account <span className="text-red-500">*</span>
                </label>
                {displayedSilaAccountsLoading ? (
                  <div className="flex items-center">
                    <RingLoader size={18} color="#3b82f6" />
                    <span className="ml-2 text-xs text-gray-500">
                      Loading accounts...
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(`/linkbank/${customerId}`)}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200"
                  >
                    Add or Remove Accounts
                  </button>
                )}
              </div>

              {displayedSilaAccountsError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">
                        Unable to Load Bank Accounts
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        {typeof displayedSilaAccountsError === "string"
                          ? displayedSilaAccountsError
                          : "Failed to load your bank accounts. Please try again."}
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
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              ) : silaAccountOptions.length === 0 &&
                !displayedSilaAccountsLoading ? (
                <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">
                        No Bank Account Linked
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        No bank account have been linked yet. Please link your
                        bank account to send USD.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/linkbank/${customerId}`);
                        }}
                        className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
                      >
                        <FaLink className="w-4 h-4" />
                        Link Bank Account
                      </button>
                    </div>
                  </div>
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
                    placeholder="Select your bank account..."
                    isSearchable
                    getOptionLabel={(option) => (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-medium text-sm sm:text-base">
                            {option.account_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {option.provider} • {option.account_type}
                            {option.web_debit_verified && (
                              <span className="ml-2 text-green-600 inline-flex items-center">
                                <FaCheckCircle className="inline mr-1" />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 sm:mt-0 font-mono">
                          {option.accountNumberHash}
                        </div>
                      </div>
                    )}
                    getOptionValue={(option) => option.value}
                  />

                  {selectedBankAccount && renderBankAccountInfo()}
                </>
              )}
            </div>
          )}

          {/* Beneficiary Selection - Responsive */}
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
              <div className="space-y-4">
                {showFoundBeneficiary && foundBeneficiaryByCode ? (
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
                            Code:{" "}
                            <span className="font-mono">{beneficiaryCode}</span>
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

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Full Name</p>
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {foundBeneficiaryByCode?.name || "N/A"}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">
                          Bank Account
                        </p>
                        <p className="text-sm font-medium text-gray-900 font-mono break-all">
                          {foundBeneficiaryByCode?.benef_banks?.[0]
                            ?.bank_acc_no ||
                            foundBeneficiaryByCode?.bank_acc_no ||
                            "N/A"}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">
                          Phone Number
                        </p>
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {foundBeneficiaryByCode?.phone_number ||
                            foundBeneficiaryByCode?.full_phone_number ||
                            "N/A"}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">
                          Email Address
                        </p>
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {foundBeneficiaryByCode?.email || "N/A"}
                        </p>
                      </div>
                    </div>

                    {foundBeneficiaryByCode?.benef_banks?.[0] && (
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
                              {foundBeneficiaryByCode.benef_banks[0]
                                .bank_name ||
                                foundBeneficiaryByCode.benef_banks[0]
                                  .bank_branch_name ||
                                "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">IFSC Code</p>
                            <p className="text-sm font-medium text-gray-900 font-mono break-all">
                              {foundBeneficiaryByCode.benef_banks[0].ifsc ||
                                "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Payment Method
                            </p>
                            <p className="text-sm font-medium text-gray-900 break-words">
                              {foundBeneficiaryByCode.benef_banks[0]
                                .payment_method || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Currency</p>
                            <p className="text-sm font-medium text-gray-900">
                              {foundBeneficiaryByCode.benef_banks[0]
                                .currency_code || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Rails</p>
                            <p className="text-sm font-medium text-gray-900">
                              {foundBeneficiaryByCode.benef_banks[0].rails ||
                                "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

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
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  {beneficiaryBanks.length} bank account(s) available
                </p>
              )}
          </div>

          {/* Open Banking Section - Responsive */}
          {(selectedCurrency === "EUR" ||
            selectedCurrency === "GBP" ||
            selectedCurrency === "DKK") &&
          selectedBank &&
          selectedBeneficiary &&
          formData?.amount &&
          parseFloat(formData.amount) > 0 ? (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
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
                      Object.values(errors).forEach((error) =>
                        console.error(error),
                      );
                      return;
                    }

                    console.log("🎯 Initiating Open Banking remittance:", {
                      currency: selectedCurrency,
                      amount: formData.amount,
                      beneficiary: selectedBeneficiary.name,
                      bank: selectedBank.bank_name,
                    });

                    dispatch(setShowPaymentInitiation(true));
                  }}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <FaUniversity className="mr-2 flex-shrink-0" />
                  Initiate Open Banking
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start">
                  <FaInfoCircle className="text-green-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm text-green-800">
                      <strong>Open Banking</strong> allows you to securely
                      connect your bank account and initiate transfers
                      instantly. No manual bank details required.
                    </p>
                    <ul className="mt-2 text-xs text-green-700 space-y-1">
                      <li className="flex items-start gap-1">
                        <span className="flex-shrink-0">•</span>
                        <span>Instant bank account verification</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="flex-shrink-0">•</span>
                        <span>Secure connection via Plaid</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="flex-shrink-0">•</span>
                        <span>Real-time transfer initiation</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="flex-shrink-0">•</span>
                        <span>No need to enter bank details manually</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Compliance Note - Responsive */}
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
            <p className="text-xs sm:text-sm text-gray-700">
              <span className="font-semibold">Note:</span> For compliance
              purposes, we require information about the purpose of your
              transfer and source of funds. All information is kept confidential
              and secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankTransfer;
