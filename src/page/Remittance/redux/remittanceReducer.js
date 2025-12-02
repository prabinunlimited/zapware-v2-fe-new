// src/features/Remittance/redux/remittanceReducer.js
import { combineReducers } from '@reduxjs/toolkit';
import remittanceFormSlice from '../slices/remittanceFormSlice';
import remittanceCurrenciesSlice from '../slices/remittanceCurrenciesSlice';
import remittancePaymentSlice from '../slices/remittancePaymentSlice';
import remittanceTransactionsSlice from '../slices/remittanceTransactionsSlice';
import remittancePartnerSlice from '../slices/remittancePartnersSlice'; // Note: singular

const remittanceReducer = combineReducers({
  form: remittanceFormSlice,
  currencies: remittanceCurrenciesSlice,
  payment: remittancePaymentSlice,
  transactions: remittanceTransactionsSlice,
  partners: remittancePartnerSlice, // Note: singular
});

export default remittanceReducer;

// Export combined actions
export const remittanceActions = {
  form: remittanceFormSlice.actions,
  currencies: remittanceCurrenciesSlice.actions,
  payment: remittancePaymentSlice.actions,
  transactions: remittanceTransactionsSlice.actions,
  partners: remittancePartnerSlice.actions, // Note: singular
};

// Re-export selectors
export * from '../selectors/remittanceSelectors';