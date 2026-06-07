// MonthlyTransactions.jsx (Heavy Animations, Sleek UI, Top-Notch UX)
import { useState, useEffect, useMemo } from "react";
import {
  FaFilePdf,
  FaArrowLeft,
  FaFilter,
  FaSync,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaDownload,
  FaSearch,
  FaInfoCircle,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaEye,
  FaChartLine,
  FaRegCalendarAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
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

// --- Helper function to generate years from 2010 to current year only ---
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear(); // Gets current year dynamically
  const startYear = 2010;
  const years = [];
  // Show years in descending order (latest first)
  for (let year = currentYear; year >= startYear; year--) {
    years.push(year);
  }
  return years;
};

// --- Animation Variants ---
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.4 } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 12 },
  },
};

const cardHoverVariants = {
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow:
      "0 20px 30px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.2)",
    transition: { duration: 0.2, ease: "easeOut" },
  },
  tap: { scale: 0.98 },
};

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" },
  }),
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

const filterPanelVariants = {
  hidden: { opacity: 0, height: 0, y: -20, marginBottom: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    y: 0,
    marginBottom: 32,
    transition: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] },
  },
  exit: {
    opacity: 0,
    height: 0,
    y: -20,
    marginBottom: 0,
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

// --- Helper Components ---
const AnimatedStatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div
    variants={itemVariants}
    whileHover="hover"
    custom={delay}
    className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100/80 backdrop-blur-sm"
  >
    <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-gradient-to-br from-gray-50 to-transparent rounded-full opacity-50" />
    <div className="relative p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-800 mt-2 tracking-tight">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-2xl bg-${color}-100`}>
          <Icon className={`text-2xl text-${color}-600`} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </div>
  </motion.div>
);

const MonthlyTransactions = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { customerId } = useParams();

  // Local UI State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);

  // Generate year options dynamically (will update when year changes)
  const yearOptions = useMemo(() => generateYearOptions(), []);
  
  // Optional: Add effect to update year options when year changes (for real-time updates)
  useEffect(() => {
    // You can add a timer to check if year has changed, but it's not necessary
    // because the component will re-render on page refresh or navigation
    const interval = setInterval(() => {
      // Force re-render when year changes (optional)
      const currentYear = new Date().getFullYear();
      const lastYear = yearOptions[0]; // First item is the latest year
      if (currentYear > lastYear) {
        window.location.reload(); // Simple reload to get new years
      }
    }, 60000); // Check every minute (adjust as needed)
    
    return () => clearInterval(interval);
  }, [yearOptions]);

  // Redux State
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
  const enhancedFilteredStatements = useMemo(() => {
    if (!searchTerm.trim()) return filteredStatements;
    const term = searchTerm.toLowerCase();
    return filteredStatements.filter((statement) => {
      const monthName = new Date(0, statement.month - 1).toLocaleString(
        "default",
        { month: "long" },
      );
      return (
        statement.currency.toLowerCase().includes(term) ||
        monthName.toLowerCase().includes(term) ||
        statement.year.toString().includes(term)
      );
    });
  }, [filteredStatements, searchTerm]);

  // Derived stats
  const totalStatements = statements.length;
  const filteredCount = enhancedFilteredStatements.length;
  const uniqueCurrencies = customerBankAccounts.length;

  // Fetch data on mount or customerId change
  useEffect(() => {
    fetchData();
  }, [dispatch, customerId]);

  const fetchData = async () => {
    try {
      await Promise.all([
        dispatch(fetchStatements(customerId)),
        dispatch(fetchCustomerBankAccounts({ customerId })),
      ]);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data. Please try again.");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 800);
    toast.success("✨ Statements refreshed successfully");
  };

  // Apply filters whenever selections change
  useEffect(() => {
    dispatch(filterStatements());
  }, [selectedCurrency, selectedMonth, selectedYear, dispatch]);

  const handleCurrencyChange = (e) =>
    dispatch(setSelectedCurrency(e.target.value));
  const handleMonthChange = (e) => dispatch(setSelectedMonth(e.target.value));
  const handleYearChange = (e) => dispatch(setSelectedYear(e.target.value));

  const clearFilters = () => {
    dispatch(setSelectedCurrency(""));
    dispatch(setSelectedMonth(""));
    dispatch(setSelectedYear(""));
    setSearchTerm("");
    toast.info("🧹 All filters cleared");
  };

  // Error toast
  useEffect(() => {
    if (statementsError) {
      toast.error("⚠️ Failed to load monthly statements. Please try again.");
    }
  }, [statementsError]);

  // Helper for month name
  const getMonthName = (monthNum) =>
    new Date(0, monthNum - 1).toLocaleString("default", { month: "long" });

  return (
    <LayoutGroup>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-8"
      >
        <div className="max-w-7xl mx-auto">
          {/* --- Header Section --- */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex items-center gap-3">
                <FaCalendarAlt className="text-blue-500 drop-shadow-md" />
                Monthly Statements
              </h1>
              <p className="text-gray-500 mt-2 text-lg flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live transaction archive • PDF ready
              </p>
            </motion.div>

            <div className="flex flex-wrap gap-3">
              <motion.button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="group relative flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaSync
                  className={`${isRefreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
                />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </motion.button>

              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaFilter />
                {showFilters ? "Hide Filters" : "Show Filters"}
                {showFilters ? (
                  <FaChevronUp size={12} />
                ) : (
                  <FaChevronDown size={12} />
                )}
              </motion.button>
            </div>
          </div>

          {/* --- Stats Cards (Animated) --- */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
          >
            <AnimatedStatCard
              title="Total Statements"
              value={totalStatements}
              icon={FaFilePdf}
              color="blue"
              delay={0}
            />
            <AnimatedStatCard
              title="Filtered Results"
              value={filteredCount}
              icon={FaFilter}
              color="green"
              delay={0.1}
            />
            <AnimatedStatCard
              title="Active Currencies"
              value={uniqueCurrencies}
              icon={FaMoneyBillWave}
              color="purple"
              delay={0.2}
            />
          </motion.div>

          {/* --- Filter Panel (Animated Presence) --- */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                variants={filterPanelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <FaFilter className="text-blue-500" />
                      Advanced Filters
                    </h3>
                    <motion.button
                      onClick={clearFilters}
                      className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
                      whileHover={{ scale: 1.05 }}
                    >
                      <FaTimes size={12} /> Clear all
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Search */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        🔍 Search
                      </label>
                      <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Currency, month, year..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50/50"
                        />
                      </div>
                    </div>

                    {/* Currency */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        💱 Currency
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        onChange={handleCurrencyChange}
                        value={selectedCurrency}
                      >
                        <option value="">All Currencies</option>
                        {currencyLoading ? (
                          <option disabled>Loading...</option>
                        ) : (
                          customerBankAccounts.map((acc) => (
                            <option
                              key={acc.currency_code}
                              value={acc.currency_code}
                            >
                              {acc.currency_code}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Month & Year */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          📅 Month
                        </label>
                        <select
                          className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50/50"
                          onChange={handleMonthChange}
                          value={selectedMonth}
                        >
                          <option value="">All</option>
                          {[...Array(12)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {new Date(0, i).toLocaleString("default", {
                                month: "long",
                              })}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          🗓️ Year
                        </label>
                        <select
                          className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50/50"
                          onChange={handleYearChange}
                          value={selectedYear}
                        >
                          <option value="">All</option>
                          {yearOptions.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- Main Content Card (Statements Table) --- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
          >
            {/* Header Bar */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <FaRegCalendarAlt className="text-blue-500" />
                <h3 className="text-lg font-bold text-gray-800">
                  Statement Archive
                </h3>
                {searchTerm && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    "{searchTerm}"
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Showing {filteredCount} of {totalStatements} records
              </div>
            </div>

            {/* Loading State */}
            {statementsLoading ? (
              <div className="py-24 flex flex-col items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full"
                />
                <p className="mt-4 text-gray-500 font-medium">
                  Loading statements...
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Desktop Table */}
                <table className="w-full hidden md:table">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">
                        Currency
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">
                        Month
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">
                        Year
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {enhancedFilteredStatements.length > 0 ? (
                        enhancedFilteredStatements.map((stmt, idx) => (
                          <motion.tr
                            key={stmt.id}
                            custom={idx}
                            variants={tableRowVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            whileHover={{
                              backgroundColor: "rgba(59,130,246,0.04)",
                            }}
                            className="border-b border-gray-50 transition-colors"
                            onMouseEnter={() => setHoveredRow(stmt.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                  <span className="font-bold text-blue-700">
                                    {stmt.currency.substring(0, 2)}
                                  </span>
                                </div>
                                <span className="font-medium text-gray-800">
                                  {stmt.currency}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                  <span className="text-xs font-bold text-purple-600">
                                    {stmt.month}
                                  </span>
                                </div>
                                <span className="text-gray-700">
                                  {getMonthName(stmt.month)}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium shadow-sm">
                                {stmt.year}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <motion.a
                                href={stmt.pdf_url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                              >
                                <FaDownload size={14} />
                                <span>PDF</span>
                              </motion.a>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-20 text-center">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex flex-col items-center"
                            >
                              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <FaFilePdf className="text-3xl text-gray-400" />
                              </div>
                              <h4 className="text-xl font-semibold text-gray-700">
                                No statements found
                              </h4>
                              <p className="text-gray-400 mt-1 max-w-sm text-center">
                                {searchTerm ||
                                selectedCurrency ||
                                selectedMonth ||
                                selectedYear
                                  ? "Adjust filters to see more results"
                                  : "No monthly statements available"}
                              </p>
                              {(searchTerm ||
                                selectedCurrency ||
                                selectedMonth ||
                                selectedYear) && (
                                <button
                                  onClick={clearFilters}
                                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Reset filters
                                </button>
                              )}
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                  <AnimatePresence>
                    {enhancedFilteredStatements.length > 0 ? (
                      enhancedFilteredStatements.map((stmt, idx) => (
                        <motion.div
                          key={stmt.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ delay: idx * 0.03 }}
                          className="p-5 hover:bg-blue-50/20 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                <span className="font-bold text-blue-700">
                                  {stmt.currency.substring(0, 2)}
                                </span>
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">
                                  {stmt.currency}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                                    <span className="text-xs font-bold text-purple-600">
                                      {stmt.month}
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {getMonthName(stmt.month)}
                                  </span>
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    {stmt.year}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <motion.a
                              href={stmt.pdf_url}
                              download
                              target="_blank"
                              className="p-2 bg-blue-600 text-white rounded-xl shadow"
                              whileTap={{ scale: 0.95 }}
                            >
                              <FaDownload />
                            </motion.a>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-16 text-center">
                        <FaFilePdf className="text-5xl text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No matching statements</p>
                        <button
                          onClick={clearFilters}
                          className="mt-2 text-blue-500 text-sm"
                        >
                          Clear filters
                        </button>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>

          {/* --- Footer Actions --- */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-10 pt-6 border-t border-gray-200"
          >
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <FaInfoCircle className="text-blue-400" />
              Need assistance? Contact support for any statement issues.
            </div>
            <motion.button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaArrowLeft />
              Back to Dashboard
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </LayoutGroup>
  );
};

export default MonthlyTransactions;