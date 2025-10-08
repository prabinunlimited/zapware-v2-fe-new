// src/features/NavigateSection/NavigateSection.jsx
import React, { useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import { MdAccountBalance } from "react-icons/md";
import { Download } from "lucide-react";
import PropTypes from "prop-types";
import ClipLoader from "react-spinners/ClipLoader";

// Import assets
import depositImg from "../../../assets/images/icon/Deposit-img.png";
import payoutImg from "../../../assets/images/icon/Payout-Img.png";
import convertImg from "../../../assets/images/icon/Convert-Img.png";
import remitImg from "../../../assets/images/icon/Remit-Img.png";
import addImg from "../../../assets/images/icon/AddAccount.png";

// Import components
// import FeatureUnavailablePopup from "../../../components/FeatureUnavailablePopup";
// import NavigationPopup from "../Popup/NavigationPopup";
import ZapPlaidLink from "../../../components/ZapPlaidLink/ZapPlaidLink";

// Redux imports
import {
    fetchCustomerProfile,
    fetchAllowedModules,
    downloadUserManual,
    setPopupData,
    clearPopupData,
    setPlaidLinkVisibility,
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
} from "./navigateSectionSlice";

const API_URL = import.meta.env.VITE_API_URL;

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
    const customerBankApprovedStatus = useSelector(selectCustomerBankApprovedStatus);
    const download_operation_manual = useSelector(selectDownloadOperationManual);
    const isWhiteLabelledPartner = useSelector(selectIsWhiteLabelledPartner);
    const whiteLabelledPartnerId = useSelector(selectWhiteLabelledPartnerId);
    const hasFetchedProfile = useSelector(selectHasFetchedProfile);
    const hasFetchedModules = useSelector(selectHasFetchedModules);

    const hostName = window.location.hostname;
    const isRemittanceOnlyCustomer = "Y";

    // State to manage popup visibility
    const [isPopupVisible, setIsPopupVisible] = useState(false);

    // State to track if we've already fetched data in this session
    const [hasFetchedData, setHasFetchedData] = useState(false);

    // Memoize the fetch function to prevent unnecessary re-creations
    const fetchData = useCallback(async () => {
        console.log("🔍 NavigateSection: Starting data fetch...");

        if (onLoadingStart) onLoadingStart();

        let urlPartnerId;
        if (isWhiteLabelledPartner === "1") {
            urlPartnerId = whiteLabelledPartnerId;
        } else {
            urlPartnerId = 9;
        }

        const bearertoken = localStorage.getItem("bearertoken");

        console.log("🔍 Fetch conditions:", {
            hasFetchedProfile,
            hasFetchedModules,
            hasFetchedData,
            customerId,
            bearertoken: !!bearertoken
        });

        try {
            // Only fetch if we haven't already fetched the data
            if (!hasFetchedProfile) {
                console.log("🔍 Fetching customer profile...");
                await dispatch(fetchCustomerProfile(customerId));
            } else {
                console.log("✅ Customer profile already fetched, skipping...");
            }

            if (!hasFetchedModules && bearertoken) {
                console.log("🔍 Fetching allowed modules...");
                await dispatch(fetchAllowedModules({
                    partnerId: urlPartnerId,
                    bearertoken
                }));
            } else if (hasFetchedModules) {
                console.log("✅ Allowed modules already fetched, skipping...");
            } else if (!bearertoken) {
                console.log("⚠️ No bearer token, skipping modules fetch");
            }

            // Update localStorage state
            dispatch(updateLocalStorageState());

            setHasFetchedData(true);
            console.log("✅ Data fetch completed");

        } catch (error) {
            console.error("❌ Error fetching data:", error);
        } finally {
            if (onLoadingEnd) onLoadingEnd();
        }
    }, [
        customerId,
        dispatch,
        isWhiteLabelledPartner,
        whiteLabelledPartnerId,
        hasFetchedProfile,
        hasFetchedModules,
        onLoadingStart,
        onLoadingEnd,
        hasFetchedData
    ]);

    // Fetch data on component mount - only once
    useEffect(() => {
        console.log("🔍 NavigateSection useEffect running", {
            customerId,
            hasFetchedData,
            hasFetchedProfile,
            hasFetchedModules
        });

        // Only fetch if we have customerId and haven't fetched data yet
        if (customerId && !hasFetchedData && (!hasFetchedProfile || !hasFetchedModules)) {
            console.log("🔍 Fetching data for the first time...");
            fetchData();
        } else if (hasFetchedData) {
            console.log("✅ Data already fetched in this session");
        } else if (!customerId) {
            console.log("⚠️ No customerId, skipping fetch");
        }
    }, [customerId, hasFetchedData, hasFetchedProfile, hasFetchedModules, fetchData]);

    // Add cleanup to reset fetch state when component unmounts
    useEffect(() => {
        return () => {
            console.log("🧹 NavigateSection cleanup");
            // Optionally reset the fetch flags if you want fresh data on next mount
            // dispatch(resetNavigateSection());
        };
    }, [dispatch]);

    const showPopup = (message, onConfirm) => {
        dispatch(setPopupData({ show: true, message, onConfirm }));
    };

    const handlePopupToggle = () => {
        setIsPopupVisible(!isPopupVisible);
    };

    // Navigation handlers
    const handleTransferClick = () => {
        if (customerStatus === "Deactivated") {
            showPopup(
                "Your account is deactivated. You cannot perform this transaction.",
                () => { }
            );
            return;
        }
        if (customerBankApprovedStatus === "0") {
            showPopup(
                "Your Bank account is not approved. You cannot perform this transaction.",
                () => { }
            );
            return;
        }
        navigate(`/transferbalance/${customerId}`);
    };

    const handleDepositClick = () => {
        if (customerStatus === "Deactivated") {
            showPopup(
                "Your account is deactivated. You cannot deposit money.",
                () => { }
            );
            return;
        }
        if (customerBankApprovedStatus === "0") {
            showPopup(
                "Your Bank account is not approved. You cannot perform this transaction.",
                () => { }
            );
            return;
        }
        navigate(`/deposit/${customerId}`);
    };

    const handleConversionClick = () => {
        if (customerStatus === "Deactivated") {
            showPopup(
                "Your account is deactivated. You cannot perform currency conversion.",
                () => { }
            );
            return;
        }
        if (customerBankApprovedStatus === "0") {
            showPopup(
                "Your Bank account is not approved. You cannot perform this transaction.",
                () => { }
            );
            return;
        }
        navigate(`/conversion/${customerId}`);
    };

    const handlePayoutClick = () => {
        if (customerStatus === "Deactivated") {
            showPopup(
                "Your account is deactivated. You cannot request a payout.",
                () => { }
            );
            return;
        }
        if (customerBankApprovedStatus === "0") {
            showPopup(
                "Your Bank account is not approved. You cannot perform this transaction.",
                () => { }
            );
            return;
        }
        navigate(`/remitpayout/${customerId}`);
    };

    const handleRemitClick = () => {
        if (customerStatus === "Deactivated") {
            showPopup(
                "Your account is deactivated. You cannot remit money.",
                () => { }
            );
            return;
        }
        navigate(`/remittance/${customerId}`);
    };

    const handleLinkBankClick = () => {
        if (customerStatus === "Deactivated") {
            showPopup(
                "Your account is deactivated. You cannot link a bank account.",
                () => { }
            );
            return;
        }
        navigate(`/linkbank/${customerId}`);
    };

    const handleUserManualClick = async () => {
        try {
            const result = await dispatch(downloadUserManual({
                partnerId: whiteLabelledPartnerId === undefined ? 0 : whiteLabelledPartnerId,
                placement: "Home Screen",
            })).unwrap();

            if (result.status === "success" && result.data?.file_path) {
                window.open(result.data.file_path, "_blank");
            } else {
                console.error("Manual not found");
                showPopup(
                    "Unable to download the user manual. Please try again later.",
                    () => { }
                );
            }
        } catch (error) {
            console.error("Download error:", error);
            showPopup(
                "Unable to download the user manual. Please try again later.",
                () => { }
            );
        }
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

    console.log("🔄 NavigateSection rendering - hasFetchedProfile:", hasFetchedProfile, "hasFetchedModules:", hasFetchedModules, "profileLoading:", profileLoading);

    return (
        <div
            className="px-2 col-span-1 md:col-span-1 xl:col-span-1 flex justify-start items-start min-h-[300px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[450px] xl:min-h-[500px] w-full max-w-sm lg:max-w-md space-y-4"
            style={{ color: textColor }}
        >
            {profileLoading ? (
                <div className="flex justify-center items-center h-full">
                    <ClipLoader color="#36d7b7" size={50} />
                </div>
            ) : (
                <div className="w-full flex flex-col gap-3">
                    {/* Transfer Money */}
                    {allowedModules.some((module) => module.module_name === "Transfer") &&
                        (hostName === "localhost" ||
                            hostName === "ourzap.unlimitedremit.com" ||
                            hostName === "sandbox-ourzap.unlimitedremit.com" ? (
                            <div
                                onClick={handleTransferClick}
                                className="w-full mx-auto cursor-pointer"
                            >
                                <div className="rounded-xl border flex flex-row justify-between items-center border-stroke h-auto sm:h-14 bg-white py-3 sm:py-4 px-3 sm:px-4 shadow-default dark:border-stroke dark:bg-boxdark cursor-pointer hover:bg-gray-200 hover:shadow-md hover:scale-105 transform transition duration-300 ease-in-out">
                                    <div className="flex items-center space-x-3 sm:space-x-4">
                                        <img
                                            src={depositImg}
                                            alt="Custom Icon"
                                            className="w-5 h-5 sm:w-5 sm:h-5"
                                        />
                                        <div className="text-xs">
                                            <h2 className="text-sm font-medium" {...textColorProps}>
                                                Transfer
                                            </h2>
                                            <p
                                                className="text-xs text-gray-500"
                                                {...textColorProps}
                                            >
                                                Transfer Money
                                            </p>
                                        </div>
                                    </div>
                                    <IoIosArrowForward className="hidden sm:block w-5 h-5 text-sky-800" />
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => navigate(`/transferbalance/${customerId}`)}
                                className="w-full mx-auto cursor-pointer"
                            >
                                <div className="rounded-xl border flex flex-row justify-between items-center border-stroke h-auto sm:h-14 bg-white py-3 sm:py-4 px-3 sm:px-4 shadow-default dark:border-stroke dark:bg-boxdark cursor-pointer hover:bg-gray-200 hover:shadow-md hover:scale-105 transform transition duration-300 ease-in-out">
                                    <div className="flex items-center space-x-3 sm:space-x-4">
                                        <img
                                            src={depositImg}
                                            alt="Custom Icon"
                                            className="w-5 h-5 sm:w-5 sm:h-5"
                                        />
                                        <div className="text-xs">
                                            <h2 className="text-sm font-medium">
                                                Internal Transfer
                                            </h2>
                                            <p
                                                className="text-xs text-gray-500"
                                                {...textColorProps}
                                            >
                                                Transfer Money
                                            </p>
                                        </div>
                                    </div>
                                    <IoIosArrowForward className="hidden sm:block w-5 h-5 text-sky-800" />
                                </div>
                            </div>
                        ))}

                    {/* Deposit */}
                    {allowedModules.some(
                        (module) => module.module_name === "Deposit"
                    ) && (
                            <div onClick={handleDepositClick} className="w-full cursor-pointer">
                                <div className="rounded-xl border flex justify-between items-center border-stroke h-14 bg-white py-4 px-4 shadow-default dark:border-stroke dark:bg-boxdark hover:bg-gray-200 hover:shadow-md hover:scale-105 transform transition duration-300 ease-in-out">
                                    <div className="flex items-center">
                                        <img
                                            src={depositImg}
                                            alt="Custom Icon"
                                            className="w-5 h-5 mr-3"
                                        />
                                        <div className="text-xs">
                                            <h2 className="text-sm font-medium">Deposit</h2>
                                            <p
                                                className="text-xs text-gray-500"
                                                {...textColorProps}
                                            >
                                                Deposit Money
                                            </p>
                                        </div>
                                    </div>
                                    <IoIosArrowForward className="hidden sm:block w-5 h-5 text-sky-800" />
                                </div>
                            </div>
                        )}

                    {/* Convert */}
                    {allowedModules.some(
                        (module) => module.module_name === "Convert"
                    ) && (
                            <div
                                onClick={handleConversionClick}
                                className="w-full cursor-pointer"
                            >
                                <div className="rounded-xl border flex justify-between items-center border-stroke h-14 bg-white py-4 px-4 shadow-default dark:border-stroke dark:bg-boxdark cursor-pointer hover:bg-gray-200 hover:shadow-md hover:scale-105 transform transition duration-300 ease-in-out">
                                    <div className="flex items-center">
                                        <img
                                            src={convertImg}
                                            alt="Custom Icon"
                                            className="w-5 h-5 mr-3"
                                        />
                                        <div className="text-xs">
                                            <h2 className="text-sm font-medium">Convert</h2>
                                            <p
                                                className="text-xs text-gray-500"
                                                {...textColorProps}
                                            >
                                                Currency conversion
                                            </p>
                                        </div>
                                    </div>
                                    <IoIosArrowForward className="w-5 h-5 text-black" />
                                </div>
                            </div>
                        )}

                    {/* Payout */}
                    {allowedModules.some((module) => module.module_name === "Payout") && (
                        <div onClick={handlePayoutClick} className="w-full cursor-pointer">
                            <div className="rounded-xl border flex justify-between items-center border-stroke h-14 bg-white py-4 px-4 shadow-default dark:border-stroke dark:bg-boxdark cursor-pointer hover:bg-gray-200 hover:shadow-md hover:scale-105 transform transition duration-300 ease-in-out">
                                <div className="flex items-center">
                                    <img
                                        src={remitImg}
                                        alt="Custom Icon"
                                        className="w-5 h-5 mr-3"
                                    />
                                    <div className="text-xs">
                                        <h2 className="text-sm font-medium">Payout</h2>
                                        <p className="text-xs text-gray-500" {...textColorProps}>
                                            Send money worldwide
                                        </p>
                                    </div>
                                </div>
                                <IoIosArrowForward className="w-5 h-5 text-black" />
                            </div>
                        </div>
                    )}

                    {/* Remittance */}
                    {allowedModules.some(
                        (module) => module.module_name === "Remittance"
                    ) && (
                            <div onClick={handleRemitClick} className="w-full cursor-pointer">
                                <div className="rounded-xl border flex justify-between items-center border-stroke h-14 bg-white py-4 px-4 shadow-default dark:border-stroke dark:bg-boxdark cursor-pointer hover:bg-gray-200 hover:shadow-md hover:scale-105 transform transition duration-300 ease-in-out">
                                    <div className="flex items-center">
                                        <img
                                            src={remitImg}
                                            alt="Custom Icon"
                                            className="w-5 h-5 mr-3"
                                        />
                                        <div className="text-xs">
                                            <h2 className="text-sm font-medium">Remittance</h2>
                                            <p
                                                className="text-xs text-gray-500"
                                                {...textColorProps}
                                            >
                                                Send money globally
                                            </p>
                                        </div>
                                    </div>
                                    <IoIosArrowForward className="w-5 h-5 text-black" />
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
                                <div className="rounded-xl border flex justify-between items-center border-stroke h-14 bg-white py-4 px-4 shadow-default dark:border-stroke dark:bg-boxdark cursor-pointer hover:bg-gray-200 hover:shadow-md hover:scale-105 transform transition duration-300 ease-in-out">
                                    <div className="flex items-center">
                                        <img
                                            src={addImg}
                                            alt="Custom Icon"
                                            className="w-5 h-5 mr-3"
                                        />
                                        <div className="text-xs">
                                            <h2 className="text-sm font-medium">Add Accounts</h2>
                                            <p
                                                className="text-xs text-gray-500"
                                                {...textColorProps}
                                            >
                                                Add additional accounts
                                            </p>
                                        </div>
                                    </div>
                                    <IoIosArrowForward className="w-5 h-5 text-black" />
                                </div>
                            </div>
                        )}

                    {/* Link Bank (for remittance only customers) */}
                    {isRemittanceOnlyCustomer === "Y" && selectedCurrencyCode === "USD" && (
                        <div onClick={handleLinkBankClick} className="w-full cursor-pointer">
                            <div className="rounded-xl border flex justify-between items-center border-stroke h-14 bg-white py-4 px-4 shadow-default dark:border-stroke dark:bg-boxdark cursor-pointer hover:bg-gray-200 hover:shadow-md hover:scale-105 transform transition duration-300 ease-in-out">
                                <div className="flex items-center">
                                    <MdAccountBalance className="mr-3 text-lg text-green-600" />
                                    <div className="text-xs">
                                        <h2 className="text-sm font-medium">Link Bank</h2>
                                        <p
                                            className="text-xs text-gray-500"
                                            {...textColorProps}
                                        >
                                            Connect your bank
                                        </p>
                                    </div>
                                </div>
                                <IoIosArrowForward className="w-5 h-5 text-black" />
                            </div>
                        </div>
                    )}

                    {/* User Manual */}
                    {download_operation_manual === "Y" && (
                        <div className="w-full flex justify-center items-center">
                            <div
                                onClick={handleUserManualClick}
                                className="w-full rounded-xl border flex justify-center items-center border-stroke h-14 text-white bg-gray-800 py-4 px-4 shadow-default dark:border-stroke dark:bg-boxdark cursor-pointer hover:bg-gray-700 hover:shadow-md hover:scale-105 transform transition duration-300 ease-in-out"
                            >
                                {manualLoading ? (
                                    <div className="flex justify-center items-center h-full">
                                        <ClipLoader color="#36d7b7" size={25} />
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <Download className="mr-3 text-lg text-white" />
                                        <div className="text-xs">
                                            <h2 className="text-sm font-medium">User Manual</h2>
                                            <p
                                                className="text-xs text-gray-500"
                                                {...textColorProps}
                                            >
                                                User Manual
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <IoIosArrowForward className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation Popup */}
            {/* {popupData.show && (
        <NavigationPopup
          message={popupData.message}
          onClose={() => dispatch(clearPopupData())}
          onConfirm={() => {
            dispatch(clearPopupData());
            if (popupData.onConfirm) popupData.onConfirm();
          }}
        />
      )} */}

            {/* Feature Unavailable Popup */}
            {/* {isPopupVisible && (
        <FeatureUnavailablePopup onClose={handlePopupToggle} />
      )} */}

            {/* Plaid Link Component */}
            {showPlaidLink && (
                <ZapPlaidLink
                    onSuccess={() => dispatch(setPlaidLinkVisibility(false))}
                    onExit={() => dispatch(setPlaidLinkVisibility(false))}
                />
            )}
        </div>
    );
}

NavigateSection.propTypes = {
    selectedCurrencyCode: PropTypes.string,
    onLoadingStart: PropTypes.func,
    onLoadingEnd: PropTypes.func,
    textColor: PropTypes.string,
};

export default NavigateSection;