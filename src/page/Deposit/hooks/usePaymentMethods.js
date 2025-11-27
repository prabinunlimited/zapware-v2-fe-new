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
      console.log("🔄 Fetching payment methods for currency:", selectedCurrency);
      
      const selectedCurrencyObj = currencies.find(
        currency => currency.currency_code === selectedCurrency
      );
      
      console.log("🔍 Selected currency object for payment methods:", selectedCurrencyObj);
      
      let currencyIdentifier = null;
      
      // ✅ PRIORITY ORDER: currencyid > currency_id > account_id > currency_code
      if (selectedCurrencyObj?.currencyid) {
        currencyIdentifier = selectedCurrencyObj.currencyid;
        console.log("🎯 Using currencyid as identifier:", currencyIdentifier);
      } else if (selectedCurrencyObj?.currency_id) {
        currencyIdentifier = selectedCurrencyObj.currency_id;
        console.log("🎯 Using currency_id as identifier:", currencyIdentifier);
      } else if (selectedCurrencyObj?.account_id) {
        currencyIdentifier = selectedCurrencyObj.account_id;
        console.log("🎯 Using account_id as identifier:", currencyIdentifier);
      } else {
        currencyIdentifier = selectedCurrency;
        console.log("🔄 Falling back to currency code as identifier:", currencyIdentifier);
      }
      
      if (currencyIdentifier) {
        console.log("🚀 Dispatching payment methods fetch with identifier:", currencyIdentifier);
        
        // ✅ ADD: Get token before dispatching to ensure it's available
        const token = localStorage.getItem("bearertoken") || localStorage.getItem("authtoken");
        console.log("🔐 Token check before dispatch:", {
          hasBearerToken: !!localStorage.getItem("bearertoken"),
          hasAuthToken: !!localStorage.getItem("authtoken"),
          tokenPresent: !!token
        });
        
        dispatch(fetchPaymentMethodsByCurrency(currencyIdentifier));
      } else {
        console.warn("❌ No valid currency identifier found for:", selectedCurrency);
      }
    } else {
      // Clear payment methods when no currency is selected
      if (paymentMethods.length > 0) {
        console.log("🔄 Clearing payment methods - no currency selected");
      }
    }
  }, [selectedCurrency, currencies, dispatch, paymentMethods.length]);

  return {
    methods: paymentMethods,
    loading: loading,
    error: error
  };
};