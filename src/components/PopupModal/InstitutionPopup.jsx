import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

const InstitutionPopup = ({
  onClose,
  message,
  type = "error",
  title = null,
  showCloseButton = true,
}) => {
  const extractErrorMessages = () => {
    if (!message) return [];

    // If message is already an array of strings
    if (Array.isArray(message)) return message;

    // If message is a string
    if (typeof message === "string") return [message];

    // If message is an object with validation errors (from API)
    if (typeof message === "object") {
      const errorMessages = [];

      Object.values(message).forEach((fieldErrors) => {
        if (Array.isArray(fieldErrors)) {
          errorMessages.push(...fieldErrors);
        } else if (typeof fieldErrors === "string") {
          errorMessages.push(fieldErrors);
        } else if (typeof fieldErrors === "object") {
          // Handle nested objects if needed
          Object.values(fieldErrors).forEach((nestedError) => {
            if (Array.isArray(nestedError)) {
              errorMessages.push(...nestedError);
            } else if (typeof nestedError === "string") {
              errorMessages.push(nestedError);
            }
          });
        }
      });

      return errorMessages;
    }

    return ["An unknown error occurred"];
  };

  const errorMessages = extractErrorMessages();

  // Determine icon and colors based on popup type
  const getPopupConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: faCheckCircle,
          iconColor: "text-green-500",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-800",
        };
      case "warning":
        return {
          icon: faExclamationTriangle,
          iconColor: "text-yellow-500",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-800",
        };
      case "info":
        return {
          icon: faInfoCircle,
          iconColor: "text-blue-500",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-800",
        };
      case "error":
      default:
        return {
          icon: faTimesCircle,
          iconColor: "text-red-500",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
        };
    }
  };

  const { icon, iconColor, bgColor, borderColor, textColor } = getPopupConfig();

  // Default titles based on type
  const getDefaultTitle = () => {
    switch (type) {
      case "success":
        return "Success";
      case "warning":
        return "Warning";
      case "info":
        return "Information";
      case "error":
      default:
        return "Error";
    }
  };

  const popupTitle = title || getDefaultTitle();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`relative ${bgColor} ${borderColor} border rounded-lg shadow-lg max-w-md w-full mx-auto`}
      >
        {/* Close button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Popup content */}
        <div className="p-6">
          <div className="flex items-start">
            {/* Icon */}
            <div className={`flex-shrink-0 ${iconColor} text-2xl mr-4`}>
              <FontAwesomeIcon icon={icon} className="w-8 h-8" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${textColor} mb-2`}>
                {popupTitle}
              </h3>

              <div className={`text-sm ${textColor}`}>
                {errorMessages.length === 0 ? (
                  <p>An unknown error occurred.</p>
                ) : errorMessages.length === 1 ? (
                  <p>{errorMessages[0]}</p>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {errorMessages.map((msg, index) => (
                      <li key={index}>{msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            {type === "error" || type === "warning" ? (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Higher-order components for specific popup types
export const SuccessPopup = (props) => (
  <InstitutionPopup type="success" {...props} />
);
export const WarningPopup = (props) => (
  <InstitutionPopup type="warning" {...props} />
);
export const InfoPopup = (props) => <InstitutionPopup type="info" {...props} />;
export const ErrorPopup = (props) => (
  <InstitutionPopup type="error" {...props} />
);

export default InstitutionPopup;
