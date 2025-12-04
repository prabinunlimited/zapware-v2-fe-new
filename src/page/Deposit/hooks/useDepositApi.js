import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { fetchManualAccountDetails } from "../slices/bankAccountSlice"; // ✅ Import the Redux thunk
import depositAPI from "../api/depositAPI";

export const useDepositApi = () => {
  const dispatch = useDispatch(); // ✅ Add dispatch

  const fetchManualDepositDetails = useCallback(async (currency) => {
    
    
    try {
      // ✅ Dispatch the Redux thunk instead of making direct API calls
      const result = await dispatch(fetchManualAccountDetails(currency));
      
      if (result.error) {
        throw new Error(result.error.message || `Failed to load ${currency} account details`);
      }
      
      
      return result.payload; // Return the actual account data from Redux
    } catch (error) {
      
      throw error;
    }
  }, [dispatch]); // ✅ Add dispatch to dependencies

  const fetchUSDAccounts = useCallback(async () => {
    
    
    try {
      const response = await depositAPI.getUSDAccounts();
      
      if (!response || !response.data) {
        throw new Error('No USD accounts found');
      }
      
      
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const fetchAEDDetails = useCallback(async () => {
    
    
    try {
      const response = await depositAPI.getAEDDetails();
      
      if (!response || !response.data) {
        throw new Error('No AED details found');
      }
      
      
      return response.data;
    } catch (error) {
      
      throw error;
    }
  }, []);

  return {
    fetchManualDepositDetails,
    fetchUSDAccounts,
    fetchAEDDetails,
  };
};