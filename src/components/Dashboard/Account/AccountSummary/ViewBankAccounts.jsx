// src/components/AccountSummary/ViewBankAccounts.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import {
    FiX,
    FiChevronRight,
    FiList,
    FiInfo,
    FiEdit2,
    FiSave,
    FiXCircle,
    FiAlertCircle,
    FiCheckCircle,
    FiChevronLeft,
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL;

const InfoRow = ({ label, value, isEditing, editName, setEditName, editActiveStatus, setEditActiveStatus }) => (
    <div className="flex items-start gap-2 sm:gap-3 py-2 border-b border-gray-100 last:border-0">
        <FiInfo className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
            {isEditing && (label === 'Account Name' || label === 'Status') ? (
                <div className="mt-1">
                    {label === 'Account Name' ? (
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-1.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Enter account name"
                            autoFocus
                        />
                    ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-1">
                            <button
                                onClick={() => setEditActiveStatus("1")}
                                className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${editActiveStatus === "1"
                                    ? 'bg-green-500 text-white shadow-sm'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }`}
                            >
                                <FiCheckCircle size={14} />
                                <span className="whitespace-nowrap">Yes (Active)</span>
                            </button>
                            <button
                                onClick={() => setEditActiveStatus("0")}
                                className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${editActiveStatus === "0"
                                    ? 'bg-red-500 text-white shadow-sm'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }`}
                            >
                                <FiXCircle size={14} />
                                <span className="whitespace-nowrap">No (Inactive)</span>
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    {label === 'Status' ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${value === '1'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${value === '1' ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                            {value === '1' ? 'Active' : 'Inactive'}
                        </span>
                    ) : (
                        <p className="text-sm text-gray-900 font-medium break-words">{value || 'N/A'}</p>
                    )}
                </div>
            )}
        </div>
    </div>
);

const ViewBankAccounts = ({ isOpen, onClose, customerId, onEdit }) => {
    const [bankAccounts, setBankAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [editingAccount, setEditingAccount] = useState(null);
    const [editName, setEditName] = useState("");
    const [editActiveStatus, setEditActiveStatus] = useState("1");
    const [isSaving, setIsSaving] = useState(false);
    const [showMobileList, setShowMobileList] = useState(true);

    // Response Modal States
    const [responseModal, setResponseModal] = useState({
        isOpen: false,
        type: '',
        title: '',
        message: '',
        statMessage: '',
    });

    useEffect(() => {
        if (isOpen && customerId) {
            fetchBankAccounts();
        }
    }, [isOpen, customerId]);

    useEffect(() => {
        // Show list view on mobile when modal opens
        if (isOpen) {
            setShowMobileList(true);
        }
    }, [isOpen]);

    const fetchBankAccounts = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/transfermate/view-bank-accounts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ customer_id: customerId }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch bank accounts');
            }

            const result = await response.json();
            const banks = result?.data?.banks || [];
            setBankAccounts(banks);
            if (banks.length > 0) {
                setSelectedAccount(banks[0]);
                // On mobile, show list view by default
                setShowMobileList(true);
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching bank accounts:', err);
        } finally {
            setLoading(false);
        }
    };

    const getBankIcon = (bankName) => {
        const key = bankName?.toLowerCase() || '';
        if (key.includes('bank of america')) return '🏛️';
        if (key.includes('chase')) return '🏦';
        if (key.includes('wells fargo')) return '🏢';
        if (key.includes('hsbc')) return '🌍';
        return '🏦';
    };

    const handleEditClick = (account) => {
        setEditingAccount(account);
        setEditName(account.account_name || '');
        setEditActiveStatus(account.active || "1");
    };

    const handleCancelEdit = () => {
        setEditingAccount(null);
        setEditName('');
        setEditActiveStatus("1");
    };

    const handleSaveEdit = async () => {
        if (!editingAccount || !editName.trim()) {
            setResponseModal({
                isOpen: true,
                type: 'error',
                title: 'Failed to Update Bank Account',
                message: 'Account name cannot be empty',
                statMessage: 'Please enter a valid account name',
            });
            return;
        }

        setIsSaving(true);

        try {
            const payload = {
                customer_id: customerId,
                account_id: editingAccount.id || editingAccount.uid,
                account_name: editName.trim(),
                is_active: parseInt(editActiveStatus),
            };

            const response = await fetch(`${API_URL}/transfermate/edit-bank-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.status === 'error' || !response.ok) {
                let errorMessage = result?.message || 'Failed to update bank account';
                let statMessage = '';

                if (result?.data?.input_errors && result.data.input_errors.length > 0) {
                    const errorDescriptions = result.data.input_errors.map(err =>
                        `ID: ${err.ID}\nDescription: ${err.description}`
                    ).join('\n\n');
                    statMessage = errorDescriptions;
                }
                else if (result?.data?.global_errors && result.data.global_errors.length > 0) {
                    statMessage = result.data.global_errors.join('\n');
                }
                else if (result?.data?.messages && result.data.messages.length > 0) {
                    statMessage = result.data.messages.join('\n');
                }
                else if (result?.data?.is_successful === false) {
                    statMessage = 'Operation was not successful';
                }

                setResponseModal({
                    isOpen: true,
                    type: 'error',
                    title: 'Failed to Update Bank Account',
                    message: errorMessage,
                    statMessage: statMessage || 'Please check the information and try again',
                });
                return;
            }

            const updatedAccounts = bankAccounts.map(account => {
                if (account.uid === editingAccount.uid || account.id === editingAccount.id) {
                    return {
                        ...account,
                        account_name: editName.trim(),
                        active: editActiveStatus,
                    };
                }
                return account;
            });

            setBankAccounts(updatedAccounts);

            if (selectedAccount?.uid === editingAccount.uid || selectedAccount?.id === editingAccount.id) {
                setSelectedAccount({
                    ...selectedAccount,
                    account_name: editName.trim(),
                    active: editActiveStatus,
                });
            }

            setEditingAccount(null);
            setEditName('');
            setEditActiveStatus("1");

            setResponseModal({
                isOpen: true,
                type: 'success',
                title: '✅ Bank Account Updated Successfully!',
                message: 'The bank account details have been updated successfully.',
                statMessage: '',
            });

            if (onEdit) {
                onEdit(result);
            }

        } catch (err) {
            setResponseModal({
                isOpen: true,
                type: 'error',
                title: 'Failed to Update Bank Account',
                message: err.message || 'An unexpected error occurred',
                statMessage: 'Please try again later',
            });
            console.error('Error updating account:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const closeResponseModal = () => {
        setResponseModal({
            isOpen: false,
            type: '',
            title: '',
            message: '',
            statMessage: '',
        });
        if (responseModal.type === 'success') {
            onClose();
        }
    };

    const handleSelectAccount = (account) => {
        setSelectedAccount(account);
        if (editingAccount?.uid !== account.uid) {
            setEditingAccount(null);
            setEditName('');
            setEditActiveStatus("1");
        }
        // On mobile, switch to detail view
        if (window.innerWidth < 768) {
            setShowMobileList(false);
        }
    };

    const handleBackToList = () => {
        setShowMobileList(true);
        // Cancel editing if active
        if (editingAccount) {
            handleCancelEdit();
        }
    };

    const handleMobileClose = () => {
        setShowMobileList(true);
        onClose();
    };

    // Response Modal Component
    const ResponseModal = () => (
        <AnimatePresence>
            {responseModal.isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden mx-4"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`px-4 sm:px-6 py-4 ${responseModal.type === 'success'
                            ? 'bg-gradient-to-r from-green-600 to-green-700'
                            : 'bg-gradient-to-r from-red-600 to-red-700'
                            }`}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-base sm:text-lg font-bold text-white">
                                    {responseModal.title}
                                </h3>
                                <button
                                    onClick={closeResponseModal}
                                    className="p-1 text-white hover:text-white transition-colors rounded-full hover:bg-white hover:bg-opacity-20"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6">
                            {responseModal.type === 'success' ? (
                                <div className="flex items-start gap-3">
                                    <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={24} />
                                    <div>
                                        <p className="text-gray-700">{responseModal.message}</p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            The bank account has been updated successfully.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-start gap-3">
                                        <FiAlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={24} />
                                        <div className="flex-1">
                                            <p className="text-gray-700 font-medium">{responseModal.message}</p>
                                            {responseModal.statMessage && (
                                                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200 overflow-auto max-h-48">
                                                    {responseModal.statMessage.split('\n\n').map((errorBlock, index) => {
                                                        const lines = errorBlock.split('\n');
                                                        return (
                                                            <div key={index} className="text-sm">
                                                                {lines.map((line, lineIndex) => {
                                                                    if (line.startsWith('ID:')) {
                                                                        return (
                                                                            <p key={lineIndex} className="text-red-700 font-medium">
                                                                                {line}
                                                                            </p>
                                                                        );
                                                                    }
                                                                    if (line.startsWith('Description:')) {
                                                                        return (
                                                                            <p key={lineIndex} className="text-red-600 ml-2 mb-2">
                                                                                {line}
                                                                            </p>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })}
                                                                {index < responseModal.statMessage.split('\n\n').length - 1 && (
                                                                    <hr className="my-2 border-red-200" />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={closeResponseModal}
                                className={`w-full px-4 py-2 ${responseModal.type === 'success'
                                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:opacity-90'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90'
                                    } text-white text-sm font-medium rounded-lg transition-all`}
                            >
                                {responseModal.type === 'success' ? 'Done' : 'Close'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4"
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
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-2 sm:mx-4"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                        {/* Mobile back button */}
                                        {!showMobileList && (
                                            <button
                                                onClick={handleBackToList}
                                                className="md:hidden p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                                            >
                                                <FiChevronLeft size={20} />
                                            </button>
                                        )}
                                        <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg flex-shrink-0">
                                            <FiList className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-sm sm:text-lg font-bold text-white truncate">
                                                {!showMobileList && window.innerWidth < 768
                                                    ? 'Account Details'
                                                    : 'Bank Accounts'}
                                            </h2>
                                            <p className="text-xs sm:text-sm text-white/80 truncate">
                                                {bankAccounts.length} account{bankAccounts.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleMobileClose}
                                        className="p-1 text-white hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
                                    >
                                        <FiX size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex flex-col md:flex-row h-[calc(90vh-140px)] sm:h-[calc(90vh-160px)]">
                                {/* Sidebar - Account List */}
                                <div className={`${showMobileList ? 'flex' : 'hidden'} md:flex md:w-72 flex-col border-r border-gray-200 overflow-y-auto`}>
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                                        </div>
                                    ) : error ? (
                                        <div className="p-4 text-red-500 text-sm text-center">{error}</div>
                                    ) : bankAccounts.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <p>No bank accounts found</p>
                                        </div>
                                    ) : (
                                        <div className="p-2 sm:p-3 space-y-2">
                                            {bankAccounts.map((account) => (
                                                <button
                                                    key={account.uid}
                                                    onClick={() => handleSelectAccount(account)}
                                                    className={`w-full text-left p-2.5 sm:p-3 rounded-xl transition-all ${selectedAccount?.uid === account.uid
                                                        ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                                                        : 'hover:bg-gray-50 border-2 border-transparent'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <span className="text-xl sm:text-2xl flex-shrink-0">{getBankIcon(account.bank_name)}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {account.account_name || 'Unnamed Account'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {account.bank_name || 'Unknown Bank'}
                                                            </p>
                                                            <p className="text-xs text-gray-400">{account.currency || 'N/A'}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <span className={`w-2 h-2 rounded-full ${account.active === '1' ? 'bg-green-500' : 'bg-red-500'
                                                                }`} />
                                                            <FiChevronRight className={`w-4 h-4 ${selectedAccount?.uid === account.uid ? 'text-blue-500' : 'text-gray-300'
                                                                }`} />
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Main Content - Account Details */}
                                <div className={`${!showMobileList ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-y-auto p-4 sm:p-6`}>
                                    {selectedAccount ? (
                                        <div className="space-y-4">
                                            {/* Account Header */}
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-gray-200 gap-3 sm:gap-0">
                                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto">
                                                    <span className="text-2xl sm:text-3xl flex-shrink-0">{getBankIcon(selectedAccount.bank_name)}</span>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                                                            {selectedAccount.account_name}
                                                        </h3>
                                                        <p className="text-xs sm:text-sm text-gray-500 truncate">{selectedAccount.bank_name}</p>
                                                    </div>
                                                </div>
                                                {!editingAccount && (
                                                    <button
                                                        onClick={() => handleEditClick(selectedAccount)}
                                                        className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                                    >
                                                        <FiEdit2 size={16} />
                                                        <span>Edit</span>
                                                    </button>
                                                )}
                                                {editingAccount && (
                                                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            disabled={isSaving || !editName.trim()}
                                                            className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                        >
                                                            <FiSave size={16} />
                                                            <span>{isSaving ? 'Saving...' : 'Save'}</span>
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <FiXCircle size={16} />
                                                            <span>Cancel</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Account Details */}
                                            <div className="space-y-1">
                                                <InfoRow
                                                    label="Account Name"
                                                    value={selectedAccount.account_name}
                                                    isEditing={editingAccount?.uid === selectedAccount.uid}
                                                    editName={editName}
                                                    setEditName={setEditName}
                                                />
                                                <InfoRow
                                                    label="Status"
                                                    value={selectedAccount.active}
                                                    isEditing={editingAccount?.uid === selectedAccount.uid}
                                                    editActiveStatus={editActiveStatus}
                                                    setEditActiveStatus={setEditActiveStatus}
                                                />
                                                <InfoRow
                                                    label="Account Description"
                                                    value={selectedAccount.account_description}
                                                />
                                                <InfoRow
                                                    label="Bank Name"
                                                    value={selectedAccount.bank_name}
                                                />
                                                <InfoRow
                                                    label="Country"
                                                    value={selectedAccount.country}
                                                />
                                                <InfoRow
                                                    label="Currency"
                                                    value={selectedAccount.currency}
                                                />
                                                <InfoRow
                                                    label="Bank Details"
                                                    value={selectedAccount.bank_details}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            {loading ? 'Loading...' : 'Select an account to view details'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-2">
                                <span className="text-xs text-gray-500 text-center sm:text-left">
                                    {bankAccounts.length} account{bankAccounts.length !== 1 ? 's' : ''} available
                                </span>
                                <button
                                    onClick={handleMobileClose}
                                    className="w-full sm:w-auto px-3 sm:px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Response Modal */}
            <ResponseModal />
        </>
    );
};

ViewBankAccounts.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    customerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onEdit: PropTypes.func,
};

export default ViewBankAccounts;