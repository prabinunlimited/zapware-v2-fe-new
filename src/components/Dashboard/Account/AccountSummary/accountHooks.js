import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAccountDetails,
  updateAccountBalance,
  setSelectedAccount,
  setSelectedCurrency,
} from "./AccountSlice";
import { selectAuthToken } from "../../../../store/selectors";

// Custom hooks that were in AccountSlice.js
export const useAccountData = () => {
  const dispatch = useDispatch();
  const customerId = localStorage.getItem("authcustomer_id");
  const authtoken = useSelector(selectAuthToken);
  const hasFetchedAccount = useSelector(
    (state) => state.account?.hasFetchedAccount || false
  );
  const accountLoading = useSelector(
    (state) => state.account?.accountLoading || false
  );
  const accounts = useSelector((state) => state.account?.accounts || []);

  const fetchAccountData = useCallback(
    (forceRefresh = false) => {
      if (!customerId || !authtoken) {
        return;
      }

      dispatch(
        fetchAccountDetails({
          customerId,
          authtoken,
          isRefresh: forceRefresh,
        })
      );
    },
    [customerId, authtoken, dispatch, accountLoading, hasFetchedAccount]
  );

  const stableFetchAccountData = useMemo(
    () => fetchAccountData,
    [fetchAccountData]
  );

  return {
    fetchAccountData: stableFetchAccountData,
    shouldFetch:
      !hasFetchedAccount && customerId && authtoken && !accountLoading,
    canFetch: Boolean(customerId && authtoken),
    isLoading: accountLoading,
    error: useSelector((state) => state.account?.accountError || null),
    accounts: accounts,
    hasAccounts: accounts.length > 0,
    lastUpdated: useSelector((state) => state.account?.lastUpdated || null),
    resetFetch: () => dispatch(resetFetchCoordination()),
    forceRefresh: () => {
      dispatch(forceRefreshAccounts(customerId));
      fetchAccountData(true);
    },
  };
};

export const useAccountSelection = () => {
  const dispatch = useDispatch();
  const selectedAccount = useSelector(
    (state) => state.account?.selectedAccount || null
  );
  const selectedCurrency = useSelector(
    (state) => state.account?.selectedCurrency || "all"
  );
  const accounts = useSelector((state) => state.account?.accounts || []);

  const setAccount = useCallback(
    (account) => {
      dispatch(setSelectedAccount(account));
    },
    [dispatch]
  );

  const setCurrency = useCallback(
    (currency) => {
      dispatch(setSelectedCurrency(currency));
    },
    [dispatch]
  );

  const getAccountByCurrency = useCallback(
    (currency) => {
      return accounts.find((acc) => acc.currency === currency) || null;
    },
    [accounts]
  );

  const getAvailableCurrencies = useCallback(() => {
    return [...new Set(accounts.map((acc) => acc.currency))].filter(Boolean);
  }, [accounts]);

  return {
    selectedAccount,
    selectedCurrency,
    setAccount,
    setCurrency,
    getAccountByCurrency,
    getAvailableCurrencies,
    hasAccounts: accounts.length > 0,
  };
};

export const useAccountBalance = () => {
  const dispatch = useDispatch();
  const customerId = localStorage.getItem("authcustomer_id");
  const authtoken = useSelector(selectAuthToken);
  const selectedAccount = useSelector(
    (state) => state.account?.selectedAccount || null
  );
  const balanceLoading = useSelector(
    (state) => state.account?.balanceLoading || false
  );

  const updateBalance = useCallback(() => {
    if (customerId && authtoken) {
      dispatch(updateAccountBalance({ customerId, authtoken }));
    }
  }, [customerId, authtoken, dispatch]);

  const formatBalance = useCallback(
    (amount, currency = selectedAccount?.currency) => {
      const numericAmount = parseFloat(amount) || 0;
      const currencySymbols = {
        USD: "$",
        EUR: "€",
        GBP: "£",
        DKK: "kr",
        NOK: "kr",
        SEK: "kr",
        CHF: "CHF",
      };

      const symbol = currencySymbols[currency] || "";

      if (numericAmount >= 1000000) {
        const millions = (numericAmount / 1000000).toFixed(2);
        return `${symbol}${millions}M`;
      } else if (numericAmount >= 10000) {
        const formatted = new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(numericAmount);
        return `${symbol}${formatted}`;
      } else {
        const formatted = new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numericAmount);
        return `${symbol}${formatted}`;
      }
    },
    [selectedAccount]
  );

  return {
    updateBalance,
    formatBalance,
    isLoading: balanceLoading,
    selectedAccountBalance: selectedAccount?.available_balance || 0,
    selectedAccountCurrency: selectedAccount?.currency,
  };
};
