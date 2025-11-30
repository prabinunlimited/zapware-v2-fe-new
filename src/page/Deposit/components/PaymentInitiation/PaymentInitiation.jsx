// src/page/Deposit/components/PaymentInitiation.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePlaidLink } from "react-plaid-link";
import axios from "axios";
import { toast } from "react-toastify";
import { setShowPaymentInitiation } from "../../slices/depositSlice";
import { useNavigate } from "react-router-dom";

const PaymentInitiation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get state from Redux
  const { selectedCurrency, amount, purpose, showPaymentInitiation } = useSelector(
    (state) => state.deposit
  );

  const [linkToken, setLinkToken] = useState(null);
  const [transId, setTransId] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "https://zapware.unlimitedremit.com/api";
  const customerId = localStorage.getItem("customerId") || localStorage.getItem("authcustomer_id");
  const authToken = localStorage.getItem("authToken") || localStorage.getItem("authtoken");

  // Fetch Plaid link token
  useEffect(() => {
    const fetchLinkToken = async () => {
      if (!showPaymentInitiation || !selectedCurrency || !amount) return;

      setLoading(true);
      try {
        const response = await axios.post(
          "https://zapware.unlimitedremit.com/api/plaidtoken",
          {
            customerId: customerId,
            amount: {
              currency: selectedCurrency,
              value: parseFloat(amount),
              paymentType: null,
              bank_id: null,
              benef_account: null,
              benef_bank_account: null,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const { link_token, transactionId } = response.data.data.original;
        setLinkToken(link_token);
        setTransId(transactionId);
      } catch (error) {
        console.error("Error fetching Plaid token:", error);
        toast.error("Failed to initialize payment connection");
        handleClose();
      } finally {
        setLoading(false);
      }
    };

    fetchLinkToken();
  }, [showPaymentInitiation, selectedCurrency, amount, customerId, authToken]);

  // Plaid Link configuration
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      try {
        const dataToSend = {
          ...metadata,
          transId,
        };

        await axios.post(`${API_URL}/payment-status`, dataToSend, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        // Redirect on success
        if (customerId) {
          navigate(`/newhomepage/${customerId}`);
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        toast.error("Payment processing failed");
        handleClose();
      }
    },
    onExit: async (err, metadata) => {
      try {
        await axios.post(
          `${API_URL}/transactions/status-update`,
          {
            transactionUuid: transId,
            status: "cancelled",
            remarks: "Plaid Deposit Cancelled",
            user_type: "customer",
            user_id: customerId,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
      } catch (error) {
        console.error("Failed to cancel transaction:", error);
      }

      handleClose();
      toast.info("Payment initiation cancelled");
    },
  });

  // Open Plaid when ready
  useEffect(() => {
    if (ready && linkToken && showPaymentInitiation && !loading) {
      open();
    }
  }, [ready, linkToken, showPaymentInitiation, loading, open]);

  const handleClose = () => {
    dispatch(setShowPaymentInitiation(false));
    setLinkToken(null);
    setTransId(null);
    setLoading(false);
  };

  // Don't render anything if not active
  if (!showPaymentInitiation) {
    return null;
  }

  // Show loading state
  if (loading || !linkToken || !ready) {
    return (
      <div className="bank-loader">
        <div className="bank-icon">🏦</div>
        <div className="bank-text">
          Connecting to your bank securely via Open Banking
        </div>
        <style>{`
          .bank-loader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: #f9fafc;
            font-family: 'Segoe UI', sans-serif;
            color: #3c4a61;
            z-index: 9999;
          }
          .bank-icon {
            font-size: 64px;
            animation: spin 2s linear infinite;
          }
          .bank-text {
            margin-top: 16px;
            font-size: 18px;
            font-weight: 500;
            text-align: center;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // This component doesn't render visible content when Plaid is open
  return null;
};

export default PaymentInitiation;