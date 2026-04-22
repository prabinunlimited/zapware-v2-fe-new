// components/AddTeamMember.jsx
import React, { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { 
  FaEye, 
  FaEyeSlash, 
  FaTimes, 
  FaUsers, 
  FaUserPlus,
  FaPhone,
  FaEnvelope,
  FaLock,
  FaUser,
  FaGlobe,
  FaChevronDown,
  FaCheck,
  FaSearch
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import InstitutionPopup from "../../components/PopupModal/InstitutionPopup.jsx";
import { usePartnerConfig } from "../../hooks/usePartnerConfig";
import { countries } from "../../features/Auth/slices/countrySlice.js";
import {
  useTeamMemberActions,
  useTeamMemberState,
} from "../Team/Hooks/useTeamMemberActions.js"

const AddTeamMember = () => {
  const navigate = useNavigate();
  const countriesData = countries;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);

  const bearertoken = localStorage.getItem("bearertoken");
  const authtoken = localStorage.getItem("authtoken");
  const API_URL = import.meta.env.VITE_API_URL;
  const { customerId } = useParams();

  // Redux state and actions
  const { roles, loading, error, success, showPopup } = useTeamMemberState();
  const { loadRoles, createTeamMember, resetError, resetSuccess, updateShowPopup } =
    useTeamMemberActions();

  // Use the partner config hook
  const config = usePartnerConfig(authtoken);
  const headerColor =
    config?.header_color || localStorage.getItem("header_color");
  const textColor = config?.text_color || localStorage.getItem("text_color");

  // Function to handle text color style
  const getTextColorStyle = () => {
    if (textColor && textColor.startsWith("text-")) {
      return { className: textColor };
    } else if (textColor && textColor.startsWith("#")) {
      return { style: { color: textColor } };
    }
    return {};
  };

  // Function to handle header color style
  const getHeaderColorStyle = () => {
    if (headerColor && headerColor.startsWith("bg-")) {
      return { className: headerColor };
    } else if (headerColor && headerColor.startsWith("#")) {
      return { style: { backgroundColor: headerColor } };
    }
    return { className: "bg-gradient-to-r from-blue-600 to-purple-600" };
  };

  const textColorProps = getTextColorStyle();
  const headerColorProps = getHeaderColorStyle();

  // Formik setup - MOVED UP before useEffect that uses it
  const formik = useFormik({
    initialValues: {
      first_name: "",
      middle_name: "",
      last_name: "",
      email: "",
      password: "",
      phone_no: "",
      mobilenumber_countrycode: "",
      mobile_number: "",
      flag_url: "",
      role_id: "3",
    },
    validationSchema: Yup.object({
      first_name: Yup.string()
        .required("First Name is required")
        .min(2, "First name must be at least 2 characters"),
      last_name: Yup.string()
        .required("Last Name is required")
        .min(2, "Last name must be at least 2 characters"),
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .matches(/[a-zA-Z]/, "Password must contain at least one letter")
        .matches(/[0-9]/, "Password must contain at least one number")
        .required("Password is required"),
      mobilenumber_countrycode: Yup.string().required(
        "Country code is required"
      ),
      mobile_number: Yup.string()
        .required("Mobile number is required")
        .matches(/^[0-9]+$/, "Mobile number must contain only numbers")
        .min(6, "Mobile number must be at least 6 digits"),
    }),
    onSubmit: async (values) => {
      // Prevent double submission
      if (isSubmittingRef.current) return;
      
      setIsSubmitting(true);
      isSubmittingRef.current = true;
      
      try {
        await createTeamMember(customerId, values, authtoken, API_URL);
      } catch (error) {
        console.error("Submission error:", error);
        toast.error("Failed to create team member. Please try again.");
      } finally {
        setIsSubmitting(false);
        isSubmittingRef.current = false;
      }
    },
  });

  // Fetch roles on component mount
  useEffect(() => {
    if (bearertoken && API_URL) {
      loadRoles(bearertoken, API_URL);
    }
  }, [bearertoken, API_URL, loadRoles]);

  // Handle success and error states
  useEffect(() => {
    if (success) {
      toast.success("🎉 Team member added successfully!");
      
      // Reset success state immediately to prevent re-triggering
      resetSuccess();
      
      // Reset form values
      formik.resetForm();
      // Reset country selection
      setSelectedCountry(null);
      setSearchTerm("");
      setIsDropdownOpen(false);
      setPasswordVisible(false);
      
      // Navigate back to team list after a short delay
      setTimeout(() => {
        navigate(`/team/${customerId}`);
      }, 1500);
    }
  }, [success, navigate, customerId, formik, resetSuccess]);

  useEffect(() => {
    if (error && !showPopup) {
      toast.error(`❌ ${error}`);
      resetError();
    }
  }, [error, showPopup, resetError]);

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      resetError();
      resetSuccess();
    };
  }, [resetError, resetSuccess]);

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    formik.setFieldValue("mobilenumber_countrycode", country.phone_code);
    formik.setFieldValue("flag_url", country.flag_url);
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  // Safe countries filtering
  const filteredCountries = Array.isArray(countriesData) 
    ? countriesData.filter((country) => {
        if (!country || typeof country !== 'object') return false;
        
        const normalizedSearchTerm = searchTerm.trim().toLowerCase();
        const normalizedCountryName = (country.name || '').trim().toLowerCase();
        const normalizedPhoneCode = (country.phone_code || '').trim().toLowerCase();

        return (
          normalizedCountryName.includes(normalizedSearchTerm) ||
          normalizedPhoneCode.includes(normalizedSearchTerm)
        );
      }).slice(0, 100) // Limit results for performance
    : [];

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setPasswordVisible((prevState) => !prevState);
  };

  // Handle cancel button click
  const handleCancel = () => {
    if (formik.dirty) {
      if (window.confirm("Are you sure you want to cancel? Any unsaved changes will be lost.")) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const handleClosePopup = () => {
    updateShowPopup(false);
    resetError();
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <motion.div 
          variants={itemVariants}
          className="text-center mb-12"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white shadow-lg">
                <FaUserPlus className="text-3xl text-blue-600" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  Add Team Member
                </h1>
                <p className="text-gray-600 mt-2">
                  Create a new team member account with specific permissions
                </p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/team/${customerId}`)}
              className={`text-white px-6 py-3 rounded-xl shadow-lg font-semibold flex items-center gap-3 min-w-[140px] justify-center ${headerColorProps.className}`}
            >
              <FaUsers className="text-lg" />
              View Staff
            </motion.button>
          </div>
        </motion.div>

        {/* Loading Overlay */}
        <AnimatePresence>
          {(loading || isSubmitting) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4"
              >
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-700 font-medium">
                  {isSubmitting ? "Adding team member..." : "Loading..."}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Form Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className={`px-8 py-6 ${headerColorProps.className}`}>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <FaUserPlus />
              Member Information
            </h2>
            <p className="text-blue-100 mt-1">
              Fill in the details below to create a new team member
            </p>
          </div>

          <form onSubmit={formik.handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* First Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FaUser className="text-blue-500" />
                  First Name *
                </label>
                <div className="relative">
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={formik.values.first_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      formik.errors.first_name && formik.touched.first_name
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-200"
                    }`}
                    placeholder="Enter first name"
                  />
                  {formik.values.first_name && !formik.errors.first_name && (
                    <FaCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {formik.errors.first_name && formik.touched.first_name && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm flex items-center gap-1"
                  >
                    ❌ {formik.errors.first_name}
                  </motion.p>
                )}
              </div>

              {/* Middle Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FaUser className="text-gray-400" />
                  Middle Name
                </label>
                <input
                  id="middle_name"
                  name="middle_name"
                  type="text"
                  value={formik.values.middle_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200"
                  placeholder="Enter middle name (optional)"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FaUser className="text-blue-500" />
                  Last Name *
                </label>
                <div className="relative">
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={formik.values.last_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      formik.errors.last_name && formik.touched.last_name
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-200"
                    }`}
                    placeholder="Enter last name"
                  />
                  {formik.values.last_name && !formik.errors.last_name && (
                    <FaCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {formik.errors.last_name && formik.touched.last_name && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm flex items-center gap-1"
                  >
                    ❌ {formik.errors.last_name}
                  </motion.p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FaEnvelope className="text-blue-500" />
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      formik.errors.email && formik.touched.email
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-200"
                    }`}
                    placeholder="Enter email address"
                  />
                  {formik.values.email && !formik.errors.email && (
                    <FaCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {formik.errors.email && formik.touched.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm flex items-center gap-1"
                  >
                    ❌ {formik.errors.email}
                  </motion.p>
                )}
              </div>

              {/* Password and Role Assignment - Side by Side */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FaLock className="text-blue-500" />
                  Password *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={passwordVisible ? "text" : "password"}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 pr-12 ${
                      formik.errors.password && formik.touched.password
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-200"
                    }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {formik.errors.password && formik.touched.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm flex items-center gap-1"
                  >
                    ❌ {formik.errors.password}
                  </motion.p>
                )}
                {formik.values.password && !formik.errors.password && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-green-500 text-sm flex items-center gap-1"
                  >
                    ✅ Password is strong
                  </motion.p>
                )}
              </div>

              {/* Role Assignment - Beside Password */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FaGlobe className="text-blue-500" />
                  Role Assignment *
                </label>
                <select
                  name="role_id"
                  value={formik.values.role_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select a role</option>
                  {Array.isArray(roles) && roles.length > 0 ? (
                    roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Loading roles...
                    </option>
                  )}
                </select>
                {formik.touched.role_id && formik.errors.role_id && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm flex items-center gap-1"
                  >
                    ❌ {formik.errors.role_id}
                  </motion.p>
                )}
              </div>

              {/* Phone Number - Full Width */}
              <div className="md:col-span-2 space-y-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FaPhone className="text-blue-500" />
                  Phone Number *
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Country Code Selector */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Country Code
                    </label>
                    <div className="relative">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full px-4 py-3 border rounded-xl text-left flex items-center justify-between transition-all duration-200 ${
                          formik.errors.mobilenumber_countrycode && formik.touched.mobilenumber_countrycode
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {selectedCountry ? (
                            <>
                              <img
                                src={selectedCountry.flag_url}
                                alt={`${selectedCountry.name} flag`}
                                className="w-6 h-4 rounded object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <span className="font-medium">{selectedCountry.phone_code}</span>
                            </>
                          ) : (
                            <span className="text-gray-500">Select country</span>
                          )}
                        </div>
                        <FaChevronDown 
                          className={`text-gray-400 transition-transform duration-200 ${
                            isDropdownOpen ? "rotate-180" : ""
                          }`} 
                        />
                      </motion.button>

                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute z-20 w-full mt-2 bg-white border border-gray-300 rounded-xl shadow-2xl overflow-hidden"
                          >
                            {/* Search */}
                            <div className="p-3 border-b border-gray-200">
                              <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-transparent"
                                  placeholder="Search countries..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                />
                              </div>
                            </div>

                            {/* Countries List */}
                            <div className="max-h-60 overflow-y-auto">
                              {filteredCountries.length > 0 ? (
                                filteredCountries.map((country) => (
                                  <motion.div
                                    key={country.id}
                                    whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                                    className="flex items-center px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    onClick={() => handleCountryChange(country)}
                                  >
                                    <img
                                      src={country.flag_url}
                                      alt={`${country.name} flag`}
                                      className="w-6 h-4 rounded object-cover mr-3"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">
                                        {country.name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {country.phone_code}
                                      </div>
                                    </div>
                                    {selectedCountry?.id === country.id && (
                                      <FaCheck className="text-green-500 ml-2" />
                                    )}
                                  </motion.div>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-gray-500 text-center">
                                  No countries found
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {formik.errors.mobilenumber_countrycode && formik.touched.mobilenumber_countrycode && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-1 flex items-center gap-1"
                      >
                        ❌ {formik.errors.mobilenumber_countrycode}
                      </motion.p>
                    )}
                  </div>

                  {/* Phone Number Input */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="mobile_number"
                        name="mobile_number"
                        value={formik.values.mobile_number}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${
                          formik.errors.mobile_number && formik.touched.mobile_number
                            ? "border-red-300 focus:ring-red-200"
                            : "border-gray-300 focus:ring-blue-200"
                        }`}
                        placeholder="Enter phone number"
                      />
                      {formik.values.mobile_number && !formik.errors.mobile_number && (
                        <FaCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                      )}
                    </div>
                    {formik.errors.mobile_number && formik.touched.mobile_number && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-1 flex items-center gap-1"
                      >
                        ❌ {formik.errors.mobile_number}
                      </motion.p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-end mt-12 pt-6 border-t border-gray-200"
            >
              <motion.button
                type="button"
                onClick={handleCancel}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading || isSubmitting}
                className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaTimes />
                Cancel
              </motion.button>
              
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading || isSubmitting || !formik.isValid}
                className={`px-8 py-4 text-white rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 ${
                  loading || isSubmitting || !formik.isValid
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-lg"
                } ${headerColorProps.className}`}
              >
                <FaUserPlus />
                {isSubmitting ? "Creating..." : "Create Team Member"}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>

        {/* Quick Tips */}
        <motion.div
          variants={itemVariants}
          className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200"
        >
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            💡 Quick Tips
          </h3>
          <ul className="text-blue-700 text-sm space-y-2">
            <li>• Ensure the email is valid and accessible by the team member</li>
            <li>• Use a strong password with letters, numbers, and special characters</li>
            <li>• Select the appropriate role based on required permissions</li>
            <li>• The team member will receive login credentials via email</li>
          </ul>
        </motion.div>
      </div>

      {/* Popup for Errors */}
      {showPopup && error && (
        <InstitutionPopup onClose={handleClosePopup} message={error} />
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="rounded-xl"
        progressClassName="bg-gradient-to-r from-blue-500 to-purple-500"
      />
    </motion.div>
  );
};

export default AddTeamMember;