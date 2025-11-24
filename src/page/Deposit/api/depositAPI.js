// src/api/depositAPI.js - FIXED FOR THE ACTUAL API RESPONSE
import { apiClient } from './apiClient';

export const depositAPI = {
  // ✅ ORIGINAL: Get all accounts (no changes needed)
  getManualDepositDetails: () => {
    const customerId = localStorage.getItem('authcustomer_id') || '10907';
    
    console.log("🔍 Manual details request:", {
      customerId,
      usingToken: localStorage.getItem('bearertoken') ? 'bearertoken' : 'authtoken'
    });
    
    return apiClient.get(`/active-account-details/${customerId}`);
  },

  // ✅ FIXED: Client-side filtering for the actual API response structure
  getManualDetailsByCurrency: async (currency) => {
    const customerId = localStorage.getItem('authcustomer_id') || '10907';
    console.log("🔍 Client-side filtering for currency:", { customerId, currency });
    
    try {
      // Get all accounts from the original endpoint
      const response = await apiClient.get(`/active-account-details/${customerId}`);
      
      console.log("📦 Raw API response structure:", {
        count: response.data.count_account_details,
        message: response.data.message,
        accounts: response.data.account_details?.length
      });
      
      // ✅ FIXED: Properly filter from account_details array
      if (response.data && response.data.account_details) {
        const filteredAccount = response.data.account_details.find(
          account => account.currency === currency
        );
        
        if (filteredAccount) {
          console.log("✅ Found matching account:", {
            currency: filteredAccount.currency,
            accountId: filteredAccount.account_id,
            bankName: filteredAccount.bank_name,
            accountNumber: filteredAccount.account_number,
            iban: filteredAccount.iban
          });
          
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
          console.warn("❌ No account found for currency:", currency);
          console.log("📊 Available currencies:", 
            response.data.account_details.map(acc => acc.currency)
          );
          throw new Error(`No account details available for ${currency}`);
        }
      } else {
        console.warn("❌ No account_details in response");
        throw new Error('No account details available');
      }
    } catch (error) {
      console.error("❌ Error in client-side filtering:", error);
      throw error;
    }
  },

  // ✅ NEW: Get all accounts with currency info for debugging
  getAllManualAccounts: () => {
    const customerId = localStorage.getItem('authcustomer_id') || '10907';
    return apiClient.get(`/active-account-details/${customerId}`);
  },

  // ✅ NEW: Get available currencies
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
      console.error("Error fetching available currencies:", error);
      return { data: [] };
    }
  },

  getUSDAccounts: () => {
    const customerId = localStorage.getItem('authcustomer_id');
    console.log("🔍 USD accounts request for customer:", customerId);
    return apiClient.post('/sila/manual-sila-bankdetails', {
      customerId: customerId
    });
  },

  getAEDDetails: () => {
    return apiClient.get('/manualaccount-detail/AED');
  },

  getDepositTypesByCurrency: (currencyId) => {
    console.log("🔍 Payment methods for currency ID:", currencyId);
    return apiClient.get(`/deposit-types-by-currency/${currencyId}`);
  },

  submitDeposit: (depositData) => {
    const customerId = localStorage.getItem('authcustomer_id');
    return apiClient.post('/transactions/deposit', {
      ...depositData,
      customerId: customerId
    });
  }
};

export default depositAPI;