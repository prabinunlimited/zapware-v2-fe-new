import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import { ClipLoader } from "react-spinners";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import {
  FaMoneyBillWave,
  FaArrowLeft,
  FaUser,
  FaUniversity,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlus,
  FaTrash,
  FaChevronRight,
  FaChevronLeft,
} from "react-icons/fa";

// Import Redux actions and selectors
import {
  selectCreateLoading,
  selectCreateError,
  selectCreateSuccess,
  selectNationalities,
  selectBanks,
  selectIdTypes,
  selectCities,
  selectBankBranches,
  selectDropdownLoading,
  selectUpdateLoading,
  selectUpdateError,
  selectUpdateSuccess,
  selectBeneficiaryData,
  fetchNationalities,
  fetchBanksByCurrency,
  fetchIdTypesByCurrency,
  fetchCitiesByCountry,
  fetchBankBranches,
  createBeneficiaryWithBanks,
  updateBeneficiary,
  fetchBeneficiaryById,
  clearCreateError,
  clearCreateSuccess,
  resetCreateState,
  clearUpdateState,
} from "../AddBeneficiary/addBeneficiarySlice";

import {
  selectCountriesOptionsSafe,
  selectCountries,
  selectPhoneCodeOptions,
  fetchCountries,
} from "../../../features/Auth/slices/countrySlice";

import PropTypes from "prop-types";

