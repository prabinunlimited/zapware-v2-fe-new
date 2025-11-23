// src/page/Deposit/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'uiDeposit',
  initialState: {
    isAmountFocused: false,
    copiedField: null,
    helpTooltips: {},
    showCancelModal: false,
  },
  reducers: {
    setIsAmountFocused: (state, action) => {
      state.isAmountFocused = action.payload;
    },
    setCopiedField: (state, action) => {
      state.copiedField = action.payload;
    },
    clearCopiedField: (state) => {
      state.copiedField = null;
    },
    setHelpTooltip: (state, action) => {
      const { field, visible } = action.payload;
      state.helpTooltips[field] = visible;
    },
    setShowCancelModal: (state, action) => {
      state.showCancelModal = action.payload;
    },
  },
});

export const {
  setIsAmountFocused,
  setCopiedField,
  clearCopiedField,
  setHelpTooltip,
  setShowCancelModal,
} = uiSlice.actions;

export default uiSlice.reducer;