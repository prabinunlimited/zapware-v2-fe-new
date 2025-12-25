import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaFilePdf,
  FaFileExcel,
  FaInfoCircle,
  FaArrowLeft,
  FaFilter,
  FaSearch,
  FaDownload,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PropTypes from "prop-types";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import autoTable from "jspdf-autotable";
import logoPath from "../../../../assets/images/Logo/unlimited remit logo.png";
import TransactionDetailsPopup from "../../../PopupModal/TransactionDetailsPopup";

// Redux imports
import {
  fetchTransactionDetails,
  exportTransactionsToExcel,
  selectTransactions,
  selectTransactionLoading,
  selectTransactionError,
  clearTransactions,
  resetTransactionState,
} from "../Transaction/TransactionSlice";

const AllTransactions = () => {
  const { customerId, selectedCurrencyCode } = useParams();
  
  // Redux hooks
  const dispatch = useDispatch();
  const transactions = useSelector(selectTransactions);
  const loading = useSelector(selectTransactionLoading);
  const error = useSelector(selectTransactionError);

  // Local state for filters and UI
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filterTransactionId, setFilterTransactionId] = useState("");
  const [filterDirection, setFilterDirection] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;
  const apiClient = axios.create({
    baseURL: API_URL,
  });
  const bearertoken = localStorage.getItem("bearertoken");
  const navigate = useNavigate();
  const transactionsPerPage = 10;

  // Fetch transactions on mount
  useEffect(() => {
    if (customerId && selectedCurrencyCode) {
      dispatch(
        fetchTransactionDetails({ 
          customerId, 
          currencyCode: selectedCurrencyCode 
        })
      ).then((result) => {
        if (result.payload) {
          toast.success("Transactions have been successfully imported.");
        }
      }).catch(() => {
        toast.error("There was an error importing transactions.");
      });
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearTransactions());
    };
  }, [customerId, selectedCurrencyCode, dispatch]);

  // Handle errors from Redux
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Apply filters when transactions or filter criteria change
  useEffect(() => {
    let filtered = [...transactions];

    // Filter by Inbound / Outbound
    if (filterDirection) {
      filtered = filtered.filter(
        (transaction) => transaction?.direction === filterDirection
      );
    }

    // Filter by Transaction ID
    if (filterTransactionId) {
      filtered = filtered.filter((transaction) =>
        transaction?.transaction_id?.includes(filterTransactionId)
      );
    }

    // Filter by Date Range
    if (filterStartDate && filterEndDate) {
      filtered = filtered.filter((transaction) => {
        const transactionDate = new Date(transaction?.transaction_datetime);
        const startDate = new Date(filterStartDate);
        const endDate = new Date(filterEndDate);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }
    
    setCurrentPage(1);
    setFilteredTransactions(filtered);
  }, [
    filterDirection,
    filterTransactionId,
    filterStartDate,
    filterEndDate,
    transactions,
  ]);

  // Calculate the index range for transactions to display
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;

  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Pagination logic
  const totalPages = Math.ceil(
    filteredTransactions.length / transactionsPerPage
  );

  const handlePopup = (transaction) => {
    setPopupMessage(transaction);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  // ===== COMPLETED EXPORT FUNCTIONS =====

  const exportTransactionPDF = async (transaction) => {
    try {
      setExportLoading(true);
      
      const doc = new jsPDF();
      
      // Add logo
      const logoWidth = 40;
      const logoHeight = 20;
      doc.addImage(logoPath, 'PNG', 10, 10, logoWidth, logoHeight);
      
      // Title
      doc.setFontSize(18);
      doc.text("Transaction Receipt", 105, 20, { align: "center" });
      
      // Transaction Details
      doc.setFontSize(12);
      let yPosition = 40;
      
      const details = [
        { label: "Transaction ID:", value: transaction.transaction_id || "N/A" },
        { label: "Date:", value: new Date(transaction.transaction_datetime).toLocaleString() },
        { label: "Direction:", value: transaction.direction },
        { label: "Status:", value: transaction.status || "Pending" },
        { label: "Currency:", value: transaction.currency_code },
        { label: "Amount:", value: `${transaction.instructed_amount} ${transaction.currency_code}` },
        { label: "Fee Amount:", value: transaction.fee_amount },
        { label: "Total Amount:", value: transaction.amount_with_fee },
        { label: "Balance:", value: Number(transaction.balance).toFixed(2) },
        { label: "Sender:", value: transaction.sender_name },
        { label: "Beneficiary:", value: transaction.beneficiary_name || "N/A" },
        { label: "Service Provider Fee:", value: transaction.service_provider_fee || "N/A" },
      ];
      
      details.forEach(detail => {
        doc.text(`${detail.label} ${detail.value}`, 14, yPosition);
        yPosition += 10;
      });
      
      // Footer
      doc.setFontSize(10);
      doc.text("Generated by Unlimited Remit", 105, 280, { align: "center" });
      doc.text(new Date().toLocaleDateString(), 105, 285, { align: "center" });
      
      // Save PDF
      doc.save(`transaction_${transaction.transaction_id || transaction.id}.pdf`);
      
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setExportLoading(false);
    }
  };

  const exportTransactionReceiptPDF = async (transactionId) => {
    try {
      setExportLoading(true);
      
      // Generate receipt using backend API
      const response = await apiClient.get(
        `/transactions/generate-receipt/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${bearertoken}`,
          },
        }
      );
      
      // Create PDF from response
      const doc = new jsPDF();
      autoTable(doc, {
        head: [["Transaction Receipt"]],
        body: Object.entries(response.data).map(([key, value]) => [
          key.replace(/_/g, ' ').toUpperCase(),
          value
        ]),
      });
      
      doc.save(`receipt_${transactionId}.pdf`);
      toast.success("Receipt PDF exported successfully!");
    } catch (error) {
      console.error("Error generating receipt:", error);
      toast.error("Failed to generate receipt");
    } finally {
      setExportLoading(false);
    }
  };

  const exportTransactionReceiptPDFNew = useCallback(async (transactionId) => {
    try {
      setExportLoading(true);

      // Request the PDF as a blob
      const response = await apiClient.get(
        `/transactions/generate-receipt-blob/${transactionId}`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${bearertoken}`,
          },
        }
      );

      // Create a blob URL from the response data
      const blob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);

      // Create a temporary download link
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `receipt_${transactionId}.pdf`; // 👈 Forces download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("Error generating receipt:", error);
      toast.error("Failed to generate receipt");
    } finally {
      setExportLoading(false);
    }
  }, [bearertoken]);

  const exportTransactionExcel = (transaction) => {
    try {
      setExportLoading(true);
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet([{
        "Transaction ID": transaction.transaction_id || "N/A",
        "Date": new Date(transaction.transaction_datetime).toLocaleString(),
        "Direction": transaction.direction,
        "Status": transaction.status || "Pending",
        "Currency": transaction.currency_code,
        "Amount": transaction.instructed_amount,
        "Fee Amount": transaction.fee_amount,
        "Total Amount": transaction.amount_with_fee,
        "Balance": Number(transaction.balance).toFixed(2),
        "Sender": transaction.sender_name,
        "Beneficiary": transaction.beneficiary_name || "N/A",
        "Service Provider Fee": transaction.service_provider_fee || "N/A",
      }]);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transaction");
      
      // Generate Excel file
      XLSX.writeFile(workbook, `transaction_${transaction.transaction_id || transaction.id}.xlsx`);
      
      toast.success("Excel file exported successfully!");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error("Failed to export Excel");
    } finally {
      setExportLoading(false);
    }
  };

  // Export all filtered transactions to Excel
  const exportAllFilteredToExcel = () => {
    try {
      setExportLoading(true);
      
      if (filteredTransactions.length === 0) {
        toast.warning("No transactions to export");
        return;
      }
      
      // Prepare data
      const data = filteredTransactions.map((transaction) => ({
        "Transaction ID": transaction.transaction_id || "N/A",
        "Date": new Date(transaction.transaction_datetime).toLocaleString(),
        "Direction": transaction.direction,
        "Status": transaction.status || "Pending",
        "Currency": transaction.currency_code,
        "Amount": transaction.instructed_amount,
        "Fee Amount": transaction.fee_amount,
        "Total Amount": transaction.amount_with_fee,
        "Balance": Number(transaction.balance).toFixed(2),
        "Sender": transaction.sender_name,
        "Beneficiary": transaction.beneficiary_name || "N/A",
        "Service Provider Fee": transaction.service_provider_fee || "N/A",
      }));
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
      
      // Generate Excel file
      XLSX.writeFile(workbook, `all_transactions_${selectedCurrencyCode}.xlsx`);
      
      toast.success(`${filteredTransactions.length} transactions exported to Excel!`);
    } catch (error) {
      console.error("Error exporting all transactions:", error);
      toast.error("Failed to export transactions");
    } finally {
      setExportLoading(false);
    }
  };

  // Export to Excel using Redux (exports ALL transactions, not filtered)
  const handleExportToExcel = useCallback(() => {
    if (customerId) {
      dispatch(exportTransactionsToExcel({ customerId }))
        .unwrap()
        .then((result) => {
          if (result.success) {
            toast.success(`Exported ${result.count} transactions to Excel`);
          }
        })
        .catch((err) => {
          toast.error("Failed to export to Excel");
        });
    }
  }, [customerId, dispatch]);

  // Mobile-friendly action buttons component
  const ActionButtons = ({ transaction }) => (
    <div className="flex flex-wrap gap-2 justify-center">
      <button
        className="flex items-center justify-center p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 text-xs sm:text-sm"
        onClick={() => exportTransactionReceiptPDFNew(transaction.id)}
        title="Export Receipt as PDF"
        disabled={exportLoading}
      >
        <FaFilePdf size={14} className="sm:mr-1" />
        <span className="hidden sm:inline">Receipt</span>
      </button>

      {/* <button
        className="flex items-center justify-center p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all duration-300 text-xs sm:text-sm"
        onClick={() => exportTransactionPDF(transaction)}
        title="Export Details as PDF"
        disabled={exportLoading}
      >
        <FaFilePdf size={14} className="sm:mr-1" />
        <span className="hidden sm:inline">PDF</span>
      </button> */}

      <button
        className="flex items-center justify-center p-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-all duration-300 text-xs sm:text-sm"
        title="View Details"
        onClick={() => handlePopup(transaction)}
      >
        <FaInfoCircle size={14} className="sm:mr-1" />
        <span className="hidden sm:inline">Details</span>
      </button>
    </div>
  );

  // Mobile table row component
  const MobileTransactionRow = ({ transaction }) => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-3 border border-gray-200">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="font-semibold text-gray-600">Date:</span>
          <p className="truncate">
            {new Date(transaction.transaction_datetime).toLocaleDateString()}
          </p>
        </div>
        <div>
          <span className="font-semibold text-gray-600">ID:</span>
          <p className="truncate">{transaction.transaction_id || "N/A"}</p>
        </div>
        <div>
          <span className="font-semibold text-gray-600">Direction:</span>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${
              transaction.direction === "Inbound"
                ? "bg-green-500"
                : "bg-sky-600"
            }`}
          >
            {transaction.direction}
          </span>
        </div>
        <div>
          <span className="font-semibold text-gray-600">Status:</span>
          <p>{transaction.status || "Pending"}</p>
        </div>
        <div className="col-span-2">
          <span className="font-semibold text-gray-600">Sender:</span>
          <p className="truncate">{transaction.sender_name}</p>
        </div>
        <div>
          <span className="font-semibold text-gray-600">Amount:</span>
          <p>
            {transaction.instructed_amount} {transaction.currency_code}
          </p>
        </div>
        <div>
          <span className="font-semibold text-gray-600">Fees:</span>
          <p>{transaction.fee_amount}</p>
        </div>
        <div className="col-span-2">
          <span className="font-semibold text-gray-600">Total Amount:</span>
          <p className={transaction.direction === "Outbound" ? "text-red-600" : "text-green-600"}>
            {transaction.amount_with_fee}
          </p>
        </div>
        <div className="col-span-2">
          <span className="font-semibold text-gray-600">Balance:</span>
          <p>{Number(transaction.balance).toFixed(2)}</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200">
        <ActionButtons transaction={transaction} />
      </div>
    </div>
  );

  // Export All Button Component
  const ExportAllButton = () => (
    <button
      onClick={exportAllFilteredToExcel}
      disabled={exportLoading || filteredTransactions.length === 0}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {exportLoading ? (
        <ClipLoader size={16} color="white" />
      ) : (
        <>
          <FaDownload />
          <span>Export All ({filteredTransactions.length})</span>
        </>
      )}
    </button>
  );

  return (
    <div className="transaction-table p-4 sm:p-6 lg:p-8 bg-gradient-to-r from-gray-100 via-gray-200 to-white min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-sky-900 tracking-wide">
            Transaction Details
          </h2>
          <p className="text-gray-600 mt-1">
            Currency: <span className="font-bold">{selectedCurrencyCode}</span> | 
            Customer ID: <span className="font-bold">{customerId}</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <ExportAllButton />
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors duration-200 text-sm sm:text-base"
          >
            <FaArrowLeft className="text-blue-600" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Transactions</p>
          <p className="text-2xl font-bold">{filteredTransactions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Inbound</p>
          <p className="text-2xl font-bold text-green-600">
            {filteredTransactions.filter(t => t.direction === "Inbound").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Outbound</p>
          <p className="text-2xl font-bold text-sky-600">
            {filteredTransactions.filter(t => t.direction === "Outbound").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Current Page</p>
          <p className="text-2xl font-bold">
            {currentPage} / {totalPages}
          </p>
        </div>
      </div>

      {/* Filter Toggle for Mobile */}
      <div className="sm:hidden mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 w-full justify-center px-4 py-3 bg-white rounded-lg shadow-md border border-gray-300"
        >
          <FaFilter />
          <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
        </button>
      </div>

      {/* Filter Section */}
      <div
        className={`bg-white p-4 shadow-md rounded-lg mb-6 ${
          showFilters ? "block" : "hidden sm:block"
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Transaction Direction Filter */}
          <div className="flex flex-col">
            <label className="text-gray-600 text-sm mb-1 font-medium">
              Direction
            </label>
            <select
              className="border border-gray-300 p-2 rounded-md shadow-sm focus:ring focus:ring-blue-300 text-sm"
              value={filterDirection}
              onChange={(e) => setFilterDirection(e.target.value)}
            >
              <option value="">All Directions</option>
              <option value="Inbound">Inbound</option>
              <option value="Outbound">Outbound</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex flex-col">
            <label className="text-gray-600 text-sm mb-1 font-medium">
              Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                className="border border-gray-300 p-2 rounded-md shadow-sm focus:ring focus:ring-blue-300 text-sm w-full"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
              <input
                type="date"
                className="border border-gray-300 p-2 rounded-md shadow-sm focus:ring focus:ring-blue-300 text-sm w-full"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Transaction ID Search */}
          <div className="flex flex-col sm:col-span-2 lg:col-span-1">
            <label className="text-gray-600 text-sm mb-1 font-medium">
              Search Transaction ID
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Enter Transaction ID..."
                className="border border-gray-300 p-2 pl-10 rounded-md shadow-sm focus:ring focus:ring-blue-300 w-full text-sm"
                value={filterTransactionId}
                onChange={(e) => setFilterTransactionId(e.target.value)}
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex flex-col">
            <button
              onClick={() => {
                setFilterDirection("");
                setFilterTransactionId("");
                setFilterStartDate("");
                setFilterEndDate("");
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <ClipLoader size={50} color="#4C94B0" loading={loading} />
          <span className="ml-3 text-gray-600">Loading transactions...</span>
        </div>
      ) : filteredTransactions.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse">
                  <thead className="bg-gradient-to-r from-sky-700 to-sky-800 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-sm lg:text-base">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-sm lg:text-base">
                        Transaction ID
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-sm lg:text-base">
                        Direction
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-sm lg:text-base">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-sm lg:text-base">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-sm lg:text-base">
                        Fees
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-sm lg:text-base">
                        Total Amt
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-sm lg:text-base">
                        Balance
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-sm lg:text-base">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-800">
                    {currentTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-4 py-3 text-sm">
                          {new Date(
                            transaction.transaction_datetime
                          ).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm truncate max-w-[150px]">
                          {transaction.transaction_id || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${
                              transaction.direction === "Inbound"
                                ? "bg-green-500"
                                : "bg-red-600"
                            }`}
                          >
                            {transaction.direction}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm capitalize">
                          {transaction.status || "Pending"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={
                              transaction.direction === "Outbound"
                                ? "text-red-600"
                                : "text-green-600"
                            }
                          >
                            {transaction.instructed_amount}{" "}
                            {transaction.currency_code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={
                              transaction.direction === "Outbound"
                                ? "text-red-600"
                                : "text-green-600"
                            }
                          >
                            {transaction.fee_amount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={
                              transaction.direction === "Outbound"
                                ? "text-red-600"
                                : "text-green-600"
                            }
                          >
                            {transaction.amount_with_fee}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {Number(transaction.balance).toFixed(2)}
                        </td>

                        <td className="px-4 py-3">
                          <ActionButtons transaction={transaction} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {currentTransactions.map((transaction) => (
              <MobileTransactionRow
                key={transaction.id}
                transaction={transaction}
              />
            ))}
          </div>

          {/* Popup */}
          {isPopupOpen && (
            <TransactionDetailsPopup
              closePopup={closePopup}
              transaction={popupMessage}
            />
          )}

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 bg-gray-100 p-3 rounded-lg shadow gap-3">
            <button
              className={`px-4 py-2 rounded-lg transition-all duration-300 w-full sm:w-auto text-sm ${
                currentPage === 1
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-slate-600 text-white hover:bg-slate-400"
              }`}
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <span className="text-gray-700 font-medium text-sm text-center">
              Page {currentPage} of {totalPages}
              <br className="sm:hidden" />
              <span className="hidden sm:inline"> • </span>
              Showing {currentTransactions.length} of {filteredTransactions.length} transactions
            </span>

            <button
              className={`px-4 py-2 rounded-lg transition-all duration-300 w-full sm:w-auto text-sm ${
                currentPage === totalPages
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-sky-700 text-white hover:bg-sky-600"
              }`}
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-lg">
            No transaction details available.
          </p>
          {transactions.length > 0 && filteredTransactions.length === 0 && (
            <p className="text-gray-500 mt-2">
              Try adjusting your filters to see results
            </p>
          )}
        </div>
      )}

      {/* ToastContainer */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

AllTransactions.propTypes = {
  customerId: PropTypes.string,
  selectedCurrencyCode: PropTypes.string,
};

export default AllTransactions;