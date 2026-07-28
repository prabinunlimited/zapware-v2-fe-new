import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { RingLoader } from 'react-spinners';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaSave, FaTimes, FaInfoCircle } from 'react-icons/fa';
import Select from 'react-select';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Redux selectors and actions
import {
    fetchCountries,
    fetchStatesByCountry,
    selectCountriesOptions,
    selectCountriesLoading,
    selectStates,
    selectStatesLoading,
} from '../../../features/Auth/slices/countrySlice';

import {
    fetchGenders,
    selectGenders,
    fetchNationalities,
    selectNationalities,
    fetchIdDocumentTypes,
    selectIdDocumentTypes,
    fetchDirectorRoles,
    selectDirectorRoles,
    selectDirectorRolesLoading,
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
    menuWidth,
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
            ...(menuWidth ? { width: menuWidth, minWidth: menuWidth } : {}),
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
const EditController = () => {
    const { customerId, controllerId } = useParams(); // Get both customerId and controllerId
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isCreateMode = !controllerId;

    const authtoken = localStorage.getItem('authtoken');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [zipDebounceTimer, setZipDebounceTimer] = useState(null);
    const [activeField, setActiveField] = useState("");
    const [controllerIndex, setControllerIndex] = useState(null);

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Redux selectors
    const countries = useSelector(selectCountriesOptions);
    const countriesLoading = useSelector(selectCountriesLoading);
    const states = useSelector(selectStates);
    const statesLoading = useSelector(selectStatesLoading);
    const genders = useSelector(selectGenders);
    const nationalities = useSelector(selectNationalities);
    const idDocumentTypes = useSelector(selectIdDocumentTypes);
    const directorRoles = useSelector(selectDirectorRoles);
    const directorRolesLoading = useSelector(selectDirectorRolesLoading);

    // Local state
    const [formData, setFormData] = useState({
        controller_uuid: '',
        controller_first_name: '',
        controller_middle_name: '',
        controller_last_name: '',
        controller_email: '',
        controller_resident_country: '',
        controller_mobilenumber_countrycode: '',
        controller_mobile_number: '',
        controller_nationality: '',
        controller_country: '',
        controller_state: '',
        controller_city: '',
        controller_street_address_1: '',
        controller_street_address_2: '',
        controller_zip_code: '',
        controller_gender: '',
        controller_dob: '',
        controller_designation: '',
        controller_ssn: '',
        controller_doc_type: '',
        controller_doc_id: '',
        controller_doc_country: '',
        director_role_id: '',
        percentage_of_shares: '',
        controllerHouseNumber: '',
        suburb: '',
        controller_past_nationalities: [],
        aliases: '',
        has_nominees: '0',
        nominee_first_name: '',
        nominee_middle_name: '',
        nominee_last_name: '',
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // ===================== LOAD CONTROLLER DATA =====================
    useEffect(() => {
        const fetchController = async () => {
            if (isCreateMode) {
                setLoading(false);
                return;
            }

            try {
                const customerUuid = localStorage.getItem('customerUuid');
                if (!customerUuid) {
                    throw new Error('Customer UUID not found');
                }

                const response = await axios.get(
                    `${API_URL}/customers/office-controllers/${customerUuid}`,
                    { headers: { Authorization: `Bearer ${authtoken}` } }
                );

                console.log('📦 All Controllers Response:', response.data);

                if (response.data && response.data.data && response.data.data.length > 0) {
                    let foundController = null;
                    let foundIndex = -1;
                
                    if (controllerId) {
                        foundIndex = response.data.data.findIndex(
                            (ctrl) => ctrl.controller_uuid === controllerId
                        );
                        if (foundIndex !== -1) {
                            foundController = response.data.data[foundIndex];
                        }
                    }
                
                    if (!foundController) {
                        toast.error('Controller not found');
                        setLoading(false);
                        return;
                    }
                
                    setControllerIndex(foundIndex);
                    const data = foundController;
                
                    console.log('📦 Selected Controller:', data);
                
                    setFormData({
                        controller_uuid: data.controller_uuid || '',
                        controller_first_name: data.controller_first_name || data.first_name || '',
                        controller_middle_name: data.controller_middle_name || data.middle_name || '',
                        controller_last_name: data.controller_last_name || data.last_name || '',
                        controller_email: data.controller_email || data.email || '',
                        controller_resident_country: data.residentcountry_id || data.resident_country || '',
                        controller_mobilenumber_countrycode: data.mobile_number_country_code || data.mobilenumber_countrycode || data.phone_code || '',
                        controller_mobile_number: data.mobile_number || data.phone_number || '',
                        controller_nationality: data.nationality_id || data.nationality || '',
                        controller_country: data.country_id || data.country || '',
                        controller_state: data.state || '',
                        controller_city: data.city || '',
                        controller_street_address_1: data.street_address_1 || '',
                        controller_street_address_2: data.street_address_2 || '',
                        controller_zip_code: data.zip_code || '',
                        controller_gender: data.genderid ? String(data.genderid) : '',
                        controller_dob: data.dob || '',
                        controller_designation: data.designation || '',
                        controller_ssn: data.ssn || '',
                        controller_doc_type: data.doc_type || '',
                        controller_doc_id: data.doc_id || '',
                        controller_doc_country: data.doc_country || '',
                        director_role_id: data.director_role_id || '',
                        percentage_of_shares: data.percentage_of_shares || '',
                        controllerHouseNumber: data.controllerHouseNumber || data.house_number || '',
                        suburb: data.suburb || '',
                        controller_past_nationalities: data.controller_past_nationalities || [],
                        aliases: data.aliases || '',
                        has_nominees: data.has_nominees || '0',
                        nominee_first_name: data.nominee_first_name || '',
                        nominee_middle_name: data.nominee_middle_name || '',
                        nominee_last_name: data.nominee_last_name || '',
                    });
                } else {
                    toast.warning('No controller found');
                }
            } catch (error) {
                console.error('Error fetching controller:', error);
                toast.error(error.response?.data?.message || 'Failed to load controller information');
            } finally {
                setLoading(false);
            }
        };

        const fetchDropdownData = async () => {
            try {
                await dispatch(fetchCountries());
                await dispatch(fetchGenders());
                await dispatch(fetchNationalities());
                await dispatch(fetchIdDocumentTypes());
                await dispatch(fetchDirectorRoles());
            } catch (error) {
                console.error('Error fetching dropdown data:', error);
            }
        };

        fetchController();
        fetchDropdownData();

        return () => {
            if (zipDebounceTimer) {
                clearTimeout(zipDebounceTimer);
            }
        };
    }, [customerId, controllerId, authtoken, dispatch, isCreateMode]);

    // ===================== FETCH STATES WHEN COUNTRY CHANGES =====================
    useEffect(() => {
        if (formData.controller_country) {
            const timer = setTimeout(() => {
                dispatch(fetchStatesByCountry(formData.controller_country));
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [formData.controller_country, dispatch]);

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

            const payload = {
                controller_uuid: formData.controller_uuid || "",
                first_name: formData.controller_first_name || "",
                middle_name: formData.controller_middle_name || "",
                last_name: formData.controller_last_name || "",
                email: formData.controller_email || "",
                resident_country_id: formData.controller_resident_country ? parseInt(formData.controller_resident_country) : null,
                nationality_id: formData.controller_nationality ? parseInt(formData.controller_nationality) : null,
                phone_number_country_code: formData.controller_mobilenumber_countrycode || "",
                phone_number: formData.controller_mobile_number || "",
                country_id: formData.controller_country ? parseInt(formData.controller_country) : null,
                zip_code: formData.controller_zip_code || "",
                street_address_1: formData.controller_street_address_1 || "",
                street_address_2: formData.controller_street_address_2 || "",
                city: formData.controller_city || "",
                state: formData.controller_state || "",
                gender_id: formData.controller_gender ? parseInt(formData.controller_gender) : null,
                dob: formData.controller_dob || "",
                designation: formData.controller_designation || "",
                id_document_type_id: formData.controller_doc_type ? parseInt(formData.controller_doc_type) : null,
                id_document_number: formData.controller_doc_id || "",
                id_issuing_country_id: formData.controller_doc_country ? parseInt(formData.controller_doc_country) : null,
                id_issuing_state: formData.controller_state || "", // Using the same state as contact address
                house_number: formData.controllerHouseNumber || "",
                percentage_of_shares: formData.percentage_of_shares || "",
                suburb: formData.suburb || "",
                past_nationalities: formData.controller_past_nationalities || [],
                aliases: formData.aliases || "",
                role_id: formData.director_role_id ? parseInt(formData.director_role_id) : null,
                has_nominees: formData.has_nominees === "1" ? 1 : 0,
                nominees: formData.has_nominees === "1" ? [{
                    nominee_first_name: formData.nominee_first_name || "",
                    nominee_middle_name: formData.nominee_middle_name || "",
                    nominee_last_name: formData.nominee_last_name || ""
                }] : [],
                updated_user_type: "customer",
                updated_user_id: authCustomerId ? parseInt(authCustomerId) : null,
            };

            // Only remove null/undefined, keep empty strings and empty arrays
            Object.keys(payload).forEach(key => {
                if (payload[key] === null || payload[key] === undefined) {
                    delete payload[key];
                }
            });

            if (isCreateMode) {
                delete payload.controller_uuid;
            }

            console.log('📤 Form Data:', formData);
            console.log('📤 Sending payload:', payload);

            const endpoint = isCreateMode
                ? `${API_URL}/customers/add-office-controller/${customerUuid}`
                : `${API_URL}/customers/update-office-controller/${customerUuid}`;

            const response = await axios.post(
                endpoint,
                payload,
                { headers: { Authorization: `Bearer ${authtoken}` } }
            );

            console.log('📥 API Response:', response.data);

            if (response.data?.status === 'success') {
                setSuccessMessage(
                    response.data.message ||
                    (isCreateMode ? 'Office controller added successfully!' : 'Office controller information updated successfully!')
                );
                setShowSuccessModal(true);
            } else {
                setErrorMessage(response.data?.message || 'Failed to update office controller information');
                setShowErrorModal(true);
            }
        } catch (error) {
            console.error('❌ Error updating office controller:', error);
            console.error('Error response:', error.response?.data);

            if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat();
                errorMessages.forEach(msg => toast.error(msg));
                setErrors(error.response.data.errors);
            } else {
                setErrorMessage(error.response?.data?.message || 'Failed to update office controller information');
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

    const genderOptions = useMemo(() => {
        if (!genders || !Array.isArray(genders)) return [];
        return genders.map(gender => ({
            value: String(gender.id),
            label: gender.name,
        }));
    }, [genders]);

    const nationalityOptions = useMemo(() => {
        if (!nationalities || !Array.isArray(nationalities)) return [];
        return nationalities.map(nationality => ({
            value: nationality.id,
            label: nationality.name,
        }));
    }, [nationalities]);

    const idDocumentTypeOptions = useMemo(() => {
        if (!idDocumentTypes || !Array.isArray(idDocumentTypes)) return [];
        return idDocumentTypes.map(doc => ({
            value: doc.id,
            label: doc.name,
        }));
    }, [idDocumentTypes]);

    const directorRoleOptions = useMemo(() => {
        if (!directorRoles || !Array.isArray(directorRoles)) return [];
        return directorRoles.map(role => ({
            value: role.id,
            label: role.name,
        }));
    }, [directorRoles]);

    // ===================== RENDER =====================
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <RingLoader size={60} color="#3B82F6" />
                    <p className="mt-4 text-gray-600">Loading controller information...</p>
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
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isCreateMode ? 'Add Controller' : `Edit Controller ${controllerIndex !== null ? `#${controllerIndex + 1}` : ''}`}
                    </h1>
                </div>

                {/* Form - Same as before, all fields */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg p-6 md:p-8"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <h3 className="text-lg font-medium mb-4 text-blue-600 border-b border-blue-200 pb-2">
                            Personal Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                id="controller_first_name"
                                label="First Name"
                                name="controller_first_name"
                                value={formData.controller_first_name}
                                onChange={handleChange('controller_first_name')}
                                onBlur={() => setTouched(prev => ({ ...prev, controller_first_name: true }))}
                                touched={touched.controller_first_name}
                                error={errors.controller_first_name}
                                required={true}
                                placeholder="Enter first name"
                            />
                            <FormField
                                id="controller_middle_name"
                                label="Middle Name (Optional)"
                                name="controller_middle_name"
                                value={formData.controller_middle_name}
                                onChange={handleChange('controller_middle_name')}
                                onBlur={() => setTouched(prev => ({ ...prev, controller_middle_name: true }))}
                                touched={touched.controller_middle_name}
                                error={errors.controller_middle_name}
                                placeholder="Enter middle name"
                            />
                            <FormField
                                id="controller_last_name"
                                label="Last Name"
                                name="controller_last_name"
                                value={formData.controller_last_name}
                                onChange={handleChange('controller_last_name')}
                                onBlur={() => setTouched(prev => ({ ...prev, controller_last_name: true }))}
                                touched={touched.controller_last_name}
                                error={errors.controller_last_name}
                                required={true}
                                placeholder="Enter last name"
                            />
                            <FormField
                                id="controller_email"
                                label="Email Address"
                                name="controller_email"
                                type="email"
                                value={formData.controller_email}
                                onChange={handleChange('controller_email')}
                                onBlur={() => setTouched(prev => ({ ...prev, controller_email: true }))}
                                touched={touched.controller_email}
                                error={errors.controller_email}
                                required={true}
                                placeholder="Enter email address"
                            />
                        </div>

                        {/* Resident Country & Nationality */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomSelect
                                id="controller_resident_country"
                                label="Resident Country"
                                options={countryOptions}
                                value={countryOptions.find(opt => opt.value === formData.controller_resident_country)}
                                onChange={handleSelectChange('controller_resident_country')}
                                touched={touched.controller_resident_country}
                                error={errors.controller_resident_country}
                                required={true}
                                isLoading={countriesLoading}
                                isCountryField={true}
                                placeholder="Select resident country"
                            />
                            <CustomSelect
                                id="controller_nationality"
                                label="Nationality"
                                options={nationalityOptions}
                                value={nationalityOptions.find(opt => opt.value === formData.controller_nationality)}
                                onChange={handleSelectChange('controller_nationality')}
                                touched={touched.controller_nationality}
                                error={errors.controller_nationality}
                                required={true}
                                placeholder="Select nationality"
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <div className="w-2/5 sm:w-1/3">
                                        <CustomSelect
                                            id="controller_mobilenumber_countrycode"
                                            label="Country Code"
                                            options={countryOptions}
                                            value={countryOptions.find(opt =>
                                                opt.phoneCode === formData.controller_mobilenumber_countrycode
                                            )}
                                            onChange={(option) => {
                                                if (option) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        controller_mobilenumber_countrycode: option.phoneCode || ''
                                                    }));
                                                    setTouched(prev => ({ ...prev, controller_mobilenumber_countrycode: true }));
                                                }
                                            }}
                                            touched={touched.controller_mobilenumber_countrycode}
                                            error={errors.controller_mobilenumber_countrycode}
                                            isLoading={countriesLoading}
                                            placeholder="Select code"
                                            isCountryField={true}
                                            showPhoneCode={true}
                                            menuWidth="280px"
                                            formatOptionLabel={(option, { context } = {}) => (
                                                context === 'value' ? (
                                                    <div className="flex items-center gap-1.5">
                                                        {option.flag && option.flag.startsWith("http") ? (
                                                            <img
                                                                src={option.flag}
                                                                alt={`${option.label} flag`}
                                                                className="w-5 h-3.5 object-cover rounded"
                                                                onError={(e) => {
                                                                    e.target.style.display = "none";
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-sm">{option.flag || "🏳️"}</span>
                                                        )}
                                                        <span className="text-gray-700 text-sm font-medium">
                                                            {option.phoneCode || option.phone_code}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between w-full py-0.5">
                                                        <div className="flex items-center space-x-2 min-w-0">
                                                            {option.flag && option.flag.startsWith("http") ? (
                                                                <img
                                                                    src={option.flag}
                                                                    alt={`${option.label} flag`}
                                                                    className="w-5 h-3.5 object-cover rounded"
                                                                    onError={(e) => {
                                                                        e.target.style.display = "none";
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span className="text-sm">{option.flag || "🏳️"}</span>
                                                            )}
                                                            <span className="font-medium text-gray-800 text-sm truncate">
                                                                {option.label}
                                                            </span>
                                                        </div>
                                                        <span className="text-gray-500 text-xs font-medium bg-gray-100 px-2 py-0.5 rounded shrink-0 ml-2">
                                                            {option.phoneCode || option.phone_code}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                            filterOption={(option, inputValue) => {
                                                const searchTerm = inputValue.toLowerCase();
                                                const countryName = (option.label || "").toLowerCase();
                                                const phoneCode = (option.phoneCode || option.phone_code || "").toLowerCase();
                                                return countryName.includes(searchTerm) || phoneCode.includes(searchTerm);
                                            }}
                                        />
                                    </div>
                                    <div className="w-3/5 sm:w-2/3">
                                        <FormField
                                            id="controller_mobile_number"
                                            label=""
                                            name="controller_mobile_number"
                                            value={formData.controller_mobile_number}
                                            onChange={handleChange('controller_mobile_number')}
                                            onBlur={() => setTouched(prev => ({ ...prev, controller_mobile_number: true }))}
                                            touched={touched.controller_mobile_number}
                                            error={errors.controller_mobile_number}
                                            required={true}
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                </div>
                                {touched.controller_mobile_number && errors.controller_mobile_number && (
                                    <div className="text-red-500 text-xs mt-1 flex items-center">
                                        <FaInfoCircle className="mr-1 w-3 h-3" />
                                        {errors.controller_mobile_number}
                                    </div>
                                )}
                                {touched.controller_mobilenumber_countrycode && errors.controller_mobilenumber_countrycode && (
                                    <div className="text-red-500 text-xs mt-1 flex items-center">
                                        <FaInfoCircle className="mr-1 w-3 h-3" />
                                        {errors.controller_mobilenumber_countrycode}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6">
                                <CustomSelect
                                    id="controller_gender"
                                    label="Gender"
                                    options={genderOptions}
                                    value={genderOptions.find(opt => opt.value === formData.controller_gender)}
                                    onChange={handleSelectChange('controller_gender')}
                                    touched={touched.controller_gender}
                                    error={errors.controller_gender}
                                    required={true}
                                    placeholder="Select gender"
                                />
                            </div>
                        </div>

                        {/* Date of Birth & Designation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                id="controller_dob"
                                label="Date of Birth"
                                name="controller_dob"
                                type="date"
                                value={formData.controller_dob}
                                onChange={handleChange('controller_dob')}
                                onBlur={() => setTouched(prev => ({ ...prev, controller_dob: true }))}
                                touched={touched.controller_dob}
                                error={errors.controller_dob}
                                required={true}
                            />
                            <FormField
                                id="controller_designation"
                                label="Designation"
                                name="controller_designation"
                                value={formData.controller_designation}
                                onChange={handleChange('controller_designation')}
                                onBlur={() => setTouched(prev => ({ ...prev, controller_designation: true }))}
                                touched={touched.controller_designation}
                                error={errors.controller_designation}
                                required={true}
                                placeholder="Enter designation"
                            />
                        </div>

                        {/* SSN (conditional) */}
                        {formData.controller_ssn && (
                            <FormField
                                id="controller_ssn"
                                label="Social Security Number (SSN)"
                                name="controller_ssn"
                                value={formData.controller_ssn}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    let formatted = value;
                                    if (value.length <= 3) {
                                        formatted = value;
                                    } else if (value.length <= 5) {
                                        formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
                                    } else {
                                        formatted = `${value.slice(0, 3)}-${value.slice(3, 5)}-${value.slice(5, 9)}`;
                                    }
                                    setFormData(prev => ({ ...prev, controller_ssn: formatted }));
                                }}
                                onBlur={() => setTouched(prev => ({ ...prev, controller_ssn: true }))}
                                touched={touched.controller_ssn}
                                error={errors.controller_ssn}
                                required={false}
                                placeholder="XXX-XX-XXXX"
                            />
                        )}

                        {/* ID Documents */}
                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-4 text-blue-600 border-b border-blue-200 pb-2">
                                ID Documents
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CustomSelect
                                    id="controller_doc_type"
                                    label="ID Document Type"
                                    options={idDocumentTypeOptions}
                                    value={idDocumentTypeOptions.find(opt => opt.value === formData.controller_doc_type)}
                                    onChange={handleSelectChange('controller_doc_type')}
                                    touched={touched.controller_doc_type}
                                    error={errors.controller_doc_type}
                                    required={true}
                                    placeholder="Select document type"
                                />
                                <FormField
                                    id="controller_doc_id"
                                    label="ID Document Number"
                                    name="controller_doc_id"
                                    value={formData.controller_doc_id}
                                    onChange={handleChange('controller_doc_id')}
                                    onBlur={() => setTouched(prev => ({ ...prev, controller_doc_id: true }))}
                                    touched={touched.controller_doc_id}
                                    error={errors.controller_doc_id}
                                    required={true}
                                    placeholder="Enter document number"
                                />
                                <CustomSelect
                                    id="controller_doc_country"
                                    label="ID Issuing Country"
                                    options={countryOptions}
                                    value={countryOptions.find(opt => opt.value === formData.controller_doc_country)}
                                    onChange={handleSelectChange('controller_doc_country')}
                                    touched={touched.controller_doc_country}
                                    error={errors.controller_doc_country}
                                    required={true}
                                    isLoading={countriesLoading}
                                    isCountryField={true}
                                    placeholder="Select issuing country"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-4 text-blue-600 border-b border-blue-200 pb-2">
                                Address Information
                            </h3>

                            <div className="space-y-4">
                                <CustomSelect
                                    id="controller_country"
                                    label="Country"
                                    options={countryOptions}
                                    value={countryOptions.find(opt => opt.value === formData.controller_country)}
                                    onChange={(option) => {
                                        if (option) {
                                            setFormData(prev => ({
                                                ...prev,
                                                controller_country: option.value,
                                                controller_state: ''
                                            }));
                                            setTouched(prev => ({ ...prev, controller_country: true }));
                                        }
                                    }}
                                    touched={touched.controller_country}
                                    error={errors.controller_country}
                                    required={true}
                                    isLoading={countriesLoading}
                                    isCountryField={true}
                                    placeholder="Select country"
                                />

                                <FormField
                                    id="controller_zip_code"
                                    label="ZIP/Postal Code"
                                    name="controller_zip_code"
                                    value={formData.controller_zip_code}
                                    onChange={handleChange('controller_zip_code')}
                                    onBlur={() => setTouched(prev => ({ ...prev, controller_zip_code: true }))}
                                    touched={touched.controller_zip_code}
                                    error={errors.controller_zip_code}
                                    required={true}
                                    placeholder="Enter ZIP/Postal code"
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        id="controller_street_address_1"
                                        label="Street Address 1"
                                        name="controller_street_address_1"
                                        value={formData.controller_street_address_1}
                                        onChange={handleChange('controller_street_address_1')}
                                        onBlur={() => setTouched(prev => ({ ...prev, controller_street_address_1: true }))}
                                        touched={touched.controller_street_address_1}
                                        error={errors.controller_street_address_1}
                                        required={true}
                                        placeholder="Enter street address"
                                    />
                                    <FormField
                                        id="controller_street_address_2"
                                        label="Street Address 2 (Optional)"
                                        name="controller_street_address_2"
                                        value={formData.controller_street_address_2}
                                        onChange={handleChange('controller_street_address_2')}
                                        onBlur={() => setTouched(prev => ({ ...prev, controller_street_address_2: true }))}
                                        touched={touched.controller_street_address_2}
                                        error={errors.controller_street_address_2}
                                        placeholder="Enter suite or apartment number"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        id="controller_city"
                                        label="City"
                                        name="controller_city"
                                        value={formData.controller_city}
                                        onChange={handleChange('controller_city')}
                                        onBlur={() => setTouched(prev => ({ ...prev, controller_city: true }))}
                                        touched={touched.controller_city}
                                        error={errors.controller_city}
                                        required={true}
                                        placeholder="Enter city"
                                    />

                                    {/* State/Province with fallback */}
                                    <div className="space-y-2">
                                        <label htmlFor="controller_state" className="block text-sm font-medium text-gray-700">
                                            State/Province <span className="text-red-500">*</span>
                                        </label>

                                        {stateOptions && stateOptions.length > 0 ? (
                                            <Select
                                                id="controller_state"
                                                name="controller_state"
                                                options={stateOptions}
                                                value={stateOptions.find(opt => opt.value === formData.controller_state)}
                                                onChange={(option) => {
                                                    if (option) {
                                                        const value = option.label;
                                                        setFormData(prev => ({ ...prev, controller_state: value }));
                                                        setTouched(prev => ({ ...prev, controller_state: true }));
                                                    } else {
                                                        setFormData(prev => ({ ...prev, controller_state: "" }));
                                                        setTouched(prev => ({ ...prev, controller_state: true }));
                                                    }
                                                }}
                                                onBlur={() => setTouched(prev => ({ ...prev, controller_state: true }))}
                                                isDisabled={!formData.controller_country}
                                                isLoading={statesLoading}
                                                placeholder={
                                                    !formData.controller_country
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
                                                        borderColor: touched.controller_state && errors.controller_state ? "#ef4444" : "#d1d5db",
                                                        borderRadius: "0.5rem",
                                                        padding: "0.25rem 0.5rem",
                                                        fontSize: "0.875rem",
                                                        backgroundColor: !formData.controller_country ? "#f3f4f6" : "white",
                                                        opacity: !formData.controller_country ? 0.6 : 1,
                                                        "&:hover": {
                                                            borderColor: touched.controller_state && errors.controller_state ? "#ef4444" : "#9ca3af",
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
                                            <input
                                                type="text"
                                                id="controller_state"
                                                name="controller_state"
                                                value={formData.controller_state || ""}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData(prev => ({ ...prev, controller_state: value }));
                                                    setTouched(prev => ({ ...prev, controller_state: true }));
                                                }}
                                                onBlur={() => setTouched(prev => ({ ...prev, controller_state: true }))}
                                                disabled={!formData.controller_country}
                                                placeholder={
                                                    !formData.controller_country
                                                        ? "Please select a country first"
                                                        : statesLoading
                                                            ? "Loading states..."
                                                            : "Enter state/province..."
                                                }
                                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 
                          ${!formData.controller_country ? "bg-gray-100 opacity-60 cursor-not-allowed" : ""}
                          ${touched.controller_state && errors.controller_state
                                                        ? "border-red-500 focus:ring-red-500"
                                                        : "border-gray-300 focus:ring-blue-500"
                                                    }`}
                                            />
                                        )}

                                        {touched.controller_state && errors.controller_state && (
                                            <div className="text-red-500 text-xs mt-1 flex items-center">
                                                <FaInfoCircle className="mr-1 w-3 h-3" />
                                                {errors.controller_state}
                                            </div>
                                        )}

                                        {stateOptions && stateOptions.length === 0 && formData.controller_country && !statesLoading && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                No states available for the selected country. Please enter the state manually.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        id="controllerHouseNumber"
                                        label="House Number"
                                        name="controllerHouseNumber"
                                        value={formData.controllerHouseNumber}
                                        onChange={handleChange('controllerHouseNumber')}
                                        onBlur={() => setTouched(prev => ({ ...prev, controllerHouseNumber: true }))}
                                        touched={touched.controllerHouseNumber}
                                        error={errors.controllerHouseNumber}
                                        required={false}
                                        placeholder="e.g., 123, 45A, B-12"
                                    />
                                    <FormField
                                        id="suburb"
                                        label="Suburb"
                                        name="suburb"
                                        value={formData.suburb}
                                        onChange={handleChange('suburb')}
                                        onBlur={() => setTouched(prev => ({ ...prev, suburb: true }))}
                                        touched={touched.suburb}
                                        error={errors.suburb}
                                        required={false}
                                        placeholder="Enter suburb/district"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Additional Controller Info */}
                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-4 text-blue-600 border-b border-blue-200 pb-2">
                                Additional Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CustomSelect
                                    id="director_role_id"
                                    label="Role"
                                    options={directorRoleOptions}
                                    value={directorRoleOptions.find(opt => opt.value === formData.director_role_id)}
                                    onChange={handleSelectChange('director_role_id')}
                                    touched={touched.director_role_id}
                                    error={errors.director_role_id}
                                    required={false}
                                    isLoading={directorRolesLoading}
                                    placeholder="Select director role"
                                />

                                <FormField
                                    id="percentage_of_shares"
                                    label="Percentage of Shares"
                                    name="percentage_of_shares"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={formData.percentage_of_shares}
                                    onChange={handleChange('percentage_of_shares')}
                                    onBlur={() => setTouched(prev => ({ ...prev, percentage_of_shares: true }))}
                                    touched={touched.percentage_of_shares}
                                    error={errors.percentage_of_shares}
                                    required={false}
                                    placeholder="e.g., 25.50"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <CustomSelect
                                    id="controller_past_nationalities"
                                    label="Past Nationalities"
                                    options={nationalityOptions}
                                    isMulti={true}
                                    value={nationalityOptions.filter(opt =>
                                        formData.controller_past_nationalities?.includes(opt.value)
                                    )}
                                    onChange={handleMultiSelectChange('controller_past_nationalities')}
                                    touched={touched.controller_past_nationalities}
                                    error={errors.controller_past_nationalities}
                                    placeholder="Select past nationalities..."
                                    required={false}
                                />

                                <FormField
                                    id="aliases"
                                    label="Aliases"
                                    name="aliases"
                                    value={formData.aliases}
                                    onChange={handleChange('aliases')}
                                    onBlur={() => setTouched(prev => ({ ...prev, aliases: true }))}
                                    touched={touched.aliases}
                                    error={errors.aliases}
                                    required={false}
                                    placeholder="e.g., Alias Name"
                                />
                            </div>

                            {/* Nominees */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Has Nominees?
                                </label>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="has_nominees"
                                            value="1"
                                            checked={formData.has_nominees === "1"}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData(prev => ({ ...prev, has_nominees: value }));
                                                setTouched(prev => ({ ...prev, has_nominees: true }));
                                                if (value === "0") {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        nominee_first_name: '',
                                                        nominee_middle_name: '',
                                                        nominee_last_name: '',
                                                    }));
                                                }
                                            }}
                                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Yes</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="has_nominees"
                                            value="0"
                                            checked={formData.has_nominees === "0"}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData(prev => ({ ...prev, has_nominees: value }));
                                                setTouched(prev => ({ ...prev, has_nominees: true }));
                                                if (value === "0") {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        nominee_first_name: '',
                                                        nominee_middle_name: '',
                                                        nominee_last_name: '',
                                                    }));
                                                }
                                            }}
                                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">No</span>
                                    </label>
                                </div>

                                {formData.has_nominees === "1" && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                                    >
                                        <h4 className="text-md font-medium text-gray-800 mb-3">Nominee Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField
                                                id="nominee_first_name"
                                                label="First Name"
                                                name="nominee_first_name"
                                                value={formData.nominee_first_name}
                                                onChange={handleChange('nominee_first_name')}
                                                onBlur={() => setTouched(prev => ({ ...prev, nominee_first_name: true }))}
                                                touched={touched.nominee_first_name}
                                                error={errors.nominee_first_name}
                                                required={true}
                                                placeholder="Enter first name"
                                            />
                                            <FormField
                                                id="nominee_middle_name"
                                                label="Middle Name (Optional)"
                                                name="nominee_middle_name"
                                                value={formData.nominee_middle_name}
                                                onChange={handleChange('nominee_middle_name')}
                                                onBlur={() => setTouched(prev => ({ ...prev, nominee_middle_name: true }))}
                                                touched={touched.nominee_middle_name}
                                                error={errors.nominee_middle_name}
                                                placeholder="Enter middle name"
                                            />
                                            <FormField
                                                id="nominee_last_name"
                                                label="Last Name"
                                                name="nominee_last_name"
                                                value={formData.nominee_last_name}
                                                onChange={handleChange('nominee_last_name')}
                                                onBlur={() => setTouched(prev => ({ ...prev, nominee_last_name: true }))}
                                                touched={touched.nominee_last_name}
                                                error={errors.nominee_last_name}
                                                required={true}
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
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
                                        {isCreateMode ? 'Add Controller' : 'Save Changes'}
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

export default EditController;