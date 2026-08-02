// src/components/Dashboard/Navigation/NavigateSection.jsx - CLEAN VERSION (NO EXTRA BUTTONS)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { IoIosArrowForward } from "react-icons/io";
import { Repeat, Download, Headphones } from "lucide-react";
import depositImg from "../../../assets/images/icon/Deposit-Img.png";
import convertImg from "../../../assets/images/icon/Convert-Img.png";
import remitImg from "../../../assets/images/icon/Remit-Img.png";
import addImg from "../../../assets/images/icon/AddAccount.png";
import { MdAccountBalance, MdDashboard, MdPeople } from "react-icons/md";
import FeatureComingSoonPopup from "../../PopupModal/FeatureComingSoonPopup";
import PropTypes from "prop-types";
import RingLoader from "react-spinners/RingLoader";
import ErrorBoundary from "../../ErrorBoundary/ErrorBoundary";

// Redux imports
import {
  fetchCustomerProfile,
  fetchAllowedModules,
  downloadUserManual,
  setPopupData,
  setHasFetchedProfile,
  setHasFetchedModules,
} from "./NavigateSectionSlice";

// Import selectors
import {
  selectCustomerStatus,
  selectAllowedModules,
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

import AddAccountPopup from "./AddAccountPopup/AddAccountPopup";

function NavigateSectionContent({
  selectedCurrencyCode,
  onLoadingStart,
  onLoadingEnd,
  textColor,
  customerId: propCustomerId,
}) {
  const { customerId: paramCustomerId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Use prop customerId first, then URL param
  const customerId = propCustomerId || paramCustomerId;

  // Redux selectors
  const customerStatus = useSelector(selectCustomerStatus);
  const allowedModules = useSelector(selectAllowedModules);
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

  const [showAddAccountPopup, setShowAddAccountPopup] = useState(false);

  // Local state
  const [isFetching, setIsFetching] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [featurePopup, setFeaturePopup] = useState({
    isOpen: false,
    featureName: "",
  });

  // Refs
  const hasFetchBeenCalled = useRef(false);

  const hostName = window.location.hostname;
  const bearertoken = useSelector(selectAuthToken);

  // Check if we're on remittance page
  const isRemittancePage = location.pathname.startsWith(
    `/remittance/${customerId}`,
  );

  // Check if Recurring Remit module is allowed from API
  const isRecurringRemitAllowed = allowedModules.some(
    (module) => module.module_name === "Recurring Remit",
  );

  // Cleanup effect for invalid customerId
  useEffect(() => {
    // If customerId is missing or invalid, reset the component state
    if (!customerId || customerId === "undefined" || customerId === "null") {
      console.log("NavigateSection: Invalid customerId, resetting state");
      hasFetchBeenCalled.current = false;
      setIsFetching(false);
      setLocalError(null);

      // Also reset Redux flags to allow refetch on next login
      dispatch(setHasFetchedProfile(false));
      dispatch(setHasFetchedModules(false));
    }
  }, [customerId, dispatch]);

  const fetchData = useCallback(async () => {
    if (hasFetchBeenCalled.current || !customerId) return;

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

      if (!hasFetchedProfile && customerId) {
        await dispatch(fetchCustomerProfile(customerId)).unwrap();
      }

      if (!hasFetchedModules) {
        await dispatch(
          fetchAllowedModules({
            partnerId: urlPartnerId,
            bearertoken,
          }),
        ).unwrap();
      }
    } catch (error) {
      console.error("Fetch error:", error);
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
          "Your account is deactivated. You cannot perform this transaction.",
        );
        return;
      }
      if (customerBankApprovedStatus === "0") {
        showPopup(
          "Your Bank account is not approved. You cannot perform this transaction.",
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
          "Your Bank account is not approved. You cannot perform this transaction.",
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
      navigate(`/convert/${customerId}`);
    } catch (error) {
      setLocalError("Failed to navigate to conversion");
    }
  };

  const handlePayoutClick = () => {
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
    navigate(`/payout/${customerId}`);
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

  const handleRequestRemitClick = () => {
    try {
      if (customerStatus === "Deactivated") {
        showPopup(
          "Your account is deactivated. You cannot request remittance.",
        );
        return;
      }
      navigate(`/request-remit/${customerId}`);
    } catch (error) {
      setLocalError("Failed to navigate to request remittance");
    }
  };

  const handleLinkBankClick = () => {
    try {
      if (customerStatus === "Deactivated") {
        showPopup(
          "Your account is deactivated. You cannot link a bank account.",
        );
        return;
      }
      navigate(`/linkbank/${customerId}`);
    } catch (error) {
      setLocalError("Failed to navigate to link bank");
    }
  };

  const handleRecurringRemitClick = () => {
    try {
      // For navigation, use the numeric customer_id from localStorage or prop
      // The customerId prop already contains the numeric ID (12773)
      const numericCustomerId = customerId || localStorage.getItem("authcustomer_id");

      console.log("Navigating to recurring remit with numeric ID:", numericCustomerId);

      if (!numericCustomerId) {
        showPopup("Customer ID not found. Please login again.");
        return;
      }

      // Navigate using numeric customer_id (12773)
      navigate(`/recurring-remit/${numericCustomerId}`);
    } catch (error) {
      console.error("Navigation error:", error);
      showPopup(
        "Unable to navigate to recurring remittance. Please try again.",
      );
    }
  };

  const handleCustomerSupportClick = () => {
    try {
      const numericCustomerId = customerId || localStorage.getItem("authcustomer_id");

      console.log("Navigating to customer support with numeric ID:", numericCustomerId);

      if (!numericCustomerId) {
        showPopup("Customer ID not found. Please login again.");
        return;
      }

      // Navigate to customer support page
      navigate(`/customer-support/${numericCustomerId}`);
    } catch (error) {
      console.error("Navigation error:", error);
      showPopup(
        "Unable to navigate to customer support. Please try again.",
      );
    }
  };

  const handleUserManualClick = async () => {
    try {
      const result = await dispatch(
        downloadUserManual({
          partnerId:
            whiteLabelledPartnerId === undefined ? 0 : whiteLabelledPartnerId,
          placement: "Home Screen",
        }),
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

  const handleRetry = () => {
    setLocalError(null);
    hasFetchBeenCalled.current = false;
    fetchData();
  };

  const getTextColorStyle = () => {
    if (textColor && textColor.startsWith("text-")) {
      return { className: textColor };
    } else if (textColor && textColor.startsWith("#")) {
      return { style: { color: textColor } };
    }
    return {};
  };

  const textColorProps = getTextColorStyle();

  const handleAddMoreAccountsClick = () => {
    try {
      if (customerStatus === "Deactivated") {
        showPopup(
          "Your account is deactivated. You cannot add more accounts.",
        );
        return;
      }
      // Open the Add Account Popup
      setShowAddAccountPopup(true);
    } catch (error) {
      setLocalError("Failed to open add account popup");
    }
  };

  // Navigation items configuration
  const navigationItems = [
    {
      id: "home",
      label: "Home",
      icon: <MdDashboard className="w-5 h-5" />,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: () => navigate(`/home/${customerId}`),
      visible: true,
      description: "View your dashboard",
    },
    {
      id: "beneficiary",
      label: "Beneficiary",
      icon: <MdPeople className="w-5 h-5" />,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      onClick: () => navigate(`/beneficiaries/${customerId}`),
      visible: true,
      description: "Manage your beneficiaries",
    },
    {
      id: "transfer",
      label:
        hostName === "localhost" ||
          hostName === "ourzap.unlimitedremit.com" ||
          hostName === "sandbox-ourzap.unlimitedremit.com"
          ? "Transfer"
          : "Internal Transfer",
      icon: <img src={depositImg} alt="Transfer" className="w-5 h-5" />,
      onClick: handleTransferClick,
      visible: allowedModules.some(
        (module) => module.module_name === "Transfer",
      ),
      description: "Transfer Money",
    },
    {
      id: "deposit",
      label: "Deposit",
      icon: <img src={depositImg} alt="Deposit" className="w-5 h-5" />,
      onClick: handleDepositClick,
      visible: allowedModules.some(
        (module) => module.module_name === "Deposit",
      ),
      description: "Deposit Money",
    },
    {
      id: "convert",
      label: "Convert",
      icon: <img src={convertImg} alt="Convert" className="w-5 h-5" />,
      onClick: handleConversionClick,
      visible:
        allowedModules.some((module) => module.module_name === "Convert") ||
        hostName === "ourzap.unlimitedremit.com",
      description: "Global currency conversion",
    },
    {
      id: "payout",
      label: "Payout",
      icon: <img src={remitImg} alt="Payout" className="w-5 h-5" />,
      onClick: handlePayoutClick,
      visible: allowedModules.some((module) => module.module_name === "Payout"),
      description: "Send money WorldWide",
    },
    {
      id: "remittance",
      label: "Remittance",
      icon: <img src={remitImg} alt="Remittance" className="w-5 h-5" />,
      onClick: handleRemitClick,
      visible: allowedModules.some(
        (module) => module.module_name === "Remittance",
      ),
      description: "Send money globally",
    },
    {
      id: "request-remit",
      label: "Request Remit",
      icon: <img src={remitImg} alt="Request Remit" className="w-5 h-5" />,
      onClick: handleRequestRemitClick,
      visible: allowedModules.some(
        (module) => module.module_name === "Request Remit",
      ),
      description: "Request Remittance from contacts",
    },
    {
      id: "add-accounts",
      label: "Add More Accounts",
      icon: <img src={addImg} alt="Add Account" className="w-5 h-5" />,
      onClick: handleAddMoreAccountsClick,
      visible: allowedModules.some(
        (module) => module.module_name === "Add More Accounts",
      ),
      description: "Enhance accessibility",
    },
    {
      id: "link-bank",
      label: "Link Bank",
      icon: <MdAccountBalance className="w-5 h-5 text-green-600" />,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      onClick: handleLinkBankClick,
      visible: true,
      description: "Connect your bank",
    },
    {
      id: "recurring-remit",
      label: "Recurring Remit",
      icon: <Repeat className="w-5 h-5 text-purple-600" />,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      onClick: handleRecurringRemitClick,
      visible: isRecurringRemitAllowed, // Show everywhere, not just on remittance page
      description: "Schedule recurring transfers",
    },
    {
      id: "customer-support",
      label: "Customer Support",
      icon: <Headphones className="w-5 h-5 text-blue-600" />,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: handleCustomerSupportClick,
      visible: true, // Always visible
      description: "Get help and support",
    },
  ];

  const visibleItems = navigationItems.filter((item) => item.visible);

  // Error state
  if (localError) {
    return (
      <div className="w-full h-full flex justify-center items-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
          <div className="text-red-600 mb-2">
            <svg
              className="w-12 h-12 mx-auto mb-3"
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
            <p className="font-semibold text-lg">Navigation Error</p>
          </div>
          <p className="text-red-700 text-sm mb-4">{localError}</p>
          <button
            onClick={handleRetry}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (profileLoading || isFetching) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <RingLoader color="#36d7b7" size={40} />
      </div>
    );
  }

  // If no customerId, show loading
  if (!customerId) {
    return (
      <div className="w-full h-full flex justify-center items-center p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md w-full text-center">
          <p className="text-yellow-800">Loading customer information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white">
      <div className="h-full overflow-y-auto">
        <div className="flex flex-col gap-2 p-4">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              onClick={item.onClick}
              className="w-full cursor-pointer"
            >
              <div className="rounded-xl border flex justify-between items-center border-gray-200 bg-white py-3 px-4 shadow-sm hover:bg-gray-50 hover:shadow-md transition-all duration-200">
                <div className="flex items-center space-x-3">
                  <div
                    className={`${item.bgColor || "bg-gray-50"} p-2 rounded-lg`}
                  >
                    {typeof item.icon === "string" ? (
                      <img
                        src={item.icon}
                        alt={item.label}
                        className="w-5 h-5"
                      />
                    ) : (
                      React.cloneElement(item.icon, {
                        className: `w-5 h-5 ${item.iconColor || ""}`,
                      })
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-gray-900">
                      {item.label}
                    </h2>
                    <p
                      className="text-xs text-gray-500 truncate"
                      {...textColorProps}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
                <IoIosArrowForward className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          ))}

          {/* User Manual Button - Keep this as it's a feature */}
          {download_operation_manual === "Y" && (
            <div className="w-full mt-2">
              <div
                onClick={handleUserManualClick}
                className="w-full cursor-pointer"
              >
                <div className="rounded-xl border flex justify-center items-center border-gray-200 bg-gray-800 py-3 px-4 shadow-sm hover:bg-gray-700 transition-all duration-200">
                  {manualLoading ? (
                    <RingLoader color="#36d7b7" size={20} />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Download className="w-4 h-4 text-white" />
                      <div>
                        <h2 className="text-sm font-semibold text-white">
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
        onClose={() => setFeaturePopup({ isOpen: false, featureName: "" })}
        featureName={featurePopup.featureName}
      />

      {/* Add Account Popup */}
      <AddAccountPopup
        isOpen={showAddAccountPopup}
        onClose={() => setShowAddAccountPopup(false)}
        customerId={customerId}
        partnerId={whiteLabelledPartnerId}
      />
    </div>
  );
}

NavigateSectionContent.propTypes = {
  selectedCurrencyCode: PropTypes.string,
  onLoadingStart: PropTypes.func,
  onLoadingEnd: PropTypes.func,
  textColor: PropTypes.string,
  customerId: PropTypes.string,
};

// Main component wrapped with Error Boundary
function NavigateSection(props) {
  return (
    <ErrorBoundary>
      <NavigateSectionContent {...props} />
    </ErrorBoundary>
  );
}

export default React.memo(NavigateSection);