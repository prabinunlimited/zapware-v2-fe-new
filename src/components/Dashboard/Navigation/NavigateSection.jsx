// src/components/NavigateSection.js - RESPONSIVE IMPLEMENTATION
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

// Redux imports
import {
  fetchCustomerProfile,
  fetchAllowedModules,
  downloadUserManual,
  setPopupData,
  updateLocalStorageState,
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
        console.log("[why-did-you-update]", name, changesObj);
      }
    }
    previousProps.current = props;
  });
};

function NavigateSection({
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

  // Local state
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Refs for performance optimization
  const hasFetchBeenCalled = useRef(false);
  const componentId = useRef(Math.random().toString(36).substr(2, 9));

  const hostName = window.location.hostname;
  const isRemittanceOnlyCustomer = "Y"; // This should come from Redux if available

  const bearertoken = useSelector(selectAuthToken); // Use the exported selector
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

  // ✅ FIXED: Stable fetchData function with proper dependencies
  const fetchData = useCallback(async () => {
    if (hasFetchBeenCalled.current) {
      return;
    }

    hasFetchBeenCalled.current = true;
    setIsFetching(true);

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
      console.error("Error in fetchData:", error);
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
      !isFetching;

    if (shouldFetchData) {
      fetchData();
    }
  }, [
    customerId,
    bearertoken,
    hasFetchedProfile,
    hasFetchedModules,
    isFetching,
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

  // Handler functions
  const showPopup = (message, onConfirm = null) => {
    dispatch(setPopupData({ show: true, message, onConfirm }));
  };

  const handleTransferClick = () => {
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
  };

  const handleDepositClick = () => {
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
  };

  const handleConversionClick = () => {
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
  };

  const handlePayoutClick = () => {
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
  };

  const handleRemitClick = () => {
    if (customerStatus === "Deactivated") {
      showPopup("Your account is deactivated. You cannot remit money.");
      return;
    }
    navigate(`/remittance/${customerId}`);
  };

  const handleRemitClickNew = () => {
    if (customerStatus === "Deactivated") {
      showPopup("Your account is deactivated. You cannot remit money.");
      return;
    }
    navigate(`/remittanceonly/${customerId}`);
  };

  const handleLinkBankClick = () => {
    if (customerStatus === "Deactivated") {
      showPopup("Your account is deactivated. You cannot link a bank account.");
      return;
    }
    navigate(`/linkbank/${customerId}`);
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
      console.error("Download error:", error);
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

  const textColorProps = getTextColorStyle();

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
                    <p className="text-xs text-gray-500 truncate" {...textColorProps}>
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
                    <p className="text-xs text-gray-500 truncate" {...textColorProps}>
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
                  <p className="text-xs text-gray-500 truncate" {...textColorProps}>
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
          <div onClick={handleConversionClick} className="w-full cursor-pointer">
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
                  <p className="text-xs text-gray-500 truncate" {...textColorProps}>
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
                  <p className="text-xs text-gray-500 truncate" {...textColorProps}>
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
                  <p className="text-xs text-gray-500 truncate" {...textColorProps}>
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
                  <p className="text-xs text-gray-500 truncate" {...textColorProps}>
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
                  <p className="text-xs text-gray-500 truncate" {...textColorProps}>
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

NavigateSection.propTypes = {
  selectedCurrencyCode: PropTypes.string,
  onLoadingStart: PropTypes.func,
  onLoadingEnd: PropTypes.func,
  textColor: PropTypes.string,
};

// ✅ FIXED: Memoize component to prevent unnecessary re-renders
export default React.memo(NavigateSection);