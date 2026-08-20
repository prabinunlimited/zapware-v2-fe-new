import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
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

const API_URL = import.meta.env.VITE_API_URL;

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

  const [filterDirection, setFilterDirection] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [beneficiaryName, setBeneficiaryName] = useState("");

  const customerId = propCustomerId || localStorage.getItem("customerid");
  const navigate = useNavigate();

  const handleViewMoreDetails = useCallback(() => {
    navigate(`/beneficiary-all-transactions/${beneficiaryId}`);
  }, [navigate, beneficiaryId]);

  // Formats only the Date (e.g., Aug 11, 2026)
  const formatDateOnly = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Formats only the Time (e.g., 08:01 AM)
  const formatTimeOnly = useCallback((dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Combined format for table/export views
  const formatFullDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Fetch transaction details
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

  // Export handlers
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
          ["Date", formatFullDate(transaction.transaction_datetime)],
          ["Direction", transaction.direction || "N/A"],
          ["Status", transaction.status || "Pending"],
          [
            "Amount",
            `${transaction.instructed_amount || 0} ${
              transaction.currency_code || ""
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
    [formatFullDate, onLoadingStart, onLoadingEnd]
  );

  const exportTransactionReceiptPDFNew = useCallback(
    async (transactionId) => {
      try {
        if (onLoadingStart) onLoadingStart();

        const transaction = transactionData.find(
          (t) => (t.id || t.transaction_id) === transactionId
        );
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
            Date: formatFullDate(transaction.transaction_datetime),
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
    [formatFullDate, onLoadingStart, onLoadingEnd]
  );

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const normalized = status?.toLowerCase() || "pending";
    const config = {
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
      failed: "bg-red-50 text-red-700 border-red-200",
      cancelled: "bg-gray-50 text-gray-600 border-gray-200",
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      processing: "bg-blue-50 text-blue-700 border-blue-200",
    };
    const colorClass = config[normalized] || config.pending;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${colorClass}`}
      >
        {status || "Pending"}
      </span>
    );
  };

  // Mobile Clean Card View
  const renderMobileTransactionCard = useCallback(
    (transaction) => {
      const isOutbound = transaction.direction === "Outbound";
      const isInbound = transaction.direction === "Inbound";

      return (
        <div
          key={transaction.id || transaction.transaction_id}
          className="w-full bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3"
        >
          {/* Top Row: Icon + Date (above) + Time (below) + Status Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  isInbound
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-blue-50 text-blue-600 border-blue-200"
                }`}
              >
                <FaExchangeAlt className="w-3.5 h-3.5" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 leading-tight">
                  {formatDateOnly(transaction.transaction_datetime)}
                </p>
                <p className="text-[11px] text-gray-400 font-medium leading-tight mt-0.5">
                  {formatTimeOnly(transaction.transaction_datetime)}
                </p>
              </div>
            </div>

            <div className="flex-shrink-0">
              {getStatusBadge(transaction.status)}
            </div>
          </div>

          {/* Amount & Fee Box */}
          <div className="bg-gray-50/80 rounded-xl p-3 flex items-center justify-between border border-gray-100">
            <div>
              <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">
                Amount
              </span>
              <span
                className={`text-sm sm:text-base font-bold tracking-tight ${
                  isOutbound ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {transaction.instructed_amount || "0.00"}{" "}
                <span className="text-xs font-semibold text-gray-600">
                  {transaction.currency_code || "USD"}
                </span>
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">
                Fee
              </span>
              <span className="text-xs font-semibold text-gray-700">
                {transaction.fee_amount &&
                parseFloat(transaction.fee_amount) > 0
                  ? `${transaction.fee_amount} ${
                      transaction.currency_code || ""
                    }`
                  : "0.00"}
              </span>
            </div>
          </div>

          {/* Sender & Action Download Buttons */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="min-w-0 pr-2">
              <span className="text-gray-400 text-[11px]">Sender: </span>
              <span className="font-semibold text-gray-800 truncate">
                {transaction.sender_name || "N/A"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() =>
                  exportTransactionReceiptPDFNew(
                    transaction.id || transaction.transaction_id
                  )
                }
                className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all cursor-pointer"
                title="Download PDF"
                aria-label="Download PDF"
              >
                <FaFilePdf size={12} className="text-red-500" />
              </button>
              <button
                onClick={() => exportTransactionExcel(transaction)}
                className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
                title="Download Excel"
                aria-label="Download Excel"
              >
                <FaFileExcel size={12} className="text-emerald-600" />
              </button>
            </div>
          </div>
        </div>
      );
    },
    [
      formatDateOnly,
      formatTimeOnly,
      exportTransactionReceiptPDFNew,
      exportTransactionExcel,
    ]
  );

  // Desktop Table View
  const renderDesktopTable = useMemo(
    () => (
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4 text-left">Date</th>
              <th className="py-3.5 px-4 text-left">Direction</th>
              <th className="py-3.5 px-4 text-left">Status</th>
              <th className="py-3.5 px-4 text-left">Amount</th>
              <th className="py-3.5 px-4 text-left">Fee</th>
              <th className="py-3.5 px-4 text-left">Total</th>
              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredTransactions.map((transaction) => (
              <tr
                key={transaction.id || transaction.transaction_id}
                className="hover:bg-gray-50/70 transition-colors text-xs sm:text-sm"
              >
                <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                  {formatFullDate(transaction.transaction_datetime)}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      transaction.direction === "Inbound"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {transaction.direction || "N/A"}
                  </span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {getStatusBadge(transaction.status)}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`font-semibold ${
                      transaction.direction === "Outbound"
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
                <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                  {transaction.fee_amount !== undefined
                    ? transaction.fee_amount
                    : "0"}
                </td>
                <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                  {transaction.amount_with_fee !== undefined
                    ? transaction.amount_with_fee
                    : "N/A"}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() =>
                        exportTransactionReceiptPDFNew(
                          transaction.id || transaction.transaction_id
                        )
                      }
                      title="Export as PDF"
                      aria-label="Export PDF"
                    >
                      <FaFilePdf size={13} className="text-red-600" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => exportTransactionExcel(transaction)}
                      title="Export as Excel"
                      aria-label="Export Excel"
                    >
                      <FaFileExcel size={13} className="text-emerald-600" />
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
      formatFullDate,
      exportTransactionReceiptPDFNew,
      exportTransactionExcel,
    ]
  );

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-2xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            Recent Transactions
          </h3>
          {beneficiaryName && (
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              for {beneficiaryName}
            </p>
          )}
        </div>
        <button
          className="hidden md:inline-flex items-center px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
          onClick={handleViewMoreDetails}
        >
          View More Details
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          <p className="text-gray-500 text-xs sm:text-sm mb-3">
            Loading transactions...
          </p>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-xl animate-pulse h-16 sm:h-20"
            />
          ))}
        </div>
      )}

      {/* Error View */}
      {error && !loading && (
        <div className="text-center py-8 px-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-red-700 font-bold text-sm mb-1">
            Error Loading Transactions
          </p>
          <p className="text-red-500 text-xs mb-3.5">{error}</p>
          <button
            onClick={fetchTransactionDetails}
            className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer shadow-2xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty States */}
      {!beneficiaryId && !loading && (
        <div className="text-center py-8 px-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-amber-800 font-bold text-sm">
            No Beneficiary Selected
          </p>
          <p className="text-amber-600 text-xs mt-1">
            Please select a beneficiary to view transactions.
          </p>
        </div>
      )}

      {beneficiaryId && !loading && !error && transactionData.length === 0 && (
        <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-700 font-bold text-sm">
            No Transactions Found
          </p>
          <p className="text-gray-400 text-xs mt-1">
            No transactions available.
          </p>
        </div>
      )}

      {/* Transactions & Filters */}
      {!loading && !error && transactionData.length > 0 && (
        <>
          {/* Responsive Filters */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-end gap-3 mb-5">
            <div className="w-full sm:w-44 flex-shrink-0">
              <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                <FaFilter className="text-gray-400" size={10} />
                Direction
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
              >
                <option value="">All Directions</option>
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 flex-1 w-full">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>
            </div>

            {(filterDirection || filterStartDate || filterEndDate) && (
              <button
                onClick={() => {
                  setFilterDirection("");
                  setFilterStartDate("");
                  setFilterEndDate("");
                }}
                className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors self-start sm:self-auto cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-700 font-bold text-sm">
                No matching transactions
              </p>
              <p className="text-gray-400 text-xs mt-1">
                No transactions match the selected filters.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View: Cards (< 768px) */}
              <div className="block md:hidden space-y-3">
                {filteredTransactions.map(renderMobileTransactionCard)}
              </div>

              {/* Desktop View: Table (>= 768px) */}
              <div className="hidden md:block">
                {renderDesktopTable}
              </div>
            </>
          )}

          {/* Full-width Mobile Bottom Link Button */}
          <button
            className="md:hidden w-full mt-4 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
            onClick={handleViewMoreDetails}
          >
            View More Details
          </button>
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