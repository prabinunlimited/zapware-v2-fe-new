import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { FaFilePdf, FaFileExcel, FaFilter, FaExchangeAlt } from "react-icons/fa";
import logoPath from "../../../../../assets/images/Logo/unlimited remit logo.png";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
});

const BenefTransactions = ({
  customerId: propCustomerId,
  selectedCurrencyCode,
  onTransactionComplete,
  onLoadingStart,
  onLoadingEnd,
  textColor,
}) => {
  const { beneficiaryId } = useParams();
  const [transactionData, setTransactionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authtoken] = useState(localStorage.getItem("authtoken"));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [filterDirection, setFilterDirection] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [beneficiaryName, setBeneficiaryName] = useState("");

  const customerId = propCustomerId || localStorage.getItem("customerid");

  const navigate = useNavigate();

  const handleViewMoreDetails = useCallback(() => {
    navigate(`/beneficiary-all-transactions/${beneficiaryId}`);
  }, [navigate, beneficiaryId]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  }, []);

  // Responsive design effect
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(document.body);

    return () => resizeObserver.disconnect();
  }, []);

  // Main transaction data fetch
  const fetchTransactionDetails = useCallback(async () => {
    if (!beneficiaryId) return;

    try {
      setLoading(true);
      if (onLoadingStart) onLoadingStart();

      const response = await apiClient.get(
        `/beneficiaries/recent-transactions/${beneficiaryId}`,
        { headers: { Authorization: `Bearer ${authtoken}` } }
      );

      let transactions = [];

      if (response.data.data?.transactionDetails) {
        transactions = response.data.data.transactionDetails;
      } else if (response.data.transactionDetails) {
        transactions = response.data.transactionDetails;
      } else if (Array.isArray(response.data.data)) {
        transactions = response.data.data;
      }

      const sortedTransactions = transactions.sort(
        (a, b) =>
          new Date(b.transaction_datetime) - new Date(a.transaction_datetime)
      );

      setTransactionData(sortedTransactions);
      setError(null);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch transactions"
      );
    } finally {
      setLoading(false);
      if (onLoadingEnd) onLoadingEnd();
    }
  }, [beneficiaryId, authtoken, onLoadingStart, onLoadingEnd]);

  useEffect(() => {
    if (beneficiaryId) {
      fetchTransactionDetails();
    }
  }, [fetchTransactionDetails, beneficiaryId]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactionData;

    if (filterStartDate && filterEndDate) {
      filtered = filtered.filter((transaction) => {
        const transactionDate = new Date(transaction.transaction_datetime);
        const startDate = new Date(filterStartDate);
        const endDate = new Date(filterEndDate);
        endDate.setHours(23, 59, 59, 999);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }
    if (filterDirection) {
      filtered = filtered.filter(
        (transaction) => transaction.direction === filterDirection
      );
    }

    return filtered;
  }, [transactionData, filterStartDate, filterEndDate, filterDirection]);

  // Fetch beneficiary name
  useEffect(() => {
    const fetchBeneficiaryName = async () => {
      if (!beneficiaryId || !authtoken) return;

      try {
        const response = await apiClient.get(
          `/beneficiaries/fetch-merchant-benef/${beneficiaryId}`,
          { headers: { Authorization: `Bearer ${authtoken}` } }
        );

        if (response.data?.data?.name) {
          setBeneficiaryName(response.data.data.name);
        }
      } catch (err) {
        console.error("Error fetching beneficiary name:", err);
      }
    };

    fetchBeneficiaryName();
  }, [beneficiaryId, authtoken]);

  useEffect(() => {
    if (transactionData.some((tx) => tx.status === "completed")) {
      onTransactionComplete?.();
    }
  }, [transactionData, onTransactionComplete]);

  // Export functions
  const exportTransactionPDF = useCallback(
    async (transaction) => {
      try {
        if (onLoadingStart) onLoadingStart();

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        const img = new Image();
        img.src = logoPath;
        doc.addImage(img, "PNG", 15, 10, 40, 15);

        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text("Transaction Details", pageWidth / 2, 30, {
          align: "center",
        });

        const details = [
          ["Transaction ID", transaction.transaction_id || "N/A"],
          ["Date", formatDate(transaction.transaction_datetime)],
          ["Direction", transaction.direction || "N/A"],
          ["Status", transaction.status || "Pending"],
          [
            "Amount",
            `${transaction.instructed_amount || 0} ${transaction.currency_code || ""
            }`,
          ],
          ["Fee", transaction.fee_amount || "0"],
          ["Total Amount", transaction.amount_with_fee || "N/A"],
          ["Sender", transaction.sender_name || "N/A"],
          ["Beneficiary", transaction.beneficiary_name || "N/A"],
        ];

        autoTable(doc, {
          startY: 40,
          head: [["Field", "Value"]],
          body: details,
          theme: "striped",
          headStyles: { fillColor: [41, 128, 185] },
          styles: { fontSize: 10 },
        });

        doc.save(`transaction_${transaction.transaction_id || "receipt"}.pdf`);
        toast.success("PDF exported successfully!");
      } catch (error) {
        console.error("Error exporting PDF:", error);
        toast.error("Failed to export PDF");
      } finally {
        if (onLoadingEnd) onLoadingEnd();
      }
    },
    [formatDate, onLoadingStart, onLoadingEnd]
  );

  const exportTransactionReceiptPDFNew = useCallback(
    async (transactionId) => {
      try {
        if (onLoadingStart) onLoadingStart();

        const transaction = transactionData.find((t) => t.id === transactionId);
        if (!transaction) {
          toast.error("Transaction not found");
          return;
        }

        await exportTransactionPDF(transaction);
      } catch (error) {
        console.error("Error exporting receipt:", error);
        toast.error("Failed to export receipt");
      } finally {
        if (onLoadingEnd) onLoadingEnd();
      }
    },
    [transactionData, exportTransactionPDF, onLoadingStart, onLoadingEnd]
  );

  const exportTransactionExcel = useCallback(
    (transaction) => {
      try {
        if (onLoadingStart) onLoadingStart();

        const data = [
          {
            "Transaction ID": transaction.transaction_id || "N/A",
            Date: formatDate(transaction.transaction_datetime),
            Direction: transaction.direction || "N/A",
            Status: transaction.status || "Pending",
            Amount: transaction.instructed_amount || 0,
            Currency: transaction.currency_code || "",
            Fee: transaction.fee_amount || 0,
            "Total Amount": transaction.amount_with_fee || "N/A",
            Sender: transaction.sender_name || "N/A",
            Beneficiary: transaction.beneficiary_name || "N/A",
          },
        ];

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transaction");
        XLSX.writeFile(
          wb,
          `transaction_${transaction.transaction_id || "export"}.xlsx`
        );

        toast.success("Excel exported successfully!");
      } catch (error) {
        console.error("Error exporting Excel:", error);
        toast.error("Failed to export Excel");
      } finally {
        if (onLoadingEnd) onLoadingEnd();
      }
    },
    [formatDate, onLoadingStart, onLoadingEnd]
  );

  // Status badge helper
  const getStatusBadge = (status) => {
    const normalized = status || "pending";
    const config = {
      completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      failed: "bg-red-50 text-red-700 border border-red-200",
      cancelled: "bg-gray-50 text-gray-600 border border-gray-200",
      pending: "bg-amber-50 text-amber-700 border border-amber-200",
    };
    const label =
      normalized === "completed" ||
        normalized === "failed" ||
        normalized === "cancelled"
        ? normalized
        : "pending";

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${config[label]
          }`}
      >
        {label}
      </span>
    );
  };

  // Mobile transaction card
  const renderMobileTransactionCard = useCallback(
    (transaction) => (
      <motion.div
        key={transaction.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-4"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center border ${transaction.direction === "Inbound"
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-gray-50 border-gray-200"
                }`}
            >
              <FaExchangeAlt
                className={`w-3.5 h-3.5 ${transaction.direction === "Inbound"
                    ? "text-emerald-600"
                    : "text-gray-600"
                  }`}
              />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {transaction.transaction_id || "N/A"}
              </p>
              <p className="text-xs text-gray-400">
                {formatDate(transaction.transaction_datetime)}
              </p>
            </div>
          </div>
          {getStatusBadge(transaction.status)}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-3 pt-3 border-t border-gray-100">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Amount</p>
            <p
              className={`font-medium ${transaction.direction === "Outbound"
                  ? "text-red-600"
                  : "text-emerald-600"
                }`}
            >
              {transaction.instructed_amount !== undefined &&
                transaction.currency_code
                ? `${transaction.instructed_amount} ${transaction.currency_code}`
                : "0"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Fee</p>
            <p className="text-gray-700">{transaction.fee_amount || "0"}</p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Sender</p>
            <p className="text-sm text-gray-700">
              {transaction.sender_name || "N/A"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => exportTransactionReceiptPDFNew(transaction.id)}
              title="Export as PDF"
            >
              <FaFilePdf size={14} />
            </button>
            <button
              className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
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

  // Desktop table
  const renderDesktopTable = useMemo(
    () => (
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
              <th className="py-3.5 px-5 text-left font-medium">Date</th>
              <th className="py-3.5 px-5 text-left font-medium">Direction</th>
              <th className="py-3.5 px-5 text-left font-medium">Status</th>
              <th className="py-3.5 px-5 text-left font-medium">Amount</th>
              <th className="py-3.5 px-5 text-left font-medium">Fee</th>
              <th className="py-3.5 px-5 text-left font-medium">Total</th>
              <th className="py-3.5 px-5 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTransactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="hover:bg-gray-50/60 transition-colors text-sm"
              >
                <td className="py-4 px-5 text-gray-600">
                  {formatDate(transaction.transaction_datetime)}
                </td>
                <td className="py-4 px-5">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${transaction.direction === "Inbound"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-gray-50 text-gray-600 border border-gray-200"
                      }`}
                  >
                    {transaction.direction || "N/A"}
                  </span>
                </td>
                <td className="py-4 px-5">
                  {getStatusBadge(transaction.status)}
                </td>
                <td className="py-4 px-5">
                  <span
                    className={`font-medium ${transaction.direction === "Outbound"
                        ? "text-red-600"
                        : "text-emerald-600"
                      }`}
                  >
                    {transaction.instructed_amount !== undefined &&
                      transaction.currency_code
                      ? `${transaction.instructed_amount} ${transaction.currency_code}`
                      : "0"}
                  </span>
                </td>
                <td className="py-4 px-5 text-gray-600">
                  {transaction.fee_amount !== undefined
                    ? transaction.fee_amount
                    : "0"}
                </td>
                <td className="py-4 px-5 text-gray-600">
                  {transaction.amount_with_fee !== undefined
                    ? transaction.amount_with_fee
                    : "N/A"}
                </td>
                <td className="py-4 px-5">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                      onClick={() =>
                        exportTransactionReceiptPDFNew(transaction.id)
                      }
                      title="Export as PDF"
                    >
                      <FaFilePdf size={15} />
                    </button>
                    <button
                      className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                      onClick={() => exportTransactionExcel(transaction)}
                      title="Export as Excel"
                    >
                      <FaFileExcel size={15} />
                    </button>
                  </div>
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

  const renderSkeletonLoader = useMemo(
    () => (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-100 rounded-xl animate-pulse h-20"
          ></div>
        ))}
      </div>
    ),
    []
  );

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </h3>
          {beneficiaryName && (
            <p className="text-sm text-gray-500 mt-0.5">
              for {beneficiaryName}
            </p>
          )}
        </div>
        {!isMobile && (
          <button
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
            onClick={handleViewMoreDetails}
          >
            View More Details
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div>
          <p className="text-gray-500 text-sm mb-4">Loading transactions...</p>
          {renderSkeletonLoader}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-10 bg-red-50 rounded-xl border border-red-200">
          <p className="text-red-600 font-medium mb-1">
            Error Loading Transactions
          </p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchTransactionDetails}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* No beneficiary state */}
      {!beneficiaryId && !loading && (
        <div className="text-center py-10 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-amber-700 font-medium">No Beneficiary Selected</p>
          <p className="text-amber-600 text-sm mt-1">
            Please select a beneficiary to view transactions.
          </p>
        </div>
      )}

      {/* No transactions state */}
      {beneficiaryId && !loading && !error && transactionData.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-600 font-medium">No Transactions Found</p>
          <p className="text-gray-400 text-sm mt-1">
            No transactions available.
          </p>
        </div>
      )}

      {/* Transactions */}
      {!loading && !error && transactionData.length > 0 && (
        <>
          {/* Filters */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4 items-end mb-6">
            <div className="w-full sm:w-48">
              <label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                <FaFilter className="text-gray-400" size={11} />
                Direction
              </label>
              <select
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
              >
                <option value="">All Directions</option>
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-gray-500 mb-1.5 block">
                Start Date
              </label>
              <input
                type="date"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-gray-500 mb-1.5 block">
                End Date
              </label>
              <input
                type="date"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>

            {(filterDirection || filterStartDate || filterEndDate) && (
              <button
                onClick={() => {
                  setFilterDirection("");
                  setFilterStartDate("");
                  setFilterEndDate("");
                }}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

        {/* List or Filtered Empty Message */}
        {filteredTransactions.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-600 font-medium">No matching transactions</p>
              <p className="text-gray-400 text-sm mt-1">
                No transactions match the selected filters.
              </p>
            </div>
          ) : isMobile ? (
            <div className="space-y-3">
              {filteredTransactions.map(renderMobileTransactionCard)}
            </div>
          ) : (
            renderDesktopTable
          )}

          {isMobile && (
            <button
              className="w-full mt-5 px-4 py-3 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
              onClick={handleViewMoreDetails}
            >
              View More Details
            </button>
          )}
        </>
      )}
    </section>
  );
};

BenefTransactions.propTypes = {
  customerId: PropTypes.string,
  selectedCurrencyCode: PropTypes.string,
  onTransactionComplete: PropTypes.func,
  onLoadingStart: PropTypes.func,
  onLoadingEnd: PropTypes.func,
  textColor: PropTypes.string,
};

export default React.memo(BenefTransactions);