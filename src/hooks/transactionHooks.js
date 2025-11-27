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

    // ✅ Clear successful status if force refresh
    if (forceRefresh) {
      transactionUtils.clearTransactionSuccessCache(customerId, currencyCode);
      dispatch(forceRefreshTransactions({ customerId, currencyCode }));
    }

    // ✅ Skip if already have successful data (unless force refresh)
    if (transactionUtils.hasSuccessfulTransactionFetch(customerId, currencyCode) && !forceRefresh) {
      
      return;
    }

    
    });

    dispatch(fetchTransactionDetails({ customerId, currencyCode }));
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
    hasSuccessfulData: transactionUtils.hasSuccessfulTransactionFetch
  };
};