// src/features/BankAccounts/components/BankLink.jsx - ENHANCED VERSION
import React, { useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaCheck, FaExclamationTriangle, FaCreditCard } from "react-icons/fa";

// Redux imports
import {
  fetchBankAccounts,
  deleteBankAccount,
  handleBankLinkSuccess,
  setShowPlaidLink,
  setShowSuccessModal,
  setCurrentPage,
  setKycStatus,
  clearErrors,
  selectBankAccounts,
  selectLoading,
  selectError,
  selectShowPlaidLink,
  selectShowSuccessModal,
  selectApiResponse,
  selectDeletingAccountId,
  selectDeleteError,
  selectDeleteSuccess,
  selectKycStatus,
  selectIsRefreshing,
  selectIsAddingAccount,
  selectIsProcessing,
  selectPaginatedAccounts,
  selectTotalPages,
  selectHasAccounts,
  selectCurrentPage,
} from "../slices/bankLinkSlice";

// Import your existing UI components
import ZapPlaidLink from "../../../components/ZapPlaidLink/ZapPlaidLink";
import EmptyState from "./EmptyState";
import AccountCard from "./AccountCard";
import SuccessModal from "../../../components/PopupModal/SuccessModal";
import Pagination from "./Pagination";

const BankLink = () => {
  const dispatch = useDispatch();
  const { customerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we should auto-open Plaid link (from card payment flow)
  const shouldAutoOpenPlaid = location.state?.autoOpenBankTab;

  useEffect(() => {
    console.log("🔍 BankLink Component Mounted:", {
      customerId,
      state: location.state,
      shouldAutoOpenPlaid,
    });

    if (shouldAutoOpenPlaid) {
      console.log("🔄 Auto-opening Plaid link for card deposit");
      setTimeout(() => {
        dispatch(setShowPlaidLink(true));
      }, 500);
    }
  }, [customerId, location.state, shouldAutoOpenPlaid, dispatch]);

  // Select state from Redux
  const bankAccounts = useSelector(selectBankAccounts);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const showPlaidLink = useSelector(selectShowPlaidLink);
  const showSuccessModal = useSelector(selectShowSuccessModal);
  const apiResponse = useSelector(selectApiResponse);
  const deletingAccountId = useSelector(selectDeletingAccountId);
  const deleteError = useSelector(selectDeleteError);
  const deleteSuccess = useSelector(selectDeleteSuccess);
  const kycStatus = useSelector(selectKycStatus);
  const isRefreshing = useSelector(selectIsRefreshing);
  const isAddingAccount = useSelector(selectIsAddingAccount);
  const isProcessing = useSelector(selectIsProcessing);
  const paginatedAccounts = useSelector(selectPaginatedAccounts);
  const totalPages = useSelector(selectTotalPages);
  const hasAccounts = useSelector(selectHasAccounts);
  const currentPage = useSelector(selectCurrentPage);

  const accountsPerPage = 5;

  // Fetch bank accounts on component mount
  useEffect(() => {
    if (customerId) {
      dispatch(fetchBankAccounts(customerId));
    }
  }, [customerId, dispatch]);

  // Event handlers
  const handleRefresh = useCallback(() => {
    if (customerId && !isRefreshing) {
      dispatch(fetchBankAccounts(customerId));
    }
  }, [customerId, isRefreshing, dispatch]);

  const handleDeleteAccount = useCallback(
    (accountId, accountName) => {
      if (customerId) {
        dispatch(deleteBankAccount({ accountId, accountName, customerId }));
      }
    },
    [customerId, dispatch]
  );

  const handleBankLinkSuccessCallback = useCallback(
    (response) => {
      if (customerId) {
        dispatch(handleBankLinkSuccess({ response, customerId }));
      }
    },
    [customerId, dispatch]
  );

  const handleCloseSuccessModal = useCallback(() => {
    if (!isProcessing && !isAddingAccount) {
      dispatch(setShowSuccessModal(false));
      
      // If we came from card payment, offer to return
      if (location.state?.returnToCard) {
        const returnToCard = window.confirm(
          "Bank account linked successfully! Would you like to return to card payment?"
        );
        if (returnToCard) {
          navigate("/deposit", { state: { openCardPayment: true } });
        }
      }
    }
  }, [isProcessing, isAddingAccount, dispatch, location.state, navigate]);

  const handlePageChange = useCallback(
    (pageNumber) => {
      dispatch(setCurrentPage(pageNumber));
    },
    [dispatch]
  );

  const handleDismissError = useCallback(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  const handleDismissKyc = useCallback(() => {
    dispatch(setKycStatus(null));
  }, [dispatch]);

  const handleReturnToCardPayment = useCallback(() => {
    navigate("/deposit", { state: { openCardPayment: true } });
  }, [navigate]);

  // Memoized values
  const refreshButtonDisabled = useMemo(() => {
    return isRefreshing || loading;
  }, [isRefreshing, loading]);

  const linkButtonDisabled = useMemo(() => {
    return loading || isAddingAccount;
  }, [loading, isAddingAccount]);

  // Show special message if we came from card payment flow
  const showCardPaymentMessage = location.state?.returnToCard;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
              {showCardPaymentMessage && (
                <p className="text-sm text-blue-600 mt-1 flex items-center">
                  <FaCreditCard className="mr-1" />
                  Link a bank account to enable card deposits
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshButtonDisabled}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none rounded-full hover:bg-gray-100"
                title="Refresh accounts"
              >
                {isRefreshing ? (
                  <svg
                    className="animate-spin h-5 w-5 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => dispatch(setShowPlaidLink(true))}
                disabled={linkButtonDisabled}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  linkButtonDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="-ml-1 mr-2 h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Link Bank Account
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Card Payment Banner */}
        {showCardPaymentMessage && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <FaCreditCard className="text-blue-500 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Bank Account Required for Card Deposits
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Link a bank account below to enable secure card payments. This account will be used to process your card deposits.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plaid Link Modal */}
        {showPlaidLink && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <ZapPlaidLink
                customerId={customerId}
                onSuccess={handleBankLinkSuccessCallback}
                onClose={() => dispatch(setShowPlaidLink(false))}
                onError={(error) => {
                  dispatch(clearErrors());
                  dispatch(setShowPlaidLink(false));
                }}
              />
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && apiResponse && (
          <SuccessModal
            response={apiResponse}
            onClose={handleCloseSuccessModal}
            isProcessing={isProcessing || isAddingAccount}
          />
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg
              className="animate-spin h-12 w-12 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="mt-4 text-lg font-medium text-gray-900">
              Loading your bank accounts...
            </p>
          </div>
        ) : (
          /* Account List Content */
          <>
            {hasAccounts ? (
              <div className="space-y-4">
                {/* Success Message */}
                {deleteSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <FaCheck className="text-green-500 mr-2" />
                      <span className="text-green-800">{deleteSuccess}</span>
                    </div>
                  </div>
                )}

                {/* Accounts List */}
                <div className="space-y-4">
                  {paginatedAccounts.map((account) => (
                    <AccountCard
                      key={account.account_id}
                      account={account}
                      onDelete={() =>
                        handleDeleteAccount(
                          account.account_id,
                          account.account_name
                        )
                      }
                      isDeleting={deletingAccountId === account.account_id}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}

                {/* Return to Card Payment Button */}
                {showCardPaymentMessage && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={handleReturnToCardPayment}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <FaCreditCard className="mr-2" />
                      Return to Card Payment
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                onAction={() => dispatch(setShowPlaidLink(true))}
                disabled={loading || isAddingAccount}
                showCardPaymentMessage={showCardPaymentMessage}
                onReturnToCard={showCardPaymentMessage ? handleReturnToCardPayment : null}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default BankLink;