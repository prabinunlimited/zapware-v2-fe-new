// src/components/NavigateSection.js - COMPLETE FIXED VERSION
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineStop } from "react-icons/ai";
import { IoIosArrowForward } from "react-icons/io";
import depositImg from "../../../assets/images/icon/Deposit-Img.png";
import payoutImg from "../../../assets/images/icon/Payout-Img.png";
import convertImg from "../../../assets/images/icon/Convert-Img.png";
import linkImg from "../../../assets/images/icon/Checkout-Img.png";
import remitImg from "../../../assets/images/icon/Remit-Img.png";
import addImg from "../../../assets/images/icon/AddAccount.png";
import { MdAccountBalance } from "react-icons/md";
import FeatureComingSoonPopup from "../../PopupModal/FeatureComingSoonPopup";
import ZapPlaidLink from "../../ZapPlaidLink/ZapPlaidLink";
import { Download } from "lucide-react";
import PropTypes from "prop-types";
import RingLoader from "react-spinners/RingLoader";

// Import Error Boundary
import ErrorBoundary from "../../ErrorBoundary/ErrorBoundary";

// Redux imports
import {
  fetchCustomerProfile,
  fetchAllowedModules,
  downloadUserManual,
  setPopupData,
  updateLocalStorageState,
} from "./NavigateSectionSlice";

// Import selectors
import {
  selectCustomerStatus,
  selectAllowedModules,
  selectPopupData,
  selectShowPlaidLink,
  selectManualLoading,
  selectProfileLoading,
  selectCustomerBankApprovedStatus,
  selectDownloadOperationManual,
  selectIsWhiteLabelledPartner,
  selectWhiteLabelledPartnerId,
  selectHasFetchedProfile,
  selectHasFetchedModules,
  selectFetchError,
  selectModulesError,
} from "./NavigateSectionSlice";

import { selectAuthToken } from "../../../store/selectors";

const API_URL = import.meta.env.VITE_API_URL;

// Performance monitoring hook
const useWhyDidYouUpdate = (name, props) => {
  const previousProps = useRef();
  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changesObj = {};
      allKeys.forEach((key) => {
        if (previousProps.current[key] !== props[key]) {
          changesObj[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });
      if (Object.keys(changesObj).length) {
        // Console log removed for production
      }
    }
    previousProps.current = props;
  });
};

