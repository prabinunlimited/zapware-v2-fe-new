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

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDirection, setFilterDirection] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Date Formatting Helpers
  const formatDateOnly = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const formatTimeOnly = useCallback((dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

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

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const normalized = (status || "pending").toLowerCase();
    const config = {
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
      failed: "bg-red-50 text-red-700 border-red-200",
      cancelled: "bg-gray-50 text-gray-600 border-gray-200",
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      processing: "bg-blue-50 text-blue-700 border-blue-200",
    };
    const style = config[normalized] || config.pending;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${style}`}
      >
        {status || "Pending"}
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
    [formatFullDate, beneficiaryName]
  );

  // Single Excel Export
  const exportTransactionExcel = useCallback(
    (transaction) => {
      try {
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
    [formatFullDate, beneficiaryName]
  );

  // Bulk Export
  const exportAllFilteredExcel = () => {
    if (filteredTransactions.length === 0) {
      toast.warning("No transactions to export");
      return;
    }
    const data = filteredTransactions.map((tx) => ({
      "Transaction ID": tx.transaction_id || "N/A",
      Date: formatFullDate(tx.transaction_datetime),
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
    <div className="min-h-screen bg-gray-50/50 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header & Back navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-white rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer flex-shrink-0"
              title="Back"
              aria-label="Back"
            >
              <FaArrowLeft size={14} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                All Transactions
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                {beneficiaryName ? `For: ${beneficiaryName}` : `ID: ${beneficiaryId}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportAllFilteredExcel}
              disabled={filteredTransactions.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <FaFileDownload size={13} className="text-gray-500" />
              <span>Export Filtered (Excel)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 sm:p-5 shadow-2xs space-y-3.5 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-1">
              <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                <FaSearch className="text-gray-400" size={10} /> Search
              </label>
              <input
                type="text"
                placeholder="ID or sender name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Direction */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                <FaFilter className="text-gray-400" size={10} /> Direction
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
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
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 capitalize"
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
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Start Date</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => {
                  setFilterStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">End Date</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => {
                  setFilterEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          {(searchTerm || filterStatus || filterDirection || filterStartDate || filterEndDate) && (
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 h-16 sm:h-20 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error View */}
        {error && !loading && (
          <div className="text-center py-10 bg-white rounded-2xl border border-red-200 p-6 shadow-2xs">
            <p className="text-red-600 font-bold text-sm mb-1">Failed to load transactions</p>
            <p className="text-gray-500 text-xs sm:text-sm mb-4">{error}</p>
            <button
              onClick={fetchAllData}
              className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-800 transition-colors cursor-pointer shadow-2xs"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredTransactions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
            <p className="text-gray-700 font-bold text-sm">No Transactions Found</p>
            <p className="text-gray-400 text-xs mt-1">
              Try adjusting your search or date range filters.
            </p>
          </div>
        )}

        {/* Transactions List (Mobile Cards & Desktop Table) */}
        {!loading && !error && filteredTransactions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            {/* MOBILE ONLY: Comprehensive Detail Cards (< 768px) */}
            <div className="block md:hidden p-3 space-y-3">
              {paginatedTransactions.map((tx) => {
                const isOutbound = tx.direction === "Outbound";
                const isInbound = tx.direction === "Inbound";

                return (
                  <div
                    key={tx.id || tx.transaction_id}
                    className="w-full bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3"
                  >
                    {/* 1. Header: Icon + Date & Time + Status */}
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
                            {formatDateOnly(tx.transaction_datetime)}
                          </p>
                          <p className="text-[11px] text-gray-400 font-medium leading-tight mt-0.5">
                            {formatTimeOnly(tx.transaction_datetime)}
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {getStatusBadge(tx.status)}
                      </div>
                    </div>

                    {/* 2. Transaction ID / Ref Number */}
                    <div className="bg-gray-50 px-3 py-2 rounded-xl flex items-center justify-between border border-gray-100 text-xs">
                      <span className="text-[11px] text-gray-400 font-medium">Tx ID:</span>
                      <span className="font-mono text-[11px] font-semibold text-gray-700 break-all select-all">
                        {tx.transaction_id || tx.id || "N/A"}
                      </span>
                    </div>

                    {/* 3. Amounts Grid: Amount, Fee & Total */}
                    <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">
                          Amount
                        </span>
                        <span
                          className={`text-xs sm:text-sm font-bold block ${
                            isOutbound ? "text-red-600" : "text-emerald-600"
                          }`}
                        >
                          {tx.instructed_amount || "0.00"} {tx.currency_code}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">
                          Fee
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-gray-700 block">
                          {tx.fee_amount || "0.00"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">
                          Total
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-gray-900 block">
                          {tx.amount_with_fee || tx.instructed_amount || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* 4. Direction & Sender Row */}
                    <div className="grid grid-cols-2 gap-2 text-xs px-1">
                      <div>
                        <span className="text-[11px] text-gray-400 block">Direction</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 border ${
                            isInbound
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {tx.direction || "N/A"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-400 block">Sender</span>
                        <span className="font-semibold text-gray-800 truncate block mt-0.5">
                          {tx.sender_name || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* 5. Footer Export Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                      <span className="text-[11px] text-gray-400">Download Receipt</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => exportTransactionPDF(tx)}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                          title="Download PDF"
                        >
                          <FaFilePdf size={11} className="text-red-500" />
                          <span className="text-[11px] font-semibold">PDF</span>
                        </button>
                        <button
                          onClick={() => exportTransactionExcel(tx)}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                          title="Download Excel"
                        >
                          <FaFileExcel size={11} className="text-emerald-600" />
                          <span className="text-[11px] font-semibold">XLS</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP ONLY: Full Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4 text-left">Tx ID</th>
                    <th className="py-3.5 px-4 text-left">Date</th>
                    <th className="py-3.5 px-4 text-left">Sender</th>
                    <th className="py-3.5 px-4 text-left">Direction</th>
                    <th className="py-3.5 px-4 text-left">Status</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-right">Fee</th>
                    <th className="py-3.5 px-4 text-right">Total</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {paginatedTransactions.map((tx) => (
                    <tr key={tx.id || tx.transaction_id} className="hover:bg-gray-50/70 transition-colors text-xs sm:text-sm">
                      <td className="py-3.5 px-4 font-mono font-medium text-gray-900 whitespace-nowrap">
                        {tx.transaction_id || tx.id || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                        {formatFullDate(tx.transaction_datetime)}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                        {tx.sender_name || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            tx.direction === "Inbound"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          {tx.direction || "N/A"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(tx.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-gray-900 whitespace-nowrap">
                        {tx.instructed_amount || 0} {tx.currency_code}
                      </td>
                      <td className="py-3.5 px-4 text-right text-gray-500 whitespace-nowrap">
                        {tx.fee_amount || 0}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-gray-900 whitespace-nowrap">
                        {tx.amount_with_fee || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => exportTransactionPDF(tx)}
                            className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                            title="PDF Receipt"
                            aria-label="PDF Receipt"
                          >
                            <FaFilePdf size={13} className="text-red-600" />
                          </button>
                          <button
                            onClick={() => exportTransactionExcel(tx)}
                            className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Excel Record"
                            aria-label="Excel Record"
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

            {/* Pagination Controls Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50/50">
              <span className="text-xs text-gray-500 order-2 sm:order-1 text-center sm:text-left">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of{" "}
                {filteredTransactions.length} entries
              </span>
              <div className="flex items-center gap-1.5 order-1 sm:order-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer"
                  aria-label="Previous Page"
                >
                  <FaChevronLeft size={11} />
                </button>
                <span className="text-xs px-2 text-gray-700 font-semibold">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer"
                  aria-label="Next Page"
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