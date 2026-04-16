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
} from "./plaidSliceIframe";

const ZapPlaidLink = ({ onSuccess, onClose, autoInitialize = true }) => {
  const dispatch = useDispatch();
  const { customerId } = useParams();
  const linkHandlerRef = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Redux state
  const {
    isLoading,
    error,
    result,
    apiResponse,
    showResponseModal
  } = useSelector((state) => state.plaid || {});

  const [actionType, setActionType] = useState("link");

  // Load Plaid script
  useEffect(() => {
    if (window.Plaid) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
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
    
    // Close the modal on exit
    if (onClose) onClose();
  };

  const initializePlaid = async () => {
    setActionType("link");
    dispatch(clearPlaidResult());

    try {
      const data = await dispatch(initializePlaidLink(customerId)).unwrap();

      // Wait for Plaid script to load
      if (!window.Plaid) {
        throw new Error("Plaid SDK not loaded");
      }

      linkHandlerRef.current = window.Plaid.create({
        token: data.link_token,
        onSuccess: handlePlaidSuccess,
        onExit: handlePlaidExit,
      });

      linkHandlerRef.current.open();
    } catch (error) {
      console.error("Failed to initialize Plaid:", error);
      // Close on error
      if (onClose) onClose();
    }
  };

  // Auto-initialize Plaid when script is loaded
  useEffect(() => {
    if (autoInitialize && scriptLoaded && !initialized) {
      setInitialized(true);
      setTimeout(() => {
        initializePlaid();
      }, 100); // Small delay to ensure everything is ready
    }
  }, [autoInitialize, scriptLoaded, initialized]);

  // If auto-initializing, return nothing - completely invisible
  if (autoInitialize) {
    return null; // No UI at all
  }

  // Rest of the component for manual initialization (if needed elsewhere)
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
    if (onClose) onClose();
  };

  const renderAccountResult = () => {
    if (!result) return null;

    return (
      <div className="space-y-4 mt-4">
        {/* ... existing result rendering code ... */}
      </div>
    );
  };

  return (
    <div className="p-4">
      {/* This UI only shows if autoInitialize is false */}
      {!result ? (
        <>
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
              {/* Close icon */}
            </button>
          </div>

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
                {isLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          ) : (
            <button
              onClick={initializePlaid}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-2 bg-black text-white rounded-md transition duration-300 disabled:opacity-50"
            >
              {isLoading ? "Connecting..." : "Continue to Plaid"}
            </button>
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
  autoInitialize: PropTypes.bool,
};

ZapPlaidLink.defaultProps = {
  autoInitialize: false,
};

export default ZapPlaidLink;