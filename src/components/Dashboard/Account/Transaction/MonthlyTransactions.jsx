// MonthlyTransactions.jsx (Enhanced UI/UX Version)
import { useState, useEffect } from "react";
import { 
  FaFilePdf, 
  FaArrowLeft, 
  FaFilter, 
  FaSync, 
  FaCalendarAlt,
  FaMoneyBillWave,
  FaDownload,
  FaSearch,
  FaInfoCircle
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStatements,
  fetchCustomerBankAccounts,
  setSelectedCurrency,
  setSelectedMonth,
  setSelectedYear,
  filterStatements,
  selectStatements,
  selectFilteredStatements,
  selectCustomerBankAccounts,
  selectSelectedCurrency,
  selectSelectedMonth,
  selectSelectedYear,
  selectStatementsLoading,
  selectCurrencyLoading,
  selectStatementsError,
} from "../Transaction/TransactionSlice";

const MonthlyTransactions = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { customerId } = useParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Select state from Redux
  const statements = useSelector(selectStatements);
  const filteredStatements = useSelector(selectFilteredStatements);
  const customerBankAccounts = useSelector(selectCustomerBankAccounts);
  const selectedCurrency = useSelector(selectSelectedCurrency);
  const selectedMonth = useSelector(selectSelectedMonth);
  const selectedYear = useSelector(selectSelectedYear);
  const statementsLoading = useSelector(selectStatementsLoading);
  const currencyLoading = useSelector(selectCurrencyLoading);
  const statementsError = useSelector(selectStatementsError);

  // Enhanced filtered statements with search
  const enhancedFilteredStatements = searchTerm 
    ? filteredStatements.filter(statement => 
        statement.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(0, statement.month - 1).toLocaleString("default", { month: "long" })
          .toLowerCase().includes(searchTerm.toLowerCase()) ||
        statement.year.toString().includes(searchTerm)
      )
    : filteredStatements;

  useEffect(() => {
    fetchData();
  }, [dispatch, customerId]);

  const fetchData = async () => {
    try {
      await Promise.all([
        dispatch(fetchStatements(customerId)),
        dispatch(fetchCustomerBankAccounts({ customerId }))
      ]);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 1000);
    toast.success("Data refreshed successfully");
  };

  useEffect(() => {
    dispatch(filterStatements());
  }, [selectedCurrency, selectedMonth, selectedYear, dispatch]);

  const handleCurrencyChange = (e) => {
    dispatch(setSelectedCurrency(e.target.value));
  };

  const handleMonthChange = (e) => {
    dispatch(setSelectedMonth(e.target.value));
  };

  const handleYearChange = (e) => {
    dispatch(setSelectedYear(e.target.value));
  };

  const clearFilters = () => {
    dispatch(setSelectedCurrency(''));
    dispatch(setSelectedMonth(''));
    dispatch(setSelectedYear(''));
    setSearchTerm('');
    toast.info("Filters cleared");
  };

  const getTotalStatements = () => statements.length;
  const getFilteredCount = () => enhancedFilteredStatements.length;

  useEffect(() => {
    if (statementsError) {
      toast.error("Failed to load monthly statements. Please try again.");
    }
  }, [statementsError]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const cardVariants = {
    hover: { 
      scale: 1.02, 
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
              <FaCalendarAlt className="text-blue-600" />
              Monthly Statements
            </h1>
            <p className="text-gray-600 mt-2">
              View and download your monthly transaction statements
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaSync className={`${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </motion.button>
            
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaFilter />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </motion.button>
          </div>
        </div>

        {/* Stats Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Statements</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{getTotalStatements()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaFilePdf className="text-2xl text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Filtered Statements</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{getFilteredCount()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaFilter className="text-2xl text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Available Currencies</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{customerBankAccounts.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaMoneyBillWave className="text-2xl text-purple-600" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters Section */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <FaFilter className="text-blue-600" />
                  Filter Statements
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Search Input */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Statements
                  </label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by currency, month, or year..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Currency Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <div className="relative">
                    <select
                      className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onChange={handleCurrencyChange}
                      value={selectedCurrency}
                    >
                      <option value="">All Currencies</option>
                      {currencyLoading ? (
                        <option disabled>Loading...</option>
                      ) : (
                        customerBankAccounts.map((account) => (
                          <option key={account.currency_code} value={account.currency_code}>
                            {account.currency_code}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Month & Year Select */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <select
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onChange={handleMonthChange}
                      value={selectedMonth}
                    >
                      <option value="">All Months</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <select
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onChange={handleYearChange}
                      value={selectedYear}
                    >
                      <option value="">All Years</option>
                      {[2025, 2024, 2023].map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200"
        >
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Monthly Statements
                {searchTerm && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    (Search: "{searchTerm}")
                  </span>
                )}
              </h3>
              <div className="text-sm text-gray-500">
                Showing {getFilteredCount()} of {getTotalStatements()} statements
              </div>
            </div>
          </div>

          {/* Loading State */}
          {statementsLoading ? (
            <div className="py-20">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading your statements...</p>
              </div>
            </div>
          ) : (
            /* Statements Table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-4 px-6 text-left font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        Currency
                        <FaInfoCircle className="text-gray-400 text-sm" title="Transaction currency" />
                      </div>
                    </th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-700">
                      Month
                    </th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-700">
                      Year
                    </th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {enhancedFilteredStatements.length > 0 ? (
                      enhancedFilteredStatements.map((statement, index) => (
                        <motion.tr
                          key={statement.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-150"
                        >
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <span className="font-semibold text-blue-700">
                                  {statement.currency.substring(0, 2)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{statement.currency}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <span className="text-sm font-semibold text-purple-700">
                                  {statement.month}
                                </span>
                              </div>
                              <span className="text-gray-700">
                                {new Date(0, statement.month - 1).toLocaleString("default", { month: "long" })}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              {statement.year}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <motion.a
                              href={statement.pdf_url}
                              download
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
                              variants={cardVariants}
                              whileHover="hover"
                              whileTap="tap"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FaDownload />
                              Download PDF
                            </motion.a>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <FaFilePdf className="text-3xl text-gray-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-700 mb-2">
                              No statements found
                            </h4>
                            <p className="text-gray-500 max-w-md">
                              {searchTerm || selectedCurrency || selectedMonth || selectedYear 
                                ? "Try adjusting your filters or search term"
                                : "No monthly statements available for this period"}
                            </p>
                            {(searchTerm || selectedCurrency || selectedMonth || selectedYear) && (
                              <button
                                onClick={clearFilters}
                                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Clear all filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Footer Actions */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200"
        >
          <div className="text-sm text-gray-500">
            <p>Need help? Contact support if you have issues with your statements.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <motion.button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaArrowLeft />
              Back to Dashboard
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MonthlyTransactions;