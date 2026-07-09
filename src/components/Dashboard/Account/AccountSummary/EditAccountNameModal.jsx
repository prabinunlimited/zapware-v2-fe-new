// src/components/AccountSummary/EditAccountNameModal.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiSave, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import PropTypes from "prop-types";

const API_URL = import.meta.env.VITE_API_URL;

const EditAccountNameModal = ({
    isOpen,
    onClose,
    currentAccountName,
    accountId,
    customerId,
    onSuccess
}) => {
    const [newAccountName, setNewAccountName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setNewAccountName("");
            setError("");
            setShowSuccessModal(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate
        if (!newAccountName.trim()) {
            setError("Account name cannot be empty");
            return;
        }

        if (newAccountName.trim() === currentAccountName) {
            setError("New name is the same as current name");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/transfermate/edit-global-bank-account`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customer_id: customerId,
                    account_name: newAccountName.trim(),
                    account_id: accountId
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update account name");
            }

            // Show success modal
            setShowSuccessModal(true);
            
            // Close and refresh after 2 seconds
            setTimeout(() => {
                setShowSuccessModal(false);
                onClose();
                window.location.reload();
            }, 2000);

        } catch (err) {
            setError(err.message || "Failed to update account name. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop */}
                        <motion.div
                            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                        />

                        {/* Modal */}
                        <motion.div
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white">
                                        Edit Account Name
                                    </h3>
                                    <button
                                        onClick={onClose}
                                        className="p-1 text-white hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                                        disabled={isLoading}
                                    >
                                        <FiX size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <form onSubmit={handleSubmit} className="p-6">
                                {/* Current Name Display */}
                                <div className="mb-4">
                                    <label className="text-sm font-medium text-gray-600 block mb-1">
                                        Existing Account Name
                                    </label>
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <p className="text-sm text-gray-900 break-words">
                                            {currentAccountName || "N/A"}
                                        </p>
                                    </div>
                                </div>

                                {/* New Name Input */}
                                <div className="mb-4">
                                    <label htmlFor="newAccountName" className="text-sm font-medium text-gray-700 block mb-1">
                                        New Account Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="newAccountName"
                                        type="text"
                                        value={newAccountName}
                                        onChange={(e) => {
                                            setNewAccountName(e.target.value);
                                            if (error) setError("");
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500"
                                            }`}
                                        placeholder="Enter new account name"
                                        disabled={isLoading}
                                        autoFocus
                                    />
                                    {error && (
                                        <div className="mt-2 flex items-center gap-1.5 text-red-500 text-sm">
                                            <FiAlertCircle size={14} />
                                            <span>{error}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading || !newAccountName.trim() || newAccountName.trim() === currentAccountName}
                                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FiSave size={16} />
                                                <span>Save Changes</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success Modal - Moved OUTSIDE the main modal */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-xl p-8 max-w-sm text-center mx-4"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900">Success!</h3>
                            <p className="text-gray-600 mt-2">Account name updated successfully.</p>
                            {/* <p className="text-gray-400 text-sm mt-4">Redirecting...</p> */}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

EditAccountNameModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    currentAccountName: PropTypes.string,
    accountId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    customerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onSuccess: PropTypes.func,
};

export default EditAccountNameModal;