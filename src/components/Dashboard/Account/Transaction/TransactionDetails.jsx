import React, { useEffect, useMemo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import ClipLoader from "react-spinners/ClipLoader";

// ✅ USE THE NEW HOOK
import { useTransactionData } from "../../../../hooks/transactionHooks";

const TransactionDetails = React.memo(
  ({ customerId, selectedCurrencyCode, onTransactionComplete }) => {
    // ✅ USE SUCCESS-BASED TRANSACTION HOOK
    const { 
      transactions, 
      loading, 
      error, 
      fetchTransactions, 
      forceRefresh,
      hasSuccessfulData 
    } = useTransactionData();

    // Local state for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [initialFetchDone, setInitialFetchDone] = useState(false);
    const [transactionCompletionNotified, setTransactionCompletionNotified] = useState(false);

    // Memoized transaction data
    const currentTransactions = useMemo(() => {
      const safeTransactions = Array.isArray(transactions) ? transactions : [];
      const indexOfLastItem = currentPage * itemsPerPage;
      const indexOfFirstItem = indexOfLastItem - itemsPerPage;
      return safeTransactions.slice(indexOfFirstItem, indexOfLastItem);
    }, [transactions, currentPage, itemsPerPage]);

    const totalPages = useMemo(
      () => Math.ceil((Array.isArray(transactions) ? transactions.length : 0) / itemsPerPage),
      [transactions.length, itemsPerPage]
    );

    // ✅ FIXED: SINGLE FETCH EFFECT WITH SUCCESS-BASED STOPPING
    useEffect(() => {
      if (!customerId || !selectedCurrencyCode || selectedCurrencyCode === "all") {
        return;
      }

      // ✅ STOP IF ALREADY HAVE SUCCESSFUL DATA
      if (hasSuccessfulData(customerId, selectedCurrencyCode)) {
        return;
      }

      // ✅ PREVENT DUPLICATE INITIAL FETCH
      if (initialFetchDone) {
        return;
      }

      setInitialFetchDone(true);
      fetchTransactions(customerId, selectedCurrencyCode);

    }, [customerId, selectedCurrencyCode, fetchTransactions, hasSuccessfulData, initialFetchDone]);

    // ✅ FIXED: Handle transaction completion WITHOUT triggering account refresh
    useEffect(() => {
      // Only notify completion once when we have transactions and not loading
      if (onTransactionComplete && 
          transactions.length > 0 && 
          !loading && 
          !transactionCompletionNotified) {
        setTransactionCompletionNotified(true);
        // Just notify completion without triggering refresh
        onTransactionComplete(false); // Pass false to indicate no refresh needed
      }
    }, [transactions, onTransactionComplete, loading, transactionCompletionNotified]);

    // Reset completion notification when currency changes
    useEffect(() => {
      setTransactionCompletionNotified(false);
    }, [selectedCurrencyCode]);

    // Memoized utility functions
    const formatDate = useCallback((dateString) => {
      try {
        return new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (error) {
        return "Invalid Date";
      }
    }, []);

    const getStatusColor = useCallback((status) => {
      if (!status) return "text-gray-600 bg-gray-100";

      const statusLower = status.toLowerCase();
      switch (statusLower) {
        case "completed":
        case "success":
        case "approved":
          return "text-green-600 bg-green-100";
        case "pending":
        case "processing":
          return "text-yellow-600 bg-yellow-100";
        case "failed":
        case "rejected":
        case "declined":
          return "text-red-600 bg-red-100";
        default:
          return "text-gray-600 bg-gray-100";
      }
    }, []);

    const getDirectionColor = useCallback((direction) => {
      if (!direction) return "text-gray-600";

      const directionLower = direction.toLowerCase();
      switch (directionLower) {
        case "in":
        case "credit":
        case "deposit":
          return "text-green-600";
        case "out":
        case "debit":
        case "withdrawal":
          return "text-red-600";
        default:
          return "text-gray-600";
      }
    }, []);

    // Pagination handlers
    const handlePreviousPage = useCallback(() => {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    }, []);

    const handleNextPage = useCallback(() => {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    }, [totalPages]);

    const handlePageClick = useCallback((pageNumber) => {
      setCurrentPage(pageNumber);
    }, []);

    // Manual refresh function
    const handleManualRefresh = useCallback(() => {
      if (!customerId || !selectedCurrencyCode) return;
      
      setInitialFetchDone(false); // Reset to allow new fetch
      setTransactionCompletionNotified(false); // Reset completion notification
      forceRefresh(customerId, selectedCurrencyCode);
    }, [customerId, selectedCurrencyCode, forceRefresh]);

    // Generate page numbers for pagination
    const pageNumbers = useMemo(() => {
      const pages = [];
      const maxVisiblePages = 5;

      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      return pages;
    }, [currentPage, totalPages]);

    if (loading) {
      return (
        <div className="flex justify-center items-center h-32">
          <div className="text-center">
            <ClipLoader color="#3B82F6" size={40} />
            <p className="text-gray-500 mt-2">Loading transactions...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 font-medium mb-2">
            Error loading transactions
          </div>
          <div className="text-red-500 text-sm mb-4">
            {error.message || "Please try again later"}
          </div>
          <button 
            onClick={handleManualRefresh}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Try Again
          </button>
        </div>
      );
    }

    const safeTransactions = Array.isArray(transactions) ? transactions : [];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Transaction History
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {safeTransactions.length} transaction
              {safeTransactions.length !== 1 ? "s" : ""} found
            </div>
            <button
              onClick={handleManualRefresh}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        {safeTransactions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-gray-400 text-6xl mb-4">💸</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No transactions found
            </h3>
            <p className="text-gray-500">
              {selectedCurrencyCode && selectedCurrencyCode !== "all"
                ? `No transactions found for ${selectedCurrencyCode} currency.`
                : "No transactions available for the selected period."}
            </p>
            <button 
              onClick={handleManualRefresh}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Check Again
            </button>
          </div>
        ) : (
          <>
            {/* Transactions Table */}
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Direction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTransactions.map((transaction, index) => (
                    <motion.tr
                      key={transaction.transaction_id || `transaction-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.transaction_datetime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {transaction.transaction_id ? (
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {transaction.transaction_id.slice(0, 8)}...
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {transaction.beneficiary_name ||
                              transaction.sender_name ||
                              "N/A"}
                          </div>
                          {transaction.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {transaction.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`font-medium ${getDirectionColor(
                            transaction.direction
                          )}`}
                        >
                          {transaction.direction || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {transaction.instructed_amount || "0"}{" "}
                            {transaction.currency_code}
                          </div>
                          {transaction.fee_amount &&
                            parseFloat(transaction.fee_amount) > 0 && (
                              <div className="text-xs text-gray-500">
                                Fee: {transaction.fee_amount}
                              </div>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {transaction.balance || "0"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status || "Unknown"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 px-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {pageNumbers.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageClick(pageNumber)}
                        className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                          currentPage === pageNumber
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>

                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    );
  }
);

TransactionDetails.propTypes = {
  customerId: PropTypes.string.isRequired,
  selectedCurrencyCode: PropTypes.string,
  onTransactionComplete: PropTypes.func,
};

TransactionDetails.defaultProps = {
  selectedCurrencyCode: "all",
  onTransactionComplete: () => {},
};

TransactionDetails.displayName = "TransactionDetails";

export default TransactionDetails;