const AlertBox = ({ message = "Please log in to continue!", onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-labelledby="alert-title"
      aria-describedby="alert-message"
    >
      <div className="max-w-lg w-11/12 md:w-1/2 p-6 rounded-lg shadow-xl bg-red-600 text-white text-center">
        <h2
          id="alert-title"
          className="text-xl font-extrabold mb-4 tracking-wide"
        >
          Action Required!
        </h2>
        <p id="alert-message" className="text-sm md:text-base mb-6">
          {message}
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white text-red-600 rounded-md font-medium hover:bg-gray-100 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

AlertBox.propTypes = {
  message: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

AlertBox.defaultProps = {
  message: "Please log in to continue!",
};

const BeneficiaryForm = ({ mode = "create", initialData = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const params = useParams();
  
  // Handle different route patterns
  let customerId, beneficiaryId;
  
  if (mode === "create") {
    customerId = params.customerId;
    beneficiaryId = null;
  } else {
    beneficiaryId = params.beneficiaryId;
    customerId = location.state?.customerId || localStorage.getItem("currentCustomerId");
  }
  
  const is_payout = location.state?.is_payout || "n";

  // Redux selectors
  const {
    createLoading,
    createError,
    createSuccess,
    updateLoading,
    updateError,
    updateSuccess,
    nationalities,
    banks,
    idTypes,
    cities,
    bankBranches,
    dropdownLoading,
    beneficiaryDetails,
  } = useSelector((state) => ({
    createLoading: state.addBeneficiary?.createLoading || false,
    createError: state.addBeneficiary?.createError || null,
    createSuccess: state.addBeneficiary?.createSuccess || false,
    updateLoading: state.addBeneficiary?.updateLoading || false,
    updateError: state.addBeneficiary?.updateError || null,
    updateSuccess: state.addBeneficiary?.updateSuccess || false,
    nationalities: state.addBeneficiary?.nationalities || [],
    banks: state.addBeneficiary?.banks || {},
    idTypes: state.addBeneficiary?.idTypes || {},
    cities: state.addBeneficiary?.cities || {},
    bankBranches: state.addBeneficiary?.bankBranches || {},
    dropdownLoading: state.addBeneficiary?.dropdownLoading || false,
    beneficiaryDetails: state.addBeneficiary?.beneficiaryData || null,
  }));

  // Countries from Redux
  const countriesOptions = useSelector(selectCountriesOptionsSafe);
  const countries = useSelector(selectCountries);
  const phoneCodeOptions = useSelector(selectPhoneCodeOptions);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Beneficiary Bank States
  const [currency, setCurrency] = useState(
    mode === "edit" && initialData?.banks?.[0]?.currency_code 
      ? initialData.banks[0].currency_code 
      : "USD"
  );
  const [paymentMethod, setPaymentMethod] = useState("ACH");
  const [loading, setLoading] = useState(false);
  const [showOtherRelationship, setShowOtherRelationship] = useState(false);
  const [branchCode, setBranchCode] = useState("");
  const [fieldTouched, setFieldTouched] = useState({});

  // Define steps array
  const steps = [
    {
      number: 1,
      title: "Beneficiary Details",
      icon: <FaUser className="mr-2" />,
      description: "Personal & Contact Information"
    },
    {
      number: 2,
      title: "Bank Information",
      icon: <FaUniversity className="mr-2" />,
      description: "Account & Payment Details"
    },
  ];

  const relationshipOptions = [
    { value: "father", label: "Father" },
    { value: "mother", label: "Mother" },
    { value: "sister", label: "Sister" },
    { value: "brother", label: "Brother" },
    { value: "cousin", label: "Cousin" },
    { value: "friend", label: "Friend" },
    { value: "other", label: "Other" },
  ];

  const localCurrencies = [
    "AED",
    "AUD",
    "BDT",
    "DKK",
    "EUR",
    "GBP",
    "INR",
    "KES",
    "NGN",
    "NPR",
    "PKR",
    "USD",
  ];

  // State to handle multiple bank accounts
  const [bankAccounts, setBankAccounts] = useState(() => {
    if (mode === "edit" && initialData?.banks) {
      return initialData.banks.map(bank => ({
        rails: bank.rails || "",
        currency: bank.currency_code || currency,
        iban: bank.benef_iban || "",
        swift: bank.swift_code || "",
        intermediarySwift: bank.intermediary_bank_swift || "",
        routingNumber: bank.routing_number || "",
        accountNumber: bank.bank_acc_no || "",
        bankName: bank.bank_name || "",
        ifsc: bank.ifsc || "",
        bankCode: bank.bankCode || "",
        paymentMethod: bank.payment_method || paymentMethod,
        bankState: bank.bankState || "",
        branchCode: bank.branchCode || "",
        accountName: bank.account_name || "",
        accountTitle: bank.account_title || "",
        walletProvider: bank.wallet_provider || "",
        mobileNumber: bank.mobile_number || "",
        otherProvider: bank.other_provider || "",
        accountType: bank.account_type || "",
        sortCode: bank.sort_code || "",
      }));
    }
    
    return [{
      rails: "",
      currency: currency,
      iban: "",
      swift: "",
      intermediarySwift: "",
      routingNumber: "",
      accountNumber: "",
      bankName: "",
      ifsc: "",
      bankCode: "",
      paymentMethod: paymentMethod,
      bankState: "",
      branchCode: "",
      accountName: "",
      accountTitle: "",
      walletProvider: "",
      mobileNumber: "",
      otherProvider: "",
      accountType: "",
      sortCode: "",
    }];
  });

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "white",
      border: state.isFocused ? "2px solid #3b82f6" : "1px solid #d1d5db",
      borderRadius: "0.5rem",
      padding: "4px 8px",
      fontSize: "0.875rem",
      color: "#111827",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      minHeight: "48px",
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: "#9ca3af",
      },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "0.5rem",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      zIndex: 20,
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#6b7280",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#eff6ff" : "white",
      color: state.isSelected ? "white" : "#1f2937",
      padding: "12px 16px",
      fontSize: "0.875rem",
      "&:active": {
        backgroundColor: "#3b82f6",
        color: "white",
      },
    }),
  };

  // Formik initialization
  const formik = useFormik({
    initialValues: {
      name: initialData?.name || "",
      country_id: initialData?.country_id?.toString() || "",
      country_phone_code: initialData?.country_phone_code || "+1",
      phone_number: initialData?.phone_number || "",
      email: initialData?.email || "",
      beneftype: initialData?.beneftype || "",
      state: initialData?.state || "",
      city: initialData?.city || "",
      street: initialData?.street || "",
      postalcode: initialData?.postalcode || "",
      relationtobenef: initialData?.relationtobenef || "",
      otherRelationship: initialData?.otherRelationship || "",
      nationality_id: initialData?.nationality_id?.toString() || "",
      status: initialData?.status?.toString() || "1",
      nic_bcc_code: initialData?.nic_bcc_code || "",
      beneficiary_id_type: initialData?.beneficiary_id_type || "",
      beneficiary_id_number: initialData?.beneficiary_id_number || "",
    },
    onSubmit: () => {
      // Empty function - we'll handle submission in Step 2
    },
    enableReinitialize: mode === "edit",
  });

  // Debug mount
  useEffect(() => {
    console.log("🔍 BeneficiaryForm Component mounted with:");
    console.log("   Mode:", mode);
    console.log("   customerId:", customerId);
    console.log("   beneficiaryId:", beneficiaryId);
    console.log("   location.state:", location.state);
    console.log("   is_payout:", is_payout);
  }, [mode, customerId, beneficiaryId, location.state, is_payout]);

  // Fetch beneficiary data for edit mode
  useEffect(() => {
    if (mode === "edit" && beneficiaryId && !initialData) {
      console.log("🔍 Fetching beneficiary data for edit:", beneficiaryId);
      dispatch(fetchBeneficiaryById(beneficiaryId));
    }
  }, [mode, beneficiaryId, initialData, dispatch]);

  // Populate form when beneficiary data is loaded
  useEffect(() => {
    if (mode === "edit" && beneficiaryDetails && !initialData) {
      console.log("📝 Populating form with beneficiary data:", beneficiaryDetails);
      
      formik.setValues({
        name: beneficiaryDetails.name || "",
        country_id: beneficiaryDetails.country_id?.toString() || "",
        country_phone_code: beneficiaryDetails.country_phone_code || "+1",
        phone_number: beneficiaryDetails.phone_number || "",
        email: beneficiaryDetails.email || "",
        beneftype: beneficiaryDetails.beneftype || "",
        state: beneficiaryDetails.state || "",
        city: beneficiaryDetails.city || "",
        street: beneficiaryDetails.street || "",
        postalcode: beneficiaryDetails.postalcode || "",
        relationtobenef: beneficiaryDetails.relationtobenef || "",
        otherRelationship: beneficiaryDetails.otherRelationship || "",
        nationality_id: beneficiaryDetails.nationality_id?.toString() || "",
        status: beneficiaryDetails.status?.toString() || "1",
        nic_bcc_code: beneficiaryDetails.nic_bcc_code || "",
        beneficiary_id_type: beneficiaryDetails.beneficiary_id_type || "",
        beneficiary_id_number: beneficiaryDetails.beneficiary_id_number || "",
      });

      if (beneficiaryDetails.banks && beneficiaryDetails.banks.length > 0) {
        const firstBank = beneficiaryDetails.banks[0];
        setCurrency(firstBank.currency_code || firstBank.currency || "USD");
        setBankAccounts(beneficiaryDetails.banks.map(bank => ({
          rails: bank.rails || "",
          currency: bank.currency_code || currency,
          iban: bank.benef_iban || "",
          swift: bank.swift_code || "",
          intermediarySwift: bank.intermediary_bank_swift || "",
          routingNumber: bank.routing_number || "",
          accountNumber: bank.bank_acc_no || "",
          bankName: bank.bank_name || "",
          ifsc: bank.ifsc || "",
          bankCode: bank.bankCode || "",
          paymentMethod: bank.payment_method || paymentMethod,
          bankState: bank.bankState || "",
          branchCode: bank.branchCode || "",
          accountName: bank.account_name || "",
          accountTitle: bank.account_title || "",
          walletProvider: bank.wallet_provider || "",
          mobileNumber: bank.mobile_number || "",
          otherProvider: bank.other_provider || "",
          accountType: bank.account_type || "",
          sortCode: bank.sort_code || "",
        })));
      }
    }
  }, [beneficiaryDetails, mode, initialData, formik.setValues, currency]);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchNationalities());
    dispatch(fetchCountries());
    
    if (["BDT", "LKR", "AUD", "PKR"].includes(currency)) {
      dispatch(
        fetchBanksByCurrency({ currency: currency, bankType: "int-banks" })
      );
    } else {
      dispatch(
        fetchBanksByCurrency({
          currency: currency,
          bankType: "currency-payout-banks",
        })
      );
    }
    
    if (["BDT", "INR", "PKR"].includes(currency)) {
      dispatch(fetchIdTypesByCurrency(currency));
    }
  }, [dispatch, currency]);

  // Handle errors and success with navigation
  useEffect(() => {
    if (mode === "create") {
      if (createError) {
        toast.error(createError);
        dispatch(clearCreateError());
      }

      if (createSuccess) {
        toast.success("Beneficiary created successfully!");
        dispatch(clearCreateSuccess());

        setTimeout(() => {
          if (is_payout === "y") {
            navigate(-1);
          } else {
            const targetPath = `/mybeneficiary/${customerId}`;
            navigate(targetPath);
          }
        }, 1500);
      }
    } else if (mode === "edit") {
      if (updateError) {
        toast.error(updateError);
        dispatch(clearUpdateState());
      }

      if (updateSuccess) {
        toast.success("Beneficiary updated successfully!");
        dispatch(clearUpdateState());

        setTimeout(() => {
          navigate(`/mybeneficiary/${customerId}`);
        }, 1500);
      }
    }
  }, [
    createError,
    createSuccess,
    updateError,
    updateSuccess,
    dispatch,
    is_payout,
    navigate,
    customerId,
    mode,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetCreateState());
      dispatch(clearUpdateState());
    };
  }, [dispatch]);

  // Fetch cities when country changes
  useEffect(() => {
    if (formik.values.country_id) {
      dispatch(fetchCitiesByCountry(formik.values.country_id));
    }
  }, [formik.values.country_id, dispatch]);

  // Get cities for selected country
  const getCitiesForCountry = () => {
    return cities[formik.values.country_id] || [];
  };

  const isFormValid = useCallback(() => {
    if (formik.values.beneftype === "") return false;

    if (
      formik.values.name === "" ||
      formik.values.country_id === "" ||
      formik.values.country_phone_code === "" ||
      formik.values.phone_number === "" ||
      formik.values.city === "" ||
      formik.values.street === ""
    )
      return false;

    if (formik.values.beneftype === "individual") {
      if (formik.values.relationtobenef === "") return false;
    }

    if (currency === "BDT" || currency === "INR" || currency === "PKR") {
      if (
        formik.values.beneficiary_id_type === "" ||
        formik.values.beneficiary_id_number === ""
      )
        return false;

      if (currency === "INR" && formik.values.city === "") return false;
    }

    return true;
  }, [formik.values, currency]);

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;

    console.log("=== CURRENCY CHANGE START ===");
    console.log("New currency selected:", newCurrency);
    console.log("Previous currency:", currency);

    setCurrency(newCurrency);

    formik.setFieldValue("beneficiary_id_type", "");
    formik.setFieldValue("beneficiary_id_number", "");

    if (["BDT", "INR", "PKR"].includes(newCurrency)) {
      console.log(`Dispatching fetchIdTypesByCurrency for ${newCurrency}...`);
      dispatch(fetchIdTypesByCurrency(newCurrency));
    }

    if (["BDT", "LKR", "AUD", "PKR"].includes(newCurrency)) {
      dispatch(
        fetchBanksByCurrency({ currency: newCurrency, bankType: "int-banks" })
      );
    } else {
      dispatch(
        fetchBanksByCurrency({
          currency: newCurrency,
          bankType: "currency-payout-banks",
        })
      );
    }

    setBankAccounts((prevAccounts) =>
      prevAccounts.map((account) => ({
        ...account,
        currency: newCurrency,
      }))
    );

    console.log("=== CURRENCY CHANGE END ===");
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const nextStep = () => {
    if (currency === "BDT" || currency === "INR" || currency === "PKR") {
      const countryInput = formik.values.country_id;
      if (countryInput === "" || countryInput === " ") {
        toast.error(`Country Required for Currency: ${currency}`);
        return false;
      }
      const streetInput = formik.values.street;
      if (streetInput === "" || streetInput === " ") {
        toast.error(`Street Required for Currency: ${currency}`);
        return false;
      }
      const idTypeInput = formik.values.beneficiary_id_type;
      if (idTypeInput === "" || idTypeInput === " ") {
        toast.error(`ID Type Required for Currency: ${currency}`);
        return false;
      }

      const idNumber = formik.values.beneficiary_id_number;
      if (idNumber === "" || idNumber === " ") {
        toast.error(`ID Number Required for Currency: ${currency}`);
        return false;
      }

      if (currency === "INR") {
        const cityInput = formik.values.city;
        if (cityInput === "" || cityInput === " ") {
          toast.error(`City Required for Currency: ${currency}`);
          return false;
        }
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const resetForm = () => {
    setBankAccounts([
      {
        rails: "",
        iban: "",
        swift: "",
        intermediarySwift: "",
        routingNumber: "",
        accountNumber: "",
        sortCode: "",
        bankName: "",
        ifsc: "",
        bankCode: "",
        branchCode: branchCode,
        bankState: "",
      },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(`🔄 Starting beneficiary ${mode}...`);
    setLoading(true);

    const isRailsMissing = bankAccounts.some((account) => !account.rails);
    if (isRailsMissing) {
      toast.error("Please select rails for all bank accounts.");
      setLoading(false);
      return;
    }

    if (currency === "BDT" || currency === "INR" || currency === "PKR") {
      if (!formik.values.beneficiary_id_type) {
        toast.error("Beneficiary ID Type is required");
        setLoading(false);
        return;
      }
      if (!formik.values.beneficiary_id_number) {
        toast.error("Beneficiary ID Number is required");
        setLoading(false);
        return;
      }
    }

    const finalRelationship =
      formik.values.relationtobenef === "other" &&
      formik.values.otherRelationship.trim() !== ""
        ? formik.values.otherRelationship.trim()
        : formik.values.relationtobenef;

    const beneficiaryData = {
      name: formik.values.name,
      country_id: formik.values.country_id,
      phone_number: formik.values.phone_number,
      email: formik.values.email,
      beneftype: formik.values.beneftype,
      state: formik.values.state,
      city: formik.values.city,
      street: formik.values.street,
      postalcode: formik.values.postalcode,
      relationtobenef: finalRelationship,
      nationality_id: formik.values.nationality_id,
      idType: formik.values.beneficiary_id_type,
      idNumber: formik.values.beneficiary_id_number,
      status: 1,
      address: "",
      nic_bcc_code: formik.values.nic_bcc_code,
    };

    console.log(`📤 Submitting beneficiary data (${mode}):`, beneficiaryData);
    console.log("📤 Submitting bank accounts:", bankAccounts);
    console.log("📤 Currency:", currency);

    try {
      if (mode === "create") {
        console.log("📤 Dispatching createBeneficiaryWithBanks...");
        const result = await dispatch(
          createBeneficiaryWithBanks({
            customerId,
            beneficiaryData,
            bankAccounts,
            currency,
          })
        ).unwrap();
        console.log("✅ Create successful, result:", result);
        resetForm();
      } else if (mode === "edit") {
        console.log("📤 Dispatching updateBeneficiary...");
        const result = await dispatch(
          updateBeneficiary({
            customerId,
            beneficiaryId,
            beneficiaryData,
          })
        ).unwrap();
        console.log("✅ Update successful, result:", result);
      }
    } catch (error) {
      console.error(`❌ ${mode} error:`, error.message || error);
      toast.error(error.message || `Failed to ${mode} beneficiary`);
    } finally {
      setLoading(false);
    }
  };

  const addBankAccount = () => {
    setBankAccounts([
      ...bankAccounts,
      {
        rails: "",
        currency: currency,
        iban: "",
        swift: "",
        intermediarySwift: "",
        routingNumber: "",
        accountNumber: "",
        bankName: "",
        ifsc: "",
        bankCode: "",
        paymentMethod: paymentMethod,
        branchCode: "",
        accountName: "",
        accountTitle: "",
        walletProvider: "",
        mobileNumber: "",
        otherProvider: "",
        accountType: "",
        sortCode: "",
      },
    ]);
  };

  const removeBankAccount = (index) => {
    if (bankAccounts.length === 1) {
      toast.error("At least one bank account is required");
      return;
    }
    
    const newBankAccounts = bankAccounts.filter((_, i) => i !== index);
    setBankAccounts(newBankAccounts);
  };

  const handleBankAccountChange = (index, field, value) => {
    const newBankAccounts = [...bankAccounts];
    newBankAccounts[index][field] = value;
    setBankAccounts(newBankAccounts);
    if (field === "branchCode") {
      setBranchCode(value);
    }
  };

  const handleBdtBankAccountChange = async (index, field, value) => {
    const newBankAccounts = [...bankAccounts];
    newBankAccounts[index][field] = value;
    setBankAccounts(newBankAccounts);

    if (field === "bankCode") {
      dispatch(fetchBankBranches(value));
    }
  };

  const handlePkrBankAccountChange = async (index, field, value) => {
    const newBankAccounts = [...bankAccounts];
    newBankAccounts[index][field] = value;
    setBankAccounts(newBankAccounts);
  };

  // Get banks for current currency
  const getBanksForCurrency = useMemo(() => {
    if (["BDT", "LKR", "AUD", "PKR"].includes(currency)) {
      return banks[`${currency}_int`] || [];
    }
    return banks[currency] || [];
  }, [banks, currency]);

  // Get ID types for current currency
  const getIdTypesForCurrency = useMemo(() => {
    if (Object.keys(idTypes).length === 0) {
      return [];
    }

    const types = idTypes[currency];
    if (!types) {
      return [];
    }

    if (Array.isArray(types)) {
      return types;
    }

    if (types && types.data && Array.isArray(types.data)) {
      return types.data;
    }

    if (types && typeof types === "object") {
      return Object.values(types);
    }

    return [];
  }, [idTypes, currency]);

  // Get bank branches for selected bank
  const getBankBranches = useMemo(() => {
    const currentBankCode = bankAccounts[0]?.bankCode;
    return currentBankCode ? bankBranches[currentBankCode] || [] : [];
  }, [bankBranches, bankAccounts]);

  // Phone code selector
  const renderPhoneCodeSelector = () => (
    <div className="w-full md:w-1/3">
      <Select
        className="text-sm"
        classNamePrefix="select"
        options={phoneCodeOptions}
        placeholder="Code..."
        isSearchable
        onChange={(selectedOption) => {
          formik.setFieldValue(
            "country_phone_code",
            selectedOption?.value || ""
          );
        }}
        value={phoneCodeOptions.find(
          (option) => option.value === formik.values.country_phone_code
        )}
        formatOptionLabel={({ country, label }) => (
          <div className="flex items-center">
            {country?.flag_url && (
              <img
                src={country.flag_url}
                alt="Flag"
                className="w-6 h-4 mr-2 rounded-sm"
              />
            )}
            <span>{label}</span>
          </div>
        )}
        styles={customStyles}
      />
    </div>
  );

  // Country dropdown
  const renderCountryDropdown = () => (
    <select
      className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
      onChange={(e) => {
        const selectedCountryId = e.target.value;
        const selectedCountry = countries.find(
          (country) => country.id === parseInt(selectedCountryId)
        );

        formik.setFieldValue("country_id", selectedCountryId);

        if (selectedCountry) {
          formik.setFieldValue(
            "country_phone_code",
            selectedCountry.phone_code || "+1"
          );
        }
      }}
      value={formik.values.country_id}
      name="country_id"
    >
      <option value="">Select Country</option>
      {countriesOptions.map((country) => (
        <option key={country.value} value={country.id}>
          {country.label} ({country.country_code})
        </option>
      ))}
    </select>
  );

  // Field label with optional indicator
  const FieldLabel = ({ children, required = false, info = null }) => (
    <div className="flex items-center justify-between mb-1">
      <label className="block text-sm font-medium text-gray-700">
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {info && (
        <div className="group relative">
          <FaInfoCircle className="text-gray-400 hover:text-gray-600 cursor-help" size={14} />
          <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            {info}
          </div>
        </div>
      )}
    </div>
  );

  // Render bank account fields
  const renderBankAccountFields = (index) => {
    const account = bankAccounts[index];
    const accountCurrency = account.currency || currency;
    const currentBanks = getBanksForCurrency;
    const currentIdTypes = getIdTypesForCurrency;
    const currentBankBranches = getBankBranches;

    return (
      <div
        key={index}
        className="p-6 border border-gray-200 rounded-xl bg-white mb-6 shadow-sm hover:shadow-md transition-shadow duration-300"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-3">
              <FaUniversity size={16} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Bank Account {index + 1}
              </h3>
              <p className="text-sm text-gray-500">Fill in the banking details</p>
            </div>
          </div>
          {index > 0 && (
            <button
              type="button"
              onClick={() => removeBankAccount(index)}
              className="flex items-center text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-200 p-2 hover:bg-red-50 rounded-lg"
            >
              <FaTrash className="mr-2" size={14} />
              Remove
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Select Rails */}
          <div className="mb-4">
            <FieldLabel required>Select Rails</FieldLabel>
            <select
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
              value={account.rails}
              onChange={(e) =>
                handleBankAccountChange(index, "rails", e.target.value)
              }
              required
            >
              <option value="">Select Rails</option>
              <option value="Local">
                {accountCurrency === "GBP"
                  ? "FPS"
                  : accountCurrency === "EUR"
                  ? "SEPA"
                  : accountCurrency === "USD"
                  ? "ACH"
                  : "Bank"}
              </option>
              <option value="Swift">Swift</option>
              <option value="Mobile">Mobile</option>
            </select>
            {account.rails && (
              <div className="flex items-center mt-2 text-green-600 text-sm">
                <FaCheckCircle className="mr-1" size={12} />
                <span>Rails selected: {account.rails}</span>
              </div>
            )}
          </div>

          {/* Select Currency */}
          {account.rails !== "Mobile" && (
            <div className="mb-4">
              <FieldLabel required>Select Currency</FieldLabel>
              <select
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                value={accountCurrency}
                onChange={(e) => {
                  handleCurrencyChange(e);
                  handleBankAccountChange(index, "currency", e.target.value);
                }}
                required
              >
                <option value="">Select Currency</option>
                {localCurrencies.map((cur, i) => (
                  <option key={i} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Currency-Specific ID Fields */}
        {(accountCurrency === "BDT" ||
          accountCurrency === "INR" ||
          accountCurrency === "PKR") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="mb-4">
              <FieldLabel required info="Required for regulatory compliance">
                Beneficiary ID Type
              </FieldLabel>
              <select
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                value={formik.values.beneficiary_id_type}
                onChange={formik.handleChange}
                name="beneficiary_id_type"
                required
              >
                <option value="">Select ID Type</option>
                {currentIdTypes.map((idType) => (
                  <option key={idType.name} value={idType.name}>
                    {idType.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <FieldLabel required info="Enter the ID number exactly as on the document">
                Beneficiary ID Number
              </FieldLabel>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                placeholder="Enter ID Number"
                value={formik.values.beneficiary_id_number}
                onChange={formik.handleChange}
                name="beneficiary_id_number"
                required
              />
            </div>
          </div>
        )}

        {/* SWIFT TRANSFERS */}
        {account.rails === "Swift" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <FieldLabel required info="International Bank Account Number">
                IBAN Number
              </FieldLabel>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                placeholder="Enter IBAN number"
                value={account.iban}
                onChange={(e) =>
                  handleBankAccountChange(index, "iban", e.target.value)
                }
                required
              />
            </div>

            <div className="mb-4">
              <FieldLabel required info="Bank Identifier Code">
                SWIFT Code
              </FieldLabel>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                placeholder="Enter SWIFT code"
                value={account.swift}
                onChange={(e) =>
                  handleBankAccountChange(index, "swift", e.target.value)
                }
                required
              />
            </div>

            <div className="mb-4 md:col-span-2">
              <FieldLabel info="Only if your bank requires an intermediary">
                Intermediary Bank SWIFT (Optional)
              </FieldLabel>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                placeholder="Enter intermediary bank SWIFT"
                value={account.intermediarySwift}
                onChange={(e) =>
                  handleBankAccountChange(
                    index,
                    "intermediarySwift",
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        )}

        {/* LOCAL TRANSFERS */}
        {account.rails === "Local" && (
          <div className="space-y-6">
            {/* USD Local Transfer */}
            {accountCurrency === "USD" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="mb-4">
                  <FieldLabel required>Payment Method</FieldLabel>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    value={account.paymentMethod}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "paymentMethod",
                        e.target.value
                      )
                    }
                    required
                  >
                    <option value="">Select Payment Method</option>
                    <option value="ACH">ACH</option>
                    <option value="Domestic Wire">Domestic Wire</option>
                  </select>
                </div>

                <div className="mb-4">
                  <FieldLabel required info="9-digit routing number">
                    Routing Number
                  </FieldLabel>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter routing number"
                    value={account.routingNumber}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "routingNumber",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <FieldLabel required>Bank Account Number</FieldLabel>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter account number"
                    value={account.accountNumber}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "accountNumber",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                {account.paymentMethod === "ACH" && (
                  <div className="mb-4">
                    <FieldLabel required>Account Type</FieldLabel>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      value={account.accountType}
                      onChange={(e) =>
                        handleBankAccountChange(
                          index,
                          "accountType",
                          e.target.value
                        )
                      }
                      required
                    >
                      <option value="">Select Account Type</option>
                      <option value="Business Savings">Business Savings</option>
                      <option value="Business Checkings">
                        Business Checkings
                      </option>
                      <option value="Personal Checkings">
                        Personal Checkings
                      </option>
                      <option value="Personal Savings">Personal Savings</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* INR Local Transfer */}
            {accountCurrency === "INR" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="mb-4">
                  <FieldLabel required>Bank Name</FieldLabel>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter Bank Name"
                    value={account.bankName}
                    onChange={(e) =>
                      handleBankAccountChange(index, "bankName", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <FieldLabel required>Account Number</FieldLabel>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter Account Number"
                    value={account.accountNumber}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "accountNumber",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <FieldLabel required info="Indian Financial System Code">
                    IFSC Code
                  </FieldLabel>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter IFSC Code"
                    value={account.ifsc}
                    onChange={(e) =>
                      handleBankAccountChange(index, "ifsc", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            )}

            {/* EUR Local Transfer */}
            {accountCurrency === "EUR" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="mb-4">
                  <FieldLabel required>IBAN Number</FieldLabel>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter IBAN number"
                    value={account.iban}
                    onChange={(e) =>
                      handleBankAccountChange(index, "iban", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            )}

            {/* AED Local Transfer */}
            {accountCurrency === "AED" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="mb-4">
                  <FieldLabel required>IBAN Number</FieldLabel>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter IBAN number"
                    value={account.iban}
                    onChange={(e) =>
                      handleBankAccountChange(index, "iban", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <FieldLabel required>SWIFT/BIC Code</FieldLabel>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter SWIFT/BIC code"
                    value={account.swift}
                    onChange={(e) =>
                      handleBankAccountChange(index, "swift", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            )}

            {/* NPR/KES/NGN Local Transfer */}
            {(accountCurrency === "NPR" ||
              accountCurrency === "KES" ||
              accountCurrency === "NGN") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="mb-4">
                  <FieldLabel required>Bank Name</FieldLabel>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    value={account.bankCode}
                    onChange={(e) => {
                      handleBankAccountChange(
                        index,
                        "bankCode",
                        e.target.value
                      );
                      const selectedBank = currentBanks.find(
                        (bank) =>
                          bank.id === e.target.value ||
                          bank.bank_code === e.target.value
                      );
                      if (selectedBank) {
                        handleBankAccountChange(
                          index,
                          "bankName",
                          selectedBank.name || selectedBank.bank_name
                        );
                      }
                    }}
                    required
                  >
                    <option value="">Select Bank</option>
                    {currentBanks.map((bank) => (
                      <option
                        key={bank.id || bank.bank_code}
                        value={bank.id || bank.bank_code}
                      >
                        {bank.name || bank.bank_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <FieldLabel required>Account Number</FieldLabel>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter account number"
                    value={account.accountNumber}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "accountNumber",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                {accountCurrency === "NGN" && (
                  <div className="mb-4">
                    <FieldLabel>Account Name</FieldLabel>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      placeholder="Enter account name"
                      value={account.accountName}
                      onChange={(e) =>
                        handleBankAccountChange(
                          index,
                          "accountName",
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}
              </div>
            )}

            {/* BDT/LKR/AUD/PKR Local Transfer */}
            {(accountCurrency === "BDT" ||
              accountCurrency === "LKR" ||
              accountCurrency === "AUD" ||
              accountCurrency === "PKR") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="mb-4">
                  <FieldLabel required>Bank Name</FieldLabel>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    value={account.bankCode}
                    onChange={(e) => {
                      if (
                        accountCurrency === "BDT" ||
                        accountCurrency === "LKR" ||
                        accountCurrency === "AUD"
                      ) {
                        handleBdtBankAccountChange(
                          index,
                          "bankCode",
                          e.target.value
                        );
                      } else {
                        handlePkrBankAccountChange(
                          index,
                          "bankCode",
                          e.target.value
                        );
                      }
                      const selectedBank = currentBanks.find(
                        (bank) => bank.bank_code === e.target.value
                      );
                      if (selectedBank) {
                        handleBankAccountChange(
                          index,
                          "bankName",
                          selectedBank.bank_name
                        );
                      }
                    }}
                    required
                  >
                    <option value="">Select Bank</option>
                    {currentBanks.map((bank) => (
                      <option key={bank.bank_code} value={bank.bank_code}>
                        {bank.bank_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <FieldLabel required>Account Number</FieldLabel>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter account number"
                    value={account.accountNumber}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "accountNumber",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <FieldLabel>Branch Code</FieldLabel>
                  {accountCurrency === "BDT" ||
                  accountCurrency === "LKR" ||
                  accountCurrency === "AUD" ? (
                    <select
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      value={account.branchCode}
                      onChange={(e) =>
                        handleBankAccountChange(
                          index,
                          "branchCode",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Select Branch</option>
                      {currentBankBranches.map((branch) => (
                        <option
                          key={branch.branch_code}
                          value={branch.branch_code}
                        >
                          {branch.bank_branch_name} - {branch.branch_code}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      placeholder="Enter branch code"
                      value={account.branchCode}
                      onChange={(e) =>
                        handleBankAccountChange(
                          index,
                          "branchCode",
                          e.target.value
                        )
                      }
                    />
                  )}
                </div>

                <div className="mb-4">
                  <FieldLabel>Bank State</FieldLabel>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter bank state"
                    value={account.bankState}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "bankState",
                        e.target.value
                      )
                    }
                  />
                </div>

                {accountCurrency === "PKR" && (
                  <>
                    <div className="mb-4">
                      <FieldLabel>IBAN Number</FieldLabel>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        placeholder="Enter IBAN number"
                        value={account.iban}
                        onChange={(e) =>
                          handleBankAccountChange(index, "iban", e.target.value)
                        }
                      />
                    </div>
                    <div className="mb-4">
                      <FieldLabel>Account Title</FieldLabel>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        placeholder="Enter account title"
                        value={account.accountTitle}
                        onChange={(e) =>
                          handleBankAccountChange(
                            index,
                            "accountTitle",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* GBP/DKK Local Transfer */}
            {(accountCurrency === "GBP" || accountCurrency === "DKK") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="mb-4">
                  <FieldLabel required>Account Number</FieldLabel>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter Account Number"
                    value={account.accountNumber}
                    onChange={(e) =>
                      handleBankAccountChange(
                        index,
                        "accountNumber",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <FieldLabel required>Sort Code</FieldLabel>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter Sort Code"
                    value={account.sortCode}
                    onChange={(e) =>
                      handleBankAccountChange(index, "sortCode", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* MOBILE TRANSFERS */}
        {account.rails === "Mobile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <FieldLabel required info="Mobile wallet service provider">
                Mobile Wallet Provider
              </FieldLabel>
              <select
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                value={account.walletProvider}
                onChange={(e) =>
                  handleBankAccountChange(
                    index,
                    "walletProvider",
                    e.target.value
                  )
                }
                required
              >
                <option value="">Select Provider</option>
                <option value="M-Pesa">M-Pesa (Kenya)</option>
                <option value="EasyPaisa">EasyPaisa (Pakistan)</option>
                <option value="bKash">bKash (Bangladesh)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <FieldLabel required>Mobile Number</FieldLabel>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                placeholder="Enter mobile number"
                value={account.mobileNumber}
                onChange={(e) =>
                  handleBankAccountChange(index, "mobileNumber", e.target.value)
                }
                required
              />
            </div>

            {account.walletProvider === "Other" && (
              <div className="mb-4 md:col-span-2">
                <FieldLabel required>Provider Name</FieldLabel>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  placeholder="Enter provider name"
                  value={account.otherProvider}
                  onChange={(e) =>
                    handleBankAccountChange(
                      index,
                      "otherProvider",
                      e.target.value
                    )
                  }
                  required
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Loading spinner - Overlay */}
      {(isLoading || createLoading || updateLoading) && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-75 z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center transform transition-all duration-300 scale-105">
            <ClipLoader size={60} color="#3B82F6" />
            <p className="mt-6 text-gray-700 font-medium">
              Processing your request...
            </p>
            <p className="text-gray-500 text-sm mt-2">
              This may take a few moments
            </p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center">
                <FaMoneyBillWave className="mr-3" size={28} />
                {mode === "create" ? "Add New Beneficiary" : "Edit Beneficiary"}
              </h1>
              <p className="text-blue-100 mt-1">
                {mode === "create" 
                  ? "Fill in the details to add a new beneficiary" 
                  : "Update beneficiary information"}
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="flex items-center text-white hover:text-blue-100 transition-colors duration-200 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg mt-4 md:mt-0"
            >
              <FaArrowLeft className="mr-2" />
              Back
            </button>
          </div>

          {/* Progress Steps */}
          <div className="relative pt-4">
            <div className="flex justify-between mb-2">
              {steps.map((stepItem) => (
                <div key={stepItem.number} className="flex flex-col items-center flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-blue-500 text-white font-bold text-lg shadow-lg">
                    {step === stepItem.number ? (
                      <div className="animate-pulse">{stepItem.number}</div>
                    ) : (
                      stepItem.number
                    )}
                  </div>
                  <div className="text-center mt-3">
                    <div className="text-sm font-semibold text-white">
                      {stepItem.title}
                    </div>
                    <div className="text-xs text-blue-200">
                      {stepItem.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute top-8 left-0 right-0 h-2 bg-blue-400 -z-10">
              <div 
                className="h-full bg-white transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {/* Step Indicator */}
          <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${
                step === 1 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
              }`}>
                {step}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {steps[step - 1].title}
                </h3>
                <p className="text-sm text-gray-600">
                  {steps[step - 1].description}
                </p>
              </div>
            </div>
          </div>

          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                nextStep();
              }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Beneficiary Type */}
                <div className="md:col-span-2">
                  <FieldLabel required info="Select whether the beneficiary is an individual or an institution">
                    Beneficiary Type
                  </FieldLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        formik.values.beneftype === "individual"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        formik.setFieldValue("beneftype", "individual");
                        setShowOtherRelationship(false);
                      }}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                          formik.values.beneftype === "individual"
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}>
                          {formik.values.beneftype === "individual" && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">Individual</div>
                          <div className="text-sm text-gray-500">Personal beneficiary</div>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        formik.values.beneftype === "institution"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        formik.setFieldValue("beneftype", "institution");
                        setShowOtherRelationship(false);
                      }}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                          formik.values.beneftype === "institution"
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}>
                          {formik.values.beneftype === "institution" && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">Institution</div>
                          <div className="text-sm text-gray-500">Company or organization</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Currency Selection */}
                <div className="md:col-span-2">
                  <FieldLabel info="Select the currency for transfers">
                    Currency
                  </FieldLabel>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none"
                      value={currency}
                      onChange={handleCurrencyChange}
                    >
                      <option value="">Select Currency</option>
                      {localCurrencies.map((cur, i) => (
                        <option key={i} value={cur}>
                          {cur}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <FaChevronRight className="text-gray-400 rotate-90" />
                    </div>
                  </div>
                </div>

                {/* ALWAYS SHOW THESE FIELDS */}
                <>
                  {/* Name */}
                  <div>
                    <FieldLabel required>Name</FieldLabel>
                    <input
                      id="name"
                      type="text"
                      className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      placeholder="Enter beneficiary name"
                      value={formik.values.name}
                      name="name"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <FieldLabel info="For notifications and receipts">
                      Email
                    </FieldLabel>
                    <input
                      id="email"
                      type="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      placeholder="email@example.com"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="md:col-span-2">
                    <FieldLabel>Phone Number</FieldLabel>
                    <div className="flex flex-col md:flex-row gap-4">
                      {renderPhoneCodeSelector()}
                      <div className="w-full md:flex-1">
                        <input
                          id="phone_number"
                          type="tel"
                          className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                          placeholder="Enter phone number"
                          value={formik.values.phone_number}
                          name="phone_number"
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Nationality */}
                  <div>
                    <FieldLabel>Nationality</FieldLabel>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none"
                        onChange={formik.handleChange}
                        value={formik.values.nationality_id}
                        name="nationality_id"
                      >
                        <option value="">Select Nationality</option>
                        {nationalities.map((nationality) => (
                          <option key={nationality.id} value={nationality.id}>
                            {nationality.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <FaChevronRight className="text-gray-400 rotate-90" />
                      </div>
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <FieldLabel required>Country</FieldLabel>
                    {renderCountryDropdown()}
                  </div>

                  {/* City */}
                  {formik.values.country_id === "88" ||
                  formik.values.country_id === "185" ? (
                    <div>
                      <FieldLabel required>City</FieldLabel>
                      <div className="relative">
                        <select
                          id="city"
                          name="city"
                          value={formik.values.city}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none"
                        >
                          <option value="">Select City</option>
                          {getCitiesForCountry().map((city) => (
                            <option key={city.id} value={city.city_name}>
                              {city.city_name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <FaChevronRight className="text-gray-400 rotate-90" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <FieldLabel required>City</FieldLabel>
                      <input
                        id="city"
                        type="text"
                        value={formik.values.city}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        placeholder="Enter city"
                      />
                    </div>
                  )}

                  {/* State */}
                  <div>
                    <FieldLabel>State / Province</FieldLabel>
                    <input
                      id="state"
                      type="text"
                      value={formik.values.state}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      placeholder="Enter state or province"
                    />
                  </div>

                  {/* Street */}
                  <div>
                    <FieldLabel required>Street Address</FieldLabel>
                    <input
                      id="street"
                      type="text"
                      value={formik.values.street}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      placeholder="Enter street address"
                    />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <FieldLabel>Zip Code / Postal Code</FieldLabel>
                    <input
                      id="postalcode"
                      type="text"
                      value={formik.values.postalcode}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      placeholder="Enter postal code"
                    />
                  </div>

                  {/* Beneficiary ID Type (for specific currencies) */}
                  {(currency === "BDT" ||
                    currency === "INR" ||
                    currency === "PKR") && (
                    <div>
                      <FieldLabel required>Beneficiary ID Type</FieldLabel>
                      <div className="relative">
                        <select
                          className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none"
                          value={formik.values.beneficiary_id_type}
                          onChange={formik.handleChange}
                          name="beneficiary_id_type"
                        >
                          <option value="">Select ID Type</option>
                          {getIdTypesForCurrency.map((idType) => {
                            const value = idType.name || idType.id || idType;
                            const label = idType.name || idType.id || idType;

                            return (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <FaChevronRight className="text-gray-400 rotate-90" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Beneficiary ID Number (for specific currencies) */}
                  {(currency === "BDT" ||
                    currency === "INR" ||
                    currency === "PKR") && (
                    <div>
                      <FieldLabel required>Beneficiary ID Number</FieldLabel>
                      <input
                        type="text"
                        className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        placeholder="Enter ID Number"
                        value={formik.values.beneficiary_id_number}
                        onChange={formik.handleChange}
                        name="beneficiary_id_number"
                      />
                    </div>
                  )}

                  {/* Relation to Beneficiary (only for individual) */}
                  {formik.values.beneftype === "individual" && (
                    <div className="md:col-span-2">
                      <FieldLabel required>
                        Relation to Beneficiary
                      </FieldLabel>
                      <div className="relative">
                        <select
                          id="relationtobenef"
                          name="relationtobenef"
                          value={formik.values.relationtobenef}
                          onChange={(e) => {
                            formik.handleChange(e);
                            setShowOtherRelationship(
                              e.target.value === "other"
                            );
                          }}
                          onBlur={formik.handleBlur}
                          className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none"
                        >
                          <option value="">-- Select Relationship --</option>
                          {relationshipOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <FaChevronRight className="text-gray-400 rotate-90" />
                        </div>
                      </div>

                      {/* Show input field when "Other" is selected */}
                      {showOtherRelationship && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                          <FieldLabel>
                            Please specify relationship
                          </FieldLabel>
                          <input
                            id="otherRelationship"
                            type="text"
                            className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                            placeholder="Enter relationship"
                            value={formik.values.otherRelationship || ""}
                            name="otherRelationship"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse md:flex-row justify-between pt-8 gap-4 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 flex-1 md:flex-none flex items-center justify-center font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!isFormValid() || isLoading}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center flex-1 md:flex-none font-medium ${
                    !isFormValid() || isLoading
                      ? "bg-gray-300 cursor-not-allowed text-gray-500"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  {isLoading ? (
                    <ClipLoader size={20} color="#ffffff" />
                  ) : (
                    <>
                      Next Step
                      <FaChevronRight className="ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 2 - Bank Information */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mr-4">
                    <FaUniversity size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Beneficiary Bank Details
                    </h2>
                    <p className="text-gray-600">
                      Please provide the bank account information for your beneficiary.
                      {bankAccounts.length > 0 && ` You have ${bankAccounts.length} bank account${bankAccounts.length > 1 ? 's' : ''}.`}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {bankAccounts.map((account, index) =>
                  renderBankAccountFields(index)
                )}

                {/* Add Bank Account Button */}
                <button
                  type="button"
                  onClick={addBankAccount}
                  className="w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 flex flex-col items-center justify-center"
                >
                  <div className="flex items-center text-blue-600">
                    <FaPlus className="mr-3" size={20} />
                    <span className="font-medium">Add Another Bank Account</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    Add multiple accounts for different currencies or payment methods
                  </p>
                </button>

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 flex-1 flex items-center justify-center font-medium"
                  >
                    <FaChevronLeft className="mr-2" />
                    Back to Details
                  </button>
                  <button
                    type="submit"
                    disabled={loading || createLoading || updateLoading}
                    className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center flex-1 font-medium ${
                      loading || createLoading || updateLoading
                        ? "bg-gray-300 cursor-not-allowed text-gray-500"
                        : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {loading || createLoading || updateLoading ? (
                      <>
                        <ClipLoader color="#ffffff" size={20} className="mr-2" />
                        Processing...
                      </>
                    ) : mode === "create" ? (
                      <>
                        <FaCheckCircle className="mr-2" />
                        Create Beneficiary
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="mr-2" />
                        Update Beneficiary
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      <ToastContainer 
        position="bottom-right" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

BeneficiaryForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']),
  initialData: PropTypes.object,
};

BeneficiaryForm.defaultProps = {
  mode: 'create',
  initialData: null,
};

export default BeneficiaryForm;