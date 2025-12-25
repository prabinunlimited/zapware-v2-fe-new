import React, { useEffect, useMemo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import RingLoader from "react-spinners/RingLoader";
import { useNavigate } from "react-router-dom";
import {
  FaFileExport,
  FaFilePdf,
  FaFileExcel,
  FaFileCsv,
  FaPrint,
  FaChevronDown,
  FaDownload,
  FaReceipt,
  FaCalendarAlt,
  FaListAlt,
} from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ✅ USE THE NEW HOOK
import { useTransactionData } from "../../../../hooks/transactionHooks";

const TransactionDetails = React.memo(
  ({ customerId, selectedCurrencyCode, onTransactionComplete }) => {
    const navigate = useNavigate();

    // ✅ USE TRANSACTION HOOK
    const { transactions, loading, error, fetchTransactions, forceRefresh } =
      useTransactionData();

    // Local state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [transactionCompletionNotified, setTransactionCompletionNotified] =
      useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [exportType, setExportType] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exportingTransactionId, setExportingTransactionId] = useState(null);

    // Memoized transaction data
    const currentTransactions = useMemo(() => {
      const safeTransactions = Array.isArray(transactions) ? transactions : [];
      const indexOfLastItem = currentPage * itemsPerPage;
      const indexOfFirstItem = indexOfLastItem - itemsPerPage;
      return safeTransactions.slice(indexOfFirstItem, indexOfLastItem);
    }, [transactions, currentPage, itemsPerPage]);

    const totalPages = useMemo(
      () =>
        Math.ceil(
          (Array.isArray(transactions) ? transactions.length : 0) / itemsPerPage
        ),
      [transactions.length, itemsPerPage]
    );

    // Fetch transactions
    useEffect(() => {
      if (
        !customerId ||
        !selectedCurrencyCode ||
        selectedCurrencyCode === "all"
      ) {
        return;
      }

      fetchTransactions(customerId, selectedCurrencyCode);
    }, [customerId, selectedCurrencyCode, fetchTransactions]);

    // Reset pagination when currency changes
    useEffect(() => {
      setCurrentPage(1);
      setTransactionCompletionNotified(false);
    }, [selectedCurrencyCode]);

    // Handle transaction completion
    useEffect(() => {
      if (
        onTransactionComplete &&
        transactions.length > 0 &&
        !loading &&
        !transactionCompletionNotified
      ) {
        setTransactionCompletionNotified(true);
        onTransactionComplete(false);
      }
    }, [
      transactions,
      onTransactionComplete,
      loading,
      transactionCompletionNotified,
    ]);

    // Utility functions
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

    const formatDateOnly = useCallback((dateString) => {
      try {
        return new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
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

    // File name generators
    const generateBulkFileName = useCallback(
      (format) => {
        const date = new Date().toISOString().split("T")[0];
        const currency = selectedCurrencyCode || "all";
        return `transactions_${currency}_${date}.${format}`;
      },
      [selectedCurrencyCode]
    );

    const generateSingleFileName = useCallback(
      (transaction, format) => {
        const date = new Date(transaction.transaction_datetime)
          .toISOString()
          .split("T")[0];
        const txId = transaction.transaction_id?.substring(0, 8) || "tx";
        const amount = transaction.instructed_amount || "0";
        const currency = transaction.currency_code || selectedCurrencyCode;
        return `transaction_${txId}_${amount}${currency}_${date}.${format}`;
      },
      [selectedCurrencyCode]
    );

    const exportSingleTransactionPDF = useCallback(
      async (transaction) => {
        if (!transaction) return;

        setExportingTransactionId(transaction.id);

        try {
          // Check if transaction_id is available
          if (!transaction.transaction_id) {
            throw new Error("Transaction ID is missing");
          }

          // Get authentication token
          const bearertoken =
            localStorage.getItem("bearertoken") ||
            localStorage.getItem("authtoken");
          if (!bearertoken) {
            throw new Error("Authentication token not found");
          }

          // Call the API to generate PDF receipt - EXACTLY LIKE THE OTHER COMPONENT
          const API_URL = import.meta.env.VITE_API_URL;
          const response = await fetch(
            `${API_URL}/transactions/generate-receipt-blob/${transaction.id}`,
            {
              responseType: "blob",
              headers: {
                Authorization: `Bearer ${bearertoken}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              `API request failed with status ${response.status}`
            );
          }

          // Get the PDF blob
          const blob = await response.blob();

          // Check if it's actually a PDF
          if (!blob.type.includes("pdf")) {
            throw new Error("Server did not return a valid PDF file");
          }

          // Create a blob URL from the response data (EXACTLY LIKE THE OTHER COMPONENT)
          const downloadUrl = window.URL.createObjectURL(blob);

          // Create a temporary download link
          const link = document.createElement("a");
          link.href = downloadUrl;

          // Generate filename - keep your existing naming convention
          const fileName = generateSingleFileName(transaction, "pdf");
          link.download = fileName; // This forces download

          // Trigger download
          document.body.appendChild(link);
          link.click();

          // Clean up
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);

          console.log("✅ PDF downloaded successfully from API");
        } catch (error) {
          console.error("Single PDF export failed:", error);

          // Enhanced error handling
          let errorMessage = "Failed to download receipt. Please try again.";

          if (error.message.includes("401")) {
            errorMessage = "Session expired. Please log in again.";
          } else if (error.message.includes("403")) {
            errorMessage =
              "You don't have permission to download this receipt.";
          } else if (error.message.includes("404")) {
            errorMessage =
              "Receipt generation service is currently unavailable.";
          } else if (
            error.message.includes("missing") ||
            error.message.includes("Transaction ID")
          ) {
            errorMessage =
              "Transaction ID is missing. Cannot generate receipt.";
          }

          alert(errorMessage);
        } finally {
          setExportingTransactionId(null);
        }
      },
      [generateSingleFileName] // Only need this dependency
    );

    const exportSingleTransactionExcel = useCallback(
      (transaction) => {
        if (!transaction) return;

        setExportingTransactionId(transaction.id);

        try {
          const wb = XLSX.utils.book_new();

          // Main details sheet
          const detailsData = [
            ["TRANSACTION RECEIPT"],
            [""],
            ["Transaction ID:", transaction.transaction_id || "N/A"],
            ["Date & Time:", formatDate(transaction.transaction_datetime)],
            ["Amount:", transaction.instructed_amount || "0"],
            ["Currency:", transaction.currency_code || selectedCurrencyCode],
            ["Type:", transaction.particulars || "N/A"],
            ["Status:", transaction.status || "Unknown"],
            ["Direction:", transaction.direction || "N/A"],
            ["Fee:", transaction.fee_amount || "0"],
            [
              "Total Amount:",
              transaction.amount_with_fee || transaction.instructed_amount,
            ],
            ["Balance:", transaction.balance || "0"],
            [""],
            ["SENDER DETAILS"],
            ["Name:", transaction.sender_name || "N/A"],
            ["Account:", transaction.sender_iban || "N/A"],
            [""],
            ["BENEFICIARY DETAILS"],
            ["Name:", transaction.beneficiary_name || "N/A"],
            ["Account:", transaction.beneficiary_iban || "N/A"],
            [""],
            ["ADDITIONAL INFO"],
            ["Reference:", transaction.external_reference || "N/A"],
            [
              "Created:",
              transaction.created_at
                ? formatDate(transaction.created_at)
                : "N/A",
            ],
            ["Description:", transaction.description || "N/A"],
          ];

          const wsDetails = XLSX.utils.aoa_to_sheet(detailsData);
          wsDetails["!cols"] = [{ wch: 25 }, { wch: 40 }];

          // Add metadata
          wb.Props = {
            Title: `Transaction ${transaction.transaction_id}`,
            Subject: "Transaction Receipt",
            Author: "Your App",
            CreatedDate: new Date(),
          };

          XLSX.utils.book_append_sheet(wb, wsDetails, "Receipt");
          XLSX.writeFile(wb, generateSingleFileName(transaction, "xlsx"));
        } catch (error) {
          console.error("Single Excel export failed:", error);
          alert("Failed to generate Excel file. Please try again.");
        } finally {
          setExportingTransactionId(null);
        }
      },
      [formatDate, selectedCurrencyCode, generateSingleFileName]
    );

    // BULK EXPORT FUNCTIONS (existing but enhanced)

    const exportBulkPDF = useCallback(async () => {
      if (!transactions.length) return;

      setExportLoading(true);
      setExportType("pdf");

      try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("Transaction History Report", pageWidth / 2, 20, {
          align: "center",
        });

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Currency: ${selectedCurrencyCode || "All"}`,
          pageWidth / 2,
          30,
          { align: "center" }
        );
        doc.text(
          `Generated: ${new Date().toLocaleString()}`,
          pageWidth / 2,
          37,
          { align: "center" }
        );
        doc.text(
          `Total Transactions: ${transactions.length}`,
          pageWidth / 2,
          44,
          { align: "center" }
        );

        // Table Data
        const tableData = transactions.map((tx) => [
          formatDateOnly(tx.transaction_datetime),
          tx.transaction_id?.substring(0, 10) + "..." || "N/A",
          tx.direction || "N/A",
          `${tx.instructed_amount || "0"} ${tx.currency_code}`,
          tx.balance || "0",
          tx.status || "Unknown",
        ]);

        autoTable(doc, {
          startY: 55,
          head: [
            [
              "Date",
              "Transaction ID",
              "Direction",
              "Amount",
              "Balance",
              "Status",
            ],
          ],
          body: tableData,
          theme: "grid",
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: "bold",
          },
          bodyStyles: { fontSize: 9 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
          );
        }

        doc.save(generateBulkFileName("pdf"));
      } catch (error) {
        console.error("Bulk PDF export failed:", error);
        alert("Failed to generate PDF. Please try again.");
      } finally {
        setExportLoading(false);
        setExportType(null);
        setShowExportMenu(false);
      }
    }, [
      transactions,
      selectedCurrencyCode,
      formatDateOnly,
      generateBulkFileName,
    ]);

    const exportBulkExcel = useCallback(() => {
      if (!transactions.length) return;

      setExportLoading(true);
      setExportType("excel");

      try {
        const wb = XLSX.utils.book_new();

        // Summary sheet
        const summaryData = [
          ["TRANSACTION HISTORY REPORT"],
          [`Currency: ${selectedCurrencyCode || "All"}`],
          [`Generated: ${new Date().toLocaleString()}`],
          [`Total Transactions: ${transactions.length}`],
          [""],
          ["TRANSACTION LIST"],
        ];

        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

        // Detailed sheet
        const detailedData = transactions.map((tx) => ({
          Date: formatDate(tx.transaction_datetime),
          "Transaction ID": tx.transaction_id || "N/A",
          Description: tx.beneficiary_name || tx.sender_name || "N/A",
          Direction: tx.direction || "N/A",
          Amount: tx.instructed_amount || "0",
          Currency: tx.currency_code || selectedCurrencyCode,
          Fee: tx.fee_amount || "0",
          Total: tx.amount_with_fee || tx.instructed_amount,
          Balance: tx.balance || "0",
          Status: tx.status || "Unknown",
          Reference: tx.external_reference || "N/A",
          Sender: tx.sender_name || "N/A",
          Beneficiary: tx.beneficiary_name || "N/A",
        }));

        const wsDetails = XLSX.utils.json_to_sheet(detailedData);
        wsDetails["!cols"] = [
          { wch: 20 },
          { wch: 25 },
          { wch: 25 },
          { wch: 15 },
          { wch: 15 },
          { wch: 10 },
          { wch: 12 },
          { wch: 15 },
          { wch: 15 },
          { wch: 12 },
          { wch: 25 },
          { wch: 25 },
          { wch: 25 },
        ];

        wb.Props = {
          Title: `Transaction Report - ${selectedCurrencyCode || "All"}`,
          Subject: "Transaction History",
          Author: "Your App",
          CreatedDate: new Date(),
        };

        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
        XLSX.utils.book_append_sheet(wb, wsDetails, "Transactions");
        XLSX.writeFile(wb, generateBulkFileName("xlsx"));
      } catch (error) {
        console.error("Bulk Excel export failed:", error);
        alert("Failed to generate Excel file. Please try again.");
      } finally {
        setExportLoading(false);
        setExportType(null);
        setShowExportMenu(false);
      }
    }, [transactions, selectedCurrencyCode, formatDate, generateBulkFileName]);

    const exportBulkCSV = useCallback(() => {
      if (!transactions.length) return;

      setExportLoading(true);
      setExportType("csv");

      try {
        const exportData = transactions.map((transaction) => ({
          "Date & Time": formatDate(transaction.transaction_datetime),
          "Transaction ID": transaction.transaction_id || "N/A",
          Description:
            transaction.beneficiary_name || transaction.sender_name || "N/A",
          Direction: transaction.direction || "N/A",
          Amount: transaction.instructed_amount || "0",
          Currency: transaction.currency_code || selectedCurrencyCode,
          Fee: transaction.fee_amount || "0",
          "Total Amount":
            transaction.amount_with_fee || transaction.instructed_amount,
          Balance: transaction.balance || "0",
          Status: transaction.status || "Unknown",
          Reference: transaction.external_reference || "N/A",
          Sender: transaction.sender_name || "N/A",
          Beneficiary: transaction.beneficiary_name || "N/A",
        }));

        const headers = Object.keys(exportData[0]).join(",");
        const csvRows = exportData.map((row) =>
          Object.values(row)
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(",")
        );
        const csvContent = [headers, ...csvRows].join("\n");

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", generateBulkFileName("csv"));
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Bulk CSV export failed:", error);
        alert("Failed to generate CSV. Please try again.");
      } finally {
        setExportLoading(false);
        setExportType(null);
        setShowExportMenu(false);
      }
    }, [transactions, selectedCurrencyCode, formatDate, generateBulkFileName]);

    const printBulkTransactions = useCallback(() => {
      if (!transactions.length) return;

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Transaction Report - ${selectedCurrencyCode}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #1F2937; margin: 0; }
            .subtitle { color: #6B7280; margin: 5px 0 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #3B82F6; color: white; padding: 12px; text-align: left; font-weight: 600; }
            td { padding: 12px; border-bottom: 1px solid #E5E7EB; }
            .footer { margin-top: 40px; text-align: center; color: #6B7280; font-size: 12px; border-top: 1px solid #E5E7EB; padding-top: 20px; }
            @media print {
              @page { margin: 0.5in; }
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Transaction History Report</h1>
            <p class="subtitle">Currency: ${
              selectedCurrencyCode || "All"
            } | Generated: ${new Date().toLocaleString()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Transaction ID</th>
                <th>Direction</th>
                <th>Amount</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${transactions
                .map(
                  (transaction) => `
                <tr>
                  <td>${formatDate(transaction.transaction_datetime)}</td>
                  <td>${transaction.transaction_id || "N/A"}</td>
                  <td>${transaction.direction || "N/A"}</td>
                  <td>${transaction.instructed_amount || "0"} ${
                    transaction.currency_code
                  }</td>
                  <td>${transaction.balance || "0"}</td>
                  <td>${transaction.status || "Unknown"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Generated by Your App • ${new Date().toLocaleString()} • ${
        transactions.length
      } transactions</p>
          </div>
          
          <div class="no-print" style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #3B82F6; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
              Print Report
            </button>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");
      printWindow.document.write(printContent);
      printWindow.document.close();

      setShowExportMenu(false);
    }, [transactions, selectedCurrencyCode, formatDate]);

    // Export handlers
    const handleBulkExport = useCallback(
      (type) => {
        switch (type) {
          case "pdf":
            exportBulkPDF();
            break;
          case "excel":
            exportBulkExcel();
            break;
          case "csv":
            exportBulkCSV();
            break;
          case "print":
            printBulkTransactions();
            break;
          default:
            break;
        }
      },
      [exportBulkPDF, exportBulkExcel, exportBulkCSV, printBulkTransactions]
    );

    const handleSingleExport = useCallback(
      (transaction, type) => {
        switch (type) {
          case "pdf":
            exportSingleTransactionPDF(transaction);
            break;
          case "excel":
            exportSingleTransactionExcel(transaction);
            break;
          default:
            break;
        }
      },
      [exportSingleTransactionPDF, exportSingleTransactionExcel]
    );

    // Individual transaction export menu component
    const TransactionExportMenu = ({ transaction }) => {
      const [showMenu, setShowMenu] = useState(false);

      return (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={exportingTransactionId === transaction.id}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Export this transaction"
          >
            {exportingTransactionId === transaction.id ? (
              <RingLoader size={14} color="#3B82F6" />
            ) : (
              <FaDownload />
            )}
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-3 border-b border-gray-100">
                <p className="font-medium text-gray-800 text-sm">
                  Export Options
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {transaction.transaction_id?.substring(0, 10)}...
                </p>
              </div>

              <div className="py-2">
                <button
                  onClick={() => {
                    handleSingleExport(transaction, "pdf");
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-left text-sm"
                >
                  <FaFilePdf className="text-red-500" />
                  <div>
                    <p className="font-medium text-gray-800">PDF Receipt</p>
                    <p className="text-xs text-gray-500">Official format</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    handleSingleExport(transaction, "excel");
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-green-50 text-left text-sm"
                >
                  <FaFileExcel className="text-green-500" />
                  <div>
                    <p className="font-medium text-gray-800">Excel Sheet</p>
                    <p className="text-xs text-gray-500">With details</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      );
    };

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

    const handleManualRefresh = useCallback(() => {
      if (!customerId || !selectedCurrencyCode) return;
      setTransactionCompletionNotified(false);
      forceRefresh(customerId, selectedCurrencyCode);
    }, [customerId, selectedCurrencyCode, forceRefresh]);

    const pageNumbers = useMemo(() => {
      const pages = [];
      const maxVisiblePages = 5;

      let startPage = Math.max(
        1,
        currentPage - Math.floor(maxVisiblePages / 2)
      );
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      return pages;
    }, [currentPage, totalPages]);

    const safeTransactions = Array.isArray(transactions) ? transactions : [];

    if (loading) {
      return (
        <div className="flex justify-center items-center h-32">
          <div className="w-full h-32 flex flex-col items-center justify-center">
            <RingLoader color="#3B82F6" size={40} />
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

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Transaction History
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              View and manage your transaction records
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {safeTransactions.length} transaction
              {safeTransactions.length !== 1 ? "s" : ""} found
            </div>

            <button
              className="p-3 bg-white rounded-xl border border-blue-500 
      shadow-sm hover:shadow-md hover:bg-blue-500 
      hover:text-white transition-all duration-300 
      flex items-center justify-center gap-2 min-w-[180px]
      text-gray-700 text-sm font-medium
    "
              title="View Monthly Transactions"
              onClick={() => navigate(`/monthlytransactions/${customerId}`)}
            >
              <FaCalendarAlt className="w-4 h-4 text-current" />
              <span className="text-current">Monthly Transactions</span>
            </button>

            {/* Add View All Transactions Button */}
            <button
              className="p-3 bg-white rounded-xl border border-purple-500 
      shadow-sm hover:shadow-md hover:bg-purple-500 
      hover:text-white transition-all duration-300 
      flex items-center justify-center gap-2 min-w-[180px]
      text-gray-700 text-sm font-medium
    "
              title="View All Transactions"
              onClick={() => navigate(`/alltransactions/${customerId}`)}
            >
              <FaListAlt className="w-4 h-4 text-current" />
              <span className="text-current">View All Transactions</span>
            </button>

            {safeTransactions.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={exportLoading}
                  className="p-3 bg-white rounded-xl border border-green-500 
                    shadow-sm hover:shadow-md hover:bg-green-500 
                    hover:text-white transition-all duration-300 
                    flex items-center justify-center gap-2 min-w-[200px] 
                    disabled:opacity-50 disabled:cursor-not-allowed 
                    text-gray-700 text-sm font-medium
                  "
                  title="Export Transaction Data"
                >
                  <FaFileExport className="w-4 h-4 text-current" />

                  {exportLoading ? (
                    <>
                      <RingLoader color="#ffffff" size={16} />
                      <span className="text-current">
                        {exportType === "pdf"
                          ? "Generating PDF..."
                          : exportType === "excel"
                          ? "Generating Excel..."
                          : exportType === "csv"
                          ? "Generating CSV..."
                          : "Exporting..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-current">Export All Records</span>
                      <FaChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>

                {showExportMenu && !exportLoading && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-3 border-b border-gray-100">
                      <p className="font-medium text-gray-800">
                        Export All Transactions
                      </p>
                      <p className="text-xs text-gray-500">
                        Currency: {selectedCurrencyCode || "All"} •{" "}
                        {safeTransactions.length} records
                      </p>
                    </div>

                    <div className="py-2">
                      <button
                        onClick={() => handleBulkExport("pdf")}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-left"
                      >
                        <FaFilePdf className="text-red-500 text-lg" />
                        <div>
                          <p className="font-medium text-gray-800">
                            PDF Report
                          </p>
                          <p className="text-xs text-gray-500">
                            All transactions in one document
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleBulkExport("excel")}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-left"
                      >
                        <FaFileExcel className="text-green-500 text-lg" />
                        <div>
                          <p className="font-medium text-gray-800">
                            Excel Spreadsheet
                          </p>
                          <p className="text-xs text-gray-500">
                            With summary and details
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleBulkExport("csv")}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left"
                      >
                        <FaFileCsv className="text-blue-500 text-lg" />
                        <div>
                          <p className="font-medium text-gray-800">CSV File</p>
                          <p className="text-xs text-gray-500">
                            Simple data import format
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleBulkExport("print")}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                      >
                        <FaPrint className="text-gray-500 text-lg" />
                        <div>
                          <p className="font-medium text-gray-800">
                            Print Report
                          </p>
                          <p className="text-xs text-gray-500">
                            Browser print preview
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
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
                            {transaction.transaction_id}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`font-medium ${
                            transaction.direction?.toLowerCase().includes("in")
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <TransactionExportMenu transaction={transaction} />

                          <button
                            onClick={() =>
                              handleSingleExport(transaction, "pdf")
                            }
                            disabled={exportingTransactionId === transaction.id}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Download PDF Receipt"
                          >
                            <FaReceipt />
                          </button>
                        </div>
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
