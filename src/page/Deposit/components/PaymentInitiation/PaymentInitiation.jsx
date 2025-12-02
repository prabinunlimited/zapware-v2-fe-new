// src/page/Deposit/components/PaymentInitiation.jsx - DEBUG VERSION
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

  const { 
    selectedCurrency, 
    amount, 
    purpose, 
    paymentMethod,
    selectedBankAccount,
    showPaymentInitiation 
  } = useSelector((state) => state.deposit);

  const [linkToken, setLinkToken] = useState(null);
  const [transId, setTransId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Debug: Log all values
  console.log("🔍 PaymentInitiation - Current state:", {
    selectedCurrency,
    amount,
    purpose,
    paymentMethod,
    selectedBankAccount,
    showPaymentInitiation
  });

  const authcustomer_id = localStorage.getItem("customerId") || 
                         localStorage.getItem("authcustomer_id");
  const authToken = localStorage.getItem("authToken") || 
                   localStorage.getItem("authtoken");

  useEffect(() => {
    const fetchLinkToken = async () => {
      if (!showPaymentInitiation || !selectedCurrency || !amount) {
        console.log("❌ Missing required fields");
        return;
      }

      setLoading(true);
      try {
        // Create payload EXACTLY like PaymentInitiationEuropeUK
        const payload = {
          customerId: authcustomer_id,
          amount: {
            currency: selectedCurrency,
            value: amount.toString(),
            paymentType: paymentMethod || null, // Try passing paymentMethod instead of null
            bank_id: selectedBankAccount || null,
            benef_account: null,
            benef_bank_account: null
          }
        };

        console.log("📤 Sending to /plaidtoken:", JSON.stringify(payload, null, 2));

        // Try WITHOUT Authorization header first (like working component)
        const response = await axios.post(
          "https://zapware.unlimitedremit.com/api/plaidtoken",
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            }
          }
        );

        console.log("✅ Response:", response.data);

        if (response.data?.data?.original) {
          const { link_token, transactionId } = response.data.data.original;
          setLinkToken(link_token);
          setTransId(transactionId);
        } else {
          console.error("Invalid structure:", response.data);
          throw new Error("Invalid response");
        }
      } catch (error) {
        console.error("❌ Error details:", {
          message: error.message,
          response: error.response?.data,
          fullError: error.response
        });
        
        // Try to see the full Plaid error
        if (error.response?.data?.data?.original?.message) {
          const plaidError = error.response.data.data.original.message;
          console.error("🔍 Full Plaid error:", plaidError);
          
          // Check what fields Plaid says are missing
          if (plaidError.includes("MISSING_FIELDS")) {
            toast.error("Plaid requires additional fields. Check console.");
          }
        }
        
        toast.error("Payment connection failed");
        handleClose();
      } finally {
        setLoading(false);
      }
    };

    if (showPaymentInitiation) {
      fetchLinkToken();
    }
  }, [showPaymentInitiation, selectedCurrency, amount, authcustomer_id]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      try {
        const dataToSend = {
          ...metadata,
          transId,
        };

        await axios.post("https://zapware.unlimitedremit.com/api/payment-status", dataToSend);

        if (authcustomer_id) {
          navigate(`/home/${authcustomer_id}`);
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Payment status error:", error);
        toast.error("Payment processing failed");
        handleClose();
      }
    },
    onExit: async (err, metadata) => {
      console.log("Plaid exited:", err, metadata);
      handleClose();
      if (authcustomer_id) {
        navigate(`/home/${authcustomer_id}`);
      }
    },
  });

  useEffect(() => {
    if (ready && linkToken && showPaymentInitiation && !loading) {
      console.log("✅ Opening Plaid");
      open();
    }
  }, [ready, linkToken, showPaymentInitiation, loading, open]);

  const handleClose = () => {
    dispatch(setShowPaymentInitiation(false));
    setLinkToken(null);
    setTransId(null);
    setLoading(false);
  };

  if (!showPaymentInitiation) return null;

  if (loading || !linkToken || !ready) {
    return (
      <div className="bank-loader">
        <div className="bank-icon">🏦</div>
        <div className="bank-text">Connecting to bank via Open Banking</div>
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

  return null;
};

export default PaymentInitiation;