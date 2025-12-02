// src/features/Remittance/thunks/remittanceThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/api';
import { getBearerToken } from '../../../services/authService';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const token = await getBearerToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

// Helper function to get form data headers
const getFormDataHeaders = async () => {
  const token = await getBearerToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  };
};

// Helper function for exchange rate cache key
const getExchangeRateCacheKey = (sendCurrency, receiveCurrency, bankId) => {
  return `${sendCurrency}-${receiveCurrency}-${bankId}`;
};

// ===================== INITIAL DATA FETCHING =====================

/**
 * Fetch initial data for remittance form
 */
export const fetchInitialRemittanceData = createAsyncThunk(
  'remittance/fetchInitialData',
  async (customerId, { rejectWithValue, dispatch }) => {
    try {
      // Fetch all initial data in parallel
      const [payoutCurrencies, bankAccounts] = await Promise.all([
        dispatch(fetchPayoutCurrencies()).unwrap(),
        dispatch(fetchBankAccountDetails(customerId)).unwrap(),
      ]);

      // Fetch originating partner
      await dispatch(fetchOriginatingPartner()).unwrap();

      return {
        payoutCurrencies,
        bankAccounts,
        success: true,
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch initial data');
    }
  }
);

/**
 * Fetch payout currencies
 */
export const fetchPayoutCurrencies = createAsyncThunk(
  'remittance/fetchPayoutCurrencies',
  async (_, { rejectWithValue }) => {
    try {
      const headers = await getAuthHeaders();
      const response = await api.get('/payout-currencies', headers);
      
      return response?.data?.data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load currency options'
      );
    }
  }
);

/**
 * Fetch bank account details for a customer
 */
export const fetchBankAccountDetails = createAsyncThunk(
  'remittance/fetchBankAccountDetails',
  async (customerId, { rejectWithValue, getState }) => {
    try {
      const headers = await getAuthHeaders();
      const response = await api.get(`/bank-account-details/${customerId}`, headers);
      const data = response?.data?.account_details || [];
      
      // Return simpler structure
      const result = {
        accounts: data,
      };
      
      // If we have data and no send currency is selected yet, set default
      if (data.length > 0) {
        const state = getState();
        // Safe check for state existence
        const currentSendCurrency = state.remittance?.currencies?.sendCurrency;
        
        if (!currentSendCurrency) {
          const defaultCurrency = 
            data.find(account => account.currency_code === 'USD') || data[0];
          
          // Return as separate properties, not nested object
          result.defaultCurrencyCode = defaultCurrency.currency_code;
          result.defaultCurrencySymbol = defaultCurrency.icon;
          result.defaultBankId = defaultCurrency.id;
        }
      }
      
      return result;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load bank account details'
      );
    }
  }
);

/**
 * Fetch originating partner data
 */
export const fetchOriginatingPartner = createAsyncThunk(
  'remittance/fetchOriginatingPartner',
  async (_, { rejectWithValue, getState }) => {
    try {
      const isWhiteLabelledPartner = localStorage.getItem('iswhitelabelledpartner');
      const whiteLabelledPartnerId = localStorage.getItem('whitelabelledpartnerid');
      
      let partnerId = '9'; // Default
      
      if (isWhiteLabelledPartner === '1' && whiteLabelledPartnerId) {
        partnerId = whiteLabelledPartnerId;
      }
      
      const headers = await getAuthHeaders();
      const response = await api.get(`/originating-partners/${partnerId}`, headers);
      
      return {
        data: response.data.data,
        logo: response.data.data?.logo,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load partner data'
      );
    }
  }
);

/**
 * Fetch payout partner by currency
 */
export const fetchPayoutPartnerByCurrency = createAsyncThunk(
  'remittance/fetchPayoutPartnerByCurrency',
  async (currencyCode, { rejectWithValue }) => {
    try {
      const headers = await getAuthHeaders();
      const response = await api.get(`/payout-partners-currency/${currencyCode}`, headers);
      
      return {
        currencyCode,
        data: response.data.data,
        logo: response.data.data?.logo,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load payout partner'
      );
    }
  }
);

// ===================== EXCHANGE RATE OPERATIONS =====================

/**
 * Fetch exchange rate with caching
 */
