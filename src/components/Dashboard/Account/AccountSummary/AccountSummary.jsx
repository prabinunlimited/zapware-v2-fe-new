import React, { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import ClipLoader from "react-spinners/ClipLoader";

// Components
import Modal from "./Modal";
import TransactionDetails from "../Transaction/TransactionDetails";

// Redux
import {
  fetchAccountDetails,
  setSelectedAccount,
  setSelectedCurrency,
  updateAccountBalance,
  selectAccounts,
  selectSelectedAccount,
  selectSelectedCurrency,
  selectAccountLoading,
  selectBalanceLoading,
  selectAccountError,
} from "../../Account/AccountSummary/AccountSlice";
import {
  exportTransactionsToExcel,
  selectExporting,
} from "../../Account/Transaction/TransactionSlice";
import {
  setAccountDropdownOpen,
  openAccountDetailsModal,
  closeAccountDetailsModal,
  selectAccountDropdown,
  selectAccountDetailsModal,
} from "../../../../features/Auth/slices/uiSlice";
import { usePartnerConfig } from "../../../../hooks/usePartnerConfig";
import { selectAuthToken, selectBearerToken } from "../../../../features/Auth/slices/authSlice";
import { extractErrorMessage, SafeErrorDisplay } from "../../../../utils/errorHandling";

const AccountSummary = ({ textColor, onCurrencyChange }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { customerId } = useParams();

  // Refs
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Redux Selectors with safety checks
  const accounts = useSelector(selectAccounts) || [];
  const selectedAccount = useSelector(selectSelectedAccount);
  const selectedCurrency = useSelector(selectSelectedCurrency);
  const accountLoading = useSelector(selectAccountLoading);
  const balanceLoading = useSelector(selectBalanceLoading);
  const accountError = useSelector(selectAccountError);
  const exporting = useSelector(selectExporting);
  const accountDropdown = useSelector(selectAccountDropdown);
  const accountDetailsModal = useSelector(selectAccountDetailsModal);
  const authtoken = useSelector(selectAuthToken);
  const bearertoken = useSelector(selectBearerToken);

  // Hooks
  const config = usePartnerConfig(authtoken);
  const headerColor = config?.header_color || localStorage.getItem("header_color");
  const textColorFromConfig = config?.text_color || localStorage.getItem("text_color") || textColor;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        dispatch(setAccountDropdownOpen(false));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dispatch]);

  // Fetch account details on component mount
  useEffect(() => {
    if (customerId && authtoken) {
      dispatch(fetchAccountDetails({ customerId, authtoken }));
    }
  }, [customerId, authtoken, dispatch]);

  // Handlers
  const handleDropdownToggle = () => {
    dispatch(setAccountDropdownOpen(!accountDropdown.isOpen));
  };

  const handleAccountChange = useCallback((account) => {
    dispatch(setSelectedAccount(account));
    const newCurrency = account.currency || "all";
    dispatch(setSelectedCurrency(newCurrency));
    
    // Notify parent component about currency change
    if (onCurrencyChange) {
      onCurrencyChange(newCurrency);
    }
    
    dispatch(setAccountDropdownOpen(false));
  }, [dispatch, onCurrencyChange]);

  const handleAccountDetailsClick = () => {
    if (selectedAccount) {
      dispatch(openAccountDetailsModal(selectedAccount));
    }
  };

  const handleCloseModal = () => {
    dispatch(closeAccountDetailsModal());
  };

  const handleBankLetter = () => {
    if (!customerId) {
      alert("Customer ID not found!");
      return;
    }

    navigate(`/bankletter/${customerId}`, {
      state: { accountData: selectedAccount },
    });
  };

  const handleExcelExport = useCallback(() => {
    if (customerId && bearertoken) {
      dispatch(exportTransactionsToExcel({ customerId, bearertoken }));
    }
  }, [customerId, bearertoken, dispatch]);

  const handleBalanceUpdate = useCallback(async () => {
    if (customerId && selectedAccount && authtoken) {
      dispatch(updateAccountBalance({ customerId, authtoken }));
    }
  }, [customerId, selectedAccount, authtoken, dispatch]);

  const handleTransactionComplete = async () => {
    // Optional: Refresh data after transaction
    // await handleBalanceUpdate();
  };

  // Style helpers
  const getTextColorStyle = () => {
    if (textColorFromConfig && textColorFromConfig.startsWith("text-")) {
      return { className: textColorFromConfig };
    } else if (textColorFromConfig && textColorFromConfig.startsWith("#")) {
      return { style: { color: textColorFromConfig } };
    }
    return {};
  };

  const getHeaderColorStyle = () => {
    if (headerColor && headerColor.startsWith("bg-")) {
      return { className: headerColor };
    } else if (headerColor && headerColor.startsWith("#")) {
      return { style: { backgroundColor: headerColor } };
    }
    return { className: "bg-blue-600" };
  };

  const textColorProps = getTextColorStyle();
  const headerColorProps = getHeaderColorStyle();

  // ✅ FIX: Safe error handling
  if (accountError) {
    return <SafeErrorDisplay error={accountError} className="text-red-500 text-center p-4" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col justify-center items-center w-full"
    >
      <div className="w-full flex flex-wrap justify-center md:justify-evenly items-center rounded-lg p-2 border border-black gap-4">
        {/* Dropdown */}
        <div className="relative">
          <motion.button
            ref={buttonRef}
            onClick={handleDropdownToggle}
            className="w-60 p-2 rounded-md bg-gray-300 text-black relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={accountLoading}
          >
            {selectedAccount?.flag_url ? (
              <div className="flex justify-center items-center gap-1">
                <img
                  src={selectedAccount.flag_url}
                  alt={`${selectedAccount.currency} flag`}
                  className="w-6 h-6 object-cover rounded-full"
                />
                <span className="text-center font-medium">
                  {selectedAccount.currency}
                </span>
                <FiChevronDown />
              </div>
            ) : (
              <span className="text-center font-medium">
                {accountLoading ? "Loading..." : "Select Account"}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {accountDropdown.isOpen && accounts && accounts.length > 0 && (
              <motion.div
                ref={dropdownRef}
                className="absolute bg-white shadow-md rounded-md mt-2 w-60 z-10"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {accounts.map((account) => (
                  <motion.button
                    key={account.currency}
                    onClick={() => handleAccountChange(account)}
                    className="block w-full p-2 rounded-md bg-gray-300 text-black hover:bg-sky-800 hover:text-white"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2">
                      {account.flag_url && (
                        <img
                          src={account.flag_url}
                          alt={`${account.currency} flag`}
                          className="w-6 h-6 object-cover rounded-full"
                        />
                      )}
                      <span>{account.currency}</span>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Balance */}
        <div>
          <h1 className="text-3xl text-sky-900 font-bold">
            {selectedAccount?.available_balance !== undefined
              ? `${selectedAccount.available_balance}`
              : "0"}
          </h1>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row w-full flex-wrap gap-2 justify-center">
          {customerId && Number(customerId) === 167 && (
            <motion.button
              onClick={handleBalanceUpdate}
              className={`w-full sm:w-44 rounded-md py-2 text-white ${headerColorProps.className}`}
              style={headerColorProps.style}
              disabled={balanceLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <p className="text-xs">
                {balanceLoading ? (
                  <span className="flex items-center justify-center gap-2 text-white">
                    <ClipLoader color="#ffffff" size={15} />
                    Updating...
                  </span>
                ) : (
                  <span>Update Balance</span>
                )}
              </p>
            </motion.button>
          )}

          <motion.button
            onClick={handleAccountDetailsClick}
            className={`w-full sm:w-72 rounded-md py-2 text-white ${headerColorProps.className}`}
            style={headerColorProps.style}
            disabled={!selectedAccount}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <p className="text-xs text-white">Account Details</p>
          </motion.button>

          <motion.button
            onClick={handleBankLetter}
            className={`w-full sm:w-44 rounded-md py-2 text-white ${headerColorProps.className}`}
            style={headerColorProps.style}
            disabled={!selectedAccount}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <p className="text-xs text-white">Bank Letter</p>
          </motion.button>

          <motion.button
            onClick={handleExcelExport}
            className={`w-full sm:w-44 rounded-md py-2 text-white ${headerColorProps.className}`}
            style={headerColorProps.style}
            disabled={exporting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <p className="text-xs text-white">
              {exporting ? "Exporting..." : "Export in Excel"}
            </p>
          </motion.button>
        </div>
      </div>

      <motion.div
        className="w-full h-full bg-white rounded-lg shadow-lg mt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {accountLoading ? (
          <div className="flex justify-center items-center h-32">
            <ClipLoader color="#36d7b7" size={50} />
          </div>
        ) : (
          <TransactionDetails
            customerId={customerId}
            selectedCurrencyCode={selectedCurrency}
            onTransactionComplete={handleTransactionComplete}
            key={selectedCurrency}
          />
        )}
      </motion.div>

      {/* Account Details Modal */}
      <AnimatePresence>
        {accountDetailsModal.isOpen && accountDetailsModal.data && (
          <Modal
            isOpen={accountDetailsModal.isOpen}
            onClose={handleCloseModal}
            accountData={accountDetailsModal.data}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AccountSummary;