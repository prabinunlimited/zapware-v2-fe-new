import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Modal from "react-modal";

// Redux actions
import {
  initializePlaidLink,
  storePlaidData,
  deleteLinkedBankAccount,
  clearPlaidResult,
  setApiResponse,
  clearApiResponse,
  setPlaidLoading,
} from "./plaidSlice";

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    maxWidth: "90%",
    width: "600px",
    maxHeight: "80vh",
    overflow: "auto",
  },
};

const ZapPlaidLink = ({ onSuccess, onClose, showButton = true, autoInitialize = false }) => {
  const dispatch = useDispatch();
  const { customerId } = useParams();
  const linkHandlerRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Redux state
  const { isLoading, error, result, apiResponse } =
    useSelector((state) => state.plaid || {});

  const [actionType, setActionType] = useState("link");
  const [localResult, setLocalResult] = useState(null);

  // Helper function to clean error messages - RENAMED to avoid conflict
  const getCleanErrorMessage = (errorMsg) => {
    if (!errorMsg) return "An error occurred";
    
    // Handle string errors
    if (typeof errorMsg === 'string') {
      // Check for USD Wallet
      if (errorMsg.includes("USD Wallet")) {
        return "USD Wallet not found.";
      }
      // Check for JSON string
      if (errorMsg.includes('"error"') || errorMsg.includes('"message"')) {
        try {
          const parsed = JSON.parse(errorMsg);
          if (parsed.error) return parsed.error;
          if (parsed.message) return parsed.message;
          if (parsed.data?.error) return parsed.data.error;
        } catch(e) {}
      }
      return errorMsg;
    }
    
    // Handle object errors
    if (typeof errorMsg === 'object') {
      if (errorMsg.message) return errorMsg.message;
      if (errorMsg.error) return errorMsg.error;
      if (errorMsg.data?.error) return errorMsg.data.error;
      if (errorMsg.response?.data?.error) return errorMsg.response.data.error;
      if (errorMsg.response?.data?.message) return errorMsg.response.data.message;
    }
    
    return "Unable to complete request";
  };

  // Make sure to bind modal to your appElement
  useEffect(() => {
    Modal.setAppElement("#root");
  }, []);

  // Load Plaid script
  useEffect(() => {
    const loadPlaidScript = () => {
      // Check if script already exists
      if (document.querySelector('script[src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"]')) {
        console.log("✅ Plaid script already loaded");
        if (window.Plaid) {
          setScriptLoaded(true);
        }
        return;
      }

      console.log("📦 Loading Plaid script...");
      const script = document.createElement("script");
      script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
      script.async = true;
      script.onload = () => {
        console.log("✅ Plaid script loaded successfully");
        if (window.Plaid) {
          setScriptLoaded(true);
        } else {
          console.error("❌ Plaid object not available after script load");
        }
      };
      script.onerror = (error) => {
        console.error("❌ Failed to load Plaid script:", error);
        showApiResponsePopup({
          status: 500,
          data: { error: "Failed to load Plaid. Please check your internet connection." },
          isError: true,
        });
      };
      document.body.appendChild(script);
    };

    loadPlaidScript();
  }, []);

  // Auto-initialize Plaid if autoInitialize is true
  useEffect(() => {
    if (autoInitialize && scriptLoaded && showButton && !isLoading) {
      console.log("🚀 Auto-initializing Plaid...");
      setTimeout(() => {
        initializePlaid();
      }, 500);
    }
  }, [autoInitialize, scriptLoaded, showButton, isLoading]);

  const showApiResponsePopup = (response) => {
    console.log("📤 showApiResponsePopup called with:", response);
    
    // Extract and clean the error message
    let cleanMessage = "";
    let cleanTitle = "Error";
    
    if (response.isError) {
      // Extract error message from various formats
      if (response.data?.error) {
        cleanMessage = getCleanErrorMessage(response.data.error);
        cleanTitle = "Unable to Link Bank Account";
      } else if (response.data?.message) {
        cleanMessage = getCleanErrorMessage(response.data.message);
      } else if (typeof response.data === 'string') {
        cleanMessage = getCleanErrorMessage(response.data);
      } else {
        cleanMessage = "An error occurred";
      }
      
      // Special case for USD Wallet
      if (cleanMessage.includes("USD Wallet")) {
        cleanMessage = "USD Wallet not found.";
        cleanTitle = "Unable to Link Bank Account";
      }
    } else {
      cleanMessage = response.data?.message || "Operation completed successfully";
      cleanTitle = "Success";
    }
    
    // Create a clean response object
    const cleanResponse = {
      isError: response.isError,
      message: cleanMessage,
      title: cleanTitle,
      showModal: true,
      data: response.data
    };
    
    console.log("📤 Cleaned response:", cleanResponse);
    
    // Dispatch the cleaned response
    if (typeof setApiResponse === "function") {
      dispatch(setApiResponse(cleanResponse));
    } else {
      // Fallback: show result locally
      setLocalResult({
        success: !response.isError,
        message: cleanMessage,
        error: response.isError ? cleanMessage : null,
      });
    }
  };

  const handlePlaidSuccess = async (public_token, metadata) => {
    try {
      console.log("🚀 handlePlaidSuccess called with:", {
        public_token,
        customerId,
        metadataAccounts: metadata.accounts,
        metadataInstitution: metadata.institution,
      });

      dispatch(setPlaidLoading(true));

      const saveResponse = await dispatch(
        storePlaidData({
          public_token,
          accounts: metadata.accounts,
          customerId,
        })
      ).unwrap();

      console.log("✅ storePlaidData successful response:", saveResponse);

      // Store the result locally
      setLocalResult({
        ...saveResponse,
        success: true,
        message: saveResponse.message || "Bank account successfully linked",
      });

      // Pass the entire API response to onSuccess callback
      if (onSuccess) {
        console.log("🎯 Calling onSuccess callback with response");
        onSuccess(saveResponse);
      }

      dispatch(clearApiResponse());
    } catch (err) {
      console.error("❌ storePlaidData failed:", err);
      
      const cleanMessage = getCleanErrorMessage(err.message || "Failed to link bank account");
      
      setLocalResult({
        success: false,
        message: cleanMessage,
        error: cleanMessage,
      });
    } finally {
      dispatch(setPlaidLoading(false));
    }
  };

  const handlePlaidExit = (err) => {
    if (err) {
      console.log("🚪 Plaid exit with error:", err);
      const cleanMessage = getCleanErrorMessage(err.message || err.error_message || "Plaid exit with error");
      showApiResponsePopup({
        status: 400,
        data: { error: cleanMessage },
        isError: true,
      });
    } else {
      console.log("🚪 Plaid exit without error");
    }
    dispatch(setPlaidLoading(false));
  };

  const initializePlaid = async () => {
    console.log("🔧 initializePlaid called");
    
    if (!customerId) {
      console.error("❌ No customerId available");
      showApiResponsePopup({
        status: 500,
        data: { error: "Customer ID not found. Please login again." },
        isError: true,
      });
      return;
    }

    if (!window.Plaid) {
      console.error("❌ Plaid object not available");
      showApiResponsePopup({
        status: 500,
        data: { error: "Plaid not loaded. Please refresh the page." },
        isError: true,
      });
      return;
    }

    setActionType("link");
    dispatch(clearPlaidResult());
    setLocalResult(null);
    dispatch(setPlaidLoading(true));

    try {
      console.log("🔑 Fetching Plaid link token for customer:", customerId);
      const data = await dispatch(initializePlaidLink(customerId)).unwrap();

      console.log("🔑 Plaid link token received:", data.link_token);

      if (!data.link_token) {
        throw new Error("No link token received from server");
      }

      const linkConfig = {
        token: data.link_token,
        onSuccess: handlePlaidSuccess,
        onExit: handlePlaidExit,
      };

      console.log("🎨 Creating Plaid Link handler with config:", linkConfig);
      linkHandlerRef.current = window.Plaid.create(linkConfig);
      
      console.log("🚀 Opening Plaid Link modal");
      linkHandlerRef.current.open();
    } catch (error) {
      console.error("❌ Failed to initialize Plaid:", error);
      
      // Clean the error message - FIXED: use getCleanErrorMessage
      let cleanErrorMsg = "Unable to link bank account";
      
      if (error.message) {
        cleanErrorMsg = getCleanErrorMessage(error.message);
      } else if (error.response?.data?.error) {
        cleanErrorMsg = getCleanErrorMessage(error.response.data.error);
      } else if (error.response?.data?.message) {
        cleanErrorMsg = getCleanErrorMessage(error.response.data.message);
      }
      
      showApiResponsePopup({
        status: 500,
        data: { error: cleanErrorMsg },
        isError: true,
      });
      dispatch(setPlaidLoading(false));
    }
  };

  const handleDeleteAccount = async (accountId) => {
    setActionType("delete");
    dispatch(clearPlaidResult());
    setLocalResult(null);

    try {
      const resultData = await dispatch(
        deleteLinkedBankAccount({
          account_id: accountId,
          user_handle: customerId,
        })
      ).unwrap();

      showApiResponsePopup({
        status: 200,
        data: resultData,
        isError: false,
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      const cleanMessage = getCleanErrorMessage(err.message || "Failed to delete account");
      showApiResponsePopup({
        status: 500,
        data: { error: cleanMessage },
        isError: true,
      });
    }
  };

  const handleCloseResult = () => {
    dispatch(clearPlaidResult());
    dispatch(clearApiResponse());
    setLocalResult(null);

    if (onClose) onClose();
  };

  const renderAccountResult = () => {
    const displayResult = localResult || result;

    if (!displayResult) return null;

    // Get clean error message
    const getCleanMessage = () => {
      if (displayResult.message) {
        return getCleanErrorMessage(displayResult.message);
      }
      if (displayResult.error) {
        return getCleanErrorMessage(displayResult.error);
      }
      return displayResult.success ? "Operation completed" : "An error occurred";
    };

    const cleanMessage = getCleanMessage();
    const isSuccess = displayResult.success === true;

    return (
      <div className="space-y-4 mt-4">
        {cleanMessage && (
          <div
            className={`${
              isSuccess
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            } text-center font-semibold p-4 rounded-md`}
          >
            {cleanMessage}
          </div>
        )}

        {actionType === "link" &&
          displayResult.success_accounts &&
          displayResult.success_accounts.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-green-800 mb-2">
                Successfully Linked Accounts
              </h3>
              <ul className="space-y-2">
                {displayResult.success_accounts.map((account, index) => (
                  <li key={index} className="flex items-center text-green-700">
                    <span className="mr-2">
                      <svg
                        className="w-4 h-4 text-green-700"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                    {account.account_name} ({account.account_id?.slice(0, 4)}...
                    {account.account_id?.slice(-4) || "N/A"})
                  </li>
                ))}
              </ul>
            </div>
          )}

        {actionType === "link" &&
          displayResult.failed_accounts &&
          displayResult.failed_accounts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-red-800 mb-6">
                Failed to Link Accounts
              </h3>
              <ul className="space-y-10 py-2">
                {displayResult.failed_accounts.map((account, index) => (
                  <li key={index} className="flex items-start text-red-700">
                    <span className="mr-2 mt-1">
                      <svg
                        className="w-4 h-4 text-red-700"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </span>
                    <div>
                      <div className="font-medium">
                        {account.account_name} (
                        {account.account_id?.slice(0, 4)}
                        ...{account.account_id?.slice(-4) || "N/A"})
                      </div>
                      <div className="text-sm text-red-600 mt-1">
                        {getCleanErrorMessage(account.message)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

        <button
          onClick={handleCloseResult}
          className="w-full flex justify-center items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition duration-300"
        >
          Close
        </button>
      </div>
    );
  };

  return (
    <div className="p-4">
      {/* Main Modal Content */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-3">
        <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
          {actionType === "delete"
            ? "Delete Bank Account"
            : "Link Your Bank Account"}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {!localResult && !result ? (
        <>
          {actionType === "delete" ? (
            <div className="text-center py-8">
              <p className="mb-4">
                Are you sure you want to delete this bank account?
              </p>
              <button
                onClick={() => handleDeleteAccount("YOUR_ACCOUNT_ID")}
                disabled={isLoading}
                className="w-full flex justify-center items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Confirm Delete"
                )}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                {/* <p className="text-gray-600 mb-4">
                  Securely connect your bank account using Plaid. Your
                  credentials are never stored and all connections are
                  encrypted.
                </p> */}
                {!scriptLoaded && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <p className="text-yellow-800 text-sm">Loading Plaid connection...</p>
                  </div>
                )}
              </div>
              {showButton && (
                <button
                  onClick={initializePlaid}
                  disabled={isLoading || !scriptLoaded}
                  className="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 shadow-md"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Connecting to Plaid...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      Continue to Plaid
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </>
      ) : (
        renderAccountResult()
      )}

      {/* API Response Modal - Cleaned Version */}
      {apiResponse?.showModal && (
        <Modal
          isOpen={true}
          onRequestClose={() => dispatch(clearApiResponse())}
          style={customStyles}
          contentLabel="API Response"
        >
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">
              {apiResponse.title || (apiResponse.isError ? "Error" : "Success")}
            </h2>
            <div
              className={`p-3 rounded ${
                apiResponse.isError
                  ? "bg-red-50 border border-red-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <p className="text-sm">
                {apiResponse.message || (apiResponse.isError ? "An error occurred" : "Operation completed")}
              </p>
            </div>
            <button
              onClick={() => dispatch(clearApiResponse())}
              className="mt-4 w-full px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

ZapPlaidLink.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  showButton: PropTypes.bool,
  autoInitialize: PropTypes.bool,
};

export default ZapPlaidLink;