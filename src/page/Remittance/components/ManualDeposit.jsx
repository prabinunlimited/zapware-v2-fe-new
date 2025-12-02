// src/features/Remittance/components/ManualDeposit.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import PropTypes from "prop-types";
import {
  FaUpload,
  FaSearch,
  FaFilePdf,
  FaFileImage,
  FaTimes,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import Redux actions and selectors
import {
  remittanceActions,
  fetchBeneficiaries,
  fetchBeneficiaryByCode,
  fetchBeneficiaryBanks,
  fetchIncomeSources,
  fetchOccupations,
  fetchTransferPurposes,
} from "../redux";

import {
  selectBeneficiaries,
  selectBeneficiaryOptions,
  selectSelectedBeneficiary,
  selectBeneficiaryId,
  selectSearchingBeneficiary,
  selectBeneficiaryBanks,
  selectBeneficiaryBankOptions,
  selectSelectedBeneficiaryBank,
  selectBeneficiaryBankId,
  selectBeneficiaryCodeData,
  selectManualDepositFormData,
  selectFileUpload,
  selectIncomeSources,
  selectOccupations,
  selectTransferPurposes,
  selectPaymentLoading,
  selectPaymentValidation,
} from "../selectors/remittanceSelectors";

const ManualDeposit = ({
  onFormDataChange,
  bankDetails,
  isLoading: externalLoading,
  customerId,
}) => {
  const dispatch = useDispatch();

  // Get state from Redux
  const beneficiaries = useSelector(selectBeneficiaries);
  const beneficiaryOptions = useSelector(selectBeneficiaryOptions);
  const selectedBeneficiary = useSelector(selectSelectedBeneficiary);
  const beneficiaryId = useSelector(selectBeneficiaryId);
  const searchingBeneficiary = useSelector(selectSearchingBeneficiary);
  const beneficiaryBanks = useSelector(selectBeneficiaryBanks);
  const beneficiaryBankOptions = useSelector(selectBeneficiaryBankOptions);
  const selectedBeneficiaryBank = useSelector(selectSelectedBeneficiaryBank);
  const beneficiaryBankId = useSelector(selectBeneficiaryBankId);
  const beneficiaryCodeData = useSelector(selectBeneficiaryCodeData);
  const manualDepositFormData = useSelector(selectManualDepositFormData);
  const fileUpload = useSelector(selectFileUpload);
  const incomeSources = useSelector(selectIncomeSources);
  const occupations = useSelector(selectOccupations);
  const transferPurposes = useSelector(selectTransferPurposes);
  const paymentLoading = useSelector(selectPaymentLoading);
  const paymentValidation = useSelector(selectPaymentValidation);

  // Local state
  const [beneficiaryCode, setBeneficiaryCode] = useState("");
  const [isBeneficiaryCodeMode, setIsBeneficiaryCodeMode] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [formData, setFormData] = useState({
    purpose: null,
    income_source: null,
    occupation: null,
    relation: null,
    payout_method: null,
    document: null,
  });

  // Static options
  const relationOptions = [
    { value: "brother", label: "Brother" },
    { value: "friend", label: "Friend" },
    { value: "mother", label: "Mother" },
    { value: "sister", label: "Sister" },
    { value: "father", label: "Father" },
    { value: "cousin", label: "Cousin" },
    { value: "other", label: "Other" },
  ];

  const payoutMethodOptions = [
    { value: "bank_deposit", label: "Bank Deposit" },
    { value: "fdr_npr", label: "Fixed Deposit (NPR)" },
    { value: "fcy_deposit", label: "FCY Deposit" },
  ];

  // Custom select styles
  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: "56px",
      borderRadius: "0.5rem",
      borderColor: "#e5e7eb",
      boxShadow: "none",
      "&:hover": { borderColor: "#9ca3af" },
    }),
    option: (base, { isSelected }) => ({
      ...base,
      backgroundColor: isSelected ? "#f3f4f6" : "white",
      color: isSelected ? "#111827" : "#4b5563",
      "&:hover": { backgroundColor: "#f3f4f6" },
      padding: "12px 16px",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "0.5rem",
      border: "1px solid #e5e7eb",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    }),
  };

  // Helper functions
  const findMatchingOption = useCallback((options, value) => {
    if (!value || !options) return null;

    // First try exact match
    const exactMatch = options.find(
      (option) =>
        String(option.value).toLowerCase() === String(value).toLowerCase() ||
        String(option.label).toLowerCase() === String(value).toLowerCase()
    );

    if (exactMatch) return exactMatch;

    // Then try partial match
    const partialMatch = options.find(
      (option) =>
        String(option.label)
          .toLowerCase()
          .includes(String(value).toLowerCase()) ||
        String(option.value).toLowerCase().includes(String(value).toLowerCase())
    );

    return partialMatch || null;
  }, []);

  const findMatchingIncomeSource = useCallback(
    (incomeSourceName) => {
      if (!incomeSourceName || !incomeSources) return null;

      // First try exact match
      const exactMatch = incomeSources.find(
        (source) => source.originalName === incomeSourceName
      );
      if (exactMatch) return exactMatch;

      // Then try case-insensitive match
      const caseInsensitiveMatch = incomeSources.find(
        (source) =>
          source.originalName.toLowerCase() === incomeSourceName.toLowerCase()
      );
      if (caseInsensitiveMatch) return caseInsensitiveMatch;

      // Then try partial match
      const partialMatch = incomeSources.find((source) =>
        source.originalName
          .toLowerCase()
          .includes(incomeSourceName.toLowerCase())
      );

      return partialMatch || null;
    },
    [incomeSources]
  );

  // Fetch initial data
  useEffect(() => {
    if (customerId) {
      dispatch(fetchBeneficiaries(customerId));
    }
    dispatch(fetchIncomeSources());
    dispatch(fetchOccupations());
    dispatch(fetchTransferPurposes());
  }, [dispatch, customerId]);

  // Fetch beneficiary banks when beneficiary is selected
  useEffect(() => {
    if (beneficiaryId) {
      dispatch(fetchBeneficiaryBanks(beneficiaryId));
    }
  }, [dispatch, beneficiaryId]);

  // Initialize form data from Redux store
  useEffect(() => {
    if (manualDepositFormData) {
      setFormData(manualDepositFormData);
    }
  }, [manualDepositFormData]);

  // Initialize file preview from Redux store
  useEffect(() => {
    if (fileUpload?.preview) {
      setFilePreview(fileUpload.preview);
    }
  }, [fileUpload]);

  // Handle beneficiary search by code
  const handleBeneficiaryCodeSearch = useCallback(() => {
    if (beneficiaryCode.trim()) {
      dispatch(fetchBeneficiaryByCode(beneficiaryCode.trim()));
      setIsBeneficiaryCodeMode(true);
    } else {
      toast.error("Please enter a beneficiary code");
    }
  }, [dispatch, beneficiaryCode]);

  // Handle beneficiary code input change
  const handleBeneficiaryCodeInputChange = useCallback((e) => {
    const value = e.target.value;
    setBeneficiaryCode(value);
    setIsBeneficiaryCodeMode(value.trim().length > 0);

    // If clearing the code field, re-enable dropdown
    if (!value.trim()) {
      setIsBeneficiaryCodeMode(false);
    }
  }, []);

  // Process beneficiary code data when received
  useEffect(() => {
    if (beneficiaryCodeData) {
      const beneficiary = beneficiaryCodeData;

      // Find matching options
      const matchedPurpose = findMatchingOption(
        transferPurposes,
        beneficiary.transfer_purpose
      );
      const matchedIncomeSource = findMatchingIncomeSource(
        beneficiary.income_source
      );

      const payoutMethodValue =
        beneficiary.payout_method || beneficiary.payment_method;
      const matchedPayoutMethod = payoutMethodValue
        ? findMatchingOption(payoutMethodOptions, payoutMethodValue)
        : null;

      const matchedRelation = relationOptions.find(
        (r) => r.value === beneficiary.relationtobenef
      );

      // Update form data
      const updatedFormData = {
        ...formData,
        purpose: matchedPurpose,
        income_source: matchedIncomeSource,
        payout_method: matchedPayoutMethod,
        occupation: beneficiary.occupation || "",
        relation: matchedRelation,
      };

      setFormData(updatedFormData);

      // Send to parent via Redux
      const completeFormData = {
        beneficiary: beneficiary,
        beneficiaryBank: beneficiary.benef_banks?.[0] || null,
        ...updatedFormData,
      };

      if (onFormDataChange) {
        onFormDataChange(completeFormData);
      }

      toast.success("Beneficiary details loaded successfully!");
    }
  }, [beneficiaryCodeData, transferPurposes, incomeSources]);

  // Handle beneficiary selection
  const handleBeneficiaryChange = useCallback(
    (selectedOption) => {
      dispatch(
        remittanceActions.payment.setSelectedBeneficiary(selectedOption)
      );
      setIsBeneficiaryCodeMode(false);

      if (selectedOption) {
        // Update form data based on selected beneficiary
        const updatedFormData = {
          ...formData,
          purpose: findMatchingOption(
            transferPurposes,
            selectedOption.transfer_purpose
          ),
          income_source: findMatchingIncomeSource(selectedOption.income_source),
          payout_method: selectedOption.payout_method
            ? findMatchingOption(
                payoutMethodOptions,
                selectedOption.payout_method
              )
            : selectedOption.payment_method
            ? findMatchingOption(
                payoutMethodOptions,
                selectedOption.payment_method
              )
            : null,
          occupation: selectedOption.occupation || "",
          relation: selectedOption.relationtobenef || "",
        };

        setFormData(updatedFormData);

        // Send to parent via Redux
        const completeFormData = {
          beneficiary: selectedOption,
          beneficiaryBank: null, // Will be set after banks load
          ...updatedFormData,
          document: formData.document,
        };

        if (onFormDataChange) {
          onFormDataChange(completeFormData);
        }
      }
    },
    [dispatch, formData, transferPurposes, incomeSources, onFormDataChange]
  );

  // Handle beneficiary bank selection
  const handleBeneficiaryBankChange = useCallback(
    (selectedOption) => {
      dispatch(
        remittanceActions.payment.setSelectedBeneficiaryBank(selectedOption)
      );

      // Update form data and send to parent
      const updatedCompleteData = {
        beneficiary: selectedBeneficiary,
        beneficiaryBank: selectedOption,
        ...formData,
      };

      if (onFormDataChange) {
        onFormDataChange(updatedCompleteData);
      }
    },
    [dispatch, selectedBeneficiary, formData, onFormDataChange]
  );

  // Handle field changes
  const handleFieldChange = useCallback(
    (fieldName, value) => {
      const updatedFormData = {
        ...formData,
        [fieldName]: value,
      };

      setFormData(updatedFormData);

      // Send complete data to parent
      const completeFormData = {
        beneficiary: selectedBeneficiary,
        beneficiaryBank: selectedBeneficiaryBank,
        ...updatedFormData,
      };

      if (onFormDataChange) {
        onFormDataChange(completeFormData);
      }

      // Update validation state
      const isValid = Boolean(
        completeFormData.purpose?.value &&
          completeFormData.income_source?.value &&
          completeFormData.beneficiary &&
          completeFormData.payout_method?.value &&
          completeFormData.beneficiaryBank &&
          completeFormData.document
      );

      dispatch(
        remittanceActions.payment.setPaymentValidation({
          formData: {
            isValid,
            message: isValid ? "" : "Please complete all fields",
          },
        })
      );
    },
    [
      dispatch,
      formData,
      selectedBeneficiary,
      selectedBeneficiaryBank,
      onFormDataChange,
    ]
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file) {
        // Update Redux store
        dispatch(remittanceActions.payment.setManualDepositFile(file));

        // Create preview for images
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = () => {
            const preview = reader.result;
            dispatch(remittanceActions.payment.setFilePreview(preview));
            setFilePreview(preview);
          };
          reader.readAsDataURL(file);
        } else {
          dispatch(remittanceActions.payment.setFilePreview(null));
          setFilePreview(null);
        }

        // Update form data
        const updatedFormData = {
          ...formData,
          document: file,
        };

        setFormData(updatedFormData);

        // Send complete data to parent
        const completeFormData = {
          beneficiary: selectedBeneficiary,
          beneficiaryBank: selectedBeneficiaryBank,
          ...updatedFormData,
        };

        if (onFormDataChange) {
          onFormDataChange(completeFormData);
        }
      }
    },
    [
      dispatch,
      formData,
      selectedBeneficiary,
      selectedBeneficiaryBank,
      onFormDataChange,
    ]
  );

  // Clear file
  const handleClearFile = useCallback(() => {
    dispatch(remittanceActions.payment.setManualDepositFile(null));
    dispatch(remittanceActions.payment.setFilePreview(null));
    setFilePreview(null);

    const updatedFormData = {
      ...formData,
      document: null,
    };

    setFormData(updatedFormData);

    // Send complete data to parent
    const completeFormData = {
      beneficiary: selectedBeneficiary,
      beneficiaryBank: selectedBeneficiaryBank,
      ...updatedFormData,
    };

    if (onFormDataChange) {
      onFormDataChange(completeFormData);
    }
  }, [
    dispatch,
    formData,
    selectedBeneficiary,
    selectedBeneficiaryBank,
    onFormDataChange,
  ]);

  // Get file icon
  const getFileIcon = (file) => {
    if (!file) return null;

    if (file.type === "application/pdf") {
      return <FaFilePdf className="w-6 h-6 text-red-500" />;
    } else if (file.type.startsWith("image/")) {
      return <FaFileImage className="w-6 h-6 text-green-500" />;
    }
    return null;
  };

  // Get file name
  const getFileName = () => {
    if (formData.document) {
      return formData.document.name;
    }
    if (fileUpload?.manualDeposit) {
      return fileUpload.manualDeposit.name;
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">
        Manual Deposit Details
      </h3>

      <div className="space-y-6">
        {/* Bank Details Section (if provided) */}
        {bankDetails?.show && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-3 text-sm">
              Bank Account Details for {bankDetails.currency}
            </h4>
            {bankDetails.loading ? (
              <div className="text-blue-600 text-sm">
                Loading bank details...
              </div>
            ) : (
              <div className="space-y-2">
                {bankDetails.details.map((detail, index) => (
                  <div key={index} className="flex items-start">
                    <span className="font-medium text-gray-700 text-sm min-w-[140px]">
                      {detail.label}:
                    </span>
                    <span className="text-gray-600 text-sm ml-2">
                      {detail.value || "Not provided"}
                      {detail.required && !detail.value && (
                        <span className="text-red-500 text-xs ml-1">
                          *Required
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-blue-600 mt-3">
              {bankDetails.instructions}
            </p>
          </div>
        )}

        {/* Beneficiary Selection */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Beneficiary
            </label>
          </div>
          <Select
            options={beneficiaryOptions}
            value={selectedBeneficiary}
            onChange={handleBeneficiaryChange}
            isLoading={paymentLoading || externalLoading}
            isDisabled={isBeneficiaryCodeMode}
            classNamePrefix="select"
            styles={selectStyles}
            placeholder={
              paymentLoading
                ? "Loading beneficiaries..."
                : isBeneficiaryCodeMode
                ? "Disabled - Using beneficiary code"
                : "Select beneficiary..."
            }
            isSearchable
            getOptionLabel={(option) => `${option.name} (${option.benef_uuid})`}
            getOptionValue={(option) => option.id}
          />
          {paymentValidation.beneficiary?.message && (
            <p className="mt-2 text-sm text-red-600">
              {paymentValidation.beneficiary.message}
            </p>
          )}
        </div>

        {/* OR Separator */}
        <div className="flex items-center">
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
              className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={searchingBeneficiary}
            />
            <button
              type="button"
              onClick={handleBeneficiaryCodeSearch}
              disabled={searchingBeneficiary || !beneficiaryCode.trim()}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center text-sm"
            >
              <FaSearch className="mr-2" />
              {searchingBeneficiary ? "Loading..." : "Search"}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
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
            value={formData.payout_method}
            onChange={(value) => handleFieldChange("payout_method", value)}
            classNamePrefix="select"
            styles={selectStyles}
            placeholder="Select payout method..."
          />
        </div>

        {/* Purpose of Transfer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purpose of Transfer
          </label>
          <Select
            options={transferPurposes}
            value={formData.purpose}
            onChange={(value) => handleFieldChange("purpose", value)}
            isLoading={paymentLoading}
            isDisabled={paymentLoading}
            classNamePrefix="select"
            styles={selectStyles}
            placeholder={
              paymentLoading ? "Loading purposes..." : "Select purpose..."
            }
          />
        </div>

        {/* Source of Income */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source of Income
          </label>
          <Select
            options={incomeSources}
            value={formData.income_source}
            onChange={(value) => handleFieldChange("income_source", value)}
            isLoading={paymentLoading}
            isDisabled={paymentLoading}
            classNamePrefix="select"
            styles={selectStyles}
            placeholder={
              paymentLoading
                ? "Loading income sources..."
                : "Select income source..."
            }
          />
        </div>

        {/* Occupation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Occupation
          </label>
          <Select
            options={occupations}
            value={
              formData.occupation
                ? {
                    value: formData.occupation,
                    label: formData.occupation,
                  }
                : null
            }
            onChange={(value) => handleFieldChange("occupation", value?.value)}
            isLoading={paymentLoading}
            isDisabled={paymentLoading}
            classNamePrefix="select"
            styles={selectStyles}
            placeholder={
              paymentLoading ? "Loading occupations..." : "Select occupation..."
            }
          />
        </div>

        {/* Relation to Beneficiary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Relation to Beneficiary
          </label>
          <Select
            options={relationOptions}
            value={formData.relation}
            onChange={(value) => handleFieldChange("relation", value)}
            classNamePrefix="select"
            styles={selectStyles}
            placeholder="Select relation..."
          />
        </div>

        {/* Beneficiary Bank */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Beneficiary Bank
          </label>
          <Select
            options={beneficiaryBankOptions}
            value={selectedBeneficiaryBank}
            onChange={handleBeneficiaryBankChange}
            isLoading={paymentLoading}
            isDisabled={paymentLoading || !beneficiaryId}
            classNamePrefix="select"
            styles={selectStyles}
            placeholder={
              paymentLoading
                ? "Loading beneficiary banks..."
                : !beneficiaryId
                ? "Please select a beneficiary first"
                : "Select beneficiary bank..."
            }
            getOptionLabel={(option) =>
              `${option.bank_name} (${
                option.account_number || option.bank_acc_no
              }) - ${option.rails}`
            }
            getOptionValue={(option) => option.id}
          />
          {paymentValidation.beneficiaryBank?.message && (
            <p className="mt-1 text-sm text-red-600">
              {paymentValidation.beneficiaryBank.message}
            </p>
          )}
        </div>

        {/* Document Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Bank Details Document
          </label>

          {getFileName() ? (
            <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
              <div className="flex items-center">
                {getFileIcon(formData.document || fileUpload?.manualDeposit)}
                <span className="ml-2 text-gray-700 text-sm">
                  {getFileName()}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearFile}
                className="text-red-500 hover:text-red-700 transition-colors duration-200"
              >
                <FaTimes />
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                <div className="flex flex-col items-center justify-center">
                  <FaUpload className="w-8 h-8 mb-2 text-gray-500" />
                  <p className="text-sm text-gray-500">
                    Click to upload document (PDF, JPG, PNG)
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  required
                />
              </label>
            </div>
          )}

          {filePreview && (
            <div className="mt-3">
              <img
                src={filePreview}
                alt="Document preview"
                className="max-h-64 w-auto mx-auto object-contain border border-gray-300 rounded"
              />
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500">
            Upload proof of bank details for manual deposit verification
          </p>
        </div>

        {/* Validation Summary */}
        {!paymentValidation.formData?.isValid &&
          paymentValidation.formData?.message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                {paymentValidation.formData.message}
              </p>
            </div>
          )}
      </div>

      {/* Form Completion Indicator */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              paymentValidation.formData?.isValid
                ? "bg-green-500"
                : "bg-yellow-500"
            }`}
          ></div>
          <span className="text-sm text-gray-600">
            {paymentValidation.formData?.isValid
              ? "All required fields are completed ✓"
              : "Please complete all required fields"}
          </span>
        </div>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        toastClassName="rounded-lg shadow-lg"
        progressClassName="bg-blue-600"
      />
    </div>
  );
};

// PropTypes for the component
ManualDeposit.propTypes = {
  /**
   * Callback function that receives form data when it changes
   * @param {Object} formData - The complete form data object
   * @param {Object} formData.beneficiary - Selected beneficiary
   * @param {Object} formData.beneficiaryBank - Selected beneficiary bank
   * @param {Object} formData.purpose - Purpose of transfer
   * @param {Object} formData.income_source - Source of income
   * @param {string} formData.occupation - Occupation
   * @param {Object} formData.relation - Relation to beneficiary
   * @param {Object} formData.payout_method - Payout method
   * @param {File} formData.document - Uploaded document file
   */
  onFormDataChange: PropTypes.func,

  /**
   * Bank details object for displaying manual deposit bank information
   */
  bankDetails: PropTypes.shape({
    /** Whether to show the bank details section */
    show: PropTypes.bool,
    /** Currency code for display */
    currency: PropTypes.string,
    /** Loading state for bank details */
    loading: PropTypes.bool,
    /** Array of bank detail items */
    details: PropTypes.arrayOf(
      PropTypes.shape({
        /** Label for the bank detail field */
        label: PropTypes.string.isRequired,
        /** Value of the bank detail field */
        value: PropTypes.string,
        /** Whether the field is required */
        required: PropTypes.bool,
        /** Icon for the field */
        icon: PropTypes.element,
      })
    ),
    /** Instructions for the user */
    instructions: PropTypes.string,
    /** Whether the currency is USD */
    isUSD: PropTypes.bool,
  }),

  /**
   * External loading state passed from parent component
   */
  isLoading: PropTypes.bool,

  /**
   * Customer ID for fetching beneficiary data
   */
  customerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

// Default props
ManualDeposit.defaultProps = {
  onFormDataChange: () => {},
  bankDetails: null,
  isLoading: false,
  customerId: null,
};

export default ManualDeposit;
