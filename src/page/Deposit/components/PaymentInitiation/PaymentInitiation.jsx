// src/page/Deposit/components/PaymentInitiation/PaymentInitiation.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
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
  const plaidLinkInitialized = useRef(false);

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
    plaidLinkInitialized.current = false;
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
      authTokenExists: !!authToken,
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
    authToken,
  ]);

  // Validate transaction data
  const validateTransaction = () => {
    if (!selectedCurrency) {
      throw new Error("Please select a currency");
    }

    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Please enter a valid amount");
    }

    if (transactionType === "remittance") {
      if (!selectedBeneficiary) {
        throw new Error("Please select a beneficiary for remittance");
      }
      if (!selectedBeneficiaryBank) {
        throw new Error("Please select beneficiary bank for remittance");
      }
    }
  };

  // Fetch link token when showPaymentInitiation becomes true
  useEffect(() => {
    const fetchLinkToken = async () => {
      if (
        !showPaymentInitiation ||
        !customerId ||
        plaidLinkInitialized.current
      ) {
        return;
      }

      console.log(`🔄 Starting ${transactionType} flow...`);
      setLoading(true);
      setError(null);
      setCurrentStep(1);

      try {
        // Validate inputs
        validateTransaction();

        console.log("🔄 Fetching Plaid Link token...");

        // Build payload based on transaction type
        const payload = {
          customerId: customerId,
          amount: {
            currency: selectedCurrency,
            value: parseFloat(amount),
            paymentType: paymentMethod || "open_banking",
            bank_id: null,
            benef_account: null,
            benef_bank_account: null,
          },
          transaction_type: transactionType,
          purpose:
            purpose ||
            (transactionType === "deposit" ? "deposit" : "remittance"),
        };

        // Add source account ID for deposits
        if (transactionType === "deposit" && selectedBankAccount) {
          payload.amount.bank_id = selectedBankAccount.id;
        }

        // Add beneficiary data for remittances
        if (
          transactionType === "remittance" &&
          selectedBeneficiary &&
          selectedBeneficiaryBank
        ) {
          payload.amount.benef_account = selectedBeneficiary.id;
          payload.amount.benef_bank_account = selectedBeneficiaryBank.id;
        }

        console.log("📤 Sending payload to /plaidtoken:", payload);

        const headers = {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        };

        const response = await axios.post(
          `${
            import.meta.env.VITE_API_URL ||
            "https://zapware.unlimitedremit.com/api"
          }/plaidtoken`,
          payload,
          {
            headers,
            timeout: 30000,
            validateStatus: function (status) {
              return status >= 200 && status < 500;
            },
          }
        );

        console.log("✅ /plaidtoken response:", {
          status: response.status,
          data: response.data,
        });

        // Handle response
        if (response.status === 200 || response.status === 201) {
          const data = response.data;

          // Extract link_token from response - FIXED FOR LARAVEL RESPONSE
          let link_token = null;
          let transactionId = null;

          // Try Laravel response structure first
          if (data.data && data.data.original) {
            link_token = data.data.original.link_token;
            transactionId = data.data.original.transactionId;
          }
          // Fallback to other structures
          else if (data.link_token) {
            link_token = data.link_token;
          } else if (data.data && data.data.link_token) {
            link_token = data.data.link_token;
          } else if (data.link) {
            link_token = data.link;
          }

          // Extract transaction ID from same location
          if (!transactionId && data.data && data.data.original) {
            transactionId = data.data.original.transactionId;
          } else if (!transactionId && data.transactionId) {
            transactionId = data.transactionId;
          } else if (!transactionId && data.transaction_id) {
            transactionId = data.transaction_id;
          }

          if (link_token) {
            setLinkToken(link_token);
            setTransId(transactionId);
            setCurrentStep(2);
            plaidLinkInitialized.current = true;
            console.log("✅ Link token received successfully:", {
              link_token: link_token.substring(0, 20) + "...",
              transactionId,
            });
          } else {
            // Log the full response for debugging
            console.error("❌ Could not find link_token in response:", data);
            throw new Error(
              "Bank connection service returned invalid response format"
            );
          }
        } else {
          // Handle error response
          let errorMsg = "Failed to initialize bank connection";

          if (typeof response.data === "string") {
            // Check if it's a PHP error
            if (
              response.data.includes("syntax error") ||
              response.data.includes("Undefined variable") ||
              response.data.includes("unexpected token")
            ) {
              errorMsg = "Server configuration error. Please contact support.";
            } else {
              errorMsg = response.data;
            }
          } else if (response.data && typeof response.data === "object") {
            errorMsg =
              response.data.message ||
              response.data.error ||
              response.data.details ||
              errorMsg;
          }

          throw new Error(errorMsg);
        }
      } catch (error) {
        console.error("❌ Failed to get Plaid Link token:", {
          name: error.name,
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status,
        });

        let errorMessage = "Failed to initialize bank connection";

        // Parse error message from different sources
        if (error.response?.data) {
          const errorData = error.response.data;

          if (typeof errorData === "string") {
            // Check for PHP syntax errors
            if (
              errorData.includes("syntax error") ||
              errorData.includes("unexpected token") ||
              errorData.includes("Undefined variable")
            ) {
              errorMessage =
                "Server configuration error. Please contact support.";
            } else {
              errorMessage = errorData.substring(0, 100); // Limit length
            }
          } else if (typeof errorData === "object") {
            errorMessage =
              errorData.message ||
              errorData.error ||
              errorData.details ||
              errorMessage;
          }
        } else if (error.request) {
          errorMessage =
            "No response from server. Please check your connection.";
        } else if (error.code === "ERR_NETWORK") {
          errorMessage =
            "Network error. Please check your internet connection.";
        } else {
          errorMessage = error.message || errorMessage;
        }

        // Clean up any HTML or PHP error messages
        errorMessage = errorMessage
          .replace(/<[^>]*>/g, "") // Remove HTML tags
          .replace(
            /Parse error:|syntax error,|unexpected token/gi,
            "Server error:"
          )
          .substring(0, 150); // Limit message length

        setError(errorMessage);
        toast.error(errorMessage);
        setCurrentStep(3);
      } finally {
        setLoading(false);
      }
    };

    if (showPaymentInitiation && customerId) {
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
    paymentMethod,
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
            paymentType: paymentMethod || "open_banking",
            bank_id:
              transactionType === "deposit" && selectedBankAccount
                ? selectedBankAccount.id
                : null,
            benef_account:
              transactionType === "remittance" && selectedBeneficiary
                ? selectedBeneficiary.id
                : null,
            benef_bank_account:
              transactionType === "remittance" && selectedBeneficiaryBank
                ? selectedBeneficiaryBank.id
                : null,
          },
          transaction_type: transactionType,
          purpose:
            purpose ||
            (transactionType === "deposit" ? "deposit" : "remittance"),
        };

        console.log("📤 Sending success data to backend:", successData);

        // Call backend to complete the transaction
        const response = await axios.post(
          `${
            import.meta.env.VITE_API_URL ||
            "https://zapware.unlimitedremit.com/api"
          }/plaid/open-banking-success`,
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
                : `/remittance/success/${transId || "success"}`;

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
          errorMessage.includes("syntax error") ||
          errorMessage.includes("unexpected token") ||
          errorMessage.includes("Undefined variable")
        ) {
          errorMessage = "Server configuration error. Please contact support.";
        }

        toast.error(errorMessage.substring(0, 100));

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
        const errorMsg =
          err.display_message || err.error_message || "Bank connection failed";
        toast.error(errorMsg);

        if (onSuccess) {
          onSuccess({
            success: false,
            error: errorMsg,
            transactionType,
          });
        }
      } else if (metadata && metadata.status === "requires_credentials") {
        console.log("User needs to re-enter credentials");
        toast.info("Please re-enter your banking credentials");
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
        case "SUCCESS":
          console.log("Bank connection successful");
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
      !bankConnected &&
      !plaidError
    ) {
      console.log("🚀 Opening Plaid Link...");
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        try {
          open();
        } catch (openError) {
          console.error("Failed to open Plaid Link:", openError);
          setError("Failed to open bank connection");
          toast.error("Failed to open bank connection");
          handleClose();
        }
      }, 500);

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
  paymentMethod: "open_banking",
};

export default PaymentInitiation;
