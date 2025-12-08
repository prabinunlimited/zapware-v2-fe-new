import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { 
  selectTransactions, 
  selectTransactionLoading, 
  selectTransactionError, 
  selectHasFetchedTransactions,
  fetchTransactionDetails,
  forceRefreshTransactions,
  transactionUtils
} from '../components/Dashboard/Account/Transaction/TransactionSlice';

export const useTransactionData = () => {
  const dispatch = useDispatch();
  const transactions = useSelector(selectTransactions);
  const loading = useSelector(selectTransactionLoading);
  const error = useSelector(selectTransactionError);
  const hasFetched = useSelector(selectHasFetchedTransactions);

  const fetchTransactions = useCallback((customerId, currencyCode, forceRefresh = false) => {
    if (!customerId || !currencyCode) return;

    console.log("🔄 HOOK: Fetching transactions for", currencyCode);

    // ✅ ALWAYS FETCH - NO BLOCKING LOGIC
    if (forceRefresh) {
      dispatch(forceRefreshTransactions());
      dispatch(fetchTransactionDetails({ customerId, currencyCode }));
    } else {
      dispatch(fetchTransactionDetails({ customerId, currencyCode }));
    }
  }, [dispatch]);

  const forceRefresh = useCallback((customerId, currencyCode) => {
    fetchTransactions(customerId, currencyCode, true);
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    hasFetched,
    fetchTransactions,
    forceRefresh,
    hasSuccessfulData: () => false // Always allow fetching
  };
};