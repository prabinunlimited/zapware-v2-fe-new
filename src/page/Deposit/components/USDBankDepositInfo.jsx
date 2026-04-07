// src/page/Deposit/components/USDBankDepositInfo.jsx
import React, { useState, useMemo } from "react";
import {
  FaUniversity,
  FaCheck,
  FaPlus,
  FaExclamationTriangle,
  FaShieldAlt,
  FaSyncAlt,
  FaCreditCard,
  FaArrowRight,
  FaLock,
  FaRegClock,
  FaRegCheckCircle,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import { RingLoader } from "react-spinners";

const USDBankDepositInfo = ({
  selectedCurrency,
  paymentMethod,
  selectedBankAccount, // This usually comes from Redux as an ID or Object
  onBankAccountSelect,
  usdBankAccounts, // ✅ Correctly receiving from Parent props
  loading, // ✅ Correctly receiving from Parent props
  error, // ✅ Correctly receiving from Parent props
  formErrors,
  navigate,
  onSwitchToBankAccounts,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showAccountDetails, setShowAccountDetails] = useState(null);

  // Only show for USD bank deposits
  const isUSDBankDeposit =
    selectedCurrency === "USD" && paymentMethod === "bank_deposit";

  // ✅ Normalize account data structure and fix the "currency: null" issue
  const safeUsdBankAccounts = useMemo(() => {
    if (!Array.isArray(usdBankAccounts)) return [];

    return usdBankAccounts.map((account, index) => ({
      ...account,
      // Ensure we have a consistent ID
      id: account.id || account.account_id,
      bank_name: account.provider || account.bank || "US Bank Account",
      account_name: account.account_name || "Checking Account",
      // Fix for the API returning null currency
      currency: account.currency || "USD",
      account_number:
        account.accountNumberHash ||
        (account.account_number
          ? `****${account.account_number.slice(-4)}`
          : "****"),
      routing_number: account.routing_number || "N/A",
      balance: account.balance || 0,
      last_used:
        account.last_used || account.updated_at || new Date().toISOString(),
      originalIndex: index,
    }));
  }, [usdBankAccounts]);

  // Handle filtering and sorting
  const filteredAccounts = useMemo(() => {
    const filtered = safeUsdBankAccounts.filter(
      (account) =>
        account.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.bank_name.localeCompare(b.bank_name);
      if (sortBy === "balance") return (b.balance || 0) - (a.balance || 0);
      return new Date(b.last_used) - new Date(a.last_used);
    });
  }, [safeUsdBankAccounts, searchTerm, sortBy]);

  // Determine if a specific account is selected
  const isAccountSelected = (account) => {
    if (!selectedBankAccount) return false;
    // Handle if selectedBankAccount is an object or just an ID string
    const selectedId =
      typeof selectedBankAccount === "object"
        ? selectedBankAccount.id || selectedBankAccount.account_id
        : selectedBankAccount;
    const currentId = account.id || account.account_id;
    return selectedId === currentId;
  };

  // Find the full object of the currently selected account for the summary box
  const selectedAccountDetails = useMemo(() => {
    return safeUsdBankAccounts.find((acc) => isAccountSelected(acc));
  }, [selectedBankAccount, safeUsdBankAccounts]);

  const handleAddBankAccount = () => {
    if (onSwitchToBankAccounts) {
      onSwitchToBankAccounts(); // Switches tab in the Parent iframe
    } else {
      navigate("/bank-accounts");
    }
  };

  const getBankLogo = (bankName) => {
    const name = bankName?.toLowerCase() || "";
    if (name.includes("chase")) return "🔵";
    if (name.includes("america")) return "🔴";
    if (name.includes("wells")) return "🟡";
    if (name.includes("citi")) return "🔵";
    return "🏦";
  };

  if (!isUSDBankDeposit) return null;

  if (loading) {
    return (
      <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
        <RingLoader color="#3B82F6" size={40} className="mx-auto mb-4" />
        <p className="text-gray-600 font-medium">
          Loading linked bank accounts...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 bg-white rounded-2xl shadow-lg border border-red-100 p-8 text-center">
        <FaExclamationTriangle className="text-red-500 text-3xl mx-auto mb-4" />
        <h4 className="text-lg font-bold text-gray-900">Connection Issue</h4>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                <FaUniversity className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  USD Bank Accounts
                </h3>
                <p className="text-blue-100 text-sm">
                  Select an account for your deposit
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddBankAccount}
              className="bg-white text-blue-600 px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-50 transition-all flex items-center justify-center"
            >
              <FaPlus className="mr-2" /> Add New Account
            </button>
          </div>
        </div>

        {/* Filters */}
        {safeUsdBankAccounts.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search banks..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2.5 border border-gray-300 rounded-xl bg-white"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">Recent</option>
              <option value="name">Name</option>
              <option value="balance">Balance</option>
            </select>
          </div>
        )}

        <div className="p-6">
          {formErrors?.bankAccount && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center">
              <FaExclamationTriangle className="mr-3" />{" "}
              {formErrors.bankAccount}
            </div>
          )}

          {filteredAccounts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAccounts.map((account) => {
                const selected = isAccountSelected(account);
                return (
                  <div
                    key={account.id}
                    onClick={() => onBankAccountSelect(account.id)}
                    className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                      selected
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300 bg-white"
                    }`}
                  >
                    {selected && (
                      <div className="absolute -top-2 -right-2 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
                        <FaCheck size={12} />
                      </div>
                    )}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-3xl">
                        {getBankLogo(account.bank_name)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">
                          {account.bank_name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {account.account_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-gray-400">Account Number</p>
                        <p className="font-mono font-semibold">
                          {account.account_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400">Currency</p>
                        <p className="font-semibold text-blue-600">
                          {account.currency}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUniversity className="text-blue-500 text-3xl" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                No Bank Accounts Linked
              </h4>
              <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                Connect your US bank account via Plaid to enable secure USD
                deposits.
              </p>
              <button
                type="button"
                onClick={handleAddBankAccount}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
              >
                Connect Bank Account
              </button>
            </div>
          )}

          {/* Selection Summary */}
          {selectedAccountDetails && (
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <FaRegCheckCircle className="text-green-600 text-xl" />
                <h4 className="font-bold text-green-900">
                  Account Verified & Selected
                </h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-green-700/70">Bank</p>
                  <p className="font-bold text-green-900">
                    {selectedAccountDetails.bank_name}
                  </p>
                </div>
                <div>
                  <p className="text-green-700/70">Account</p>
                  <p className="font-bold text-green-900">
                    {selectedAccountDetails.account_number}
                  </p>
                </div>
                <div>
                  <p className="text-green-700/70">Routing</p>
                  <p className="font-bold text-green-900">
                    {selectedAccountDetails.routing_number}
                  </p>
                </div>
                <div>
                  <p className="text-green-700/70">Security</p>
                  <p className="font-bold text-green-900 flex items-center">
                    <FaLock className="mr-1 text-[10px]" /> Encrypted
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default USDBankDepositInfo;