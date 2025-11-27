import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectAccounts, selectAccountLoading, selectAccountError } from '../../../components/Dashboard/Account/AccountSummary/AccountSlice'; 

export const useCurrency = (initialCurrency) => {
  // Get accounts and loading state from Redux (same data used in AccountSummary)
  const accounts = useSelector(selectAccounts);
  const accountLoading = useSelector(selectAccountLoading);
  const accountError = useSelector(selectAccountError);
  
  console.log("🔍 useCurrency - Raw accounts from Redux:", accounts);
  console.log("⏳ useCurrency - Loading state:", accountLoading);
  console.log("❌ useCurrency - Error state:", accountError);

  // Transform accounts to currencies format
  const currencies = useMemo(() => {
    if (accountLoading) {
      console.log("⏳ useCurrency - Still loading accounts, returning empty array");
      return [];
    }
    
    if (accountError) {
      console.log("❌ useCurrency - Account error, returning empty array");
      return [];
    }
    
    const safeAccounts = Array.isArray(accounts) ? accounts : [];
    
    console.log("🔄 useCurrency - Transforming accounts to currencies. Account count:", safeAccounts.length);
    
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
      
      console.log(`   Currency ${index + 1}:`, {
        currency_code: currencyObj.currency_code,
        currency: currencyObj.currency,
        balance: currencyObj.available_balance,
        account_name: currencyObj.account_name
      });
      
      return currencyObj;
    });
    
    console.log("✅ useCurrency - Successfully transformed currencies:", transformed.length);
    console.log("📋 Available currencies:", transformed.map(c => c.currency_code).join(', '));
    
    return transformed;
  }, [accounts, accountLoading, accountError]);

  // Handle initial currency selection
  useEffect(() => {
    console.log("🎯 useCurrency - Initial currency effect:", { 
      initialCurrency, 
      currenciesCount: currencies.length,
      currencies: currencies.map(c => c.currency_code)
    });
    
    if (initialCurrency && currencies.length > 0) {
      const exists = currencies.some(currency => currency.currency_code === initialCurrency);
      console.log("🔍 useCurrency - Initial currency exists:", exists, initialCurrency);
      
      if (exists) {
        console.log("✅ useCurrency - Initial currency is available:", initialCurrency);
      } else {
        console.log("⚠️ useCurrency - Initial currency not found in available currencies:", initialCurrency);
      }
    } else if (currencies.length > 0) {
      console.log("ℹ️ useCurrency - No initial currency provided, but", currencies.length, "currencies available");
    } else {
      console.log("📭 useCurrency - No currencies available for initial selection");
    }
  }, [initialCurrency, currencies]);

  // Return the currency state
  const currencyState = useMemo(() => {
    const state = {
      currencies,
      loading: accountLoading,
      error: accountError
    };
    
    console.log("📦 useCurrency - Returning state:", {
      currenciesCount: state.currencies.length,
      loading: state.loading,
      error: state.error
    });
    
    return state;
  }, [currencies, accountLoading, accountError]);

  return currencyState;
};