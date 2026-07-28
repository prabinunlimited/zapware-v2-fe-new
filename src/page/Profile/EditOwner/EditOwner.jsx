import React, { useState, useEffect, useMemo } from 'react';
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
  fetchOwnerRoles,
  selectRoles,
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
      padding: "8px 12px",
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
        formatOptionLabel={(option) => {
          if (isCountryField && showPhoneCode) {
            return (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
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
                  <span className="font-medium text-gray-800 text-sm">{option.label}</span>
                </div>
                <span className="text-gray-500 text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">
                  {option.phoneCode || option.phone_code}
                </span>
              </div>
            );
          }
          return (
            <span className="font-medium text-gray-800 text-sm">{option.label}</span>
          );
        }}
        filterOption={(option, inputValue) => {
          const searchTerm = inputValue.toLowerCase();
          const countryName = (option.label || "").toLowerCase();
          if (isCountryField && showPhoneCode) {
            const phoneCode = (option.phoneCode || option.phone_code || "").toLowerCase();
            return countryName.includes(searchTerm) || phoneCode.includes(searchTerm);
          }
          return countryName.includes(searchTerm);
        }}
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

// ===================== YES/NO TOGGLE COMPONENT =====================
const YesNoToggle = ({ label, value, onChange, required = false }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="flex gap-6 items-center h-[50px]">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          checked={value === '1'}
          onChange={() => onChange('1')}
          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Yes</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          checked={value === '0'}
          onChange={() => onChange('0')}
          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">No</span>
      </label>
    </div>
  </div>
);

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
const EditOwner = () => {
  const { customerId, ownerId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const authtoken = localStorage.getItem('authtoken');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeField, setActiveField] = useState("");

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
  const ownerRoles = useSelector(selectRoles);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    owner_uuid: '',
    owner_first_name: '',
    owner_middle_name: '',
    owner_last_name: '',
    owner_email: '',
    owner_phone_number: '',
    owner_phone_number_country_code: '',
    owner_country_id: '',
    ownership_percentage: 0,
    owner_dob: '',
    ssn: '',
    owner_gender: '',
    owner_resident_country: '',
    owner_nationality: '',
    owner_zip_code: '',
    owner_street_address_1: '',
    owner_street_address_2: '',
    owner_city: '',
    owner_state: '',
    owner_designation: '',
    owner_doc_type: '',
    owner_doc_id: '',
    owner_doc_country: '',
    owner_id_issuing_state: '',
    director_role_id: '',
    owner_role_id: '',
    is_responsible_person_owner: '1',
    needs_access_to_system: '0',
    other_ownership_percentage_datas: []
  });
  const [allOwners, setAllOwners] = useState([]);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ===================== LOAD OWNER DATA =====================
  useEffect(() => {
    const fetchOwner = async () => {
      try {
        const customerUuid = localStorage.getItem('customerUuid');
        if (!customerUuid) {
          throw new Error('Customer UUID not found');
        }

        const response = await axios.get(
          `${API_URL}/customers/owner-details/${customerUuid}`,
          { headers: { Authorization: `Bearer ${authtoken}` } }
        );

        console.log('📦 All Owners Response:', response.data);

        if (response.data && response.data.data && response.data.data.length > 0) {
          setAllOwners(response.data.data);
          let foundOwner = null;
          let foundIndex = -1;

          if (ownerId) {
            foundIndex = response.data.data.findIndex(
              (owner) => owner.owner_uuid === ownerId
            );
            if (foundIndex !== -1) {
              foundOwner = response.data.data[foundIndex];
            }
          }

          if (!foundOwner) {
            foundOwner = response.data.data[0];
            foundIndex = 0;
          }

          const data = foundOwner;

          console.log('📦 Selected Owner:', data);

          setFormData({
            owner_uuid: data.owner_uuid || '',
            owner_first_name: data.first_name || '',
            owner_middle_name: data.middle_name || '',
            owner_last_name: data.last_name || '',
            owner_email: data.email || '',
            owner_phone_number: data.mobile_number || '',
            owner_phone_number_country_code: data.mobile_number_country_code  || '',
            owner_country_id: data.country_id || '',
            ownership_percentage: data.ownership_percentage || 0,
            owner_dob: data.dob || '',
            ssn: data.ssn || '',
            owner_gender:  data.genderid|| '',
            owner_resident_country: data.residentcountry_id || '',
            owner_nationality: data.nationality_id || '',
            owner_zip_code: data.zip_code || '',
            owner_street_address_1: data.street_address_1 || '',
            owner_street_address_2: data.street_address_2 || '',
            owner_city: data.city || '',
            owner_state: data.province || '',
            owner_designation: data.designation || '',
            owner_doc_type: data.id_document_type_id || '',
            owner_doc_id: data.id_document_number || '',
            owner_doc_country: data.id_issuing_country_id || '',
            owner_id_issuing_state: data.id_issuing_state || '',
            director_role_id: data.role_id || '',
            owner_role_id: data.owner_role_id || '',
            is_responsible_person_owner: data.is_responsible_person_owner !== undefined ? String(data.is_responsible_person_owner) : '1',
            needs_access_to_system: data.needs_access_to_system !== undefined ? String(data.needs_access_to_system) : '0',
            other_ownership_percentage_datas: data.other_ownership_percentage_datas || [],
          });
        } else {
          toast.warning('No owner found');
        }
      } catch (error) {
        console.error('Error fetching owner:', error);
        toast.error(error.response?.data?.message || 'Failed to load owner information');
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
        await dispatch(fetchOwnerRoles());
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };

    fetchOwner();
    fetchDropdownData();

    return () => {
      // Cleanup
    };
  }, [customerId, ownerId, authtoken, dispatch]);

  // ===================== FETCH STATES WHEN COUNTRY CHANGES =====================
  useEffect(() => {
    if (formData.owner_country_id) {
      const timer = setTimeout(() => {
        dispatch(fetchStatesByCountry(formData.owner_country_id));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.owner_country_id, dispatch]);

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

  const handleYesNoChange = (field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // ===================== HANDLE SUBMIT =====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const currentPct = parseFloat(formData.ownership_percentage) || 0;
    const totalPct = currentPct + otherOwnersTotalPercentage;
    if (totalPct > 100) {
      setSaving(false);
      setErrorMessage(
        `Total ownership cannot exceed 100%. Other owners currently hold ${otherOwnersTotalPercentage.toFixed(
          2
        )}%, so this owner can have at most ${maxAllowedPercentage.toFixed(2)}%.`
      );
      setShowErrorModal(true);
      return;
    }

    try {
      const customerUuid = localStorage.getItem('customerUuid');
      const authCustomerId = localStorage.getItem('authcustomer_id');

      if (!customerUuid) {
        throw new Error('Customer UUID not found');
      }

      const payload = {
        owner_uuid: formData.owner_uuid || "",
        owner_type: "individual",
        ownership_percentage: formData.ownership_percentage || "0",
        is_responsible_person_owner: formData.is_responsible_person_owner || "1",
        first_name: formData.owner_first_name || "",
        middle_name: formData.owner_middle_name || "",
        last_name: formData.owner_last_name || "",
        email: formData.owner_email || "",
        resident_country_id: formData.owner_resident_country ? parseInt(formData.owner_resident_country) : "",
        nationality_id: formData.owner_nationality ? parseInt(formData.owner_nationality) : "",
        phone_number_country_code: formData.owner_phone_number_country_code || "",
        phone_number: formData.owner_phone_number || "",
        country_id: formData.owner_country_id ? parseInt(formData.owner_country_id) : "",
        zip_postal_code: formData.owner_zip_code || "",
        street_address_1: formData.owner_street_address_1 || "",
        street_address_2: formData.owner_street_address_2 || "",
        city: formData.owner_city || "",
        state_province: formData.owner_state || "",
        gender_id: formData.owner_gender ? parseInt(formData.owner_gender) : "",
        dob: formData.owner_dob || "",
        designation: formData.owner_designation || "",
        id_document_type_id: formData.owner_doc_type ? parseInt(formData.owner_doc_type) : "",
        id_document_number: formData.owner_doc_id || "",
        id_issuing_country_id: formData.owner_doc_country ? parseInt(formData.owner_doc_country) : "",
        id_issuing_state: formData.owner_id_issuing_state || "",
        director_role_id: formData.director_role_id ? parseInt(formData.director_role_id) : "",
        needs_access_to_system: formData.needs_access_to_system || "0",
        role_id: formData.needs_access_to_system === '1' && formData.owner_role_id ? parseInt(formData.owner_role_id) : "",
        ssn: formData.ssn || "",
        other_ownership_percentage_datas: otherOwners.map((owner) => ({
          other_owner_uuid: owner.owner_uuid,
          other_ownership_percentage: owner.ownership_percentage,
        })),
        updated_user_type: "customer",
        updated_user_id: authCustomerId ? parseInt(authCustomerId) : "",
      };
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === undefined) {
          delete payload[key];
        }
      });

      console.log('📤 Form Data:', formData);
      console.log('📤 Sending payload:', payload);

      const response = await axios.post(
        `${API_URL}/customers/update-owner-detail/${customerUuid}`,
        payload,
        { headers: { Authorization: `Bearer ${authtoken}` } }
      );

      console.log('📥 API Response:', response.data);
      if (response.data?.status === 'success') {
        setSuccessMessage(response.data.message || 'Owner information updated successfully!');
        setShowSuccessModal(true);
      } else {
        setErrorMessage(response.data?.message || 'Failed to update owner information');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('❌ Error updating owner:', error);
      console.error('Error response:', error.response?.data);

      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        errorMessages.forEach(msg => toast.error(msg));
        setErrors(error.response.data.errors);
      } else {
        setErrorMessage(error.response?.data?.message || 'Failed to update owner information');
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

  const directorRoleOptions = useMemo(() => {
    if (!directorRoles || !Array.isArray(directorRoles)) return [];
    return directorRoles.map(role => ({
      value: role.id,
      label: role.name,
    }));
  }, [directorRoles]);

  const ownerRoleOptions = useMemo(() => {
    if (!ownerRoles || !Array.isArray(ownerRoles)) return [];
    return ownerRoles.map(role => ({
      value: role.id,
      label: role.name,
    }));
  }, [ownerRoles]);

  const otherOwners = useMemo(() => {
    return allOwners.filter((owner) => owner.owner_uuid !== formData.owner_uuid);
  }, [allOwners, formData.owner_uuid]);

  const otherOwnersTotalPercentage = useMemo(() => {
    return otherOwners.reduce(
      (sum, owner) => sum + (parseFloat(owner.ownership_percentage) || 0),
      0
    );
  }, [otherOwners]);

  const maxAllowedPercentage = useMemo(() => {
    return Math.max(0, 100 - otherOwnersTotalPercentage);
  }, [otherOwnersTotalPercentage]);

  const [percentageError, setPercentageError] = useState('');

  useEffect(() => {
    const currentPct = parseFloat(formData.ownership_percentage) || 0;
    const total = currentPct + otherOwnersTotalPercentage;
    if (total > 100) {
      setPercentageError(
        `Total ownership would be ${total.toFixed(2)}%. Other owners hold ${otherOwnersTotalPercentage.toFixed(
          2
        )}%, so this owner can have at most ${maxAllowedPercentage.toFixed(2)}%.`
      );
    } else {
      setPercentageError('');
    }
  }, [formData.ownership_percentage, otherOwnersTotalPercentage, maxAllowedPercentage]);

  // ===================== RENDER =====================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RingLoader size={60} color="#3B82F6" />
          <p className="mt-4 text-gray-600">Loading owner information...</p>
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
          <h1 className="text-2xl font-bold text-gray-800">Edit Owner</h1>
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
              Owner Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                id="owner_first_name"
                label="First Name"
                name="owner_first_name"
                value={formData.owner_first_name}
                onChange={handleChange('owner_first_name')}
                onBlur={() => setTouched(prev => ({ ...prev, owner_first_name: true }))}
                touched={touched.owner_first_name}
                error={errors.owner_first_name}
                required={true}
                placeholder="Enter first name"
              />
              <FormField
                id="owner_middle_name"
                label="Middle Name (Optional)"
                name="owner_middle_name"
                value={formData.owner_middle_name}
                onChange={handleChange('owner_middle_name')}
                onBlur={() => setTouched(prev => ({ ...prev, owner_middle_name: true }))}
                touched={touched.owner_middle_name}
                error={errors.owner_middle_name}
                placeholder="Enter middle name"
              />
              <FormField
                id="owner_last_name"
                label="Last Name"
                name="owner_last_name"
                value={formData.owner_last_name}
                onChange={handleChange('owner_last_name')}
                onBlur={() => setTouched(prev => ({ ...prev, owner_last_name: true }))}
                touched={touched.owner_last_name}
                error={errors.owner_last_name}
                required={true}
                placeholder="Enter last name"
              />
              <FormField
                id="owner_email"
                label="Email Address"
                name="owner_email"
                type="email"
                value={formData.owner_email}
                onChange={handleChange('owner_email')}
                onBlur={() => setTouched(prev => ({ ...prev, owner_email: true }))}
                touched={touched.owner_email}
                error={errors.owner_email}
                required={true}
                placeholder="Enter email address"
              />
            </div>

            {/* Phone Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <CustomSelect
                  id="owner_phone_number_country_code"
                  label="Country Code"
                  options={countryOptions}
                  value={countryOptions.find(opt =>
                    opt.phoneCode === formData.owner_phone_number_country_code
                  )}
                  onChange={(option) => {
                    if (option) {
                      setFormData(prev => ({
                        ...prev,
                        owner_phone_number_country_code: option.phoneCode || ''
                      }));
                      setTouched(prev => ({ ...prev, owner_phone_number_country_code: true }));
                    }
                  }}
                  touched={touched.owner_phone_number_country_code}
                  error={errors.owner_phone_number_country_code}
                  required={true}
                  isLoading={countriesLoading}
                  placeholder="Select code"
                  isCountryField={true}
                  showPhoneCode={true}
                />
              </div>
              <FormField
                id="owner_phone_number"
                label="Phone Number"
                name="owner_phone_number"
                value={formData.owner_phone_number}
                onChange={handleChange('owner_phone_number')}
                onBlur={() => setTouched(prev => ({ ...prev, owner_phone_number: true }))}
                touched={touched.owner_phone_number}
                error={errors.owner_phone_number}
                required={true}
                placeholder="Enter phone number"
              />
            </div>

            {/* Date of Birth & Resident Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                id="owner_dob"
                label="Date of Birth"
                name="owner_dob"
                type="date"
                value={formData.owner_dob}
                onChange={handleChange('owner_dob')}
                onBlur={() => setTouched(prev => ({ ...prev, owner_dob: true }))}
                touched={touched.owner_dob}
                error={errors.owner_dob}
                required={true}
              />
              <CustomSelect
                id="owner_resident_country"
                label="Resident Country"
                options={countryOptions}
                value={countryOptions.find(opt => opt.value === formData.owner_resident_country)}
                onChange={handleSelectChange('owner_resident_country')}
                touched={touched.owner_resident_country}
                error={errors.owner_resident_country}
                required={true}
                isLoading={countriesLoading}
                isCountryField={true}
                placeholder="Select resident country"
              />
            </div>

            {/* Nationality & Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomSelect
                id="owner_nationality"
                label="Nationality"
                options={nationalityOptions}
                value={nationalityOptions.find(opt => opt.value === formData.owner_nationality)}
                onChange={handleSelectChange('owner_nationality')}
                touched={touched.owner_nationality}
                error={errors.owner_nationality}
                required={true}
                placeholder="Select nationality"
              />
              <CustomSelect
                id="owner_gender"
                label="Gender"
                options={genderOptions}
                value={genderOptions.find(opt => opt.value === formData.owner_gender)}
                onChange={handleSelectChange('owner_gender')}
                touched={touched.owner_gender}
                error={errors.owner_gender}
                required={true}
                placeholder="Select gender"
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

            {/* Address Information */}
            <div className="mt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomSelect
                    id="owner_country_id"
                    label="Country"
                    options={countryOptions}
                    value={countryOptions.find(opt => opt.value === formData.owner_country_id)}
                    onChange={(option) => {
                      if (option) {
                        setFormData(prev => ({
                          ...prev,
                          owner_country_id: option.value,
                          owner_state: ''
                        }));
                        setTouched(prev => ({ ...prev, owner_country_id: true }));
                      }
                    }}
                    touched={touched.owner_country_id}
                    error={errors.owner_country_id}
                    required={true}
                    isLoading={countriesLoading}
                    isCountryField={true}
                    placeholder="Select country"
                  />
                  <div className="space-y-2">
                    <label htmlFor="owner_state" className="block text-sm font-medium text-gray-700">
                      State/Province <span className="text-red-500">*</span>
                    </label>
                    {stateOptions && stateOptions.length > 0 ? (
                      <Select
                        id="owner_state"
                        name="owner_state"
                        options={stateOptions}
                        value={stateOptions.find(opt => opt.value === formData.owner_state)}
                        onChange={(option) => {
                          if (option) {
                            setFormData(prev => ({ ...prev, owner_state: option.label }));
                            setTouched(prev => ({ ...prev, owner_state: true }));
                          } else {
                            setFormData(prev => ({ ...prev, owner_state: "" }));
                            setTouched(prev => ({ ...prev, owner_state: true }));
                          }
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, owner_state: true }))}
                        isDisabled={!formData.owner_country_id}
                        isLoading={statesLoading}
                        placeholder={!formData.owner_country_id ? "Please select a country first" : statesLoading ? "Loading states..." : "Select state/province..."}
                        isClearable={true}
                        styles={{
                          control: (base, state) => ({
                            ...base,
                            minHeight: "50px",
                            borderColor: touched.owner_state && errors.owner_state ? "#ef4444" : "#d1d5db",
                            borderRadius: "0.5rem",
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.875rem",
                            backgroundColor: !formData.owner_country_id ? "#f3f4f6" : "white",
                            opacity: !formData.owner_country_id ? 0.6 : 1,
                            "&:hover": {
                              borderColor: touched.owner_state && errors.owner_state ? "#ef4444" : "#9ca3af",
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
                        id="owner_state"
                        name="owner_state"
                        value={formData.owner_state || ""}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, owner_state: e.target.value }));
                          setTouched(prev => ({ ...prev, owner_state: true }));
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, owner_state: true }))}
                        disabled={!formData.owner_country_id}
                        placeholder={!formData.owner_country_id ? "Please select a country first" : statesLoading ? "Loading states..." : "Enter state/province..."}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 
                          ${!formData.owner_country_id ? "bg-gray-100 opacity-60 cursor-not-allowed" : ""}
                          ${touched.owner_state && errors.owner_state ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                      />
                    )}
                    {touched.owner_state && errors.owner_state && (
                      <div className="text-red-500 text-xs mt-1 flex items-center">
                        <FaInfoCircle className="mr-1 w-3 h-3" />
                        {errors.owner_state}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="owner_city"
                    label="City"
                    name="owner_city"
                    value={formData.owner_city}
                    onChange={handleChange('owner_city')}
                    onBlur={() => setTouched(prev => ({ ...prev, owner_city: true }))}
                    touched={touched.owner_city}
                    error={errors.owner_city}
                    required={true}
                    placeholder="Enter city"
                  />
                  <FormField
                    id="owner_zip_code"
                    label="ZIP/Postal Code"
                    name="owner_zip_code"
                    value={formData.owner_zip_code}
                    onChange={handleChange('owner_zip_code')}
                    onBlur={() => setTouched(prev => ({ ...prev, owner_zip_code: true }))}
                    touched={touched.owner_zip_code}
                    error={errors.owner_zip_code}
                    required={true}
                    placeholder="Enter ZIP/Postal code"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="owner_street_address_1"
                    label="Street Address 1"
                    name="owner_street_address_1"
                    value={formData.owner_street_address_1}
                    onChange={handleChange('owner_street_address_1')}
                    onBlur={() => setTouched(prev => ({ ...prev, owner_street_address_1: true }))}
                    touched={touched.owner_street_address_1}
                    error={errors.owner_street_address_1}
                    required={true}
                    placeholder="Enter street address"
                  />
                  <FormField
                    id="owner_street_address_2"
                    label="Street Address 2 (Optional)"
                    name="owner_street_address_2"
                    value={formData.owner_street_address_2}
                    onChange={handleChange('owner_street_address_2')}
                    onBlur={() => setTouched(prev => ({ ...prev, owner_street_address_2: true }))}
                    touched={touched.owner_street_address_2}
                    error={errors.owner_street_address_2}
                    placeholder="Enter suite or apartment number"
                  />
                </div>
              </div>
            </div>

            {/* ID Documents */}
            <div className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomSelect
                  id="owner_doc_type"
                  label="ID Document Type"
                  options={idDocumentTypeOptions}
                  value={idDocumentTypeOptions.find(opt => opt.value === formData.owner_doc_type)}
                  onChange={handleSelectChange('owner_doc_type')}
                  touched={touched.owner_doc_type}
                  error={errors.owner_doc_type}
                  required={true}
                  placeholder="Select document type"
                />
                <FormField
                  id="owner_doc_id"
                  label="ID Document Number"
                  name="owner_doc_id"
                  value={formData.owner_doc_id}
                  onChange={handleChange('owner_doc_id')}
                  onBlur={() => setTouched(prev => ({ ...prev, owner_doc_id: true }))}
                  touched={touched.owner_doc_id}
                  error={errors.owner_doc_id}
                  required={true}
                  placeholder="Enter document number"
                />
                <CustomSelect
                  id="owner_doc_country"
                  label="ID Issuing Country"
                  options={countryOptions}
                  value={countryOptions.find(opt => opt.value === formData.owner_doc_country)}
                  onChange={handleSelectChange('owner_doc_country')}
                  touched={touched.owner_doc_country}
                  error={errors.owner_doc_country}
                  required={true}
                  isLoading={countriesLoading}
                  isCountryField={true}
                  placeholder="Select issuing country"
                />
                <FormField
                  id="owner_id_issuing_state"
                  label="ID Issuing State"
                  name="owner_id_issuing_state"
                  value={formData.owner_id_issuing_state}
                  onChange={handleChange('owner_id_issuing_state')}
                  onBlur={() => setTouched(prev => ({ ...prev, owner_id_issuing_state: true }))}
                  touched={touched.owner_id_issuing_state}
                  error={errors.owner_id_issuing_state}
                  required={false}
                  placeholder="Enter issuing state"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <YesNoToggle
                label="Responsible Person is an Owner"
                value={formData.is_responsible_person_owner}
                onChange={handleYesNoChange('is_responsible_person_owner')}
                required
              />
              <YesNoToggle
                label="Grant System Access"
                value={formData.needs_access_to_system}
                onChange={handleYesNoChange('needs_access_to_system')}
                required
              />
            </div>

            {formData.needs_access_to_system === '1' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomSelect
                  id="owner_role_id"
                  label="Owner Role"
                  options={ownerRoleOptions}
                  value={ownerRoleOptions.find(opt => opt.value === formData.owner_role_id)}
                  onChange={handleSelectChange('owner_role_id')}
                  touched={touched.owner_role_id}
                  error={errors.owner_role_id}
                  required={true}
                  placeholder="Select owner role"
                />
              </div>
            )}

            {/* Designation, Director Role & Responsible Person */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                id="owner_designation"
                label="Designation"
                name="owner_designation"
                value={formData.owner_designation}
                onChange={handleChange('owner_designation')}
                onBlur={() => setTouched(prev => ({ ...prev, owner_designation: true }))}
                touched={touched.owner_designation}
                error={errors.owner_designation}
                required={true}
                placeholder="Enter designation"
              />
              <CustomSelect
                id="director_role_id"
                label="Director Role"
                options={directorRoleOptions}
                value={directorRoleOptions.find(opt => opt.value === formData.director_role_id)}
                onChange={handleSelectChange('director_role_id')}
                touched={touched.director_role_id}
                error={errors.director_role_id}
                isLoading={directorRolesLoading}
                placeholder="Select director role"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormField
                  id="ownership_percentage"
                  label="Ownership Percentage"
                  name="ownership_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.ownership_percentage}
                  onChange={handleChange('ownership_percentage')}
                  onBlur={() => setTouched(prev => ({ ...prev, ownership_percentage: true }))}
                  touched={touched.ownership_percentage}
                  error={errors.ownership_percentage}
                  required={true}
                  placeholder="e.g., 25.50"
                />

                {percentageError && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <FaInfoCircle className="mr-1 w-3 h-3" />
                    {percentageError}
                  </p>
                )}

                {otherOwners.length > 0 && (
                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-1.5">
                    <p className="font-medium text-gray-700 mb-1">Other owners on this account:</p>
                    {otherOwners.map((owner) => (
                      <div key={owner.owner_uuid} className="flex justify-between items-center gap-2">
                        <span className="truncate">
                          {owner.name || `${owner.first_name} ${owner.last_name}`} :
                          {owner.mobile_number
                            ? ` · ${owner.mobile_number_country_code || ''} ${owner.mobile_number}`
                            : ''}
                        </span>
                        <span className="font-medium text-gray-800 whitespace-nowrap">
                          {owner.ownership_percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
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
                disabled={saving || !!percentageError}
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

export default EditOwner; 