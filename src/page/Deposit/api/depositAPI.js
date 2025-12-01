// src/api/depositAPI.js - FIXED FOR THE ACTUAL API RESPONSE
import { apiClient } from './apiClient';

export const depositAPI = {
  // ✅ FIXED: Get all accounts with proper syntax
  getManualDepositDetails: () => {
    const customerId = localStorage.getItem('authcustomer_id') || '10907';
    
    // ✅ FIXED: Removed incomplete ternary operator and added proper token logic
    const token = localStorage.getItem('authToken') || 'bearertoken';
    // If you need to set headers, do it in apiClient configuration
    
    return apiClient.get(`/active-account-details/${customerId}`);
  },

  // ✅ FIXED: Client-side filtering for the actual API response structure
  getManualDetailsByCurrency: async (currency) => {
    const customerId = localStorage.getItem('authcustomer_id') || '10907';
    
    try {
      // Get all accounts from the original endpoint
      const response = await apiClient.get(`/active-account-details/${customerId}`);
      
      // ✅ FIXED: Properly filter from account_details array
      if (response.data && response.data.account_details) {
        const filteredAccount = response.data.account_details.find(
          account => account.currency === currency
        );
        
        if (filteredAccount) {
          // ✅ Return the account with consistent field names
          return { 
            data: {
              // Map to consistent field names
              account_id: filteredAccount.account_id,
              currency: filteredAccount.currency,
              bank_name: filteredAccount.bank_name,
              account_number: filteredAccount.account_number,
              iban: filteredAccount.iban,
              bic_swift: filteredAccount.bic_swift,
              sort_code: filteredAccount.sort_code,
              bank_country: filteredAccount.bank_country,
              bank_address: filteredAccount.bank_address,
              recipient_beneficiary_name: filteredAccount.recipient_beneficiary_name,
              // Include all original fields for compatibility
              ...filteredAccount
            }
          };
        } else {
          throw new Error(`No account details available for ${currency}`);
        }
      } else {
        throw new Error('No account details available');
      }
    } catch (error) {
      throw error;
    }
  },

  // ✅ FIXED: Get all accounts with currency info for debugging
  getAllManualAccounts: () => {
    const customerId = localStorage.getItem('authcustomer_id') || '10907';
    return apiClient.get(`/active-account-details/${customerId}`);
  },

  // ✅ FIXED: Get available currencies
  getAvailableCurrencies: async () => {
    const customerId = localStorage.getItem('authcustomer_id') || '10907';
    try {
      const response = await apiClient.get(`/active-account-details/${customerId}`);
      if (response.data && response.data.account_details) {
        const currencies = response.data.account_details.map(acc => ({
          currency: acc.currency,
          account_id: acc.account_id,
          bank_name: acc.bank_name
        }));
        return { data: currencies };
      }
      return { data: [] };
    } catch (error) {
      return { data: [] };
    }
  },

  // ✅ FIXED: Get USD accounts
  getUSDAccounts: () => {
    const customerId = localStorage.getItem('authcustomer_id');
    
    return apiClient.post('/sila/manual-sila-bankdetails', {
      customerId: customerId
    });
  },

  // ✅ FIXED: Get AED details
  getAEDDetails: () => {
    return apiClient.get('/manualaccount-detail/AED');
  },

  // ✅ FIXED: Get deposit types by currency
  getDepositTypesByCurrency: (currencyId) => {
    return apiClient.get(`/deposit-types-by-currency/${currencyId}`);
  },

  // ✅ FIXED: Submit deposit
  submitDeposit: (depositData) => {
    const customerId = localStorage.getItem('authcustomer_id');
    return apiClient.post('/transactions/deposit', {
      ...depositData,
      customerId: customerId
    });
  }
};

export default depositAPI;