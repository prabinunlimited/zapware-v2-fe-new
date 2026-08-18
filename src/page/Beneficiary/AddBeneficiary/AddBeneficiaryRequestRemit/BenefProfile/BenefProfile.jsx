// /src/page/Beneficiary/AddBeneficiary/AddBeneficiaryRequestRemit/BeneficiaryProfile/BeneficiaryProfile.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ClipLoader } from "react-spinners";
import { FiUser } from "react-icons/fi";
import { FaArrowLeft } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import Select from "react-select";
import {
    fetchCountries,
    fetchStatesByCountry,
    selectCountriesOptions,
    selectCountriesLoading,
    selectStates,
    selectStatesLoading,
    getCountryById,
} from "../../../../../features/Auth/slices/countrySlice";

const API_URL = import.meta.env.VITE_API_URL;

// Custom Select Styles
const customStyles = {
    control: (provided, state) => ({
        ...provided,
        backgroundColor: "white",
        border: state.isFocused ? "2px solid #3B82F6" : "2px solid #E5E7EB",
        borderRadius: "0.75rem",
        padding: "1px 6px",
        fontSize: "0.875rem",
        color: "#111827",
        boxShadow: "none",
        minHeight: "44px",
        transition: "all 0.2s ease",
        "&:hover": {
            borderColor: "#9CA3AF",
        },
    }),
    menu: (provided) => ({
        ...provided,
        borderRadius: "0.75rem",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        marginTop: "4px",
        zIndex: 50,
    }),
    placeholder: (provided) => ({
        ...provided,
        color: "#9CA3AF",
        fontSize: "0.875rem",
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected
            ? "#3B82F6"
            : state.isFocused
                ? "#F3F4F6"
                : "white",
        color: state.isSelected ? "white" : "#111827",
        padding: "8px 14px",
        cursor: "pointer",
        fontSize: "0.875rem",
        "&:active": {
            backgroundColor: "#3B82F6",
            color: "white",
        },
    }),
};

