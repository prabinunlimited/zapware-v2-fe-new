// src/features/Transfer/TransferBalancePage.jsx - COMPLETE WITH UPDATES
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";

// Transfer Redux
import { fetchCustomerBankAccounts } from "./transferThunks";
import {
  clearTransferState,
  setSelectedCurrency,
  setTransferAmount,
  setSelectedCountryCode,
  setSearchQuery,
} from "./transferSlice";
import {
  selectCustomerBankAccounts,
  selectTransferLoading,
  selectTransferError,
  selectTransferSuccess,
  selectReceiverDetails,
  selectSelectedCurrency,
  selectTransferAmount,
  selectSelectedCountryCode,
  selectSearchQuery,
  selectIsFormReadyForSearch, // ✅ ADD: New selector
} from "./transferSelectors";

// Existing Redux
import { selectCountriesOptions } from "../../features/Auth/slices/countrySlice";
import { selectAuthToken } from "../../store/selectors";

// Components
import TransferForm from "./TransferForm";
import ReceiverSearchSection from "./ReceiverSearchSection";
import TransferConfirmationModal from "./TransferConfirmationModal";
import NavigationPopup from "../../components/PopupModal/NavigationPopup";

const TransferBalancePage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux Selectors
  const customerBankAccounts = useSelector(selectCustomerBankAccounts);
  const transferLoading = useSelector(selectTransferLoading);
  const transferError = useSelector(selectTransferError);
  const transferSuccess = useSelector(selectTransferSuccess);
  const receiverDetails = useSelector(selectReceiverDetails);
  const selectedCurrency = useSelector(selectSelectedCurrency);
  const transferAmount = useSelector(selectTransferAmount);
  const selectedCountryCode = useSelector(selectSelectedCountryCode);
  const searchQuery = useSelector(selectSearchQuery);
  const isFormReadyForSearch = useSelector(selectIsFormReadyForSearch); // ✅ ADD: Ready state

  // Existing selectors
  const countryOptions = useSelector(selectCountriesOptions) || [];
  const authtoken = useSelector(selectAuthToken);

  // Local state
  const [showModal, setShowModal] = useState(false);
  const [popupData, setPopupData] = useState({
    show: false,
    message: "",
    onConfirm: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get colors from localStorage
  const headerColor = localStorage.getItem("header_color");
  const textColor = localStorage.getItem("text_color");

  // Effects
  useEffect(() => {
    if (customerId && authtoken) {
      dispatch(fetchCustomerBankAccounts(customerId));
    }

    return () => {
      dispatch(clearTransferState());
    };
  }, [customerId, authtoken, dispatch]);

  useEffect(() => {
    if (transferError) {
      showPopup(transferError, () => {});
      setIsSubmitting(false);
    }
  }, [transferError]);

  useEffect(() => {
    if (transferSuccess) {
      toast.success("🎉 Transfer completed successfully!");
      setTimeout(() => navigate(-1), 1500);
    }
  }, [transferSuccess, navigate]);

  // Handlers
  const showPopup = (message, onConfirm) => {
    setPopupData({ show: true, message, onConfirm });
  };

  const handleCurrencyChange = (currency) => {
    dispatch(setSelectedCurrency(currency));
  };

  const handleAmountChange = (amount) => {
    // Allow only numbers and decimal points
    const sanitizedAmount = amount.replace(/[^0-9.]/g, '');
    dispatch(setTransferAmount(sanitizedAmount));
  };

  const handleCountryCodeChange = (countryCode) => {
    dispatch(setSelectedCountryCode(countryCode));
  };

  const handleMobileChange = (mobile) => {
    // Allow only numbers
    const sanitizedMobile = mobile.replace(/[^0-9]/g, '');
    dispatch(setSearchQuery(sanitizedMobile));
  };

  const handleReceiverFound = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleBackToDashboard = () => {
    navigate(-1);
  };

  // Style helpers
  const textColorProps = getTextColorStyle(textColor);
  const headerColorProps = getHeaderColorStyle(headerColor);

  function getTextColorStyle(color) {
    if (color && color.startsWith("text-")) {
      return { className: color };
    } else if (color && color.startsWith("#")) {
      return { style: { color } };
    }
    return {};
  }

  function getHeaderColorStyle(color) {
    if (color && color.startsWith("bg-")) {
      return { className: color };
    } else if (color && color.startsWith("#")) {
      return { style: { backgroundColor: color } };
    }
    return { className: "bg-gradient-to-r from-blue-600 to-blue-700" };
  }

  // Loading state
  if (transferLoading && customerBankAccounts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V9ZM19 9H14V4L19 9Z"/>
              </svg>
            </div>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-gray-600 font-medium"
          >
            Loading your transfer details...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* ✅ INCREASED WIDTH: Changed from max-w-2xl to max-w-4xl */}
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Transfer Funds
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
            Send money securely to friends, family, or businesses
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
        >
          {/* Card Header */}
          <div
            className={`px-6 py-4 text-white ${
              headerColorProps.className || "bg-gradient-to-r from-blue-600 to-blue-700"
            }`}
            style={headerColorProps.style}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Transfer Details</h2>
              <div className="flex items-center space-x-2 text-blue-100">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="text-sm font-medium">Secure</span>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-6">
            {/* Transfer Form Section */}
            <section className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Transfer Details</h3>
              </div>
              
              <TransferForm
                customerBankAccounts={customerBankAccounts}
                selectedCurrency={selectedCurrency}
                transferAmount={transferAmount}
                onCurrencyChange={handleCurrencyChange}
                onAmountChange={handleAmountChange}
                headerColorProps={headerColorProps}
                textColorProps={textColorProps}
              />
            </section>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Receiver Search Section */}
            <section className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">2</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Find Receiver</h3>
              </div>
              
              {/* ✅ PASS READY STATE TO COMPONENT */}
              <ReceiverSearchSection
                searchQuery={searchQuery}
                selectedCountryCode={selectedCountryCode}
                countryOptions={countryOptions}
                onMobileChange={handleMobileChange}
                onCountryCodeChange={handleCountryCodeChange}
                onReceiverFound={handleReceiverFound}
                headerColorProps={headerColorProps}
                textColorProps={textColorProps}
                isFormReady={isFormReadyForSearch}
              />
            </section>
          </div>

          {/* Card Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>256-bit SSL Encrypted</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Secure</h4>
                <p className="text-gray-600 text-xs">Bank-level security</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Fast</h4>
                <p className="text-gray-600 text-xs">Instant transfers</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Low Fees</h4>
                <p className="text-gray-600 text-xs">Competitive rates</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showModal && receiverDetails && (
          <TransferConfirmationModal
            receiverDetails={receiverDetails}
            selectedCurrency={selectedCurrency}
            transferAmount={transferAmount}
            transferLoading={transferLoading}
            onClose={closeModal}
            headerColorProps={headerColorProps}
            textColorProps={textColorProps}
          />
        )}

        {popupData.show && (
          <NavigationPopup
            message={popupData.message}
            onClose={() =>
              setPopupData({ show: false, message: "", onConfirm: null })
            }
            onConfirm={() => {
              setPopupData({ show: false, message: "", onConfirm: null });
              if (popupData.onConfirm) popupData.onConfirm();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransferBalancePage;