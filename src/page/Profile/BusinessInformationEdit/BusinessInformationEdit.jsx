import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { RingLoader } from 'react-spinners';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaSave, FaTimes, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import Select from 'react-select';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Redux selectors and actions
import {
    fetchCountries,
    fetchStatesByCountry,
    selectCountries,
    selectCountriesLoading,
    selectStates,
    selectStatesLoading,
    selectCountriesOptions,
} from '../../../features/Auth/slices/countrySlice';

import {
    fetchInstitutionAccountTypes,
    selectInstitutionAccountTypes,
    selectInstitutionAccountTypesLoading,
    fetchInstitutionTypes,
    selectInstitutionTypes,
    fetchEmployeesNumberTypes,
    selectEmployeesNumberTypes,
    selectEmployeesNumberLoading,
    fetchIndustryTypes,
    selectIndustryTypes,
} from '../../../features/Auth/slices/institutionRegistrationSlice';

import { SuccessModal, ErrorModal } from '../Common/StatusModal'

const API_URL = import.meta.env.VITE_API_URL;

// ===================== FIELD STYLES =====================
const FIELD_STYLES = {
    base: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200",
    disabled: "bg-gray-100 opacity-60 cursor-not-allowed",
    error: "border-red-500 focus:ring-red-500",
    success: "border-green-500 focus:ring-green-500",
};

// ===================== CUSTOM SELECT COMPONENT =====================
const CustomSelect = ({
    id,
    label,
    name,
    value,
    onChange,
    onBlur,
    options = [],
    touched,
    error,
    required = false,
    disabled = false,
    isLoading = false,
    placeholder = "Select...",
    isMulti = false,
    isCountryField = false,
    showPhoneCode = false,
    className = "",
    ...props
}) => {
    const customStyles = {
        control: (base, state) => ({
            ...base,
            minHeight: "50px",
            borderColor: touched && error ? "#ef4444" : "#d1d5db",
            borderRadius: "0.5rem",
            padding: "0.25rem 0.5rem",
            fontSize: "0.875rem",
            "&:hover": {
                borderColor: touched && error ? "#ef4444" : "#9ca3af",
            },
            backgroundColor: disabled ? "#f3f4f6" : "white",
            opacity: disabled ? 0.6 : 1,
        }),
        placeholder: (base) => ({
            ...base,
            fontSize: "0.875rem",
            color: "#6b7280",
        }),
        menu: (base) => ({
            ...base,
            fontSize: "0.875rem",
            zIndex: 9999,
        }),
        singleValue: (base) => ({
            ...base,
            fontSize: "0.875rem",
        }),
        option: (base, state) => ({
            ...base,
            fontSize: "0.875rem",
            backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#eff6ff" : "white",
            color: state.isSelected ? "white" : "#1f2937",
            "&:hover": {
                backgroundColor: "#eff6ff",
            },
        }),
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Select
                inputId={id}
                name={name}
                options={options}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                isDisabled={disabled}
                isLoading={isLoading}
                isMulti={isMulti}
                placeholder={placeholder}
                isSearchable={true}
                className="basic-single"
                classNamePrefix="select"
                styles={customStyles}
                {...props}
            />
            {touched && error && (
                <div className="text-red-500 text-xs mt-1 flex items-center">
                    <FaInfoCircle className="mr-1 w-3 h-3" />
                    {error}
                </div>
            )}
        </div>
    );
};

