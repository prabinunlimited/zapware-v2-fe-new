import React, { useEffect, useCallback } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { RingLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";

// Icon components for better maintainability
const SuccessIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

// Constants for better maintainability
const MODAL_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

const TYPE_STYLES = {
  [MODAL_TYPES.SUCCESS]: {
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-400",
    button: "bg-green-600 hover:bg-green-700 text-white",
    icon: <SuccessIcon />,
    iconBg: "bg-green-100 text-green-600"
  },
  [MODAL_TYPES.ERROR]: {
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-400",
    button: "bg-red-600 hover:bg-red-700 text-white",
    icon: <ErrorIcon />,
    iconBg: "bg-red-100 text-red-600"
  },
  [MODAL_TYPES.INFO]: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-400",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
    icon: <InfoIcon />,
    iconBg: "bg-blue-100 text-blue-600"
  },
  [MODAL_TYPES.WARNING]: {
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    border: "border-yellow-400",
    button: "bg-yellow-600 hover:bg-yellow-700 text-white",
    icon: <WarningIcon />,
    iconBg: "bg-yellow-100 text-yellow-600"
  }
};

const LOADER_COLORS = {
  [MODAL_TYPES.SUCCESS]: "#10b981",
  [MODAL_TYPES.ERROR]: "#ef4444",
  [MODAL_TYPES.WARNING]: "#f59e0b",
  [MODAL_TYPES.INFO]: "#3b82f6"
};

// Custom hook for keyboard events
const useEscapeKey = (isOpen, onClose, disableEscapeKey) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !disableEscapeKey && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disableEscapeKey, onClose, isOpen]);
};

// Utility functions
const extractMessage = (messageData) => {
  if (!messageData) return "";

  if (typeof messageData === "string") {
    return messageData;
  }

  if (typeof messageData === "object" && messageData !== null) {
    const messageFields = ['message', 'error', 'msg', 'detail', 'description'];
    
    for (const field of messageFields) {
      if (messageData[field]) {
        return messageData[field];
      }
    }

    try {
      return JSON.stringify(messageData);
    } catch {
      return "An error occurred";
    }
  }

  return String(messageData);
};

const extractTitle = (titleData, type) => {
  if (titleData) return titleData;

  const titleMap = {
    [MODAL_TYPES.SUCCESS]: "Success",
    [MODAL_TYPES.ERROR]: "Error",
    [MODAL_TYPES.WARNING]: "Warning",
    [MODAL_TYPES.INFO]: "Information"
  };

  return titleMap[type] || "";
};

// Sub-components for better organization
const ModalHeader = ({ title, message, type, modalProps, onClose, currentType }) => (
  <div className="flex items-start gap-4">
    {!modalProps.hideIcon && (
      <div className={`flex-shrink-0 w-12 h-12 rounded-full ${currentType.iconBg} flex items-center justify-center`}>
        {currentType.icon}
      </div>
    )}
    <div className="flex-1 min-w-0">
      {title && (
        <h3 className={`${currentType.text} text-xl font-bold mb-2`}>
          {title}
        </h3>
      )}
      {message && (
        <div className={`${currentType.text}`}>
          {typeof message === "string" ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message}</p>
          ) : (
            <div>{message}</div>
          )}
        </div>
      )}
    </div>
    {!modalProps.hideCloseButton && (
      <button
        onClick={onClose}
        className={`flex-shrink-0 ${currentType.text} hover:opacity-70 transition-opacity p-1 rounded`}
        aria-label="Close modal"
        disabled={modalProps.disableClose}
      >
        <AiOutlineClose size={20} />
      </button>
    )}
  </div>
);

const ModalSpinner = ({ type }) => (
  <div className="mb-4 flex justify-center">
    <RingLoader size={50} color={LOADER_COLORS[type]} />
  </div>
);

const ModalActions = ({ actions, currentType, onClose }) => {
  const handleAction = useCallback((action) => {
    if (action.actionType === "NAVIGATE") {
      window.location.href = action.path;
    } else if (action.action) {
      action.action();
    }
    
    if (!action.preventClose) {
      onClose();
    }
  }, [onClose]);

  if (!actions?.length) return null;

  return (
    <div className={`flex ${actions.center ? 'justify-center' : 'justify-end'} gap-3 mt-6`}>
      {actions.map((action, index) => (
        <motion.button
          key={index}
          onClick={() => handleAction(action)}
          disabled={action.disabled}
          whileHover={{ scale: action.disabled ? 1 : 1.02 }}
          whileTap={{ scale: action.disabled ? 1 : 0.98 }}
          className={`px-4 py-2 rounded-lg transition-all min-w-[100px] font-medium ${
            action.primary
              ? `${currentType.button} shadow-sm`
              : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
          } ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {action.loading ? (
            <div className="flex items-center justify-center gap-2">
              <RingLoader size={16} color="#ffffff" />
              {action.loadingText && <span>{action.loadingText}</span>}
            </div>
          ) : (
            action.label
          )}
        </motion.button>
      ))}
    </div>
  );
};

const ModalContent = ({ 
  title, 
  message, 
  type, 
  modalProps, 
  onClose, 
  currentType 
}) => {
  const displayTitle = extractTitle(title, type);
  const displayMessage = extractMessage(message);

  if (modalProps.customComponent) {
    return modalProps.customComponent;
  }

  return (
    <div className="flex flex-col">
      {modalProps.showSpinner && <ModalSpinner type={type} />}
      <ModalHeader
        title={displayTitle}
        message={displayMessage}
        type={type}
        modalProps={modalProps}
        onClose={onClose}
        currentType={currentType}
      />
    </div>
  );
};

// Main Modal Component
const Modal = ({
  isOpen,
  onClose,
  title,
  message,
  type = MODAL_TYPES.INFO,
  modalProps = {},
  disableBackdropClick = false,
  disableEscapeKey = false
}) => {
  useEscapeKey(isOpen, onClose, disableEscapeKey);

  const currentType = TYPE_STYLES[type] || TYPE_STYLES.info;

  const handleBackdropClick = useCallback((e) => {
    if (!disableBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  }, [disableBackdropClick, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`${currentType.bg} ${currentType.border} border-l-4 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto backdrop-blur-sm`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <ModalContent
                title={title}
                message={message}
                type={type}
                modalProps={modalProps}
                onClose={onClose}
                currentType={currentType}
              />
              
              <ModalActions 
                actions={modalProps.actions} 
                currentType={currentType}
                onClose={onClose}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;