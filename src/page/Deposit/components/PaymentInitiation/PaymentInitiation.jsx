// src/page/Deposit/components/PaymentInitiation/PaymentInitiation.jsx
import React, { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

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
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();

  const [linkToken, setLinkToken] = useState(null);
  const [transId, setTransId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get customer ID and token - use prop if provided, otherwise from localStorage
  const customerId = propCustomerId || localStorage.getItem("authcustomer_id");
  const authToken = localStorage.getItem("authtoken");

  useEffect(() => {
    const fetchLinkToken = async () => {
      // ✅ ADDED: Comprehensive validation check at the BEGINNING
      const openBankingCurrencies = ["EUR", "GBP", "DKK"];

      if (!showPaymentInitiation) {
        console.log("❌ PaymentInitiation not shown, returning");
        return;
      }

      if (!selectedCurrency) {
        console.log("❌ No currency selected");
        toast.error("Please select a currency");
        onClose();
        return;
      }

      if (!openBankingCurrencies.includes(selectedCurrency)) {
        console.log(`❌ ${selectedCurrency} is not an Open Banking currency`);
        toast.error(`Open Banking is not available for ${selectedCurrency}`);
        onClose();
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        console.log("❌ Invalid amount");
        toast.error("Please enter a valid amount");
        onClose();
        return;
      }

      // ✅ Only proceed if ALL checks pass
      console.log(
        "✅ All checks passed, proceeding with Open Banking for:",
        selectedCurrency
      );

      setLoading(true);
      setError(null);

      try {
        console.log("🔄 Fetching Plaid Link token for Open Banking...");

        // Get bank_id from selectedBankAccount
        const bank_id = selectedBankAccount?.bank_id || "";
        
        // Get beneficiary account details
        const benef_account = selectedBeneficiary?.id || "";
        const benef_bank_account = selectedBeneficiaryBank?.id || "";

        // Complete payload
        const payload = {
          customerId: customerId,
          amount: {
            currency: selectedCurrency,
            value: parseFloat(amount),
            paymentType: "bank_transfer",
            bank_id: bank_id,
            benef_account: benef_account,
            benef_bank_account: benef_bank_account,
          },
          purpose: purpose || "remittance",
          beneficiary_name: selectedBeneficiary?.name,
          beneficiary_bank_name: selectedBeneficiaryBank?.bank_name,
        };

        console.log("📤 Request payload for /plaidtoken:", payload);

        // Use your API endpoint for Open Banking
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/plaidtoken`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              ...(authToken && { Authorization: `Bearer ${authToken}` }),
            },
          }
        );

        console.log("✅ Response received from /plaidtoken:", response.data);

        // Handle different response structures
        let link_token, transactionId;

        if (response.data?.data?.original?.link_token) {
          link_token = response.data.data.original.link_token;
          transactionId = response.data.data.original.transactionId;
        } else if (response.data?.link_token) {
          link_token = response.data.link_token;
        } else if (response.data?.data?.link_token) {
          link_token = response.data.data.link_token;
        }

        if (response.data?.data?.original?.transactionId) {
          transactionId = response.data.data.original.transactionId;
        } else if (response.data?.transactionId) {
          transactionId = response.data.transactionId;
        } else if (response.data?.data?.transactionId) {
          transactionId = response.data.data.transactionId;
        }

        if (!link_token) {
          throw new Error("No link token received from server");
        }

        setLinkToken(link_token);
        setTransId(transactionId);

        console.log("✅ Link token set:", link_token.substring(0, 20) + "...");
      } catch (error) {
        console.error("❌ Failed to get Plaid Link token:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });

        setError(error.message);

        // Show user-friendly error
        if (error.response?.status === 400) {
          toast.error("Invalid request for Open Banking");
        } else if (error.response?.status === 403) {
          toast.error("Open Banking not available for this currency");
        } else if (error.response?.status === 404) {
          toast.error("Open Banking service currently unavailable");
        } else {
          toast.error("Failed to connect to banking service");
        }

        onClose();
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
    customerId,
    authToken,
    purpose,
    selectedBankAccount,
    selectedBeneficiary,
    selectedBeneficiaryBank,
    onClose,
  ]);

  // Plaid Link configuration
  const config = {
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      console.log("✅ Plaid Link success:", { public_token, metadata });

      try {
        const dataToSend = {
          public_token,
          metadata,
          transactionId: transId,
          customerId,
          amount: parseFloat(amount),
          currency: selectedCurrency,
          purpose: purpose || "remittance",
          beneficiary: selectedBeneficiary?.id,
          beneficiary_bank: selectedBeneficiaryBank?.id,
        };

        console.log("📤 Sending Open Banking success to backend:", dataToSend);

        // Send success to backend
        await axios.post(
          `${import.meta.env.VITE_API_URL}/plaid/open-banking-success`,
          dataToSend,
          {
            headers: {
              "Content-Type": "application/json",
              ...(authToken && { Authorization: `Bearer ${authToken}` }),
            },
          }
        );

        toast.success("Open Banking payment initiated successfully!");

        // Call onSuccess callback
        if (onSuccess) {
          onSuccess({
            success: true,
            transactionId: transId,
            currency: selectedCurrency,
            amount: amount,
          });
        }

        // Navigate back
        if (customerId) {
          navigate(`/home/${customerId}`, {
            state: {
              success: true,
              message: "Open Banking payment initiated",
            },
          });
        } else {
          navigate("/home");
        }
      } catch (error) {
        console.error("❌ Failed to process Open Banking success:", error);
        toast.error("Payment initiated but confirmation failed");
        
        // Still call onSuccess but with error flag
        if (onSuccess) {
          onSuccess({
            success: false,
            error: error.message,
          });
        }
        
        if (customerId) {
          navigate(`/home/${customerId}`);
        } else {
          navigate("/home");
        }
      } finally {
        onClose();
      }
    },
    onExit: (err, metadata) => {
      console.log("🔚 Plaid Link exited:", { err, metadata });

      if (err) {
        console.error("Plaid Link error:", err);
        toast.error("Bank connection cancelled or failed");
      } else {
        console.log("User exited Plaid Link");
      }

      onClose();

      // Navigate back to dashboard
      if (customerId) {
        navigate(`/home/${customerId}`);
      } else {
        navigate("/home");
      }
    },
    onEvent: (eventName, metadata) => {
      console.log("🔔 Plaid Link event:", eventName, metadata);

      // Handle specific events
      switch (eventName) {
        case "OPEN":
          console.log("Plaid Link opened");
          break;
        case "ERROR":
          console.error("Plaid Link error:", metadata);
          toast.error("Bank connection error");
          break;
        case "HANDOFF":
          console.log("Handed off to bank app");
          break;
      }
    },
  };

  const { open, ready, error: plaidError } = usePlaidLink(config);

  // Open Plaid Link when ready
  useEffect(() => {
    if (ready && linkToken && showPaymentInitiation && !loading && !error) {
      console.log("🚀 Opening Plaid Link...");
      // Small delay to ensure everything is ready
      const timer = setTimeout(() => {
        open();
      }, 500);

      return () => clearTimeout(timer);
    }

    if (plaidError) {
      console.error("Plaid Link initialization error:", plaidError);
      toast.error("Failed to initialize bank connection");
      onClose();
    }
  }, [
    ready,
    linkToken,
    showPaymentInitiation,
    loading,
    error,
    plaidError,
    open,
  ]);

  const handleClose = () => {
    if (onClose) onClose();
    setLinkToken(null);
    setTransId(null);
    setLoading(false);
    setError(null);
  };

  // Don't render anything if not showing
  if (!showPaymentInitiation) return null;

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Connecting to Open Banking
            </h3>
            <p className="text-gray-600 text-center">
              Preparing secure connection to your bank...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-red-500 text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Connection Failed
            </h3>
            <p className="text-gray-600 text-center mb-6">{error}</p>
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
          </div>
        </div>
      </div>
    );
  }

  // Waiting for Plaid to open
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          <div className="animate-pulse">
            <span className="text-4xl">🏦</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">
            Opening Bank Connection
          </h3>
          <p className="text-gray-600 text-center">
            Please wait while we connect to your bank...
          </p>
          <button
            onClick={handleClose}
            className="mt-6 px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentInitiation;