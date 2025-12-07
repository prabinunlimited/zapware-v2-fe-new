// features/UI/slices/modalSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  deleteModal: {
    show: false,
    beneficiaryToDelete: null,
    beneficiaryName: "", // Add name for display
    message: "",
    isLoading: false,
    type: "single", // 'single' or 'bulk'
    bulkIds: [], // For bulk deletions
    bulkCount: 0, // Number of beneficiaries to delete
    successMessage: "", // For success state
    errorMessage: "", // For error state
    showSuccess: false, // Show success message
  },
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    // Show single deletion modal
    showDeleteModal: (state, action) => {
      const { id, name } = action.payload;
      state.deleteModal.show = true;
      state.deleteModal.beneficiaryToDelete = id;
      state.deleteModal.beneficiaryName = name || "";
      state.deleteModal.message = "";
      state.deleteModal.isLoading = false;
      state.deleteModal.type = "single";
      state.deleteModal.bulkIds = [];
      state.deleteModal.bulkCount = 0;
      state.deleteModal.successMessage = "";
      state.deleteModal.errorMessage = "";
      state.deleteModal.showSuccess = false;
    },
    
    // Show bulk deletion modal
    showBulkDeleteModal: (state, action) => {
      const { ids, count } = action.payload;
      state.deleteModal.show = true;
      state.deleteModal.beneficiaryToDelete = null;
      state.deleteModal.beneficiaryName = "";
      state.deleteModal.message = "";
      state.deleteModal.isLoading = false;
      state.deleteModal.type = "bulk";
      state.deleteModal.bulkIds = ids || [];
      state.deleteModal.bulkCount = count || 0;
      state.deleteModal.successMessage = "";
      state.deleteModal.errorMessage = "";
      state.deleteModal.showSuccess = false;
    },
    
    hideDeleteModal: (state) => {
      state.deleteModal.show = false;
      state.deleteModal.beneficiaryToDelete = null;
      state.deleteModal.beneficiaryName = "";
      state.deleteModal.message = "";
      state.deleteModal.isLoading = false;
      state.deleteModal.type = "single";
      state.deleteModal.bulkIds = [];
      state.deleteModal.bulkCount = 0;
      state.deleteModal.successMessage = "";
      state.deleteModal.errorMessage = "";
      state.deleteModal.showSuccess = false;
    },
    
    setDeleteModalMessage: (state, action) => {
      state.deleteModal.message = action.payload;
    },
    
    setDeleteModalLoading: (state, action) => {
      state.deleteModal.isLoading = action.payload;
    },
    
    setDeleteModalSuccess: (state, action) => {
      const { message, show } = action.payload;
      state.deleteModal.successMessage = message;
      state.deleteModal.showSuccess = show !== undefined ? show : true;
      state.deleteModal.isLoading = false;
    },
    
    setDeleteModalError: (state, action) => {
      state.deleteModal.errorMessage = action.payload;
      state.deleteModal.isLoading = false;
    },
    
    // Reset just the success/error states
    resetDeleteModalMessages: (state) => {
      state.deleteModal.successMessage = "";
      state.deleteModal.errorMessage = "";
      state.deleteModal.showSuccess = false;
    },
  },
});

export const {
  showDeleteModal,
  showBulkDeleteModal,
  hideDeleteModal,
  setDeleteModalMessage,
  setDeleteModalLoading,
  setDeleteModalSuccess,
  setDeleteModalError,
  resetDeleteModalMessages,
} = modalSlice.actions;

export const selectDeleteModal = (state) => state.modal.deleteModal;

export default modalSlice.reducer;