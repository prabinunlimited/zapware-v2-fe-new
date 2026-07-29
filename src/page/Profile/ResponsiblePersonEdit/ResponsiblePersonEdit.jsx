import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    fetchOccupation,
    selectOccupation,
    selectOccupationLoading,
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
const ResponsiblePersonEdit = () => {
    const { customerId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const authtoken = localStorage.getItem('authtoken');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [zipDebounceTimer, setZipDebounceTimer] = useState(null);
    const [activeField, setActiveField] = useState("");
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
    const occupations = useSelector(selectOccupation);
    const occupationLoading = useSelector(selectOccupationLoading);

    // Local state - removed email and phone fields
    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        resident_country: '',
        nationality: '',
        country: '',
        state: '',
        city: '',
        street_address_1: '',
        street_address_2: '',
        zip_code: '',
        gender: '',
        dob: '',
        designation: '',
        ssn: '',
        doc_type: '',
        doc_id: '',
        doc_country: '',
        id_issued_date: '',
        responsible_person_occupation: '',
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // ===================== LOAD RESPONSIBLE PERSON DATA =====================
    useEffect(() => {
        const fetchResponsiblePerson = async () => {
            try {
                const customerUuid = localStorage.getItem('customerUuid');
                if (!customerUuid) {
                    throw new Error('Customer UUID not found');
                }

                const response = await axios.get(
                    `${API_URL}/customers/responsible-person/${customerUuid}`,
                    { headers: { Authorization: `Bearer ${authtoken}` } }
                );

                console.log('📦 Responsible Person API Response:', response.data);

                if (response.data && response.data.data) {
                    const data = response.data.data;
                    setFormData({
                        first_name: data.first_name || '',
                        middle_name: data.middle_name || '',
                        last_name: data.last_name || '',
                        resident_country: data.residentcountry_id || '',
                        nationality: data.nationality_id || '',
                        country: data.country_id || '',
                        state: data.state || '',
                        city: data.city || '',
                        street_address_1: data.street_address_1 || '',
                        street_address_2: data.street_address_2 || '',
                        zip_code: data.zip_code || '',
                        gender: data.genderid || '',
                        dob: data.dob || '',
                        designation: data.designation || '',
                        ssn: data.ssn || '',
                        doc_type: data.doc_type || '',
                        doc_id: data.doc_id || '',
                        doc_country: data.doc_country || '',
                        id_issued_date: data.id_issued_date || '',
                        responsible_person_occupation: data.responsible_person_occupation || '',
                    });
                }
            } catch (error) {
                console.error('Error fetching responsible person:', error);
                toast.error(error.response?.data?.message || 'Failed to load responsible person information');
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
                await dispatch(fetchOccupation());
            } catch (error) {
                console.error('Error fetching dropdown data:', error);
            }
        };

        fetchResponsiblePerson();
        fetchDropdownData();

        return () => {
            if (zipDebounceTimer) {
                clearTimeout(zipDebounceTimer);
            }
        };
    }, [customerId, authtoken, dispatch]);

    // ===================== FETCH STATES WHEN COUNTRY CHANGES =====================
    useEffect(() => {
        if (formData.country) {
            const timer = setTimeout(() => {
                dispatch(fetchStatesByCountry(formData.country));
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [formData.country, dispatch]);

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

            // Map form data to API expected payload 
            const payload = {
                first_name: formData.first_name,
                middle_name: formData.middle_name || "",
                last_name: formData.last_name,
                resident_country_id: formData.resident_country ? parseInt(formData.resident_country) : null,
                nationality_id: formData.nationality ? parseInt(formData.nationality) : null,
                gender_id: formData.gender ? parseInt(formData.gender) : null,
                dob: formData.dob,
                designation: formData.designation,
                occupation_id: formData.responsible_person_occupation ? parseInt(formData.responsible_person_occupation) : null,
                id_document_type_id: formData.doc_type ? parseInt(formData.doc_type) : null,
                id_document_number: formData.doc_id,
                id_issuing_country_id: formData.doc_country ? parseInt(formData.doc_country) : null,
                id_issue_date: formData.id_issued_date,
                contact_address_country_id: formData.country ? parseInt(formData.country) : null,
                contact_address_zip_code: formData.zip_code,
                contact_address_street_address_1: formData.street_address_1,
                contact_address_street_address_2: formData.street_address_2 || "",
                contact_address_city: formData.city,
                contact_address_state: formData.state,
                updated_user_type: "customer",
                updated_user_id: authCustomerId ? parseInt(authCustomerId) : null,
            };

            // Remove null/undefined values
            Object.keys(payload).forEach(key => {
                if (payload[key] === null || payload[key] === undefined) {
                    delete payload[key];
                }
            });

            console.log('📤 Sending payload:', payload);

            const response = await axios.post(
                `${API_URL}/customers/update-responsible-person/${customerUuid}`,
                payload,
                { headers: { Authorization: `Bearer ${authtoken}` } }
            );

            console.log('📥 API Response:', response.data);

            if (response.data?.status === 'success') {
                setSuccessMessage(response.data.message || 'Responsible person information updated successfully!');
                setShowSuccessModal(true);
            } else {
                setErrorMessage(response.data?.message || 'Failed to update responsible person information');
                setShowErrorModal(true);
            }
        } catch (error) {
            console.error('❌ Error updating responsible person:', error);
            console.error('Error response:', error.response?.data);

            if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat();
                errorMessages.forEach(msg => toast.error(msg));
                setErrors(error.response.data.errors);
            } else {
                setErrorMessage(error.response?.data?.message || 'Failed to update responsible person information');
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
    }

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
            value: gender.id,
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

    const occupationOptions = useMemo(() => {
        if (!occupations || !Array.isArray(occupations)) return [];
        return occupations.map(occ => ({
            value: occ.id,
            label: occ.name || occ.occupation_name || occ.title,
        }));
    }, [occupations]);

    // ===================== RENDER =====================
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <RingLoader size={60} color="#3B82F6" />
                    <p className="mt-4 text-gray-600">Loading responsible person information...</p>
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
                    <h1 className="text-2xl font-bold text-gray-800">Edit Responsible Person</h1>
                </div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg p-6 md:p-8"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <h3 className="text-lg font-medium mb-4 text-blue-600 border-b border-blue-200 pb-2">
                            Responsible Personal Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                id="first_name"
                                label="First Name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange('first_name')}
                                onBlur={() => setTouched(prev => ({ ...prev, first_name: true }))}
                                touched={touched.first_name}
                                error={errors.first_name}
                                required={true}
                                placeholder="Enter first name"
                            />
                            <FormField
                                id="middle_name"
                                label="Middle Name (Optional)"
                                name="middle_name"
                                value={formData.middle_name}
                                onChange={handleChange('middle_name')}
                                onBlur={() => setTouched(prev => ({ ...prev, middle_name: true }))}
                                touched={touched.middle_name}
                                error={errors.middle_name}
                                placeholder="Enter middle name"
                            />
                            <FormField
                                id="last_name"
                                label="Last Name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange('last_name')}
                                onBlur={() => setTouched(prev => ({ ...prev, last_name: true }))}
                                touched={touched.last_name}
                                error={errors.last_name}
                                required={true}
                                placeholder="Enter last name"
                            />
                        </div>

                        {/* Resident Country & Nationality */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomSelect
                                id="resident_country"
                                label="Resident Country"
                                options={countryOptions}
                                value={countryOptions.find(opt => opt.value === formData.resident_country)}
                                onChange={handleSelectChange('resident_country')}
                                touched={touched.resident_country}
                                error={errors.resident_country}
                                required={true}
                                isLoading={countriesLoading}
                                isCountryField={true}
                                placeholder="Select resident country"
                            />
                            <CustomSelect
                                id="nationality"
                                label="Nationality"
                                options={nationalityOptions}
                                value={nationalityOptions.find(opt => opt.value === formData.nationality)}
                                onChange={handleSelectChange('nationality')}
                                touched={touched.nationality}
                                error={errors.nationality}
                                required={true}
                                placeholder="Select nationality"
                            />
                        </div>

                        {/* Gender & Date of Birth */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CustomSelect
                                id="gender"
                                label="Gender"
                                options={genderOptions}
                                value={genderOptions.find(opt => opt.value === formData.gender)}
                                onChange={handleSelectChange('gender')}
                                touched={touched.gender}
                                error={errors.gender}
                                required={true}
                                placeholder="Select gender"
                            />
                            <FormField
                                id="dob"
                                label="Date of Birth"
                                name="dob"
                                type="date"
                                value={formData.dob}
                                onChange={handleChange('dob')}
                                onBlur={() => setTouched(prev => ({ ...prev, dob: true }))}
                                touched={touched.dob}
                                error={errors.dob}
                                required={true}
                            />
                        </div>

                        {/* Designation & Occupation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                id="designation"
                                label="Designation"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange('designation')}
                                onBlur={() => setTouched(prev => ({ ...prev, designation: true }))}
                                touched={touched.designation}
                                error={errors.designation}
                                required={true}
                                placeholder="Enter designation"
                            />
                            <CustomSelect
                                id="responsible_person_occupation"
                                label="Occupation"
                                options={occupationOptions}
                                value={occupationOptions.find(opt => opt.value === formData.responsible_person_occupation)}
                                onChange={handleSelectChange('responsible_person_occupation')}
                                touched={touched.responsible_person_occupation}
                                error={errors.responsible_person_occupation}
                                required={true}
                                isLoading={occupationLoading}
                                placeholder="Select occupation"
                            />
                        </div>

                        {/* SSN (conditional) */}
                        {formData.ssn && (
                            <FormField
                                id="ssn"
                                label="Social Security Number (SSN)"
                                name="ssn"
                                value={formData.ssn}
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
                                    setFormData(prev => ({ ...prev, ssn: formatted }));
                                }}
                                onBlur={() => setTouched(prev => ({ ...prev, ssn: true }))}
                                touched={touched.ssn}
                                error={errors.ssn}
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
                                    id="doc_type"
                                    label="ID Document Type"
                                    options={idDocumentTypeOptions}
                                    value={idDocumentTypeOptions.find(opt => opt.value === formData.doc_type)}
                                    onChange={handleSelectChange('doc_type')}
                                    touched={touched.doc_type}
                                    error={errors.doc_type}
                                    required={true}
                                    placeholder="Select document type"
                                />
                                <FormField
                                    id="doc_id"
                                    label="ID Document Number"
                                    name="doc_id"
                                    value={formData.doc_id}
                                    onChange={handleChange('doc_id')}
                                    onBlur={() => setTouched(prev => ({ ...prev, doc_id: true }))}
                                    touched={touched.doc_id}
                                    error={errors.doc_id}
                                    required={true}
                                    placeholder="Enter document number"
                                />
                                <CustomSelect
                                    id="doc_country"
                                    label="ID Issuing Country"
                                    options={countryOptions}
                                    value={countryOptions.find(opt => opt.value === formData.doc_country)}
                                    onChange={handleSelectChange('doc_country')}
                                    touched={touched.doc_country}
                                    error={errors.doc_country}
                                    required={true}
                                    isLoading={countriesLoading}
                                    isCountryField={true}
                                    placeholder="Select issuing country"
                                />
                                <FormField
                                    id="id_issued_date"
                                    label="ID Issue Date"
                                    name="id_issued_date"
                                    type="date"
                                    value={formData.id_issued_date}
                                    onChange={handleChange('id_issued_date')}
                                    onBlur={() => setTouched(prev => ({ ...prev, id_issued_date: true }))}
                                    touched={touched.id_issued_date}
                                    error={errors.id_issued_date}
                                    required={true}
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-4 text-blue-600 border-b border-blue-200 pb-2">
                                Contact Address
                            </h3>

                            <div className="space-y-4">
                                <CustomSelect
                                    id="country"
                                    label="Country"
                                    options={countryOptions}
                                    value={countryOptions.find(opt => opt.value === formData.country)}
                                    onChange={(option) => {
                                        if (option) {
                                            setFormData(prev => ({
                                                ...prev,
                                                country: option.value,
                                                state: ''
                                            }));
                                            setTouched(prev => ({ ...prev, country: true }));
                                        }
                                    }}
                                    touched={touched.country}
                                    error={errors.country}
                                    required={true}
                                    isLoading={countriesLoading}
                                    isCountryField={true}
                                    placeholder="Select country"
                                />

                                <FormField
                                    id="zip_code"
                                    label="ZIP/Postal Code"
                                    name="zip_code"
                                    value={formData.zip_code}
                                    onChange={handleChange('zip_code')}
                                    onBlur={() => setTouched(prev => ({ ...prev, zip_code: true }))}
                                    touched={touched.zip_code}
                                    error={errors.zip_code}
                                    required={true}
                                    placeholder="Enter ZIP/Postal code"
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        id="street_address_1"
                                        label="Street Address 1"
                                        name="street_address_1"
                                        value={formData.street_address_1}
                                        onChange={handleChange('street_address_1')}
                                        onBlur={() => setTouched(prev => ({ ...prev, street_address_1: true }))}
                                        touched={touched.street_address_1}
                                        error={errors.street_address_1}
                                        required={true}
                                        placeholder="Enter street address"
                                    />
                                    <FormField
                                        id="street_address_2"
                                        label="Street Address 2 (Optional)"
                                        name="street_address_2"
                                        value={formData.street_address_2}
                                        onChange={handleChange('street_address_2')}
                                        onBlur={() => setTouched(prev => ({ ...prev, street_address_2: true }))}
                                        touched={touched.street_address_2}
                                        error={errors.street_address_2}
                                        placeholder="Enter suite or apartment number"
                                    />
                                </div>

                                <FormField
                                    id="city"
                                    label="City"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange('city')}
                                    onBlur={() => setTouched(prev => ({ ...prev, city: true }))}
                                    touched={touched.city}
                                    error={errors.city}
                                    required={true}
                                    placeholder="Enter city"
                                />

                                {/* State/Province with fallback */}
                                <div className="space-y-2">
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                                        State/Province <span className="text-red-500">*</span>
                                    </label>

                                    {stateOptions && stateOptions.length > 0 ? (
                                        <Select
                                            id="state"
                                            name="state"
                                            options={stateOptions}
                                            value={stateOptions.find(opt => opt.value === formData.state)}
                                            onChange={(option) => {
                                                if (option) {
                                                    const value = option.label;
                                                    setFormData(prev => ({ ...prev, state: value }));
                                                    setTouched(prev => ({ ...prev, state: true }));
                                                } else {
                                                    setFormData(prev => ({ ...prev, state: "" }));
                                                    setTouched(prev => ({ ...prev, state: true }));
                                                }
                                            }}
                                            onBlur={() => setTouched(prev => ({ ...prev, state: true }))}
                                            isDisabled={!formData.country}
                                            isLoading={statesLoading}
                                            placeholder={
                                                !formData.country
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
                                                    borderColor: touched.state && errors.state ? "#ef4444" : "#d1d5db",
                                                    borderRadius: "0.5rem",
                                                    padding: "0.25rem 0.5rem",
                                                    fontSize: "0.875rem",
                                                    backgroundColor: !formData.country ? "#f3f4f6" : "white",
                                                    opacity: !formData.country ? 0.6 : 1,
                                                    "&:hover": {
                                                        borderColor: touched.state && errors.state ? "#ef4444" : "#9ca3af",
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
                                            id="state"
                                            name="state"
                                            value={formData.state || ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setFormData(prev => ({ ...prev, state: value }));
                                                setTouched(prev => ({ ...prev, state: true }));
                                            }}
                                            onBlur={() => setTouched(prev => ({ ...prev, state: true }))}
                                            disabled={!formData.country}
                                            placeholder={
                                                !formData.country
                                                    ? "Please select a country first"
                                                    : statesLoading
                                                        ? "Loading states..."
                                                        : "Enter state/province..."
                                            }
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 
                        ${!formData.country ? "bg-gray-100 opacity-60 cursor-not-allowed" : ""}
                        ${touched.state && errors.state
                                                    ? "border-red-500 focus:ring-red-500"
                                                    : "border-gray-300 focus:ring-blue-500"
                                                }`}
                                        />
                                    )}

                                    {touched.state && errors.state && (
                                        <div className="text-red-500 text-xs mt-1 flex items-center">
                                            <FaInfoCircle className="mr-1 w-3 h-3" />
                                            {errors.state}
                                        </div>
                                    )}

                                    {stateOptions && stateOptions.length === 0 && formData.country && !statesLoading && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            No states available for the selected country. Please enter the state manually.
                                        </p>
                                    )}
                                </div>
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

export default ResponsiblePersonEdit;