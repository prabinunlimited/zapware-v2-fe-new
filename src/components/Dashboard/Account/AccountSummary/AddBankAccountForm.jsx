// src/components/AccountSummary/AddBankAccountForm.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from 'react-redux';
import {
    FiX,
    FiSave,
    FiAlertCircle,
    FiCheckCircle,
    FiChevronDown
} from "react-icons/fi";
import {
    fetchTransitCodes,
    selectTransitCodes,
    selectTransitCodesLoading,
    addBankAccount,
    selectAddingBankAccount,
    selectAddBankAccountSuccess,
    selectAddBankAccountError,
    fetchServiceProviderCurrencies,
    selectServiceProviderCurrencies,
    selectCurrenciesLoading,
} from "../AccountSummary/AccountSlice";

import {
    selectCountriesOptions,
    selectCountriesLoading,
    fetchCountries,
} from "../../../../features/Auth/slices/countrySlice"

import Select from 'react-select';

const AddBankAccountForm = ({ isOpen, onClose, onSuccess, accountData }) => {
    const [formData, setFormData] = useState({
        bank_id: "",
        customer_id: "",
        currency_type_id: "",
        account_name: "",
        account_number_type: "account_number_1",
        bank_name: "",
        account_number: "",
        transit_code_type: "aba_number_5",
        transit_code: "",
        country_code: "",
        account_description: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const dispatch = useDispatch();
    const transitCodes = useSelector(selectTransitCodes);
    const transitCodesLoading = useSelector(selectTransitCodesLoading);

    const addingBankAccount = useSelector(selectAddingBankAccount);
    const addBankAccountSuccess = useSelector(selectAddBankAccountSuccess);
    const addBankAccountError = useSelector(selectAddBankAccountError);

    const countryOptions = useSelector(selectCountriesOptions);
    const countriesLoading = useSelector(selectCountriesLoading);

    const serviceProviderCurrencies = useSelector(selectServiceProviderCurrencies);
    const currenciesLoading = useSelector(selectCurrenciesLoading);

    const serviceProviderId = accountData?.service_provider_id;

    const [responseModal, setResponseModal] = useState({
        isOpen: false,
        type: '', // 'success' or 'error'
        title: '',
        messages: [],
        inputErrors: [],
    });

    const authtoken = useSelector((state) => state.auth?.token);

    // Pre-fill form with existing account data from API
    React.useEffect(() => {
        if (accountData) {
            setFormData({
                bank_id: accountData.customer_bank_account_id || accountData.account_id || "",
                customer_id: accountData.customer_id || "",
                currency_type_id: accountData.currency || "",
                account_name: accountData.account_name || "",
                account_number_type: "account_number_1",
                bank_name: accountData.bank_name || "",
                account_number: accountData.account_number || "",
                transit_code_type: "aba_number_5",
                transit_code: accountData.routing_number || accountData.sort_code || "",
                country_code: accountData.bank_country || "",
                account_description: accountData.description || "",
            });
        }
    }, [accountData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            const payload = {
                bank_id: formData.bank_id,
                customer_id: formData.customer_id,
                currency_type_id: formData.currency_type_id,
                account_name: formData.account_name,
                account_number_type: formData.account_number_type,
                bank_name: formData.bank_name,
                account_number: formData.account_number,
                country_code: formData.country_code,
                account_description: formData.account_description || "",
            };

            if (formData.account_number_type === 'account_number_1') {
                payload.transit_code_type = formData.transit_code_type;
                payload.transit_code = formData.transit_code || "";
            }

            const result = await dispatch(addBankAccount({ payload, authtoken }));

            if (result.meta.requestStatus === 'fulfilled') {
                setResponseModal({
                    isOpen: true,
                    type: 'success',
                    title: '✅ Bank Account Added Successfully!',
                    messages: ['Your bank account has been added successfully.'],
                    inputErrors: [],
                });
                
                onSuccess?.(result.payload);
            } else {
                const errorPayload = result.payload;
                let errorMessages = [];
                let inputErrors = [];

                if (errorPayload?.data?.data?.input_errors && Array.isArray(errorPayload.data.data.input_errors)) {
                    inputErrors = errorPayload.data.data.input_errors;
                    errorMessages = inputErrors.map(err => `${err.ID}: ${err.description}`);
                }
                else if (errorPayload?.data?.input_errors && Array.isArray(errorPayload.data.input_errors)) {
                    inputErrors = errorPayload.data.input_errors;
                    errorMessages = inputErrors.map(err => `${err.ID}: ${err.description}`);
                }
                else if (errorPayload?.input_errors && Array.isArray(errorPayload.input_errors)) {
                    inputErrors = errorPayload.input_errors;
                    errorMessages = inputErrors.map(err => `${err.ID}: ${err.description}`);
                }
                else if (errorPayload?.data?.global_errors && Array.isArray(errorPayload.data.global_errors)) {
                    errorMessages = errorPayload.data.global_errors;
                }
                else if (errorPayload?.message) {
                    errorMessages = [errorPayload.message];
                }
                else if (typeof errorPayload === 'string') {
                    errorMessages = [errorPayload];
                }
                else {
                    errorMessages = ['Failed to add bank account. Please try again.'];
                }

                if (errorMessages.length === 0 && inputErrors.length === 0) {
                    const findInputErrors = (obj) => {
                        if (!obj) return null;
                        if (obj.input_errors && Array.isArray(obj.input_errors)) {
                            return obj.input_errors;
                        }
                        if (obj.data?.input_errors && Array.isArray(obj.data.input_errors)) {
                            return obj.data.input_errors;
                        }
                        if (obj.data?.data?.input_errors && Array.isArray(obj.data.data.input_errors)) {
                            return obj.data.data.input_errors;
                        }
                        for (const key of Object.keys(obj)) {
                            if (typeof obj[key] === 'object') {
                                const result = findInputErrors(obj[key]);
                                if (result) return result;
                            }
                        }
                        return null;
                    };

                    const foundErrors = findInputErrors(errorPayload);
                    if (foundErrors && foundErrors.length > 0) {
                        inputErrors = foundErrors;
                        errorMessages = foundErrors.map(err => `${err.ID}: ${err.description}`);
                    }
                }

                setResponseModal({
                    isOpen: true,
                    type: 'error',
                    title: '❌ Failed to Add Bank Account',
                    messages: errorMessages.length > 0 ? errorMessages : ['Failed to add bank account. Please try again.'],
                    inputErrors: inputErrors,
                });
            }
        } catch (err) {
            setResponseModal({
                isOpen: true,
                type: 'error',
                title: '❌ Error',
                messages: [err.message || 'An error occurred while adding the account'],
                inputErrors: [],
            });
        }
    };

    const resetForm = () => {
        setFormData({
            bank_id: "",
            customer_id: "",
            currency_type_id: "",
            account_name: "",
            account_number_type: "account_number_1",
            bank_name: "",
            account_number: "",
            transit_code_type: "aba_number_5",
            transit_code: "",
            country_code: "",
            account_description: "",
        });
        setError(null);
        setSuccess(false);
    };

    const getFlagEmoji = (countryCode) => {
        if (!countryCode) return '🏳️';
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt());
        return String.fromCodePoint(...codePoints);
    };

    const countrySelectOptions = React.useMemo(() => {
        return countryOptions.map((country) => ({
            value: country.country_code || country.value,
            label: `${country.phone_code || ''} ${country.label} (${country.country_code})`,
            country_code: country.country_code,
            phone_code: country.phone_code,
            flag: getFlagEmoji(country.country_code),
        }));
    }, [countryOptions]);

    useEffect(() => {
        if (isOpen && authtoken) {
            dispatch(fetchTransitCodes({ authtoken }));
            dispatch(fetchCountries());
            if (serviceProviderId) {
                dispatch(fetchServiceProviderCurrencies({
                    serviceProviderId: serviceProviderId,
                    authtoken
                }));
            }
        }
    }, [isOpen, authtoken, dispatch, serviceProviderId]);

    if (!isOpen && !responseModal.isOpen) return null;

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-2 sm:mx-4"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base sm:text-lg font-bold text-white truncate">
                                Add Bank Account
                            </h2>
                            <p className="text-xs sm:text-sm text-white text-opacity-90 truncate">
                                Fill in the details to add a new bank account
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 sm:p-1 text-white hover:text-white transition-colors rounded-full hover:bg-white hover:bg-opacity-20 flex-shrink-0"
                        >
                            <FiX size={20} />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-130px)] sm:max-h-[calc(90vh-120px)]">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Bank ID - Auto-filled from API */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Bank ID
                                </label>
                                <input
                                    type="text"
                                    name="bank_id"
                                    value={formData.bank_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
                                    disabled
                                />
                            </div>

                            {/* Customer ID - Auto-filled from API */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Customer ID
                                </label>
                                <input
                                    type="text"
                                    name="customer_id"
                                    value={formData.customer_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
                                    disabled
                                />
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Currency Type *
                                </label>
                                <div className="relative">
                                    <select
                                        name="currency_type_id"
                                        value={formData.currency_type_id}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none text-sm"
                                    >
                                        <option value="">
                                            {currenciesLoading ? 'Loading currencies...' : 'Select Currency'}
                                        </option>
                                        {serviceProviderCurrencies.map((currency) => (
                                            <option
                                                key={currency.id || currency.code || currency.currency_code}
                                                value={currency.code || currency.currency_code || currency.id}
                                            >
                                                {currency.code || currency.currency_code || currency.name}
                                            </option>
                                        ))}
                                    </select>
                                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>

                            {/* Account Number Type */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Account Number Type
                                </label>
                                <div className="relative">
                                    <select
                                        name="account_number_type"
                                        value={formData.account_number_type}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none text-sm"
                                    >
                                        <option value="account_number_1">Account Number</option>
                                        <option value="iban_3">IBAN</option>
                                    </select>
                                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>

                            {/* Account Name */}
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Account Name *
                                </label>
                                <input
                                    type="text"
                                    name="account_name"
                                    value={formData.account_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                    placeholder="Enter account name"
                                />
                            </div>

                            {/* Country Code */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Country Code *
                                </label>
                                <Select
                                    options={countrySelectOptions}
                                    isLoading={countriesLoading}
                                    isSearchable={true}
                                    placeholder="Search for a country..."
                                    className="w-full"
                                    classNamePrefix="react-select"
                                    value={countrySelectOptions.find(option => option.value === formData.country_code)}
                                    onChange={(selected) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            country_code: selected ? selected.value : '',
                                        }));
                                    }}
                                    formatOptionLabel={(option) => (
                                        <div className="flex items-center gap-2">
                                            <span>{option.flag || '🏳️'}</span>
                                            <span className="text-sm">{option.label}</span>
                                        </div>
                                    )}
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            borderColor: state.isFocused ? '#8b5cf6' : '#d1d5db',
                                            boxShadow: state.isFocused ? '0 0 0 2px rgba(139, 92, 246, 0.2)' : 'none',
                                            '&:hover': {
                                                borderColor: '#8b5cf6',
                                            },
                                            padding: '0 4px',
                                            borderRadius: '0.5rem',
                                            minHeight: '42px',
                                            fontSize: '14px',
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            borderRadius: '0.5rem',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                            zIndex: 9999,
                                            maxHeight: '300px',
                                            overflow: 'auto',
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isFocused ? '#f3e8ff' : 'transparent',
                                            color: state.isFocused ? '#6b21a5' : '#1f2937',
                                            '&:hover': {
                                                backgroundColor: '#f3e8ff',
                                                color: '#6b21a5',
                                            },
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                        }),
                                        placeholder: (base) => ({
                                            ...base,
                                            color: '#9ca3af',
                                            fontSize: '14px',
                                        }),
                                        singleValue: (base) => ({
                                            ...base,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                        }),
                                        input: (base) => ({
                                            ...base,
                                            fontSize: '14px',
                                        }),
                                    }}
                                />
                            </div>

                            {/* Bank Name */}
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Bank Name *
                                </label>
                                <input
                                    type="text"
                                    name="bank_name"
                                    value={formData.bank_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                    placeholder="Enter bank name"
                                />
                            </div>

                            {/* Account Number */}
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Account Number *
                                </label>
                                <input
                                    type="text"
                                    name="account_number"
                                    value={formData.account_number}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                    placeholder="Enter account number"
                                />
                            </div>

                            {/* Transit Code Fields - Only show when Account Number is selected */}
                            {formData.account_number_type === 'account_number_1' && (
                                <>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                            Transit Code Type
                                        </label>
                                        <div className="relative">
                                            <select
                                                name="transit_code_type"
                                                value={formData.transit_code_type}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none text-sm"
                                            >
                                                <option value="">Select Transit Code</option>
                                                {transitCodes.map((code) => (
                                                    <option key={code.id || code.code} value={code.code_value || code.value}>
                                                        {code.label || code.name || code.code}
                                                    </option>
                                                ))}
                                            </select>
                                            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                            Transit Code
                                        </label>
                                        <input
                                            type="text"
                                            name="transit_code"
                                            value={formData.transit_code}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                            placeholder="Enter transit code (ABA/SWIFT/Sort Code)"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Account Description */}
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Account Description
                                </label>
                                <textarea
                                    name="account_description"
                                    value={formData.account_description}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                    placeholder="Enter account description"
                                />
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex flex-col-reverse sm:flex-row space-y-reverse space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={addingBankAccount || success}
                                className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                {addingBankAccount ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Adding...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiSave size={16} />
                                        <span>Add Bank Account</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Response Modal */}
                {responseModal.isOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className={`px-4 sm:px-6 py-4 ${responseModal.type === 'success'
                                ? 'bg-gradient-to-r from-green-600 to-green-700'
                                : 'bg-gradient-to-r from-red-600 to-red-700'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base sm:text-lg font-bold text-white">
                                        {responseModal.title}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setResponseModal({ ...responseModal, isOpen: false });
                                            if (responseModal.type === 'success') {
                                                resetForm();
                                                onClose();
                                            }
                                        }}
                                        className="p-1 text-white hover:text-white transition-colors rounded-full hover:bg-white hover:bg-opacity-20"
                                    >
                                        <FiX size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-4 sm:p-6 max-h-[50vh] overflow-y-auto">
                                {responseModal.type === 'success' ? (
                                    <div className="flex items-start gap-3">
                                        <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={24} />
                                        <div>
                                            {responseModal.messages.map((msg, index) => (
                                                <p key={index} className="text-sm sm:text-base text-gray-700">{msg}</p>
                                            ))}
                                            <p className="text-xs sm:text-sm text-gray-500 mt-2">
                                                The bank account has been added to your account.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-start gap-3 mb-4">
                                            <FiAlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={24} />
                                            <div className="flex-1 min-w-0">
                                                {responseModal.messages.map((msg, index) => (
                                                    <p key={index} className="text-sm sm:text-base text-gray-700 break-words">{msg}</p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setResponseModal({ ...responseModal, isOpen: false });
                                        if (responseModal.type === 'success') {
                                            resetForm();
                                            onClose();
                                        }
                                    }}
                                    className={`w-full px-4 py-2.5 sm:py-2 ${responseModal.type === 'success'
                                        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:opacity-90'
                                        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:opacity-90'
                                        } text-white text-sm font-medium rounded-lg transition-all`}
                                >
                                    {responseModal.type === 'success' ? 'Done' : 'Close'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

AddBankAccountForm.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func,
    accountData: PropTypes.object,
};

export default AddBankAccountForm;