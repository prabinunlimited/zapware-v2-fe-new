import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import Select from "react-select";
import { FiPlusCircle } from "react-icons/fi";
import axios from "axios";

// Redux imports
import {
  // Selectors
  selectFormValues,
  selectCustomerBankAccounts,
  selectBenefBankAccounts,
  selectBeneficiaryBanks,
  selectDestinationCurrencies,
  selectCountries,
  selectCurrencies,
  selectConversionData,
  selectAvailableBalance,
  selectLoading,
  selectBenefLoading,
  selectVerifying,
  selectModalStates,
  selectModalMessage,
  selectPasscode,
  selectServiceProviderInr,

  // Actions
  setFormValue,
  setFormValues,
  setFileValue,
  setShowModal,
  setShowSuccessModal,
  setShowErrorModal,
  setShowPasscodeModal,
  setModalMessage,
  setPasscode,
  setLoading,
  setBenefLoading,
  setVerifying,

  // Thunks
  fetchDestinationCurrencies,
  fetchCustomerBankAccounts,
  fetchBeneficiaryAccounts,
  fetchBeneficiaryBanks,
  fetchCountries,
  fetchCurrenciesForCountry,
  fetchServiceProvider,
  fetchBalance,
  convertCurrency,
  sendPasscode,
  verifyPasscode,
  submitPayout,
} from "./slices/payoutSlice";

// import { useNotifications } from "../../../context/NotificationContext";

const API_URL = import.meta.env.REACT_APP_API_URL;

const PayoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId } = useParams();
  // const { addNotification } = useNotifications();
  const bearertoken = localStorage.getItem("bearertoken");

  // Select state from Redux
  const formValues = useSelector(selectFormValues);
  const customerBankAccounts = useSelector(selectCustomerBankAccounts);
  const benefBankAccounts = useSelector(selectBenefBankAccounts);
  const beneficiaryBanks = useSelector(selectBeneficiaryBanks);
  const destinationCurrencies = useSelector(selectDestinationCurrencies);
  const countries = useSelector(selectCountries);
  const currencies = useSelector(selectCurrencies);
  const {
    convertedValue,
    convertedId,
    fxRate,
    swiftRate,
    payoutRate,
    toServiceProvider,
  } = useSelector(selectConversionData);
  const availableBalance = useSelector(selectAvailableBalance);
  const loading = useSelector(selectLoading);
  const benefLoading = useSelector(selectBenefLoading);
  const verifying = useSelector(selectVerifying);
  const { showModal, showSuccessModal, showErrorModal, showPasscodeModal } =
    useSelector(selectModalStates);
  const modalMessage = useSelector(selectModalMessage);
  const passcode = useSelector(selectPasscode);
  const toServiceProviderInr = useSelector(selectServiceProviderInr);

  // Local state for recurring payments
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("");
  const [customDays, setCustomDays] = useState("");

  // Initialize form with customerId
  useEffect(() => {
    dispatch(setFormValue({ name: "customer_id", value: customerId }));
  }, [customerId, dispatch]);

  // Fetch initial data
  useEffect(() => {
    const authtoken = localStorage.getItem("authtoken");
    if (customerId && authtoken) {
      dispatch(fetchCustomerBankAccounts(customerId));
      dispatch(fetchCountries());
      dispatch(fetchDestinationCurrencies());
    }
  }, [customerId, dispatch]);

  // Handlers
  const handleChange = async (e) => {
    const { name, value } = e.target;
    dispatch(setFormValue({ name, value }));

    // Handle dependent data fetching
    if (name === "benef_account" && value) {
      dispatch(
        fetchBeneficiaryBanks({
          currency_code: formValues.to,
          beneficiaryId: value,
          payment_method: formValues.transaction_type,
        })
      );
    }

    if (name === "country_id") {
      dispatch(fetchCurrenciesForCountry(value));
    }

    if (name === "to" && value) {
      dispatch(fetchServiceProvider(value));
      dispatch(fetchBeneficiaryAccounts({ customerId, currencyCode: value }));
    }

    if (name === "from") {
      dispatch(fetchBalance({ customer_id: customerId, currency_code: value }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    if (file) {
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        alert("Please upload a file of type PDF, JPG, JPEG, or PNG.");
        return;
      }
      dispatch(setFileValue({ name, file }));
    }
  };

  const handleConvert = async () => {
    const selectedAccount = customerBankAccounts.find(
      (account) => account.currency_code === formValues.from
    );

    const payload = {
      current_date_time: new Date().toLocaleString(),
      bank_id: selectedAccount ? selectedAccount.id : null,
      customer_id: formValues.customer_id,
      from: formValues.from,
      to: formValues.to,
      value: formValues.value,
      benefId: formValues.benef_account,
      payment_method: formValues.transaction_type,
      benef_bank_account: formValues.benef_bank_account,
      description: formValues.description,
    };

    dispatch(convertCurrency(payload));
  };

  const handleSendPasscode = async () => {
    dispatch(sendPasscode(customerId));
  };

  const handleVerifyAndConvert = async (e) => {
    if (!passcode) return alert("Please enter passcode");

    try {
      const res = await dispatch(
        verifyPasscode({
          customer_id: customerId,
          passcode: passcode,
        })
      ).unwrap();

      if (res.Status === "success") {
        // Handle B4B payment scenario
        const toprovider = await axios.get(
          `${API_URL}/get-sp-currency/${formValues.to}`,
          {
            headers: {
              Authorization: `Bearer ${bearertoken}`,
            },
          }
        );

        const serviceProviderId = Number(toprovider.data.service_provider_id);

        const selectedAccount = customerBankAccounts.find(
          (account) => account.currency_code === formValues.from
        );

        const payload = {
          current_date_time: new Date().toLocaleString(),
          bank_id: selectedAccount ? selectedAccount.id : null,
          customer_id: formValues.customer_id,
          from: formValues.from,
          to: formValues.to,
          value: formValues.value,
          benefId: formValues.benef_account,
          payment_method: formValues.transaction_type,
          benef_bank_account: formValues.benef_bank_account,
          description: formValues.description,
        };

        if (
          serviceProviderId !== 27 &&
          ((formValues.from === "GBP" && formValues.to === "GBP") ||
            (formValues.from === "GBP" && formValues.to === "DKK") ||
            (formValues.from === "GBP" && formValues.to === "EUR") ||
            (formValues.from === "EUR" && formValues.to === "EUR") ||
            (formValues.from === "EUR" && formValues.to === "GBP") ||
            (formValues.from === "EUR" && formValues.to === "DKK") ||
            (formValues.from === "DKK" && formValues.to === "GBP") ||
            (formValues.from === "DKK" && formValues.to === "EUR") ||
            (formValues.from === "DKK" && formValues.to === "DKK") ||
            (formValues.from === "USD" && formValues.to === "USD"))
        ) {
          // Call createpayments API after successful verification
          const res = await axios.post(
            "https://sandbox-zapware.unlimitedremit.com/api/b4b/createpayments",
            payload
          );

          if (res.data.status === "Success") {
            dispatch(setShowModal(false));
            dispatch(setModalMessage("Payout initiated successfully!"));
            dispatch(setShowSuccessModal(true));
          } else {
            dispatch(setModalMessage(res.data.message));
            dispatch(setShowErrorModal(true));
          }
        } else {
          await handleSubmit(e, isRecurring, recurringFrequency, customDays);
        }
      } else {
        // Handle case where Status is not "success"
        dispatch(setModalMessage(res.message || "Invalid passcode"));
        dispatch(setShowErrorModal(true));
      }
    } catch (err) {
      console.error("Passcode verification error:", err);
      dispatch(
        setModalMessage(
          err.response?.data?.message || err.message || "Verification failed"
        )
      );
      dispatch(setShowErrorModal(true));
    }
  };

  const handleSubmit = async (
    e,
    isRecurring,
    recurringFrequency,
    customDays
  ) => {
    e.preventDefault();

    const selectedAccount = customerBankAccounts.find(
      (account) => account.currency_code === formValues.from
    );

    const formData = new FormData();

    // FIX: Use the convertedValue from Redux state instead of formValues
    formData.append("convertedValue", convertedValue); // Changed this line
    formData.append("amount", formValues.value);
    formData.append("purpose", formValues.purpose);
    formData.append("promo_code", formValues.promocode);
    formData.append("convertedId", convertedId);
    formData.append("currency", formValues.to);
    formData.append("source_currency", formValues.from);
    formData.append("destination_country", formValues.destination_country);
    formData.append("source_country", formValues.source_country);
    formData.append("pay_mode", formValues.pay_mode);
    formData.append("payment_method", formValues.transaction_type);
    formData.append("remarks", formValues.remarks);
    formData.append("income_source", formValues.income_source);
    formData.append("transfer_purpose", formValues.transfer_purpose);
    formData.append("occupation", formValues.occupation);
    formData.append("benef_account", formValues.benef_account);
    formData.append("benef_bank_account", formValues.benef_bank_account);
    formData.append("bank_id", selectedAccount ? selectedAccount.id : null);
    formData.append("customer_id", formValues.customer_id);
    formData.append("description", formValues.description);
    formData.append("country_id", formValues.country_id);
    formData.append("transaction_type", formValues.transaction_type);

    // Append recurring payment fields
    formData.append("is_recurring", isRecurring ? 1 : 0);
    if (isRecurring) {
      formData.append("recurring_frequency", recurringFrequency);
      if (
        recurringFrequency === "specific_day" ||
        recurringFrequency === "custom"
      ) {
        formData.append("recurring_custom_days", customDays);
      }
    }

    // Append file if exists
    if (formValues.invoice_file) {
      formData.append("invoice_file", formValues.invoice_file);
    }

    dispatch(submitPayout(formData));
  };

  const handleAddBeneficiary = () => {
    navigate(`/addbeneficiary/${customerId}`, {
      state: { is_payout: "y" },
    });
  };

  // Helper functions
  const getAvailableTransactionTypes = (currency, providerId) => {
    if (currency === "KES") {
      if (providerId === 33) return ["mobile"];
      if (providerId === 41) return ["bank"];
    }

    const payoutMethodsByCurrency = {
      USD: ["swift", "bank"],
      NPR: ["bank"],
      INR: ["bank"],
      KES: ["bank"],
      AED: ["bank"],
      PKR: ["bank"],
      LKR: ["bank"],
      BDT: ["bank"],
      MYR: ["bank"],
      NGN: ["bank"],
      GMD: ["cash", "bank", "mobile"],
      VND: ["card", "bank"],
      GBP: ["bank"],
      EUR: ["bank"],
      DKK: ["bank"],
    };

    return payoutMethodsByCurrency[currency] || [];
  };

  const availableTransactionTypes = getAvailableTransactionTypes(
    formValues.to,
    toServiceProviderInr
  );

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "transparent",
      border: "0px",
      borderRadius: "0.5rem",
      padding: "0px",
      fontSize: "1rem",
      color: "#111827",
      boxShadow: "none",
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "0.5rem",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "hsl(0, 0%, 20%)",
      fontWeight: 600,
    }),
  };

  const countryOptions = countries.map((country) => ({
    value: country.country_code3,
    label: country.name,
  }));

  const destinationcountryOptions = countries.map((country) => ({
    value: country.id,
    label: country.name,
  }));

  const aedPurpose = [
    { value: "charity", label: "Charity" },
    { value: "family", label: "Family" },
    { value: "financial_services", label: "Financial Services" },
    { value: "salaries", label: "Salaries" },
    { value: "utility_bill", label: "utility_bill" },
    { value: "goods_sold", label: "Goods Sold" },
    { value: "goods_bought", label: "Goods Bought" },
    { value: "information_technology", label: "information_technology" },
    { value: "telecommunications", label: "Tele Communications" },
    { value: "none", label: "None" },
  ];

  // Field visibility helpers
  const showIncomeSourceField = () => {
    if (
      ["INR", "MYR", "KES", "PKR", "GBP", "EUR"].includes(formValues.to) &&
      toServiceProviderInr === 27
    )
      return true;
    if (
      ["NPR", "KES", "BDT", "LKR"].includes(formValues.to) &&
      toServiceProviderInr !== 41
    )
      return true;
    if (toServiceProviderInr === 41) return true;
    return false;
  };

  const showTransferPurposeField = () => {
    if (
      ["INR", "MYR", "KES", "GBP", "EUR"].includes(formValues.to) &&
      toServiceProviderInr === 27
    )
      return true;
    if (
      ["NPR", "KES", "BDT", "LKR", "PKR", "NGN"].includes(formValues.to) &&
      toServiceProviderInr !== 41 &&
      toServiceProviderInr !== 49
    )
      return true;
    if (toServiceProviderInr === 49 || toServiceProviderInr === 41) return true;
    return false;
  };

  return (
    <div className="flex flex-col justify-center items-center w-full h-full bg-gray-100">
      {/* Loading states */}
      {loading && (
        <>
          <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50"></div>
          <div className="absolute inset-0 flex justify-center items-center z-50">
            <ClipLoader color="#36d7b7" loading={loading} size={50} />
          </div>
        </>
      )}

      {benefLoading && (
        <>
          <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50"></div>
          <div className="absolute inset-0 flex justify-center items-center z-50">
            <ClipLoader color="#36d7b7" loading={benefLoading} size={50} />
          </div>
        </>
      )}

      <form className="w-full h-full flex flex-col md:flex-row bg-white shadow-lg rounded-lg p-8 space-y-8 md:space-y-0 md:space-x-8">
        <div className="flex-1 bg-white p-10 shadow-xl rounded-lg space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
            <h1 className="text-3xl font-semibold text-gray-800">Payout</h1>
            <button
              type="button"
              onClick={handleAddBeneficiary}
              className="py-2 px-4 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-500 transition-all duration-300 ease-out w-full sm:w-auto"
            >
              Add Beneficiary
            </button>
          </div>

          {/* Source Currency */}
          <div className="mb-8">
            <label
              htmlFor="from"
              className="block text-sm font-medium text-gray-700"
            >
              Source Currency
            </label>
            <select
              name="from"
              value={formValues.from}
              onChange={handleChange}
              className="w-full px-5 py-4 mt-2 border appearance-none border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
              required
            >
              <option value="">Select Currency</option>
              {customerBankAccounts.map((account) => (
                <option key={account.id} value={account.currency_code}>
                  {account.currency_code}
                </option>
              ))}
            </select>
          </div>

          {availableBalance !== null && (
            <div className="mt-2 text-sm text-green-600 font-medium">
              Available Balance: {availableBalance} {formValues.from}
            </div>
          )}

          {/* Source Amount */}
          <div className="mb-8">
            <label
              htmlFor="value"
              className="block text-sm font-medium text-gray-700"
            >
              Source Amount
            </label>
            <input
              type="number"
              name="value"
              value={formValues.value}
              onChange={handleChange}
              placeholder="Enter amount"
              className="w-full px-5 py-4 mt-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
              required
            />
          </div>

          {/* Destination Currency */}
          {formValues.transaction_type !== "swift" && (
            <div className="mb-8">
              <label
                htmlFor="to"
                className="block text-sm font-medium text-gray-700"
              >
                Destination Currency
              </label>
              <select
                name="to"
                value={formValues.to}
                onChange={handleChange}
                className="w-full px-5 py-4 mt-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
              >
                <option value="" disabled>
                  Select Destination Currency
                </option>
                {destinationCurrencies.map((currency) => (
                  <option
                    key={currency.currency_code}
                    value={currency.currency_code}
                  >
                    {currency.currency_code}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Method */}
          {formValues.to && (
            <div className="mb-8">
              <label
                htmlFor="transaction_type"
                className="block text-sm font-medium text-gray-700"
              >
                Payment Method
              </label>
              <select
                name="transaction_type"
                value={formValues.transaction_type}
                onChange={handleChange}
                className="w-full px-5 py-4 mt-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
              >
                <option value="" disabled>
                  Select Payment Method
                </option>
                {availableTransactionTypes.map((method) => (
                  <option key={method} value={method}>
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* SWIFT Specific Fields */}
          {formValues.transaction_type === "swift" && (
            <>
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700">
                  Select Destination Country
                </label>
                {loading ? (
                  <p className="text-gray-500 text-sm mt-2">Loading...</p>
                ) : (
                  <Select
                    options={destinationcountryOptions}
                    onChange={(selectedOption) =>
                      handleChange({
                        target: {
                          name: "country_id",
                          value: selectedOption?.value,
                        },
                      })
                    }
                    value={destinationcountryOptions.find(
                      (option) => option.value === formValues.country_id
                    )}
                    className="w-full px-5 py-4 mt-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
                    classNamePrefix="react-select"
                    placeholder="Select Destination Country"
                    styles={customStyles}
                  />
                )}
              </div>

              {currencies.length > 0 && (
                <div className="mb-8">
                  <label
                    htmlFor="to"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Select Destination Currency
                  </label>
                  <select
                    name="to"
                    value={formValues.to}
                    onChange={handleChange}
                    className="w-full px-5 py-4 mt-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
                  >
                    <option value="" disabled>
                      Select Currency
                    </option>
                    {currencies.map((currency) => (
                      <option
                        key={currency.currency_id}
                        value={currency.currency.currency_code}
                      >
                        {currency.currency.currency_code}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* AED Purpose Code */}
          {formValues.to === "AED" && (
            <div className="mb-8">
              <label
                htmlFor="purpose"
                className="block text-sm font-medium text-gray-700"
              >
                Purpose Code
              </label>
              <select
                name="purpose"
                value={formValues.purpose}
                onChange={handleChange}
                className="w-full px-5 py-4 mt-2 appearance-none border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
              >
                <option value="">Select a Purpose</option>
                {aedPurpose.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Promocode */}
          {["AED", "KES"].includes(formValues.to) && (
            <div className="mb-8">
              <label
                htmlFor="promocode"
                className="block text-sm font-medium text-gray-700"
              >
                Promocode (optional)
              </label>
              <input
                type="text"
                name="promocode"
                value={formValues.promocode}
                onChange={handleChange}
                placeholder="Enter promocode"
                className="w-full px-5 py-4 mt-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
              />
            </div>
          )}

          {/* INR Specific Fields */}
          {formValues.to === "INR" && toServiceProvider === 25 && (
            <div className="mb-8">
              <label
                htmlFor="pay_mode"
                className="block text-sm font-medium text-gray-700"
              >
                PayMode
              </label>
              <select
                name="pay_mode"
                value={formValues.pay_mode}
                onChange={handleChange}
                className="w-full px-5 py-4 mt-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
              >
                <option value="" disabled>
                  Select PayMode
                </option>
                <option value="IM">IMPS</option>
              </select>
            </div>
          )}

          {formValues.to === "INR" && (
            <div className="mb-8">
              <label
                htmlFor="remarks"
                className="block text-sm font-medium text-gray-700"
              >
                Remarks
              </label>
              <input
                type="text"
                name="remarks"
                value={formValues.remarks}
                onChange={handleChange}
                placeholder="Enter Remarks"
                className="w-full px-5 py-4 mt-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
              />
            </div>
          )}

          {/* USD Invoice Upload */}
          {formValues.to === "USD" &&
            formValues.from !== "GBP" &&
            formValues.transaction_type !== "swift" && (
              <div className="mb-8">
                <label
                  htmlFor="invoice_file"
                  className="block text-sm font-medium text-gray-700"
                >
                  Invoice Upload (optional)
                </label>
                <input
                  type="file"
                  name="invoice_file"
                  onChange={handleFileChange}
                  className="w-full px-5 py-4 mt-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
                />
              </div>
            )}

          {/* Income Source */}
          {showIncomeSourceField() && (
            <div className="mb-8">
              <label
                htmlFor="income_source"
                className="block text-sm font-medium text-gray-700"
              >
                Income Source
              </label>
              <select
                name="income_source"
                value={formValues.income_source}
                onChange={handleChange}
                className="w-full px-5 py-4 mt-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
              >
                <option value="" disabled>
                  Select Income Source
                </option>
                {toServiceProviderInr === 41 ? (
                  <>
                    <option value="1">PERSONAL SAVINGS</option>
                    <option value="2">SALARY</option>
                    <option value="3">END OF SERVICE FUNDS</option>
                    <option value="4">LOAN FROM FINANCIAL INSTITUTION</option>
                    <option value="5">BUSINESS</option>
                    <option value="6">OTHERS</option>
                  </>
                ) : (
                  <>
                    <option value="SAL">SALARIED</option>
                    <option value="PIE">PERSONAL INCOME</option>
                    <option value="BUS">BUSINESS</option>
                    <option value="LON">LOAN</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Transfer Purpose */}
          {showTransferPurposeField() && (
            <div className="mb-8">
              <label
                htmlFor="transfer_purpose"
                className="block text-sm font-medium text-gray-700"
              >
                Transfer Purpose
              </label>
              <select
                name="transfer_purpose"
                value={formValues.transfer_purpose}
                onChange={handleChange}
                className="w-full px-5 py-4 mt-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
              >
                <option value="" disabled>
                  Select Transfer Purpose
                </option>
                {toServiceProviderInr === 49 ? (
                  <>
                    <option value="1">FAMILY MAINTENANCE</option>
                    <option value="2">EDUCATION</option>
                    <option value="3">MEDICAL</option>
                    <option value="4">INVESTMENT</option>
                    <option value="5">TOURISM</option>
                  </>
                ) : toServiceProviderInr === 41 ? (
                  <>
                    <option value="1">FAMILY MAINTENANCE</option>
                    <option value="2">MEDICAL</option>
                    <option value="3">TRAVEL AND TOURISM</option>
                    <option value="4">EDUCATION</option>
                    <option value="5">ACCOUNT OPENING</option>
                    <option value="6">SAVINGS</option>
                    <option value="7">INSURANCE</option>
                    <option value="8">INVESTMENT IN MUTUAL FUNDS/SHARES</option>
                    <option value="9">LOAN PAYMENT</option>
                    <option value="10">SALARY</option>
                    <option value="11">TAX PAYMENT</option>
                  </>
                ) : toServiceProviderInr === 27 ? (
                  <>
                    <option value="FAM">Family Maintenance</option>
                    <option value="SAV">SAVINGS</option>
                    <option value="TRE">TRADE REMITTANCE</option>
                  </>
                ) : (
                  <>
                    <option value="FAM">FAMILY</option>
                    <option value="SAV">SAVINGS</option>
                    <option value="RE">REMITTANCE</option>
                    <option value="GIFT">GIFT</option>
                    <option value="TRE">TRADE REMITTANCE</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Occupation */}
          {formValues.to === "NPR" && (
            <div className="mb-8">
              <label
                htmlFor="occupation"
                className="block text-sm font-medium text-gray-700"
              >
                Occupation
              </label>
              <input
                type="text"
                name="occupation"
                value={formValues.occupation}
                onChange={handleChange}
                placeholder="Enter Occupation"
                className="w-full px-5 py-4 mt-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
              />
            </div>
          )}

          {/* Beneficiary Selection */}
          <div className="mb-8">
            <label
              htmlFor="benef_account"
              className="block text-sm font-medium text-gray-700"
            >
              Select Beneficiary
            </label>
            <div className="flex items-center gap-2">
              <select
                name="benef_account"
                value={formValues.benef_account}
                onChange={handleChange}
                className="w-full px-5 py-4 border appearance-none border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
                required
              >
                <option value="">Select a beneficiary</option>
                {benefBankAccounts.map((benefBankAccount) => (
                  <option key={benefBankAccount.id} value={benefBankAccount.id}>
                    {benefBankAccount.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddBeneficiary}
                className="p-2 text-blue-600 rounded-lg shadow-lg hover:text-blue-500 transition-all duration-300 ease-out"
              >
                <FiPlusCircle size={28} />
                <span className="font-semibold text-lg">Add</span>
              </button>
            </div>
          </div>

          {/* Beneficiary Bank Account */}
          {beneficiaryBanks.length > 0 && (
            <div className="mb-8">
              <label
                htmlFor="benef_bank_account"
                className="block text-sm font-medium text-gray-700"
              >
                Select Beneficiary Bank Account
              </label>
              <select
                name="benef_bank_account"
                value={formValues.benef_bank_account}
                onChange={handleChange}
                className="w-full px-5 py-4 mt-2 border appearance-none border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
              >
                <option value="">Select a bank account</option>
                {beneficiaryBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.payment_method === "Swift"
                      ? `${bank.benef_iban || "N/A"} - ${bank.swift || "N/A"}`
                      : bank.rails === "Card"
                      ? `(${bank.rails}) ${bank.bank_name} - ${
                          bank.card_number || "N/A"
                        }`
                      : bank.bank_acc_no
                      ? `${bank.bank_name} - ${bank.bank_acc_no}`
                      : `${bank.benef_iban || "N/A"}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div className="mb-8">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <input
              type="text"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              className="w-full px-5 py-4 mt-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-lg font-semibold text-gray-900"
              required
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-center space-x-6 w-full mt-6">
            <button
              type="button"
              onClick={handleConvert}
              className={`w-2/3 py-4 text-lg bg-green-800 text-white rounded-lg shadow-lg hover:bg-green-700 transition-all duration-300 ease-out transform ${
                loading ? "bg-gray-700 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Processing..." : "Submit"}
            </button>

            <button
              type="button"
              onClick={() => navigate(`/newhomepage/${customerId}`)}
              className="w-2/3 py-4 text-lg bg-red-800 text-white rounded-lg shadow-lg hover:bg-red-500 transition-all duration-300 ease-out transform"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>

      {/* Back to Dashboard Button */}
      <div className="flex justify-center items-center mt-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-3 px-6 py-3 rounded-xl text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors duration-200 font-sans text-base"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Conversion Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-gray-900 bg-opacity-60">
          <div className="bg-white p-8 rounded-lg shadow-xl space-y-6 max-w-lg mx-auto relative">
            <button
              onClick={() => dispatch(setShowModal(false))}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>

            <div className="text-center">
              <p className="text-lg font-medium text-gray-700">
                FX Rate:{" "}
                <span className="font-semibold text-indigo-600">
                  {formValues.from} 1 = {formValues.to}{" "}
                  {fxRate ? parseFloat(fxRate).toFixed(4) : "1.0000"}
                </span>
              </p>
              <p className="text-xl mt-4 font-semibold text-gray-800">
                Txn Amount:{" "}
                <span className="text-xl font-bold text-teal-600">
                  {formValues.from}{" "}
                  {parseFloat(formValues.value || 0).toFixed(2)}
                </span>
              </p>
              <p className="text-xl mt-4 font-semibold text-gray-800">
                Fee:{" "}
                <span className="text-xl font-bold text-teal-600">
                  {formValues.transaction_type === "bank" ||
                  formValues.transaction_type === "mobile"
                    ? `${formValues.from} ${parseFloat(payoutRate || 0).toFixed(
                        2
                      )}`
                    : `${formValues.from} ${parseFloat(swiftRate || 0).toFixed(
                        2
                      )}`}
                </span>
              </p>
              <p className="text-xl mt-4 font-semibold text-gray-800">
                Amount to be deducted:{" "}
                <span className="text-xl font-bold text-teal-600">
                  {formValues.transaction_type === "bank" ||
                  formValues.transaction_type === "mobile"
                    ? `${formValues.from} ${(
                        parseFloat(formValues.value || 0) +
                        parseFloat(payoutRate || 0)
                      ).toFixed(2)}`
                    : `${formValues.from} ${(
                        parseFloat(formValues.value || 0) +
                        parseFloat(swiftRate || 0)
                      ).toFixed(2)}`}
                </span>
              </p>
              <p className="text-xl mt-4 font-semibold text-gray-800">
                Amount to be deposited:{" "}
                <span className="text-xl font-bold text-teal-600">
                  {formValues.to}{" "}
                  {convertedValue
                    ? parseFloat(convertedValue).toFixed(2)
                    : "0.00"}
                </span>
              </p>
            </div>

            <h3 className="text-md text-gray-800 text-center mt-6 font-semibold">
              Do you want to continue with the payout?
            </h3>

            <div className="flex justify-center space-x-6 mt-6">
              <button
                type="button"
                onClick={handleSendPasscode}
                className="bg-green-600 text-white py-2 px-6 rounded-lg"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/newhomepage/${customerId}`)}
                className="bg-red-600 text-white py-2 px-6 rounded-lg"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passcode Modal */}
      {showPasscodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              Enter the verification code we emailed to you
            </h2>
            <input
              type="text"
              value={passcode}
              onChange={(e) => dispatch(setPasscode(e.target.value))}
              className="w-full p-3 border rounded mb-4"
              placeholder="Enter your 6-digit passcode"
            />
            <div className="flex justify-end space-x-3">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => dispatch(setShowPasscodeModal(false))}
              >
                Cancel
              </button>
              <button
                className="bg-green-700 text-white px-4 py-2 rounded"
                onClick={handleVerifyAndConvert}
                disabled={verifying}
              >
                {verifying ? "Verifying..." : "Verify & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-gray-900 bg-opacity-60">
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-11/12 max-h-[90vh] overflow-y-auto md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto space-y-6">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mt-4">
                Success!
              </h3>
              <p className="mt-2 text-sm text-gray-600">{modalMessage}</p>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  dispatch(setShowSuccessModal(false));
                  navigate(-1);
                }}
                className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-gray-900 bg-opacity-60">
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-11/12 max-h-[90vh] overflow-y-auto md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto space-y-6">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
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
              <h3 className="text-xl font-semibold text-gray-900 mt-4">
                Error
              </h3>
              <p className="mt-2 text-sm text-gray-600">{modalMessage}</p>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => dispatch(setShowErrorModal(false))}
                className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutPage;
