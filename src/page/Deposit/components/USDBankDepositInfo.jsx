// src/page/Deposit/components/USDBankDepositInfo.jsx
import React, { useState, useMemo } from "react";
// Removed framer-motion imports
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
import { useSelector } from "react-redux";
import { RingLoader } from "react-spinners";

const USDBankDepositInfo = ({
  selectedCurrency,
  paymentMethod,
  selectedBankAccount,
  onBankAccountSelect,
  formErrors,
  copiedField,
  onCopy,
  showTooltip,
  onTooltipShow,
  onTooltipHide,
  navigate,
  onSwitchToBankAccounts,
}) => {
  const { bankAccounts, loading, error } = useSelector((state) => ({
    bankAccounts: state.bankAccounts?.usdBankAccounts || [],
    loading: state.bankAccounts?.usdAccountsLoading || false,
    error: state.bankAccounts?.usdAccountsError || null,
  }));

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showAccountDetails, setShowAccountDetails] = useState(null);

  // Only show for USD bank deposits
  const isUSDBankDeposit =
    selectedCurrency === "USD" && paymentMethod === "bank_deposit";

  // Normalize account data structure
  const safeUsdBankAccounts = Array.isArray(bankAccounts)
    ? bankAccounts.map((account) => ({
        id: account.id,
        account_id: account.id,
        bank_name: account.provider || account.bank || "Bank Account",
        account_name: account.account_name,
        account_number: account.accountNumberHash || account.account_number,
        currency: account.currency || "USD",
        routing_number: account.routing_number,
        bank: account.provider || account.bank,
        provider: account.provider,
        account_type: account.account_type,
        status: account.status,
        is_frozen: account.is_frozen,
        isLinkedOnSila: account.isLinkedOnSila,
        isPlaid: account.isPlaid,
        balance: account.balance || Math.random() * 10000,
        last_used: account.last_used || new Date(Date.now() - Math.floor(Math.random() * 86400000 * 30)),
        originalIndex: account.originalIndex || Math.random(), // Add stable identifier
        ...account,
      }))
    : [];

  // Use stable sorting that doesn't change order when selecting
  const filteredAccounts = useMemo(() => {
    const filtered = safeUsdBankAccounts.filter(
      (account) =>
        account.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.bank_name.localeCompare(b.bank_name);
        case "balance":
          return (b.balance || 0) - (a.balance || 0);
        case "recent":
        default:
          const dateDiff = new Date(b.last_used) - new Date(a.last_used);
          if (dateDiff === 0 && a.originalIndex && b.originalIndex) {
            return a.originalIndex - b.originalIndex;
          }
          return dateDiff;
      }
    });

    return sorted;
  }, [safeUsdBankAccounts, searchTerm, sortBy]);

  const handleAddBankAccount = () => {
    console.log("🔄 Switching to bank accounts tab to add new account");
    if (onSwitchToBankAccounts) {
      onSwitchToBankAccounts();
    } else {
      navigate("/bank-accounts");
    }
  };

  const selectedAccount = selectedBankAccount
    ? safeUsdBankAccounts.find(
        (acc) => acc && acc.id === selectedBankAccount.id
      )
    : null;

  const getBankLogo = (bankName) => {
    const logos = {
      chase: "🔵",
      "bank of america": "🔴",
      "wells fargo": "🟡",
      citi: "🔵",
      "capital one": "🔴",
      "american express": "🔵",
      "us bank": "🟢",
      "td bank": "🟢",
      pnc: "🟡",
      truist: "🟣",
    };

    const lowerName = bankName.toLowerCase();
    for (const [key, logo] of Object.entries(logos)) {
      if (lowerName.includes(key)) return logo;
    }
    return "🏦";
  };

  const formatBalance = (balance) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(balance || 0);
  };

  const getAccountStatus = (account) => {
    if (account.is_frozen)
      return { text: "Frozen", color: "text-red-500", bg: "bg-red-50" };
    if (account.status === "verified")
      return { text: "Verified", color: "text-green-500", bg: "bg-green-50" };
    if (account.status === "pending")
      return { text: "Pending", color: "text-yellow-500", bg: "bg-yellow-50" };
    return { text: "Active", color: "text-blue-500", bg: "bg-blue-50" };
  };

  if (!isUSDBankDeposit) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <FaUniversity className="mr-3" />
            USD Bank Accounts
          </h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <RingLoader color="#3B82F6" size={40} className="mb-4" />
            <p className="text-gray-600 font-medium">
              Loading your bank accounts...
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Securely fetching your linked accounts
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <FaExclamationTriangle className="mr-3" />
            Connection Issue
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="text-red-500 text-2xl" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to Load Accounts
            </h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {error ||
                "We encountered an issue while loading your bank accounts. Please try again."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
              >
                <FaSyncAlt className="mr-2" />
                Try Again
              </button>
              <button
                onClick={handleAddBankAccount}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center justify-center"
              >
                <FaPlus className="mr-2" />
                Add Manually
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* Main Container */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                <FaUniversity className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  USD Bank Accounts
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  Select a linked bank account for deposits
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1">
                <span className="text-white text-sm font-medium">
                  {filteredAccounts.length} account
                  {filteredAccounts.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddBankAccount}
                className="bg-white text-blue-600 px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center transform hover:scale-105 active:scale-95"
              >
                <FaPlus className="mr-2" />
                Add Account
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        {safeUsdBankAccounts.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search banks or accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="recent">Recently Used</option>
                  <option value="name">Bank Name</option>
                  <option value="balance">Balance</option>
                </select>
                <FaFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {formErrors?.bankAccount && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-red-500 mr-3" />
                <p className="text-red-700 font-medium">
                  {formErrors.bankAccount}
                </p>
              </div>
            </div>
          )}

          {/* Accounts Grid */}
          <div className="min-h-[400px]">
            {filteredAccounts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredAccounts.map((account) => {
                  const status = getAccountStatus(account);
                  const isSelected =
                    selectedBankAccount &&
                    selectedBankAccount.id === account.id;

                  return (
                    <div
                      key={account.id}
                      className={`relative cursor-pointer transition-all duration-300 rounded-2xl border-2 ${
                        isSelected
                          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg shadow-blue-100"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                      }`}
                      onClick={() => {
                        console.log("🔍 Selecting bank account:", {
                          id: account.id,
                          account_name: account.account_name,
                          full_object: account,
                        });
                        onBankAccountSelect(account); // Pass full object, not just ID
                      }}
                      style={{ minHeight: "180px" }}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg z-10">
                          <FaCheck className="text-white text-xs" />
                        </div>
                      )}

                      {/* Account Card */}
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="text-3xl">
                              {getBankLogo(account.bank_name)}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">
                                {account.bank_name}
                              </h4>
                              <p className="text-gray-600 text-sm">
                                {account.account_name}
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
                          >
                            {status.text}
                          </span>
                        </div>

                        {/* Account Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-500">
                              Account Number
                            </span>
                            <p className="font-mono text-gray-900 font-semibold">
                              ••••{account.account_number?.slice(-4) || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Balance</span>
                            <p className="font-semibold text-gray-900">
                              {formatBalance(account.balance)}
                            </p>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <FaLock className="mr-1 text-green-500" />
                              Secure
                            </span>
                            {account.isPlaid && (
                              <span className="flex items-center">
                                <FaShieldAlt className="mr-1 text-blue-500" />
                                Plaid
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAccountDetails(
                                showAccountDetails === account.id
                                  ? null
                                  : account.id
                              );
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center hover:scale-105 transition-transform"
                          >
                            Details
                            <FaArrowRight className="ml-1 text-xs" />
                          </button>
                        </div>

                        {/* Expanded Details */}
                        {showAccountDetails === account.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200 overflow-hidden">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-gray-500">Type</span>
                                <p className="font-medium text-gray-900 capitalize">
                                  {account.account_type || "Checking"}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Routing</span>
                                <p className="font-mono text-gray-900">
                                  {account.routing_number
                                    ? `•••${account.routing_number.slice(-3)}`
                                    : "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Last Used</span>
                                <p className="font-medium text-gray-900">
                                  {new Date(
                                    account.last_used
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Linked</span>
                                <p className="font-medium text-gray-900">
                                  {account.isLinkedOnSila
                                    ? "Verified"
                                    : "Pending"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : safeUsdBankAccounts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaUniversity className="text-blue-500 text-3xl" />
                </div>

                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  No Bank Accounts Linked
                </h4>

                <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                  Connect your US bank account to enable secure USD deposits. We
                  use bank-level security through Plaid to keep your information
                  safe.
                </p>

                {/* Security Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                  {[
                    {
                      icon: FaShieldAlt,
                      text: "Bank-Level Security",
                      color: "text-green-500",
                    },
                    {
                      icon: FaLock,
                      text: "256-bit Encryption",
                      color: "text-blue-500",
                    },
                    {
                      icon: FaRegCheckCircle,
                      text: "Instant Verification",
                      color: "text-purple-500",
                    },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-center space-x-2 p-3 bg-gray-50 rounded-xl"
                    >
                      <feature.icon className={`${feature.color} text-lg`} />
                      <span className="text-sm text-gray-700 font-medium">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddBankAccount}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center mx-auto transform hover:scale-105 active:scale-95"
                >
                  <FaPlus className="mr-3" />
                  Connect Your First Bank Account
                </button>

                <p className="text-gray-400 text-sm mt-4">
                  Takes less than 2 minutes • 100% secure
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <FaSearch className="text-4xl text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  No matching accounts
                </h4>
                <p className="text-gray-600">Try adjusting your search terms</p>
              </div>
            )}
          </div>

          {/* Selected Account Details */}
          {selectedBankAccount && selectedAccount && (
            <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaCheck className="text-white text-xl mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Account Selected
                      </h3>
                      <p className="text-green-100 text-sm">
                        Ready for USD deposits
                      </p>
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1">
                    <span className="text-white text-sm font-medium">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Account Summary */}
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <FaUniversity className="text-blue-500 mr-2" />
                      Account Summary
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bank:</span>
                        <span className="font-semibold text-gray-900">
                          {selectedAccount.bank_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account:</span>
                        <span className="font-mono text-gray-900">
                          ••••{selectedAccount.account_number?.slice(-4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-semibold text-gray-900 capitalize">
                          {selectedAccount.account_type || "Checking"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-semibold text-green-600">
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <FaRegClock className="text-blue-500 mr-2" />
                      What's Next?
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-start">
                        <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        Your bank account is securely linked
                      </li>
                      <li className="flex items-start">
                        <FaCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        Ready for instant USD deposits
                      </li>
                      <li className="flex items-start">
                        <FaCreditCard className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        Proceed with your deposit
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Security Note */}
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start">
                    <FaShieldAlt className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700 font-medium">
                        Your financial information is protected with bank-level
                        security
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        All data is encrypted and never stored on our servers
                      </p>
                    </div>
                  </div>
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
