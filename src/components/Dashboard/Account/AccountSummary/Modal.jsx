// src/components/AccountSummary/Modal.jsx
import React from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

const Modal = ({ isOpen, onClose, accountData }) => {
  if (!isOpen || !accountData) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Account Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="space-y-3">
          {accountData.flag_url && (
            <div className="flex items-center gap-2 mb-4">
              <img
                src={accountData.flag_url}
                alt={`${accountData.currency} flag`}
                className="w-8 h-8 object-cover rounded-full"
              />
              <span className="text-lg font-semibold">{accountData.currency}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Account Number</label>
              <p className="text-gray-800">{accountData.account_number || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">IBAN</label>
              <p className="text-gray-800">{accountData.iban || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Available Balance</label>
              <p className="text-gray-800 font-semibold">
                {accountData.available_balance || "0"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Currency</label>
              <p className="text-gray-800">{accountData.currency || "N/A"}</p>
            </div>
            {accountData.bank_name && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600">Bank Name</label>
                <p className="text-gray-800">{accountData.bank_name}</p>
              </div>
            )}
            {accountData.branch_name && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600">Branch Name</label>
                <p className="text-gray-800">{accountData.branch_name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  accountData: PropTypes.shape({
    currency: PropTypes.string,
    account_number: PropTypes.string,
    iban: PropTypes.string,
    available_balance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    flag_url: PropTypes.string,
    bank_name: PropTypes.string,
    branch_name: PropTypes.string,
  }),
};

export default Modal;