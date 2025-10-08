import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  modal: {
    isOpen: false,
    title: "",
    message: "",
    type: "success", // can be 'success', 'error', 'warning', 'info'
    errors: null,
    modalProps: {
      actions: [], // array of action buttons
      disableBackdropClick: false, // prevent closing by clicking backdrop
      disableEscapeKey: false, // prevent closing by pressing escape
      showSpinner: false, // show loading spinner
      customComponent: null, // custom React component to render
    }
  },
  passwordVisible: false,
  showCustomerType: "N",
  inputType: "email",
  isLoading: false,
  isCountriesLoading: "N",
  gifImages: [],

  // 🔹 New additions
  accountDropdown: {
    isOpen: false,
  },
  modals: {
    accountDetails: {
      isOpen: false,
      data: null,
    },
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Existing reducers
    openModal: (state, action) => {
      state.modal = {
        isOpen: true,
        title: action.payload.title || "",
        message: action.payload.message || "",
        type: action.payload.type || "success",
        errors: action.payload.errors || null,
        modalProps: {
          ...initialState.modal.modalProps,
          ...(action.payload.modalProps || {}),
        }
      };
    },
    closeModal: (state) => {
      state.modal = initialState.modal;
    },
    updateModal: (state, action) => {
      // For partial updates to the modal state
      state.modal = {
        ...state.modal,
        ...action.payload,
        modalProps: {
          ...state.modal.modalProps,
          ...(action.payload.modalProps || {}),
        }
      };
    },
    togglePasswordVisibility: (state) => {
      state.passwordVisible = !state.passwordVisible;
    },
    setShowCustomerType: (state, action) => {
      state.showCustomerType = action.payload;
    },
    setInputType: (state, action) => {
      state.inputType = action.payload;
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setIsCountriesLoading: (state, action) => {
      state.isCountriesLoading = action.payload;
    },
    setGifImages: (state, action) => {
      state.gifImages = action.payload;
    },

    // 🔹 New reducers
    // Account dropdown
    setAccountDropdownOpen: (state, action) => {
      state.accountDropdown.isOpen = action.payload;
    },

    // Account Details Modal
    openAccountDetailsModal: (state, action) => {
      state.modals.accountDetails.isOpen = true;
      state.modals.accountDetails.data = action.payload;
    },
    closeAccountDetailsModal: (state) => {
      state.modals.accountDetails.isOpen = false;
      state.modals.accountDetails.data = null;
    },
  },
});

export const {
  openModal,
  closeModal,
  updateModal,
  togglePasswordVisibility,
  setShowCustomerType,
  setInputType,
  setIsLoading,
  setIsCountriesLoading,
  setGifImages,
  // 🔹 New exports
  setAccountDropdownOpen,
  openAccountDetailsModal,
  closeAccountDetailsModal,
} = uiSlice.actions;

// Selectors
export const selectUI = (state) => state.ui;
export const selectModal = (state) => state.ui.modal;
export const selectModalProps = (state) => state.ui.modal.modalProps;
export const selectPasswordVisible = (state) => state.ui.passwordVisible;
export const selectShowCustomerType = (state) => state.ui.showCustomerType;
export const selectInputType = (state) => state.ui.inputType;
export const selectIsLoading = (state) => state.ui.isLoading;
export const selectIsCountriesLoading = (state) => state.ui.isCountriesLoading;
export const selectGifImages = (state) => state.ui.gifImages;

// 🔹 New selectors
export const selectAccountDropdown = (state) => state.ui.accountDropdown;
export const selectAccountDetailsModal = (state) => state.ui.modals.accountDetails;

export default uiSlice.reducer;
