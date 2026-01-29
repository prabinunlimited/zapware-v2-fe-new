import React, { useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import BaseBeneficiaryForm from "./BaseBeneficiaryForm";

// Import ALL your Redux actions and selectors
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

// Import from beneficiarySlice
import {
  searchBeneficiaryByPhone,
  selectPhoneSearch,
  selectPhoneSearchLoading,
  selectPhoneExists,
  selectPhoneSearchData,
  clearPhoneSearch,
  createAndAddBeneficiary,
  fetchBeneficiaries,
  selectCreateLoading as selectBeneficiariesCreateLoading,
  selectCreateError as selectBeneficiariesCreateError,
  selectCreateSuccess as selectBeneficiariesCreateSuccess,
  clearCreateState as clearBeneficiariesCreateState,
  selectBeneficiaries,
  setPhoneSearchProcessed,
} from "../MyBeneficiaries/BeneficiariesSlice";

import {
  selectCountriesOptionsSafe,
  selectCountries,
  selectPhoneCodeOptions,
  fetchCountries,
} from "../../../features/Auth/slices/countrySlice";

const PrivateBeneficiaryForm = ({ mode = "create", initialData = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const params = useParams();
  const isMounted = useRef(true);

  // Get IDs from params
  let customerId, beneficiaryId;
  if (mode === "create") {
    customerId = params.customerId;
    beneficiaryId = null;
  } else {
    beneficiaryId = params.beneficiaryId;
    customerId =
      location.state?.customerId || localStorage.getItem("currentCustomerId");
  }

  // ========== REDUX SELECTORS ==========
  const createLoading = useSelector(selectBeneficiariesCreateLoading);
  const createError = useSelector(selectBeneficiariesCreateError);
  const createSuccess = useSelector(selectBeneficiariesCreateSuccess);

  const updateLoading = useSelector(selectUpdateLoading);
  const updateError = useSelector(selectUpdateError);
  const updateSuccess = useSelector(selectUpdateSuccess);

  const nationalities = useSelector(selectNationalities);
  const banks = useSelector(selectBanks);
  const idTypes = useSelector(selectIdTypes);
  const cities = useSelector(selectCities);
  const bankBranches = useSelector(selectBankBranches);
  const dropdownLoading = useSelector(selectDropdownLoading);
  const beneficiaryDetails = useSelector(selectBeneficiaryData);

  const beneficiaries = useSelector(selectBeneficiaries);
  const phoneSearch = useSelector(selectPhoneSearch);
  const phoneSearchLoading = useSelector(selectPhoneSearchLoading);

  const countriesOptions = useSelector(selectCountriesOptionsSafe);
  const countries = useSelector(selectCountries);
  const phoneCodeOptions = useSelector(selectPhoneCodeOptions);

  // ========== EFFECTS ==========
  useEffect(() => {
    return () => {
      isMounted.current = false;
      dispatch(clearPhoneSearch());
      dispatch(clearBeneficiariesCreateState());
      dispatch(clearUpdateState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (mode === "create" && customerId && isMounted.current) {
      dispatch(fetchBeneficiaries(customerId));
    }
  }, [dispatch, customerId, mode]);

  useEffect(() => {
    if (mode === "edit" && beneficiaryId && !initialData && isMounted.current) {
      dispatch(fetchBeneficiaryById(beneficiaryId));
    }
  }, [mode, beneficiaryId, initialData, dispatch]);

  useEffect(() => {
    if (createError && isMounted.current) {
      toast.error(createError);
      dispatch(clearBeneficiariesCreateState());
    }
  }, [createError, dispatch]);

  useEffect(() => {
    if (updateError && isMounted.current) {
      toast.error(updateError);
      dispatch(clearUpdateState());
    }
  }, [updateError, dispatch]);

  useEffect(() => {
    if (createSuccess && isMounted.current) {
      toast.success("Beneficiary created successfully!");
      setTimeout(() => navigate(-1), 1500);
    }
  }, [createSuccess, navigate]);

  useEffect(() => {
    if (updateSuccess && isMounted.current) {
      toast.success("Beneficiary updated successfully!");
      setTimeout(() => navigate(-1), 1500);
    }
  }, [updateSuccess, navigate]);

  // ========== HANDLERS ==========
  const handleSubmit = async (formData) => {
    try {
      if (mode === "create") {
        await dispatch(
          createAndAddBeneficiary({
            customerId,
            beneficiaryData: formData.beneficiaryData,
            bankAccounts: formData.bankAccounts,
            currency: formData.currency,
            country_code: formData.countryCode,
          })
        ).unwrap();
      } else if (mode === "edit") {
        await dispatch(
          updateBeneficiary({
            customerId,
            beneficiaryId,
            beneficiaryData: formData.beneficiaryData,
          })
        ).unwrap();
      }
    } catch (error) {
      throw error;
    }
  };

  const handlePhoneSearch = ({ phoneNumber, countryPhoneCode }) => {
    dispatch(
      searchBeneficiaryByPhone({
        phoneNumber,
        countryPhoneCode,
      })
    );
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // ========== DROPDOWN FETCH FUNCTIONS ==========
  const handleFetchNationalities = () => {
    dispatch(fetchNationalities());
  };

  const handleFetchCountries = () => {
    dispatch(fetchCountries());
  };

  const handleFetchBanks = ({ currency, bankType }) => {
    dispatch(fetchBanksByCurrency({ currency, bankType }));
  };

  const handleFetchIdTypes = (currency) => {
    dispatch(fetchIdTypesByCurrency(currency));
  };

  const handleFetchCities = (countryId) => {
    dispatch(fetchCitiesByCountry(countryId));
  };

  const handleFetchBankBranches = (bankCode) => {
    dispatch(fetchBankBranches(bankCode));
  };

  // ========== RENDER ==========
  if (!customerId && mode === "create") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="max-w-lg w-11/12 md:w-1/2 p-6 rounded-lg shadow-xl bg-red-600 text-white text-center">
          <h2 className="text-xl font-extrabold mb-4 tracking-wide">
            Action Required!
          </h2>
          <p className="text-sm md:text-base mb-6">
            Customer ID is missing. Please navigate to this page through the
            proper route.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-white text-red-600 rounded-md font-medium hover:bg-gray-100 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <BaseBeneficiaryForm
      // Configuration
      mode={mode}
      isPublic={false}
      customerId={customerId}
      beneficiaryId={beneficiaryId}
      showPhoneSearch={mode === "create"}
      // Functions
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onPhoneSearch={handlePhoneSearch}
      onFetchNationalities={handleFetchNationalities}
      onFetchCountries={handleFetchCountries}
      onFetchBanks={handleFetchBanks}
      onFetchIdTypes={handleFetchIdTypes}
      onFetchCities={handleFetchCities}
      onFetchBankBranches={handleFetchBankBranches}
      // Data
      nationalities={nationalities}
      banks={banks}
      idTypes={idTypes}
      cities={cities}
      bankBranches={bankBranches}
      countries={countries}
      countriesOptions={countriesOptions}
      phoneCodeOptions={phoneCodeOptions}
      beneficiaries={beneficiaries}
      // State
      isLoading={createLoading || updateLoading}
      phoneSearchLoading={phoneSearchLoading}
      phoneSearch={phoneSearch}
      dropdownLoading={dropdownLoading}
      // Initial data
      initialData={initialData || beneficiaryDetails}
    />
  );
};

export default PrivateBeneficiaryForm;