export const fetchExchangeRate = createAsyncThunk(
  'remittance/fetchExchangeRate',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const { sendCurrency, receiveCurrency } = state.remittance?.currencies || {};
      const { exchangeRateCache } = state.remittance?.form || {};
      const customerId = state.auth?.customerId;
      
      // Validation
      if (!sendCurrency?.bank_id || !sendCurrency?.value || !receiveCurrency?.value || !customerId) {
        return rejectWithValue(
          customerId ? 'Select currencies to see rate' : 'Select a customer first'
        );
      }
      
      // Check cache
      const cacheKey = getExchangeRateCacheKey(
        sendCurrency.value,
        receiveCurrency.value,
        sendCurrency.bank_id
      );
      
      const cachedRate = exchangeRateCache?.[cacheKey];
      if (cachedRate && new Date(cachedRate.expiresAt) > new Date()) {
        return {
          ...cachedRate,
          fromCache: true,
          cacheKey,
        };
      }
      
      // Fetch new rate
      const headers = await getAuthHeaders();
      const response = await api.post(
        '/exchange-rates',
        {
          bank_id: sendCurrency.bank_id,
          customer_id: parseInt(customerId),
          value: 1,
          from: sendCurrency.value,
          to: receiveCurrency.value,
          is_remit: 'Y',
        },
        headers
      );
      
      const rate = parseFloat(response.data.fxRate);
      if (isNaN(rate) || rate <= 0) {
        throw new Error(`Invalid exchange rate received: ${response.data.fxRate}`);
      }
      
      const rateData = {
        rate,
        fee: parseFloat(response.data.fee) || 0,
        expiresAt: response.data.expires_at || new Date(Date.now() + 5 * 60 * 1000),
        conversionId: response.data.conversion_id,
        cacheKey,
      };
      
      return rateData;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch exchange rate'
      );
    }
  }
);

// ===================== MANUAL ACCOUNT DETAILS =====================

/**
 * Fetch manual account details
 */
export const fetchManualAccountDetails = createAsyncThunk(
  'remittance/fetchManualAccountDetails',
  async ({ bankId, currencyCode, sendAmount, customerId }, { rejectWithValue }) => {
    try {
      // For USD currency, use the manual-sila-bankdetails endpoint
      if (currencyCode === 'USD') {
        const payload = {
          currency: 'USD',
          amount: sendAmount || '0',
          customerId: parseInt(customerId),
        };

        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, value);
          }
        });

        const headers = await getFormDataHeaders();
        const response = await api.post(
          '/sila/manual-sila-bankdetails',
          formData,
          headers
        );

        if (response.data && response.data.status === 200) {
          return {
            account_name: response.data.account_name,
            account_number: response.data.account_number,
            bank_name: response.data.bank_name,
            bank_address: response.data.bank_address,
            routing_number: response.data.routing_number,
            swift_code: response.data.swift_code,
            account_type: response.data.account_type,
            iban: response.data.account_number,
            currency: 'USD',
          };
        }
        
        throw new Error('Invalid response structure for USD manual details');
      } else {
        // For other currencies, use the original endpoint
        const headers = await getAuthHeaders();
        const response = await api.get(
          `/manualaccount-detail/${bankId}`,
          headers
        );

        const data = response.data;
        const requiredFields = ['account_name', 'iban'];
        const missingFields = requiredFields.filter(field => !data[field]);

        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        return {
          ...data,
          currency: currencyCode,
        };
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch manual account details'
      );
    }
  }
);

// ===================== BENEFICIARY OPERATIONS =====================

/**
 * Fetch beneficiaries for a customer
 */
export const fetchBeneficiaries = createAsyncThunk(
  'remittance/fetchBeneficiaries',
  async (customerId, { rejectWithValue }) => {
    try {
      const headers = await getAuthHeaders();
      const response = await api.get(`/beneficiaries/customer-view/${customerId}`, headers);
      
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load beneficiaries'
      );
    }
  }
);

/**
 * Fetch beneficiary by code
 */
export const fetchBeneficiaryByCode = createAsyncThunk(
  'remittance/fetchBeneficiaryByCode',
  async (benefCode, { rejectWithValue }) => {
    try {
      if (!benefCode.trim()) {
        throw new Error('Please enter a beneficiary code');
      }
      
      const headers = await getAuthHeaders();
      const response = await api.get(`/beneficiaries/fetch-benef/${benefCode}`, headers);
      
      if (!response.data || !response.data.data) {
        throw new Error('No beneficiary found with this code');
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch beneficiary by code'
      );
    }
  }
);

