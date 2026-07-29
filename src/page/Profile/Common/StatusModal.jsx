import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

export const SuccessModal = ({ show, message, onClose }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center"
            >
                <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Success</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className="w-full py-2.5 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Close
                </button>
            </motion.div>
        </div>
    );
};

export const ErrorModal = ({ show, message, onClose }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center"
            >
                <FaInfoCircle className="text-red-500 text-4xl mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Something went wrong</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className="w-full py-2.5 px-6 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                    Close
                </button>
            </motion.div>
        </div>
    );
};