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

// Detailed Account Card Component - MOBILE RESPONSIVE
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
      {/* Account Header - Mobile First */}
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0">
          {/* Top row: Icon + Info + Expand button on mobile */}
          <div className="flex items-start space-x-3 sm:space-x-4 flex-1 w-full">
            {/* Bank Icon - smaller on mobile */}
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${account.isPlaid === 1
                ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                : "bg-gradient-to-br from-gray-600 to-gray-800"
                }`}
            >
              <FaBuilding className="text-white text-base sm:text-xl" />
            </div>

            {/* Account Info - stacked on mobile */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-none">
                  {account.account_name ||
                    `${account.firstName} ${account.lastName}`}
                </h3>
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-full border ${status.color} flex items-center w-fit`}
                >
                  <StatusIcon className="mr-1.5" size={10} />
                  {status.text}
                </span>
              </div>

              {/* Bank Details - responsive grid */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <FaBuilding className="mr-1.5 sm:mr-2 text-gray-400 text-xs sm:text-sm" />
                  <span className="font-medium truncate max-w-[100px] sm:max-w-none">
                    {account.bank || account.provider || "Unknown Bank"}
                  </span>
                </div>

                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <FaIdCard className="mr-1.5 sm:mr-2 text-gray-400 text-xs sm:text-sm" />
                  <span className="truncate max-w-[80px] sm:max-w-none">
                    {account.accountNumberHash}
                  </span>
                </div>

                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <FaDollarSign className="mr-1.5 sm:mr-2 text-gray-400 text-xs sm:text-sm" />
                  <span>{account.account_type || "Checking"}</span>
                </div>
              </div>

              {/* Verification Badges - wrap on mobile */}
              {verificationBadges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {verificationBadges.map((badge, idx) => (
                    <span
                      key={idx}
                      className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${badge.color}`}
                    >
                      {badge.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - repositioned for mobile */}
          <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-3 mt-3 sm:mt-0 sm:ml-6">
            <button
              onClick={() =>
                setExpandedAccount(isExpanded ? null : account.account_id)
              }
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 order-2 sm:order-1"
            >
              {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
            </button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDeleteConfirm(account.account_id)}
              disabled={isDeleting}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors order-1 sm:order-2 ${isDeleting
                ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                : "bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                }`}
            >
              {isDeleting ? "Removing..." : "Remove"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Expanded Details - Mobile Responsive */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 sm:p-6 bg-gray-50">
              {/* Responsive grid - 1 column on mobile, 2 on tablet, 3 on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Account Information */}
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center text-sm sm:text-base">
                    <FaInfoCircle className="mr-2 text-blue-500 text-xs sm:text-sm" />
                    Account Information
                  </h4>
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500">Account Name</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900 break-all">
                        {account.account_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500">Account Type</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">
                        {account.account_type || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500">Account Number</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900 break-all">
                        {account.accountNumberHash || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500">Routing Number</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">
                        {account.routing_number || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center text-sm sm:text-base">
                    <FaCog className="mr-2 text-purple-500 text-xs sm:text-sm" />
                    Technical Details
                  </h4>
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500">Account ID</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900 break-all">
                        {account.account_id || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500">Provider</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">
                        {account.provider || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Features - Responsive grid */}
                <div className="space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
                  <h4 className="font-semibold text-gray-900 flex items-center text-sm sm:text-base">
                    <FaNetworkWired className="mr-2 text-indigo-500 text-xs sm:text-sm" />
                    Payment Features
                  </h4>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div
                      className={`p-2 sm:p-3 rounded-lg ${account.web_debit_verified
                        ? "bg-green-50 border border-green-200"
                        : "bg-gray-50 border border-gray-200"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          Web Debit
                        </span>
                        {account.web_debit_verified ? (
                          <FaCheckCircle className="text-green-500 text-xs sm:text-sm" />
                        ) : (
                          <FaTimesCircle className="text-gray-400 text-xs sm:text-sm" />
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Verified</p>
                    </div>

                    <div
                      className={`p-2 sm:p-3 rounded-lg ${account.fednow_credit_enabled
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 border border-gray-200"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          FedNow Credit
                        </span>
                        {account.fednow_credit_enabled ? (
                          <FaCheckCircle className="text-blue-500 text-xs sm:text-sm" />
                        ) : (
                          <FaTimesCircle className="text-gray-400 text-xs sm:text-sm" />
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Enabled</p>
                    </div>

                    <div
                      className={`p-2 sm:p-3 rounded-lg ${account.fednow_debit_enabled
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 border border-gray-200"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          FedNow Debit
                        </span>
                        {account.fednow_debit_enabled ? (
                          <FaCheckCircle className="text-blue-500 text-xs sm:text-sm" />
                        ) : (
                          <FaTimesCircle className="text-gray-400 text-xs sm:text-sm" />
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Enabled</p>
                    </div>

                    <div
                      className={`p-2 sm:p-3 rounded-lg ${account.rtp_credit_enabled
                        ? "bg-teal-50 border border-teal-200"
                        : "bg-gray-50 border border-gray-200"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          RTP Credit
                        </span>
                        {account.rtp_credit_enabled ? (
                          <FaCheckCircle className="text-teal-500 text-xs sm:text-sm" />
                        ) : (
                          <FaTimesCircle className="text-gray-400 text-xs sm:text-sm" />
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Enabled</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Overlay - Mobile Responsive */}
      <AnimatePresence>
        {showDeleteConfirm === account.account_id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border-t border-red-100 p-4 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
              <div className="flex items-start">
                <div className="mr-3 sm:mr-4 p-2 sm:p-3 bg-red-100 rounded-xl flex-shrink-0">
                  <FaExclamationTriangle className="text-red-600 text-lg sm:text-xl" />
                </div>
                <div>
                  <h4 className="font-bold text-red-800 text-base sm:text-lg">
                    Remove this account?
                  </h4>
                  <p className="text-red-600 text-sm sm:text-base mt-1">
                    This will permanently unlink the account.
                  </p>
                  <p className="text-xs sm:text-sm text-red-500 mt-2">
                    Account: {account.account_name}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    onDelete(account.account_id, account.account_name)
                  }
                  disabled={isDeleting}
                  className="flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center">
                      <FaSyncAlt className="animate-spin mr-2" />
                      Removing...
                    </span>
                  ) : (
                    "Remove"
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

// Pagination Component - Mobile Responsive
const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
    <button
      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      disabled={currentPage === 1}
      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
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
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium transition-all text-sm sm:text-base ${currentPage === pageNum
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
      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
    >
      →
    </button>

    <div className="w-full sm:w-auto text-center text-xs sm:text-sm text-gray-500 mt-2 sm:mt-0">
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

  useEffect(() => {
    if (customerId && !showPlaidLink && !isAddingAccount) {
      dispatch(setShowPlaidLink(true));
      setShowPlaidButton(false);
    }
  }, [customerId, showPlaidLink, isAddingAccount, dispatch])

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
      className="text-center py-12 sm:py-16 px-4"
    >
      <div className="max-w-2xl mx-auto">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
          {showCardPaymentMessage
            ? "Link Your Bank to Get Started"
            : "No Bank Accounts Linked"}
        </h3>

        {showCardPaymentMessage && onReturnToCard && (
          <button
            onClick={onReturnToCard}
            className="mt-6 sm:mt-8 text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center mx-auto text-base sm:text-lg"
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
      {/* Main Container - Mobile padding */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Enhanced Header - Mobile Responsive */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-0 pb-4 sm:pb-6 -mt-10 sm:-mt-12"
        >
          {/* Top Bar: Aligned with Hamburger Row */}
          <div className="flex items-center justify-end mb-2 sm:mb-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/home/${customerId}`)}
              className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-xs sm:text-sm transition-all duration-200 shadow-sm"
            >
              <span className="mr-1.5">←</span> Back to Dashboard
            </motion.button>
          </div>

          {/* Main Title Row: Bank Accounts (Left) & Refresh Icon (Right) */}
          <div className="flex items-center justify-between gap-4">
            {/* Left Side: Icon + Title + Optional Card Payment Banner */}
            <div className="flex flex-col space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-sm flex-shrink-0">
                  <FaBuilding className="text-white text-lg sm:text-2xl" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                    Bank Accounts
                  </h1>
                </div>
              </div>

              {showCardPaymentMessage && (
                <div className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 w-full sm:w-auto">
                  <FaCreditCard className="text-blue-600 mr-2 sm:mr-3 text-sm sm:text-lg flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-blue-700 block sm:inline">
                      Bank Account Required
                    </span>
                    <p className="text-[10px] sm:text-xs text-blue-600 mt-0.5 sm:mt-0">
                      Link a bank account to enable card payments
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Far Right Side: Refresh Button Only */}
            <div className="flex items-center flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshButtonDisabled}
                className="p-2.5 sm:p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh accounts"
              >
                <FaSyncAlt
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </motion.button>
            </div>
          </div>
        </motion.header>

        <main className="pb-8 sm:pb-12">
          {/* Enhanced Card Payment Banner - Mobile Responsive */}
          {showCardPaymentMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-start">
                  <div className="mr-3 sm:mr-4 p-2 sm:p-3 bg-white/20 rounded-xl flex-shrink-0">
                    <FaCreditCard className="text-white text-lg sm:text-2xl" />
                  </div>
                  <div className="text-white">
                    <h3 className="text-base sm:text-xl font-bold mb-0.5 sm:mb-1">
                      Complete Your Setup
                    </h3>
                    <p className="text-blue-100 opacity-90 text-xs sm:text-sm">
                      Link a bank account to enable secure card deposits.
                    </p>
                  </div>
                </div>
                <FaArrowRight className="text-white/80 text-xl sm:text-2xl hidden sm:block" />
              </div>
            </motion.div>
          )}

          {/* Enhanced Plaid Link Modal */}
          {showPlaidLink && (
            <ZapPlaidLink
              onSuccess={handleBankLinkSuccessCallback}
              onClose={handleClosePlaidModal}
              showButton={true}
              autoInitialize={false}
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

          {/* Enhanced Loading State - Mobile Responsive */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 sm:py-20"
            >
              <div className="relative">
                <div className="w-16 h-16 sm:w-24 sm:h-24 border-4 border-gray-200 rounded-full"></div>
                <div className="w-16 h-16 sm:w-24 sm:h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
              </div>
              <p className="mt-6 sm:mt-8 text-lg sm:text-xl font-semibold text-gray-900">
                Loading Accounts
              </p>
              <p className="text-gray-500 mt-2 sm:mt-3 text-sm sm:text-base">
                Fetching your financial information...
              </p>
              <div className="mt-4 sm:mt-6 flex items-center space-x-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-pulse delay-75"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-pulse delay-150"></div>
              </div>
            </motion.div>
          ) : (
            /* Account List Content */
            <>
              {hasAccounts ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4 sm:space-y-6"
                >
                  {/* Enhanced Success Message - Mobile Responsive */}
                  {deleteSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="mr-3 sm:mr-4 p-2 sm:p-2.5 bg-green-100 rounded-lg flex-shrink-0">
                            <FaCheck className="text-green-600 text-base sm:text-lg" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-green-800 font-semibold text-sm sm:text-base">
                              Success!
                            </p>
                            <p className="text-green-700 text-xs sm:text-sm mt-0.5 truncate">
                              {deleteSuccess}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => dispatch(clearErrors())}
                          className="text-green-500 hover:text-green-700 p-1 rounded-full hover:bg-green-50 flex-shrink-0"
                        >
                          ×
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Enhanced Error Message - Mobile Responsive */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="mr-3 sm:mr-4 p-2 sm:p-2.5 bg-red-100 rounded-lg flex-shrink-0">
                            <FaExclamationTriangle className="text-red-600 text-base sm:text-lg" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-red-800 font-semibold text-sm sm:text-base">
                              Attention Required
                            </p>
                            <p className="text-red-700 text-xs sm:text-sm mt-0.5 truncate">
                              {error}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleDismissError}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 flex-shrink-0"
                        >
                          ×
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Accounts Header - Mobile Responsive */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                        Linked Bank Accounts
                      </h2>
                      <p className="text-gray-600 mt-0.5 sm:mt-1 text-sm sm:text-base">
                        Manage your connected financial institutions
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Accounts List */}
                  <div className="space-y-4 sm:space-y-6">
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
                    <div className="pt-6 sm:pt-8">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}

                  {/* Enhanced Return to Card Payment Button - Mobile Responsive */}
                  {showCardPaymentMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center pt-6 sm:pt-10 px-4"
                    >
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleReturnToCardPayment}
                        className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 text-sm sm:text-base w-full sm:w-auto justify-center"
                      >
                        <FaCreditCard className="mr-2 sm:mr-3 text-base sm:text-lg" />
                        Return to Card Payment
                        <FaArrowRight className="ml-3 sm:ml-4 text-base sm:text-lg" />
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