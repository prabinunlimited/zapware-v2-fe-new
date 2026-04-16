// src/features/BankAccounts/components/BankLink.jsx - DETAILED FINANCIAL UI
import React, { useEffect, useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import {
  FaCheck,
  FaExclamationTriangle,
  FaCreditCard,
  FaBuilding,
  FaShieldAlt,
  FaSyncAlt,
  FaPlus,
  FaLock,
  FaArrowRight,
  FaInfoCircle,
  FaUnlink,
  FaLink,
  FaCalendar,
  FaDollarSign,
  FaGlobeAmericas,
  FaUser,
  FaIdCard,
  FaNetworkWired,
  FaCreditCard as FaCard,
  FaSnowflake,
  FaBan,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaCog,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

// Redux imports
import {
  fetchBankAccounts,
  deleteBankAccount,
  handleBankLinkSuccess,
  refreshAccountsAfterSuccess,
  setShowPlaidLink,
  setShowSuccessModal,
  setIsProcessing,
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
import SuccessModal from "../../../components/PopupModal/SuccessModal";

// ========== HELPER COMPONENTS ==========

// Helper function to get status badge
const getStatusBadge = (account) => {
  if (account.is_frozen === 1) {
    return {
      text: "Frozen",
      color: "bg-red-100 text-red-800 border-red-200",
      icon: FaSnowflake,
    };
  }
  if (account.is_deleted === 1) {
    return {
      text: "Deleted",
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: FaBan,
    };
  }
  if (account.isLinkedOnSila === 1) {
    return {
      text: "Linked to SILA",
      color: "bg-green-100 text-green-800 border-green-200",
      icon: FaLink,
    };
  }
  return {
    text: "Active",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: FaCheckCircle,
  };
};

// Helper function to get verification badges
const getVerificationBadges = (account) => {
  const badges = [];

  if (account.web_debit_verified) {
    badges.push({
      text: "Web Debit",
      color: "bg-purple-100 text-purple-800",
      icon: FaCheckCircle,
    });
  }

  if (account.fednow_credit_enabled) {
    badges.push({
      text: "FedNow Credit",
      color: "bg-indigo-100 text-indigo-800",
      icon: FaNetworkWired,
    });
  }

  if (account.rtp_credit_enabled) {
    badges.push({
      text: "RTP Credit",
      color: "bg-teal-100 text-teal-800",
      icon: FaNetworkWired,
    });
  }

  if (account.isPlaid === 1) {
    badges.push({
      text: "Plaid Linked",
      color: "bg-orange-100 text-orange-800",
      icon: FaShieldAlt,
    });
  }

  return badges;
};

// Detailed Account Card Component
const DetailedAccountCard = ({
  account,
  onDelete,
  isDeleting,
  expandedAccount,
  setExpandedAccount,
  showDeleteConfirm,
  setShowDeleteConfirm,
}) => {
  const isExpanded = expandedAccount === account.account_id;
  const status = getStatusBadge(account);
  const verificationBadges = getVerificationBadges(account);
  const StatusIcon = status.icon;

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden"
    >
      {/* Account Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {/* Bank Icon */}
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                account.isPlaid === 1
                  ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                  : "bg-gradient-to-br from-gray-600 to-gray-800"
              }`}
            >
              <FaBuilding className="text-white text-xl" />
            </div>

            {/* Account Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {account.account_name ||
                      `${account.firstName} ${account.lastName}`}
                  </h3>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full border ${status.color} flex items-center`}
                  >
                    <StatusIcon className="mr-1.5" size={10} />
                    {status.text}
                  </span>
                </div>

                <button
                  onClick={() =>
                    setExpandedAccount(isExpanded ? null : account.account_id)
                  }
                  className="ml-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>

              {/* Bank Details */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="flex items-center text-sm text-gray-600">
                  <FaBuilding className="mr-2 text-gray-400" />
                  <span className="font-medium">
                    {account.bank || account.provider || "Unknown Bank"}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <FaIdCard className="mr-2 text-gray-400" />
                  <span>Account: {account.accountNumberHash}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <FaDollarSign className="mr-2 text-gray-400" />
                  <span>{account.account_type || "Checking"}</span>
                </div>

                {account.routing_number && (
                  <div className="flex items-center text-sm text-gray-600">
                    <FaNetworkWired className="mr-2 text-gray-400" />
                    <span>Routing: •••{account.routing_number.slice(-4)}</span>
                  </div>
                )}
              </div>

              {/* Verification Badges */}
              {verificationBadges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {verificationBadges.map((badge, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}
                    >
                      {badge.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-end space-y-3 ml-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDeleteConfirm(account.account_id)}
              disabled={isDeleting}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDeleting
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : "bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
              }`}
            >
              {isDeleting ? "Removing..." : "Remove Account"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100"
          >
            <div className="p-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Account Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <FaInfoCircle className="mr-2 text-blue-500" />
                    Account Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Account Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {account.account_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Account Type</p>
                      <p className="text-sm font-medium text-gray-900">
                        {account.account_type || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Account Number</p>
                      <p className="text-sm font-medium text-gray-900">
                        {account.accountNumberHash || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Routing Number</p>
                      <p className="text-sm font-medium text-gray-900">
                        {account.routing_number || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <FaCog className="mr-2 text-purple-500" />
                    Technical Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Account ID</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {account.account_id || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Provider</p>
                      <p className="text-sm font-medium text-gray-900">
                        {account.provider || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Features */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <FaNetworkWired className="mr-2 text-indigo-500" />
                    Payment Features
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`p-3 rounded-lg ${
                        account.web_debit_verified
                          ? "bg-green-50 border border-green-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          Web Debit
                        </span>
                        {account.web_debit_verified ? (
                          <FaCheckCircle className="text-green-500" />
                        ) : (
                          <FaTimesCircle className="text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Verified</p>
                    </div>

                    <div
                      className={`p-3 rounded-lg ${
                        account.fednow_credit_enabled
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          FedNow Credit
                        </span>
                        {account.fednow_credit_enabled ? (
                          <FaCheckCircle className="text-blue-500" />
                        ) : (
                          <FaTimesCircle className="text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Enabled</p>
                    </div>

                    <div
                      className={`p-3 rounded-lg ${
                        account.fednow_debit_enabled
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          FedNow Debit
                        </span>
                        {account.fednow_debit_enabled ? (
                          <FaCheckCircle className="text-blue-500" />
                        ) : (
                          <FaTimesCircle className="text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Enabled</p>
                    </div>

                    <div
                      className={`p-3 rounded-lg ${
                        account.rtp_credit_enabled
                          ? "bg-teal-50 border border-teal-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          RTP Credit
                        </span>
                        {account.rtp_credit_enabled ? (
                          <FaCheckCircle className="text-teal-500" />
                        ) : (
                          <FaTimesCircle className="text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Enabled</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {showDeleteConfirm === account.account_id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border-t border-red-100 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start">
                <div className="mr-4 p-3 bg-red-100 rounded-xl">
                  <FaExclamationTriangle className="text-red-600 text-xl" />
                </div>
                <div>
                  <h4 className="font-bold text-red-800 text-lg">
                    Remove this account?
                  </h4>
                  <p className="text-red-600 mt-1">
                    This will permanently unlink the account from our system.
                    All payment methods using this account will be disabled.
                  </p>
                  <p className="text-sm text-red-500 mt-2">
                    Account: {account.account_name} • Bank:{" "}
                    {account.bank || account.provider}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    onDelete(account.account_id, account.account_name)
                  }
                  disabled={isDeleting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <span className="flex items-center">
                      <FaSyncAlt className="animate-spin mr-2" />
                      Removing...
                    </span>
                  ) : (
                    "Remove Account"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex items-center justify-center space-x-2 mt-8">
    <button
      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      disabled={currentPage === 1}
      className="w-10 h-10 rounded-lg font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
    >
      ←
    </button>

    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
      let pageNum;
      if (totalPages <= 5) {
        pageNum = i + 1;
      } else if (currentPage <= 3) {
        pageNum = i + 1;
      } else if (currentPage >= totalPages - 2) {
        pageNum = totalPages - 4 + i;
      } else {
        pageNum = currentPage - 2 + i;
      }

      return (
        <button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          className={`w-10 h-10 rounded-lg font-medium transition-all ${
            currentPage === pageNum
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {pageNum}
        </button>
      );
    })}

    <button
      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      disabled={currentPage === totalPages}
      className="w-10 h-10 rounded-lg font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
    >
      →
    </button>

    <div className="ml-4 text-sm text-gray-500">
      Page {currentPage} of {totalPages}
    </div>
  </div>
);

// ========== MAIN BANKLINK COMPONENT ==========
const BankLink = () => {
  const dispatch = useDispatch();
  const { customerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedAccount, setExpandedAccount] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showPlaidButton, setShowPlaidButton] = useState(true);

  // Check if we should auto-open Plaid link (from card payment flow)
  const shouldAutoOpenPlaid = location.state?.autoOpenBankTab;

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

  // ========== ALL FUNCTIONS MOVED HERE (ABOVE EMPTY STATE) ==========

  // Auto-open Plaid effect
  useEffect(() => {
    if (shouldAutoOpenPlaid) {
      setTimeout(() => {
        dispatch(setShowPlaidLink(true));
      }, 500);
    }
  }, [customerId, location.state, shouldAutoOpenPlaid, dispatch]);

  // Debug effect
  useEffect(() => {
    console.log("🔍 Debug - SuccessModal conditions:", {
      showSuccessModal,
      apiResponseExists: !!apiResponse,
      apiResponse,
      hasSuccessAccounts: apiResponse?.success_accounts?.length > 0,
      hasFailedAccounts: apiResponse?.failed_accounts?.length > 0,
    });
  }, [showSuccessModal, apiResponse]);

  // Debug render log
  console.log("🔄 Rendering BankLink - Modal should show?", {
    showSuccessModal,
    apiResponse,
    hasAccounts,
  });

  // Fetch bank accounts on component mount
  useEffect(() => {
    if (customerId) {
      dispatch(fetchBankAccounts(customerId));
    }
  }, [customerId, dispatch]);

  // Event handlers - ALL DEFINED BEFORE EMPTY STATE
  const handleRefresh = useCallback(() => {
    if (customerId && !isRefreshing) {
      dispatch(fetchBankAccounts(customerId));
    }
  }, [customerId, isRefreshing, dispatch]);

  const handleDeleteAccount = useCallback(
    (accountId, accountName) => {
      if (customerId) {
        dispatch(deleteBankAccount({ accountId, accountName, customerId }));
        setShowDeleteConfirm(null);
      }
    },
    [customerId, dispatch],
  );

  const handleBankLinkSuccessCallback = useCallback(
    (response) => {
      console.log("🎯 Bank linking response received:", response);

      if (customerId) {
        // Set the API response in Redux
        dispatch({
          type: "bankLink/setApiResponse",
          payload: response,
        });

        // Show the success modal
        dispatch(setShowSuccessModal(true));

        // Close the Plaid modal
        dispatch(setShowPlaidLink(false));

        // Refresh accounts if any succeeded
        if (response.success_accounts?.length > 0) {
          dispatch(fetchBankAccounts(customerId));
        }
      }
    },
    [customerId, dispatch],
  );

  const handleCloseSuccessModal = useCallback(() => {
    if (!isProcessing && !isAddingAccount) {
      dispatch(setShowSuccessModal(false));

      // If we came from card payment, offer to return
      if (location.state?.returnToCard) {
        const returnToCard = window.confirm(
          "Bank account linked successfully! Would you like to return to card payment?",
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
    [dispatch],
  );

  const handleDismissError = useCallback(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  const handleReturnToCardPayment = useCallback(() => {
    navigate("/deposit", { state: { openCardPayment: true } });
  }, [navigate]);

  const handleLinkNewAccount = useCallback(() => {
    // Smooth scroll to top of the page
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Hide the parent button
    setShowPlaidButton(false);
    // Show the Plaid modal
    dispatch(setShowPlaidLink(true));
  }, [dispatch]);

  const handleClosePlaidModal = useCallback(() => {
    // Hide the Plaid modal
    dispatch(setShowPlaidLink(false));
    // Show the parent button again after closing
    setShowPlaidButton(true);
  }, [dispatch]);

  const handleContinueSuccessModal = useCallback(() => {
    if (customerId) {
      // Use the new thunk to refresh accounts
      dispatch(refreshAccountsAfterSuccess(customerId))
        .then(() => {
          // Close the modal after accounts are refreshed
          dispatch(setShowSuccessModal(false));
        })
        .catch(() => {
          dispatch(setShowSuccessModal(false));
        });
    }
  }, [customerId, dispatch]);

  // Memoized values
  const refreshButtonDisabled = useMemo(() => {
    return isRefreshing || loading;
  }, [isRefreshing, loading]);

  const linkButtonDisabled = useMemo(() => {
    return loading || isAddingAccount;
  }, [loading, isAddingAccount]);

  // Show special message if we came from card payment flow
  const showCardPaymentMessage = location.state?.returnToCard;

  // Account Summary Stats
  const accountStats = useMemo(() => {
    const stats = {
      total: bankAccounts.length,
      linkedToSila: bankAccounts.filter((acc) => acc.isLinkedOnSila === 1)
        .length,
      plaidLinked: bankAccounts.filter((acc) => acc.isPlaid === 1).length,
      active: bankAccounts.filter(
        (acc) => acc.is_frozen === 0 && acc.is_deleted === 0,
      ).length,
      frozen: bankAccounts.filter((acc) => acc.is_frozen === 1).length,
      webDebitVerified: bankAccounts.filter((acc) => acc.web_debit_verified)
        .length,
    };
    return stats;
  }, [bankAccounts]);

  // ========== EMPTY STATE COMPONENT (NOW HAS ACCESS TO ALL FUNCTIONS) ==========
  const EmptyState = ({
    onAction,
    disabled,
    showCardPaymentMessage,
    onReturnToCard,
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 px-4"
    >
      <div className="max-w-2xl mx-auto">
        <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <FaBuilding className="text-gray-400 text-5xl" />
        </div>

        <h3 className="text-3xl font-bold text-gray-900 mb-4">
          {showCardPaymentMessage
            ? "Link Your Bank to Get Started"
            : "No Bank Accounts Linked"}
        </h3>

        <p className="text-gray-600 text-lg mb-10 max-w-md mx-auto">
          {showCardPaymentMessage
            ? "Link a bank account to enable instant deposits, withdrawals, and card payments with enterprise-grade security."
            : "Connect your bank account to access all financial features including instant transfers, bill payments, and investment options."}
        </p>

        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200 mb-8">
          <h4 className="font-semibold text-gray-900 mb-6 text-lg flex items-center justify-center">
            <FaLock className="mr-3 text-green-500" />
            Enterprise Security Features
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FaShieldAlt className="text-blue-600 text-xl" />
              </div>
              <p className="font-medium text-gray-900">256-bit Encryption</p>
              <p className="text-sm text-gray-600 mt-1">Bank-level security</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FaUser className="text-green-600 text-xl" />
              </div>
              <p className="font-medium text-gray-900">Read-Only Access</p>
              <p className="text-sm text-gray-600 mt-1">
                Never store credentials
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FaCheckCircle className="text-purple-600 text-xl" />
              </div>
              <p className="font-medium text-gray-900">FDIC Insured</p>
              <p className="text-sm text-gray-600 mt-1">Up to $250,000</p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          disabled={disabled}
          className={`w-full max-w-sm py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
            disabled
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
          }`}
        >
          <FaPlus className="inline mr-3" />
          Link Your First Bank Account
        </motion.button>

        {showCardPaymentMessage && onReturnToCard && (
          <button
            onClick={onReturnToCard}
            className="mt-8 text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center mx-auto text-lg"
          >
            Return to Card Payment
            <FaArrowRight className="ml-3" />
          </button>
        )}
      </div>
    </motion.div>
  );

  // ========== MAIN RENDER ==========
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-25 to-gray-50">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-8 pb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-sm">
                  <FaBuilding className="text-white text-2xl" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Bank Accounts Management
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage your linked financial accounts and payment methods
                  </p>
                </div>
              </div>

              {showCardPaymentMessage && (
                <div className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <FaCreditCard className="text-blue-600 mr-3 text-lg" />
                  <div>
                    <span className="text-sm font-semibold text-blue-700">
                      Bank Account Required for Card Deposits
                    </span>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Link a bank account to enable secure card payments
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshButtonDisabled}
                className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh accounts"
              >
                <FaSyncAlt
                  className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </motion.button>

              {showPlaidButton && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLinkNewAccount}
                  disabled={linkButtonDisabled}
                  className={`inline-flex items-center px-6 py-3.5 rounded-xl font-semibold shadow-sm transition-all duration-200 ${
                    linkButtonDisabled
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md hover:shadow-blue-500/25"
                  }`}
                >
                  <FaPlus className="mr-2.5" />
                  Link New Account
                </motion.button>
              )}
            </div>
          </div>
        </motion.header>

        <main className="pb-12">
          {/* Enhanced Card Payment Banner */}
          {showCardPaymentMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start">
                  <div className="mr-4 p-3 bg-white/20 rounded-xl">
                    <FaCreditCard className="text-white text-2xl" />
                  </div>
                  <div className="text-white">
                    <h3 className="text-xl font-bold mb-1">
                      Complete Your Setup for Card Payments
                    </h3>
                    <p className="text-blue-100 opacity-90">
                      Link a bank account to enable secure card deposits and
                      instant transfers. Your account will be encrypted with
                      bank-level security.
                    </p>
                  </div>
                </div>
                <FaArrowRight className="text-white/80 text-2xl hidden md:block" />
              </div>
            </motion.div>
          )}

          {/* Enhanced Plaid Link Modal */}
          {showPlaidLink && (
            <ZapPlaidLink
              onSuccess={handleBankLinkSuccessCallback}
              onClose={handleClosePlaidModal}
              showButton={!showPlaidButton}
            />
          )}

          {/* Enhanced Success Modal */}
          {showSuccessModal && apiResponse && (
            <SuccessModal
              response={apiResponse}
              onClose={() => {
                // Just close the modal without refreshing
                dispatch(setShowSuccessModal(false));
              }}
              onContinue={handleContinueSuccessModal}
              isProcessing={isProcessing}
            />
          )}

          {/* Enhanced Loading State */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative">
                <div className="w-24 h-24 border-4 border-gray-200 rounded-full"></div>
                <div className="w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
              </div>
              <p className="mt-8 text-xl font-semibold text-gray-900">
                Loading Bank Account Details
              </p>
              <p className="text-gray-500 mt-3">
                Fetching your financial information securely...
              </p>
              <div className="mt-6 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-150"></div>
              </div>
            </motion.div>
          ) : (
            /* Account List Content */
            <>
              {hasAccounts ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Enhanced Success Message */}
                  {deleteSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-4 p-2.5 bg-green-100 rounded-lg">
                            <FaCheck className="text-green-600 text-lg" />
                          </div>
                          <div>
                            <p className="text-green-800 font-semibold">
                              Success!
                            </p>
                            <p className="text-green-700 text-sm mt-0.5">
                              {deleteSuccess}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => dispatch(clearErrors())}
                          className="text-green-500 hover:text-green-700 p-1 rounded-full hover:bg-green-50"
                        >
                          ×
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Enhanced Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-4 p-2.5 bg-red-100 rounded-lg">
                            <FaExclamationTriangle className="text-red-600 text-lg" />
                          </div>
                          <div>
                            <p className="text-red-800 font-semibold">
                              Attention Required
                            </p>
                            <p className="text-red-700 text-sm mt-0.5">
                              {error}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleDismissError}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                        >
                          ×
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Accounts Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Linked Bank Accounts
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Manage your connected financial institutions and payment
                        methods
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Accounts List */}
                  <div className="space-y-6">
                    {paginatedAccounts.map((account, index) => (
                      <DetailedAccountCard
                        key={account.account_id}
                        account={account}
                        onDelete={handleDeleteAccount}
                        isDeleting={deletingAccountId === account.account_id}
                        expandedAccount={expandedAccount}
                        setExpandedAccount={setExpandedAccount}
                        showDeleteConfirm={showDeleteConfirm}
                        setShowDeleteConfirm={setShowDeleteConfirm}
                      />
                    ))}
                  </div>

                  {/* Enhanced Pagination */}
                  {totalPages > 1 && (
                    <div className="pt-8">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}

                  {/* Enhanced Return to Card Payment Button */}
                  {showCardPaymentMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center pt-10"
                    >
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleReturnToCardPayment}
                        className="inline-flex items-center px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
                      >
                        <FaCreditCard className="mr-3 text-lg" />
                        Return to Card Payment
                        <FaArrowRight className="ml-4 text-lg" />
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <EmptyState
                  onAction={handleLinkNewAccount}
                  disabled={loading || isAddingAccount}
                  showCardPaymentMessage={showCardPaymentMessage}
                  onReturnToCard={
                    showCardPaymentMessage ? handleReturnToCardPayment : null
                  }
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default BankLink;