// Inner component that will be wrapped by ErrorBoundary
function NavigateSectionContent({
  selectedCurrencyCode,
  onLoadingStart,
  onLoadingEnd,
  textColor,
}) {
  const { customerId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux selectors
  const customerStatus = useSelector(selectCustomerStatus);
  const allowedModules = useSelector(selectAllowedModules);
  const popupData = useSelector(selectPopupData);
  const showPlaidLink = useSelector(selectShowPlaidLink);
  const manualLoading = useSelector(selectManualLoading);
  const profileLoading = useSelector(selectProfileLoading);
  const customerBankApprovedStatus = useSelector(
    selectCustomerBankApprovedStatus,
  );
  const download_operation_manual = useSelector(selectDownloadOperationManual);
  const isWhiteLabelledPartner = useSelector(selectIsWhiteLabelledPartner);
  const whiteLabelledPartnerId = useSelector(selectWhiteLabelledPartnerId);
  const hasFetchedProfile = useSelector(selectHasFetchedProfile);
  const hasFetchedModules = useSelector(selectHasFetchedModules);
  const fetchError = useSelector(selectFetchError);
  const modulesError = useSelector(selectModulesError);

  // Local state
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [featurePopup, setFeaturePopup] = useState({
    isOpen: false,
    featureName: "",
  });

  // Refs for performance optimization
  const hasFetchBeenCalled = useRef(false);
  const componentId = useRef(Math.random().toString(36).substr(2, 9));

  const hostName = window.location.hostname;
  const isRemittanceOnlyCustomer = "Y"; // This should come from Redux if available

  const bearertoken = useSelector(selectAuthToken);
  const authtoken = useSelector(selectAuthToken);

  // Debug: Log component mount
  useEffect(() => {
    console.log("🔷 NavigateSection mounted with customerId:", customerId);
    return () => {
      console.log("🔶 NavigateSection unmounted");
    };
  }, [customerId]);

  // Debug: Log allowed modules when they change
  useEffect(() => {
    if (allowedModules?.length > 0) {
      console.log("📦 Allowed Modules loaded:", allowedModules);
      console.log(
        "✅ Transfer:",
        allowedModules.some((m) => m.module_name === "Transfer"),
      );
      console.log(
        "✅ Deposit:",
        allowedModules.some((m) => m.module_name === "Deposit"),
      );
      console.log(
        "✅ Convert:",
        allowedModules.some((m) => m.module_name === "Convert"),
      );
      console.log(
        "✅ Payout:",
        allowedModules.some((m) => m.module_name === "Payout"),
      );
      console.log(
        "✅ Remittance:",
        allowedModules.some((m) => m.module_name === "Remittance"),
      );
      console.log(
        "✅ Add More Accounts:",
        allowedModules.some((m) => m.module_name === "Add More Accounts"),
      );
    }
  }, [allowedModules]);

  // Debug: Log customer profile data
  useEffect(() => {
    if (hasFetchedProfile) {
      console.log("👤 Customer Profile loaded:", {
        customerStatus,
        customerBankApprovedStatus,
        hasFetchedProfile,
      });
    }
  }, [customerStatus, customerBankApprovedStatus, hasFetchedProfile]);

  // Debug: Log fetch status
  useEffect(() => {
    console.log("🔄 Fetch Status:", {
      profileLoading,
      isFetching,
      hasFetchedProfile,
      hasFetchedModules,
      localError,
    });
  }, [
    profileLoading,
    isFetching,
    hasFetchedProfile,
    hasFetchedModules,
    localError,
  ]);

  // Performance monitoring
  useWhyDidYouUpdate("NavigateSection", {
    customerId,
    selectedCurrencyCode,
    textColor,
  });

  // Component mount/unmount tracking
  useEffect(() => {
    // Update localStorage state on mount
    dispatch(updateLocalStorageState());

    return () => {
      hasFetchBeenCalled.current = false;
    };
  }, [dispatch]);

  // Error handling effect
  useEffect(() => {
    if (fetchError || modulesError) {
      setLocalError(fetchError || modulesError);
    }
  }, [fetchError, modulesError]);

  // ✅ FIXED: Stable fetchData function with proper dependencies and error handling
  const fetchData = useCallback(async () => {
    if (hasFetchBeenCalled.current) {
      console.log("⏭️ Fetch already called, skipping");
      return;
    }

    console.log("🚀 Starting fetchData...");
    hasFetchBeenCalled.current = true;
    setIsFetching(true);
    setLocalError(null);

    try {
      let urlPartnerId;
      if (isWhiteLabelledPartner === "1" || isWhiteLabelledPartner === "Y") {
        urlPartnerId = whiteLabelledPartnerId;
        console.log("🏢 Using white labelled partner ID:", urlPartnerId);
      } else {
        urlPartnerId = 9;
        console.log("🏢 Using default partner ID: 9");
      }

      if (!hasFetchedProfile) {
        console.log("📡 Fetching customer profile for ID:", customerId);
        await dispatch(fetchCustomerProfile(customerId)).unwrap();
        console.log("✅ Customer profile fetched successfully");
      }

      if (!hasFetchedModules) {
        console.log("📡 Fetching allowed modules for partner:", urlPartnerId);
        await dispatch(
          fetchAllowedModules({
            partnerId: urlPartnerId,
            bearertoken,
          }),
        ).unwrap();
        console.log("✅ Allowed modules fetched successfully");
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
      setLocalError(error.message || "Failed to fetch navigation data");
      hasFetchBeenCalled.current = false;
    } finally {
      setIsFetching(false);
      console.log("🏁 Fetch completed");
    }
  }, [
    customerId,
    bearertoken,
    isWhiteLabelledPartner,
    whiteLabelledPartnerId,
    hasFetchedProfile,
    hasFetchedModules,
    dispatch,
  ]);

  // ✅ FIXED: Simplified effect with minimal dependencies
  useEffect(() => {
    const shouldFetchData =
      customerId &&
      bearertoken &&
      (!hasFetchedProfile || !hasFetchedModules) &&
      !isFetching &&
      !localError;

    if (shouldFetchData) {
      console.log("🎯 Conditions met, calling fetchData");
      fetchData();
    } else {
      console.log("⏸️ Skipping fetch, conditions not met:", {
        hasCustomerId: !!customerId,
        hasToken: !!bearertoken,
        needsProfile: !hasFetchedProfile,
        needsModules: !hasFetchedModules,
        isFetching,
        hasError: !!localError,
      });
    }
  }, [
    customerId,
    bearertoken,
    hasFetchedProfile,
    hasFetchedModules,
    isFetching,
    localError,
    fetchData,
  ]);

  // Loading state management
  useEffect(() => {
    if (onLoadingStart && onLoadingEnd) {
      if (profileLoading || isFetching) {
        onLoadingStart();
      } else {
        onLoadingEnd();
      }
    }
  }, [profileLoading, isFetching, onLoadingStart, onLoadingEnd]);

  // Handler functions with error boundaries
  const showPopup = (message, onConfirm = null) => {
    try {
      dispatch(setPopupData({ show: true, message, onConfirm }));
    } catch (error) {
      console.error("❌ Failed to display popup:", error);
      setLocalError("Failed to display popup");
    }
  };

  // Open feature coming soon popup
  const openFeaturePopup = (featureName) => {
    setFeaturePopup({
      isOpen: true,
      featureName,
    });
  };

  // Close feature popup
  const closeFeaturePopup = () => {
    setFeaturePopup({
      isOpen: false,
      featureName: "",
    });
  };

  const handleTransferClick = () => {
    console.log("💰 Transfer button clicked", {
      customerId,
      customerStatus,
      customerBankApprovedStatus,
    });

    try {
      if (!customerId) {
        console.error("❌ No customerId available");
        setLocalError("Customer ID not available");
        return;
      }

      if (customerStatus === "Deactivated") {
        showPopup(
          "Your account is deactivated. You cannot perform this transaction.",
        );
        return;
      }

      // ✅ Check for both "0" and "undefined" and also check for "Y"
      if (
        !customerBankApprovedStatus ||
        customerBankApprovedStatus === "0" ||
        customerBankApprovedStatus === "N"
      ) {
        showPopup(
          "Your Bank account is not approved. You cannot perform this transaction.",
        );
        return;
      }

      console.log(`➡️ Navigating to /transfer/${customerId}`);
      navigate(`/transfer/${customerId}`);
    } catch (error) {
      console.error("❌ Transfer navigation error:", error);
      setLocalError("Failed to navigate to transfer");
    }
  };

  const handleDepositClick = () => {
    console.log("💰 Deposit button clicked", {
      customerId,
      customerStatus,
      customerBankApprovedStatus,
    });

    try {
      if (!customerId) {
        console.error("❌ No customerId available");
        setLocalError("Customer ID not available");
        return;
      }

      if (customerStatus === "Deactivated") {
        showPopup("Your account is deactivated. You cannot deposit money.");
        return;
      }
      if (customerBankApprovedStatus === "0") {
        showPopup(
          "Your Bank account is not approved. You cannot perform this transaction.",
        );
        return;
      }
      if (customerBankApprovedStatus === null) {
        showPopup(
          "Your bank account status is still loading. Please try again in a moment.",
        );
        return;
      }
      console.log(`➡️ Navigating to /deposit/${customerId}`);
      navigate(`/deposit/${customerId}`);
    } catch (error) {
      console.error("❌ Deposit navigation error:", error);
      setLocalError("Failed to navigate to deposit");
    }
  };

  const handleConversionClick = () => {
    console.log("💰 Convert button clicked", {
      customerId,
      customerStatus,
      customerBankApprovedStatus,
    });

    try {
      if (!customerId) {
        console.error("❌ No customerId available");
        setLocalError("Customer ID not available");
        return;
      }

      if (customerStatus === "Deactivated") {
        showPopup(
          "Your account is deactivated. You cannot perform currency conversion.",
        );
        return;
      }
      if (customerBankApprovedStatus === "0") {
        showPopup(
          "Your Bank account is not approved. You cannot perform this transaction.",
        );
        return;
      }
      if (customerBankApprovedStatus === null) {
        showPopup(
          "Your bank account status is still loading. Please try again in a moment.",
        );
        return;
      }
      console.log(`➡️ Navigating to /convert/${customerId}`);
      navigate(`/convert/${customerId}`);
    } catch (error) {
      console.error("❌ Convert navigation error:", error);
      setLocalError("Failed to navigate to conversion");
    }
  };

  const handlePayoutClick = () => {
    console.log("💰 Payout button clicked", {
      customerId,
      customerStatus,
      customerBankApprovedStatus,
    });

    try {
      if (!customerId) {
        console.error("❌ No customerId available");
        setLocalError("Customer ID not available");
        return;
      }

      if (customerStatus === "Deactivated") {
        showPopup("Your account is deactivated. You cannot request a payout.");
        return;
      }
      if (customerBankApprovedStatus === "0") {
        showPopup(
          "Your Bank account is not approved. You cannot perform this transaction.",
        );
        return;
      }
      if (customerBankApprovedStatus === null) {
        showPopup(
          "Your bank account status is still loading. Please try again in a moment.",
        );
        return;
      }
      console.log(`➡️ Navigating to /payout/${customerId}`);
      navigate(`/payout/${customerId}`);
    } catch (error) {
      console.error("❌ Payout navigation error:", error);
      setLocalError("Failed to navigate to payout");
    }
  };

  const handleRemitClick = () => {
    console.log("💰 Remittance button clicked", {
      customerId,
      customerStatus,
      customerBankApprovedStatus,
    });

    try {
      if (!customerId) {
        console.error("❌ No customerId available");
        setLocalError("Customer ID not available");
        return;
      }

      if (customerStatus === "Deactivated") {
        showPopup("Your account is deactivated. You cannot remit money.");
        return;
      }
      if (customerBankApprovedStatus === "0") {
        showPopup(
          "Your Bank account is not approved. You cannot perform this transaction.",
        );
        return;
      }
      if (customerBankApprovedStatus === null) {
        showPopup(
          "Your bank account status is still loading. Please try again in a moment.",
        );
        return;
      }
      console.log(`➡️ Navigating to /remittance/${customerId}`);
      navigate(`/remittance/${customerId}`);
    } catch (error) {
      console.error("❌ Remittance navigation error:", error);
      setLocalError("Failed to navigate to remittance");
    }
  };

  const handleRemitClickNew = () => {
    console.log("💰 Remittance Only button clicked", {
      customerId,
      customerStatus,
      customerBankApprovedStatus,
    });

    try {
      if (!customerId) {
        console.error("❌ No customerId available");
        setLocalError("Customer ID not available");
        return;
      }

      if (customerStatus === "Deactivated") {
        showPopup("Your account is deactivated. You cannot remit money.");
        return;
      }
      if (customerBankApprovedStatus === "0") {
        showPopup(
          "Your Bank account is not approved. You cannot perform this transaction.",
        );
        return;
      }
      if (customerBankApprovedStatus === null) {
        showPopup(
          "Your bank account status is still loading. Please try again in a moment.",
        );
        return;
      }
      console.log(`➡️ Navigating to /remittanceonly/${customerId}`);
      navigate(`/remittanceonly/${customerId}`);
    } catch (error) {
      console.error("❌ Remittance only navigation error:", error);
      setLocalError("Failed to navigate to remittance");
    }
  };

  const handleLinkBankClick = () => {
    console.log("💰 Link Bank button clicked", {
      customerId,
      customerStatus,
    });

    try {
      if (!customerId) {
        console.error("❌ No customerId available");
        setLocalError("Customer ID not available");
        return;
      }

      if (customerStatus === "Deactivated") {
        showPopup(
          "Your account is deactivated. You cannot link a bank account.",
        );
        return;
      }
      console.log(`➡️ Navigating to /linkbank/${customerId}`);
      navigate(`/linkbank/${customerId}`);
    } catch (error) {
      console.error("❌ Link bank navigation error:", error);
      setLocalError("Failed to navigate to link bank");
    }
  };

  const handleUserManualClick = async () => {
    console.log("📚 User Manual button clicked");

    try {
      const result = await dispatch(
        downloadUserManual({
          partnerId:
            whiteLabelledPartnerId === undefined ? 0 : whiteLabelledPartnerId,
          placement: "Home Screen",
        }),
      ).unwrap();

      if (result.status === "success" && result.data?.file_path) {
        console.log("📄 Opening manual at:", result.data.file_path);
        window.open(result.data.file_path, "_blank");
      } else {
        showPopup("Manual not found. Please try again later.");
      }
    } catch (error) {
      console.error("❌ User manual download error:", error);
      showPopup("Unable to download the user manual. Please try again later.");
    }
  };

  const handlePopupToggle = () => {
    setIsPopupVisible(!isPopupVisible);
  };

  // Function to apply text color style
  const getTextColorStyle = () => {
    if (textColor && textColor.startsWith("text-")) {
      return { className: textColor };
    } else if (textColor && textColor.startsWith("#")) {
      return { style: { color: textColor } };
    }
    return {};
  };

  const handleRetry = () => {
    console.log("🔄 Retrying fetch...");
    setLocalError(null);
    hasFetchBeenCalled.current = false;
    fetchData();
  };

  const textColorProps = getTextColorStyle();

  // Show error state if there's a local error
  if (localError) {
    return (
      <div className="w-full px-2 sm:px-4 flex justify-center items-center min-h-[200px]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md w-full text-center">
          <div className="text-red-600 mb-2">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="font-semibold">Navigation Error</p>
          </div>
          <p className="text-red-700 text-sm mb-4">{localError}</p>
          <button
            onClick={handleRetry}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show loading skeleton while fetching data
  if (
    profileLoading ||
    isFetching ||
    !hasFetchedModules ||
    !hasFetchedProfile
  ) {
    return (
      <div className="w-full px-2 sm:px-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-full animate-pulse">
              <div className="rounded-2xl border border-stroke h-14 sm:h-16 bg-gray-100 py-3 sm:py-4 px-4 sm:px-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-32"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="px-2 sm:px-4 md:px-6 w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto lg:mx-0 lg:ml-4"
        style={{ color: textColor }}
      >
        <div className="w-full flex flex-col gap-3 sm:gap-4">
          {/* Transfer Money */}
          {!profileLoading &&
            !isFetching &&
            hasFetchedModules &&
            hasFetchedProfile &&
            allowedModules?.length > 0 &&
            allowedModules.some(
              (module) => module.module_name === "Transfer",
            ) && (
              <div
                onClick={handleTransferClick}
                className="w-full cursor-pointer group"
              >
                <div className="rounded-2xl border flex justify-between items-center border-stroke h-14 sm:h-16 bg-white py-3 sm:py-4 px-4 sm:px-6 shadow-default dark:border-stroke dark:bg-boxdark hover:bg-gray-50 hover:shadow-lg transform transition duration-300 ease-in-out hover:scale-[1.02]">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <img
                      src={depositImg}
                      alt="Transfer Icon"
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        Transfer
                      </h2>
                      <p
                        className="text-xs text-gray-500 truncate"
                        {...textColorProps}
                      >
                        Transfer Money
                      </p>
                    </div>
                  </div>
                  <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            )}

          {/* Deposit */}
          {!profileLoading &&
            !isFetching &&
            hasFetchedModules &&
            hasFetchedProfile &&
            allowedModules?.length > 0 &&
            allowedModules.some(
              (module) => module.module_name === "Deposit",
            ) && (
              <div
                onClick={handleDepositClick}
                className="w-full cursor-pointer group"
              >
                <div className="rounded-2xl border flex justify-between items-center border-stroke h-14 sm:h-16 bg-white py-3 sm:py-4 px-4 sm:px-6 shadow-default dark:border-stroke dark:bg-boxdark hover:bg-gray-50 hover:shadow-lg transform transition duration-300 ease-in-out hover:scale-[1.02]">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <img
                      src={depositImg}
                      alt="Deposit Icon"
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        Deposit
                      </h2>
                      <p
                        className="text-xs text-gray-500 truncate"
                        {...textColorProps}
                      >
                        Deposit Money
                      </p>
                    </div>
                  </div>
                  <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            )}

          {/* Convert */}
          {!profileLoading &&
            !isFetching &&
            hasFetchedModules &&
            hasFetchedProfile &&
            allowedModules?.length > 0 &&
            allowedModules.some(
              (module) => module.module_name === "Convert",
            ) && (
              <div
                onClick={handleConversionClick}
                className="w-full cursor-pointer group"
              >
                <div className="rounded-2xl border flex justify-between items-center border-stroke h-14 sm:h-16 bg-white py-3 sm:py-4 px-4 sm:px-6 shadow-default dark:border-stroke dark:bg-boxdark hover:bg-gray-50 hover:shadow-lg transform transition duration-300 ease-in-out hover:scale-[1.02]">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <img
                      src={convertImg}
                      alt="Convert Icon"
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        Convert
                      </h2>
                      <p
                        className="text-xs text-gray-500 truncate"
                        {...textColorProps}
                      >
                        Global currency conversion
                      </p>
                    </div>
                  </div>
                  <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            )}

          {/* Payout */}
          {!profileLoading &&
            !isFetching &&
            hasFetchedModules &&
            hasFetchedProfile &&
            allowedModules?.length > 0 &&
            allowedModules.some(
              (module) => module.module_name === "Payout",
            ) && (
              <div
                onClick={handlePayoutClick}
                className="w-full cursor-pointer group"
              >
                <div className="rounded-2xl border flex justify-between items-center border-stroke h-14 sm:h-16 bg-white py-3 sm:py-4 px-4 sm:px-6 shadow-default dark:border-stroke dark:bg-boxdark hover:bg-gray-50 hover:shadow-lg transform transition duration-300 ease-in-out hover:scale-[1.02]">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <img
                      src={payoutImg}
                      alt="Payout Icon"
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        Payout
                      </h2>
                      <p
                        className="text-xs text-gray-500 truncate"
                        {...textColorProps}
                      >
                        Send money WorldWide
                      </p>
                    </div>
                  </div>
                  <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            )}

          {/* Remittance */}
          {!profileLoading &&
            !isFetching &&
            hasFetchedModules &&
            hasFetchedProfile &&
            allowedModules?.length > 0 &&
            allowedModules.some(
              (module) => module.module_name === "Remittance",
            ) && (
              <div
                onClick={handleRemitClick}
                className="w-full cursor-pointer group"
              >
                <div className="rounded-2xl border flex justify-between items-center border-stroke h-14 sm:h-16 bg-white py-3 sm:py-4 px-4 sm:px-6 shadow-default dark:border-stroke dark:bg-boxdark hover:bg-gray-50 hover:shadow-lg transform transition duration-300 ease-in-out hover:scale-[1.02]">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <img
                      src={remitImg}
                      alt="Remittance Icon"
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        Remittance
                      </h2>
                      <p
                        className="text-xs text-gray-500 truncate"
                        {...textColorProps}
                      >
                        Send money globally
                      </p>
                    </div>
                  </div>
                  <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            )}

          {/* Add More Accounts */}
          {!profileLoading &&
            !isFetching &&
            hasFetchedModules &&
            hasFetchedProfile &&
            allowedModules?.length > 0 &&
            allowedModules.some(
              (module) => module.module_name === "Add More Accounts",
            ) && (
              <div
                onClick={() => navigate(`/addaccount/${customerId}`)}
                className="w-full cursor-pointer group"
              >
                <div className="rounded-2xl border flex justify-between items-center border-stroke h-14 sm:h-16 bg-white py-3 sm:py-4 px-4 sm:px-6 shadow-default dark:border-stroke dark:bg-boxdark hover:bg-gray-50 hover:shadow-lg transform transition duration-300 ease-in-out hover:scale-[1.02]">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <img
                      src={addImg}
                      alt="Add Account Icon"
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        Add More Accounts
                      </h2>
                      <p
                        className="text-xs text-gray-500 truncate"
                        {...textColorProps}
                      >
                        Enhance accessibility
                      </p>
                    </div>
                  </div>
                  <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            )}

          {/* Link Bank */}
          {isRemittanceOnlyCustomer === "Y" &&
            selectedCurrencyCode === "USD" && (
              <div
                onClick={handleLinkBankClick}
                className="w-full cursor-pointer group"
              >
                <div className="rounded-2xl border flex justify-between items-center border-stroke h-14 sm:h-16 bg-white py-3 sm:py-4 px-4 sm:px-6 shadow-default dark:border-stroke dark:bg-boxdark hover:bg-gray-50 hover:shadow-lg transform transition duration-300 ease-in-out hover:scale-[1.02]">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <MdAccountBalance className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        Link Bank
                      </h2>
                      <p
                        className="text-xs text-gray-500 truncate"
                        {...textColorProps}
                      >
                        Connect your bank
                      </p>
                    </div>
                  </div>
                  <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            )}

          {/* User Manual */}
          {download_operation_manual === "Y" && (
            <div className="w-full flex justify-center mt-2">
              <div
                onClick={handleUserManualClick}
                className="w-full sm:w-3/4 cursor-pointer group"
              >
                <div className="rounded-2xl border flex justify-center items-center border-stroke h-14 sm:h-16 text-white bg-gray-800 py-3 sm:py-4 px-4 sm:px-6 shadow-default dark:border-stroke dark:bg-boxdark hover:bg-gray-700 hover:shadow-lg transform transition duration-300 ease-in-out hover:scale-[1.02]">
                  {manualLoading ? (
                    <div className="flex justify-center items-center">
                      <RingLoader color="#36d7b7" size={25} />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Download className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      <div className="text-center sm:text-left">
                        <h2 className="text-sm sm:text-base font-semibold">
                          User Manual
                        </h2>
                        <p className="text-xs text-gray-300">
                          Download user guide
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature Coming Soon Popup */}
      <FeatureComingSoonPopup
        isOpen={featurePopup.isOpen}
        onClose={closeFeaturePopup}
        featureName={featurePopup.featureName}
      />
    </>
  );
}

NavigateSectionContent.propTypes = {
  selectedCurrencyCode: PropTypes.string,
  onLoadingStart: PropTypes.func,
  onLoadingEnd: PropTypes.func,
  textColor: PropTypes.string,
};

// Main component wrapped with Error Boundary
function NavigateSection(props) {
  return (
    <ErrorBoundary>
      <NavigateSectionContent {...props} />
    </ErrorBoundary>
  );
}

// ✅ FIXED: Memoize component to prevent unnecessary re-renders
export default React.memo(NavigateSection);