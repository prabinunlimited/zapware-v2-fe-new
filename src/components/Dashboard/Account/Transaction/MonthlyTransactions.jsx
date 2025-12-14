// MonthlyTransactions.jsx (Redux Version)
import { useState, useEffect } from "react";
import { FaFilePdf, FaFileExcel, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
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
  const bearertoken = localStorage.getItem("bearertoken");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { customerId } = useParams();

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

  useEffect(() => {
    // Fetch data on component mount
    dispatch(fetchStatements(customerId));
    dispatch(fetchCustomerBankAccounts({ customerId, bearertoken }));
  }, [dispatch, customerId, bearertoken]);

  useEffect(() => {
    // Apply filters whenever filter criteria change
    dispatch(filterStatements());
  }, [selectedCurrency, selectedMonth, selectedYear, dispatch]);

  // Handle filter changes
  const handleCurrencyChange = (e) => {
    dispatch(setSelectedCurrency(e.target.value));
  };

  const handleMonthChange = (e) => {
    dispatch(setSelectedMonth(e.target.value));
  };

  const handleYearChange = (e) => {
    dispatch(setSelectedYear(e.target.value));
  };

  const confirmCancel = () => {
    navigate(-1);
  };

  // Animation variants
  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  };

  // Show error toast if any
  useEffect(() => {
    if (statementsError) {
      toast.error("Failed to load transactions.");
    }
  }, [statementsError]);

  return (
    <div className="w-full p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800">
        Monthly Statements
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <select
          className="p-3 border rounded bg-gray-50 text-gray-700 w-full"
          onChange={handleCurrencyChange}
          value={selectedCurrency}
        >
          <option value="">Select Currency</option>
          {currencyLoading === false ? (
            customerBankAccounts.map((account) => (
              <option key={account.currency_code} value={account.currency_code}>
                {account.currency_code}
              </option>
            ))
          ) : (
            <option disabled>Loading Currency...</option>
          )}
        </select>

        <select
          className="p-3 border rounded bg-gray-50 text-gray-700 w-full"
          onChange={handleMonthChange}
          value={selectedMonth}
        >
          <option value="">Select Month</option>
          <option value="1">January</option>
          <option value="2">February</option>
          <option value="3">March</option>
          <option value="4">April</option>
          <option value="5">May</option>
          <option value="6">June</option>
          <option value="7">July</option>
          <option value="8">August</option>
          <option value="9">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>

        <select
          className="p-3 border rounded bg-gray-50 text-gray-700 w-full"
          onChange={handleYearChange}
          value={selectedYear}
        >
          <option value="">Select Year</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>
      </div>

      {/* Loader */}
      {statementsLoading && (
        <div className="flex justify-center items-center my-6">
          <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
        </div>
      )}

      {/* Statements Table */}
      {!statementsLoading && (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="py-4 px-6 text-left text-sm font-medium">
                  Currency
                </th>
                <th className="py-4 px-6 text-left text-sm font-medium">
                  Month
                </th>
                <th className="py-4 px-6 text-left text-sm font-medium">
                  Year
                </th>
                <th className="py-4 px-6 text-center text-sm font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStatements.length > 0 ? (
                filteredStatements.map((statement, index) => (
                  <motion.tr
                    key={statement.id}
                    className="hover:bg-gray-50 transition-all border-b"
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="py-6 px-6 text-sm text-gray-700">
                      {statement.currency}
                    </td>
                    <td className="py-6 px-6 text-sm text-gray-700">
                      {new Date(0, statement.month - 1).toLocaleString(
                        "default",
                        { month: "long" }
                      )}
                    </td>
                    <td className="py-6 px-6 text-sm text-gray-700">
                      {statement.year}
                    </td>
                    <td className="p-4 flex justify-center gap-4">
                      <motion.a
                        href={statement.pdf_url}
                        download
                        className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-all"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        target="_blank"
                      >
                        <FaFilePdf /> Download PDF
                      </motion.a>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="py-6 px-6 text-center text-gray-500"
                  >
                    No statements found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-center items-center mt-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors duration-200"
        >
          <FaArrowLeft className="text-blue-600" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
};

export default MonthlyTransactions;