// src/components/NavigateSection.js - RESPONSIVE IMPLEMENTATION WITH ERROR BOUNDARY
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
// import FeatureUnavailablePopup from "../../components/FeatureUnavailablePopup";
// import NavigationPopup from "../Popup/NavigationPopup";
import ZapPlaidLink from "../../ZapPlaidLink/ZapPlaidLink";
import { Download } from "lucide-react";
import PropTypes from "prop-types";
import ClipLoader from "react-spinners/ClipLoader";

// Import Error Boundary
import ErrorBoundary from "../../ErrorBoundary/ErrorBoundary";
import { SafeErrorDisplay } from "../../../utils/errorHandling";

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
        // Console log removed
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
    selectCustomerBankApprovedStatus
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

  // Refs for performance optimization
  const hasFetchBeenCalled = useRef(false);
  const componentId = useRef(Math.random().toString(36).substr(2, 9));

  const hostName = window.location.hostname;
  const isRemittanceOnlyCustomer = "Y"; // This should come from Redux if available

  const bearertoken = useSelector(selectAuthToken);
  const authtoken = useSelector(selectAuthToken);

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
      return;
    }

    hasFetchBeenCalled.current = true;
    setIsFetching(true);
    setLocalError(null);

    try {
      let urlPartnerId;
      if (isWhiteLabelledPartner === "1" || isWhiteLabelledPartner === "Y") {
        urlPartnerId = whiteLabelledPartnerId;
      } else {
        urlPartnerId = 9;
      }

      if (!hasFetchedProfile) {
        await dispatch(fetchCustomerProfile(customerId)).unwrap();
      }

      if (!hasFetchedModules) {
        await dispatch(
          fetchAllowedModules({
            partnerId: urlPartnerId,
            bearertoken,
          })
        ).unwrap();
      }
    } catch (error) {
      setLocalError(error.message || "Failed to fetch navigation data");
      hasFetchBeenCalled.current = false;
    } finally {
      setIsFetching(false);
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
      fetchData();
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
      setLocalError("Failed to display popup");
    }
  };

  const handleTransferClick = () => {
    try {
      if (customerStatus === "Deactivated") {
        showPopup(
          "Your account is deactivated. You cannot perform this transaction."
        );
        return;
      }
      if (customerBankApprovedStatus === "0") {
        showPopup(
          "Your Bank account is not approved. You cannot perform this transaction."
        );
        return;
      }
      navigate(`/transfer/${customerId}`);
    } catch (error) {
      setLocalError("Failed to navigate to transfer");
    }
  };

  const handleDepositClick = () => {
    try {
      if (customerStatus === "Deactivated") {
        showPopup("Your account is deactivated. You cannot deposit money.");
        return;
      }
      if (customerBankApprovedStatus === "0") {
        showPopup(
          "Your Bank account is not approved. You cannot perform this transaction."
        );
        return;
      }
      navigate(`/deposit/${customerId}`);
    } catch (error) {
      setLocalError("Failed to navigate to deposit");
    }
  };

  const handleConversionClick = () => {
    try {
      if (customerStatus === "Deactivated") {
        showPopup(
          "Your account is deactivated. You cannot perform currency conversion."
        );
        return;
      }
      if (customerBankApprovedStatus === "0") {
        showPopup(
          "Your Bank account is not approved. You cannot perform this transaction."
        );
        return;
      }
      navigate(`/conversion/${customerId}`);
    } catch (error) {
      setLocalError("Failed to navigate to conversion");
    }
  };

  const handlePayoutClick = () => {
    try {
      if (customerStatus === "Deactivated") {
        showPopup("Your account is deactivated. You cannot request a payout.");
        return;
      }
      if (customerBankApprovedStatus === "0") {
        showPopup(
          "Your Bank account is not approved. You cannot perform this transaction."
        );
        return;
      }
      navigate(`/remitpayout/${customerId}`);
    } catch (error) {
      setLocalError("Failed to navigate to payout");
    }
  };

  const handleRemitClick = () => {
    try {
      if (customerStatus === "Deactivated") {
        showPopup("Your account is deactivated. You cannot remit money.");
        return;
      }
      navigate(`/remittance/${customerId}`);
    } catch (error) {
      setLocalError("Failed to navigate to remittance");
    }
  };

  const handleRemitClickNew = () => {
    try {
      if (customerStatus === "Deactivated") {
        showPopup("Your account is deactivated. You cannot remit money.");
        return;
      }
      navigate(`/remittanceonly/${customerId}`);
    } catch (error) {
      setLocalError("Failed to navigate to remittance");
    }
  };

  const handleLinkBankClick = () => {
    try {
      if (customerStatus === "Deactivated") {
        showPopup("Your account is deactivated. You cannot link a bank account.");
        return;
      }
      navigate(`/linkbank/${customerId}`);
    } catch (error) {
      setLocalError("Failed to navigate to link bank");
    }
  };

  const handleUserManualClick = async () => {
    try {
      const result = await dispatch(
        downloadUserManual({
          partnerId:
            whiteLabelledPartnerId === undefined ? 0 : whiteLabelledPartnerId,
          placement: "Home Screen",
        })
      ).unwrap();

      if (result.status === "success" && result.data?.file_path) {
        window.open(result.data.file_path, "_blank");
      } else {
        showPopup("Manual not found. Please try again later.");
      }
    } catch (error) {
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
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
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

  // Render loading states
  if (profileLoading || isFetching) {
    return (
      <div className="w-full px-2 sm:px-4 flex justify-center items-center min-h-[200px]">
        <ClipLoader color="#36d7b7" size={40} />
      </div>
    );
  }

  return (
    <div
      className="px-2 sm:px-4 md:px-6 w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto lg:mx-0 lg:ml-4"
      style={{ color: textColor }}
    >
      <div className="w-full flex flex-col gap-3 sm:gap-4">
        {/* Transfer Money */}
        {allowedModules.some((module) => module.module_name === "Transfer") &&
          (hostName === "localhost" ||
          hostName === "ourzap.unlimitedremit.com" ||
          hostName === "sandbox-ourzap.unlimitedremit.com" ? (
            <div
              onClick={handleTransferClick}
              className="w-full cursor-pointer"
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
                <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          ) : (
            <div
              onClick={() => navigate(`/transfer/${customerId}`)}
              className="w-full cursor-pointer"
            >
              <div className="rounded-2xl border flex justify-between items-center border-stroke h-14 sm:h-16 bg-white py-3 sm:py-4 px-4 sm:px-6 shadow-default dark:border-stroke dark:bg-boxdark hover:bg-gray-50 hover:shadow-lg transform transition duration-300 ease-in-out hover:scale-[1.02]">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <img
                    src={depositImg}
                    alt="Internal Transfer Icon"
                    className="w-5 h-5 sm:w-6 sm:h-6"
                  />
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                      Internal Transfer
                    </h2>
                    <p
                      className="text-xs text-gray-500 truncate"
                      {...textColorProps}
                    >
                      Transfer Money
                    </p>
                  </div>
                </div>
                <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          ))}

        {/* Deposit */}
        {allowedModules.some((module) => module.module_name === "Deposit") && (
          <div onClick={handleDepositClick} className="w-full cursor-pointer">
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
              <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        )}

        {/* Convert */}
        {(allowedModules.some((module) => module.module_name === "Convert") ||
          hostName === "ourzap.unlimitedremit.com") && (
          <div
            onClick={handleConversionClick}
            className="w-full cursor-pointer"
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
              <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        )}

        {/* Payout */}
        {allowedModules.some((module) => module.module_name === "Payout") && (
          <div onClick={handlePayoutClick} className="w-full cursor-pointer">
            <div className="rounded-2xl border flex justify-between items-center border-stroke h-14 sm:h-16 bg-white py-3 sm:py-4 px-4 sm:px-6 shadow-default dark:border-stroke dark:bg-boxdark hover:bg-gray-50 hover:shadow-lg transform transition duration-300 ease-in-out hover:scale-[1.02]">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <img
                  src={remitImg}
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
              <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        )}

        {/* Remittance */}
        {allowedModules.some(
          (module) => module.module_name === "Remittance"
        ) && (
          <div onClick={handleRemitClick} className="w-full cursor-pointer">
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
              <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        )}

        {/* Add More Accounts */}
        {allowedModules.some(
          (module) => module.module_name === "Add More Accounts"
        ) && (
          <div
            onClick={() => navigate(`/addaccount/${customerId}`)}
            className="w-full cursor-pointer"
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
              <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        )}

        {/* Link Bank */}
        {isRemittanceOnlyCustomer === "Y" && selectedCurrencyCode === "USD" && (
          <div onClick={handleLinkBankClick} className="w-full cursor-pointer">
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
              <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        )}

        {/* User Manual */}
        {download_operation_manual === "Y" && (
          <div className="w-full flex justify-center mt-2">
            <div
              onClick={handleUserManualClick}
              className="w-full sm:w-3/4 cursor-pointer"
            >
              <div className="rounded-2xl border flex justify-center items-center border-stroke h-14 sm:h-16 text-white bg-gray-800 py-3 sm:py-4 px-4 sm:px-6 shadow-default dark:border-stroke dark:bg-boxdark hover:bg-gray-700 hover:shadow-lg transform transition duration-300 ease-in-out hover:scale-[1.02]">
                {manualLoading ? (
                  <div className="flex justify-center items-center">
                    <ClipLoader color="#36d7b7" size={25} />
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

      {/* Navigation Popup */}
      {/* {popupData.show && (
        <NavigationPopup
          message={popupData.message}
          onClose={() => dispatch(setPopupData({ show: false, message: "", onConfirm: null }))}
          onConfirm={() => {
            dispatch(setPopupData({ show: false, message: "", onConfirm: null }));
            if (popupData.onConfirm) popupData.onConfirm();
          }}
        />
      )} */}

      {/* Show Popup when isPopupVisible is true */}
      {/* {isPopupVisible && (
        <FeatureUnavailablePopup onClose={handlePopupToggle} />
      )} */}
    </div>
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