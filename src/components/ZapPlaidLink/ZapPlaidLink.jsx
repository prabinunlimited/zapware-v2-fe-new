import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Modal from "react-modal";

// Redux actions
import {
  initializePlaidLink,
  deleteLinkedBankAccount,
  clearPlaidResult,
  setApiResponse,
  clearApiResponse,
  setPlaidLoading
} from "./plaidSlice";

const customStyles = {
  overlay: {
    zIndex: 9999,
    background: "rgba(0,0,0,0.3)",
  },
  content: {
    top: "0",
    right: "0",
    bottom: "0",
    width: "380px",
    left: "auto",
    borderRadius: "0",
    padding: "0",
    overflow: "hidden",
  },
};

const ZapPlaidLink = ({ onSuccess, onClose }) => {
  const dispatch = useDispatch();
  const { customerId } = useParams();
  const linkHandlerRef = useRef(null);

  // Redux state
  const {
    isLoading,
    error,
    result,
    apiResponse,
    showResponseModal
  } = useSelector((state) => state.plaid || {});

  const [actionType, setActionType] = useState("link"); // 'link' or 'delete'

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
    dispatch(setApiResponse({
      status: response.status,
      data: response.data,
      isError: response.isError || false,
      showModal: true
    }));
  };

  const handlePlaidSuccess = async (public_token, metadata) => {
    try {
      const saveResponse = await dispatch(storePlaidData({
        public_token,
        accounts: metadata.accounts,
        customerId
      })).unwrap();

      showApiResponsePopup({
        status: 200,
        data: saveResponse,
        isError: false
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      
      showApiResponsePopup({
        status: 500,
        data: { error: err.message },
        isError: true
      });
    }
  };

  const handlePlaidExit = (err) => {
    if (err) {
      
      showApiResponsePopup({
        status: 400,
        data: { error: err },
        isError: true
      });
    }
    dispatch(setPlaidLoading(false));
  };

  const initializePlaid = async () => {
    setActionType("link");
    dispatch(clearPlaidResult());

    try {
      const data = await dispatch(initializePlaidLink(customerId)).unwrap();

      linkHandlerRef.current = window.Plaid.create({
        token: data.link_token,
        onSuccess: handlePlaidSuccess,
        onExit: handlePlaidExit,
      });

      linkHandlerRef.current.open();
    } catch (error) {
      
      showApiResponsePopup({
        status: 500,
        data: { error: error.message },
        isError: true
      });
    }
  };

  const handleDeleteAccount = async (accountId) => {
    setActionType("delete");
    dispatch(clearPlaidResult());

    try {
      const resultData = await dispatch(deleteLinkedBankAccount({
        account_id: accountId,
        user_handle: customerId
      })).unwrap();

      showApiResponsePopup({
        status: 200,
        data: resultData,
        isError: false
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      
      showApiResponsePopup({
        status: 500,
        data: { error: err.message },
        isError: true
      });
    }
  };

  const handleCloseResult = () => {
    dispatch(clearPlaidResult());
    dispatch(clearApiResponse());
  };

  const renderAccountResult = () => {
    if (!result) return null;

    return (
      <div className="space-y-4 mt-4">
        {result.message && (
          <div
            className={`${
              result.success ? "text-black" : "text-black"
            } text-center font-semibold p-4`}
          >
            {result.message}

            {!result.success && result.error && (
              <div className="mt-2 text-sm">
                {(() => {
                  try {
                    const errorMatch = result.error.match(/\{.*\}/s);
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
                        result.error.match(/"message":"([^"]+)"/);
                      return simpleMessageMatch
                        ? simpleMessageMatch[1]
                        : result.error;
                    }
                  } catch (e) {
                    return result.error;
                  }
                })()}
              </div>
            )}

            {result.reference && (
              <div className="text-xs mt-2 opacity-75">
                Reference ID: {result.reference}
              </div>
            )}
          </div>
        )}

        {actionType === "link" &&
          result.success_accounts &&
          result.success_accounts.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-green-800 mb-2">
                Successfully Linked Accounts
              </h3>
              <ul className="space-y-2">
                {result.success_accounts.map((account, index) => (
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
                    {account.account_name} ({account.account_id.slice(0, 4)}...
                    {account.account_id.slice(-4)})
                  </li>
                ))}
              </ul>
            </div>
          )}

        {actionType === "link" &&
          result.failed_accounts &&
          result.failed_accounts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-red-800 mb-6">
                Failed to Link Accounts
              </h3>
              <ul className="space-y-10 py-2">
                {result.failed_accounts.map((account, index) => (
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
                        {account.account_name} ({account.account_id.slice(0, 4)}
                        ...{account.account_id.slice(-4)})
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
          className="w-full flex justify-center items-center px-4 py-2 bg-black text-white rounded-md transition duration-300"
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

      {!result ? (
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
              <button
                onClick={initializePlaid}
                disabled={isLoading}
                className="w-full flex justify-center items-center px-4 py-2 bg-black text-white rounded-md transition duration-300 disabled:opacity-50"
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
                    Connecting...
                  </>
                ) : (
                  "Continue to Plaid"
                )}
              </button>
            </>
          )}
        </>
      ) : (
        renderAccountResult()
      )}

      {/* API Response Modal */}
      {apiResponse?.showModal && (
          <Modal
            isOpen={Boolean(apiResponse?.showModal)}
            onRequestClose={() => dispatch(clearApiResponse())}
            style={customStyles}
            contentLabel="API Response"
          >
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">
              {apiResponse.isError ? "Error Response" : "API Response"}
            </h2>
            <div className={`p-3 rounded ${apiResponse.isError ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
            <button
              onClick={() => dispatch(clearApiResponse())}
              className="mt-4 w-full px-4 py-2 bg-gray-800 text-white rounded-md"
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
};

export default ZapPlaidLink;