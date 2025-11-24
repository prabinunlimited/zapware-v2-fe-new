// src/features/CardPayment/hooks/useCardPayment.js
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createAdyenSession,
  createAdyenSessionIframe,
  processPaymentResult,
  completePayment,
  resetPaymentState,
  clearErrors,
  setCheckout,
  setPaymentStatus,
  setCurrentPayment,
  setShowPaymentForm,
  // Selectors
  selectSession,
  selectSessionLoading,
  selectSessionError,
  selectPaymentProcessing,
  selectPaymentResult,
  selectPaymentError,
  selectShowPaymentForm,
  selectIsPaymentCompleted,
  selectIsPaymentFailed,
  selectCurrentPayment,
  selectCheckout
} from "../slices/cardPaymentSlice";

export const useCardPayment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Select state
  const state = useSelector((state) => ({
    session: selectSession(state),
    sessionLoading: selectSessionLoading(state),
    sessionError: selectSessionError(state),
    paymentProcessing: selectPaymentProcessing(state),
    paymentResult: selectPaymentResult(state),
    paymentError: selectPaymentError(state),
    showPaymentForm: selectShowPaymentForm(state),
    isPaymentCompleted: selectIsPaymentCompleted(state),
    isPaymentFailed: selectIsPaymentFailed(state),
    currentPayment: selectCurrentPayment(state),
    checkout: selectCheckout(state)
  }));

  // Actions
  const initializePayment = useCallback((paymentData, isIframe = false) => {
    console.log("🔄 Initializing payment:", { paymentData, isIframe });
    
    dispatch(setCurrentPayment(paymentData));
    dispatch(setShowPaymentForm(true));
    
    if (isIframe) {
      return dispatch(createAdyenSessionIframe(paymentData));
    } else {
      return dispatch(createAdyenSession(paymentData));
    }
  }, [dispatch]);

  const handlePaymentCompleted = useCallback((resultCode, paymentData) => {
    console.log("✅ Payment completed:", resultCode);
    
    dispatch(setPaymentStatus({ completed: true, failed: false }));
    
    // Process payment result
    dispatch(processPaymentResult({
      resultCode,
      paymentData,
      timestamp: new Date().toISOString()
    }));

    // Complete payment
    dispatch(completePayment({
      resultCode,
      paymentData,
      customerId: paymentData.customerId,
      amount: paymentData.amount,
      currency: paymentData.currency
    }));

    // Navigate to success page
    navigate('/paymentsuccess', { 
      state: { 
        result: resultCode,
        amount: paymentData.amount,
        currency: paymentData.currency
      } 
    });
  }, [dispatch, navigate]);

  const handlePaymentFailed = useCallback((resultCode, paymentData) => {
    console.log("❌ Payment failed:", resultCode);
    
    dispatch(setPaymentStatus({ completed: false, failed: true }));
    
    toast.error(`Payment failed: ${resultCode}`);
    
    // Navigate to error page
    navigate('/paymenterror', { 
      state: { 
        error: resultCode,
        amount: paymentData.amount,
        currency: paymentData.currency
      } 
    });
  }, [dispatch, navigate]);

  const handlePaymentError = useCallback((error, paymentData) => {
    console.error("🚨 Payment error:", error);
    
    dispatch(setPaymentStatus({ completed: false, failed: true }));
    
    toast.error("An error occurred during payment processing");
    
    navigate('/carderror', { 
      state: { 
        transaction: 'true',
        error: error.message
      } 
    });
  }, [dispatch, navigate]);

  const resetPayment = useCallback(() => {
    dispatch(resetPaymentState());
  }, [dispatch]);

  const clearPaymentErrors = useCallback(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  const setAdyenCheckout = useCallback((checkout) => {
    dispatch(setCheckout(checkout));
  }, [dispatch]);

  const closePaymentForm = useCallback(() => {
    dispatch(setShowPaymentForm(false));
  }, [dispatch]);

  return {
    // State
    ...state,
    
    // Actions
    initializePayment,
    handlePaymentCompleted,
    handlePaymentFailed,
    handlePaymentError,
    resetPayment,
    clearPaymentErrors,
    setAdyenCheckout,
    closePaymentForm,
    
    // Derived values
    hasSession: !!state.session,
    isProcessing: state.sessionLoading || state.paymentProcessing,
    hasError: !!state.sessionError || !!state.paymentError
  };
};