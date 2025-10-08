// src/hooks/useInstitutionPopup.js
import { useState, useCallback } from "react";

export const useInstitutionPopup = () => {
  const [popupState, setPopupState] = useState({
    isOpen: false,
    message: "",
    type: "error",
    title: null,
    showCloseButton: true,
  });

  const showPopup = useCallback(
    ({ message, type = "error", title = null, showCloseButton = true }) => {
      setPopupState({
        isOpen: true,
        message,
        type,
        title,
        showCloseButton,
      });
    },
    []
  );

  const hidePopup = useCallback(() => {
    setPopupState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showSuccess = useCallback(
    (message, title = "Success") => {
      showPopup({ message, type: "success", title });
    },
    [showPopup]
  );

  const showError = useCallback(
    (message, title = "Error") => {
      showPopup({ message, type: "error", title });
    },
    [showPopup]
  );

  const showWarning = useCallback(
    (message, title = "Warning") => {
      showPopup({ message, type: "warning", title });
    },
    [showPopup]
  );

  const showInfo = useCallback(
    (message, title = "Information") => {
      showPopup({ message, type: "info", title });
    },
    [showPopup]
  );

  return {
    ...popupState,
    showPopup,
    hidePopup,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
