// features/Beneficiary/EditBeneficiary/EditBeneficiaryPage.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";

import {
  fetchBeneficiaryById, // This uses /benef-view/ endpoint
  clearError,
  clearSuccess,
  clearEditState,
  selectBeneficiaryDetails,
  selectEditBeneficiaryLoading,
  selectEditBeneficiaryError,
  selectBeneficiariesSuccess,
  selectBeneficiariesError,
} from "../MyBeneficiaries/BeneficiariesSlice";

// IMPORT FROM addBeneficiarySlice.js - For CRUD operations and dropdowns
import {
  updateBeneficiary, // This uses different endpoint
  updateBeneficiaryBank,
  addBeneficiaryBank,
  deleteBeneficiaryBank,
  // Dropdown data actions
  fetchNationalities,
  fetchBanksByCurrency,
  fetchIdTypesByCurrency,
  fetchCitiesByCountry,
  fetchBankBranches,
  // Selectors
  selectNationalities,
  selectBanks,
  selectIdTypes,
  selectCities,
  selectBankBranches,
  selectDropdownLoading,
  selectDropdownError,
} from "../AddBeneficiary/addBeneficiarySlice";

import {
  selectCountriesOptionsSafe,
  selectPhoneCodeOptions,
  fetchCountries,
} from "../../../features/Auth/slices/countrySlice";

import {
  FaArrowLeft,
  FaSave,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaIdCard,
  FaGlobe,
  FaBirthdayCake,
  FaVenusMars,
  FaUniversity,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaChevronRight,
  FaBuilding,
  FaMoneyBillWave,
  FaHandshake,
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCreditCard,
  FaMoneyCheckAlt,
  FaGlobeAmericas,
} from "react-icons/fa";

