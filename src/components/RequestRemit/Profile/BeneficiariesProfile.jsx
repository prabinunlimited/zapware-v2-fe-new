import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ClipLoader } from "react-spinners";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiCreditCard,
  FiBriefcase,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import {
  FaArrowLeft,
  FaEdit,
  FaSave,
  FaTimes,
  FaUser,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaIdCard,
  FaWallet,
  FaPlus,
  FaTrash,
  FaShieldAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";

// Redux imports
import {
  fetchBeneficiaryData,
  fetchLocationData,
  updateBeneficiaryProfile,
  sendEmailPasscode,
  validateEmailPasscode,
  sendPhoneOTP,
  validatePhoneOTP,
  selectBeneficiaryProfile,
  selectMerchantData,
  selectBeneficiaryLoading,
  selectBeneficiaryError,
  selectLocationData,
  selectUpdating,
  selectUpdateError,
  selectVerificationLoading,
  selectEmailVerified,
  selectPhoneVerified,
} from "../Header/BeneficiariesHeaderSlice";

function BeneficiaryProfile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux selectors
  const profileData = useSelector(selectBeneficiaryProfile);
  const merchantData = useSelector(selectMerchantData);
  const loading = useSelector(selectBeneficiaryLoading);
  const error = useSelector(selectBeneficiaryError);
  const locationData = useSelector(selectLocationData);
  const updating = useSelector(selectUpdating);
  const updateError = useSelector(selectUpdateError);
  const verificationLoading = useSelector(selectVerificationLoading);

  // Local state
  const [activeBankIndex, setActiveBankIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Email verification states
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [passcode, setPasscode] = useState("");

  // Phone Verification States
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [phoneOTP, setPhoneOTP] = useState("");

  // Get beneficiary ID
  const beneficiaryId =
    localStorage.getItem("beneficiaryId") ||
    localStorage.getItem("beneficaryId");

  // Refs for partner ID
  const whiteLabelledPartnerIdRef = useRef(null);

  // Initialize data from Redux
  useEffect(() => {
    if (beneficiaryId) {
      console.log("🔄 Fetching beneficiary data for ID:", beneficiaryId);
      const partnerId = localStorage.getItem("whitelabelledpartnerid");
      whiteLabelledPartnerIdRef.current = partnerId;
    } else {
      toast.error(
        "No beneficiary selected. Please select a beneficiary first."
      );
      navigate("/beneficiary/homepage");
    }
  }, [dispatch, beneficiaryId, navigate]);

  // Initialize form data when Redux data loads
  useEffect(() => {
    if (profileData && merchantData && !formData) {
      initializeFormData();
    }
  }, [profileData, merchantData]);

  // Helper function to get location names
  const getLocationName = (id, type) => {
    if (!id || !locationData) return "Not provided";
    const data = locationData[type];
    if (!data || !Array.isArray(data)) return id;
    const item = data.find(
      (item) => item.id === parseInt(id) || item.id === id
    );
    return item ? item.name || item.text || item.label : id;
  };

  const getNationalityName = (nationalityId) => {
    if (!nationalityId || !locationData) return "Not provided";
    const nationalities = locationData.nationalities;
    if (!nationalities || !Array.isArray(nationalities)) return nationalityId;
    const nationality = nationalities.find(
      (item) => item.id === parseInt(nationalityId) || item.id === nationalityId
    );
    return nationality
      ? nationality.name || nationality.nationality_name
      : nationalityId;
  };

  // Initialize form data from Redux state
  const initializeFormData = () => {
    if (!profileData) return;

    let benefBanks = [];
    if (merchantData && merchantData.benef_banks) {
      benefBanks = merchantData.benef_banks;
    } else if (
      merchantData &&
      merchantData.data &&
      merchantData.data.benef_banks
    ) {
      benefBanks = merchantData.data.benef_banks;
    }

    const newFormData = {
      beneficiary_id: beneficiaryId,
      beneftype: profileData.beneftype || "individual",
      first_name: profileData.first_name || "",
      middle_name: profileData.middle_name || "",
      last_name: profileData.last_name || "",
      gender: profileData.gender?.toString() || "1",
      email: profileData.email || "",
      country_id: profileData.country_id?.toString() || "",
      country_phone_code: profileData.country_phone_code || "+977",
      phone_number: profileData.phone_number || "",
      state: profileData.state || "",
      city: profileData.city || "",
      street: profileData.street || "",
      postalcode: profileData.postalcode || "",
      nationality_id: profileData.nationality_id?.toString() || "",
      banks:
        benefBanks.length > 0
          ? benefBanks.map((bank) => ({
              rails: bank.rails || "local",
              currency_code: bank.currency_code || "",
              bank_name: bank.bank_name || "",
              bank_acc_no: bank.bank_acc_no || "",
            }))
          : [
              {
                rails: "local",
                currency_code: "",
                bank_name: "",
                bank_acc_no: "",
              },
            ],
    };

    setFormData(newFormData);
  };

  // Email verification functions
  const handleSendEmailPasscode = async () => {
    if (!formData?.email) {
      toast.error("Please enter your email address first");
      return;
    }

    try {
      let currentPartnerId = whiteLabelledPartnerIdRef.current || 9;
      const payload = {
        email: formData.email,
        user_type: "beneficiary",
        partner_id: currentPartnerId,
      };

      await dispatch(sendEmailPasscode(payload)).unwrap();
      toast.success("Verification code sent to your email!");
      setShowEmailPopup(true);
    } catch (error) {
      toast.error(error.message || "Failed to send verification code");
    }
  };

  const handleVerifyEmailPasscode = async () => {
    if (!passcode) {
      toast.error("Please enter the verification code");
      return;
    }

    try {
      const payload = { email: formData.email, passcode };
      await dispatch(validateEmailPasscode(payload)).unwrap();
      setShowEmailPopup(false);
      toast.success("Email verified successfully!");
      await saveBeneficiaryChanges();
    } catch (error) {
      toast.error(error.message || "Failed to verify code");
    }
  };

  const handleSendPhoneOTP = async () => {
    if (!formData?.phone_number || !formData?.country_phone_code) {
      toast.error("Phone number and country code are required");
      return;
    }

    try {
      let currentPartnerId = whiteLabelledPartnerIdRef.current || 9;
      const payload = {
        country_code: formData.country_phone_code,
        mobile_number: formData.phone_number,
        user_type: "beneficiary",
        partner_id: currentPartnerId,
      };

      await dispatch(sendPhoneOTP(payload)).unwrap();
      toast.success("OTP sent to your phone!");
      setShowPhonePopup(true);
    } catch (error) {
      toast.error(error.message || "Failed to send OTP");
    }
  };

  const handleVerifyPhoneOTP = async () => {
    if (!phoneOTP) {
      toast.error("Please enter the OTP");
      return;
    }

    try {
      const payload = {
        country_code: formData.country_phone_code,
        mobile_number: formData.phone_number,
        otp: phoneOTP,
      };

      const result = await dispatch(validatePhoneOTP(payload)).unwrap();
      setShowPhonePopup(false);

      if (result.data?.verification_token) {
        localStorage.setItem(
          "phone_verification_token",
          result.data.verification_token
        );
      }

      toast.success("Phone number verified successfully!");
      await saveBeneficiaryChanges();
    } catch (error) {
      toast.error(error.message || "Failed to verify OTP");
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSaving(true);

    if (!profileData || !formData) {
      toast.error("Profile data not loaded yet");
      setIsSaving(false);
      return;
    }

    const isEmailChanged = formData.email !== profileData.email;
    const isPhoneChanged =
      formData.phone_number !== profileData.phone_number ||
      formData.country_phone_code !== profileData.country_phone_code;

    try {
      if (isEmailChanged && isPhoneChanged) {
        await handleSendEmailPasscode();
      } else if (isEmailChanged) {
        await handleSendEmailPasscode();
      } else if (isPhoneChanged) {
        if (formData.email && formData.email !== profileData.email) {
          await handleSendEmailPasscode();
        } else {
          await handleSendPhoneOTP();
        }
      } else {
        await saveBeneficiaryChanges();
      }
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Save changes
  const saveBeneficiaryChanges = async () => {
    try {
      const phoneToken = localStorage.getItem("phone_verification_token");
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

      await dispatch(
        updateBeneficiaryProfile({ beneficiaryId, formData: payload })
      ).unwrap();

      setSubmitSuccess(true);
      setIsEditMode(false);
      setShowEmailPopup(false);
      setShowPhonePopup(false);
      localStorage.removeItem("phone_verification_token");

      toast.success("Profile updated successfully!");
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setSubmitError(err.message || "Failed to update profile");
      toast.error(err.message || "Failed to update profile");
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      initializeFormData();
      setShowEmailPopup(false);
      setShowPhonePopup(false);
      localStorage.removeItem("phone_verification_token");
    }
    setIsEditMode(!isEditMode);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBankChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      banks: prev.banks.map((bank, i) =>
        i === index ? { ...bank, [field]: value } : bank
      ),
    }));
  };

  const addBankAccount = () => {
    setFormData((prev) => ({
      ...prev,
      banks: [
        ...prev.banks,
        { rails: "local", currency_code: "", bank_name: "", bank_acc_no: "" },
      ],
    }));
    setActiveBankIndex(formData.banks.length);
  };

  const removeBankAccount = (index) => {
    if (formData.banks.length > 1) {
      setFormData((prev) => ({
        ...prev,
        banks: prev.banks.filter((_, i) => i !== index),
      }));
      if (activeBankIndex >= index && activeBankIndex > 0) {
        setActiveBankIndex(activeBankIndex - 1);
      }
    }
  };

  const handleBack = () => {
    navigate(`/beneficiary/homepage/${beneficiaryId}`);
  };

  // Loading state
  if (loading || !profileData || !locationData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <ClipLoader size={60} color="#3B82F6" />
          <p className="mt-6 text-lg font-medium text-gray-700">
            Loading your profile...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Please wait while we fetch your information
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <FiAlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Unable to Load Profile
          </h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => dispatch(fetchBeneficiaryData(beneficiaryId))}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2 shadow-lg"
            >
              <ClipLoader size={18} color="#ffffff" loading={loading} />
              <span>Try Again</span>
            </button>
            <button
              onClick={handleBack}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
            >
              <FaArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const beneficiary = profileData;
  const merchant = merchantData;
  const benefBanks = merchant?.benef_banks || merchant?.data?.benef_banks || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Verification Modals */}
      {showEmailPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-slideUp">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                <FiMail className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Verify Your Email
              </h3>
              <p className="text-gray-600 mb-6">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-blue-600">
                  {formData?.email}
                </span>
              </p>

              <div className="mb-6">
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) =>
                    setPasscode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Enter 6-digit code"
                  className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-center text-xl font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  maxLength={6}
                />
                <div className="flex justify-between mt-3 text-sm">
                  <span className="text-gray-500">
                    Code expires in 10 minutes
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEmailPopup(false);
                    setPasscode("");
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors"
                  disabled={verificationLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyEmailPasscode}
                  disabled={verificationLoading || passcode.length !== 6}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center shadow-lg"
                >
                  {verificationLoading ? (
                    <ClipLoader size={20} color="#ffffff" />
                  ) : (
                    "Verify & Save"
                  )}
                </button>
              </div>

              <button
                onClick={handleSendEmailPasscode}
                disabled={verificationLoading}
                className="mt-6 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center mx-auto"
              >
                {verificationLoading ? "Sending..." : "Resend Code"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPhonePopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                <FaPhone className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Verify Your Phone
              </h3>
              <p className="text-gray-600 mb-6">
                OTP sent to{" "}
                <span className="font-semibold text-green-600">
                  {formData?.country_phone_code} {formData?.phone_number}
                </span>
              </p>

              <div className="mb-6">
                <input
                  type="text"
                  value={phoneOTP}
                  onChange={(e) =>
                    setPhoneOTP(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Enter 6-digit OTP"
                  className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-center text-xl font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPhonePopup(false);
                    setPhoneOTP("");
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors"
                  disabled={verificationLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyPhoneOTP}
                  disabled={verificationLoading || phoneOTP.length !== 6}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center shadow-lg"
                >
                  {verificationLoading ? (
                    <ClipLoader size={20} color="#ffffff" />
                  ) : (
                    "Verify & Save"
                  )}
                </button>
              </div>

              <button
                onClick={handleSendPhoneOTP}
                disabled={verificationLoading}
                className="mt-6 text-green-600 hover:text-green-800 text-sm font-medium"
              >
                {verificationLoading ? "Sending..." : "Resend OTP"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4 py-6 sm:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
          >
            <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                  <FiUser className="w-8 h-8 text-white" />
                </div>
                <span>Beneficiary Profile</span>
              </h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Manage your personal information, contact details, and bank
                accounts for seamless transactions.
              </p>
            </div>

            <button
              onClick={handleEditToggle}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg ${
                isEditMode
                  ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
              }`}
            >
              {isEditMode ? (
                <>
                  <FaTimes className="w-5 h-5" />
                  <span>Cancel Edit</span>
                </>
              ) : (
                <>
                  <FaEdit className="w-5 h-5" />
                  <span>Edit Profile</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {submitSuccess && (
          <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl flex items-center gap-4 animate-fadeIn">
            <FiCheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">
                Profile updated successfully!
              </p>
              <p className="text-sm text-green-600 mt-1">
                Your changes have been saved.
              </p>
            </div>
          </div>
        )}

        {(submitError || updateError) && (
          <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl flex items-center gap-4">
            <FiAlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">
                {submitError || updateError}
              </p>
            </div>
          </div>
        )}

        {/* Main Profile Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 p-8 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border-4 border-white/30">
                  <FaUser className="w-12 h-12" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-400 rounded-full border-4 border-white flex items-center justify-center">
                  <span className="text-xs font-bold text-white">✓</span>
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">
                  {beneficiary.first_name} {beneficiary.last_name}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                    Beneficiary ID: {beneficiaryId}
                  </span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                    {beneficiary.beneftype || "Individual"}
                  </span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                    {beneficiary.email ? "Email Verified" : "Email Pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8 space-y-10">
            {/* Personal Information Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FaIdCard className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Personal Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FaUser className="w-4 h-4 text-gray-400" />
                    First Name
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={formData?.first_name || ""}
                      onChange={(e) =>
                        handleInputChange("first_name", e.target.value)
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="Enter first name"
                    />
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="font-medium text-gray-900">
                        {beneficiary.first_name || "Not provided"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FaUser className="w-4 h-4 text-gray-400" />
                    Last Name
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={formData?.last_name || ""}
                      onChange={(e) =>
                        handleInputChange("last_name", e.target.value)
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="Enter last name"
                    />
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="font-medium text-gray-900">
                        {beneficiary.last_name || "Not provided"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FaEnvelope className="w-4 h-4 text-gray-400" />
                    Email Address
                  </label>
                  {isEditMode ? (
                    <div className="relative">
                      <input
                        type="email"
                        value={formData?.email || ""}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all pr-12"
                        placeholder="your.email@example.com"
                      />
                      {beneficiary.email && (
                        <div className="absolute right-3 top-3">
                          <FiCheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                      <p className="font-medium text-gray-900">
                        {beneficiary.email || "Not provided"}
                      </p>
                      {beneficiary.email && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FaPhone className="w-4 h-4 text-gray-400" />
                    Phone Number
                  </label>
                  {isEditMode ? (
                    <div className="flex gap-3">
                      <select
                        value={formData?.country_phone_code || "+977"}
                        onChange={(e) =>
                          handleInputChange(
                            "country_phone_code",
                            e.target.value
                          )
                        }
                        className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      >
                        <option value="+977">🇳🇵 +977</option>
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                      </select>
                      <input
                        type="tel"
                        value={formData?.phone_number || ""}
                        onChange={(e) =>
                          handleInputChange("phone_number", e.target.value)
                        }
                        className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="Phone number"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {beneficiary.country_phone_code || "+977"}{" "}
                            {beneficiary.phone_number || "Not provided"}
                          </p>
                        </div>
                        {beneficiary.phone_number && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Bank Accounts Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <FaWallet className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Bank Accounts
                  </h2>
                </div>
                {isEditMode && benefBanks.length < 3 && (
                  <button
                    onClick={addBankAccount}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
                  >
                    <FaPlus className="w-4 h-4" />
                    <span>Add Account</span>
                  </button>
                )}
              </div>

              {benefBanks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {benefBanks.map((bank, index) => (
                    <div
                      key={index}
                      className={`border-2 rounded-2xl p-6 transition-all ${
                        isEditMode
                          ? "border-blue-200 bg-blue-50/50 hover:border-blue-300"
                          : "border-gray-100 bg-gray-50 hover:border-gray-200"
                      }`}
                    >
                      {isEditMode ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-white rounded-xl shadow-sm">
                                <FaBuilding className="w-5 h-5 text-gray-600" />
                              </div>
                              <span className="font-medium text-gray-700">
                                Bank Account #{index + 1}
                              </span>
                            </div>
                            {benefBanks.length > 1 && (
                              <button
                                onClick={() => removeBankAccount(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bank Name
                              </label>
                              <input
                                type="text"
                                value={formData?.banks[index]?.bank_name || ""}
                                onChange={(e) =>
                                  handleBankChange(
                                    index,
                                    "bank_name",
                                    e.target.value
                                  )
                                }
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                placeholder="Enter bank name"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Account Number
                              </label>
                              <input
                                type="text"
                                value={
                                  formData?.banks[index]?.bank_acc_no || ""
                                }
                                onChange={(e) =>
                                  handleBankChange(
                                    index,
                                    "bank_acc_no",
                                    e.target.value
                                  )
                                }
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                placeholder="Enter account number"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-white rounded-xl shadow-sm">
                                <FaBuilding className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 text-lg">
                                  {bank.bank_name}
                                </h3>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                    {bank.rails || "Local"} Transfer
                                  </span>
                                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                    {bank.currency_code}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">
                                •••• {bank.bank_acc_no?.slice(-4)}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                Account Number
                              </p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Full Account:</span>{" "}
                              {bank.bank_acc_no}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <FaWallet className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-700 mb-3">
                    No Bank Accounts
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Add your bank account details to receive payments and
                    transfers seamlessly.
                  </p>
                  {isEditMode && (
                    <button
                      onClick={addBankAccount}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
                    >
                      <FaPlus className="w-4 h-4" />
                      <span>Add Your First Bank Account</span>
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Save/Cancel Buttons for Edit Mode */}
            {isEditMode && (
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-gray-100">
                <button
                  onClick={handleEditToggle}
                  className="px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                >
                  Cancel Changes
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={updating || isSaving}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-3"
                >
                  {updating || isSaving ? (
                    <>
                      <ClipLoader size={20} color="#ffffff" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="w-5 h-5" />
                      <span>Save All Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        {isEditMode && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
            <div className="flex items-start gap-4">
              <FaShieldAlt className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-800 mb-2">
                  Security Notice
                </h4>
                <p className="text-gray-600 text-sm">
                  When changing your email or phone number, you'll receive a
                  verification code to confirm your identity. This ensures your
                  account security and prevents unauthorized changes.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default BeneficiaryProfile;
