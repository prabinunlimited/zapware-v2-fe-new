import React, {
  useEffect,
  useMemo,
  useCallback,
  useState,
  useRef,
} from "react";
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
  FaBars,
  FaTimes,
  FaEllipsisV,
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showMobileActionsMenu, setShowMobileActionsMenu] = useState(false);

    // Refs for handling click outside
    const mobileMenuRef = useRef(null);
    const exportMenuRef = useRef(null);
    const mobileExportMenuRef = useRef(null);

    // Detect mobile screen
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          mobileMenuRef.current &&
          !mobileMenuRef.current.contains(event.target)
        ) {
          setIsMobileMenuOpen(false);
        }
        if (
          exportMenuRef.current &&
          !exportMenuRef.current.contains(event.target)
        ) {
          setShowExportMenu(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }, []);

    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
        // Close menus on resize to desktop
        if (window.innerWidth >= 768) {
          setIsMobileMenuOpen(false);
          setShowMobileActionsMenu(false);
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

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
          (Array.isArray(transactions) ? transactions.length : 0) /
            itemsPerPage,
        ),
      [transactions.length, itemsPerPage],
    );

    // Safe transactions array
    const safeTransactions = useMemo(
      () => (Array.isArray(transactions) ? transactions : []),
      [transactions],
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
      [selectedCurrencyCode],
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
      [selectedCurrencyCode],
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

          // Call the API to generate PDF receipt
          const API_URL = import.meta.env.VITE_API_URL;
          const response = await fetch(
            `${API_URL}/transactions/generate-receipt-blob/${transaction.id}`,
            {
              responseType: "blob",
              headers: {
                Authorization: `Bearer ${bearertoken}`,
              },
            },
          );

          if (!response.ok) {
            throw new Error(
              `API request failed with status ${response.status}`,
            );
          }

          // Get the PDF blob
          const blob = await response.blob();

          // Check if it's actually a PDF
          if (!blob.type.includes("pdf")) {
            throw new Error("Server did not return a valid PDF file");
          }

          // Create a blob URL from the response data
          const downloadUrl = window.URL.createObjectURL(blob);

          // Create a temporary download link
          const link = document.createElement("a");
          link.href = downloadUrl;

          // Generate filename
          const fileName = generateSingleFileName(transaction, "pdf");
          link.download = fileName;

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
      [generateSingleFileName],
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
      [formatDate, selectedCurrencyCode, generateSingleFileName],
    );

    // BULK EXPORT FUNCTIONS
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
          { align: "center" },
        );
        doc.text(
          `Generated: ${new Date().toLocaleString()}`,
          pageWidth / 2,
          37,
          { align: "center" },
        );
        doc.text(
          `Total Transactions: ${transactions.length}`,
          pageWidth / 2,
          44,
          { align: "center" },
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
            { align: "center" },
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
            .join(","),
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
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; font-size: 14px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #3B82F6; padding-bottom: 15px; }
            .title { font-size: 20px; font-weight: bold; color: #1F2937; margin: 0; }
            .subtitle { color: #6B7280; margin: 5px 0 15px 0; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
            th { background: #3B82F6; color: white; padding: 10px; text-align: left; font-weight: 600; }
            td { padding: 10px; border-bottom: 1px solid #E5E7EB; }
            .footer { margin-top: 30px; text-align: center; color: #6B7280; font-size: 11px; border-top: 1px solid #E5E7EB; padding-top: 15px; }
            @media print {
              @page { margin: 0.25in; }
              body { margin: 0; font-size: 12px; }
              .no-print { display: none; }
              table { font-size: 11px; }
              th, td { padding: 8px; }
            }
            @media screen and (max-width: 768px) {
              table { display: block; overflow-x: auto; }
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
              `,
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Generated by Your App • ${new Date().toLocaleString()} • ${
              transactions.length
            } transactions</p>
          </div>
          
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #3B82F6; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
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
      [exportBulkPDF, exportBulkExcel, exportBulkCSV, printBulkTransactions],
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
      [exportSingleTransactionPDF, exportSingleTransactionExcel],
    );

    // Individual transaction export menu component
    const TransactionExportMenu = ({ transaction }) => {
      const [showMenu, setShowMenu] = useState(false);
      const menuRef = useRef(null);

      // Close menu when clicking outside
      useEffect(() => {
        const handleClickOutside = (event) => {
          if (menuRef.current && !menuRef.current.contains(event.target)) {
            setShowMenu(false);
          }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, []);

      return (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={exportingTransactionId === transaction.id}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Export this transaction"
          >
            {exportingTransactionId === transaction.id ? (
              <RingLoader size={14} color="#3B82F6" />
            ) : isMobile ? (
              <FaEllipsisV />
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
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-left text-sm transition-colors"
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
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-green-50 text-left text-sm transition-colors"
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
      const maxVisiblePages = isMobile ? 3 : 5;

      let startPage = Math.max(
        1,
        currentPage - Math.floor(maxVisiblePages / 2),
      );
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      return pages;
    }, [currentPage, totalPages, isMobile]);

    // Mobile header menu
    const MobileHeaderMenu = () => (
      <div className="md:hidden relative" ref={mobileMenuRef}>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 bg-white rounded-xl border border-gray-300 
            shadow-sm hover:shadow-md transition-all duration-300 z-30 relative"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {isMobileMenuOpen && (
          <div
            className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-40"
            style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}
          >
            <div className="p-4 border-b border-gray-100">
              <p className="font-semibold text-gray-800">Transaction Actions</p>
              <p className="text-xs text-gray-500 mt-1">
                {safeTransactions.length} transactions found
              </p>
            </div>

            <div className="py-2">
              <button
                onClick={() => {
                  navigate(`/monthlytransactions/${customerId}`);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors"
              >
                <div className="flex-shrink-0">
                  <FaCalendarAlt className="text-blue-500 text-lg" />
                </div>
                <div className="flex-grow">
                  <p className="font-medium text-gray-800">
                    Monthly Transactions
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">View by month</p>
                </div>
              </button>

              <button
                onClick={() => {
                  navigate(`/alltransactions/${customerId}`);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 text-left transition-colors"
              >
                <div className="flex-shrink-0">
                  <FaListAlt className="text-purple-500 text-lg" />
                </div>
                <div className="flex-grow">
                  <p className="font-medium text-gray-800">
                    View All Transactions
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Complete history
                  </p>
                </div>
              </button>

              {safeTransactions.length > 0 && (
                <button
                  onClick={() => {
                    setShowMobileActionsMenu(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-left transition-colors"
                >
                  <div className="flex-shrink-0">
                    <FaFileExport className="text-green-500 text-lg" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium text-gray-800">Export Data</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      PDF, Excel, CSV, Print
                    </p>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  handleManualRefresh();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
              >
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  <span className="text-lg">↻</span>
                </div>
                <div className="flex-grow">
                  <p className="font-medium text-gray-800">Refresh Data</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Reload transactions
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    );

    // Mobile export menu
    const MobileExportMenu = () => (
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-start justify-center p-4 pt-20">
        <div
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slideUp"
          ref={mobileExportMenuRef}
        >
          <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white rounded-t-2xl">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">
                Export Options
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Export {safeTransactions.length} transactions
              </p>
            </div>
            <button
              onClick={() => setShowMobileActionsMenu(false)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="p-5">
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 font-medium mb-1">
                Currency:{" "}
                <span className="text-blue-600">
                  {selectedCurrencyCode || "All"}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                Generated on {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => {
                  handleBulkExport("pdf");
                  setShowMobileActionsMenu(false);
                }}
                className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-red-50 to-white hover:from-red-100 rounded-xl text-left border border-red-100 transition-all duration-200 active:scale-[0.98]"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <FaFilePdf className="text-red-500 text-2xl" />
                  </div>
                </div>
                <div className="flex-grow">
                  <p className="font-semibold text-gray-800">PDF Report</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Professional document with all transactions
                  </p>
                </div>
                <div className="text-red-500 text-lg">→</div>
              </button>

              <button
                onClick={() => {
                  handleBulkExport("excel");
                  setShowMobileActionsMenu(false);
                }}
                className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-green-50 to-white hover:from-green-100 rounded-xl text-left border border-green-100 transition-all duration-200 active:scale-[0.98]"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <FaFileExcel className="text-green-500 text-2xl" />
                  </div>
                </div>
                <div className="flex-grow">
                  <p className="font-semibold text-gray-800">
                    Excel Spreadsheet
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Editable format with detailed columns
                  </p>
                </div>
                <div className="text-green-500 text-lg">→</div>
              </button>

              <button
                onClick={() => {
                  handleBulkExport("csv");
                  setShowMobileActionsMenu(false);
                }}
                className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 rounded-xl text-left border border-blue-100 transition-all duration-200 active:scale-[0.98]"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FaFileCsv className="text-blue-500 text-2xl" />
                  </div>
                </div>
                <div className="flex-grow">
                  <p className="font-semibold text-gray-800">CSV File</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Simple format for data import
                  </p>
                </div>
                <div className="text-blue-500 text-lg">→</div>
              </button>

              <button
                onClick={() => {
                  handleBulkExport("print");
                  setShowMobileActionsMenu(false);
                }}
                className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 rounded-xl text-left border border-gray-100 transition-all duration-200 active:scale-[0.98]"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <FaPrint className="text-gray-500 text-2xl" />
                  </div>
                </div>
                <div className="flex-grow">
                  <p className="font-semibold text-gray-800">Print Report</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Browser print preview
                  </p>
                </div>
                <div className="text-gray-500 text-lg">→</div>
              </button>
            </div>

            <div className="mt-6 pt-5 border-t border-gray-200">
              <button
                onClick={() => setShowMobileActionsMenu(false)}
                className="w-full py-3 text-center text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    // Add CSS animation
    useEffect(() => {
      const style = document.createElement("style");
      style.textContent = `
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `;
      document.head.appendChild(style);

      return () => {
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      };
    }, []);

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
        {showMobileActionsMenu && <MobileExportMenu />}

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div className="flex items-center justify-between md:block">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                Transaction History
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                View and manage your transaction records
              </p>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <MobileHeaderMenu />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="text-xs md:text-sm text-gray-600 bg-gray-100 px-2 md:px-3 py-1 rounded-full">
              {safeTransactions.length} transaction
              {safeTransactions.length !== 1 ? "s" : ""}
            </div>

            {/* Desktop buttons */}
            <div className="hidden md:flex items-center gap-2 md:gap-4">
              <button
                className="p-2 md:p-3 bg-white rounded-lg md:rounded-xl border border-blue-500 
                  shadow-sm hover:shadow-md hover:bg-blue-500 hover:text-white 
                  transition-all duration-300 flex items-center justify-center gap-2 
                  min-w-0 md:min-w-[180px] text-gray-700 text-xs md:text-sm font-medium"
                title="View Monthly Transactions"
                onClick={() => navigate(`/monthlytransactions/${customerId}`)}
              >
                <FaCalendarAlt className="w-3 h-3 md:w-4 md:h-4 text-current" />
                <span className="hidden md:inline text-current">
                  Monthly Transactions
                </span>
                <span className="md:hidden">Monthly</span>
              </button>

              <button
                className="p-2 md:p-3 bg-white rounded-lg md:rounded-xl border border-purple-500 
                  shadow-sm hover:shadow-md hover:bg-purple-500 hover:text-white 
                  transition-all duration-300 flex items-center justify-center gap-2 
                  min-w-0 md:min-w-[180px] text-gray-700 text-xs md:text-sm font-medium"
                title="View All Transactions"
                onClick={() => navigate(`/alltransactions/${customerId}`)}
              >
                <FaListAlt className="w-3 h-3 md:w-4 md:h-4 text-current" />
                <span className="hidden md:inline text-current">
                  View All Transactions
                </span>
                <span className="md:hidden">All</span>
              </button>

              {safeTransactions.length > 0 && (
                <div className="hidden md:block relative" ref={exportMenuRef}>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={exportLoading}
                    className="p-3 bg-white rounded-xl border border-green-500 
                      shadow-sm hover:shadow-md hover:bg-green-500 
                      hover:text-white transition-all duration-300 
                      flex items-center justify-center gap-2 min-w-[200px] 
                      disabled:opacity-50 disabled:cursor-not-allowed 
                      text-gray-700 text-sm font-medium"
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
                    <div
                      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                      style={{ maxHeight: "400px", overflowY: "auto" }}
                    >
                      <div className="p-3 border-b border-gray-100 sticky top-0 bg-white">
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
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-left transition-colors"
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
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-left transition-colors"
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
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors"
                        >
                          <FaFileCsv className="text-blue-500 text-lg" />
                          <div>
                            <p className="font-medium text-gray-800">
                              CSV File
                            </p>
                            <p className="text-xs text-gray-500">
                              Simple data import format
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={() => handleBulkExport("print")}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
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
                className="hidden md:inline text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors"
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {safeTransactions.length === 0 ? (
          <div className="text-center p-6 md:py-12 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-gray-400 text-4xl md:text-6xl mb-4">💸</div>
            <h3 className="text-base md:text-lg font-medium text-gray-700 mb-2">
              No transactions found
            </h3>
            <p className="text-sm text-gray-500">
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
            {/* Mobile Transactions Cards */}
            {isMobile && (
              <div className="space-y-3 mb-6 md:hidden">
                {currentTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.transaction_id || `transaction-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Date & Time</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(transaction.transaction_datetime)}
                        </p>
                      </div>
                      <TransactionExportMenu transaction={transaction} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Transaction ID</p>
                        <p className="text-xs font-mono text-gray-900 truncate">
                          {transaction.transaction_id || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Direction</p>
                        <p
                          className={`text-sm font-medium ${
                            transaction.direction?.toLowerCase().includes("in")
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.direction || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.instructed_amount || "0"}{" "}
                          {transaction.currency_code}
                        </p>
                        {transaction.fee_amount &&
                          parseFloat(transaction.fee_amount) > 0 && (
                            <p className="text-xs text-gray-500">
                              Fee: {transaction.fee_amount}
                            </p>
                          )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Balance</p>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.balance || "0"}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          transaction.status,
                        )}`}
                      >
                        {transaction.status || "Unknown"}
                      </span>
                      <button
                        onClick={() => handleSingleExport(transaction, "pdf")}
                        disabled={exportingTransactionId === transaction.id}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Download PDF Receipt"
                      >
                        <FaReceipt />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Desktop Transactions Table */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Direction
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.transaction_datetime)}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                          {transaction.transaction_id
                            ? `${transaction.transaction_id.substring(0, 10)}...`
                            : "N/A"}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
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
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {transaction.balance || "0"}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            transaction.status,
                          )}`}
                        >
                          {transaction.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {pageNumbers.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageClick(pageNumber)}
                        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm border rounded-md transition-colors ${
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
                    className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>

                <div className="text-xs sm:text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    );
  },
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
