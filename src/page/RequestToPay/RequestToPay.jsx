import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import api from "../../services/api";
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  X,
  Building2,
  User,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Globe,
  Phone,
  DollarSign,
  Shield,
  FileQuestion,
} from "lucide-react";

// Redux selectors from countrySlice
import {
  selectCountriesOptions,
  selectPhoneCodeOptions,
  fetchCountries,
} from "../../features/Auth/slices/countrySlice";

const CURRENCY_CONFIG = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "DKK", name: "Danish Krone" },
];

const FIELD_DOM_ORDER = [
  "clientType",
  "companyName",
  "firstName",
  "lastName",
  "email",
  "phoneCountryCode",
  "mobileNumber",
  "country",
  "state",
  "currency",
  "amount",
  "dueDate",
  "reason",
  "websiteUrl",
  "statementFile",
];

const RequestToPay = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const countryOptions = useSelector(selectCountriesOptions);
  const phoneOptions = useSelector(selectPhoneCodeOptions);

  // Reasons/Purposes state
  const [reasonsList, setReasonsList] = useState([]);
  const [reasonsLoading, setReasonsLoading] = useState(false);
  const [isReasonOpen, setIsReasonOpen] = useState(false);

  useEffect(() => {
    if (!countryOptions || countryOptions.length === 0) {
      dispatch(fetchCountries());
    }
  }, [dispatch, countryOptions]);

  useEffect(() => {
    const fetchPurposes = async () => {
      setReasonsLoading(true);
      try {
        const response = await api.get(
          "transactions/get-purposes-by-service-provider/59"
        );
        const data = response.data?.data || response.data || [];
        setReasonsList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch payment purposes:", err);
      } finally {
        setReasonsLoading(false);
      }
    };

    fetchPurposes();
  }, []);

  const [formData, setFormData] = useState({
    clientType: "",
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneCountryCode: null,
    mobileNumber: "",
    country: null,
    state: "",
    currency: "",
    amount: "",
    dueDate: "",
    reason: null,
    websiteUrl: "",
    statementFile: null,
  });

  // Direct input typing state
  const [countryInputText, setCountryInputText] = useState("");
  const [phoneInputText, setPhoneInputText] = useState("");

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Dropdown states
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isPhoneCodeOpen, setIsPhoneCodeOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  const countryRef = useRef(null);
  const phoneRef = useRef(null);
  const currencyRef = useRef(null);
  const reasonRef = useRef(null);

  const isStateRequired =
    formData.country?.country_code === "US" ||
    formData.country?.country_code === "CA";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryRef.current && !countryRef.current.contains(event.target)) {
        setIsCountryOpen(false);
        // Reset displayed text to selected value if user blurred without selecting
        if (formData.country) {
          setCountryInputText(formData.country.label);
        } else {
          setCountryInputText("");
        }
      }
      if (phoneRef.current && !phoneRef.current.contains(event.target)) {
        setIsPhoneCodeOpen(false);
        if (formData.phoneCountryCode) {
          setPhoneInputText(formData.phoneCountryCode.phone_code);
        } else {
          setPhoneInputText("");
        }
      }
      if (currencyRef.current && !currencyRef.current.contains(event.target)) {
        setIsCurrencyOpen(false);
      }
      if (reasonRef.current && !reasonRef.current.contains(event.target)) {
        setIsReasonOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [formData.country, formData.phoneCountryCode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          statementFile: "File size must not exceed 10MB",
        }));
        return;
      }
      setFormData((prev) => ({ ...prev, statementFile: file }));
      setErrors((prev) => ({ ...prev, statementFile: null }));
    }
  };

  const removeFile = () => {
    setFormData((prev) => ({ ...prev, statementFile: null }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientType) {
      newErrors.clientType = "Please select a client type";
    }

    if (formData.clientType === "23") {
      if (!formData.companyName.trim()) {
        newErrors.companyName = "Company name is required";
      }
    } else if (formData.clientType === "3") {
      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phoneCountryCode) {
      newErrors.phoneCountryCode = "Country dial code is required";
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (!/^\d{5,15}$/.test(formData.mobileNumber.replace(/[\s-]/g, ""))) {
      newErrors.mobileNumber = "Enter a valid phone number (5-15 digits)";
    }

    if (!formData.country) {
      newErrors.country = "Please select a country";
    }

    if (isStateRequired && !formData.state.trim()) {
      newErrors.state = "State is mandatory for USA and Canada";
    }

    if (!formData.currency) {
      newErrors.currency = "Currency is required";
    }

    if (!formData.amount) {
      newErrors.amount = "Amount is required";
    } else if (parseFloat(formData.amount) <= 0 || isNaN(formData.amount)) {
      newErrors.amount = "Enter a valid positive number";
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    }

    if (!formData.reason) {
      newErrors.reason = "Payment reason is required";
    }

    if (!formData.statementFile) {
      newErrors.statementFile = "Statement or invoice document is required";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const scrollToFirstError = (validationErrors) => {
    const firstErrorKey = FIELD_DOM_ORDER.find((key) => validationErrors[key]);
    if (!firstErrorKey) return;

    const targetElement = document.getElementById(`field-${firstErrorKey}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof targetElement.focus === "function") {
        targetElement.focus();
      }
      targetElement.classList.add("ring-4", "ring-red-300");
      setTimeout(() => {
        targetElement.classList.remove("ring-4", "ring-red-300");
      }, 1500);
    }
  };

  const handleCreateAnother = () => {
    setFormData({
      clientType: "",
      companyName: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneCountryCode: null,
      mobileNumber: "",
      country: null,
      state: "",
      currency: "",
      amount: "",
      dueDate: "",
      reason: null,
      websiteUrl: "",
      statementFile: null,
    });
    setCountryInputText("");
    setPhoneInputText("");
    setErrors({});
    setIsSubmitting(false);
    setIsCountryOpen(false);
    setIsPhoneCodeOpen(false);
    setIsCurrencyOpen(false);
    setIsReasonOpen(false);
    setSubmitSuccess(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      scrollToFirstError(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData = new FormData();
      submissionData.append("client_type", formData.clientType);
      submissionData.append(
        "company_name",
        formData.clientType === "23" ? formData.companyName : ""
      );
      submissionData.append("email", formData.email);
      submissionData.append(
        "first_name",
        formData.clientType === "3" ? formData.firstName : ""
      );
      submissionData.append(
        "last_name",
        formData.clientType === "3" ? formData.lastName : ""
      );
      submissionData.append(
        "phone_code",
        formData.phoneCountryCode?.phone_code || ""
      );
      submissionData.append("mobile_number", formData.mobileNumber);
      submissionData.append(
        "country_id",
        formData.country?.value || formData.country?.id || ""
      );
      submissionData.append("state", formData.state || "");
      submissionData.append("currency_code", formData.currency);
      submissionData.append(
        "reason_id",
        formData.reason?.id || formData.reason?.purpose_id || ""
      );
      submissionData.append("website_address", formData.websiteUrl || "");
      submissionData.append("due_date", formData.dueDate);
      submissionData.append("debtor_balance", formData.amount);
      submissionData.append("statement_account", formData.statementFile);

      const response = await api.post("/request-payments", submissionData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200 || response.status === 201) {
        setSubmitSuccess(true);
      } else {
        setErrors((prev) => ({
          ...prev,
          submit: response.data?.message || "Failed to submit payment request.",
        }));
      }
    } catch (err) {
      console.error("Submission error:", err);
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to submit payment request. Please try again.";
      setErrors((prev) => ({
        ...prev,
        submit: serverMsg,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter based directly on what the user types in the input
  const filteredCountries = (countryOptions || []).filter(
    (c) =>
      c.label?.toLowerCase().includes(countryInputText.toLowerCase()) ||
      c.country_code?.toLowerCase().includes(countryInputText.toLowerCase())
  );

  const filteredPhoneCodes = (phoneOptions || []).filter(
    (p) =>
      p.label?.toLowerCase().includes(phoneInputText.toLowerCase()) ||
      p.phone_code?.includes(phoneInputText)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition mb-4 sm:mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back 
        </button>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
          <div className="px-4 py-5 sm:px-8 sm:py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Request to Pay
                </h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
                  Issue an invoice and request payment directly from your client
                </p>
              </div>
              <div className="flex items-center space-x-1.5 self-start sm:self-center bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-xs font-medium text-green-700 whitespace-nowrap">
                  Secure & Regulated
                </span>
              </div>
            </div>
          </div>

          {submitSuccess ? (
            <div className="p-6 sm:p-12 text-center">
              <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Payment Request Sent!
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-2 max-w-md mx-auto">
                Your payment request and attached statement document have been successfully dispatched.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCreateAnother}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-lg cursor-pointer"
                >
                  Create Another Request
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/home/${customerId}`)}
                  className="w-full sm:w-auto px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4 sm:space-y-6">
              {errors.submit && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>{errors.submit}</span>
                </div>
              )}

              {/* 1. Client Type */}
              <div id="field-clientType">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                  Client Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <label
                    className={`flex items-center justify-center gap-2 p-3 sm:p-3.5 rounded-xl border cursor-pointer font-medium text-xs sm:text-sm transition-all ${
                      formData.clientType === "3"
                        ? "border-blue-500 bg-blue-50/60 text-blue-700 shadow-sm"
                        : "border-gray-200 hover:bg-gray-50 text-gray-600"
                    } ${errors.clientType ? "border-red-500" : ""}`}
                  >
                    <input
                      type="radio"
                      name="clientType"
                      value="3"
                      checked={formData.clientType === "3"}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <User className="w-4 h-4" />
                    <span>Individual</span>
                  </label>

                  <label
                    className={`flex items-center justify-center gap-2 p-3 sm:p-3.5 rounded-xl border cursor-pointer font-medium text-xs sm:text-sm transition-all ${
                      formData.clientType === "23"
                        ? "border-blue-500 bg-blue-50/60 text-blue-700 shadow-sm"
                        : "border-gray-200 hover:bg-gray-50 text-gray-600"
                    } ${errors.clientType ? "border-red-500" : ""}`}
                  >
                    <input
                      type="radio"
                      name="clientType"
                      value="23"
                      checked={formData.clientType === "23"}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <Building2 className="w-4 h-4" />
                    <span>Corporate</span>
                  </label>
                </div>
                {errors.clientType && (
                  <p className="text-xs text-red-500 mt-1.5">{errors.clientType}</p>
                )}
              </div>

              {/* 2. Client Name Fields */}
              {formData.clientType === "23" && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="field-companyName"
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Acme International Ltd."
                    className={`w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border text-sm focus:outline-none transition ${
                      errors.companyName
                        ? "border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {errors.companyName && (
                    <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>
                  )}
                </div>
              )}

              {formData.clientType === "3" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="field-firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Jane"
                      className={`w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border text-sm focus:outline-none transition ${
                        errors.firstName
                          ? "border-red-500 focus:ring-2 focus:ring-red-200"
                          : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="field-lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      className={`w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border text-sm focus:outline-none transition ${
                        errors.lastName
                          ? "border-red-500 focus:ring-2 focus:ring-red-200"
                          : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      }`}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="field-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="client@company.com"
                    className={`w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border text-sm focus:outline-none transition ${
                      errors.email
                        ? "border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {/* Direct-Type Phone Code Dropdown */}
                    <div className="relative w-36 sm:w-40 flex-shrink-0" ref={phoneRef}>
                      <div
                        className={`h-full px-2.5 py-1 sm:py-1.5 rounded-xl border bg-white flex items-center gap-1.5 transition ${
                          errors.phoneCountryCode
                            ? "border-red-500 ring-1 ring-red-200"
                            : "border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
                        }`}
                      >
                        {formData.phoneCountryCode?.country?.flag_url ? (
                          <img
                            src={formData.phoneCountryCode.country.flag_url}
                            alt=""
                            className="w-4 h-3 object-cover rounded-xs flex-shrink-0"
                          />
                        ) : (
                          <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        )}
                        <input
                          id="field-phoneCountryCode"
                          type="text"
                          value={phoneInputText}
                          placeholder="Search code "
                          onFocus={() => setIsPhoneCodeOpen(true)}
                          onChange={(e) => {
                            setPhoneInputText(e.target.value);
                            setIsPhoneCodeOpen(true);
                          }}
                          className="w-full text-xs sm:text-sm text-gray-800 bg-transparent focus:outline-none font-medium"
                        />
                        <ChevronDown
                          onClick={() => setIsPhoneCodeOpen((prev) => !prev)}
                          className="w-3.5 h-3.5 text-gray-400 cursor-pointer flex-shrink-0"
                        />
                      </div>

                      {isPhoneCodeOpen && (
                        <div className="absolute top-full left-0 mt-1 w-64 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1.5">
                          <div className="space-y-0.5">
                            {filteredPhoneCodes.length > 0 ? (
                              filteredPhoneCodes.map((item) => (
                                <button
                                  key={item.value}
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      phoneCountryCode: item,
                                    }));
                                    setPhoneInputText(item.phone_code);
                                    setIsPhoneCodeOpen(false);
                                    if (errors.phoneCountryCode) {
                                      setErrors((prev) => ({
                                        ...prev,
                                        phoneCountryCode: null,
                                      }));
                                    }
                                  }}
                                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-50 text-gray-700 transition"
                                >
                                  <span className="flex items-center gap-2 truncate">
                                    {item.country?.flag_url && (
                                      <img
                                        src={item.country.flag_url}
                                        alt=""
                                        className="w-4 h-3 object-cover rounded-xs flex-shrink-0"
                                      />
                                    )}
                                    <span className="truncate">{item.country.name}</span>
                                  </span>
                                  <span className="font-semibold text-gray-500 ml-2">
                                    {item.phone_code}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <p className="text-xs text-gray-400 text-center py-2">
                                No codes match
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      id="field-mobileNumber"
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      className={`flex-1 min-w-0 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border text-sm focus:outline-none transition ${
                        errors.mobileNumber
                          ? "border-red-500 focus:ring-2 focus:ring-red-200"
                          : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      }`}
                    />
                  </div>
                  {(errors.phoneCountryCode || errors.mobileNumber) && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.phoneCountryCode || errors.mobileNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* 4. Country & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Direct-Type Country Dropdown */}
                <div className="relative" ref={countryRef}>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`w-full px-3.5 py-1.5 sm:py-2 rounded-xl border bg-white flex items-center gap-2 text-sm transition ${
                      errors.country
                        ? "border-red-500 ring-1 ring-red-200"
                        : "border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
                    }`}
                  >
                    {formData.country?.flag ? (
                      <img
                        src={formData.country.flag}
                        alt=""
                        className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0"
                      />
                    ) : (
                      <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <input
                      id="field-country"
                      type="text"
                      value={countryInputText}
                      placeholder="Search country "
                      onFocus={() => setIsCountryOpen(true)}
                      onChange={(e) => {
                        setCountryInputText(e.target.value);
                        setIsCountryOpen(true);
                      }}
                      className="w-full text-sm text-gray-800 bg-transparent focus:outline-none"
                    />
                    <ChevronDown
                      onClick={() => setIsCountryOpen((prev) => !prev)}
                      className="w-4 h-4 text-gray-400 cursor-pointer flex-shrink-0 ml-1"
                    />
                  </div>

                  {isCountryOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1.5">
                      <div className="space-y-0.5">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  country: c,
                                  ...(c.country_code !== "US" && c.country_code !== "CA"
                                    ? { state: "" }
                                    : {}),
                                }));
                                setCountryInputText(c.label);
                                setIsCountryOpen(false);
                                if (errors.country) {
                                  setErrors((prev) => ({ ...prev, country: null }));
                                }
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left hover:bg-blue-50 text-gray-700 transition"
                            >
                              <img
                                src={c.flag}
                                alt=""
                                className="w-4 h-3 object-cover rounded-xs flex-shrink-0"
                              />
                              <span className="truncate">{c.label}</span>
                            </button>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 text-center py-2">
                            No countries match
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {errors.country && (
                    <p className="text-xs text-red-500 mt-1">{errors.country}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    State / Province {isStateRequired && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id="field-state"
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder={
                      isStateRequired
                        ? "Required (e.g. California / Ontario)"
                        : "Optional"
                    }
                    className={`w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border text-sm focus:outline-none transition ${
                      errors.state
                        ? "border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {errors.state && (
                    <p className="text-xs text-red-500 mt-1">{errors.state}</p>
                  )}
                </div>
              </div>

              {/* 5. Currency, Amount, Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="relative" ref={currencyRef}>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <button
                    id="field-currency"
                    type="button"
                    onClick={() => setIsCurrencyOpen((prev) => !prev)}
                    className={`w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border bg-white flex items-center justify-between text-sm transition ${
                      errors.currency
                        ? "border-red-500"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`truncate ${
                        formData.currency
                          ? "font-semibold text-gray-800"
                          : "text-gray-400"
                      }`}
                    >
                      {formData.currency || "Select"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>

                  {isCurrencyOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1.5">
                      {CURRENCY_CONFIG.map((curr) => (
                        <button
                          key={curr.code}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, currency: curr.code }));
                            setIsCurrencyOpen(false);
                            if (errors.currency) {
                              setErrors((prev) => ({ ...prev, currency: null }));
                            }
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition ${
                            formData.currency === curr.code
                              ? "bg-blue-50 text-blue-700 font-semibold"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <span className="font-medium text-gray-800">{curr.code}</span>
                          <span className="text-gray-400 text-[11px]">{curr.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.currency && (
                    <p className="text-xs text-red-500 mt-1">{errors.currency}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                    <input
                      id="field-amount"
                      type="number"
                      step="0.01"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className={`w-full pl-9 pr-3.5 py-2.5 sm:pr-4 sm:py-3 rounded-xl border text-sm focus:outline-none transition ${
                        errors.amount
                          ? "border-red-500 focus:ring-2 focus:ring-red-200"
                          : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      }`}
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="field-dueDate"
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className={`w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border text-sm focus:outline-none transition ${
                      errors.dueDate
                        ? "border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                  {errors.dueDate && (
                    <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>
                  )}
                </div>
              </div>

              {/* 6. Reason for Request & Website Address (Same Row) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Reason Dropdown (No Search Bar) */}
                <div className="relative" ref={reasonRef}>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Reason for Request <span className="text-red-500">*</span>
                  </label>
                  <button
                    id="field-reason"
                    type="button"
                    onClick={() => setIsReasonOpen((prev) => !prev)}
                    className={`w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border bg-white flex items-center justify-between text-sm transition ${
                      errors.reason
                        ? "border-red-500"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileQuestion className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span
                        className={`truncate ${
                          formData.reason ? "text-gray-800" : "text-gray-400"
                        }`}
                      >
                        {formData.reason?.purpose_name ||
                          formData.reason?.name ||
                          formData.reason?.label ||
                          "Select Payment Reason"}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-1" />
                  </button>

                  {isReasonOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1.5">
                      <div className="space-y-0.5">
                        {reasonsLoading ? (
                          <p className="text-xs text-gray-400 text-center py-3">
                            Loading reasons...
                          </p>
                        ) : reasonsList.length > 0 ? (
                          reasonsList.map((item, idx) => {
                            const label =
                              item.purpose_name || item.name || item.label || "";
                            return (
                              <button
                                key={item.id || item.purpose_id || idx}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    reason: item,
                                  }));
                                  setIsReasonOpen(false);
                                  if (errors.reason) {
                                    setErrors((prev) => ({
                                      ...prev,
                                      reason: null,
                                    }));
                                  }
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left hover:bg-blue-50 text-gray-700 transition"
                              >
                                <span className="truncate">{label}</span>
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-xs text-gray-400 text-center py-2">
                            No reasons found
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {errors.reason && (
                    <p className="text-xs text-red-500 mt-1">{errors.reason}</p>
                  )}
                </div>

                {/* Website Address */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Website Address{" "}
                  </label>
                  <input
                    id="field-websiteUrl"
                    type="url"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleInputChange}
                    placeholder="https://companywebsite.com"
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              {/* 7. Statement Document Upload */}
              <div id="field-statementFile">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Statement / Invoice Document <span className="text-red-500">*</span>
                </label>

                {!formData.statementFile ? (
                  <label
                    className={`flex flex-col items-center justify-center p-5 sm:p-6 border-2 border-dashed rounded-xl sm:rounded-2xl cursor-pointer hover:bg-gray-50/60 transition ${
                      errors.statementFile
                        ? "border-red-400 bg-red-50/20"
                        : "border-gray-300"
                    }`}
                  >
                    <UploadCloud className="w-8 h-8 sm:w-9 sm:h-9 text-gray-400 mb-2" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">
                      Click to upload or drag & drop statement
                    </span>
                    <span className="text-[11px] sm:text-xs text-gray-400 mt-0.5 text-center">
                      PDF, PNG, JPG, or DOCX (up to 10MB)
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.docx"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50/40 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden min-w-0">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="truncate min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {formData.statementFile.name}
                        </p>
                        <p className="text-[11px] sm:text-xs text-gray-500">
                          {(formData.statementFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition flex-shrink-0 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {errors.statementFile && (
                  <p className="text-xs text-red-500 mt-1.5">{errors.statementFile}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-center cursor-pointer"
                >
                  {isSubmitting ? "Submitting..." : "Send Request to Pay"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default RequestToPay;