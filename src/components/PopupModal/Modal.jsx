import React, { useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { RingLoader } from "react-spinners";

const Modal = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  modalProps = {},
  disableBackdropClick = false,
  disableEscapeKey = false
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !disableEscapeKey && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disableEscapeKey, onClose, isOpen]);

  if (!isOpen) return null;

  const typeStyles = {
    success: {
      bg: "bg-green-50",
      text: "text-green-800",
      border: "border-green-400",
      button: "bg-green-600 hover:bg-green-700 text-white",
      icon: (
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    error: {
      bg: "bg-red-50",
      text: "text-red-800",
      border: "border-red-400",
      button: "bg-red-600 hover:bg-red-700 text-white",
      // icon: (
      //   <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      //     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      //   </svg>
      // )
    },
    info: {
      bg: "bg-blue-50",
      text: "text-blue-800",
      border: "border-blue-400",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      icon: (
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      bg: "bg-yellow-50",
      text: "text-yellow-800",
      border: "border-yellow-400",
      button: "bg-yellow-600 hover:bg-yellow-700 text-white",
      icon: (
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
  };

  const currentType = typeStyles[type] || typeStyles.info;

  const handleAction = (action) => {
    if (action.actionType === "NAVIGATE") {
      window.location.href = action.path;
    } else if (action.action) {
      action.action();
    }
    if (!action.preventClose) {
      onClose();
    }
  };

  const renderMessage = () => {
    if (modalProps.customComponent) {
      return modalProps.customComponent;
    }

    return (
      <div className="flex flex-col items-center">
        {modalProps.showSpinner && (
          <div className="mb-4">
            <RingLoader size={50} color={type === "error" ? "#ef4444" : type === "success" ? "#10b981" : type === "warning" ? "#f59e0b" : "#3b82f6"} />
          </div>
        )}
        <div className="flex items-start">
          {!modalProps.hideIcon && currentType.icon}
          <div>
            {title && (
              <h3 className={`${currentType.text} text-xl font-bold`}>
                {title}
              </h3>
            )}
            {message && (
              <div className={`${currentType.text} mt-2`}>
                {typeof message === "string" ? (
                  <p>{message}</p>
                ) : (
                  <div>{message}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={() => !disableBackdropClick && onClose()}
    >
      <div
        className={`${currentType.bg} ${currentType.border} border-l-4 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div className="w-full">
              {renderMessage()}
            </div>
            {!modalProps.hideCloseButton && (
              <button
                onClick={onClose}
                className={`ml-4 ${currentType.text} hover:opacity-70`}
                aria-label="Close modal"
                disabled={modalProps.disableClose}
              >
                <AiOutlineClose size={24} />
              </button>
            )}
          </div>

          {modalProps?.actions && (
            <div className={`flex ${modalProps.actionsCenter ? 'justify-center' : 'justify-end'} gap-3 mt-6`}>
              {modalProps.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleAction(action)}
                  disabled={action.disabled}
                  className={`px-4 py-2 rounded-md transition-colors min-w-[100px] ${
                    action.primary
                      ? currentType.button
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {action.loading ? (
                    <div className="flex items-center justify-center">
                      <RingLoader size={20} color="#ffffff" />
                      {action.loadingText && <span className="ml-2">{action.loadingText}</span>}
                    </div>
                  ) : (
                    action.label
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;