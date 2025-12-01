import React, { useState, useEffect } from "react";
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
} from "react-icons/fa";

// Import Redux actions and selectors
import {
  createBeneficiaryWithBanks,
  fetchNationalities,
  fetchBanksByCurrency,
  fetchIdTypesByCurrency,
  fetchCitiesByCountry,
  fetchBankBranches,
  clearError,
  clearCreateError,
  clearCreateSuccess,
  resetCreateState,
} from "../AddBeneficiary/addBeneficiarySlice";
import {
  selectCountriesOptionsSafe,
  selectCountries,
  selectPhoneCodeOptions,
  fetchCountries,
} from "../../../features/Auth/slices/countrySlice";

const API_URL = import.meta.env.VITE_API_URL;

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

const AddBeneficiary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { customerId } = useParams();
  const is_payout = location.state?.is_payout || "n";

  // Redux selectors
  const {
    createLoading,
    createError,
    createSuccess,
    nationalities,
    banks,
    idTypes,
    cities,
    bankBranches,
    dropdownLoading,
  } = useSelector((state) => ({
    createLoading: state.beneficiaries?.createLoading || false,
    createError: state.beneficiaries?.createError || null,
    createSuccess: state.beneficiaries?.createSuccess || false,
    nationalities: state.beneficiaries?.nationalities || [],
    banks: state.beneficiaries?.banks || {},
    idTypes: state.beneficiaries?.idTypes || {},
    cities: state.beneficiaries?.cities || {},
    bankBranches: state.beneficiaries?.bankBranches || {},
    dropdownLoading: state.beneficiaries?.dropdownLoading || false,
  }));

  // Countries from Redux
  const countriesOptions = useSelector(selectCountriesOptionsSafe);
  const countries = useSelector(selectCountries);
  const phoneCodeOptions = useSelector(selectPhoneCodeOptions);

  const authtoken = localStorage.getItem("authtoken");
  const bearertoken = localStorage.getItem("bearertoken");

  // States
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [apiError, setApiError] = useState("");
  const [step, setStep] = useState(1);
  const [beneficiaryId, setBeneficiaryId] = useState(null);

  // Beneficiary Bank States
  const [rails, setRails] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [usdMethod, setUsdMethod] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ACH");
  const [accountType, setAccountType] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtherRelationship, setShowOtherRelationship] = useState(false);
  const [branchCode, setBranchCode] = useState("");

  // Define steps array
  const steps = [
    {
      number: 1,
      title: "Beneficiary Details",
      icon: <FaUser className="mr-2" />,
    },
    {
      number: 2,
      title: "Bank Information",
      icon: <FaUniversity className="mr-2" />,
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
  const [bankAccounts, setBankAccounts] = useState([
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
      bankState: "",
      branchCode: "",
      accountName: "",
      accountTitle: "",
      walletProvider: "",
      mobileNumber: "",
      otherProvider: "",
    },
  ]);

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "transparent",
      border: "1px solid #D1D5DB",
      borderRadius: "0.5rem",
      padding: "0px",
      fontSize: "0.875rem",
      color: "#111827",
      boxShadow: "none",
      minHeight: "48px",
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "0.5rem",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#6b7280",
    }),
  };

  // Formik initialization
  const formik = useFormik({
    initialValues: {
      name: "",
      country_id: "",
      country_phone_code: "+1",
      phone_number: "",
      email: "",
      beneftype: "",
      state: "",
      city: "",
      street: "",
      postalcode: "",
      relationtobenef: "",
      otherRelationship: "",
      nationality_id: "",
      status: "1",
      nic_bcc_code: "",
      beneficiary_id_type: "",
      beneficiary_id_number: "",
    },
    onSubmit: async (values) => {
      setIsLoading(true);

      const finalRelationship =
        values.relationtobenef === "other" &&
        values.otherRelationship.trim() !== ""
          ? values.otherRelationship.trim()
          : values.relationtobenef;

      const beneficiaryData = {
        beneftype: values.beneftype,
        name: values.name,
        email: values.email,
        country_id: values.country_id,
        phone_number: values.phone_number,
        state: values.state,
        city: values.city,
        street: values.street,
        postalcode: values.postalcode,
        relationtobenef: finalRelationship,
        nationality_id: values.nationality_id,
        status: values.status,
        bic_ncc_code: values.bic_ncc_code,
        beneficiary_id_type: values.beneficiary_id_type,
        beneficiary_id_number: values.beneficiary_id_number,
      };

      try {
        await dispatch(
          createBeneficiaryWithBanks({
            customerId,
            beneficiaryData,
            bankAccounts,
            currency,
          })
        ).unwrap();

        setMessage("Beneficiary added successfully!");
        setStep(2);
      } catch (error) {
        setMessage("Error adding beneficiary: " + error.message);
      } finally {
        setIsLoading(false);
        setTimeout(() => {
          setMessage("");
        }, 3000);
      }
    },
  });

  useEffect(() => {}, [customerId]);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchNationalities());
    dispatch(fetchCountries()); // Ensure countries are loaded
  }, [dispatch]);

  // Handle errors and success
  useEffect(() => {
    if (createError) {
      toast.error(createError);
      dispatch(clearCreateError());
    }

    if (createSuccess) {
      toast.success("Beneficiary created successfully!");
      dispatch(clearCreateSuccess());
      if (is_payout === "y") {
        navigate(-1);
      } else {
        navigate(`/mybeneficiary/${customerId}`);
      }
    }
  }, [createError, createSuccess, dispatch, is_payout, navigate, customerId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetCreateState());
    };
  }, [dispatch]);

  // Fetch cities when country changes
  useEffect(() => {
    if (formik.values.country_id) {
      dispatch(fetchCitiesByCountry(formik.values.country_id));
    }
  }, [formik.values.country_id, dispatch]);

  // Debug countries data
  useEffect(() => {}, [countriesOptions, countries, phoneCodeOptions]);

  // Debug useEffect to track Redux state changes
  useEffect(() => {
    console.log("=== REDUX STATE UPDATE ===");
    console.log("Current currency:", currency);
    console.log("All ID types in Redux:", idTypes);
    console.log("ID types for current currency:", idTypes[currency]);
    console.log("Type of idTypes[currency]:", typeof idTypes[currency]);

    if (idTypes[currency]) {
      console.log("Is array?", Array.isArray(idTypes[currency]));
      console.log("Array length:", idTypes[currency].length);
      console.log("First item:", idTypes[currency][0]);
    }
  }, [currency, idTypes]);

  // Get cities for selected country
  const getCitiesForCountry = () => {
    return cities[formik.values.country_id] || [];
  };

  const isFormValid = () => {
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

    // ✅ FIXED: Only check ID fields for BDT, INR, PKR
    if (currency === "BDT" || currency === "INR" || currency === "PKR") {
      if (
        formik.values.beneficiary_id_type === "" ||
        formik.values.beneficiary_id_number === ""
      )
        return false;

      if (currency === "INR" && formik.values.city === "") return false;
    }

    return true;
  };

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;

    console.log("=== CURRENCY CHANGE START ===");
    console.log("New currency selected:", newCurrency);
    console.log("Previous currency:", currency);

    setCurrency(newCurrency);

    // ✅ FIX: Reset form values when currency changes
    console.log("Resetting form ID fields...");
    formik.setFieldValue("beneficiary_id_type", "");
    formik.setFieldValue("beneficiary_id_number", "");

    // ✅ FIX: Always fetch ID types for BDT, INR, PKR when selected
    console.log("Checking if currency requires ID types:", newCurrency);
    console.log(
      "Should fetch ID types?",
      ["BDT", "INR", "PKR"].includes(newCurrency)
    );

    if (["BDT", "INR", "PKR"].includes(newCurrency)) {
      console.log(`Dispatching fetchIdTypesByCurrency for ${newCurrency}...`);

      // Store the promise to see the result
      const idTypesPromise = dispatch(fetchIdTypesByCurrency(newCurrency));

      idTypesPromise
        .then((result) => {
          console.log(
            `fetchIdTypesByCurrency SUCCESS for ${newCurrency}:`,
            result
          );
          console.log("Payload data:", result.payload);
          console.log("Meta:", result.meta);
        })
        .catch((error) => {
          console.error(
            `fetchIdTypesByCurrency ERROR for ${newCurrency}:`,
            error
          );
        });
    } else {
      console.log(`Currency ${newCurrency} does not require ID types`);
    }

    // Fetch banks for the currency
    console.log("Fetching banks for currency:", newCurrency);
    console.log(
      "Is int-bank currency?",
      ["BDT", "LKR", "AUD", "PKR"].includes(newCurrency)
    );

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

    // Update currency for all existing bank accounts
    console.log("Updating bank accounts currency to:", newCurrency);
    setBankAccounts((prevAccounts) =>
      prevAccounts.map((account) => ({
        ...account,
        currency: newCurrency,
      }))
    );

    console.log("=== CURRENCY CHANGE END ===");
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  const nextStep = () => {
    // ✅ FIXED: Only validate ID fields for BDT, INR, PKR
    if (currency === "BDT" || currency === "INR" || currency === "PKR") {
      const countryInput = formik.values.country_id;
      if (countryInput === "" || countryInput === " ") {
        alert(`Country Required for Currency: ${currency}`);
        return false;
      }
      const streetInput = formik.values.street;
      if (streetInput === "" || streetInput === " ") {
        alert(`Street Required for Currency: ${currency}`);
        return false;
      }
      const idTypeInput = formik.values.beneficiary_id_type;
      if (idTypeInput === "" || streetInput === " ") {
        alert(`ID Type Required for Currency: ${currency}`);
        return false;
      }

      const idNumber = formik.values.beneficiary_id_number;
      if (idNumber === "" || streetInput === " ") {
        alert(`ID Number Required for Currency: ${currency}`);
        return false;
      }

      if (currency === "INR") {
        const cityInput = formik.values.city;
        if (cityInput === "" || cityInput === " ") {
          alert(`City Required for Currency: ${currency}`);
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

  const handleSubmitBankDetails = async (e) => {
    e.preventDefault();
    setLoading(true);

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

    const isRailsMissing = bankAccounts.some((account) => !account.rails);
    if (isRailsMissing) {
      toast.error("Please select rails for all bank accounts.");
      setLoading(false);
      return;
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

    // Use Redux action to create beneficiary with banks
    try {
      await dispatch(
        createBeneficiaryWithBanks({
          customerId,
          beneficiaryData,
          bankAccounts,
          currency,
        })
      ).unwrap();

      resetForm();
    } catch (error) {
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
        otherProviders: "",
      },
    ]);
  };

  const removeBankAccount = (index) => {
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
  const getBanksForCurrency = () => {
    if (["BDT", "LKR", "AUD", "PKR"].includes(currency)) {
      return banks[`${currency}_int`] || [];
    }
    return banks[currency] || [];
  };

  // Get ID types for current currency
  const getIdTypesForCurrency = () => {
    console.log("=== GET ID TYPES CALLED ===");
    console.log("Current currency:", currency);
    console.log("All ID types object:", idTypes);

    const types = idTypes[currency];
    console.log("Raw types for currency:", types);

    if (!types) {
      console.log("No ID types found for currency");
      return [];
    }

    // Check what format the data is in
    console.log("Type of types:", typeof types);
    console.log("Is array?", Array.isArray(types));

    if (Array.isArray(types)) {
      console.log("Returning array of length:", types.length);
      return types;
    }

    // Check if it's an object with data property
    if (types && types.data && Array.isArray(types.data)) {
      console.log("Returning types.data array of length:", types.data.length);
      return types.data;
    }

    // Try to convert object to array
    if (types && typeof types === "object") {
      const array = Object.values(types);
      console.log("Converted object to array of length:", array.length);
      return array;
    }

    console.log("Falling back to empty array");
    return [];
  };

  // Get bank branches for selected bank
  const getBankBranches = () => {
    const currentBankCode = bankAccounts[0]?.bankCode;
    return currentBankCode ? bankBranches[currentBankCode] || [] : [];
  };

  // In the Phone Number section, update the Select component:
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
          // ✅ No need to set phone_code_country_id anymore
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

  // In the Country dropdown section, update to:
  const renderCountryDropdown = () => (
    <select
      className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      onChange={(e) => {
        const selectedCountryId = e.target.value;
        const selectedCountry = countries.find(
          (country) => country.id === parseInt(selectedCountryId)
        );

        // ✅ Set the country ID (numeric) not the name
        formik.setFieldValue("country_id", selectedCountryId);

        // ✅ Automatically set the phone code when country is selected
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
          {" "}
          {/* ✅ Use country.id here */}
          {country.label} ({country.country_code})
        </option>
      ))}
    </select>
  );

  // Render bank account fields
  // Render bank account fields - COMPLETE VERSION
  const renderBankAccountFields = (index) => {
    const account = bankAccounts[index];
    const accountCurrency = account.currency || currency;
    const currentBanks = getBanksForCurrency();
    const currentIdTypes = getIdTypesForCurrency();
    const currentBankBranches = getBankBranches();

    return (
      <div
        key={index}
        className="p-6 border border-gray-200 rounded-lg bg-gray-50 mb-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">
            Bank Account {index + 1}
          </h3>
          {index > 0 && (
            <button
              type="button"
              onClick={() => removeBankAccount(index)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Remove
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Select Rails */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Select Rails *
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          </div>

          {/* Select Currency */}
          {account.rails !== "Mobile" && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Select Currency *
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Beneficiary ID Type *
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Beneficiary ID Number *
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-1">
                IBAN Number *
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter IBAN number"
                value={account.iban}
                onChange={(e) =>
                  handleBankAccountChange(index, "iban", e.target.value)
                }
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-1">
                SWIFT Code *
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter SWIFT code"
                value={account.swift}
                onChange={(e) =>
                  handleBankAccountChange(index, "swift", e.target.value)
                }
                required
              />
            </div>

            <div className="mb-4 md:col-span-2">
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Intermediary Bank SWIFT (Optional)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <>
            {/* USD Local Transfer */}
            {accountCurrency === "USD" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Payment Method *
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Routing Number *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Bank Account Number *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Account Type *
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Bank Name"
                    value={account.bankName}
                    onChange={(e) =>
                      handleBankAccountChange(index, "bankName", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    IBAN Number *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    IBAN Number *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter IBAN number"
                    value={account.iban}
                    onChange={(e) =>
                      handleBankAccountChange(index, "iban", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    SWIFT/BIC Code *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Bank Name *
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Account Name
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Bank Name *
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Branch Code
                  </label>
                  {accountCurrency === "BDT" ||
                  accountCurrency === "LKR" ||
                  accountCurrency === "AUD" ? (
                    <select
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Bank State
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        IBAN Number
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter IBAN number"
                        value={account.iban}
                        onChange={(e) =>
                          handleBankAccountChange(index, "iban", e.target.value)
                        }
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        Account Title
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Sort Code *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          </>
        )}

        {/* MOBILE TRANSFERS */}
        {account.rails === "Mobile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Mobile Wallet Provider *
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Mobile Number *
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Provider Name *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Loading spinner - Overlay */}
      {(isLoading || createLoading) && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <ClipLoader size={60} color="#3B82F6" />
            <p className="mt-4 text-gray-700">Processing your request...</p>
          </div>
        </div>
      )}

      <div
        className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden flex flex-col"
        style={{ maxHeight: "80vh" }}
      >
        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaMoneyBillWave className="mr-2 text-blue-600" />
              Add Beneficiary
            </h1>
            <button
              onClick={handleCancel}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft className="mr-1" /> Back
            </button>
          </div>

          <div className="flex mb-6">
            {steps.map((stepItem, index) => (
              <div key={stepItem.number} className="flex items-center flex-1">
                <div
                  className={`flex flex-col items-center ${
                    index < steps.length - 1 ? "w-full" : ""
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      step >= stepItem.number
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-300 text-gray-500"
                    } transition-colors`}
                  >
                    {stepItem.number}
                  </div>
                  <div
                    className={`text-xs mt-2 text-center ${
                      step >= stepItem.number
                        ? "text-blue-600 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {stepItem.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > stepItem.number ? "bg-blue-600" : "bg-gray-300"
                    } transition-colors`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {step === 1 && (
            <form onSubmit={formik.handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Beneficiary Type */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beneficiary Type<span className="text-red-500">*</span>
                  </label>
                  <select
                    id="beneftype"
                    name="beneftype"
                    value={formik.values.beneftype}
                    onChange={(e) => {
                      formik.handleChange(e);
                      setShowOtherRelationship(e.target.value === "other");
                    }}
                    onBlur={formik.handleBlur}
                    className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">--Select Beneficiary Type--</option>
                    <option value="individual">Individual</option>
                    <option value="institution">Institution</option>
                  </select>
                </div>

                {/* Currency Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                </div>

                {formik.values.beneftype && (
                  <>
                    {/* Individual/Institution beneficiary fields */}
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name<span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter beneficiary name"
                        value={formik.values.name}
                        name="name"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter email address"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="flex flex-col md:flex-row gap-2">
                        {renderPhoneCodeSelector()}
                        <div className="w-full md:flex-1">
                          <input
                            id="phone_number"
                            type="tel"
                            className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nationality
                      </label>
                      <select
                        className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country<span className="text-red-500">*</span>
                      </label>
                      {renderCountryDropdown()}
                    </div>

                    {/* City */}
                    {formik.values.country_id === "88" ||
                    formik.values.country_id === "185" ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City<span className="text-red-500">*</span>
                        </label>
                        <select
                          id="city"
                          name="city"
                          value={formik.values.city}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select City</option>
                          {getCitiesForCountry().map((city) => (
                            <option key={city.id} value={city.city_name}>
                              {city.city_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City<span className="text-red-500">*</span>
                        </label>
                        <input
                          id="city"
                          type="text"
                          value={formik.values.city}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter city"
                        />
                      </div>
                    )}

                    {/* State */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        id="state"
                        type="text"
                        value={formik.values.state}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter state"
                      />
                    </div>

                    {/* Street */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street<span className="text-red-500">*</span>
                      </label>
                      <input
                        id="street"
                        type="text"
                        value={formik.values.street}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter street address"
                      />
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zip Code / Postal Code
                      </label>
                      <input
                        id="postalcode"
                        type="text"
                        value={formik.values.postalcode}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter postal code"
                      />
                    </div>

                    {/* Beneficiary ID Type (for specific currencies) */}
                    {(currency === "BDT" ||
                      currency === "INR" ||
                      currency === "PKR") && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Beneficiary ID Type
                        </label>
                        <select
                          className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={formik.values.beneficiary_id_type}
                          onChange={formik.handleChange}
                          name="beneficiary_id_type"
                        >
                          <option value="">Select ID Type</option>
                          {(() => {
                            const idTypeOptions = getIdTypesForCurrency();
                            console.log(
                              "Rendering dropdown with options:",
                              idTypeOptions
                            );
                            console.log("Options count:", idTypeOptions.length);

                            return idTypeOptions.map((idType) => {
                              console.log("Mapping ID type:", idType);
                              const value = idType.name || idType.id || idType;
                              const label = idType.name || idType.id || idType;

                              return (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              );
                            });
                          })()}
                        </select>
                      </div>
                    )}

                    {/* Beneficiary ID Number (for specific currencies) */}
                    {(currency === "BDT" ||
                      currency === "INR" ||
                      currency === "PKR") && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Beneficiary ID Number
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Relation to Beneficiary
                          <span className="text-red-500">*</span>
                        </label>
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
                          className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">-- Select Relationship --</option>
                          {relationshipOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        {/* Show input field when "Other" is selected */}
                        {showOtherRelationship && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Please specify relationship
                            </label>
                            <input
                              id="otherRelationship"
                              type="text"
                              className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse md:flex-row justify-between mt-8 gap-4">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-300 flex-1 md:flex-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!isFormValid() || isLoading}
                  className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center flex-1 md:flex-none ${
                    !isFormValid() || isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isLoading ? (
                    <ClipLoader size={20} color="#ffffff" />
                  ) : (
                    "Next →"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 2 - Bank Information */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Beneficiary Bank Details
              </h2>
              <p className="text-gray-600 mb-6">
                Please provide the bank account information for your
                beneficiary.
              </p>

              <form onSubmit={handleSubmitBankDetails}>
                {bankAccounts.map((account, index) =>
                  renderBankAccountFields(index)
                )}

                <div className="flex flex-col md:flex-row gap-4 mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-300 flex-1"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={addBankAccount}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-300 flex-1"
                  >
                    + Add Another Bank Account
                  </button>
                  <button
                    type="submit"
                    disabled={loading || createLoading}
                    className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center flex-1 ${
                      loading || createLoading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {loading || createLoading ? (
                      <ClipLoader color="#ffffff" size={20} />
                    ) : (
                      "Create Beneficiary"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default AddBeneficiary;
