import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchPaymentMethodsByCurrency,
  selectPaymentMethods,
  selectPaymentMethodsLoading,
  selectPaymentMethodsError 
} from "../slices/currencySlice";

export const usePaymentMethods = (selectedCurrency, currencies) => {
  const dispatch = useDispatch();
  
  const paymentMethods = useSelector(selectPaymentMethods);
  const loading = useSelector(selectPaymentMethodsLoading);
  const error = useSelector(selectPaymentMethodsError);

  useEffect(() => {
    if (selectedCurrency && currencies && Array.isArray(currencies) && currencies.length > 0) {
      
      
      const selectedCurrencyObj = currencies.find(
        currency => currency.currency_code === selectedCurrency
      );
      
      
      
      let currencyIdentifier = null;
      
      // ✅ PRIORITY ORDER: currencyid > currency_id > account_id > currency_code
      if (selectedCurrencyObj?.currencyid) {
        currencyIdentifier = selectedCurrencyObj.currencyid;
        
      } else if (selectedCurrencyObj?.currency_id) {
        currencyIdentifier = selectedCurrencyObj.currency_id;
        
      } else if (selectedCurrencyObj?.account_id) {
        currencyIdentifier = selectedCurrencyObj.account_id;
        
      } else {
        currencyIdentifier = selectedCurrency;
        
      }
      
      if (currencyIdentifier) {
        
        
        // ✅ ADD: Get token before dispatching to ensure it's available
        const token = localStorage.getItem("bearertoken") || localStorage.getItem("authtoken");
        ,
          hasAuthToken: !!localStorage.getItem("authtoken"),
          tokenPresent: !!token
        });
        
        dispatch(fetchPaymentMethodsByCurrency(currencyIdentifier));
      } else {
        
      }
    } else {
      // Clear payment methods when no currency is selected
      if (paymentMethods.length > 0) {
        
      }
    }
  }, [selectedCurrency, currencies, dispatch, paymentMethods.length]);

  return {
    methods: paymentMethods,
    loading: loading,
    error: error
  };
};