import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Modal from "react-modal";

// Redux actions - Make sure the import path is correct
// If ZapPlaidLink.jsx is in the same directory as plaidSlice.js, use "./plaidSlice"
// If it's in a different directory, adjust the path accordingly
import {
  initializePlaidLink,
  storePlaidData,
  deleteLinkedBankAccount,
  clearPlaidResult,
  setApiResponse, // This IS exported from plaidSlice.js
  clearApiResponse,
  setPlaidLoading,
} from "./plaidSlice"; // ← Check this path!

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

const ZapPlaidLink = ({ onSuccess, onClose, showButton = true }) => {
  const dispatch = useDispatch();
  const { customerId } = useParams();
  const linkHandlerRef = useRef(null);

  const plaidState = useSelector((state) => state.plaid);

  useEffect(() => {
    console.log("🔍 Redux plaid slice state:", plaidState);
    console.log("🔍 storePlaidData function available?", typeof storePlaidData);
    console.log("🔍 setApiResponse function available?", typeof setApiResponse); // Add this debug
  }, []);

  // Redux state
  const { isLoading, error, result, apiResponse, showResponseModal } =
    useSelector((state) => state.plaid || {});

  const [actionType, setActionType] = useState("link"); // 'link' or 'delete'
  const [localResult, setLocalResult] = useState(null); // Local state to show result

  // Make sure to bind modal to your appElement
  useEffect(() => {
    Modal.setAppElement("#root");
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const parseErrorMessage = (errorString) => {
    try {
      const jsonMatch = errorString.match(/\{.*\}/s);
      if (jsonMatch) {
        const errorObj = JSON.parse(jsonMatch[0]);
        return errorObj.message || errorString;
      }
      return errorString;
    } catch (e) {
      return errorString;
    }
  };

  const showApiResponsePopup = (response) => {
    console.log("📤 showApiResponsePopup called with:", response);
    console.log("🔍 setApiResponse function:", setApiResponse);

    // Check if setApiResponse is available
    if (typeof setApiResponse === "function") {
      dispatch(
        setApiResponse({
          status: response.status,
          data: response.data,
          isError: response.isError || false,
          showModal: true,
        }),
      );
    } else {
      console.error("❌ setApiResponse is not a function!");
      // Fallback: show result locally
      setLocalResult({
        success: response.isError ? false : true,
        message: response.isError
          ? response.data?.error
          : "Operation completed",
        error: response.isError ? response.data?.error : null,
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

      // Show loading state
      dispatch(setPlaidLoading(true));

      const saveResponse = await dispatch(
        storePlaidData({
          public_token,
          accounts: metadata.accounts,
          customerId,
        }),
      ).unwrap();

      console.log("✅ storePlaidData successful response:", {
        keys: Object.keys(saveResponse),
        hasSuccessAccounts: saveResponse.success_accounts?.length > 0,
        successAccountsCount: saveResponse.success_accounts?.length || 0,
        failedAccountsCount: saveResponse.failed_accounts?.length || 0,
        message: saveResponse.message,
        responseStructure: saveResponse,
      });

      // Store the result locally to show in this modal
      setLocalResult({
        ...saveResponse,
        success: true,
        message: saveResponse.message || "Bank account successfully linked",
      });

      // Pass the entire API response to onSuccess callback
      if (onSuccess) {
        console.log("🎯 Calling onSuccess callback with response");
        onSuccess(saveResponse);
      } else {
        console.warn("⚠️ onSuccess callback not provided!");
      }

      // Clear any previous API responses
      dispatch(clearApiResponse());
    } catch (err) {
      console.error("❌ storePlaidData failed:", err);

      // Show error in the modal
      const errorMessage = err.message || "Failed to link bank account";

      // Set error result locally
      setLocalResult({
        success: false,
        message: errorMessage,
        error: errorMessage,
      });
    } finally {
      dispatch(setPlaidLoading(false));
    }
  };

  const handlePlaidExit = (err) => {
    if (err) {
      console.log("🚪 Plaid exit with error:", err);
      showApiResponsePopup({
        status: 400,
        data: { error: err },
        isError: true,
      });
    } else {
      console.log("🚪 Plaid exit without error");
    }
    dispatch(setPlaidLoading(false));
  };

  const initializePlaid = async () => {
    setActionType("link");
    dispatch(clearPlaidResult());
    setLocalResult(null); // Clear any previous results

    try {
      const data = await dispatch(initializePlaidLink(customerId)).unwrap();

      console.log("🔑 Plaid link token received:", data.link_token);

      linkHandlerRef.current = window.Plaid.create({
        token: data.link_token,
        onSuccess: handlePlaidSuccess,
        onExit: handlePlaidExit,
      });

      linkHandlerRef.current.open();
    } catch (error) {
      console.error("❌ Failed to initialize Plaid:", error);
      showApiResponsePopup({
        status: 500,
        data: { error: error.message },
        isError: true,
      });
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
        }),
      ).unwrap();

      showApiResponsePopup({
        status: 200,
        data: resultData,
        isError: false,
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      showApiResponsePopup({
        status: 500,
        data: { error: err.message },
        isError: true,
      });
    }
  };

  const handleCloseResult = () => {
    dispatch(clearPlaidResult());
    dispatch(clearApiResponse());
    setLocalResult(null);

    // Also close the modal
    if (onClose) onClose();
  };

  const renderAccountResult = () => {
    const displayResult = localResult || result;

    if (!displayResult) return null;

    return (
      <div className="space-y-4 mt-4">
        {displayResult.message && (
          <div
            className={`${
              displayResult.success
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            } text-center font-semibold p-4 rounded-md`}
          >
            {displayResult.message}

            {!displayResult.success && displayResult.error && (
              <div className="mt-2 text-sm">
                {(() => {
                  try {
                    const errorMatch = displayResult.error.match(/\{.*\}/s);
                    if (errorMatch) {
                      const parsedError = JSON.parse(errorMatch[0]);
                      return (
                        <>
                          {parsedError.message && (
                            <p>
                              <strong>Details:</strong> {parsedError.message}
                            </p>
                          )}
                          {parsedError.reference && (
                            <p>
                              <strong>Reference ID:</strong>{" "}
                              {parsedError.reference}
                            </p>
                          )}
                        </>
                      );
                    } else {
                      const simpleMessageMatch =
                        displayResult.error.match(/"message":"([^"]+)"/);
                      return simpleMessageMatch
                        ? simpleMessageMatch[1]
                        : displayResult.error;
                    }
                  } catch (e) {
                    return displayResult.error;
                  }
                })()}
              </div>
            )}

            {displayResult.reference && (
              <div className="text-xs mt-2 opacity-75">
                Reference ID: {displayResult.reference}
              </div>
            )}
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
                  <li key={index} className="flex items-center text-red-700">
                    <span className="mr-2">
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
                        {parseErrorMessage(account.message)}
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
                <p className="text-gray-600 mb-4">
                  Securely connect your bank account using Plaid. Your
                  credentials are never stored and all connections are
                  encrypted.
                </p>
              </div>
              {showButton && (
                <button
                  onClick={initializePlaid}
                  disabled={isLoading}
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

      {/* API Response Modal */}
      {apiResponse?.showModal && (
        <Modal
          isOpen={true}
          onRequestClose={() => dispatch(clearApiResponse())}
          style={customStyles}
          contentLabel="API Response"
        >
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">
              {apiResponse.isError ? "Error Response" : "API Response"}
            </h2>
            <div
              className={`p-3 rounded ${
                apiResponse.isError
                  ? "bg-red-50 border border-red-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
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
};

export default ZapPlaidLink;
