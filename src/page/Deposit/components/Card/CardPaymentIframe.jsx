// src/features/CardPayment/components/CardPaymentIframe.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Redux hooks
import { useCardPayment } from '../../hooks/useCardPayment';

export default function CardPaymentIframe() {
  const location = useLocation();
  const state = location.state;
  const [adyenLoaded, setAdyenLoaded] = useState(false);

  const {
    session,
    sessionLoading,
    sessionError,
    initializePayment,
    handlePaymentCompleted,
    handlePaymentFailed,
    handlePaymentError,
    setAdyenCheckout
  } = useCardPayment();

  // Load Adyen from CDN (same as above)
  useEffect(() => {
    const loadAdyen = async () => {
      if (window.AdyenCheckout) {
        setAdyenLoaded(true);
        return;
      }

      try {
        // Load Adyen CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://checkoutshopper-live.adyen.com/checkoutshopper/sdk/5.58.0/adyen.css';
        link.integrity = 'sha384-dkJzS6vpCxw7Hl7crS1hHclYzb8f4B++tL1AsU1AnQ/hVr35uJ1vZqDqy5X7CBiT';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);

        // Load Adyen JS
        const script = document.createElement('script');
        script.src = 'https://checkoutshopper-live.adyen.com/checkoutshopper/sdk/5.58.0/adyen.js';
        script.integrity = 'sha384-dz1P4aPx9IJddp7nzXw5Xq5X7CBiT+zP/6BGoO2KJ0J0p3+qj1tZ9X7CBiT+zP/6';
        script.crossOrigin = 'anonymous';
        script.onload = () => setAdyenLoaded(true);
        script.onerror = () => 
        document.head.appendChild(script);
      } catch (error) {
        
      }
    };

    loadAdyen();
  }, []);

  useEffect(() => {
    if (state) {
      
      initializePayment(state, true); // true for iframe
    }
  }, [state, initializePayment]);

  useEffect(() => {
    if (session && !sessionLoading && adyenLoaded && window.AdyenCheckout) {
      createAdyenCheckout(session);
    }
  }, [session, sessionLoading, adyenLoaded]);

  const createAdyenCheckout = async (sessionData) => {
    try {
      const { AdyenCheckout, Card } = window;

      const checkout = await AdyenCheckout({
        clientKey: "live_MDVSR7AQ75GT3JUGNXHL2Y7X4AN3OY6J",
        session: sessionData,
        environment: "live",
        amount: {
          value: sessionData.amount.value,
          currency: sessionData.amount.currency,
        },
        locale: "en_US",
        countryCode: sessionData.billingAddress?.country || 'US',
        showPayButton: true,
        translations: {
          "en-US": {
            "creditCard.securityCode.label": "CVV/CVC",
          },
        },
        onPaymentCompleted: (result, component) => {
          
          handlePaymentCompleted(result.resultCode, state);
        },
        onPaymentFailed: (result, component) => {
          
          handlePaymentFailed(result.resultCode, state);
        },
        onError: (error, component) => {
          
          handlePaymentError(error, state);
        },
      });

      setAdyenCheckout(checkout);

      // Mount the card component for iframe
      const card = new Card(checkout, {
        billingAddressRequired: false,
        showBrandIcon: true,
        hasHolderName: false,
        holderNameRequired: true,
        placeholders: {
          cardNumber: "1234 5678 9012 3456",
          expiryDate: "MM/YY",
          securityCodeThreeDigits: "123",
          securityCodeFourDigits: "1234",
          holderName: "J. Smith",
        },
      }).mount("#component-Card");

    } catch (error) {
      
      handlePaymentError(error, state);
    }
  };

  if (sessionLoading || !adyenLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">
            {!adyenLoaded ? 'Loading Payment System...' : 'Loading Payment...'}
          </h2>
          <p className="text-gray-600 mt-2">
            {!adyenLoaded ? 'Setting up payment environment...' : 'Setting up your payment session...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md">
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <h1 className="text-2xl font-bold text-center">Pay With Card</h1>
        </div>
        <div className="p-6">
          <div id="component-Card" className="w-full" />
        </div>
      </div>
    </div>
  );
}