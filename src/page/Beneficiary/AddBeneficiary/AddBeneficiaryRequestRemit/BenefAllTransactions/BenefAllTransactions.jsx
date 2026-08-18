import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  FaFilePdf,
  FaFileExcel,
  FaFilter,
  FaExchangeAlt,
  FaArrowLeft,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaFileDownload,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import logoPath from "../../../../../assets/images/Logo/unlimited remit logo.png";

const API_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
});

const ITEMS_PER_PAGE = 10;

const BenefAllTransactions = () => {
  const { beneficiaryId } = useParams();
  const navigate = useNavigate();

  const [transactionData, setTransactionData] = useState([]);
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authtoken] = useState(localStorage.getItem("authtoken"));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDirection, setFilterDirection] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Handle responsive resizing
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(document.body);
    return () => resizeObserver.disconnect();
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  }, []);

  // Fetch full transaction list & beneficiary details
  const fetchAllData = useCallback(async () => {
    if (!beneficiaryId || !authtoken) return;

    try {
      setLoading(true);
      setError(null);

      const [txRes, benefRes] = await Promise.allSettled([
        apiClient.get(`/beneficiaries/all-transactions/${beneficiaryId}`, {
          headers: { Authorization: `Bearer ${authtoken}` },
        }),
        apiClient.get(`/beneficiaries/fetch-merchant-benef/${beneficiaryId}`, {
          headers: { Authorization: `Bearer ${authtoken}` },
        }),
      ]);

      // Process Transactions
      if (txRes.status === "fulfilled") {
        const responseData = txRes.value.data;
        let list = [];
        if (responseData.data?.transactionDetails) {
          list = responseData.data.transactionDetails;
        } else if (responseData.transactionDetails) {
          list = responseData.transactionDetails;
        } else if (Array.isArray(responseData.data)) {
          list = responseData.data;
        }

        const sorted = list.sort(
          (a, b) =>
            new Date(b.transaction_datetime) - new Date(a.transaction_datetime)
        );
        setTransactionData(sorted);
      } else {
        throw new Error(
          txRes.reason?.response?.data?.message || "Failed to load transactions"
        );
      }

      // Process Beneficiary Info
      if (benefRes.status === "fulfilled" && benefRes.value.data?.data?.name) {
        setBeneficiaryName(benefRes.value.data.data.name);
      }
    } catch (err) {
      console.error("Error loading beneficiary transaction details:", err);
      setError(err.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, [beneficiaryId, authtoken]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Filtering Logic
  const filteredTransactions = useMemo(() => {
    return transactionData.filter((transaction) => {
      // Search
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !search ||
        transaction.transaction_id?.toLowerCase().includes(search) ||
        transaction.sender_name?.toLowerCase().includes(search);

      // Status
      const matchesStatus =
        !filterStatus ||
        transaction.status?.toLowerCase() === filterStatus.toLowerCase();

      // Direction
      const matchesDirection =
        !filterDirection || transaction.direction === filterDirection;

      // Dates
      let matchesDate = true;
      if (filterStartDate && filterEndDate) {
        const txDate = new Date(transaction.transaction_datetime);
        const start = new Date(filterStartDate);
        const end = new Date(filterEndDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = txDate >= start && txDate <= end;
      }

      return (
        matchesSearch && matchesStatus && matchesDirection && matchesDate
      );
    });
  }, [
    transactionData,
    searchTerm,
    filterStatus,
    filterDirection,
    filterStartDate,
    filterEndDate,
  ]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;
  const paginatedTransactions = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterDirection("");
    setFilterStartDate("");
    setFilterEndDate("");
    setCurrentPage(1);
  };

  // Status Badge
  const getStatusBadge = (status) => {
    const normalized = (status || "pending").toLowerCase();
    const config = {
      completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      failed: "bg-red-50 text-red-700 border border-red-200",
      cancelled: "bg-gray-50 text-gray-600 border border-gray-200",
      pending: "bg-amber-50 text-amber-700 border border-amber-200",
    };
    const style = config[normalized] || config.pending;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}
      >
        {normalized}
      </span>
    );
  };

  // Single PDF Receipt
  const exportTransactionPDF = useCallback(
    async (transaction) => {
      try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        const img = new Image();
        img.src = logoPath;
        doc.addImage(img, "PNG", 15, 10, 40, 15);

        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text("Transaction Receipt", pageWidth / 2, 30, { align: "center" });

        const details = [
          ["Transaction ID", transaction.transaction_id || "N/A"],
          ["Date", formatDate(transaction.transaction_datetime)],
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
          ["Beneficiary", transaction.beneficiary_name || beneficiaryName || "N/A"],
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
        toast.success("PDF receipt downloaded");
      } catch (err) {
        console.error("PDF export error:", err);
        toast.error("Failed to generate PDF");
      }
    },
    [formatDate, beneficiaryName]
  );

  // Single Excel Export
  const exportTransactionExcel = useCallback(
    (transaction) => {
      try {
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
            Beneficiary: transaction.beneficiary_name || beneficiaryName || "N/A",
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
      } catch (err) {
        console.error("Excel export error:", err);
        toast.error("Failed to export Excel");
      }
    },
    [formatDate, beneficiaryName]
  );

  // Bulk Export (Filtered Transactions) to Excel
  const exportAllFilteredExcel = () => {
    if (filteredTransactions.length === 0) {
      toast.warning("No transactions to export");
      return;
    }
    const data = filteredTransactions.map((tx) => ({
      "Transaction ID": tx.transaction_id || "N/A",
      Date: formatDate(tx.transaction_datetime),
      Direction: tx.direction || "N/A",
      Status: tx.status || "Pending",
      Amount: tx.instructed_amount || 0,
      Currency: tx.currency_code || "",
      Fee: tx.fee_amount || 0,
      "Total Amount": tx.amount_with_fee || "N/A",
      Sender: tx.sender_name || "N/A",
      Beneficiary: tx.beneficiary_name || beneficiaryName || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `beneficiary_transactions_${beneficiaryId}.xlsx`);
    toast.success("All filtered records exported to Excel!");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header and Back navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-white rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
              title="Back"
            >
              <FaArrowLeft size={14} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                All Transactions
              </h1>
              <p className="text-sm text-gray-500">
                {beneficiaryName ? `For beneficiary: ${beneficiaryName}` : `ID: ${beneficiaryId}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportAllFilteredExcel}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
            >
              <FaFileDownload size={13} className="text-gray-500" />
              Export Filtered (Excel)
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Search Input */}
            <div className="lg:col-span-1">
              <label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                <FaSearch className="text-gray-400" size={11} /> Search
              </label>
              <input
                type="text"
                placeholder="ID or sender name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            {/* Direction */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                <FaFilter className="text-gray-400" size={11} /> Direction
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
                value={filterDirection}
                onChange={(e) => {
                  setFilterDirection(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Directions</option>
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 capitalize"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Start Date</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => {
                  setFilterStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">End Date</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => {
                  setFilterEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </div>

          {(searchTerm || filterStatus || filterDirection || filterStartDate || filterEndDate) && (
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={clearAllFilters}
                className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-16 animate-pulse" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-12 bg-white rounded-xl border border-red-200 p-6">
            <p className="text-red-600 font-semibold mb-1">Failed to load transactions</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={fetchAllData}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredTransactions.length === 0 && (
          <div className="text-center py-14 bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-gray-700 font-semibold">No Transactions Found</p>
            <p className="text-gray-400 text-sm mt-1">
              Try adjusting your date range or filters.
            </p>
          </div>
        )}

        {/* Transaction Table / Cards */}
        {!loading && !error && filteredTransactions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {isMobile ? (
              <div className="divide-y divide-gray-100 p-3 space-y-3">
                {paginatedTransactions.map((tx) => (
                  <motion.div
                    key={tx.id || tx.transaction_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-gray-50/50 rounded-lg space-y-2.5"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded flex items-center justify-center border ${
                            tx.direction === "Inbound"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                              : "bg-gray-100 border-gray-200 text-gray-600"
                          }`}
                        >
                          <FaExchangeAlt size={11} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-xs">
                            {tx.transaction_id || "N/A"}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {formatDate(tx.transaction_datetime)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(tx.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-200/60">
                      <div>
                        <span className="text-gray-400 block">Amount</span>
                        <span className="font-semibold text-gray-900">
                          {tx.instructed_amount || 0} {tx.currency_code}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Fee / Total</span>
                        <span className="text-gray-700">
                          {tx.fee_amount || 0} / {tx.amount_with_fee || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-200/60">
                      <span className="text-xs text-gray-500 truncate max-w-[180px]">
                        From: {tx.sender_name || "N/A"}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => exportTransactionPDF(tx)}
                          className="p-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          title="Download PDF"
                        >
                          <FaFilePdf size={12} />
                        </button>
                        <button
                          onClick={() => exportTransactionExcel(tx)}
                          className="p-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          title="Download Excel"
                        >
                          <FaFileExcel size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
                      <th className="py-3 px-4 text-left font-medium">Tx ID</th>
                      <th className="py-3 px-4 text-left font-medium">Date</th>
                      <th className="py-3 px-4 text-left font-medium">Sender</th>
                      <th className="py-3 px-4 text-left font-medium">Direction</th>
                      <th className="py-3 px-4 text-left font-medium">Status</th>
                      <th className="py-3 px-4 text-right font-medium">Amount</th>
                      <th className="py-3 px-4 text-right font-medium">Fee</th>
                      <th className="py-3 px-4 text-right font-medium">Total</th>
                      <th className="py-3 px-4 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {paginatedTransactions.map((tx) => (
                      <tr key={tx.id || tx.transaction_id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-gray-900">
                          {tx.transaction_id || "N/A"}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 text-xs">
                          {formatDate(tx.transaction_datetime)}
                        </td>
                        <td className="py-3.5 px-4 text-gray-700">
                          {tx.sender_name || "N/A"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              tx.direction === "Inbound"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {tx.direction || "N/A"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(tx.status)}</td>
                        <td className="py-3.5 px-4 text-right font-medium text-gray-900">
                          {tx.instructed_amount || 0} {tx.currency_code}
                        </td>
                        <td className="py-3.5 px-4 text-right text-gray-500">
                          {tx.fee_amount || 0}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-gray-900">
                          {tx.amount_with_fee || "N/A"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => exportTransactionPDF(tx)}
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                              title="PDF Receipt"
                            >
                              <FaFilePdf size={13} />
                            </button>
                            <button
                              onClick={() => exportTransactionExcel(tx)}
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                              title="Excel Record"
                            >
                              <FaFileExcel size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
              <span className="text-xs text-gray-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of{" "}
                {filteredTransactions.length} entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-50"
                >
                  <FaChevronLeft size={11} />
                </button>
                <span className="text-xs px-2 text-gray-700 font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-50"
                >
                  <FaChevronRight size={11} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BenefAllTransactions;