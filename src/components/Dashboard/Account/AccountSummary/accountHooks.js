// src/components/Dashboard/Account/AccountSummary/accountHooks.js - FIXED VERSION USING HOMESLICE
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAccountDetails,
  updateAccountBalance,
  setSelectedAccount,
  setSelectedCurrency,
  selectAccounts,
  selectSelectedAccount,
  selectSelectedCurrency,
  selectAccountLoading,
  selectBalanceLoading,
  selectAccountError,
  selectHasFetchedAccount,
  selectLastUpdated,
  clearAllCache,
} from "../../../../page/Home/HomeSlice";
import { selectAuthToken } from "../../../../store/selectors";

// ✅ FIXED: Use HomeSlice instead of AccountSlice
export const useAccountData = () => {
  const dispatch = useDispatch();
  const customerId = localStorage.getItem("authcustomer_id");
  const authtoken = useSelector(selectAuthToken);
  const hasFetchedAccount = useSelector(selectHasFetchedAccount);
  const accountLoading = useSelector(selectAccountLoading);
  const accounts = useSelector(selectAccounts);
  const accountError = useSelector(selectAccountError);
  const lastUpdated = useSelector(selectLastUpdated);

  const fetchAccountData = useCallback(
    (forceRefresh = false) => {
      if (!customerId || !authtoken) {
        console.log("⏳ useAccountData: Missing auth data, skipping fetch");
        return;
      }

      console.log(
        `🚀 useAccountData: Fetching account details (forceRefresh: ${forceRefresh})`,
      );
      dispatch(
        fetchAccountDetails({ customerId, authtoken, isRefresh: forceRefresh }),
      );
    },
    [customerId, authtoken, dispatch],
  );

  return {
    fetchAccountData,
    shouldFetch:
      !hasFetchedAccount && customerId && authtoken && !accountLoading,
    canFetch: Boolean(customerId && authtoken),
    isLoading: accountLoading,
    error: accountError,
    accounts: accounts,
    hasAccounts: accounts.length > 0,
    lastUpdated: lastUpdated,
    resetFetch: () => dispatch(clearAllCache()),
    forceRefresh: () => {
      dispatch(clearAllCache());
      fetchAccountData(true);
    },
  };
};

export const useAccountSelection = () => {
  const dispatch = useDispatch();
  const selectedAccount = useSelector(selectSelectedAccount);
  const selectedCurrency = useSelector(selectSelectedCurrency);
  const accounts = useSelector(selectAccounts);

  const setAccount = useCallback(
    (account) => {
      dispatch(setSelectedAccount(account));
    },
    [dispatch],
  );

  const setCurrency = useCallback(
    (currency) => {
      dispatch(setSelectedCurrency(currency));
    },
    [dispatch],
  );

  const getAccountByCurrency = useCallback(
    (currency) => {
      return accounts.find((acc) => acc.currency === currency) || null;
    },
    [accounts],
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
  const selectedAccount = useSelector(selectSelectedAccount);
  const balanceLoading = useSelector(selectBalanceLoading);

  const updateBalance = useCallback(() => {
    if (customerId && authtoken) {
      console.log("🔄 useAccountBalance: Updating balance");
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
    [selectedAccount],
  );

  return {
    updateBalance,
    formatBalance,
    isLoading: balanceLoading,
    selectedAccountBalance: selectedAccount?.available_balance || 0,
    selectedAccountCurrency: selectedAccount?.currency,
  };
};
