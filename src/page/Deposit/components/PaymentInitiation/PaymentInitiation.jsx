// src/page/Deposit/components/PaymentInitiation/PaymentInitiation.jsx - COMPLETE FIXED
import React, { useEffect, useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { RingLoader } from "react-spinners";
import {
  FaTimes,
  FaExclamationTriangle,
  FaCheck,
  FaUniversity,
} from "react-icons/fa";

const PaymentInitiation = ({
  selectedCurrency,
  amount,
  purpose,
  paymentMethod,
  selectedBankAccount,
  selectedBeneficiaryBank,
  selectedBeneficiary,
  customerId: propCustomerId,
  showPaymentInitiation,
  transactionType = "deposit",
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();

  const [linkToken, setLinkToken] = useState(null);
  const [transId, setTransId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [bankConnected, setBankConnected] = useState(false);

  // Get customer ID and token
  const customerId = propCustomerId || localStorage.getItem("authcustomer_id");
  const authToken = localStorage.getItem("authtoken");

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    if (onClose) onClose();
    setLinkToken(null);
    setTransId(null);
    setLoading(false);
    setError(null);
    setCurrentStep(1);
    setBankConnected(false);
  }, [onClose]);

  // Debug logging
  useEffect(() => {
    console.log("🔍 PaymentInitiation Debug:", {
      showPaymentInitiation,
      transactionType,
      selectedCurrency,
      amount,
      customerId,
      hasBeneficiary: !!selectedBeneficiary,
      hasBeneficiaryBank: !!selectedBeneficiaryBank,
      linkTokenExists: !!linkToken,
      loading,
      currentStep,
    });
  }, [
    showPaymentInitiation,
    transactionType,
    selectedCurrency,
    amount,
    customerId,
    selectedBeneficiary,
    selectedBeneficiaryBank,
    linkToken,
    loading,
    currentStep,
  ]);

  // Fetch link token when showPaymentInitiation becomes true
  useEffect(() => {
    const fetchLinkToken = async () => {
      if (!showPaymentInitiation) return;

      console.log(`🔄 Starting ${transactionType} flow...`);
      setLoading(true);
      setError(null);
      setCurrentStep(1);

      // Validate inputs
      if (!selectedCurrency) {
        setError("Please select a currency");
        toast.error("Please select a currency");
        setLoading(false);
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        setError("Please enter a valid amount");
        toast.error("Please enter a valid amount");
        setLoading(false);
        return;
      }

      // Additional validation for remittances
      if (transactionType === "remittance") {
        if (!selectedBeneficiary) {
          setError("Please select a beneficiary for remittance");
          toast.error("Please select a beneficiary for remittance");
          setLoading(false);
          return;
        }
        if (!selectedBeneficiaryBank) {
          setError("Please select beneficiary bank for remittance");
          toast.error("Please select beneficiary bank for remittance");
          setLoading(false);
          return;
        }
      }

      try {
        console.log("🔄 Fetching Plaid Link token...");

        // Build payload based on transaction type
        const payload = {
          customerId: customerId,
          amount: {
            currency: selectedCurrency,
            value: parseFloat(amount),
            paymentType: paymentMethod,
            bank_id: null, // Will be populated based on transaction type
            benef_account: null, // For remittances
            benef_bank_account: null, // For remittances
          },
          transaction_type: transactionType,
          purpose:
            purpose ||
            (transactionType === "deposit" ? "deposit" : "remittance"),
        };

        // ✅ Add source account ID for deposits
        if (transactionType === "deposit" && selectedBankAccount) {
          payload.amount.bank_id = selectedBankAccount.id;
        }

        // ✅ Add source account ID for deposits
        if (transactionType === "deposit" && selectedBankAccount) {
          payload.amount.bank_id = selectedBankAccount.id;
        }

        // ✅ Add beneficiary data for remittances
        if (
          transactionType === "remittance" &&
          selectedBeneficiary &&
          selectedBeneficiaryBank
        ) {
          payload.amount.benef_account = selectedBeneficiary.id;
          payload.amount.benef_bank_account = selectedBeneficiaryBank.id;
        }

        console.log("📤 Sending payload to /plaidtoken:", payload);

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/plaidtoken`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              ...(authToken && { Authorization: `Bearer ${authToken}` }),
            },
            timeout: 30000,
          }
        );

        console.log("✅ /plaidtoken response:", response.data);

        // ✅ FIXED: COMPLETELY REWRITTEN SAFE RESPONSE HANDLING
        let link_token = null;
        let transactionId = null;

        // Debug the response structure
        console.log("🔍 Response structure analysis:", {
          responseData: response.data,
          typeOfData: typeof response.data,
          isObject: response.data && typeof response.data === "object",
          isArray: Array.isArray(response.data),
          isNumber: typeof response.data === "number",
          isString: typeof response.data === "string",
        });

        // Handle different response types safely
        if (response.data) {
          const data = response.data;

          // CASE 1: Data is a string or number (error case)
          if (typeof data === "string" || typeof data === "number") {
            console.warn(
              "⚠️ Response data is primitive type:",
              typeof data,
              data
            );
            throw new Error(
              `Unexpected response type: ${typeof data}. Expected object.`
            );
          }

          // CASE 2: Data is an object
          if (typeof data === "object" && data !== null) {
            // Try to find link_token in various possible locations
            const findLinkToken = (obj, path = "") => {
              if (!obj || typeof obj !== "object") return null;

              // Direct property
              if (obj.link_token && typeof obj.link_token === "string") {
                console.log(`✅ Found link_token at ${path}link_token`);
                return obj.link_token;
              }

              // Check nested properties
              for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                  const value = obj[key];
                  if (typeof value === "object" && value !== null) {
                    const found = findLinkToken(value, `${path}${key}.`);
                    if (found) return found;
                  }
                }
              }

              return null;
            };

            // Try to find transactionId similarly
            const findTransactionId = (obj, path = "") => {
              if (!obj || typeof obj !== "object") return null;

              // Direct property (camelCase)
              if (obj.transactionId) {
                console.log(`✅ Found transactionId at ${path}transactionId`);
                return obj.transactionId;
              }

              // Direct property (snake_case)
              if (obj.transaction_id) {
                console.log(`✅ Found transaction_id at ${path}transaction_id`);
                return obj.transaction_id;
              }

              // Check nested properties
              for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                  const value = obj[key];
                  if (typeof value === "object" && value !== null) {
                    const found = findTransactionId(value, `${path}${key}.`);
                    if (found) return found;
                  }
                }
              }

              return null;
            };

            // Search for link_token recursively
            link_token = findLinkToken(data);

            // Search for transactionId recursively
            transactionId = findTransactionId(data);

            // If we found link_token but not transactionId, try common patterns
            if (link_token && !transactionId) {
              // Try common response structures
              if (data.data && typeof data.data === "object") {
                if (data.data.transactionId) {
                  transactionId = data.data.transactionId;
                } else if (data.data.transaction_id) {
                  transactionId = data.data.transaction_id;
                }
              }
            }
          }
        }

        if (!link_token) {
          // Check if there's an error message in the response
          let errorMsg = "No link token received from server";

          if (response.data && typeof response.data === "object") {
            if (response.data.message) {
              errorMsg = response.data.message;
            } else if (response.data.error) {
              errorMsg = response.data.error;
            } else if (response.data.status === "error") {
              errorMsg = "Server returned error status";
            }
          } else if (typeof response.data === "string") {
            errorMsg = `Server response: ${response.data}`;
          }

          throw new Error(errorMsg);
        }

        setLinkToken(link_token);
        setTransId(transactionId);
        setCurrentStep(2);
        console.log(
          "✅ Link token received:",
          link_token.substring(0, 20) + "..."
        );
      } catch (error) {
        console.error("❌ Failed to get Plaid Link token:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          config: error.config,
        });

        let errorMessage = "Failed to initialize bank connection";

        // Parse error message from different sources
        if (error.response?.data) {
          const errorData = error.response.data;

          // Handle different error response formats
          if (typeof errorData === "string") {
            errorMessage = errorData;
          } else if (typeof errorData === "object") {
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            } else if (errorData.details) {
              errorMessage = errorData.details;
            }
          }
        } else if (error.request) {
          errorMessage =
            "No response from server. Please check your connection.";
        } else {
          errorMessage = error.message || errorMessage;
        }

        // Clean up error message if it contains PHP error
        if (
          errorMessage.includes(
            "Trying to access array offset on value of type"
          )
        ) {
          errorMessage = "Server configuration error. Please contact support.";
        }

        setError(errorMessage);
        toast.error(errorMessage);
        setCurrentStep(3);
      } finally {
        setLoading(false);
      }
    };

    if (showPaymentInitiation) {
      fetchLinkToken();
    }
  }, [
    showPaymentInitiation,
    selectedCurrency,
    amount,
    purpose,
    transactionType,
    selectedBeneficiary,
    selectedBeneficiaryBank,
    selectedBankAccount,
    customerId,
    authToken,
  ]);

  // Plaid Link configuration
  const config = {
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      console.log("✅ Plaid Link Success:", {
        public_token: public_token.substring(0, 20) + "...",
        metadata,
        transactionId: transId,
      });

      setCurrentStep(3);
      setBankConnected(true);

      try {
        // Prepare success data for backend
        const successData = {
          public_token,
          metadata,
          transaction_id: transId,
          customerId: customerId,
          amount: {
            currency: selectedCurrency,
            value: parseFloat(amount),
            paymentType: paymentMethod,
            bank_id:
              transactionType === "deposit" && selectedBankAccount
                ? selectedBankAccount.id
                : null,
            benef_account: null, // Deposits don't have beneficiary
            benef_bank_account: null, // Deposits don't have beneficiary bank
          },
          transaction_type: transactionType,
          purpose:
            purpose ||
            (transactionType === "deposit" ? "deposit" : "remittance"),
        };

        console.log("📤 Sending success data to backend:", successData);

        // Call backend to complete the transaction
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/plaid/open-banking-success`,
          successData,
          {
            headers: {
              "Content-Type": "application/json",
              ...(authToken && { Authorization: `Bearer ${authToken}` }),
            },
          }
        );

        console.log("✅ Backend success response:", response.data);

        // Show success message
        const successMessage =
          transactionType === "deposit"
            ? "Deposit initiated successfully! Funds will be available shortly."
            : "Remittance initiated successfully! Transfer is being processed.";

        toast.success(successMessage);

        // Call onSuccess callback
        if (onSuccess) {
          onSuccess({
            success: true,
            transactionId: transId,
            transactionType,
            amount: amount,
            currency: selectedCurrency,
            message: successMessage,
            data: response.data,
          });
        }

        // Auto-close after 3 seconds
        setTimeout(() => {
          handleClose();

          // Navigate based on transaction type
          if (customerId) {
            const destination =
              transactionType === "deposit"
                ? `/dashboard/${customerId}`
                : `/remittance/success/${transId}`;

            navigate(destination, {
              state: {
                success: true,
                transactionId: transId,
                amount: amount,
                currency: selectedCurrency,
                transactionType: transactionType,
              },
            });
          }
        }, 3000);
      } catch (error) {
        console.error("❌ Failed to process transaction:", error);

        let errorMessage = "Transaction initiated but confirmation failed";
        if (error.response?.data) {
          // Handle different error response formats
          const errorData = error.response.data;
          if (typeof errorData === "string") {
            errorMessage = errorData;
          } else if (typeof errorData === "object") {
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            }
          }
        }

        // Clean up PHP errors
        if (
          errorMessage.includes(
            "Trying to access array offset on value of type"
          )
        ) {
          errorMessage = "Server configuration error. Please contact support.";
        }

        toast.error(errorMessage);

        // Still call onSuccess but with error flag
        if (onSuccess) {
          onSuccess({
            success: false,
            error: errorMessage,
            transactionType,
          });
        }

        // Navigate back with error state
        if (customerId) {
          navigate(`/dashboard/${customerId}`, {
            state: {
              error: errorMessage,
              transactionType: transactionType,
            },
          });
        }

        handleClose();
      }
    },
    onExit: (err, metadata) => {
      console.log("🔚 Plaid Link Exit:", { err, metadata });

      if (err) {
        console.error("Plaid Link error:", err);
        toast.error("Bank connection was cancelled or failed");

        if (onSuccess) {
          onSuccess({
            success: false,
            error: err.message || "Connection cancelled",
            transactionType,
          });
        }
      } else {
        console.log("User exited Plaid Link without error");
      }

      handleClose();

      // Navigate back to dashboard
      if (customerId) {
        navigate(`/dashboard/${customerId}`);
      }
    },
    onEvent: (eventName, metadata) => {
      console.log("🔔 Plaid Link Event:", eventName, metadata);

      // Handle specific events
      switch (eventName) {
        case "OPEN":
          console.log("Plaid Link opened");
          break;
        case "ERROR":
          console.error("Plaid Link error event:", metadata);
          toast.error("Error connecting to bank");
          break;
        case "HANDOFF":
          console.log("Handed off to bank app");
          break;
        case "TRANSITION_VIEW":
          console.log("View transitioned:", metadata.view_name);
          break;
      }
    },
  };

  const { open, ready, error: plaidError } = usePlaidLink(config);

  // Open Plaid Link when ready
  useEffect(() => {
    if (
      ready &&
      linkToken &&
      showPaymentInitiation &&
      currentStep === 2 &&
      !bankConnected
    ) {
      console.log("🚀 Opening Plaid Link...");
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        open();
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (plaidError) {
      console.error("Plaid Link initialization error:", plaidError);
      setError("Failed to initialize bank connection");
      toast.error("Failed to initialize bank connection");
      handleClose();
    }
  }, [
    ready,
    linkToken,
    showPaymentInitiation,
    currentStep,
    bankConnected,
    open,
    plaidError,
    handleClose,
  ]);

  // Don't render anything if not showing
  if (!showPaymentInitiation) return null;

  // Step 1: Loading - Fetching link token
  if (currentStep === 1 && loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <RingLoader
              color="#3B82F6"
              size={60}
              speedMultiplier={1}
              className="mb-6"
            />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Preparing Open Banking
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Setting up secure connection to your bank...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full animate-pulse"
                style={{ width: "30%" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Ready to connect - Link token loaded
  if (currentStep === 2 && !loading && linkToken && !error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <FaUniversity className="text-blue-600 text-3xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to Connect
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Opening secure bank connection in a moment...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: "70%" }}
              />
            </div>
            <p className="text-sm text-gray-500 text-center">
              If the connection doesn't open automatically, please check your
              pop-up blocker.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Error state
  if (error || currentStep === 3) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            {bankConnected ? (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <FaCheck className="text-green-600 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {transactionType === "deposit"
                    ? "Deposit Initiated"
                    : "Remittance Initiated"}
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  {transactionType === "deposit"
                    ? "Your deposit has been successfully initiated! Funds will be available shortly."
                    : "Your remittance has been initiated! The transfer is being processed."}
                </p>
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 w-full">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="text-sm font-semibold">
                        {amount} {selectedCurrency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-sm font-medium">
                        {transactionType === "deposit"
                          ? "Deposit"
                          : "Remittance"}
                      </span>
                    </div>
                    {transId && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Reference:
                        </span>
                        <span className="text-sm font-mono">
                          {transId.substring(0, 8)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Redirecting in a moment...
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                  <FaExclamationTriangle className="text-red-600 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Connection Failed
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  {error || "Unable to connect to banking service"}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default loading state
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          <RingLoader
            color="#3B82F6"
            size={50}
            speedMultiplier={1}
            className="mb-4"
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Initializing Open Banking
          </h3>
          <p className="text-gray-600 text-center">Please wait...</p>
          <button
            onClick={handleClose}
            className="mt-6 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Default props for safety
PaymentInitiation.defaultProps = {
  transactionType: "deposit",
  onClose: () => {},
  onSuccess: () => {},
  selectedBeneficiaryBank: null,
  selectedBeneficiary: null,
  selectedBankAccount: null,
  purpose: "",
};

export default PaymentInitiation;
