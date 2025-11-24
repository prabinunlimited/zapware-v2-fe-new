import React from 'react';
import { motion } from 'framer-motion';
import { FaUniversity, FaTrash, FaCheck } from 'react-icons/fa';

const AccountCard = ({ account, onDelete, isDeleting }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FaUniversity className="text-blue-600 text-xl" />
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {account.account_name || 'Bank Account'}
            </h3>
            <p className="text-gray-600 text-sm">
              {account.account_number ? `••••${account.account_number.slice(-4)}` : 'Account details'}
            </p>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {account.currency || 'USD'}
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center">
                <FaCheck className="mr-1" size={8} />
                Verified
              </span>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDelete}
          disabled={isDeleting}
          className={`p-2 rounded-lg transition-colors ${
            isDeleting
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-50 text-red-600 hover:bg-red-100'
          }`}
          title="Delete account"
        >
          {isDeleting ? (
            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FaTrash className="text-lg" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default AccountCard;