/**
 * Fetch beneficiary banks
 */
export const fetchBeneficiaryBanks = createAsyncThunk(
  'remittance/fetchBeneficiaryBanks',
  async (beneficiaryId, { rejectWithValue }) => {
    try {
      const headers = await getAuthHeaders();
      const response = await api.get(`/beneficiaries/benef-all-bank/${beneficiaryId}`, headers);
      
      return response.data.bank_accounts || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load beneficiary banks'
      );
    }
  }
);

// ===================== STATIC DATA FETCHING =====================

/**
 * Fetch income sources
 */
export const fetchIncomeSources = createAsyncThunk(
  'remittance/fetchIncomeSources',
  async (_, { rejectWithValue }) => {
    try {
      const headers = await getAuthHeaders();
      const response = await api.get('/fetch-income', headers);
      
      if (!response.data.success) {
        throw new Error('Failed to fetch income sources');
      }
      
      return response.data.data.map(source => ({
        value: source.name.toLowerCase().replace(/\s+/g, '_'),
        label: source.name,
        originalName: source.name,
      }));
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load income sources'
      );
    }
  }
);

/**
 * Fetch occupations
 */
export const fetchOccupations = createAsyncThunk(
  'remittance/fetchOccupations',
  async (_, { rejectWithValue }) => {
    try {
      const headers = await getAuthHeaders();
      const response = await api.get('/fetch-occupation', headers);
      
      if (!response.data.success) {
        throw new Error('Failed to fetch occupations');
      }
      
      return response.data.data.map(occupation => ({
        value: occupation.name,
        label: occupation.name,
      }));
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load occupations'
      );
    }
  }
);

/**
 * Fetch transfer purposes
 */
export const fetchTransferPurposes = createAsyncThunk(
  'remittance/fetchTransferPurposes',
  async (_, { rejectWithValue }) => {
    try {
      const headers = await getAuthHeaders();
      const response = await api.get('/transactions/get-purposes', headers);
      
      return (response.data || []).map(purpose => ({
        value: purpose.value,
        label: purpose.label,
        description: purpose.description || '',
      }));
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load transfer purposes'
      );
    }
  }
);

// ===================== TRANSACTION SUBMISSION =====================

/**
 * Submit manual deposit transaction
 */
export const submitManualDepositTransaction = createAsyncThunk(
  'remittance/submitManualDeposit',
  async (formData, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const {
        sendAmount,
        receiveAmount,
      } = state.remittance?.form || {};
      const { sendCurrency, receiveCurrency, exchangeRateData } = state.remittance?.currencies || {};
      const customerId = state.auth?.customerId;
      
      // Prepare payload
      const payload = {
        ...formData,
        send_amount: parseFloat(sendAmount),
        receive_amount: parseFloat(receiveAmount),
        from_currency: sendCurrency?.value,
        to_currency: receiveCurrency?.value,
        exchange_rate: parseFloat(state.remittance?.form?.exchangeRate),
        fee: parseFloat(exchangeRateData?.fee),
        payment_method: 'manual',
      };
      
      // Conditionally add customerId if currency is USD
      if (sendCurrency?.value === 'USD') {
        payload.customerId = customerId;
      }
      
      // Prepare FormData
      const formDataToSend = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (key === 'document' && value) {
          formDataToSend.append('document', value);
        } else if (key === 'file' && value) {
          formDataToSend.append('file', value);
        } else if (value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });
      
      const headers = await getFormDataHeaders();
      const response = await api.post(
        '/sila/manual-sila-bankdetails',
        formDataToSend,
        headers
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to submit manual deposit'
      );
    }
  }
);

/**
 * Submit bank transfer transaction
 */
export const submitBankTransferTransaction = createAsyncThunk(
  'remittance/submitBankTransfer',
  async (transactionData, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const {
        sendAmount,
        receiveAmount,
        conversionId,
      } = state.remittance?.form || {};
      const { sendCurrency, receiveCurrency } = state.remittance?.currencies || {};
      const { paymentMethodRef } = state.remittance?.payment || {};
      const customerId = state.auth?.customerId;
      
      const isEuropeToKenya = 
        ['GBP', 'EUR'].includes(sendCurrency?.value) && receiveCurrency?.value === 'KES';
      
      const endpoint = isEuropeToKenya
        ? '/payout/remit-payout'
        : '/transactions/remittance-transaction';
      
      // Prepare base payload
      const payload = {
        customer_id: customerId,
        send_amount: parseFloat(sendAmount),
        receive_amount: parseFloat(receiveAmount),
        from_currency: sendCurrency?.value,
        to_currency: receiveCurrency?.value,
        exchange_rate: parseFloat(state.remittance?.form?.exchangeRate),
        payment_method: paymentMethodRef?.value,
        conversion_id: conversionId,
        beneficiary: transactionData.beneficiary?.id || transactionData.beneficiary_id,
        beneficiary_bank_id: transactionData.beneficiaryBank?.id || transactionData.beneficiary_bank_id,
        beneficiary_name: transactionData.beneficiary?.name || transactionData.beneficiary_name,
        beneficiary_bank_name: transactionData.beneficiaryBank?.name || transactionData.beneficiary_bank_name,
        beneficiary_account_number: transactionData.beneficiary_account_number || transactionData.beneficiaryBank?.bank_acc_no,
        is_remit: 'Y',
      };
      
      // Add Europe/UK specific data
      if (isEuropeToKenya) {
        Object.assign(payload, {
          convertedValue: parseFloat(sendAmount),
          currency: sendCurrency?.value,
          benef_account: transactionData.beneficiary_account_number || transactionData.beneficiaryBank?.bank_acc_no,
          benef_bank_account: transactionData.beneficiaryBank?.id || transactionData.beneficiary_bank_id,
          bank_id: sendCurrency?.bank_id,
          description: 'EUR/GBP to KES Remittance',
          income_source: transactionData.income_source?.value || transactionData.income_source,
          transfer_purpose: transactionData.purpose?.value || transactionData.purpose,
          ...state.remittance?.form?.paymentInitiationData,
        });
      }
      
      // Add bank transfer specific fields
      if (paymentMethodRef?.value === 'bank') {
        Object.assign(payload, {
          rails: transactionData.rails || transactionData.beneficiaryBank?.rails || 'Local',
          purpose: transactionData.purpose?.value || transactionData.purpose,
          income_source: transactionData.income_source?.value || transactionData.income_source,
          occupation: transactionData.occupation,
          relation: transactionData.relation,
          payout_method: transactionData.payout_method?.value || transactionData.payout_method,
          file: transactionData.document || transactionData.file,
          sender_account_name: transactionData.sender_account_name || transactionData.senderBank?.account_name,
          sender_bank_id: transactionData.bank_id || transactionData.senderBank?.id,
        });
      }
      
      // Prepare FormData
      const formDataToSend = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (value instanceof File) {
            formDataToSend.append(key, value, value.name);
          } else if (typeof value === 'object' && value !== null) {
            formDataToSend.append(key, JSON.stringify(value));
          } else {
            formDataToSend.append(key, value);
          }
        }
      });
      
      const headers = await getFormDataHeaders();
      const response = await api.post(endpoint, formDataToSend, headers);
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to submit bank transfer'
      );
    }
  }
);

/**
 * Submit card deposit transaction
 */
export const submitCardDepositTransaction = createAsyncThunk(
  'remittance/submitCardDeposit',
  async (transactionData, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const customerId = state.auth?.customerId;
      
      // For card deposits, we navigate to a different page with state
      // This thunk just validates and prepares the data
      const validationErrors = {};
      
      if (!transactionData.beneficiary && !transactionData.beneficiary_id) {
        validationErrors.beneficiary = ['Please select a beneficiary'];
      }
      
      if (!transactionData.beneficiaryBank && !transactionData.beneficiary_bank_id) {
        validationErrors.beneficiaryBank = ['Please select a beneficiary bank'];
      }
      
      if (Object.keys(validationErrors).length > 0) {
        throw new Error(JSON.stringify(validationErrors));
      }
      
      return {
        type: 'card_deposit_redirect',
        data: transactionData,
        customerId,
      };
    } catch (error) {
      return rejectWithValue(
        error.message || 'Failed to validate card deposit data'
      );
    }
  }
);

/**
 * Confirm and finalize transaction
 */
export const confirmTransaction = createAsyncThunk(
  'remittance/confirmTransaction',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const {
        sendAmount,
        receiveAmount,
        agreeToTerms,
      } = state.remittance?.form || {};
      const { sendCurrency, receiveCurrency } = state.remittance?.currencies || {};
      const { paymentMethodRef } = state.remittance?.payment || {};
      const { manualDepositFormData, bankTransferFormData } = state.remittance?.payment || {};
      
      // Validate required fields
      if (!agreeToTerms) {
        throw new Error('You must agree to the terms and conditions');
      }
      
      if (!sendAmount || !receiveAmount || !sendCurrency || !receiveCurrency) {
        throw new Error('Please complete all required fields');
      }
      
      // Choose the appropriate submission based on payment method
      switch (paymentMethodRef?.value) {
        case 'manual':
          if (!manualDepositFormData) {
            throw new Error('Please complete manual deposit details');
          }
          return await submitManualDepositTransaction(manualDepositFormData);
          
        case 'bank':
          if (!bankTransferFormData) {
            throw new Error('Please complete bank transfer details');
          }
          return await submitBankTransferTransaction(bankTransferFormData);
          
        case 'card':
          // Card deposits are handled differently (redirect)
          return {
            type: 'redirect',
            message: 'Redirecting to card payment page',
          };
          
        default:
          throw new Error('Invalid payment method');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Transaction confirmation failed'
      );
    }
  }
);

// ===================== PASSCODE & VERIFICATION =====================

/**
 * Send passcode for verification
 */
export const sendPasscode = createAsyncThunk(
  'remittance/sendPasscode',
  async (customerId, { rejectWithValue }) => {
    try {
      const headers = await getAuthHeaders();
      const response = await api.get(`/send-passcode/${customerId}`, headers);
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send passcode'
      );
    }
  }
);

/**
 * Verify passcode
 */
export const verifyPasscode = createAsyncThunk(
  'remittance/verifyPasscode',
  async ({ customerId, passcode }, { rejectWithValue }) => {
    try {
      const headers = await getAuthHeaders();
      const response = await api.post(
        '/verify-passcode',
        {
          customer_id: customerId,
          passcode: passcode,
        },
        headers
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Passcode verification failed'
      );
    }
  }
);

/**
 * Validate promocode
 */
export const validatePromocode = createAsyncThunk(
  'remittance/validatePromocode',
  async ({ customerId, promocode, transactionAmount }, { rejectWithValue }) => {
    try {
      const headers = await getAuthHeaders();
      const response = await api.get(
        `/validate-promocode/${customerId}/${promocode}/${transactionAmount}`,
        headers
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Promocode validation failed'
      );
    }
  }
);

// ===================== RECEIPT GENERATION =====================

/**
 * Generate receipt for transaction
 */
export const generateReceipt = createAsyncThunk(
  'remittance/generateReceipt',
  async (transactionId, { rejectWithValue }) => {
    try {
      const headers = await getAuthHeaders();
      const response = await api.get(`/generate-receipt/${transactionId}`, headers);
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to generate receipt'
      );
    }
  }
);

// ===================== UTILITY THUNKS =====================

/**
 * Calculate amounts based on exchange rate
 */
export const calculateAmounts = createAsyncThunk(
  'remittance/calculateAmounts',
  async ({ amount, direction }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const { exchangeRateData } = state.remittance?.currencies || {};
      
      if (!exchangeRateData?.rate || exchangeRateData?.loading) {
        throw new Error('Exchange rate not available');
      }
      
      const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
      if (parsedAmount <= 0) {
        throw new Error('Amount must be greater than zero');
      }
      
      let sendAmount, receiveAmount;
      
      if (direction === 'send') {
        sendAmount = parsedAmount;
        receiveAmount = (parsedAmount * exchangeRateData.rate).toFixed(2);
      } else {
        receiveAmount = parsedAmount;
        sendAmount = (parsedAmount / exchangeRateData.rate).toFixed(2);
      }
      
      return {
        sendAmount,
        receiveAmount,
        direction,
        calculatedAt: Date.now(),
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Amount calculation failed');
    }
  }
);

/**
 * Clear remittance cache
 */
export const clearRemittanceCache = createAsyncThunk(
  'remittance/clearCache',
  async (_, { dispatch }) => {
    // Clear all caches
    dispatch({ type: 'remittanceForm/clearExchangeRateCache' });
    dispatch({ type: 'remittancePartners/clearPartnersByCurrency' });
    
    return { clearedAt: Date.now() };
  }
);