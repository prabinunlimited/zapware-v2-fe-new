// features/UI/slices/modalSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  deleteModal: {
    show: false,
    beneficiaryToDelete: null,
    message: "",
    isLoading: false,
  },
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    showDeleteModal: (state, action) => {
      state.deleteModal.show = true;
      state.deleteModal.beneficiaryToDelete = action.payload;
      state.deleteModal.message = "";
      state.deleteModal.isLoading = false;
    },
    hideDeleteModal: (state) => {
      state.deleteModal.show = false;
      state.deleteModal.beneficiaryToDelete = null;
      state.deleteModal.message = "";
      state.deleteModal.isLoading = false;
    },
    setDeleteModalMessage: (state, action) => {
      state.deleteModal.message = action.payload;
    },
    setDeleteModalLoading: (state, action) => {
      state.deleteModal.isLoading = action.payload;
    },
  },
});

export const {
  showDeleteModal,
  hideDeleteModal,
  setDeleteModalMessage,
  setDeleteModalLoading,
} = modalSlice.actions;

export const selectDeleteModal = (state) => state.modal.deleteModal;

export default modalSlice.reducer;