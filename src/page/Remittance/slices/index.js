// src/features/Remittance/slices/index.js
export { default as remittanceFormSlice } from "./remittanceFormSlice";
export { default as remittanceCurrenciesSlice } from "./remittanceCurrenciesSlice";
export { default as remittancePaymentSlice } from "./remittancePaymentSlice";
export { default as remittanceTransactionsSlice } from "./remittanceTransactionsSlice";
export { default as remittancePartnerSlice } from "./remittancePartnerSlice"; // Singular

// Export actions
export * from "./remittanceFormSlice";
export * from "./remittanceCurrenciesSlice";
export * from "./remittancePaymentSlice";
export * from "./remittanceTransactionsSlice";
export * from "./remittancePartnerSlice"; // Singular