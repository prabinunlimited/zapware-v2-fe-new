// SuccessPopup.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaDownload, FaTimes, FaPrint } from 'react-icons/fa';

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <FaCheck className="text-white text-3xl" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Deposit {isManualDeposit ? 'Instructions Sent' : 'Successful'}
          </h2>
          <p className="text-green-100">
            {isManualDeposit 
              ? 'Follow the instructions to complete your deposit'
              : 'Your deposit has been processed successfully'
            }
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Amount:</span>
                <p className="font-semibold text-gray-900">
                  {selectedCurrency} {parseFloat(amount).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Reference:</span>
                <p className="font-mono text-gray-900">
                  {transaction.reference_id || 'N/A'}
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

          {/* Manual Deposit Instructions */}
          {isManualDeposit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-yellow-800 mb-2">
                Next Steps:
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Visit the designated deposit location</li>
                <li>• Provide your reference number</li>
                <li>• Complete the cash deposit</li>
                <li>• Keep the deposit slip</li>
                <li>• Funds will be available in 1-3 business days</li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
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
              Download Receipt
            </button>

            <button
              onClick={() => window.print()}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center"
            >
              <FaPrint className="mr-2" />
              Print
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SuccessPopup;