// src/components/TransactionDetails/TransactionDetails.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import PropTypes from 'prop-types';
import ClipLoader from "react-spinners/ClipLoader";

// Redux
import {
  fetchTransactionDetails,
  selectTransactions,
  selectTransactionLoading,
  selectTransactionError,
} from "../../Account/Transaction/TransactionSlice";
import { selectBearerToken } from "../../../../features/Auth/slices/authSlice";

const TransactionDetails = ({ customerId, selectedCurrencyCode, onTransactionComplete }) => {
  const dispatch = useDispatch();

  // Redux Selectors with safety checks
  const transactions = useSelector(selectTransactions) || [];
  const transactionLoading = useSelector(selectTransactionLoading);
  const transactionError = useSelector(selectTransactionError);
  const bearertoken = useSelector(selectBearerToken);

  // Local state for pagination/filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch transactions when currency or customer changes
  useEffect(() => {
    if (customerId && selectedCurrencyCode && bearertoken) {
      dispatch(
        fetchTransactionDetails({
          customerId,
          currencyCode: selectedCurrencyCode,
          bearertoken,
        })
      );
    }
  }, [customerId, selectedCurrencyCode, bearertoken, dispatch]);

  // Handle transaction completion
  useEffect(() => {
    if (onTransactionComplete) {
      onTransactionComplete();
    }
  }, [transactions, onTransactionComplete]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "success":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getDirectionColor = (direction) => {
    switch (direction?.toLowerCase()) {
      case "in":
      case "credit":
        return "text-green-600";
      case "out":
      case "debit":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (transactionLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <ClipLoader color="#36d7b7" size={40} />
      </div>
    );
  }

  if (transactionError) {
    return (
      <div className="text-center p-4 text-red-500">
        <p>Error loading transactions: {transactionError}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full p-4"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Transaction History</h2>
        <div className="text-sm text-gray-600">
          {transactions.length} transactions found
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No transactions found for the selected currency.
        </div>
      ) : (
        <>
          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Direction
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentTransactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.transaction_id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(transaction.transaction_datetime)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                      {transaction.transaction_id || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">
                          {transaction.beneficiary_name || transaction.sender_name || "N/A"}
                        </div>
                        {transaction.description && (
                          <div className="text-xs text-gray-500">
                            {transaction.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`font-medium ${getDirectionColor(transaction.direction)}`}>
                        {transaction.direction || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">
                          {transaction.instructed_amount || "0"} {transaction.currency_code}
                        </div>
                        {transaction.fee_amount && (
                          <div className="text-xs text-gray-500">
                            Fee: {transaction.fee_amount}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {transaction.balance || "0"}
                    </td>
                    <td className="px-4 py-3 text-sm">
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
            <div className="flex justify-between items-center mt-4 px-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

TransactionDetails.propTypes = {
  customerId: PropTypes.string.isRequired,
  selectedCurrencyCode: PropTypes.string,
  onTransactionComplete: PropTypes.func,
};

export default TransactionDetails;