// ===================== FORM FIELD COMPONENT =====================
const FormField = ({
    id,
    label,
    name,
    value,
    onChange,
    onBlur,
    onFocus,
    touched,
    error,
    required = false,
    disabled = false,
    placeholder = "",
    type = "text",
    rows = 3,
    as = "input",
    fieldStyles = FIELD_STYLES,
    className = "",
    ...props
}) => {
    const baseClasses = `${fieldStyles.base} ${disabled ? fieldStyles.disabled : ""} ${touched && error ? fieldStyles.error : ""} ${className}`;

    if (as === "textarea") {
        return (
            <div className="space-y-2">
                <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <textarea
                    id={id}
                    name={name}
                    value={value || ""}
                    onChange={onChange}
                    onBlur={onBlur}
                    onFocus={onFocus}
                    disabled={disabled}
                    placeholder={placeholder}
                    rows={rows}
                    className={baseClasses}
                    {...props}
                />
                {touched && error && (
                    <div className="text-red-500 text-xs mt-1 flex items-center">
                        <FaInfoCircle className="mr-1 w-3 h-3" />
                        {error}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
                id={id}
                name={name}
                type={type}
                value={value || ""}
                onChange={onChange}
                onBlur={onBlur}
                onFocus={onFocus}
                disabled={disabled}
                placeholder={placeholder}
                className={baseClasses}
                {...props}
            />
            {touched && error && (
                <div className="text-red-500 text-xs mt-1 flex items-center">
                    <FaInfoCircle className="mr-1 w-3 h-3" />
                    {error}
                </div>
            )}
        </div>
    );
};

// ===================== MAIN COMPONENT =====================
const BusinessInformationEdit = () => {
    const { customerId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const authtoken = localStorage.getItem('authtoken');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeField, setActiveField] = useState("");
    const [zipDebounceTimer, setZipDebounceTimer] = useState(null);
    const [isZipLoading, setIsZipLoading] = useState(false);
    const [showPepPopup, setShowPepPopup] = useState(false);

    // Redux selectors - FIXED: Using correct selectors
    const countries = useSelector(selectCountriesOptions);
    const countriesLoading = useSelector(selectCountriesLoading);
    const states = useSelector(selectStates);
    const statesLoading = useSelector(selectStatesLoading);

    const institutionAccountTypes = useSelector(selectInstitutionAccountTypes);
    const institutionAccountTypesLoading = useSelector(selectInstitutionAccountTypesLoading);

    // NEW: Institution Types - separate from Account Types
    const institutionTypes = useSelector(selectInstitutionTypes);
    const institutionTypesLoading = useSelector(
        state => state.institutionRegistration?.institutionTypesLoading || false
    );

    // NEW: Employees Number Types
    const employeesNumberTypes = useSelector(selectEmployeesNumberTypes);
    const employeesNumberLoading = useSelector(selectEmployeesNumberLoading);

    // NEW: Industry Types
    const industryTypes = useSelector(selectIndustryTypes);

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [isTrustType, setIsTrustType] = useState(false);

    // Local state for form data
    const [formData, setFormData] = useState({
        institution_account_type_id: "",
        institution_type_id: "",
        institution_name: "",
        registration_number: "",
        business_alias: "",
        business_type: "",
        industry_type: "",
        annual_equivalent_amount_currency: "",
        annual_equivalent_amount: "",
        purpose_of_account: "",
        no_of_trading_names: 0,
        trading_names_list: [],
        business_website_social_media: "",
        trust_purpose: "",
        tax_id: "",
        business_model_overview: "",
        business_size: "",
        high_risk_countries: 0,
        specify_high_risk_countries: [],
        conducting_payment_activities: "",
        employees_number: "",
        reason_for_payments: "",
        product_services_required: "",
        beneficiary_types: "",
        beneficiary_types_other: "",
        beneficiary_industries_top_5: "",
        expected_frequency_payments_out: "",
        expected_avg_payments_out_currency: "",
        expected_avg_payments_out_amount: "",
        sender_types: "",
        sender_types_other: "",
        sender_industries_top_5: "",
        countries_to_receive_funds_from: [],
        countries_to_send_funds_to: [],
        expected_frequency_payments_in: "",
        expected_avg_payments_in_currency: "",
        expected_avg_payments_in_amount: "",
        registered_address_street_country: "",
        registered_address_street_zip: "",
        registered_address_street_1: "",
        registered_address_street_2: "",
        registered_address_street_city: "",
        registered_address_street_state: "",
        registered_business_address_apartment_unit_no: "",
        registered_business_address_suburb: "",
        date_incorporation: "",
        pep_associated: "0",
        same_as_registered_address: 0,
        principal_business_address_country: "",
        principal_business_address_postal_code: "",
        principal_business_street: "",
        principal_business_address_city: "",
        principal_business_address_state: "",
        principal_business_address_apartment_unit_no: "",
        principal_business_address_suburb: "",
        ein: "",
        naice_code: "",
        business_email: "",
        business_website: "",
        company_phone_number: "",
        companyphone_countrycode: "",
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // ===================== LOAD BUSINESS DATA =====================
    useEffect(() => {
        const fetchBusinessInfo = async () => {
            try {
                const customerUuid = localStorage.getItem('customerUuid');
                if (!customerUuid) {
                    throw new Error('Customer UUID not found');
                }

                const response = await axios.get(
                    `${API_URL}/customers/business-information/${customerUuid}`,
                    { headers: { Authorization: `Bearer ${authtoken}` } }
                );

                if (response.data && response.data.data) {
                    const data = response.data.data;
                    setFormData({
                        institution_account_type_id: data.institution_account_type_id || "",
                        institution_type_id: data.institution_type_id || "",
                        institution_name: data.institution_name || "",
                        registration_number: data.registration_number || "",
                        business_alias: data.business_alias || "",
                        business_type: data.business_type || "",
                        industry_type: data.industry_type_id || data.industry_type || "",
                        annual_equivalent_amount_currency: data.annual_equivalent_amount_currency || "",
                        annual_equivalent_amount: data.annual_equivalent_amount || "",
                        purpose_of_account: data.purpose_of_account || "",
                        no_of_trading_names: data.no_of_trading_names || 0,
                        trading_names_list: data.trading_names_list || [],
                        business_website_social_media: data.business_website_social_media || "",
                        trust_purpose: data.trust_purpose || "",
                        tax_id: data.tax_id || "",
                        business_model_overview: data.business_model_overview || "",
                        business_size: data.business_size || "",
                        high_risk_countries: data.high_risk_countries || 0,
                        specify_high_risk_countries: data.specify_high_risk_countries || [],
                        conducting_payment_activities: data.conducting_payment_activities || "",
                        employees_number: data.employees_number || "",
                        reason_for_payments: data.reason_for_payments || "",
                        product_services_required: data.product_services_required || "",
                        beneficiary_types: data.beneficiary_types || "",
                        beneficiary_types_other: data.beneficiary_types_other || "",
                        beneficiary_industries_top_5: data.beneficiary_industries_top_5 || "",
                        expected_frequency_payments_out: data.expected_frequency_payments_out || "",
                        expected_avg_payments_out_currency: data.expected_avg_payments_out_currency || "",
                        expected_avg_payments_out_amount: data.expected_avg_payments_out_amount || "",
                        sender_types: data.sender_types || "",
                        sender_types_other: data.sender_types_other || "",
                        sender_industries_top_5: data.sender_industries_top_5 || "",
                        countries_to_receive_funds_from: data.countries_to_receive_funds_from || [],
                        countries_to_send_funds_to: data.countries_to_send_funds_to || [],
                        expected_frequency_payments_in: data.expected_frequency_payments_in || "",
                        expected_avg_payments_in_currency: data.expected_avg_payments_in_currency || "",
                        expected_avg_payments_in_amount: data.expected_avg_payments_in_amount || "",
                        registered_address_street_country: data.registered_address_street_country_id || "",
                        registered_address_street_zip: data.registered_address_street_zip || "",
                        registered_address_street_1: data.registered_address_street_1 || "",
                        registered_address_street_2: data.registered_address_street_2 || "",
                        registered_address_street_city: data.registered_address_street_city || "",
                        registered_address_street_state: data.registered_address_street_state || "",
                        registered_business_address_apartment_unit_no: data.registered_business_address_apartment_unit_no || "",
                        registered_business_address_suburb: data.registered_business_address_suburb || "",
                        date_incorporation: data.date_incorporation || "",
                        pep_associated: data.pep_associated || "0",
                        same_as_registered_address: data.same_as_registered_address || 0,
                        principal_business_address_country: data.principal_business_address_country || "",
                        principal_business_address_postal_code: data.principal_business_address_postal_code || "",
                        principal_business_street: data.principal_business_street || "",
                        principal_business_address_city: data.principal_business_address_city || "",
                        principal_business_address_state: data.principal_business_address_state || "",
                        principal_business_address_apartment_unit_no: data.principal_business_address_apartment_unit_no || "",
                        principal_business_address_suburb: data.principal_business_address_suburb || "",
                        ein: data.ein || "",
                        naice_code: data.naice_code || "",
                        business_email: data.business_email || "",
                        business_website: data.business_website || data.business_webiste || "",
                        company_phone_number: data.company_phone_number || "",
                        companyphone_countrycode: data.companyphone_countrycode || "",
                    });
                }
            } catch (error) {
                console.error('Error fetching business info:', error);
                toast.error(error.response?.data?.message || 'Failed to load business information');
            } finally {
                setLoading(false);
            }
        };

        const fetchDropdownData = async () => {
            try {
                await dispatch(fetchCountries());
                await dispatch(fetchInstitutionAccountTypes());
                await dispatch(fetchInstitutionTypes()); // NEW: Fetch institution types
                await dispatch(fetchEmployeesNumberTypes()); // NEW: Fetch employees number types
                await dispatch(fetchIndustryTypes()); // NEW: Fetch industry types
            } catch (error) {
                console.error('Error fetching dropdown data:', error);
            }
        };

        fetchBusinessInfo();
        fetchDropdownData();

        return () => {
            if (zipDebounceTimer) {
                clearTimeout(zipDebounceTimer);
            }
        };
    }, [customerId, authtoken, dispatch]);

    // ===================== FETCH STATES WHEN COUNTRY CHANGES =====================
    useEffect(() => {
        if (formData.registered_address_street_country) {
            const timer = setTimeout(() => {
                dispatch(fetchStatesByCountry(formData.registered_address_street_country));
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [formData.registered_address_street_country, dispatch]);

    // ===================== HANDLE CHANGES =====================
    const handleChange = (field) => (e) => {
        const value = e?.target?.value ?? e;
        setFormData(prev => ({ ...prev, [field]: value }));
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleSelectChange = (field) => (option) => {
        const value = option?.value ?? option;
        setFormData(prev => ({ ...prev, [field]: value }));
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleMultiSelectChange = (field) => (selectedOptions) => {
        const values = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
        setFormData(prev => ({ ...prev, [field]: values }));
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    // ===================== ZIP LOOKUP =====================
    const handleZipLookup = useCallback(async (zipCode, countryId, fieldPrefix = 'registered_address_street_') => {
        const country = countries.find(opt => opt.value === countryId);
        if (!country || !country.country_code) return;

        setIsZipLoading(true);
        try {
            const response = await axios.get(
                `${API_URL}/location/lookup`,
                {
                    params: {
                        countryCode: country.country_code,
                        zipCode: zipCode
                    },
                    headers: { Authorization: `Bearer ${authtoken}` }
                }
            );

            if (response.data.success) {
                if (response.data.city) {
                    setFormData(prev => ({
                        ...prev,
                        [`${fieldPrefix}city`]: response.data.city
                    }));
                }
                if (response.data.state) {
                    setFormData(prev => ({
                        ...prev,
                        [`${fieldPrefix}state`]: response.data.state
                    }));
                }
                toast.success(`Location auto-filled: ${response.data.city}, ${response.data.state}`);
            }
        } catch (error) {
            console.error('ZIP lookup failed:', error);
        } finally {
            setIsZipLoading(false);
        }
    }, [countries, authtoken]);

    // ===================== HANDLE SUBMIT =====================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            const customerUuid = localStorage.getItem('customerUuid');
            const authCustomerId = localStorage.getItem('authcustomer_id');
            if (!customerUuid) {
                throw new Error('Customer UUID not found');
            }

            // Clean up trading names list
            const cleanTradingNames = (formData.trading_names_list || [])
                .filter(name => name && name.trim() !== "");

            // Map form data to API expected payload
            const payload = {
                // Institution & Business Info
                institution_account_type_id: formData.institution_account_type_id ? parseInt(formData.institution_account_type_id) : null,
                institution_type_id: formData.institution_type_id ? parseInt(formData.institution_type_id) : null,
                business_name: formData.institution_name, // Map institution_name to business_name
                registration_number: formData.registration_number,
                industry_type_id: formData.industry_type ? parseInt(formData.industry_type) : null,
                purpose_of_account: formData.purpose_of_account,

                // Registered Address
                registered_country_id: formData.registered_address_street_country ? parseInt(formData.registered_address_street_country) : null,
                registered_address_zip_code: formData.registered_address_street_zip,
                registered_address_street_1: formData.registered_address_street_1,
                registered_address_street_2: formData.registered_address_street_2,
                registered_address_city: formData.registered_address_street_city,
                registered_address_state: formData.registered_address_street_state,
                registered_address_apartment_no: formData.registered_business_address_apartment_unit_no,
                registered_address_suburb: formData.registered_business_address_suburb,

                // Financial Info
                annual_equivalent_amount_currency: formData.annual_equivalent_amount_currency,
                annual_equivalent_amount: formData.annual_equivalent_amount ? String(formData.annual_equivalent_amount) : "",

                // Trading Names
                no_of_trading_names: cleanTradingNames.length,
                trading_names_list: cleanTradingNames,

                // Social Media / Website
                social_media_website: formData.business_website_social_media || formData.business_website,

                // Tax & Compliance
                tax_id: formData.tax_id,
                is_pep_associated: formData.pep_associated === "1" ? 1 : 0,
                date_incorporation: formData.date_incorporation,

                // Principal Address
                principal_address_same_as_registered_address: formData.same_as_registered_address || 0,
                principal_address_country_id: formData.principal_business_address_country ? parseInt(formData.principal_business_address_country) : null,
                principal_address_zip_code: formData.principal_business_address_postal_code,
                principal_address_street: formData.principal_business_street,
                principal_address_city: formData.principal_business_address_city,
                principal_address_state: formData.principal_business_address_state,
                principal_address_apartment_unit_no: formData.principal_business_address_apartment_unit_no,
                principal_address_suburb: formData.principal_business_address_suburb,

                // Business Details
                high_risk_countries_involved: formData.high_risk_countries || 0,
                high_risk_countries: formData.specify_high_risk_countries || [],
                business_model_overview: formData.business_model_overview,
                business_size: formData.business_size,
                conducting_payment_activities: formData.conducting_payment_activities,
                no_of_employees: formData.employees_number,
                reason_for_payments: formData.reason_for_payments,
                product_services_required: formData.product_services_required,

                // Beneficiary Info
                beneficiary_types: formData.beneficiary_types,
                beneficiary_types_other: formData.beneficiary_types_other || "",
                beneficiary_industries_top_5: formData.beneficiary_industries_top_5,

                // Payments Out
                expected_frequency_payments_out: formData.expected_frequency_payments_out,
                expected_average_payments_out_currency: formData.expected_avg_payments_out_currency,
                expected_average_payments_out_amount: formData.expected_avg_payments_out_amount ? String(formData.expected_avg_payments_out_amount) : "",

                // Sender Info
                sender_types: formData.sender_types,
                sender_types_other: formData.sender_types_other || "",
                sender_industries_top_5: formData.sender_industries_top_5,

                // Countries
                customer_receiving_funds_countries: formData.countries_to_receive_funds_from || [],
                customer_sending_countries: formData.countries_to_send_funds_to || [],

                // Payments In
                expected_frequency_payments_in: formData.expected_frequency_payments_in,
                expected_average_payments_in_currency: formData.expected_avg_payments_in_currency,
                expected_average_payments_in_amount: formData.expected_avg_payments_in_amount ? String(formData.expected_avg_payments_in_amount) : "",

                // Additional Info
                updated_user_type: "customer",
                updated_user_id: authCustomerId ? parseInt(authCustomerId) : null,
                ein: formData.ein || null,
                naice_code: formData.naice_code || null,
            };

            // Remove null/undefined values
            Object.keys(payload).forEach(key => {
                if (payload[key] === null || payload[key] === undefined || payload[key] === '') {
                    delete payload[key];
                }
            });

            // Log payload for debugging
            console.log('Payload being sent:', payload);

            const response = await axios.post(
                `${API_URL}/customers/update-business-information/${customerUuid}`,
                payload,
                { headers: { Authorization: `Bearer ${authtoken}` } }
            );

            if (response.data?.status === 'success') {
                setSuccessMessage(response.data.message || 'Business information updated successfully!');
                setShowSuccessModal(true);
            } else {
                setErrorMessage(response.data?.message || 'Failed to update business information');
                setShowErrorModal(true);
            }
        } catch (error) {
            console.error('Error updating business info:', error);
            if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat();
                errorMessages.forEach(msg => toast.error(msg));
                setErrors(error.response.data.errors);
            } else {
                setErrorMessage(error.response?.data?.message || 'Failed to update business information');
                setShowErrorModal(true);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate(`/profile/${customerId}`);
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        navigate(`/profile/${customerId}`);
    };

    // ===================== OPTIONS =====================
    const currencyOptions = useMemo(() => [
        { value: 'USD', label: 'USD - US Dollar' },
        { value: 'EUR', label: 'EUR - Euro' },
        { value: 'GBP', label: 'GBP - British Pound' },
        { value: 'CAD', label: 'CAD - Canadian Dollar' },
        { value: 'AUD', label: 'AUD - Australian Dollar' },
    ], []);

    // NEW: Business Type Options (static for now)
    const businessTypeOptions = useMemo(() => [
        { value: 'Sole Proprietorship', label: 'Sole Proprietorship' },
        { value: 'Partnership', label: 'Partnership' },
        { value: 'LLC', label: 'LLC' },
        { value: 'Corporation', label: 'Corporation' },
        { value: 'Non-Profit', label: 'Non-Profit' },
        { value: 'Trust', label: 'Trust' },
        { value: 'Other', label: 'Other' },
    ], []);

    // NEW: Industry Type Options (from Redux)
    const industryTypeOptions = useMemo(() => {
        if (!industryTypes || !Array.isArray(industryTypes)) return [];
        return industryTypes.map(type => ({
            value: type.id,
            label: type.name || type.label || type.industry_type,
        }));
    }, [industryTypes]);

    const businessSizeOptions = useMemo(() => [
        { value: 'startup', label: 'Startup' },
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
        { value: 'enterprise', label: 'Enterprise' },
    ], []);

    const frequencyOptions = useMemo(() => [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'yearly', label: 'Yearly' },
    ], []);

    const beneficiaryTypeOptions = useMemo(() => [
        { value: 'Individual', label: 'Individual' },
        { value: 'Business', label: 'Business' },
        { value: 'Both', label: 'Both' },
        { value: 'Other', label: 'Other' },
    ], []);

    const senderTypeOptions = useMemo(() => [
        { value: 'Individual', label: 'Individual' },
        { value: 'Business', label: 'Business' },
        { value: 'Both', label: 'Both' },
        { value: 'Other', label: 'Other' },
    ], []);

    const productServiceOptions = useMemo(() => [
        { value: 'incoming', label: 'Incoming' },
        { value: 'outgoing', label: 'Outgoing' },
        { value: 'incoming,outgoing', label: 'Incoming,Outgoing' },
    ], []);

    const tradingNameCountOptions = useMemo(() => {
        const options = [];
        for (let i = 0; i <= 10; i++) {
            options.push({ value: i, label: i.toString() });
        }
        return options;
    }, []);

    const countryOptions = useMemo(() => {
        if (!countries || !Array.isArray(countries)) return [];
        return countries.map(country => ({
            value: country.id || country.country_id || country.value,
            label: country.name || country.label,
            phoneCode: country.phone_code || country.phoneCode,
            country_code: country.country_code,
            flag: country.flag_url || country.flag,
        }));
    }, [countries]);

    const stateOptions = useMemo(() => {
        if (!states || !Array.isArray(states)) return [];
        return states.map(state => ({
            value: state.id || state.name,
            label: state.name
        }));
    }, [states]);

    const institutionAccountTypeOptions = useMemo(() => {
        if (!institutionAccountTypes || !Array.isArray(institutionAccountTypes)) return [];
        return institutionAccountTypes.map(type => ({
            value: type.id,
            label: type.name,
        }));
    }, [institutionAccountTypes]);

    // NEW: Institution Type Options (separate from account types)
    const institutionTypeOptions = useMemo(() => {
        if (!institutionTypes || !Array.isArray(institutionTypes)) return [];
        return institutionTypes.map(type => ({
            value: type.id,
            label: type.name,
        }));
    }, [institutionTypes]);

    useEffect(() => {
        // Check if the selected institution type is "Trust"
        if (formData.institution_type_id && institutionTypeOptions.length > 0) {
            const selectedType = institutionTypeOptions.find(
                opt => opt.value === formData.institution_type_id
            );
            setIsTrustType(selectedType?.label?.toLowerCase() === 'trust');
        } else {
            setIsTrustType(false);
        }
    }, [formData.institution_type_id, institutionTypeOptions]);

    // NEW: Employees Number Options (dynamic from API)
    const employeesNumberOptions = useMemo(() => {
        if (!employeesNumberTypes || !Array.isArray(employeesNumberTypes)) return [];
        return employeesNumberTypes.map(type => ({
            value: type,
            label: type
        }));
    }, [employeesNumberTypes]);

    // ===================== RENDER =====================
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <RingLoader size={60} color="#3B82F6" />
                    <p className="mt-4 text-gray-600">Loading business information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto max-w-4xl px-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <FaArrowLeft className="text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Business Information</h1>
                </div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg p-6 md:p-8"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Institution Account Type & Institution Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomSelect
                                id="institution_account_type_id"
                                label="Institution Account Type"
                                options={institutionAccountTypeOptions}
                                value={institutionAccountTypeOptions.find(
                                    opt => opt.value === formData.institution_account_type_id
                                )}
                                onChange={handleSelectChange('institution_account_type_id')}
                                touched={touched.institution_account_type_id}
                                error={errors.institution_account_type_id}
                                required={true}
                                isLoading={institutionAccountTypesLoading}
                                placeholder="Select institution account type..."
                            />
                            <CustomSelect
                                id="institution_type_id"
                                label="Institution Type"
                                options={institutionTypeOptions} // CHANGED: Using institutionTypeOptions
                                value={institutionTypeOptions.find(
                                    opt => opt.value === formData.institution_type_id
                                )}
                                onChange={handleSelectChange('institution_type_id')}
                                touched={touched.institution_type_id}
                                error={errors.institution_type_id}
                                required={true}
                                isLoading={institutionTypesLoading} // CHANGED: Using institutionTypesLoading
                                placeholder="Select institution type..."
                            />
                        </div>

                        {/* Business Name & Registration Number */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                id="institution_name"
                                label="Business Name"
                                name="institution_name"
                                value={formData.institution_name}
                                onChange={handleChange('institution_name')}
                                onBlur={() => setTouched(prev => ({ ...prev, institution_name: true }))}
                                onFocus={() => setActiveField('institution_name')}
                                touched={touched.institution_name}
                                error={errors.institution_name}
                                required={true}
                                placeholder="Enter business name"
                            />
                            <FormField
                                id="registration_number"
                                label="Registration Number"
                                name="registration_number"
                                value={formData.registration_number}
                                onChange={handleChange('registration_number')}
                                onBlur={() => setTouched(prev => ({ ...prev, registration_number: true }))}
                                onFocus={() => setActiveField('registration_number')}
                                touched={touched.registration_number}
                                error={errors.registration_number}
                                required={true}
                                placeholder="Enter registration number"
                            />
                        </div>

                        {/* Business Alias & Business Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                id="business_alias"
                                label="Business Alias"
                                name="business_alias"
                                value={formData.business_alias}
                                onChange={handleChange('business_alias')}
                                onBlur={() => setTouched(prev => ({ ...prev, business_alias: true }))}
                                onFocus={() => setActiveField('business_alias')}
                                touched={touched.business_alias}
                                error={errors.business_alias}
                                required={false}
                                placeholder="Unique business identifier"
                            />
                            <CustomSelect
                                id="business_type"
                                label="Business Type"
                                options={businessTypeOptions}
                                value={businessTypeOptions.find(opt => opt.value === formData.business_type)}
                                onChange={handleSelectChange('business_type')}
                                touched={touched.business_type}
                                error={errors.business_type}
                                required={false}
                                placeholder="Select business type"
                            />
                        </div>

                        {/* Industry Type & Annual Currency */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomSelect
                                id="industry_type"
                                label="Industry Type"
                                options={industryTypeOptions} // CHANGED: Using industryTypeOptions
                                value={industryTypeOptions.find(opt => opt.value === formData.industry_type)}
                                onChange={handleSelectChange('industry_type')}
                                touched={touched.industry_type}
                                error={errors.industry_type}
                                required={true}
                                placeholder="Select industry type"
                            />
                            <CustomSelect
                                id="annual_equivalent_amount_currency"
                                label="Annual Equivalent Amount Currency"
                                options={currencyOptions}
                                value={currencyOptions.find(opt => opt.value === formData.annual_equivalent_amount_currency)}
                                onChange={handleSelectChange('annual_equivalent_amount_currency')}
                                touched={touched.annual_equivalent_amount_currency}
                                error={errors.annual_equivalent_amount_currency}
                                required={false}
                                placeholder="Select currency"
                            />
                        </div>

                        {/* Annual Equivalent Amount & Purpose of Account */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                id="annual_equivalent_amount"
                                label="Annual Equivalent Amount"
                                name="annual_equivalent_amount"
                                type="number"
                                value={formData.annual_equivalent_amount}
                                onChange={handleChange('annual_equivalent_amount')}
                                onBlur={() => setTouched(prev => ({ ...prev, annual_equivalent_amount: true }))}
                                onFocus={() => setActiveField('annual_equivalent_amount')}
                                touched={touched.annual_equivalent_amount}
                                error={errors.annual_equivalent_amount}
                                required={false}
                                placeholder="e.g., 1000000.00"
                            />
                            <FormField
                                id="purpose_of_account"
                                label="Purpose of Account"
                                name="purpose_of_account"
                                value={formData.purpose_of_account}
                                onChange={handleChange('purpose_of_account')}
                                onBlur={() => setTouched(prev => ({ ...prev, purpose_of_account: true }))}
                                onFocus={() => setActiveField('purpose_of_account')}
                                touched={touched.purpose_of_account}
                                error={errors.purpose_of_account}
                                required={false}
                                placeholder="e.g., Business transactions, International payments"
                            />
                        </div>

                        {/* Number of Trading Names & Trading Names List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomSelect
                                id="no_of_trading_names"
                                label="Number of Trading Names"
                                options={tradingNameCountOptions}
                                value={tradingNameCountOptions.find(opt => opt.value === formData.no_of_trading_names)}
                                onChange={handleSelectChange('no_of_trading_names')}
                                touched={touched.no_of_trading_names}
                                error={errors.no_of_trading_names}
                                required={false}
                                placeholder="Select number of trading names..."
                                isClearable={true}
                            />
                            <FormField
                                id="business_website_social_media"
                                label="Social Media or Website"
                                name="business_website_social_media"
                                value={formData.business_website_social_media}
                                onChange={handleChange('business_website_social_media')}
                                onBlur={() => setTouched(prev => ({ ...prev, business_website_social_media: true }))}
                                onFocus={() => setActiveField('business_website_social_media')}
                                touched={touched.business_website_social_media}
                                error={errors.business_website_social_media}
                                required={false}
                                placeholder="https://www.example.com or @socialmediahandle"
                            />
                        </div>

                        {/* Trading Names Dynamic Inputs */}
                        {formData.no_of_trading_names > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                            >
                                <h4 className="text-md font-medium text-gray-800 mb-4">Trading Names</h4>
                                <div className="space-y-3">
                                    {[...Array(formData.no_of_trading_names)].map((_, index) => (
                                        <FormField
                                            key={index}
                                            id={`trading_name_${index}`}
                                            label={`Trading Name ${index + 1}`}
                                            name={`trading_name_${index}`}
                                            value={formData.trading_names_list?.[index] || ""}
                                            onChange={(e) => {
                                                const updatedList = [...(formData.trading_names_list || [])];
                                                updatedList[index] = e.target.value;
                                                setFormData(prev => ({ ...prev, trading_names_list: updatedList }));
                                            }}
                                            touched={touched[`trading_name_${index}`]}
                                            error={errors[`trading_name_${index}`]}
                                            required={false}
                                            placeholder={`Enter trading name ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Trust Purpose - Only show when institution type is Trust */}
                        {isTrustType && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <FormField
                                    id="trust_purpose"
                                    label="Purpose of the Trust Account"
                                    name="trust_purpose"
                                    as="textarea"
                                    rows={3}
                                    value={formData.trust_purpose}
                                    onChange={handleChange('trust_purpose')}
                                    onBlur={() => setTouched(prev => ({ ...prev, trust_purpose: true }))}
                                    onFocus={() => setActiveField('trust_purpose')}
                                    touched={touched.trust_purpose}
                                    error={errors.trust_purpose}
                                    required={isTrustType}
                                    placeholder="Please describe the purpose of this trust account"
                                />
                            </motion.div>
                        )}

                        {/* Tax ID */}
                        <FormField
                            id="tax_id"
                            label="Tax ID"
                            name="tax_id"
                            value={formData.tax_id}
                            onChange={handleChange('tax_id')}
                            onBlur={() => setTouched(prev => ({ ...prev, tax_id: true }))}
                            onFocus={() => setActiveField('tax_id')}
                            touched={touched.tax_id}
                            error={errors.tax_id}
                            required={false}
                            placeholder="XX-XXXXXXX or Tax Registration Number"
                        />

                        {/* PEP Associated Field */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Are you PEP (Politically Exposed Person) associated? <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center space-x-6">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="pep_associated"
                                        value="1"
                                        checked={formData.pep_associated === "1"}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData(prev => ({ ...prev, pep_associated: value }));
                                            setTouched(prev => ({ ...prev, pep_associated: true }));
                                            if (value === "1") {
                                                setShowPepPopup(true);
                                            }
                                        }}
                                        className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                                </label>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="pep_associated"
                                        value="0"
                                        checked={formData.pep_associated === "0"}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData(prev => ({ ...prev, pep_associated: value }));
                                            setTouched(prev => ({ ...prev, pep_associated: true }));
                                            setShowPepPopup(false);
                                        }}
                                        className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">No</span>
                                </label>
                            </div>
                            {touched.pep_associated && errors.pep_associated && (
                                <div className="text-red-500 text-xs mt-1 flex items-center">
                                    <FaInfoCircle className="mr-1 w-3 h-3" />
                                    {errors.pep_associated}
                                </div>
                            )}
                        </div>

                        {/* ============= BUSINESS PAYMENT INFORMATION ============= */}
                        <div className="mt-8">
                            <h3 className="text-lg font-medium mb-4 text-blue-600 border-b border-blue-200 pb-2">
                                Business Payment Information
                            </h3>

                            <div className="space-y-6">
                                {/* Business Model Overview */}
                                <FormField
                                    id="business_model_overview"
                                    label="Business Model Overview"
                                    name="business_model_overview"
                                    as="textarea"
                                    rows={4}
                                    value={formData.business_model_overview}
                                    onChange={handleChange('business_model_overview')}
                                    onBlur={() => setTouched(prev => ({ ...prev, business_model_overview: true }))}
                                    onFocus={() => setActiveField('business_model_overview')}
                                    touched={touched.business_model_overview}
                                    error={errors.business_model_overview}
                                    required={false}
                                    placeholder="Describe your business model"
                                />

                                {/* Business Size & High Risk Countries */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CustomSelect
                                        id="business_size"
                                        label="Business Size"
                                        options={businessSizeOptions}
                                        value={businessSizeOptions.find(opt => opt.value === formData.business_size)}
                                        onChange={handleSelectChange('business_size')}
                                        touched={touched.business_size}
                                        error={errors.business_size}
                                        required={false}
                                        placeholder="Select business size"
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            High Risk Countries Involved
                                        </label>
                                        <div className="flex items-center space-x-4 mb-4">
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="high_risk_countries"
                                                    value="1"
                                                    checked={formData.high_risk_countries === 1}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value);
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            high_risk_countries: value,
                                                            specify_high_risk_countries: value === 0 ? [] : prev.specify_high_risk_countries,
                                                        }));
                                                        setTouched(prev => ({ ...prev, high_risk_countries: true }));
                                                    }}
                                                    className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Yes</span>
                                            </label>
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="high_risk_countries"
                                                    value="0"
                                                    checked={formData.high_risk_countries === 0}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value);
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            high_risk_countries: value,
                                                            specify_high_risk_countries: [],
                                                        }));
                                                        setTouched(prev => ({ ...prev, high_risk_countries: true }));
                                                    }}
                                                    className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">No</span>
                                            </label>
                                        </div>

                                        {formData.high_risk_countries === 1 && (
                                            <div className="mt-3">
                                                <CustomSelect
                                                    id="specify_high_risk_countries"
                                                    label="Specify High Risk Countries"
                                                    options={countryOptions}
                                                    isMulti={true}
                                                    value={countryOptions.filter(opt =>
                                                        formData.specify_high_risk_countries?.includes(opt.value)
                                                    )}
                                                    onChange={handleMultiSelectChange('specify_high_risk_countries')}
                                                    touched={touched.specify_high_risk_countries}
                                                    error={errors.specify_high_risk_countries}
                                                    placeholder="Select high risk countries..."
                                                    required={false}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Conducting Payment Activities */}
                                <FormField
                                    id="conducting_payment_activities"
                                    label="Conducting Payment Activities"
                                    name="conducting_payment_activities"
                                    as="textarea"
                                    rows={3}
                                    value={formData.conducting_payment_activities}
                                    onChange={handleChange('conducting_payment_activities')}
                                    onBlur={() => setTouched(prev => ({ ...prev, conducting_payment_activities: true }))}
                                    onFocus={() => setActiveField('conducting_payment_activities')}
                                    touched={touched.conducting_payment_activities}
                                    error={errors.conducting_payment_activities}
                                    required={false}
                                    placeholder="Describe your payment activities"
                                />

                                {/* Employees Number - DYNAMIC from API */}
                                <CustomSelect
                                    id="employees_number"
                                    label="Number of Employees"
                                    options={employeesNumberOptions} // CHANGED: Using dynamic options
                                    value={employeesNumberOptions.find(opt => opt.value === formData.employees_number)}
                                    onChange={handleSelectChange('employees_number')}
                                    touched={touched.employees_number}
                                    error={errors.employees_number}
                                    required={false}
                                    placeholder="Select number of employees"
                                    isLoading={employeesNumberLoading} // CHANGED: Using loading state
                                />

                                {/* Reason for Payments */}
                                <FormField
                                    id="reason_for_payments"
                                    label="Reason for Payments"
                                    name="reason_for_payments"
                                    as="textarea"
                                    rows={3}
                                    value={formData.reason_for_payments}
                                    onChange={handleChange('reason_for_payments')}
                                    onBlur={() => setTouched(prev => ({ ...prev, reason_for_payments: true }))}
                                    onFocus={() => setActiveField('reason_for_payments')}
                                    touched={touched.reason_for_payments}
                                    error={errors.reason_for_payments}
                                    required={false}
                                    placeholder="Explain the reason for payment processing"
                                />

                                {/* Product Services Required */}
                                <CustomSelect
                                    id="product_services_required"
                                    label="Product Services Required"
                                    options={productServiceOptions}
                                    value={productServiceOptions.find(opt => opt.value === formData.product_services_required)}
                                    onChange={handleSelectChange('product_services_required')}
                                    touched={touched.product_services_required}
                                    error={errors.product_services_required}
                                    required={false}
                                    placeholder="Select product services required"
                                />

                                {/* Beneficiary Types */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CustomSelect
                                        id="beneficiary_types"
                                        label="Beneficiary Types"
                                        options={beneficiaryTypeOptions}
                                        value={beneficiaryTypeOptions.find(opt => opt.value === formData.beneficiary_types)}
                                        onChange={handleSelectChange('beneficiary_types')}
                                        touched={touched.beneficiary_types}
                                        error={errors.beneficiary_types}
                                        required={false}
                                        placeholder="Select beneficiary types"
                                    />
                                    {formData.beneficiary_types === "Other" && (
                                        <FormField
                                            id="beneficiary_types_other"
                                            label="Other Beneficiary Types"
                                            name="beneficiary_types_other"
                                            value={formData.beneficiary_types_other}
                                            onChange={handleChange('beneficiary_types_other')}
                                            onBlur={() => setTouched(prev => ({ ...prev, beneficiary_types_other: true }))}
                                            onFocus={() => setActiveField('beneficiary_types_other')}
                                            touched={touched.beneficiary_types_other}
                                            error={errors.beneficiary_types_other}
                                            required={false}
                                            placeholder="Specify other beneficiary types"
                                        />
                                    )}
                                </div>

                                {/* Beneficiary Industries Top 5 */}
                                <FormField
                                    id="beneficiary_industries_top_5"
                                    label="Beneficiary Industries Top 5"
                                    name="beneficiary_industries_top_5"
                                    as="textarea"
                                    rows={3}
                                    value={formData.beneficiary_industries_top_5}
                                    onChange={handleChange('beneficiary_industries_top_5')}
                                    onBlur={() => setTouched(prev => ({ ...prev, beneficiary_industries_top_5: true }))}
                                    onFocus={() => setActiveField('beneficiary_industries_top_5')}
                                    touched={touched.beneficiary_industries_top_5}
                                    error={errors.beneficiary_industries_top_5}
                                    required={false}
                                    placeholder="List top 5 beneficiary industries (comma separated)"
                                />

                                {/* Expected Frequency Payments Out */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <CustomSelect
                                        id="expected_frequency_payments_out"
                                        label="Expected Frequency of Payments Out"
                                        options={frequencyOptions}
                                        value={frequencyOptions.find(opt => opt.value === formData.expected_frequency_payments_out)}
                                        onChange={handleSelectChange('expected_frequency_payments_out')}
                                        touched={touched.expected_frequency_payments_out}
                                        error={errors.expected_frequency_payments_out}
                                        required={false}
                                        placeholder="Select frequency"
                                    />
                                    <CustomSelect
                                        id="expected_avg_payments_out_currency"
                                        label="Expected Avg Payments Out Currency"
                                        options={currencyOptions}
                                        value={currencyOptions.find(opt => opt.value === formData.expected_avg_payments_out_currency)}
                                        onChange={handleSelectChange('expected_avg_payments_out_currency')}
                                        touched={touched.expected_avg_payments_out_currency}
                                        error={errors.expected_avg_payments_out_currency}
                                        required={false}
                                        placeholder="Select currency"
                                    />
                                    <FormField
                                        id="expected_avg_payments_out_amount"
                                        label="Expected Avg Payments Out Amount"
                                        name="expected_avg_payments_out_amount"
                                        type="number"
                                        step="0.01"
                                        value={formData.expected_avg_payments_out_amount}
                                        onChange={handleChange('expected_avg_payments_out_amount')}
                                        onBlur={() => setTouched(prev => ({ ...prev, expected_avg_payments_out_amount: true }))}
                                        onFocus={() => setActiveField('expected_avg_payments_out_amount')}
                                        touched={touched.expected_avg_payments_out_amount}
                                        error={errors.expected_avg_payments_out_amount}
                                        required={false}
                                        placeholder="e.g., 10000.00"
                                    />
                                </div>

                                {/* Sender Types */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CustomSelect
                                        id="sender_types"
                                        label="Sender Types"
                                        options={senderTypeOptions}
                                        value={senderTypeOptions.find(opt => opt.value === formData.sender_types)}
                                        onChange={handleSelectChange('sender_types')}
                                        touched={touched.sender_types}
                                        error={errors.sender_types}
                                        required={false}
                                        placeholder="Select sender types"
                                    />
                                    {formData.sender_types === "Other" && (
                                        <FormField
                                            id="sender_types_other"
                                            label="Other Sender Types"
                                            name="sender_types_other"
                                            value={formData.sender_types_other}
                                            onChange={handleChange('sender_types_other')}
                                            onBlur={() => setTouched(prev => ({ ...prev, sender_types_other: true }))}
                                            onFocus={() => setActiveField('sender_types_other')}
                                            touched={touched.sender_types_other}
                                            error={errors.sender_types_other}
                                            required={false}
                                            placeholder="Specify other sender types"
                                        />
                                    )}
                                </div>

                                {/* Sender Industries Top 5 */}
                                <FormField
                                    id="sender_industries_top_5"
                                    label="Sender Industries Top 5"
                                    name="sender_industries_top_5"
                                    as="textarea"
                                    rows={3}
                                    value={formData.sender_industries_top_5}
                                    onChange={handleChange('sender_industries_top_5')}
                                    onBlur={() => setTouched(prev => ({ ...prev, sender_industries_top_5: true }))}
                                    onFocus={() => setActiveField('sender_industries_top_5')}
                                    touched={touched.sender_industries_top_5}
                                    error={errors.sender_industries_top_5}
                                    required={false}
                                    placeholder="List top 5 sender industries (comma separated)"
                                />

                                {/* Countries to Receive Funds From */}
                                <CustomSelect
                                    id="countries_to_receive_funds_from"
                                    label="Countries to Receive Funds From"
                                    options={countryOptions}
                                    isMulti={true}
                                    value={countryOptions.filter(opt =>
                                        formData.countries_to_receive_funds_from?.includes(opt.value)
                                    )}
                                    onChange={handleMultiSelectChange('countries_to_receive_funds_from')}
                                    touched={touched.countries_to_receive_funds_from}
                                    error={errors.countries_to_receive_funds_from}
                                    placeholder="Select countries to receive funds from..."
                                    required={false}
                                />

                                {/* Countries to Send Funds To */}
                                <CustomSelect
                                    id="countries_to_send_funds_to"
                                    label="Countries to Send Funds To"
                                    options={countryOptions}
                                    isMulti={true}
                                    value={countryOptions.filter(opt =>
                                        formData.countries_to_send_funds_to?.includes(opt.value)
                                    )}
                                    onChange={handleMultiSelectChange('countries_to_send_funds_to')}
                                    touched={touched.countries_to_send_funds_to}
                                    error={errors.countries_to_send_funds_to}
                                    placeholder="Select countries to send funds to..."
                                    required={false}
                                />

                                {/* Expected Frequency Payments In */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <CustomSelect
                                        id="expected_frequency_payments_in"
                                        label="Expected Frequency of Payments In"
                                        options={frequencyOptions}
                                        value={frequencyOptions.find(opt => opt.value === formData.expected_frequency_payments_in)}
                                        onChange={handleSelectChange('expected_frequency_payments_in')}
                                        touched={touched.expected_frequency_payments_in}
                                        error={errors.expected_frequency_payments_in}
                                        required={false}
                                        placeholder="Select frequency"
                                    />
                                    <CustomSelect
                                        id="expected_avg_payments_in_currency"
                                        label="Expected Avg Payments In Currency"
                                        options={currencyOptions}
                                        value={currencyOptions.find(opt => opt.value === formData.expected_avg_payments_in_currency)}
                                        onChange={handleSelectChange('expected_avg_payments_in_currency')}
                                        touched={touched.expected_avg_payments_in_currency}
                                        error={errors.expected_avg_payments_in_currency}
                                        required={false}
                                        placeholder="Select currency"
                                    />
                                    <FormField
                                        id="expected_avg_payments_in_amount"
                                        label="Expected Avg Payments In Amount"
                                        name="expected_avg_payments_in_amount"
                                        type="number"
                                        step="0.01"
                                        value={formData.expected_avg_payments_in_amount}
                                        onChange={handleChange('expected_avg_payments_in_amount')}
                                        onBlur={() => setTouched(prev => ({ ...prev, expected_avg_payments_in_amount: true }))}
                                        onFocus={() => setActiveField('expected_avg_payments_in_amount')}
                                        touched={touched.expected_avg_payments_in_amount}
                                        error={errors.expected_avg_payments_in_amount}
                                        required={false}
                                        placeholder="e.g., 10000.00"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ============= EIN & NAICS ============= */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FormField
                                id="ein"
                                label="EIN (Employer Identification Number)"
                                name="ein"
                                value={formData.ein}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    let formatted = value;
                                    if (value.length <= 2) {
                                        formatted = value;
                                    } else if (value.length <= 9) {
                                        formatted = `${value.slice(0, 2)}-${value.slice(2)}`;
                                    } else {
                                        formatted = `${value.slice(0, 2)}-${value.slice(2, 9)}`;
                                    }
                                    setFormData(prev => ({ ...prev, ein: formatted }));
                                }}
                                onBlur={() => setTouched(prev => ({ ...prev, ein: true }))}
                                onFocus={() => setActiveField('ein')}
                                touched={touched.ein}
                                error={errors.ein}
                                required={false}
                                placeholder="XX-XXXXXXX"
                            />
                            <FormField
                                id="naice_code"
                                label="NAICS Code"
                                name="naice_code"
                                value={formData.naice_code}
                                onChange={handleChange('naice_code')}
                                onBlur={() => setTouched(prev => ({ ...prev, naice_code: true }))}
                                onFocus={() => setActiveField('naice_code')}
                                touched={touched.naice_code}
                                error={errors.naice_code}
                                required={false}
                                placeholder="Enter NAICS code"
                            />
                        </div>

                        {/* ============= REGISTERED ADDRESS ============= */}
                        <div className="mt-8">
                            <h3 className="text-lg font-medium mb-4 text-blue-600 border-b border-blue-200 pb-2">
                                Registered Address
                            </h3>

                            {/* Country */}
                            <div className="mb-4">
                                <CustomSelect
                                    id="registered_address_street_country"
                                    label="Country"
                                    options={countryOptions}
                                    value={countryOptions.find(opt => opt.value === formData.registered_address_street_country)}
                                    onChange={handleSelectChange('registered_address_street_country')}
                                    touched={touched.registered_address_street_country}
                                    error={errors.registered_address_street_country}
                                    required={true}
                                    isLoading={countriesLoading}
                                    isCountryField={true}
                                    placeholder="Select country"
                                />
                            </div>

                            {/* ZIP/Postal Code */}
                            <div className="mb-4">
                                <FormField
                                    id="registered_address_street_zip"
                                    label="ZIP/Postal Code"
                                    name="registered_address_street_zip"
                                    value={formData.registered_address_street_zip}
                                    onChange={(e) => {
                                        const zipCode = e.target.value;
                                        setFormData(prev => ({ ...prev, registered_address_street_zip: zipCode }));
                                        setTouched(prev => ({ ...prev, registered_address_street_zip: true }));

                                        if (zipDebounceTimer) clearTimeout(zipDebounceTimer);
                                        const timer = setTimeout(() => {
                                            const countryId = formData.registered_address_street_country;
                                            if (zipCode && countryId && zipCode.replace(/\s+/g, "").length >= 3) {
                                                handleZipLookup(zipCode, countryId);
                                            }
                                        }, 1000);
                                        setZipDebounceTimer(timer);
                                    }}
                                    onBlur={() => setTouched(prev => ({ ...prev, registered_address_street_zip: true }))}
                                    onFocus={() => setActiveField('registered_address_street_zip')}
                                    touched={touched.registered_address_street_zip}
                                    error={errors.registered_address_street_zip}
                                    required={true}
                                    placeholder="Enter ZIP/Postal code"
                                />
                                {isZipLoading && activeField === 'registered_address_street_zip' && (
                                    <div className="flex items-center mt-2">
                                        <RingLoader size={16} color="#3b82f6" />
                                        <span className="ml-2 text-sm text-gray-500">Looking up location...</span>
                                    </div>
                                )}
                            </div>

                            {/* Street Address 1 & 2 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <FormField
                                    id="registered_address_street_1"
                                    label="Street Address"
                                    name="registered_address_street_1"
                                    value={formData.registered_address_street_1}
                                    onChange={handleChange('registered_address_street_1')}
                                    onBlur={() => setTouched(prev => ({ ...prev, registered_address_street_1: true }))}
                                    onFocus={() => setActiveField('registered_address_street_1')}
                                    touched={touched.registered_address_street_1}
                                    error={errors.registered_address_street_1}
                                    required={true}
                                    placeholder="Enter street address"
                                />
                                <FormField
                                    id="registered_address_street_2"
                                    label="Street Address 2 / Suite Address (Optional)"
                                    name="registered_address_street_2"
                                    value={formData.registered_address_street_2}
                                    onChange={handleChange('registered_address_street_2')}
                                    onBlur={() => setTouched(prev => ({ ...prev, registered_address_street_2: true }))}
                                    onFocus={() => setActiveField('registered_address_street_2')}
                                    touched={touched.registered_address_street_2}
                                    error={errors.registered_address_street_2}
                                    required={false}
                                    placeholder="Enter suite or apartment number"
                                />
                            </div>

                            {/* City */}
                            <div className="mb-4">
                                <FormField
                                    id="registered_address_street_city"
                                    label="City"
                                    name="registered_address_street_city"
                                    value={formData.registered_address_street_city}
                                    onChange={handleChange('registered_address_street_city')}
                                    onBlur={() => setTouched(prev => ({ ...prev, registered_address_street_city: true }))}
                                    onFocus={() => setActiveField('registered_address_street_city')}
                                    touched={touched.registered_address_street_city}
                                    error={errors.registered_address_street_city}
                                    required={true}
                                    placeholder="Enter city"
                                />
                            </div>

                            {/* State/Province - Registered Address */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="registered_address_street_state" className="block text-sm font-medium text-gray-700">
                                        State/Province <span className="text-red-500">*</span>
                                    </label>

                                    {stateOptions && stateOptions.length > 0 ? (
                                        <Select
                                            id="registered_address_street_state"
                                            name="registered_address_street_state"
                                            options={stateOptions}
                                            value={stateOptions.find(opt => opt.value === formData.registered_address_street_state)}
                                            onChange={(option) => {
                                                if (option) {
                                                    const value = option.label;
                                                    setFormData(prev => ({ ...prev, registered_address_street_state: value }));
                                                    setTouched(prev => ({ ...prev, registered_address_street_state: true }));
                                                } else {
                                                    setFormData(prev => ({ ...prev, registered_address_street_state: "" }));
                                                    setTouched(prev => ({ ...prev, registered_address_street_state: true }));
                                                }
                                            }}
                                            onBlur={() => setTouched(prev => ({ ...prev, registered_address_street_state: true }))}
                                            isDisabled={!formData.registered_address_street_country}
                                            isLoading={statesLoading}
                                            placeholder={
                                                !formData.registered_address_street_country
                                                    ? "Please select a country first"
                                                    : statesLoading
                                                        ? "Loading states..."
                                                        : "Select state/province..."
                                            }
                                            isClearable={true}
                                            styles={{
                                                control: (base, state) => ({
                                                    ...base,
                                                    minHeight: "50px",
                                                    borderColor: touched.registered_address_street_state && errors.registered_address_street_state ? "#ef4444" : "#d1d5db",
                                                    borderRadius: "0.5rem",
                                                    padding: "0.25rem 0.5rem",
                                                    fontSize: "0.875rem",
                                                    backgroundColor: !formData.registered_address_street_country ? "#f3f4f6" : "white",
                                                    opacity: !formData.registered_address_street_country ? 0.6 : 1,
                                                    "&:hover": {
                                                        borderColor: touched.registered_address_street_state && errors.registered_address_street_state ? "#ef4444" : "#9ca3af",
                                                    },
                                                }),
                                                placeholder: (base) => ({
                                                    ...base,
                                                    fontSize: "0.875rem",
                                                    color: "#6b7280",
                                                }),
                                                menu: (base) => ({
                                                    ...base,
                                                    fontSize: "0.875rem",
                                                    zIndex: 9999,
                                                }),
                                                singleValue: (base) => ({
                                                    ...base,
                                                    fontSize: "0.875rem",
                                                }),
                                                option: (base, state) => ({
                                                    ...base,
                                                    fontSize: "0.875rem",
                                                    backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#eff6ff" : "white",
                                                    color: state.isSelected ? "white" : "#1f2937",
                                                    "&:hover": {
                                                        backgroundColor: "#eff6ff",
                                                    },
                                                }),
                                            }}
                                        />
                                    ) : (
                                        /* FALLBACK: Manual input when no states available */
                                        <input
                                            type="text"
                                            id="registered_address_street_state"
                                            name="registered_address_street_state"
                                            value={formData.registered_address_street_state || ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData(prev => ({ ...prev, registered_address_street_state: value }));
                                                setTouched(prev => ({ ...prev, registered_address_street_state: true }));
                                            }}
                                            onBlur={() => setTouched(prev => ({ ...prev, registered_address_street_state: true }))}
                                            onFocus={() => setActiveField('registered_address_street_state')}
                                            disabled={!formData.registered_address_street_country}
                                            placeholder={
                                                !formData.registered_address_street_country
                                                    ? "Please select a country first"
                                                    : statesLoading
                                                        ? "Loading states..."
                                                        : "Enter state/province..."
                                            }
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 
          ${!formData.registered_address_street_country ? "bg-gray-100 opacity-60 cursor-not-allowed" : ""}
          ${touched.registered_address_street_state && errors.registered_address_street_state
                                                    ? "border-red-500 focus:ring-red-500"
                                                    : "border-gray-300 focus:ring-blue-500"
                                                }`}
                                        />
                                    )}

                                    {touched.registered_address_street_state && errors.registered_address_street_state && (
                                        <div className="text-red-500 text-xs mt-1 flex items-center">
                                            <FaInfoCircle className="mr-1 w-3 h-3" />
                                            {errors.registered_address_street_state}
                                        </div>
                                    )}

                                    {/* Show message when no states available */}
                                    {stateOptions && stateOptions.length === 0 && formData.registered_address_street_country && !statesLoading && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            No states available for the selected country. Please enter the state manually.
                                        </p>
                                    )}
                                </div>

                                <FormField
                                    id="registered_business_address_apartment_unit_no"
                                    label="Apartment Number of the business"
                                    name="registered_business_address_apartment_unit_no"
                                    value={formData.registered_business_address_apartment_unit_no}
                                    onChange={handleChange('registered_business_address_apartment_unit_no')}
                                    onBlur={() => setTouched(prev => ({ ...prev, registered_business_address_apartment_unit_no: true }))}
                                    onFocus={() => setActiveField('registered_business_address_apartment_unit_no')}
                                    touched={touched.registered_business_address_apartment_unit_no}
                                    error={errors.registered_business_address_apartment_unit_no}
                                    required={false}
                                    placeholder="e.g., Apt 4B, Unit 12, Suite 100"
                                />
                            </div>

                            {/* Date of Incorporation & Suburb */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <FormField
                                    id="date_incorporation"
                                    label="Date of Incorporation"
                                    name="date_incorporation"
                                    type="date"
                                    value={formData.date_incorporation}
                                    onChange={handleChange('date_incorporation')}
                                    onBlur={() => setTouched(prev => ({ ...prev, date_incorporation: true }))}
                                    onFocus={() => setActiveField('date_incorporation')}
                                    touched={touched.date_incorporation}
                                    error={errors.date_incorporation}
                                    required={true}
                                />
                                <FormField
                                    id="registered_business_address_suburb"
                                    label="Suburb of the business"
                                    name="registered_business_address_suburb"
                                    value={formData.registered_business_address_suburb}
                                    onChange={handleChange('registered_business_address_suburb')}
                                    onBlur={() => setTouched(prev => ({ ...prev, registered_business_address_suburb: true }))}
                                    onFocus={() => setActiveField('registered_business_address_suburb')}
                                    touched={touched.registered_business_address_suburb}
                                    error={errors.registered_business_address_suburb}
                                    required={false}
                                    placeholder="Enter suburb/district"
                                />
                            </div>
                        </div>

                        {/* ============= PRINCIPAL ADDRESS ============= */}
                        <div className="mt-8">
                            <h3 className="text-lg font-medium mb-4 text-blue-600 border-b border-blue-200 pb-2">
                                Principal Address
                            </h3>

                            {/* Same as Registered Address Radio Buttons */}
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Is Principal Business Address same as Registered Address?
                                </label>
                                <div className="flex items-center space-x-6">
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="same_as_registered_address"
                                            value="1"
                                            checked={formData.same_as_registered_address === 1}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    same_as_registered_address: value,
                                                    principal_business_address_country: value === 1 ? prev.registered_address_street_country : "",
                                                    principal_business_address_postal_code: value === 1 ? prev.registered_address_street_zip : "",
                                                    principal_business_street: value === 1 ? prev.registered_address_street_1 : "",
                                                    principal_business_address_city: value === 1 ? prev.registered_address_street_city : "",
                                                    principal_business_address_state: value === 1 ? prev.registered_address_street_state : "",
                                                    principal_business_address_apartment_unit_no: value === 1 ? prev.registered_business_address_apartment_unit_no : "",
                                                    principal_business_address_suburb: value === 1 ? prev.registered_business_address_suburb : "",
                                                }));
                                            }}
                                            className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Yes</span>
                                    </label>
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="same_as_registered_address"
                                            value="0"
                                            checked={formData.same_as_registered_address === 0}
                                            onChange={(e) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    same_as_registered_address: 0,
                                                }));
                                            }}
                                            className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">No</span>
                                    </label>
                                </div>
                            </div>

                            {/* Principal Address Fields */}
                            <div className={`space-y-4 ${formData.same_as_registered_address === 1 ? "opacity-60" : ""}`}>
                                <CustomSelect
                                    id="principal_business_address_country"
                                    label="Country"
                                    options={countryOptions}
                                    value={countryOptions.find(opt => opt.value === formData.principal_business_address_country)}
                                    onChange={handleSelectChange('principal_business_address_country')}
                                    touched={touched.principal_business_address_country}
                                    error={errors.principal_business_address_country}
                                    required={true}
                                    isLoading={countriesLoading}
                                    isCountryField={true}
                                    disabled={formData.same_as_registered_address === 1}
                                    placeholder="Select country"
                                />

                                <FormField
                                    id="principal_business_address_postal_code"
                                    label="ZIP/Postal Code"
                                    name="principal_business_address_postal_code"
                                    value={formData.principal_business_address_postal_code}
                                    onChange={handleChange('principal_business_address_postal_code')}
                                    onBlur={() => setTouched(prev => ({ ...prev, principal_business_address_postal_code: true }))}
                                    onFocus={() => setActiveField('principal_business_address_postal_code')}
                                    touched={touched.principal_business_address_postal_code}
                                    error={errors.principal_business_address_postal_code}
                                    required={true}
                                    disabled={formData.same_as_registered_address === 1}
                                    placeholder="Enter ZIP/Postal code"
                                />

                                <FormField
                                    id="principal_business_street"
                                    label="Street Address"
                                    name="principal_business_street"
                                    value={formData.principal_business_street}
                                    onChange={handleChange('principal_business_street')}
                                    onBlur={() => setTouched(prev => ({ ...prev, principal_business_street: true }))}
                                    onFocus={() => setActiveField('principal_business_street')}
                                    touched={touched.principal_business_street}
                                    error={errors.principal_business_street}
                                    required={true}
                                    disabled={formData.same_as_registered_address === 1}
                                    placeholder="Enter street address"
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        id="principal_business_address_city"
                                        label="City"
                                        name="principal_business_address_city"
                                        value={formData.principal_business_address_city}
                                        onChange={handleChange('principal_business_address_city')}
                                        onBlur={() => setTouched(prev => ({ ...prev, principal_business_address_city: true }))}
                                        onFocus={() => setActiveField('principal_business_address_city')}
                                        touched={touched.principal_business_address_city}
                                        error={errors.principal_business_address_city}
                                        required={true}
                                        disabled={formData.same_as_registered_address === 1}
                                        placeholder="Enter city"
                                    />
                                    <FormField
                                        id="principal_business_address_state"
                                        label="State/Province"
                                        name="principal_business_address_state"
                                        value={formData.principal_business_address_state}
                                        onChange={handleChange('principal_business_address_state')}
                                        onBlur={() => setTouched(prev => ({ ...prev, principal_business_address_state: true }))}
                                        onFocus={() => setActiveField('principal_business_address_state')}
                                        touched={touched.principal_business_address_state}
                                        error={errors.principal_business_address_state}
                                        required={true}
                                        disabled={formData.same_as_registered_address === 1}
                                        placeholder="Enter state/province"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        id="principal_business_address_apartment_unit_no"
                                        label="Number of the address of the business"
                                        name="principal_business_address_apartment_unit_no"
                                        value={formData.principal_business_address_apartment_unit_no}
                                        onChange={handleChange('principal_business_address_apartment_unit_no')}
                                        onBlur={() => setTouched(prev => ({ ...prev, principal_business_address_apartment_unit_no: true }))}
                                        onFocus={() => setActiveField('principal_business_address_apartment_unit_no')}
                                        touched={touched.principal_business_address_apartment_unit_no}
                                        error={errors.principal_business_address_apartment_unit_no}
                                        required={false}
                                        disabled={formData.same_as_registered_address === 1}
                                        placeholder="e.g., Apt 4B, Suite 100, Unit 12"
                                    />
                                    <FormField
                                        id="principal_business_address_suburb"
                                        label="Suburb the business is located in"
                                        name="principal_business_address_suburb"
                                        value={formData.principal_business_address_suburb}
                                        onChange={handleChange('principal_business_address_suburb')}
                                        onBlur={() => setTouched(prev => ({ ...prev, principal_business_address_suburb: true }))}
                                        onFocus={() => setActiveField('principal_business_address_suburb')}
                                        touched={touched.principal_business_address_suburb}
                                        error={errors.principal_business_address_suburb}
                                        required={false}
                                        disabled={formData.same_as_registered_address === 1}
                                        placeholder="Enter suburb/district"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ============= CONTACT INFORMATION ============= */}
                        {/* <div className="mt-8">
                            <h3 className="text-lg font-medium mb-4 text-blue-600 border-b border-blue-200 pb-2">
                                Contact Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    id="business_email"
                                    label="Business Email"
                                    name="business_email"
                                    type="email"
                                    value={formData.business_email}
                                    onChange={handleChange('business_email')}
                                    onBlur={() => setTouched(prev => ({ ...prev, business_email: true }))}
                                    onFocus={() => setActiveField('business_email')}
                                    touched={touched.business_email}
                                    error={errors.business_email}
                                    required={false}
                                    placeholder="business@example.com"
                                />
                                <FormField
                                    id="business_website"
                                    label="Business Website"
                                    name="business_website"
                                    value={formData.business_website}
                                    onChange={handleChange('business_website')}
                                    onBlur={() => setTouched(prev => ({ ...prev, business_website: true }))}
                                    onFocus={() => setActiveField('business_website')}
                                    touched={touched.business_website}
                                    error={errors.business_website}
                                    required={false}
                                    placeholder="https://www.example.com"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <FormField
                                    id="companyphone_countrycode"
                                    label="Country Code"
                                    name="companyphone_countrycode"
                                    value={formData.companyphone_countrycode}
                                    onChange={handleChange('companyphone_countrycode')}
                                    onBlur={() => setTouched(prev => ({ ...prev, companyphone_countrycode: true }))}
                                    onFocus={() => setActiveField('companyphone_countrycode')}
                                    touched={touched.companyphone_countrycode}
                                    error={errors.companyphone_countrycode}
                                    required={false}
                                    placeholder="+1"
                                />
                                <FormField
                                    id="company_phone_number"
                                    label="Phone Number"
                                    name="company_phone_number"
                                    value={formData.company_phone_number}
                                    onChange={handleChange('company_phone_number')}
                                    onBlur={() => setTouched(prev => ({ ...prev, company_phone_number: true }))}
                                    onFocus={() => setActiveField('company_phone_number')}
                                    touched={touched.company_phone_number}
                                    error={errors.company_phone_number}
                                    required={false}
                                    placeholder="1234567890"
                                />
                            </div>
                        </div> */}

                        {/* ============= ACTION BUTTONS ============= */}
                        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="w-full sm:w-auto py-2.5 px-6 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                            >
                                <FaTimes className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:w-auto py-2.5 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 min-w-[140px]"
                            >
                                {saving ? (
                                    <>
                                        <RingLoader size={18} color="#ffffff" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaSave className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>

            <SuccessModal show={showSuccessModal} 
                          message={successMessage} 
                          onClose={handleSuccessModalClose}
            />

            <ErrorModal show={showErrorModal} 
                        message={errorMessage} 
                        onClose={() => setShowErrorModal(false)} 
            />

        </div>
    );
};

export default BusinessInformationEdit;