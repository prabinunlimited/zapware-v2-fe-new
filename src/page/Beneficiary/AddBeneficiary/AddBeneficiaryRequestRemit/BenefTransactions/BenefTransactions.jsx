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
  import { FaFilePdf, FaFileExcel, FaSearch, FaFilter } from "react-icons/fa";
  import logoPath from "../../../../../assets/images/Logo/unlimited remit logo.png"
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
    // FIXED: Changed from benefId to beneficiaryId to match the route
    const { beneficiaryId } = useParams();
    const [transactionData, setTransactionData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authtoken] = useState(localStorage.getItem("authtoken"));
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [headerColorClass, setHeaderColorClass] = useState("");
  
    const [filterType, setFilterType] = useState("");
    const [filterTransactionId, setFilterTransactionId] = useState("");
    const [filterDirection, setFilterDirection] = useState("");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");
  
    const [beneficiaryName, setBeneficiaryName] = useState("");
  
    // Cache for header color to prevent repeated API calls
    const headerColorCache = useRef(null);
  
    const customerId = propCustomerId || localStorage.getItem("customerid");

    console.log("Current customerId:", customerId);
  console.log("Current beneficiaryId:", beneficiaryId);
  
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
    const navigate = useNavigate();
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
      const fetchHeaderColor = async () => {
        const whitelabelledpartnerid = localStorage.getItem(
          "whitelabelledpartnerid"
        );
        if (!whitelabelledpartnerid || headerColorCache.current) return;
  
        try {
          if (onLoadingStart) onLoadingStart();
  
          const response = await apiClient.get(
            `/partner-basic-setup/${whitelabelledpartnerid}`,
            { headers: { Authorization: `Bearer ${authtoken}` } }
          );
          if (response.data && response.data.header_color) {
            setHeaderColorClass(response.data.header_color);
            headerColorCache.current = response.data.header_color;
          }
        } catch (err) {
          console.error("Error fetching header color:", err);
        } finally {
          if (onLoadingEnd) onLoadingEnd();
        }
      };
  
      fetchHeaderColor();
    }, [authtoken, onLoadingStart, onLoadingEnd]);
  
    // Responsive design effect
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
  
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(document.body);
  
      return () => resizeObserver.disconnect();
    }, []);
  
    // Main transaction data fetch with caching
    const fetchTransactionDetails = useCallback(async () => {
      if (!beneficiaryId) {
        console.log("No beneficiaryId found from route:", beneficiaryId);
        return;
      }
  
      try {
        setLoading(true);
        if (onLoadingStart) onLoadingStart();
  
        console.log("Fetching transactions for beneficiaryId:", beneficiaryId);
  
        const response = await apiClient.get(
          `/beneficiaries/all-transactions/${beneficiaryId}`,
          { headers: { Authorization: `Bearer ${authtoken}` } }
        );
  
        console.log("Full API Response:", response);
        console.log("Response data structure:", response.data);
  
        // Handle the API response structure
        let transactions = [];
  
        if (response.data.data?.transactionDetails) {
          transactions = response.data.data.transactionDetails;
        } else if (response.data.transactionDetails) {
          transactions = response.data.transactionDetails;
        } else if (Array.isArray(response.data.data)) {
          transactions = response.data.data;
        }
  
        console.log("Extracted transactions:", transactions);
  
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
  
    // Optimized fetch with dependency check
    useEffect(() => {
      if (beneficiaryId) {
        console.log("beneficiaryId changed, fetching transactions:", beneficiaryId);
        fetchTransactionDetails();
      }
    }, [fetchTransactionDetails, beneficiaryId]);
  
    // Memoized filtered transactions
    const filteredTransactions = useMemo(() => {
      let filtered = transactionData;
  
      if (filterType) {
        filtered = filtered.filter(
          (transaction) => transaction.particulars === filterType
        );
      }
      if (filterStartDate && filterEndDate) {
        filtered = filtered.filter((transaction) => {
          const transactionDate = new Date(transaction.transaction_datetime);
          const startDate = new Date(filterStartDate);
          const endDate = new Date(filterEndDate);
          endDate.setHours(23, 59, 59, 999);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
      }
      if (filterTransactionId) {
        const searchTerm = filterTransactionId.toLowerCase();
        filtered = filtered.filter((transaction) =>
          transaction.transaction_id?.toLowerCase().includes(searchTerm)
        );
      }
      if (filterDirection) {
        filtered = filtered.filter(
          (transaction) => transaction.direction === filterDirection
        );
      }
  
      return filtered;
    }, [
      transactionData,
      filterType,
      filterStartDate,
      filterEndDate,
      filterTransactionId,
      filterDirection,
    ]);
  
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
  
    // Transaction completion callback
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
          
          // Add logo
          const img = new Image();
          img.src = logoPath;
          doc.addImage(img, 'PNG', 15, 10, 40, 15);
          
          // Title
          doc.setFontSize(18);
          doc.setTextColor(40, 40, 40);
          doc.text('Transaction Details', pageWidth / 2, 30, { align: 'center' });
          
          // Transaction details
          const details = [
            ['Transaction ID', transaction.transaction_id || 'N/A'],
            ['Date', formatDate(transaction.transaction_datetime)],
            ['Direction', transaction.direction || 'N/A'],
            ['Status', transaction.status || 'Pending'],
            ['Amount', `${transaction.instructed_amount || 0} ${transaction.currency_code || ''}`],
            ['Fee', transaction.fee_amount || '0'],
            ['Total Amount', transaction.amount_with_fee || 'N/A'],
            ['Sender', transaction.sender_name || 'N/A'],
            ['Beneficiary', transaction.beneficiary_name || 'N/A'],
          ];
          
          autoTable(doc, {
            startY: 40,
            head: [['Field', 'Value']],
            body: details,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 10 },
          });
          
          doc.save(`transaction_${transaction.transaction_id || 'receipt'}.pdf`);
          toast.success('PDF exported successfully!');
        } catch (error) {
          console.error('Error exporting PDF:', error);
          toast.error('Failed to export PDF');
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
          
          const transaction = transactionData.find(t => t.id === transactionId);
          if (!transaction) {
            toast.error('Transaction not found');
            return;
          }
          
          await exportTransactionPDF(transaction);
        } catch (error) {
          console.error('Error exporting receipt:', error);
          toast.error('Failed to export receipt');
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
          
          const data = [{
            'Transaction ID': transaction.transaction_id || 'N/A',
            'Date': formatDate(transaction.transaction_datetime),
            'Direction': transaction.direction || 'N/A',
            'Status': transaction.status || 'Pending',
            'Amount': transaction.instructed_amount || 0,
            'Currency': transaction.currency_code || '',
            'Fee': transaction.fee_amount || 0,
            'Total Amount': transaction.amount_with_fee || 'N/A',
            'Sender': transaction.sender_name || 'N/A',
            'Beneficiary': transaction.beneficiary_name || 'N/A',
          }];
          
          const ws = XLSX.utils.json_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Transaction');
          XLSX.writeFile(wb, `transaction_${transaction.transaction_id || 'export'}.xlsx`);
          
          toast.success('Excel exported successfully!');
        } catch (error) {
          console.error('Error exporting Excel:', error);
          toast.error('Failed to export Excel');
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
  
    return (
      <section className="p-4 sm:p-6 rounded-lg shadow-md transition-colors duration-300 bg-white">
        {/* Header section */}
        <div className={`rounded-lg p-4 mb-6 ${headerColorClass}`}>
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
              onClick={fetchTransactionDetails}
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
          </div>
        )}
  
        {/* Show no transactions state */}
        {beneficiaryId && !loading && !error && filteredTransactions.length === 0 && (
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
                  value={filterDirection}
                  onChange={(e) => setFilterDirection(e.target.value)}
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
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col w-full md:w-auto flex-1 min-w-[150px]">
                <label className="text-gray-600 text-sm mb-1">End Date</label>
                <input
                  type="date"
                  className="border border-gray-300 p-2 rounded-md shadow-sm focus:ring focus:ring-blue-300 w-full transition-colors"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
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
  
  BenefTransactions.propTypes = {
    customerId: PropTypes.string,
    selectedCurrencyCode: PropTypes.string,
    onTransactionComplete: PropTypes.func,
    onLoadingStart: PropTypes.func,
    onLoadingEnd: PropTypes.func,
    textColor: PropTypes.string,
  };
  
  export default React.memo(BenefTransactions);