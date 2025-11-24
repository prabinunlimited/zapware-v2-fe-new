import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { fetchManualAccountDetails } from "../slices/bankAccountSlice"; // ✅ Import the Redux thunk
import depositAPI from "../api/depositAPI";

export const useDepositApi = () => {
  const dispatch = useDispatch(); // ✅ Add dispatch

  const fetchManualDepositDetails = useCallback(async (currency) => {
    console.log(`🌐 API: Dispatching manual deposit details for ${currency} to Redux`);
    
    try {
      // ✅ Dispatch the Redux thunk instead of making direct API calls
      const result = await dispatch(fetchManualAccountDetails(currency));
      
      if (result.error) {
        throw new Error(result.error.message || `Failed to load ${currency} account details`);
      }
      
      console.log(`✅ API: Successfully dispatched manual details for ${currency} to Redux`);
      return result.payload; // Return the actual account data from Redux
    } catch (error) {
      console.error(`❌ API: Error dispatching manual details:`, error);
      throw error;
    }
  }, [dispatch]); // ✅ Add dispatch to dependencies

  const fetchUSDAccounts = useCallback(async () => {
    console.log("🌐 API: Fetching USD accounts");
    
    try {
      const response = await depositAPI.getUSDAccounts();
      
      if (!response || !response.data) {
        throw new Error('No USD accounts found');
      }
      
      console.log("✅ API: Successfully fetched USD accounts:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ API: Error fetching USD accounts:", error);
      throw error;
    }
  }, []);

  const fetchAEDDetails = useCallback(async () => {
    console.log("🌐 API: Fetching AED details");
    
    try {
      const response = await depositAPI.getAEDDetails();
      
      if (!response || !response.data) {
        throw new Error('No AED details found');
      }
      
      console.log("✅ API: Successfully fetched AED details:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ API: Error fetching AED details:", error);
      throw error;
    }
  }, []);

  return {
    fetchManualDepositDetails,
    fetchUSDAccounts,
    fetchAEDDetails,
  };
};