function BeneficiaryProfile() {
    const [beneficiary, setBeneficiary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [locationData, setLocationData] = useState({
        countries: [],
        states: [],
        cities: [],
        nationalities: [],
    });
    const [activeBankIndex, setActiveBankIndex] = useState(0);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Delete Bank Modal States
    const [showDeleteBankModal, setShowDeleteBankModal] = useState(false);
    const [bankIdToDelete, setBankIdToDelete] = useState(null);
    const [isDeletingBank, setIsDeletingBank] = useState(false);

    // Redux
    const dispatch = useDispatch();
    const countriesOptions = useSelector(selectCountriesOptions);
    const countriesLoading = useSelector(selectCountriesLoading);
    const states = useSelector(selectStates);
    const statesLoading = useSelector(selectStatesLoading);
    const [hasFetchedStates, setHasFetchedStates] = useState(false);
    const [hasFetchedCities, setHasFetchedCities] = useState(false);

    // City states (local since we don't have a Redux slice for cities)
    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [hasCities, setHasCities] = useState(false);

    // Email verification states
    const [resendEmailLoading, setResendEmailLoading] = useState(false);
    const [emailVerificationLoading, setEmailVerificationLoading] = useState(false);
    const [showEmailPopup, setShowEmailPopup] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [passcode, setPasscode] = useState("");

    // Phone Verification States
    const [resendPhoneLoading, setResendPhoneLoading] = useState(false);
    const [phoneVerificationLoading, setPhoneVerificationLoading] = useState(false);
    const [showPhonePopup, setShowPhonePopup] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [phoneOTP, setPhoneOTP] = useState("");

    const navigate = useNavigate();
    const beneficiaryId = localStorage.getItem("beneficaryId");

    const bankTabsRef = useRef(null);
    const handleTabClick = (index, event) => {
        setActiveBankIndex(index);
        if (event?.currentTarget) {
            event.currentTarget.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center", // Automatically scrolls left or right to center the clicked tab
            });
        }
    };

    // Refs for partner ID
    const whiteLabelledPartnerIdRef = useRef(null);
    const [whiteLabelledPartnerId, setWhiteLabelledPartnerId] = useState(null);
    const isMountedRef = useRef(true);
    const countriesFetchedRef = useRef(false);

    // Fetch countries on mount using Redux
    useEffect(() => {
        if (!countriesFetchedRef.current && !countriesLoading) {
            dispatch(fetchCountries());
            countriesFetchedRef.current = true;
        }
    }, [dispatch, countriesLoading]);

    useEffect(() => {
        fetchBeneficiaryData();
        fetchLocationData();
        whiteLabelledPartnerIdRef.current = "32";
        setWhiteLabelledPartnerId("32");
    }, []);

    useEffect(() => {
        if (beneficiary && !formData) {
            initializeFormData();
            // If beneficiary has country_id, fetch its states
            if (beneficiary.country_id) {
                dispatch(fetchStatesByCountry(beneficiary.country_id));
                // If beneficiary has state, fetch its cities
                if (beneficiary.state) {
                    fetchCities(beneficiary.state);
                }
            }
        }
    }, [beneficiary]);

    // Fetch cities based on state ID
    const fetchCities = useCallback(
        async (stateId) => {
            if (!stateId || !isMountedRef.current) return;

            setLoadingCities(true);
            setHasCities(false);
            try {
                const authtoken = localStorage.getItem("authtoken");
                if (!authtoken) {
                    throw new Error("Authentication token not found");
                }

                const response = await fetch(`${API_URL}/state-cities/${stateId}`, {
                    headers: {
                        Authorization: `Bearer ${authtoken}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (result.status === "success" && isMountedRef.current) {
                    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                        setCities(result.data);
                        setHasCities(true);
                    } else {
                        setCities([]);
                        setHasCities(false); // No cities found
                    }
                } else if (isMountedRef.current) {
                    setCities([]);
                    setHasCities(false);
                }
                setHasFetchedCities(true);
            } catch (error) {
                console.error("Error fetching cities:", error);
                if (isMountedRef.current) {
                    setCities([]);
                    setHasCities(false);
                    setHasFetchedCities(true);
                }
            } finally {
                if (isMountedRef.current) {
                    setLoadingCities(false);
                }
            }
        },
        [API_URL]
    );

    // Handle country change - fetch states
    const handleCountryChange = async (selectedOption) => {
        const countryId = selectedOption?.value || "";
        setFormData((prev) => ({
            ...prev,
            country_id: countryId,
            state: "",
            city: "",
        }));
        setCities([]);
        setHasCities(false);
        setHasFetchedStates(false);
        setHasFetchedCities(false);

        if (countryId) {
            await dispatch(fetchStatesByCountry(countryId));
            setHasFetchedStates(true);
        }
    };

    // Handle state change - fetch cities
    const handleStateChange = async (selectedOption) => {
        const stateId = selectedOption?.value || "";
        setFormData((prev) => ({
            ...prev,
            state: stateId,
            city: "",
        }));
        setCities([]);
        setHasCities(false);
        setHasFetchedCities(false);

        if (stateId) {
            await fetchCities(stateId);
            setHasFetchedCities(true);
        }
    };

    // Handle city change
    const handleCityChange = (selectedOption) => {
        const cityId = selectedOption?.value || "";
        setFormData((prev) => ({
            ...prev,
            city: cityId,
        }));
    };

    // Handle country phone code change
    const handlePhoneCodeChange = (selectedOption) => {
        const phoneCode = selectedOption?.value || "";
        setFormData((prev) => ({
            ...prev,
            country_phone_code: phoneCode,
        }));
    };

    // Fetch countries, states, cities, and nationalities data
    const fetchLocationData = async () => {
        try {
            const nationalitiesRes = await fetch(`${API_URL}/nationalities`).catch(
                () => ({ ok: false })
            );

            const nationalitiesData = nationalitiesRes.ok
                ? await nationalitiesRes.json()
                : { data: [] };

            setLocationData((prev) => ({
                ...prev,
                countries: countriesOptions,
                nationalities: nationalitiesData.data || nationalitiesData || [],
            }));
        } catch (err) {
            console.error("Error fetching location data:", err);
        }
    };

    // Helper function to get country name from Redux
    const getCountryName = (countryId) => {
        if (!countryId) return "Not provided";
        const country = getCountryById(parseInt(countryId));
        return country ? country.name : countryId;
    };

    // Helper function to get location names by ID
    const getLocationName = (id, type) => {
        if (!id) return "Not provided";

        const data = locationData[type];
        if (!data || !Array.isArray(data)) return id;

        const item = data.find(
            (item) =>
                item.id === parseInt(id) ||
                item.id === id ||
                item.country_id === parseInt(id) ||
                item.nationality_id === parseInt(id)
        );

        return item
            ? item.name ||
            item.country_name ||
            item.countryName ||
            item.text ||
            item.label
            : id;
    };

    const getNationalityName = (nationalityId) => {
        if (!nationalityId) return "Not provided";

        const nationalities = locationData.nationalities;
        if (!nationalities || !Array.isArray(nationalities)) {
            return nationalityId;
        }

        const nationality = nationalities.find(
            (item) =>
                item.id === parseInt(nationalityId) ||
                item.nationality_id === parseInt(nationalityId) ||
                item.country_id === parseInt(nationalityId)
        );

        if (nationality) {
            return (
                nationality.name ||
                nationality.nationality_name ||
                nationality.country_name ||
                nationalityId
            );
        }

        const country = getCountryById(parseInt(nationalityId));
        return country ? country.name : nationalityId;
    };

    // Delete Bank Modal Handlers
    const handleOpenDeleteModal = (bankId) => {
        setBankIdToDelete(bankId);
        setShowDeleteBankModal(true);
    };

    const handleCloseDeleteModal = () => {
        setShowDeleteBankModal(false);
        setBankIdToDelete(null);
    };

    const handleConfirmDeleteBank = async () => {
        if (!bankIdToDelete) return;

        setIsDeletingBank(true);
        try {
            const authtoken = localStorage.getItem("authtoken");
            const response = await fetch(
                `${API_URL}/beneficiaries/delete-benef-bank/${bankIdToDelete}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${authtoken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const result = await response.json();
            if (response.ok && (result.status === "success" || result.status === 200 || !result.error)) {
                toast.success(result.message || "Bank account deleted successfully!");
                await fetchBeneficiaryData();
                setActiveBankIndex(0);
                handleCloseDeleteModal();
            } else {
                toast.error(result.message || "Failed to delete bank account");
            }
        } catch (err) {
            console.error("Error deleting bank account:", err);
            toast.error("Error deleting bank account");
        } finally {
            setIsDeletingBank(false);
        }
    };

    // Email verification functions
    const handleSendEmailPasscode = async () => {
        if (!formData?.email) {
            toast.error("Please enter your email address first");
            return;
        }

        setResendEmailLoading(true);

        try {
            let currentPartnerId = whiteLabelledPartnerIdRef.current;

            if (!currentPartnerId || currentPartnerId === "0") {
                currentPartnerId = 9;
            }

            const token = await getBearerToken();
            const payload = {
                email: formData.email,
                user_type: "beneficiary",
                partner_id: currentPartnerId,
            };

            const response = await axios.post(
                `${API_URL}/send-passcode-registration`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.status === "success") {
                toast.success("Passcode sent to your email!");
                setShowEmailPopup(true);
            } else {
                toast.error(response.data.message || "Failed to send passcode");
            }
        } catch (error) {
            console.error("Error sending email passcode:", error);
            if (error.response?.status === 404) {
                toast.error(
                    "Service temporarily unavailable. Please try again later."
                );
            } else if (error.response?.data?.message?.includes("partner_id")) {
                toast.error("System configuration error. Please contact support.");
            } else {
                toast.error(
                    error.response?.data?.message || "Failed to send passcode"
                );
            }
        } finally {
            setResendEmailLoading(false);
        }
    };

    const handleVerifyEmailPasscode = async (passcode) => {
        if (!passcode) {
            toast.error("Please enter the passcode");
            return;
        }

        setEmailVerificationLoading(true);
        try {
            const token = await getBearerToken();
            const response = await axios.post(
                `${API_URL}/validate-passcode-registration`,
                {
                    email: formData.email,
                    passcode: passcode,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.status === "success") {
                setEmailVerified(true);
                setShowEmailPopup(false);
                toast.success("Email verified successfully!");
                await saveBeneficiaryChanges();
            } else {
                toast.error(response.data.message || "Invalid passcode");
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error("Error verifying email passcode:", error);
            toast.error(
                error.response?.data?.message || "Failed to verify passcode"
            );
            setIsSubmitting(false);
        } finally {
            setEmailVerificationLoading(false);
        }
    };

    const handleSendPhoneOTP = async () => {
        if (!formData?.phone_number || !formData?.country_phone_code) {
            toast.error("Phone number and country code are required");
            return;
        }

        setResendPhoneLoading(true);

        try {
            let currentPartnerId = whiteLabelledPartnerIdRef.current;

            if (!currentPartnerId || currentPartnerId === "0") {
                toast.error(
                    "System configuration issue. Please try again or contact support."
                );
                setResendPhoneLoading(false);
                return;
            }

            const token = await getBearerToken();
            const payload = {
                country_code: formData.country_phone_code,
                mobile_number: formData.phone_number,
                user_type: "beneficiary",
                partner_id: currentPartnerId,
            };

            const response = await axios.post(
                `${API_URL}/send-otp-registration`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.status === "success") {
                toast.success("OTP sent to your phone!");
                setShowPhonePopup(true);
            } else {
                toast.error(response.data.message || "Failed to send OTP");
            }
        } catch (error) {
            console.error("Error sending phone OTP:", error);
            toast.error(error.response?.data?.message || "Failed to send OTP");
        } finally {
            setResendPhoneLoading(false);
        }
    };

    const handleVerifyPhoneOTP = async (otp) => {
        if (!otp) {
            toast.error("Please enter the OTP");
            return;
        }

        setPhoneVerificationLoading(true);
        try {
            const token = await getBearerToken();
            const response = await axios.post(
                `${API_URL}/validate-otp-registration`,
                {
                    country_code: formData.country_phone_code,
                    mobile_number: formData.phone_number,
                    otp: otp,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.status === "success") {
                setPhoneVerified(true);
                setShowPhonePopup(false);

                if (response.data.data?.verification_token) {
                    localStorage.setItem(
                        "phone_verification_token",
                        response.data.data.verification_token
                    );
                }

                toast.success("Phone number verified successfully!");
                await saveBeneficiaryChanges();
            } else {
                toast.error(response.data.message || "Invalid OTP");
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error("Error verifying phone OTP:", error);
            toast.error(error.response?.data?.message || "Failed to verify OTP");
            setIsSubmitting(false);
        } finally {
            setPhoneVerificationLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        const isEmailChanged = formData.email !== beneficiary.email;
        const isPhoneChanged =
            formData.phone_number !== beneficiary.phone_number ||
            formData.country_phone_code !== beneficiary.country_phone_code;

        if (isEmailChanged && isPhoneChanged) {
            await handleSendEmailPasscode();
        } else if (isEmailChanged) {
            await handleSendEmailPasscode();
        } else if (isPhoneChanged) {
            if (formData.email && formData.email !== beneficiary.email) {
                await handleSendEmailPasscode();
            } else {
                await handleSendPhoneOTP();
            }
        } else {
            await saveBeneficiaryChanges();
        }
    };

    const saveBeneficiaryChanges = async () => {
        try {
            const payload = {
                beneficiary_id: beneficiaryId,
                first_name: formData.first_name,
                middle_name: formData.middle_name,
                last_name: formData.last_name,
                email: formData.email,
                country_phone_code: formData.country_phone_code,
                phone_number: formData.phone_number,
                country_id: formData.country_id,
                state: formData.state,
                city: formData.city,
                street: formData.street,
                postalcode: formData.postalcode,
                nationality_id: formData.nationality_id,
                gender: formData.gender,
                beneftype: formData.beneftype,
                partner_id: whiteLabelledPartnerIdRef.current,
                banks: formData.banks,
            };

            const response = await fetch(
                `${API_URL}/beneficiaries/update-requestremit-benef`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("bearertoken")}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to update beneficiary");
            }

            if (result.status === "success") {
                setSubmitSuccess(true);
                setIsEditMode(false);
                setEmailVerified(false);
                setPhoneVerified(false);
                setShowEmailPopup(false);
                setShowPhonePopup(false);
                localStorage.removeItem("phone_verification_token");
                await fetchBeneficiaryData();
                setTimeout(() => setSubmitSuccess(false), 3000);
            } else {
                throw new Error(result.message || "Update failed");
            }
        } catch (err) {
            setSubmitError(err.message);
            console.error("Error updating beneficiary:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getBearerToken = async () => {
        return localStorage.getItem("bearertoken");
    };

    const fetchBeneficiaryData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!beneficiaryId) {
                throw new Error(
                    "Beneficiary ID not found. Please select a beneficiary first."
                );
            }

            const authtoken = localStorage.getItem("authtoken");

            if (!authtoken) {
                throw new Error("Authentication token not found. Please log in again.");
            }

            const response = await fetch(
                `${API_URL}/beneficiaries/fetch-merchant-benef/${beneficiaryId}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authtoken}`,
                    },
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Authentication failed. Please log in again.");
                }
                if (response.status === 404) {
                    throw new Error("Beneficiary not found. Please check the ID.");
                }
                throw new Error(
                    `Failed to fetch beneficiary data: ${response.status} ${response.statusText}`
                );
            }

            const data = await response.json();

            if (data.data) {
                setBeneficiary(data.data);
            } else {
                throw new Error(data.message || "No beneficiary data found");
            }
        } catch (err) {
            setError(err.message);
            console.error("Error fetching beneficiary:", err);
        } finally {
            setLoading(false);
        }
    };

    const initializeFormData = () => {
        if (!beneficiary) return;

        setFormData({
            beneficiary_id: beneficiaryId,
            beneftype: beneficiary.beneftype || "individual",
            first_name: beneficiary.first_name || "",
            middle_name: beneficiary.middle_name || "",
            last_name: beneficiary.last_name || "",
            gender: beneficiary.gender?.toString() || "1",
            email: beneficiary.email || "",
            country_id: beneficiary.country_id?.toString() || "",
            country_phone_code: beneficiary.country_phone_code || "+977",
            phone_number: beneficiary.phone_number || "",
            state: beneficiary.state || "",
            city: beneficiary.city || "",
            street: beneficiary.street || "",
            postalcode: beneficiary.postalcode || "",
            nationality_id: beneficiary.nationality_id?.toString() || "",
            banks: beneficiary.benef_banks?.map((bank) => ({
                rails: bank.rails || "local",
                currency_code: bank.currency_code || "",
                bank_name: bank.bank_name || "",
                bank_acc_no: bank.bank_acc_no || "",
            })) || [
                    {
                        rails: "local",
                        currency_code: "",
                        bank_name: "",
                        bank_acc_no: "",
                    },
                ],
        });
    };

    const handleEditToggle = () => {
        if (isEditMode) {
            initializeFormData();
            setEmailVerified(false);
            setPhoneVerified(false);
            setShowEmailPopup(false);
            setShowPhonePopup(false);
            localStorage.removeItem("phone_verification_token");
        }
        setIsEditMode(!isEditMode);
        setSubmitError(null);
        setSubmitSuccess(false);
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleBankChange = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            banks: prev.banks.map((bank, i) =>
                i === index ? { ...bank, [field]: value } : bank
            ),
        }));
    };

    const handleRefresh = () => {
        navigate(`/benefhome/${beneficiaryId}`);
    };

    const handleRetry = () => {
        setError(null);
        setLoading(true);
        fetchBeneficiaryData();
    };

    // InfoField Component
    const InfoField = ({ label, value, type = "text" }) => {
        const formatValue = (val, valueType) => {
            if (!val || val === "Not provided") {
                return <span className="text-gray-400 italic">Not provided</span>;
            }

            switch (valueType) {
                case "account":
                    return (
                        <span className="font-mono bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-800 text-xs sm:text-sm break-all">
                            {val}
                        </span>
                    );
                case "code":
                    return (
                        <span className="font-mono bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-800 text-xs sm:text-sm">
                            {val}
                        </span>
                    );
                default:
                    return <span className="text-gray-900 text-sm">{val}</span>;
            }
        };

        return (
            <div>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <div className="text-gray-900 font-medium min-h-8 flex items-center">
                    {formatValue(value, type)}
                </div>
            </div>
        );
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <ClipLoader size={50} color="#00254d" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                            className="w-8 h-8 sm:w-10 sm:h-10 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                        Unable to Load Profile
                    </h2>
                    <p className="text-gray-600 text-sm mb-6">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={handleRetry}
                            className="w-full bg-blue-600 text-white px-6 py-2.5 sm:py-3 rounded-xl hover:bg-blue-700 transition-all font-semibold flex items-center justify-center space-x-2 text-xs sm:text-sm cursor-pointer shadow-2xs"
                        >
                            <span>Try Again</span>
                        </button>
                        <button
                            onClick={handleRefresh}
                            className="w-full bg-gray-100 text-gray-700 px-6 py-2.5 sm:py-3 rounded-xl hover:bg-gray-200 transition-all font-semibold flex items-center justify-center space-x-2 text-xs sm:text-sm cursor-pointer"
                        >
                            <FaArrowLeft className="w-3.5 h-3.5" />
                            <span>Back to Dashboard</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-6 lg:py-8">
            {/* Delete Bank Confirmation Modal */}
            {showDeleteBankModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 w-full max-w-sm sm:max-w-md animate-in fade-in zoom-in duration-200 text-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
                            <svg
                                className="w-7 h-7 sm:w-8 sm:h-8 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </div>

                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1.5">
                            Delete Bank Account
                        </h3>
                        <p className="text-gray-600 text-xs sm:text-sm mb-6 leading-relaxed">
                            Are you sure you want to delete this bank account? This action cannot be undone.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <button
                                type="button"
                                onClick={handleCloseDeleteModal}
                                disabled={isDeletingBank}
                                className="w-full sm:flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-xs sm:text-sm cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDeleteBank}
                                disabled={isDeletingBank}
                                className="w-full sm:flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-xl hover:bg-red-700 transition-colors text-xs sm:text-sm flex items-center justify-center cursor-pointer shadow-xs"
                            >
                                {isDeletingBank ? (
                                    <ClipLoader size={16} color="#ffffff" />
                                ) : (
                                    "Yes, Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Verification Popup Modal */}
            {showEmailPopup && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 w-full max-w-sm sm:max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="text-center">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1.5">
                                Verify Your Email
                            </h3>
                            <p className="text-gray-600 text-xs sm:text-sm mb-4 leading-relaxed">
                                We've sent a 6-digit passcode to{" "}
                                <strong className="text-gray-900 break-all">{formData?.email}</strong>. Please enter it below to
                                verify your email address and save your changes.
                            </p>

                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={passcode}
                                    onChange={(e) => setPasscode(e.target.value)}
                                    placeholder="Enter 6-digit passcode"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    maxLength={6}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2.5">
                                <button
                                    onClick={() => {
                                        setShowEmailPopup(false);
                                        setPasscode("");
                                    }}
                                    className="w-full sm:flex-1 bg-gray-100 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-xs sm:text-sm cursor-pointer"
                                    disabled={emailVerificationLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleVerifyEmailPasscode(passcode)}
                                    disabled={emailVerificationLoading || !passcode}
                                    className="w-full sm:flex-1 bg-blue-600 text-white font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-xs sm:text-sm flex items-center justify-center cursor-pointer shadow-2xs"
                                >
                                    {emailVerificationLoading ? (
                                        <ClipLoader size={18} color="#ffffff" />
                                    ) : (
                                        "Verify & Save"
                                    )}
                                </button>
                            </div>

                            <div className="mt-4">
                                <button
                                    onClick={handleSendEmailPasscode}
                                    disabled={resendEmailLoading}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer"
                                >
                                    {resendEmailLoading ? "Sending..." : "Resend Passcode"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Phone Verification Popup Modal */}
            {showPhonePopup && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 w-full max-w-sm sm:max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="text-center">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-7 h-7 sm:w-8 sm:h-8 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1.5">
                                Verify Your Phone
                            </h3>
                            <p className="text-gray-600 text-xs sm:text-sm mb-4 leading-relaxed">
                                We've sent an OTP to{" "}
                                <strong className="text-gray-900">
                                    {formData?.country_phone_code} {formData?.phone_number}
                                </strong>
                            </p>

                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={phoneOTP}
                                    onChange={(e) => setPhoneOTP(e.target.value)}
                                    placeholder="Enter OTP"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2.5">
                                <button
                                    onClick={() => {
                                        setShowPhonePopup(false);
                                        setPhoneOTP("");
                                    }}
                                    className="w-full sm:flex-1 bg-gray-100 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-xs sm:text-sm cursor-pointer"
                                    disabled={phoneVerificationLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleVerifyPhoneOTP(phoneOTP)}
                                    disabled={phoneVerificationLoading || !phoneOTP}
                                    className="w-full sm:flex-1 bg-blue-600 text-white font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-xs sm:text-sm flex items-center justify-center cursor-pointer shadow-2xs"
                                >
                                    {phoneVerificationLoading ? (
                                        <ClipLoader size={18} color="#ffffff" />
                                    ) : (
                                        "Verify & Save"
                                    )}
                                </button>
                            </div>

                            <div className="mt-4">
                                <button
                                    onClick={handleSendPhoneOTP}
                                    disabled={resendPhoneLoading}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer"
                                >
                                    {resendPhoneLoading ? "Sending..." : "Resend OTP"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                {/* Status Messages */}
                {submitError && (
                    <div className="mb-4 p-3.5 sm:p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs sm:text-sm shadow-2xs">
                        {submitError}
                    </div>
                )}
                {submitSuccess && (
                    <div className="mb-4 p-3.5 sm:p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-xs sm:text-sm shadow-2xs">
                        Beneficiary updated successfully!
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full p-4 sm:p-6 lg:p-8 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 lg:gap-8">
                        {/* Main Content Area - 3 columns width */}
                        <div className="lg:col-span-3 space-y-5 sm:space-y-6">
                            {/* Profile Header Card */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-2xs">
                                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-2xs flex-shrink-0">
                                            <FiUser className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                                        </div>
                                        <div>
                                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                                                {formData?.last_name
                                                    ? `${formData.last_name}'s Profile`
                                                    : "Beneficiary Profile"}
                                            </h1>
                                            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                                                {isEditMode
                                                    ? "Edit beneficiary details and banking information"
                                                    : "View and manage beneficiary details and banking information"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-row w-full sm:w-auto items-center justify-center gap-2">
                                        <button
                                            onClick={handleEditToggle}
                                            className={`flex-1 sm:flex-none text-white text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl transition-all shadow-2xs cursor-pointer ${isEditMode
                                                ? "bg-red-600 hover:bg-red-700"
                                                : "bg-blue-600 hover:bg-blue-700"
                                                }`}
                                        >
                                            {isEditMode ? "Cancel Editing" : "Edit Profile"}
                                        </button>
                                        <button
                                            onClick={handleRefresh}
                                            className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold cursor-pointer shadow-2xs"
                                        >
                                            <FaArrowLeft className="w-3.5 h-3.5" />
                                            <span>Back</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-100 text-xs">
                                    <span className="text-gray-600 font-medium">Status:</span>
                                    <span
                                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${beneficiary.status === 1
                                            ? "bg-green-100 text-green-800 border border-green-200"
                                            : "bg-red-100 text-red-800 border border-red-200"
                                            }`}
                                    >
                                        {beneficiary.status === 1 ? "Active" : "Inactive"}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-500">
                                        Beneficiary Code:{" "}
                                        <span className="font-mono font-medium text-gray-800">
                                            {beneficiary.benef_code || "N/A"}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            {/* Personal Details Card */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-2xs">
                                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                                    Personal Details
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Name Fields */}
                                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {isEditMode ? (
                                            <>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">
                                                        First Name
                                                    </label>
                                                    <input
                                                        name="first_name"
                                                        value={formData?.first_name || ""}
                                                        onChange={(e) =>
                                                            handleInputChange("first_name", e.target.value)
                                                        }
                                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="First Name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">
                                                        Middle Name
                                                    </label>
                                                    <input
                                                        name="middle_name"
                                                        value={formData?.middle_name || ""}
                                                        onChange={(e) =>
                                                            handleInputChange("middle_name", e.target.value)
                                                        }
                                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Middle Name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">
                                                        Last Name
                                                    </label>
                                                    <input
                                                        name="last_name"
                                                        value={formData?.last_name || ""}
                                                        onChange={(e) =>
                                                            handleInputChange("last_name", e.target.value)
                                                        }
                                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Last Name"
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-0.5">
                                                        First Name
                                                    </label>
                                                    <span className="text-sm font-medium text-gray-800 block py-1">
                                                        {beneficiary.first_name || "Not Available"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-0.5">
                                                        Middle Name
                                                    </label>
                                                    <span className="text-sm font-medium text-gray-800 block py-1">
                                                        {beneficiary.middle_name || "Not Available"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-0.5">
                                                        Last Name
                                                    </label>
                                                    <span className="text-sm font-medium text-gray-800 block py-1">
                                                        {beneficiary.last_name || "Not Available"}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Contact Information */}
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                            Email Address
                                        </label>
                                        {isEditMode ? (
                                            <input
                                                name="email"
                                                value={formData?.email || ""}
                                                onChange={(e) =>
                                                    handleInputChange("email", e.target.value)
                                                }
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Email Address"
                                                type="email"
                                            />
                                        ) : (
                                            <span className="text-sm font-medium text-gray-800 block py-1 break-all">
                                                {beneficiary.email || "Not Available"}
                                            </span>
                                        )}
                                    </div>

                                    {/* Phone Number with Country Code Dropdown */}
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                            Phone Number
                                        </label>
                                        {isEditMode ? (
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <div className="w-full sm:w-36 flex-shrink-0">
                                                    <Select
                                                        className="text-xs sm:text-sm"
                                                        classNamePrefix="select"
                                                        options={countriesOptions.map((country) => ({
                                                            value: country.phoneCode,
                                                            label: `${country.phoneCode} ${country.label}`,
                                                        }))}
                                                        placeholder="Code"
                                                        isSearchable
                                                        onChange={handlePhoneCodeChange}
                                                        value={(() => {
                                                            const selectedCountry = countriesOptions.find(
                                                                (c) =>
                                                                    c.phoneCode === formData?.country_phone_code
                                                            );
                                                            return selectedCountry
                                                                ? {
                                                                    value: selectedCountry.phoneCode,
                                                                    label: `${selectedCountry.phoneCode} ${selectedCountry.label}`,
                                                                }
                                                                : null;
                                                        })()}
                                                        styles={customStyles}
                                                        isLoading={countriesLoading}
                                                    />
                                                </div>
                                                <input
                                                    name="phone_number"
                                                    value={formData?.phone_number || ""}
                                                    onChange={(e) =>
                                                        handleInputChange("phone_number", e.target.value)
                                                    }
                                                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Phone Number"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm font-medium text-gray-800 block py-1">
                                                {beneficiary.country_phone_code}{" "}
                                                {beneficiary.phone_number}
                                            </span>
                                        )}
                                    </div>

                                    {/* Gender and Beneficiary Type */}
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                            Gender
                                        </label>
                                        {isEditMode ? (
                                            <select
                                                name="gender"
                                                value={formData?.gender || ""}
                                                onChange={(e) =>
                                                    handleInputChange("gender", e.target.value)
                                                }
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            >
                                                <option value="">Select gender</option>
                                                <option value="1">Male</option>
                                                <option value="2">Female</option>
                                                <option value="3">Other</option>
                                            </select>
                                        ) : (
                                            <span className="text-sm font-medium text-gray-800 block py-1">
                                                {beneficiary.gender === "1"
                                                    ? "Male"
                                                    : beneficiary.gender === "2"
                                                        ? "Female"
                                                        : "Other"}
                                            </span>
                                        )}
                                    </div>

                                    {/* Nationality */}
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                            Nationality
                                        </label>
                                        {isEditMode ? (
                                            <select
                                                name="nationality_id"
                                                value={formData?.nationality_id || ""}
                                                onChange={(e) =>
                                                    handleInputChange("nationality_id", e.target.value)
                                                }
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            >
                                                <option value="">Select nationality</option>
                                                {locationData.nationalities.map((nationality) => (
                                                    <option key={nationality.id} value={nationality.id}>
                                                        {nationality.name || nationality.nationality_name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="text-sm font-medium text-gray-800 block py-1">
                                                {getNationalityName(beneficiary.nationality_id)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Address Information Card with Cascading Dropdowns */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-2xs">
                                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                                    Address Information
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {/* Country */}
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                            Country
                                        </label>
                                        {isEditMode ? (
                                            <Select
                                                className="text-xs sm:text-sm"
                                                classNamePrefix="select"
                                                options={countriesOptions}
                                                placeholder={
                                                    countriesLoading
                                                        ? "Loading countries..."
                                                        : "Select Country..."
                                                }
                                                isSearchable
                                                isLoading={countriesLoading}
                                                onChange={handleCountryChange}
                                                value={
                                                    countriesOptions.find(
                                                        (c) =>
                                                            c.value === parseInt(formData?.country_id) ||
                                                            c.id === parseInt(formData?.country_id)
                                                    ) || null
                                                }
                                                formatOptionLabel={(option) => (
                                                    <div className="flex items-center gap-2">
                                                        {option.flag_url && (
                                                            <img
                                                                src={option.flag_url}
                                                                alt={`${option.label} flag`}
                                                                className="w-4 h-3 rounded-xs object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = "none";
                                                                }}
                                                            />
                                                        )}
                                                        <span>{option.label}</span>
                                                    </div>
                                                )}
                                                styles={customStyles}
                                            />
                                        ) : (
                                            <span className="text-sm font-medium text-gray-800 block py-1">
                                                {getCountryName(beneficiary.country_id)}
                                            </span>
                                        )}
                                    </div>

                                    {/* State */}
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                            State/Province
                                        </label>
                                        {isEditMode ? (
                                            statesLoading ? (
                                                <div className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                                                    <ClipLoader size={16} color="#3B82F6" />
                                                    <span className="ml-2 text-gray-500 text-xs">
                                                        Loading states...
                                                    </span>
                                                </div>
                                            ) : states && states.length > 0 ? (
                                                <Select
                                                    className="text-xs sm:text-sm"
                                                    classNamePrefix="select"
                                                    options={states.map((state) => ({
                                                        value: state.id || state.name,
                                                        label: state.name,
                                                    }))}
                                                    placeholder="Select State..."
                                                    isSearchable
                                                    value={
                                                        formData?.state
                                                            ? {
                                                                value: formData.state,
                                                                label:
                                                                    states.find(
                                                                        (s) =>
                                                                            s.id === parseInt(formData.state) ||
                                                                            s.name === formData.state
                                                                    )?.name || formData.state,
                                                            }
                                                            : null
                                                    }
                                                    onChange={handleStateChange}
                                                    styles={customStyles}
                                                    isClearable
                                                />
                                            ) : hasFetchedStates && states?.length === 0 ? (
                                                <div>
                                                    <input
                                                        type="text"
                                                        name="state"
                                                        value={formData?.state || ""}
                                                        onChange={(e) =>
                                                            handleInputChange("state", e.target.value)
                                                        }
                                                        placeholder="Enter state/province"
                                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <p className="text-amber-600 text-xs mt-1.5 flex items-center gap-1.5 font-medium leading-none">
                                                        <span className="text-xs shrink-0 select-none">ℹ️</span>
                                                        <span>No states found for selected country. Please enter manually.</span>
                                                    </p>
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    name="state"
                                                    value={formData?.state || ""}
                                                    onChange={(e) =>
                                                        handleInputChange("state", e.target.value)
                                                    }
                                                    placeholder="Enter state/province"
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            )
                                        ) : (
                                            <span className="text-sm font-medium text-gray-800 block py-1">
                                                {getLocationName(beneficiary.state, "states")}
                                            </span>
                                        )}
                                    </div>

                                    {/* City */}
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                            City
                                        </label>
                                        {isEditMode ? (
                                            loadingCities ? (
                                                <div className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                                                    <ClipLoader size={16} color="#3B82F6" />
                                                    <span className="ml-2 text-gray-500 text-xs">
                                                        Loading cities...
                                                    </span>
                                                </div>
                                            ) : hasFetchedCities && cities && cities.length > 0 ? (
                                                <Select
                                                    className="text-xs sm:text-sm"
                                                    classNamePrefix="select"
                                                    options={cities.map((city) => ({
                                                        value: city.id || city.name,
                                                        label: city.name,
                                                    }))}
                                                    placeholder="Select City..."
                                                    isSearchable
                                                    value={
                                                        formData?.city
                                                            ? {
                                                                value: formData.city,
                                                                label:
                                                                    cities.find(
                                                                        (c) =>
                                                                            c.id === parseInt(formData.city) ||
                                                                            c.name === formData.city
                                                                    )?.name || formData.city,
                                                            }
                                                            : null
                                                    }
                                                    onChange={handleCityChange}
                                                    styles={customStyles}
                                                    isClearable
                                                />
                                            ) : hasFetchedCities &&
                                                (!cities || cities.length === 0) ? (
                                                <div>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        value={formData?.city || ""}
                                                        onChange={(e) =>
                                                            handleInputChange("city", e.target.value)
                                                        }
                                                        placeholder="Enter city"
                                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <p className="text-amber-600 text-xs mt-1.5 flex items-center gap-1.5 font-medium leading-none">
                                                        <span className="text-xs shrink-0 select-none">ℹ️</span>
                                                        <span>No cities found for selected state. Please enter manually.</span>
                                                    </p>
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formData?.city || ""}
                                                    onChange={(e) =>
                                                        handleInputChange("city", e.target.value)
                                                    }
                                                    placeholder="Enter city"
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            )
                                        ) : (
                                            <span className="text-sm font-medium text-gray-800 block py-1">
                                                {getLocationName(beneficiary.city, "cities")}
                                            </span>
                                        )}
                                    </div>

                                    {/* Street */}
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                            Street
                                        </label>
                                        {isEditMode ? (
                                            <input
                                                name="street"
                                                value={formData?.street || ""}
                                                onChange={(e) =>
                                                    handleInputChange("street", e.target.value)
                                                }
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Street Address"
                                            />
                                        ) : (
                                            <span className="text-sm font-medium text-gray-800 block py-1">
                                                {beneficiary.street || "N/A"}
                                            </span>
                                        )}
                                    </div>

                                    {/* Postal Code */}
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">
                                            Postal Code
                                        </label>
                                        {isEditMode ? (
                                            <input
                                                name="postalcode"
                                                value={formData?.postalcode || ""}
                                                onChange={(e) =>
                                                    handleInputChange("postalcode", e.target.value)
                                                }
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Postal Code"
                                            />
                                        ) : (
                                            <span className="text-sm font-medium text-gray-800 block py-1">
                                                {beneficiary.postalcode || "N/A"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bank Accounts Card */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-2xs">
                                {/* Header: Title and Add Bank */}
                                <div className="flex items-center justify-between gap-3 mb-4 pb-2.5 border-b border-gray-100">
                                    <h2 className="text-base sm:text-lg font-bold text-gray-800 tracking-tight">
                                        Bank Accounts
                                    </h2>

                                    {/* ADD BANK BUTTON (VIEW MODE) */}
                                    {!isEditMode && (
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/addbenefbank/${beneficiaryId}`)}
                                            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3 sm:px-3.5 py-1.5 rounded-xl transition-all font-semibold flex items-center gap-1.5 text-xs shadow-xs cursor-pointer flex-shrink-0"
                                        >
                                            <svg
                                                className="w-3.5 h-3.5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2.5}
                                                    d="M12 4v16m8-8H4"
                                                />
                                            </svg>
                                            <span>Add Bank</span>
                                        </button>
                                    )}
                                </div>

                                {/* Bank Accounts Display/Edit */}
                                {isEditMode ? (
                                    <div>
                                        {formData.banks.length > 1 && (
                                            <div className="mb-5">
                                                {/* Mobile (< sm): Clean Account Switcher Bar */}
                                                <div className="block sm:hidden bg-gray-50/80 border border-gray-200 rounded-2xl p-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={activeBankIndex === 0}
                                                            onClick={() => setActiveBankIndex((prev) => Math.max(0, prev - 1))}
                                                            className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-30 flex items-center justify-center shadow-2xs flex-shrink-0 cursor-pointer"
                                                            aria-label="Previous bank account"
                                                        >
                                                            <FaArrowLeft className="text-xs" />
                                                        </button>

                                                        <div className="text-center min-w-0 flex-1 px-1">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <span className="font-bold text-xs text-gray-900 truncate">
                                                                    Account {activeBankIndex + 1}
                                                                </span>
                                                                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full font-bold">
                                                                    {activeBankIndex + 1} of {formData.banks.length}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                                                                {formData.banks[activeBankIndex]?.bank_name || "Bank Details"}
                                                            </p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            disabled={activeBankIndex === formData.banks.length - 1}
                                                            onClick={() =>
                                                                setActiveBankIndex((prev) =>
                                                                    Math.min(formData.banks.length - 1, prev + 1)
                                                                )
                                                            }
                                                            className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-30 flex items-center justify-center shadow-2xs flex-shrink-0 cursor-pointer"
                                                            aria-label="Next bank account"
                                                        >
                                                            <FaArrowLeft className="text-xs rotate-180" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Desktop (>= sm): Horizontal Pill Buttons */}
                                                <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                                                    {formData.banks.map((bank, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => setActiveBankIndex(index)}
                                                            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap text-xs flex-shrink-0 cursor-pointer ${activeBankIndex === index
                                                                ? "bg-blue-600 text-white shadow-2xs"
                                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                                }`}
                                                        >
                                                            Account {index + 1}
                                                            {bank.bank_name && ` • ${bank.bank_name}`}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-4">
                                            {formData.banks.map((bank, index) => (
                                                <div
                                                    key={index}
                                                    className={`border rounded-2xl p-4 sm:p-5 transition-all duration-200 ${activeBankIndex === index
                                                        ? "border-blue-200 bg-blue-50/40"
                                                        : "border-gray-200 bg-gray-50/50"
                                                        } ${formData.banks.length > 1 &&
                                                            index !== activeBankIndex
                                                            ? "hidden"
                                                            : ""
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h3 className="text-xs sm:text-sm font-bold text-gray-800">
                                                            Bank Account {index + 1}
                                                        </h3>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Bank Name
                                                            </label>
                                                            <input
                                                                value={bank.bank_name || ""}
                                                                onChange={(e) =>
                                                                    handleBankChange(
                                                                        index,
                                                                        "bank_name",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                placeholder="Bank Name"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Account Number
                                                            </label>
                                                            <input
                                                                value={bank.bank_acc_no || ""}
                                                                onChange={(e) =>
                                                                    handleBankChange(
                                                                        index,
                                                                        "bank_acc_no",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                placeholder="Account Number"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Payment Rails
                                                            </label>
                                                            <select
                                                                value={bank.rails || ""}
                                                                onChange={(e) =>
                                                                    handleBankChange(
                                                                        index,
                                                                        "rails",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            >
                                                                <option value="local">Local</option>
                                                                <option value="swift">SWIFT</option>
                                                                <option value="sepa">SEPA</option>
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Currency Code
                                                            </label>
                                                            <input
                                                                value={bank.currency_code || ""}
                                                                onChange={(e) =>
                                                                    handleBankChange(
                                                                        index,
                                                                        "currency_code",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                placeholder="Currency Code"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {beneficiary.benef_banks && beneficiary.benef_banks.length > 1 && (
                                            <div className="mb-4">
                                                {/* Mobile (< sm): Clean Account Switcher Bar */}
                                                <div className="block sm:hidden bg-gray-50/90 border border-gray-200/80 rounded-2xl p-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={activeBankIndex === 0}
                                                            onClick={() => setActiveBankIndex((prev) => Math.max(0, prev - 1))}
                                                            className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-30 flex items-center justify-center shadow-xs flex-shrink-0 cursor-pointer"
                                                            aria-label="Previous bank account"
                                                        >
                                                            <FaArrowLeft className="text-xs" />
                                                        </button>

                                                        <div className="text-center min-w-0 flex-1 px-1">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <span className="font-bold text-xs text-gray-900 truncate">
                                                                    Account {activeBankIndex + 1}
                                                                </span>
                                                                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200/60 px-1.5 py-0.5 rounded-full font-bold">
                                                                    {activeBankIndex + 1} of {beneficiary.benef_banks.length}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                                                                {beneficiary.benef_banks[activeBankIndex]?.bank_name || "Bank Details"}
                                                            </p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            disabled={activeBankIndex === beneficiary.benef_banks.length - 1}
                                                            onClick={() =>
                                                                setActiveBankIndex((prev) =>
                                                                    Math.min(beneficiary.benef_banks.length - 1, prev + 1)
                                                                )
                                                            }
                                                            className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-30 flex items-center justify-center shadow-xs flex-shrink-0 cursor-pointer"
                                                            aria-label="Next bank account"
                                                        >
                                                            <FaArrowLeft className="text-xs rotate-180" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Desktop Tabs with Arrow Navigation & Clean Overflow */}
                                                <div className="hidden sm:flex items-center gap-1.5 mb-4">
                                                    {/* Left Scroll Button */}
                                                    {beneficiary.benef_banks && beneficiary.benef_banks.length > 3 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => scrollTabs("left")}
                                                            className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center flex-shrink-0 cursor-pointer shadow-2xs transition-colors"
                                                            aria-label="Scroll left"
                                                        >
                                                            <FaArrowLeft className="text-xs" />
                                                        </button>
                                                    )}

                                                    {/* Desktop Tabs with Auto-Scroll on Click */}
                                                    <div
                                                        ref={bankTabsRef}
                                                        className="hidden sm:flex items-center gap-2 overflow-x-auto scroll-smooth py-1 mb-4 flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                                                    >
                                                        {beneficiary.benef_banks.map((bank, index) => (
                                                            <button
                                                                key={bank.id || index}
                                                                type="button"
                                                                onClick={(e) => handleTabClick(index, e)}
                                                                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap text-xs flex-shrink-0 cursor-pointer ${activeBankIndex === index
                                                                        ? "bg-blue-600 text-white shadow-2xs scale-[1.02]"
                                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                                    }`}
                                                            >
                                                                Account {index + 1}
                                                                {bank.bank_name && ` • ${bank.bank_name}`}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Right Scroll Button */}
                                                    {beneficiary.benef_banks && beneficiary.benef_banks.length > 3 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => scrollTabs("right")}
                                                            className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center flex-shrink-0 cursor-pointer shadow-2xs transition-colors"
                                                            aria-label="Scroll right"
                                                        >
                                                            <FaArrowLeft className="text-xs rotate-180" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Bank Card Details */}
                                        <div className="space-y-4">
                                            {beneficiary.benef_banks &&
                                                beneficiary.benef_banks.map((bank, index) => (
                                                    <div
                                                        key={bank.id || index}
                                                        className={`border rounded-2xl p-4 sm:p-5 transition-all duration-200 ${activeBankIndex === index
                                                            ? "border-blue-200 bg-blue-50/40"
                                                            : "border-gray-200 bg-gray-50/50"
                                                            } ${beneficiary.benef_banks.length > 1 && index !== activeBankIndex
                                                                ? "hidden"
                                                                : ""
                                                            }`}
                                                    >
                                                        {/* Card Top Row: Title + Delete Button */}
                                                        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-200/60">
                                                            <span className="text-xs sm:text-sm font-bold text-gray-800">
                                                                Account {index + 1} Details
                                                            </span>
                                                            {beneficiary.benef_banks.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenDeleteModal(bank.id)}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/60 active:scale-95 transition-all cursor-pointer"
                                                                >
                                                                    <svg
                                                                        className="w-3.5 h-3.5"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                        />
                                                                    </svg>
                                                                    <span>Delete</span>
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                                                            <InfoField
                                                                label="Bank Name"
                                                                value={bank.bank_name}
                                                            />
                                                            <InfoField
                                                                label="Account Number"
                                                                value={bank.bank_acc_no}
                                                                type="account"
                                                            />
                                                            <InfoField
                                                                label="Branch Name"
                                                                value={bank.bank_branch_name}
                                                            />
                                                            <InfoField
                                                                label="Currency"
                                                                value={bank.currency_code}
                                                            />
                                                            <InfoField
                                                                label="Payment Rails"
                                                                value={bank.rails}
                                                            />
                                                            <InfoField
                                                                label="Account Status"
                                                                value={
                                                                    <span
                                                                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${bank.status === 1
                                                                            ? "bg-green-100 text-green-800 border border-green-200"
                                                                            : "bg-red-100 text-red-800 border border-red-200"
                                                                            }`}
                                                                    >
                                                                        {bank.status === 1 ? "Active" : "Inactive"}
                                                                    </span>
                                                                }
                                                            />
                                                            {bank.swift && (
                                                                <InfoField
                                                                    label="SWIFT Code"
                                                                    value={bank.swift}
                                                                    type="code"
                                                                />
                                                            )}
                                                            {bank.bic_code && (
                                                                <InfoField
                                                                    label="BIC Code"
                                                                    value={bank.bic_code}
                                                                    type="code"
                                                                />
                                                            )}
                                                            {bank.ifsc && (
                                                                <InfoField
                                                                    label="IFSC Code"
                                                                    value={bank.ifsc}
                                                                    type="code"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar - 1 column width */}
                        <div className="space-y-5 sm:space-y-6">
                            {/* Account Information Card */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-2xs">
                                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                                    Account Information
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-1 text-xs">
                                            <span className="text-gray-600">Account Status:</span>
                                            <span
                                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${beneficiary.status === 1
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                                    }`}
                                            >
                                                {beneficiary.status === 1 ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-600 rounded-full"
                                                style={{
                                                    width: beneficiary.status === 1 ? "100%" : "0%",
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1 text-xs">
                                            <span className="text-gray-600">Beneficiary Type:</span>
                                            <span className="text-xs font-semibold text-gray-800 capitalize">
                                                {beneficiary.beneftype || "N/A"}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full"
                                                style={{ width: "100%" }}
                                            ></div>
                                        </div>
                                    </div>

                                    {beneficiary.created_at && (
                                        <div>
                                            <div className="flex justify-between items-center mb-1 text-xs">
                                                <span className="text-gray-600">Created Date:</span>
                                                <span className="text-xs font-semibold text-gray-800">
                                                    {new Date(
                                                        beneficiary.created_at
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-purple-600 rounded-full"
                                                    style={{ width: "100%" }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Change Password Card */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-2xs">
                                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                                    Security
                                </h2>

                                <button
                                    type="button"
                                    onClick={() => {
                                        console.log("Change Password clicked");
                                    }}
                                    className="w-full bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:bg-blue-700 transition-colors text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                                        />
                                    </svg>
                                    <span>Change Password</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Save/Cancel Buttons (only in edit mode) */}
                    {isEditMode && (
                        <div className="flex flex-col sm:flex-row justify-end items-center gap-2.5 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                className="w-full sm:w-auto py-2.5 px-5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-xs sm:text-sm cursor-pointer"
                                onClick={handleEditToggle}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="w-full sm:w-auto py-2.5 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-xs sm:text-sm flex items-center justify-center min-w-32 cursor-pointer shadow-2xs"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ClipLoader size={16} color="#ffffff" />
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BeneficiaryProfile;