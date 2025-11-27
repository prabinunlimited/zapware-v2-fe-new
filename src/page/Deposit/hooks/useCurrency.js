import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectAccounts, selectAccountLoading, selectAccountError } from '../../../components/Dashboard/Account/AccountSummary/AccountSlice'; 

export const useCurrency = (initialCurrency) => {
  // Get accounts and loading state from Redux (same data used in AccountSummary)
  const accounts = useSelector(selectAccounts);
  const accountLoading = useSelector(selectAccountLoading);
  const accountError = useSelector(selectAccountError);
  
  
  
  

  // Transform accounts to currencies format
  const currencies = useMemo(() => {
    if (accountLoading) {
      
      return [];
    }
    
    if (accountError) {
      
      return [];
    }
    
    const safeAccounts = Array.isArray(accounts) ? accounts : [];
    
    
    
    const transformed = safeAccounts.map((account, index) => {
      const currencyObj = {
        // Required fields for currency selection
        currency_code: account.currency,
        currency: account.currency,
        available_balance: account.available_balance || '0.00',
        account_name: account.account_name || `Account ${index + 1}`,
        account_number: account.account_number || 'N/A',
        iban: account.iban || 'N/A',
        flag_url: account.flag_url,
        account_id: account.account_id,
        
        // Include all original account properties for compatibility
        ...account
      };
      
      
      
      return currencyObj;
    });
    
    
    .join(', '));
    
    return transformed;
  }, [accounts, accountLoading, accountError]);

  // Handle initial currency selection
  useEffect(() => {
    
    });
    
    if (initialCurrency && currencies.length > 0) {
      const exists = currencies.some(currency => currency.currency_code === initialCurrency);
      
      
      if (exists) {
        
      } else {
        
      }
    } else if (currencies.length > 0) {
      
    } else {
      
    }
  }, [initialCurrency, currencies]);

  // Return the currency state
  const currencyState = useMemo(() => {
    const state = {
      currencies,
      loading: accountLoading,
      error: accountError
    };
    
    
    
    return state;
  }, [currencies, accountLoading, accountError]);

  return currencyState;
};