import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaDownload, FaTimes, FaPrint, FaInfoCircle } from 'react-icons/fa';

const SuccessPopup = ({
  transaction,
  isManualDeposit,
  amount,
  selectedCurrency,
  onClose,
  onDownload
}) => {
  if (!transaction) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Animated Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center relative overflow-hidden">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                <FaCheck className="text-white text-3xl" />
              </motion.div>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-2xl font-bold text-white mb-2"
            >
              {isManualDeposit ? 'Instructions Sent' : 'Deposit Successful!'}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-green-100"
            >
              {isManualDeposit 
                ? 'Check your email for deposit instructions'
                : `${selectedCurrency} ${parseFloat(amount).toLocaleString()} deposited successfully`
              }
            </motion.p>
          </div>

          {/* Enhanced Content */}
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="space-y-4"
            >
              {/* Transaction Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Transaction Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <p className="font-semibold text-gray-900">
                      {selectedCurrency} {parseFloat(amount).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Reference:</span>
                    <p className="font-mono text-gray-900 text-xs">
                      {transaction.reference_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="font-semibold text-gray-900">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="font-semibold text-green-600">
                      {isManualDeposit ? 'Pending' : 'Completed'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              {isManualDeposit && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="bg-blue-50 border border-blue-200 rounded-xl p-4"
                >
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <FaInfoCircle className="mr-2" />
                    Next Steps
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Check your email for detailed instructions
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Follow the provided deposit process
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Allow 1-3 business days for processing
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      Contact support if needed
                    </li>
                  </ul>
                </motion.div>
              )}
            </motion.div>

            {/* Enhanced Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="flex space-x-3 mt-6"
            >
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center"
              >
                <FaTimes className="mr-2" />
                Close
              </button>
              
              <button
                onClick={() => onDownload(transaction)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center"
              >
                <FaDownload className="mr-2" />
                Receipt
              </button>

              <button
                onClick={() => window.print()}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center"
              >
                <FaPrint className="mr-2" />
                Print
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SuccessPopup;