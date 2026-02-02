import React, { useEffect, useCallback, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { FaFilePdf, FaFileExcel, FaSearch, FaFilter } from "react-icons/fa";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";

// Import Redux actions and selectors
import {
  fetchTransactions,
  fetchBeneficiaryName,
  fetchHeaderColor,
  setFilterDirection,
  setFilterStartDate,
  setFilterEndDate,
  setMobileState,
  selectTransactions,
  selectBeneficiaryName,
  selectHeaderColor,
  selectFilters,
  selectLoading,
  selectLoadingBeneficiaryName,
  selectLoadingHeaderColor,
  selectError,
  selectErrorBeneficiaryName,
  selectErrorHeaderColor,
  selectIsMobile,
  selectFilteredTransactions,
  selectHasTransactions,
} from "../../RequestRemit/Transactions/BeneficiaryTransactionSlice";

// Use Vite environment variable
const API_URL =
  import.meta.env.VITE_API_URL || "https://zapware.unlimitedremit.com/api";

// Helper function to get auth token
const getAuthToken = () => {
  const authtoken =
    localStorage.getItem("authtoken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("bearerToken") ||
    sessionStorage.getItem("authtoken") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("bearerToken");

  return authtoken;
};

const BeneficiaryTransactions = ({
  customerId: propCustomerId,
  selectedCurrencyCode,
  onTransactionComplete,
  onLoadingStart,
  onLoadingEnd,
  textColor,
}) => {
  const { beneficiaryId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // DEBUG: Add this to verify
  useEffect(() => {
    console.log("✅ DEBUG: beneficiaryId from URL:", beneficiaryId);
    console.log("✅ Full URL:", window.location.href);
  }, [beneficiaryId]);

  // Select data from Redux store
  const transactions = useSelector(selectTransactions);
  const beneficiaryName = useSelector(selectBeneficiaryName);
  const headerColor = useSelector(selectHeaderColor);
  const filters = useSelector(selectFilters);
  const loading = useSelector(selectLoading);
  const loadingBeneficiaryName = useSelector(selectLoadingBeneficiaryName);
  const loadingHeaderColor = useSelector(selectLoadingHeaderColor);
  const error = useSelector(selectError);
  const errorBeneficiaryName = useSelector(selectErrorBeneficiaryName);
  const errorHeaderColor = useSelector(selectErrorHeaderColor);
  const isMobile = useSelector(selectIsMobile);
  const filteredTransactions = useSelector(selectFilteredTransactions);
  const hasTransactions = useSelector(selectHasTransactions);

  const customerId = propCustomerId || localStorage.getItem("customerid");
  const headerColorCache = useRef(null);

  const getTextColorStyle = () => {
    if (textColor && textColor.startsWith("text-")) {
      return { className: textColor };
    } else if (textColor && textColor.startsWith("#")) {
      return { style: { color: textColor } };
    }
    return {};
  };

  const textColorProps = getTextColorStyle();

  // Memoized navigation functions
  const handleViewMoreDetails = useCallback(() => {
    navigate(`/fulltransaction/${beneficiaryId}`);
  }, [navigate, beneficiaryId]);

  const handleViewMonthlyStatement = useCallback(() => {
    navigate(`/monthlytransaction/${beneficiaryId}`);
  }, [navigate, beneficiaryId]);

  // Memoized format function
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  }, []);

  // Fetch header color - only once on mount
  useEffect(() => {
    const fetchHeaderColorData = async () => {
      const whitelabelledpartnerid = localStorage.getItem(
        "whitelabelledpartnerid"
      );
      if (!whitelabelledpartnerid || headerColorCache.current) return;

      if (onLoadingStart) onLoadingStart();
      await dispatch(fetchHeaderColor());
      if (onLoadingEnd) onLoadingEnd();
    };

    fetchHeaderColorData();
  }, [dispatch, onLoadingStart, onLoadingEnd]);

  // Responsive design effect
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== isMobile) {
        dispatch(setMobileState(mobile));
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch, isMobile]);

  // Fetch transactions when beneficiaryId changes
  useEffect(() => {
    console.log("🔍 useEffect triggered with beneficiaryId:", beneficiaryId);
    if (beneficiaryId) {
      console.log("🚀 Fetching transactions for:", beneficiaryId);
      if (onLoadingStart) onLoadingStart();
      dispatch(fetchTransactions(beneficiaryId)).finally(() => {
        if (onLoadingEnd) onLoadingEnd();
      });
    } else {
      console.log("⚠️ No beneficiaryId to fetch transactions");
    }
  }, [beneficiaryId, dispatch, onLoadingStart, onLoadingEnd]);

  // Fetch beneficiary name when beneficiaryId changes
  useEffect(() => {
    if (beneficiaryId) {
      dispatch(fetchBeneficiaryName(beneficiaryId));
    }
  }, [beneficiaryId, dispatch]);

  // Transaction completion callback
  useEffect(() => {
    if (transactions.some((tx) => tx.status === "completed")) {
      onTransactionComplete?.();
    }
  }, [transactions, onTransactionComplete]);

  // Memoized export functions
  const exportTransactionPDF = useCallback(
    async (transaction) => {
      if (onLoadingStart) onLoadingStart();

      try {
        const doc = new jsPDF();
        const logoImg = new Image();
        // Note: You'll need to import logoPath or get it from assets
        // logoImg.src = logoPath;

        await new Promise((resolve) => {
          logoImg.onload = resolve;
        });

        doc.addImage(logoImg, "PNG", 10, 10, 40, 20);

        doc.setFontSize(20);
        doc.text("Transaction Receipt", 105, 20, { align: "center" });

        doc.setFontSize(12);
        doc.text(`Transaction ID: ${transaction.transaction_id}`, 14, 40);
        doc.text(
          `Date: ${formatDate(transaction.transaction_datetime)}`,
          14,
          48
        );
        doc.text(
          `Amount: ${transaction.instructed_amount} ${transaction.currency_code}`,
          14,
          56
        );
        doc.text(`Status: ${transaction.status}`, 14, 64);
        doc.text(`Direction: ${transaction.direction}`, 14, 72);
        doc.text(`Fee: ${transaction.fee_amount || "0"}`, 14, 80);

        if (transaction.particulars) {
          doc.text(`Particulars: ${transaction.particulars}`, 14, 88);
        }

        if (transaction.sender_name) {
          doc.text(`Sender: ${transaction.sender_name}`, 14, 96);
        }

        autoTable(doc, {
          startY: 110,
          head: [["Field", "Value"]],
          body: [
            ["Transaction ID", transaction.transaction_id],
            ["Date", formatDate(transaction.transaction_datetime)],
            [
              "Amount",
              `${transaction.instructed_amount} ${transaction.currency_code}`,
            ],
            ["Status", transaction.status],
            ["Direction", transaction.direction],
            ["Fee", transaction.fee_amount || "0"],
            [
              "Total Amount",
              transaction.amount_with_fee || transaction.instructed_amount,
            ],
          ],
        });

        doc.save(`transaction_${transaction.transaction_id}.pdf`);
        toast.success("PDF exported successfully!");
      } catch (err) {
        console.error("Error exporting PDF:", err);
        toast.error("Failed to export PDF");
      } finally {
        if (onLoadingEnd) onLoadingEnd();
      }
    },
    [formatDate, onLoadingStart, onLoadingEnd]
  );

  const exportTransactionReceiptPDFNew = useCallback(
    async (transactionId) => {
      if (onLoadingStart) onLoadingStart();

      try {
        const token = getAuthToken();

        const response = await fetch(
          `${API_URL}/export-transaction-pdf/${transactionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transaction_${transactionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success("PDF receipt exported successfully!");
      } catch (err) {
        console.error("Error exporting receipt PDF:", err);
        toast.error("Failed to export receipt PDF. Using fallback export.");
        // Fallback to basic PDF export
        const transaction = transactions.find((tx) => tx.id === transactionId);
        if (transaction) {
          await exportTransactionPDF(transaction);
        }
      } finally {
        if (onLoadingEnd) onLoadingEnd();
      }
    },
    [transactions, exportTransactionPDF, onLoadingStart, onLoadingEnd]
  );

  const exportTransactionExcel = useCallback(
    (transaction) => {
      if (onLoadingStart) onLoadingStart();

      try {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet([
          {
            "Transaction ID": transaction.transaction_id,
            Date: formatDate(transaction.transaction_datetime),
            Amount: transaction.instructed_amount,
            Currency: transaction.currency_code,
            Status: transaction.status,
            Direction: transaction.direction,
            Fee: transaction.fee_amount || "0",
            "Total Amount":
              transaction.amount_with_fee || transaction.instructed_amount,
            Particulars: transaction.particulars || "",
            "Sender Name": transaction.sender_name || "",
          },
        ]);

        XLSX.utils.book_append_sheet(workbook, worksheet, "Transaction");
        XLSX.writeFile(
          workbook,
          `transaction_${transaction.transaction_id}.xlsx`
        );

        toast.success("Excel exported successfully!");
      } catch (err) {
        console.error("Error exporting Excel:", err);
        toast.error("Failed to export Excel");
      } finally {
        if (onLoadingEnd) onLoadingEnd();
      }
    },
    [formatDate, onLoadingStart, onLoadingEnd]
  );

  // Memoized mobile transaction card render
  const renderMobileTransactionCard = useCallback(
    (transaction) => (
      <motion.div
        key={transaction.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-sky-800 rounded-lg shadow-md p-4 mb-4 border border-gray-100"
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-gray-900">
            {transaction.transaction_id || "N/A"}
          </h4>
          <span
            className={`py-1 px-2 rounded-md text-xs font-medium ${
              transaction.direction === "Inbound"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {transaction.direction || "N/A"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <p className="text-gray-500">Date</p>
            <p>{formatDate(transaction.transaction_datetime)}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <p
              className={`${
                transaction.status === "completed"
                  ? "text-green-600"
                  : transaction.status === "failed"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {transaction.status || "Pending"}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Amount</p>
            <p className="font-medium">
              {transaction.instructed_amount} {transaction.currency_code}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Fees</p>
            <p className="text-red-600">{transaction.fee_amount || "0"}</p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div>
            <p className="text-sm text-gray-500">Sender</p>
            <p className="text-sm">{transaction.sender_name || "N/A"}</p>
          </div>
          <div className="flex gap-2">
            <button
              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              onClick={() => exportTransactionReceiptPDFNew(transaction.id)}
              title="Export as PDF"
            >
              <FaFilePdf size={14} />
            </button>
            <button
              className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
              onClick={() => exportTransactionExcel(transaction)}
              title="Export as Excel"
            >
              <FaFileExcel size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    ),
    [formatDate, exportTransactionReceiptPDFNew, exportTransactionExcel]
  );

  // Memoized desktop table render
  const renderDesktopTable = useMemo(
    () => (
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-sm">
              <th className="py-4 px-6 text-left">Date</th>
              <th className="py-4 px-6 text-left">Direction</th>
              <th className="py-4 px-6 text-left">Status</th>
              <th className="py-4 px-6 text-left">Amount</th>
              <th className="py-4 px-6 text-left">Fees</th>
              <th className="py-4 px-6 text-left">Total Amt</th>
              <th className="py-4 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="hover:bg-gray-50 transition-all text-sm"
              >
                <td className="py-6 px-6 text-gray-700">
                  {formatDate(transaction.transaction_datetime)}
                </td>
                <td className="py-6 px-6">
                  <span
                    className={`py-1 px-3 rounded-md font-medium inline-block text-white ${
                      transaction.direction === "Inbound"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  >
                    {transaction.direction || "N/A"}
                  </span>
                </td>
                <td className="py-6 px-6 text-gray-700">
                  {transaction.status === "completed" ||
                  transaction.status === "failed" ||
                  transaction.status === "cancelled"
                    ? transaction.status
                    : "Pending"}
                </td>
                <td className="py-6 px-6">
                  <span
                    className={
                      transaction.direction === "Outbound"
                        ? "text-red-600"
                        : "text-green-600"
                    }
                  >
                    {transaction.instructed_amount !== undefined &&
                    transaction.currency_code
                      ? `${transaction.instructed_amount} ${transaction.currency_code}`
                      : "0"}
                  </span>
                </td>

                <td className="py-6 px-6">
                  <span
                    className={
                      transaction.direction === "Outbound"
                        ? "text-red-600"
                        : "text-green-600"
                    }
                  >
                    {transaction.fee_amount !== undefined
                      ? transaction.fee_amount
                      : "0"}
                  </span>
                </td>
                <td className="py-6 px-6">
                  <span
                    className={
                      transaction.direction === "Outbound"
                        ? "text-red-600"
                        : "text-green-600"
                    }
                  >
                    {transaction.amount_with_fee !== undefined
                      ? transaction.amount_with_fee
                      : "N/A"}
                  </span>
                </td>
                <td className="p-3 flex gap-4 justify-center">
                  <button
                    className="flex items-center justify-center p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-md"
                    onClick={() =>
                      exportTransactionReceiptPDFNew(transaction.id)
                    }
                    title="Export as PDF"
                  >
                    <FaFilePdf size={18} />
                  </button>
                  <button
                    className="flex items-center justify-center p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all duration-300 transform hover:scale-105 shadow-md"
                    onClick={() => exportTransactionExcel(transaction)}
                    title="Export as Excel"
                  >
                    <FaFileExcel size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    [
      filteredTransactions,
      formatDate,
      exportTransactionReceiptPDFNew,
      exportTransactionExcel,
    ]
  );

  // Memoized skeleton loader
  const renderSkeletonLoader = useMemo(
    () => (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-100 p-4 rounded-lg animate-pulse h-32"
          ></div>
        ))}
      </div>
    ),
    []
  );

  // Handler functions for filters
  const handleFilterDirectionChange = useCallback(
    (e) => {
      dispatch(setFilterDirection(e.target.value));
    },
    [dispatch]
  );

  const handleFilterStartDateChange = useCallback(
    (e) => {
      dispatch(setFilterStartDate(e.target.value));
    },
    [dispatch]
  );

  const handleFilterEndDateChange = useCallback(
    (e) => {
      dispatch(setFilterEndDate(e.target.value));
    },
    [dispatch]
  );

  const handleRetryFetch = useCallback(() => {
    if (beneficiaryId) {
      if (onLoadingStart) onLoadingStart();
      dispatch(fetchTransactions(beneficiaryId)).finally(() => {
        if (onLoadingEnd) onLoadingEnd();
      });
    }
  }, [beneficiaryId, dispatch, onLoadingStart, onLoadingEnd]);

  return (
    <section className="p-4 sm:p-6 rounded-lg shadow-md transition-colors duration-300 bg-white">
      {/* Header section */}
      <div className={`rounded-lg p-4 mb-6 ${headerColor || "bg-gray-100"}`}>
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-semibold text-black">
            Recent Transactions {beneficiaryName && `for ${beneficiaryName}`}
          </h3>
          {!isMobile && (
            <div className="flex gap-4">
              <button
                className="bg-white text-sky-700 px-6 py-2 rounded-md hover:bg-gray-100 border border-white transition-colors"
                onClick={handleViewMoreDetails}
              >
                View More Details
              </button>
              <button
                className="bg-white text-green-700 px-6 py-2 rounded-md hover:bg-gray-100 border border-white transition-colors"
                onClick={handleViewMonthlyStatement}
              >
                Monthly Statement
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Show loading state */}
      {loading && (
        <div className="text-center p-8">
          <p className="text-gray-600 mb-4">Loading transactions...</p>
          {renderSkeletonLoader}
        </div>
      )}

      {/* Show error state */}
      {error && !loading && (
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <p className="text-red-500 text-lg mb-2">
            Error Loading Transactions
          </p>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRetryFetch}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Show no beneficiary ID state */}
      {!beneficiaryId && !loading && (
        <div className="text-center p-8 bg-yellow-50 rounded-lg">
          <p className="text-yellow-700 text-lg">No Beneficiary Selected</p>
          <p className="text-yellow-600">
            Please select a beneficiary to view transactions.
          </p>
          {/* Add debug info */}
          <div className="mt-4 text-sm text-gray-500">
            <p>Debug Info:</p>
            <p>beneficiaryId: {beneficiaryId || "undefined"}</p>
            <p>Current URL: {window.location.href}</p>
            <p>Expected URL: /beneficiary/transactions/YOUR_BENEFICIARY_ID</p>
          </div>
        </div>
      )}

      {/* Show no transactions state */}
      {beneficiaryId &&
        !loading &&
        !error &&
        filteredTransactions.length === 0 && (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">No Transactions Found</p>
            <p className="text-gray-400">No transactions available.</p>
          </div>
        )}

      {/* Show transactions */}
      {!loading && !error && filteredTransactions.length > 0 && (
        <>
          {/* Filters */}
          <div className="bg-gray-50 p-4 rounded-lg flex flex-wrap gap-4 items-start md:items-center mb-6">
            <div className="relative w-full md:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-colors"
                value={filters.direction}
                onChange={handleFilterDirectionChange}
              >
                <option value="">All Directions</option>
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
              </select>
            </div>

            <div className="flex flex-col w-full md:w-auto flex-1 min-w-[150px]">
              <label className="text-gray-600 text-sm mb-1">Start Date</label>
              <input
                type="date"
                className="border border-gray-300 p-2 rounded-md shadow-sm focus:ring focus:ring-blue-300 w-full transition-colors"
                value={filters.startDate}
                onChange={handleFilterStartDateChange}
              />
            </div>
            <div className="flex flex-col w-full md:w-auto flex-1 min-w-[150px]">
              <label className="text-gray-600 text-sm mb-1">End Date</label>
              <input
                type="date"
                className="border border-gray-300 p-2 rounded-md shadow-sm focus:ring focus:ring-blue-300 w-full transition-colors"
                value={filters.endDate}
                onChange={handleFilterEndDateChange}
              />
            </div>
          </div>

          {/* Transactions List */}
          {isMobile ? (
            <div className="space-y-4">
              {filteredTransactions.map(renderMobileTransactionCard)}
            </div>
          ) : (
            renderDesktopTable
          )}

          {isMobile && (
            <div className="flex flex-col gap-4 mt-6">
              <button
                className="bg-sky-700 text-white px-6 py-2 rounded-md hover:bg-sky-600 transition-colors"
                onClick={handleViewMoreDetails}
              >
                <span {...textColorProps}>View More Details</span>
              </button>
              <button
                className="bg-green-700 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors"
                onClick={handleViewMonthlyStatement}
                {...textColorProps}
              >
                Monthly Statement
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

BeneficiaryTransactions.propTypes = {
  customerId: PropTypes.string,
  selectedCurrencyCode: PropTypes.string,
  onTransactionComplete: PropTypes.func,
  onLoadingStart: PropTypes.func,
  onLoadingEnd: PropTypes.func,
  textColor: PropTypes.string,
};

export default React.memo(BeneficiaryTransactions);