const EditBeneficiaryPage = () => {
  const { beneficiaryId } = useParams();
  const customerId = localStorage.getItem("authcustomer_id");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Selectors
  const beneficiaryDetails = useSelector(selectBeneficiaryDetails);
  const loading = useSelector(selectEditBeneficiaryLoading);
  const error = useSelector(selectEditBeneficiaryError);
  const updateSuccess = useSelector(selectBeneficiariesSuccess);
  const updateError = useSelector(selectBeneficiariesError);
  
  // Dropdown selectors from addBeneficiarySlice
  const nationalities = useSelector(selectNationalities);
  const banks = useSelector(selectBanks);
  const idTypes = useSelector(selectIdTypes);
  const cities = useSelector(selectCities);
  const bankBranches = useSelector(selectBankBranches);
  const dropdownLoading = useSelector(selectDropdownLoading);
  const dropdownError = useSelector(selectDropdownError);
  
  // Country selectors
  const countries = useSelector(selectCountriesOptionsSafe);
  const phoneCodeOptions = useSelector(selectPhoneCodeOptions);

  // State
  const [phoneData, setPhoneData] = useState({
    country_phone_code: "",
    phone_number: "",
    full_phone_number: "",
  });

  const [beneficiaryBanks, setBeneficiaryBanks] = useState([]);
  const [editingBankId, setEditingBankId] = useState(null);
  const [addingNewBank, setAddingNewBank] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    address: false,
    identification: false,
    additional: false,
    bank: true,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [currency, setCurrency] = useState("USD"); // Track current currency

  // Bank form state
  const [bankFormData, setBankFormData] = useState({
    bank_acc_no: "",
    bank_name: "",
    bank_branch_name: "",
    bank_branch: "",
    bank_address: "",
    bank_city: "",
    bank_state: "",
    bank_country: "",
    currency_code: "",
    rails: "Local",
    swift: "",
    ifsc: "",
    bic_code: "",
    sort_code: "",
    routing_number: "",
    account_type: "",
    status: 1,
    bank_code: "", // Added for branch fetching
  });

  // Currency options
  const currencyOptions = [
    { value: "USD", label: "USD - US Dollar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - British Pound" },
    { value: "NPR", label: "NPR - Nepalese Rupee" },
    { value: "INR", label: "INR - Indian Rupee" },
    { value: "AUD", label: "AUD - Australian Dollar" },
    { value: "CAD", label: "CAD - Canadian Dollar" },
    { value: "AED", label: "AED - UAE Dirham" },
    { value: "BDT", label: "BDT - Bangladeshi Taka" },
    { value: "PKR", label: "PKR - Pakistani Rupee" },
    { value: "KES", label: "KES - Kenyan Shilling" },
    { value: "NGN", label: "NGN - Nigerian Naira" },
    { value: "DKK", label: "DKK - Danish Krone" },
    { value: "LKR", label: "LKR - Sri Lankan Rupee" },
  ];

  // Rails/Transfer method options
  const railsOptions = [
    { value: "Local", label: "Local Transfer" },
    { value: "SWIFT", label: "SWIFT Transfer" },
    { value: "SEPA", label: "SEPA Transfer" },
    { value: "ACH", label: "ACH Transfer" },
    { value: "FPS", label: "Faster Payments" },
    { value: "Domestic", label: "Domestic Transfer" },
    { value: "International", label: "International Wire" },
    { value: "Mobile", label: "Mobile Wallet" },
  ];

  // Account type options
  const accountTypeOptions = [
    { value: "savings", label: "Savings Account" },
    { value: "checking", label: "Checking Account" },
    { value: "current", label: "Current Account" },
    { value: "salary", label: "Salary Account" },
    { value: "Business Savings", label: "Business Savings" },
    { value: "Business Checkings", label: "Business Checkings" },
    { value: "Personal Checkings", label: "Personal Checkings" },
    { value: "Personal Savings", label: "Personal Savings" },
  ];

  // Dropdown options
  const dropdowns = {
    idTypes: [
      { id: "passport", name: "Passport" },
      { id: "national_id", name: "National ID" },
      { id: "drivers_license", name: "Driver's License" },
      { id: "other", name: "Other" },
    ],
    genders: [
      { id: "1", name: "Male" },
      { id: "2", name: "Female" },
      { id: "3", name: "Other" },
    ],
    relationships: [
      { id: "friend", name: "Friend" },
      { id: "family", name: "Family" },
      { id: "business", name: "Business Partner" },
      { id: "employee", name: "Employee" },
      { id: "other", name: "Other" },
    ],
  };

  // Form state
  const [formData, setFormData] = useState({
    // Personal Information
    first_name: "",
    middle_name: "",
    last_name: "",
    name: "", // Added - from non-redux version
    email: "",
    phone_number: "",
    full_phone_number: "",
    country_phone_code: "",

    // Address Information
    street: "",
    address: "", // Added - from non-redux version
    city: "",
    state: "",
    postalcode: "",
    pincode: "", // Added - from non-redux version (maps to postalcode)
    country_id: "",

    // Nationality & Identification
    nationality_id: "",
    dob: "",
    gender_id: "",
    beneficiary_id_type: "",
    beneficiary_id_number: "",
    beneficiary_id_date_of_issue: "",
    beneficiary_id_date_of_expiry: "",

    // Employment & Purpose
    occupation: "",
    income_source: "",
    transfer_purpose: "",
    relationtobenef: "",

    // Bank Information (from non-redux version)
    ifsc: "", // Added
    bank_name: "", // Added
    bank_acc_no: "", // Added
    sort_code: "", // Added

    // Type & Status
    beneftype: "individual",
    status: 1,
    is_visible: true,

    // Customer reference
    customer_id: "", // Added - from non-redux version

    // Additional fields that might be needed
    idTypes: [{ type_id: "1", type_number: "", id_issuance_country: "" }], // Added for ID types array
  });

  // ===================== HELPER FUNCTIONS =====================

  // Get banks for current currency
  const getBanksForCurrency = (curr = currency) => {
    if (["BDT", "LKR", "AUD", "PKR"].includes(curr)) {
      return banks[`${curr}_int`] || [];
    }
    return banks[curr] || [];
  };

  // Get ID types for current currency
  const getIdTypesForCurrency = () => {
    return idTypes[currency] || [];
  };

  // Get cities for selected country
  const getCitiesForCountry = () => {
    return cities[formData.country_id] || [];
  };

  // Get bank branches for selected bank
  const getBankBranches = () => {
    const currentBankCode = bankFormData.bank_code || beneficiaryBanks[0]?.bank_code;
    return currentBankCode ? bankBranches[currentBankCode] || [] : [];
  };

  // Handle currency change
  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    console.log("=== CURRENCY CHANGE START ===");
    console.log("New currency selected:", newCurrency);
    console.log("Previous currency:", currency);
    
    setCurrency(newCurrency);
    
    // Update bank form currency
    if (bankFormData.currency_code !== newCurrency) {
      setBankFormData(prev => ({
        ...prev,
        currency_code: newCurrency,
      }));
    }

    // ✅ Fetch banks for the new currency
    console.log("Fetching banks for currency:", newCurrency);
    console.log(
      "Is int-bank currency?",
      ["BDT", "LKR", "AUD", "PKR"].includes(newCurrency)
    );

    if (["BDT", "LKR", "AUD", "PKR"].includes(newCurrency)) {
      await dispatch(
        fetchBanksByCurrency({ currency: newCurrency, bankType: "int-banks" })
      ).unwrap();
    } else {
      await dispatch(
        fetchBanksByCurrency({
          currency: newCurrency,
          bankType: "currency-payout-banks",
        })
      ).unwrap();
    }

    // ✅ Fetch ID types for BDT, INR, PKR when selected
    if (["BDT", "INR", "PKR"].includes(newCurrency)) {
      console.log(`Fetching ID types for ${newCurrency}...`);
      await dispatch(fetchIdTypesByCurrency(newCurrency)).unwrap();
    }

    console.log("=== CURRENCY CHANGE END ===");
  };

  // ===================== BANK FUNCTIONS =====================

  // Initialize bank form for editing
  const initBankEdit = (bank) => {
    setEditingBankId(bank.id);
    setBankFormData({
      bank_acc_no: bank.bank_acc_no || "",
      bank_name: bank.bank_name || "",
      bank_branch_name: bank.bank_branch_name || "",
      bank_branch: bank.bank_branch || "",
      bank_address: bank.bank_address || "",
      bank_city: bank.bank_city || "",
      bank_state: bank.bank_state || "",
      bank_country: bank.bank_country || "",
      currency_code: bank.currency_code || currency,
      rails: bank.rails || "Local",
      swift: bank.swift || "",
      ifsc: bank.ifsc || "",
      bic_code: bank.bic_code || "",
      sort_code: bank.sort_code || "",
      routing_number: bank.routing_number || "",
      account_type: bank.account_type || "",
      status: bank.status || 1,
      bank_code: bank.bank_code || "",
    });

    // Set currency from bank
    if (bank.currency_code && bank.currency_code !== currency) {
      setCurrency(bank.currency_code);
    }

    // Fetch bank branches if bank code exists
    if (bank.bank_code) {
      dispatch(fetchBankBranches(bank.bank_code));
    }
  };

  // Initialize new bank form
  const initNewBank = () => {
    setAddingNewBank(true);
    setEditingBankId(null);
    setBankFormData({
      bank_acc_no: "",
      bank_name: "",
      bank_branch_name: "",
      bank_branch: "",
      bank_address: "",
      bank_city: "",
      bank_state: "",
      bank_country: "",
      currency_code: currency,
      rails: "Local",
      swift: "",
      ifsc: "",
      bic_code: "",
      sort_code: "",
      routing_number: "",
      account_type: "",
      status: 1,
      bank_code: "",
    });
  };

  // Cancel bank editing/adding
  const cancelBankEdit = () => {
    setEditingBankId(null);
    setAddingNewBank(false);
    setBankFormData({
      bank_acc_no: "",
      bank_name: "",
      bank_branch_name: "",
      bank_branch: "",
      bank_address: "",
      bank_city: "",
      bank_state: "",
      bank_country: "",
      currency_code: currency,
      rails: "Local",
      swift: "",
      ifsc: "",
      bic_code: "",
      sort_code: "",
      routing_number: "",
      account_type: "",
      status: 1,
      bank_code: "",
    });
  };

  // Handle bank form input changes
  const handleBankInputChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    const updatedData = {
      ...bankFormData,
      [name]: newValue,
    };
    
    setBankFormData(updatedData);

    // If bank code changes, fetch branches
    if (name === "bank_code" && value) {
      await dispatch(fetchBankBranches(value)).unwrap();
    }

    // If bank name is selected from dropdown, get the bank code
    if (name === "bank_name" && value) {
      const selectedBank = getBanksForCurrency(bankFormData.currency_code || currency).find(
        (bank) => bank.name === value || bank.bank_name === value
      );
      if (selectedBank) {
        const bankCode = selectedBank.bank_code || selectedBank.id;
        setBankFormData(prev => ({
          ...prev,
          bank_code: bankCode,
        }));
        
        // Fetch branches for this bank
        if (bankCode) {
          await dispatch(fetchBankBranches(bankCode)).unwrap();
        }
      }
    }
  };

  // Save bank changes
  const saveBankChanges = async () => {
    // Validate bank form
    if (!bankFormData.bank_acc_no.trim()) {
      toast.error("Account number is required");
      return;
    }
    if (!bankFormData.bank_name.trim()) {
      toast.error("Bank name is required");
      return;
    }
    if (!bankFormData.currency_code) {
      toast.error("Currency is required");
      return;
    }

    try {
      if (editingBankId) {
        // Update existing bank
        await dispatch(
          updateBeneficiaryBank({
            beneficiaryId,
            bankId: editingBankId,
            bankData: bankFormData,
          })
        ).unwrap();
        toast.success("Bank account updated successfully!");
      } else if (addingNewBank) {
        // Add new bank
        await dispatch(
          addBeneficiaryBank({
            beneficiaryId,
            bankData: {
              ...bankFormData,
              benef_id: beneficiaryId,
            },
          })
        ).unwrap();
        toast.success("Bank account added successfully!");
      }

      // Refresh beneficiary data
      dispatch(fetchBeneficiaryById(beneficiaryId));
      cancelBankEdit();
    } catch (error) {
      console.error("Bank operation error:", error);
      toast.error(error.message || "Failed to save bank account");
    }
  };

  // Delete bank account
  const deleteBankAccount = async (bankId) => {
    if (window.confirm("Are you sure you want to delete this bank account?")) {
      try {
        await dispatch(
          deleteBeneficiaryBank({
            beneficiaryId,
            bankId,
          })
        ).unwrap();
        toast.success("Bank account deleted successfully!");
        dispatch(fetchBeneficiaryById(beneficiaryId));
      } catch (error) {
        console.error("Delete bank error:", error);
        toast.error(error.message || "Failed to delete bank account");
      }
    }
  };

  // ===================== FORM FUNCTIONS =====================

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Validation functions
  const validateField = (name, value) => {
    const errors = { ...validationErrors };

    switch (name) {
      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = "Please enter a valid email address";
        } else {
          delete errors.email;
        }
        break;
      case "phone_number":
        if (value && !/^[\d\s\-\+\(\)]{10,15}$/.test(value)) {
          errors.phone_number = "Please enter a valid phone number";
        } else {
          delete errors.phone_number;
        }
        break;
      case "first_name":
      case "last_name":
        if (!value.trim()) {
          errors[name] = "This field is required";
        } else {
          delete errors[name];
        }
        break;
      default:
        break;
    }

    setValidationErrors(errors);
  };

  // ===================== USE EFFECTS =====================

  // Fetch all dropdown data on mount
  useEffect(() => {
    const fetchAllDropdownData = async () => {
      try {
        console.log("📥 Fetching all dropdown data...");
        
        // Fetch nationalities and countries
        await Promise.all([
          dispatch(fetchNationalities()).unwrap(),
          dispatch(fetchCountries()).unwrap(),
        ]);
        
        console.log("✅ Nationalities and countries loaded");
        
      } catch (error) {
        console.error("❌ Error fetching dropdown data:", error);
        toast.error("Failed to load dropdown options");
      }
    };

    fetchAllDropdownData();
  }, [dispatch]);

  // Fetch beneficiary details
  useEffect(() => {
    if (beneficiaryId) {
      console.log("🔍 Fetching beneficiary details for ID:", beneficiaryId);
      dispatch(fetchBeneficiaryById(beneficiaryId));
    }

    return () => {
      dispatch(clearEditState());
    };
  }, [beneficiaryId, dispatch]);

  // When beneficiary details load, fetch related dropdowns
  useEffect(() => {
    const fetchRelatedDropdowns = async () => {
      if (beneficiaryDetails) {
        console.log("📋 Beneficiary details loaded, fetching related dropdowns:", beneficiaryDetails);
        
        // Extract currency from banks or set default
        let beneficiaryCurrency = currency;
        if (beneficiaryDetails.benef_banks && beneficiaryDetails.benef_banks.length > 0) {
          beneficiaryCurrency = beneficiaryDetails.benef_banks[0].currency_code || currency;
        }
        setCurrency(beneficiaryCurrency);
        
        console.log("💰 Setting currency to:", beneficiaryCurrency);

        try {
          // Fetch banks for the beneficiary's currency
          const isIntBank = ["BDT", "LKR", "AUD", "PKR"].includes(beneficiaryCurrency);
          await dispatch(
            fetchBanksByCurrency({
              currency: beneficiaryCurrency,
              bankType: isIntBank ? "int-banks" : "currency-payout-banks",
            })
          ).unwrap();
          console.log("✅ Banks fetched for currency:", beneficiaryCurrency);

          // Fetch ID types if currency requires it
          if (["BDT", "INR", "PKR"].includes(beneficiaryCurrency)) {
            await dispatch(fetchIdTypesByCurrency(beneficiaryCurrency)).unwrap();
            console.log("✅ ID types fetched for currency:", beneficiaryCurrency);
          }

          // Fetch cities for the beneficiary's country
          if (beneficiaryDetails.country_id) {
            await dispatch(fetchCitiesByCountry(beneficiaryDetails.country_id)).unwrap();
            console.log("✅ Cities fetched for country:", beneficiaryDetails.country_id);
          }

          // Fetch bank branches if any bank exists
          if (beneficiaryDetails.benef_banks && beneficiaryDetails.benef_banks.length > 0) {
            const firstBank = beneficiaryDetails.benef_banks[0];
            if (firstBank.bank_code) {
              await dispatch(fetchBankBranches(firstBank.bank_code)).unwrap();
              console.log("✅ Bank branches fetched for bank code:", firstBank.bank_code);
            }
          }
        } catch (error) {
          console.error("❌ Error fetching related dropdowns:", error);
        }
      }
    };

    fetchRelatedDropdowns();
  }, [beneficiaryDetails, dispatch]);

  // Populate form with beneficiary details
  useEffect(() => {
    if (beneficiaryDetails) {
      console.log("📋 Populating form with beneficiaryDetails:", beneficiaryDetails);

      const newFormData = {
        // Personal Information
        first_name: beneficiaryDetails.first_name || "",
        middle_name: beneficiaryDetails.middle_name || "",
        last_name: beneficiaryDetails.last_name || "",
        name:
          beneficiaryDetails.name ||
          `${beneficiaryDetails.first_name || ""} ${
            beneficiaryDetails.last_name || ""
          }`.trim(),
        email: beneficiaryDetails.email || "",
        phone_number: beneficiaryDetails.phone_number || "",
        full_phone_number: beneficiaryDetails.full_phone_number || "",
        country_phone_code: beneficiaryDetails.country_phone_code || "",

        // Address Information
        street: beneficiaryDetails.street || "",
        address: beneficiaryDetails.address || beneficiaryDetails.street || "",
        city: beneficiaryDetails.city || "",
        state: beneficiaryDetails.state || "",
        postalcode: beneficiaryDetails.postalcode || "",
        pincode:
          beneficiaryDetails.pincode || beneficiaryDetails.postalcode || "",
        country_id: beneficiaryDetails.country_id
          ? String(beneficiaryDetails.country_id)
          : "",

        // Nationality & Identification
        nationality_id: beneficiaryDetails.nationality_id
          ? String(beneficiaryDetails.nationality_id)
          : "",
        dob: beneficiaryDetails.dob ? beneficiaryDetails.dob.split(" ")[0] : "",
        gender_id: beneficiaryDetails.gender_id
          ? String(beneficiaryDetails.gender_id)
          : "",
        beneficiary_id_type: beneficiaryDetails.beneficiary_id_type || "",
        beneficiary_id_number: beneficiaryDetails.beneficiary_id_number || "",
        beneficiary_id_date_of_issue:
          beneficiaryDetails.beneficiary_id_date_of_issue
            ? beneficiaryDetails.beneficiary_id_date_of_issue.split(" ")[0]
            : "",
        beneficiary_id_date_of_expiry:
          beneficiaryDetails.beneficiary_id_date_of_expiry
            ? beneficiaryDetails.beneficiary_id_date_of_expiry.split(" ")[0]
            : "",

        // Employment & Purpose
        occupation: beneficiaryDetails.occupation || "",
        income_source: beneficiaryDetails.income_source || "",
        transfer_purpose: beneficiaryDetails.transfer_purpose || "",
        relationtobenef: beneficiaryDetails.relationtobenef || "",

        // Bank Information (from API response)
        ifsc: beneficiaryDetails.ifsc || "",
        bank_name: beneficiaryDetails.bank_name || "",
        bank_acc_no: beneficiaryDetails.bank_acc_no || "",
        sort_code: beneficiaryDetails.sort_code || "",

        // Type & Status
        beneftype: beneficiaryDetails.beneftype || "individual",
        status: beneficiaryDetails.status || 1,
        is_visible: beneficiaryDetails.status === 1,

        // Customer reference
        customer_id: beneficiaryDetails.customer_id || customerId || "",

        // ID types array
        idTypes: beneficiaryDetails.id_types || [
          { type_id: "1", type_number: "", id_issuance_country: "" },
        ],
      };

      console.log("✅ Set formData:", newFormData);
      setFormData(newFormData);

      // Set phone data
      setPhoneData({
        country_phone_code: beneficiaryDetails.country_phone_code || "",
        phone_number: beneficiaryDetails.phone_number || "",
        full_phone_number: beneficiaryDetails.full_phone_number || "",
      });

      // Set banks data
      if (
        beneficiaryDetails.benef_banks &&
        Array.isArray(beneficiaryDetails.benef_banks)
      ) {
        console.log(
          "🏦 Setting banks from benef_banks:",
          beneficiaryDetails.benef_banks
        );
        setBeneficiaryBanks(beneficiaryDetails.benef_banks);
        
        // Set currency from first bank
        if (beneficiaryDetails.benef_banks.length > 0 && beneficiaryDetails.benef_banks[0].currency_code) {
          setCurrency(beneficiaryDetails.benef_banks[0].currency_code);
        }
      } else {
        console.log("❌ No benef_banks found or not an array");
        setBeneficiaryBanks([]);
      }
    }
  }, [beneficiaryDetails, customerId]);

  // Handle input changes with validation
  const handleInputChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Validate field
    validateField(name, newValue);

    // Handle phone number changes
    if (name === "phone_number") {
      const fullPhoneNumber = phoneData.country_phone_code
        ? `${phoneData.country_phone_code}${value}`
        : value;
      setFormData((prev) => ({
        ...prev,
        full_phone_number: fullPhoneNumber,
      }));
      setPhoneData((prev) => ({
        ...prev,
        phone_number: value,
        full_phone_number: fullPhoneNumber,
      }));
    }

    // If country changes, fetch cities
    if (name === "country_id" && value) {
      await dispatch(fetchCitiesByCountry(value)).unwrap();
    }
  };

  // Handle phone country code change
  const handlePhoneCodeChange = (e) => {
    const countryPhoneCode = e.target.value;
    const fullPhoneNumber = countryPhoneCode
      ? `${countryPhoneCode}${formData.phone_number}`
      : formData.phone_number;

    setPhoneData({
      country_phone_code: countryPhoneCode,
      phone_number: formData.phone_number,
      full_phone_number: fullPhoneNumber,
    });

    setFormData((prev) => ({
      ...prev,
      country_phone_code: countryPhoneCode,
      full_phone_number: fullPhoneNumber,
    }));
  };

  // Handle country change
  const handleCountryChange = async (e) => {
    const countryId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      country_id: countryId,
    }));

    const selectedCountry = countries.find(
      (country) =>
        country.id === parseInt(countryId) ||
        country.value === parseInt(countryId)
    );

    if (selectedCountry && selectedCountry.phoneCode) {
      const fullPhoneNumber = selectedCountry.phoneCode
        ? `${selectedCountry.phoneCode}${formData.phone_number}`
        : formData.phone_number;

      setPhoneData((prev) => ({
        ...prev,
        country_phone_code: selectedCountry.phoneCode,
        full_phone_number: fullPhoneNumber,
      }));

      setFormData((prev) => ({
        ...prev,
        country_phone_code: selectedCountry.phoneCode,
        full_phone_number: fullPhoneNumber,
      }));
    }

    // Fetch cities for the selected country
    if (countryId) {
      await dispatch(fetchCitiesByCountry(countryId)).unwrap();
    }
  };

  // Form submission with validation
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const errors = {};
    if (!formData.first_name.trim())
      errors.first_name = "First name is required";
    if (!formData.last_name.trim()) errors.last_name = "Last name is required";
    if (!formData.phone_number.trim())
      errors.phone_number = "Phone number is required";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Create update data matching the non-redux version structure
      const updateData = {
        customer_id: customerId,
        first_name: formData.first_name,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name,
        name: `${formData.first_name} ${formData.last_name}`.trim(),
        email: formData.email || null,
        phone_number: formData.phone_number,
        full_phone_number: formData.full_phone_number,
        country_phone_code: formData.country_phone_code,
        street: formData.street || null,
        city: formData.city || null,
        state: formData.state || null,
        postalcode: formData.postalcode || null,
        pincode: formData.postalcode || null,
        country_id: formData.country_id ? parseInt(formData.country_id) : null,
        nationality_id: formData.nationality_id
          ? parseInt(formData.nationality_id)
          : null,
        dob: formData.dob || null,
        gender_id: formData.gender_id ? parseInt(formData.gender_id) : null,
        beneficiary_id_type: formData.beneficiary_id_type || null,
        beneficiary_id_number: formData.beneficiary_id_number || null,
        beneficiary_id_date_of_issue:
          formData.beneficiary_id_date_of_issue || null,
        beneficiary_id_date_of_expiry:
          formData.beneficiary_id_date_of_expiry || null,
        occupation: formData.occupation || null,
        income_source: formData.income_source || null,
        transfer_purpose: formData.transfer_purpose || null,
        relationtobenef: formData.relationtobenef || null,
        beneftype: formData.beneftype || "individual",
        status: formData.status || 1,
        address: formData.street || null,
        ifsc: formData.ifsc || null,
        bank_name: formData.bank_name || null,
        bank_acc_no: formData.bank_acc_no || null,
        sort_code: formData.sort_code || null,
      };

      console.log("📤 Sending update data:", updateData);

      await dispatch(
        updateBeneficiary({
          customerId,
          beneficiaryId: beneficiaryId,
          beneficiaryData: updateData,
        })
      ).unwrap();

      toast.success("Beneficiary updated successfully!");

      setTimeout(() => {
        navigate(`/beneficiaries/${customerId}`);
      }, 1500);
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update beneficiary");
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(`/beneficiaries/${customerId}`);
  };

  // Handle errors and success messages
  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`);
      dispatch(clearError());
    }

    if (updateError) {
      toast.error(`Update Error: ${updateError}`);
      dispatch(clearError());
    }

    if (updateSuccess) {
      toast.success("Beneficiary updated successfully!");
      dispatch(clearSuccess());
    }

    if (dropdownError) {
      toast.error(`Dropdown Error: ${dropdownError}`);
    }
  }, [error, updateError, updateSuccess, dropdownError, dispatch]);

  // Loading state
  if (loading && !beneficiaryDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center">
        <div className="text-center">
          <ClipLoader color="#2563eb" size={60} />
          <p className="mt-4 text-gray-600 text-lg font-medium">
            Loading beneficiary details...
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Please wait while we fetch the information
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !beneficiaryDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaExclamationTriangle className="text-red-500 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            Error Loading Beneficiary
          </h2>
          <p className="text-gray-600 mb-6 text-center">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleBack}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
            >
              Back to Beneficiaries
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 group"
              >
                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Edit Beneficiary
                </h1>
                <p className="text-gray-600 mt-1">
                  Update details for{" "}
                  <span className="font-semibold text-blue-600">
                    {beneficiaryDetails?.name || "Beneficiary"}
                  </span>
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    formData.status === 1
                      ? "bg-green-500 animate-pulse"
                      : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-sm font-medium text-gray-700">
                  {formData.status === 1 ? "Active" : "Inactive"} Beneficiary
                </span>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <span className="font-medium text-gray-900">Edit Details</span>
              </div>
              <FaChevronRight className="text-gray-400" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <span className="text-gray-500">Bank Accounts</span>
              </div>
              <FaChevronRight className="text-gray-400" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <span className="text-gray-500">Review</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bank Account Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <FaUniversity className="text-white text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Bank Account Information
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {beneficiaryBanks.length} bank account(s) linked
                  </p>
                </div>
              </div>
              <button
                onClick={initNewBank}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                <FaPlus />
                <span>Add Bank Account</span>
              </button>
            </div>

            {/* Add/Edit Bank Form */}
            {(addingNewBank || editingBankId) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 bg-gradient-to-r from-blue-50 to-white p-6 rounded-2xl border border-blue-200"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingBankId
                      ? "Edit Bank Account"
                      : "Add New Bank Account"}
                  </h3>
                  <button
                    onClick={cancelBankEdit}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaCreditCard className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="bank_acc_no"
                        value={bankFormData.bank_acc_no}
                        onChange={handleBankInputChange}
                        className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter account number"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name *
                    </label>
                    <select
                      name="bank_name"
                      value={bankFormData.bank_name}
                      onChange={handleBankInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    >
                      <option value="">Select Bank</option>
                      {getBanksForCurrency(bankFormData.currency_code || currency).map((bank) => (
                        <option key={bank.id || bank.bank_code} value={bank.name || bank.bank_name}>
                          {bank.name || bank.bank_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency *
                    </label>
                    <select
                      name="currency_code"
                      value={bankFormData.currency_code}
                      onChange={(e) => {
                        handleBankInputChange(e);
                        handleCurrencyChange(e);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    >
                      <option value="">Select Currency</option>
                      {currencyOptions.map((currency) => (
                        <option key={currency.value} value={currency.value}>
                          {currency.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transfer Method *
                    </label>
                    <select
                      name="rails"
                      value={bankFormData.rails}
                      onChange={handleBankInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      {railsOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Type
                    </label>
                    <select
                      name="account_type"
                      value={bankFormData.account_type}
                      onChange={handleBankInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="">Select Account Type</option>
                      {accountTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic Branch Dropdown (for BDT/LKR/AUD/PKR) */}
                  {bankFormData.bank_code && ["BDT", "LKR", "AUD", "PKR"].includes(bankFormData.currency_code || currency) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Branch
                      </label>
                      <select
                        name="bank_branch_name"
                        value={bankFormData.bank_branch_name}
                        onChange={handleBankInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      >
                        <option value="">Select Branch</option>
                        {getBankBranches().map((branch) => (
                          <option key={branch.branch_code} value={branch.bank_branch_name}>
                            {branch.bank_branch_name} - {branch.branch_code}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Manual Branch Input for other currencies */}
                  {!["BDT", "LKR", "AUD", "PKR"].includes(bankFormData.currency_code || currency) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Branch Name
                      </label>
                      <input
                        type="text"
                        name="bank_branch_name"
                        value={bankFormData.bank_branch_name}
                        onChange={handleBankInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter branch name"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SWIFT/BIC Code
                    </label>
                    <input
                      type="text"
                      name="swift"
                      value={bankFormData.swift}
                      onChange={handleBankInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter SWIFT/BIC code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      name="ifsc"
                      value={bankFormData.ifsc}
                      onChange={handleBankInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter IFSC code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={bankFormData.status}
                      onChange={handleBankInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>

                  {/* Additional optional fields */}
                  <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank City
                      </label>
                      <input
                        type="text"
                        name="bank_city"
                        value={bankFormData.bank_city}
                        onChange={handleBankInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter bank city"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank State
                      </label>
                      <input
                        type="text"
                        name="bank_state"
                        value={bankFormData.bank_state}
                        onChange={handleBankInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter bank state"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Routing Number
                      </label>
                      <input
                        type="text"
                        name="routing_number"
                        value={bankFormData.routing_number}
                        onChange={handleBankInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter routing number"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={cancelBankEdit}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveBankChanges}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <FaSave />
                    <span>
                      {editingBankId
                        ? "Update Bank Account"
                        : "Add Bank Account"}
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Bank Accounts List */}
            <div className="space-y-4">
              {beneficiaryBanks.length === 0 && !addingNewBank ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaUniversity className="text-gray-400 text-3xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Bank Accounts Added
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Add bank accounts to enable transfers to this beneficiary
                  </p>
                  <button
                    onClick={initNewBank}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    <FaPlus />
                    <span>Add Your First Bank Account</span>
                  </button>
                </div>
              ) : (
                beneficiaryBanks.map((bank) => (
                  <motion.div
                    key={bank.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gradient-to-r ${
                      editingBankId === bank.id
                        ? "from-blue-50 to-blue-100 border-blue-300"
                        : "from-blue-50 to-white border-blue-200"
                    } p-6 rounded-2xl border hover:border-blue-300 transition-all duration-200`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-xl ${
                            bank.status === 1
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <FaMoneyCheckAlt className="text-xl" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {bank.bank_name || "Unnamed Bank Account"}
                            </h3>
                            <div
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                bank.status === 1
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  bank.status === 1
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              ></div>
                              {bank.status === 1 ? "Active" : "Inactive"}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <FaCreditCard className="text-gray-400" />
                              <span className="font-mono font-medium">
                                {bank.bank_acc_no || "No account number"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaGlobeAmericas className="text-gray-400" />
                              <span className="font-bold">
                                {bank.currency_code || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaInfoCircle className="text-gray-400" />
                              <span>{bank.rails || "Standard Transfer"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => initBankEdit(bank)}
                          className="p-2.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit bank account"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => deleteBankAccount(bank.id)}
                          className="p-2.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete bank account"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    {/* Bank Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-blue-200">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Bank Branch
                          </label>
                          <p className="text-gray-900">
                            {bank.bank_branch_name || bank.bank_branch || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Account Type
                          </label>
                          <p className="text-gray-900 capitalize">
                            {bank.account_type || "Not specified"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            SWIFT/BIC Code
                          </label>
                          <p className="text-gray-900 font-mono">
                            {bank.swift || bank.bic_code || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            IFSC Code
                          </label>
                          <p className="text-gray-900 font-mono">
                            {bank.ifsc || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Bank Location
                          </label>
                          <p className="text-gray-900">
                            {[bank.bank_city, bank.bank_state]
                              .filter(Boolean)
                              .join(", ") || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Last Updated
                          </label>
                          <p className="text-gray-900">
                            {bank.updated_at
                              ? new Date(bank.updated_at).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Form for Beneficiary Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <FaUser className="text-blue-600 text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Beneficiary Personal Details
                </h2>
                <p className="text-gray-600 text-sm">
                  Update the beneficiary's personal information
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
            {/* Personal Information Section */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-1">
                      First Name <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    onBlur={(e) => validateField("first_name", e.target.value)}
                    className={`w-full px-4 py-3 border ${
                      validationErrors.first_name
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                    required
                    placeholder="Enter first name"
                  />
                  {validationErrors.first_name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FaExclamationTriangle /> {validationErrors.first_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                    <span className="text-gray-500 text-xs ml-1">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter middle name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-1">
                      Last Name <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    onBlur={(e) => validateField("last_name", e.target.value)}
                    className={`w-full px-4 py-3 border ${
                      validationErrors.last_name
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                    required
                    placeholder="Enter last name"
                  />
                  {validationErrors.last_name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FaExclamationTriangle /> {validationErrors.last_name}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                    <span className="text-gray-500 text-xs ml-1">
                      (Optional)
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField("email", e.target.value)}
                      className={`w-full pl-12 px-4 py-3 border ${
                        validationErrors.email
                          ? "border-red-300"
                          : "border-gray-300"
                      } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                      placeholder="example@domain.com"
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FaExclamationTriangle /> {validationErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-1">
                      Phone Number <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-5">
                      <select
                        value={formData.country_phone_code}
                        onChange={handlePhoneCodeChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      >
                        <option value="">Select Code</option>
                        {phoneCodeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-7">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaPhone className="text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleInputChange}
                          onBlur={(e) =>
                            validateField("phone_number", e.target.value)
                          }
                          className={`w-full pl-12 px-4 py-3 border ${
                            validationErrors.phone_number
                              ? "border-red-300"
                              : "border-gray-300"
                          } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                          required
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                  </div>
                  {validationErrors.phone_number && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FaExclamationTriangle /> {validationErrors.phone_number}
                    </p>
                  )}
                  {formData.full_phone_number && (
                    <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                      <FaCheckCircle className="text-green-500" />
                      Full number:{" "}
                      <span className="font-medium">
                        {formData.full_phone_number}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FaMapMarkerAlt className="text-green-600" />
                </div>
                Address Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter street address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    name="country_id"
                    value={formData.country_id}
                    onChange={handleCountryChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option
                        key={country.id || country.value}
                        value={country.id || country.value}
                      >
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  {formData.country_id === "88" || formData.country_id === "185" ? (
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="">Select City</option>
                      {getCitiesForCountry().map((city) => (
                        <option key={city.id} value={city.city_name}>
                          {city.city_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter city"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter state/province"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal/Zip Code
                  </label>
                  <input
                    type="text"
                    name="postalcode"
                    value={formData.postalcode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter postal/zip code"
                  />
                </div>
              </div>
            </div>

            {/* Identification Section - With Dynamic ID Types for BDT/INR/PKR */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FaIdCard className="text-purple-600" />
                </div>
                Identification Details
              </h3>

              {/* Conditionally show ID fields for BDT/INR/PKR */}
              {(currency === "BDT" || currency === "INR" || currency === "PKR") ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beneficiary ID Type *
                    </label>
                    <select
                      name="beneficiary_id_type"
                      value={formData.beneficiary_id_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    >
                      <option value="">Select ID Type</option>
                      {getIdTypesForCurrency().map((idType) => (
                        <option key={idType.name || idType.id} value={idType.name || idType.id}>
                          {idType.name || idType.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beneficiary ID Number *
                    </label>
                    <input
                      type="text"
                      name="beneficiary_id_number"
                      value={formData.beneficiary_id_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter ID number"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Type
                    </label>
                    <select
                      name="beneficiary_id_type"
                      value={formData.beneficiary_id_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="">Select ID Type</option>
                      {dropdowns.idTypes.map((idType) => (
                        <option key={idType.id} value={idType.id}>
                          {idType.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Number
                    </label>
                    <input
                      type="text"
                      name="beneficiary_id_number"
                      value={formData.beneficiary_id_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter ID number"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Issue Date
                  </label>
                  <input
                    type="date"
                    name="beneficiary_id_date_of_issue"
                    value={formData.beneficiary_id_date_of_issue}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Expiry Date
                  </label>
                  <input
                    type="date"
                    name="beneficiary_id_date_of_expiry"
                    value={formData.beneficiary_id_date_of_expiry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FaGlobe className="text-yellow-600" />
                </div>
                Additional Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nationality
                  </label>
                  <select
                    name="nationality_id"
                    value={formData.nationality_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">Select Nationality</option>
                    {nationalities.map((nationality) => (
                      <option key={nationality.id} value={nationality.id}>
                        {nationality.name || nationality.nationality_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaBirthdayCake className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="w-full pl-12 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaVenusMars className="text-gray-400" />
                    </div>
                    <select
                      name="gender_id"
                      value={formData.gender_id}
                      onChange={handleInputChange}
                      className="w-full pl-12 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="">Select Gender</option>
                      {dropdowns.genders.map((gender) => (
                        <option key={gender.id} value={gender.id}>
                          {gender.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occupation
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaBuilding className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      className="w-full pl-12 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter occupation"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Income Source
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaMoneyBillWave className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="income_source"
                      value={formData.income_source}
                      onChange={handleInputChange}
                      className="w-full pl-12 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter income source"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transfer Purpose
                  </label>
                  <input
                    type="text"
                    name="transfer_purpose"
                    value={formData.transfer_purpose}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter transfer purpose"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship to Sender
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaHandshake className="text-gray-400" />
                    </div>
                    <select
                      name="relationtobenef"
                      value={formData.relationtobenef}
                      onChange={handleInputChange}
                      className="w-full pl-12 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="">Select Relationship</option>
                      {dropdowns.relationships.map((relationship) => (
                        <option key={relationship.id} value={relationship.id}>
                          {relationship.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beneficiary Type
                  </label>
                  <select
                    name="beneftype"
                    value={formData.beneftype}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="individual">Individual</option>
                    <option value="institution">Institution</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FaEye className="text-indigo-600" />
                </div>
                Status Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 hover:border-indigo-300 transition-all duration-200">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                          formData.status === 1
                            ? "bg-green-500 border-green-500"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {formData.status === 1 && (
                          <FaCheckCircle className="text-white text-xs" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">
                          Active Status
                        </span>
                        <p className="text-gray-500 text-sm mt-1">
                          Beneficiary can receive transfers
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.status === 1}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.checked ? 1 : 0,
                        }))
                      }
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 hover:border-indigo-300 transition-all duration-200">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                          formData.is_visible
                            ? "bg-blue-500 border-blue-500"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {formData.is_visible && (
                          <FaCheckCircle className="text-white text-xs" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">
                          Visible in List
                        </span>
                        <p className="text-gray-500 text-sm mt-1">
                          Show in beneficiaries list
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      name="is_visible"
                      checked={formData.is_visible}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="p-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-8 py-3.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    dropdownLoading ||
                    Object.keys(validationErrors).length > 0
                  }
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <ClipLoader color="#ffffff" size={20} />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <FaSave />
                      <span>Save All Changes</span>
                    </>
                  )}
                </button>
              </div>

              {Object.keys(validationErrors).length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700">
                    <FaExclamationTriangle />
                    <span className="font-medium">
                      Please fix the errors above before submitting
                    </span>
                  </div>
                </div>
              )}
            </div>
          </form>
        </motion.div>

        {/* Summary Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  Beneficiary Summary
                </h3>
                <FaUser className="text-blue-600" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formData.first_name} {formData.middle_name}{" "}
                  {formData.last_name}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Contact Info</h3>
                <FaPhone className="text-green-600" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formData.full_phone_number || "Not set"}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Bank Accounts</h3>
                <FaUniversity className="text-purple-600" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Total Accounts</p>
                <p className="text-lg font-semibold text-gray-900">
                  {beneficiaryBanks.length} account(s)
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="rounded-xl shadow-lg"
      />
    </div>
  );
};

export default EditBeneficiaryPage;