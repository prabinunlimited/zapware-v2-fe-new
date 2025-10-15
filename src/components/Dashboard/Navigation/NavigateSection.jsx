// src/components/NavigateSection.js - COMPLETE IMPLEMENTATION
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
    // ✅ Removed isFetching
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
    navigate(`/transferbalance/${customerId}`);
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
      <div className="px-2 col-span-1 md:col-span-1 xl:col-span-1 flex justify-center items-center min-h-[300px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[450px] xl:min-h-[500px] w-full lg:w-[400px] xl:w-[500px] 2xl:w-[600px] ml-0 lg:ml-4">
        <ClipLoader color="#36d7b7" size={50} />
      </div>
    );
  }

  return (
    <div
      className="px-2 col-span-1 md:col-span-1 xl:col-span-1 flex justify-start items-start min-h-[300px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[450px] xl:min-h-[500px] w-full lg:w-[400px] xl:w-[500px] 2xl:w-[600px] ml-0 lg:ml-4 space-y-12"
      style={{ color: textColor }}
    >
      <div className="w-full flex flex-col gap-3">
        {/* Transfer Money */}
        {allowedModules.some((module) => module.module_name === "Transfer") &&
          (hostName === "localhost" ||
          hostName === "ourzap.unlimitedremit.com" ||
          hostName === "sandbox-ourzap.unlimitedremit.com" ? (
            <div
              onClick={handleTransferClick}
              className="w-full lg:w-full mx-auto"
            >
              <div className="rounded-2xl border flex flex-row justify-between items-center border-stroke h-auto sm:h-16 bg-white py-4 sm:py-6 px-6 sm:px-8 shadow-default dark:border-stroke dark:bg-boxdark cursor-pointer hover:bg-gray-200 hover:shadow-xl hover:scale-105 transform transition duration-300 ease-in-out">
                <div className="flex items-center space-x-4 sm:space-x-6">
                  <img
                    src={depositImg}
                    alt="Custom Icon"
                    className="w-6 h-6 sm:w-6 sm:h-6"
                  />
                  <div className="text-xs sm:text-sm">
                    <h2 className="font-semibold text-base">Transfer</h2>
                    <p
                      className="text-xs sm:text-xs text-gray-500"
                      {...textColorProps}
                    >
                      Transfer Money
                    </p>
                  </div>
                </div>
                <IoIosArrowForward className="hidden sm:block lg:hidden xl:block w-6 h-6 text-sky-800" />
              </div>
            </div>
          ) : (
            <div
              onClick={() => navigate(`/transferbalance/${customerId}`)}
              className="w-full lg:w-full mx-auto"
            >
              <div className="rounded-2xl border flex flex-row justify-between items-center border-stroke h-auto sm:h-16 bg-white py-4 sm:py-6 px-6 sm:px-8 shadow-default dark:border-stroke dark:bg-boxdark cursor-pointer hover:bg-gray-200 hover:shadow-xl hover:scale-105 transform transition duration-300 ease-in-out">
                <div className="flex items-center space-x-4 sm:space-x-6">
                  <img
                    src={depositImg}
                    alt="Custom Icon"
                    className="w-6 h-6 sm:w-6 sm:h-6"
                  />
                  <div className="text-xs sm:text-sm">
                    <h2 className="font-semibold text-base">
                      Internal Transfer
                    </h2>
                    <p
                      className="text-xs text-gray-500 sm:text-xs"
                      {...textColorProps}
                    >
                      Transfer Money
                    </p>
                  </div>
                </div>
                <IoIosArrowForward className="hidden sm:block lg:hidden xl:block w-6 h-6 text-sky-800" />
              </div>
            </div>
          ))}

        {allowedModules.some((module) => module.module_name === "Deposit") && (
          <div onClick={handleDepositClick} className="w-full cursor-pointer">
            <div className="rounded-2xl border flex justify-between items-center border-stroke h-16 bg-white py-6 px-8 shadow-default dark:border-stroke dark:bg-boxdark hover:bg-gray-200 hover:shadow-xl hover:scale-105 transform transition duration-300 ease-in-out">
              <div className="flex items-center">
                <img
                  src={depositImg}
                  alt="Custom Icon"
                  className="w-6 h-6 mr-4"
                />
                <div className="text-xs sm:text-sm">
                  <h2 className="text-base font-medium">Deposit</h2>
                  <p className="text-xs text-gray-500" {...textColorProps}>
                    Deposit Money
                  </p>
                </div>
              </div>
              <IoIosArrowForward className="hidden sm:block lg:hidden xl:block w-6 h-6 text-sky-800" />
            </div>
          </div>
        )}

        {(allowedModules.some((module) => module.module_name === "Convert") ||
          hostName === "ourzap.unlimitedremit.com") && (
          <div
            onClick={handleConversionClick}
            className="w-full cursor-pointer"
          >
            <div
              className="rounded-2xl border flex justify-between items-center border-stroke h-16 bg-white py-6 px-8 shadow-default dark:border-stroke dark:bg-boxdark cursor-pointer 
              hover:bg-gray-200 hover:shadow-xl hover:scale-105 transform transition duration-300 ease-in-out"
            >
              <div className="flex items-center">
                <img
                  src={convertImg}
                  alt="Custom Icon"
                  className="w-6 h-6 mr-4"
                />
                <div className="text-xs sm:text-sm">
                  <h2 className="text-base font-medium">Convert</h2>
                  <p className="text-xs text-gray-500" {...textColorProps}>
                    Global currency conversion
                  </p>
                </div>
              </div>
              <IoIosArrowForward className="w-6 h-6 text-black" />
            </div>
          </div>
        )}

        {allowedModules.some((module) => module.module_name === "Payout") && (
          <div onClick={handlePayoutClick} className="w-full cursor-pointer">
            <div className="rounded-2xl border flex justify-between items-center border-stroke h-16 bg-white py-6 px-8 shadow-default dark:border-stroke dark:bg-boxdark cursor-pointer hover:bg-gray-200 hover:shadow-xl hover:scale-105 transform transition duration-300 ease-in-out">
              <div className="flex items-center">
                <img
                  src={remitImg}
                  alt="Custom Icon"
                  className="w-6 h-6 mr-4"
                />
                <div className="text-xs sm:text-sm">
                  <h2 className="text-base font-medium">Payout</h2>
                  <p className="text-xs text-gray-500" {...textColorProps}>
                    Send money WorldWide
                  </p>
                </div>
              </div>
              <IoIosArrowForward className="w-6 h-6 text-black" />
            </div>
          </div>
        )}
        {allowedModules.some(
          (module) => module.module_name === "Remittance"
        ) && (
          <div onClick={handleRemitClick} className="w-full cursor-pointer">
            <div className="rounded-2xl border flex justify-between items-center border-stroke h-16 bg-white py-6 px-8 shadow-default dark:border-stroke dark:bg-boxdark cursor-pointer hover:bg-gray-200 hover:shadow-xl hover:scale-105 transform transition duration-300 ease-in-out">
              <div className="flex items-center">
                <img
                  src={remitImg}
                  alt="Custom Icon"
                  className="w-6 h-6 mr-4"
                />
                <div className="text-xs sm:text-sm">
                  <h2 className="text-base font-medium">Remittance</h2>
                  <p className="text-xs text-gray-500" {...textColorProps}>
                    Send money globally
                  </p>
                </div>
              </div>
              <IoIosArrowForward className="w-6 h-6 text-black" />
            </div>
          </div>
        )}
        {allowedModules.some(
          (module) => module.module_name === "Add More Accounts"
        ) && (
          <div
            onClick={() => navigate(`/addaccount/${customerId}`)}
            className="w-full lg:w-full"
          >
            <div className="rounded-2xl border flex justify-between items-center border-stroke h-16 bg-white py-6 px-8 shadow-default dark:border-stroke dark:bg-boxdark cursor-pointer hover:bg-gray-200 hover:shadow-xl hover:scale-105 transform transition duration-300 ease-in-out">
              <div className="flex items-center">
                <img src={addImg} alt="Custom Icon" className="w-6 h-6 mr-4" />
                <div>
                  <h2 className="text-base font-medium">Add More Accounts</h2>
                  <p className="text-xs text-gray-500" {...textColorProps}>
                    Enhance accessibility by adding additional accounts
                  </p>
                </div>
              </div>
              <IoIosArrowForward className="w-6 h-6 text-black" />
            </div>
          </div>
        )}
        {isRemittanceOnlyCustomer === "Y" && (
          <div>
            {selectedCurrencyCode === "USD" && (
              <div onClick={handleLinkBankClick} className="w-full lg:w-full">
                <div className="rounded-2xl border flex justify-between items-center border-stroke h-16 bg-white py-6 px-8 shadow-default dark:border-stroke dark:bg-boxdark cursor-pointer hover:bg-gray-200 hover:shadow-xl hover:scale-105 transform transition duration-300 ease-in-out">
                  <div className="flex items-center">
                    <MdAccountBalance className="mr-4 text-xl text-green-600" />
                    <div>
                      <h2 className="text-base font-medium">Link Bank</h2>
                      <p className="text-xs text-gray-500" {...textColorProps}>
                        Connect your bank
                      </p>
                    </div>
                  </div>
                  <IoIosArrowForward className="w-6 h-6 text-black" />
                </div>
              </div>
            )}
          </div>
        )}
        {download_operation_manual === "Y" && (
          <div>
            <div
              onClick={handleUserManualClick}
              className="w-full lg:w-full flex justify-center items-center"
            >
              <div className="w-3/4 rounded-2xl border flex justify-center items-center border-stroke h-16 text-white bg-gray-800 py-6 px-8 shadow-default dark:border-stroke dark:bg-boxdark cursor-pointer hover:bg-gray-700 hover:shadow-xl hover:scale-105 transform transition duration-300 ease-in-out">
                {manualLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <ClipLoader color="#36d7b7" size={50} />
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Download className="mr-4 text-xl text-white" />
                    <div>
                      <h2 className="text-base font-medium">User Manual</h2>
                      <p className="text-xs text-gray-500" {...textColorProps}>
                        User Manual
                      </p>
                    </div>
                  </div>
                )}
                <IoIosArrowForward className="w-6 h-6 text-black" />
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
